import mongoose, { Schema, Document } from 'mongoose';
import { LessonType } from '../enums/lesson.enum';

export interface ILesson extends Document {
  id: string; // primary key
  course_id: string; // foreign key to Course
  title: string;
  lessonType?: LessonType;
  content_type: string; // 'html', 'video', 'article', 'quiz'
  content: string; // URL or HTML content
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
  content_type: { type: String, required: true }, // 'html', 'video', 'article', 'quiz'
  lessonType: { type: String, enum: Object.values(LessonType) },
  content: { type: String, required: true },
  duration: { type: Number },
  order: { type: Number, required: true },
  attachments: [{ type: String }], // array of attachment URLs
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<ILesson>('Lesson', LessonSchema);
