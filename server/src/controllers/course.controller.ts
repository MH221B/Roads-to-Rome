import { Request, Response } from 'express';
import courseService from '../services/course.service';

const courseController = {
  async List(req: Request, res: Response) {
    try {
      // accept a query param `q` for full-text search ex: /api/courses?q=javascript
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
      const courses = await courseService.listCourses(q);
      // return courses directly
      res.status(200).json(courses);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};

export default courseController;
