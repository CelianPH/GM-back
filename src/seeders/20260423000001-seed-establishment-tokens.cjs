'use strict';

const crypto = require('crypto');

module.exports = {
  async up(queryInterface) {
    const establishments = await queryInterface.sequelize.query(
      'SELECT id FROM establishments WHERE qr_token IS NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const est of establishments) {
      const token = 'gm_' + crypto.randomBytes(16).toString('hex');
      await queryInterface.sequelize.query(
        'UPDATE establishments SET qr_token = ? WHERE id = ?',
        { replacements: [token, est.id] }
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'UPDATE establishments SET qr_token = NULL'
    );
  },
};
