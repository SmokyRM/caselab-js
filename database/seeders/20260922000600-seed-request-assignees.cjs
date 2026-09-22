const { Op } = require('sequelize');
const { requestIds, technicianIds } = require('../seed-ids.cjs');

const assignmentDefinitions = [
  [0, 1, 'lead', 16],
  [0, 4, 'member', 8],
  [1, 0, 'lead', 12],
  [2, 0, 'lead', 8],
  [2, 2, 'member', 4],
  [5, 3, 'lead', 20],
  [5, 2, 'member', 6],
  [6, 1, 'lead', 12],
  [9, 4, 'lead', 7],
  [10, 3, 'lead', 6],
  [10, 4, 'member', 3],
  [12, 1, 'lead', 14],
  [12, 0, 'member', 5],
  [15, 2, 'lead', 10],
  [15, 0, 'member', 5],
  [16, 3, 'lead', 18],
  [16, 4, 'member', 10],
  [19, 2, 'lead', 9],
];

module.exports = {
  async up(queryInterface) {
    const createdAt = new Date('2026-09-20T08:00:00Z');
    const rows = assignmentDefinitions.map(
      ([requestIndex, technicianIndex, role, hours]) => ({
        request_id: requestIds[requestIndex],
        technician_id: technicianIds[technicianIndex],
        role,
        hours,
        created_at: createdAt,
        updated_at: createdAt,
      })
    );

    await queryInterface.bulkInsert('request_assignees', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('request_assignees', {
      request_id: { [Op.in]: requestIds },
    });
  },
};
