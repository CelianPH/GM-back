import { ZodError } from 'zod';
import {
  hotelRecommendationsSchema,
  hotelSlugSchema,
  hotelsListQuerySchema,
} from '../validators/hotels.js';
import {
  HotelsError,
  findRecommendations,
  findHotelBySlug,
  listHotels,
} from '../services/hotels.service.js';

function handleError(err, res) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION',
        message: 'Données invalides.',
        details: err.flatten().fieldErrors,
      },
    });
  }
  if (err instanceof HotelsError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }
  console.error('[hotels controller] erreur inattendue :', err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Erreur serveur.' },
  });
}

export async function recommendations(req, res) {
  try {
    const input = hotelRecommendationsSchema.parse(req.body);
    const results = await findRecommendations(input);
    return res.status(200).json({ results });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function listHotelsHandler(req, res) {
  try {
    const input = hotelsListQuerySchema.parse(req.query);
    const { results, total } = await listHotels(input);
    return res.status(200).json({ results, total });
  } catch (err) {
    return handleError(err, res);
  }
}

export async function getHotelBySlug(req, res) {
  try {
    const { slug } = hotelSlugSchema.parse(req.params);
    const hotel = await findHotelBySlug(slug);
    return res.status(200).json(hotel);
  } catch (err) {
    return handleError(err, res);
  }
}
