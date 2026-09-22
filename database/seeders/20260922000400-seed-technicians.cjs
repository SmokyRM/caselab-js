const { Op } = require('sequelize');
const { technicianIds } = require('../seed-ids.cjs');

module.exports = {
  async up(queryInterface) {
    const createdAt = new Date('2026-01-04T08:00:00Z');

    await queryInterface.bulkInsert('technicians', [
      {
        id: technicianIds[0],
        full_name: 'Алексей Ветров',
        specialization: 'wind turbine',
        employee_number: 'DEMO-TECH-001',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: technicianIds[1],
        full_name: 'Марина Искрова',
        specialization: 'electrical',
        employee_number: 'DEMO-TECH-002',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: technicianIds[2],
        full_name: 'Павел Схемин',
        specialization: 'automation',
        employee_number: 'DEMO-TECH-003',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: technicianIds[3],
        full_name: 'Ольга Токарева',
        specialization: 'substation',
        employee_number: 'DEMO-TECH-004',
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: technicianIds[4],
        full_name: 'Илья Диагностов',
        specialization: 'diagnostics',
        employee_number: 'DEMO-TECH-005',
        created_at: createdAt,
        updated_at: createdAt,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('technicians', {
      id: { [Op.in]: technicianIds },
    });
  },
};
