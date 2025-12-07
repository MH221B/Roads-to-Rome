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
    // Placeholder for creating a lesson
    res.status(501).json({ message: 'Not implemented' });
  },
  
  UpdateLesson: async (req: Request, res: Response): Promise<void> => {
    // Placeholder for updating a lesson
    res.status(501).json({ message: 'Not implemented' });
  },

  DeleteLesson: async (req: Request, res: Response): Promise<void> => {
    // Placeholder for deleting a lesson
    res.status(501).json({ message: 'Not implemented' });
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
  }
};

export default lessonController;