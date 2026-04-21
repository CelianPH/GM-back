'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('establishment_managers', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      establishment_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: { model: 'establishments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'manager', 'staff'),
        allowNull: false,
        defaultValue: 'manager',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('establishment_managers');
  },
};
