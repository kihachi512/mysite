#!/usr/bin/env node
/**
 * 作品ページどうしに「前の作品 / 次の作品」のリンクを張り直します。
 *
 *   node tools/link-works.mjs
 *
 * works/ にある作品ページを日付順に並べ、各ページの
 * <!-- NAV:START --> と <!-- NAV:END --> のあいだを書き換えます。
 * 連作を足すたびに前後関係が変わるので、tools/make-work.mjs が自動で呼びます。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worksDir = path.join(root, 'apps/frontend/public/works');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

if (!fs.existsSync(worksDir)) {
  console.log('作品ページがまだありません。');
  process.exit(0);
}

/* 新しい順に並べます */
const pages = fs.readdirSync(worksDir)
  .filter((f) => /^\d{8}\.html$/.test(f))
  .sort()
  .reverse()
  .map((file) => {
    const html = fs.readFileSync(path.join(worksDir, file), 'utf8');
    return { file, html, title: html.match(/<h1>([^<]*)<\/h1>/)?.[1] ?? file };
  });

let updated = 0;

pages.forEach((page, i) => {
  const newer = pages[i - 1];
  const older = pages[i + 1];

  const links = [
    older ? `<a class="back" href="${older.file}">前の作品　${esc(older.title)}</a>` : '',
    newer ? `<a class="back" href="${newer.file}">次の作品　${esc(newer.title)}</a>` : ''
  ].filter(Boolean).join('\n      ');

  const block = links ? `\n      ${links}\n    ` : '';
  const next = page.html.replace(
    /<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/,
    `<!-- NAV:START -->${block}<!-- NAV:END -->`
  );

  if (next !== page.html) {
    fs.writeFileSync(path.join(worksDir, page.file), next);
    updated += 1;
  }
});

console.log(`前後リンクを張り直しました（${pages.length}ページ中 ${updated}ページを更新）`);
