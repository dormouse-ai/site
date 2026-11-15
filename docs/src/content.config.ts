import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';

export const collections = {
  // Starlight warns on every build when this collection is absent. The site
  // translates nothing, so the one locale it has carries no overrides.
  i18n: defineCollection({
    loader: glob({ pattern: '**/ui.{json,js}', base: './src/content/i18n' }),
    schema: i18nSchema(),
  }),
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
