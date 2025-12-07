import { Request, Response } from 'express';
import quizService from '../services/quiz.service';
import submitQuizService from '../services/submitQuiz.service';

interface IquizController {
  GetQuizById(req: Request, res: Response): Promise<void>;
  submitQuiz(req: Request, res: Response): Promise<void>;
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
      console.log("Submit Quiz Payload:", req.user, req.params, req.body);
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
  }
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