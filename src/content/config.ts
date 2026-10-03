import { z, defineCollection } from 'astro:content';

// Native Sveltia i18n: one file per slug per locale (<slug>.<locale>.md,
// multiple_files). Title/body live in each locale file; missing or empty
// non-English content falls back to English + banner at render time.
// slug_key is duplicated into every locale file (edited in English only).
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
    // Optional page widgets (added on demand, e.g. the fundraiser
    // thermometer). Absent rows render nothing.
    blocks: z
      .array(
        z.object({
          type: z.literal('fundraiser'),
          title: z.string().nullish(),
          goal: z.coerce.number().optional().default(0),
          pledged: z.coerce.number().optional().default(0),
          updated: z.string().nullish(),
          donate_link: z.string().nullish(),
          donate_label: z.string().nullish(),
        }),
      )
      .optional()
      .default([]),
  }),
});

export const collections = { pages };
