const { Op } = require('sequelize');
const { technicianIds } = require('../seed-ids.cjs');

const demoUsers = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    email: 'technician.demo@example.test',
    password_hash:
      'scrypt$v1$N=16384,r=8,p=1$yjygqH1D29RyNdevjnEswQ$4QhPbor4IOiHzcLDis7piPptVYyCXBkwCw5TcqfoWUZ_iBp7ZlvrPK6Q6pqQJyKhm2xbhAX53SLOvSaJY9WCdw',
    role: 'technician',
    technician_id: technicianIds[0],
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    email: 'admin.demo@example.test',
    password_hash:
      'scrypt$v1$N=16384,r=8,p=1$atjq3_T6jaCJkMxi0tlmww$4vyF0ge5XpgIerr1PxzJCMYHmsAU3koCjDedkafEBmD1j3Xgejz5sum_4Bsf5ty4kSrZbU1eAqg-H3u2FvN82g',
    role: 'admin',
    technician_id: null,
  },
];

module.exports = {
  async up(queryInterface) {
    const createdAt = new Date('2026-10-02T08:00:00Z');

    await queryInterface.bulkInsert(
      'users',
      demoUsers.map((user) => ({
        ...user,
        created_at: createdAt,
        updated_at: createdAt,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: { [Op.in]: demoUsers.map((user) => user.email) },
    });
  },
};
