import { z } from 'zod';

const amenityItemSchema = z.object({
  id: z.coerce.number().int().min(1),
  amenity: z.string().trim().min(1).max(120),
});

export const updateEstablishmentSchema = z
  .object({
    description: z.string().trim().max(2000).optional(),
    address: z.string().trim().min(1).max(255).optional(),
    city: z.string().trim().min(1).max(120).optional(),
    postalCode: z.string().trim().min(1).max(10).optional(),
    lat: z.coerce.number().gte(-90).lte(90).optional(),
    lng: z.coerce.number().gte(-180).lte(180).optional(),
    phone: z.string().trim().max(40).optional().nullable(),
    website: z.string().trim().url('URL invalide').max(500).optional().nullable(),
    email: z.string().trim().email('Email invalide').max(255).optional().nullable(),
    coverImageUrl: z.string().trim().min(1).max(500).optional().nullable(),
    restaurantDetail: z
      .object({
        cuisineTypeId: z.coerce.number().int().positive().optional().nullable(),
        priceRange: z.coerce.number().int().min(1).max(4).optional().nullable(),
      })
      .strict()
      .optional(),
    lodgingDetail: z
      .object({
        lodgingType: z.enum(['hotel', 'maison_hotes', 'gite', 'lodge', 'autre']).optional(),
        roomsCount: z.coerce.number().int().min(0).optional().nullable(),
        amenities: z.array(amenityItemSchema).optional().nullable(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const updateCoverSchema = z
  .object({
    coverImageUrl: z.string().trim().url().max(500),
  })
  .strict();
