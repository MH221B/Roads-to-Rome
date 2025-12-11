import { Request, Response } from 'express';
import instructorService from '../services/instructor.service';
import courseService from '../services/course.service';

interface IInstructorController {
  getInstructorInsights(req: Request, res: Response): Promise<Response | void>;
  getInstructorCourses(req: Request, res: Response): Promise<Response | void>;
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
  async getInstructorCourses(req: Request, res: Response) {
    try {
      const instructorId = req.params.id;
      if (!instructorId) return res.status(400).json({ message: 'Instructor id required' });

      const page = req.query.page ? Number(req.query.page) || 1 : 1;
      const limit = req.query.limit ? Number(req.query.limit) || 100 : 100;

      const result = await courseService.listCourses({ page, limit, instructorId: instructorId });

      return res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch instructor courses', error });
    }
  },
};

export default instructorController;