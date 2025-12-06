import { Request, Response } from 'express';
import courseService from '../services/course.service';
import { uploadImageToSupabase } from '../lib/supabaseClient';
import { User } from '../models/user.model';

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

      const created = await courseService.createComment(
        courseId,
        rating,
        content,
        userId,
        userName
      );
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  async Create(req: Request, res: Response) {
    try {
      // Expect multipart/form-data when a file is included (thumbnail)
      const payload = { ...(req.body || {}) } as any;

      if (!payload || !payload.title) {
        return res.status(400).json({ error: 'title is required' });
      }

      // If a file was uploaded via multer (memory storage), upload to Supabase
      const file = (req as any).file as Express.Multer.File | undefined;
      if (file) {
        const timestamp = Date.now();
        const safeName = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        try {
          const publicUrl = await uploadImageToSupabase(
            'course-thumbnails',
            safeName,
            file.buffer,
            file.mimetype
          );
          payload.thumbnail = publicUrl;
        } catch (err) {
          // if upload fails, return error
          return res
            .status(500)
            .json({ error: 'Failed to upload thumbnail', details: (err as Error).message });
        }
      }

      // If authentication middleware sets req.user.id, prefer storing that user id as instructor
      const userId = (req as any).user?.id as string | undefined;
      if (userId) {
        payload.instructor = payload.instructor ?? userId;
      }

      // Normalize tags: client may send tags as JSON string when using FormData
      if (payload && typeof payload.tags === 'string') {
        try {
          const parsed = JSON.parse(payload.tags);
          if (Array.isArray(parsed)) payload.tags = parsed;
        } catch (e) {
          // fallback: comma separated
          payload.tags = payload.tags
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
      }

      const created = await courseService.createCourse(payload);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};

export default courseController;
