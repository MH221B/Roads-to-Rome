import mongoose from 'mongoose';
import Enrollment from '../models/enrollment.model';

interface IEnrollmentService {
  listEnrollmentsByUser(studentId: string): Promise<any[]>;
  createEnrollment(studentId: string, courseId: string, status?: string): Promise<any>;
  updateEnrollment(enrollmentId: string, updates: Partial<any>): Promise<any>;
  deleteEnrollment(enrollmentId: string): Promise<void>;
}

function mapEnrollment(e: any) {
  const { _id, courseId, studentId, progress, lastLessonId, completed, rating, updatedAt, createdAt, status, ...rest } = e || {};
  let course = null;
  if (courseId) {
    const { _id: courseObjId, ...courseRest } = courseId as any;
    course = { id: String(courseObjId), ...courseRest };
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
    const raw = await Enrollment.find({ studentId })
      .populate({
        path: 'courseId',
        populate: { path: 'instructor', select: 'name email' },
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return raw.map(mapEnrollment);
  },

  async createEnrollment(studentId: string, courseId: string, status = 'enrolled'): Promise<any> {
    // normalize courseId to ObjectId when possible
    let courseIdToUse: any = courseId;
    if (mongoose.Types.ObjectId.isValid(courseId)) courseIdToUse = new mongoose.Types.ObjectId(courseId);

    // Prevent duplicate enrollment for same student and course
    const existing = await Enrollment.findOne({ studentId, courseId: courseIdToUse }).exec();
    if (existing) {
      // populate and return mapped existing
      const pop = await Enrollment.findById(existing._id).populate({ path: 'courseId', populate: { path: 'instructor', select: 'name email' } }).lean().exec();
      return mapEnrollment(pop);
    }

    const created = await Enrollment.create({ studentId, courseId: courseIdToUse, status, progress: 0, lastLessonId: null, completed: false, rating: null });

    const populated = await Enrollment.findById(created._id).populate({ path: 'courseId', populate: { path: 'instructor', select: 'name email' } }).lean().exec();
    return mapEnrollment(populated);
  },

  async updateEnrollment(enrollmentId: string, updates: Partial<any>): Promise<any> {
    const allowed: any = {};
    if (typeof updates.progress !== 'undefined') allowed.progress = updates.progress;
    if (typeof updates.last_lesson_id !== 'undefined') allowed.lastLessonId = updates.last_lesson_id;
    if (typeof updates.completed !== 'undefined') allowed.completed = updates.completed;
    if (typeof updates.rating !== 'undefined') allowed.rating = updates.rating;

    const updated = await Enrollment.findByIdAndUpdate(enrollmentId, allowed, { new: true }).populate({ path: 'courseId', populate: { path: 'instructor', select: 'name email' } }).lean().exec();
    if (!updated) throw new Error('Enrollment not found');
    return mapEnrollment(updated);
  },

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await Enrollment.findByIdAndDelete(enrollmentId).exec();
  },
};

export default enrollmentService;
