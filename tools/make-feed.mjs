#!/usr/bin/env node
/**
 * 作品ページから RSS フィード（feed.xml）を作ります。
 *
 *   node tools/make-feed.mjs
 *
 * 読者が更新を購読できるようになります。IFTTT などに読ませれば、
 * 更新したら自動でXに投稿する、といったこともできます。
 * tools/make-work.mjs は最後にこれを自動で呼びます。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worksDir = path.join(root, 'apps/frontend/public/works');
const SITE = 'https://momongacarnival.com';
const AUTHOR = '齊藤智都';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

/** 20260814 → RFC822 の日付 */
const pubDate = (slug) => new Date(
  `${slug.slice(0, 4)}-${slug.slice(4, 6)}-${slug.slice(6, 8)}T09:00:00+09:00`
).toUTCString();

const items = [];
if (fs.existsSync(worksDir)) {
  const pages = fs.readdirSync(worksDir)
    .filter((f) => /^\d{8}\.html$/.test(f))
    .sort()
    .reverse();

  for (const file of pages) {
    const slug = file.replace('.html', '');
    const html = fs.readFileSync(path.join(worksDir, file), 'utf8');
    const title = html.match(/<h1>([^<]*)<\/h1>/)?.[1] ?? slug;
    const poem = html.match(/<div class="poems">\s*<p[^>]*>([^<]*)<\/p>/)?.[1] ?? '';
    const count = (html.match(/<p id="p\d+"/g) ?? []).length;
    const zine = html.match(/<p class="colophon">(?:([^<]*)寄稿<br \/>)?/)?.[1] ?? '';

    const summary = [poem, count ? `全${count}首。` : '', zine ? `${zine} 寄稿。` : '']
      .filter(Boolean).join(' ');

    items.push(`    <item>
      <title>${esc(title)}</title>
      <link>${SITE}/works/${file}</link>
      <guid isPermaLink="true">${SITE}/works/${file}</guid>
      <pubDate>${pubDate(slug)}</pubDate>
      <description>${esc(summary)}</description>
    </item>`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${AUTHOR}｜歌人</title>
    <link>${SITE}/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${AUTHOR}の短歌の作品集です。連作を公開したらここに流れます。</description>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items.join('\n')}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(root, 'apps/frontend/public/feed.xml'), xml);
console.log(`feed.xml を更新しました（${items.length}件）`);
