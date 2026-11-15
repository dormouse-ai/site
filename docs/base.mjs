// One place decides where this site is served from. GitHub Pages serves a
// project site under `/<repo>/`, so the docs live at `/<repo>/docs`; an
// organisation's own `<org>.github.io` repository is served from the root, and
// then the docs are just `/docs`. Both the Astro config and the post-build
// rewrite read it from here, so the two can never disagree.
export const repo = (process.env.GITHUB_REPOSITORY || 'dormouse-ai/site').split('/')[1];
export const base = repo.endsWith('.github.io') ? '/docs' : `/${repo}/docs`;
