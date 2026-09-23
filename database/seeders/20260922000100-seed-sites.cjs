const { Op } = require('sequelize');
const { siteIds } = require('../seed-ids.cjs');

module.exports = {
  async up(queryInterface) {
    const createdAt = new Date('2026-01-01T08:00:00Z');

    await queryInterface.bulkInsert('sites', [
      {
        id: siteIds[0],
        name: 'North Wind Site',
        code: 'NORTH-WIND-01',
        region: 'Northern District',
        lat: 66.5039,
        lon: 25.7294,
        created_at: createdAt,
        updated_at: createdAt,
      },
      {
        id: siteIds[1],
        name: 'Solar Field Alpha',
        code: 'SOLAR-ALPHA-01',
        region: 'Southern District',
        lat: 44.6167,
        lon: 33.5254,
        created_at: createdAt,
        updated_at: createdAt,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sites', {
      id: { [Op.in]: siteIds },
    });
  },
};
