import { Router } from 'express';
import courseController from '../controllers/course.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const courseRouter = Router();

// GET /api/courses
courseRouter.get('/', courseController.List);

// GET /api/courses/instructor/:instructorId
courseRouter.get('/instructor/:instructorId', courseController.ListByInstructor);

// GET /api/courses/:id
courseRouter.get('/:id', courseController.Get);

// POST /api/courses/:courseId/comments (requires auth)
courseRouter.post('/:courseId/comments', authenticateToken, courseController.PostComment);

// DELETE /api/courses/:courseId (requires auth & ownership/admin)
courseRouter.delete('/:courseId', authenticateToken, courseController.Delete);

export { courseRouter };
