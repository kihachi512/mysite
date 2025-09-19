/**
 * パフォーマンス監視ユーティリティ
 * Webアプリケーションのパフォーマンスを測定・監視
 */

import { logger } from './logger'

// パフォーマンス測定結果の型定義
interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  
  // その他の重要な指標
  ttfb?: number // Time to First Byte
  domContentLoaded?: number
  loadComplete?: number
  
  // メモリ使用量
  memoryUsage?: {
    used: number
    total: number
  }
  
  // ネットワーク情報
  connection?: {
    effectiveType: string
    downlink: number
    rtt: number
  }
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  private constructor() {
    this.initializeObservers()
    this.measureNavigationTiming()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers(): void {
    // LCP (Largest Contentful Paint) の測定
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            this.metrics.lcp = lastEntry.startTime
            logger.debug('LCP measured', { lcp: this.metrics.lcp })
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        logger.warn('LCP observer not supported', error)
      }

      // FID (First Input Delay) の測定
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          entries.forEach((entry) => {
            // First Input Delay用の型キャスト
            const fidEntry = entry as PerformanceEventTiming
            this.metrics.fid = fidEntry.processingStart - fidEntry.startTime
            logger.debug('FID measured', { fid: this.metrics.fid })
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        logger.warn('FID observer not supported', error)
      }

      // CLS (Cumulative Layout Shift) の測定
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          entries.forEach((entry) => {
            // Layout Shift Entry の型キャスト
            const clsEntry = entry as PerformanceEntry & {
              hadRecentInput?: boolean
              value: number
            }
            if (!clsEntry.hadRecentInput) {
              clsValue += clsEntry.value
            }
          })
          this.metrics.cls = clsValue
          logger.debug('CLS updated', { cls: this.metrics.cls })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (error) {
        logger.warn('CLS observer not supported', error)
      }
    }
  }

  private measureNavigationTiming(): void {
    // ページ読み込み完了後に測定
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (navigation) {
          this.metrics.ttfb = navigation.responseStart - navigation.fetchStart
          this.metrics.fcp = this.getFCP()
          this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
          this.metrics.loadComplete = navigation.loadEventEnd - navigation.fetchStart
          
          logger.info('Navigation timing measured', this.metrics)
        }

        // メモリ使用量の測定
        this.measureMemoryUsage()
        
        // ネットワーク情報の取得
        this.getNetworkInformation()
        
        // 全体的なパフォーマンス評価
        this.evaluatePerformance()
      }, 0)
    })
  }

  private getFCP(): number | undefined {
    const entries = performance.getEntriesByType('paint')
    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
    return fcpEntry?.startTime
  }

  private async measureMemoryUsage(): Promise<void> {
    try {
      // Performance Memory API（Chrome限定）
      if ('memory' in performance) {
        const memory = (performance as unknown as {
          memory?: {
            usedJSHeapSize: number
            totalJSHeapSize: number
          }
        }).memory
        if (memory) {
          this.metrics.memoryUsage = {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize
          }
          logger.debug('Memory usage measured', this.metrics.memoryUsage)
        }
      }

      // User Agent Specific Memory API（実験的）
      if (performance.measureUserAgentSpecificMemory) {
        try {
          const memoryInfo = await performance.measureUserAgentSpecificMemory()
          logger.debug('Detailed memory info', memoryInfo)
        } catch (error) {
          logger.debug('Detailed memory measurement failed', error)
        }
      }
    } catch (error) {
      logger.debug('Memory measurement not available', error)
    }
  }

  private getNetworkInformation(): void {
    try {
      // Network Information API
      const connection = (navigator as Navigator & {
        connection?: {
          effectiveType: string
          downlink: number
          rtt: number
        }
        mozConnection?: {
          effectiveType: string
          downlink: number
          rtt: number
        }
        webkitConnection?: {
          effectiveType: string
          downlink: number
          rtt: number
        }
      }).connection || 
      (navigator as Navigator & { mozConnection?: { effectiveType: string; downlink: number; rtt: number } }).mozConnection || 
      (navigator as Navigator & { webkitConnection?: { effectiveType: string; downlink: number; rtt: number } }).webkitConnection

      if (connection) {
        this.metrics.connection = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        }
        logger.debug('Network information obtained', this.metrics.connection)
      }
    } catch (error) {
      logger.debug('Network information not available', error)
    }
  }

  private evaluatePerformance(): void {
    const issues: string[] = []
    const recommendations: string[] = []

    // LCP評価（2.5秒以下が良好）
    if (this.metrics.lcp) {
      if (this.metrics.lcp > 4000) {
        issues.push('LCP is poor (>4s)')
        recommendations.push('Optimize largest contentful element loading')
      } else if (this.metrics.lcp > 2500) {
        issues.push('LCP needs improvement (>2.5s)')
        recommendations.push('Consider image optimization or lazy loading')
      }
    }

    // FID評価（100ms以下が良好）
    if (this.metrics.fid) {
      if (this.metrics.fid > 300) {
        issues.push('FID is poor (>300ms)')
        recommendations.push('Reduce JavaScript execution time')
      } else if (this.metrics.fid > 100) {
        issues.push('FID needs improvement (>100ms)')
        recommendations.push('Optimize event handlers and main thread work')
      }
    }

    // CLS評価（0.1以下が良好）
    if (this.metrics.cls) {
      if (this.metrics.cls > 0.25) {
        issues.push('CLS is poor (>0.25)')
        recommendations.push('Add size attributes to images and ads')
      } else if (this.metrics.cls > 0.1) {
        issues.push('CLS needs improvement (>0.1)')
        recommendations.push('Avoid inserting content above existing content')
      }
    }

    // TTFB評価（600ms以下が良好）
    if (this.metrics.ttfb) {
      if (this.metrics.ttfb > 1800) {
        issues.push('TTFB is poor (>1.8s)')
        recommendations.push('Optimize server response time')
      } else if (this.metrics.ttfb > 600) {
        issues.push('TTFB needs improvement (>600ms)')
        recommendations.push('Consider CDN or server optimization')
      }
    }

    if (issues.length > 0) {
      logger.warn('Performance issues detected', { issues, recommendations })
    } else {
      logger.info('Performance is good', this.metrics)
    }
  }

  // パブリックメソッド
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public measureCustomMetric(name: string, startTime: number): void {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    logger.debug(`Custom metric: ${name}`, { duration: `${duration.toFixed(2)}ms` })
    
    // カスタムメトリクスをPerformanceに記録
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
  }

  public startCustomMetric(name: string): number {
    const startTime = performance.now()
    performance.mark(`${name}-start`)
    return startTime
  }

  public reportVitals(): void {
    logger.info('Core Web Vitals Report', {
      lcp: this.metrics.lcp ? `${this.metrics.lcp.toFixed(2)}ms` : 'N/A',
      fid: this.metrics.fid ? `${this.metrics.fid.toFixed(2)}ms` : 'N/A',
      cls: this.metrics.cls ? this.metrics.cls.toFixed(3) : 'N/A',
      fcp: this.metrics.fcp ? `${this.metrics.fcp.toFixed(2)}ms` : 'N/A',
      ttfb: this.metrics.ttfb ? `${this.metrics.ttfb.toFixed(2)}ms` : 'N/A'
    })
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// シングルトンインスタンスをエクスポート
export const performanceMonitor = PerformanceMonitor.getInstance()

// 便利な関数をエクスポート
export const perf = {
  start: (name: string) => performanceMonitor.startCustomMetric(name),
  end: (name: string, startTime: number) => performanceMonitor.measureCustomMetric(name, startTime),
  getMetrics: () => performanceMonitor.getMetrics(),
  report: () => performanceMonitor.reportVitals()
}