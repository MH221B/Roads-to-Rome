import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model';
import Course from '../models/course.model';

interface IEnrollmentService {
  listEnrollmentsByUser(studentId: string): Promise<any[]>;
  createEnrollment(studentId: string, courseId: string, status?: string): Promise<any>;
  updateEnrollment(enrollmentId: string, updates: Partial<any>): Promise<any>;
  deleteEnrollment(enrollmentId: string): Promise<void>;
  checkUserEnrollmentInCourse(userId: string, courseId: string): Promise<boolean>;
}

function mapEnrollment(e: any, courseObj?: any) {
  const { _id, courseId, studentId, progress, lastLessonId, completed, rating, updatedAt, createdAt, status, ...rest } = e || {};
  let course = null;
  if (courseObj) {
    course = { id: courseObj.courseId || String(courseObj._id), ...courseObj };
  } else if (courseId) {
    course = { id: String(courseId) };
  }

  return {
    id: String(_id),
    user_id: studentId ? String(studentId) : null,
    course_id: course ? String((course as any).id) : null,
    course,
    progress: typeof progress === 'number' ? progress : null,
    last_lesson_id: lastLessonId || null,
    completed: !!completed,
    rating: rating ?? null,
    updated_at: updatedAt ? new Date(updatedAt).toISOString() : null,
    created_at: createdAt ? new Date(createdAt).toISOString() : null,
    status: status || 'enrolled',
    ...rest,
  };
}

const enrollmentService: IEnrollmentService = {
  async listEnrollmentsByUser(studentId: string): Promise<any[]> {
    const raw = await Enrollment.find({ studentId }).sort({ createdAt: -1 }).lean().exec();

    // batch fetch course documents for enrichment
    const courseIds = Array.from(new Set((raw || []).map((r: any) => r.courseId).filter(Boolean)));
    const courses = courseIds.length ? await Course.find({ courseId: { $in: courseIds } }).lean().exec() : [];
    const courseMap: Record<string, any> = {};
    (courses || []).forEach((c: any) => { if (c && c.courseId) courseMap[String(c.courseId)] = c; });

    return raw.map((r: any) => mapEnrollment(r, courseMap[String(r.courseId)]));
  },

  async createEnrollment(studentId: string, courseId: string, status = 'enrolled'): Promise<any> {
    // store courseId as string; prevent duplicate enrollments
    const existing = await Enrollment.findOne({ studentId, courseId }).lean().exec();
    if (existing) {
      const course = await Course.findOne({ courseId: existing.courseId }).lean().exec();
      return mapEnrollment(existing, course);
    }

    const created = await Enrollment.create({ studentId, courseId, status, progress: 0, lastLessonId: null, completed: false, rating: null });
    const populated = await Enrollment.findById(created._id).lean().exec();
    const course = await Course.findOne({ courseId }).lean().exec();
    return mapEnrollment(populated, course);
  },

  async updateEnrollment(enrollmentId: string, updates: Partial<any>): Promise<any> {
    const allowed: any = {};
    if (typeof updates.progress !== 'undefined') allowed.progress = updates.progress;
    if (typeof updates.last_lesson_id !== 'undefined') allowed.lastLessonId = updates.last_lesson_id;
    if (typeof updates.completed !== 'undefined') allowed.completed = updates.completed;
    if (typeof updates.rating !== 'undefined') allowed.rating = updates.rating;

    const updated = await Enrollment.findByIdAndUpdate(enrollmentId, allowed, { new: true }).lean().exec();
    if (!updated) throw new Error('Enrollment not found');
    const course = updated.courseId ? await Course.findOne({ courseId: updated.courseId }).lean().exec() : null;
    return mapEnrollment(updated, course);
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
