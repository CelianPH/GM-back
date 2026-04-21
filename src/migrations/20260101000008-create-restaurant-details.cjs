'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurant_details', {
      establishment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'establishments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      distinction: {
        type: Sequelize.ENUM(
          'none',
          'bib_gourmand',
          'one_star',
          'two_stars',
          'three_stars',
          'green_star'
        ),
        allowNull: false,
        defaultValue: 'none',
      },
      cuisine_type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'cuisine_types', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      price_range: { type: Sequelize.TINYINT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('restaurant_details', ['distinction']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('restaurant_details');
  },
};
