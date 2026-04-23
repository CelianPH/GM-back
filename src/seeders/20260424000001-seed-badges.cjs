'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.sequelize.query(
      `INSERT INTO badges (id, name, description, icon, tier, created_at, updated_at) VALUES
        (1, 'Premier pas',    'À ton premier check-in',       'star',    'bronze', ?, ?),
        (2, 'Bib Hunter',     'Valide 10 Bib Gourmand',       'flag',    'silver', ?, ?),
        (3, 'Tour de France', 'Explore 5 régions',            'compass', 'silver', ?, ?),
        (4, 'Trois étoiles',  'Un 3 étoiles au compteur',     'star',    'gold',   ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      { replacements: [now, now, now, now, now, now, now, now] }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM badges WHERE id IN (1, 2, 3, 4)');
  },
};
