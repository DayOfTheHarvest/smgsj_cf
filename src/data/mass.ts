// Full Mass source: old crawl mass-times.html (22 rows).
// Office sign-off confirmed: keep old 22-row table (plan Sec 3).
// Live /main EN-only subset is intentionally NOT used as source.

import type { Lang } from '../config';
import massesData from './masses.json';
import scheduleInfoEn from './schedule-info.en.json';
import scheduleInfoEs from './schedule-info.es.json';
import scheduleInfoVi from './schedule-info.vi.json';
import officeEn from './office.en.json';
import officeEs from './office.es.json';
import officeVi from './office.vi.json';

import locationsEn from './locations.en.json';
import locationsEs from './locations.es.json';
import locationsVi from './locations.vi.json';
import { localize } from '../lib/i18n';

// Location names per language (staff-managed in Sveltia: Mass schedule &
// presiders → Location names, one screen per language). `name` is the stable
// row key; missing translations fall back to English, then to the key itself
// (same guarantee the old `?? loc` fallback gave).
const locMerged = {
  en: locationsEn as any,
  es: localize(locationsEn, locationsEs) as any,
  vi: localize(locationsEn, locationsVi) as any,
};
const locText = (lang: Lang, name: string, fallback: string): string =>
  (locMerged[lang].locations as Array<{ name: string; text: string }>).find(
    (r) => r.name === name,
  )?.text ||
  fallback ||
  name;
const LOCALES: Record<string, Record<Lang, string>> = Object.fromEntries(
  (locMerged.en.locations as Array<{ name: string; text: string }>).map((l) => [
    l.name,
    { en: locText('en', l.name, ''), es: locText('es', l.name, l.text), vi: locText('vi', l.name, l.text) },
  ]),
);

export function locName(loc: string, lang: Lang): string {
  return LOCALES[loc]?.[lang] ?? loc;
}

// Day names per language, matching the parish's own Spanish/Vietnamese Mass
// pages. Applied at render time so the stored English times (used to match
// presiders) never change. Order matters: longest tokens first.
const DAY_TOKENS: Array<[string, string, string]> = [
  ['Mon-Fri', 'Lunes – Viernes', 'Thứ Hai – Thứ Sáu'],
  ['1st Friday', 'Primer Viernes', 'Thứ Sáu đầu tháng'],
  ['Monday', 'Lunes', 'Thứ Hai'],
  ['Tuesday', 'Martes', 'Thứ Ba'],
  ['Wednesday', 'Miércoles', 'Thứ Tư'],
  ['Thursday', 'Jueves', 'Thứ Năm'],
  ['Friday', 'Viernes', 'Thứ Sáu'],
  ['Saturday', 'Sábado', 'Thứ Bảy'],
  ['Sunday', 'Domingo', 'Chúa Nhật'],
];

export function dayName(time: string, lang: Lang): string {
  if (lang === 'en') return time;
  const col = lang === 'es' ? 1 : 2;
  let out = time;
  for (const [en, es, vi] of DAY_TOKENS) out = out.split(en).join(col === 1 ? es : vi);
  return out;
}

// Service (Mass type) labels per language. Fixed vocabulary like dayName.
export function serviceName(service: string, lang: Lang): string {
  const MAP: Record<string, Record<string, string>> = {
    Saturday: { en: 'Saturday', es: 'Sábado', vi: 'Thứ Bảy' },
    Sunday: { en: 'Sunday', es: 'Domingo', vi: 'Chúa Nhật' },
    Weekday: { en: 'Weekday', es: 'Entre semana', vi: 'Ngày thường' },
  };
  return MAP[service]?.[lang] ?? service;
}

export interface MassRow {
  service: string;
  /** Canonical day — Sveltia dropdown, never typed. Day/time are data keys. */
  day: string;
  /** Start time only, e.g. 4:00pm. Validated format, never typed freely. */
  time: string;
  /** Optional trailing marker, e.g. - Patio. Usually blank. */
  suffix?: string;
  lang: 'English' | 'Español' | 'Vietnamese' | 'Tagalog';
  location: string;
  /** Extra detail from the parish schedule graphic (e.g. Livestream). */
  note?: string;
}

/** Stable key shared with presiders.json — rebuilds the legacy time string. */
export function massKey(r: { day: string; time: string; suffix?: string }): string {
  return r.day + ' ' + r.time + (r.suffix ? ' ' + r.suffix : '');
}

// Schedule content lives in Sveltia-managed JSON so office staff (non-technical)
// can edit Mass times, locations, notes, confession and office hours at /admin.
// mass.ts keeps only the location translations (developer-owned).
export const MASS_ROWS: MassRow[] = (massesData as any).masses;
export const SCHEDULE_DISPLAY: { mode?: string; image?: string; link?: string } =
  (massesData as any).display ?? {};
// Confession + office hours keep their old shapes ({day[lang]}, Record<lang>)
// so all templates work untouched; values come from the per-locale files.
const schedMerged = {
  en: scheduleInfoEn as any,
  es: localize(scheduleInfoEn, scheduleInfoEs) as any,
  vi: localize(scheduleInfoEn, scheduleInfoVi) as any,
};
export const CONFESSION: { day: Record<string, string>; time: Record<string, string> } = {
  day: { en: schedMerged.en.confession.day, es: schedMerged.es.confession.day, vi: schedMerged.vi.confession.day },
  time: { en: schedMerged.en.confession.time, es: schedMerged.es.confession.time, vi: schedMerged.vi.confession.time },
};
const officeMerged = {
  en: (officeEn as any).text as string,
  es: (localize(officeEn, officeEs) as any).text as string,
  vi: (localize(officeEn, officeVi) as any).text as string,
};
export const OFFICE_HOURS: Record<string, string> = officeMerged;
