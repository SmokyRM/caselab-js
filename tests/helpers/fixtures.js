import { randomUUID } from 'node:crypto';
import supertest from 'supertest';
import { Technician, User } from '../../src/db/models/index.js';
import { hashPassword } from '../../src/security/password.js';

export const testPassword = 'integration-test-password';

export async function createTechnician(overrides = {}) {
  const uniqueValue = randomUUID();

  return Technician.create({
    id: overrides.id ?? randomUUID(),
    full_name: overrides.fullName ?? 'Test Technician',
    specialization: overrides.specialization ?? 'Electrical systems',
    employee_number: overrides.employeeNumber ?? `TEST-${uniqueValue}`,
  });
}

export async function createTestUser(options = {}) {
  const role = options.role ?? 'viewer';
  let technicianId = options.technicianId ?? null;

  if (role === 'technician' && !technicianId) {
    const technician = await createTechnician();
    technicianId = technician.id;
  }

  const email = options.email ?? `${role}-${randomUUID()}@example.test`;
  const password = options.password ?? testPassword;
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    id: randomUUID(),
    email,
    password_hash: passwordHash,
    role,
    technician_id: technicianId,
  });

  return { user, email, password, technicianId };
}

export async function loginTestUser(app, credentials) {
  return supertest(app).post('/api/auth/login').send({
    email: credentials.email,
    password: credentials.password,
  });
}

export async function createAuthenticatedUser(app, options = {}) {
  const credentials = await createTestUser(options);
  const loginResponse = await loginTestUser(app, credentials);

  return {
    ...credentials,
    accessToken: loginResponse.body.accessToken,
    refreshCookie: loginResponse.headers['set-cookie']?.[0],
  };
}

export async function createTestEquipment(app, accessToken, overrides = {}) {
  const payload = {
    name: 'Test wind turbine',
    type: 'turbine',
    serialNumber: `TEST-EQ-${randomUUID()}`,
    location: { lat: 55.75, lon: 37.62 },
    status: 'operational',
    installedAt: '2024-01-15',
    ...overrides,
  };

  const response = await supertest(app)
    .post('/api/equipment')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(payload)
    .expect(201);

  return response.body.data;
}

export async function createTestRequest(
  app,
  accessToken,
  equipmentId,
  overrides = {}
) {
  const payload = {
    equipmentId,
    title: 'Inspect test equipment',
    description: 'Integration test maintenance request',
    priority: 'high',
    plannedAt: '2027-01-15T10:00:00.000Z',
    ...overrides,
  };

  const response = await supertest(app)
    .post('/api/requests')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(payload)
    .expect(201);

  return response.body.data;
}

export function cookieValue(setCookieHeader) {
  return setCookieHeader.split(';')[0];
}
