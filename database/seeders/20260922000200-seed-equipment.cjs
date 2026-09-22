const { Op } = require('sequelize');
const { equipmentIds, siteIds } = require('../seed-ids.cjs');

module.exports = {
  async up(queryInterface) {
    const createdAt = new Date('2026-01-02T08:00:00Z');

    await queryInterface.bulkInsert('equipment', [
      {
        id: equipmentIds[0],
        site_id: siteIds[0],
        name: 'North Turbine A',
        type: 'turbine',
        serial_number: 'NW-TUR-001',
        status: 'operational',
        installed_at: new Date('2021-05-10T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: equipmentIds[1],
        site_id: siteIds[0],
        name: 'North Inverter A',
        type: 'inverter',
        serial_number: 'NW-INV-001',
        status: 'maintenance',
        installed_at: new Date('2022-03-15T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: equipmentIds[2],
        site_id: siteIds[0],
        name: 'North Wind Sensor',
        type: 'sensor',
        serial_number: 'NW-SEN-001',
        status: 'fault',
        installed_at: new Date('2023-06-01T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: equipmentIds[3],
        site_id: siteIds[1],
        name: 'Alpha Substation',
        type: 'substation',
        serial_number: 'SA-SUB-001',
        status: 'operational',
        installed_at: new Date('2020-09-20T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: equipmentIds[4],
        site_id: siteIds[1],
        name: 'Alpha Inverter B',
        type: 'inverter',
        serial_number: 'SA-INV-002',
        status: 'decommissioned',
        installed_at: new Date('2019-11-12T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: equipmentIds[5],
        site_id: siteIds[1],
        name: 'Alpha Irradiance Sensor',
        type: 'sensor',
        serial_number: 'SA-SEN-003',
        status: 'operational',
        installed_at: new Date('2024-02-18T00:00:00Z'),
        created_at: createdAt,
        updated_at: createdAt,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('equipment', {
      id: { [Op.in]: equipmentIds },
    });
  },
};
