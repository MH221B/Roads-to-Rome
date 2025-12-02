import { Router } from 'express';
import lessonController from '../controllers/lesson.controller';

const lessonRouter = Router();

lessonRouter.post('/', lessonController.CreateLesson); // placeholder for creating a lesson
lessonRouter.put('/:lessonId', lessonController.UpdateLesson); // placeholder for updating a lesson
lessonRouter.delete('/:id', lessonController.DeleteLesson); // placeholder for deleting a lesson
lessonRouter.get('/course/:courseId', lessonController.GetLessonsByCourseId);
lessonRouter.get('/:lessonId', lessonController.GetLessonById);

export { lessonRouter };