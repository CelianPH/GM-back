'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('experiences', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      establishment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'establishments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      experienced_at: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM('validated', 'rejected', 'disputed'),
        allowNull: false,
        defaultValue: 'validated',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('experiences', ['user_id', 'status']);
    await queryInterface.addIndex('experiences', [
      'user_id',
      'establishment_id',
      'status',
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('experiences');
  },
};
