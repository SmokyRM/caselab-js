import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const transaction = { LOCK: { UPDATE: 'UPDATE' } };
const sequelize = {
  transaction: jest.fn(),
};
const requestRepository = {
  findByIdForUpdate: jest.fn(),
  isTechnicianAssigned: jest.fn(),
  countAssignees: jest.fn(),
  update: jest.fn(),
  createStatusHistory: jest.fn(),
  findTechniciansByIds: jest.fn(),
  deleteAssignmentsByRequestId: jest.fn(),
  createAssignments: jest.fn(),
  findAssignmentsByRequestId: jest.fn(),
  removeAssignee: jest.fn(),
};
const equipmentRepository = {
  findById: jest.fn(),
};

jest.unstable_mockModule('../../src/db/models/index.js', () => ({ sequelize }));
jest.unstable_mockModule(
  '../../src/repositories/request.repository.js',
  () => requestRepository
);
jest.unstable_mockModule(
  '../../src/repositories/equipment.repository.js',
  () => equipmentRepository
);

const requestService = await import('../../src/services/request.service.js');

const requestId = '11111111-1111-4111-8111-111111111111';
const technicianId = '22222222-2222-4222-8222-222222222222';
const secondTechnicianId = '33333333-3333-4333-8333-333333333333';

function currentRequest(status = 'new') {
  return {
    id: requestId,
    status,
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  sequelize.transaction.mockImplementation((callback) => callback(transaction));
  requestRepository.findByIdForUpdate.mockResolvedValue(currentRequest());
  requestRepository.isTechnicianAssigned.mockResolvedValue(true);
  requestRepository.countAssignees.mockResolvedValue(1);
  requestRepository.update.mockResolvedValue({ id: requestId });
  requestRepository.createStatusHistory.mockResolvedValue({});
  requestRepository.findTechniciansByIds.mockResolvedValue([]);
  requestRepository.findAssignmentsByRequestId.mockResolvedValue([]);
});

describe('changeRequestStatus transitions', () => {
  it.each([
    ['new', 'in_progress'],
    ['new', 'rejected'],
    ['in_progress', 'done'],
    ['in_progress', 'rejected'],
  ])('allows %s -> %s', async (oldStatus, newStatus) => {
    requestRepository.findByIdForUpdate.mockResolvedValue(
      currentRequest(oldStatus)
    );

    await requestService.changeRequestStatus(requestId, newStatus, {
      role: 'admin',
    });

    expect(requestRepository.update).toHaveBeenCalledWith(
      requestId,
      expect.objectContaining({ status: newStatus }),
      { transaction }
    );
    expect(requestRepository.createStatusHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId,
        oldStatus,
        newStatus,
        author: 'api',
      }),
      { transaction }
    );
  });

  it.each([
    ['new', 'done'],
    ['new', 'new'],
    ['in_progress', 'new'],
    ['in_progress', 'in_progress'],
    ['done', 'new'],
    ['done', 'rejected'],
    ['rejected', 'new'],
    ['rejected', 'done'],
  ])('rejects %s -> %s', async (oldStatus, newStatus) => {
    requestRepository.findByIdForUpdate.mockResolvedValue(
      currentRequest(oldStatus)
    );

    await expect(
      requestService.changeRequestStatus(requestId, newStatus, {
        role: 'admin',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'INVALID_REQUEST_STATUS_TRANSITION',
    });
    expect(requestRepository.update).not.toHaveBeenCalled();
    expect(requestRepository.createStatusHistory).not.toHaveBeenCalled();
  });

  it('rejects new -> in_progress when no assignees exist', async () => {
    requestRepository.countAssignees.mockResolvedValue(0);

    await expect(
      requestService.changeRequestStatus(requestId, 'in_progress', {
        role: 'admin',
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'REQUEST_REQUIRES_ASSIGNEES',
    });
  });

  it('allows new -> in_progress when at least one assignee exists', async () => {
    requestRepository.countAssignees.mockResolvedValue(1);

    await requestService.changeRequestStatus(requestId, 'in_progress', {
      role: 'admin',
    });

    expect(requestRepository.update).toHaveBeenCalled();
  });
});

