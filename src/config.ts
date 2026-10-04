// Central endpoints + site constants.
// Contact info and external links live in CMS-managed src/data/settings.json
// (editable at /admin: Site settings & navigation). Auth/form/media stay in
// code: swapping them changes site infrastructure, not content.
import settingsData from './data/settings.json';

const settings = settingsData as any;

export const SITE_URL = 'https://www.smgsj.org';
export const SITE_NAME: string = settings.site_name || 'St. Maria Goretti Parish';
export const SHRINE_ADDRESS: string = settings.shrine_address || '';
export const ADDRESS: string = settings.address;
export const PHONE: string = settings.phone;
export const EMAIL: string = settings.email;
export const EMERGENCY_EN_ES: string = settings.emergency_en_es;
export const EMERGENCY_VI: string = settings.emergency_vi;
export interface EmergencyRow {
  id: string;
  label_en: string;
  label_es: string;
  label_vi: string;
  number: string;
}
// Emergency numbers: flexible list (Sveltia: Site settings -> Emergency numbers).
// Labels carry EN/ES/VI together so numbers stay stored once; i18n false on list.
// Falls back to the two legacy strings if the new array is missing (rollback safety).
export const EMERGENCIES: EmergencyRow[] = Array.isArray((settings as any).emergencies)
  ? ((settings as any).emergencies as EmergencyRow[])
  : [
      {
        id: 'en-es',
        label_en: 'English / Español',
        label_es: 'English / Español',
        label_vi: 'English / Español',
        number: settings.emergency_en_es || '',
      },
      {
        id: 'vi',
        label_en: 'Tiếng Việt',
        label_es: 'Tiếng Việt',
        label_vi: 'Tiếng Việt',
        number: settings.emergency_vi || '',
      },
    ];

export function emergencyLabel(row: EmergencyRow, lang: Lang): string {
  if (lang === 'es') return row.label_es || row.label_en || row.number;
  if (lang === 'vi') return row.label_vi || row.label_en || row.number;
  return row.label_en || row.number;
}
export const FACILITY_EMAIL: string = settings.facility_email;

// Auth provider for /admin (Sveltia CMS).
// 'cloudflare-worker': GitHub login via the parish Cloudflare Worker
// (sveltia-cms-auth). 'none' disables the login check.
export type AuthProvider = 'cloudflare-worker' | 'none';
export const AUTH_PROVIDER: AuthProvider = 'cloudflare-worker';

// Contact form endpoint.
// The site has no web forms (contact page uses call/email cards), so there
// is no form backend. If a form is ever added, point this at its endpoint.
export type FormEndpoint = 'none' | string;
export const FORM_ENDPOINT: FormEndpoint = 'none';
export const FORM_NOTIFICATION_EMAIL = EMAIL;

// Media base. Day 1: local /uploads (checked into git) + hotlinked
// legacy uploads.weconnect.com PDFs. Future: R2/Cloudinary base URL.
export const MEDIA_BASE = '/uploads';
export const LEGACY_UPLOADS = 'https://uploads.weconnect.com/mce/fbbf192d8343f1afa97f7a91d44cac3057f6a46f';
export const LOGO: string = (settings as any).logo || '/uploads/logo.png';
export const BRAND_NAME: string = (settings as any).brand_name || 'St. Maria Goretti';
export const BRAND_TAGLINE: string = (settings as any).brand_tagline || '';
export const GIVING_STYLE: string = (settings as any).giving_style || 'gold';

export const LANGUAGES = ['en', 'es', 'vi'] as const;
export type Lang = (typeof LANGUAGES)[number];
export const DEFAULT_LANG: Lang = 'en';

export const EXTERNAL = {
  giving: settings.giving as string,
  payment: settings.payment as string,
  calendarSuggest: settings.calendar_suggest as string,
  calendarView: settings.calendar_view as string,
  calendar_embed: settings.calendar_embed as string,
  today_embed: settings.today_embed as string,
  flocknote: settings.flocknote as string,
  flocknote_signup: settings.flocknote_signup as string,
  youtube: settings.youtube as string,
  facebook: settings.facebook as string,
  ethicspoint: settings.ethicspoint as string,
  ethicspoint_phone: settings.ethicspoint_phone as string,
} as const;

// Single link resolver used by every template. @aliases always follow Site
// settings, so a changed Giving/Calendar/YouTube URL updates site-wide.
// Page paths (/slug/) gain the viewing language; files and full URLs pass through.
export function resolveLink(link: string, lang: Lang): string {
  const l = (link || '').trim();
  const aliases: Record<string, string> = {
    '@giving': EXTERNAL.giving,
    '@payment': EXTERNAL.payment,
    '@calendar-suggest': EXTERNAL.calendarSuggest,
    '@calendar-view': EXTERNAL.calendarView,
    '@flocknote': EXTERNAL.flocknote,
    '@facebook': EXTERNAL.facebook,
    '@youtube': EXTERNAL.youtube,
  };
  if (aliases[l]) return aliases[l];
  if (
    l.startsWith('/') &&
    !l.startsWith('/uploads/') &&
    !l.startsWith('/admin/') &&
    !/\.[a-z0-9]+$/i.test(l.split('?')[0])
  ) {
    return `/${lang}${l}`;
  }
  return l;
}
