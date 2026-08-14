#!/usr/bin/env node
/**
 * 短歌の連作から、縦書きの作品ページを作ります。
 *
 *   node tools/make-work.mjs <テキストファイル> <出力名> [--zine "掲載誌名" --url "掲載誌のURL"]
 *
 * 例：
 *   node tools/make-work.mjs ~/goniji.txt goniji \
 *     --zine "東京文芸部ZINE vol.2（テーマ「滲」）" --url "https://booth.pm/ja/items/8322103"
 *
 * テキストファイルの書き方（文字コードは UTF-8 でも Shift-JIS でも構いません）:
 *
 *   1行目  連作のタイトル
 *   2行目  作者名
 *   3行目以降  一首につき一行（空行と ＊ だけの行は読み飛ばします）
 *
 * 出力先は apps/frontend/public/works/<出力名>.html です。
 * 作ったあとは index.html の WORKS に read: 'works/<出力名>.html' を足してください。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://momongacarnival.com';

const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) {
    flags[argv[i].slice(2)] = argv[i + 1] ?? '';
    i += 1;
  } else {
    positional.push(argv[i]);
  }
}

const [source, slug] = positional;
if (!source || !slug) {
  console.error('使い方: node tools/make-work.mjs <テキストファイル> <出力名> [--zine 掲載誌名] [--url 掲載誌URL]');
  process.exit(1);
}

/** UTF-8 として読めなければ Shift-JIS とみなします */
function readText(file) {
  const buf = fs.readFileSync(file);
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (!utf8.includes('�')) return utf8;
  return new TextDecoder('shift_jis').decode(buf);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

const lines = readText(source).split(/\r?\n/).map((l) => l.trim());
const title = lines[0];
const author = lines[1];
const body = lines.slice(2).filter((l) => l && l !== '＊');
const count = body.length;

if (!title || !author || count === 0) {
  console.error('テキストの形式が違うようです。1行目にタイトル、2行目に作者名、3行目以降に一首ずつ書いてください。');
  process.exit(1);
}

const zine = flags.zine ?? '';
const zineUrl = flags.url ?? '';

/* 縦書きだと横倒しになる記号を、立てたまま表示するための印を付けます */
const UPRIGHT = /[≒≠≦≧＝±×÷∞→←↑↓]/g;
const upright = (s) => s.replace(UPRIGHT, (c) => `<span class="upright">${c}</span>`);

const columns = body
  .map((l) => `      <p>${upright(esc(l))}</p>`)
  .join('\n');

const template = fs.readFileSync(path.join(root, 'tools', 'work-template.html'), 'utf8');

const html = template
  .replaceAll('{{TITLE}}', esc(title))
  .replaceAll('{{AUTHOR}}', esc(author))
  .replaceAll('{{SLUG}}', slug)
  .replaceAll('{{COUNT}}', String(count))
  .replaceAll('{{SITE}}', SITE)
  .replaceAll('{{COLUMNS}}', columns)
  .replaceAll('{{ZINE}}', esc(zine))
  .replaceAll('{{ZINE_SUFFIX}}', zine ? `${esc(zine)}寄稿<br />` : '')
  .replaceAll('{{ZINE_JSONLD}}', zine
    ? `,\n        "isPartOf": { "@type": "Book", "name": "${esc(zine)}"${zineUrl ? `, "url": "${esc(zineUrl)}"` : ''} }`
    : '')
  .replaceAll('{{ZINE_LINK}}', zineUrl
    ? `<a class="back" href="${esc(zineUrl)}" target="_blank" rel="noopener noreferrer">掲載誌を見る</a>`
    : '<span></span>');

const out = path.join(root, 'apps/frontend/public/works', `${slug}.html`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);

console.log(`作成しました: ${path.relative(root, out)}（${count}首）`);
console.log('次の3つを忘れずに:');
console.log(`  1. index.html の WORKS に read: 'works/${slug}.html' を足す`);
console.log(`  2. sitemap.xml に ${SITE}/works/${slug}.html を足す`);
console.log(`  3. カード画像 works/ogp-${slug}.png を用意する（無ければ og:image の行を消す）`);
