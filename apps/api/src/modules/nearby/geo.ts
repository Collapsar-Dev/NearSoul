import { cellToLatLng, latLngToCell } from 'h3-js';

/** H3 resolution 9 ≈ 175 m edge (D29). Only the cell centre is ever stored. */
export const H3_RES = 9;

export function snap(lat: number, lng: number): { cell: string; lat: number; lng: number } {
  const cell = latLngToCell(lat, lng, H3_RES);
  const [clat, clng] = cellToLatLng(cell);
  return { cell, lat: clat, lng: clng };
}

export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export type Band = 'under_500m' | 'under_1km' | '1_3km' | '3_10km' | '10km_plus' | 'nearby';

/** GEO-004: the only distance anyone sees. */
export function bandFor(meters: number, hideDistance = false): Band {
  if (hideDistance) return 'nearby';
  if (meters < 500) return 'under_500m';
  if (meters < 1000) return 'under_1km';
  if (meters < 3000) return '1_3km';
  if (meters < 10000) return '3_10km';
  return '10km_plus';
}

export const BAND_LABEL: Record<Band, { en: string; ru: string }> = {
  under_500m: { en: 'Under 500 m', ru: 'До 500 м' },
  under_1km: { en: 'Under 1 km', ru: 'До 1 км' },
  '1_3km': { en: '1–3 km', ru: '1–3 км' },
  '3_10km': { en: '3–10 km', ru: '3–10 км' },
  '10km_plus': { en: '10+ km', ru: '10+ км' },
  nearby: { en: 'Nearby', ru: 'Рядом' },
};

export const RADIUS_OPTIONS_M = [500, 1000, 3000, 10000] as const;

/** Alpha simulator presets (ALPHA-003): Amsterdam neighbourhood centres. */
export const ALPHA_PRESETS: Record<string, { name: string; lat: number; lng: number }> = {
  centraal: { name: 'Centraal Station', lat: 52.3791, lng: 4.9003 },
  dam: { name: 'Dam Square', lat: 52.3731, lng: 4.8926 },
  jordaan: { name: 'Jordaan', lat: 52.3752, lng: 4.8818 },
  de_pijp: { name: 'De Pijp', lat: 52.3546, lng: 4.8936 },
  vondelpark: { name: 'Vondelpark', lat: 52.3579, lng: 4.8686 },
  oost: { name: 'Oosterpark', lat: 52.3601, lng: 4.9203 },
  noord: { name: 'NDSM (Noord)', lat: 52.4006, lng: 4.8939 },
  zuidas: { name: 'Zuidas', lat: 52.3389, lng: 4.8722 },
  uva: { name: 'University (Roeterseiland)', lat: 52.3634, lng: 4.9116 },
  museumplein: { name: 'Museumplein', lat: 52.3579, lng: 4.8818 },
};
