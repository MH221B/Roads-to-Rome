import { Router } from 'express';
import quizController from '../controllers/quiz.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const quizRouter = Router();

quizRouter.get('/:quizId', quizController.GetQuizById);
quizRouter.get('/:quizId/history', authenticateToken, (quizController as any).getQuizHistory);
quizRouter.post('/:quizId', authenticateToken, quizController.submitQuiz);
quizRouter.get('/', quizController.getAllQuizzes);
quizRouter.get('/instructor/:instructorId', quizController.getQuizzesByInstructor);
quizRouter.post('/', quizController.createQuiz);
quizRouter.put('/:id', quizController.updateQuiz);
quizRouter.delete('/:id', quizController.deleteQuiz);

export { quizRouter };