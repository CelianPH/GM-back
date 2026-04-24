import crypto from 'node:crypto';
import { QueryTypes } from 'sequelize';
import {
  sequelize,
  Establishment,
  RestaurantDetail,
  LodgingDetail,
} from '../models/index.js';
import { establishmentToProPayload } from '../dto/proEstablishment.dto.js';

export class ProError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function fetchCuisineLabel(cuisineTypeId) {
  if (!cuisineTypeId) return null;
  const rows = await sequelize.query(
    'SELECT name FROM cuisine_types WHERE id = :id LIMIT 1',
    { type: QueryTypes.SELECT, replacements: { id: cuisineTypeId } },
  );
  return rows[0]?.name ?? null;
}

async function loadEstablishmentFull(establishmentId) {
  const est = await Establishment.findByPk(establishmentId, {
    include: [
      { model: RestaurantDetail, as: 'restaurantDetail', required: false },
      { model: LodgingDetail, as: 'lodgingDetail', required: false },
    ],
  });
  if (!est) throw new ProError('NOT_FOUND', 'Établissement introuvable', 404);
  return est;
}

export async function getMyEstablishment(establishmentId) {
  const est = await loadEstablishmentFull(establishmentId);
  const cuisineLabel = await fetchCuisineLabel(est.restaurantDetail?.cuisine_type_id);
  return establishmentToProPayload(est, cuisineLabel);
}

// Patches that come in as undefined are skipped; null is treated as an explicit clear.
function applyDefined(target, source, mapping) {
  for (const [key, field] of Object.entries(mapping)) {
    if (source[key] !== undefined) target[field] = source[key];
  }
}

export async function updateMyEstablishment(establishmentId, patch) {
  const est = await loadEstablishmentFull(establishmentId);

  // Establishment-level fields. Distinction, name and slug are intentionally NOT editable
  // (they belong to the Guide, not the manager).
  const baseChanges = {};
  applyDefined(baseChanges, patch, {
    description: 'description',
    address: 'address',
    city: 'city',
    postalCode: 'postal_code',
    phone: 'phone',
    website: 'website',
    email: 'email',
    coverImageUrl: 'cover_image_url',
  });
  if (Object.keys(baseChanges).length > 0) {
    await est.update(baseChanges);
  }

  // Restaurant detail patch — only valid when the establishment IS a restaurant.
  if (patch.restaurantDetail !== undefined) {
    if (est.type !== 'restaurant') {
      throw new ProError('WRONG_KIND', 'restaurantDetail invalide pour un hébergement', 400);
    }
    if (!est.restaurantDetail) {
      throw new ProError('NO_DETAIL', 'Détail restaurant absent', 409);
    }
    const detailChanges = {};
    applyDefined(detailChanges, patch.restaurantDetail, {
      cuisineTypeId: 'cuisine_type_id',
      priceRange: 'price_range',
    });
    if (Object.keys(detailChanges).length > 0) {
      await est.restaurantDetail.update(detailChanges);
    }
  }

  // Lodging detail patch — only valid when the establishment IS lodging.
  if (patch.lodgingDetail !== undefined) {
    if (est.type !== 'lodging') {
      throw new ProError('WRONG_KIND', 'lodgingDetail invalide pour un restaurant', 400);
    }
    if (!est.lodgingDetail) {
      throw new ProError('NO_DETAIL', 'Détail hébergement absent', 409);
    }
    const detailChanges = {};
    applyDefined(detailChanges, patch.lodgingDetail, {
      lodgingType: 'lodging_type',
      roomsCount: 'rooms_count',
      amenities: 'amenities',
    });
    if (Object.keys(detailChanges).length > 0) {
      await est.lodgingDetail.update(detailChanges);
    }
  }

  // Reload to return a fresh, fully-hydrated payload (DB defaults, label, etc.)
  const fresh = await loadEstablishmentFull(establishmentId);
  const cuisineLabel = await fetchCuisineLabel(fresh.restaurantDetail?.cuisine_type_id);
  return establishmentToProPayload(fresh, cuisineLabel);
}

export async function updateCover(establishmentId, coverImageUrl) {
  return updateMyEstablishment(establishmentId, { coverImageUrl });
}

export async function ensureQrToken(establishmentId, { rotate = false } = {}) {
  const est = await loadEstablishmentFull(establishmentId);
  if (!rotate && est.qrToken) {
    const cuisineLabel = await fetchCuisineLabel(est.restaurantDetail?.cuisine_type_id);
    return establishmentToProPayload(est, cuisineLabel);
  }
  const token = 'gm_' + crypto.randomBytes(16).toString('hex');
  await est.update({ qrToken: token });
  const fresh = await loadEstablishmentFull(establishmentId);
  const cuisineLabel = await fetchCuisineLabel(fresh.restaurantDetail?.cuisine_type_id);
  return establishmentToProPayload(fresh, cuisineLabel);
}
