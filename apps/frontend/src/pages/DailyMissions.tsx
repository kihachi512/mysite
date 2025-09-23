import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO } from '../hooks/useSEO'
import { trackAreaVisited, AREAS } from '../utils/achievements'
import { getEarningMultiplier } from '../utils/economyEvents'

type MissionType = 'play_games' | 'earn_momopay' | 'post_tweet' | 'omikuji' | 'login' | 'achievements' | 'files'

type DailyMission = {
  id: string
  title: string
  description: string
  icon: string
  type: MissionType
  target: number
  current: number
  reward: number
  completed: boolean
  difficulty: 'easy' | 'normal' | 'hard'
}

type WeeklyEvent = {
  id: string
  title: string
  description: string
  icon: string
  startDate: string
  endDate: string
  multiplier: number
  affectedTypes: MissionType[]
  active: boolean
}

const DailyMissions: React.FC = () => {
  useSEO({
    title: 'デイリーミッション',
    description: '毎日更新される挑戦課題をクリアしてMOMOPayを獲得！ウィークリーイベントでボーナス報酬も。継続プレイで大きな報酬を手に入れよう。',
    keywords: 'デイリーミッション,日課,課題,チャレンジ,MOMOPay,報酬,イベント,継続プレイ',
    ogTitle: 'デイリーミッション | モモンガカーニバル',
    ogDescription: '毎日の挑戦課題をクリアしてMOMOPayを獲得！ウィークリーイベントも開催中。'
  });

  const { momoPayPoints, addMomoPayPoints, favorites } = useAppData()
  const [missions, setMissions] = useState<DailyMission[]>([])
  const [weeklyEvent, setWeeklyEvent] = useState<WeeklyEvent | null>(null)
  const [consecutiveDays, setConsecutiveDays] = useState(0)
  // const [lastLoginDate] = useState<string>('') // 未使用のため削除

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.GAMES)
  }, [])

  // Generate daily missions
  const generateDailyMissions = (date: string): DailyMission[] => {
    const seed = date.split('-').join('')
    const pseudoRandom = (index: number) => {
      const hash = parseInt(seed) + index * 7919
      return (hash * 9301 + 49297) % 233280 / 233280
    }

    const missionTemplates = [
      {
        type: 'login' as MissionType,
        title: 'ログインボーナス',
        description: 'カーニバルにログインする',
        icon: '📅',
        target: 1,
        rewards: { easy: 50, normal: 50, hard: 50 }
      },
      {
        type: 'play_games' as MissionType,
        title: 'ゲームマスター',
        description: 'ゲームをプレイする',
        icon: '🎮',
        target: { easy: 3, normal: 5, hard: 10 },
        rewards: { easy: 100, normal: 200, hard: 400 }
      },
      {
        type: 'earn_momopay' as MissionType,
        title: 'コインコレクター',
        description: 'MOMOPayを獲得する',
        icon: '💰',
        target: { easy: 100, normal: 300, hard: 600 },
        rewards: { easy: 80, normal: 150, hard: 300 }
      },
      {
        type: 'post_tweet' as MissionType,
        title: 'おしゃべり好き',
        description: '大広間で投稿する',
        icon: '💬',
        target: { easy: 1, normal: 3, hard: 5 },
        rewards: { easy: 60, normal: 120, hard: 200 }
      },
      {
        type: 'omikuji' as MissionType,
        title: '運試し',
        description: '御神籤を引く',
        icon: '🎭',
        target: { easy: 2, normal: 5, hard: 10 },
        rewards: { easy: 70, normal: 150, hard: 250 }
      },
      {
        type: 'files' as MissionType,
        title: 'アーキビスト',
        description: '宝物庫にファイルを保存する',
        icon: '📁',
        target: { easy: 1, normal: 2, hard: 3 },
        rewards: { easy: 90, normal: 180, hard: 300 }
      }
    ]

    const difficulties: ('easy' | 'normal' | 'hard')[] = ['easy', 'normal', 'hard']
    const selectedMissions: DailyMission[] = []

    // Always include login bonus
    const loginTemplate = missionTemplates[0]
    if (loginTemplate) {
      selectedMissions.push({
        id: 'login-' + date,
        title: loginTemplate.title,
        description: loginTemplate.description,
        icon: loginTemplate.icon,
        type: loginTemplate.type,
        target: typeof loginTemplate.target === 'number' ? loginTemplate.target : loginTemplate.target.easy,
        current: 0,
        reward: loginTemplate.rewards.easy,
        completed: false,
        difficulty: 'easy'
      })
    }

    // Add 3-4 random missions with varying difficulties
    const otherTemplates = missionTemplates.slice(1)
    const missionCount = 3 + Math.floor(pseudoRandom(0) * 2) // 3-4 missions

    for (let i = 0; i < missionCount; i++) {
      const templateIndex = Math.floor(pseudoRandom(i + 1) * otherTemplates.length)
      const template = otherTemplates[templateIndex]
      if (!template) continue
      
      const difficultyIndex = Math.floor(pseudoRandom(i + 10) * 3)
      const difficulty = difficulties[difficultyIndex]
      if (!difficulty) continue

      const target = typeof template.target === 'number' ? template.target : template.target[difficulty]
      const reward = template.rewards[difficulty]

      selectedMissions.push({
        id: `${template.type}-${difficulty}-${date}`,
        title: template.title,
        description: `${template.description} (${target}回)`,
        icon: template.icon,
        type: template.type,
        target,
        current: 0,
        reward,
        completed: false,
        difficulty
      })
    }

    return selectedMissions
  }

  // Generate weekly event
  const generateWeeklyEvent = (): WeeklyEvent | null => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
    
    const events = [
      {
        id: 'game-fever',
        title: 'ゲームフィーバー',
        description: 'ゲーム系ミッションの報酬が2倍！',
        icon: '🎮',
        multiplier: 2,
        affectedTypes: ['play_games' as MissionType, 'earn_momopay' as MissionType]
      },
      {
        id: 'social-hour',
        title: 'ソーシャルアワー',
        description: '交流系ミッションの報酬が1.5倍！',
        icon: '💬',
        multiplier: 1.5,
        affectedTypes: ['post_tweet' as MissionType]
      },
      {
        id: 'fortune-week',
        title: '開運ウィーク',
        description: '御神籤ミッションの報酬が3倍！',
        icon: '🍀',
        multiplier: 3,
        affectedTypes: ['omikuji' as MissionType]
      },
      {
        id: 'collection-boost',
        title: 'コレクションブースト',
        description: 'ファイル系ミッションの報酬が2倍！',
        icon: '📚',
        multiplier: 2,
        affectedTypes: ['files' as MissionType]
      }
    ]

    // Use week number to determine event
    const weekNumber = Math.floor((now.getTime() - startOfWeek.getTime()) / (7 * 24 * 60 * 60 * 1000))
    const eventIndex = weekNumber % events.length
    const selectedEvent = events[eventIndex]

    if (!selectedEvent) {
      return null
    }

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const result: WeeklyEvent = {
      id: selectedEvent.id,
      title: selectedEvent.title,
      description: selectedEvent.description,
      icon: selectedEvent.icon,
      startDate: startOfWeek.toISOString().split('T')[0]!,
      endDate: endOfWeek.toISOString().split('T')[0]!,
      multiplier: selectedEvent.multiplier,
      affectedTypes: selectedEvent.affectedTypes,
      active: true
    }
    
    return result
  }

  // Load missions and check progress
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]!
    const savedData = localStorage.getItem('daily-missions')
    const lastLoginData = localStorage.getItem('login-streak')

    let dailyMissions = generateDailyMissions(today)
    let streak = 0
    let lastLogin = ''

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        if (parsed.date === today) {
          dailyMissions = parsed.missions || dailyMissions
        }
      } catch (error) {
        console.error('Failed to load daily missions:', error)
      }
    }

    if (lastLoginData) {
      try {
        const parsed = JSON.parse(lastLoginData)
        lastLogin = parsed.lastLoginDate || ''
        streak = parsed.consecutiveDays || 0

        // Check if login streak should continue
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]!

        if (lastLogin === today) {
          // Already logged in today
        } else if (lastLogin === yesterdayStr) {
          // Logged in yesterday, continue streak
          streak += 1
        } else if (lastLogin) {
          // Streak broken
          streak = 1
        } else {
          // First login
          streak = 1
        }

        // Mark login mission as completed if not already
        const loginMission = dailyMissions.find(m => m.type === 'login')
        if (loginMission && lastLogin !== today) {
          loginMission.current = 1
          loginMission.completed = true
        }

        // Update login data
        const newLoginData = {
          lastLoginDate: today,
          consecutiveDays: streak
        }
        localStorage.setItem('login-streak', JSON.stringify(newLoginData))

      } catch (error) {
        console.error('Failed to load login streak:', error)
        streak = 1
      }
    } else {
      // First time login
      streak = 1
      const newLoginData = {
        lastLoginDate: today,
        consecutiveDays: streak
      }
      localStorage.setItem('login-streak', JSON.stringify(newLoginData))

      // Mark login mission as completed
      const loginMission = dailyMissions.find(m => m.type === 'login')
      if (loginMission) {
        loginMission.current = 1
        loginMission.completed = true
      }
    }

    // Update mission progress based on current data
    const stats = JSON.parse(localStorage.getItem('achievement-stats') || '{}')
    
    dailyMissions.forEach(mission => {
      switch (mission.type) {
        case 'play_games':
          mission.current = Math.min(stats.gamesPlayed || 0, mission.target)
          break
        case 'earn_momopay':
          mission.current = Math.min(momoPayPoints, mission.target)
          break
        case 'post_tweet':
          mission.current = Math.min(stats.tweetsPosted || 0, mission.target)
          break
        case 'omikuji':
          mission.current = Math.min(stats.omikujiCount || 0, mission.target)
          break
        case 'files':
          mission.current = Math.min(favorites.length, mission.target)
          break
      }

      if (mission.current >= mission.target && !mission.completed) {
        mission.completed = true
      }
    })

    setMissions(dailyMissions)
    setConsecutiveDays(streak)
    // setLastLoginDate(today) - 削除（使用されていない）
    setWeeklyEvent(generateWeeklyEvent())

    // Save missions
    const missionData = {
      date: today,
      missions: dailyMissions
    }
    localStorage.setItem('daily-missions', JSON.stringify(missionData))

  }, [momoPayPoints, favorites.length])

  // Claim mission reward
  const claimReward = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId)
    if (!mission || !mission.completed) return

    let reward = mission.reward

    // Apply weekly event multiplier
    if (weeklyEvent && weeklyEvent.affectedTypes.includes(mission.type)) {
      reward = Math.floor(reward * weeklyEvent.multiplier)
    }

    // Apply economy event multiplier
    const economyMultiplier = getEarningMultiplier('missions')
    reward = Math.floor(reward * economyMultiplier)

    // Apply consecutive days bonus
    const streakBonus = Math.min(consecutiveDays * 0.1, 0.5) // Max 50% bonus
    reward = Math.floor(reward * (1 + streakBonus))

    addMomoPayPoints(reward)

    // Mark mission as claimed
    const updatedMissions = missions.map(m => 
      m.id === missionId ? { ...m, completed: true, current: m.target } : m
    )
    
    setMissions(updatedMissions)

    // Save updated missions
    const today = new Date().toISOString().split('T')[0]
    const missionData = {
      date: today,
      missions: updatedMissions
    }
    localStorage.setItem('daily-missions', JSON.stringify(missionData))

    alert(`🎉 ミッション完了！\n\n${mission.title}\n獲得MOMOPay: ${reward}\n\n${streakBonus > 0 ? `連続ログインボーナス: +${Math.round(streakBonus * 100)}%` : ''}`)
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#4caf50'
      case 'normal': return '#ff9800'
      case 'hard': return '#f44336'
      default: return '#666'
    }
  }

  // Get progress percentage
  const getProgress = (mission: DailyMission): number => {
    return Math.min((mission.current / mission.target) * 100, 100)
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        📋 デイリーミッション 🎯
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(24px, 6vw)', 
        color: '#c8e6c9'
      }}>
        毎日の挑戦課題をクリアしよう！
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 10px' }}>
        {/* Login Streak */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))',
          borderColor: '#ffc107',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '8px'
          }}>
            🔥 連続ログイン: {consecutiveDays}日
          </div>
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9'
          }}>
            継続ログインでミッション報酬にボーナス！（現在: +{Math.min(consecutiveDays * 10, 50)}%）
          </div>
        </div>

        {/* Weekly Event */}
        {weeklyEvent && (
          <div className="comic-card" style={{
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(123, 31, 162, 0.2))',
            borderColor: '#9c27b0',
            padding: 'min(20px, 5vw)',
            marginBottom: 'min(24px, 6vw)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{weeklyEvent.icon}</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '8px'
            }}>
              {weeklyEvent.title}
            </div>
            <div className="comic-text font-body-sm" style={{ 
              color: '#c8e6c9'
            }}>
              {weeklyEvent.description}
            </div>
          </div>
        )}

        {/* Daily Missions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(350px, 90vw), 1fr))', 
          gap: 'min(20px, 5vw)', 
          marginBottom: 'min(40px, 10vw)'
        }}>
          {missions.map((mission) => {
            const progress = getProgress(mission)
            const isCompleted = mission.completed
            const canClaim = mission.current >= mission.target && !isCompleted

            let reward = mission.reward
            if (weeklyEvent && weeklyEvent.affectedTypes.includes(mission.type)) {
              reward = Math.floor(reward * weeklyEvent.multiplier)
            }
            const streakBonus = Math.min(consecutiveDays * 0.1, 0.5)
            reward = Math.floor(reward * (1 + streakBonus))

            return (
              <div key={mission.id} className="comic-card" style={{
                background: isCompleted
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))'
                  : canClaim
                  ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))'
                  : 'linear-gradient(135deg, rgba(66, 66, 66, 0.3), rgba(97, 97, 97, 0.2))',
                padding: 'min(20px, 5vw)',
                borderColor: isCompleted ? '#4caf50' : canClaim ? '#ffc107' : '#666',
                position: 'relative',
                opacity: isCompleted ? 0.8 : 1
              }}>
                {/* Difficulty badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: getDifficultyColor(mission.difficulty),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  {mission.difficulty.toUpperCase()}
                </div>

                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '12px' }}>
                  {mission.icon}
                </div>
                
                <div className="comic-text font-title-sm" style={{ 
                  color: '#fff3e0',
                  marginBottom: '8px'
                }}>
                  {mission.title}
                </div>
                
                <div className="comic-text font-body-sm" style={{ 
                  color: '#c8e6c9',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {mission.description}
                </div>

                {/* Progress bar */}
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  height: '8px',
                  marginBottom: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    background: `linear-gradient(45deg, ${getDifficultyColor(mission.difficulty)}, ${getDifficultyColor(mission.difficulty)}aa)`,
                    height: '100%',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <div className="comic-text font-body-sm" style={{
                  color: '#c8e6c9',
                  marginBottom: '12px'
                }}>
                  進捗: {mission.current}/{mission.target}
                </div>

                <div className="comic-text font-body-sm" style={{
                  color: '#ffd93d',
                  marginBottom: '16px'
                }}>
                  報酬: {reward}MOMOPay
                  {weeklyEvent && weeklyEvent.affectedTypes.includes(mission.type) && (
                    <span style={{ color: '#9c27b0' }}> (イベント×{weeklyEvent.multiplier})</span>
                  )}
                  {streakBonus > 0 && (
                    <span style={{ color: '#ffc107' }}> (連続+{Math.round(streakBonus * 100)}%)</span>
                  )}
                </div>

                {isCompleted ? (
                  <div className="comic-text font-body-sm" style={{
                    color: '#4caf50',
                    fontWeight: 'bold'
                  }}>
                    ✅ 完了済み
                  </div>
                ) : canClaim ? (
                  <button
                    onClick={() => claimReward(mission.id)}
                    className="comic-button font-button-sm"
                    style={{
                      background: 'linear-gradient(45deg, #ffc107, #ffb300)',
                      color: '#000',
                      borderColor: '#f57f17',
                      width: '100%'
                    }}
                  >
                    🎁 報酬を受け取る
                  </button>
                ) : (
                  <div className="comic-text font-body-sm" style={{
                    color: '#999'
                  }}>
                    📊 進行中...
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
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

export default DailyMissions