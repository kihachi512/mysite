# さすらいのモモンガカーニバル

「さすらいのモモンガカーニバル」は、紙の雑誌のような 1 ページ構成の静的サイトと、旧来の React/Vite アプリのアーカイブで構成されて
います。現在公開しているトップページは `index.html`、`styles.css`、`scripts.js` の 3 ファイルで完結しており、Amplify ではそれらをそのまま配信しています。

## 現行トップページ
- `/index.html` … ヒーロー、カードグリッド、フッターだけの素朴な HTML。
- `/styles.css` … 和紙風テクスチャとカードレイアウトを再現したスタイルシート。
- `/scripts.js` … 「日々のノート」の投稿フォームと投稿一覧を司る JavaScript。

### 投稿フォームの挙動
1. `<article id="note" ... data-note-endpoint="/api/posts">` の `data-note-endpoint` 属性で共有ノート API の URL を指定します。
2. 省略時は `/api/posts` を指すので、Amplify Function や API Gateway の URL をそのパスで公開してください。
3. `scripts.js` は `GET` と `POST` を行い、結果をタイムラインに整形して描画します。
4. エラー時はユーザーにステータスを表示し、リトライできるようにしています。

## 共有ノート API
`functions/post-box` に S3 + Lambda を前提にした関数を用意しました。

```bash
cd functions/post-box
npm install
```

デプロイ時には以下を環境変数として設定してください。
- `MOMONGA_POSTS_BUCKET`: 投稿を保存する S3 バケット名
- `MOMONGA_POSTS_KEY` (任意): 保存に使うオブジェクトキー。省略時は `momonga-posts.json`
- `AWS_REGION` もしくは `AWS_DEFAULT_REGION`: バケットを配置したリージョン

API Gateway などで公開した URL を `data-note-endpoint` に指定すれば、訪問者が投稿した内容を誰でも閲覧できます。Lambda には S3 バ
ケットに対する `s3:GetObject` と `s3:PutObject` 権限を付けてください。

## Amplify での配信
`amplify.yml` は依存関係のインストールを行わず、静的ファイルを `dist/` にコピーするだけのビルドです。ビルドコマンドを増やしたい場
合は、`build:` セクションに任意の処理を追加してください。

## GitHub Actions（CI）
`.github/workflows/deploy.yml` は、`old/apps/frontend` と `apps/frontend` のどちらにも対応できるように自動検出ステップを持っています。また、どちらにも `package-lock.json` が無い場合は静的サイトとしてトップページの 3 ファイルだけを確認して終了します。
- `old/apps/frontend/package-lock.json` があればそちらを優先します。
- なければ従来どおり `apps/frontend` を使います。
- どちらにも `package-lock.json` が無い場合はエラーではなく静的配信モードで完了します。

これにより、旧来のパスを期待しているジョブと、新しい `old/` 以下にアーカイブした構成のどちらにも同じ workflow ファイルで対応できます。

## 旧 React/Vite アプリ
要望どおり、React 製の大規模アプリは `old/` 以下に丸ごと保管してあります。概要や各機能の説明は `old/README.md` に移設しました。

### フォルダ構成
```
old/
├── README.md                  # 旧アプリ全体のドキュメント
├── apps/frontend              # React + TypeScript + Vite の SPA
└── functions                  # 旧バックエンド（URL 短縮など）
```

旧アプリを再度立ち上げたい場合は、`old/apps/frontend` で `npm install && npm run dev` を実行してください。レガシーな npm スクリプト
や Cloudflare Workers などのバックエンドも `old/functions` 配下に残してあるため、当時の状態を再現できます。

## よくある質問
### Q. Amplify のビルドログで `apps/frontend` が見つからないと怒られました。
A. CI が自動で `old/apps/frontend` を検出するようになったため、追加のコピーや `cp` コマンドは不要です。ローカルで `apps/frontend`
を参照するスクリプトがある場合は、`old/apps/frontend` を指すよう更新するか、必要に応じて同期スクリプトを用意してください。

### Q. 投稿 API を簡単に試したいのですが？
A. `functions/post-box` は AWS SDK v3 で実装しています。Amplify Function や Lambda にデプロイした後、Function URL または API Gatew
ay のエンドポイントを `data-note-endpoint` に設定すれば、そのまま利用できます。ローカルで試す場合は `node -e "import('./functions/po
st-box/index.mjs').then(m => m.handler({ httpMethod: 'GET' })).then(console.log)"` のように実行できます。
