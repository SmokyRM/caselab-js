const { Op } = require('sequelize');
const { equipmentIds, requestIds } = require('../seed-ids.cjs');

const requestDefinitions = [
  [
    0,
    'Проверка редуктора турбины',
    'critical',
    'done',
    '2026-01-05',
    '2026-01-08',
  ],
  [1, 'Замена силового модуля', 'high', 'done', '2026-02-01', '2026-02-04'],
  [
    2,
    'Диагностика датчика ветра',
    'high',
    'in_progress',
    '2026-03-10',
    '2026-03-11',
  ],
  [
    3,
    'Плановый осмотр подстанции',
    'medium',
    'new',
    '2026-04-05',
    '2026-04-05',
  ],
  [
    4,
    'Оценка состояния инвертора',
    'low',
    'rejected',
    '2026-04-15',
    '2026-04-16',
  ],
  [
    5,
    'Калибровка датчика инсоляции',
    'medium',
    'done',
    '2026-05-01',
    '2026-05-06',
  ],
  [
    0,
    'Проверка системы торможения',
    'critical',
    'in_progress',
    '2026-06-10',
    '2026-06-11',
  ],
  [1, 'Очистка вентиляции инвертора', 'low', 'new', '2026-06-20', '2026-06-20'],
  [2, 'Замена кабеля датчика', 'high', 'rejected', '2026-07-01', '2026-07-02'],
  [3, 'Тест защитных реле', 'low', 'done', '2026-07-05', '2026-07-07'],
  [
    4,
    'Демонтаж устаревшего модуля',
    'medium',
    'in_progress',
    '2026-07-20',
    '2026-07-21',
  ],
  [
    5,
    'Проверка точности измерений',
    'critical',
    'new',
    '2026-08-01',
    '2026-08-01',
  ],
  [0, 'Замена масла редуктора', 'high', 'done', '2026-08-05', '2026-08-10'],
  [
    1,
    'Обновление прошивки контроллера',
    'medium',
    'rejected',
    '2026-08-12',
    '2026-08-13',
  ],
  [2, 'Осмотр крепления анемометра', 'high', 'new', '2026-08-20', '2026-08-20'],
  [
    3,
    'Тепловизионный контроль шин',
    'low',
    'in_progress',
    '2026-09-01',
    '2026-09-02',
  ],
  [
    4,
    'Утилизация силовых конденсаторов',
    'critical',
    'done',
    '2026-09-03',
    '2026-09-08',
  ],
  [5, 'Сверка показаний датчика', 'medium', 'new', '2026-09-10', '2026-09-10'],
  [
    0,
    'Проверка молниезащиты',
    'critical',
    'rejected',
    '2026-09-12',
    '2026-09-13',
  ],
  [
    1,
    'Замена фильтров охлаждения',
    'medium',
    'done',
    '2026-09-14',
    '2026-09-18',
  ],
];

module.exports = {
  async up(queryInterface) {
    const rows = requestDefinitions.map(
      (
        [equipmentIndex, title, priority, status, createdDate, updatedDate],
        index
      ) => ({
        id: requestIds[index],
        equipment_id: equipmentIds[equipmentIndex],
        title,
        description: `Демонстрационная заявка: ${title.toLowerCase()}.`,
        priority,
        status,
        planned_at:
          index % 3 === 0 ? new Date(`${createdDate}T12:00:00Z`) : null,
        author: index % 2 === 0 ? 'demo.dispatcher' : 'demo.engineer',
        created_at: new Date(`${createdDate}T08:00:00Z`),
        updated_at: new Date(`${updatedDate}T17:00:00Z`),
      })
    );

    await queryInterface.bulkInsert('maintenance_requests', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('maintenance_requests', {
      id: { [Op.in]: requestIds },
    });
  },
};
