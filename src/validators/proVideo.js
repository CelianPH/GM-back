import { z } from 'zod';

export const VIDEO_AUDIENCES = ['all', 'firstvisit', 'archetype'];
export const VIDEO_STATUSES = ['active', 'paused'];

const baseVideoFields = {
  title: z.string().trim().min(1).max(200),
  audience: z.enum(VIDEO_AUDIENCES),
  archetypeIds: z.array(z.string().trim().min(1).max(40)).optional().nullable(),
  durationSec: z.coerce.number().int().min(1).max(60 * 60).optional().nullable(),
  thumbUrl: z.string().trim().url().max(500).optional().nullable(),
  mediaUrl: z.string().trim().url().max(500),
  status: z.enum(VIDEO_STATUSES).optional(),
};

export const createVideoSchema = z
  .object(baseVideoFields)
  .strict()
  .refine(
    (v) => v.audience !== 'archetype' || (v.archetypeIds && v.archetypeIds.length > 0),
    { message: 'archetypeIds requis quand audience=archetype', path: ['archetypeIds'] },
  );

export const updateVideoSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    audience: z.enum(VIDEO_AUDIENCES).optional(),
    archetypeIds: z.array(z.string().trim().min(1).max(40)).optional().nullable(),
    durationSec: z.coerce.number().int().min(1).max(60 * 60).optional().nullable(),
    thumbUrl: z.string().trim().url().max(500).optional().nullable(),
    mediaUrl: z.string().trim().url().max(500).optional(),
    status: z.enum(VIDEO_STATUSES).optional(),
  })
  .strict();

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
