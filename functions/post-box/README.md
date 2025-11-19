# Momonga Post Box Function

サーバーレス環境（AWS Lambda + API Gateway など）で動く投稿APIです。サイトの「日々のノート」から送信された内容を S3 に保存し、誰でも読めるタイムラインとして返します。

## セットアップ
1. 投稿を格納する S3 バケットを用意します。
   - バージョニングを有効化しておくと、誤上書き時の復元が容易です。
2. この関数をデプロイする環境変数に次を設定します。
   - `MOMONGA_POSTS_BUCKET`: 保存先バケット名
   - `MOMONGA_POSTS_KEY` (任意): オブジェクトキー。省略時は `momonga-posts.json`
   - `AWS_REGION` (または `AWS_DEFAULT_REGION`): バケットを配置したリージョン
3. 依存関係をインストールします。
   ```bash
   cd functions/post-box
   npm install
   ```
4. Lambda などにデプロイし、API Gateway (または Amplify Function URL) で HTTPS エンドポイントを公開します。

## エンドポイント仕様
- `GET /posts`
  - S3 に保存された一覧を取得し、`{ "items": [...] }` の形式で返します。
- `POST /posts`
  - JSON ボディ `{ "name": string, "message": string }`
  - バリデーションを通過したら S3 に追記保存し、`201` と保存済みの `item` を返します。
- `OPTIONS /posts`
  - CORS プリフライト用。常に `200` を返します。

## ローカルテスト
AWS CLI プロファイルなどで S3 へアクセスできる状態なら、以下で擬似的に実行できます。
```bash
node -e "import('./index.mjs').then(m => m.handler({ httpMethod: 'GET' })).then(console.log)"
```
POST の場合は `event.body` に JSON 文字列を渡してください。
