import mongoose from 'mongoose';
import Course, { ICourse } from '../models/course.model';
import Lesson from '../models/lesson.model';
import Comment from '../models/comment.model';
import Enrollment from '../models/enrollment.model';
import { User } from '../models/user.model';
import { CourseStatus } from '../enums/course.enum';

interface IListOptions {
  q?: string;
  page?: number;
  limit?: number;
  category?: string | null;
  tags?: string[];
  instructorId?: string | null;
  sort?: string;
  status?: CourseStatus | string;
}

interface ICourseService {
  listCourses(
    options?: IListOptions
  ): Promise<{ data: any[]; total: number; page: number; limit: number }>;
  getCourseById(id: string): Promise<any | null>;
  createCourse(data: Partial<ICourse>): Promise<any>;
  suggestCourses(options: ISuggestOptions): Promise<{
    data: any[];
    usedInterests: string[];
    source: { fromHistory: number; fromProvided: number; fallbackUsed: boolean };
  }>;
  createComment(
    courseId: string,
    rating: number,
    content: string,
    userId?: string,
    userName?: string
  ): Promise<any>;
  deleteCourse?(id: string): Promise<void>;
  updateCourse?(id: string, data: Partial<ICourse> & Record<string, any>): Promise<any>;
}

interface ISuggestOptions {
  userId: string;
  interests?: string[];
  limit?: number;
}

export function validateCourseStatusTransition(from: CourseStatus, to: CourseStatus): boolean {
  // allow idempotent update
  if (from === to) return true;

  const allowed: Record<CourseStatus, CourseStatus[]> = {
    [CourseStatus.DRAFT]: [CourseStatus.PENDING],
    [CourseStatus.PENDING]: [CourseStatus.PUBLISHED, CourseStatus.REJECTED],
    [CourseStatus.PUBLISHED]: [CourseStatus.HIDDEN],
    [CourseStatus.REJECTED]: [],
    [CourseStatus.HIDDEN]: [],
  };

  return allowed[from]?.includes(to) ?? false;
}

