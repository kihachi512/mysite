/**
 * ログシステム
 * エラーハンドリング、デバッグ情報、パフォーマンス測定を統合管理
 */

// ログレベル定義
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// ログエントリ型定義
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  stack?: string
  userAgent?: string
  url?: string
  userId?: string
}

class Logger {
  private static instance: Logger
  private logLevel: LogLevel
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private constructor() {
    // 環境変数からログレベルを設定
    const envLogLevel = import.meta.env.VITE_LOG_LEVEL || 'info'
    this.logLevel = this.parseLogLevel(envLogLevel)
    
    // グローバルエラーハンドラーを設定
    this.setupGlobalErrorHandlers()
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG
      case 'info': return LogLevel.INFO
      case 'warn': return LogLevel.WARN
      case 'error': return LogLevel.ERROR
      case 'fatal': return LogLevel.FATAL
      default: return LogLevel.INFO
    }
  }

  private setupGlobalErrorHandlers(): void {
    // JavaScript エラーハンドラー
    window.addEventListener('error', (event) => {
      this.error('Uncaught Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
    })

    // Promise rejection ハンドラー
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      })
    })

    // リソース読み込みエラーハンドラー
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        const target = event.target as HTMLElement | null
        this.warn('Resource Load Error', {
          element: target?.tagName,
          source: target?.getAttribute?.('src') || target?.getAttribute?.('href')
        })
      }
    }, true)
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // エラーレベルの場合はスタックトレースを取得
    if (level >= LogLevel.ERROR) {
      entry.stack = new Error().stack
    }

    return entry
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry)
    
    // ログ数制限
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // コンソール出力
    this.outputToConsole(entry)

    // 重要なエラーの場合は外部サービスに送信
    if (entry.level >= LogLevel.ERROR && import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') {
      this.sendToErrorService(entry)
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const message = `[${entry.timestamp}] ${LogLevel[entry.level]}: ${entry.message}`
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data)
        break
      case LogLevel.INFO:
        console.info(message, entry.data)
        break
      case LogLevel.WARN:
        console.warn(message, entry.data)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data, entry.stack)
        break
    }
  }

  private async sendToErrorService(entry: LogEntry): Promise<void> {
    try {
      // 実際のエラーレポーティングサービスにデータを送信
      // 例: Sentry, Bugsnag, カスタムAPI など
      console.log('Sending error to external service:', entry)
    } catch (error) {
      console.error('Failed to send error to external service:', error)
    }
  }

  // パブリックメソッド
  public debug(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, message, data))
    }
  }

  public info(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createLogEntry(LogLevel.INFO, message, data))
    }
  }

  public warn(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createLogEntry(LogLevel.WARN, message, data))
    }
  }

  public error(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(this.createLogEntry(LogLevel.ERROR, message, data))
    }
  }

  public fatal(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.addLog(this.createLogEntry(LogLevel.FATAL, message, data))
    }
  }

  // パフォーマンス測定
  public startPerformanceMeasure(name: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      performance.mark(`${name}-start`)
    }
  }

  public endPerformanceMeasure(name: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = performance.getEntriesByName(name)[0]
      if (measure) {
        this.debug(`Performance: ${name}`, {
          duration: `${measure.duration.toFixed(2)}ms`
        })
      }
    }
  }

  // セキュリティ違反ログ
  public securityViolation(type: string, details: string, data?: unknown): void {
    this.error(`Security Violation: ${type}`, { details, data })
    
    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('security-violation', {
      detail: { type, details }
    }))
  }

  // ログの取得（デバッグ用）
  public getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level)
    }
    return [...this.logs]
  }

  // ログのクリア
  public clearLogs(): void {
    this.logs = []
    this.info('Logs cleared')
  }

  // ログのエクスポート
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// シングルトンインスタンスをエクスポート
export const logger = Logger.getInstance()

// 便利な関数をエクスポート
export const log = {
  debug: (message: string, data?: unknown) => logger.debug(message, data),
  info: (message: string, data?: unknown) => logger.info(message, data),
  warn: (message: string, data?: unknown) => logger.warn(message, data),
  error: (message: string, data?: unknown) => logger.error(message, data),
  fatal: (message: string, data?: unknown) => logger.fatal(message, data),
  performance: {
    start: (name: string) => logger.startPerformanceMeasure(name),
    end: (name: string) => logger.endPerformanceMeasure(name)
  },
  security: (type: string, details: string, data?: unknown) => 
    logger.securityViolation(type, details, data)
}