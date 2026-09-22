module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'equipment',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
          },
          site_id: {
            type: Sequelize.UUID,
            allowNull: false,
            references: {
              model: 'sites',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false,
          },
          type: {
            type: Sequelize.ENUM('turbine', 'inverter', 'sensor', 'substation'),
            allowNull: false,
          },
          serial_number: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          status: {
            type: Sequelize.ENUM(
              'operational',
              'maintenance',
              'fault',
              'decommissioned'
            ),
            allowNull: false,
          },
          installed_at: {
            type: Sequelize.DATE,
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

      await queryInterface.addIndex('equipment', ['site_id'], {
        name: 'equipment_site_id_idx',
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('equipment', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_equipment_type"',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_equipment_status"',
        { transaction }
      );
    });
  },
};
