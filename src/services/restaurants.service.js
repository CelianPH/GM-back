import { QueryTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { rowToResto } from '../dto/resto.dto.js';

export class RestaurantsError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// The DB schema stores cuisine_types.name (free-form label, e.g. "Cuisine moderne").
// The frontend sends a cuisine "slug", so we normalize both sides with this helper.
// Uses the same conventions as scripts/scraper/seed-establishments.js#slugify.
export function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const HAVERSINE_SQL = `(6371 * acos(
  cos(radians(:lat)) * cos(radians(e.lat))
  * cos(radians(e.lng) - radians(:lng))
  + sin(radians(:lat)) * sin(radians(e.lat))
))`;

// Accent-insensitive normalized cuisine label expression.
// Used to match against the normalized cuisineSlug passed in replacements.
export const CUISINE_NORMALIZED_SQL = `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  ct.name,
  'à','a'),'â','a'),'ä','a'),'é','e'),'è','e'),'ê','e'),'ë','e'),'î','i'),'ï','i'),'ô','o'),'ö','o'
))`;

export async function findRecommendations({ lat, lng, radiusKm, cuisine, distinction, maxPrice }) {
  const cuisineSlug = cuisine ? slugify(cuisine) : null;

  const sql = `
    SELECT
      e.id, e.name, e.slug, e.city, e.postal_code, e.address,
      e.lat, e.lng, e.cover_image_url, e.description,
      rd.distinction, rd.price_range,
      ct.name AS cuisine_label,
      ${HAVERSINE_SQL} AS distance_km
    FROM establishments e
    JOIN restaurant_details rd ON rd.establishment_id = e.id
    LEFT JOIN cuisine_types ct ON ct.id = rd.cuisine_type_id
    WHERE e.type = 'restaurant'
      AND (:radiusKm IS NULL OR ${HAVERSINE_SQL} <= :radiusKm)
      AND (:distinction IS NULL OR rd.distinction = :distinction)
      AND (
        :cuisineSlug IS NULL
        OR ${CUISINE_NORMALIZED_SQL} LIKE CONCAT('%', :cuisineSlug, '%')
      )
      AND (:maxPrice IS NULL OR rd.price_range IS NULL OR rd.price_range <= :maxPrice)
    ORDER BY distance_km ASC
    LIMIT 5
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: {
      lat,
      lng,
      radiusKm: radiusKm ?? null,
      distinction: distinction ?? null,
      cuisineSlug,
      maxPrice: maxPrice ?? null,
    },
  });

  return rows.map(rowToResto);
}

export async function findRestaurantBySlug(slug) {
  const sql = `
    SELECT
      e.id, e.name, e.slug, e.city, e.postal_code, e.address,
      e.lat, e.lng, e.cover_image_url, e.description,
      rd.distinction, rd.price_range,
      ct.name AS cuisine_label
    FROM establishments e
    JOIN restaurant_details rd ON rd.establishment_id = e.id
    LEFT JOIN cuisine_types ct ON ct.id = rd.cuisine_type_id
    WHERE e.type = 'restaurant'
      AND e.slug = :slug
    LIMIT 1
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { slug },
  });

  if (!rows.length) {
    throw new RestaurantsError('NOT_FOUND', 'Restaurant introuvable', 404);
  }

  return rowToResto(rows[0]);
}

export async function listRestaurants({
  lat,
  lng,
  radiusKm,
  cuisine,
  distinction,
  maxPrice,
  limit,
  offset,
}) {
  const cuisineSlug = cuisine ? slugify(cuisine) : null;
  const hasGeo = lat != null && lng != null;

  // Shared WHERE clauses. Haversine expression is only referenced when hasGeo is true,
  // but we keep it out of the WHERE chain entirely to avoid pulling unused :lat/:lng
  // replacements and to keep the COUNT query cheap when geo is absent.
  const geoWhere = hasGeo
    ? `AND (:radiusKm IS NULL OR ${HAVERSINE_SQL} <= :radiusKm)`
    : '';

  const filtersWhere = `
    AND (:distinction IS NULL OR rd.distinction = :distinction)
    AND (
      :cuisineSlug IS NULL
      OR ${CUISINE_NORMALIZED_SQL} LIKE CONCAT('%', :cuisineSlug, '%')
    )
    AND (:maxPrice IS NULL OR rd.price_range IS NULL OR rd.price_range <= :maxPrice)
  `;

  const baseFrom = `
    FROM establishments e
    JOIN restaurant_details rd ON rd.establishment_id = e.id
    LEFT JOIN cuisine_types ct ON ct.id = rd.cuisine_type_id
    WHERE e.type = 'restaurant'
      ${geoWhere}
      ${filtersWhere}
  `;

  const selectCols = hasGeo
    ? `e.id, e.name, e.slug, e.city, e.postal_code, e.address,
       e.lat, e.lng, e.cover_image_url, e.description,
       rd.distinction, rd.price_range,
       ct.name AS cuisine_label,
       ${HAVERSINE_SQL} AS distance_km`
    : `e.id, e.name, e.slug, e.city, e.postal_code, e.address,
       e.lat, e.lng, e.cover_image_url, e.description,
       rd.distinction, rd.price_range,
       ct.name AS cuisine_label`;

  const orderBy = hasGeo ? 'ORDER BY distance_km ASC' : 'ORDER BY e.name ASC';

  const listSql = `
    SELECT ${selectCols}
    ${baseFrom}
    ${orderBy}
    LIMIT :limit OFFSET :offset
  `;

  const countSql = `SELECT COUNT(*) AS total ${baseFrom}`;

  const replacements = {
    lat: hasGeo ? lat : 0,
    lng: hasGeo ? lng : 0,
    radiusKm: radiusKm ?? null,
    distinction: distinction ?? null,
    cuisineSlug,
    maxPrice: maxPrice ?? null,
    limit,
    offset,
  };

  const [rows, countRows] = await Promise.all([
    sequelize.query(listSql, { type: QueryTypes.SELECT, replacements }),
    sequelize.query(countSql, { type: QueryTypes.SELECT, replacements }),
  ]);

  const total = Number(countRows[0]?.total ?? 0);
  return { results: rows.map(rowToResto), total };
}
