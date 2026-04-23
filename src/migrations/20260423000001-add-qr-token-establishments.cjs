'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('establishments', 'qr_token', {
      type: Sequelize.STRING(64),
      allowNull: true,
      unique: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('establishments', 'qr_token');
  },
};
