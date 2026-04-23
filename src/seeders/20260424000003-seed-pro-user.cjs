'use strict';

const bcrypt = require('bcrypt');

const PRO_EMAIL = 'pro@guide.local';
const PRO_PASSWORD = 'motdepasse123';
const PRO_FRIEND_CODE = 'PRO12345';
const PRO_PASS_NUMBER = 'GM-PRO-001';
const PRO_FIRST_NAME = 'Camille';
const PRO_LAST_NAME = 'Aubert';
// Slug we try to bind the manager to first; falls back to any restaurant if absent.
const PREFERRED_SLUG = 'le-servan';

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const QueryTypes = sequelize.QueryTypes;
    const now = new Date();

    // Idempotence: skip if the seed has already been applied for this email.
    const [existing] = await sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { type: QueryTypes.SELECT, replacements: { email: PRO_EMAIL } }
    );
    if (existing) {
      console.log(`[seed pro] user ${PRO_EMAIL} déjà présent (id=${existing.id}) — skip.`);
      return;
    }

    const hashed = await bcrypt.hash(PRO_PASSWORD, 10);

    // Insert the user. friend_code unique constraint is satisfied via the static value
    // — this is a dev seed, not a production code path.
    await queryInterface.bulkInsert('users', [
      {
        email: PRO_EMAIL,
        password: hashed,
        first_name: PRO_FIRST_NAME,
        last_name: PRO_LAST_NAME,
        role: 'pro',
        friend_code: PRO_FRIEND_CODE,
        avatar_url: null,
        bio: null,
        google_id: null,
        apple_id: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    const [user] = await sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { type: QueryTypes.SELECT, replacements: { email: PRO_EMAIL } }
    );
    if (!user) throw new Error('Insertion du user pro échouée');

    // Create a minimal Pass so /pass/me does not 404 if visited.
    const [level] = await sequelize.query(
      "SELECT id FROM levels WHERE rank = 'commis' LIMIT 1",
      { type: QueryTypes.SELECT }
    );
    if (level) {
      await queryInterface.bulkInsert('passes', [
        {
          user_id: user.id,
          level_id: level.id,
          title_id: null,
          pass_number: PRO_PASS_NUMBER,
          experiences_count: 0,
          points_total: 0,
          search_city: null,
          search_radius_km: null,
          created_at: now,
          updated_at: now,
        },
      ]);
    } else {
      console.warn('[seed pro] niveau "commis" absent — pas de Pass créé. Lance d\'abord seed:levels.');
    }

    // Bind the pro to an establishment. Prefer a known Bib Gourmand for storytelling,
    // fall back to any restaurant available so the seed never blocks on missing data.
    const [preferred] = await sequelize.query(
      "SELECT id FROM establishments WHERE slug = :slug LIMIT 1",
      { type: QueryTypes.SELECT, replacements: { slug: PREFERRED_SLUG } }
    );
    let establishmentId = preferred?.id;
    if (!establishmentId) {
      const [fallback] = await sequelize.query(
        "SELECT id FROM establishments WHERE type = 'restaurant' ORDER BY id ASC LIMIT 1",
        { type: QueryTypes.SELECT }
      );
      establishmentId = fallback?.id;
    }
    if (!establishmentId) {
      console.warn('[seed pro] aucun establishment trouvé — le user pro restera sans rattachement (NO_ESTABLISHMENT au login).');
      return;
    }

    await queryInterface.bulkInsert('establishment_managers', [
      {
        user_id: user.id,
        establishment_id: establishmentId,
        role: 'owner',
        created_at: now,
        updated_at: now,
      },
    ]);

    console.log(`[seed pro] ${PRO_EMAIL} créé et rattaché à l'établissement #${establishmentId}.`);
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const QueryTypes = sequelize.QueryTypes;
    const [user] = await sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      { type: QueryTypes.SELECT, replacements: { email: PRO_EMAIL } }
    );
    if (!user) return;
    await queryInterface.bulkDelete('establishment_managers', { user_id: user.id });
    await queryInterface.bulkDelete('passes', { user_id: user.id });
    await queryInterface.bulkDelete('users', { id: user.id });
  },
};
