// 環境変数の一元管理
export interface AppConfig {
  geminiApiKey: string | null
  apiUrl: string
  dailyRequestLimit: number
  minuteRequestLimit: number
  isDevelopment: boolean
}

// 環境変数のバリデーション
const validateEnvironment = (): AppConfig => {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY
  const isDevelopment = import.meta.env.DEV

  // 開発環境でAPIキーが未設定の場合の警告
  if (!geminiApiKey) {
    console.warn('🔑 Gemini API key not found in environment variables')
    if (isDevelopment) {
      console.warn('💡 Please set VITE_GEMINI_API_KEY in your .env.local file')
      console.warn('📝 See .env.example for setup instructions')
    }
  }

  // APIキーの形式チェック（基本的な検証）
  if (geminiApiKey && !geminiApiKey.startsWith('AIza')) {
    console.warn('⚠️ API key format may be incorrect (should start with "AIza")')
  }

  return {
    geminiApiKey: geminiApiKey || null,
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    dailyRequestLimit: Number(import.meta.env.VITE_DAILY_REQUEST_LIMIT) || 200,
    minuteRequestLimit: Number(import.meta.env.VITE_MINUTE_REQUEST_LIMIT) || 8,
    isDevelopment
  }
}

// アプリケーション設定をエクスポート
export const appConfig = validateEnvironment()

// 設定値の型安全なアクセス
export const getApiKey = (): string | null => appConfig.geminiApiKey
export const getApiUrl = (): string => appConfig.apiUrl
export const getDailyRequestLimit = (): number => appConfig.dailyRequestLimit
export const getMinuteRequestLimit = (): number => appConfig.minuteRequestLimit
export const isDevelopment = (): boolean => appConfig.isDevelopment