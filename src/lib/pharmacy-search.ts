import { wellaEnugu } from './wella-enugu';

// Search over the WellaHealth partner directory. Uses Elasticsearch when ELASTICSEARCH_URL and
// ELASTICSEARCH_API_KEY are set (fill the index with scripts/index-pharmacies.mjs); otherwise
// falls back to the Enugu list bundled with the app.
export type DirectoryPharmacy = { code: string; name: string; address: string; lga: string; state: string; area?: string };
export type DirectoryQuery = { q?: string; state?: string; lga?: string; limit?: number };

const INDEX = process.env.ELASTICSEARCH_INDEX ?? 'homeward-pharmacies';

export async function searchDirectory(query: DirectoryQuery) {
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);
  const { ELASTICSEARCH_URL: url, ELASTICSEARCH_API_KEY: key } = process.env;
  if (url && key) {
    try {
      return { source: 'elasticsearch' as const, ...(await searchElastic(url, key, query, limit)) };
    } catch (error) {
      console.warn('Elasticsearch search failed, using the bundled list:', error);
    }
  }
  return { source: 'bundled' as const, ...searchBundled(query, limit) };
}

async function searchElastic(url: string, key: string, query: DirectoryQuery, limit: number) {
  const filter = [
    query.state && { term: { state: query.state.toLowerCase() } },
    query.lga && { term: { lga: query.lga.toLowerCase() } },
  ].filter(Boolean);
  const must = query.q
    ? {
        // Typo-tolerant, and a match on the name counts for more than one in the address.
        multi_match: { query: query.q, fields: ['name^3', 'area^2', 'address^2', 'lga.text', 'state.text'], fuzziness: 'AUTO' },
      }
    : { match_all: {} };

  const res = await fetch(`${url.replace(/\/$/, '')}/${INDEX}/_search`, {
    method: 'POST',
    headers: { Authorization: `ApiKey ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ size: limit, track_total_hits: true, query: { bool: { must, filter } } }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Elasticsearch ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  return {
    total: body.hits.total.value as number,
    pharmacies: body.hits.hits.map((hit: { _source: DirectoryPharmacy }) => hit._source) as DirectoryPharmacy[],
  };
}

function searchBundled(query: DirectoryQuery, limit: number) {
  const words = (query.q ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const matches = wellaEnugu
    .map((p): DirectoryPharmacy => ({ ...p, state: 'Enugu' }))
    .filter((p) => !query.state || p.state.toLowerCase() === query.state.toLowerCase())
    .filter((p) => !query.lga || p.lga.toLowerCase() === query.lga.toLowerCase())
    .filter((p) => {
      const text = `${p.name} ${p.address} ${p.area} ${p.lga}`.toLowerCase();
      return words.every((word) => text.includes(word));
    });
  return { total: matches.length, pharmacies: matches.slice(0, limit) };
}
