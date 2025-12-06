import { Quiz, IQuiz, QuizSubmission, IQuizSubmission } from '../models/quiz.model';

interface IQuizService {
  getAllQuizzes(): Promise<IQuiz[]>;
  getQuizById(id: string): Promise<IQuiz | null>;
  createQuiz(quizData: Partial<IQuiz>): Promise<IQuiz>;
  submitQuiz(
    quizId: string,
    userId: string,
    answers: Array<{ question: string; selectedOption: string }>
  ): Promise<{
    quizResult: {
      answers: Array<{
        question: string;
        correctAnswer: string;
        selectedOption: string | null;
        correct: boolean;
      }>;
      score: number;
      correctCount: number;
      total: number;
      highestScore: number;
      message: string;
    };
    latestSubmission: IQuizSubmission;
  }>;
  updateQuiz(id: string, quizData: Partial<IQuiz>): Promise<IQuiz | null>;
  deleteQuiz(id: string): Promise<IQuiz | null>;
}

const quizService: IQuizService = {
  async getAllQuizzes() {
    try {
      return await Quiz.find();
    } catch (error) {
      throw new Error('Error retrieving quizzes, message: ' + (error as Error).message);
    }
  },
  async getQuizById(id: string) {
    try {
      return await Quiz.findById(id);
    } catch (error) {
      throw new Error('Error retrieving quiz, message: ' + (error as Error).message);
    }
  },
  async createQuiz(quizData: Partial<IQuiz>) {
    try {
      const quiz = new Quiz(quizData);
      return await quiz.save();
    } catch (error) {
      const err = error as Error & { message?: string };
      throw new Error(err.message ?? 'Error saving quiz');
    }
  },

  async submitQuiz(
    quizId: string,
    userId: string,
    answers: Array<{ question: string; selectedOption: string }>
  ) {
    try {
      const currentQuiz = await Quiz.findById(quizId);
      if (!currentQuiz) {
        throw new Error('Quiz not found');
      }

      const currentQuizResults = currentQuiz.questions.map((q) => {
        const userAnswer = answers.find((a) => a.question === q.question);
        return {
          question: q.question,
          correctAnswer: q.correctAnswer,
          selectedOption: userAnswer ? userAnswer.selectedOption : null,
          correct: userAnswer ? userAnswer.selectedOption === q.correctAnswer : false,
        };
      });

      const total = currentQuiz.questions.length;
      const correctCount = currentQuizResults.filter((r) => r.correct).length;
      const previousSubmission = await QuizSubmission.findOne({ quizId, userId }).sort({
        submittedAt: -1,
      });
      const previousBest = previousSubmission?.highestScore ?? 0;
      const isNewHighScore = correctCount > previousBest;
      const highestScore = isNewHighScore ? correctCount : previousBest;

      const summary = {
        answers: currentQuizResults,
        score: correctCount,
        correctCount,
        total,
        highestScore,
        message: `You scored ${correctCount}/${total}`,
      };

      if (previousSubmission) {
        previousSubmission.answers = answers;
        previousSubmission.latestScore = correctCount;
        previousSubmission.highestScore = highestScore;
        previousSubmission.submittedAt = new Date();
        await previousSubmission.save();

        return {
          quizResult: summary,
          latestSubmission: previousSubmission,
        };
      }

      const newSubmission = new QuizSubmission({
        quizId,
        userId,
        answers,
        latestScore: correctCount,
        highestScore,
        submittedAt: new Date(),
      });

      await newSubmission.save();

      return {
        quizResult: summary,
        latestSubmission: newSubmission,
      };
    } catch (error) {
      throw new Error('Error submitting quiz, message: ' + (error as Error).message);
    }
  },

  async updateQuiz(id: string, quizData: Partial<IQuiz>) {
    try {
      return await Quiz.findByIdAndUpdate(id, quizData, { new: true, runValidators: true });
    } catch (error) {
      throw new Error('Error updating quiz, message: ' + (error as Error).message);
    }
  },
  async deleteQuiz(id: string) {
    try {
      return await Quiz.findByIdAndDelete(id);
    } catch (error) {
      throw new Error('Error deleting quiz, message: ' + (error as Error).message);
    }
  },
};

export default quizService;
