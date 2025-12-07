import { Router } from 'express';
import quizController from '../controllers/quiz.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const quizRouter = Router();

quizRouter.get('/:quizId', quizController.GetQuizById);
quizRouter.get('/:quizId/history', authenticateToken, (quizController as any).getQuizHistory);
quizRouter.post('/:quizId', authenticateToken, quizController.submitQuiz);

export { quizRouter };