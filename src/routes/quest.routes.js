// GM-back/src/routes/quest.routes.js
import { Router } from 'express';
import { getActive, getAvailable, postStart } from '../controllers/quest.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const questRouter = Router();

questRouter.get('/active', authenticate, getActive);
questRouter.get('/', authenticate, getAvailable);
questRouter.post('/:id/start', authenticate, postStart);
