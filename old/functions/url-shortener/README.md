# URL短縮サービス

このCloudflare Workersベースの URL短縮サービスは、長い共有リンクを短縮するために作成されました。

## セットアップ

### 1. Cloudflare Workers KVの作成

```bash
# KVネームスペースを作成
wrangler kv:namespace create "URL_SHORTENER"
wrangler kv:namespace create "URL_SHORTENER" --preview
```

### 2. wrangler.tomlの更新

作成されたKVネームスペースのIDを `wrangler.toml` に設定してください：

```toml
[[kv_namespaces]]
binding = "URL_SHORTENER"
id = "your-actual-kv-namespace-id"
preview_id = "your-actual-preview-kv-namespace-id"
```

### 3. デプロイ

```bash
npm install
wrangler deploy
```

### 4. フロントエンドの設定更新

`DataExport.tsx` の以下の行を実際のWorkers URLに更新してください：

```typescript
const shortenerEndpoint = 'https://url-shortener.your-domain.workers.dev/shorten'
```

## API仕様

### POST /shorten
共有データを短縮URLに変換します。

**リクエスト:**
```json
{
  "data": "base64_encoded_data"
}
```

**レスポンス:**
```json
{
  "shortId": "abc123",
  "shortUrl": "https://url-shortener.your-domain.workers.dev/s/abc123"
}
```

### GET /s/{shortId}
短縮URLからフロントエンドにリダイレクトします。

### GET /expand/{shortId}
短縮URLからデータを取得します（JSON形式）。

**レスポンス:**
```json
{
  "data": "base64_encoded_data"
}
```

## 特徴

- 8文字のランダムな短縮ID生成
- 24時間の自動有効期限
- 重複チェック機能
- CORS対応
- フォールバック機能（URL短縮に失敗した場合は従来の長いURLを使用）

## セキュリティ

- データは24時間後に自動削除
- 短縮IDは推測困難なランダム文字列
- CORS設定により適切なオリジンからのアクセスのみ許可