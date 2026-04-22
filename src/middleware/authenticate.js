import { verifyJwt } from '../utils/jwt.js';
import { User } from '../models/user.js';

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token manquant' } });
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verifyJwt(token);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Utilisateur introuvable' } });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token invalide ou expiré' } });
  }
}
