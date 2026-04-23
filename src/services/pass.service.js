import { sequelize, User, Pass, Level, Title, UserTaste, Establishment, UserVisit } from '../models/index.js';
import { QueryTypes } from 'sequelize';
import { checkAndProgressQuest } from './quest.service.js';

export class PassError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function resolveLevel(experiencesCount, levels) {
  return levels
    .filter((l) => l.minExperiences <= experiencesCount)
    .sort((a, b) => b.minExperiences - a.minExperiences)[0];
}

async function checkAndAwardBadges(userId, transaction) {
  const [stats] = await sequelize.query(
    `SELECT
      COUNT(*)                                                         AS totalVisits,
      SUM(rd.distinction = 'bib_gourmand')                            AS bibCount,
      COUNT(DISTINCT e.region_id)                                     AS regionsCount,
      SUM(rd.distinction = 'three_stars')                             AS threeStarsCount
     FROM user_visits uv
     JOIN establishments e ON e.id = uv.establishment_id
     LEFT JOIN restaurant_details rd ON rd.establishment_id = e.id
     WHERE uv.user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT, transaction }
  );

  const conditions = [
    { badgeId: 1, met: Number(stats.totalVisits)     >= 1  },
    { badgeId: 2, met: Number(stats.bibCount)        >= 10 },
    { badgeId: 3, met: Number(stats.regionsCount)    >= 5  },
    { badgeId: 4, met: Number(stats.threeStarsCount) >= 1  },
  ];

  const existing = await sequelize.query(
    'SELECT badge_id FROM user_badges WHERE user_id = :userId',
    { replacements: { userId }, type: QueryTypes.SELECT, transaction }
  );
  const earnedIds = new Set(existing.map((r) => r.badge_id));

  const now = new Date();
  for (const { badgeId, met } of conditions) {
    if (met && !earnedIds.has(badgeId)) {
      await sequelize.query(
        'INSERT INTO user_badges (user_id, badge_id, earned_at, created_at, updated_at) VALUES (:userId, :badgeId, :now, :now, :now)',
        { replacements: { userId, badgeId, now }, type: QueryTypes.INSERT, transaction }
      );
    }
  }
}

async function getBadgesForUser(userId) {
  const [stats] = await sequelize.query(
    `SELECT
      COUNT(*)                                                         AS totalVisits,
      SUM(rd.distinction = 'bib_gourmand')                            AS bibCount,
      COUNT(DISTINCT e.region_id)                                     AS regionsCount,
      SUM(rd.distinction = 'three_stars')                             AS threeStarsCount
     FROM user_visits uv
     JOIN establishments e ON e.id = uv.establishment_id
     LEFT JOIN restaurant_details rd ON rd.establishment_id = e.id
     WHERE uv.user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  const earned = await sequelize.query(
    'SELECT badge_id, earned_at FROM user_badges WHERE user_id = :userId',
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  const earnedMap = new Map(earned.map((r) => [r.badge_id, r.earned_at]));

  const BADGE_DEFS = [
    { id: 1, key: 'first', name: 'Premier pas',    progress: Math.min(Number(stats.totalVisits),      1),  total: 1  },
    { id: 2, key: 'bib',   name: 'Bib Hunter',     progress: Math.min(Number(stats.bibCount),         10), total: 10 },
    { id: 3, key: 'tour',  name: 'Tour de France',  progress: Math.min(Number(stats.regionsCount),    5),  total: 5  },
    { id: 4, key: 'three', name: 'Trois étoiles',   progress: Math.min(Number(stats.threeStarsCount), 1),  total: 1  },
  ];

  return BADGE_DEFS.map(({ id, key, name, progress, total }) => ({
    key,
    name,
    unlocked: earnedMap.has(id),
    earnedAt: earnedMap.get(id) ?? null,
    progress,
    total,
  }));
}

function serialize({ user, pass, level, title, tastes, restaurantsCount = 0, hotelsCount = 0, regionsCount = 0, badgesCount = 0, badges = [] }) {
  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      friendCode: user.friendCode,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    },
    pass: {
      passNumber: pass.passNumber,
      memberSince: pass.memberSince,
      experiencesCount: pass.experiencesCount,
      restaurantsCount,
      hotelsCount,
      regionsCount,
      badgesCount,
      pointsTotal: pass.pointsTotal,
      searchCity: pass.searchCity,
      searchRadiusKm: pass.searchRadiusKm,
    },
    level: level
      ? {
          rank: level.rank,
          tierName: level.tierName,
          minExperiences: level.minExperiences,
          color: level.color,
          icon: level.icon,
        }
      : null,
    title: title
      ? {
          slug: title.slug,
          name: title.name,
          tagline: title.tagline,
          themeHint: title.themeHint,
        }
      : null,
    tastes: tastes.map((t) => ({ category: t.category, tag: t.tag })),
    badges,
  };
}

