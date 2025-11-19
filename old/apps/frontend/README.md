# フロントエンド - さすらいのモモンガカーニバル

React + TypeScript + Vite で構築されたSPAアプリケーション

## 技術仕様

### 開発環境
- **React**: 18.3.1
- **TypeScript**: 5.6.2
- **Vite**: 5.4.2
- **React Router**: 6.26.1

### アーキテクチャ
```
src/
├── components/          # 再利用可能なコンポーネント
├── contexts/           # React Context（状態管理）
│   └── AppDataContext.tsx  # アプリ全体の状態
├── hooks/              # カスタムフック
│   └── useLocalStorage.ts  # localStorage操作
├── pages/              # ページコンポーネント
│   ├── BulletHell.tsx     # 弾幕ゲーム
│   ├── Favorites.tsx      # お気に入り管理
│   ├── GeneralSettings.tsx # 一般設定
│   ├── MOMOStore.tsx      # 売店
│   ├── OmikujiRoulette.tsx # 御神籤
│   ├── ShareSettings.tsx   # 共有設定
│   └── Tweets.tsx         # 投稿機能
├── App.tsx             # メインアプリ
├── App.css             # グローバルスタイル
└── main.tsx            # エントリーポイント
```

### 状態管理
- **Context API**: グローバル状態管理
- **localStorage**: データ永続化
- **カスタムフック**: `useLocalStorage`でlocalStorage操作を抽象化

### スタイリング
- **CSS Modules**: コンポーネント固有スタイル
- **テーマシステム**: ダークモード・モノトーン対応
- **レスポンシブ**: モバイルファースト設計

### データ構造
```typescript
// お気に入りアイテム
type FavoriteItem = {
  id: string
  name: string
  kind: 'text' | 'file'
  text?: string
  dataUrl?: string
  mime?: string
  createdAt: string
}

// 投稿
type Tweet = {
  id: string
  content: string
  createdAt: string
  likes: number
  likedBy: string[]
  expiresAt: string  // 24時間で自動削除
}

// アプリ設定
type AppSettings = {
  'dark-mode': boolean
  'sharing-feature': boolean
  'premium-theme': boolean
  'notification-sound': boolean
}
```

## 開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview

# リント
npm run lint
```

## 機能詳細

### テーマシステム
- **ダークモード**: `body.dark-mode`クラスで制御
- **モノトーン**: `body.premium-theme`クラスで完全白黒テーマ
- **永続化**: localStorage + アプリ起動時の自動適用

### ゲーム機能
- **弾幕ゲーム**: Canvas APIでリアルタイム描画
- **御神籤**: アニメーション付きルーレット
- **スコア管理**: ハイスコア保存・表示

### データ管理
- **自動バックアップ**: 重要データのlocalStorage保存
- **エクスポート**: JSON形式でデータ出力
- **インポート**: バックアップファイルからデータ復元