'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('levels', [
      {
        rank: 'commis',
        tier_name: 'Commis',
        min_experiences: 0,
        color: '#C62828',
        icon: null,
        created_at: now,
        updated_at: now,
      },
      {
        rank: 'chef_de_partie',
        tier_name: 'Chef de partie',
        min_experiences: 5,
        color: '#B71C1C',
        icon: null,
        created_at: now,
        updated_at: now,
      },
      {
        rank: 'sous_chef',
        tier_name: 'Sous-chef',
        min_experiences: 15,
        color: '#8B0000',
        icon: null,
        created_at: now,
        updated_at: now,
      },
      {
        rank: 'chef',
        tier_name: 'Chef',
        min_experiences: 35,
        color: '#6A0909',
        icon: null,
        created_at: now,
        updated_at: now,
      },
      {
        rank: 'chef_etoile',
        tier_name: 'Chef étoilé',
        min_experiences: 75,
        color: '#D4AF37',
        icon: 'star',
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete(
      'levels',
      {
        rank: [
          'commis',
          'chef_de_partie',
          'sous_chef',
          'chef',
          'chef_etoile',
        ],
      },
      {}
    );
  },
};
