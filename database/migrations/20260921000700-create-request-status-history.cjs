module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'request_status_history',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
          },
          request_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'maintenance_requests',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          old_status: {
            type: Sequelize.ENUM('new', 'in_progress', 'done', 'rejected'),
            allowNull: true,
          },
          new_status: {
            type: Sequelize.ENUM('new', 'in_progress', 'done', 'rejected'),
            allowNull: false,
          },
          author: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          comment: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction }
      );

      await queryInterface.addIndex('request_status_history', ['request_id'], {
        name: 'request_status_history_request_id_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('request_status_history', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_request_status_history_old_status"',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_request_status_history_new_status"',
        { transaction }
      );
    });
  },
};
