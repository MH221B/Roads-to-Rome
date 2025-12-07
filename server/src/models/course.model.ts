import mongoose, { Schema, Document, Types } from 'mongoose';
import Lesson from './lesson.model';
import Comment from './comment.model';

export interface ICourse extends Document {
  id: string; // primary key
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
    id: { type: String, required: true, unique: true },
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
  const objectId = doc._id;
  const customId = (doc.id ?? doc.courseId) ?? null;
  const lessonFilters: any[] = [{ course_id: String(objectId) }];
  const commentFilters: any[] = [{ courseId: objectId }];
  if (customId) {
    lessonFilters.push({ course_id: String(customId) });
    commentFilters.push({ courseId: customId });
  }
  await Promise.all([
    Lesson.deleteMany({ $or: lessonFilters }).exec(),
    Comment.deleteMany({ $or: commentFilters }).exec(),
  ]);
});

// For bulk deletions (deleteMany), find affected course ids first and remove related docs.
CourseSchema.pre('deleteMany', { document: false, query: true }, async function (next) {
  try {
    const filter = this.getFilter();
    const courseDocs = await this.model.find(filter).select('_id id courseId').lean().exec();
    const objectIds = (courseDocs || []).map((d: any) => d._id).filter(Boolean);
    const customIds = (courseDocs || []).map((d: any) => d.id ?? d.courseId).filter(Boolean);
    const lessonIdSet = [...objectIds.map(String), ...customIds.map(String)];
    const commentIdSet = [...objectIds, ...customIds];
    if (lessonIdSet.length > 0) {
      await Lesson.deleteMany({ course_id: { $in: lessonIdSet } }).exec();
    }
    if (commentIdSet.length > 0) {
      await Comment.deleteMany({ courseId: { $in: commentIdSet } }).exec();
    }
  } catch (err) {
    return next(err as any);
  }
  next();
});

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
