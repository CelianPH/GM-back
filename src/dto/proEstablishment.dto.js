// Maps an Establishment (with restaurantDetail / lodgingDetail) to the pro space
// payload — richer than the public Resto/Hotel shape because it must support edition.

const DISTINCTION_LABEL = {
  none: 'Sélection',
  bib_gourmand: 'Bib Gourmand',
  one_star: '★',
  two_stars: '★★',
  three_stars: '★★★',
  green_star: 'Étoile Verte',
};

const PRICE_LABEL = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };

const KEYS_LABEL = { 1: 'Une Clef', 2: 'Deux Clefs', 3: 'Trois Clefs' };

const LODGING_TYPE_LABEL = {
  hotel: 'Hôtel',
  maison_hotes: "Maison d'hôtes",
  gite: 'Gîte',
  lodge: 'Lodge',
  autre: 'Autre',
};

function parseAmenities(raw) {
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

export function establishmentToProPayload(est, cuisineLabel = null) {
  const kind = est.type === 'lodging' ? 'hotel' : 'restaurant';

  const base = {
    kind,
    id: est.id,
    slug: est.slug || '',
    name: est.name || '',
    type: est.type,
    city: est.city || '',
    postalCode: est.postal_code || est.postalCode || '',
    address: est.address || '',
    phone: est.phone || '',
    website: est.website || '',
    email: est.email || '',
    coverImageUrl: est.cover_image_url || est.coverImageUrl || '',
    description: est.description || '',
    lat: typeof est.lat === 'number' ? est.lat : Number(est.lat) || 0,
    lng: typeof est.lng === 'number' ? est.lng : Number(est.lng) || 0,
    qrToken: est.qr_token || est.qrToken || null,
    restaurantDetail: null,
    lodgingDetail: null,
  };

  const rd = est.restaurantDetail || (est.get && est.get('restaurantDetail'));
  if (rd) {
    const distinction = rd.distinction || 'none';
    const priceRange = rd.price_range ?? rd.priceRange ?? null;
    base.restaurantDetail = {
      distinction,
      distinctionLabel: DISTINCTION_LABEL[distinction] || '',
      cuisineTypeId: rd.cuisine_type_id ?? rd.cuisineTypeId ?? null,
      cuisineLabel: cuisineLabel || '',
      priceRange,
      priceLabel: priceRange != null ? PRICE_LABEL[priceRange] || '' : '',
    };
  }

  const ld = est.lodgingDetail || (est.get && est.get('lodgingDetail'));
  if (ld) {
    const keysLevel = Number(ld.keys_level ?? ld.keysLevel) || 1;
    const lodgingType = ld.lodging_type || ld.lodgingType || 'hotel';
    base.lodgingDetail = {
      keysLevel,
      keysLabel: KEYS_LABEL[keysLevel] || '',
      lodgingType,
      lodgingTypeLabel: LODGING_TYPE_LABEL[lodgingType] || '',
      roomsCount: ld.rooms_count ?? ld.roomsCount ?? null,
      amenities: parseAmenities(ld.amenities),
    };
  }

  return base;
}

export function videoToPayload(v) {
  return {
    id: v.id,
    title: v.title,
    audience: v.audience,
    archetypeIds: parseAmenities(v.archetypeIds ?? v.archetype_ids),
    status: v.status,
    durationSec: v.durationSec ?? v.duration_sec ?? null,
    thumbUrl: v.thumbUrl ?? v.thumb_url ?? null,
    mediaUrl: v.mediaUrl ?? v.media_url ?? '',
    createdAt: v.createdAt ?? v.created_at,
    updatedAt: v.updatedAt ?? v.updated_at,
  };
}

export function storyToArticlePayload(s) {
  return {
    id: s.id,
    establishmentId: s.establishmentId ?? s.establishment_id,
    authorId: s.authorId ?? s.author_id,
    title: s.title,
    content: s.content,
    mediaUrl: s.mediaUrl ?? s.media_url ?? null,
    status: s.status,
    moderationScore: s.moderationScore ?? s.moderation_score ?? null,
    moderationNotes: s.moderationNotes ?? s.moderation_notes ?? null,
    publishedAt: s.publishedAt ?? s.published_at ?? null,
    createdAt: s.createdAt ?? s.created_at,
    updatedAt: s.updatedAt ?? s.updated_at,
  };
}

export function proQuestToPayload(q) {
  return {
    id: q.id,
    establishmentId: q.establishmentId ?? q.establishment_id,
    status: q.status,
    title: q.title,
    description: q.description ?? null,
    startsAt: q.startsAt ?? q.starts_at ?? null,
    endsAt: q.endsAt ?? q.ends_at ?? null,
    rewardPoints: q.rewardPoints ?? q.reward_points ?? 0,
    rewardVideoId: q.rewardVideoId ?? q.reward_video_id ?? null,
    goalCount: q.goalCount ?? q.goal_count ?? 0,
    doneCount: q.doneCount ?? q.done_count ?? 0,
    createdAt: q.createdAt ?? q.created_at,
    updatedAt: q.updatedAt ?? q.updated_at,
  };
}
