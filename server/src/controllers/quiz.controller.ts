import { Request, Response } from 'express';
import quizService from '../services/quiz.service';

interface IQuizController {
  getAllQuizzes(req: Request, res: Response): Promise<Response | void>;
  getQuizById(req: Request, res: Response): Promise<Response | void>;
  getQuizzesByInstructor(req: Request, res: Response): Promise<Response | void>;
  createQuiz(req: Request, res: Response): Promise<Response | void>;
  submitQuiz(req: Request, res: Response): Promise<Response | void>;
  updateQuiz(req: Request, res: Response): Promise<Response | void>;
  deleteQuiz(req: Request, res: Response): Promise<Response | void>;
}

const quizController: IQuizController = {
  async getAllQuizzes(req, res) {
    try {
      const quizzes = await quizService.getAllQuizzes();
      res.status(200).json(quizzes);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving quizzes', error });
    }
  },
  async getQuizById(req, res) {
    try {
      const quiz = await quizService.getQuizById(req.params.id);
      if (quiz) {
        res.status(200).json(quiz);
      } else {
        res.status(404).json({ message: 'Quiz not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving quiz', error });
    }
  },

  async getQuizzesByInstructor(req, res) {
    try {
      const instructorId = req.params.instructorId;
      const quizzes = await quizService.getQuizzesByInstructor(instructorId);
      res.status(200).json(quizzes);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving quizzes by instructor', error });
    }
  },

  async createQuiz(req, res) {
    try {
      const newQuiz = await quizService.createQuiz(req.body);
      res.status(201).json(newQuiz);
    } catch (error) {
      // If mongoose validation error or other error bubbled up, return 400 with message when appropriate
      const err = error as Error & { message?: string };
      res.status(500).json({ message: 'Error creating quiz', error: err.message ?? err });
    }
  },

  async submitQuiz(req, res) {
    try {
      const { quizResult, latestSubmission } = await quizService.submitQuiz(
        req.params.id,
        req.body.userId,
        req.body.answers
      );
      res.status(200).json({ quizResult, latestSubmission });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting quiz', error });
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
      res.status(500).json({ message: 'Error updating quiz', error });
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
      res.status(500).json({ message: 'Error deleting quiz', error });
    }
  },
};

export default quizController;
