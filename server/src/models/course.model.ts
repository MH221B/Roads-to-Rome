import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  courseId: string; // primary key
  title: string;
  thumbnail?: string;
  category?: string;
  tags: string[];
  instructor?: string;
  shortDescription?: string;
  difficulty?: string | null;
}

const CourseSchema: Schema = new Schema(
  {
    courseId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    thumbnail: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    instructor: { type: String },
    shortDescription: { type: String },
    difficulty: { type: String, default: null },
  },
  { timestamps: true }
);

// Create a text index for full-text search across title, shortDescription, and tags
CourseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
