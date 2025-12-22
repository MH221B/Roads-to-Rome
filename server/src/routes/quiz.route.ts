import { Router } from 'express';
import quizController from '../controllers/quiz.controller';
import { authenticateToken,  authorizeRoles } from '../middlewares/auth.middleware';
import Role from '../enums/user.enum';

const quizRouter = Router();

quizRouter.get('/:quizId', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT]) ,quizController.GetQuizById);
quizRouter.get('/:quizId/history', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT]), (quizController as any).getQuizHistory);
quizRouter.post('/:quizId', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT]), quizController.submitQuiz);
quizRouter.get('/', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR]), quizController.getAllQuizzes);
quizRouter.get('/instructor/:instructorId', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR]) ,quizController.getQuizzesByInstructor);
quizRouter.post('/', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR]), quizController.createQuiz);
quizRouter.put('/:id', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR]), quizController.updateQuiz);
quizRouter.delete('/:id', authenticateToken, authorizeRoles([Role.ADMIN, Role.INSTRUCTOR]), quizController.deleteQuiz);

export { quizRouter };