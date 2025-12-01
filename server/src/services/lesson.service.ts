import lessonModel from "../models/lesson.model";

interface ILessonService {
  GetLessonsByCourseId(courseId: string): Promise<unknown[]>;
  GetLessonById(courseId: string, lessonId: string): Promise<unknown>;
}

const lessonService: ILessonService = {
  GetLessonsByCourseId: async (courseId: string): Promise<unknown[]> => {
    const lessons = await lessonModel.find({ course_id: courseId }).sort({ order: 1 }).exec();
    return lessons;
  },

  GetLessonById: async (courseId: string, lessonId: string): Promise<unknown> => {
    console.log("Fetching lesson:", courseId, lessonId);
    const lesson = await lessonModel.findOne({ course_id: courseId, id: lessonId }).exec();
    if (!lesson) {
      throw new Error('Lesson not found');
    }
    return lesson;
  }
};

export default lessonService;