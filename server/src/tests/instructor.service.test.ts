import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Course from '../models/course.model';
import { Quiz, QuizSubmission } from '../models/quiz.model';
import instructorService from '../services/instructor.service';

describe('instructorService.fetchInsightsByInstructorId', () => {
  it('returns quiz insights with totalQuestions when quizzes have questions', async () => {
    const instructorId = new mongoose.Types.ObjectId();
    const course = await Course.create({ title: 'Test Course', instructor: instructorId });
    const quiz = await Quiz.create({
      title: 'Javascript fundamental',
      courseId: course._id,
      questions: [
        { question: 'q1', options: ['a', 'b'], correctAnswer: 'a' },
        { question: 'q2', options: ['a', 'b'], correctAnswer: 'a' },
      ],
    });

    // Create a quiz submission so averageScore map has a value
    await QuizSubmission.create({
      quizId: quiz._id,
      userId: new mongoose.Types.ObjectId(),
      answers: [
        { question: 'q1', selectedOption: 'a' },
        { question: 'q2', selectedOption: 'a' },
      ],
      latestScore: 2,
      highestScore: 2,
    });

    const result = await instructorService.fetchInsightsByInstructorId(instructorId.toString());
    const quizInsight = result.insights.QuizInsights.find((q) => q.quizId === quiz._id.toString());
    expect(quizInsight).toBeDefined();
    expect(quizInsight!.totalQuestions).toBe(2);
    expect(quizInsight!.averageScore).toBeGreaterThanOrEqual(0);

    // Overview average should be 100% for this single perfect submission
    expect(result.overview.averageScore).toBe(100);
  });
});
