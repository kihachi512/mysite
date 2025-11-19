# Momonga Post Box Function

サーバーレス環境（AWS Lambda + API Gateway など）で動く投稿APIです。サイトの「日々のノート」から送信された内容を DynamoDB に保存し、誰でも読めるタイムラインとして返します。

## セットアップ
1. DynamoDB でテーブルを作成します。
   - **テーブル名**: 任意（例: `MomongaPosts`）
   - **パーティションキー**: `id` (String)
   - ソートキーは不要です。TTL も任意です。
2. この関数をデプロイする環境変数に次を設定します。
   - `MOMONGA_POSTS_TABLE`: 1 で作成したテーブル名
   - `AWS_REGION` (または `AWS_DEFAULT_REGION`): テーブルを配置したリージョン
3. 依存関係をインストールします。
   ```bash
   cd functions/post-box
   npm install
   ```
4. Lambda などにデプロイし、API Gateway (または Amplify Function URL) で HTTPS エンドポイントを公開します。

## エンドポイント仕様
- `GET /posts`
  - DynamoDB から最新順で投稿を取得し、`{ "items": [...] }` の形式で返します。
- `POST /posts`
  - JSON ボディ `{ "name": string, "message": string }`
  - バリデーションを通過したら DynamoDB に保存し、`201` と保存済みの `item` を返します。
- `OPTIONS /posts`
  - CORS プリフライト用。常に `200` を返します。

## ローカルテスト
AWS CLI プロファイルなどで DynamoDB へアクセスできる状態なら、以下で擬似的に実行できます。
```bash
node -e "import('./index.mjs').then(m => m.handler({ httpMethod: 'GET' })).then(console.log)"
```
POST の場合は `event.body` に JSON 文字列を渡してください。
