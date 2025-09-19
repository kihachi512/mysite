# セキュリティ対策ガイド

さすらいのモモンガカーニバルでは、ユーザーの安全なWeb体験を提供するため、包括的なセキュリティ対策を実装しています。

## 🛡️ 実装済みセキュリティ対策

### 1. Content Security Policy (CSP)
- **XSS攻撃の防止**: 不正なスクリプトの実行をブロック
- **リソースの制限**: 信頼できるソースからのみリソースを読み込み
- **インライン実行の制限**: 必要最小限のインライン実行のみ許可

### 2. セキュリティヘッダー
```html
<!-- XSS Protection -->
<meta http-equiv="X-XSS-Protection" content="1; mode=block" />

<!-- Content Type Protection -->
<meta http-equiv="X-Content-Type-Options" content="nosniff" />

<!-- Frame Protection -->
<meta http-equiv="X-Frame-Options" content="DENY" />

<!-- Referrer Policy -->
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

<!-- Permissions Policy -->
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), interest-cohort=()" />
```

### 3. 入力データサニタイゼーション

#### HTMLエスケープ処理
```typescript
// 危険な文字をエスケープ
export const escapeHtml = (text: string): string => {
  return text.replace(/[&<>"'`=\/]/g, (match) => HTML_ESCAPE_MAP[match])
}
```

#### 悪意のあるスクリプト検出
```typescript
// XSS攻撃パターンの検出
export const detectMaliciousScript = (input: string): boolean => {
  const maliciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // イベントハンドラ
    /eval\s*\(/i
  ]
  return maliciousPatterns.some(pattern => pattern.test(input))
}
```

### 4. 安全なlocalStorage操作

#### データ検証付き読み込み
```typescript
export const safeGetLocalStorage = (key: string): unknown => {
  try {
    const item = localStorage.getItem(key)
    if (item === null) return null
    
    const parsed = JSON.parse(item)
    return sanitizeJsonData(parsed) // データをサニタイズ
  } catch (error) {
    console.error(`Failed to read from localStorage: ${error}`)
    return null
  }
}
```

#### 制限付き書き込み
```typescript
export const safeSetLocalStorage = (key: string, value: unknown): boolean => {
  try {
    const sanitizedValue = sanitizeJsonData(value)
    const serialized = JSON.stringify(sanitizedValue)
    
    // 5MB制限
    if (serialized.length > 5 * 1024 * 1024) {
      console.error('Data too large for localStorage')
      return false
    }
    
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    console.error(`Failed to write to localStorage: ${error}`)
    return false
  }
}
```

### 5. ファイルアップロードセキュリティ

#### ファイルタイプ検証
```typescript
const allowedTypes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg',
  'text/plain', 'application/json', 'application/pdf'
]

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  // MIMEタイプと拡張子の両方を検証
  return allowedTypes.includes(file.type) && validateExtension(file.name)
}
```

#### ファイルサイズ制限
```typescript
// 10MB制限
const maxSize = 10 * 1024 * 1024
export const validateFileSize = (file: File, maxSizeInBytes: number): boolean => {
  return file && file.size <= maxSizeInBytes
}
```

### 6. 入力値制限・検証

#### 文字数制限
- **チャットメッセージ**: 500文字以内
- **ファイル名**: 100文字以内
- **テキスト保存**: 10,000文字以内
- **つぶやき**: 500文字以内

#### データ量制限
- **お気に入りアイテム**: 100個まで
- **つぶやき**: 1,000個まで
- **ハイスコア**: 10個まで
- **MOMOPay**: 10,000,000まで

### 7. セキュアなマークダウンパーサー

```typescript
export const parseSafeMarkdown = (text: string): string => {
  // 1. HTMLエスケープを最初に実行
  let result = escapeHtml(text)
  
  // 2. 安全なマークダウン記法のみを処理
  result = result
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  // 3. リスト処理も安全に実装
  return processListsSafely(result)
}
```

## 🔒 セキュリティベストプラクティス

### 開発者向け
1. **入力値は常に検証**: すべてのユーザー入力を信頼しない
2. **出力時にエスケープ**: HTMLに出力する際は必ずエスケープ
3. **最小権限の原則**: 必要最小限の権限のみを付与
4. **定期的な更新**: 依存関係とセキュリティパッチを定期更新

### ユーザー向け
1. **ブラウザを最新に保つ**: セキュリティ機能を最大限活用
2. **不審なファイルをアップロードしない**: 信頼できるファイルのみ
3. **個人情報を投稿しない**: つぶやきやチャットに個人情報を含めない

## 🚨 セキュリティインシデント対応

### 発見した場合
1. **即座に報告**: セキュリティ問題を発見した場合は即座に報告
2. **詳細な記録**: 再現手順と影響範囲を記録
3. **一時的な対処**: 可能であれば一時的な対処を実施

### 対応手順
1. **問題の特定と分析**
2. **影響範囲の評価**
3. **修正パッチの開発**
4. **テストと検証**
5. **デプロイと監視**

## 📋 セキュリティチェックリスト

### コード審査時
- [ ] 入力値検証が適切に実装されている
- [ ] HTMLエスケープが正しく行われている
- [ ] ファイルアップロードに制限がかけられている
- [ ] エラーハンドリングが適切に実装されている
- [ ] ログ出力に機密情報が含まれていない

### デプロイ前
- [ ] CSPヘッダーが正しく設定されている
- [ ] セキュリティヘッダーが全て設定されている
- [ ] 脆弱性スキャンを実行済み
- [ ] セキュリティテストを実行済み

## 🔄 継続的なセキュリティ向上

1. **定期的なセキュリティ監査**
2. **脆弱性データベースの監視**
3. **セキュリティトレーニングの実施**
4. **インシデント対応手順の見直し**

---

このセキュリティガイドは定期的に更新され、新しい脅威や対策に応じて改善されます。