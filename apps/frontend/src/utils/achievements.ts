// Achievement tracking utilities
import { logger } from './logger'

export type AchievementStats = {
  gamesPlayed: number
  tweetsPosted: number
  omikujiCount: number
  purchasesMade: number
  areasVisited: Set<string>
  // 新規追加
  slotsPlayed: number
  memoryGamesPlayed: number
  sudokuSolved: number
  bulletHellPlayed: number
  avatarChanges: number
  bankVisits: number
  favoritesSaved: number
  chatbotMessages: number
  settingsChanged: number
  maxMomoPayReached: number
  consecutiveDays: number
  totalTimeSpent: number // 分単位
  buttonClicks: number
  pageViews: number
}

export const ACHIEVEMENT_ACTIONS = {
  GAME_PLAYED: 'game_played',
  TWEET_POSTED: 'tweet_posted',
  OMIKUJI_DRAWN: 'omikuji_drawn',
  PURCHASE_MADE: 'purchase_made',
  AREA_VISITED: 'area_visited',
  // 新規追加
  SLOT_PLAYED: 'slot_played',
  MEMORY_GAME_PLAYED: 'memory_game_played',
  SUDOKU_SOLVED: 'sudoku_solved',
  BULLET_HELL_PLAYED: 'bullet_hell_played',
  AVATAR_CHANGED: 'avatar_changed',
  BANK_VISITED: 'bank_visited',
  FAVORITE_SAVED: 'favorite_saved',
  CHATBOT_MESSAGE: 'chatbot_message',
  SETTING_CHANGED: 'setting_changed',
  MOMO_PAY_UPDATED: 'momo_pay_updated',
  DAILY_LOGIN: 'daily_login',
  TIME_SPENT: 'time_spent',
  BUTTON_CLICKED: 'button_clicked',
  PAGE_VIEWED: 'page_viewed'
} as const

export type AchievementAction = typeof ACHIEVEMENT_ACTIONS[keyof typeof ACHIEVEMENT_ACTIONS]

class AchievementTracker {
  private stats: AchievementStats

  constructor() {
    this.stats = this.loadStats()
  }

