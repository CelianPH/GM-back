import { Router } from 'express';
import {
  recommendations,
  listHotelsHandler,
  getHotelBySlug,
} from '../controllers/hotels.controller.js';

export const hotelsRouter = Router();

// Public endpoints — no auth middleware.
hotelsRouter.post('/recommendations', recommendations);
hotelsRouter.get('/', listHotelsHandler);
// Declared after the list route so `GET /` matches the list and `GET /:slug`
// only catches single-hotel lookups. The slug regex validator also prevents
// accidental collisions with other literal paths.
hotelsRouter.get('/:slug', getHotelBySlug);
