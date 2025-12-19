# Gemini API設定ガイド

モモンガくんとのAIチャット機能を使うには、Google Gemini APIキーの設定が必要です。

## APIキーの取得方法

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Googleアカウントでサインイン
3. 「Create API Key」をクリック
4. APIキーをコピー

## 設定方法

1. `apps/frontend/.env.local` ファイルを開く
2. 以下の行にAPIキーを設定：

```
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

3. ファイルを保存
4. アプリケーションを再起動

## 確認方法

1. モモンガくんとチャットしてみる
2. 定型文ではなく、自然な会話が返ってくればOK
3. ブラウザの開発者ツールのコンソールで「API Key status: Present」と表示されることを確認

## 注意事項

- APIキーは秘密情報です。他人と共有しないでください
- `.env.local` ファイルはGitにコミットされません
- APIには使用量制限があります（1日100リクエスト、1分間10リクエスト）

## トラブルシューティング

- **定型文しか返ってこない**: APIキーが設定されていないか、無効な可能性があります
- **エラーメッセージが出る**: APIキーの形式や有効性を確認してください
- **応答が遅い**: API制限に達している可能性があります。時間をおいてから試してください