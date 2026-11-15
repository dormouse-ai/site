import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { base, repo } from './base.mjs';

export default defineConfig({
  site: 'https://dormouse-ai.github.io',
  base,
  outDir: './dist',
  integrations: [
    starlight({
      title: 'dormouse',
      description:
        'An open language model you own: 95M parameters, ternary weights, one small file, no network, English and Russian.',
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dormouse-ai/site' }],
      customCss: ['./src/styles/theme.css'],
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      sidebar: [
        {
          label: 'Documentation',
          items: [
            { label: 'Overview', link: '/' },
            { slug: 'getting-started' },
            { slug: 'architecture' },
            { slug: 'formats' },
            { slug: 'measurement' },
            { slug: 'roadmap' },
          ],
        },
        {
          label: 'Elsewhere',
          items: [
            { label: 'The landing page', link: `/${repo}/` },
            { label: 'The plan', link: 'https://github.com/dormouse-ai/plan' },
          ],
        },
      ],
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#f6f3ec' } },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#0a0b0d', media: '(prefers-color-scheme: dark)' },
        },
      ],
    }),
  ],
});
