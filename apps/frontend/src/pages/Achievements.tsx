import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'

type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  type: 'game' | 'social' | 'collection' | 'special' | 'time' | 'money' | 'exploration' | 'mastery'
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'
  requirement: {
    type: 'points' | 'games_played' | 'tweets' | 'omikuji' | 'purchases' | 'files' | 'special' |
          'slots_played' | 'memory_games' | 'sudoku_solved' | 'bullet_hell' | 'avatar_changes' |
          'bank_visits' | 'chatbot_messages' | 'button_clicks' | 'page_views' | 'time_spent' | 'max_points'
    target: number
    current?: number
  }
  unlockedAt?: string
  reward?: {
    momoPay?: number
    title?: string
  }
  hidden?: boolean // 隠し実績
}

const ACHIEVEMENTS: Achievement[] = [
  // === 基本・入門系実績 ===
  {
    id: 'first-game',
    title: '初心者',
    description: '演習林で初めてゲームをプレイした',
    icon: '🌱',
    type: 'game',
    rarity: 'common',
    requirement: { type: 'games_played', target: 1 },
    reward: { momoPay: 50 }
  },
  {
    id: 'first-tweet',
    title: 'はじめの一歩',
    description: '大広間で初めて投稿した',
    icon: '🗨️',
    type: 'social',
    rarity: 'common',
    requirement: { type: 'tweets', target: 1 },
    reward: { momoPay: 30 }
  },
  {
    id: 'first-omikuji',
    title: '運試し',
    description: '初めて御神籤を引いた',
    icon: '🎭',
    type: 'collection',
    rarity: 'common',
    requirement: { type: 'omikuji', target: 1 },
    reward: { momoPay: 20 }
  },
  {
    id: 'first-purchase',
    title: '初回購入',
    description: 'MOMOStoreで初めて購入した',
    icon: '🛒',
    type: 'collection',
    rarity: 'common',
    requirement: { type: 'purchases', target: 1 },
    reward: { momoPay: 100 }
  },

  // === ゲーム系実績 ===
  {
    id: 'game-veteran',
    title: '修行者',
    description: 'ゲームを10回プレイした',
    icon: '⚔️',
    type: 'game',
    rarity: 'rare',
    requirement: { type: 'games_played', target: 10 },
    reward: { momoPay: 200 }
  },
  {
    id: 'game-master',
    title: '守護者',
    description: 'ゲームを50回プレイした',
    icon: '🛡️',
    type: 'game',
    rarity: 'epic',
    requirement: { type: 'games_played', target: 50 },
    reward: { momoPay: 500 }
  },
  {
    id: 'game-legend',
    title: 'ゲームマスター',
    description: 'ゲームを100回プレイした',
    icon: '👑',
    type: 'mastery',
    rarity: 'legendary',
    requirement: { type: 'games_played', target: 100 },
    reward: { momoPay: 1000, title: 'ゲームマスター' }
  },
  {
    id: 'slot-beginner',
    title: 'スロット初心者',
    description: '初めてスロットをプレイした',
    icon: '🎰',
    type: 'game',
    rarity: 'common',
    requirement: { type: 'slots_played', target: 1 },
    reward: { momoPay: 50 }
  },
  {
    id: 'slot-addict',
    title: 'スロット中毒',
    description: 'スロットを50回プレイした',
    icon: '🎲',
    type: 'game',
    rarity: 'rare',
    requirement: { type: 'slots_played', target: 50 },
    reward: { momoPay: 300 }
  },
  {
    id: 'memory-master',
    title: '記憶の達人',
    description: '記憶力ゲームを20回プレイした',
    icon: '🧠',
    type: 'game',
    rarity: 'rare',
    requirement: { type: 'memory_games', target: 20 },
    reward: { momoPay: 250 }
  },
  {
    id: 'sudoku-solver',
    title: '数独マスター',
    description: '数独を10回クリアした',
    icon: '🔢',
    type: 'mastery',
    rarity: 'epic',
    requirement: { type: 'sudoku_solved', target: 10 },
    reward: { momoPay: 400, title: '論理王' }
  },
  {
    id: 'bullet-hell-warrior',
    title: '弾幕戦士',
    description: '演習林で30回修行した',
    icon: '💥',
    type: 'game',
    rarity: 'epic',
    requirement: { type: 'bullet_hell', target: 30 },
    reward: { momoPay: 600 }
  },

  // === ソーシャル系実績 ===
  {
    id: 'social-butterfly',
    title: 'おしゃべり好き',
    description: '大広間で10回投稿した',
    icon: '🦋',
    type: 'social',
    rarity: 'rare',
    requirement: { type: 'tweets', target: 10 },
    reward: { momoPay: 150 }
  },
  {
    id: 'social-influencer',
    title: 'インフルエンサー',
    description: '大広間で50回投稿した',
    icon: '📢',
    type: 'social',
    rarity: 'epic',
    requirement: { type: 'tweets', target: 50 },
    reward: { momoPay: 500 }
  },
  {
    id: 'chatbot-friend',
    title: 'AIフレンド',
    description: 'モモンガくんと20回会話した',
    icon: '🤖',
    type: 'social',
    rarity: 'rare',
    requirement: { type: 'chatbot_messages', target: 20 },
    reward: { momoPay: 200 }
  },
  {
    id: 'chatbot-bestie',
    title: 'AIベストフレンド',
    description: 'モモンガくんと100回会話した',
    icon: '💬',
    type: 'social',
    rarity: 'epic',
    requirement: { type: 'chatbot_messages', target: 100 },
    reward: { momoPay: 500, title: 'おしゃべりマスター' }
  },

  // === 経済・MOMOPay系実績 ===
  {
    id: 'small-fortune',
    title: '小金持ち',
    description: '500MOMOPay貯めた',
    icon: '💰',
    type: 'money',
    rarity: 'common',
    requirement: { type: 'max_points', target: 500 },
    reward: { momoPay: 50 }
  },
  {
    id: 'millionaire',
    title: 'MOMOPay富豪',
    description: '1000MOMOPay貯めた',
    icon: '💎',
    type: 'money',
    rarity: 'rare',
    requirement: { type: 'max_points', target: 1000 },
    reward: { momoPay: 100, title: '富豪' }
  },
  {
    id: 'mogul',
    title: 'MOMOPay大富豪',
    description: '5000MOMOPay貯めた',
    icon: '👑',
    type: 'money',
    rarity: 'epic',
    requirement: { type: 'max_points', target: 5000 },
    reward: { momoPay: 500, title: '大富豪' }
  },
  {
    id: 'billionaire',
    title: 'MOMOPay億万長者',
    description: '10000MOMOPay貯めた',
    icon: '🏰',
    type: 'money',
    rarity: 'legendary',
    requirement: { type: 'max_points', target: 10000 },
    reward: { momoPay: 1000, title: '億万長者' }
  },
  {
    id: 'bank-regular',
    title: 'MOMOBank常連',
    description: 'MOMOBankを10回訪問した',
    icon: '🏦',
    type: 'money',
    rarity: 'rare',
    requirement: { type: 'bank_visits', target: 10 },
    reward: { momoPay: 200 }
  },

  // === コレクション・アーカイブ系実績 ===
  {
    id: 'archivist',
    title: 'アーキビスト',
    description: '宝物庫に5つのアイテムを保存した',
    icon: '📚',
    type: 'collection',
    rarity: 'rare',
    requirement: { type: 'files', target: 5 },
    reward: { momoPay: 200 }
  },
  {
    id: 'master-collector',
    title: 'コレクションマスター',
    description: '宝物庫に20個のアイテムを保存した',
    icon: '🗃️',
    type: 'collection',
    rarity: 'epic',
    requirement: { type: 'files', target: 20 },
    reward: { momoPay: 500, title: 'コレクター' }
  },
  {
    id: 'fortune-seeker',
    title: '占い師',
    description: '御神籤を20回引いた',
    icon: '🔮',
    type: 'collection',
    rarity: 'rare',
    requirement: { type: 'omikuji', target: 20 },
    reward: { momoPay: 300 }
  },
  {
    id: 'fortune-master',
    title: '運命の探求者',
    description: '御神籤を100回引いた',
    icon: '🎴',
    type: 'collection',
    rarity: 'epic',
    requirement: { type: 'omikuji', target: 100 },
    reward: { momoPay: 600, title: '運命探求者' }
  },
  {
    id: 'fashionista',
    title: 'ファッショニスタ',
    description: 'アバターを10回変更した',
    icon: '👗',
    type: 'collection',
    rarity: 'rare',
    requirement: { type: 'avatar_changes', target: 10 },
    reward: { momoPay: 250 }
  },
  {
    id: 'style-icon',
    title: 'スタイルアイコン',
    description: 'アバターを50回変更した',
    icon: '✨',
    type: 'collection',
    rarity: 'epic',
    requirement: { type: 'avatar_changes', target: 50 },
    reward: { momoPay: 500, title: 'スタイリスト' }
  },

  // === 探索・発見系実績 ===
  {
    id: 'explorer',
    title: 'カーニバル探検家',
    description: '全エリアを訪問した',
    icon: '🗺️',
    type: 'exploration',
    rarity: 'epic',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 800, title: '探検家' }
  },
  {
    id: 'page-turner',
    title: 'ページマスター',
    description: '50ページを訪問した',
    icon: '📖',
    type: 'exploration',
    rarity: 'rare',
    requirement: { type: 'page_views', target: 50 },
    reward: { momoPay: 200 }
  },
  {
    id: 'digital-nomad',
    title: 'デジタル遊牧民',
    description: '200ページを訪問した',
    icon: '🌐',
    type: 'exploration',
    rarity: 'epic',
    requirement: { type: 'page_views', target: 200 },
    reward: { momoPay: 400 }
  },

  // === 時間・習慣系実績 ===
  {
    id: 'time-waster',
    title: 'のんびり屋',
    description: '合計30分滞在した',
    icon: '⏰',
    type: 'time',
    rarity: 'common',
    requirement: { type: 'time_spent', target: 30 },
    reward: { momoPay: 50 }
  },
  {
    id: 'time-invested',
    title: '時間投資家',
    description: '合計2時間滞在した',
    icon: '⏳',
    type: 'time',
    rarity: 'rare',
    requirement: { type: 'time_spent', target: 120 },
    reward: { momoPay: 200 }
  },
  {
    id: 'time-master',
    title: 'タイムマスター',
    description: '合計10時間滞在した',
    icon: '🕰️',
    type: 'time',
    rarity: 'epic',
    requirement: { type: 'time_spent', target: 600 },
    reward: { momoPay: 600, title: 'タイムマスター' }
  },

  // === 操作・アクション系実績 ===
  {
    id: 'clicker',
    title: 'クリッカー',
    description: 'ボタンを100回クリックした',
    icon: '👆',
    type: 'mastery',
    rarity: 'common',
    requirement: { type: 'button_clicks', target: 100 },
    reward: { momoPay: 50 }
  },
  {
    id: 'super-clicker',
    title: 'スーパークリッカー',
    description: 'ボタンを500回クリックした',
    icon: '💫',
    type: 'mastery',
    rarity: 'rare',
    requirement: { type: 'button_clicks', target: 500 },
    reward: { momoPay: 200 }
  },
  {
    id: 'ultimate-clicker',
    title: '究極クリッカー',
    description: 'ボタンを2000回クリックした',
    icon: '⚡',
    type: 'mastery',
    rarity: 'epic',
    requirement: { type: 'button_clicks', target: 2000 },
    reward: { momoPay: 500, title: 'クリックマスター' }
  },

  // === 特別・隠し実績 ===
  {
    id: 'early-bird',
    title: '早起きモモンガ',
    description: '午前6時にアクセスした',
    icon: '🌅',
    type: 'special',
    rarity: 'rare',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 300 },
    hidden: true
  },
  {
    id: 'night-owl',
    title: '夜更かしモモンガ',
    description: '深夜2時にアクセスした',
    icon: '🦉',
    type: 'special',
    rarity: 'rare',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 300 },
    hidden: true
  },
  {
    id: 'lucky-777',
    title: 'ラッキー777',
    description: 'ちょうど777MOMOPayを獲得した',
    icon: '🍀',
    type: 'special',
    rarity: 'legendary',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 777, title: 'ラッキー' },
    hidden: true
  },
  {
    id: 'completionist',
    title: 'コンプリート狂',
    description: 'すべてのゲームをプレイした',
    icon: '💯',
    type: 'mastery',
    rarity: 'legendary',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 1500, title: 'コンプリーター' }
  },
  {
    id: 'secret-seeker',
    title: 'シークレットハンター',
    description: '隠し要素を5個発見した',
    icon: '🔍',
    type: 'special',
    rarity: 'mythic',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 2000, title: 'シークレットマスター' },
    hidden: true
  },
  {
    id: 'legend',
    title: '森の伝説',
    description: '全ての実績を解除した',
    icon: '👑',
    type: 'special',
    rarity: 'mythic',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 5000, title: '伝説のモモンガ' }
  }
]

