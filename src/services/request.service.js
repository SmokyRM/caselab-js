import { randomUUID } from 'node:crypto';
import { UniqueConstraintError } from 'sequelize';
import { sequelize } from '../db/models/index.js';
import { AppError } from '../errors/AppError.js';
import { ConflictError } from '../errors/ConflictError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import * as equipmentRepository from '../repositories/equipment.repository.js';
import * as requestRepository from '../repositories/request.repository.js';

const allowedStatusTransitions = {
  new: ['in_progress', 'rejected'],
  in_progress: ['done', 'rejected'],
  done: [],
  rejected: [],
};

function createRequestNotFoundError() {
  return new NotFoundError('Заявка не найдена.', 'REQUEST_NOT_FOUND');
}

function createEquipmentNotFoundError() {
  return new NotFoundError('Оборудование не найдено.', 'EQUIPMENT_NOT_FOUND');
}

function createTechnicianNotFoundError() {
  return new NotFoundError('Специалист не найден.', 'TECHNICIAN_NOT_FOUND');
}

function createAssigneeNotFoundError() {
  return new NotFoundError(
    'Специалист не назначен на эту заявку.',
    'REQUEST_ASSIGNEE_NOT_FOUND'
  );
}

function createTeamRequiresLeadError() {
  return new AppError(
    'В команде должен остаться lead.',
    422,
    'REQUEST_TEAM_REQUIRES_LEAD'
  );
}

function createAssigneeConflictError() {
  return new ConflictError(
    'Специалист не может быть дважды назначен на одну заявку.',
    'REQUEST_ASSIGNEE_CONFLICT'
  );
}

async function ensureEquipmentExists(id) {
  const equipment = await equipmentRepository.findById(id);

  if (!equipment) throw createEquipmentNotFoundError();
}

function getNextUpdatedAt(previousUpdatedAt) {
  const now = new Date();
  const previous = new Date(previousUpdatedAt);

  if (now <= previous) {
    return new Date(previous.getTime() + 1).toISOString();
  }

  return now.toISOString();
}

export async function listRequests(query) {
  return requestRepository.findAll(query);
}

export async function getRequest(id) {
  const request = await requestRepository.findById(id);

  if (!request) throw createRequestNotFoundError();

  return request;
}

export async function createRequest(data) {
  await ensureEquipmentExists(data.equipmentId);

  const now = new Date().toISOString();

  return requestRepository.create({
    id: randomUUID(),
    ...data,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateRequest(id, data) {
  const request = await getRequest(id);

  if (data.equipmentId && data.equipmentId !== request.equipmentId) {
    await ensureEquipmentExists(data.equipmentId);
  }

  return requestRepository.update(id, {
    ...data,
    updatedAt: getNextUpdatedAt(request.updatedAt),
  });
}

export async function changeRequestStatus(id, status) {
  return sequelize.transaction(async (transaction) => {
    const request = await requestRepository.findByIdForUpdate(id, transaction);

    if (!request) throw createRequestNotFoundError();

    const allowedStatuses = allowedStatusTransitions[request.status];

    if (!allowedStatuses.includes(status)) {
      throw new ConflictError(
        `Переход статуса из "${request.status}" в "${status}" запрещён.`,
        'INVALID_REQUEST_STATUS_TRANSITION'
      );
    }

    if (status === 'in_progress') {
      const assigneeCount = await requestRepository.countAssignees(id, {
        transaction,
      });

      if (assigneeCount === 0) {
        throw new ConflictError(
          'Нельзя перевести заявку в работу без назначенных специалистов.',
          'REQUEST_REQUIRES_ASSIGNEES'
        );
      }
    }

    const changedAt = getNextUpdatedAt(request.updatedAt);
    const updatedRequest = await requestRepository.update(
      id,
      {
        status,
        updatedAt: changedAt,
      },
      { transaction }
    );

    await requestRepository.createStatusHistory(
      {
        requestId: id,
        oldStatus: request.status,
        newStatus: status,
        author: 'api',
        comment: null,
        createdAt: changedAt,
      },
      { transaction }
    );

    return updatedRequest;
  });
}

export async function getRequestStatusHistory(id) {
  await getRequest(id);
  return requestRepository.findStatusHistoryByRequestId(id);
}

export async function replaceRequestAssignees(id, assignees) {
  const technicianIds = assignees.map((assignee) => assignee.technicianId);

  if (new Set(technicianIds).size !== technicianIds.length) {
    throw createAssigneeConflictError();
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      const request = await requestRepository.findByIdForUpdate(
        id,
        transaction
      );

      if (!request) throw createRequestNotFoundError();

      const technicians = await requestRepository.findTechniciansByIds(
        technicianIds,
        { transaction }
      );

      if (technicians.length !== technicianIds.length) {
        throw createTechnicianNotFoundError();
      }

      await requestRepository.deleteAssignmentsByRequestId(id, {
        transaction,
      });
      await requestRepository.createAssignments(id, assignees, {
        transaction,
      });

      return requestRepository.findAssignmentsByRequestId(id, {
        transaction,
      });
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw createAssigneeConflictError();
    }

    throw error;
  }
}

export async function removeRequestAssignee(id, technicianId) {
  return sequelize.transaction(async (transaction) => {
    const request = await requestRepository.findByIdForUpdate(id, transaction);

    if (!request) throw createRequestNotFoundError();

    const assignees = await requestRepository.findAssignmentsByRequestId(id, {
      transaction,
    });
    const assignee = assignees.find(
      (item) => item.technicianId === technicianId
    );

    if (!assignee) throw createAssigneeNotFoundError();

    if (assignee.role === 'lead' && assignees.length > 1) {
      throw createTeamRequiresLeadError();
    }

    await requestRepository.removeAssignee(id, technicianId, { transaction });
  });
}

export async function deleteRequest(id) {
  await getRequest(id);
  await requestRepository.remove(id);
}

export async function listRequestsForEquipment(equipmentId, query) {
  await ensureEquipmentExists(equipmentId);
  return requestRepository.findByEquipmentId(equipmentId, query);
}
