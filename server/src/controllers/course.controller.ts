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
  async Get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await courseService.getCourseById(id);
      if (!course) return res.status(404).json({ error: 'Course not found' });
      res.status(200).json(course);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async PostComment(req: Request, res: Response) {
    try {
      const { courseId } = req.params as any;
      const { rating, content } = req.body;

      if (!rating || !content) {
        return res.status(400).json({ error: 'rating and content are required' });
      }

      // If authentication middleware sets req.user, use it
      const userId = (req as any).user?.id as string | undefined;
      const userName = undefined; // can be derived from user record if needed

      const created = await courseService.createComment(courseId, rating, content, userId, userName);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};

export default courseController;
