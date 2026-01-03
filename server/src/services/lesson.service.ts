import lessonModel from '../models/lesson.model';
import { v4 as uuidv4 } from 'uuid';
import quizModel from '../models/quiz.model';
import { deleteFileFromSupabase } from '../lib/supabaseClient';

interface CreateLessonPayload {
  title: string;
  content: string;
  video?: string;
  lessonType?: string;
  duration?: number;
  order?: number;
  attachments?: string[];
}

interface UpdateLessonPayload {
  title?: string;
  content?: string;
  video?: string;
  lessonType?: string;
  duration?: number;
  order?: number;
  attachments?: string[];
  deletedVideoUrl?: string | null;
  deletedAttachmentUrls?: string[];
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
    if (!payload.title || payload.content === undefined) {
      throw new Error('title and content are required');
    }

    // Use provided order or calculate next order
    let lessonOrder = payload.order;
    if (lessonOrder === undefined) {
      const maxOrderLesson = await lessonModel
        .findOne({ course_id: courseId })
        .sort({ order: -1 })
        .exec();
      lessonOrder = (maxOrderLesson?.order ?? -1) + 1;
    }

    const newLesson = new lessonModel({
      id: uuidv4(),
      course_id: courseId,
      title: payload.title,
      content: payload.content,
      video: payload.video,
      lessonType: payload.lessonType,
      duration: payload.duration,
      order: lessonOrder,
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
    let lesson = await lessonModel.findOne({ course_id: courseId, id: lessonId }).exec();

    // If lesson not found with course_id filter, try finding by courseId as ObjectId string
    // (MongoDB _id could be stored differently in course_id field)
    if (!lesson) {
      // Try to find lesson by just lessonId
      lesson = await lessonModel.findOne({ id: lessonId }).exec();

      if (lesson) {
        // Verify the lesson belongs to a course (has course_id set)
        if (!lesson.course_id) {
          throw new Error(`Lesson ${lessonId} has no associated course`);
        }
        // Log if course ID doesn't match - might indicate data inconsistency
        if (lesson.course_id !== courseId) {
          console.warn(
            `Lesson ${lessonId} has course_id=${lesson.course_id}, but request used courseId=${courseId}. Proceeding with update.`
          );
        }
      }
    }

    if (!lesson) {
      throw new Error(`Lesson with id ${lessonId} not found`);
    }

    // Delete removed video from Supabase
    if (payload.deletedVideoUrl) {
      await deleteFileFromSupabase('lesson-videos', payload.deletedVideoUrl);
    }

    // Delete removed attachments from Supabase
    if (payload.deletedAttachmentUrls && payload.deletedAttachmentUrls.length > 0) {
      for (const url of payload.deletedAttachmentUrls) {
        await deleteFileFromSupabase('lesson-attachments', url);
      }
    }

    // Update only provided fields
    if (payload.title !== undefined) lesson.title = payload.title;
    if (payload.content !== undefined) lesson.content = payload.content;
    if (payload.video !== undefined) lesson.video = payload.video;
    if (payload.lessonType !== undefined) {
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
    // Fetch the lesson before deletion to get video and attachments
    const lesson = await lessonModel.findOne({ course_id: courseId, id: lessonId }).exec();
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Delete video from Supabase if it exists
    if (lesson.video) {
      await deleteFileFromSupabase('lesson-videos', lesson.video);
    }

    // Delete attachments from Supabase if they exist
    if (lesson.attachments && lesson.attachments.length > 0) {
      for (const attachmentUrl of lesson.attachments) {
        await deleteFileFromSupabase('lesson-attachments', attachmentUrl);
      }
    }

    // Delete the lesson record from database
    // (Cascade deletion of related quizzes and enrollment references is handled by the Lesson model hooks)
    const result = await lessonModel.deleteOne({ course_id: courseId, id: lessonId }).exec();
    if (result.deletedCount === 0) {
      throw new Error('Failed to delete lesson');
    }
    return { success: true };
  },

  GetLessonsByCourseId: async (courseId: string): Promise<unknown[]> => {
    const lessons = await lessonModel.find({ course_id: courseId }).sort({ order: 1 }).exec();
    const lessonsWithQuizzes = await Promise.all(
      lessons.map(async (lesson) => {
        const quizzes = await quizModel.find({ lesson_id: lesson.id }).sort({ order: 1 }).exec();
        return {
          ...lesson.toObject(),
          quizzes,
        };
      })
    );
    return lessonsWithQuizzes;
  },

  GetLessonById: async (courseId: string, lessonId: string): Promise<unknown> => {
    const lesson = await lessonModel.findOne({ course_id: courseId, id: lessonId }).exec();
    if (!lesson) {
      throw new Error('Lesson not found in the specified course');
    }
    const quizzes = await quizModel.find({ lesson_id: lesson.id }).sort({ order: 1 }).exec();
    return {
      ...lesson.toObject(),
      quizzes,
    };
  },
};

export default lessonService;
