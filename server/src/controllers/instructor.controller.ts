import { Request, Response } from 'express';
import instructorService from '../services/instructor.service';
import courseService from '../services/course.service';

interface IInstructorController {
  getInstructorInsights(req: Request, res: Response): Promise<Response | void>;
  getInstructorCourses(req: Request, res: Response): Promise<Response | void>;
  generateAIQuiz(req: Request, res: Response): Promise<Response | void>;
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
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      res.status(500).json({ message: 'Failed to fetch instructor insights', error: errMsg });
    }
  },
  async getInstructorCourses(req: Request, res: Response) {
    try {
      const instructorId = req.params.id;
      if (!instructorId) return res.status(400).json({ message: 'Instructor id required' });

      const result = await courseService.getCoursesByInstructor(instructorId);
      return res.status(200).json(result);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      res.status(500).json({ message: 'Failed to fetch instructor courses', error: errMsg });
    }
  },
  async generateAIQuiz(req: Request, res: Response) {
    try {
      const instruction = req.body.instruction;
      if (!instruction) {
        return res.status(400).json({ message: 'Instruction is required to generate AI quiz' });
      }

      // Call the service to generate AI quiz
      const quizData = await instructorService.generateAIQuiz(instruction);
      return res.status(200).json(quizData);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
      res.status(500).json({ message: 'Failed to generate AI quiz', error: errMsg });
    }
  }
};

export default instructorController;