  private loadStats(): AchievementStats {
    try {
      const saved = localStorage.getItem('achievement-stats')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          gamesPlayed: parsed.gamesPlayed || 0,
          tweetsPosted: parsed.tweetsPosted || 0,
          omikujiCount: parsed.omikujiCount || 0,
          purchasesMade: parsed.purchasesMade || 0,
          areasVisited: new Set(parsed.areasVisited || []),
          // 新規統計
          slotsPlayed: parsed.slotsPlayed || 0,
          memoryGamesPlayed: parsed.memoryGamesPlayed || 0,
          sudokuSolved: parsed.sudokuSolved || 0,
          bulletHellPlayed: parsed.bulletHellPlayed || 0,
          avatarChanges: parsed.avatarChanges || 0,
          bankVisits: parsed.bankVisits || 0,
          favoritesSaved: parsed.favoritesSaved || 0,
          chatbotMessages: parsed.chatbotMessages || 0,
          settingsChanged: parsed.settingsChanged || 0,
          maxMomoPayReached: parsed.maxMomoPayReached || 0,
          consecutiveDays: parsed.consecutiveDays || 0,
          totalTimeSpent: parsed.totalTimeSpent || 0,
          buttonClicks: parsed.buttonClicks || 0,
          pageViews: parsed.pageViews || 0
        }
      }
    } catch (error) {
      logger.error('Failed to load achievement stats:', error)
    }

    return {
      gamesPlayed: 0,
      tweetsPosted: 0,
      omikujiCount: 0,
      purchasesMade: 0,
      areasVisited: new Set<string>(),
      // 新規統計のデフォルト値
      slotsPlayed: 0,
      memoryGamesPlayed: 0,
      sudokuSolved: 0,
      bulletHellPlayed: 0,
      avatarChanges: 0,
      bankVisits: 0,
      favoritesSaved: 0,
      chatbotMessages: 0,
      settingsChanged: 0,
      maxMomoPayReached: 0,
      consecutiveDays: 0,
      totalTimeSpent: 0,
      buttonClicks: 0,
      pageViews: 0
    }
  }

  private saveStats(): void {
    try {
      // データの検証と浄化
      const sanitizedStats = {
        gamesPlayed: Math.max(0, Math.floor(this.stats.gamesPlayed || 0)),
        tweetsPosted: Math.max(0, Math.floor(this.stats.tweetsPosted || 0)),
        omikujiCount: Math.max(0, Math.floor(this.stats.omikujiCount || 0)),
        purchasesMade: Math.max(0, Math.floor(this.stats.purchasesMade || 0)),
        areasVisited: Array.from(this.stats.areasVisited || new Set()),
        slotsPlayed: Math.max(0, Math.floor(this.stats.slotsPlayed || 0)),
        memoryGamesPlayed: Math.max(0, Math.floor(this.stats.memoryGamesPlayed || 0)),
        sudokuSolved: Math.max(0, Math.floor(this.stats.sudokuSolved || 0)),
        bulletHellPlayed: Math.max(0, Math.floor(this.stats.bulletHellPlayed || 0)),
        avatarChanges: Math.max(0, Math.floor(this.stats.avatarChanges || 0)),
        bankVisits: Math.max(0, Math.floor(this.stats.bankVisits || 0)),
        favoritesSaved: Math.max(0, Math.floor(this.stats.favoritesSaved || 0)),
        chatbotMessages: Math.max(0, Math.floor(this.stats.chatbotMessages || 0)),
        settingsChanged: Math.max(0, Math.floor(this.stats.settingsChanged || 0)),
        maxMomoPayReached: Math.max(0, Math.floor(this.stats.maxMomoPayReached || 0)),
        consecutiveDays: Math.max(0, Math.floor(this.stats.consecutiveDays || 0)),
        totalTimeSpent: Math.max(0, Math.floor(this.stats.totalTimeSpent || 0)),
        buttonClicks: Math.max(0, Math.floor(this.stats.buttonClicks || 0)),
        pageViews: Math.max(0, Math.floor(this.stats.pageViews || 0))
      }
      
      localStorage.setItem('achievement-stats', JSON.stringify(sanitizedStats))
    } catch (error) {
      logger.error('Failed to save achievement stats:', error)
      // localStorage容量不足などの場合は古いデータを削除
      try {
        localStorage.removeItem('achievement-stats')
        logger.info('Cleared corrupted achievement stats')
      } catch (clearError) {
        logger.error('Failed to clear achievement stats:', clearError)
      }
    }
  }

  public incrementStat(action: AchievementAction, value: string | number = 1): void {
    switch (action) {
      case ACHIEVEMENT_ACTIONS.GAME_PLAYED:
        this.stats.gamesPlayed += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.TWEET_POSTED:
        this.stats.tweetsPosted += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.OMIKUJI_DRAWN:
        this.stats.omikujiCount += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.PURCHASE_MADE:
        this.stats.purchasesMade += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.AREA_VISITED:
        if (typeof value === 'string') {
          this.stats.areasVisited.add(value)
        }
        break
      // 新規アクション
      case ACHIEVEMENT_ACTIONS.SLOT_PLAYED:
        this.stats.slotsPlayed += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.MEMORY_GAME_PLAYED:
        this.stats.memoryGamesPlayed += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.SUDOKU_SOLVED:
        this.stats.sudokuSolved += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.BULLET_HELL_PLAYED:
        this.stats.bulletHellPlayed += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.AVATAR_CHANGED:
        this.stats.avatarChanges += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.BANK_VISITED:
        this.stats.bankVisits += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.FAVORITE_SAVED:
        this.stats.favoritesSaved += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.CHATBOT_MESSAGE:
        this.stats.chatbotMessages += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.SETTING_CHANGED:
        this.stats.settingsChanged += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.MOMO_PAY_UPDATED:
        if (typeof value === 'number' && value > this.stats.maxMomoPayReached) {
          this.stats.maxMomoPayReached = value
        }
        break
      case ACHIEVEMENT_ACTIONS.DAILY_LOGIN:
        this.stats.consecutiveDays += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.TIME_SPENT:
        this.stats.totalTimeSpent += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.BUTTON_CLICKED:
        this.stats.buttonClicks += typeof value === 'number' ? value : 1
        break
      case ACHIEVEMENT_ACTIONS.PAGE_VIEWED:
        this.stats.pageViews += typeof value === 'number' ? value : 1
        break
    }
    
    this.saveStats()
    logger.debug('Achievement stat updated:', { action, value, stats: this.stats })
  }

  public getStats(): AchievementStats {
    return { ...this.stats, areasVisited: new Set(this.stats.areasVisited) }
  }

  public resetStats(): void {
    this.stats = {
      gamesPlayed: 0,
      tweetsPosted: 0,
      omikujiCount: 0,
      purchasesMade: 0,
      areasVisited: new Set<string>(),
      slotsPlayed: 0,
      memoryGamesPlayed: 0,
      sudokuSolved: 0,
      bulletHellPlayed: 0,
      avatarChanges: 0,
      bankVisits: 0,
      favoritesSaved: 0,
      chatbotMessages: 0,
      settingsChanged: 0,
      maxMomoPayReached: 0,
      consecutiveDays: 0,
      totalTimeSpent: 0,
      buttonClicks: 0,
      pageViews: 0
    }
    this.saveStats()
    logger.info('Achievement stats reset')
  }
}

