module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'sites',
        {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true,
            defaultValue: Sequelize.literal('gen_random_uuid()'),
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          code: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          region: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          lat: {
            type: Sequelize.DECIMAL(9, 6),
            allowNull: false,
          },
          lon: {
            type: Sequelize.DECIMAL(9, 6),
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
        'ALTER TABLE "sites" ADD CONSTRAINT "sites_lat_range_check" CHECK ("lat" BETWEEN -90 AND 90)',
        { transaction }
      );

      await queryInterface.sequelize.query(
        'ALTER TABLE "sites" ADD CONSTRAINT "sites_lon_range_check" CHECK ("lon" BETWEEN -180 AND 180)',
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sites');
  },
};
