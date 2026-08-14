#!/usr/bin/env node
/**
 * apps/frontend/public/ を見て sitemap.xml を作り直します。
 *
 *   node tools/make-sitemap.mjs
 *
 * 作品ページ（works/YYYYMMDD.html）は、ファイル名の日付を最終更新日にします。
 * トップページは実行日です。ページを増やしたあとに実行してください
 * （tools/make-work.mjs は最後にこれを自動で呼びます）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'apps/frontend/public');
const SITE = 'https://momongacarnival.com';

const today = new Date().toISOString().slice(0, 10);

/** works/20260814.html → 2026-08-14 */
function dateFromSlug(file) {
  const m = file.match(/^(\d{4})(\d{2})(\d{2})\.html$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : today;
}

const entries = [{ loc: `${SITE}/`, lastmod: today, priority: '1.0' }];

const worksDir = path.join(publicDir, 'works');
if (fs.existsSync(worksDir)) {
  const pages = fs.readdirSync(worksDir)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .reverse();
  for (const file of pages) {
    entries.push({
      loc: `${SITE}/works/${file}`,
      lastmod: dateFromSlug(file),
      priority: '0.8'
    });
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
console.log(`sitemap.xml を更新しました（${entries.length}ページ）`);
