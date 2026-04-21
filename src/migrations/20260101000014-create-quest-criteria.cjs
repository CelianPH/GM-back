'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quest_criteria', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      quest_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'quests', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      criterion_type: {
        type: Sequelize.ENUM(
          'region',
          'distinction',
          'establishment_type',
          'cuisine_type',
          'lodging_type'
        ),
        allowNull: false,
      },
      criterion_value: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('quest_criteria', ['quest_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('quest_criteria');
  },
};
