import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app';
import lessonModel from '../models/lesson.model';
import { LessonType, ContentType } from '../enums/lesson.enum';

const mockLessons = [
  {
    id: 'l1',
    course_id: 'course1',
    title: 'Introduction to HTML',
    lessonType: LessonType.THEORY,
    contentType: ContentType.VIDEO,
    content: 'https://example.com/html-intro-video.mp4',
    duration: 600,
    order: 1,
    created_at: new Date('2025-12-01T00:00:00.000Z'),
    updated_at: new Date('2025-12-01T00:00:00.000Z')
  },
  {
    id: 'l2',
    course_id: 'course1',
    title: 'CSS Basics',
    lessonType: LessonType.THEORY,
    contentType: ContentType.VIDEO,
    content: 'https://example.com/css-basics-video.mp4',
    duration: 900,
    order: 2,
    created_at: new Date('2025-12-01T00:00:00.000Z'),
    updated_at: new Date('2025-12-01T00:00:00.000Z')
  },
  {
    id: 'l3',
    course_id: 'course2',
    title: 'JavaScript Fundamentals',
    lessonType: LessonType.THEORY,
    contentType: ContentType.ARTICLE,
    content: '# JavaScript Fundamentals\n\nJavaScript is a versatile language...',
    duration: 1200,
    order: 1,
    created_at: new Date('2025-12-01T00:00:00.000Z'),
    updated_at: new Date('2025-12-01T00:00:00.000Z')
  }
];

describe('Lesson Routes', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await lessonModel.deleteMany({});
    // Insert mock data
    await lessonModel.insertMany(mockLessons);
  });

  describe('GET /api/lessons/course/:courseId', () => {
    it('should return all lessons for a given course ID', async () => {
      const courseId = 'course1';
      const response = await request(app)
        .get(`/api/lessons/course/${courseId}`)
        .expect(200);

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
      expect(lesson).toHaveProperty('contentType');
      expect(lesson).toHaveProperty('content');
      expect(lesson).toHaveProperty('order');
    });

    it('should return lessons sorted by order', async () => {
      const courseId = 'course1';
      const response = await request(app)
        .get(`/api/lessons/course/${courseId}`)
        .expect(200);

      expect(response.body[0].order).toBe(1);
      expect(response.body[1].order).toBe(2);
    });

    it('should return empty array for course with no lessons', async () => {
      const courseId = 'nonexistent';
      const response = await request(app)
        .get(`/api/lessons/course/${courseId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/lessons/course/:courseId/lesson/:lessonId', () => {
    it('should return a specific lesson for a given course and lesson ID', async () => {
      const courseId = 'course1';
      const lessonId = 'l1';
      const response = await request(app)
        .get(`/api/lessons/course/${courseId}/lesson/${lessonId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', lessonId);
      expect(response.body).toHaveProperty('course_id', courseId);
      expect(response.body).toHaveProperty('title', 'Introduction to HTML');
      expect(response.body).toHaveProperty('contentType', ContentType.VIDEO);
      expect(response.body).toHaveProperty('lessonType', LessonType.THEORY);
      expect(response.body).toHaveProperty('content', 'https://example.com/html-intro-video.mp4');
      expect(response.body).toHaveProperty('duration', 600);
      expect(response.body).toHaveProperty('order', 1);
    });

    it('should return 400 error when lesson not found in course', async () => {
      const courseId = 'course1';
      const lessonId = 'nonexistent';
      const response = await request(app)
        .get(`/api/lessons/course/${courseId}/lesson/${lessonId}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Lesson not found in the specified course');
    });

    it('should return 400 error when lesson exists but in different course', async () => {
      const courseId = 'course1';
      const lessonId = 'l3'; // This lesson is in course2
      const response = await request(app)
        .get(`/api/lessons/course/${courseId}/lesson/${lessonId}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Lesson not found in the specified course');
    });
  });

  describe('POST /api/lessons', () => {
    it('should return 501 Not Implemented for create lesson', async () => {
      const response = await request(app)
        .post('/api/lessons')
        .send({
          id: 'l4',
          course_id: 'course1',
          title: 'New Lesson',
          contentType: ContentType.ARTICLE,
          content: 'Test content',
          order: 3
        })
        .expect(501);

      expect(response.body).toHaveProperty('message', 'Not implemented');
    });
  });

  describe('PUT /api/lessons/:id', () => {
    it('should return 501 Not Implemented for update lesson', async () => {
      const response = await request(app)
        .put('/api/lessons/l1')
        .send({
          title: 'Updated Title'
        })
        .expect(501);

      expect(response.body).toHaveProperty('message', 'Not implemented');
    });
  });

  describe('DELETE /api/lessons/:id', () => {
    it('should return 501 Not Implemented for delete lesson', async () => {
      const response = await request(app)
        .delete('/api/lessons/l1')
        .expect(501);

      expect(response.body).toHaveProperty('message', 'Not implemented');
    });
  });
});
