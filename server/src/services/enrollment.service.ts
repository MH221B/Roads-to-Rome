import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model';
import Course from '../models/course.model';
import Comment from '../models/comment.model';
import Lesson from '../models/lesson.model';
import { User } from '../models/user.model';

interface IEnrollmentService {
  listEnrollmentsByUser(studentId: string): Promise<any[]>;
  createEnrollment(studentId: string, courseId: string, status?: string): Promise<any>;
  updateEnrollment(enrollmentId: string, updates: Partial<any>): Promise<any>;
  deleteEnrollment(enrollmentId: string): Promise<void>;
  checkUserEnrollmentInCourse(userId: string, courseId: string): Promise<boolean>;
  updateProgressByLesson(userId: string, courseId: string, lessonId: string): Promise<any>;
}

type RatingMap = Record<string, { avg: number | null; count: number }>;

function mapEnrollment(e: any, courseObj?: any, ratingMap?: RatingMap) {
  const {
    _id,
    courseId,
    studentId,
    progress,
    lastLessonId,
    completed,
    completedLessons,
    updatedAt,
    createdAt,
    status,
    ...rest
  } = e || {};

  let course = null;
  let courseRating: number | null = null;
  if (courseObj) {
    const resolvedId = courseObj.courseId || (courseObj._id ? String(courseObj._id) : null);
    const courseKey = resolvedId || String(courseId);
    courseRating = courseKey && ratingMap ? ratingMap[courseKey]?.avg ?? null : null;

    // normalize instructor so clients can display name/email even when backend only stores id
    let instructor = courseObj.instructor;
    if (instructor && typeof instructor === 'object') {
      const instId = (instructor as any)._id || (instructor as any).id || instructor;
      instructor = {
        id: instId ? String(instId) : null,
        name:
          (instructor as any).fullName ||
          (instructor as any).name ||
          (instructor as any).username ||
          (instructor as any).email ||
          (instId ? String(instId) : null),
        email: (instructor as any).email || null,
      };
    }

    // avoid mutating original course object; clone and prefer name/title when present
    course = {
      ...courseObj,
      id: resolvedId || String(courseId),
      title: courseObj.title || courseObj.name || courseObj.courseName || courseObj.shortTitle,
      name: courseObj.name || courseObj.title,
      instructor,
      rating: courseRating,
    };
  } else if (courseId) {
    course = { id: String(courseId) };
    courseRating = ratingMap ? ratingMap[String(courseId)]?.avg ?? null : null;
  }

  return {
    id: String(_id),
    user_id: studentId ? String(studentId) : null,
    course_id: course ? String((course as any).id) : null,
    course,
    progress: typeof progress === 'number' ? progress : null,
    last_lesson_id: lastLessonId || null,
    completed: !!completed,
    completed_lessons: Array.isArray(completedLessons) ? completedLessons.map(String) : [],
    rating: courseRating,
    updated_at: updatedAt ? new Date(updatedAt).toISOString() : null,
    created_at: createdAt ? new Date(createdAt).toISOString() : null,
    status: status || 'enrolled',
    ...rest,
  };
}

