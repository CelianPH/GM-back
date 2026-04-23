import { Story } from '../models/index.js';
import { ProError } from './proEstablishment.service.js';
import { storyToArticlePayload } from '../dto/proEstablishment.dto.js';

export async function listMyArticles(establishmentId) {
  const rows = await Story.findAll({
    where: { establishmentId },
    order: [['createdAt', 'DESC']],
  });
  return rows.map(storyToArticlePayload);
}

export async function createMyArticle(establishmentId, authorId, payload) {
  // status starts as 'pending' regardless of input — moderation lives elsewhere.
  const created = await Story.create({
    establishmentId,
    authorId,
    title: payload.title,
    content: payload.content,
    mediaUrl: payload.mediaUrl ?? null,
    status: 'pending',
  });
  return storyToArticlePayload(created);
}

async function loadOwned(establishmentId, storyId) {
  const story = await Story.findOne({ where: { id: storyId, establishmentId } });
  if (!story) throw new ProError('NOT_FOUND', 'Article introuvable', 404);
  return story;
}

export async function updateMyArticle(establishmentId, storyId, patch) {
  const story = await loadOwned(establishmentId, storyId);
  const changes = {};
  for (const key of ['title', 'content', 'mediaUrl']) {
    if (patch[key] !== undefined) changes[key] = patch[key];
  }
  // Editing an article moves it back to 'pending' so it gets re-reviewed.
  if (Object.keys(changes).length > 0) {
    changes.status = 'pending';
    await story.update(changes);
  }
  return storyToArticlePayload(story);
}

export async function deleteMyArticle(establishmentId, storyId) {
  const story = await loadOwned(establishmentId, storyId);
  await story.destroy();
}
