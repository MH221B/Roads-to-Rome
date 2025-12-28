import quizModel, { IQuiz } from '../models/quiz.model';
import mongoose from 'mongoose';
import lessonModel from '../models/lesson.model';
import Course from '../models/course.model';
import enrollmentService from './enrollment.service';

interface IQuizService {
  GetQuizById(quizId: string): Promise<unknown>;
  submitQuiz(
    quizId: string,
    answers: Array<{ questionId: string; answer: string }>
  ): Promise<number>;
  checkUserAccessToQuiz(userId: string, quizId: string): Promise<boolean>;
  getAllQuizzes(): Promise<IQuiz[]>;
  getQuizzesByInstructor(instructorId: string): Promise<IQuiz[]>;
  createQuiz(quizData: Partial<IQuiz>): Promise<IQuiz>;
  updateQuiz(id: string, quizData: Partial<IQuiz>): Promise<IQuiz | null>;
  deleteQuiz(id: string): Promise<IQuiz | null>;
}

const quizService: IQuizService = {
  GetQuizById: async (quizId: string): Promise<unknown> => {
    const quiz = await quizModel.findOne({ id: quizId }).exec();
    if (!quiz) {
      throw new Error('Quiz not found in the specified course');
    }
    return quiz;
  },
  submitQuiz: async (
    quizId: string,
    answers: Array<{ questionId: string; answer: string }>
  ): Promise<number> => {
    const quiz = await quizModel.findOne({ id: quizId }).exec();
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    const totalQuestions = quiz.questions.length;
    let correctAnswers = 0;

    answers.forEach((ans) => {
      const question = quiz.questions.find((q: any) => q.id === ans.questionId);
      if (!question) return;

      const correct = question.correctAnswers; // mảng
      const user = ans.answer;
      if (question && question.correctAnswers.includes(ans.answer)) {
        correctAnswers += 1;
      }
    });
    const score = parseFloat(((correctAnswers / totalQuestions) * 10).toFixed(2));
    return score;
  },
  checkUserAccessToQuiz: async (userId: string, quizId: string): Promise<boolean> => {
    const quiz = await quizModel.findOne({ id: quizId }).select('lesson_id course_id').lean();

    if (!quiz) throw new Error('Quiz not found');

    // If the quiz is attached to a lesson, resolve its course via the lesson.
    // If it's attached to a course directly, use that course_id.
    let courseId: string | undefined;
    if (quiz.lesson_id) {
      const lesson = await lessonModel.findOne({ id: quiz.lesson_id }).select('course_id').lean();
      if (!lesson) throw new Error('Lesson not found');
      courseId = lesson.course_id;
    } else if (quiz.course_id) {
      courseId = quiz.course_id as string;
    }
    if (!courseId) throw new Error('Unable to determine course for quiz');

    const isEnrolled = await enrollmentService.checkUserEnrollmentInCourse(userId, courseId);
    if (!isEnrolled) throw new Error('User is not enrolled in the course');
    return isEnrolled;
  },
  getAllQuizzes: async (): Promise<IQuiz[]> => {
    try {
      return await quizModel.find().exec();
    } catch (error) {
      throw new Error('Error retrieving quizzes, message: ' + (error as Error).message);
    }
  },

  getQuizzesByInstructor: async (instructorId: string): Promise<IQuiz[]> => {
    try {
      // Find courses owned by the instructor
      // Request both `courseId` and `_id` to build robust course identifiers.
      const courses = await Course.find({ instructor: instructorId })
        .select('courseId _id')
        .lean()
        .exec();
      const courseIds = (courses || [])
        .map((course: any) => course.courseId ?? String(course._id ?? ''))
        .filter(Boolean);

      if (courseIds.length === 0) return [];

      // Find lessons that belong to the instructor's courses
      const lessons = await lessonModel
        .find({ course_id: { $in: courseIds } })
        .select('id')
        .lean()
        .exec();
      const lessonIds = (lessons || []).map((l: any) => l.id);

      // Return quizzes for those lessons OR quizzes attached directly to the course via course_id
      const query: any = { $or: [] };
      if (lessonIds.length > 0) query.$or.push({ lesson_id: { $in: lessonIds } });
      if (courseIds.length > 0) query.$or.push({ course_id: { $in: courseIds } });

      if (query.$or.length === 0) return [];
      return await quizModel.find(query).exec();
    } catch (error) {
      throw new Error(
        'Error retrieving quizzes by instructor, message: ' + (error as Error).message
      );
    }
  },

  createQuiz: async (quizData: Partial<IQuiz>): Promise<IQuiz> => {
    try {
      const quiz = new quizModel(quizData);
      return await quiz.save();
    } catch (error) {
      const err = error as Error & { message?: string };
      throw new Error(err.message ?? 'Error saving quiz');
    }
  },
  updateQuiz: async (id: string, quizData: Partial<IQuiz>): Promise<IQuiz | null> => {
    try {
      // Support both Mongo _id and quiz `id` property to update the quiz.
      if (mongoose.Types.ObjectId.isValid(id)) {
        return await quizModel.findByIdAndUpdate(id, quizData, { new: true, runValidators: true });
      }
      // Otherwise, assume `id` is the business id stored under `id` property
      return await quizModel.findOneAndUpdate({ id }, quizData, { new: true, runValidators: true });
    } catch (error) {
      throw new Error('Error updating quiz, message: ' + (error as Error).message);
    }
  },
  deleteQuiz: async (id: string): Promise<IQuiz | null> => {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        return await quizModel.findByIdAndDelete(id);
      }
      return await quizModel.findOneAndDelete({ id });
    } catch (error) {
      throw new Error('Error deleting quiz, message: ' + (error as Error).message);
    }
  },
};

export default quizService;
