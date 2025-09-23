// Achievement tracking utilities
import { logger } from './logger'

export type AchievementStats = {
  gamesPlayed: number
  tweetsPosted: number
  omikujiCount: number
  purchasesMade: number
  areasVisited: Set<string>
}

export const ACHIEVEMENT_ACTIONS = {
  GAME_PLAYED: 'game_played',
  TWEET_POSTED: 'tweet_posted',
  OMIKUJI_DRAWN: 'omikuji_drawn',
  PURCHASE_MADE: 'purchase_made',
  AREA_VISITED: 'area_visited'
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
          areasVisited: new Set(parsed.areasVisited || [])
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
      areasVisited: new Set<string>()
    }
  }

  private saveStats(): void {
    try {
      const toSave = {
        ...this.stats,
        areasVisited: Array.from(this.stats.areasVisited)
      }
      localStorage.setItem('achievement-stats', JSON.stringify(toSave))
    } catch (error) {
      logger.error('Failed to save achievement stats:', error)
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
      areasVisited: new Set<string>()
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