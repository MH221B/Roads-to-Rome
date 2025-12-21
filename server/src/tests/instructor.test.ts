import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../models/user.model';
import Course from '../models/course.model';
import lessonModel from '../models/lesson.model';
import quizModel from '../models/quiz.model';
import Enrollment from '../models/enrollment.model';
import submitQuizModel from '../models/submitQuiz.model';
import Role from '../enums/user.enum';

describe('Instructor Routes', () => {
  let instructor: any;
  let student1: any;
  let student2: any;
  let instructorToken: string;

  beforeEach(async () => {
    // Clear DB
    await User.deleteMany({});
    await Course.deleteMany({});
    await lessonModel.deleteMany({});
    await quizModel.deleteMany({});
    await Enrollment.deleteMany({});
    await submitQuizModel.deleteMany({});

    // create users
    instructor = await User.create({
      email: 'instr@example.com',
      password: 'password',
      username: 'instr',
      fullName: 'Instructor',
      role: Role.INSTRUCTOR,
    });

    student1 = await User.create({
      email: 'student1@example.com',
      password: 'password',
      username: 's1',
      fullName: 'Student One',
      role: Role.STUDENT,
    });
    student2 = await User.create({
      email: 'student2@example.com',
      password: 'password',
      username: 's2',
      fullName: 'Student Two',
      role: Role.STUDENT,
    });

    instructorToken = jwt.sign(
      { userId: String(instructor._id), role: Role.INSTRUCTOR },
      process.env.ACCESS_TOKEN_SECRET || 'test-secret'
    );

    // create course
    await Course.create({
      courseId: 'course1',
      title: 'Instructor Course',
      instructor: instructor._id,
    });
    // create lesson
    await lessonModel.create({
      id: 'lesson1',
      course_id: 'course1',
      title: 'Lesson 1',
      content: 'Lesson 1 content',
      order: 1,
    });
    // create quiz
    await quizModel.create({
      id: 'quiz1',
      lesson_id: 'lesson1',
      course_id: 'course1',
      title: 'Quiz 1',
      questions: [
        { id: 'q1', type: 'single', text: '1+1?', options: ['1', '2'], correctAnswers: ['2'] },
      ],
      order: 1,
    });
    // enrollments and submissions
    await Enrollment.create({ studentId: student1._id, courseId: 'course1' });
    await Enrollment.create({ studentId: student2._id, courseId: 'course1' });
    // submissions - scores 8 and 6 (out of 10)
    await submitQuizModel.create({
      quizId: 'quiz1',
      userId: String(student1._id),
      answers: [{ questionId: 'q1', answer: '2' }],
      score: 8,
      duration: 10,
    });
    await submitQuizModel.create({
      quizId: 'quiz1',
      userId: String(student2._id),
      answers: [{ questionId: 'q1', answer: '1' }],
      score: 6,
      duration: 15,
    });
  });

  it('GET /api/instructor/insights returns expected overview and insights', async () => {
    const res = await request(app)
      .get('/api/instructor/insights')
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('overview');
    expect(res.body.overview).toHaveProperty('totalCourses', 1);
    expect(res.body.overview).toHaveProperty('totalQuizzes', 1);
    // average score should be (8+6)/2 -> 7 -> percent 70
    expect(res.body.overview).toHaveProperty('averageScore');
    expect(Number(res.body.overview.averageScore)).toBeCloseTo(70, 1);
    expect(res.body).toHaveProperty('insights');
    expect(Array.isArray(res.body.insights.CourseInsights)).toBe(true);
    expect(res.body.insights.CourseInsights[0]).toHaveProperty('courseId');
    expect(res.body.insights.CourseInsights[0]).toHaveProperty('enrollments', 2);
    expect(Array.isArray(res.body.insights.QuizInsights)).toBe(true);
    expect(res.body.insights.QuizInsights[0]).toHaveProperty('quizId');
    expect(res.body.insights.QuizInsights[0]).toHaveProperty('averageScore');
    expect(Number(res.body.insights.QuizInsights[0].averageScore)).toBeCloseTo(70, 1);
  });
});
