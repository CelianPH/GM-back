# Scraper Guide Michelin

Récupère les restaurants et hôtels recommandés par le Guide Michelin en France
via l'index Algolia public utilisé par guide.michelin.com, et les ingère dans
la base MySQL.

## Scraper

```bash
npm run scrape:all           # restaurants + hôtels (worldwide)
npm run scrape:restaurants   # restaurants seulement
npm run scrape:hotels        # hôtels seulement
```

Produit deux fichiers JSON dans `scripts/scraper/data/` :
- `restaurants-worldwide.json` (~19 000 entrées)
- `hotels-worldwide.json` (~8 800 entrées)

Le dossier `data/` est ignoré par git.

Pour restreindre à un pays :

```bash
COUNTRY_SLUG=fr npm run scrape:restaurants       # France, Italie: it, Japon: jp, USA: us...
HOTEL_COUNTRY_SLUG=france npm run scrape:hotels  # ⚠️ slug différent côté hôtels
```

⚠️ Les deux index Algolia n'utilisent pas le même slug pays (restaurants : code
ISO 2 lettres ; hôtels : nom complet anglais/slugifié).

## Seeder

Ingère les JSON scrapés vers `regions`, `cuisine_types`, `establishments`,
`restaurant_details`, `lodging_details`.

Choisit automatiquement `-worldwide.json` s'il existe, sinon `-fr.json`.

**⚠️ Autoritatif : fait un `TRUNCATE` des 5 tables avant le seed.** Le Guide
Michelin est la source unique pour ces données.

```bash
npm run db:migrate            # si les tables n'existent pas encore
npm run seed:establishments   # ingère les JSON en DB
```

### Hiérarchie régions

Les régions sont organisées en deux niveaux via `parent_region_id` :
- **racine** (pays) : `parent_region_id = NULL`, `slug = slugify(country.name)`
- **enfants** (régions) : `slug = {countrySlug}--{regionSlug}`

Exemple :
```
France            (parent_region_id = NULL,  slug = "france")
└── Île-de-France (parent_region_id = #France, slug = "france--ile-de-france")
```

Prérequis : variables d'environnement `DB_*` dans `.env` (cf. `src/db.js`).

## Données récupérées

Par établissement :
- identité (name, slug, type restaurant/lodging)
- localisation (region, city, postal_code, address, lat/lng)
- contact (phone, website)
- média (cover_image_url, description)
- restaurant : distinction Michelin, cuisines, chef, price_range
- hôtel : keys_level, lodging_type, rooms_count

## Pourquoi Algolia plutôt que du scraping HTML

Le frontend de guide.michelin.com interroge l'index Algolia
`prod-restaurants-fr` / `prod-hotels-fr` avec une clé de recherche publique.
L'utiliser directement évite de parser du HTML, respecte le même rate-limit que
le site, et donne accès à des champs structurés propres (géoloc, facets,
distinctions). ~15 secondes pour couvrir la France entière contre plusieurs
heures en HTML.
