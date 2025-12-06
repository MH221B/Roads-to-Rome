import { Router } from 'express';
import courseController from '../controllers/course.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import Role from '../enums/user.enum';
import { upload } from '../middlewares/upload.middleware';

const courseRouter = Router();

// GET /api/courses
courseRouter.get('/', courseController.List);

// GET /api/courses/:id
courseRouter.get('/:id', courseController.Get);

// DELETE /api/courses/:id (requires auth + instructor/admin)
courseRouter.delete(
  '/:id',
  authenticateToken,
  authorizeRoles([Role.INSTRUCTOR, Role.ADMIN]),
  courseController.Delete
);

// POST /api/courses (requires auth + instructor/admin). Accepts `multipart/form-data` with optional `thumbnail` file field.
courseRouter.post(
  '/',
  authenticateToken,
  authorizeRoles([Role.INSTRUCTOR, Role.ADMIN]),
  upload.single('thumbnail'),
  courseController.Create
);

// POST /api/courses/:courseId/comments (requires auth)
courseRouter.post('/:courseId/comments', authenticateToken, courseController.PostComment);

export { courseRouter };
