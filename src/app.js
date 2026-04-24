import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { UPLOADS_ROOT } from './middleware/upload.js';
import { testConnection } from './db.js';
import './models/index.js';
import { authRouter } from './routes/auth.routes.js';
import { passRouter } from './routes/pass.routes.js';
import { establishmentRouter } from './routes/establishment.routes.js';
import { questRouter } from './routes/quest.routes.js';
import { restaurantsRouter } from './routes/restaurants.routes.js';
import { hotelsRouter } from './routes/hotels.routes.js';
import { favoritesRouter } from './routes/favorites.routes.js';
import { meEstablishmentRouter } from './routes/me-establishment.routes.js';
import { cuisineTypesRouter } from './routes/cuisineTypes.routes.js';
import { friendRouter } from './routes/friend.routes.js';

const app = express();

app.set('trust proxy', 'loopback');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(UPLOADS_ROOT, { maxAge: '7d', fallthrough: false }));

app.get('/', (_req, res) => {
  res.json({ message: 'GM-back API is running' });
});

app.use('/auth', authRouter);
app.use('/pass', passRouter);
app.use('/establishments', establishmentRouter);
app.use('/quests', questRouter);
app.use('/restaurants', restaurantsRouter);
app.use('/hotels', hotelsRouter);
app.use('/me/favorites', favoritesRouter);
app.use('/me/establishment', meEstablishmentRouter);
app.use('/cuisine-types', cuisineTypesRouter);
app.use('/friends', friendRouter);

app.use((err, _req, res, _next) => {
  console.error('[error handler]', err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Erreur serveur.' } });
});

testConnection().then(() => {
  app.listen(env.PORT, () => {
    console.log(`✅ Server running on port ${env.PORT} (${env.NODE_ENV})`);
  });
});

export default app;
