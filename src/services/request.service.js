import { randomUUID } from 'node:crypto';
import { sequelize } from '../db/models/index.js';
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

export async function deleteRequest(id) {
  await getRequest(id);
  await requestRepository.remove(id);
}

export async function listRequestsForEquipment(equipmentId, query) {
  await ensureEquipmentExists(equipmentId);
  return requestRepository.findByEquipmentId(equipmentId, query);
}
