'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('passes', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pass_number: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      level_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'levels', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      title_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'titles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      featured_quest_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'quests', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      experiences_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      points_total: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      member_since: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('passes');
  },
};
