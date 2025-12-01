import Enrollment, { IEnrollment } from '../models/enrollment.model';

interface IEnrollmentService {
  listEnrollments(): Promise<IEnrollment[]>;
  createEnrollment(studentId: string, courseId: string, status?: string): Promise<IEnrollment>;
  deleteEnrollment(enrollmentId: string): Promise<void>;
}

const enrollmentService: IEnrollmentService = {
  async listEnrollments(): Promise<IEnrollment[]> {
    return (await Enrollment.find().sort({ createdAt: -1 }).lean().exec()) as unknown as IEnrollment[];
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
