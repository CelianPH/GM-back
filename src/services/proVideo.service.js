import { Video } from '../models/index.js';
import { ProError } from './proEstablishment.service.js';
import { videoToPayload } from '../dto/proEstablishment.dto.js';

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
