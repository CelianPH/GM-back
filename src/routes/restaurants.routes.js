import { Router } from 'express';
import {
  recommendations,
  listRestaurantsHandler,
  getRestaurantBySlug,
} from '../controllers/restaurants.controller.js';

export const restaurantsRouter = Router();

// Public endpoints — no auth middleware.
restaurantsRouter.post('/recommendations', recommendations);
restaurantsRouter.get('/', listRestaurantsHandler);
// Declared after the list route so `GET /` matches the list and `GET /:slug`
// only catches single-restaurant lookups. The slug regex validator also
// prevents accidental collisions with other literal paths.
restaurantsRouter.get('/:slug', getRestaurantBySlug);
