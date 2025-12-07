import lessonModel from '../models/lesson.model';
import { v4 as uuidv4 } from 'uuid';

interface CreateLessonPayload {
  title: string;
  content_type: string;
  content: string;
  lessonType?: string;
  duration?: number;
  attachments?: string[];
}

interface UpdateLessonPayload {
  title?: string;
  content_type?: string;
  content?: string;
  lessonType?: string;
  duration?: number;
  order?: number;
  attachments?: string[];
}

interface ILessonService {
  CreateLesson(courseId: string, payload: CreateLessonPayload): Promise<unknown>;
  UpdateLesson(courseId: string, lessonId: string, payload: UpdateLessonPayload): Promise<unknown>;
  DeleteLesson(courseId: string, lessonId: string): Promise<unknown>;
  GetLessonsByCourseId(courseId: string): Promise<unknown[]>;
  GetLessonById(courseId: string, lessonId: string): Promise<unknown>;
}

const lessonService: ILessonService = {
  CreateLesson: async (courseId: string, payload: CreateLessonPayload): Promise<unknown> => {
    if (!payload.title || !payload.content_type || payload.content === undefined) {
      throw new Error('title, content_type, and content are required');
    }

    // Get the highest order in this course
    const maxOrderLesson = await lessonModel
      .findOne({ course_id: courseId })
      .sort({ order: -1 })
      .exec();

    const nextOrder = (maxOrderLesson?.order ?? -1) + 1;

    const newLesson = new lessonModel({
      id: uuidv4(),
      course_id: courseId,
      title: payload.title,
      content_type: payload.content_type, // 'html', 'video', etc.
      content: payload.content,
      lessonType: payload.lessonType,
      duration: payload.duration,
      order: nextOrder,
      attachments: payload.attachments || [],
      created_at: new Date(),
      updated_at: new Date(),
    });

    const saved = await newLesson.save();
    return saved;
  },

  UpdateLesson: async (
    courseId: string,
    lessonId: string,
    payload: UpdateLessonPayload
  ): Promise<unknown> => {
    const lesson = await lessonModel.findOne({ course_id: courseId, id: lessonId }).exec();
    if (!lesson) {
      throw new Error('Lesson not found in the specified course');
    }

    // Update only provided fields
    if (payload.title !== undefined) lesson.title = payload.title;
    if (payload.content_type !== undefined) lesson.content_type = payload.content_type;
    if (payload.content !== undefined) lesson.content = payload.content;
    if (payload.lessonType !== undefined) {
      // Type assertion since payload has string but model expects LessonType | undefined
      lesson.lessonType = payload.lessonType as any;
    }
    if (payload.duration !== undefined) lesson.duration = payload.duration;
    if (payload.order !== undefined) lesson.order = payload.order;
    if (payload.attachments !== undefined) lesson.attachments = payload.attachments;

    lesson.updated_at = new Date();

    const updated = await lesson.save();
    return updated;
  },

  DeleteLesson: async (courseId: string, lessonId: string): Promise<unknown> => {
    const result = await lessonModel.deleteOne({ course_id: courseId, id: lessonId }).exec();
    if (result.deletedCount === 0) {
      throw new Error('Lesson not found');
    }
    return { success: true };
  },

  GetLessonsByCourseId: async (courseId: string): Promise<unknown[]> => {
    const lessons = await lessonModel.find({ course_id: courseId }).sort({ order: 1 }).exec();
    return lessons;
  },

  GetLessonById: async (courseId: string, lessonId: string): Promise<unknown> => {
    const lesson = await lessonModel.findOne({ course_id: courseId, id: lessonId }).exec();
    if (!lesson) {
      throw new Error('Lesson not found in the specified course');
    }
    return lesson;
  },
};

export default lessonService;
