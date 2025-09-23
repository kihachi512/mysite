import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'

type Achievement = {
  id: string
  title: string
  description: string
  icon: string
  type: 'game' | 'social' | 'collection' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirement: {
    type: 'points' | 'games_played' | 'tweets' | 'omikuji' | 'purchases' | 'files' | 'special'
    target: number
    current?: number
  }
  unlockedAt?: string
  reward?: {
    momoPay?: number
    title?: string
  }
}

const ACHIEVEMENTS: Achievement[] = [
  // ゲーム系実績
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
    id: 'game-veteran',
    title: '修行者',
    description: '演習林で10回ゲームをプレイした',
    icon: '⚔️',
    type: 'game',
    rarity: 'rare',
    requirement: { type: 'games_played', target: 10 },
    reward: { momoPay: 200 }
  },
  {
    id: 'game-master',
    title: '守護者',
    description: '演習林で50回ゲームをプレイした',
    icon: '🛡️',
    type: 'game',
    rarity: 'epic',
    requirement: { type: 'games_played', target: 50 },
    reward: { momoPay: 500 }
  },
  {
    id: 'millionaire',
    title: 'MOMOPay富豪',
    description: '1000MOMOPay以上を獲得した',
    icon: '💎',
    type: 'collection',
    rarity: 'epic',
    requirement: { type: 'points', target: 1000 },
    reward: { title: '富豪' }
  },

  // ソーシャル系実績
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
    id: 'social-butterfly',
    title: 'おしゃべり好き',
    description: '大広間で10回投稿した',
    icon: '🦋',
    type: 'social',
    rarity: 'rare',
    requirement: { type: 'tweets', target: 10 },
    reward: { momoPay: 150 }
  },

  // コレクション系実績
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
    id: 'fortune-seeker',
    title: '占い師',
    description: '御神籤を20回引いた',
    icon: '🔮',
    type: 'collection',
    rarity: 'rare',
    requirement: { type: 'omikuji', target: 20 },
    reward: { momoPay: 300 }
  },

  // 購入系実績
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

  // ファイル系実績
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

  // 特別実績
  {
    id: 'explorer',
    title: 'カーニバル探検家',
    description: '全エリアを訪問した',
    icon: '🗺️',
    type: 'special',
    rarity: 'legendary',
    requirement: { type: 'special', target: 1 },
    reward: { momoPay: 1000, title: '探検家' }
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
        areasVisited: new Set<string>()
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
          case 'special':
            if (achievement.id === 'explorer') {
              current = stats.areasVisited.size >= 5 ? 1 : 0
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
        achievement.requirement.current! >= achievement.requirement.target
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
      case 'legendary': return '#ffd700'
      case 'epic': return '#9c27b0'
      case 'rare': return '#2196f3'
      case 'common': return '#9e9e9e'
      default: return '#9e9e9e'
    }
  }

  const getTypeColor = (type: Achievement['type']): string => {
    switch (type) {
      case 'game': return '#4caf50'
      case 'social': return '#ff9800'
      case 'collection': return '#2196f3'
      case 'special': return '#9c27b0'
      default: return '#666'
    }
  }

  const filteredAchievements = achievements.filter(achievement => {
    const isUnlocked = achievement.requirement.current! >= achievement.requirement.target
    
    if (filter === 'unlocked' && !isUnlocked) return false
    if (filter === 'locked' && isUnlocked) return false
    if (typeFilter !== 'all' && achievement.type !== typeFilter) return false
    
    return true
  })

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.requirement.current! >= a.requirement.target).length,
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
        
        {(['all', 'game', 'social', 'collection', 'special'] as const).map(t => (
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
            }}
          >
            {t === 'all' ? '全種' : 
             t === 'game' ? 'ゲーム' :
             t === 'social' ? 'ソーシャル' :
             t === 'collection' ? 'コレクション' : '特別'}
          </button>
        ))}
      </div>

      {/* 実績一覧 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 90vw), 1fr))', 
        gap: 'min(20px, 5vw)', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '0 10px'
      }}>
        {filteredAchievements.map((achievement) => {
          const isUnlocked = achievement.requirement.current! >= achievement.requirement.target
          const progress = Math.min((achievement.requirement.current! / achievement.requirement.target) * 100, 100)
          
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
                  : `進捗: ${achievement.requirement.current}/${achievement.requirement.target}`
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