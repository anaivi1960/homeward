// Loads WellaHealth partner pharmacies into Elasticsearch for /api/pharmacies/search and the
// assistant's find_partner_pharmacies tool.
// Run: node --env-file=.env scripts/index-pharmacies.mjs            (Enugu only)
//      node --env-file=.env scripts/index-pharmacies.mjs Lagos Abia  (named states)
//      node --env-file=.env scripts/index-pharmacies.mjs --all       (every state)
// Data comes from the public directory at https://www.wellahealth.com/pharmacy.
const { ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY } = process.env;
const INDEX = process.env.ELASTICSEARCH_INDEX ?? 'homeward-pharmacies';
if (!ELASTICSEARCH_URL || !ELASTICSEARCH_API_KEY) {
  console.error('Set ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY in .env first.');
  process.exit(1);
}

const ALL_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];
const args = process.argv.slice(2);
const states = args.includes('--all') ? ALL_STATES : args.length ? args : ['Enugu'];

const base = ELASTICSEARCH_URL.replace(/\/$/, '');
const elastic = (path, init = {}) =>
  fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `ApiKey ${ELASTICSEARCH_API_KEY}`, 'Content-Type': 'application/json', ...init.headers },
  });

// `state` and `lga` are exact-match filters; the `.text` copies let a free-text search hit them too.
const exact = { type: 'keyword', normalizer: 'lower', fields: { text: { type: 'text' } } };
const created = await elastic(`/${INDEX}`, {
  method: 'PUT',
  body: JSON.stringify({
    settings: { analysis: { normalizer: { lower: { type: 'custom', filter: ['lowercase'] } } } },
    mappings: {
      properties: {
        code: { type: 'keyword' },
        name: { type: 'text' },
        address: { type: 'text' },
        area: { type: 'text' },
        lga: exact,
        state: exact,
      },
    },
  }),
});
if (!created.ok && created.status !== 400) throw new Error(`Could not create the index: ${created.status} ${await created.text()}`);
console.log(created.ok ? `created index ${INDEX}` : `index ${INDEX} already exists`);

let total = 0;
for (const state of states) {
  const res = await fetch('https://www.wellahealth.com/api/pharmacies/state/lga', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stateOfPremise: state, lga: '', area: '' }),
  });
  if (!res.ok) {
    console.warn(`${state}: directory returned ${res.status}, skipped`);
    continue;
  }
  const pharmacies = await res.json();
  if (pharmacies.length === 0) {
    console.log(`${state}: none listed`);
    continue;
  }

  // Bulk body: an action line then the document, one pair per pharmacy. The code is the id,
  // so running this again updates rather than duplicates.
  const lines = pharmacies.flatMap((p) => [
    { index: { _index: INDEX, _id: p.pharmacyCode } },
    { code: p.pharmacyCode, name: p.name.trim(), address: p.address.trim(), lga: p.lga ?? '', state: p.stateOfPremise ?? state },
  ]);
  const bulk = await elastic('/_bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-ndjson' },
    body: `${lines.map((line) => JSON.stringify(line)).join('\n')}\n`,
  });
  const result = await bulk.json();
  if (!bulk.ok || result.errors) throw new Error(`${state}: bulk index failed: ${JSON.stringify(result).slice(0, 300)}`);
  total += pharmacies.length;
  console.log(`${state}: ${pharmacies.length}`);
}
console.log(`indexed ${total} pharmacies into ${INDEX}`);