describe('changeRequestStatus authorization', () => {
  it('allows an assigned technician', async () => {
    await requestService.changeRequestStatus(requestId, 'rejected', {
      role: 'technician',
      technicianId,
    });

    expect(requestRepository.isTechnicianAssigned).toHaveBeenCalledWith(
      requestId,
      technicianId,
      { transaction }
    );
    expect(requestRepository.update).toHaveBeenCalled();
  });

  it('rejects a technician who is not assigned', async () => {
    requestRepository.isTechnicianAssigned.mockResolvedValue(false);

    await expect(
      requestService.changeRequestStatus(requestId, 'rejected', {
        role: 'technician',
        technicianId,
      })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('rejects a technician without technicianId', async () => {
    await expect(
      requestService.changeRequestStatus(requestId, 'rejected', {
        role: 'technician',
        technicianId: null,
      })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
    expect(requestRepository.isTechnicianAssigned).not.toHaveBeenCalled();
  });

  it('allows admin without checking assignment', async () => {
    await requestService.changeRequestStatus(requestId, 'rejected', {
      role: 'admin',
    });

    expect(requestRepository.isTechnicianAssigned).not.toHaveBeenCalled();
    expect(requestRepository.update).toHaveBeenCalled();
  });

  it('rejects viewer', async () => {
    await expect(
      requestService.changeRequestStatus(requestId, 'rejected', {
        role: 'viewer',
      })
    ).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });
});

describe('replaceRequestAssignees', () => {
  const lead = { technicianId, role: 'lead', hours: 4 };
  const member = {
    technicianId: secondTechnicianId,
    role: 'member',
    hours: 2,
  };

  it('rejects duplicate technicianId values', async () => {
    await expect(
      requestService.replaceRequestAssignees(requestId, [lead, lead])
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'REQUEST_ASSIGNEE_CONFLICT',
    });
    expect(sequelize.transaction).not.toHaveBeenCalled();
  });

  it('rejects an unknown technician', async () => {
    requestRepository.findTechniciansByIds.mockResolvedValue([
      { id: technicianId },
    ]);

    await expect(
      requestService.replaceRequestAssignees(requestId, [lead, member])
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'TECHNICIAN_NOT_FOUND',
    });
  });

  it('replaces a valid unique team', async () => {
    const expectedTeam = [lead, member];
    requestRepository.findTechniciansByIds.mockResolvedValue([
      { id: technicianId },
      { id: secondTechnicianId },
    ]);
    requestRepository.findAssignmentsByRequestId.mockResolvedValue(
      expectedTeam
    );

    await expect(
      requestService.replaceRequestAssignees(requestId, expectedTeam)
    ).resolves.toEqual(expectedTeam);
    expect(requestRepository.deleteAssignmentsByRequestId).toHaveBeenCalled();
    expect(requestRepository.createAssignments).toHaveBeenCalledWith(
      requestId,
      expectedTeam,
      { transaction }
    );
  });
});

describe('removeRequestAssignee', () => {
  it('rejects an assignee who is not on the request', async () => {
    requestRepository.findAssignmentsByRequestId.mockResolvedValue([]);

    await expect(
      requestService.removeRequestAssignee(requestId, technicianId)
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'REQUEST_ASSIGNEE_NOT_FOUND',
    });
  });

  it('rejects removing lead while other assignees remain', async () => {
    requestRepository.findAssignmentsByRequestId.mockResolvedValue([
      { technicianId, role: 'lead' },
      { technicianId: secondTechnicianId, role: 'member' },
    ]);

    await expect(
      requestService.removeRequestAssignee(requestId, technicianId)
    ).rejects.toMatchObject({
      statusCode: 422,
      code: 'REQUEST_TEAM_REQUIRES_LEAD',
    });
  });

  it('allows removing lead when it is the only assignee', async () => {
    requestRepository.findAssignmentsByRequestId.mockResolvedValue([
      { technicianId, role: 'lead' },
    ]);

    await requestService.removeRequestAssignee(requestId, technicianId);

    expect(requestRepository.removeAssignee).toHaveBeenCalledWith(
      requestId,
      technicianId,
      { transaction }
    );
  });

  it('allows removing a non-lead assignee', async () => {
    requestRepository.findAssignmentsByRequestId.mockResolvedValue([
      { technicianId: secondTechnicianId, role: 'lead' },
      { technicianId, role: 'member' },
    ]);

    await requestService.removeRequestAssignee(requestId, technicianId);

    expect(requestRepository.removeAssignee).toHaveBeenCalled();
  });
});
