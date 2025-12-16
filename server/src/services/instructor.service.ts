import Course, { ICourse } from '../models/course.model';
import quizModel, { IQuiz } from '../models/quiz.model';
import submitQuizModel, { ISubmitQuiz } from '../models/submitQuiz.model';
import Lesson, { ILesson } from '../models/lesson.model';
import Enrollment from '../models/enrollment.model';
import { GoogleGenAI } from '@google/genai';

interface ICourseInsight {
  courseId: string;
  courseTitle: string;
  enrollments: number;
}

interface IQuizInsight {
  quizId: string;
  quizTitle: string;
  totalQuestions: number;
  averageScore: number; // raw average (correct answers average)
}

interface IOverview {
  totalCourses: number;
  totalStudents: number;
  totalQuizzes: number;
  averageScore: number; // percent across all quiz submissions (0-100)
}

interface IAIQuizGenerationResponse {
  title: string;
  description?: string;
  questions: Array<{
      id: string;
      type: string;
      text: string;
      options?: string[];
      slotCount?: number;
      correctAnswers: string[];
      explanation?: string;
  }>;
  order: number; // order of the quiz in the lesson
}

interface IInstructorService {
  fetchInsightsByInstructorId(instructorId: string): Promise<{
    overview: IOverview;
    insights: {
      CourseInsights: ICourseInsight[];
      QuizInsights: IQuizInsight[];
    };
  }>;
  generateAIQuiz(instruction: string): Promise<any>;
}

