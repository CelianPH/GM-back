'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('videos', {
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
      title: { type: Sequelize.STRING, allowNull: false },
      audience: {
        type: Sequelize.ENUM('all', 'firstvisit', 'archetype'),
        allowNull: false,
        defaultValue: 'all',
      },
      archetype_ids: { type: Sequelize.JSON, allowNull: true },
      status: {
        type: Sequelize.ENUM('active', 'paused'),
        allowNull: false,
        defaultValue: 'active',
      },
      duration_sec: { type: Sequelize.INTEGER, allowNull: true },
      thumb_url: { type: Sequelize.STRING, allowNull: true },
      media_url: { type: Sequelize.STRING, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('videos', ['establishment_id']);
    await queryInterface.addIndex('videos', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('videos');
  },
};
