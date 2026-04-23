'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('titles', [
      {
        slug: 'curieux',
        name: 'Le Curieux',
        tagline: 'Je veux découvrir des cuisines que je ne connais pas',
        theme_hint: 'cuisine_diversity',
        created_at: now,
        updated_at: now,
      },
      {
        slug: 'esthete',
        name: "L'Esthète",
        tagline: "Je cherche l'émotion et la beauté dans l'assiette",
        theme_hint: 'green_star',
        created_at: now,
        updated_at: now,
      },
      {
        slug: 'collectionneur',
        name: 'Le Collectionneur',
        tagline: 'Je veux cocher les plus grandes tables',
        theme_hint: 'three_stars',
        created_at: now,
        updated_at: now,
      },
      {
        slug: 'local',
        name: 'Le Local',
        tagline: 'À la conquête des étoiles de ma région',
        theme_hint: 'single_region',
        created_at: now,
        updated_at: now,
      },
      {
        slug: 'nomade',
        name: 'Le Nomade',
        tagline: 'Je voyage pour manger',
        theme_hint: 'multi_region',
        created_at: now,
        updated_at: now,
      },
      {
        slug: 'epicurien',
        name: "L'Épicurien",
        tagline: 'Je vis pour les grands moments à table',
        theme_hint: 'tasting_menu',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('titles', null, {});
  },
};
