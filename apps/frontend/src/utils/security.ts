/**
 * セキュリティユーティリティ関数
 * XSS攻撃、インジェクション攻撃などを防ぐためのヘルパー関数群
 */

// HTMLエスケープ用の文字マッピング
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * HTMLエスケープ処理
 * XSS攻撃を防ぐため、HTML特殊文字をエスケープ
 */
export const escapeHtml = (text: string): string => {
  if (typeof text !== 'string') {
    return String(text || '');
  }
  
  return text.replace(/[&<>"'`=\/]/g, (match) => HTML_ESCAPE_MAP[match] || match);
};

/**
 * HTMLタグを完全に除去
 * より厳格なサニタイゼーションが必要な場合
 */
export const stripHtml = (text: string): string => {
  if (typeof text !== 'string') {
    return String(text || '');
  }
  
  return text.replace(/<[^>]*>/g, '');
};

/**
 * 安全なマークダウンパーサー
 * 限定的なマークダウンのみを許可し、HTMLインジェクションを防ぐ
 */
export const parseSafeMarkdown = (text: string): string => {
  if (typeof text !== 'string') {
    return '';
  }
  
  // まずHTMLエスケープを実行
  let result = escapeHtml(text);
  
  // 安全なマークダウン記法のみを処理
  result = result
    // 太字 **text** → <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 斜体 *text* → <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 改行を<br>に変換
    .replace(/\n/g, '<br>');
  
  // リスト項目の処理（より安全に）
  const lines = result.split('<br>');
  const processedLines: string[] = [];
  let inList = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^・(.+)$/)) {
      // リスト項目の開始
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      const listContent = trimmedLine.replace(/^・/, '').trim();
      processedLines.push(`<li>${listContent}</li>`);
    } else {
      // リスト項目以外
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  // 最後がリストで終わっている場合
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.join('<br>');
};

/**
 * JSONデータのサニタイゼーション
 * localStorageから取得したデータの検証
 */
export const sanitizeJsonData = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    return escapeHtml(data);
  }
  
  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJsonData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // キーもサニタイズ
      const safeKey = escapeHtml(key);
      sanitized[safeKey] = sanitizeJsonData(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * localStorageの安全な読み取り
 * 例外処理とデータ検証を含む
 */
export const safeGetLocalStorage = (key: string): unknown => {
  try {
    if (typeof key !== 'string' || !key.trim()) {
      console.warn('Invalid localStorage key provided');
      return null;
    }
    
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    
    const parsed = JSON.parse(item);
    return sanitizeJsonData(parsed);
  } catch (error) {
    console.error(`Failed to read from localStorage (key: ${key}):`, error);
    return null;
  }
};

/**
 * localStorageの安全な書き込み
 * データサニタイゼーションと例外処理を含む
 */
export const safeSetLocalStorage = (key: string, value: unknown): boolean => {
  try {
    if (typeof key !== 'string' || !key.trim()) {
      console.warn('Invalid localStorage key provided');
      return false;
    }
    
    const sanitizedValue = sanitizeJsonData(value);
    const serialized = JSON.stringify(sanitizedValue);
    
    // サイズ制限チェック（5MB制限）
    if (serialized.length > 5 * 1024 * 1024) {
      console.error('Data too large for localStorage');
      return false;
    }
    
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Failed to write to localStorage (key: ${key}):`, error);
    return false;
  }
};

/**
 * URLの安全性検証
 * 悪意のあるURLやプロトコルをブロック
 */
export const validateUrl = (url: string): boolean => {
  try {
    if (typeof url !== 'string') {
      return false;
    }
    
    const urlObj = new URL(url);
    
    // 許可されたプロトコルのみ
    const allowedProtocols = ['http:', 'https:', 'mailto:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // javascript:、data:、vbscript: などの危険なプロトコルをブロック
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * CSRFトークンの生成（シンプルな実装）
 * より高度な実装が必要な場合は、サーバーサイドでの実装を推奨
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * ファイルタイプの検証
 * アップロードファイルの安全性チェック
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  if (!file || !file.type) {
    return false;
  }
  
  // MIMEタイプの検証
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  
  // ファイル拡張子の検証
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = allowedTypes.map(type => {
    const ext = type.split('/')[1];
    return ext === 'jpeg' ? 'jpg' : ext;
  });
  
  if (!extension || !allowedExtensions.includes(extension)) {
    return false;
  }
  
  return true;
};

/**
 * ファイルサイズの検証
 */
export const validateFileSize = (file: File, maxSizeInBytes: number): boolean => {
  return file && file.size <= maxSizeInBytes;
};

/**
 * 安全なランダム文字列生成
 */
export const generateSecureRandomString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => chars[byte % chars.length]).join('');
};

/**
 * 入力値の長さ制限チェック
 */
export const validateInputLength = (input: string, maxLength: number): boolean => {
  return typeof input === 'string' && input.length <= maxLength;
};

/**
 * 悪意のあるスクリプトパターンの検出
 */
export const detectMaliciousScript = (input: string): boolean => {
  if (typeof input !== 'string') {
    return false;
  }
  
  const maliciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i, // onload, onclick などのイベントハンドラ
    /eval\s*\(/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /@import/i,
    /\bexec\b/i,
    /\bsystem\b/i
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(input));
};