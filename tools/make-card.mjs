#!/usr/bin/env node
/**
 * 作品ページのカード画像（SNSでURLを貼ったときに出る 1200×630 の画像）を作ります。
 *
 *   node tools/make-card.mjs <YYYYMMDD>
 *
 * 作品ページからタイトルと一首目を読み取り、works/ogp-<YYYYMMDD>.png を書き出します。
 * tools/make-work.mjs は最後にこれを自動で呼びます。
 *
 * Playwright（ブラウザを動かす部品）が必要です。入っていない場合は
 *   npm i -D playwright && npx playwright install chromium
 * を一度だけ実行してください。書体は Google Fonts から取ってくるので、
 * 実行時にネットワークにつながっている必要があります（つながらない場合は
 * 手元の書体で描き、見た目が少し変わります）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worksDir = path.join(root, 'apps/frontend/public/works');

const slug = process.argv[2];
if (!slug || !/^\d{8}$/.test(slug)) {
  console.error('使い方: node tools/make-card.mjs <YYYYMMDD>');
  process.exit(1);
}

const pagePath = path.join(worksDir, `${slug}.html`);
if (!fs.existsSync(pagePath)) {
  console.error(`作品ページが見つかりません: ${path.relative(root, pagePath)}`);
  process.exit(1);
}

const page = fs.readFileSync(pagePath, 'utf8');
const title = page.match(/<h1>([^<]*)<\/h1>/)?.[1] ?? '';
const poem = page.match(/<div class="poems">\s*<p>([^<]*)<\/p>/)?.[1] ?? '';

if (!title) {
  console.error('作品ページからタイトルを読み取れませんでした。');
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
  console.error(`（画像なしで進める場合は、${slug}.html の og:image の行を削除してください）`);
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

const faces = await fontFaces(title + poem + '短歌連作齊藤智都');

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
${faces}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#fbfbfa;color:#14140f;
 font-family:'Card',"Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif;
 display:flex;flex-direction:column;justify-content:center;padding:0 96px;position:relative;overflow:hidden}
.enso{position:absolute;top:90px;right:-80px;width:460px;height:460px;opacity:.08}
.kicker{font-size:20px;font-weight:500;letter-spacing:.34em;color:#8a8a82;margin-bottom:28px}
.name{font-size:${title.length > 12 ? 56 : 76}px;font-weight:700;letter-spacing:.12em;margin-bottom:30px}
.rule{width:84px;height:1px;background:rgba(20,20,15,.3);margin-bottom:28px}
.poem{font-size:${poem.length > 30 ? 24 : 26}px;font-weight:500;letter-spacing:.05em;white-space:nowrap;margin-bottom:18px}
.by{font-size:22px;font-weight:500;letter-spacing:.2em;color:#4a4a44}
</style></head><body>
<svg class="enso" viewBox="0 0 200 200"><path d="M150 42a78 78 0 1 0 22 47" fill="none" stroke="#14140f" stroke-width="9" stroke-linecap="round"/></svg>
<div class="kicker">短歌連作</div>
<div class="name">${title}</div>
<div class="rule"></div>
${poem ? `<div class="poem">${poem}</div>` : ''}
<div class="by">齊藤智都</div>
</body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await tab.setContent(html);
await tab.evaluate(() => document.fonts.ready);
await tab.waitForTimeout(300);
const out = path.join(worksDir, `ogp-${slug}.png`);
await tab.screenshot({ path: out });
await browser.close();

console.log(`カード画像を作成しました: ${path.relative(root, out)}`);
