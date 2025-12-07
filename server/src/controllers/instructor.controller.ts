import { Request, Response } from 'express';
import instructorService from '../services/instructor.service';

interface IInstructorController {
  getInstructorInsights(req: Request, res: Response): Promise<Response | void>;
}

const instructorController: IInstructorController = {
  async getInstructorInsights(req: Request, res: Response) {
    try {
      const instructorId = req.user?.id;
      if (!instructorId) {
        return res.status(400).json({ message: 'Instructor ID is required' });
      }

      // Fetch insights data from the database or service
      const insightsData = await instructorService.fetchInsightsByInstructorId(instructorId);

      return res.status(200).json(insightsData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch instructor insights', error });
    }
  },
};

export default instructorController;
