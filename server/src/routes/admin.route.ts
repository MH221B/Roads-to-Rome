import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import Role from '../enums/user.enum';

const adminRouter = Router();
adminRouter.get(
  '/admin-data',
  authenticateToken,
  authorizeRoles([Role.ADMIN]),
  adminController.GetAdminData
);
export { adminRouter };
