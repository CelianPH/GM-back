'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pro_quests', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      establishment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'establishments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('active', 'draft', 'done'),
        allowNull: false,
        defaultValue: 'draft',
      },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      starts_at: { type: Sequelize.DATE, allowNull: true },
      ends_at: { type: Sequelize.DATE, allowNull: true },
      reward_points: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      reward_video_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'videos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      goal_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      done_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('pro_quests', ['establishment_id']);
    await queryInterface.addIndex('pro_quests', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pro_quests');
  },
};
