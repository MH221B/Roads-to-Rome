import mongoose, { Schema, Document } from 'mongoose';
import { LessonType, ContentType } from '../enums/lesson.enum';

export interface ILesson extends Document {
  id: string; // primary key
  course_id: string; // foreign key to Course
  title: string;
  lessonType?: LessonType;
  contentType: ContentType;
  content: string; // URL or text content
  duration?: number; // in seconds, applicable for video
  order: number; // order of the lesson in the course
  created_at: Date;
  updated_at: Date;
}

const LessonSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  course_id: { type: String, required: true },
  title: { type: String, required: true },
  contentType: { type: String, enum: Object.values(ContentType), required: true },
  lessonType: { type: String, enum: Object.values(LessonType) },
  content: { type: String, required: true },
  duration: { type: Number },
  order: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<ILesson>('Lesson', LessonSchema);