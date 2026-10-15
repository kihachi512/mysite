#!/usr/bin/env node
/**
 * 名刺（55×91mm 縦型・両面）のプレビュー画像と入稿用 PDF を作ります。
 *
 *   node print/namecard/make-namecard.mjs
 *
 * 出力先は print/namecard/out/ です。
 *   preview-front.png / preview-back.png  見た目の確認用（紙の色つき・仕上がりサイズ）
 *   raw-front.pdf     / raw-back.pdf      入稿用の元データ（A4・トンボ付き。白で刷る部分をマゼンタで描画）
 *   print-front.pdf   / print-back.pdf    入稿用（finish.py が raw-*.pdf から作る。文字をアウトライン化し、
 *                                         マゼンタを羽車の特色「デジタルホワイト」に置き換えたもの）
 *
 * 紙は羽車「ネームカード Colorsセレクト モスグリーン 308g」、印刷はデジタル印刷ホワイト（両面）を想定。
 * 入稿用は羽車のテンプレート（A4 にトンボ、仕上がり 91×55mm を縦に回転）に合わせています。
 *
 * 書体は Google Fonts から取得します（Zen Maru Gothic / Poppins。環境変数 FRONT, BACK に
 * mincho を指定すると、しっぽり明朝 / EB Garamond になります）。
 * QR コードは qr.svg（https://momongacarnival.com/ ）を使います。URL を変えたら作り直してください。
 * Playwright が必要です（tools/make-card.mjs と同じ）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out') + path.sep;

async function loadChromium() {
  try { return (await import('playwright')).chromium; } catch { /* リポジトリには入っていない */ }
  try {
    const globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim();
    const entry = path.join(globalRoot, 'playwright', 'index.mjs');
    if (fs.existsSync(entry)) return (await import(pathToFileURL(entry).href)).chromium;
  } catch { /* 全体にも入っていない */ }
  return null;
}
const chromium = await loadChromium();
if (!chromium) {
  console.error('Playwright が見つかりません。npm i -D playwright && npx playwright install chromium を一度だけ実行してください。');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const PAPER = process.env.PAPER || '#2e4738';   // モスグリーンの近似色（プレビュー用）
const INK = '#ffffff';
const BLEED = 3;                                  // 塗り足し mm（紙の端にかかる絵柄はないので、入稿用では使いません）
const A4 = { w: 210, h: 297 };
const W = 55, H = 91;                             // 縦型

const NAME = '齊藤智都';
const YOMI = 'さいとう ともひろ';
const ROLE = '歌人';
const URL_TEXT = 'momongacarnival.com';
const URL_FULL = 'https://momongacarnival.com/';
const X_HANDLE = '@kihachi512';
const MAIL = '57577.saito@gmail.com';
const POEM = '光あれ　すみませんもうお食事はラストオーダー過ぎてますので';

const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
async function faces(family, weights, text, alias) {
  const chars = [...new Set(text.replace(/\s/g, ''))].join('');
  const url = `https://fonts.googleapis.com/css?family=${family}:${weights}&text=${encodeURIComponent(chars)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': ua } })).text();
  let out = '';
  for (const block of css.split('@font-face').slice(1)) {
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
    const src = block.match(/url\((https:\/\/[^)]+)\)/)?.[1];
    if (!weight || !src) continue;
    const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': ua } })).arrayBuffer());
    out += `@font-face{font-family:'${alias}';font-weight:${weight};src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`;
  }
  return out;
}

// 書体：表はサイトと同じ丸ゴシック（Zen Maru Gothic + Poppins）、裏の歌は「しっぽり明朝」
const FRONT = process.env.FRONT || 'gothic';   // gothic | mincho
const BACK = process.env.BACK || 'gothic';      // gothic | mincho
const jp = FRONT === 'mincho'
  ? await faces('Shippori+Mincho', '500,600,700', NAME + YOMI + ROLE, 'JP')
  : await faces('Zen+Maru+Gothic', '500,700', NAME + YOMI + ROLE, 'JP');
const en = FRONT === 'mincho'
  ? await faces('EB+Garamond', '500,600', URL_TEXT + X_HANDLE + MAIL + 'HPXMail', 'EN')
  : await faces('Poppins', '400,500', URL_TEXT + X_HANDLE + MAIL + 'HPXMail0123456789', 'EN');
const jpBack = BACK === 'mincho'
  ? await faces('Shippori+Mincho', '600', NAME + POEM, 'JPB')
  : await faces('Zen+Maru+Gothic', '500', NAME + POEM, 'JPB');

// QR：白い角丸の窓の中に、紙の色でコードを置く（白インクは窓の部分だけ）
const qrSvg = fs.readFileSync(path.join(here, 'qr.svg'), 'utf8');
const qrPath = qrSvg.match(/<path stroke="#000000" d="([^"]+)"/)[1];
const qrN = Number(qrSvg.match(/viewBox="0 0 (\d+) /)[1]);

function page(body, { print, side }) {
  const paper = print ? '#ffffff' : PAPER;
  const ink = print ? '#ff00ff' : INK;             // 入稿用：白で刷る部分はマゼンタで描き、finish.py が特色に置き換える
  const pw = print ? A4.w : W + BLEED * 2, ph = print ? A4.h : H + BLEED * 2;
  const ox = print ? (A4.w - W) / 2 : BLEED, oy = print ? (A4.h - H) / 2 : BLEED;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${jp}${en}${jpBack}
@page{size:${pw}mm ${ph}mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${pw}mm;height:${ph}mm;background:${paper};overflow:hidden}
.card{position:absolute;left:${ox}mm;top:${oy}mm;width:${W}mm;height:${H}mm;color:${ink};
  font-family:'JP',"Zen Maru Gothic",sans-serif;font-weight:500}
.back .v{font-family:'JPB',serif;font-weight:${BACK === 'mincho' ? 600 : 500}}
.en{font-family:'EN',sans-serif;font-weight:${FRONT === 'mincho' ? 500 : 400}}
.abs{position:absolute}
.v{writing-mode:vertical-rl;line-height:1;white-space:nowrap}
.role{right:25mm;top:9.5mm;font-size:2.2mm;letter-spacing:.4em}
.name{right:8mm;top:9mm;font-size:7.2mm;font-weight:700;letter-spacing:.14em}
.name rt{font-size:2.5mm;font-weight:${FRONT === 'mincho' ? 600 : 500};letter-spacing:.18em;ruby-align:center;padding-left:.7mm}
.web,.x,.mail{left:6.5mm;font-size:2.3mm;letter-spacing:.03em}
.web{bottom:13.1mm}
.x{bottom:9.3mm}
.mail{bottom:5.5mm}
.lab{display:inline-block;width:6.5mm;font-size:1.9mm;letter-spacing:.12em}
.poem{left:50%;transform:translateX(-50%);top:8mm;height:75mm;font-size:2.5mm;letter-spacing:.03em}
.by{left:calc(50% - 8.5mm);transform:translateX(-50%);top:8mm;height:75mm;font-size:2.2mm;letter-spacing:.3em;display:flex;align-items:flex-start}
.by span{margin-top:auto}
.qr{left:6.5mm;bottom:19.5mm;width:19mm;height:19mm;background:${ink};border-radius:1mm;padding:2mm}
.qr svg{display:block;width:100%;height:100%}
</style></head><body>${print ? marks(ox, oy, side) : ''}<div class="card ${side}">${body.replaceAll('__PAPER__', paper).replaceAll('__INK__', ink)}</div></body></html>`;
}

/* 羽車のテンプレートと同じ形のトンボ（仕上がり線と 3mm 外側の二重線＋センターマーク）と、印刷方法の明記 */
function marks(ox, oy, side) {
  const L = 10, B = 3, sw = 0.1;
  const x0 = ox, x1 = ox + W, y0 = oy, y1 = oy + H;
  const line = (a, b, c, d) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`;
  let p = '';
  for (const [x, dx] of [[x0, -1], [x1, 1]]) for (const [y, dy] of [[y0, -1], [y1, 1]]) {
    p += line(x, y + dy * B, x, y + dy * (B + L)) + line(x + dx * B, y, x + dx * (B + L), y);          // 仕上がり線の延長
    p += line(x + dx * B, y + dy * B, x + dx * B, y + dy * (B + L)) + line(x + dx * B, y + dy * B, x + dx * (B + L), y + dy * B); // 3mm 外側
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  p += line(cx, y0 - B, cx, y0 - B - L) + line(cx - 5, y0 - B - 5, cx + 5, y0 - B - 5);
  p += line(cx, y1 + B, cx, y1 + B + L) + line(cx - 5, y1 + B + 5, cx + 5, y1 + B + 5);
  p += line(x0 - B, cy, x0 - B - L, cy) + line(x0 - B - 5, cy - 5, x0 - B - 5, cy + 5);
  p += line(x1 + B, cy, x1 + B + L, cy) + line(x1 + B + 5, cy - 5, x1 + B + 5, cy + 5);
  return `<svg style="position:absolute;left:0;top:0;width:${A4.w}mm;height:${A4.h}mm" viewBox="0 0 ${A4.w} ${A4.h}" fill="none" stroke="#000" stroke-width="${sw}">${p}</svg>
  <div style="position:absolute;left:${x0 - B - L}mm;top:${y0 - B - L - 13}mm;font:3mm/1.4 sans-serif;color:#000;white-space:nowrap">
    ネームカード（55×91mm・縦使い）${side === 'front' ? '表面' : '裏面'}<br>デジタル印刷ホワイト（両面）<br>特色「デジタルホワイト」（カラーチップ色）の部分を白で印刷。トンボ・注記は K
  </div>
  <div style="position:absolute;left:${x1 + B + L + 2}mm;top:${y0 - 2}mm;font:3mm/1 sans-serif;color:#000;border:0.2mm solid #000;padding:.6mm 1mm">天</div>`;
}

const front = `
  <div class="abs qr"><svg viewBox="0 0 ${qrN} ${qrN}" shape-rendering="crispEdges"><path stroke="__PAPER__" d="${qrPath}"/></svg></div>
  <div class="abs v role">${ROLE}</div>
  <div class="abs v name"><ruby>齊藤<rt>さいとう</rt>智都<rt>ともひろ</rt></ruby></div>
  <div class="abs web en"><span class="lab">HP</span>${URL_TEXT}</div>
  <div class="abs x en"><span class="lab">X</span>${X_HANDLE}</div>
  <div class="abs mail en"><span class="lab">Mail</span>${MAIL}</div>`;

const back = `
  <div class="abs v poem">${POEM}</div>
  <div class="abs v by"><span>${NAME}</span></div>`;

const browser = await chromium.launch();
for (const [side, body] of [['front', front], ['back', back]]) {
  for (const print of [false, true]) {
    const px = 96 / 25.4; // CSS px per mm
    const tab = await browser.newPage({ viewport: { width: Math.ceil((print ? A4.w : W + BLEED * 2) * px), height: Math.ceil((print ? A4.h : H + BLEED * 2) * px) }, deviceScaleFactor: 4 });
    await tab.setContent(page(body, { print, side }));
    await tab.evaluate(() => document.fonts.ready);
    await tab.waitForTimeout(200);
    if (!print) {
      // プレビュー：塗り足しを落とした仕上がりサイズで切り出す（約384dpi）
      await tab.screenshot({ path: `${OUT}preview-${side}.png`, clip: { x: BLEED * px, y: BLEED * px, width: W * px, height: H * px } });
    }
    await tab.pdf({ path: `${OUT}${print ? 'raw' : 'preview'}-${side}.pdf`, width: `${print ? A4.w : W + BLEED * 2}mm`, height: `${print ? A4.h : H + BLEED * 2}mm`, printBackground: true, preferCSSPageSize: true });
    await tab.close();
  }
}
await browser.close();
console.log(fs.readdirSync(OUT).join('\n'));
