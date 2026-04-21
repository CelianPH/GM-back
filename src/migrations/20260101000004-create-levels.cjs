'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('levels', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      rank: {
        type: Sequelize.ENUM(
          'commis',
          'chef_de_partie',
          'sous_chef',
          'chef',
          'chef_etoile'
        ),
        allowNull: false,
        unique: true,
      },
      tier_name: { type: Sequelize.STRING, allowNull: false },
      min_experiences: { type: Sequelize.INTEGER, allowNull: false },
      color: { type: Sequelize.STRING, allowNull: true },
      icon: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('levels');
  },
};
