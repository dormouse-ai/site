import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { base, repo } from './base.mjs';

// The one absolute address this config needs: Starlight resolves a sidebar
// `link` against the docs base unless it carries a protocol, so the way back to
// the landing page has to be a full URL.
const site = 'https://dormouse-ai.github.io';
const home = site + (repo.endsWith('.github.io') ? '/' : `/${repo}/`);

export default defineConfig({
  site,
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
            { label: 'The landing page', link: home },
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
