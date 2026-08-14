# 齊藤智都｜歌人ホームページ

歌人・齊藤智都のホームページです。プロフィール、SNSリンク、作品集、
ネットプリントの配布記録を置いています。

## 構成

ビルドは `public/` を `dist/` にコピーするだけです。

```
apps/frontend/public/index.html        ← トップページ
apps/frontend/public/works/*.html      ← 連作ごとの縦書きページ
apps/frontend/public/robots.txt        ← 検索エンジン向け
apps/frontend/public/sitemap.xml       ← 検索エンジン向け
apps/frontend/build.js                 ← public/ を dist/ にコピーするビルド
tools/make-work.mjs                    ← 縦書きページを作るツール
tools/work-template.html               ← そのひな形
tools/make-card.mjs                    ← カード画像を作るツール
tools/make-sitemap.mjs                 ← sitemap.xml を作り直すツール
index.html                             ← ルートからのリダイレクト
```

## 中身の更新のしかた

`apps/frontend/public/index.html` の末尾にあるデータ部分（`<script>` 内）を
書き換えるだけで、一覧の表示が変わります。

| 変数 | 内容 |
| --- | --- |
| `WORKS` | 作品集（年・タイトル・掲載媒体・結果・一覧に出す一首・補足・縦書きページ・掲載誌URL） |
| `WORKS_EMPTY` | 作品が 0 件のときに出る文章 |
| `NETPRINT` | ネットプリント（タイトル・発行時期・配布期間・配布中かどうか・予約番号・URL） |
| `NETPRINT_EMPTY` | ネプリが 0 件のときに出る文章 |
| `LINKS` | SNS へのリンク（サービス名・表示名・URL） |
| `MAIL` | メールアドレス（`user` と `domain` に分けて記述） |

`WORKS` と `NETPRINT` には、追加するときの雛形をコメントで残してあります。
コメントを外して値を書き換えれば、そのまま一覧に並びます。

`live: true` にしたネットプリントは「配布中」バッジが付き、
ページ上部の「配布中のみ表示」チェックで絞り込めます（0 件のあいだは非表示）。

メールアドレスはスパム対策のため、HTML のソースには完全な形で書かず、
`MAIL.user` と `MAIL.domain` を表示時に結合しています。アドレスを変えるときは
この 2 つを書き換えてください（`＠` を含む文字列をソースに直接書かないこと）。

トップの代表歌は `<p class="signature">` の一行です。どの画面幅でも一行に
収まるよう、幅から文字の大きさを計算しているので、歌を入れ替えるときは
そのまま書き換えるだけで大丈夫です（極端に長い歌にすると字が小さくなります）。

プロフィール本文と略歴は HTML の `<section id="profile">` を直接書き換えてください。

## ローカルで確認する

```bash
# ファイルを直接ブラウザで開くだけで確認できます
open apps/frontend/public/index.html

# ビルド（public/ を dist/ にコピー）
npm run build --prefix apps/frontend
```

## 作品ページ（縦書き）

連作は1作につき1ページ、縦書きで置いています（`apps/frontend/public/works/`）。
一首がかならず一行に収まるよう、画面の高さから文字の大きさを計算しています。

新しい連作を追加するときは、テキストファイルを用意してツールを走らせます。

```
1行目      連作のタイトル
2行目      作者名
3行目以降  一首につき一行（空行と ＊ だけの行は読み飛ばします）
```

```bash
node tools/make-work.mjs <テキストファイル> [YYYYMMDD] \
  --zine "掲載誌名" --url "掲載誌のURL"

# 例
node tools/make-work.mjs ~/goniji.txt \
  --zine "東京文芸部ZINE vol.2（テーマ「滲」）" --url "https://booth.pm/ja/items/8322103"
```

ページのファイル名は**作成日**です（`works/20260814.html` のような形）。
日付を省くと今日の日付になります。過去の作品を後から足すときは、
2つめの引数に `YYYYMMDD` を渡してください。

