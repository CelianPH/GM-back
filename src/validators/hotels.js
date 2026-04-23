import { z } from 'zod';

export const LODGING_TYPE_VALUES = ['hotel', 'maison_hotes', 'gite', 'lodge', 'autre'];

// Amenities filter: accept both ?amenities=1,7,16 (CSV) and ?amenities=1&amenities=7 (array).
const amenitiesFromCsv = z
  .string()
  .trim()
  .transform((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map(Number)
  )
  .pipe(z.array(z.number().int().positive()));

const amenitiesQuerySchema = z.union([
  z.array(z.coerce.number().int().positive()),
  amenitiesFromCsv,
]);

export const hotelRecommendationsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusKm: z.number().positive().nullable(),
  keysLevel: z.number().int().min(1).max(3).nullable(),
  lodgingType: z.enum(LODGING_TYPE_VALUES).nullable(),
  amenities: z.array(z.number().int().positive()).nullable(),
});

export const hotelSlugSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, 'Slug invalide'),
});

// Query params arrive as strings — coerce numerics, keep optional semantics.
// Each filter is independently optional; only lat+lng together enable geo sorting.
export const hotelsListQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().optional(),
  keysLevel: z.coerce.number().int().min(1).max(3).optional(),
  lodgingType: z.enum(LODGING_TYPE_VALUES).optional(),
  amenities: amenitiesQuerySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});
