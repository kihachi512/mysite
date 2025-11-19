# さすらいのモモンガカーニバル

静的な HTML/CSS で構成した「さすらいのモモンガカーニバル」のトップページです。`index.html` と `styles.css` に紙面風のレイアウトをまとめ、`scripts.js` で投稿フォームと API をつないでいます。

## 投稿の仕組み
- 「日々のノート」カードの `data-note-endpoint` 属性で投稿 API の URL を指定します。デフォルトは `/api/posts` です。
- `functions/post-box` には DynamoDB を使ったサーバーレス関数の実装を用意しています。Amplify Function などにデプロイし、API Gateway の URL を `data-note-endpoint` に設定してください。

## デプロイ
Amplify のビルドは `amplify.yml` に定義しており、`index.html` / `styles.css` / `scripts.js` を `dist/` へコピーするだけのシンプルな流れになっています。
