import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  thumbnail?: string;
  category?: string;
  tags: string[];
  instructor?: Types.ObjectId | null;
  shortDescription?: string;
  difficulty?: string | null;
}

const CourseSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    thumbnail: { type: String },
    category: { type: String },
    tags: { type: [String], default: [] },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    shortDescription: { type: String },
    difficulty: { type: String, default: null },
  },
  { timestamps: true }
);

// Create a text index for full-text search across title, shortDescription, and tags
CourseSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
