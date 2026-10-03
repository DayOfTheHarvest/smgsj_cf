import { marked } from 'marked';

// Render staff-authored Markdown (Sveltia `markdown` widget output,
// per-locale file bodies) to HTML.
// GFM tables enabled (schedules); raw HTML disallowed in output.
marked.setOptions({ gfm: true, breaks: false });

export function renderMd(src: string): string {
  if (!src || !src.trim()) return '';
  return marked.parse(src.trim(), { async: false }) as unknown as string;
}
