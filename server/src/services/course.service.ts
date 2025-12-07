import mongoose from 'mongoose';
import Course, { ICourse } from '../models/course.model';
import Lesson from '../models/lesson.model';
import Comment from '../models/comment.model';

interface IListOptions {
  q?: string;
  page?: number;
  limit?: number;
  category?: string | null;
  tags?: string[];
}

interface ICourseService {
  listCourses(
    options?: IListOptions
  ): Promise<{ data: any[]; total: number; page: number; limit: number }>;
  getCourseById(id: string): Promise<any | null>;
  createCourse(data: Partial<ICourse>): Promise<any>;
  createComment(
    courseId: string,
    rating: number,
    content: string,
    userId?: string,
    userName?: string
  ): Promise<any>;
  deleteCourse?(id: string): Promise<void>;
}

const courseService: ICourseService = {
  async listCourses(
    options?: IListOptions
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const page = options?.page && options.page > 0 ? Math.floor(options.page) : 1;
    const limit = options?.limit && options.limit > 0 ? Math.floor(options.limit) : 6;

    const filter: Record<string, any> = {};
    if (options?.q && options.q.trim().length > 0) {
      filter.$text = { $search: options.q };
    }

    if (options?.category) {
      filter.category = options.category;
    }

    if (options?.tags && options.tags.length) {
      // match documents that contain all specified tags
      filter.tags = { $all: options.tags };
    }

    // compute total count for the filter
    const total = await Course.countDocuments(filter).exec();

    // build query
    let query = Course.find(filter)
      .populate({ path: 'instructor', select: 'fullName email' })
      .lean();

    // If text search is used, request the text score and sort by relevance then createdAt
    if (filter.$text) {
      query = Course.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .populate({ path: 'instructor', select: 'fullName email' })
        .lean();
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const docs = (await query
      .skip((page - 1) * limit)
      .limit(limit)
      .exec()) as any[];

    const data = docs.map((c) => {
      const { _id, instructor, ...rest } = c || {};
      const instr = instructor
        ? {
            id: String(instructor._id || instructor),
            name: instructor.fullName ?? 'Unknown Instructor',
          }
        : { id: null, name: rest.instructor || 'Unknown Instructor' };
      return { id: String(_id), ...rest, instructor: instr };
    });

    return { data, total, page, limit };
  },

  async getCourseById(id: string): Promise<any | null> {
    // find course and populate instructor info when possible
    const course = await Course.findById(id)
      .populate({ path: 'instructor', select: 'fullName email' })
      .lean()
      .exec();
    if (!course) return null;

    // lessons: try matching by course._id as string or as ObjectId
    const courseIdStr = course._id ? String((course as any)._id) : id;
    const lessons = await Lesson.find({ course_id: courseIdStr }).sort({ order: 1 }).lean().exec();

    // comments: stored with courseId as ObjectId ref
    const commentsRaw = await Comment.find({ courseId: (course as any)._id })
      .populate({ path: 'userId', select: 'email role' })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const comments = (commentsRaw || []).map((c: any) => {
      const populatedUser = c.userId as any;
      return {
        id: c._id,
        course_id: String(c.courseId),
        user: populatedUser
          ? {
              id: populatedUser._id,
              name: populatedUser.email || c.userName || 'User',
              email: populatedUser.email || null,
            }
          : { id: null, name: c.userName || 'Anonymous', email: null },
        rating: c.rating,
        content: c.content,
      };
    });

    // normalize instructor shape (frontend expects instructor.name/email and id)
    const rawInstructor = (course as any).instructor;
    const instructor = rawInstructor
      ? {
          id: String(rawInstructor._id || rawInstructor),
          name: rawInstructor.fullName ?? 'Unknown Instructor',
          email: rawInstructor.email ?? null,
        }
      : { id: null, name: (course as any).instructor || 'Unknown Instructor', email: null };

    return {
      id: String((course as any)._id),
      ...course,
      instructor,
      lessons,
      comments,
    };
  },

  async createCourse(data: Partial<ICourse>): Promise<any> {
    if (!data || !data.title) {
      throw new Error('title is required');
    }

    // Prefer storing the instructor as an ObjectId reference when possible
    let instructorToStore: any = null;
    if (data.instructor) {
      // if passed an object with id/_id, use that
      if (typeof data.instructor === 'object') {
        const instr = data.instructor as any;
        const maybeId = instr._id ?? instr.id ?? instr;
        if (maybeId && mongoose.Types.ObjectId.isValid(String(maybeId))) {
          instructorToStore = new mongoose.Types.ObjectId(String(maybeId));
        }
      } else if (typeof data.instructor === 'string') {
        // if the string looks like an ObjectId, store it as ObjectId, otherwise leave null
        if (mongoose.Types.ObjectId.isValid(data.instructor)) {
          instructorToStore = new mongoose.Types.ObjectId(data.instructor);
        }
      }
    }

    // Normalize some fields that may come from multipart/form-data as strings
    const isPremiumToStore =
      data.is_premium === true ||
      String(data.is_premium).toLowerCase() === 'true' ||
      String(data.is_premium) === '1'
        ? true
        : false;

    const statusToStore =
      typeof data.status === 'string' && data.status.trim() ? data.status.trim() : undefined;

    const created = await Course.create({
      title: data.title,
      thumbnail: data.thumbnail ?? undefined,
      category: data.category ?? undefined,
      tags: Array.isArray(data.tags) ? data.tags : [],
      instructor: instructorToStore,
      shortDescription: data.shortDescription ?? undefined,
      difficulty: data.difficulty ?? null,
      is_premium: isPremiumToStore,
      ...(statusToStore ? { status: statusToStore } : {}),
    });

    // re-query the created course to populate instructor info for consistent return shape
    const populated = await Course.findById(created._id)
      .populate({ path: 'instructor', select: 'fullName' })
      .lean()
      .exec();
    const c: any = populated || (created.toObject ? created.toObject() : created);
    const rawInstr = c.instructor;
    const returnedInstructor = rawInstr
      ? { id: String(rawInstr._id || rawInstr), name: rawInstr.fullName ?? 'Unknown Instructor' }
      : { id: null, name: null };

    return {
      id: String(c._id),
      ...c,
      instructor: returnedInstructor,
    };
  },

  async createComment(
    courseId: string,
    rating: number,
    content: string,
    userId?: string,
    userName?: string
  ): Promise<any> {
    // Accept either courseId string or ObjectId
    const created = await Comment.create({
      courseId,
      userId: userId || undefined,
      userName: userName || undefined,
      rating,
      content,
    });

    // populate user if present and return normalized shape
    const pop = await Comment.findById(created._id)
      .populate({ path: 'userId', select: 'email role' })
      .lean()
      .exec();

    const populated = pop as any;
    const populatedUser = populated?.userId as any;

    return {
      id: populated?._id,
      course_id: String(populated?.courseId),
      user: populatedUser
        ? {
            id: populatedUser._id,
            name: populatedUser.email || populated.userName || 'User',
            email: populatedUser.email || null,
          }
        : { id: null, name: populated?.userName || 'Anonymous', email: null },
      rating: populated?.rating,
      content: populated?.content,
    };
  },

  async deleteCourse(id: string): Promise<void> {
    await Course.findByIdAndDelete(id).exec();
  },
};

export default courseService;
