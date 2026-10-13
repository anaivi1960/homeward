// Enugu State pharmacies in WellaHealth's partner network, as listed in its public directory
// (https://www.wellahealth.com/pharmacy) on 13 Oct 2026. Name, address and code are WellaHealth's.
// `area` is our own reading of the address; pharmacies are placed by area, not geocoded by street.
export type WellaPharmacy = { code: string; name: string; address: string; lga: string; area: string };

// Where each area is, roughly its centre. The map enlarges the neighbourhoods of Enugu city
// (inCity) so they can be told apart; the other towns sit at their place in the state.
export const enuguAreas: Record<string, { lat: number; lon: number; inCity: boolean }> = {
  'Trans Ekulu': { lat: 6.478, lon: 7.498, inCity: true },
  Abakpa: { lat: 6.487, lon: 7.525, inCity: true },
  Emene: { lat: 6.47, lon: 7.575, inCity: true },
  GRA: { lat: 6.462, lon: 7.492, inCity: true },
  'Ogui & Asata': { lat: 6.447, lon: 7.503, inCity: true },
  'Independence Layout': { lat: 6.432, lon: 7.527, inCity: true },
  Uwani: { lat: 6.427, lon: 7.493, inCity: true },
  'Achara Layout': { lat: 6.413, lon: 7.498, inCity: true },
  'Agbani Road': { lat: 6.4, lon: 7.502, inCity: true },
  'Centenary City': { lat: 6.385, lon: 7.545, inCity: true },
  Nsukka: { lat: 6.857, lon: 7.396, inCity: false },
  // Nkpor is just over the border in Anambra State; this puts it on Enugu's western edge.
  Nkpor: { lat: 6.62, lon: 7.17, inCity: false },
};

// Roads drawn between neighbouring areas, so the plates read as one city.
export const enuguRoads: [string, string][] = [
  ['Trans Ekulu', 'Abakpa'],
  ['Trans Ekulu', 'GRA'],
  ['Abakpa', 'Emene'],
  ['Abakpa', 'Ogui & Asata'],
  ['GRA', 'Ogui & Asata'],
  ['Ogui & Asata', 'Independence Layout'],
  ['Independence Layout', 'Emene'],
  ['Ogui & Asata', 'Uwani'],
  ['Uwani', 'Achara Layout'],
  ['Achara Layout', 'Agbani Road'],
  ['Independence Layout', 'Agbani Road'],
  ['Agbani Road', 'Centenary City'],
];

export const wellaEnugu: WellaPharmacy[] = [
  { code: 'WHP10734', name: 'Wellgate Pharmacy', address: '2 Ukwulu Street, by Nike Lake Road, Trans Ekulu, Enugu', lga: 'Enugu East', area: 'Trans Ekulu' },
  { code: 'WHP11248', name: 'Vigoz Pharmacy', address: '2 Ugwueke Junction, Abakpa Nike Road, Abakpa, Enugu', lga: 'Enugu East', area: 'Abakpa' },
  { code: 'WHP13703', name: 'Paxs Pharmacy Enugu', address: 'Roban Stores, Nike Lake Road, Abakpa, Enugu', lga: 'Enugu East', area: 'Abakpa' },
  { code: 'WHP10072', name: 'Best Care Pharmacy and Stores', address: '43 Old Abakaliki Road, Emene, Enugu', lga: 'Enugu East', area: 'Emene' },
  { code: 'WHP11471', name: 'Global Spectra Pharmacy', address: '60 Old Abakaliki Road, Emene, Enugu', lga: 'Enugu East', area: 'Emene' },
  { code: 'WHP11472', name: 'Naiviv Pharmacy', address: '53 Railway Line, Old Abakaliki Road, Emene, Enugu', lga: 'Enugu East', area: 'Emene' },
  { code: 'WHP13388', name: 'Amaglondi Pharmacy Emene', address: '43 Rehab Road, Emene', lga: 'Enugu East', area: 'Emene' },
  { code: 'WHP12229', name: 'Drugs and Medicaments Pharmacy Enugu', address: '5 & 6 Penok Pocket Estate, Old Enugu/Abakaliki Road, Enugu', lga: 'Enugu North', area: 'Emene' },
  { code: 'WHP11641', name: 'Dovmed Pharmacy', address: '1 Nwodo Street, by Ekulu Avenue, GRA, Enugu', lga: 'Enugu North', area: 'GRA' },
  { code: 'WHP10490', name: 'Alpha Pharmacy Edinburgh Enugu', address: '32 Edinburgh College Road, Ogui New Layout, Enugu', lga: 'Enugu East', area: 'Ogui & Asata' },
  { code: 'WHP10400', name: 'Inland Medical Company', address: '14 Carr Street, Asata, Enugu', lga: 'Enugu North', area: 'Ogui & Asata' },
  { code: 'WHP13339', name: 'IJ Medix Pharmacy', address: 'Plot 120 Ogui Road, Asata, Enugu', lga: 'Enugu East', area: 'Ogui & Asata' },
  { code: 'WHP10775', name: 'Medplus (Enugu)', address: 'Enugu store, opposite Okpara Square', lga: 'Enugu North', area: 'Independence Layout' },
  { code: 'WHP11765', name: 'Nigus Pharmacy', address: 'Plot SS/4 Upper Presidential Road, opposite UBA, WAEC Junction, Independence Layout, Enugu', lga: 'Enugu North', area: 'Independence Layout' },
  { code: 'WHP12270', name: 'St Michael Pharmacy and Healthcare Service', address: '2J Nwagu Street, by MSP stop, Nkponkiti Road, Independence Layout, Enugu', lga: 'Enugu North', area: 'Independence Layout' },
  { code: 'WHP12960', name: 'Stancare Pharmacy and Stores', address: '40 Amawbia Street, Uwani, Enugu', lga: 'Enugu South', area: 'Uwani' },
  { code: 'WHP12577', name: 'Salvo Pharmacy', address: '27 Ufuma Street, Achara Layout', lga: 'Enugu South', area: 'Achara Layout' },
  { code: 'WHP11502', name: 'Alpha Pharmacy Agbani Enugu', address: '105 Agbani Road, inside Roban Stores, Enugu', lga: 'Enugu South', area: 'Agbani Road' },
  { code: 'WHP13230', name: 'Cova Care Pharmacy', address: 'One Day, Agbani Road, before Precious bus stop, Enugu', lga: 'Enugu North', area: 'Agbani Road' },
  { code: 'WHP12792', name: 'Amaglondi Pharmacy Plaza', address: 'CC Okens Plaza, Centenary City, Enugu', lga: 'Enugu South', area: 'Centenary City' },
  // Outside Enugu city.
  { code: 'WHP11858', name: 'Pharmacare Support', address: '69 Ogurugu Road, Nsukka', lga: 'Nsukka', area: 'Nsukka' },
  { code: 'WHP10594', name: 'Freedom Pharmacy', address: '9 Umudioka Lane, Nkpor', lga: 'Enugu East', area: 'Nkpor' },
];