export async function getPassMe(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new PassError('USER_NOT_FOUND', 'Utilisateur introuvable', 404);

  const pass = await Pass.findOne({ where: { userId } });
  if (!pass) throw new PassError('PASS_NOT_FOUND', 'Pass introuvable', 404);

  const level = await Level.findByPk(pass.levelId);
  const title = pass.titleId ? await Title.findByPk(pass.titleId) : null;
  const tastes = await UserTaste.findAll({ where: { userId } });

  const [counts] = await sequelize.query(
    `SELECT
      SUM(e.type = 'restaurant') AS restaurantsCount,
      SUM(e.type = 'lodging')    AS hotelsCount,
      COUNT(DISTINCT e.region_id) AS regionsCount
     FROM user_visits uv
     JOIN establishments e ON e.id = uv.establishment_id
     WHERE uv.user_id = :userId`,
    { replacements: { userId }, type: QueryTypes.SELECT }
  );
  const restaurantsCount = Number(counts.restaurantsCount) || 0;
  const hotelsCount = Number(counts.hotelsCount) || 0;
  const regionsCount = Number(counts.regionsCount) || 0;

  const [{ badgesCount }] = await sequelize.query(
    'SELECT COUNT(*) AS badgesCount FROM user_badges WHERE user_id = :userId',
    { replacements: { userId }, type: QueryTypes.SELECT }
  );

  const badges = await getBadgesForUser(userId);
  return serialize({ user, pass, level, title, tastes, restaurantsCount, hotelsCount, regionsCount, badgesCount: Number(badgesCount), badges });
}

export async function updatePassProfile(userId, input) {
  const pass = await Pass.findOne({ where: { userId } });
  if (!pass) throw new PassError('PASS_NOT_FOUND', 'Pass introuvable', 404);

  let nextTitleId = pass.titleId;
  if (input.identitySlug) {
    const title = await Title.findOne({ where: { slug: input.identitySlug } });
    if (!title) throw new PassError('TITLE_NOT_FOUND', 'Titre introuvable', 404);
    nextTitleId = title.id;
  }

  await sequelize.transaction(async (transaction) => {
    if (input.firstName) {
      await User.update(
        { firstName: input.firstName },
        { where: { id: userId }, transaction }
      );
    }

    const passUpdates = {};
    if (input.identitySlug) passUpdates.titleId = nextTitleId;
    if (input.city !== undefined) passUpdates.searchCity = input.city;
    if (input.radiusKm !== undefined) passUpdates.searchRadiusKm = input.radiusKm;
    if (Object.keys(passUpdates).length > 0) {
      await Pass.update(passUpdates, { where: { userId }, transaction });
    }

    if (input.tastes) {
      await UserTaste.destroy({ where: { userId }, transaction });
      if (input.tastes.length > 0) {
        await UserTaste.bulkCreate(
          input.tastes.map((t) => ({ userId, category: t.category, tag: t.tag })),
          { transaction }
        );
      }
    }
  });

  return getPassMe(userId);
}

export async function recordVisit(userId, establishmentId) {
  const establishment = await Establishment.findByPk(establishmentId);
  if (!establishment) {
    throw new PassError('ESTABLISHMENT_NOT_FOUND', 'Établissement introuvable', 404);
  }

  const pass = await Pass.findOne({ where: { userId } });
  if (!pass) {
    throw new PassError('PASS_NOT_FOUND', 'Pass introuvable', 404);
  }

  const allLevels = await Level.findAll();
  const oldLevelId = pass.levelId;
  const newCount = pass.experiencesCount + 1;
  const newLevel = resolveLevel(newCount, allLevels);

  await sequelize.transaction(async (transaction) => {
    await UserVisit.create({ userId, establishmentId }, { transaction });
    const passUpdates = { experiencesCount: newCount };
    if (newLevel && newLevel.id !== oldLevelId) {
      passUpdates.levelId = newLevel.id;
    }
    await Pass.update(passUpdates, { where: { userId }, transaction });
    await checkAndProgressQuest(userId, establishmentId, transaction);
    await checkAndAwardBadges(userId, transaction);
  });

  const leveledUp = newLevel ? newLevel.id !== oldLevelId : false;

  return {
    experiencesCount: newCount,
    level: newLevel
      ? {
          rank: newLevel.rank,
          tierName: newLevel.tierName,
          minExperiences: newLevel.minExperiences,
          color: newLevel.color,
          icon: newLevel.icon,
        }
      : null,
    leveledUp,
    newLevel: leveledUp
      ? {
          rank: newLevel.rank,
          tierName: newLevel.tierName,
          minExperiences: newLevel.minExperiences,
          color: newLevel.color,
          icon: newLevel.icon,
        }
      : null,
  };
}
