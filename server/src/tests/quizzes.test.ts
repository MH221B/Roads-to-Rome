import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import quizModel from '../models/quiz.model';
import lessonModel from '../models/lesson.model';
import Course from '../models/course.model';
import Enrollment from '../models/enrollment.model';
import { User } from '../models/user.model';
import Role from '../enums/user.enum';

const instructorData = {
  email: 'instructor@example.com',
  password: 'password',
  username: 'instructor',
  fullName: 'Instructor',
  role: Role.INSTRUCTOR,
};

const studentData = {
  email: 'student@example.com',
  password: 'password',
  username: 'student',
  fullName: 'Student',
  role: Role.STUDENT,
};

describe('Quiz Routes', () => {
  let instructor: any;
  let student: any;
  let authTokenStudent: string;
  let authTokenInstructor: string;

  beforeEach(async () => {
    await quizModel.deleteMany({});
    await lessonModel.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await User.deleteMany({});

    instructor = await User.create(instructorData);
    student = await User.create(studentData);

    // jwt token for student
    const secret = process.env.ACCESS_TOKEN_SECRET || 'test-secret';
    authTokenStudent = jwt.sign({ userId: String(student._id), role: Role.STUDENT }, secret, {
      expiresIn: '1h',
    });

    // jwt token for instructor
    authTokenInstructor = jwt.sign({ userId: String(instructor._id), role: Role.INSTRUCTOR }, secret, {
      expiresIn: '1h',
    });

    // create course and lesson
    const course = await Course.create({
      courseId: 'course1',
      title: 'Test Course',
      instructor: instructor._id,
    });
    await lessonModel.create({
      id: 'lesson1',
      course_id: 'course1',
      title: 'Lesson 1',
      content: 'quiz content',
      order: 1,
    });

    // create a quiz for the lesson
    await quizModel.create({
      id: 'quiz1',
      lesson_id: 'lesson1',
      course_id: 'course1',
      title: 'Sample Quiz',
      questions: [
        {
          id: 'q1',
          type: 'single',
          text: 'What is 2+2?',
          options: ['2', '3', '4'],
          correctAnswers: ['4'],
        },
      ],
      order: 1,
    });

    // enroll student to course
    await Enrollment.create({ studentId: student._id, courseId: 'course1' });
  });

  it('GET /api/quizzes returns all quizzes', async () => {
    const res = await request(app)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${authTokenInstructor}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/quizzes/:quizId returns a quiz', async () => {
    const res = await request(app)
      .get('/api/quiz/quiz1')
      .set('Authorization', `Bearer ${authTokenStudent}`)
      .expect(200);
    expect(res.body).toHaveProperty('id', 'quiz1');
    expect(res.body).toHaveProperty('title', 'Sample Quiz');
  });

  it('POST /api/quizzes creates a quiz', async () => {
    const payload = {
      id: 'quiz2',
      lesson_id: 'lesson1',
      course_id: 'course1',
      title: 'New Quiz',
      questions: [
        { id: 'q2', type: 'single', text: 'Pick one', options: ['a', 'b'], correctAnswers: ['a'] },
      ],
      order: 2,
    };
    const res = await request(app)
      .post('/api/quiz')
      .set('Authorization', `Bearer ${authTokenInstructor}`)
      .send(payload)
      .expect(201);
    expect(res.body).toHaveProperty('id', 'quiz2');
    expect(res.body).toHaveProperty('title', 'New Quiz');
  });

  it('PUT /api/quizzes/:id updates a quiz', async () => {
    const created = await quizModel.create({
      id: 'quizUpdate',
      lesson_id: 'lesson1',
      course_id: 'course1',
      title: 'Old Title',
      questions: [{ id: 'q1', type: 'single', text: 't', correctAnswers: ['a'] }],
      order: 3,
    });
    const res = await request(app)
      .put(`/api/quiz/${created._id}`)
      .set('Authorization', `Bearer ${authTokenInstructor}`)
      .send({ title: 'New Title' })
      .expect(200);
    expect(res.body).toHaveProperty('id', 'quizUpdate');
    expect(res.body).toHaveProperty('title', 'New Title');
  });

  it('PUT /api/quizzes/:id updates a quiz by `id` property value', async () => {
    const created = await quizModel.create({
      id: 'quizById',
      lesson_id: 'lesson1',
      course_id: 'course1',
      title: 'Old Title By Id',
      questions: [{ id: 'q1', type: 'single', text: 't', correctAnswers: ['a'] }],
      order: 5,
    });
    const res = await request(app)
      .put(`/api/quiz/${created.id}`)
      .set('Authorization', `Bearer ${authTokenInstructor}`)
      .send({ title: 'New Title By Id' })
      .expect(200);
    expect(res.body).toHaveProperty('id', 'quizById');
    expect(res.body).toHaveProperty('title', 'New Title By Id');
  });

  it('DELETE /api/quizzes/:id deletes a quiz', async () => {
    const created = await quizModel.create({
      id: 'quizDelete',
      lesson_id: 'lesson1',
      course_id: 'course1',
      title: 'To Delete',
      questions: [{ id: 'q1', type: 'single', text: 't', correctAnswers: ['a'] }],
      order: 4,
    });
    const res = await request(app)
      .delete(`/api/quiz/${created._id}`)
      .set('Authorization', `Bearer ${authTokenInstructor}`)
      .expect(200);
    expect(res.body).toHaveProperty('message', 'Quiz deleted successfully');
  });

  it('GET /api/quizzes/instructor/:instructorId returns quizzes for instructor', async () => {
    const res = await request(app)
      .get(`/api/quiz/instructor/${String(instructor._id)}`)
      .set('Authorization', `Bearer ${authTokenInstructor}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('lesson_id', 'lesson1');
  });

  it('POST /api/quizzes/:quizId submits a quiz and creates a submission', async () => {
    const payload = {
      answers: [{ questionId: 'q1', answer: '4' }],
      duration: 10,
    };
    const res = await request(app)
      .post('/api/quiz/quiz1')
      .set('Authorization', `Bearer ${authTokenStudent}`)
      .send(payload)
      .expect(200);

    expect(res.body).toHaveProperty('quizId', 'quiz1');
    expect(res.body).toHaveProperty('userId', String(student._id));
    expect(res.body).toHaveProperty('score');
    expect(res.body.score).toBe(10);
  });

  it('GET /api/quizzes/:quizId/history returns submissions for user', async () => {
    const payload = { answers: [{ questionId: 'q1', answer: '4' }], duration: 10 };
    await request(app)
      .post('/api/quiz/quiz1')
      .set('Authorization', `Bearer ${authTokenStudent}`)
      .send(payload)
      .expect(200);

    const res = await request(app)
      .get('/api/quiz/quiz1/history')
      .set('Authorization', `Bearer ${authTokenStudent}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('quizId', 'quiz1');
  });
});
