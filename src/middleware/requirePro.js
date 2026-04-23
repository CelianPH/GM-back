import { EstablishmentManager } from '../models/index.js';

export async function requirePro(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Non authentifié' } });
  }
  if (req.user.role !== 'pro' && req.user.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Réservé aux pros' } });
  }

  const link = await EstablishmentManager.findOne({
    where: { userId: req.user.id },
    order: [['establishmentId', 'ASC']],
  });
  if (!link) {
    return res.status(404).json({
      error: { code: 'NO_ESTABLISHMENT', message: 'Aucun établissement rattaché à ce compte' },
    });
  }

  req.establishmentId = link.establishmentId;
  req.managerRole = link.role;
  next();
}
