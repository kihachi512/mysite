// Economy events system for MOMOPay circulation
import { logger } from './logger'

export type EconomyEvent = {
  id: string
  title: string
  description: string
  icon: string
  type: 'sale' | 'bonus' | 'multiplier' | 'special'
  startDate: string
  endDate: string
  active: boolean
  effects: {
    discountPercentage?: number // For sales
    bonusMultiplier?: number // For earning bonuses
    affectedItems?: string[] // Which items/activities are affected
    specialOffer?: {
      itemId: string
      originalPrice: number
      salePrice: number
    }
  }
}

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
  private events: EconomyEvent[] = []
  private dailyBonus: DailyBonus | null = null

  constructor() {
    this.loadEvents()
    this.generateDailyEvents()
  }

  private loadEvents(): void {
    try {
      const saved = localStorage.getItem('economy-events')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.events = parsed.events || []
        this.dailyBonus = parsed.dailyBonus || null
      }
    } catch (error) {
      logger.error('Failed to load economy events:', error)
    }
  }

  private saveEvents(): void {
    try {
      const data = {
        events: this.events,
        dailyBonus: this.dailyBonus,
        lastUpdate: new Date().toISOString()
      }
      localStorage.setItem('economy-events', JSON.stringify(data))
    } catch (error) {
      logger.error('Failed to save economy events:', error)
    }
  }

  private generateDailyEvents(): void {
    const today = new Date().toISOString().split('T')[0]!
    
    // Check if we need to generate new daily events
    const lastEventDate = localStorage.getItem('last-event-date')
    if (lastEventDate === today) {
      return // Already generated for today
    }

    this.generateDailyBonus(today)
    this.generateWeeklyEvent(today)
    
    localStorage.setItem('last-event-date', today)
    this.saveEvents()
  }

  private generateDailyBonus(date: string): void {
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

  private generateWeeklyEvent(date: string): void {
    const now = new Date(date)
    const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))
    
    const weeklyEvents = [
      {
        id: 'avatar-sale',
        title: 'コスチュームセール',
        description: 'アバターアイテムが30%OFF！',
        icon: '👗',
        type: 'sale' as const,
        effects: {
          discountPercentage: 30,
          affectedItems: ['avatar-items']
        }
      },
      {
        id: 'earning-boost',
        title: 'MOMOPay倍増デー',
        description: 'ゲーム報酬が2倍！',
        icon: '💰',
        type: 'multiplier' as const,
        effects: {
          bonusMultiplier: 2,
          affectedItems: ['games', 'missions']
        }
      },
      {
        id: 'investment-bonus',
        title: '投資ボーナス',
        description: '投資の利回りが1.5倍！',
        icon: '📈',
        type: 'bonus' as const,
        effects: {
          bonusMultiplier: 1.5,
          affectedItems: ['investments']
        }
      },
      {
        id: 'special-lottery',
        title: 'レアアイテム抽選',
        description: '特別なアイテムが当たるかも',
        icon: '🎰',
        type: 'special' as const,
        effects: {
          specialOffer: {
            itemId: 'crown',
            originalPrice: 800,
            salePrice: 400
          }
        }
      }
    ]

    const eventIndex = weekNumber % weeklyEvents.length
    const selectedEvent = weeklyEvents[eventIndex]

    if (!selectedEvent) {
      return // No event to generate
    }

    const startDate = new Date(now)
    startDate.setDate(now.getDate() - now.getDay()) // Start of week
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 7) // End of week

    const weeklyEvent: EconomyEvent = {
      id: selectedEvent.id,
      title: selectedEvent.title,
      description: selectedEvent.description,
      icon: selectedEvent.icon,
      type: selectedEvent.type,
      startDate: startDate.toISOString().split('T')[0]!,
      endDate: endDate.toISOString().split('T')[0]!,
      active: true,
      effects: selectedEvent.effects
    }

    // Remove old events and add new one
    this.events = this.events.filter(event => event.endDate >= date)
    this.events.push(weeklyEvent)
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
    this.saveEvents()
    
    logger.info(`Daily bonus claimed: ${this.dailyBonus.amount}P`)
    return this.dailyBonus.amount
  }

  public getActiveEvents(): EconomyEvent[] {
    const today = new Date().toISOString().split('T')[0]!
    return this.events.filter(event => 
      event.active && 
      event.startDate <= today && 
      event.endDate >= today
    )
  }

  public getDiscountPrice(originalPrice: number, category: string): number {
    const activeEvents = this.getActiveEvents()
    
    for (const event of activeEvents) {
      if (event.type === 'sale' && 
          event.effects.discountPercentage &&
          event.effects.affectedItems?.includes(category)) {
        return Math.floor(originalPrice * (100 - event.effects.discountPercentage) / 100)
      }
    }
    
    return originalPrice
  }

  public getEarningMultiplier(category: string): number {
    const activeEvents = this.getActiveEvents()
    
    for (const event of activeEvents) {
      if ((event.type === 'multiplier' || event.type === 'bonus') && 
          event.effects.bonusMultiplier &&
          event.effects.affectedItems?.includes(category)) {
        return event.effects.bonusMultiplier
      }
    }
    
    return 1
  }

  public hasSpecialOffer(itemId: string): { original: number; sale: number } | null {
    const activeEvents = this.getActiveEvents()
    
    for (const event of activeEvents) {
      if (event.type === 'special' && 
          event.effects.specialOffer &&
          event.effects.specialOffer.itemId === itemId) {
        return {
          original: event.effects.specialOffer.originalPrice,
          sale: event.effects.specialOffer.salePrice
        }
      }
    }
    
    return null
  }

  // Force refresh events (for testing or manual refresh)
  public refreshEvents(): void {
    localStorage.removeItem('last-event-date')
    this.generateDailyEvents()
  }

  // Ensure events are properly initialized
  public ensureInitialized(): void {
    const lastEventDate = localStorage.getItem('last-event-date')
    
    if (!lastEventDate || !this.dailyBonus) {
      this.generateDailyEvents()
    }
  }
}

// Singleton instance
export const economyEventManager = new EconomyEventManager()

// Helper functions
export const getDailyBonus = () => economyEventManager.getDailyBonus()
export const claimDailyBonus = () => economyEventManager.claimDailyBonus()
export const getActiveEvents = () => economyEventManager.getActiveEvents()
export const getDiscountPrice = (price: number, category: string) => economyEventManager.getDiscountPrice(price, category)
export const getEarningMultiplier = (category: string) => economyEventManager.getEarningMultiplier(category)
export const hasSpecialOffer = (itemId: string) => economyEventManager.hasSpecialOffer(itemId)