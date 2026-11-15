// Starlight prefixes every link it generates (sidebar, pagination, hero
// actions) with the site's base; the links written inside Markdown pages are
// left root-absolute, and under `/<repo>/docs` those point at the wrong place.
// Fixing them here rather than adding a second Markdown processor keeps the
// build to one dependency tree — and it catches any stray link, not just the
// ones this file knows about.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { base } from '../base.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const bare = base.slice(1); // 'site/docs'

async function pages(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await pages(full)));
    else if (extname(entry.name) === '.html') out.push(full);
  }
  return out;
}

let files = 0;
let links = 0;
for (const file of await pages(root)) {
  const html = await readFile(file, 'utf8');
  const next = html.replace(/href="\/(?!\/)([^"]*)"/g, (whole, path) => {
    if (path === bare || path.startsWith(`${bare}/`)) return whole;
    links += 1;
    return `href="${base}/${path}"`;
  });
  if (next !== html) {
    await writeFile(file, next);
    files += 1;
  }
}
console.log(`base: ${base} — rewrote ${links} internal link(s) in ${files} file(s)`);
