'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('titles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      tagline: { type: Sequelize.STRING, allowNull: false },
      theme_hint: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('titles');
  },
};
