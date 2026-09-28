module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'users',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
          },
          email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          password_hash: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          role: {
            type: Sequelize.ENUM('viewer', 'technician', 'admin'),
            allowNull: false,
            defaultValue: 'viewer',
          },
          technician_id: {
            type: Sequelize.UUID,
            allowNull: true,
            unique: true,
            references: {
              model: 'technicians',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
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
        `ALTER TABLE "users"
         ADD CONSTRAINT "users_role_technician_check"
         CHECK ("role" <> 'technician' OR "technician_id" IS NOT NULL)`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('users', { transaction });
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_users_role"',
        { transaction }
      );
    });
  },
};
