export type CatalogItem = { sku: string; name: string; priceUsd: number; prescription: boolean };

export type Merchant = {
  id: string;
  name: string;
  category: 'pharmacy';
  city: string;
  payeeEmail: string;
  verified: boolean;
  catalog: CatalogItem[];
};

// Demo pharmacies, each backed by a PayPal sandbox business account. Prices are illustrative.
const emails = (process.env.PAYPAL_SANDBOX_MERCHANT_EMAILS ?? '').split(',').map((e) => e.trim());

const common: CatalogItem[] = [
  { sku: 'paracetamol-500-24', name: 'Paracetamol 500mg, 24 tablets', priceUsd: 2.5, prescription: false },
  { sku: 'vitamin-c-1000-30', name: 'Vitamin C 1000mg, 30 tablets', priceUsd: 6.0, prescription: false },
  { sku: 'ors-10', name: 'Oral rehydration salts, 10 sachets', priceUsd: 3.2, prescription: false },
];

export const merchants: Merchant[] = [
  {
    id: 'ndidi-pharmacy',
    name: 'Ndidi Pharmacy',
    category: 'pharmacy',
    city: 'Enugu',
    payeeEmail: emails[0],
    verified: true,
    catalog: [
      { sku: 'amlodipine-10-30', name: 'Amlodipine 10mg, 30 tablets', priceUsd: 18.4, prescription: true },
      { sku: 'amlodipine-5-30', name: 'Amlodipine 5mg, 30 tablets', priceUsd: 12.9, prescription: true },
      { sku: 'metformin-500-60', name: 'Metformin 500mg, 60 tablets', priceUsd: 9.75, prescription: true },
      { sku: 'bp-monitor', name: 'Digital blood-pressure monitor', priceUsd: 32.0, prescription: false },
      ...common,
    ],
  },
  {
    id: 'adaeze-chemists',
    name: 'Adaeze Chemists',
    category: 'pharmacy',
    city: 'Lagos',
    payeeEmail: emails[1],
    verified: true,
    catalog: [
      { sku: 'amlodipine-10-30', name: 'Amlodipine 10mg, 30 tablets', priceUsd: 17.8, prescription: true },
      { sku: 'lisinopril-10-30', name: 'Lisinopril 10mg, 30 tablets', priceUsd: 14.2, prescription: true },
      { sku: 'glucose-strips-50', name: 'Blood glucose test strips, 50', priceUsd: 21.0, prescription: false },
      { sku: 'artemether-lumefantrine-24', name: 'Artemether-lumefantrine (malaria), 24 tablets', priceUsd: 7.6, prescription: false },
      ...common,
    ],
  },
  {
    id: 'unity-pharmacy',
    name: 'Unity Pharmacy',
    category: 'pharmacy',
    city: 'Abuja',
    payeeEmail: emails[2],
    verified: true,
    catalog: [
      { sku: 'metformin-500-60', name: 'Metformin 500mg, 60 tablets', priceUsd: 10.1, prescription: true },
      { sku: 'atorvastatin-20-30', name: 'Atorvastatin 20mg, 30 tablets', priceUsd: 16.5, prescription: true },
      { sku: 'salbutamol-inhaler', name: 'Salbutamol inhaler, 100mcg', priceUsd: 11.3, prescription: true },
      ...common,
    ],
  },
];

export const getMerchant = (id: string) => merchants.find((m) => m.id === id);

export function searchMerchants(query: { city?: string }) {
  return merchants.filter((m) => !query.city || m.city.toLowerCase() === query.city.toLowerCase());
}
