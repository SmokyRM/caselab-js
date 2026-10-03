import { describe, expect, it } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';

describe('OpenAPI documentation', () => {
  it('serves the public OpenAPI document', async () => {
    const response = await supertest(app)
      .get('/api/docs/openapi.json')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toBe('CaseLab Maintenance Service API');
    expect(response.body.paths['/api/auth/login'].post.operationId).toBe(
      'loginUser'
    );
    expect(response.body.components.securitySchemes.bearerAuth).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('serves Swagger UI and its static assets with a docs-only CSP', async () => {
    const page = await supertest(app).get('/api/docs/').expect(200);

    expect(page.text).toContain('<div id="swagger-ui"></div>');
    expect(page.headers['content-security-policy']).toContain(
      "'unsafe-inline'"
    );

    await supertest(app)
      .get('/api/docs/swagger-ui.css')
      .expect(200)
      .expect('Content-Type', /css/);

    await supertest(app)
      .get('/api/docs/swagger-ui-bundle.js')
      .expect(200)
      .expect('Content-Type', /javascript/);
  });
});
