import { ZodError } from 'zod';
import { addFavoriteSchema, slugParamSchema } from '../validators/favorites.js';
import {
  FavoritesError,
  addFavorite,
  listFavorites,
  removeFavorite,
} from '../services/favorites.service.js';

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
  if (err instanceof FavoritesError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }
  console.error('[favorites controller] erreur inattendue :', err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Erreur serveur.' },
  });
}

export async function postFavorite(req, res) {
  try {
    const { slug } = addFavoriteSchema.parse(req.body);
    const result = await addFavorite({ userId: req.user.id, slug });
    const status = result.alreadyExisted ? 200 : 201;
    return res.status(status).json({ favorited: true, slug: result.slug });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getFavorites(req, res) {
  try {
    const results = await listFavorites({ userId: req.user.id });
    return res.status(200).json({ results });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function deleteFavorite(req, res) {
  try {
    const { slug } = slugParamSchema.parse(req.params);
    await removeFavorite({ userId: req.user.id, slug });
    return res.status(204).send();
  } catch (err) {
    return handleError(err, res);
  }
}
