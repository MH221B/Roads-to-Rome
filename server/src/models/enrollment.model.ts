import mongoose, { Schema, Document } from 'mongoose';

export interface IEnrollment extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: string;
  status?: string;
  progress?: number | null;
  lastLessonId?: string | null;
  completed?: boolean;
  rating?: number | null;
}

const EnrollmentSchema: Schema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // store course identifier as string (matches Course.courseId)
    courseId: { type: String, required: true },
    status: { type: String, default: 'enrolled' },
    // Progress tracking
    progress: { type: Number, default: null },
    lastLessonId: { type: String, default: null },
    completed: { type: Boolean, default: false },
    rating: { type: Number, default: null },
  },
  { timestamps: true }
);

const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;