const instructorService: IInstructorService = {
  async fetchInsightsByInstructorId(instructorId: string) {
    // Include both business `courseId` and Mongo `_id` to support either storage style.
    const courses = (await Course.find({ instructor: instructorId }).select('courseId _id title').lean().exec()) as unknown as ICourse[];
    const courseIds = (courses || []).map((c: ICourse) => (c.courseId as string) || String((c as any)._id)).filter(Boolean);

    // Find lessons that belong to the instructor's courses
    const lessons = (await Lesson.find({ course_id: { $in: courseIds } }).lean().exec()) as unknown as ILesson[];
    const lessonIds = (lessons || []).map((l: ILesson) => l.id);

    // Find quizzes for those lessons or quizzes attached directly to the instructor's courses
    const quizQuery: any = { $or: [] };
    if (lessonIds.length > 0) quizQuery.$or.push({ lesson_id: { $in: lessonIds } });
    if (courseIds.length > 0) quizQuery.$or.push({ course_id: { $in: courseIds } });
    const quizzes = (await (quizQuery.$or.length > 0 ? quizModel.find(quizQuery).lean().exec() : Promise.resolve([]))) as unknown as IQuiz[];
    const quizIds = (quizzes || []).map((q: IQuiz) => q.id);

    // Find submissions for those quizzes
    const quizSubmissions = (await submitQuizModel.find({ quizId: { $in: quizIds } }).lean().exec()) as unknown as ISubmitQuiz[];
    const averageScoreMap: Record<string, { totalScore: number; count: number }> = {}; // average score of all attempts per quiz (raw correct answers)
    let totalScoreSum = 0; // sum of all submission scores (0-10)
    let totalSubmissionCount = 0;
    for (const submission of quizSubmissions) {
      if (!averageScoreMap[submission.quizId.toString()]) {
        averageScoreMap[submission.quizId.toString()] = { totalScore: 0, count: 0 };
      }
      averageScoreMap[submission.quizId.toString()].totalScore += submission.score;
      averageScoreMap[submission.quizId.toString()].count += 1;
      // Also accumulate totals for an aggregated overview average percent
      const quiz = quizzes.find((q) => String(q.id) === String(submission.quizId));
      if (quiz) {
        totalScoreSum += submission.score ?? 0;
        totalSubmissionCount += 1;
      }
    }
    // Compute enrollment counts per course
    const enrollmentsByCourse = await Promise.all(
      courses.map(async (course) => {
        const cid = (course.courseId as string) || String((course as unknown as { _id: unknown })._id);
        const count = await Enrollment.countDocuments({ courseId: cid }).exec();
        return { courseId: cid, courseTitle: course.title, enrollments: count };
      })
    );
    const courseInsights: ICourseInsight[] = enrollmentsByCourse.map((c) => ({
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      enrollments: c.enrollments,
    }));
    const quizInsights: IQuizInsight[] = quizzes.map((quiz) => ({
      quizId: quiz.id ?? String((quiz as unknown as { _id: unknown })._id),
      quizTitle: quiz.title,
      totalQuestions: quiz.questions?.length ?? 0,
      averageScore: averageScoreMap[quiz.id]
        ? parseFloat(((averageScoreMap[quiz.id].totalScore / averageScoreMap[quiz.id].count) * 10).toFixed(2))
        : 0,
    }));
    const overview: IOverview = {
      totalCourses: courses.length,
      // Count unique enrolled students across the instructor's courses
      totalStudents: await Enrollment.distinct('studentId', { courseId: { $in: courseIds } }).then(
        (ids) => (ids || []).length
      ),
      totalQuizzes: quizzes.length,
      averageScore: totalSubmissionCount > 0 ? parseFloat(((totalScoreSum / totalSubmissionCount) * 10).toFixed(2)) : 0,
    };
    return { overview, insights: { CourseInsights: courseInsights, QuizInsights: quizInsights } };
  },

  async generateAIQuiz(instruction: string): Promise<IAIQuizGenerationResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    const gemini = new GoogleGenAI({ apiKey });
    const systemPrompt = `
    You are an expert quiz generator. Create a quiz based on the following instruction and knowledge of the subject provided.
    The quiz should be in JSON format with the following structure and contains 10 questions:
    {
      "title": "Quiz Title",
      "description": "Optional description of the quiz",
      "questions": [
        {
          "id": "unique-question-id",
          "type": "multiple" | "single",
          "text": "Question text",
          "options": ["option1", "option2", ...], // only for multiple-choice
          "slotCount": number, // only for fill-in-the-blank
          "correctAnswers": ["correct answer1", "correct answer2", ...]
          "explanation": "Optional explanation for the answer, keep it concise"
        },
        ...
      ],
      "order": number // order of the quiz in the lesson
    }
    Ensure the JSON is properly formatted.
    The type and structure must be strictly followed, based on this interface:
    interface IAIQuizGenerationResponse {
      title: string;
      description?: string;
      questions: Array<{
          id: string;
          type: string;
          text: string;
          options?: string[];
          slotCount?: number;
          correctAnswers: string[];
          explanation?: string;
      }>;
      order: number;
    }
    Only return the JSON object without any additional text or explanation.
    `

    try {
      const response = await gemini.models.generateContent({
        model: process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash-lite',
        contents: [
        {
          role: "user",
          parts: [
            { text: `Subject/Topic/Context: ${instruction}` },
            { text: "Generate the quiz as per the instructions." }
          ],
        },
      ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1, // Low temperature = strict adherence to structure/facts and consistent results
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseMimeType: "application/json", // FORCES the model to output only JSON
        }
      });
      const messageContent = response.text;
      if (!messageContent) {
        throw new Error('No content received from AI model.');
      }
      const cleaned = messageContent.replace(/\n/g, '').trim(); // Clean up formatting, replacing new lines, trimming spaces
      // Parse the JSON response and include the raw response if parsing fails to aid debugging
      try {
        const quizData: IAIQuizGenerationResponse = JSON.parse(cleaned);
        return quizData;
      } catch (parseErr) {
        throw new Error('Failed to parse AI response JSON: ' + (parseErr instanceof Error ? parseErr.message : String(parseErr)) + `; response_preview: ${cleaned.slice(0, 1000)}`);
      }
    } catch (error) {
      // Preserve the original error message for callers
      throw new Error('Failed to generate AI quiz: ' + (error instanceof Error ? error.message : JSON.stringify(error)));
    }
  }
};

export default instructorService;