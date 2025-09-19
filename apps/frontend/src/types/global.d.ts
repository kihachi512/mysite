/**
 * グローバル型定義
 * アプリケーション全体で使用される型やインターフェースを定義
 */

// 環境変数の型定義
declare global {
  const __APP_VERSION__: string
  const __BUILD_DATE__: string
}

// Vite環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_SITE_URL: string
  readonly VITE_SITE_DOMAIN: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_REPORTING: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  readonly VITE_CACHE_VERSION: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ENABLE_CSP: string
  readonly VITE_ENABLE_SECURITY_HEADERS: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_PWA_CACHE_NAME: string
  readonly VITE_ENABLE_DEV_TOOLS: string
  readonly VITE_LOG_LEVEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// WebKit Audio Context対応
interface Window {
  webkitAudioContext?: typeof AudioContext
}

// カスタムイベント型
interface CustomEventMap {
  'theme-change': CustomEvent<{ theme: string }>
  'momopay-update': CustomEvent<{ points: number }>
  'security-violation': CustomEvent<{ type: string; details: string }>
}

// 拡張されたEventTarget
interface EventTarget {
  addEventListener<K extends keyof CustomEventMap>(
    type: K,
    listener: (this: EventTarget, ev: CustomEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener<K extends keyof CustomEventMap>(
    type: K,
    listener: (this: EventTarget, ev: CustomEventMap[K]) => void,
    options?: boolean | EventListenerOptions
  ): void
}

// パフォーマンス測定用
declare global {
  interface Performance {
    measureUserAgentSpecificMemory?: () => Promise<{
      bytes: number
      breakdown: Array<{
        bytes: number
        attribution: Array<{
          url: string
          scope: string
        }>
      }>
    }>
  }
}

// Service Worker関連
interface ServiceWorkerRegistration {
  update(): Promise<void>
}

// PWA関連
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
}

export {}