import { Request, Response } from 'express';
import authService from '../services/auth.service';

interface IAuthController {
  Login(req: Request, res: Response): Promise<void>;
  // Logout(req: Request, res: Response): Promise<void>; // later implementation
  Register(req: Request, res: Response): Promise<void>;
  RefreshToken(req: Request, res: Response): Promise<void>; // Refresh access token
}

const authController: IAuthController = {
  Login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const tokens = await authService.Login(email, password);
      res.status(200).json(tokens);
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
      const { userId } = req.body;
      const token = await authService.RefreshToken(userId);
      res.status(200).json(token);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default authController;