import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import Role from '../enums/user.enum';

const adminRouter = Router();

// Get admin data
adminRouter.get(
  '/admin-data',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.GetAdminData
);

// Get current user info
adminRouter.get(
  '/current-user',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.GetCurrentUser
);

// Get all users
adminRouter.get(
  '/users',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.GetAllUsers
);

// Get users by role
adminRouter.get(
  '/users/role/:role',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.GetUsersByRole
);

// Search users
adminRouter.get(
  '/users/search',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.SearchUsers
);

// Update user role
adminRouter.patch(
  '/users/:userId/role',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.UpdateUserRole
);

// Update user budget
adminRouter.patch(
  '/users/:userId/budget',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.UpdateUserBudget
);

// Toggle user locked status
adminRouter.patch(
  '/users/:userId/lock',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.ToggleUserLocked
);

// Get courses by status (default: pending)
adminRouter.get(
  '/courses',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.GetCoursesByStatus
);

// Update course status (approve/reject/hide)
adminRouter.patch(
  '/courses/:id/status',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.UpdateCourseStatus
);

// Update course price and premium flag
adminRouter.patch(
  '/courses/:id/price',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.UpdateCoursePrice
);

// Update course premium flag only
adminRouter.patch(
  '/courses/:id/premium',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.UpdateCoursePremium
);

// System statistics
adminRouter.get(
  '/stats',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.GetSystemStats
);

export { adminRouter };
