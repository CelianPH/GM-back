import { sequelize, User, Pass, Level, Title, UserTaste } from '../models/index.js';

export class PassError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function serialize({ user, pass, level, title, tastes }) {
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

  return serialize({ user, pass, level, title, tastes });
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
