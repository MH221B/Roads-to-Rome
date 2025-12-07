import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmitQuiz extends Document {
    quizId: string; // ID of the quiz being submitted
    userId: string; // ID of the user submitting the quiz
    answers: Array<{
        questionId: string; // ID of the question
        answer: Array <{}> | string; // User's answer, can be an array (for drag-drop) or string
    }>;
    score: number; // Score achieved in the quiz
    duration: number; // Duration taken to complete the quiz
    submittedAt: Date; // Timestamp of when the quiz was submitted
}

const SubmitQuizSchema: Schema = new Schema({
    quizId: { type: String, required: true },
    userId: { type: String, required: true },
    answers: [{
        questionId: { type: String, required: true },
        answer: { type: Schema.Types.Mixed, required: true } // can store array or string
    }],
    score: { type: Number, required: true },
    duration: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISubmitQuiz>('SubmitQuiz', SubmitQuizSchema);