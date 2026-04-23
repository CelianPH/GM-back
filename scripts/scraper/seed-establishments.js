// Seeder : ingère les JSON produits par scrape-restaurants.js / scrape-hotels.js
// vers les tables regions, cuisine_types, establishments, restaurant_details, lodging_details.
//
// Structure régions : hiérarchie pays → région via parent_region_id.
//   - country root  : slug = slugify(country.name)             (ex: france)
//   - region child  : slug = `${countrySlug}--${regionSlug}`    (ex: france--ile-de-france)
//
// Les items sans region sont rattachés au pays directement.
// Les items sans country sont ignorés.
//
// TRUNCATE des tables au début : ce seeder est autoritatif (source unique = Algolia).

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../src/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');

const BATCH_SIZE = 500;

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickDataFile(candidates) {
  for (const c of candidates) {
    const p = resolve(DATA_DIR, c);
    if (existsSync(p)) return p;
  }
  return null;
}

async function loadJson(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

async function truncateAll() {
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const t of ['lodging_details', 'restaurant_details', 'establishments', 'cuisine_types', 'regions']) {
    await sequelize.query(`TRUNCATE TABLE ${t}`);
  }
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
}

async function insertInBatches(sql, rows, rowParams) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const placeholder = sql.placeholder;
    const values = batch.map(() => placeholder).join(', ');
    const params = batch.flatMap(rowParams);
    await sequelize.query(`${sql.prefix} VALUES ${values} ${sql.suffix || ''}`, {
      replacements: params,
      type: QueryTypes.INSERT,
    });
  }
}

async function seedRegions(items) {
  // 1) Pays = racines
  const countryByKey = new Map();
  for (const it of items) {
    const name = it.country?.name;
    if (!name) continue;
    const key = slugify(name);
    if (!key) continue;
    if (!countryByKey.has(key)) countryByKey.set(key, { name, slug: key });
  }

  const countryRows = [...countryByKey.values()];
  await insertInBatches(
    {
      placeholder: '(?, ?, NULL, NOW(), NOW())',
      prefix: 'INSERT INTO regions (name, slug, parent_region_id, created_at, updated_at)',
    },
    countryRows,
    (r) => [r.name, r.slug]
  );

  const countryDb = await sequelize.query(
    `SELECT id, slug FROM regions WHERE parent_region_id IS NULL AND slug IN (${countryRows.map(() => '?').join(',')})`,
    { replacements: countryRows.map((r) => r.slug), type: QueryTypes.SELECT }
  );
  const countryIdBySlug = new Map(countryDb.map((r) => [r.slug, r.id]));

  // 2) Régions = enfants
  const regionByKey = new Map();
  for (const it of items) {
    const countryName = it.country?.name;
    const regionName = it.region?.name;
    const regionSlug = it.region?.slug;
    if (!countryName || !regionName || !regionSlug) continue;
    const countryKey = slugify(countryName);
    const parentId = countryIdBySlug.get(countryKey);
    if (!parentId) continue;
    const compositeSlug = `${countryKey}--${slugify(regionSlug)}`;
    if (!regionByKey.has(compositeSlug)) {
      regionByKey.set(compositeSlug, {
        name: regionName,
        slug: compositeSlug.slice(0, 255),
        parentId,
      });
    }
  }

  const regionRows = [...regionByKey.values()];
  if (regionRows.length > 0) {
    await insertInBatches(
      {
        placeholder: '(?, ?, ?, NOW(), NOW())',
        prefix: 'INSERT INTO regions (name, slug, parent_region_id, created_at, updated_at)',
      },
      regionRows,
      (r) => [r.name, r.slug, r.parentId]
    );
  }

  // 3) Build combined lookup: regionKey (composite) → region_id, countryKey → country_id
  const allRegionDb = await sequelize.query('SELECT id, slug FROM regions', { type: QueryTypes.SELECT });
  const regionIdBySlug = new Map(allRegionDb.map((r) => [r.slug, r.id]));

  return { countryIdBySlug, regionIdBySlug, countryCount: countryRows.length, regionCount: regionRows.length };
}

