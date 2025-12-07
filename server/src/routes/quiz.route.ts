import { Router } from 'express';
import quizController from '../controllers/quiz.controller';
export const quizRouter = Router();

quizRouter.get('/', quizController.getAllQuizzes);
quizRouter.get('/instructor/:instructorId', quizController.getQuizzesByInstructor);
quizRouter.get('/:id', quizController.getQuizById);
quizRouter.post('/:id/submit', quizController.submitQuiz);
quizRouter.post('/', quizController.createQuiz);
quizRouter.put('/:id', quizController.updateQuiz);
quizRouter.delete('/:id', quizController.deleteQuiz);
