import { Router } from 'express';
import {
  postFavorite,
  getFavorites,
  deleteFavorite,
} from '../controllers/favorites.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const favoritesRouter = Router();

favoritesRouter.use(authenticate);

favoritesRouter.post('/', postFavorite);
favoritesRouter.get('/', getFavorites);
favoritesRouter.delete('/:slug', deleteFavorite);