const Achievements: React.FC = () => {
  useSEO(SEO_PRESETS.achievements);
  const { momoPayPoints, favorites } = useAppData()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | Achievement['type']>('all')

  // Load achievements from localStorage and check progress
  useEffect(() => {
    const loadAchievements = () => {
      const savedAchievements = localStorage.getItem('achievements')
      const savedStats = localStorage.getItem('achievement-stats')
      
      let unlockedAchievements: Set<string> = new Set()
      let stats = {
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

      if (savedAchievements) {
        try {
          const parsed = JSON.parse(savedAchievements)
          if (Array.isArray(parsed)) {
            unlockedAchievements = new Set(parsed)
          }
        } catch {
          // Invalid data, start fresh
        }
      }

      if (savedStats) {
        try {
          const parsed = JSON.parse(savedStats)
          stats = { ...stats, ...parsed }
          if (parsed.areasVisited) {
            stats.areasVisited = new Set(parsed.areasVisited)
          }
        } catch {
          // Invalid data, use defaults
        }
      }

      // Update achievements with current progress
      const updatedAchievements = ACHIEVEMENTS.map(achievement => {
        let current = 0
        
        switch (achievement.requirement.type) {
          case 'points':
            current = momoPayPoints
            break
          case 'games_played':
            current = stats.gamesPlayed
            break
          case 'tweets':
            current = stats.tweetsPosted
            break
          case 'omikuji':
            current = stats.omikujiCount
            break
          case 'purchases':
            current = stats.purchasesMade
            break
          case 'files':
            current = favorites.length
            break
          case 'slots_played':
            current = stats.slotsPlayed || 0
            break
          case 'memory_games':
            current = stats.memoryGamesPlayed || 0
            break
          case 'sudoku_solved':
            current = stats.sudokuSolved || 0
            break
          case 'bullet_hell':
            current = stats.bulletHellPlayed || 0
            break
          case 'avatar_changes':
            current = stats.avatarChanges || 0
            break
          case 'bank_visits':
            current = stats.bankVisits || 0
            break
          case 'chatbot_messages':
            current = stats.chatbotMessages || 0
            break
          case 'button_clicks':
            current = stats.buttonClicks || 0
            break
          case 'page_views':
            current = stats.pageViews || 0
            break
          case 'time_spent':
            current = stats.totalTimeSpent || 0
            break
          case 'max_points':
            current = stats.maxMomoPayReached || momoPayPoints
            break
          case 'special':
            if (achievement.id === 'explorer') {
              current = stats.areasVisited.size >= 5 ? 1 : 0
            } else {
              current = 0 // その他の特別実績は手動で管理
            }
            break
        }

        const isUnlocked = unlockedAchievements.has(achievement.id) || current >= achievement.requirement.target

        return {
          ...achievement,
          requirement: {
            ...achievement.requirement,
            current
          },
          unlockedAt: isUnlocked && !unlockedAchievements.has(achievement.id) 
            ? new Date().toISOString() 
            : (unlockedAchievements.has(achievement.id) ? 'previously-unlocked' : undefined)
        }
      })

      // Check for newly unlocked achievements
      const newlyUnlocked = updatedAchievements.filter(achievement => 
        !unlockedAchievements.has(achievement.id) && 
        (achievement.requirement.current || 0) >= achievement.requirement.target
      )

      if (newlyUnlocked.length > 0) {
        // Award rewards and save newly unlocked achievements
        newlyUnlocked.forEach(achievement => {
          unlockedAchievements.add(achievement.id)
          if (achievement.reward?.momoPay) {
            // Add MOMOPay reward (you might want to add this through AppDataContext)
            const currentPoints = parseInt(localStorage.getItem('momoPayPoints') || '0')
            localStorage.setItem('momoPayPoints', (currentPoints + achievement.reward.momoPay).toString())
          }
        })
        
        localStorage.setItem('achievements', JSON.stringify(Array.from(unlockedAchievements)))
        
        // Show notification for newly unlocked achievements
        newlyUnlocked.forEach(achievement => {
          setTimeout(() => {
            alert(`🎉 実績解除！\n\n${achievement.icon} ${achievement.title}\n${achievement.description}\n\n報酬: ${achievement.reward?.momoPay || 0}MOMOPay`)
          }, 500)
        })
      }

      setAchievements(updatedAchievements)
    }

    loadAchievements()
  }, [momoPayPoints, favorites.length])

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'mythic': return '#ff1744'    // 赤
      case 'legendary': return '#ffd700' // 金
      case 'epic': return '#9c27b0'      // 紫
      case 'rare': return '#2196f3'      // 青
      case 'common': return '#9e9e9e'    // 灰色
      default: return '#9e9e9e'
    }
  }

  const getTypeColor = (type: Achievement['type']): string => {
    switch (type) {
      case 'game': return '#4caf50'       // 緑
      case 'social': return '#ff9800'     // オレンジ
      case 'collection': return '#2196f3' // 青
      case 'special': return '#9c27b0'    // 紫
      case 'time': return '#607d8b'       // 青灰色
      case 'money': return '#ffc107'      // 黄色
      case 'exploration': return '#795548' // 茶色
      case 'mastery': return '#e91e63'    // ピンク
      default: return '#666'
    }
  }

  const filteredAchievements = achievements.filter(achievement => {
    const isUnlocked = (achievement.requirement.current || 0) >= achievement.requirement.target
    
    if (filter === 'unlocked' && !isUnlocked) return false
    if (filter === 'locked' && isUnlocked) return false
    if (typeFilter !== 'all' && achievement.type !== typeFilter) return false
    
    return true
  })

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => (a.requirement.current || 0) >= a.requirement.target).length,
    byType: {
      game: achievements.filter(a => a.type === 'game').length,
      social: achievements.filter(a => a.type === 'social').length,
      collection: achievements.filter(a => a.type === 'collection').length,
      special: achievements.filter(a => a.type === 'special').length,
    }
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🏆 実績・トロフィー 🏆
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(24px, 6vw)', 
        color: '#c8e6c9'
      }}>
        カーニバルでの足跡を記録しよう
      </div>

      {/* 統計情報 */}
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.1))',
        borderColor: '#ffc107',
        padding: 'min(20px, 5vw)',
        marginBottom: 'min(24px, 6vw)',
        maxWidth: '600px',
        margin: '0 auto min(24px, 6vw) auto'
      }}>
        <div className="comic-text font-title-sm" style={{ 
          color: '#fff3e0',
          marginBottom: '12px'
        }}>
          進捗状況
        </div>
        <div className="comic-text font-body-md" style={{ 
          color: '#c8e6c9'
        }}>
          解除済み: {stats.unlocked}/{stats.total} ({Math.round((stats.unlocked / stats.total) * 100)}%)
        </div>
      </div>

      {/* フィルター */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(12px, 3vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginBottom: 'min(32px, 8vw)'
      }}>
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="comic-button font-button-sm"
            style={{
              background: filter === f 
                ? 'linear-gradient(45deg, #ffc107, #ffb300)' 
                : 'linear-gradient(45deg, #666, #555)',
              color: filter === f ? '#000' : '#ccc',
              borderColor: filter === f ? '#f57f17' : '#333',
              transform: filter === f ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {f === 'all' ? '全て' : f === 'unlocked' ? '解除済み' : '未解除'}
          </button>
        ))}
        
        {(['all', 'game', 'social', 'collection', 'special', 'time', 'money', 'exploration', 'mastery'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className="comic-button font-button-sm"
            style={{
              background: typeFilter === t 
                ? `linear-gradient(45deg, ${getTypeColor(t === 'all' ? 'game' : t)}, ${getTypeColor(t === 'all' ? 'game' : t)}dd)` 
                : 'linear-gradient(45deg, #666, #555)',
              color: 'white',
              borderColor: typeFilter === t ? getTypeColor(t === 'all' ? 'game' : t) : '#333',
              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
              padding: 'clamp(6px 10px, 1.5vw 2.5vw, 8px 12px)'
            }}
          >
            {t === 'all' ? '全種' : 
             t === 'game' ? 'ゲーム' :
             t === 'social' ? 'ソーシャル' :
             t === 'collection' ? 'コレクション' :
             t === 'special' ? '特別' :
             t === 'time' ? '時間' :
             t === 'money' ? '経済' :
             t === 'exploration' ? '探索' : 'マスター'}
          </button>
        ))}
      </div>

      {/* 実績一覧 */}
      <div className="achievements-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 90vw), 1fr))', 
        gap: 'min(20px, 5vw)', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 10px'
      }}>
        {filteredAchievements.map((achievement) => {
          const current = achievement.requirement.current || 0
          const isUnlocked = current >= achievement.requirement.target
          const progress = Math.min((current / achievement.requirement.target) * 100, 100)
          
          return (
            <div key={achievement.id} className="comic-card" style={{
              background: isUnlocked
                ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))'
                : 'linear-gradient(135deg, rgba(66, 66, 66, 0.3), rgba(97, 97, 97, 0.2))',
              padding: 'min(20px, 5vw)',
              borderColor: isUnlocked ? getRarityColor(achievement.rarity) : '#666',
              opacity: isUnlocked ? 1 : 0.7,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* レア度バッジ */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: getRarityColor(achievement.rarity),
                color: achievement.rarity === 'common' ? '#000' : '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {achievement.rarity.toUpperCase()}
              </div>

              <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', marginBottom: '12px' }}>
                {achievement.icon}
              </div>
              
              <div className="comic-text font-title-sm" style={{ 
                color: '#fff3e0',
                marginBottom: '8px'
              }}>
                {achievement.title}
              </div>
              
              <div className="comic-text font-body-sm" style={{ 
                color: '#c8e6c9',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}>
                {achievement.description}
              </div>

              {/* 進捗バー */}
              {!isUnlocked && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  marginBottom: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: `linear-gradient(45deg, ${getRarityColor(achievement.rarity)}, ${getRarityColor(achievement.rarity)}aa)`,
                    height: '100%',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}

              <div className="comic-text font-body-xs" style={{
                color: isUnlocked ? '#4caf50' : '#ffc107'
              }}>
                {isUnlocked 
                  ? `✅ 解除済み ${achievement.reward?.momoPay ? `(+${achievement.reward.momoPay}P)` : ''}`
                  : `進捗: ${current}/${achievement.requirement.target}`
                }
              </div>
            </div>
          )
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="comic-text font-body-lg" style={{
          color: '#c8e6c9',
          padding: 'min(40px, 10vw)'
        }}>
          該当する実績がありません
        </div>
      )}

      {/* ナビゲーション */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🏠 拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Achievements