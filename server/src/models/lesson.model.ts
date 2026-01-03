import mongoose, { Schema, Document } from 'mongoose';
import { LessonType } from '../enums/lesson.enum';
import Quiz from './quiz.model';
import Enrollment from './enrollment.model';

export interface ILesson extends Document {
  id: string; // primary key
  course_id: string; // foreign key to Course
  title: string;
  lessonType?: LessonType;
  content: string; // HTML content
  video?: string; // URL to video file (optional)
  duration?: number; // in seconds, applicable for video
  order: number; // order of the lesson in the course
  attachments?: string[]; // array of attachment URLs
  created_at: Date;
  updated_at: Date;
}

const LessonSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  course_id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  video: { type: String }, // URL to video file (optional)
  lessonType: { type: String, enum: Object.values(LessonType) },
  duration: { type: Number },
  order: { type: Number, required: true },
  attachments: [{ type: String }], // array of attachment URLs
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// When a single Lesson document is removed, cascade the deletion to related Quiz documents
// and clean up references in Enrollment documents.
LessonSchema.post('findOneAndDelete', async function (doc: any) {
  if (!doc) return;
  const lessonId = doc.id;
  await Promise.all([
    Quiz.deleteMany({ lesson_id: lessonId }).exec(),
    Enrollment.updateMany({ lastLessonId: lessonId }, { $set: { lastLessonId: null } }).exec(),
    Enrollment.updateMany(
      { completedLessons: lessonId },
      { $pull: { completedLessons: lessonId } }
    ).exec(),
  ]);
});

// For bulk deletions (deleteMany), find affected lesson ids first and remove related docs.
LessonSchema.pre('deleteMany', { document: false, query: true }, async function (next) {
  try {
    const filter = this.getFilter();
    const lessonDocs = await this.model.find(filter).select('id').lean().exec();
    const lessonIds = (lessonDocs || []).map((d: any) => d.id);
    if (lessonIds.length > 0) {
      await Promise.all([
        Quiz.deleteMany({ lesson_id: { $in: lessonIds } }).exec(),
        Enrollment.updateMany(
          { lastLessonId: { $in: lessonIds } },
          { $set: { lastLessonId: null } }
        ).exec(),
        Enrollment.updateMany(
          { completedLessons: { $in: lessonIds } },
          { $pullAll: { completedLessons: lessonIds } }
        ).exec(),
      ]);
    }
  } catch (err) {
    return next(err as any);
  }
  next();
});

export default mongoose.model<ILesson>('Lesson', LessonSchema);