async function seedCuisineTypes(restaurants) {
  // Dédup case-insensitive (collation utf8mb4_unicode_ci côté MySQL).
  const byKey = new Map();
  for (const r of restaurants) {
    for (const c of r.restaurant?.cuisines || []) {
      const label = c?.label;
      if (!label) continue;
      const key = label.toLocaleLowerCase('fr-FR');
      if (!byKey.has(key)) byKey.set(key, label);
    }
  }
  const names = [...byKey.values()];
  if (names.length === 0) return new Map();

  await insertInBatches(
    {
      placeholder: '(?, NOW(), NOW())',
      prefix: 'INSERT INTO cuisine_types (name, created_at, updated_at)',
    },
    names,
    (n) => [n]
  );

  const dbRows = await sequelize.query('SELECT id, name FROM cuisine_types', { type: QueryTypes.SELECT });
  // Construire le lookup case-insensitive pour la recherche ultérieure.
  const lookup = new Map();
  for (const row of dbRows) {
    lookup.set(row.name.toLocaleLowerCase('fr-FR'), row.id);
  }
  return lookup;
}

function resolveRegionId(it, countryIdBySlug, regionIdBySlug) {
  const countryName = it.country?.name;
  if (!countryName) return null;
  const countryKey = slugify(countryName);
  const regionSlug = it.region?.slug;
  if (regionSlug) {
    const compositeSlug = `${countryKey}--${slugify(regionSlug)}`;
    const rid = regionIdBySlug.get(compositeSlug);
    if (rid) return rid;
  }
  return countryIdBySlug.get(countryKey) ?? null;
}

async function seedEstablishments(items, countryIdBySlug, regionIdBySlug) {
  const rows = [];
  const seenSlugs = new Set();
  let skippedNoRegion = 0;
  let skippedDuplicate = 0;

  for (const it of items) {
    const regionId = resolveRegionId(it, countryIdBySlug, regionIdBySlug);
    if (!regionId) { skippedNoRegion++; continue; }
    if (!it.slug || !it.name || !it.city) continue;
    if (seenSlugs.has(it.slug)) { skippedDuplicate++; continue; }
    seenSlugs.add(it.slug);

    rows.push({
      name: it.name.slice(0, 255),
      slug: it.slug.slice(0, 255),
      type: it.type,
      region_id: regionId,
      city: it.city.slice(0, 255),
      postal_code: (it.postalCode || '00000').slice(0, 10),
      address: (it.address || 'N/A').slice(0, 255),
      lat: typeof it.lat === 'number' ? it.lat : 0,
      lng: typeof it.lng === 'number' ? it.lng : 0,
      phone: it.phone?.slice(0, 255) || null,
      website: it.website?.slice(0, 255) || null,
      email: it.email?.slice(0, 255) || null,
      cover_image_url: it.coverImageUrl?.slice(0, 255) || null,
      description: it.description || null,
    });
  }

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())').join(', ');
    const params = batch.flatMap((r) => [
      r.name, r.slug, r.type, r.region_id, r.city, r.postal_code, r.address,
      r.lat, r.lng, r.phone, r.website, r.email, r.cover_image_url, r.description,
    ]);
    await sequelize.query(
      `INSERT INTO establishments
         (name, slug, type, region_id, city, postal_code, address, lat, lng,
          phone, website, email, cover_image_url, description, created_at, updated_at)
       VALUES ${values}`,
      { replacements: params, type: QueryTypes.INSERT }
    );
    done += batch.length;
    process.stdout.write(`\r  establishments insert · ${done}/${rows.length}`);
  }
  process.stdout.write('\n');
  if (skippedNoRegion) console.log(`  (${skippedNoRegion} items sans région / pays ignorés)`);
  if (skippedDuplicate) console.log(`  (${skippedDuplicate} doublons de slug ignorés)`);

  const dbRows = await sequelize.query('SELECT id, slug FROM establishments', { type: QueryTypes.SELECT });
  return new Map(dbRows.map((r) => [r.slug, r.id]));
}

async function seedRestaurantDetails(restaurants, establishmentIdBySlug, cuisineIdByName) {
  const rows = [];
  const seenEid = new Set();
  for (const r of restaurants) {
    const eid = establishmentIdBySlug.get(r.slug);
    if (!eid) continue;
    if (seenEid.has(eid)) continue;
    seenEid.add(eid);
    const firstCuisine = r.restaurant?.cuisines?.[0]?.label;
    const greenStar = Boolean(r.restaurant?.greenStar);
    const distinction = greenStar ? 'green_star' : (r.restaurant?.distinction || 'none');
    const cuisineId = firstCuisine
      ? cuisineIdByName.get(firstCuisine.toLocaleLowerCase('fr-FR')) ?? null
      : null;
    rows.push({
      establishment_id: eid,
      distinction,
      cuisine_type_id: cuisineId,
      price_range: r.restaurant?.priceRange ?? null,
    });
  }

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch.map(() => '(?, ?, ?, ?, NOW(), NOW())').join(', ');
    const params = batch.flatMap((r) => [r.establishment_id, r.distinction, r.cuisine_type_id, r.price_range]);
    await sequelize.query(
      `INSERT INTO restaurant_details
         (establishment_id, distinction, cuisine_type_id, price_range, created_at, updated_at)
       VALUES ${values}`,
      { replacements: params, type: QueryTypes.INSERT }
    );
    done += batch.length;
    process.stdout.write(`\r  restaurant_details insert · ${done}/${rows.length}`);
  }
  process.stdout.write('\n');
}

