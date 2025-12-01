import { Router } from 'express';
import courseController from '../controllers/course.controller';

const courseRouter = Router();

// GET /api/courses
courseRouter.get('/', courseController.List);

export { courseRouter };
