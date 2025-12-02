import { Request, Response } from 'express';
import courseService from '../services/course.service';

const courseController = {
  async List(req: Request, res: Response) {
    try {
      const courses = await courseService.listCourses();
      // return courses directly
      res.status(200).json(courses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};

export default courseController;
