import { Request, Response } from 'express';
import adminService from '../services/admin.service';

interface IAdminController {
  GetAdminData(req: Request, res: Response): Promise<void>;
}

const adminController: IAdminController = {
  async GetAdminData(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json(await adminService.getAdminData());
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};

export default adminController;
