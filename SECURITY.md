# セキュリティガイドライン

## 環境変数とAPIキーの管理

### ✅ やるべきこと

1. **APIキーは `.env.local` で管理**
   ```bash
   # /apps/frontend/.env.local
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

2. **テンプレートは `.env` で提供**
   ```bash
   # /apps/frontend/.env
   # VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **定期的なAPIキーローテーション**
   - 月1回程度でAPIキーを更新
   - 古いキーは即座に無効化

### ❌ やってはいけないこと

1. **実際のAPIキーを `.env` ファイルに記載**
2. **APIキーをソースコードに直接書く**
3. **APIキーを含むファイルをGitにコミット**

### 🔧 セットアップ手順

1. Google AI Studioで新しいAPIキーを取得
2. `.env.local` ファイルにAPIキーを設定
3. アプリケーションを再起動
4. チャットボット機能で動作確認

### 🚨 漏洩時の対応

1. **即座にAPIキーを無効化**
2. **新しいAPIキーを生成**
3. **`.env.local` を更新**
4. **Git履歴の確認とクリーンアップ（必要に応じて）**

### 📁 ファイル構成

```
apps/frontend/
├── .env                 # テンプレート（Gitで管理）
├── .env.local          # 実際のキー（Gitで管理しない）
├── .env.example        # 設定例（Gitで管理）
└── .gitignore          # .env.local を除外
```