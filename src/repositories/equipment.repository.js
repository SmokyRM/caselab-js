import { randomUUID } from 'node:crypto';
import {
  ForeignKeyConstraintError,
  Op,
  UniqueConstraintError,
} from 'sequelize';
import {
  Equipment,
  EquipmentPassport,
  Site,
  sequelize,
} from '../db/models/index.js';
import { ConflictError } from '../errors/ConflictError.js';

const sortFields = {
  name: 'name',
  type: 'type',
  serialNumber: 'serial_number',
  status: 'status',
  installedAt: 'installed_at',
};

const siteInclude = {
  model: Site,
  as: 'site',
  attributes: ['lat', 'lon'],
  required: true,
};

function toIsoString(value) {
  return value ? new Date(value).toISOString() : null;
}

function toDateString(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function mapPassport(passport) {
  if (!passport) return null;

  const plainPassport = passport.get({ plain: true });

  return {
    id: plainPassport.id,
    equipmentId: plainPassport.equipment_id,
    manufacturer: plainPassport.manufacturer,
    model: plainPassport.model,
    ratedPower:
      plainPassport.rated_power === null
        ? null
        : Number(plainPassport.rated_power),
    lastVerificationAt: toIsoString(plainPassport.last_verification_at),
  };
}

function mapEquipment(equipment) {
  if (!equipment) return null;

  const plainEquipment = equipment.get({ plain: true });
  const result = {
    id: plainEquipment.id,
    name: plainEquipment.name,
    type: plainEquipment.type,
    serialNumber: plainEquipment.serial_number,
    location: {
      lat: Number(plainEquipment.site.lat),
      lon: Number(plainEquipment.site.lon),
    },
    status: plainEquipment.status,
    installedAt: toDateString(plainEquipment.installed_at),
  };

  if (Object.hasOwn(plainEquipment, 'passport')) {
    result.passport = mapPassport(equipment.passport);
  }

  return result;
}

function createSerialConflictError(serialNumber) {
  return new ConflictError(
    `Оборудование с серийным номером "${serialNumber}" уже существует.`,
    'EQUIPMENT_SERIAL_CONFLICT'
  );
}

function isSerialNumberConflict(error) {
  return (
    error instanceof UniqueConstraintError &&
    Object.hasOwn(error.fields ?? {}, 'serial_number')
  );
}

async function findOrCreateSite(location, transaction) {
  const existingSite = await Site.findOne({
    where: {
      lat: location.lat,
      lon: location.lon,
    },
    transaction,
  });

  if (existingSite) return existingSite;

  const uniqueValue = randomUUID();

  return Site.create(
    {
      name: 'API site',
      code: `API-${uniqueValue}`,
      region: 'API-created',
      lat: location.lat,
      lon: location.lon,
    },
    { transaction }
  );
}

function mapEquipmentChanges(changes) {
  const mappedChanges = {};

  if (Object.hasOwn(changes, 'name')) mappedChanges.name = changes.name;
  if (Object.hasOwn(changes, 'type')) mappedChanges.type = changes.type;
  if (Object.hasOwn(changes, 'serialNumber')) {
    mappedChanges.serial_number = changes.serialNumber;
  }
  if (Object.hasOwn(changes, 'status')) mappedChanges.status = changes.status;
  if (Object.hasOwn(changes, 'installedAt')) {
    mappedChanges.installed_at = changes.installedAt;
  }

  return mappedChanges;
}

async function findEquipmentById(id, includePassport = false) {
  const include = [siteInclude];

  if (includePassport) {
    include.push({
      model: EquipmentPassport,
      as: 'passport',
      attributes: [
        'id',
        'equipment_id',
        'manufacturer',
        'model',
        'rated_power',
        'last_verification_at',
      ],
    });
  }

  return Equipment.findByPk(id, {
    attributes: [
      'id',
      'name',
      'type',
      'serial_number',
      'status',
      'installed_at',
    ],
    include,
  });
}

export async function findAll(options) {
  const {
    status,
    type,
    installedFrom,
    installedTo,
    sortBy,
    sortOrder,
    page,
    limit,
  } = options;
  const where = {};

  if (status) where.status = status;
  if (type) where.type = type;
  if (installedFrom || installedTo) {
    where.installed_at = {};
    if (installedFrom) where.installed_at[Op.gte] = installedFrom;
    if (installedTo) where.installed_at[Op.lte] = installedTo;
  }

  const { rows, count } = await Equipment.findAndCountAll({
    attributes: [
      'id',
      'name',
      'type',
      'serial_number',
      'status',
      'installed_at',
    ],
    where,
    include: [siteInclude],
    order: [[sortFields[sortBy], sortOrder.toUpperCase()]],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    items: rows.map(mapEquipment),
    total: count,
  };
}

export async function findById(id) {
  const equipment = await findEquipmentById(id, true);
  return mapEquipment(equipment);
}

export async function findBySerialNumber(serialNumber) {
  const equipment = await Equipment.findOne({
    attributes: [
      'id',
      'name',
      'type',
      'serial_number',
      'status',
      'installed_at',
    ],
    where: { serial_number: serialNumber },
    include: [siteInclude],
  });

  return mapEquipment(equipment);
}

export async function create(data) {
  try {
    const equipmentId = await sequelize.transaction(async (transaction) => {
      const site = await findOrCreateSite(data.location, transaction);
      const equipment = await Equipment.create(
        {
          id: data.id,
          site_id: site.id,
          name: data.name,
          type: data.type,
          serial_number: data.serialNumber,
          status: data.status,
          installed_at: data.installedAt,
        },
        { transaction }
      );

      return equipment.id;
    });

    const equipment = await findEquipmentById(equipmentId);
    return mapEquipment(equipment);
  } catch (error) {
    if (isSerialNumberConflict(error)) {
      throw createSerialConflictError(data.serialNumber);
    }

    throw error;
  }
}

export async function update(id, changes) {
  try {
    const updated = await sequelize.transaction(async (transaction) => {
      const equipment = await Equipment.findByPk(id, { transaction });

      if (!equipment) return false;

      const mappedChanges = mapEquipmentChanges(changes);

      if (changes.location) {
        const site = await findOrCreateSite(changes.location, transaction);
        mappedChanges.site_id = site.id;
      }

      equipment.set(mappedChanges);
      await equipment.save({ transaction });
      return true;
    });

    if (!updated) return null;

    const equipment = await findEquipmentById(id);
    return mapEquipment(equipment);
  } catch (error) {
    if (isSerialNumberConflict(error)) {
      throw createSerialConflictError(changes.serialNumber);
    }

    throw error;
  }
}

export async function remove(id) {
  try {
    const removedCount = await Equipment.destroy({ where: { id } });
    return removedCount > 0;
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      throw new ConflictError(
        'Нельзя удалить оборудование, связанное с заявками.',
        'EQUIPMENT_HAS_REQUESTS'
      );
    }

    throw error;
  }
}
