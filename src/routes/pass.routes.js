import { Router } from 'express';
import { getMe, updateMe, postVisit } from '../controllers/pass.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const passRouter = Router();

passRouter.get('/me', authenticate, getMe);
passRouter.patch('/me', authenticate, updateMe);
passRouter.post('/me/visits', authenticate, postVisit);
