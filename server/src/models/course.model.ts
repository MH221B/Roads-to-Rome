import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
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

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
