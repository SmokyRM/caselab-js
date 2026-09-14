import { randomUUID } from 'node:crypto';
import { ConflictError } from '../errors/ConflictError.js';
import { NotFoundError } from '../errors/NotFoundError.js';
import * as equipmentRepository from '../repositories/equipment.repository.js';

function createNotFoundError() {
  return new NotFoundError('Оборудование не найдено.', 'EQUIPMENT_NOT_FOUND');
}

export async function listEquipment(query) {
  return equipmentRepository.findAll(query);
}

export async function getEquipment(id) {
  const equipment = await equipmentRepository.findById(id);

  if (!equipment) throw createNotFoundError();

  return equipment;
}

export async function createEquipment(data) {
  const equipmentWithSameSerial = await equipmentRepository.findBySerialNumber(
    data.serialNumber
  );

  if (equipmentWithSameSerial) {
    throw new ConflictError(
      `Оборудование с серийным номером "${data.serialNumber}" уже существует.`,
      'EQUIPMENT_SERIAL_CONFLICT'
    );
  }

  return equipmentRepository.create({ id: randomUUID(), ...data });
}

export async function updateEquipment(id, data) {
  const equipment = await getEquipment(id);

  if (data.serialNumber && data.serialNumber !== equipment.serialNumber) {
    const equipmentWithSameSerial =
      await equipmentRepository.findBySerialNumber(data.serialNumber);

    if (equipmentWithSameSerial) {
      throw new ConflictError(
        `Оборудование с серийным номером "${data.serialNumber}" уже существует.`,
        'EQUIPMENT_SERIAL_CONFLICT'
      );
    }
  }

  return equipmentRepository.update(id, data);
}

export async function deleteEquipment(id) {
  await getEquipment(id);
  await equipmentRepository.remove(id);
}
