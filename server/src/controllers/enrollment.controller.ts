import { Request, Response } from 'express';
import enrollmentService from '../services/enrollment.service';
// viết commit cho tớ nhé cưng ơi
// refactor enrollment controller to use enrollment service

const enrollmentController = {
  async List(req: Request, res: Response) {
    try {
      const studentId = req.user?.id as string; 
      const enrollments = await enrollmentService.listEnrollmentsByUser(studentId);
      res.status(200).json(enrollments);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async Delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await enrollmentService.deleteEnrollment(id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },

  async Create(req: Request, res: Response) {
    try {
      const studentId = req.user?.id as string;
      const { status, course_id } = req.body; // status is ignored by service for now
      const finalCourseId = course_id;

      if (!studentId || !finalCourseId) {
        return res.status(400).json({ error: 'courseId is required' });
      }

      const created = await enrollmentService.createEnrollment(studentId, finalCourseId, status);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
  async Update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { progress, last_lesson_id, completed, rating } = req.body;
      const updates: any = {};
      if (typeof progress !== 'undefined') updates.progress = Number(progress);
      if (typeof last_lesson_id !== 'undefined') updates.last_lesson_id = last_lesson_id;
      if (typeof completed !== 'undefined') updates.completed = Boolean(completed);
      if (typeof rating !== 'undefined') updates.rating = Number(rating);

      const updated = await enrollmentService.updateEnrollment(id, updates);
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
};

export default enrollmentController;
