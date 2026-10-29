import fs from 'fs';
import path from 'path';
import vm from 'vm';

const publicDir = path.join(process.cwd(), 'public');
const distDir = path.join(process.cwd(), 'dist');

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

if (!fs.existsSync(publicDir)) {
  console.log('Nothing to build: public directory is missing.');
  process.exit(0);
}

fs.cpSync(publicDir, distDir, { recursive: true });

/*
 * 作品集・ネットプリント・リンクの一覧は、index.html の中の <script> がデータから組み立てます。
 * ブラウザでは今まで通りそれで表示されますが、JavaScript を動かさない検索エンジンや
 * AI の検索ロボットには一覧が空に見えてしまうので、ビルドのときに同じ処理を一度だけ走らせて、
 * できあがった HTML を最初から書き込んでおきます（データの書き方は今まで通り）。
 * メールアドレスだけは収集ロボット対策のため書き込まず、ブラウザで表示するときに組み立てます。
 */
const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const pageScript = scripts.at(-1)?.[1];

if (pageScript) {
  const rendered = {};
  const element = (id) => ({
    set innerHTML(value) { rendered[id] = value; },
    set textContent(value) { rendered[id] = String(value); }
  });
  vm.runInNewContext(pageScript, { document: { getElementById: element } });

  if (rendered.linkList) {
    rendered.linkList = rendered.linkList.replace(/<li>(?:(?!<\/li>)[\s\S])*mailto:[\s\S]*?<\/li>/g, '');
  }

  const fill = (id, tag, attrs) => {
    if (rendered[id] === undefined) return;
    const open = `<${tag}${attrs} id="${id}">`;
    const empty = `${open}</${tag}>`;
    if (!html.includes(empty)) throw new Error(`index.html の ${empty} が見つかりません`);
    html = html.replace(empty, `${open}${rendered[id]}</${tag}>`);
  };
  fill('worksList', 'div', '');
  fill('npList', 'div', ' class="np-list"');
  fill('linkList', 'ul', ' class="links"');
  fill('year', 'span', '');

  fs.writeFileSync(indexPath, html);
  console.log('Built to dist/ (作品集・ネットプリント・リンクを HTML に書き込み済み).');
} else {
  console.log('Built to dist/.');
}
