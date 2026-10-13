export type CatalogItem = { sku: string; name: string; priceUsd: number };

export type Merchant = {
  id: string;
  name: string;
  category: 'pharmacy' | 'school' | 'grocer';
  city: string;
  payeeEmail: string;
  verified: boolean;
  catalog: CatalogItem[];
};

// Demo merchants, each backed by a PayPal sandbox business account.
const emails = (process.env.PAYPAL_SANDBOX_MERCHANT_EMAILS ?? '').split(',').map((e) => e.trim());

export const merchants: Merchant[] = [
  {
    id: 'ndidi-pharmacy',
    name: 'Ndidi Pharmacy',
    category: 'pharmacy',
    city: 'Enugu',
    payeeEmail: emails[0],
    verified: true,
    catalog: [
      { sku: 'amlodipine-10-30', name: 'Amlodipine 10mg, 30 tablets', priceUsd: 18.4 },
      { sku: 'metformin-500-60', name: 'Metformin 500mg, 60 tablets', priceUsd: 9.75 },
      { sku: 'bp-monitor', name: 'Digital blood-pressure monitor', priceUsd: 32.0 },
    ],
  },
  {
    id: 'brightway-academy',
    name: 'Brightway Academy',
    category: 'school',
    city: 'Enugu',
    payeeEmail: emails[1],
    verified: true,
    catalog: [
      { sku: 'term-fees-jss', name: 'Term fees, junior secondary', priceUsd: 145.0 },
      { sku: 'uniform-set', name: 'School uniform set', priceUsd: 22.5 },
    ],
  },
  {
    id: 'mama-titi-provisions',
    name: 'Mama Titi Provisions',
    category: 'grocer',
    city: 'Lagos',
    payeeEmail: emails[2],
    verified: true,
    catalog: [
      { sku: 'rice-25kg', name: 'Rice, 25kg bag', priceUsd: 41.0 },
      { sku: 'monthly-basket', name: 'Monthly provisions basket', priceUsd: 68.0 },
    ],
  },
];

export const getMerchant = (id: string) => merchants.find((m) => m.id === id);

export function searchMerchants(query: { category?: string; city?: string }) {
  return merchants.filter(
    (m) =>
      (!query.category || m.category === query.category) &&
      (!query.city || m.city.toLowerCase() === query.city.toLowerCase()),
  );
}
