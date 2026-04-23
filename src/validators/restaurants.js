import { z } from 'zod';

export const DISTINCTION_VALUES = [
  'none',
  'bib_gourmand',
  'one_star',
  'two_stars',
  'three_stars',
  'green_star',
];

export const recommendationsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().nullable(),
  cuisine: z.string().trim().min(1).nullable(),
  distinction: z.enum(DISTINCTION_VALUES).nullable(),
  maxPrice: z.number().int().min(1).max(4).nullable(),
});

export const restaurantSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, 'Slug invalide'),
});

// Query params arrive as strings — coerce numerics, keep optional semantics.
// Each filter is independently optional; only lat+lng together enable geo sorting.
export const restaurantsListQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().optional(),
  cuisine: z.string().trim().min(1).optional(),
  distinction: z.enum(DISTINCTION_VALUES).optional(),
  maxPrice: z.coerce.number().int().min(1).max(4).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
