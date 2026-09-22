module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'request_assignees',
        {
          request_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            references: {
              model: 'maintenance_requests',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          technician_id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            references: {
              model: 'technicians',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          role: {
            type: Sequelize.ENUM('lead', 'member'),
            allowNull: false,
          },
          hours: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: false,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        'ALTER TABLE "request_assignees" ADD CONSTRAINT "request_assignees_hours_positive_check" CHECK ("hours" > 0)',
        { transaction }
      );
      await queryInterface.addIndex('request_assignees', ['request_id'], {
        name: 'request_assignees_request_id_idx',
        transaction,
      });
      await queryInterface.addIndex('request_assignees', ['technician_id'], {
        name: 'request_assignees_technician_id_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('request_assignees', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_request_assignees_role"',
        { transaction }
      );
    });
  },
};
