# 齊藤智都｜歌人ホームページ

歌人・齊藤智都のホームページです。プロフィール、SNSリンク、過去の応募作の記録、
ネットプリントの配布アーカイブを置いています。短歌の本文そのものは掲載しません。

## 構成

サイトの実体は 1 枚の静的 HTML ファイルです。

```
apps/frontend/public/index.html   ← サイト本体（ここだけ編集すれば更新できます）
apps/frontend/build.js            ← public/ を dist/ にコピーするだけのビルド
index.html                        ← ルートからのリダイレクト
```

## 中身の更新のしかた

`apps/frontend/public/index.html` の末尾にあるデータ部分（`<script>` 内）を
書き換えるだけで、一覧の表示が変わります。

| 変数 | 内容 |
| --- | --- |
| `WORKS` | 応募作の記録（年・タイトル・賞や媒体・結果・補足・URL） |
| `NETPRINT` | ネットプリント（タイトル・発行時期・配布期間・配布中かどうか・予約番号・URL） |
| `LINKS` | SNS やメールへのリンク（サービス名・表示名・URL） |

`live: true` にしたネットプリントは「配布中」バッジが付き、
ページ上部の「配布中のみ表示」チェックで絞り込めます。

プロフィール本文と略歴（名前・作歌開始・所属など）は HTML の
`<section id="profile">` を直接書き換えてください。`◯◯` や「※」で
始まる文章は差し替え用のプレースホルダーです。

## ローカルで確認する

```bash
# ファイルを直接ブラウザで開くだけで確認できます
open apps/frontend/public/index.html

# ビルド（public/ を dist/ にコピー）
npm run build --prefix apps/frontend
```

## デプロイ

AWS Amplify で `amplify.yml` に従ってビルドし、`apps/frontend/dist` を公開します。

## 過去のサイトについて

以前この場所にあった「さすらいのモモンガカーニバル」のコードは `old/` に残しています。
