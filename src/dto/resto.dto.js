// Maps a DB row (joined establishments + restaurant_details + cuisine_types)
// to the frontend Resto shape.

const ARTICLE_RE = /^(le|la|les|l'|l’|un|une|des|du|de|d'|d’)$/i;

function deriveItalic(name) {
  if (!name) return '';
  const tokens = String(name).split(/\s+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!ARTICLE_RE.test(tokens[i])) return tokens[i];
  }
  return tokens[tokens.length - 1] || '';
}

function deriveDistrict(postalCode) {
  // Arrondissement only makes sense for cities that use postal-coded arrondissements:
  // Paris (75xxx), Lyon (6900x with x in 1..9), Marseille (130xx with xx in 01..16).
  // For every other city we return '' so the UI can fall back to the bare city name
  // (e.g. "Dijon" instead of the misleading "Paris 00").
  if (!postalCode) return '';
  const digits = String(postalCode).replace(/\D/g, '');
  if (digits.length < 5) return '';
  const prefix = digits.slice(0, 2);
  const last2 = digits.slice(-2);

  if (prefix === '75') return last2;
  if (digits.startsWith('690')) {
    const n = Number(last2);
    if (n >= 1 && n <= 9) return last2;
  }
  if (digits.startsWith('130')) {
    const n = Number(last2);
    if (n >= 1 && n <= 16) return last2;
  }
  return '';
}

const DISTINCTION_LABEL = {
  none: 'Sélection',
  bib_gourmand: 'Bib',
  one_star: '★',
  two_stars: '★★',
  three_stars: '★★★',
  green_star: 'Étoile Verte',
};

const DISTINCTION_MAP = {
  none: 'Sélection',
  bib_gourmand: 'B',
  one_star: '★',
  two_stars: '★★',
  three_stars: '★★★',
  green_star: 'V',
};

const PRICE_LABEL = {
  1: '€',
  2: '€€',
  3: '€€€',
  4: '€€€€',
};

export function rowToResto(row) {
  const distinction = row.distinction || 'none';
  const priceRange = row.price_range == null ? null : Number(row.price_range);

  return {
    slug: row.slug || '',
    name: row.name || '',
    italic: deriveItalic(row.name),
    city: row.city || '',
    district: deriveDistrict(row.postal_code),
    cuisine: row.cuisine_label || '',
    chef: '',
    distinction,
    distinctionLabel: DISTINCTION_LABEL[distinction] ?? '',
    distinctionMap: DISTINCTION_MAP[distinction] ?? '',
    price: priceRange != null ? PRICE_LABEL[priceRange] ?? '' : '',
    address: row.address || '',
    services: '',
    mood: '',
    moods: [],
    desc: row.description || '',
    img: row.cover_image_url || '',
    lat: typeof row.lat === 'number' ? row.lat : Number(row.lat) || 0,
    lng: typeof row.lng === 'number' ? row.lng : Number(row.lng) || 0,
  };
}
