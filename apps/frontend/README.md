# ほぼ日の朝 + 収益分配ラボ（静的版）

`apps/frontend/public/` にトップページと「収益分配ラボ」の静的ファイルをまとめました。依存パッケージなしでビルドでき、オフライン環境でも試せます。

## 使い方

1. `npm run build`（または `npm run build --prefix apps/frontend`）
2. `apps/frontend/dist/index.html` をブラウザで開くとトップページが表示されます
3. 「収益分配ラボ」は `apps/frontend/dist/revenue-lab/index.html` から直接アクセスできます

## PR 動作チェック

PR 作成前に `npm run build --prefix apps/frontend` を実行し、静的ビルドが dist/ に生成されることを確認してください。追加の依存関係は不要です。
