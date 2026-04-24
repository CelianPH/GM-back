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

// Fallback: when the client patches the address but omits coordinates, re-geocode via
// the French public address API so the map stays in sync. Failures are swallowed — we
// still accept the text change rather than blocking the whole save.
async function geocodeFR(query) {
  if (!query) return null;
  try {
    const url =
      'https://api-adresse.data.gouv.fr/search/?limit=1&q=' + encodeURIComponent(query);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    const coords = feat?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) return null;
    const [lng, lat] = coords;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return { lat, lng };
  } catch {
    return null;
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
    lat: 'lat',
    lng: 'lng',
  });

  // If the caller patched the address text but forgot to send coordinates, re-geocode
  // from the final address so the map stays aligned with what was saved.
  const addressTouched =
    patch.address !== undefined ||
    patch.city !== undefined ||
    patch.postalCode !== undefined;
  const coordsProvided = patch.lat !== undefined && patch.lng !== undefined;
  if (addressTouched && !coordsProvided) {
    const finalAddress = patch.address ?? est.address ?? '';
    const finalPostal = patch.postalCode ?? est.postal_code ?? '';
    const finalCity = patch.city ?? est.city ?? '';
    const query = [finalAddress, finalPostal, finalCity].filter(Boolean).join(' ').trim();
    const geo = await geocodeFR(query);
    if (geo) {
      baseChanges.lat = geo.lat;
      baseChanges.lng = geo.lng;
    }
  }

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
