import mongoose, { Schema, Document, Types } from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import Lesson from './lesson.model';
import Comment from './comment.model';

export interface ICourse extends Document {
  courseId: string; // primary key
  title: string;
  thumbnail?: string;
  category?: string;
  tags: string[];
  instructor?: Types.ObjectId | null;
  shortDescription?: string;
  difficulty?: string | null;
  is_premium?: boolean;
  status?: string;
}

const CourseSchema: Schema = new Schema(
  {
    courseId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    thumbnail: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    shortDescription: { type: String },
    difficulty: { type: String, default: null },
    is_premium: { type: Boolean, default: false },
    status: { type: String, default: 'published' },
  },
  { timestamps: true }
);

// Create a text index for full-text search across title, shortDescription, and tags
CourseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });

// When a single Course document is removed (e.g. via `findByIdAndDelete` / `findOneAndDelete`),
// cascade the deletion to related Lesson and Comment documents.
CourseSchema.post('findOneAndDelete', async function (doc: any) {
  if (!doc) return;
  const courseId = doc._id;
  await Promise.all([
    Lesson.deleteMany({ course_id: String(courseId) }).exec(),
    Comment.deleteMany({ courseId: courseId }).exec(),
  ]);
});

// For bulk deletions (deleteMany), find affected course ids first and remove related docs.
CourseSchema.pre('deleteMany', { document: false, query: true }, async function (next) {
  try {
    const filter = this.getFilter();
    const courseDocs = await this.model.find(filter).select('_id').lean().exec();
    const ids = (courseDocs || []).map((d: any) => d._id);
    if (ids.length > 0) {
      await Lesson.deleteMany({ course_id: { $in: ids.map(String) } }).exec();
      await Comment.deleteMany({ courseId: { $in: ids } }).exec();
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
