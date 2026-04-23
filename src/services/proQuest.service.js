import { ProQuest, Video } from '../models/index.js';
import { ProError } from './proEstablishment.service.js';
import { proQuestToPayload } from '../dto/proEstablishment.dto.js';

async function assertVideoOwned(establishmentId, videoId) {
  if (!videoId) return;
  const video = await Video.findOne({ where: { id: videoId, establishmentId } });
  if (!video) throw new ProError('VIDEO_NOT_OWNED', 'Vidéo récompense invalide', 400);
}

export async function listMyQuests(establishmentId, status) {
  const where = { establishmentId };
  if (status) where.status = status;
  const rows = await ProQuest.findAll({ where, order: [['createdAt', 'DESC']] });
  return rows.map(proQuestToPayload);
}

export async function createMyQuest(establishmentId, payload) {
  await assertVideoOwned(establishmentId, payload.rewardVideoId);
  const created = await ProQuest.create({
    establishmentId,
    title: payload.title,
    description: payload.description ?? null,
    startsAt: payload.startsAt ?? null,
    endsAt: payload.endsAt ?? null,
    rewardPoints: payload.rewardPoints ?? 0,
    rewardVideoId: payload.rewardVideoId ?? null,
    goalCount: payload.goalCount ?? 1,
    status: payload.status ?? 'draft',
  });
  return proQuestToPayload(created);
}

async function loadOwned(establishmentId, questId) {
  const quest = await ProQuest.findOne({ where: { id: questId, establishmentId } });
  if (!quest) throw new ProError('NOT_FOUND', 'Quête introuvable', 404);
  return quest;
}

export async function updateMyQuest(establishmentId, questId, patch) {
  if (patch.rewardVideoId !== undefined && patch.rewardVideoId !== null) {
    await assertVideoOwned(establishmentId, patch.rewardVideoId);
  }
  const quest = await loadOwned(establishmentId, questId);
  const changes = {};
  for (const key of [
    'title', 'description', 'startsAt', 'endsAt',
    'rewardPoints', 'rewardVideoId', 'goalCount', 'doneCount', 'status',
  ]) {
    if (patch[key] !== undefined) changes[key] = patch[key];
  }
  if (Object.keys(changes).length > 0) await quest.update(changes);
  return proQuestToPayload(quest);
}

export async function deleteMyQuest(establishmentId, questId) {
  const quest = await loadOwned(establishmentId, questId);
  await quest.destroy();
}
