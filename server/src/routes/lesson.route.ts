import { Router } from 'express';
import lessonController from '../controllers/lesson.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import Role from '../enums/user.enum';

const lessonRouter = Router({ mergeParams: true }); // Enable merging parent params

// Route: POST /api/courses/:courseId/lessons (requires auth + instructor/admin)
lessonRouter.post(
  '/',
  authenticateToken,
  authorizeRoles([Role.INSTRUCTOR, Role.ADMIN]),
  lessonController.CreateLesson
);

// Route: PATCH /api/courses/:courseId/lessons/:lessonId (requires auth + instructor/admin)
lessonRouter.patch(
  '/:lessonId',
  authenticateToken,
  authorizeRoles([Role.INSTRUCTOR, Role.ADMIN]),
  lessonController.UpdateLesson
);

// Route: PUT /api/courses/:courseId/lessons/:lessonId (requires auth + instructor/admin)
lessonRouter.put(
  '/:lessonId',
  authenticateToken,
  authorizeRoles([Role.INSTRUCTOR, Role.ADMIN]),
  lessonController.UpdateLesson
);

// Route: POST /api/courses/:courseId/lessons/:lessonId/complete (student marks lesson as done)
lessonRouter.post(
  '/:lessonId/complete',
  authenticateToken,
  authorizeRoles([Role.STUDENT, Role.ADMIN]),
  lessonController.CompleteLesson
);

// Route: DELETE /api/courses/:courseId/lessons/:lessonId (requires auth + instructor/admin)
lessonRouter.delete(
  '/:lessonId',
  authenticateToken,
  authorizeRoles([Role.INSTRUCTOR, Role.ADMIN]),
  lessonController.DeleteLesson
);

// Route: GET /api/courses/:courseId/lessons/:lessonId (specific route before generic)
lessonRouter.get('/:lessonId', lessonController.GetLessonById);

// Route: GET /api/courses/:courseId/lessons (generic route after specific ones)
lessonRouter.get('/', lessonController.GetLessonsByCourseId);

export { lessonRouter };