// Singleton instance
export const achievementTracker = new AchievementTracker()

// Helper functions for easy usage
export const trackGamePlayed = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.GAME_PLAYED)
export const trackTweetPosted = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.TWEET_POSTED)
export const trackOmikujiDrawn = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.OMIKUJI_DRAWN)
export const trackPurchaseMade = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.PURCHASE_MADE)
export const trackAreaVisited = (area: string) => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.AREA_VISITED, area)

// 新規ヘルパー関数
export const trackSlotPlayed = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.SLOT_PLAYED)
export const trackMemoryGamePlayed = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.MEMORY_GAME_PLAYED)
export const trackSudokuSolved = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.SUDOKU_SOLVED)
export const trackBulletHellPlayed = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.BULLET_HELL_PLAYED)
export const trackAvatarChanged = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.AVATAR_CHANGED)
export const trackBankVisited = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.BANK_VISITED)
export const trackFavoriteSaved = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.FAVORITE_SAVED)
export const trackChatbotMessage = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.CHATBOT_MESSAGE)
export const trackSettingChanged = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.SETTING_CHANGED)
export const trackMomoPayUpdated = (amount: number) => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.MOMO_PAY_UPDATED, amount)
export const trackDailyLogin = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.DAILY_LOGIN)
export const trackTimeSpent = (minutes: number) => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.TIME_SPENT, minutes)
export const trackButtonClicked = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.BUTTON_CLICKED)
export const trackPageViewed = () => achievementTracker.incrementStat(ACHIEVEMENT_ACTIONS.PAGE_VIEWED)

// Area constants for consistent tracking
export const AREAS = {
  HOME: 'home',
  GAMES: 'games',
  BULLET_HELL: 'bullet_hell',
  OMIKUJI: 'omikuji',
  STORE: 'store',
  PLAZA: 'plaza',
  HALL: 'hall',
  CHATBOT: 'chatbot',
  FAVORITES: 'favorites',
  SETTINGS: 'settings',
  ACHIEVEMENTS: 'achievements'
} as const

export type Area = typeof AREAS[keyof typeof AREAS]