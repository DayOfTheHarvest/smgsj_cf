import { z, defineCollection } from 'astro:content';

// Native Sveltia i18n: one file per slug per locale (<slug>.<locale>.md,
// multiple_files). Title/sections live in each locale file; missing or empty
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

// Reusable card (icon + heading + text + buttons), e.g. the contact page
// visit/contact cards. Same shape everywhere so cards work on any page.
const cardButton = z.object({
  label: z.string().nullish(),
  link: z.string().nullish(),
  style: z.string().nullish(),
});

const cardBlock = z.object({
  type: z.literal('card'),
  icon: z.string().nullish(),
  title: z.string().nullish(),
  text: z.string().nullish(),
  buttons: z.array(cardButton).optional().default([]),
  buttons_layout: z.string().nullish(),
});

const pageBlock = z.discriminatedUnion('type', [
  fundraiserBlock,
  embedBlock,
  buttonBlock,
  richtextBlock,
  imageBlock,
  cardBlock,
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
    // Sections are the whole page, top to bottom (title lives above them).
    // The old markdown body and top-level widgets were migrated into
    // sections, so every page renders the same way via PageBlocks.
    sections: z.array(pageSection).optional().default([]),
  }),
});

export const collections = { pages };
