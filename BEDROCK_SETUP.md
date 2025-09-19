# Amazon Bedrock連携セットアップガイド

## 🚀 必要なパッケージのインストール

```bash
cd apps/frontend
npm install @aws-sdk/client-bedrock-runtime @aws-sdk/types
```

## ⚙️ 環境変数設定

`.env.local`ファイルを作成して以下を設定：

```bash
# AWS認証情報（本番環境では適切な認証方法を使用）
REACT_APP_AWS_ACCESS_KEY_ID=your_access_key_id
REACT_APP_AWS_SECRET_ACCESS_KEY=your_secret_access_key
REACT_APP_AWS_REGION=us-east-1

# Bedrockモデル設定
REACT_APP_BEDROCK_MODEL=anthropic.claude-3-haiku-20240307-v1:0
```

## 🔐 AWS IAM権限設定

Bedrockを使用するために必要なIAM権限：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
      ]
    }
  ]
}
```

## 🌍 利用可能なリージョン

Amazon Bedrockが利用可能な主要リージョン：
- `us-east-1` (バージニア北部)
- `us-west-2` (オレゴン)
- `eu-west-3` (パリ)
- `ap-southeast-1` (シンガポール)

## 💰 料金体系

### Claude 3 Haiku (推奨)
- **入力**: $0.25 / 1M tokens
- **出力**: $1.25 / 1M tokens
- **特徴**: 高速、低コスト、日本語対応

### Claude 3 Sonnet
- **入力**: $3.00 / 1M tokens  
- **出力**: $15.00 / 1M tokens
- **特徴**: 高品質、推論能力が高い

## 🔧 実装の特徴

### 1. **ハイブリッド応答システム**
- AI応答とルールベース応答の切り替え可能
- AI失敗時の自動フォールバック

### 2. **キャラクター一貫性**
- システムプロンプトでモモンガくんの性格を定義
- サイト情報を正確に伝達

### 3. **エラーハンドリング**
- 接続エラー時の適切な処理
- ユーザーフレンドリーなエラーメッセージ

## 🧪 テスト方法

1. **ルールモード**: 従来通りの応答をテスト
2. **AIモード**: Bedrock連携をテスト
3. **エラーハンドリング**: 無効な認証情報でテスト

## 📝 使用上の注意

### セキュリティ
- 本番環境では環境変数やAWS IAMロールを使用
- アクセスキーをコードに直書きしない

### コスト管理  
- Claude 3 Haikuの使用を推奨（コスト効率が良い）
- 長い会話ではトークン数に注意

### パフォーマンス
- AI応答は2-4秒程度の遅延あり
- フォールバック機能で可用性を確保

## 🚀 デプロイ時の考慮事項

### Cloudflare Workers / Vercel
- サーバーサイドでBedrock APIを呼び出す
- CORS問題を回避

### AWS Lambda
- 同一AWS環境でのシームレスな統合
- IAMロールベースの認証