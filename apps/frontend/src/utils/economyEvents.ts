// Daily bonus system for MOMOPay
import { logger } from './logger'

export type DailyBonus = {
  id: string
  title: string
  description: string
  icon: string
  amount: number
  claimed: boolean
  date: string
}

class EconomyEventManager {
  private dailyBonus: DailyBonus | null = null

  constructor() {
    this.loadDailyBonus()
    this.generateDailyBonus()
  }

  private loadDailyBonus(): void {
    try {
      const saved = localStorage.getItem('daily-bonus')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.dailyBonus = parsed.dailyBonus || null
      }
    } catch (error) {
      logger.error('Failed to load daily bonus:', error)
    }
  }

  private saveDailyBonus(): void {
    try {
      const data = {
        dailyBonus: this.dailyBonus,
        lastUpdate: new Date().toISOString()
      }
      localStorage.setItem('daily-bonus', JSON.stringify(data))
    } catch (error) {
      logger.error('Failed to save daily bonus:', error)
    }
  }

  private generateDailyBonus(): void {
    const today = new Date().toISOString().split('T')[0]!
    
    // Check if we need to generate new daily bonus
    const lastBonusDate = localStorage.getItem('last-bonus-date')
    if (lastBonusDate === today) {
      return // Already generated for today
    }

    this.createDailyBonus(today)
    
    localStorage.setItem('last-bonus-date', today)
    this.saveDailyBonus()
  }

  private createDailyBonus(date: string): void {
    const seed = date.split('-').join('')
    const pseudoRandom = () => {
      const hash = parseInt(seed) * 9301 + 49297
      return (hash % 233280) / 233280
    }

    const bonuses = [
      {
        title: '朝のどんぐり',
        description: '新鮮な朝の空気とともに',
        icon: '🌰',
        amount: () => 50 + Math.floor(pseudoRandom() * 50)
      },
      {
        title: 'ログインギフト',
        description: 'カーニバルに来てくれてありがとう',
        icon: '🎁',
        amount: () => 30 + Math.floor(pseudoRandom() * 70)
      },
      {
        title: '森の恵み',
        description: 'モモンガの故郷からの贈り物',
        icon: '🌲',
        amount: () => 40 + Math.floor(pseudoRandom() * 60)
      },
      {
        title: '星空ボーナス',
        description: '夜空に願いを込めて',
        icon: '⭐',
        amount: () => 60 + Math.floor(pseudoRandom() * 40)
      }
    ]

    const selectedBonus = bonuses[Math.floor(pseudoRandom() * bonuses.length)]
    
    if (selectedBonus) {
      this.dailyBonus = {
        id: `daily-bonus-${date}`,
        title: selectedBonus.title,
        description: selectedBonus.description,
        icon: selectedBonus.icon,
        amount: selectedBonus.amount(),
        claimed: false,
        date
      }
    }
  }

  // Public methods
  public getDailyBonus(): DailyBonus | null {
    const today = new Date().toISOString().split('T')[0]!
    if (this.dailyBonus && this.dailyBonus.date === today) {
      return this.dailyBonus
    }
    return null
  }

  public claimDailyBonus(): number {
    if (!this.dailyBonus || this.dailyBonus.claimed) {
      return 0
    }

    this.dailyBonus.claimed = true
    this.saveDailyBonus()
    
    logger.info(`Daily bonus claimed: ${this.dailyBonus.amount}P`)
    return this.dailyBonus.amount
  }

  // Ensure daily bonus is properly initialized
  public ensureInitialized(): void {
    const lastBonusDate = localStorage.getItem('last-bonus-date')
    
    if (!lastBonusDate || !this.dailyBonus) {
      this.generateDailyBonus()
    }
  }
}

// Singleton instance
export const economyEventManager = new EconomyEventManager()

// Helper functions
export const getDailyBonus = () => economyEventManager.getDailyBonus()
export const claimDailyBonus = () => economyEventManager.claimDailyBonus()