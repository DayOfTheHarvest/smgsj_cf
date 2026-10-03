// Deep overlay: locale wins where present and non-empty (trimmed strings).
// Rows pair by stable key (id/name/slug) when present and unique, by position
// otherwise; rows whose `type` differs between locales never overlay each
// other (avoids mixing fields across block types); locale-only rows append,
// missing rows fall back to English.
import type { Lang } from '../config';

const KEY_FIELDS = ['id', 'name', 'slug'];

function sameType(a: any, b: any): boolean {
  return !a?.type || !b?.type || a.type === b.type;
}

function isEmpty(v: any): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
}

function listKey(items: any[]): string | null {
  const objs = items.filter((i) => i && typeof i === 'object');
  if (objs.length === 0) return null;
  const key = KEY_FIELDS.find(
    (f) => typeof objs[0][f] === 'string' && objs[0][f].trim() !== '',
  );
  if (!key) return null;
  const vals = objs.map((i) => i[key]);
  return new Set(vals).size === vals.length ? key : null;
}

export function localize<T>(enData: T, locData: any): T {
  if (Array.isArray(enData)) {
    const locArr = Array.isArray(locData) ? locData : [];
    const key = listKey(enData as any[]);
    const used = new Set<number>();
    const out: any[] = (enData as any[]).map((eRow) => {
      let lRow: any = undefined;
      let lIdx = -1;
      if (key && eRow && typeof eRow === 'object') {
        lIdx = locArr.findIndex(
          (l, idx) =>
            !used.has(idx) && l && typeof l === 'object' && l[key] === eRow[key],
        );
        if (lIdx >= 0) lRow = locArr[lIdx];
      } else {
        const idx = (enData as any[]).indexOf(eRow);
        if (idx < locArr.length && !used.has(idx)) {
          lRow = locArr[idx];
          lIdx = idx;
        }
      }
      if (lIdx >= 0 && sameType(eRow, lRow)) {
        used.add(lIdx);
        return localize(eRow, lRow);
      }
      return localize(eRow, undefined);
    });
    locArr.forEach((lRow, idx) => {
      if (!used.has(idx)) out.push(localize(undefined, lRow));
    });
    return out as unknown as T;
  }
  if (enData && typeof enData === 'object') {
    const locObj =
      locData && typeof locData === 'object' && !Array.isArray(locData) ? locData : {};
    const out: Record<string, any> = {};
    for (const k of Object.keys(enData)) out[k] = localize((enData as any)[k], locObj[k]);
    for (const k of Object.keys(locObj)) {
      if (!(k in out)) out[k] = localize(undefined, locObj[k]);
    }
    return out as T;
  }
  if (locData !== undefined && !isEmpty(locData)) return locData as T;
  return enData;
}

/** Pick the locale file's data, merged over English (English overlays itself). */
export function pickLocale<T>(files: Record<Lang, T>, lang: Lang): T {
  return localize(files.en, files[lang] ?? files.en);
}

/** Split an Astro content entry id like `mass-times.es.md` into base + locale.
 * NOTE: entry `.slug` is unusable here — Astro strips dots (`mass-times.en`
 * becomes `mass-timesen`). The `.id` (file path) keeps the locale suffix. */
export function splitEntryId(entryId: string): { base: string; locale: Lang | null } {
  const m = entryId.match(/^(.*)\.(en|es|vi)(\.md)?$/);
  if (m) return { base: m[1], locale: m[2] as Lang };
  return { base: entryId.replace(/\.md$/, ''), locale: null };
}

/** Group content entries by base slug: `{ slug, en, es?, vi? }` per topic. */
export function bundlePages<Entry extends { id: string }>(
  pages: Entry[],
): Map<string, { slug: string; en: Entry; es?: Entry; vi?: Entry }> {
  const map = new Map<string, { slug: string; en?: Entry; es?: Entry; vi?: Entry }>();
  for (const p of pages) {
    const { base, locale } = splitEntryId(p.id);
    let b = map.get(base);
    if (!b) {
      b = { slug: base };
      map.set(base, b);
    }
    b[locale ?? 'en'] = p;
  }
  for (const b of map.values()) {
    if (!b.en) b.en = b.es ?? b.vi;
  }
  return map as Map<string, { slug: string; en: Entry; es?: Entry; vi?: Entry }>;
}
