import { Establishment } from '../models/index.js';
import { PassError, recordVisit } from './pass.service.js';

export async function scanToken(userId, token) {
  const establishment = await Establishment.findOne({ where: { qrToken: token } });
  if (!establishment) {
    throw new PassError('ESTABLISHMENT_NOT_FOUND', 'QR code non reconnu', 404);
  }
  return recordVisit(userId, establishment.id);
}
