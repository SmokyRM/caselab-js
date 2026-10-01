import { describe, expect, it } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import { useTestDatabase } from '../helpers/database.js';
import {
  cookieValue,
  createTestUser,
  loginTestUser,
  testPassword,
} from '../helpers/fixtures.js';

useTestDatabase();

describe('authentication API', () => {
  it('registers a viewer without exposing sensitive fields', async () => {
    const response = await supertest(app)
      .post('/api/auth/register')
      .send({ email: 'viewer@example.test', password: testPassword })
      .expect(201);

    expect(response.body.user).toMatchObject({
      email: 'viewer@example.test',
      role: 'viewer',
    });
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(response.body).not.toHaveProperty('refreshToken');
  });

  it('logs in and returns access token with HttpOnly refresh cookie', async () => {
    const credentials = await createTestUser({
      email: 'login@example.test',
    });

    const response = await loginTestUser(app, credentials);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe(credentials.email);
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(response.body).not.toHaveProperty('refreshToken');
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it.each([
    ['unknown@example.test', testPassword],
    ['known@example.test', 'wrong-password'],
  ])(
    'returns the same public error for invalid credentials',
    async (email, password) => {
      await createTestUser({ email: 'known@example.test' });

      const response = await supertest(app)
        .post('/api/auth/login')
        .send({ email, password })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Неверный email или пароль.');
    }
  );

  it('rotates refresh cookie and rejects the previous token', async () => {
    const credentials = await createTestUser();
    const loginResponse = await loginTestUser(app, credentials);
    const oldCookie = loginResponse.headers['set-cookie'][0];

    const refreshResponse = await supertest(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieValue(oldCookie))
      .expect(200);
    const newCookie = refreshResponse.headers['set-cookie'][0];

    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(cookieValue(newCookie)).not.toBe(cookieValue(oldCookie));
    await supertest(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieValue(oldCookie))
      .expect(401)
      .expect(({ body }) => {
        expect(body.error.code).toBe('INVALID_REFRESH_TOKEN');
      });
  });

  it('revokes refresh token on logout', async () => {
    const credentials = await createTestUser();
    const loginResponse = await loginTestUser(app, credentials);
    const refreshCookie = loginResponse.headers['set-cookie'][0];

    await supertest(app)
      .post('/api/auth/logout')
      .set('Cookie', cookieValue(refreshCookie))
      .expect(204);

    const response = await supertest(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieValue(refreshCookie))
      .expect(401);

    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });
});
