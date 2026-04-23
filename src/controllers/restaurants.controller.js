import { ZodError } from 'zod';
import {
  recommendationsSchema,
  restaurantSlugSchema,
  restaurantsListQuerySchema,
} from '../validators/restaurants.js';
import {
  RestaurantsError,
  findRecommendations,
  findRestaurantBySlug,
  listRestaurants,
} from '../services/restaurants.service.js';

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
  if (err instanceof RestaurantsError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }
  console.error('[restaurants controller] erreur inattendue :', err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Erreur serveur.' },
  });
}

export async function recommendations(req, res) {
  try {
    const input = recommendationsSchema.parse(req.body);
    const results = await findRecommendations(input);
    return res.status(200).json({ results });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function listRestaurantsHandler(req, res) {
  try {
    const input = restaurantsListQuerySchema.parse(req.query);
    const { results, total } = await listRestaurants(input);
    return res.status(200).json({ results, total });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getRestaurantBySlug(req, res) {
  try {
    const { slug } = restaurantSlugSchema.parse(req.params);
    const resto = await findRestaurantBySlug(slug);
    return res.status(200).json(resto);
  } catch (err) {
    return handleError(err, res);
  }
}
