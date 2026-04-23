import {
  createProQuestSchema,
  updateProQuestSchema,
  listQuerySchema,
  idParamSchema,
} from '../validators/proQuest.js';
import {
  listMyQuests,
  createMyQuest,
  updateMyQuest,
  deleteMyQuest,
} from '../services/proQuest.service.js';
import { handleProError } from './proEstablishment.controller.js';

export async function listQuests(req, res) {
  try {
    const { status } = listQuerySchema.parse(req.query);
    const data = await listMyQuests(req.establishmentId, status);
    return res.status(200).json({ results: data });
  } catch (err) {
    return handleProError(err, res, 'pro-quest');
  }
}

export async function createQuest(req, res) {
  try {
    const input = createProQuestSchema.parse(req.body);
    const data = await createMyQuest(req.establishmentId, input);
    return res.status(201).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-quest');
  }
}

export async function patchQuest(req, res) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateProQuestSchema.parse(req.body);
    const data = await updateMyQuest(req.establishmentId, id, input);
    return res.status(200).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-quest');
  }
}

export async function removeQuest(req, res) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await deleteMyQuest(req.establishmentId, id);
    return res.status(204).send();
  } catch (err) {
    return handleProError(err, res, 'pro-quest');
  }
}
