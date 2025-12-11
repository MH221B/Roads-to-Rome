import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import Role from '../enums/user.enum';
import instructorController from '../controllers/instructor.controller';

const instructorRouter = Router();
instructorRouter.get(
  '/insights',
  authenticateToken,
  authorizeRoles([Role.INSTRUCTOR]),
  instructorController.getInstructorInsights
);
// Public endpoint to list courses for a given instructor id (supports pagination via query params)
instructorRouter.get('/:id/courses', instructorController.getInstructorCourses);
export { instructorRouter };