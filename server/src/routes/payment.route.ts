import { Router } from 'express';
import paymentController from '../controllers/payment.controller';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware';
import Role from '../enums/user.enum';

const paymentRouter = Router();

paymentRouter.post(
  '/mock',
  authenticateToken,
  authorizeRoles([Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN]),
  paymentController.ConfirmMockPayment
);

export { paymentRouter };