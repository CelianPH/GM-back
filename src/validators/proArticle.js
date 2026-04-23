import { z } from 'zod';

export const createArticleSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(10000),
    mediaUrl: z.string().trim().url().max(500).optional().nullable(),
  })
  .strict();

export const updateArticleSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(10000).optional(),
    mediaUrl: z.string().trim().url().max(500).optional().nullable(),
  })
  .strict();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