// Keep amenities as [{id, amenity}] objects so the frontend can display labels
// directly and SQL filtering via JSON_CONTAINS(amenities, JSON_OBJECT('id', :id))
// still works (subset matching in MySQL 8).
function normalizeAmenities(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const a of raw) {
    if (!a || typeof a !== 'object') continue;
    const id = Number(a.id);
    const label = typeof a.amenity === 'string' ? a.amenity : null;
    if (!Number.isFinite(id) || id <= 0 || !label) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, amenity: label });
  }
  return out;
}

async function seedLodgingDetails(hotels, establishmentIdBySlug) {
  const rows = [];
  const seenEid = new Set();
  for (const h of hotels) {
    const eid = establishmentIdBySlug.get(h.slug);
    if (!eid) continue;
    if (seenEid.has(eid)) continue;
    seenEid.add(eid);
    rows.push({
      establishment_id: eid,
      keys_level: h.lodging?.keysLevel ?? 1,
      lodging_type: h.lodging?.lodgingType ?? 'hotel',
      rooms_count: h.lodging?.roomsCount ?? null,
      amenities: JSON.stringify(normalizeAmenities(h.lodging?.amenities)),
    });
  }

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch.map(() => '(?, ?, ?, ?, ?, NOW(), NOW())').join(', ');
    const params = batch.flatMap((r) => [
      r.establishment_id,
      r.keys_level,
      r.lodging_type,
      r.rooms_count,
      r.amenities,
    ]);
    await sequelize.query(
      `INSERT INTO lodging_details
         (establishment_id, keys_level, lodging_type, rooms_count, amenities, created_at, updated_at)
       VALUES ${values}`,
      { replacements: params, type: QueryTypes.INSERT }
    );
    done += batch.length;
    process.stdout.write(`\r  lodging_details insert · ${done}/${rows.length}`);
  }
  process.stdout.write('\n');
}

async function main() {
  const restaurantsPath = pickDataFile(['restaurants-worldwide.json', 'restaurants-fr.json']);
  const hotelsPath = pickDataFile(['hotels-worldwide.json', 'hotels-fr.json']);

  if (!restaurantsPath || !hotelsPath) {
    console.error('✗ Aucun fichier de données trouvé. Lance d\'abord `npm run scrape:all`.');
    process.exit(1);
  }
  console.log(`→ Lecture: ${restaurantsPath}`);
  console.log(`→ Lecture: ${hotelsPath}`);

  const [restaurants, hotels] = await Promise.all([
    loadJson(restaurantsPath),
    loadJson(hotelsPath),
  ]);
  console.log(`  ${restaurants.length} restaurants, ${hotels.length} hôtels à ingérer`);

  await sequelize.authenticate();

  console.log('→ truncate tables');
  await truncateAll();

  const all = [...restaurants, ...hotels];

  console.log('→ regions (pays + régions)');
  const { countryIdBySlug, regionIdBySlug, countryCount, regionCount } = await seedRegions(all);
  console.log(`  ✓ ${countryCount} pays + ${regionCount} régions`);

  console.log('→ cuisine_types');
  const cuisineIdByName = await seedCuisineTypes(restaurants);
  console.log(`  ✓ ${cuisineIdByName.size} types de cuisine`);

  console.log('→ establishments');
  const establishmentIdBySlug = await seedEstablishments(all, countryIdBySlug, regionIdBySlug);
  console.log(`  ✓ ${establishmentIdBySlug.size} établissements`);

  console.log('→ restaurant_details');
  await seedRestaurantDetails(restaurants, establishmentIdBySlug, cuisineIdByName);

  console.log('→ lodging_details');
  await seedLodgingDetails(hotels, establishmentIdBySlug);

  await sequelize.close();
  console.log('✓ Seed terminé');
}

main().catch(async (err) => {
  console.error('✗ seed-establishments failed:', err);
  try { await sequelize.close(); } catch {}
  process.exit(1);
});
