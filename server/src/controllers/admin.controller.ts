import { Request, Response } from 'express';
import adminService from '../services/admin.service';
import Role from '../enums/user.enum';
import { CourseStatus } from '../enums/course.enum';

interface IAdminController {
  GetAdminData(req: Request, res: Response): Promise<void>;
  GetCurrentUser(req: Request, res: Response): Promise<void>;
  GetAllUsers(req: Request, res: Response): Promise<void>;
  GetUsersByRole(req: Request, res: Response): Promise<void>;
  SearchUsers(req: Request, res: Response): Promise<void>;
  UpdateUserRole(req: Request, res: Response): Promise<void>;
  UpdateUserBudget(req: Request, res: Response): Promise<void>;
  ToggleUserLocked(req: Request, res: Response): Promise<void>;
  GetCoursesByStatus(req: Request, res: Response): Promise<void>;
  UpdateCourseStatus(req: Request, res: Response): Promise<void>;
  UpdateCoursePrice(req: Request, res: Response): Promise<void>;
  UpdateCoursePremium(req: Request, res: Response): Promise<void>;
  GetSystemStats(req: Request, res: Response): Promise<void>;
}

const adminController: IAdminController = {
  async GetAdminData(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await adminService.getAdminData());
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async GetCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User ID not found in token' });
        return;
      }
      const user = await adminService.getCurrentUser(userId);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async GetAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await adminService.getAllUsers(page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async GetUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      if (!Object.values(Role).includes(role as Role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await adminService.getUsersByRole(role as Role, page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async SearchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await adminService.searchUsers(query, page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async UpdateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      if (!role || !Object.values(Role).includes(role as Role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }
      const user = await adminService.updateUserRole(userId, role as Role);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async UpdateUserBudget(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { budget } = req.body;
      const parsedBudget = Number(budget);

      if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
        res.status(400).json({ error: 'budget must be a non-negative number' });
        return;
      }

      const user = await adminService.updateUserBudget(userId, parsedBudget);
      res.status(200).json(user);
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'User not found') {
        res.status(404).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  },

  async ToggleUserLocked(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { locked } = req.body;
      if (typeof locked !== 'boolean') {
        res.status(400).json({ error: 'locked must be a boolean' });
        return;
      }
      const user = await adminService.toggleUserLocked(userId, locked);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async GetCoursesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = (req.query.status as string) || CourseStatus.PENDING;

      if (!Object.values(CourseStatus).includes(status as CourseStatus)) {
        res.status(400).json({ error: 'Invalid course status' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await adminService.getCoursesByStatus(status as CourseStatus, page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async UpdateCourseStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, reviewNote } = req.body as { status?: string; reviewNote?: string };

      if (!status || !Object.values(CourseStatus).includes(status as CourseStatus)) {
        res.status(400).json({ error: 'Invalid course status' });
        return;
      }

      const reviewerId = req.user?.id;

      const result = await adminService.updateCourseStatus(
        id,
        status as CourseStatus,
        reviewNote,
        reviewerId
      );

      res.status(200).json(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'Course not found') {
        res.status(404).json({ error: message });
        return;
      }
      if (message.startsWith('Invalid course status')) {
        res.status(400).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  },

  async UpdateCoursePrice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { price } = req.body as { price?: any };

      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        res.status(400).json({ error: 'price must be a non-negative number' });
        return;
      }

      const course = await adminService.updateCoursePrice(id, parsedPrice);

      res.status(200).json(course);
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'Course not found') {
        res.status(404).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  },

  async UpdateCoursePremium(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { is_premium } = req.body as { is_premium?: any };

      if (typeof is_premium !== 'boolean') {
        res.status(400).json({ error: 'is_premium must be boolean' });
        return;
      }

      const course = await adminService.updateCoursePremium(id, is_premium);
      res.status(200).json(course);
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'Course not found') {
        res.status(404).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  },

  async GetSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await adminService.getSystemStats();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};

export default adminController;
