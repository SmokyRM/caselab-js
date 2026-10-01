import { describe, expect, it } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import { useTestDatabase } from '../helpers/database.js';
import {
  createAuthenticatedUser,
  createTestEquipment,
} from '../helpers/fixtures.js';

useTestDatabase();

describe('equipment API', () => {
  it.each(['/api/equipment', '/api/requests'])(
    'returns 401 with requestId for unauthenticated GET %s',
    async (path) => {
      const response = await supertest(app).get(path).expect(401);

      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
      expect(response.body.error.requestId).toEqual(expect.any(String));
    }
  );

  it('allows viewer read but rejects equipment mutation', async () => {
    const viewer = await createAuthenticatedUser(app, { role: 'viewer' });

    await supertest(app)
      .get('/api/equipment')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .expect(200);

    const response = await supertest(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${viewer.accessToken}`)
      .send({})
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('supports admin equipment CRUD', async () => {
    const admin = await createAuthenticatedUser(app, { role: 'admin' });
    const equipment = await createTestEquipment(app, admin.accessToken);

    const getResponse = await supertest(app)
      .get(`/api/equipment/${equipment.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(getResponse.body.data.serialNumber).toBe(equipment.serialNumber);

    const updateResponse = await supertest(app)
      .patch(`/api/equipment/${equipment.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Updated test turbine' })
      .expect(200);
    expect(updateResponse.body.data.name).toBe('Updated test turbine');

    await supertest(app)
      .delete(`/api/equipment/${equipment.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);

    const missingResponse = await supertest(app)
      .get(`/api/equipment/${equipment.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(404);
    expect(missingResponse.body.error.code).toBe('EQUIPMENT_NOT_FOUND');
  });

  it('returns 409 for duplicate equipment serial number', async () => {
    const admin = await createAuthenticatedUser(app, { role: 'admin' });
    const equipment = await createTestEquipment(app, admin.accessToken);

    const response = await supertest(app)
      .post('/api/equipment')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        name: 'Duplicate serial equipment',
        type: 'sensor',
        serialNumber: equipment.serialNumber,
        location: { lat: 55.76, lon: 37.63 },
        status: 'operational',
        installedAt: '2024-02-01',
      })
      .expect(409);

    expect(response.body.error.code).toBe('EQUIPMENT_SERIAL_CONFLICT');
  });
});
