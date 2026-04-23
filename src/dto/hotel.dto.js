// Maps a DB row (joined establishments + lodging_details) to the frontend Hotel shape.

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
  // Paris 75xxx / Lyon 690xx (1..9) / Marseille 130xx (01..16). Otherwise empty.
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

const KEYS_LABEL = {
  1: 'Une Clef',
  2: 'Deux Clefs',
  3: 'Trois Clefs',
};

const KEYS_MAP = {
  1: '🔑',
  2: '🔑🔑',
  3: '🔑🔑🔑',
};

const LODGING_TYPE_LABEL = {
  hotel: 'Hôtel',
  maison_hotes: "Maison d'hôtes",
  gite: 'Gîte',
  lodge: 'Lodge',
  autre: 'Autre',
};

function parseAmenities(raw) {
  // MySQL's JSON driver may hand us either a parsed object or a string, depending
  // on the client; accept both defensively.
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function rowToHotel(row) {
  const keysLevel = Number(row.keys_level) || 1;
  const lodgingType = row.lodging_type || 'hotel';
  const amenities = parseAmenities(row.amenities);

  const out = {
    slug: row.slug || '',
    name: row.name || '',
    italic: deriveItalic(row.name),
    city: row.city || '',
    district: deriveDistrict(row.postal_code),
    keysLevel,
    keysLabel: KEYS_LABEL[keysLevel] ?? '',
    keysMap: KEYS_MAP[keysLevel] ?? '',
    lodgingType,
    lodgingTypeLabel: LODGING_TYPE_LABEL[lodgingType] ?? '',
    roomsCount: row.rooms_count == null ? null : Number(row.rooms_count),
    amenities,
    address: row.address || '',
    phone: row.phone || '',
    website: row.website || '',
    desc: row.description || '',
    img: row.cover_image_url || '',
    lat: typeof row.lat === 'number' ? row.lat : Number(row.lat) || 0,
    lng: typeof row.lng === 'number' ? row.lng : Number(row.lng) || 0,
  };

  if (row.distance_km != null) {
    out.distance_km = Number(row.distance_km);
  }

  return out;
}
