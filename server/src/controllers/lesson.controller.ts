import { Request, Response } from 'express';
import lessonService from '../services/lesson.service';

interface ILessonController {
  CreateLesson(req: Request, res: Response): Promise<void>;
  UpdateLesson(req: Request, res: Response): Promise<void>;
  DeleteLesson(req: Request, res: Response): Promise<void>;
  GetLessonById(req: Request, res: Response): Promise<void>;
  GetLessonsByCourseId(req: Request, res: Response): Promise<void>;
}

const lessonController: ILessonController = {
  CreateLesson: async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId } = req.params;
      const payload = req.body;

      if (!courseId) {
        res.status(400).json({ error: 'courseId is required' });
        return;
      }

      if (!payload.title || !payload.content_type || payload.content === undefined) {
        res.status(400).json({ error: 'title, content_type, and content are required' });
        return;
      }

      const lesson = await lessonService.CreateLesson(courseId, payload);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  UpdateLesson: async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId, lessonId } = req.params;
      const payload = req.body;

      if (!courseId || !lessonId) {
        res.status(400).json({ error: 'courseId and lessonId are required' });
        return;
      }

      const lesson = await lessonService.UpdateLesson(courseId, lessonId, payload);
      res.status(200).json(lesson);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  DeleteLesson: async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId, lessonId } = req.params;

      if (!courseId || !lessonId) {
        res.status(400).json({ error: 'courseId and lessonId are required' });
        return;
      }

      await lessonService.DeleteLesson(courseId, lessonId);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  GetLessonsByCourseId: async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = (req.params.id || req.params.courseId) as string;
      const lessons = await lessonService.GetLessonsByCourseId(courseId);
      res.status(200).json(lessons);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  GetLessonById: async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = (req.query.id as string) || (req.query.courseId as string);
      const lessonId = req.params.lessonId;
      const lesson = await lessonService.GetLessonById(courseId, lessonId);
      res.status(200).json(lesson);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
};

export default lessonController;
