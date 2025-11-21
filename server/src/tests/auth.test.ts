import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Auth Routes', () => {
  let accessToken: string;
  let refreshTokenCookie: string;
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: 'student'
  };

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');
  });

  it('should not register an existing user', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    // Try to register again
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'User already exists');
  });

  it('should login the user', async () => {
    // Register first
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    
    // Check for httpOnly cookie
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.includes('refreshToken'))).toBe(true);
  });

  it('should refresh token', async () => {
    // Register and Login first
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', [refreshTokenCookie as string]);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should logout', async () => {
    // Register and Login first
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
      
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const refreshTokenCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [refreshTokenCookie as string]);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
    
    // Check if cookie is cleared (expires in the past)
    const logoutCookies = res.headers['set-cookie'] as unknown as string[];
    expect(logoutCookies.some((c: string) => c.includes('refreshToken=;'))).toBe(true);
  });
});
