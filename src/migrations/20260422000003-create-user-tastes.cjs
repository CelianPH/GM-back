'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_tastes', {
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('envies', 'moments', 'valeurs'),
        allowNull: false,
      },
      tag: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('user_tastes', {
      fields: ['user_id', 'category', 'tag'],
      type: 'primary key',
      name: 'user_tastes_pk',
    });

    await queryInterface.addConstraint('user_tastes', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'user_tastes_user_id_fk',
      references: { table: 'users', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_tastes');
  },
};
