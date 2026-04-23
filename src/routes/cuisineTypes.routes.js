import { Router } from 'express';
import { listCuisineTypes } from '../controllers/cuisineTypes.controller.js';

export const cuisineTypesRouter = Router();

// Public reference endpoint — used by the pro space dropdown.
cuisineTypesRouter.get('/', listCuisineTypes);