const courseService: ICourseService = {
  async listCourses(
    options?: IListOptions
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    try {
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

      if (options?.instructorId) {
        // instructor is stored as ObjectId reference; ensure the provided id is valid
        if (mongoose.Types.ObjectId.isValid(String(options.instructorId))) {
          filter.instructor = new mongoose.Types.ObjectId(String(options.instructorId));
        } else {
          // invalid field -> include impossible filter so no records are returned
          filter._id = { $exists: false } as any;
        }
      }

      if (options?.status) {
        filter.status = options.status;
      }

      // Prepare pagination options
      const paginateOptions: any = {
        page,
        limit,
        populate: { path: 'instructor', select: 'fullName email' },
        lean: true,
        select: '-__v',
      };

      // Determine sort options based on the sort parameter
      let sortOptions: Record<string, 1 | -1 | { $meta: 'textScore' }> = { createdAt: -1 }; // default: newest first
      if (options?.sort) {
        switch (options.sort) {
          case 'title-asc':
            sortOptions = { title: 1 };
            break;
          case 'title-desc':
            sortOptions = { title: -1 };
            break;
          case 'oldest':
            sortOptions = { createdAt: 1 };
            break;
          case 'newest':
            sortOptions = { createdAt: -1 };
            break;
          default:
            sortOptions = { createdAt: -1 };
        }
      }

      // If text search is used, include custom sort for relevance
      if (filter.$text) {
        paginateOptions.customLabels = {
          totalDocs: 'total',
          docs: 'data',
          page: 'page',
          limit: 'limit',
        };
        paginateOptions.sort = { score: { $meta: 'textScore' }, createdAt: -1 };
      } else {
        paginateOptions.customLabels = {
          totalDocs: 'total',
          docs: 'data',
          page: 'page',
          limit: 'limit',
        };
        paginateOptions.sort = sortOptions;
      }

      // Use paginate method
      const result: any = await (Course as any).paginate(filter, paginateOptions);

      // Normalize response data
      const data = (result.data || []).map((c: any) => {
        const { _id, instructor, ...rest } = c || {};
        const instr = instructor
          ? {
              id: String(instructor._id || instructor),
              name: instructor.fullName ?? 'Unknown Instructor',
            }
          : { id: null, name: rest.instructor || 'Unknown Instructor' };
        return { id: String(_id), ...rest, instructor: instr };
      });

      return { data, total: result.total, page: result.page, limit: result.limit };
    } catch (error) {
      console.error('Error in courseService.listCourses:', error);
      throw error;
    }
  },

  async getCourseById(id: string): Promise<any | null> {
    // find course and populate instructor info when possible
    const course = await Course.findById(id)
      .populate({ path: 'instructor', select: 'fullName email' })
      .lean()
      .exec();
    if (!course) return null;

    // lessons: match by course.courseId if present, otherwise by _id string
    const courseIdStr = course.courseId || (course._id ? String((course as any)._id) : id);
    const lessons = await Lesson.find({ course_id: courseIdStr }).sort({ order: 1 }).lean().exec();

    // comments: stored with courseId as course identifier string
    const commentsRaw = await Comment.find({
      courseId: course.courseId || String((course as any)._id),
    })
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
      id: course.courseId || String((course as any)._id),
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

  async suggestCourses(options: ISuggestOptions) {
    if (!options?.userId) {
      throw new Error('userId is required for suggestions');
    }

    const limit = options.limit && options.limit > 0 ? Math.min(Math.floor(options.limit), 50) : 6;

    const normalizeInterests = (values: string[] | undefined) =>
      Array.isArray(values)
        ? values
            .map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : ''))
            .filter(Boolean)
        : [];

    const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const providedInterests = normalizeInterests(options.interests);

    const enrollments = await Enrollment.find({ studentId: options.userId }).select('courseId').lean().exec();
    const enrolledCourseIds = Array.from(
      new Set((enrollments || []).map((e: any) => String(e.courseId)).filter(Boolean))
    );
    const enrolledObjectIds = enrolledCourseIds
      .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
      .map((id) => new mongoose.Types.ObjectId(String(id)));

    const historyCourses = enrolledCourseIds.length
      ? await Course.find({
          $or: [
            { courseId: { $in: enrolledCourseIds } },
            enrolledObjectIds.length ? { _id: { $in: enrolledObjectIds } } : undefined,
          ].filter(Boolean) as any,
        })
          .select('tags category courseId _id')
          .lean()
          .exec()
      : [];

    const historyTokens = new Set<string>();
    (historyCourses || []).forEach((c: any) => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach((t: any) => historyTokens.add(String(t).toLowerCase()));
      }
      if (c.category) {
        historyTokens.add(String(c.category).toLowerCase());
      }
    });

    const userDoc = await User.findById(options.userId).select('interests').lean().exec();
    const storedInterests = normalizeInterests((userDoc as any)?.interests);

    const interestTokens = Array.from(new Set([...historyTokens, ...storedInterests, ...providedInterests]));

    const baseFilter: Record<string, any> = { status: CourseStatus.PUBLISHED };
    if (enrolledCourseIds.length) {
      baseFilter.courseId = { $nin: enrolledCourseIds };
    }
    if (enrolledObjectIds.length) {
      baseFilter._id = { $nin: enrolledObjectIds };
    }

    const candidateLimit = limit * 3;

    const interestRegexes = interestTokens.map((token) => new RegExp(`^${escapeRegex(token)}$`, 'i'));
    const interestFilter = interestTokens.length
      ? {
          $or: [
            { tags: { $in: interestRegexes } },
            { category: { $in: interestRegexes } },
          ],
        }
      : {};

    const candidatesPrimary = await Course.find({ ...baseFilter, ...interestFilter })
      .limit(candidateLimit)
      .populate({ path: 'instructor', select: 'fullName email' })
      .lean()
      .exec();

    let candidates = candidatesPrimary as any[];
    let fallbackUsed = false;

    if (!candidates.length) {
      fallbackUsed = true;
      candidates = (await Course.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(candidateLimit)
        .populate({ path: 'instructor', select: 'fullName email' })
        .lean()
        .exec()) as any[];
    }

    const scoringSet = interestTokens.length ? new Set(interestTokens) : historyTokens;

    const scored = candidates.map((c: any) => {
      const tagsLower = Array.isArray(c.tags) ? c.tags.map((t: any) => String(t).toLowerCase()) : [];
      const categoryLower = typeof c.category === 'string' ? c.category.toLowerCase() : null;
      let score = 0;
      tagsLower.forEach((t: string) => {
        if (scoringSet.has(t)) score += 1;
      });
      if (categoryLower && scoringSet.has(categoryLower)) score += 2;

      return {
        course: c,
        score,
      };
    });

    scored.sort((a: any, b: any) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.course?.createdAt ? new Date(a.course.createdAt).getTime() : 0;
      const bTime = b.course?.createdAt ? new Date(b.course.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const top = (scored.length ? scored : candidates.map((c: any) => ({ course: c, score: 0 }))).slice(0, limit);

    const normalized = top.map(({ course }) => {
      const { _id, instructor, ...rest } = course || {};
      const instr = instructor
        ? {
            id: String((instructor as any)._id || instructor),
            name: (instructor as any).fullName ?? 'Unknown Instructor',
            email: (instructor as any).email ?? null,
          }
        : { id: null, name: 'Unknown Instructor', email: null };

      return {
        id: course?.courseId || String(_id),
        ...rest,
        instructor: instr,
      };
    });

    return {
      data: normalized,
      usedInterests: Array.from(scoringSet),
      source: {
        fromHistory: historyTokens.size,
        fromProvided: providedInterests.length + storedInterests.length,
        fallbackUsed,
      },
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

  async updateCourse(id: string, data: Partial<ICourse> & Record<string, any>): Promise<any> {
    if (!id) throw new Error('id is required');

    const existing = await Course.findById(id).exec();
    if (!existing) throw new Error('Course not found');

    const updates: Record<string, any> = {};

    if (typeof data.title === 'string' && data.title.trim()) updates.title = data.title.trim();
    if (typeof data.thumbnail === 'string' && data.thumbnail.trim())
      updates.thumbnail = data.thumbnail.trim();
    if (typeof data.category === 'string') updates.category = data.category;
    if (typeof data.shortDescription === 'string') updates.shortDescription = data.shortDescription;
    if (typeof data.difficulty !== 'undefined') updates.difficulty = data.difficulty ?? null;

    if (typeof data.tags !== 'undefined') {
      if (Array.isArray(data.tags)) updates.tags = data.tags.map((t: any) => String(t));
      else if (typeof data.tags === 'string') {
        try {
          const parsed = JSON.parse(data.tags);
          if (Array.isArray(parsed)) updates.tags = parsed.map((t: any) => String(t));
          else
            updates.tags = String(data.tags)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
        } catch (e) {
          updates.tags = String(data.tags)
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
      }
    }

    if (typeof data.is_premium !== 'undefined') {
      updates.is_premium =
        data.is_premium === true ||
        String(data.is_premium).toLowerCase() === 'true' ||
        String(data.is_premium) === '1';
    }

    if (typeof data.status === 'string' && data.status.trim()) {
      const nextStatus = data.status.trim() as CourseStatus;

      if (!Object.values(CourseStatus).includes(nextStatus)) {
        throw new Error('Invalid course status');
      }

      const canTransition = validateCourseStatusTransition(existing.status, nextStatus);
      if (!canTransition) {
        throw new Error(`Invalid course status transition: ${existing.status} -> ${nextStatus}`);
      }

      updates.status = nextStatus;
    }

    // Prefer storing instructor as ObjectId if provided (controller normally won't change instructor)
    if (data.instructor) {
      if (typeof data.instructor === 'object') {
        const maybeId =
          (data.instructor as any)._id ?? (data.instructor as any).id ?? data.instructor;
        if (maybeId && mongoose.Types.ObjectId.isValid(String(maybeId))) {
          updates.instructor = new mongoose.Types.ObjectId(String(maybeId));
        }
      } else if (
        typeof data.instructor === 'string' &&
        mongoose.Types.ObjectId.isValid(data.instructor)
      ) {
        updates.instructor = new mongoose.Types.ObjectId(data.instructor);
      }
    }

    const updated = await Course.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate({ path: 'instructor', select: 'fullName email' })
      .lean()
      .exec();

    const c: any = updated;
    if (!c) throw new Error('Failed to update course');

    const rawInstr = c.instructor;
    const returnedInstructor = rawInstr
      ? {
          id: String(rawInstr._id || rawInstr),
          name: rawInstr.fullName ?? 'Unknown Instructor',
          email: rawInstr.email ?? null,
        }
      : { id: null, name: c.instructor || 'Unknown Instructor', email: null };

    return { id: String(c._id), ...c, instructor: returnedInstructor };
  },

  async deleteCourse(id: string): Promise<void> {
    await Course.findByIdAndDelete(id).exec();
  },
};

export default courseService;
