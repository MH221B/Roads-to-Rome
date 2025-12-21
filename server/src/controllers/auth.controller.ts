import { Request, Response } from 'express';
import authService from '../services/auth.service';

interface IAuthController {
  Login(req: Request, res: Response): Promise<void>;
  Logout(req: Request, res: Response): Promise<void>;
  Register(req: Request, res: Response): Promise<void>;
  RefreshToken(req: Request, res: Response): Promise<void>; // Refresh access token
  ForgotPassword(req: Request, res: Response): Promise<void>;
  ResetPassword(req: Request, res: Response): Promise<void>;
  InitiateGithubLogin(req: Request, res: Response): Promise<void>;
  GithubCallback(req: Request, res: Response): Promise<void>;
  Profile(req: Request, res: Response): Promise<void>;
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
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({ accessToken });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  Logout: async (req: Request, res: Response): Promise<void> => {
    try {
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  Register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, role, username, fullName } = req.body;
      const result = await authService.Register(email, password, role, username, fullName);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  RefreshToken: async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new Error('Refresh token not found');
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

  InitiateGithubLogin: async (req: Request, res: Response): Promise<void> => {
    try {
      const redirectUrl = authService.GetGithubOAuthUrl();
      res.redirect(redirectUrl);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  GithubCallback: async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.query;

      if (!code || typeof code !== 'string') {
        throw new Error('Invalid code from GitHub');
      }

      const { accessToken, refreshToken } = await authService.GithubLogin(code);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict', // Prevent CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production)
        sameSite: 'strict', // Prevent CSRF
        maxAge: 60 * 60 * 1000, // 1 hour
      });
      res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}?error=${(error as Error).message}`);
    }
  },

  Profile: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User ID not found in token' });
        return;
      }

      const profile = await authService.GetProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
};

export default authController;
