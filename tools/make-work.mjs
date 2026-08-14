#!/usr/bin/env node
/**
 * 短歌の連作から、縦書きの作品ページを作ります。
 *
 *   node tools/make-work.mjs <テキストファイル> [YYYYMMDD] [--zine "掲載誌名" --url "掲載誌のURL"]
 *
 * ページのファイル名は作成日（YYYYMMDD.html）です。日付を省くと今日の日付になります。
 *
 * 例：
 *   node tools/make-work.mjs ~/goniji.txt \
 *     --zine "東京文芸部ZINE vol.2（テーマ「滲」）" --url "https://booth.pm/ja/items/8322103"
 *
 * テキストファイルの書き方（文字コードは UTF-8 でも Shift-JIS でも構いません）:
 *
 *   1行目  連作のタイトル
 *   2行目  作者名
 *   3行目以降  一首につき一行（空行と ＊ だけの行は読み飛ばします）
 *
 * 出力先は apps/frontend/public/works/<YYYYMMDD>.html です。
 * 作ったあとは index.html の WORKS に read: 'works/<YYYYMMDD>.html' を足してください。
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

const [source, dateArg] = positional;
if (!source) {
  console.error('使い方: node tools/make-work.mjs <テキストファイル> [YYYYMMDD] [--zine 掲載誌名] [--url 掲載誌URL]');
  process.exit(1);
}

/* ファイル名は作成日。省略したら今日の日付を使います */
const today = new Date();
const slug = dateArg
  ?? [today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0')].join('');

if (!/^\d{8}$/.test(slug)) {
  console.error(`日付は YYYYMMDD の8桁で指定してください（受け取った値: ${slug}）`);
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

/* 縦書きの本文に出す首数は漢数字にします（例：26 → 二十六） */
function kansuji(n) {
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n < 10) return digits[n];
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${tens > 1 ? digits[tens] : ''}十${ones ? digits[ones] : ''}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return `${hundreds > 1 ? digits[hundreds] : ''}百${rest ? kansuji(rest) : ''}`;
}

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
  .replaceAll('{{COUNT_KANJI}}', kansuji(count))
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
