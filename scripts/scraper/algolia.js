// Client Algolia pour l'index public du Guide Michelin.
// La paire App ID / Search API Key est la même que celle utilisée par
// guide.michelin.com (clé publique read-only, rate-limitée par referer).

const APP_ID = '8NVHRD7ONV';
const API_KEY = '3222e669cf890dc73fa5f38241117ba5';
const BASE_URL = `https://${APP_ID}-dsn.algolia.net/1/indexes`;

const HEADERS = {
  'X-Algolia-Application-Id': APP_ID,
  'X-Algolia-API-Key': API_KEY,
  'Referer': 'https://guide.michelin.com/',
  'Origin': 'https://guide.michelin.com',
  'Content-Type': 'application/json',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queryIndex(indexName, body, { retries = 3 } = {}) {
  const url = `${BASE_URL}/${encodeURIComponent(indexName)}/query`;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        const backoff = 500 * Math.pow(2, attempt);
        console.warn(`  retry ${attempt + 1}/${retries} (${err.message}) — wait ${backoff}ms`);
        await sleep(backoff);
      }
    }
  }
  throw lastErr;
}

export async function fetchAllHits(indexName, { facetFilters = [], hitsPerPage = 100, throttleMs = 150, onPage } = {}) {
  const hits = [];
  let page = 0;
  let nbPages = 1;
  while (page < nbPages) {
    const body = { query: '', hitsPerPage, page, facetFilters };
    const res = await queryIndex(indexName, body);
    nbPages = res.nbPages;
    hits.push(...(res.hits || []));
    if (onPage) onPage({ page, nbPages, nbHits: res.nbHits, totalSoFar: hits.length });
    page += 1;
    if (page < nbPages) await sleep(throttleMs);
  }
  return hits;
}
