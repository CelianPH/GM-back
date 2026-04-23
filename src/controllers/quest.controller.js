// GM-back/src/controllers/quest.controller.js
import { ZodError } from 'zod';
import { QuestError, getActiveQuest, getAvailableQuests, startQuest } from '../services/quest.service.js';

function handleError(err, res) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Données invalides.' } });
  }
  if (err instanceof QuestError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  console.error('[quest controller]', err);
  return res.status(500).json({ error: { code: 'INTERNAL', message: 'Erreur serveur.' } });
}

export async function getActive(req, res) {
  try {
    const data = await getActiveQuest(req.user.id);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getAvailable(req, res) {
  try {
    const data = await getAvailableQuests(req.user.id);
    return res.status(200).json(data);
  } catch (err) {
    return handleError(err, res);
  }
}

export async function postStart(req, res) {
  try {
    const questId = parseInt(req.params.id, 10);
    if (isNaN(questId)) {
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'ID invalide' } });
    }
    const data = await startQuest(req.user.id, questId);
    return res.status(201).json(data);
  } catch (err) {
    return handleError(err, res);
  }
}
