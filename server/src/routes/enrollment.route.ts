import { Router } from 'express';
import enrollmentController from '../controllers/enrollment.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const enrollmentRouter = Router();

// GET /api/enrollments - requires authentication to get enrollments for the logged-in user
enrollmentRouter.get('/', authenticateToken, enrollmentController.List);

// POST /api/enrollments - requires authentication so server can populate studentId
enrollmentRouter.post('/', authenticateToken, enrollmentController.Create);

// PATCH /api/enrollments/:id - update progress
enrollmentRouter.patch('/:id', authenticateToken, enrollmentController.Update);

// DELETE /api/enrollments/:id
enrollmentRouter.delete('/:id', authenticateToken, enrollmentController.Delete);

export { enrollmentRouter };
