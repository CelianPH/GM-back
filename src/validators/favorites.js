import { z } from 'zod';

export const addFavoriteSchema = z.object({
  slug: z.string().trim().min(1),
});

export const slugParamSchema = z.object({
  slug: z.string().trim().min(1),
});
