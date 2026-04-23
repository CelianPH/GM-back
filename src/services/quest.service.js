// GM-back/src/services/quest.service.js
import { Quest, QuestCriteria, UserQuest, RestaurantDetail, Establishment } from '../models/index.js';

export class QuestError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function serializeQuest(quest) {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    targetCount: quest.targetCount,
    rewardPoints: quest.rewardPoints,
  };
}

function serializeActiveQuest(userQuest) {
  return {
    id: userQuest.quest.id,
    title: userQuest.quest.title,
    description: userQuest.quest.description,
    targetCount: userQuest.quest.targetCount,
    rewardPoints: userQuest.quest.rewardPoints,
    progressCount: userQuest.progressCount,
    startedAt: userQuest.startedAt,
    completedAt: userQuest.completedAt,
  };
}

export async function getActiveQuest(userId) {
  const userQuest = await UserQuest.findOne({
    where: { userId, completedAt: null },
    include: [{ model: Quest, as: 'quest', include: [{ model: QuestCriteria, as: 'criteria' }] }],
  });
  if (!userQuest) return null;
  return serializeActiveQuest(userQuest);
}

export async function getAvailableQuests(userId) {
  // If user has an active quest, no quests are available to start
  const activeUserQuest = await UserQuest.findOne({ where: { userId, completedAt: null } });
  if (activeUserQuest) return [];

  // Exclude quests the user has already completed
  const completedQuestIds = (
    await UserQuest.findAll({ where: { userId }, attributes: ['questId'] })
  ).map((uq) => uq.questId);

  const { Op } = await import('sequelize');
  const whereClause = completedQuestIds.length > 0
    ? { id: { [Op.notIn]: completedQuestIds } }
    : {};

  const quests = await Quest.findAll({ where: whereClause });
  return quests.map(serializeQuest);
}

export async function startQuest(userId, questId) {
  const existing = await UserQuest.findOne({ where: { userId, completedAt: null } });
  if (existing) {
    throw new QuestError('QUEST_ALREADY_ACTIVE', 'Une quête est déjà en cours', 400);
  }

  const quest = await Quest.findByPk(questId);
  if (!quest) {
    throw new QuestError('QUEST_NOT_FOUND', 'Quête introuvable', 404);
  }

  const userQuest = await UserQuest.create({
    userId,
    questId,
    progressCount: 0,
    startedAt: new Date(),
    completedAt: null,
  });

  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    targetCount: quest.targetCount,
    rewardPoints: quest.rewardPoints,
    progressCount: userQuest.progressCount,
    startedAt: userQuest.startedAt,
    completedAt: null,
  };
}

export async function checkAndProgressQuest(userId, establishmentId, transaction) {
  const userQuest = await UserQuest.findOne({
    where: { userId, completedAt: null },
    include: [{ model: Quest, as: 'quest', include: [{ model: QuestCriteria, as: 'criteria' }] }],
    transaction,
  });

  if (!userQuest) return;

  const criteria = userQuest.quest.criteria;

  // No criteria → every visit counts
  if (criteria.length > 0) {
    const establishment = await Establishment.findByPk(establishmentId, {
      include: [{ model: RestaurantDetail, as: 'restaurantDetail' }],
      transaction,
    });

    const matches = criteria.every((c) => {
      if (c.criterionType === 'distinction') {
        return establishment.restaurantDetail?.distinction === c.criterionValue;
      }
      if (c.criterionType === 'region') {
        return String(establishment.regionId) === c.criterionValue;
      }
      if (c.criterionType === 'establishment_type') {
        return establishment.type === c.criterionValue;
      }
      return false;
    });

    if (!matches) return;
  }

  const newProgress = userQuest.progressCount + 1;
  const completed = newProgress >= userQuest.quest.targetCount;

  await UserQuest.update(
    {
      progressCount: newProgress,
      completedAt: completed ? new Date() : null,
    },
    { where: { userId, questId: userQuest.questId }, transaction }
  );
}
