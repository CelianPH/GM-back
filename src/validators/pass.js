import { z } from 'zod';

const ALLOWED_RADII = [5, 25, 100, 999, 9999];

export const updatePassSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  identitySlug: z
    .enum(['curieux', 'esthete', 'collectionneur', 'local', 'nomade', 'epicurien'])
    .optional(),
  city: z.string().trim().min(1).max(255).optional(),
  radiusKm: z
    .number()
    .int()
    .refine((v) => ALLOWED_RADII.includes(v), {
      message: 'Rayon non supporté',
    })
    .optional(),
  tastes: z
    .array(
      z.object({
        category: z.enum(['envies', 'moments', 'valeurs']),
        tag: z.string().trim().min(1).max(100),
      })
    )
    .max(5)
    .optional(),
});

export const visitSchema = z.object({
  establishmentId: z.number().int().positive(),
});

export const scanSchema = z.object({
  token: z.string().min(1),
});
