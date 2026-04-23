'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const [q1] = await queryInterface.sequelize.query(
      `INSERT INTO quests (title, description, type, target_count, reward_points, created_at, updated_at)
       VALUES (?, ?, 'category', 3, 100, ?, ?)`,
      { replacements: ['Les Bib de ta ville', 'Trois tables Bib Gourmand. Une cuisine qui ne triche pas.', now, now] }
    );
    await queryInterface.sequelize.query(
      `INSERT INTO quest_criteria (quest_id, criterion_type, criterion_value, created_at, updated_at)
       VALUES (?, 'distinction', 'bib_gourmand', ?, ?)`,
      { replacements: [q1, now, now] }
    );

    const [q2] = await queryInterface.sequelize.query(
      `INSERT INTO quests (title, description, type, target_count, reward_points, created_at, updated_at)
       VALUES (?, ?, 'category', 1, 50, ?, ?)`,
      { replacements: ['Premier étoilé', 'Ton premier restaurant étoilé Michelin.', now, now] }
    );
    await queryInterface.sequelize.query(
      `INSERT INTO quest_criteria (quest_id, criterion_type, criterion_value, created_at, updated_at)
       VALUES (?, 'distinction', 'one_star', ?, ?)`,
      { replacements: [q2, now, now] }
    );

    const [q3] = await queryInterface.sequelize.query(
      `INSERT INTO quests (title, description, type, target_count, reward_points, created_at, updated_at)
       VALUES (?, ?, 'mixed', 5, 75, ?, ?)`,
      { replacements: ['Tour de région', 'Cinq établissements, peu importe lesquels. Commence à marcher.', now, now] }
    );
    // Pas de critère — toute visite compte

    const [q4] = await queryInterface.sequelize.query(
      `INSERT INTO quests (title, description, type, target_count, reward_points, created_at, updated_at)
       VALUES (?, ?, 'category', 3, 200, ?, ?)`,
      { replacements: ['Les grandes tables', 'Trois restaurants étoilés. Pas pour tout le monde.', now, now] }
    );
    await queryInterface.sequelize.query(
      `INSERT INTO quest_criteria (quest_id, criterion_type, criterion_value, created_at, updated_at)
       VALUES (?, 'distinction', 'one_star', ?, ?)`,
      { replacements: [q4, now, now] }
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DELETE FROM quest_criteria WHERE quest_id IN (SELECT id FROM quests WHERE title IN (?, ?, ?, ?))',
      { replacements: ['Les Bib de ta ville', 'Premier étoilé', 'Tour de région', 'Les grandes tables'] }
    );
    await queryInterface.sequelize.query('DELETE FROM quests WHERE title IN (?, ?, ?, ?)',
      { replacements: ['Les Bib de ta ville', 'Premier étoilé', 'Tour de région', 'Les grandes tables'] }
    );
  },
};
