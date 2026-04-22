import { ZodError } from 'zod';
import { updatePassSchema, visitSchema } from '../validators/pass.js';
import { PassError, getPassMe, updatePassProfile, recordVisit } from '../services/pass.service.js';

function handleError(err, res) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION',
        message: 'Données invalides.',
        details: err.flatten().fieldErrors,
      },
    });
  }
  if (err instanceof PassError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }
  console.error('[pass controller] erreur inattendue :', err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Erreur serveur.' },
  });
}

export async function getMe(req, res) {
  try {
    const data = await getPassMe(req.user.id);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function updateMe(req, res) {
  try {
    const input = updatePassSchema.parse(req.body);
    const data = await updatePassProfile(req.user.id, input);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function postVisit(req, res) {
  try {
    const { establishmentId } = visitSchema.parse(req.body);
    const data = await recordVisit(req.user.id, establishmentId);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
}
