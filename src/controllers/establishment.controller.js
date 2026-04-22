import QRCode from 'qrcode';
import { Establishment } from '../models/index.js';

export async function getQrCode(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'ID invalide' } });
  }

  const establishment = await Establishment.findByPk(id);
  if (!establishment) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Établissement introuvable' } });
  }
  if (!establishment.qrToken) {
    return res.status(409).json({ error: { code: 'NO_TOKEN', message: 'Token non généré pour cet établissement' } });
  }

  try {
    const format = req.query.format === 'svg' ? 'svg' : 'png';
    if (format === 'svg') {
      const svg = await QRCode.toString(establishment.qrToken, { type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }
    const buffer = await QRCode.toBuffer(establishment.qrToken);
    res.setHeader('Content-Type', 'image/png');
    return res.send(buffer);
  } catch (err) {
    console.error('[establishment controller] erreur QR:', err);
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Erreur serveur.' } });
  }
}
