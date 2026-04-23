import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllHits } from './algolia.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// HOTEL_COUNTRY_SLUG optionnel : sans, on récupère tout le guide worldwide.
// ex: HOTEL_COUNTRY_SLUG=france, HOTEL_COUNTRY_SLUG=italy.
// ⚠️ L'index hôtels utilise le nom pays complet slugifié, pas le code ISO.
const COUNTRY_SLUG = process.env.HOTEL_COUNTRY_SLUG || null;
const OUT_PATH = resolve(
  __dirname,
  'data',
  COUNTRY_SLUG ? `hotels-${COUNTRY_SLUG}.json` : 'hotels-worldwide.json'
);

function slugify(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractImageUrl(img) {
  if (!img) return null;
  if (typeof img === 'string') return img.startsWith('http') ? img : `https://${img}`;
  if (typeof img === 'object') {
    const u = img.url || img.hotrooms_large_url || img.large_url || null;
    if (!u) return null;
    return u.startsWith('http') ? u : `https://${u}`;
  }
  return null;
}

function inferLodgingType(hit) {
  const amenities = hit.hotel_amenities || hit.plus_amenities || [];
  const text = `${hit.name} ${(amenities || []).join(' ')}`.toLowerCase();
  if (/maison d'h[oô]tes|bed.?and.?breakfast/.test(text)) return 'maison_hotes';
  if (/g[iî]te/.test(text)) return 'gite';
  if (/lodge/.test(text)) return 'lodge';
  return 'hotel';
}

function normalizeKeys(distinction, distinctionScore) {
  // Michelin Keys: 1/2/3 depuis distinction_score si dispo, sinon via label.
  if (typeof distinctionScore === 'number' && distinctionScore >= 1) {
    return Math.min(3, Math.max(1, Math.round(distinctionScore)));
  }
  const label = distinction?.label ?? '';
  const m = label.match(/(\d)\s*(?:cl[eé]|key)/i);
  if (m) return Math.min(3, Math.max(1, Number(m[1])));
  return 1;
}

function normalize(hit) {
  const address = Array.isArray(hit.address) ? hit.address.join(', ') : (hit.address ?? null);
  const keysLevel = normalizeKeys(hit.distinction, hit.distinction_score);

  return {
    externalId: hit.hotel_id || hit.objectID,
    name: hit.name,
    slug: hit.slug || slugify(`${hit.name}-${hit.hotel_id || hit.objectID}`),
    type: 'lodging',
    country: {
      name: hit.country?.name ?? null,
      slug: hit.country?.slug ?? null,
      code: hit.country?.code ?? null,
    },
    region: {
      name: hit.region?.name ?? null,
      slug: hit.region?.slug ?? null,
    },
    city: hit.city?.name ?? null,
    citySlug: hit.city?.slug ?? null,
    postalCode: hit.postal_code ?? null,
    address,
    lat: hit._geoloc?.lat ?? null,
    lng: hit._geoloc?.lng ?? null,
    phone: hit.phone ?? null,
    website: hit.url ?? null,
    email: null,
    coverImageUrl: extractImageUrl(hit.main_image) || extractImageUrl(hit.images?.[0]) || null,
    description: hit.content ?? null,
    url: hit.canonical_url ? `https://guide.michelin.com${hit.canonical_url}` : null,

    lodging: {
      keysLevel,
      lodgingType: inferLodgingType(hit),
      roomsCount: hit.num_rooms ?? null,
      amenities: hit.hotel_amenities ?? [],
      distinctionLabel: hit.distinction?.label ?? null,
      isPlus: Boolean(hit.is_plus),
      neighborhood: hit.neighborhood ?? null,
    },
  };
}

async function main() {
  const scope = COUNTRY_SLUG ? `country.slug=${COUNTRY_SLUG}` : 'worldwide';
  console.log(`→ Algolia · prod-hotels-fr · ${scope}`);
  const started = Date.now();
  const hits = await fetchAllHits('prod-hotels-fr', {
    facetFilters: COUNTRY_SLUG ? [[`country.slug:${COUNTRY_SLUG}`]] : [],
    hitsPerPage: 1000,
    throttleMs: 200,
    onPage: ({ page, nbPages, totalSoFar }) => {
      console.log(`  page ${page + 1}/${nbPages} · ${totalSoFar} items`);
    },
  });

  const seen = new Set();
  const deduped = hits.filter((h) => {
    const id = h.hotel_id || h.objectID;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const data = deduped.map(normalize);

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(data, null, 2));
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`✓ ${data.length} hôtels → ${OUT_PATH} (${elapsed}s)`);
}

main().catch((err) => {
  console.error('✗ scrape-hotels failed:', err);
  process.exit(1);
});
