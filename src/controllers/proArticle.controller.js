import { createArticleSchema, updateArticleSchema, idParamSchema } from '../validators/proArticle.js';
import {
  listMyArticles,
  createMyArticle,
  updateMyArticle,
  deleteMyArticle,
} from '../services/proArticle.service.js';
import { handleProError } from './proEstablishment.controller.js';

export async function listArticles(req, res) {
  try {
    const data = await listMyArticles(req.establishmentId);
    return res.status(200).json({ results: data });
  } catch (err) {
    return handleProError(err, res, 'pro-article');
  }
}

export async function createArticle(req, res) {
  try {
    const input = createArticleSchema.parse(req.body);
    const data = await createMyArticle(req.establishmentId, req.user.id, input);
    return res.status(201).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-article');
  }
}

export async function patchArticle(req, res) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const input = updateArticleSchema.parse(req.body);
    const data = await updateMyArticle(req.establishmentId, id, input);
    return res.status(200).json(data);
  } catch (err) {
    return handleProError(err, res, 'pro-article');
  }
}

export async function removeArticle(req, res) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await deleteMyArticle(req.establishmentId, id);
    return res.status(204).send();
  } catch (err) {
    return handleProError(err, res, 'pro-article');
  }
}
