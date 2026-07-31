// Client-safe pricing engine. Kept in sync with server-side validation.
export const BASE_PRICE = 400;      // R400 total for up to 2 items
export const BASE_INCLUDED_ITEMS = 2;
export const EXTRA_ITEM_FEE = 30;   // R30 per item beyond 2

export type PriceBreakdown = {
  totalItems: number;
  extraItems: number;
  base: number;
  extras: number;
  total: number;
  deposit: number;
  balance: number;
};

export function calculatePrice(totalItems: number): PriceBreakdown {
  const items = Math.max(1, Math.floor(totalItems));
  const extraItems = Math.max(0, items - BASE_INCLUDED_ITEMS);
  const extras = extraItems * EXTRA_ITEM_FEE;
  const total = BASE_PRICE + extras;
  const deposit = Math.round((total / 2) * 100) / 100;
  const balance = Math.round((total - deposit) * 100) / 100;
  return { totalItems: items, extraItems, base: BASE_PRICE, extras, total, deposit, balance };
}

export function formatZAR(n: number): string {
  return `R${n.toFixed(2)}`;
}

// Returns YYYY-MM-DD for the next N Fridays from a given date (exclusive of today unless today is Friday and includeToday).
export function nextFridays(count = 8, from: Date = new Date()): string[] {
  const out: string[] = [];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  // Advance to next Friday (day 5)
  const dow = d.getDay();
  const daysUntilFriday = (5 - dow + 7) % 7 || 7; // if today is Friday, skip to next
  d.setDate(d.getDate() + daysUntilFriday);
  for (let i = 0; i < count; i++) {
    out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export function isFriday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 5;
}

export const CAMPUS_LABELS: Record<string, string> = {
  UMP: "University of Mpumalanga",
  TUT_NELSPRUIT: "TUT Nelspruit Campus",
};

export const ITEM_TYPES = ["Box", "Mini-Fridge", "Suitcase", "Other"] as const;
export type ItemTypeUI = (typeof ITEM_TYPES)[number];