const enrollmentService: IEnrollmentService = {
  async listEnrollmentsByUser(studentId: string): Promise<any[]> {
    const raw = await Enrollment.find({ studentId }).sort({ createdAt: -1 }).lean().exec();

    // batch fetch course documents for enrichment (supports courseId or _id stored in enrollment)
    const courseIds = Array.from(new Set((raw || []).map((r: any) => r.courseId).filter(Boolean)));
    const objectIds = courseIds
      .filter((id: string) => mongoose.Types.ObjectId.isValid(String(id)))
      .map((id: string) => new mongoose.Types.ObjectId(String(id)));

    const courses = courseIds.length
      ? await Course.find({
          $or: [
            { courseId: { $in: courseIds } },
            objectIds.length ? { _id: { $in: objectIds } } : undefined,
          ].filter(Boolean) as any,
        })
          .populate('instructor', 'fullName name email username')
          .lean()
          .exec()
      : [];

    // aggregate course ratings from comments
    const ratingAgg = courseIds.length
      ? await Comment.aggregate([
          { $match: { courseId: { $in: courseIds } } },
          {
            $group: {
              _id: '$courseId',
              avg: { $avg: '$rating' },
              count: { $sum: 1 },
            },
          },
        ])
      : [];
    const ratingMap: RatingMap = {};
    (ratingAgg || []).forEach((r: any) => {
      ratingMap[String(r._id)] = {
        avg: typeof r.avg === 'number' ? Number(r.avg) : null,
        count: r.count || 0,
      };
    });

    const courseMap: Record<string, any> = {};
    (courses || []).forEach((c: any) => {
      const courseIdKey = c?.courseId ? String(c.courseId) : null;
      const objectIdKey = c?._id ? String(c._id) : null;
      if (courseIdKey) courseMap[courseIdKey] = c;
      if (objectIdKey) courseMap[objectIdKey] = c;
    });

    return raw.map((r: any) => mapEnrollment(r, courseMap[String(r.courseId)], ratingMap));
  },

  async createEnrollment(studentId: string, courseId: string, status = 'enrolled'): Promise<any> {
    // resolve the canonical course identifier (courseId field if present, otherwise _id)
    const foundCourse = await Course.findOne({
      $or: [
        { courseId },
        mongoose.Types.ObjectId.isValid(String(courseId)) ? { _id: courseId } : undefined,
      ].filter(Boolean) as any,
    })
      .lean()
      .exec();

    if (!foundCourse) {
      throw new Error('Course not found');
    }

    const canonicalCourseId = foundCourse.courseId || String(foundCourse._id);
    const coursePrice = (() => {
      const raw = (foundCourse as any).price;
      const num = typeof raw === 'number' ? raw : Number(raw ?? 0);
      return Number.isFinite(num) && num >= 0 ? num : 0;
    })();

    // store courseId as string; prevent duplicate enrollments
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const existing = await Enrollment.findOne({ studentId, courseId: canonicalCourseId })
        .session(session)
        .lean()
        .exec();
      if (existing) {
        await session.abortTransaction();
        return mapEnrollment(existing, foundCourse);
      }

      const user = await User.findById(studentId).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      const currentBudget = typeof (user as any).budget === 'number' ? (user as any).budget : 0;
      if (currentBudget < coursePrice) {
        throw new Error('Insufficient budget');
      }

      user.set({ budget: currentBudget - coursePrice });
      await user.save({ session });

      const createdDocs = await Enrollment.create(
        [
          {
            studentId,
            courseId: canonicalCourseId,
            status,
            progress: 0,
            lastLessonId: null,
            completed: false,
            completedLessons: [],
          },
        ],
        { session }
      );

      const created = createdDocs[0];
      await session.commitTransaction();
      const populated = await Enrollment.findById(created._id).lean().exec();

      // fetch latest rating for this course
      const ratingAgg = await Comment.aggregate([
        { $match: { courseId: canonicalCourseId } },
        {
          $group: {
            _id: '$courseId',
            avg: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);
      const ratingMap: RatingMap = ratingAgg.length
        ? {
            [canonicalCourseId]: {
              avg: typeof ratingAgg[0].avg === 'number' ? Number(ratingAgg[0].avg) : null,
              count: ratingAgg[0].count || 0,
            },
          }
        : {};

      return mapEnrollment(populated, foundCourse, ratingMap);
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
    }
  },

  async updateEnrollment(enrollmentId: string, updates: Partial<any>): Promise<any> {
    const allowed: any = {};
    if (typeof updates.progress !== 'undefined') allowed.progress = updates.progress;
    if (typeof updates.last_lesson_id !== 'undefined') allowed.lastLessonId = updates.last_lesson_id;
    if (typeof updates.completed !== 'undefined') allowed.completed = updates.completed;
    const updated = await Enrollment.findByIdAndUpdate(enrollmentId, allowed, { new: true }).lean().exec();
    if (!updated) throw new Error('Enrollment not found');

    const course = updated.courseId
      ? await Course.findOne({
          $or: [
            { courseId: updated.courseId },
            mongoose.Types.ObjectId.isValid(String(updated.courseId)) ? { _id: updated.courseId } : undefined,
          ].filter(Boolean) as any,
        })
          .lean()
          .exec()
      : null;

    // compute rating for this single course
    const ratingAgg = updated.courseId
      ? await Comment.aggregate([
          { $match: { courseId: String(updated.courseId) } },
          {
            $group: {
              _id: '$courseId',
              avg: { $avg: '$rating' },
              count: { $sum: 1 },
            },
          },
        ])
      : [];
    const ratingMap: RatingMap = ratingAgg.length
      ? {
          [String(updated.courseId)]: {
            avg: typeof ratingAgg[0].avg === 'number' ? Number(ratingAgg[0].avg) : null,
            count: ratingAgg[0].count || 0,
          },
        }
      : {};

    return mapEnrollment(updated, course, ratingMap);
  },

  async updateProgressByLesson(userId: string, courseId: string, lessonId: string): Promise<any> {
    // resolve canonical course id
    const foundCourse = await Course.findOne({
      $or: [
        { courseId },
        mongoose.Types.ObjectId.isValid(String(courseId)) ? { _id: courseId } : undefined,
      ].filter(Boolean) as any,
    })
      .lean()
      .exec();

    if (!foundCourse) throw new Error('Course not found');
    const canonicalCourseId = foundCourse.courseId || String(foundCourse._id);

    // ensure enrollment exists for this user/course
    const enrollment = await Enrollment.findOne({ studentId: userId, courseId: canonicalCourseId })
      .lean()
      .exec();
    if (!enrollment) throw new Error('Enrollment not found for this course');

    // find the lesson and its position
    const lesson = await Lesson.findOne({ course_id: canonicalCourseId, id: lessonId }).lean().exec();
    if (!lesson) throw new Error('Lesson not found in this course');

    const totalLessons = await Lesson.countDocuments({ course_id: canonicalCourseId });

    const completedSet = new Set<string>(
      Array.isArray(enrollment.completedLessons) ? enrollment.completedLessons.map(String) : []
    );
    completedSet.add(String(lessonId));

    const completedCount = completedSet.size;
    const progressFromLessons = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    const nextProgress = Math.min(100, progressFromLessons);
    const completed = totalLessons > 0 && completedCount >= totalLessons && nextProgress >= 100;

    const updated = await Enrollment.findByIdAndUpdate(
      enrollment._id,
      { $set: { progress: nextProgress, lastLessonId: lessonId, completed, completedLessons: Array.from(completedSet) } },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) throw new Error('Failed to update enrollment');

    // compute rating for the course
    const ratingAgg = await Comment.aggregate([
      { $match: { courseId: canonicalCourseId } },
      {
        $group: {
          _id: '$courseId',
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);
    const ratingMap: RatingMap = ratingAgg.length
      ? {
          [canonicalCourseId]: {
            avg: typeof ratingAgg[0].avg === 'number' ? Number(ratingAgg[0].avg) : null,
            count: ratingAgg[0].count || 0,
          },
        }
      : {};

    return mapEnrollment(updated, foundCourse, ratingMap);
  },

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await Enrollment.findByIdAndDelete(enrollmentId).exec();
  },
  async checkUserEnrollmentInCourse(userId: string, courseId: string): Promise<boolean> {
    // studentId là ObjectId tham chiếu đến User

    const enrollment = await Enrollment.findOne({ studentId: new mongoose.Types.ObjectId(userId), courseId }).lean().exec();
    return enrollment !== null;
  }
};

export default enrollmentService;
