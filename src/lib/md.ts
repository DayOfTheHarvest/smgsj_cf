import { marked } from 'marked';

// Render staff-authored Markdown (Sveltia `markdown` widget output,
// per-locale file bodies) to HTML.
// GFM tables enabled (schedules). Staff can type raw HTML (the CMS offers a
// raw mode), and marked passes it through untouched — so the two payloads
// that could harm visitors are neutralized here:
//   - <script> tags (paired or stray) are removed entirely;
//   - javascript:/data:/vbscript: link targets become '#' (dead links).
// Everything else (divs, tables, images) passes through, so existing content
// never changes shape. No dependency: a tiny regex beats a sanitizer library
// that would need version-pinning and upkeep for a decade.
marked.setOptions({ gfm: true, breaks: false });

export function renderMd(src: string): string {
  if (!src || !src.trim()) return '';
  const html = marked.parse(src.trim(), { async: false }) as unknown as string;
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script\b[^>]*\/?>/gi, '')
    .replace(/href(\s*=\s*["'])\s*(javascript|data|vbscript):[^"']*/gi, 'href$1#');
}
