import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePro } from '../middleware/requirePro.js';
import { getMine, patchMine, postCover } from '../controllers/proEstablishment.controller.js';
import {
  listVideos, createVideo, patchVideo, removeVideo,
} from '../controllers/proVideo.controller.js';
import {
  listArticles, createArticle, patchArticle, removeArticle,
} from '../controllers/proArticle.controller.js';
import {
  listQuests, createQuest, patchQuest, removeQuest,
} from '../controllers/proQuest.controller.js';

export const meEstablishmentRouter = Router();

// All routes here are scoped to the authenticated pro's own establishment.
// `requirePro` populates req.establishmentId from establishment_managers.
meEstablishmentRouter.use(authenticate, requirePro);

// Fiche
meEstablishmentRouter.get('/', getMine);
meEstablishmentRouter.patch('/', patchMine);
meEstablishmentRouter.post('/photo', postCover);

// Videos
meEstablishmentRouter.get('/videos', listVideos);
meEstablishmentRouter.post('/videos', createVideo);
meEstablishmentRouter.patch('/videos/:id', patchVideo);
meEstablishmentRouter.delete('/videos/:id', removeVideo);

// Articles (= stories scoped to the establishment)
meEstablishmentRouter.get('/articles', listArticles);
meEstablishmentRouter.post('/articles', createArticle);
meEstablishmentRouter.patch('/articles/:id', patchArticle);
meEstablishmentRouter.delete('/articles/:id', removeArticle);

// Pro Quests
meEstablishmentRouter.get('/quests', listQuests);
meEstablishmentRouter.post('/quests', createQuest);
meEstablishmentRouter.patch('/quests/:id', patchQuest);
meEstablishmentRouter.delete('/quests/:id', removeQuest);
