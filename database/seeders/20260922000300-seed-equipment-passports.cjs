const { Op } = require('sequelize');
const { equipmentIds, passportIds } = require('../seed-ids.cjs');

module.exports = {
  async up(queryInterface) {
    const createdAt = new Date('2026-01-03T08:00:00Z');

    await queryInterface.bulkInsert('equipment_passports', [
      {
        id: passportIds[0],
        equipment_id: equipmentIds[0],
        manufacturer: 'Demo Wind Systems',
        model: 'DW-3000',
        rated_power: 3000,
        last_verification_at: new Date('2025-12-10T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: passportIds[1],
        equipment_id: equipmentIds[1],
        manufacturer: 'Demo Power Electronics',
        model: 'DPE-850',
        rated_power: 850,
        last_verification_at: new Date('2025-11-18T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: passportIds[2],
        equipment_id: equipmentIds[2],
        manufacturer: 'Demo Sensor Lab',
        model: 'DSL-WIND-4',
        rated_power: null,
        last_verification_at: new Date('2025-10-05T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: passportIds[3],
        equipment_id: equipmentIds[3],
        manufacturer: 'Demo Grid Works',
        model: 'DGW-110',
        rated_power: 10000,
        last_verification_at: new Date('2025-09-12T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: passportIds[4],
        equipment_id: equipmentIds[4],
        manufacturer: 'Demo Solar Energy',
        model: 'DSE-500',
        rated_power: 500,
        last_verification_at: new Date('2025-08-20T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: passportIds[5],
        equipment_id: equipmentIds[5],
        manufacturer: 'Demo Sensor Lab',
        model: 'DSL-SOLAR-2',
        rated_power: null,
        last_verification_at: null,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('equipment_passports', {
      id: { [Op.in]: passportIds },
    });
  },
};
