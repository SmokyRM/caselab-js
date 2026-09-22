const { Op } = require('sequelize');
const { createHistoryId, requestIds } = require('../seed-ids.cjs');

const histories = [
  [
    ['new', '2026-01-05'],
    ['in_progress', '2026-01-06'],
    ['done', '2026-01-08'],
  ],
  [
    ['new', '2026-02-01'],
    ['in_progress', '2026-02-02'],
    ['done', '2026-02-04'],
  ],
  [
    ['new', '2026-03-10'],
    ['in_progress', '2026-03-11'],
  ],
  [['new', '2026-04-05']],
  [
    ['new', '2026-04-15'],
    ['rejected', '2026-04-16'],
  ],
  [
    ['new', '2026-05-01'],
    ['in_progress', '2026-05-02'],
    ['done', '2026-05-06'],
  ],
  [
    ['new', '2026-06-10'],
    ['in_progress', '2026-06-11'],
  ],
  [['new', '2026-06-20']],
  [
    ['new', '2026-07-01'],
    ['rejected', '2026-07-02'],
  ],
  [
    ['new', '2026-07-05'],
    ['in_progress', '2026-07-06'],
    ['done', '2026-07-07'],
  ],
  [
    ['new', '2026-07-20'],
    ['in_progress', '2026-07-21'],
  ],
  [['new', '2026-08-01']],
  [
    ['new', '2026-08-05'],
    ['in_progress', '2026-08-06'],
    ['done', '2026-08-10'],
  ],
  [
    ['new', '2026-08-12'],
    ['rejected', '2026-08-13'],
  ],
  [['new', '2026-08-20']],
  [
    ['new', '2026-09-01'],
    ['in_progress', '2026-09-02'],
  ],
  [
    ['new', '2026-09-03'],
    ['in_progress', '2026-09-04'],
    ['done', '2026-09-08'],
  ],
  [['new', '2026-09-10']],
  [
    ['new', '2026-09-12'],
    ['in_progress', '2026-09-12'],
    ['rejected', '2026-09-13'],
  ],
  [
    ['new', '2026-09-14'],
    ['in_progress', '2026-09-15'],
    ['done', '2026-09-18'],
  ],
];

module.exports = {
  async up(queryInterface) {
    let historyIndex = 0;
    const rows = histories.flatMap((entries, requestIndex) =>
      entries.map(([newStatus, date], entryIndex) => {
        historyIndex += 1;

        return {
          id: createHistoryId(historyIndex),
          request_id: requestIds[requestIndex],
          old_status: entryIndex === 0 ? null : entries[entryIndex - 1][0],
          new_status: newStatus,
          author: 'demo.audit',
          comment:
            entryIndex === 0
              ? 'Заявка зарегистрирована.'
              : `Статус изменён на ${newStatus}.`,
          created_at: new Date(
            `${date}T${entryIndex === 0 ? '08:00:00' : '12:00:00'}Z`
          ),
        };
      })
    );

    await queryInterface.bulkInsert('request_status_history', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('request_status_history', {
      request_id: { [Op.in]: requestIds },
    });
  },
};
