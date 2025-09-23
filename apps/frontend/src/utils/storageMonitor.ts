// Storage monitoring utilities for production safety
import { logger } from './logger'

export const getStorageUsage = (): { used: number; total: number; percentage: number } => {
  try {
    let used = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage[key].length + key.length
      }
    }
    
    // Most browsers have 5-10MB limit for localStorage
    const total = 5 * 1024 * 1024 // 5MB assumption
    const percentage = (used / total) * 100
    
    return { used, total, percentage }
  } catch (error) {
    logger.error('Failed to calculate storage usage:', error)
    return { used: 0, total: 0, percentage: 0 }
  }
}

export const formatStorageSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

export const checkStorageQuota = (): { warning: boolean; critical: boolean; message: string } => {
  const usage = getStorageUsage()
  
  if (usage.percentage > 90) {
    return {
      warning: false,
      critical: true,
      message: `ストレージ使用量が危険レベルです（${usage.percentage.toFixed(1)}%）。データをバックアップして一部削除することをお勧めします。`
    }
  } else if (usage.percentage > 70) {
    return {
      warning: true,
      critical: false,
      message: `ストレージ使用量が多くなっています（${usage.percentage.toFixed(1)}%）。不要なデータの削除をご検討ください。`
    }
  }
  
  return {
    warning: false,
    critical: false,
    message: `ストレージ使用量: ${usage.percentage.toFixed(1)}% (${formatStorageSize(usage.used)})`
  }
}

export const cleanupOldData = (): void => {
  try {
    // Remove old error logs (keep only last 5)
    const errorLogs = localStorage.getItem('error-logs')
    if (errorLogs) {
      const logs = JSON.parse(errorLogs)
      if (Array.isArray(logs) && logs.length > 5) {
        localStorage.setItem('error-logs', JSON.stringify(logs.slice(-5)))
        logger.info('Cleaned up old error logs')
      }
    }
    
    // Remove expired tweets (should be automatic but double-check)
    const tweets = localStorage.getItem('tweets')
    if (tweets) {
      const tweetData = JSON.parse(tweets)
      if (Array.isArray(tweetData)) {
        const now = new Date().getTime()
        const validTweets = tweetData.filter((tweet: unknown) => {
          if (typeof tweet === 'object' && tweet && 'expiresAt' in tweet) {
            const expiresAt = new Date((tweet as { expiresAt: string }).expiresAt).getTime()
            return expiresAt > now
          }
          return false
        })
        
        if (validTweets.length !== tweetData.length) {
          localStorage.setItem('tweets', JSON.stringify(validTweets))
          logger.info(`Cleaned up ${tweetData.length - validTweets.length} expired tweets`)
        }
      }
    }
    
  } catch (error) {
    logger.error('Failed to cleanup old data:', error)
  }
}

// Monitor storage usage and warn users
export const monitorStorage = (): void => {
  const quota = checkStorageQuota()
  
  if (quota.critical) {
    console.warn('STORAGE CRITICAL:', quota.message)
    // Could show a notification to user
  } else if (quota.warning) {
    console.warn('STORAGE WARNING:', quota.message)
  }
  
  logger.debug('Storage status:', quota.message)
}

// Initialize storage monitoring
export const initStorageMonitor = (): void => {
  // Clean up old data on startup
  cleanupOldData()
  
  // Monitor storage usage
  monitorStorage()
  
  // Set up periodic cleanup (every 30 minutes)
  setInterval(() => {
    cleanupOldData()
    monitorStorage()
  }, 30 * 60 * 1000)
}