文字コードは UTF-8 でも Shift-JIS でも読み取れます。本文は原文のまま組みます。

このツールは、続けて次の2つも自動で行います。

- `sitemap.xml` の作り直し（`tools/make-sitemap.mjs`）
- カード画像の作成（`tools/make-card.mjs`）

最後に、一覧へ貼り付けるための `WORKS` の一項目が表示されます。それを
`apps/frontend/public/index.html` の `WORKS` の先頭に貼れば作業は終わりです。

ページの見た目を変えたいときは `tools/work-template.html` を直してから、
ツールを流し直してください。

### 個別に実行する

```bash
node tools/make-sitemap.mjs          # sitemap.xml を作り直す
node tools/make-card.mjs 20260814    # カード画像だけ作り直す
```

`make-card.mjs` は Playwright を使います。入っていない場合は一度だけ
`npm i -D playwright && npx playwright install chromium` を実行してください
（このリポジトリに入れても、パソコン全体に入れても動きます）。
書体は実行時に Google Fonts から取得します。ネットワークにつながらないときは
手元の書体で描くため、見た目が少し変わります。

## 検索エンジン向けの設定（SEO）

| ファイル・箇所 | 内容 |
| --- | --- |
| `apps/frontend/public/robots.txt` | クロールの許可とサイトマップの場所 |
| `apps/frontend/public/sitemap.xml` | ページ一覧（`tools/make-sitemap.mjs` が生成） |
| 各ページの `<title>` / `description` | ページごとに別の文章にする |
| `canonical` / `og:url` | 正しい公開URLを指しているか確認する |
| `application/ld+json` | 「歌人・齊藤智都のサイト」であることを構造化データで明示 |

作品ページ側の構造化データは、連作を `Poem`、掲載誌を `isPartOf` として記述しています。

## 画像・アイコン

| ファイル | 用途 |
| --- | --- |
| `apps/frontend/public/ogp.png` | SNS でURLを貼ったときに出るカード画像（1200×630） |
| `apps/frontend/public/favicon.svg` | ブラウザのタブに出るアイコン |
| `apps/frontend/public/favicon-32.png` | SVG に対応していないブラウザ用 |
| `apps/frontend/public/apple-touch-icon.png` | iPhone でホーム画面に追加したときのアイコン |
| `apps/frontend/public/works/ogp-*.png` | 作品ページごとのカード画像 |

代表歌を変えたら OGP 画像も作り直してください（画像内の文字は画像に焼き込まれています）。

## デプロイ

AWS Amplify で `amplify.yml` に従ってビルドし、`apps/frontend/dist` を公開します。

### 独自ドメインをつなぐ

1. Amplify コンソールでこのアプリを開き、左メニューの **Hosting → Custom domains**（カスタムドメイン）へ進む
2. **Add domain** を押し、取得済みのドメインを選ぶ
   - Route 53 で管理しているドメインなら一覧に出てきます。出てこない場合は手入力し、
     表示される CNAME レコードを、ドメインを管理している側の DNS に登録します
3. サブドメインの割り当てを決める（`www` を付ける／ルートドメインのみ、など）。
   ブランチは公開したいブランチ（通常は `main`）を選ぶ
4. 保存すると SSL 証明書が自動で発行されます。反映まで15分〜数時間かかることがあります
5. `apps/frontend/public/index.html` の先頭にある `og:url` / `og:image` / `canonical` の
   3か所が、公開するURLと一致しているか確認する（現在は `https://momongacarnival.com/`）

`www` 付きで公開する場合など、URLが変わったときは手順5の3か所も直してください。
ここが実際のURLと違うと、Xなどでリンクを貼ってもカード画像が表示されないことがあります。

## 過去のサイトについて

以前この場所にあった「さすらいのモモンガカーニバル」のコードは `old/` に残しています。
