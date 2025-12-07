import { Router } from 'express';
import lessonController from '../controllers/lesson.controller';

const lessonRouter = Router({ mergeParams: true }); // Enable merging parent params

// Route: POST /api/courses/:courseId/lessons
lessonRouter.post('/', lessonController.CreateLesson);

// Route: PUT /api/courses/:courseId/lessons/:lessonId
lessonRouter.put('/:lessonId', lessonController.UpdateLesson);

// Route: DELETE /api/courses/:courseId/lessons/:lessonId
lessonRouter.delete('/:lessonId', lessonController.DeleteLesson);

// Route: GET /api/courses/:courseId/lessons
lessonRouter.get('/', lessonController.GetLessonsByCourseId);

// Route: GET /api/lessons/:lessonId
lessonRouter.get('/:lessonId', lessonController.GetLessonById);

export { lessonRouter };
