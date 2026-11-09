import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const built = process.argv[2] === '--built';
const base = built ? null : process.argv[2];
if (!built && !base) throw new Error('Pass a deployed URL, or --built to check production HTML.');
let html;
if (built) html = await readFile('.next/server/app/index.html','utf8');
else { const page = await fetch(base); assert.equal(page.status,200); html = await page.text(); }
for (const id of ['home','about','courses','benefits','reviews','faq','contact']) assert.ok(html.includes(`id="${id}"`), id);
assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
assert.ok(html.includes('lang="vi"'));
assert.ok(html.includes('noindex, nofollow'));
assert.ok(html.includes('property="og:title"'));
assert.ok(html.includes('id="demo-notice"'));
assert.ok(!/<(?:input|select)[^>]*\sname=/.test(html), 'Demo fields must not enter native requests');
assert.match(html, /<button[^>]*type="submit"[^>]*disabled=/, 'Demo submit must be disabled before hydration');
if (!built) {
for (const path of ['/hero-reference.webp','/icon.svg','/robots.txt']) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  if (path === '/robots.txt') assert.match(await response.text(), /Disallow: \//);
}
assert.equal((await fetch(new URL('/missing-page-check',base))).status,404);
}
console.log(built ? 'PASS: production HTML, 7 sections, SEO metadata, demo fields excluded from native requests, submit disabled before hydration.' : 'PASS: HTTP 200, 7 sections, one H1, vi language, preview noindex, Open Graph, demo notice, image/icon/robots, 404.');
