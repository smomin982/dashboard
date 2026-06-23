export type Bucket =
  | 'Government' | 'Academic' | 'Multilateral / NGO'
  | 'Other org email' | 'Personal' | 'Unknown';

// Display + bar order (also the color order in the UI).
export const BUCKET_ORDER: Bucket[] = [
  'Multilateral / NGO', 'Government', 'Academic', 'Other org email', 'Personal', 'Unknown',
];

// Edit these lists to tune classification against your real user domains.
const MULTILATERAL_NGO = new Set([
  'un.org','undp.org','worldbank.org','imf.org','who.int','oecd.org','unicef.org',
  'unesco.org','wfp.org','afdb.org','africa-union.org','gatesfoundation.org','rockefellerfoundation.org',
]);
const PERSONAL = new Set([
  'gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','proton.me','protonmail.com',
  'live.com','aol.com','gmx.com','yandex.com','mail.com',
]);

export function bucketForDomain(domain: string | null | undefined): Bucket {
  if (!domain) return 'Unknown';
  const d = domain.toLowerCase();
  if (MULTILATERAL_NGO.has(d)) return 'Multilateral / NGO';
  if (PERSONAL.has(d)) return 'Personal';
  if (/(^|\.)gov(\.[a-z]{2,})?$/.test(d) || /(^|\.)go\.[a-z]{2,}$/.test(d)) return 'Government';
  if (/(^|\.)edu(\.[a-z]{2,})?$/.test(d) || /(^|\.)ac\.[a-z]{2,}$/.test(d)) return 'Academic';
  return 'Other org email';
}
