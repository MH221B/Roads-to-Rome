import mongoose, { Schema, Document } from 'mongoose';

export interface IQuiz extends Document {
  id: string; // Unique identifier for the quiz in a course
  title: string; // Title of the quiz
  description?: string; // Optional description of the quiz
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
  }>; // Array of questions in the quiz
  courseId: string; // Reference to the course this quiz belongs to
  createdAt: Date; // Timestamp of when the quiz was created
  updatedAt: Date; // Timestamp of when the quiz was last updated
}

export interface IQuizSubmission {
  quizId: string; // Reference to the quiz being submitted
  userId: string; // Reference to the user submitting the quiz
  answers: Array<{
    question: string;
    selectedOption: string;
  }>; // Array of answers provided by the user
  latestScore: number; // Score achieved in the quiz
  highestScore: number; // Maximum score user achieved
  submittedAt: Date; // Timestamp of when the quiz was submitted, latest submission only
}

const QuizSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: String, required: true },
      },
    ],
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  },
  { timestamps: true }
);

const QuizSubmissionSchema: Schema = new Schema({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [
    {
      question: { type: String, required: true },
      selectedOption: { type: String, required: true },
    },
  ],
  latestScore: { type: Number, required: true },
  highestScore: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
});

export const Quiz = mongoose.model<IQuiz>('Quiz', QuizSchema);
export const QuizSubmission = mongoose.model<IQuizSubmission>(
  'QuizSubmission',
  QuizSubmissionSchema
);
