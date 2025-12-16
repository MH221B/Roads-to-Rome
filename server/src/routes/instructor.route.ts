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
// Prevent spam bots from abusing the AI quiz generation feature by requiring authentication and instructor role
// not even admins should be able to generate AI quizzes unless they are also instructors
instructorRouter.post('/ai-quiz', authenticateToken, authorizeRoles([Role.INSTRUCTOR]), instructorController.generateAIQuiz);
export { instructorRouter };