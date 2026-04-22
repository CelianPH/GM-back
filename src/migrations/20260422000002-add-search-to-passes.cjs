'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('passes', 'search_city', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('passes', 'search_radius_km', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('passes', 'search_city');
    await queryInterface.removeColumn('passes', 'search_radius_km');
  },
};
