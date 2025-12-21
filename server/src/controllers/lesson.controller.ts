import { Request, Response } from 'express';
import lessonService from '../services/lesson.service';
import enrollmentService from '../services/enrollment.service';
import { uploadImageToSupabase } from '../lib/supabaseClient';

interface ILessonController {
  CreateLesson(req: Request, res: Response): Promise<void>;
  UpdateLesson(req: Request, res: Response): Promise<void>;
  DeleteLesson(req: Request, res: Response): Promise<void>;
  GetLessonById(req: Request, res: Response): Promise<void>;
  GetLessonsByCourseId(req: Request, res: Response): Promise<void>;
  CompleteLesson(req: Request, res: Response): Promise<void>;
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

      if (!payload.title || payload.content === undefined) {
        res.status(400).json({ error: 'title and content are required' });
        return;
      }

      // Handle video file upload if present
      const files = (req as any).files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      if (files?.video && files.video.length > 0) {
        const videoFile = files.video[0];
        const timestamp = Date.now();
        const safeName = `${courseId}/${timestamp}-${videoFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        try {
          const videoUrl = await uploadImageToSupabase(
            'lesson-videos',
            safeName,
            videoFile.buffer,
            videoFile.mimetype
          );
          payload.video = videoUrl; // Store video URL
        } catch (err) {
          res.status(500).json({
            error: 'Failed to upload video',
            details: (err as Error).message,
          });
          return;
        }
      }

      // Handle attachment files upload if present
      const attachmentUrls: string[] = [];
      if (files?.attachments && files.attachments.length > 0) {
        try {
          for (const attachmentFile of files.attachments) {
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(7);
            const safeName = `${courseId}/${timestamp}-${randomSuffix}-${attachmentFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
            const attachmentUrl = await uploadImageToSupabase(
              'lesson-attachments',
              safeName,
              attachmentFile.buffer,
              attachmentFile.mimetype
            );
            attachmentUrls.push(attachmentUrl);
          }
        } catch (err) {
          res.status(500).json({
            error: 'Failed to upload attachments',
            details: (err as Error).message,
          });
          return;
        }
      }

      if (attachmentUrls.length > 0) {
        payload.attachments = attachmentUrls;
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

      // Handle video file upload if present
      const files = (req as any).files as
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined;
      if (files?.video && files.video.length > 0) {
        const videoFile = files.video[0];
        const timestamp = Date.now();
        const safeName = `${courseId}/${timestamp}-${videoFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
        try {
          const videoUrl = await uploadImageToSupabase(
            'lesson-videos',
            safeName,
            videoFile.buffer,
            videoFile.mimetype
          );
          payload.video = videoUrl; // Store video URL
        } catch (err) {
          res.status(500).json({
            error: 'Failed to upload video',
            details: (err as Error).message,
          });
          return;
        }
      }

      // Handle attachment files upload if present
      const attachmentUrls: string[] = [];
      if (files?.attachments && files.attachments.length > 0) {
        try {
          for (const attachmentFile of files.attachments) {
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(7);
            const safeName = `${courseId}/${timestamp}-${randomSuffix}-${attachmentFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
            const attachmentUrl = await uploadImageToSupabase(
              'lesson-attachments',
              safeName,
              attachmentFile.buffer,
              attachmentFile.mimetype
            );
            attachmentUrls.push(attachmentUrl);
          }
        } catch (err) {
          res.status(500).json({
            error: 'Failed to upload attachments',
            details: (err as Error).message,
          });
          return;
        }
      }

      if (attachmentUrls.length > 0) {
        payload.attachments = attachmentUrls;
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
      const courseId = req.params.courseId;
      const lessons = await lessonService.GetLessonsByCourseId(courseId);
      res.status(200).json(lessons);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  GetLessonById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { courseId, lessonId } = req.params;

      if (!courseId || !lessonId) {
        res.status(400).json({ error: 'courseId and lessonId are required' });
        return;
      }

      const lesson = await lessonService.GetLessonById(courseId, lessonId);
      res.status(200).json(lesson);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  CompleteLesson: async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = (req as any).user?.id as string | undefined;
      const { courseId, lessonId } = req.params;

      if (!studentId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!courseId || !lessonId) {
        res.status(400).json({ error: 'courseId and lessonId are required' });
        return;
      }

      const updated = await enrollmentService.updateProgressByLesson(studentId, courseId, lessonId);
      res.status(200).json(updated);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },
};

export default lessonController;
