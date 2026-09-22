module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'maintenance_requests',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
          },
          equipment_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'equipment',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          title: {
            type: Sequelize.STRING(120),
            allowNull: false,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
          },
          status: {
            type: Sequelize.ENUM('new', 'in_progress', 'done', 'rejected'),
            allowNull: false,
            defaultValue: 'new',
          },
          planned_at: {
            type: Sequelize.DATE,
            allowNull: true,
          },
          author: {
            type: Sequelize.STRING,
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

      await queryInterface.addIndex('maintenance_requests', ['equipment_id'], {
        name: 'maintenance_requests_equipment_id_idx',
        transaction,
      });
      await queryInterface.addIndex('maintenance_requests', ['status'], {
        name: 'maintenance_requests_status_idx',
        transaction,
      });
      await queryInterface.addIndex('maintenance_requests', ['priority'], {
        name: 'maintenance_requests_priority_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('maintenance_requests', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_maintenance_requests_priority"',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_maintenance_requests_status"',
        { transaction }
      );
    });
  },
};
