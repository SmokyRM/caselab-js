import { describe, expect, it } from '@jest/globals';
import supertest from 'supertest';
import app from '../../src/app.js';
import { useTestDatabase } from '../helpers/database.js';
import {
  createAuthenticatedUser,
  createTechnician,
  createTestEquipment,
  createTestRequest,
} from '../helpers/fixtures.js';

useTestDatabase();

async function createAdminRequest() {
  const admin = await createAuthenticatedUser(app, { role: 'admin' });
  const equipment = await createTestEquipment(app, admin.accessToken);
  const maintenanceRequest = await createTestRequest(
    app,
    admin.accessToken,
    equipment.id
  );

  return { admin, equipment, maintenanceRequest };
}

function replaceTeam(accessToken, requestId, assignees) {
  return supertest(app)
    .post(`/api/requests/${requestId}/assignees`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ assignees });
}

describe('maintenance requests API', () => {
  it('supports admin request CRUD', async () => {
    const { admin, maintenanceRequest } = await createAdminRequest();

    const getResponse = await supertest(app)
      .get(`/api/requests/${maintenanceRequest.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(getResponse.body.data.status).toBe('new');

    const updateResponse = await supertest(app)
      .patch(`/api/requests/${maintenanceRequest.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Updated maintenance request' })
      .expect(200);
    expect(updateResponse.body.data.title).toBe('Updated maintenance request');

    await supertest(app)
      .delete(`/api/requests/${maintenanceRequest.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);

    const missingResponse = await supertest(app)
      .get(`/api/requests/${maintenanceRequest.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(404);
    expect(missingResponse.body.error.code).toBe('REQUEST_NOT_FOUND');
  });

  it('rejects new -> done with 409 conflict', async () => {
    const { admin, maintenanceRequest } = await createAdminRequest();

    const response = await supertest(app)
      .patch(`/api/requests/${maintenanceRequest.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'done' })
      .expect(409);

    expect(response.body.error.code).toBe('INVALID_REQUEST_STATUS_TRANSITION');
  });

  it('rejects new -> in_progress without assignees', async () => {
    const { admin, maintenanceRequest } = await createAdminRequest();

    const response = await supertest(app)
      .patch(`/api/requests/${maintenanceRequest.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'in_progress' })
      .expect(409);

    expect(response.body.error.code).toBe('REQUEST_REQUIRES_ASSIGNEES');
  });

  it('allows assigned technician to complete valid status flow and writes history', async () => {
    const { admin, maintenanceRequest } = await createAdminRequest();
    const technician = await createAuthenticatedUser(app, {
      role: 'technician',
    });

    await replaceTeam(admin.accessToken, maintenanceRequest.id, [
      {
        technicianId: technician.technicianId,
        role: 'lead',
        hours: 8,
      },
    ]).expect(200);

    await supertest(app)
      .patch(`/api/requests/${maintenanceRequest.id}/status`)
      .set('Authorization', `Bearer ${technician.accessToken}`)
      .send({ status: 'in_progress' })
      .expect(200);

    await supertest(app)
      .patch(`/api/requests/${maintenanceRequest.id}/status`)
      .set('Authorization', `Bearer ${technician.accessToken}`)
      .send({ status: 'done' })
      .expect(200);

    const historyResponse = await supertest(app)
      .get(`/api/requests/${maintenanceRequest.id}/history`)
      .set('Authorization', `Bearer ${technician.accessToken}`)
      .expect(200);

    expect(historyResponse.body.data).toEqual([
      expect.objectContaining({
        oldStatus: 'new',
        newStatus: 'in_progress',
        author: 'api',
      }),
      expect.objectContaining({
        oldStatus: 'in_progress',
        newStatus: 'done',
        author: 'api',
      }),
    ]);
  });

  it('rejects an unassigned technician and keeps request status unchanged', async () => {
    const { admin, maintenanceRequest } = await createAdminRequest();
    const technician = await createAuthenticatedUser(app, {
      role: 'technician',
    });

    const response = await supertest(app)
      .patch(`/api/requests/${maintenanceRequest.id}/status`)
      .set('Authorization', `Bearer ${technician.accessToken}`)
      .send({ status: 'rejected' })
      .expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN');

    const requestResponse = await supertest(app)
      .get(`/api/requests/${maintenanceRequest.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    expect(requestResponse.body.data.status).toBe('new');
  });

  it('allows admin status transition without admin assignment', async () => {
    const { admin, maintenanceRequest } = await createAdminRequest();
    const technician = await createTechnician();

    await replaceTeam(admin.accessToken, maintenanceRequest.id, [
      { technicianId: technician.id, role: 'lead', hours: 4 },
    ]).expect(200);

    const response = await supertest(app)
      .patch(`/api/requests/${maintenanceRequest.id}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'in_progress' })
      .expect(200);

    expect(response.body.data.status).toBe('in_progress');
  });

  it('prevents deleting lead while allowing member removal', async () => {
    const { admin, maintenanceRequest } = await createAdminRequest();
    const lead = await createTechnician({ fullName: 'Lead Technician' });
    const member = await createTechnician({ fullName: 'Member Technician' });

    await replaceTeam(admin.accessToken, maintenanceRequest.id, [
      { technicianId: lead.id, role: 'lead', hours: 8 },
      { technicianId: member.id, role: 'member', hours: 4 },
    ]).expect(200);

    const leadResponse = await supertest(app)
      .delete(`/api/requests/${maintenanceRequest.id}/assignees/${lead.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(422);
    expect(leadResponse.body.error.code).toBe('REQUEST_TEAM_REQUIRES_LEAD');

    await supertest(app)
      .delete(`/api/requests/${maintenanceRequest.id}/assignees/${member.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);
  });
});
