import Enrollment, { IEnrollment } from '../models/enrollment.model';

interface IEnrollmentService {
  //listEnrollmentsByUser(studentId: string): Promise<IEnrollment[]>;
  listEnrollments(): Promise<IEnrollment[]>;
  createEnrollment(studentId: string, courseId: string, status?: string): Promise<IEnrollment>;
  deleteEnrollment(enrollmentId: string): Promise<void>;
}

const enrollmentService: IEnrollmentService = {
  // async listEnrollmentsByUser(studentId: string): Promise<IEnrollment[]> {
  //   return (await Enrollment.find({ studentId }).sort({ createdAt: -1 }).lean().exec()) as unknown as IEnrollment[];
  // },
  async listEnrollments(): Promise<IEnrollment[]> {
    const data = await Enrollment.find()
      .populate({
        path: "courseId",
        populate: { path: "instructor", select: "name email" }
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return data.map((e: any) => ({
      ...e,
      course: e.courseId,    // rename so frontend receives: enrollment.course
    }));
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
