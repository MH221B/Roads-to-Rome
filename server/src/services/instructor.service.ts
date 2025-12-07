import Course from '../models/course.model';
import { Quiz, QuizSubmission } from '../models/quiz.model';

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

interface IInstructorService {
  fetchInsightsByInstructorId(instructorId: string): Promise<{
    overview: IOverview;
    insights: {
      CourseInsights: ICourseInsight[];
      QuizInsights: IQuizInsight[];
    };
  }>;
}

const instructorService: IInstructorService = {
  async fetchInsightsByInstructorId(instructorId: string) {
    const courses = await Course.find({ instructor: instructorId });
    const quizzes = await Quiz.find({ courseId: { $in: courses.map((c) => c._id) } });
    const quizSubmissions = await QuizSubmission.find({
      quizId: { $in: quizzes.map((q) => q._id) },
    });
    const averageScoreMap: Record<string, { totalScore: number; count: number }> = {}; // average score of all attempts per quiz (raw correct answers)
    let totalLatestScoreSum = 0; // sum of all latest scores across submissions
    let totalPossiblePointsAcrossSubmissions = 0; // sum of corresponding quiz question counts per submission
    for (const submission of quizSubmissions) {
      if (!averageScoreMap[submission.quizId.toString()]) {
        averageScoreMap[submission.quizId.toString()] = { totalScore: 0, count: 0 };
      }
      averageScoreMap[submission.quizId.toString()].totalScore += submission.latestScore;
      averageScoreMap[submission.quizId.toString()].count += 1;
      // Also accumulate totals for an aggregated overview average percent
      const quiz = quizzes.find((q) => q._id.toString() === submission.quizId.toString());
      if (quiz) {
        totalLatestScoreSum += submission.latestScore;
        totalPossiblePointsAcrossSubmissions += quiz.questions?.length ?? 0;
      }
    }
    // Mocked data for insights
    const courseInsights: ICourseInsight[] = courses.map((course) => ({
      courseId: course._id.toString(),
      courseTitle: course.title,
      enrollments: Math.floor(Math.random() * 1000), // Randomized for example
    }));
    const quizInsights: IQuizInsight[] = quizzes.map((quiz) => ({
      quizId: quiz._id.toString(),
      quizTitle: quiz.title,
      totalQuestions: quiz.questions.length,
      averageScore: averageScoreMap[quiz._id.toString()]
        ? parseFloat(
            (
              averageScoreMap[quiz._id.toString()].totalScore /
              averageScoreMap[quiz._id.toString()].count
            ).toFixed(2)
          )
        : 0,
    }));
    const overview: IOverview = {
      totalCourses: courses.length,
      totalStudents: Math.floor(Math.random() * 5000), // Randomized for example
      totalQuizzes: quizzes.length,
      averageScore:
        totalPossiblePointsAcrossSubmissions > 0
          ? parseFloat(
              ((totalLatestScoreSum / totalPossiblePointsAcrossSubmissions) * 100).toFixed(2)
            )
          : 0,
    };
    return { overview, insights: { CourseInsights: courseInsights, QuizInsights: quizInsights } };
  },
};

export default instructorService;
