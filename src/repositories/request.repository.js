import { ForeignKeyConstraintError, Op } from 'sequelize';
import {
  MaintenanceRequest,
  RequestStatusHistory,
} from '../db/models/index.js';
import { NotFoundError } from '../errors/NotFoundError.js';

const sortFields = {
  title: 'title',
  priority: 'priority',
  status: 'status',
  plannedAt: 'planned_at',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

function toIsoString(value) {
  return value ? new Date(value).toISOString() : null;
}

function mapRequest(request) {
  if (!request) return null;

  const plainRequest = request.get({ plain: true });

  return {
    id: plainRequest.id,
    equipmentId: plainRequest.equipment_id,
    title: plainRequest.title,
    description: plainRequest.description,
    priority: plainRequest.priority,
    status: plainRequest.status,
    plannedAt: toIsoString(plainRequest.planned_at),
    createdAt: toIsoString(plainRequest.created_at),
    updatedAt: toIsoString(plainRequest.updated_at),
  };
}

function mapStatusHistory(history) {
  const plainHistory = history.get({ plain: true });

  return {
    id: plainHistory.id,
    requestId: plainHistory.request_id,
    oldStatus: plainHistory.old_status,
    newStatus: plainHistory.new_status,
    author: plainHistory.author,
    comment: plainHistory.comment,
    createdAt: toIsoString(plainHistory.created_at),
  };
}

function createEquipmentNotFoundError() {
  return new NotFoundError('Оборудование не найдено.', 'EQUIPMENT_NOT_FOUND');
}

function buildWhere(options) {
  const where = {};

  if (options.status) where.status = options.status;
  if (options.priority) where.priority = options.priority;
  if (options.equipmentId) where.equipment_id = options.equipmentId;
  if (options.createdFrom || options.createdTo) {
    where.created_at = {};
    if (options.createdFrom) where.created_at[Op.gte] = options.createdFrom;
    if (options.createdTo) where.created_at[Op.lte] = options.createdTo;
  }

  return where;
}

function mapRequestChanges(changes) {
  const mappedChanges = {};

  if (Object.hasOwn(changes, 'equipmentId')) {
    mappedChanges.equipment_id = changes.equipmentId;
  }
  if (Object.hasOwn(changes, 'title')) mappedChanges.title = changes.title;
  if (Object.hasOwn(changes, 'description')) {
    mappedChanges.description = changes.description;
  }
  if (Object.hasOwn(changes, 'priority')) {
    mappedChanges.priority = changes.priority;
  }
  if (Object.hasOwn(changes, 'status')) mappedChanges.status = changes.status;
  if (Object.hasOwn(changes, 'plannedAt')) {
    mappedChanges.planned_at = changes.plannedAt;
  }
  if (Object.hasOwn(changes, 'updatedAt')) {
    mappedChanges.updated_at = changes.updatedAt;
  }

  return mappedChanges;
}

export async function findAll(options) {
  const { sortBy, sortOrder, page, limit } = options;
  const { rows, count } = await MaintenanceRequest.findAndCountAll({
    attributes: [
      'id',
      'equipment_id',
      'title',
      'description',
      'priority',
      'status',
      'planned_at',
      'created_at',
      'updated_at',
    ],
    where: buildWhere(options),
    order: [[sortFields[sortBy], sortOrder.toUpperCase()]],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    items: rows.map(mapRequest),
    total: count,
  };
}

export async function findById(id) {
  const request = await MaintenanceRequest.findByPk(id, {
    attributes: [
      'id',
      'equipment_id',
      'title',
      'description',
      'priority',
      'status',
      'planned_at',
      'created_at',
      'updated_at',
    ],
  });

  return mapRequest(request);
}

export async function findByIdForUpdate(id, transaction) {
  const request = await MaintenanceRequest.findByPk(id, {
    attributes: [
      'id',
      'equipment_id',
      'title',
      'description',
      'priority',
      'status',
      'planned_at',
      'created_at',
      'updated_at',
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  return mapRequest(request);
}

export async function findByEquipmentId(equipmentId, options) {
  return findAll({ ...options, equipmentId });
}

export async function create(data) {
  try {
    const request = await MaintenanceRequest.create({
      id: data.id,
      equipment_id: data.equipmentId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority,
      status: data.status,
      planned_at: data.plannedAt ?? null,
      author: 'api',
      created_at: data.createdAt,
      updated_at: data.updatedAt,
    });

    return mapRequest(request);
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      throw createEquipmentNotFoundError();
    }

    throw error;
  }
}

export async function update(id, changes, options = {}) {
  try {
    const mappedChanges = mapRequestChanges(changes);
    const [updatedCount] = await MaintenanceRequest.update(mappedChanges, {
      where: { id },
      transaction: options.transaction,
      silent: Object.hasOwn(mappedChanges, 'updated_at'),
    });

    if (updatedCount === 0) return null;

    const request = await MaintenanceRequest.findByPk(id, {
      transaction: options.transaction,
    });

    return mapRequest(request);
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      throw createEquipmentNotFoundError();
    }

    throw error;
  }
}

export async function createStatusHistory(data, options = {}) {
  const history = await RequestStatusHistory.create(
    {
      request_id: data.requestId,
      old_status: data.oldStatus,
      new_status: data.newStatus,
      author: data.author,
      comment: data.comment,
      created_at: data.createdAt,
    },
    { transaction: options.transaction }
  );

  return mapStatusHistory(history);
}

export async function findStatusHistoryByRequestId(requestId) {
  const history = await RequestStatusHistory.findAll({
    attributes: [
      'id',
      'request_id',
      'old_status',
      'new_status',
      'author',
      'comment',
      'created_at',
    ],
    where: { request_id: requestId },
    order: [
      ['created_at', 'ASC'],
      ['id', 'ASC'],
    ],
  });

  return history.map(mapStatusHistory);
}

export async function remove(id) {
  const removedCount = await MaintenanceRequest.destroy({ where: { id } });
  return removedCount > 0;
}

export async function hasOpenByEquipmentId(equipmentId) {
  const openRequestCount = await MaintenanceRequest.count({
    where: {
      equipment_id: equipmentId,
      status: { [Op.in]: ['new', 'in_progress'] },
    },
  });

  return openRequestCount > 0;
}
