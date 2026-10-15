#!/usr/bin/env node
/**
 * トップページのカード画像（SNSでURLを貼ったときに出る 1200×630 の画像）を作ります。
 *
 *   node tools/make-ogp.mjs
 *
 * index.html の代表歌（<p class="signature">）を読み取り、
 * apps/frontend/public/ogp.png を書き出します。代表歌を変えたら実行してください。
 *
 * 作品ページ用のカードは tools/make-card.mjs が担当です。
 * Playwright と、書体を取るためのネットワークが必要なのも同じです。
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'apps/frontend/public');

const index = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
const poem = index.match(/<p class="signature">([^<]*)/)?.[1]?.trim() ?? '';
if (!poem) {
  console.error('index.html から代表歌（<p class="signature">）を読み取れませんでした。');
  process.exit(1);
}

/** このリポジトリか、パソコン全体に入っている Playwright を探します */
async function loadChromium() {
  try {
    return (await import('playwright')).chromium;
  } catch { /* リポジトリには入っていない */ }
  try {
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    const entry = path.join(globalRoot, 'playwright', 'index.mjs');
    if (fs.existsSync(entry)) return (await import(pathToFileURL(entry).href)).chromium;
  } catch { /* 全体にも入っていない */ }
  return null;
}

const chromium = await loadChromium();
if (!chromium) {
  console.error('Playwright が見つかりません。次を一度だけ実行してください:');
  console.error('  npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

/** Google Fonts から、使う文字ぶんだけ書体を取ってきて埋め込みます */
async function fontFaces(text) {
  const chars = [...new Set(text.replace(/\s/g, ''))].join('');
  const url = `https://fonts.googleapis.com/css?family=Zen+Maru+Gothic:400,500,700&text=${encodeURIComponent(chars)}`;
  const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
  try {
    const css = await (await fetch(url, { headers: { 'User-Agent': ua } })).text();
    const faces = [];
    for (const block of css.split('@font-face').slice(1)) {
      const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
      const src = block.match(/url\((https:\/\/[^)]+)\)/)?.[1];
      if (!weight || !src) continue;
      const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': ua } })).arrayBuffer());
      faces.push(`@font-face{font-family:'Card';font-weight:${weight};src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`);
    }
    return faces.join('');
  } catch {
    console.warn('書体を取得できなかったので、手元の書体で描きます。');
    return '';
  }
}

const faces = await fontFaces(poem + '齊藤智都歌人');

/* 歌が長いときは字を縮めて一行に収めます（左右 96px の余白を除いた 1008px に収める） */
const poemSize = poem.length > 32 ? 25 : poem.length > 28 ? 27 : 29;

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
${faces}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#111110;color:#eeeee8;
 font-family:'Card',"Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif;
 display:flex;flex-direction:column;justify-content:center;padding:0 96px;position:relative;overflow:hidden}
.enso{position:absolute;top:90px;right:-80px;width:460px;height:460px;opacity:.1}
.name{font-size:100px;font-weight:700;letter-spacing:.06em;line-height:1.2}
.role{font-size:20px;font-weight:500;letter-spacing:.5em;color:#83837b;margin-top:18px}
.rule{width:84px;height:1px;background:rgba(238,238,232,.3);margin:44px 0 40px}
.poem{font-size:${poemSize}px;font-weight:500;letter-spacing:.06em;white-space:nowrap}
</style></head><body>
<svg class="enso" viewBox="0 0 200 200"><path d="M150 42a78 78 0 1 0 22 47" fill="none" stroke="#eeeee8" stroke-width="9" stroke-linecap="round"/></svg>
<div class="name">齊藤智都</div>
<div class="role">歌人</div>
<div class="rule"></div>
<div class="poem">${poem}</div>
</body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await tab.setContent(html);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const width = await tab.evaluate(() => document.querySelector('.poem').getBoundingClientRect().width);
if (width > 1008) console.warn(`代表歌が画像の幅に収まっていません（${Math.round(width)}px）。歌を短くするか、tools/make-ogp.mjs の poemSize を小さくしてください。`);
const out = path.join(publicDir, 'ogp.png');
await tab.screenshot({ path: out });
await browser.close();

console.log(`カード画像を作成しました: ${path.relative(root, out)}`);
