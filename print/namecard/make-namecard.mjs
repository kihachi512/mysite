#!/usr/bin/env node
/**
 * 名刺（55×91mm 縦型・両面）のプレビュー画像と入稿用 PDF を作ります。
 *
 *   node print/namecard/make-namecard.mjs
 *
 * 出力先は print/namecard/out/ です。
 *   preview-front.png / preview-back.png  見た目の確認用（紙の色つき・仕上がりサイズ）
 *   print-front.pdf   / print-back.pdf    入稿用（塗り足し3mm込み。白で刷る部分を黒で表現）
 *
 * 紙は羽車「ネームカード Colorsセレクト モスグリーン 308g」、印刷はデジタル印刷ホワイト（両面）を想定。
 * 濃い紙に白1色で刷るので、入稿用 PDF では「白にしたい部分」を黒 100% で描いています。
 * 羽車の指定（ホワイトカラーチップへの置き換え・文字のアウトライン化）は Illustrator 側の作業です。
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
const BLEED = 3;                                  // 塗り足し mm
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
  const ink = print ? '#000000' : INK;
  const pw = W + BLEED * 2, ph = H + BLEED * 2;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${jp}${en}${jpBack}
@page{size:${pw}mm ${ph}mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${pw}mm;height:${ph}mm;background:${paper};overflow:hidden}
.card{position:absolute;left:${BLEED}mm;top:${BLEED}mm;width:${W}mm;height:${H}mm;color:${ink};
  font-family:'JP',"Zen Maru Gothic",sans-serif;font-weight:500}
.back .v{font-family:'JPB',serif;font-weight:${BACK === 'mincho' ? 600 : 500}}
.en{font-family:'EN',sans-serif;font-weight:${FRONT === 'mincho' ? 500 : 400}}
.abs{position:absolute}
.v{writing-mode:vertical-rl;line-height:1;white-space:nowrap}
.role{right:25mm;top:9.5mm;font-size:2.2mm;letter-spacing:.4em}
.name{right:8mm;top:9mm;font-size:7.2mm;font-weight:700;letter-spacing:.14em}
.name rt{font-size:2.5mm;font-weight:${FRONT === 'mincho' ? 600 : 500};letter-spacing:.18em;ruby-align:center;padding-left:.7mm}
.web{left:6.5mm;bottom:13.2mm;font-size:2.45mm;font-weight:500;letter-spacing:.03em}
.x{left:6.5mm;bottom:9.3mm;font-size:2.15mm;letter-spacing:.03em}
.mail{left:6.5mm;bottom:5.5mm;font-size:2.15mm;letter-spacing:.03em}
.lab{display:inline-block;width:6.5mm;font-size:.8em;letter-spacing:.12em}
.poem{left:50%;transform:translateX(-50%);top:8mm;height:75mm;font-size:2.5mm;letter-spacing:.03em}
.by{left:calc(50% - 8.5mm);transform:translateX(-50%);top:8mm;height:75mm;font-size:2.2mm;letter-spacing:.3em;display:flex;align-items:flex-start}
.by span{margin-top:auto}
.qr{left:6.5mm;bottom:19.5mm;width:19mm;height:19mm;background:${ink};border-radius:1mm;padding:2mm}
.qr svg{display:block;width:100%;height:100%}
</style></head><body><div class="card ${side}">${body.replaceAll('__PAPER__', paper).replaceAll('__INK__', ink)}</div></body></html>`;
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
    const tab = await browser.newPage({ viewport: { width: Math.ceil((W + BLEED * 2) * px), height: Math.ceil((H + BLEED * 2) * px) }, deviceScaleFactor: 4 });
    await tab.setContent(page(body, { print, side }));
    await tab.evaluate(() => document.fonts.ready);
    await tab.waitForTimeout(200);
    if (!print) {
      // プレビュー：塗り足しを落とした仕上がりサイズで切り出す（約384dpi）
      await tab.screenshot({ path: `${OUT}preview-${side}.png`, clip: { x: BLEED * px, y: BLEED * px, width: W * px, height: H * px } });
    }
    await tab.pdf({ path: `${OUT}${print ? 'print' : 'preview'}-${side}.pdf`, width: `${W + BLEED * 2}mm`, height: `${H + BLEED * 2}mm`, printBackground: true, preferCSSPageSize: true });
    await tab.close();
  }
}
await browser.close();
console.log(fs.readdirSync(OUT).join('\n'));
