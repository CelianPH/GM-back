import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllHits } from './algolia.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// COUNTRY_SLUG optionnel : sans, on récupère tout le guide worldwide.
// ex: COUNTRY_SLUG=fr (France), COUNTRY_SLUG=it (Italie), COUNTRY_SLUG=jp (Japon).
const COUNTRY_SLUG = process.env.COUNTRY_SLUG || null;
const OUT_PATH = resolve(
  __dirname,
  'data',
  COUNTRY_SLUG ? `restaurants-${COUNTRY_SLUG}.json` : 'restaurants-worldwide.json'
);

const DISTINCTION_MAP = {
  '3-etoiles-michelin': 'three_stars',
  '2-etoiles-michelin': 'two_stars',
  '1-etoile-michelin': 'one_star',
  'bib-gourmand': 'bib_gourmand',
  'assiette-michelin': 'none',
};

function priceCategoryToRange(priceCategory) {
  if (!priceCategory) return null;
  // Algolia peut renvoyer soit une string ("CAT_P02"), soit un objet
  // { code, label, slug }. On accepte les deux formes.
  const code =
    typeof priceCategory === 'string'
      ? priceCategory
      : priceCategory.code ?? null;
  if (!code) return null;
  const map = {
    'CAT_P01': 1,
    'CAT_P02': 2,
    'CAT_P03': 3,
    'CAT_P04': 4,
  };
  return map[code] ?? null;
}

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
  if (typeof img === 'string') return img;
  if (typeof img === 'object') return img.url || null;
  return null;
}

function normalize(hit) {
  const distinctionSlug = hit.distinction?.slug;
  const distinction = DISTINCTION_MAP[distinctionSlug] ?? 'none';
  const greenStar = Boolean(hit.green_star);

  return {
    externalId: hit.identifier || hit.objectID,
    name: hit.name,
    slug: hit.slug || slugify(`${hit.name}-${hit.identifier || hit.objectID}`),
    type: 'restaurant',
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
    postalCode: hit.postcode ?? null,
    address: hit.street ?? null,
    lat: hit._geoloc?.lat ?? null,
    lng: hit._geoloc?.lng ?? null,
    phone: hit.phone ?? null,
    website: hit.website ?? null,
    email: null,
    coverImageUrl: extractImageUrl(hit.main_image) || extractImageUrl(hit.image) || null,
    description: hit.main_desc ?? null,
    url: hit.url ? `https://guide.michelin.com${hit.url}` : null,

    restaurant: {
      distinction,
      greenStar,
      distinctionLabel: hit.distinction?.label ?? null,
      cuisines: (hit.cuisines || []).map((c) => ({
        label: c.label ?? null,
        slug: c.slug ?? null,
      })),
      chef: hit.chef ?? null,
      priceRange: priceCategoryToRange(hit.price_category),
      price: hit.price ?? null,
      currency: hit.currency ?? null,
      guideYear: hit.guide_year ?? null,
      facilities: (hit.facilities || []).map((f) => f.label || f.slug || f),
      daysOpen: hit.days_open ?? null,
      hoursOfOperation: hit.hours_of_operation ?? null,
    },
  };
}

async function main() {
  const scope = COUNTRY_SLUG ? `country.slug=${COUNTRY_SLUG}` : 'worldwide';
  console.log(`→ Algolia · prod-restaurants-fr · ${scope}`);
  const started = Date.now();
  const hits = await fetchAllHits('prod-restaurants-fr', {
    facetFilters: COUNTRY_SLUG ? [[`country.slug:${COUNTRY_SLUG}`]] : [],
    hitsPerPage: 1000,
    throttleMs: 200,
    onPage: ({ page, nbPages, totalSoFar }) => {
      console.log(`  page ${page + 1}/${nbPages} · ${totalSoFar} items`);
    },
  });

  const seen = new Set();
  const deduped = hits.filter((h) => {
    const id = h.identifier || h.objectID;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  const data = deduped.map(normalize);

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(data, null, 2));
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`✓ ${data.length} restaurants → ${OUT_PATH} (${elapsed}s)`);
}

main().catch((err) => {
  console.error('✗ scrape-restaurants failed:', err);
  process.exit(1);
});
