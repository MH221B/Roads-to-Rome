import mongoose, { Schema, Document } from 'mongoose';
import SubmitQuiz from './submitQuiz.model';

export interface IQuiz extends Document {
  id: string; // primary key
  lesson_id?: string; // foreign key to Lesson (optional)
  course_id: string; // foreign key to Course (required)
  title: string;
  description?: string;
  timelimit?: number; // in seconds
  questions: Array<{
    id: string;
    type: string;
    text: string;
    options?: string[];
    slotCount?: number;
    correctAnswers: string[];
  }>;
  order: number; // order of the quiz in the lesson
  created_at: Date;
  updated_at: Date;
}

const quizSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    lesson_id: { type: String, required: false },
    course_id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    timelimit: { type: Number }, // in seconds
    questions: [
      {
        _id: false,
        id: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: ['multiple', 'single', 'image', 'dragdrop'],
        },
        text: { type: String, required: true },
        options: [{ type: String }],
        slotCount: Number,
        correctAnswers: [{ type: String }],
      },
    ],

    order: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// Cascade delete SubmitQuiz records when a quiz is deleted
quizSchema.post('findOneAndDelete', async function (doc: any) {
  if (!doc) return;
  const quizId = doc.id;
  await SubmitQuiz.deleteMany({ quizId: quizId }).exec();
});

// For bulk deletions, cascade delete SubmitQuiz records
quizSchema.pre('deleteMany', { document: false, query: true }, async function (next) {
  try {
    const filter = this.getFilter();
    const quizDocs = await this.model.find(filter).select('id').lean().exec();
    const quizIds = (quizDocs || []).map((d: any) => d.id);
    if (quizIds.length > 0) {
      await SubmitQuiz.deleteMany({ quizId: { $in: quizIds } }).exec();
    }
  } catch (err) {
    return next(err as any);
  }
  next();
});

const quizModel = mongoose.model<IQuiz>('Quiz', quizSchema);

export default quizModel;
