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

import locationsData from './locations.json';
import massLangsData from './mass-languages.json';
import { localize } from '../lib/i18n';

// Mass locations: single-file entry collection (Sveltia: Mass Locations).
// Each object holds all locales; the duplicate `key` is stored inside every
// locale object ({key, en:{key,name}, es:{...}, vi:{...}}), with the root copy
// kept for back-compat. Missing translations fall back to English, then key.
type LocName = { key?: string; name?: string };
type LocEntry = { key?: string; name?: string; en?: LocName; es?: LocName; vi?: LocName };
const entryKey = (e: LocEntry): string =>
  e.en?.key || e.es?.key || e.vi?.key || e.key || e.name || '';
const LOCALES: Record<string, Record<Lang, string>> = Object.fromEntries(
  (locationsData as unknown as LocEntry[]).map((e) => {
    const key = entryKey(e);
    const enName = e.en?.name || e.name || key;
    const esName = e.es?.name || enName;
    const viName = e.vi?.name || enName;
    return [key, { en: enName, es: esName, vi: viName }];
  }),
);

export function locName(loc: string, lang: Lang): string {
  return LOCALES[loc]?.[lang] ?? loc;
}

// Mass languages: single-file entry collection (Sveltia: Mass languages).
// Codes are Relation values (english|spanish|vietnamese|tagalog); autonyms
// name each language in itself so chips need no translation.
type LangEntry = { code: string; autonym: string; chip?: string; color?: string; text_color?: string };
export const MASS_LANGS: LangEntry[] = massLangsData as unknown as LangEntry[];
const LANG_BY_CODE: Record<string, LangEntry> = Object.fromEntries(
  MASS_LANGS.map((l) => [l.code, l]),
);
// Back-compat: old display values (English|Español|Vietnamese|Tagalog) map to codes.
const OLD_LANG_TO_CODE: Record<string, string> = {
  English: 'english',
  'Español': 'spanish',
  Vietnamese: 'vietnamese',
  Tagalog: 'tagalog',
};

export function langCode(raw: string): string {
  return LANG_BY_CODE[raw] ? raw : (OLD_LANG_TO_CODE[raw] || raw);
}

export function langAutonym(code: string): string {
  const c = langCode(code);
  return LANG_BY_CODE[c]?.autonym || code;
}

export function langChip(code: string): string {
  const c = langCode(code);
  const suffix = LANG_BY_CODE[c]?.chip || c;
  return `chip chip-${suffix}`;
}

// Chip colors are staff-configurable Color fields; when set they render as
// inline styles, otherwise the legacy chip class above applies (back-compat).
export function langStyle(code: string): string | undefined {
  const entry = LANG_BY_CODE[langCode(code)];
  const bg = entry?.color?.trim();
  if (!bg) return undefined;
  const fg = entry?.text_color?.trim();
  return fg ? `background-color:${bg};color:${fg}` : `background-color:${bg}`;
}

/** Site locale -> default Mass filter code (compact homepage block). */
export function defaultLangFilter(siteLang: Lang): string {
  return siteLang === 'es' ? 'spanish' : siteLang === 'vi' ? 'vietnamese' : 'english';
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
  /** Mass language code (Relation -> mass_languages.code, e.g. english). */
  lang: string;
  /** Location key (Relation -> locations.key, e.g. church). */
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
