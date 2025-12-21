import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
const authRouter = Router();

authRouter.post('/login', authController.Login);
authRouter.get('/github', authController.InitiateGithubLogin);
authRouter.get('/github/callback', authController.GithubCallback);
authRouter.post('/logout', authController.Logout);
authRouter.post('/register', authController.Register);
authRouter.post('/refresh-token', authController.RefreshToken);
authRouter.post('/forgot-password', authController.ForgotPassword);
authRouter.post('/change-password', authController.ResetPassword);
authRouter.get('/me', authenticateToken, authController.Profile);

export { authRouter };
