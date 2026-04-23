import { QueryTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { rowToHotel } from '../dto/hotel.dto.js';

export class HotelsError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const HAVERSINE_SQL = `(6371 * acos(
  cos(radians(:lat)) * cos(radians(e.lat))
  * cos(radians(e.lng) - radians(:lng))
  + sin(radians(:lat)) * sin(radians(e.lat))
))`;

// Build an AND-joined list of JSON_CONTAINS checks, one per amenity id.
// Returns { sql, replacements } — replacements are named :amen0, :amen1...
// Stored shape is [{"id":N,"amenity":"…"}]; JSON_CONTAINS does subset matching
// on objects, so `JSON_OBJECT('id', :id)` matches any element with that id.
function buildAmenitiesClause(amenities) {
  if (!amenities || amenities.length === 0) {
    return { sql: '', replacements: {} };
  }
  const clauses = [];
  const replacements = {};
  amenities.forEach((id, i) => {
    const key = `amen${i}`;
    clauses.push(`JSON_CONTAINS(ld.amenities, JSON_OBJECT('id', :${key}))`);
    replacements[key] = Number(id);
  });
  return {
    sql: `AND (${clauses.join(' AND ')})`,
    replacements,
  };
}

const SELECT_COLS_BASE = `
  e.id, e.name, e.slug, e.city, e.postal_code, e.address,
  e.lat, e.lng, e.phone, e.website, e.cover_image_url, e.description,
  ld.keys_level, ld.lodging_type, ld.rooms_count, ld.amenities
`;

export async function findRecommendations({ lat, lng, radiusKm, keysLevel, lodgingType, amenities }) {
  const amenitiesClause = buildAmenitiesClause(amenities);

  const sql = `
    SELECT
      ${SELECT_COLS_BASE},
      ${HAVERSINE_SQL} AS distance_km
    FROM establishments e
    JOIN lodging_details ld ON ld.establishment_id = e.id
    WHERE e.type = 'lodging'
      AND (:radiusKm IS NULL OR ${HAVERSINE_SQL} <= :radiusKm)
      AND (:keysLevel IS NULL OR ld.keys_level = :keysLevel)
      AND (:lodgingType IS NULL OR ld.lodging_type = :lodgingType)
      ${amenitiesClause.sql}
    ORDER BY distance_km ASC
    LIMIT 5
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: {
      lat,
      lng,
      radiusKm: radiusKm ?? null,
      keysLevel: keysLevel ?? null,
      lodgingType: lodgingType ?? null,
      ...amenitiesClause.replacements,
    },
  });

  return rows.map(rowToHotel);
}

export async function findHotelBySlug(slug) {
  const sql = `
    SELECT ${SELECT_COLS_BASE}
    FROM establishments e
    JOIN lodging_details ld ON ld.establishment_id = e.id
    WHERE e.type = 'lodging'
      AND e.slug = :slug
    LIMIT 1
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { slug },
  });

  if (!rows.length) {
    throw new HotelsError('NOT_FOUND', 'Hôtel introuvable', 404);
  }

  return rowToHotel(rows[0]);
}

export async function listHotels({
  lat,
  lng,
  radiusKm,
  keysLevel,
  lodgingType,
  amenities,
  limit,
  offset,
}) {
  const hasGeo = lat != null && lng != null;
  const amenitiesClause = buildAmenitiesClause(amenities);

  const geoWhere = hasGeo
    ? `AND (:radiusKm IS NULL OR ${HAVERSINE_SQL} <= :radiusKm)`
    : '';

  const filtersWhere = `
    AND (:keysLevel IS NULL OR ld.keys_level = :keysLevel)
    AND (:lodgingType IS NULL OR ld.lodging_type = :lodgingType)
    ${amenitiesClause.sql}
  `;

  const baseFrom = `
    FROM establishments e
    JOIN lodging_details ld ON ld.establishment_id = e.id
    WHERE e.type = 'lodging'
      ${geoWhere}
      ${filtersWhere}
  `;

  const selectCols = hasGeo
    ? `${SELECT_COLS_BASE}, ${HAVERSINE_SQL} AS distance_km`
    : SELECT_COLS_BASE;

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
    keysLevel: keysLevel ?? null,
    lodgingType: lodgingType ?? null,
    limit,
    offset,
    ...amenitiesClause.replacements,
  };

  const [rows, countRows] = await Promise.all([
    sequelize.query(listSql, { type: QueryTypes.SELECT, replacements }),
    sequelize.query(countSql, { type: QueryTypes.SELECT, replacements }),
  ]);

  const total = Number(countRows[0]?.total ?? 0);
  return { results: rows.map(rowToHotel), total };
}
