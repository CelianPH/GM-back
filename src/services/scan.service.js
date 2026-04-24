import { Establishment } from '../models/index.js';
import { PassError, recordVisit } from './pass.service.js';
import { selectScanVideo } from './proVideo.service.js';

export async function scanToken(userId, token) {
  const establishment = await Establishment.findOne({ where: { qrToken: token } });
  if (!establishment) {
    throw new PassError('ESTABLISHMENT_NOT_FOUND', 'QR code non reconnu', 404);
  }

  // Pick the video BEFORE recording the visit so "first visit" logic works correctly.
  const video = await selectScanVideo(establishment.id, userId);
  const visit = await recordVisit(userId, establishment.id);

  return {
    ...visit,
    establishment: {
      id: establishment.id,
      slug: establishment.slug,
      name: establishment.name,
    },
    video,
  };
}
