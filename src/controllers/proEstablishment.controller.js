import { ZodError } from 'zod';
import { updateEstablishmentSchema, updateCoverSchema } from '../validators/proEstablishment.js';
import {
  ProError,
  getMyEstablishment,
  updateMyEstablishment,
  updateCover,
} from '../services/proEstablishment.service.js';

export function handleProError(err, res, scope) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION',
        message: 'Données invalides.',
        details: err.flatten().fieldErrors,
      },
    });
  }
  if (err instanceof ProError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }
  console.error(`[${scope} controller] erreur inattendue :`, err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Erreur serveur.' },
  });
}

export async function getMine(req, res) {
  try {
    const data = await getMyEstablishment(req.establishmentId);
    return res.status(200).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-establishment');
  }
}

export async function patchMine(req, res) {
  try {
    const input = updateEstablishmentSchema.parse(req.body);
    const data = await updateMyEstablishment(req.establishmentId, input);
    return res.status(200).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-establishment');
  }
}

export async function postCover(req, res) {
  try {
    const { coverImageUrl } = updateCoverSchema.parse(req.body);
    const data = await updateCover(req.establishmentId, coverImageUrl);
    return res.status(200).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-establishment');
  }
}
