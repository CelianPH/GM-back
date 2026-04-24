import { Video, Pass, Title, UserVisit } from '../models/index.js';
import { ProError } from './proEstablishment.service.js';
import { videoToPayload } from '../dto/proEstablishment.dto.js';

function pickRandom(list) {
  if (!list || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function parseArchetypeIds(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function selectScanVideo(establishmentId, userId) {
  const activeVideos = await Video.findAll({
    where: { establishmentId, status: 'active' },
  });
  if (activeVideos.length === 0) return null;

  const pass = await Pass.findOne({ where: { userId } });
  let archetypeSlug = null;
  if (pass?.titleId) {
    const title = await Title.findByPk(pass.titleId);
    archetypeSlug = title?.slug ?? null;
  }

  const previousVisit = await UserVisit.findOne({ where: { userId, establishmentId } });
  const isFirstVisit = !previousVisit;

  if (archetypeSlug) {
    const archetypeMatches = activeVideos.filter((v) => {
      if (v.audience !== 'archetype') return false;
      const ids = parseArchetypeIds(v.archetypeIds);
      return ids.includes(archetypeSlug);
    });
    const chosen = pickRandom(archetypeMatches);
    if (chosen) return videoToPayload(chosen);
  }

  if (isFirstVisit) {
    const firstVisitMatches = activeVideos.filter((v) => v.audience === 'firstvisit');
    const chosen = pickRandom(firstVisitMatches);
    if (chosen) return videoToPayload(chosen);
  }

  const fallback = activeVideos.filter((v) => v.audience === 'all');
  const chosen = pickRandom(fallback);
  return chosen ? videoToPayload(chosen) : null;
}

export async function listMyVideos(establishmentId) {
  const rows = await Video.findAll({
    where: { establishmentId },
    order: [['createdAt', 'DESC']],
  });
  return rows.map(videoToPayload);
}

export async function createMyVideo(establishmentId, payload) {
  const created = await Video.create({
    establishmentId,
    title: payload.title,
    audience: payload.audience,
    archetypeIds: payload.archetypeIds ?? null,
    durationSec: payload.durationSec ?? null,
    thumbUrl: payload.thumbUrl ?? null,
    mediaUrl: payload.mediaUrl,
    status: payload.status ?? 'active',
  });
  return videoToPayload(created);
}

async function loadOwned(establishmentId, videoId) {
  const video = await Video.findOne({ where: { id: videoId, establishmentId } });
  if (!video) throw new ProError('NOT_FOUND', 'Vidéo introuvable', 404);
  return video;
}

export async function updateMyVideo(establishmentId, videoId, patch) {
  const video = await loadOwned(establishmentId, videoId);
  const changes = {};
  for (const key of ['title', 'audience', 'archetypeIds', 'durationSec', 'thumbUrl', 'mediaUrl', 'status']) {
    if (patch[key] !== undefined) changes[key] = patch[key];
  }
  if (Object.keys(changes).length > 0) await video.update(changes);
  return videoToPayload(video);
}

export async function deleteMyVideo(establishmentId, videoId) {
  const video = await loadOwned(establishmentId, videoId);
  await video.destroy();
}
