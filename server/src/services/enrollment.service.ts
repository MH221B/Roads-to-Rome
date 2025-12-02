import Enrollment, { IEnrollment } from '../models/enrollment.model';

interface IEnrollmentService {
  listEnrollmentsByUser(studentId: string): Promise<IEnrollment[]>;
  createEnrollment(studentId: string, courseId: string, status?: string): Promise<IEnrollment>;
  deleteEnrollment(enrollmentId: string): Promise<void>;
}

const enrollmentService: IEnrollmentService = {
  async listEnrollmentsByUser(studentId: string): Promise<IEnrollment[]> {
    const raw = await Enrollment.find({ studentId })
      .populate({
        path: "courseId",
        populate: { path: "instructor", select: "name email" }
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return raw.map((e: any) => {
      const { _id, courseId, ...rest } = e || {};
      let course = null;
      if (courseId) {
        const { _id: courseObjId, ...courseRest } = courseId as any;
        course = { id: String(courseObjId), ...courseRest };
      }
      return { id: String(_id), ...rest, course } as unknown as IEnrollment;
    });
  },

  async createEnrollment(studentId: string, courseId: string, status = 'enrolled'): Promise<IEnrollment> {
    // Prevent duplicate enrollment for same student and course
    const existing = await Enrollment.findOne({ studentId, courseId }).exec();
    if (existing) return existing as IEnrollment;

    const created = await Enrollment.create({ studentId, courseId, status });
    return created as IEnrollment;
  },

  async deleteEnrollment(enrollmentId: string): Promise<void> {
    await Enrollment.findByIdAndDelete(enrollmentId).exec();
  },
};

export default enrollmentService;
