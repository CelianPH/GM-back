'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quests', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      type: {
        type: Sequelize.ENUM('region', 'category', 'mixed', 'seasonal'),
        allowNull: false,
      },
      target_count: { type: Sequelize.INTEGER, allowNull: false },
      reward_points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reward_badge_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'badges', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      starts_at: { type: Sequelize.DATE, allowNull: true },
      ends_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('quests');
  },
};
