import { z, defineCollection } from 'astro:content';

// Native Sveltia i18n: one file per slug per locale (<slug>.<locale>.md,
// multiple_files). Title/body live in each locale file; missing or empty
// non-English content falls back to English + banner at render time.
// slug_key is duplicated into every locale file (edited in English only).
const fundraiserBlock = z.object({
  type: z.literal('fundraiser'),
  title: z.string().nullish(),
  goal: z.coerce.number().optional().default(0),
  pledged: z.coerce.number().optional().default(0),
  updated: z.string().nullish(),
  donate_link: z.string().nullish(),
  donate_label: z.string().nullish(),
});

const embedBlock = z.object({
  type: z.literal('embed'),
  title: z.string().nullish(),
  url: z.string().nullish(),
  height: z.coerce.number().optional().default(1000),
  caption: z.string().nullish(),
});

const buttonBlock = z.object({
  type: z.literal('button'),
  label: z.string().nullish(),
  link: z.string().nullish(),
  style: z.string().nullish(),
});

const richtextBlock = z.object({
  type: z.literal('richtext'),
  body: z.string().nullish(),
});

const imageBlock = z.object({
  type: z.literal('image'),
  image: z.string().nullish(),
  alt: z.string().nullish(),
});

const pageBlock = z.discriminatedUnion('type', [
  fundraiserBlock,
  embedBlock,
  buttonBlock,
  richtextBlock,
  imageBlock,
]);

const contentSection = z.object({
  type: z.literal('content_section'),
  title: z.string().nullish(),
  body: z.string().nullish(),
  blocks: z.array(pageBlock).optional().default([]),
});

const fullwidthSection = z.object({
  type: z.literal('fullwidth_section'),
  title: z.string().nullish(),
  body: z.string().nullish(),
  blocks: z.array(pageBlock).optional().default([]),
});

const pageSection = z.discriminatedUnion('type', [contentSection, fullwidthSection]);

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    slug_key: z.string().optional().default(''),
    title: z.string().max(60).optional().default(''),
    updated: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
    // Fundraiser thermometer, configured on the page itself (Pages →
    // Fundraiser section). Numbers/links are shared across languages;
    // only the button label translates. Absent/zero goal renders nothing.
    // Optional page widgets (added on demand, e.g. fundraiser, embed,
    // button, richtext, image). Absent rows render nothing. Kept for
    // backward-compat with campaign pages; new layouts prefer sections.
    blocks: z.array(pageBlock).optional().default([]),
    // Flexible sections (each with its own widgets). Empty = body only.
    // Calendar page is recreated purely from sections (button + embeds).
    sections: z.array(pageSection).optional().default([]),
  }),
});

export const collections = { pages };
