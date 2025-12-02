import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  courseId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  rating: number;
  content: string;
}

const CommentSchema: Schema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    rating: { type: Number, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Comment = mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
