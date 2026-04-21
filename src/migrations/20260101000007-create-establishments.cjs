'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('establishments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM('restaurant', 'lodging'),
        allowNull: false,
      },
      region_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'regions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      city: { type: Sequelize.STRING, allowNull: false },
      postal_code: { type: Sequelize.STRING(10), allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      lat: { type: Sequelize.FLOAT, allowNull: false },
      lng: { type: Sequelize.FLOAT, allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: true },
      website: { type: Sequelize.STRING, allowNull: true },
      email: { type: Sequelize.STRING, allowNull: true },
      cover_image_url: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      validation_qr_token: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      qr_generated_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('establishments', ['region_id']);
    await queryInterface.addIndex('establishments', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('establishments');
  },
};
