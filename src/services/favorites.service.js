import { QueryTypes } from 'sequelize';
import { sequelize } from '../db.js';
import { UserFavorite } from '../models/userFavorite.js';
import { rowToResto } from '../dto/resto.dto.js';
import { rowToHotel } from '../dto/hotel.dto.js';

export class FavoritesError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function findEstablishmentBySlug(slug) {
  const [row] = await sequelize.query(
    'SELECT id, slug FROM establishments WHERE slug = :slug LIMIT 1',
    {
      type: QueryTypes.SELECT,
      replacements: { slug },
    }
  );
  return row || null;
}

export async function addFavorite({ userId, slug }) {
  const establishment = await findEstablishmentBySlug(slug);
  if (!establishment) {
    throw new FavoritesError('NOT_FOUND', 'Établissement introuvable', 404);
  }

  const existing = await UserFavorite.findOne({
    where: { userId, establishmentId: establishment.id },
  });

  if (existing) {
    return { favorited: true, slug, alreadyExisted: true };
  }

  await UserFavorite.create({
    userId,
    establishmentId: establishment.id,
  });

  return { favorited: true, slug, alreadyExisted: false };
}

// Returns favorites of both types (restaurant + lodging) in a single feed,
// ordered by favorited_at DESC. Each item carries a `type` discriminator so
// the frontend can route rendering (Tables vs Hôtels tab in MonPass).
export async function listFavorites({ userId }) {
  const restoSql = `
    SELECT
      e.id, e.name, e.slug, e.city, e.postal_code, e.address,
      e.lat, e.lng, e.cover_image_url, e.description,
      rd.distinction, rd.price_range,
      ct.name AS cuisine_label,
      uf.created_at AS favorited_at
    FROM user_favorites uf
    JOIN establishments e ON e.id = uf.establishment_id
    JOIN restaurant_details rd ON rd.establishment_id = e.id
    LEFT JOIN cuisine_types ct ON ct.id = rd.cuisine_type_id
    WHERE uf.user_id = :userId
      AND e.type = 'restaurant'
    ORDER BY uf.created_at DESC
  `;

  const hotelSql = `
    SELECT
      e.id, e.name, e.slug, e.city, e.postal_code, e.address,
      e.lat, e.lng, e.phone, e.website, e.cover_image_url, e.description,
      ld.keys_level, ld.lodging_type, ld.rooms_count, ld.amenities,
      uf.created_at AS favorited_at
    FROM user_favorites uf
    JOIN establishments e ON e.id = uf.establishment_id
    JOIN lodging_details ld ON ld.establishment_id = e.id
    WHERE uf.user_id = :userId
      AND e.type = 'lodging'
    ORDER BY uf.created_at DESC
  `;

  const [restoRows, hotelRows] = await Promise.all([
    sequelize.query(restoSql, { type: QueryTypes.SELECT, replacements: { userId } }),
    sequelize.query(hotelSql, { type: QueryTypes.SELECT, replacements: { userId } }),
  ]);

  const restos = restoRows.map((r) => ({
    ...rowToResto(r),
    type: 'restaurant',
    favoritedAt: r.favorited_at,
  }));
  const hotels = hotelRows.map((r) => ({
    ...rowToHotel(r),
    type: 'lodging',
    favoritedAt: r.favorited_at,
  }));

  return [...restos, ...hotels].sort((a, b) => {
    const da = a.favoritedAt ? new Date(a.favoritedAt).getTime() : 0;
    const db = b.favoritedAt ? new Date(b.favoritedAt).getTime() : 0;
    return db - da;
  });
}

export async function removeFavorite({ userId, slug }) {
  const establishment = await findEstablishmentBySlug(slug);
  if (!establishment) {
    throw new FavoritesError('NOT_FOUND', 'Établissement introuvable', 404);
  }

  await UserFavorite.destroy({
    where: { userId, establishmentId: establishment.id },
  });
}
