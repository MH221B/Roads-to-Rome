import mongoose, { Schema, Document, Types } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import Lesson from './lesson.model';
import Comment from './comment.model';
import Enrollment from './enrollment.model';
import Quiz from './quiz.model';
import { CourseStatus } from '../enums/course.enum';

export interface ICourse extends Document {
  courseId: string;
  title: string;
  thumbnail?: string;
  category?: string;
  tags: string[];
  instructor?: Types.ObjectId | null;
  shortDescription?: string;
  difficulty?: string | null;
  is_premium?: boolean;
  price?: number;
  status: CourseStatus;
  reviewNote?: string | null; // admin ghi chú
  reviewedBy?: Types.ObjectId | null; // admin id
  reviewedAt?: Date | null;
}

const CourseSchema: Schema = new Schema(
  {
    courseId: { type: String, required: false, unique: true },
    title: { type: String, required: true },
    thumbnail: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    shortDescription: { type: String },
    difficulty: { type: String, default: null },
    is_premium: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(CourseStatus),
      default: CourseStatus.DRAFT,
      required: true,
    },
    reviewNote: { type: String, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Create a text index for full-text search across title, shortDescription, and tags
CourseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });

// When a single Course document is removed (e.g. via `findByIdAndDelete` / `findOneAndDelete`),
// cascade the deletion to related Lesson, Comment, Enrollment, and Quiz documents.
CourseSchema.post('findOneAndDelete', async function (doc: any) {
  if (!doc) return;
  const courseId = doc._id;
  const courseIdStr = String(courseId);
  await Promise.all([
    Lesson.deleteMany({ course_id: courseIdStr }).exec(),
    Comment.deleteMany({ courseId: courseId }).exec(),
    Enrollment.deleteMany({ courseId: courseIdStr }).exec(),
    Quiz.deleteMany({ course_id: courseIdStr }).exec(),
  ]);
});

// For bulk deletions (deleteMany), find affected course ids first and remove related docs.
CourseSchema.pre('deleteMany', { document: false, query: true }, async function (next) {
  try {
    const filter = this.getFilter();
    const courseDocs = await this.model.find(filter).select('_id').lean().exec();
    const ids = (courseDocs || []).map((d: any) => d._id);
    const idStrs = ids.map(String);
    if (ids.length > 0) {
      await Promise.all([
        Lesson.deleteMany({ course_id: { $in: idStrs } }).exec(),
        Comment.deleteMany({ courseId: { $in: ids } }).exec(),
        Enrollment.deleteMany({ courseId: { $in: idStrs } }).exec(),
        Quiz.deleteMany({ course_id: { $in: idStrs } }).exec(),
      ]);
    }
  } catch (err) {
    return next(err as any);
  }
  next();
});

// Apply the paginate plugin to the schema
CourseSchema.plugin(paginate);

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
