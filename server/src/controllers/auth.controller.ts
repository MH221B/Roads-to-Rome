import { Request, Response } from 'express';
import authService from '../services/auth.service';

interface IAuthController {
  Login(req: Request, res: Response): Promise<void>;
  Logout(req: Request, res: Response): Promise<void>;
  Register(req: Request, res: Response): Promise<void>;
  RefreshToken(req: Request, res: Response): Promise<void>; // Refresh access token
  ForgotPassword(req: Request, res: Response): Promise<void>;
  ResetPassword(req: Request, res: Response): Promise<void>;
}

const authController: IAuthController = {
  Login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const { accessToken, refreshToken } = await authService.Login(email, password);
      
      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict', // Prevent CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({ accessToken });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  Logout: async (req: Request, res: Response): Promise<void> => {
    try {
      res.clearCookie('refreshToken');
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
  
  Register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, role } = req.body;
      const result = await authService.Register(email, password, role);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  RefreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new Error("Refresh token not found");
      }
      const token = await authService.RefreshToken(refreshToken);
      res.status(200).json(token);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  ForgotPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await authService.ForgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
  
  ResetPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.ResetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
}

export default authController;