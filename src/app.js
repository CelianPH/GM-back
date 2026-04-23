import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { testConnection } from './db.js';
import './models/index.js';
import { authRouter } from './routes/auth.routes.js';
import { passRouter } from './routes/pass.routes.js';
import { establishmentRouter } from './routes/establishment.routes.js';
import { questRouter } from './routes/quest.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'GM-back API is running' });
});

app.use('/auth', authRouter);
app.use('/pass', passRouter);
app.use('/establishments', establishmentRouter);
app.use('/quests', questRouter);

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
