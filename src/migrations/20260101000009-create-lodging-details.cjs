'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lodging_details', {
      establishment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'establishments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      keys_level: { type: Sequelize.TINYINT, allowNull: false },
      lodging_type: {
        type: Sequelize.ENUM('hotel', 'maison_hotes', 'gite', 'lodge', 'autre'),
        allowNull: false,
      },
      rooms_count: { type: Sequelize.INTEGER, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('lodging_details');
  },
};
