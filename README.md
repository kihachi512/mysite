# さすらいのモモンガカーニバル（静的フロントエンド）

リポジトリのトップに配置した `index.html` は、ビルド済みの静的フロントエンド（`apps/frontend/dist/`）へ自動遷移します。主要な配置は次のとおりです。

- `apps/frontend/public/` : 公開用の静的ファイルのソース（トップページと「収益分配ラボ」）
- `apps/frontend/dist/` : `npm run build --prefix apps/frontend` でコピー生成される配布物
- `apps/frontend/build.js` : `public/` から `dist/` へ静的ファイルをコピーする簡易ビルドスクリプト

## 使い方

1. `npm run build --prefix apps/frontend`
2. 生成された `apps/frontend/dist/index.html` をブラウザで開く（ルートの `index.html` もこの dist 版にリダイレクトします）
3. 「収益分配ラボ」はトップページのリンク、または `apps/frontend/dist/revenue-lab/index.html` から直接アクセスできます

### 補足

Amplify 等でデプロイする場合は `apps/frontend/dist` を配信対象にしてください。トップページには「収益分配ラボ」への導線があり、公開サイトからそのまま利用できます。
