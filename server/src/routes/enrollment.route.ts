import { Router } from 'express';
import enrollmentController from '../controllers/enrollment.controller';

const enrollmentRouter = Router();

// GET /api/enrollments
enrollmentRouter.get('/', enrollmentController.List);

// POST /api/enrollments
enrollmentRouter.post('/', enrollmentController.Create);

// DELETE /api/enrollments/:id
enrollmentRouter.delete('/:id', enrollmentController.Delete);

export { enrollmentRouter };
