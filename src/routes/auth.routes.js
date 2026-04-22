import { Router } from 'express';
import {
  register,
  login,
  oauthGoogle,
  oauthApple,
  me,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authLimiter } from '../middleware/rateLimit.js';

export const authRouter = Router();

authRouter.use(authLimiter);

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/oauth/google', oauthGoogle);
authRouter.post('/oauth/apple', oauthApple);
authRouter.get('/me', authenticate, me);
