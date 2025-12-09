import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import lessonModel from '../models/lesson.model';
import { LessonType } from '../enums/lesson.enum';
import Role from '../enums/user.enum';

const mockLessons = [
  {
    id: 'l1',
    course_id: 'course1',
    title: 'Introduction to HTML',
    lessonType: LessonType.THEORY,
    content_type: 'video',
    content: 'https://example.com/html-intro-video.mp4',
    duration: 600,
    order: 1,
    created_at: new Date('2025-12-01T00:00:00.000Z'),
    updated_at: new Date('2025-12-01T00:00:00.000Z'),
  },
  {
    id: 'l2',
    course_id: 'course1',
    title: 'CSS Basics',
    lessonType: LessonType.THEORY,
    content_type: 'video',
    content: 'https://example.com/css-basics-video.mp4',
    duration: 900,
    order: 2,
    created_at: new Date('2025-12-01T00:00:00.000Z'),
    updated_at: new Date('2025-12-01T00:00:00.000Z'),
  },
  {
    id: 'l3',
    course_id: 'course2',
    title: 'JavaScript Fundamentals',
    lessonType: LessonType.THEORY,
    content_type: 'html',
    content: '# JavaScript Fundamentals\n\nJavaScript is a versatile language...',
    duration: 1200,
    order: 1,
    created_at: new Date('2025-12-01T00:00:00.000Z'),
    updated_at: new Date('2025-12-01T00:00:00.000Z'),
  },
];

describe('Lesson Routes', () => {
  let authToken: string;

  beforeEach(async () => {
    // Generate a valid JWT token for testing
    const secret = process.env.ACCESS_TOKEN_SECRET || 'test-secret';
    authToken = jwt.sign({ userId: 'test-user-id', role: Role.INSTRUCTOR }, secret, {
      expiresIn: '1h',
    });

    // Clear the database before each test
    await lessonModel.deleteMany({});
    // Insert mock data
    await lessonModel.insertMany(mockLessons);
  });

  describe('GET /api/courses/:courseId/lessons', () => {
    it('should return all lessons for a given course ID', async () => {
      const courseId = 'course1';
      const response = await request(app).get(`/api/courses/${courseId}/lessons`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      // Check that lessons are sorted by order
      expect(response.body[0].id).toBe('l1');
      expect(response.body[1].id).toBe('l2');

      // Verify lesson structure
      const lesson = response.body[0];
      expect(lesson).toHaveProperty('id');
      expect(lesson).toHaveProperty('course_id', courseId);
      expect(lesson).toHaveProperty('title');
      expect(lesson).toHaveProperty('content_type');
      expect(lesson).toHaveProperty('content');
      expect(lesson).toHaveProperty('order');
    });

    it('should return lessons sorted by order', async () => {
      const courseId = 'course1';
      const response = await request(app).get(`/api/courses/${courseId}/lessons`).expect(200);

      expect(response.body[0].order).toBe(1);
      expect(response.body[1].order).toBe(2);
    });

    it('should return empty array for course with no lessons', async () => {
      const courseId = 'nonexistent';
      const response = await request(app).get(`/api/courses/${courseId}/lessons`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/courses/:courseId/lessons/:lessonId', () => {
    it('should return a specific lesson for a given course and lesson ID', async () => {
      const courseId = 'course1';
      const lessonId = 'l1';
      const response = await request(app)
        .get(`/api/courses/${courseId}/lessons/${lessonId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', lessonId);
      expect(response.body).toHaveProperty('course_id', courseId);
      expect(response.body).toHaveProperty('title', 'Introduction to HTML');
      expect(response.body).toHaveProperty('content_type', 'video');
      expect(response.body).toHaveProperty('lessonType', LessonType.THEORY);
      expect(response.body).toHaveProperty('content', 'https://example.com/html-intro-video.mp4');
      expect(response.body).toHaveProperty('duration', 600);
      expect(response.body).toHaveProperty('order', 1);
    });

    it('should return 400 error when lesson not found in course', async () => {
      const courseId = 'course1';
      const lessonId = 'nonexistent';
      const response = await request(app)
        .get(`/api/courses/${courseId}/lessons/${lessonId}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Lesson not found in the specified course');
    });

    it('should return 400 error when lesson exists but in different course', async () => {
      const courseId = 'course1';
      const lessonId = 'l3'; // This lesson is in course2
      const response = await request(app)
        .get(`/api/courses/${courseId}/lessons/${lessonId}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Lesson not found in the specified course');
    });
  });

  describe('POST /api/courses/:courseId/lessons', () => {
    it('should create a new lesson', async () => {
      const courseId = 'course1';
      const response = await request(app)
        .post(`/api/courses/${courseId}/lessons`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'New Lesson',
          content_type: 'html',
          content: 'Test content',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('course_id', courseId);
      expect(response.body).toHaveProperty('title', 'New Lesson');
      expect(response.body).toHaveProperty('content_type', 'html');
      expect(response.body).toHaveProperty('content', 'Test content');
      expect(response.body).toHaveProperty('order', 3); // Next available order
    });
  });

  describe('PUT /api/courses/:courseId/lessons/:lessonId', () => {
    it('should update a lesson', async () => {
      const courseId = 'course1';
      const lessonId = 'l1';
      const response = await request(app)
        .put(`/api/courses/${courseId}/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', lessonId);
      expect(response.body).toHaveProperty('title', 'Updated Title');
    });
  });

  describe('DELETE /api/courses/:courseId/lessons/:lessonId', () => {
    it('should delete a lesson', async () => {
      const courseId = 'course1';
      const lessonId = 'l1';
      const response = await request(app)
        .delete(`/api/courses/${courseId}/lessons/${lessonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});
