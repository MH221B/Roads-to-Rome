import quizModel from '../models/quiz.model';
import lessonModel from '../models/lesson.model';
import enrollmentService from './enrollment.service';

interface IQuizService {
  GetQuizById(quizId: string): Promise<unknown>;
  submitQuiz(quizId: string, answers: Array<{ questionId: string; answer: string }>): Promise<number>;
  checkUserAccessToQuiz(userId: string, quizId: string): Promise<boolean>;
}

const quizService: IQuizService = {
  GetQuizById: async (quizId: string): Promise<unknown> => {
    console.log("Fetching quiz:", quizId);
    const quiz = await quizModel.findOne({ id: quizId }).exec();
    if (!quiz) {
      throw new Error('Quiz not found in the specified course');
    }
    return quiz;
  },
  submitQuiz: async (quizId: string, answers: Array<{ questionId: string; answer: string }>): Promise<number> => {
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
    const quiz = await quizModel
      .findOne({ id: quizId })
      .select("lesson_id")
      .lean();

    if (!quiz) throw new Error("Quiz not found");

    const lesson = await lessonModel
      .findOne({ id: quiz.lesson_id })
      .select("course_id")
      .lean();

    if (!lesson) throw new Error("Lesson not found");

    const isEnrolled = await enrollmentService.checkUserEnrollmentInCourse(userId, lesson.course_id);
    if (!isEnrolled) throw new Error("User is not enrolled in the course");
    return isEnrolled;
  }

};

export default quizService;