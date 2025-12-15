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

// Toggle user locked status
adminRouter.patch(
  '/users/:userId/lock',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.ToggleUserLocked
);

export { adminRouter };
