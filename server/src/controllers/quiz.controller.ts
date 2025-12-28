import { Request, Response } from 'express';
import quizService from '../services/quiz.service';
import submitQuizService from '../services/submitQuiz.service';

interface IquizController {
  GetQuizById(req: Request, res: Response): Promise<void>;
  submitQuiz(req: Request, res: Response): Promise<void>;
  getAllQuizzes(req: Request, res: Response): Promise<void>;
  getQuizzesByInstructor(req: Request, res: Response): Promise<void>;
  createQuiz(req: Request, res: Response): Promise<void>;
  updateQuiz(req: Request, res: Response): Promise<void>;
  deleteQuiz(req: Request, res: Response): Promise<void>;
}

const quizController: IquizController = {
  GetQuizById: async (req: Request, res: Response): Promise<void> => {
    try {
      const quizId = req.params.quizId;
      const quiz = await quizService.GetQuizById(quizId);
      res.status(200).json(quiz);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
  submitQuiz: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id as string;
      const quizId = req.params.quizId;
      const hasAccess = await quizService.checkUserAccessToQuiz(userId, quizId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const answers = req.body.answers;
      const score = await quizService.submitQuiz(quizId, answers);
      if (score === null) {
        throw new Error('Error calculating score');
      }

      const duration = req.body.duration;
      const result = await submitQuizService.submitQuiz(quizId, userId, answers, score, duration);
      if (result === null) {
        throw new Error('Error submitting quiz');
      }
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
  async getAllQuizzes(req, res) {
    try {
      const quizzes = await quizService.getAllQuizzes();
      res.status(200).json(quizzes);
    } catch (error) {
      const err = error as Error & { message?: string };
      res
        .status(500)
        .json({ message: 'Error retrieving quizzes', error: err.message ?? String(err) });
    }
  },
  async getQuizzesByInstructor(req, res) {
    try {
      const instructorId = req.params.instructorId;
      const quizzes = await quizService.getQuizzesByInstructor(instructorId);
      res.status(200).json(quizzes);
    } catch (error) {
      const err = error as Error & { message?: string };
      res
        .status(500)
        .json({
          message: 'Error retrieving quizzes by instructor',
          error: err.message ?? String(err),
        });
    }
  },
  async createQuiz(req, res) {
    try {
      const newQuiz = await quizService.createQuiz(req.body);
      res.status(201).json(newQuiz);
    } catch (error) {
      // If mongoose validation error or other error bubbled up, return 400 with message when appropriate
      const err = error as Error & { message?: string };
      res.status(500).json({ message: 'Error creating quiz', error: err.message ?? String(err) });
    }
  },
  async updateQuiz(req, res) {
    try {
      const updatedQuiz = await quizService.updateQuiz(req.params.id, req.body);
      if (updatedQuiz) {
        res.status(200).json(updatedQuiz);
      } else {
        res.status(404).json({ message: 'Quiz not found' });
      }
    } catch (error) {
      const err = error as Error & { message?: string };
      res.status(500).json({ message: 'Error updating quiz', error: err.message ?? String(err) });
    }
  },
  async deleteQuiz(req, res) {
    try {
      const deletedQuiz = await quizService.deleteQuiz(req.params.id);
      if (deletedQuiz) {
        res.status(200).json({ message: 'Quiz deleted successfully' });
      } else {
        res.status(404).json({ message: 'Quiz not found' });
      }
    } catch (error) {
      const err = error as Error & { message?: string };
      res.status(500).json({ message: 'Error deleting quiz', error: err.message ?? String(err) });
    }
  },
};

export default quizController;

// New: return history (submissions) of the authenticated user for a quiz
interface IExtendedQuizController {
  getQuizHistory?(req: Request, res: Response): Promise<void>;
}

const getQuizHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const quizId = req.params.quizId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const submissions = await submitQuizService.getSubmissionsByQuizAndUser(quizId, userId);
    res.status(200).json(submissions || []);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// attach to controller for export convenience
(quizController as any).getQuizHistory = getQuizHistory;
