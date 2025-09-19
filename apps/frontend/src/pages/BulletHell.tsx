import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'

type Player = { x: number; y: number; r: number; fireRate: number; power: number; displayR?: number }
type Bullet = { x: number; y: number; vx: number; vy: number; r: number; from: 'player' | 'enemy'; power?: number }
type Enemy = { x: number; y: number; r: number; hp: number; pattern: number; maxHp: number; isBoss?: boolean; bossPhase?: number }
type PowerUp = { x: number; y: number; r: number; type: 'fireRate' | 'power' | 'shield'; collected: boolean }

// ガチャシステム用の型定義
type GachaItem = {
  id: string
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  type: 'weapon' | 'shield' | 'special'
  effect: {
    fireRate?: number
    power?: number
    shield?: number
    special?: string
  }
  icon: string
}

type PlayerInventory = {
  items: GachaItem[]
  equippedWeapon?: GachaItem
  equippedShield?: GachaItem
  equippedSpecial?: GachaItem
}

// ガチャアイテムデータ（森・モモンガテーマ）
const GACHA_ITEMS: GachaItem[] = [
  // 武器 (Weapons) - 森の武器シリーズ
  { id: 'w1', name: 'どんぐりシューター', description: '連射速度+0.5', rarity: 'common', type: 'weapon', effect: { fireRate: 0.5 }, icon: '🌰' },
  { id: 'w2', name: '森の雷撃砲', description: '威力+1.0', rarity: 'rare', type: 'weapon', effect: { power: 1.0 }, icon: '⚡' },
  { id: 'w3', name: 'ツインリーフブラスター', description: '連射+0.8, 威力+0.5', rarity: 'epic', type: 'weapon', effect: { fireRate: 0.8, power: 0.5 }, icon: '🍃' },
  { id: 'w4', name: 'モモンガ究極奥義砲', description: '全能力大幅強化', rarity: 'legendary', type: 'weapon', effect: { fireRate: 1.5, power: 2.0 }, icon: '🐿️' },
  
  // シールド (Shields) - 森の守りシリーズ
  { id: 's1', name: '木の皮バリア', description: 'シールド+5', rarity: 'common', type: 'shield', effect: { shield: 5 }, icon: '🌳' },
  { id: 's2', name: '森の加護', description: 'シールド+10', rarity: 'rare', type: 'shield', effect: { shield: 10 }, icon: '🌲' },
  { id: 's3', name: '古樹の盾', description: 'シールド+20', rarity: 'epic', type: 'shield', effect: { shield: 20 }, icon: '🌿' },
  { id: 's4', name: 'モモンガ王の結界', description: 'シールド+35', rarity: 'legendary', type: 'shield', effect: { shield: 35 }, icon: '👑' },
  
  // 特殊能力 (Special) - 森の魔法シリーズ
  { id: 'sp1', name: '風のささやき', description: '移動速度向上', rarity: 'rare', type: 'special', effect: { special: 'speed' }, icon: '🍃' },
  { id: 'sp2', name: '森の恵み', description: '自動回復機能', rarity: 'epic', type: 'special', effect: { special: 'heal' }, icon: '🌸' },
  { id: 'sp3', name: 'モモンガ時間操術', description: '敵弾減速効果', rarity: 'legendary', type: 'special', effect: { special: 'timeslow' }, icon: '⏳' }
]

// レアリティ別確率設定
const GACHA_RATES = {
  common: 0.6,    // 60%
  rare: 0.25,     // 25%
  epic: 0.12,     // 12%
  legendary: 0.03 // 3%
}

const BulletHell: React.FC = () => {
  useSEO(SEO_PRESETS.bulletHell);
  const { momoPayPoints, addMomoPayPoints, updateHighScores, highScores } = useAppData()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [lives, setLives] = useState(1)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [lastTap, setLastTap] = useState(0)
  const [shield, setShield] = useState(0)
  const [wave, setWave] = useState(1)
  const [invincible, setInvincible] = useState(false)
  const [invincibleTime, setInvincibleTime] = useState(0)
  
  // パワーアップアイテムによる追加能力値を管理
  const [powerUpBonuses, setPowerUpBonuses] = useState({ fireRate: 0, power: 0 })
  
  // 効果音設定の状態
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  
  
  // AudioContextを初期化する関数
  const initializeAudio = useCallback(() => {
    if (audioContext || !soundEnabled) return
    
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      setAudioContext(ctx)
      console.log('AudioContext created, state:', ctx.state)
      
      // AudioContextが suspend 状態の場合は resume を試行
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('AudioContext resumed successfully')
        }).catch(() => {
          console.log('AudioContext resume failed, will try on next user interaction')
        })
      }
    } catch (error) {
      console.log('AudioContext creation failed:', error)
    }
  }, [soundEnabled])
  
  // 実際の音声再生処理
  const playActualSound = useCallback((ctx: AudioContext, frequency: number, duration: number, type: 'sine' | 'square' | 'triangle') => {
    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
      oscillator.type = type
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
      console.log(`Sound played: ${frequency}Hz, ${duration}s, ${type}`)
    } catch (error) {
      console.log('Actual sound play error:', error)
    }
  }, [])
  
  // 効果音再生関数
  const playSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
    if (!soundEnabled || !audioContext) {
      console.log('Sound disabled or no AudioContext:', { soundEnabled, hasAudioContext: !!audioContext })
      return
    }
    
    try {
      // AudioContextが suspended 状態の場合は resume を試行
      if (audioContext.state === 'suspended') {
        console.log('AudioContext suspended, attempting resume...')
        audioContext.resume().then(() => {
          console.log('AudioContext resumed, playing sound')
          // resume 成功後に再度音声を再生
          playActualSound(audioContext, frequency, duration, type)
        }).catch(() => {
          console.log('AudioContext resume failed')
        })
      } else if (audioContext.state === 'running') {
        console.log('AudioContext running, playing sound')
        playActualSound(audioContext, frequency, duration, type)
      } else {
        console.log('AudioContext in unexpected state:', audioContext.state)
      }
    } catch (error) {
      console.log('Sound play error:', error)
    }
  }, [soundEnabled, audioContext, playActualSound])
  
  
  
  
  // 無敵時間を開始する関数
  const startInvincibility = useCallback((duration: number = 60) => { // 1秒間（60fps * 1）
    try {
      const safeDuration = Math.max(0, Math.min(300, Math.floor(duration))) // 0-5秒の範囲で制限
      setInvincible(true)
      setInvincibleTime(safeDuration)
    } catch (e) {
      console.log('Invincibility start error:', e)
    }
  }, [])
  
  // ガチャシステム用状態
  const [showGacha, setShowGacha] = useState(false)
  const [inventory, setInventory] = useState<PlayerInventory>({ items: [] })
  const [gachaResult, setGachaResult] = useState<GachaItem | null>(null)
  const [showInventory, setShowInventory] = useState(false)
  const [showEquipmentCatalog, setShowEquipmentCatalog] = useState(false)
  const playerRef = useRef<Player>({ x: 200, y: 240, r: 6, fireRate: 1, power: 1 })
  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const powerUpsRef = useRef<PowerUp[]>([])
  const keysRef = useRef<Record<string, boolean>>({})
  const rafRef = useRef<number | null>(null)
  const lastShotRef = useRef<number>(0)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { 
      keysRef.current[e.key] = true
      if (e.key === ' ' && running) {
        e.preventDefault()
        shoot()
      }
    }
    const onUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false }
    
    // Enhanced touch controls for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === canvasRef.current) {
        e.preventDefault()
        const touch = e.touches[0]
        if (!touch) return
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        
        const x = (touch.clientX - rect.left) * (400 / rect.width) // スケール調整
        const y = (touch.clientY - rect.top) * (280 / rect.height)
        
        setTouchStart({ x, y })
        
        // Double tap detection for shooting
        const now = Date.now()
        if (now - lastTap < 400) { // タップ間隔を少し長めに
          if (running) {
            shoot()
          }
        }
        setLastTap(now)
      }
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.target === canvasRef.current && touchStart) {
        e.preventDefault()
        const touch = e.touches[0]
        if (!touch) return
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        
        const x = (touch.clientX - rect.left) * (400 / rect.width)
        const y = (touch.clientY - rect.top) * (280 / rect.height)
        
        // より直感的な操作：タッチ位置に向かってプレイヤーを移動
        const player = playerRef.current
        const boundaryRadius = player.displayR || player.r
        const targetX = Math.max(boundaryRadius, Math.min(400 - boundaryRadius, x))
        const targetY = Math.max(boundaryRadius, Math.min(280 - boundaryRadius, y))
        
        // スムーズな移動のため、距離に応じて移動量を調整
        const deltaX = targetX - player.x
        const deltaY = targetY - player.y
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        
        if (distance > 5) { // 最小移動距離
          const moveSpeed = Math.min(distance * 0.3, 8) // 最大移動速度制限
          player.x += (deltaX / distance) * moveSpeed
          player.y += (deltaY / distance) * moveSpeed
        }
      }
    }
    
    const handleTouchEnd = () => {
      setTouchStart(null)
    }
    
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    
    return () => { 
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTap, touchStart, running]) // shootは内部で定義されるため除外


  // Load inventory from localStorage
  useEffect(() => {
    const savedInventory = localStorage.getItem('bullet-hell-inventory')
    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory))
      } catch {
        setInventory({ items: [] })
      }
    }
    
    // Load sound settings
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        const soundSetting = settings['notification-sound'] || false
        setSoundEnabled(soundSetting)
        console.log('Sound setting loaded:', soundSetting)
      } catch {
        setSoundEnabled(false)
        console.log('Failed to load sound settings, defaulting to false')
      }
    } else {
      console.log('No saved settings found, sound disabled')
    }
  }, [])

  // AudioContextを効果音設定に応じて初期化
  useEffect(() => {
    console.log('Sound effect:', { soundEnabled, hasAudioContext: !!audioContext })
    if (soundEnabled && !audioContext) {
      console.log('Initializing AudioContext...')
      initializeAudio()
    } else if (!soundEnabled && audioContext) {
      // 効果音が無効になった場合はAudioContextをクローズ
      console.log('Closing AudioContext...')
      audioContext.close().then(() => {
        setAudioContext(null)
        console.log('AudioContext closed')
      }).catch((error) => {
        console.log('Failed to close AudioContext:', error)
      })
    }
  }, [soundEnabled, audioContext, initializeAudio])

  // ユーザーインタラクション時にAudioContextをresumeする
  useEffect(() => {
    const handleUserInteraction = () => {
      console.log('User interaction detected')
      if (soundEnabled && !audioContext) {
        console.log('Creating AudioContext on user interaction')
        initializeAudio()
      } else if (audioContext && audioContext.state === 'suspended') {
        console.log('Resuming AudioContext on user interaction')
        audioContext.resume().then(() => {
          console.log('AudioContext resumed after user interaction')
        }).catch((error) => {
          console.log('Failed to resume AudioContext:', error)
        })
      }
    }

    // ユーザーインタラクションイベントをリスン
    const events = ['click', 'touchstart', 'keydown']
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: false })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction)
      })
    }
  }, [audioContext, soundEnabled, initializeAudio])

  // 設定変更を監視してリアルタイムで効果音設定を更新
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-settings' && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue)
          const newSoundSetting = settings['notification-sound'] || false
          if (newSoundSetting !== soundEnabled) {
            setSoundEnabled(newSoundSetting)
            console.log('Sound setting updated via storage change:', newSoundSetting)
          }
        } catch (error) {
          console.log('Failed to parse updated settings:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [soundEnabled])


  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      // AudioContextをクローズ
      if (audioContext) {
        audioContext.close().catch((error) => {
          console.log('Failed to close AudioContext on unmount:', error)
        })
      }
    }
  }, [audioContext])

  // Save inventory to localStorage
  useEffect(() => {
    if (inventory.items.length > 0) {
      localStorage.setItem('bullet-hell-inventory', JSON.stringify(inventory))
    }
  }, [inventory])


  useEffect(() => {
    if (!running) return
    
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height

    const loop = () => {
      // time - 現在のtime値を取得して使用
      const currentTime = time
      setTime(t => t + 1)
      
      // 無敵時間のカウントダウン
      if (invincibleTime > 0) {
        const newInvincibleTime = Math.max(0, invincibleTime - 1)
        setInvincibleTime(newInvincibleTime)
        if (newInvincibleTime <= 0) {
          setInvincible(false)
        }
      }

      // 初期フレーム（time < 60）ではスポーンしない
      if (currentTime < 60) {
        if (running) rafRef.current = requestAnimationFrame(loop)
        return
      }

      // Check if there's a boss alive - if so, don't spawn regular enemies
      const hasBoss = enemiesRef.current.some(e => e.isBoss)
      
      // spawn enemies in formations (Touhou-style) - Much more gradual progression
      const baseSpawnRate = 300 // Much slower initial spawn rate
      const spawnRate = Math.max(150, baseSpawnRate - wave * 10) // Slower progression
      
      if (currentTime % spawnRate === 0 && !hasBoss) {
        const enemyHp = Math.min(1 + Math.floor(wave / 3), 6) // Start with 1 HP, slower HP growth
        
        // Limit formation complexity based on wave
        let maxFormationType = 0 // Start with single enemies only
        if (wave >= 2) maxFormationType = 1 // Line formation from wave 2
        if (wave >= 4) maxFormationType = 2 // V formation from wave 4
        if (wave >= 6) maxFormationType = 3 // Wave formation from wave 6
        
        const formationType = Math.floor(Math.random() * (maxFormationType + 1))
        
        // Formation-based spawning
        if (formationType === 0) {
          // Single enemy
          enemiesRef.current.push({ 
            x: Math.random() * (w - 80) + 40, 
            y: -10, 
            r: 10, 
            hp: enemyHp, 
            maxHp: enemyHp,
            pattern: Math.floor(Math.random() * Math.min(1 + Math.floor(wave / 2), 4)) // Limit patterns early
          })
        } else if (formationType === 1 && wave >= 2) {
          // Line formation (3 enemies) - only from wave 2
          const centerX = w / 2
          const spacing = 60
          for (let i = -1; i <= 1; i++) {
            enemiesRef.current.push({ 
              x: centerX + i * spacing, 
              y: -10, 
              r: 10, 
              hp: enemyHp, 
              maxHp: enemyHp,
              pattern: Math.floor(Math.random() * Math.min(1 + Math.floor(wave / 2), 4))
            })
          }
        } else if (formationType === 2 && wave >= 4) {
          // V formation - only from wave 4
          const centerX = w / 2
          const positions = [
            { x: centerX, y: -10 },
            { x: centerX - 40, y: -30 },
            { x: centerX + 40, y: -30 }
          ]
          positions.forEach(pos => {
            enemiesRef.current.push({ 
              x: pos.x, 
              y: pos.y, 
              r: 10, 
              hp: enemyHp, 
              maxHp: enemyHp,
              pattern: Math.floor(Math.random() * Math.min(1 + Math.floor(wave / 2), 4))
            })
          })
        } else if (formationType === 3 && wave >= 6) {
          // Wave formation (3 enemies instead of 5) - only from wave 6
          for (let i = 0; i < 3; i++) {
            enemiesRef.current.push({ 
              x: (w / 4) * (i + 1), 
              y: -10 - Math.sin(i * 0.8) * 15, 
              r: 10, 
              hp: enemyHp, 
              maxHp: enemyHp,
              pattern: Math.floor(Math.random() * Math.min(1 + Math.floor(wave / 2), 4))
            })
          }
        }
      }

      // spawn power-ups more frequently in early waves
      const powerUpInterval = Math.max(400, 600 - wave * 30) // More frequent in early waves
      if (currentTime % powerUpInterval === 0 && Math.random() < 0.8) {
        const powerUpTypes: PowerUp['type'][] = ['fireRate', 'power', 'shield']
        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
        if (randomType) {
          powerUpsRef.current.push({
            x: Math.random() * (w - 40) + 20,
            y: 60,
            r: 8,
            type: randomType,
            collected: false
          })
        }
      }
      // enemies shoot with varied patterns - scaled by wave
      enemiesRef.current.forEach((e, idx) => {
        // Slower shooting in early waves
        const baseShootInterval = 90 + (idx % 30) // Longer base interval
        const shootInterval = Math.max(45, baseShootInterval - wave * 5) // Gradually faster
        
        if (currentTime % shootInterval === 0) {
          const bulletSpeed = Math.min(0.8 + wave * 0.1, 1.5) // Slower bullets early game
          
          if (e.pattern === 0) {
            // Simple aimed shot (pattern 0 only for early waves)
            const ang = Math.atan2(playerRef.current.y - e.y, playerRef.current.x - e.x)
            bulletsRef.current.push({ 
              x: e.x, y: e.y, 
              vx: Math.cos(ang) * bulletSpeed, 
              vy: Math.sin(ang) * bulletSpeed, 
              r: 3, from: 'enemy' 
            })
          } else if (e.pattern === 1 && wave >= 2) {
            // Straight down shot (introduced in wave 2)
            bulletsRef.current.push({ 
              x: e.x, y: e.y, 
              vx: 0, 
              vy: bulletSpeed, 
              r: 3, from: 'enemy' 
            })
          } else if (e.pattern === 2 && wave >= 3) {
            // 2-way spread shot (reduced from 3-way, introduced in wave 3)
            const baseAng = Math.atan2(playerRef.current.y - e.y, playerRef.current.x - e.x)
            for (let i = -0.5; i <= 0.5; i++) {
              const ang = baseAng + i * 0.4
              bulletsRef.current.push({ 
                x: e.x, y: e.y, 
                vx: Math.cos(ang) * bulletSpeed, 
                vy: Math.sin(ang) * bulletSpeed, 
                r: 2.5, from: 'enemy' 
              })
            }
          } else if (e.pattern === 3 && wave >= 5) {
            // 3-way spread shot (introduced in wave 5)
            const baseAng = Math.atan2(playerRef.current.y - e.y, playerRef.current.x - e.x)
            for (let i = -1; i <= 1; i++) {
              const ang = baseAng + i * 0.3
              bulletsRef.current.push({ 
                x: e.x, y: e.y, 
                vx: Math.cos(ang) * bulletSpeed, 
                vy: Math.sin(ang) * bulletSpeed, 
                r: 2.5, from: 'enemy' 
              })
            }
          } else if (e.pattern === 4 && wave >= 8) {
            // Circular pattern (danmaku style) - reduced bullets, later waves only
            const numBullets = Math.min(4 + wave, 8) // Start with 4, max 8
            for (let i = 0; i < numBullets; i++) {
              const ang = (currentTime * 0.02 + idx + i * (Math.PI * 2 / numBullets)) % (Math.PI * 2)
              bulletsRef.current.push({ 
                x: e.x, y: e.y, 
                vx: Math.cos(ang) * bulletSpeed * 0.7, 
                vy: Math.sin(ang) * bulletSpeed * 0.7, 
                r: 2, from: 'enemy' 
              })
            }
          } else if (e.pattern === 6 && e.isBoss) {
            // Boss patterns - reduced complexity
            if (e.bossPhase === 1) {
              // Phase 1: Spiral bullets (reduced count)
              const numBullets = Math.min(6 + Math.floor(wave / 5), 10) // Start with 6, max 10
              for (let i = 0; i < numBullets; i++) {
                const ang = (currentTime * 0.03 + i * (Math.PI * 2 / numBullets)) % (Math.PI * 2)
                bulletsRef.current.push({ 
                  x: e.x, y: e.y, 
                  vx: Math.cos(ang) * bulletSpeed * 0.8, 
                  vy: Math.sin(ang) * bulletSpeed * 0.8, 
                  r: 3, from: 'enemy' 
                })
              }
            } else if (e.bossPhase === 2) {
              // Phase 2: Wave pattern (reduced spread)
              for (let i = -2; i <= 2; i++) {
                const ang = Math.PI / 2 + i * 0.15 + Math.sin(currentTime * 0.08) * 0.3
                bulletsRef.current.push({ 
                  x: e.x, y: e.y, 
                  vx: Math.cos(ang) * bulletSpeed, 
                  vy: Math.sin(ang) * bulletSpeed, 
                  r: 3, from: 'enemy' 
                })
              }
            }
            
            // Boss phase progression based on HP
            const hpRatio = e.hp / e.maxHp
            if (hpRatio < 0.5 && e.bossPhase === 1) {
              e.bossPhase = 2
            }
          }
        }
        
        // Smoother movement patterns
        const moveSpeed = 0.8
        if (e.pattern === 0) {
          // Gentle sine wave horizontal movement
          e.x += Math.sin(currentTime * 0.03 + idx) * moveSpeed
          e.y += 0.5
        }
        if (e.pattern === 1) {
          // Vertical sine wave
          e.y += Math.sin(currentTime * 0.05 + idx) * 0.4 + 0.4
        }
        if (e.pattern === 2) {
          // Smooth circular motion
          e.x += Math.cos(currentTime * 0.04 + idx) * 0.8
          e.y += Math.sin(currentTime * 0.04 + idx) * 0.3 + 0.5
        }
        if (e.pattern === 3) {
          // Larger horizontal waves
          e.x += Math.sin(currentTime * 0.02 + idx) * 1.5
          e.y += 0.6
        }
        if (e.pattern === 4) {
          // Figure-8 pattern
          e.x += Math.cos(currentTime * 0.05 + idx) * 1.2
          e.y += Math.sin(currentTime * 0.03 + idx) * 0.8 + 0.4
        }
        if (e.pattern === 5) {
          // Spiral descent
          const spiral = currentTime * 0.02 + idx
          e.x += Math.cos(spiral) * 1.4
          e.y += Math.sin(spiral) * 0.6 + 0.7
        }
        if (e.pattern === 6 && e.isBoss) {
          // Boss movement - slow horizontal movement
          e.x += Math.sin(currentTime * 0.01) * 1.0
          // Keep boss near top of screen
          if (e.y > 80) e.y -= 0.2
          if (e.y < 40) e.y += 0.2
        }
      })

      // move player (with speed boost effect)
      const p = playerRef.current
      let moveSpeed = 3
      if (inventory.equippedSpecial?.effect.special === 'speed') {
        moveSpeed = 5 // スピードブースト効果
      }
      if (keysRef.current['ArrowLeft']) p.x -= moveSpeed
      if (keysRef.current['ArrowRight']) p.x += moveSpeed
      if (keysRef.current['ArrowUp']) p.y -= moveSpeed
      if (keysRef.current['ArrowDown']) p.y += moveSpeed
      // Use display radius for boundary checking to prevent visual clipping
      const boundaryRadius = p.displayR || p.r
      p.x = Math.max(boundaryRadius, Math.min(w - boundaryRadius, p.x))
      p.y = Math.max(boundaryRadius, Math.min(h - boundaryRadius, p.y))

      // move bullets (with time slow effect)
      const bulletSpeedMultiplier = inventory.equippedSpecial?.effect.special === 'timeslow' ? 0.5 : 1.0
      bulletsRef.current.forEach(b => { 
        if (b.from === 'enemy') {
          b.x += b.vx * bulletSpeedMultiplier
          b.y += b.vy * bulletSpeedMultiplier
        } else {
          b.x += b.vx
          b.y += b.vy
        }
      })
      bulletsRef.current = bulletsRef.current.filter(b => b.x > -10 && b.x < w + 10 && b.y > -10 && b.y < h + 10)

      // Auto heal effect - disabled since lives is now 1
      // if (inventory.equippedSpecial?.effect.special === 'heal' && time % 300 === 0 && lives < 1) {
      //   setLives(prev => Math.min(prev + 1, 1))
      // }

      // move power-ups
      powerUpsRef.current.forEach(p => { p.y += 1 })
      powerUpsRef.current = powerUpsRef.current.filter(p => p.y < h + 10 && !p.collected)

      // collect power-ups
      for (const powerUp of powerUpsRef.current) {
        const dx = p.x - powerUp.x, dy = p.y - powerUp.y
        if (dx * dx + dy * dy < (p.r + powerUp.r) * (p.r + powerUp.r)) {
          powerUp.collected = true
          
          // パワーアップ取得音を再生
          playSound(1200, 0.3, 'triangle')
          
          if (powerUp.type === 'fireRate') {
            setPowerUpBonuses(prev => ({ 
              ...prev, 
              fireRate: Math.min(prev.fireRate + 0.1, 1.5) // 最大1.5のボーナス
            }))
          } else if (powerUp.type === 'power') {
            setPowerUpBonuses(prev => ({ 
              ...prev, 
              power: Math.min(prev.power + 0.2, 1.5) // 最大1.5のボーナス
            }))
          } else if (powerUp.type === 'shield') {
            setShield(s => Math.min(s + 10, 40))
          }
          setScore(prev => prev + 25) // パワーアップ取得で25点
        }
      }

      // collision: enemy bullets with player
      for (const b of bulletsRef.current.filter(b => b.from === 'enemy')) {
        const dx = p.x - b.x, dy = p.y - b.y
        if (dx * dx + dy * dy < (p.r + b.r) * (p.r + b.r)) {
          // 無敵時間中は被弾しない
          if (invincible) {
            break
          }
          
          bulletsRef.current.splice(bulletsRef.current.indexOf(b), 1)
          
          if (shield > 0) {
            // シールドヒット音
            playSound(400, 0.2, 'square')
            setShield(s => Math.max(0, s - 5))
            // シールド破壊時も無敵時間を付与
            startInvincibility(30) // 0.5秒間
          } else {
            // ダメージ音
            playSound(200, 0.5, 'triangle')
            setLives(v => Math.max(0, v - 1))
            // 被弾時に無敵時間を付与
            startInvincibility(60) // 1秒間
            if (lives - 1 <= 0) {
              setRunning(false)
              setGameOver(true)
              // ハイスコアに追加（TOP3のみ保持）
              updateHighScores(score)
              // スコアをMOMOPayに変換（10スコア = 1MOMOPay）
              const earnedPoints = Math.floor(score / 10)
              if (earnedPoints > 0) {
                addMomoPayPoints(earnedPoints)
              }
            }
          }
        }
      }

      // player bullets hit enemies
      const beforeEnemyCount = enemiesRef.current.length
      bulletsRef.current.filter(b => b.from === 'player').forEach(b => {
        for (const e of enemiesRef.current) {
          const dx = e.x - b.x, dy = e.y - b.y
          if (dx * dx + dy * dy < (e.r + b.r) * (e.r + b.r)) {
            const damage = Math.floor(playerRef.current.power)
            e.hp -= damage
            bulletsRef.current.splice(bulletsRef.current.indexOf(b), 1)
            
            // 敵ヒット音
            playSound(600, 0.1, 'sine')
            
            setScore(prev => prev + 10 * damage) // ダメージに応じてスコア
            break
          }
        }
      })
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0)
      
      // 敵を倒すと追加スコア
      const killedEnemies = enemiesRef.current.length - beforeEnemyCount
      if (killedEnemies < 0) {
        // Check if any bosses were killed for bonus points
        const killedEnemyCount = Math.abs(killedEnemies)
        let bossBonus = 0
        
        // Simple check: if we killed fewer enemies than expected, some might have been bosses
        // In a real implementation, you'd track this more precisely
        for (let i = 0; i < killedEnemyCount; i++) {
          // Assume boss if we're on a boss wave
          if ((wave + 1) % 3 === 0) {
            // ボス撃破音
            playSound(300, 0.8, 'square')
            bossBonus += 500 // Boss kill bonus
          } else {
            // 敵撃破音
            playSound(1000, 0.2, 'triangle')
            bossBonus += 50 // Normal enemy
          }
        }
        
        setScore(prev => prev + bossBonus)
      }

      // ウェーブ進行チェック（30秒ごと）とボス出現
      if (currentTime > 0 && currentTime % 1800 === 0) {
        // ウェーブクリア音
        playSound(1500, 0.5, 'sine')
        
        const nextWave = wave + 1
        setWave(nextWave)
        setScore(prev => prev + wave * 100) // ウェーブクリアボーナス
        
        // Boss appears every 5th wave, starting from wave 5
        if (nextWave >= 5 && (nextWave % 5 === 0)) {
          // ボス出現時に既存の敵を全て消去
          enemiesRef.current = enemiesRef.current.filter(e => e.isBoss)
          
          // ボス出現音
          playSound(150, 1.0, 'square')
          
          const bossHp = 50 + Math.floor(nextWave / 5) * 25 // Much higher HP: starts at 50, increases by 25 per tier
          enemiesRef.current.push({
            x: w / 2,
            y: 50,
            r: 20,
            hp: bossHp,
            maxHp: bossHp,
            pattern: 6, // Boss pattern
            isBoss: true,
            bossPhase: 1
          })
        }
      }

      // draw
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, w, h)
      
      // enemies with HP bars
      for (const e of enemiesRef.current) {
        if (e.isBoss) {
          // Boss appearance - larger, different color, with glow effect
          ctx.shadowColor = '#ff6b6b'
          ctx.shadowBlur = 15
          ctx.fillStyle = e.bossPhase === 2 ? '#ff4444' : '#ff6b6b'
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill()
          
          // Boss inner core
          ctx.fillStyle = '#ffffff'
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 0.4, 0, Math.PI * 2); ctx.fill()
          ctx.shadowBlur = 0
          
          // Boss HP bar (larger)
          const barWidth = 60
          const barHeight = 6
          ctx.fillStyle = '#ff4444'
          ctx.fillRect(e.x - barWidth/2, e.y - e.r - 15, barWidth, barHeight)
          ctx.fillStyle = '#44ff44'
          ctx.fillRect(e.x - barWidth/2, e.y - e.r - 15, barWidth * (e.hp / e.maxHp), barHeight)
          
          // Boss name/phase indicator
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(`BOSS ${e.bossPhase === 2 ? 'RAGE' : 'PHASE 1'}`, e.x, e.y - e.r - 20)
        } else {
          // Normal enemy
          ctx.fillStyle = '#FFD166'
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill()
          
          // HP bar (only show if damaged)
          if (e.hp < e.maxHp) {
            const barWidth = 20
            const barHeight = 3
            ctx.fillStyle = '#ff4444'
            ctx.fillRect(e.x - barWidth/2, e.y - e.r - 8, barWidth, barHeight)
            ctx.fillStyle = '#44ff44'
            ctx.fillRect(e.x - barWidth/2, e.y - e.r - 8, barWidth * (e.hp / e.maxHp), barHeight)
          }
        }
      }
      
      // power-ups
      for (const powerUp of powerUpsRef.current) {
        if (!powerUp.collected) {
          let color = '#ffffff'
          let symbol = '?'
          if (powerUp.type === 'fireRate') { color = '#ff6b6b'; symbol = 'F' }
          if (powerUp.type === 'power') { color = '#4ecdc4'; symbol = 'P' }
          if (powerUp.type === 'shield') { color = '#ffd93d'; symbol = 'S' }
          
          ctx.fillStyle = color
          ctx.beginPath(); ctx.arc(powerUp.x, powerUp.y, powerUp.r, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#000'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(symbol, powerUp.x, powerUp.y + 4)
        }
      }
      
      // bullets
      ctx.fillStyle = '#ffadad'
      for (const b of bulletsRef.current.filter(b => b.from === 'enemy')) { 
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill() 
      }
      ctx.fillStyle = '#4ECDC4'
      for (const b of bulletsRef.current.filter(b => b.from === 'player')) { 
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + (playerRef.current.power - 1), 0, Math.PI * 2); ctx.fill() 
      }
      
      // player with shield effect and improved visibility
      const displayRadius = p.displayR || p.r
      const hitboxRadius = p.r
      
      // Enhanced pulsing effect for better mobile visibility
      const pulseEffect = Math.sin(currentTime * 0.15) * 0.3 + 1.2
      const effectRadius = displayRadius * pulseEffect * 0.15
      
      // Multiple glow layers for better visibility
      ctx.shadowColor = '#4ECDC4'
      ctx.shadowBlur = 20
      ctx.fillStyle = `rgba(78, 205, 196, ${0.2 * pulseEffect})`
      ctx.beginPath(); ctx.arc(p.x, p.y, displayRadius + effectRadius + 8, 0, Math.PI * 2); ctx.fill()
      
      ctx.shadowBlur = 15
      ctx.fillStyle = `rgba(78, 205, 196, ${0.4 * pulseEffect})`
      ctx.beginPath(); ctx.arc(p.x, p.y, displayRadius + effectRadius + 4, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      
      // Shield effect (around display radius) - more prominent
      if (shield > 0) {
        ctx.strokeStyle = '#ffd93d'
        ctx.lineWidth = 4
        ctx.setLineDash([8, 4])
        ctx.lineDashOffset = -currentTime * 0.15
        ctx.beginPath(); ctx.arc(p.x, p.y, displayRadius + 6, 0, Math.PI * 2); ctx.stroke()
        
        // Additional shield glow
        ctx.shadowColor = '#ffd93d'
        ctx.shadowBlur = 8
        ctx.strokeStyle = `rgba(255, 217, 61, ${0.6})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(p.x, p.y, displayRadius + 8, 0, Math.PI * 2); ctx.stroke()
        ctx.shadowBlur = 0
        ctx.setLineDash([])
      }
      
      // Outer ring for better definition
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.arc(p.x, p.y, displayRadius + 2, 0, Math.PI * 2); ctx.stroke()
      
      // 無敵時間中の点滅効果
      const isVisible = !invincible || Math.floor(currentTime / 8) % 2 === 0
      
      if (isVisible) {
        // Main player body (larger for visibility)
        ctx.fillStyle = invincible ? '#ff6b6b' : '#4ECDC4' // 無敵時は赤色
        ctx.beginPath(); ctx.arc(p.x, p.y, displayRadius, 0, Math.PI * 2); ctx.fill()
        
        // Gradient effect for depth
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, displayRadius)
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(0.3, invincible ? '#ff6b6b' : '#4ECDC4')
        gradient.addColorStop(1, invincible ? '#e53935' : '#26a69a')
        ctx.fillStyle = gradient
        ctx.beginPath(); ctx.arc(p.x, p.y, displayRadius * 0.8, 0, Math.PI * 2); ctx.fill()
      }
      
      if (isVisible) {
        // Inner core (actual hitbox indicator) - more prominent
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(p.x, p.y, hitboxRadius + 1, 0, Math.PI * 2); ctx.stroke()
        
        // Core highlight for better visibility
        ctx.fillStyle = invincible ? '#ffaa00' : '#ff6b6b' // 無敵時は橙色
        ctx.beginPath(); ctx.arc(p.x, p.y, hitboxRadius, 0, Math.PI * 2); ctx.fill()
      }
      
      // Center dot (precise hitbox center) - larger and more visible
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill()
      
      // draw UI
      ctx.fillStyle = '#fff3e0'
      ctx.font = 'bold 16px "Comic Sans MS", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", cursive, fantasy, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`スコア: ${score}`, 10, 25)
      
      // ウェーブ表示（右上）
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff3e0'
      ctx.fillText(`ウェーブ: ${wave}`, w - 10, 25)
      
      // シールド表示（右上、ウェーブの下）
      if (shield > 0) {
        ctx.fillStyle = '#ffd93d'
        ctx.fillText(`🛡️ シールド: ${shield}`, w - 10, 45)
      }
      
      
      // power-up status with equipment indicators
      ctx.font = 'bold 12px "Comic Sans MS", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Meiryo", cursive, fantasy, sans-serif'
      let yOffset = 45
      
      // Fire rate - simple display
      const totalFireRate = playerRef.current.fireRate
      const equipmentFireRateBonus = (inventory.equippedWeapon?.effect.fireRate || 0)
      const powerUpFireRateBonus = powerUpBonuses.fireRate
      
      if (equipmentFireRateBonus > 0 || powerUpFireRateBonus > 0) {
        ctx.fillStyle = '#4ecdc4' // Bonus color
        ctx.fillText(`連射: ${totalFireRate.toFixed(1)}x ⚡`, 10, yOffset)
      } else {
        ctx.fillStyle = '#fff3e0'
        ctx.fillText(`連射: ${totalFireRate.toFixed(1)}x`, 10, yOffset)
      }
      yOffset += 15
      
      // Power - simple display
      const totalPower = playerRef.current.power
      const equipmentPowerBonus = (inventory.equippedWeapon?.effect.power || 0)
      const powerUpPowerBonus = powerUpBonuses.power
      
      if (equipmentPowerBonus > 0 || powerUpPowerBonus > 0) {
        ctx.fillStyle = '#ff6b6b' // Bonus color
        ctx.fillText(`威力: ${totalPower.toFixed(1)}x 💥`, 10, yOffset)
      } else {
        ctx.fillStyle = '#fff3e0'
        ctx.fillText(`威力: ${totalPower.toFixed(1)}x`, 10, yOffset)
      }
      yOffset += 15
      
      // Shield with equipment bonus
      if (inventory.equippedShield) {
        ctx.fillStyle = '#ffd93d'
        const shieldName = inventory.equippedShield.name
        const shieldIcon = inventory.equippedShield.icon
        ctx.fillText(`シールド: ${shieldIcon} ${shieldName}`, 10, yOffset)
        yOffset += 15
      }
      
      // Special equipment effects
      if (inventory.equippedSpecial) {
        ctx.fillStyle = '#9c27b0'
        const specialName = inventory.equippedSpecial.name
        const specialIcon = inventory.equippedSpecial.icon
        ctx.fillText(`特殊: ${specialIcon} ${specialName}`, 10, yOffset)
        yOffset += 15
      }

      if (running) rafRef.current = requestAnimationFrame(loop)
    }
    
    // ゲームループを開始
    rafRef.current = requestAnimationFrame(loop)
    
    return () => { 
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [running, time, wave, lives, score, shield, powerUpBonuses, inventory, playSound])

  const start = useCallback(() => {
    
    // 前回のゲームループをキャンセル
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    
    // 効果音のテスト（ゲーム開始音）
    playSound(440, 0.2, 'sine')
    
    // ゲーム状態を完全にリセット
    bulletsRef.current = []
    enemiesRef.current = []
    powerUpsRef.current = []
    playerRef.current = { x: 200, y: 240, r: 4, fireRate: 1.0, power: 1.0, displayR: 15 }
    lastShotRef.current = 0
    
    // 状態をバッチで更新
    setPowerUpBonuses({ fireRate: 0, power: 0 })
    setLives(1)
    setTime(0)
    setScore(0)
    
    // シールド初期値を装備に応じて設定（装備なしなら0）
    const equipmentShieldBonus = inventory.equippedShield?.effect.shield || 0
    setShield(equipmentShieldBonus)
    
    setWave(1)
    setGameOver(false)
    
    // ゲームを開始
    setRunning(true)
  }, [playSound, inventory])

  // ガチャ機能
  const performGacha = useCallback(() => {
    const gachaCost = 1000 // 1000MOMOPay
    if (momoPayPoints < gachaCost) {
      alert('MOMOPayが不足しています！')
      return
    }

    // MOMOPay消費
    addMomoPayPoints(-gachaCost)

    // レアリティ抽選
    const random = Math.random()
    let selectedRarity: GachaItem['rarity'] = 'common'
    
    if (random < GACHA_RATES.legendary) {
      selectedRarity = 'legendary'
    } else if (random < GACHA_RATES.legendary + GACHA_RATES.epic) {
      selectedRarity = 'epic'
    } else if (random < GACHA_RATES.legendary + GACHA_RATES.epic + GACHA_RATES.rare) {
      selectedRarity = 'rare'
    }

    // 選択されたレアリティのアイテムから抽選
    const availableItems = GACHA_ITEMS.filter(item => item.rarity === selectedRarity)
    const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)]

    if (!selectedItem) {
      console.error('No item selected from gacha')
      return
    }

    // インベントリに追加
    setInventory(prev => ({
      ...prev,
      items: [...prev.items, selectedItem]
    }))

    // ガチャ結果音（レアリティに応じて変化）
    if (selectedItem.rarity === 'legendary') {
      playSound(2000, 1.0, 'sine')
    } else if (selectedItem.rarity === 'epic') {
      playSound(1500, 0.7, 'triangle')
    } else if (selectedItem.rarity === 'rare') {
      playSound(1200, 0.5, 'square')
    } else {
      playSound(800, 0.3, 'sine')
    }

    setGachaResult(selectedItem)
    // 自動で閉じないように変更
  }, [momoPayPoints, addMomoPayPoints, playSound])

  // 射撃機能
  const shoot = useCallback(() => {
    if (!running) return
    const now = Date.now()
    const fireDelay = 200 / playerRef.current.fireRate // 連射速度に応じた発射間隔
    if (now - lastShotRef.current < fireDelay) return
    
    lastShotRef.current = now
    const player = playerRef.current
    
    // 射撃音を再生
    playSound(800, 0.1, 'square')
    
    // パワーに応じて複数弾を発射
    if (player.power >= 2) {
      // 3方向発射
      bulletsRef.current.push({ x: player.x - 5, y: player.y - 8, vx: -1, vy: -4, r: 3, from: 'player', power: player.power })
      bulletsRef.current.push({ x: player.x, y: player.y - 8, vx: 0, vy: -4, r: 3, from: 'player', power: player.power })
      bulletsRef.current.push({ x: player.x + 5, y: player.y - 8, vx: 1, vy: -4, r: 3, from: 'player', power: player.power })
    } else {
      // 単発
      bulletsRef.current.push({ x: player.x, y: player.y - 8, vx: 0, vy: -4, r: 3, from: 'player', power: player.power })
    }
  }, [running, playSound])

  // アイテム装備機能
  const equipItem = useCallback((item: GachaItem) => {
    setInventory(prev => {
      const newInventory = { ...prev }
      if (item.type === 'weapon') {
        newInventory.equippedWeapon = item
      } else if (item.type === 'shield') {
        newInventory.equippedShield = item
      } else if (item.type === 'special') {
        newInventory.equippedSpecial = item
      }
      return newInventory
    })
  }, [])

  // アイテム装備解除機能
  const unequipItem = useCallback((type: 'weapon' | 'shield' | 'special') => {
    setInventory(prev => {
      const newInventory = { ...prev }
      if (type === 'weapon') {
        newInventory.equippedWeapon = undefined
      } else if (type === 'shield') {
        newInventory.equippedShield = undefined
      } else if (type === 'special') {
        newInventory.equippedSpecial = undefined
      }
      return newInventory
    })
  }, [])

  // 装備効果をプレイヤーに適用
  const applyEquipmentEffects = useCallback(() => {
    const basePlayer = { x: playerRef.current.x, y: playerRef.current.y, r: 4, fireRate: 1, power: 1, displayR: 15 }
    const modifiedPlayer = { ...basePlayer }

    // 武器効果
    if (inventory.equippedWeapon) {
      const weapon = inventory.equippedWeapon
      modifiedPlayer.fireRate += weapon.effect.fireRate || 0
      modifiedPlayer.power += weapon.effect.power || 0
    }

    // パワーアップアイテムのボーナス効果を追加
    modifiedPlayer.fireRate += powerUpBonuses.fireRate
    modifiedPlayer.power += powerUpBonuses.power

    // シールド効果（装備効果を常時適用）
    if (inventory.equippedShield && !running) {
      const shieldBonus = inventory.equippedShield?.effect.shield || 0 // 100%の効果を適用
      setShield(shieldBonus) // 装備ボーナスのみ（基本値なし）
    }

    playerRef.current = modifiedPlayer
  }, [inventory, running, powerUpBonuses])

  // ゲーム開始時に装備効果を適用
  useEffect(() => {
    if (running) {
      applyEquipmentEffects()
    }
  }, [running, applyEquipmentEffects])

  // パワーアップボーナスが変更されたときに装備効果を再適用
  useEffect(() => {
    if (running) {
      applyEquipmentEffects()
    }
  }, [powerUpBonuses, applyEquipmentEffects, running])

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
      <div style={{ color: '#fff3e0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div className="momopay-status" style={{ textShadow: '2px 2px 0px #f57f17, 0 0 8px rgba(255,217,61,0.5)' }}>
            💰 MOMOPay: {momoPayPoints}
          </div>
        </div>
        <div className="comic-text" style={{ fontSize: '1rem', marginTop: 6, color: '#c8e6c9' }}>
          矢印キーで移動 / スペースでショット / パワーアップ(F:連射 P:威力 S:シールド)を取ろう！
        </div>
        <div className="comic-text" style={{ fontSize: '0.9rem', marginTop: 4, color: '#a5d6a7' }}>
          スマホ：スワイプで移動・ダブルタップでショット / 大きな青い自機の中の赤い部分が当たり判定！🎯
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={280} 
        style={{ border: '4px solid #333', borderRadius: 12, background: '#0b1020', width: 'min(92vw, 480px)', height: 'auto', touchAction: 'none' }} 
        onClick={shoot}
        role="application"
        aria-label="演習林での修行。矢印キーで移動、スペースキーで発射。"
        tabIndex={running ? 0 : -1}
      />
      
      {gameOver && (
        <div className="comic-card" style={{ 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
          padding: '24px', 
          borderColor: '#8bc34a',
          textAlign: 'center',
          marginTop: '12px'
        }}>
          <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.6rem', marginBottom: '16px' }}>🎮 ゲームオーバー 🎮</div>
          <div className="comic-text" style={{ color: '#c8e6c9', fontSize: '1.2rem', marginBottom: '8px' }}>最終スコア: {score}</div>
          <div className="momopay-display" style={{ marginBottom: '16px' }}>
            💰 獲得MOMOPay: {Math.floor(score / 10)}
          </div>
          {highScores.length > 0 && (
            <div>
              <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.2rem', marginBottom: '12px' }}>🏆 通算ハイスコア TOP3 🏆</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                {highScores.map((score, index) => {
                  const medals = ['🥇', '🥈', '🥉']
                  const colors = ['#ffd700', '#c0c0c0', '#cd7f32']
                  return (
                    <div key={index} className="comic-text" style={{ 
                      color: colors[index] || '#c8e6c9', 
                      fontSize: index === 0 ? '1.1rem' : '1rem',
                      fontWeight: index === 0 ? 'bold' : 'normal',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.2rem' }}>{medals[index]}</span>
                      <span>{index + 1}位: {score}点</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        {/* スタートボタン - 最も重要なので一番大きく */}
        <button 
          onClick={start} 
          disabled={running} 
          className="comic-button font-button-lg"
          style={{ 
            background: running ? '#666' : 'linear-gradient(45deg, #66bb6a, #4caf50)', 
            color: 'white', 
            borderColor: running ? '#333' : '#2e7d32',
            fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
            padding: 'min(16px 32px, 4vw 8vw)',
            fontWeight: 'bold'
          }}
          aria-label={running ? 'ゲーム実行中' : 'ゲームを開始する'}
        >
          {running ? '🎮 プレイ中' : '🚀 スタート'}
        </button>
        
        {/* 装備関連ボタン - 中サイズ */}
        <button 
          onClick={() => setShowInventory(true)} 
          disabled={running} 
          className="comic-button font-button-sm"
          style={{ 
            background: running ? '#666' : 'linear-gradient(45deg, #42a5f5, #2196f3)', 
            color: 'white', 
            borderColor: running ? '#333' : '#1976d2'
          }}
          aria-label="インベントリを開く"
        >
          🎒 装備 ({inventory.items.length})
        </button>
        
        <button 
          onClick={() => setShowEquipmentCatalog(true)} 
          disabled={running} 
          className="comic-button font-button-sm"
          style={{ 
            background: running ? '#666' : 'linear-gradient(45deg, #9c27b0, #7b1fa2)', 
            color: 'white', 
            borderColor: running ? '#333' : '#4a148c'
          }}
          aria-label="装備図鑑を開く"
        >
          📖 装備図鑑
        </button>
        
        {/* ガチャボタン - 誤タップ防止のため小さく */}
        <button 
          onClick={() => setShowGacha(true)} 
          disabled={running || momoPayPoints < 1000} 
          className="comic-button font-button-xs"
          style={{ 
            background: (running || momoPayPoints < 1000) ? '#666' : 'linear-gradient(45deg, #ff6b6b, #ff5252)', 
            color: 'white', 
            borderColor: (running || momoPayPoints < 1000) ? '#333' : '#d32f2f',
            fontSize: 'clamp(0.8rem, 2.2vw, 0.9rem)',
            padding: 'min(8px 16px, 2vw 4vw)'
          }}
          aria-label="ガチャを引く（1000MOMOPay）"
        >
          <span className="momopay-small">🌲 ガチャ</span>
        </button>
      </div>

      {/* ガチャモーダル */}
      {showGacha && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '8px'
        }}>
          <div className="comic-card gacha-modal" style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 82, 82, 0.1))',
            padding: 'min(32px, 4vw)', borderColor: '#ff5252', 
            maxWidth: 'min(400px, 95vw)', width: '100%',
            textAlign: 'center'
          }}>
            <div className="comic-text" style={{ 
              color: '#fff3e0', fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', 
              marginBottom: '16px' 
            }}>
              🌲 ガチャ小屋 🐿️
            </div>
            <div className="momopay-display" style={{ 
              marginBottom: '16px' 
            }}>
              💰 現在のMOMOPay: {momoPayPoints}
            </div>
            <div className="comic-text" style={{ 
              color: '#ffd93d', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', 
              marginBottom: '24px', lineHeight: '1.4'
            }}>
              👑 レジェンド: 3%<br className="gacha-rate-break" />
              🌿 エピック: 12% | 🌲 レア: 25%<br className="gacha-rate-break" />
              🌰 コモン: 60%
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={performGacha} 
                disabled={momoPayPoints < 1000}
                className="comic-button font-button-md"
                style={{ 
                  background: momoPayPoints < 1000 ? '#666' : 'linear-gradient(45deg, #ffd93d, #ffb300)', 
                  color: momoPayPoints < 1000 ? '#ccc' : '#000', 
                  borderColor: momoPayPoints < 1000 ? '#333' : '#f57f17',
                  minWidth: '120px'
                }}
              >
                <span className="momopay-small">🌰 ガチャ (1000MOMOPay)</span>
              </button>
            </div>
            
            <button 
              onClick={() => setShowGacha(false)} 
              className="comic-button font-button-sm"
              style={{ 
                background: 'linear-gradient(45deg, #666, #555)', 
                color: 'white', 
                borderColor: '#333'
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* ガチャ結果表示 */}
      {gachaResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001, animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            animation: 'bounce 0.5s ease-in-out'
          }}>
            <div className="comic-card" style={{
              background: gachaResult.rarity === 'legendary' ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 193, 7, 0.9))' :
                        gachaResult.rarity === 'epic' ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.95), rgba(142, 36, 170, 0.9))' :
                        gachaResult.rarity === 'rare' ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(30, 136, 229, 0.9))' :
                        'linear-gradient(135deg, rgba(158, 158, 158, 0.95), rgba(117, 117, 117, 0.9))',
              padding: '32px', textAlign: 'center', minWidth: '350px', maxWidth: '90vw',
              borderColor: gachaResult.rarity === 'legendary' ? '#ffd700' :
                          gachaResult.rarity === 'epic' ? '#9c27b0' :
                          gachaResult.rarity === 'rare' ? '#2196f3' : '#9e9e9e',
              borderWidth: '4px',
              boxShadow: gachaResult.rarity === 'legendary' ? '0 0 30px rgba(255, 215, 0, 0.6), 0 10px 30px rgba(0,0,0,0.5)' :
                        gachaResult.rarity === 'epic' ? '0 0 30px rgba(156, 39, 176, 0.6), 0 10px 30px rgba(0,0,0,0.5)' :
                        gachaResult.rarity === 'rare' ? '0 0 30px rgba(33, 150, 243, 0.6), 0 10px 30px rgba(0,0,0,0.5)' :
                        '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '16px',
                filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'
              }}>
                {gachaResult.icon}
              </div>
              <div className="comic-text" style={{ 
                color: '#ffffff', 
                fontSize: '1.6rem', 
                marginBottom: '12px',
                textShadow: gachaResult.rarity === 'legendary' ? '3px 3px 0px #b8860b, 0 0 15px #ffd700' : 
                           gachaResult.rarity === 'epic' ? '3px 3px 0px #6a1b9a, 0 0 15px #9c27b0' :
                           gachaResult.rarity === 'rare' ? '3px 3px 0px #0d47a1, 0 0 15px #2196f3' :
                           '3px 3px 0px rgba(0,0,0,0.8)'
              }}>
                {gachaResult.name}
              </div>
              <div className="comic-text" style={{ 
                color: '#f0f0f0', 
                fontSize: '1.1rem', 
                marginBottom: '16px',
                textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
              }}>
                {gachaResult.description}
              </div>
              <div className="comic-text" style={{ 
                color: gachaResult.rarity === 'legendary' ? '#ffd700' :
                      gachaResult.rarity === 'epic' ? '#e1bee7' :
                      gachaResult.rarity === 'rare' ? '#bbdefb' : '#e0e0e0',
                fontSize: '1.3rem', 
                fontWeight: 'bold',
                textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
                marginBottom: '16px'
              }}>
                ★ {gachaResult.rarity.toUpperCase()} ★
              </div>
              <button 
                onClick={() => setGachaResult(null)} 
                className="comic-button font-button-sm"
                style={{ 
                  background: 'linear-gradient(45deg, #4caf50, #45a049)', 
                  color: 'white', 
                  borderColor: '#2e7d32',
                  marginTop: '16px'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* インベントリモーダル */}
      {showInventory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, overflow: 'auto', padding: '8px'
        }}>
          <div className="comic-card inventory-modal" style={{
            background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.2), rgba(33, 150, 243, 0.1))',
            padding: 'min(32px, 4vw)', borderColor: '#2196f3', 
            maxWidth: 'min(600px, 95vw)', width: '100%',
            maxHeight: 'min(90vh, 800px)', overflow: 'auto',
            margin: 'auto'
          }}>
            <div className="comic-text" style={{ 
              color: '#fff3e0', fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', 
              marginBottom: '16px', textAlign: 'center' 
            }}>
              🎒 装備インベントリ
            </div>
            
            {/* 現在の装備 */}
            <div style={{ marginBottom: '24px' }}>
              <div className="comic-text" style={{ 
                color: '#ffd93d', fontSize: 'clamp(1rem, 3vw, 1.3rem)', 
                marginBottom: '12px' 
              }}>
                ⚡ 現在の装備
              </div>
              <div className="equipment-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 45vw), 1fr))', 
                gap: 'min(8px, 2vw)' 
              }}>
                <div className="comic-card" style={{ 
                  padding: 'min(12px, 3vw)', background: 'rgba(76, 175, 80, 0.1)', 
                  borderColor: '#4caf50' 
                }}>
                  <div className="comic-text" style={{ 
                    color: '#c8e6c9', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                    marginBottom: '4px' 
                  }}>武器</div>
                  <div className="comic-text" style={{ 
                    color: '#fff3e0', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', 
                    marginBottom: '8px', wordBreak: 'break-word'
                  }}>
                    {inventory.equippedWeapon ? `${inventory.equippedWeapon.icon} ${inventory.equippedWeapon.name}` : '未装備'}
                  </div>
                  {inventory.equippedWeapon && (
                    <button 
                      onClick={() => unequipItem('weapon')}
                      className="comic-button font-button-xs"
                      style={{ 
                        background: 'linear-gradient(45deg, #ff6b6b, #ff5252)', 
                        color: 'white', borderColor: '#d32f2f', width: '100%'
                      }}
                    >
                      外す
                    </button>
                  )}
                </div>
                <div className="comic-card" style={{ 
                  padding: 'min(12px, 3vw)', background: 'rgba(255, 193, 7, 0.1)', 
                  borderColor: '#ffc107' 
                }}>
                  <div className="comic-text" style={{ 
                    color: '#c8e6c9', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                    marginBottom: '4px' 
                  }}>シールド</div>
                  <div className="comic-text" style={{ 
                    color: '#fff3e0', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', 
                    marginBottom: '8px', wordBreak: 'break-word'
                  }}>
                    {inventory.equippedShield ? `${inventory.equippedShield.icon} ${inventory.equippedShield.name}` : '未装備'}
                  </div>
                  {inventory.equippedShield && (
                    <button 
                      onClick={() => unequipItem('shield')}
                      className="comic-button font-button-xs"
                      style={{ 
                        background: 'linear-gradient(45deg, #ff6b6b, #ff5252)', 
                        color: 'white', borderColor: '#d32f2f', width: '100%'
                      }}
                    >
                      外す
                    </button>
                  )}
                </div>
                <div className="comic-card" style={{ 
                  padding: 'min(12px, 3vw)', background: 'rgba(156, 39, 176, 0.1)', 
                  borderColor: '#9c27b0' 
                }}>
                  <div className="comic-text" style={{ 
                    color: '#c8e6c9', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                    marginBottom: '4px' 
                  }}>特殊</div>
                  <div className="comic-text" style={{ 
                    color: '#fff3e0', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', 
                    marginBottom: '8px', wordBreak: 'break-word'
                  }}>
                    {inventory.equippedSpecial ? `${inventory.equippedSpecial.icon} ${inventory.equippedSpecial.name}` : '未装備'}
                  </div>
                  {inventory.equippedSpecial && (
                    <button 
                      onClick={() => unequipItem('special')}
                      className="comic-button font-button-xs"
                      style={{ 
                        background: 'linear-gradient(45deg, #ff6b6b, #ff5252)', 
                        color: 'white', borderColor: '#d32f2f', width: '100%'
                      }}
                    >
                      外す
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* アイテムリスト */}
            <div>
              <div className="comic-text" style={{ 
                color: '#ffd93d', fontSize: 'clamp(1rem, 3vw, 1.3rem)', 
                marginBottom: '12px' 
              }}>
                📦 所持アイテム ({inventory.items.length})
              </div>
              {inventory.items.length === 0 ? (
                <div className="comic-text" style={{ 
                  color: '#c8e6c9', textAlign: 'center', 
                  padding: 'min(20px, 5vw)', fontSize: 'clamp(0.9rem, 3vw, 1rem)'
                }}>
                  アイテムがありません。ガチャを引いて装備を獲得しよう！🌰
                </div>
              ) : (
                <div className="inventory-scroll" style={{ 
                  maxHeight: 'min(400px, 50vh)', 
                  overflowY: 'auto', 
                  overflowX: 'hidden',
                  padding: 'min(4px, 1vw)',
                  border: '2px solid rgba(33, 150, 243, 0.3)',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  marginBottom: '16px'
                }}>
                  <div className="inventory-items-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 40vw), 1fr))', 
                    gap: 'min(8px, 2vw)', 
                    padding: 'min(8px, 2vw)' 
                  }}>
                    {inventory.items.map((item, index) => item ? (
                    <div key={`${item.id}-${index}`} className="comic-card" style={{
                      padding: 'min(12px, 3vw)',
                      background: item.rarity === 'legendary' ? 'rgba(255, 215, 0, 0.1)' :
                                item.rarity === 'epic' ? 'rgba(156, 39, 176, 0.1)' :
                                item.rarity === 'rare' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                      borderColor: item.rarity === 'legendary' ? '#ffd700' :
                                  item.rarity === 'epic' ? '#9c27b0' :
                                  item.rarity === 'rare' ? '#2196f3' : '#9e9e9e'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', marginRight: '8px' }}>{item?.icon || '❓'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="comic-text" style={{ 
                            color: '#fff3e0', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', 
                            fontWeight: 'bold', wordBreak: 'break-word'
                          }}>
                            {item.name}
                          </div>
                          <div className="comic-text" style={{ 
                            color: item.rarity === 'legendary' ? '#ffd700' :
                                  item.rarity === 'epic' ? '#9c27b0' :
                                  item.rarity === 'rare' ? '#2196f3' : '#9e9e9e',
                            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)'
                          }}>
                            {item.rarity.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <div className="comic-text" style={{ 
                        color: '#c8e6c9', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                        marginBottom: '8px', wordBreak: 'break-word'
                      }}>
                        {item.description}
                      </div>
                      <button 
                        onClick={() => equipItem(item)}
                        className="comic-button font-button-xs"
                        style={{ 
                          background: 'linear-gradient(45deg, #4caf50, #45a049)', 
                          color: 'white', borderColor: '#2e7d32', width: '100%'
                        }}
                      >
                        装備する
                      </button>
                    </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => setShowInventory(false)} 
                className="comic-button font-button-sm"
                style={{ 
                  background: 'linear-gradient(45deg, #666, #555)', 
                  color: 'white', 
                  borderColor: '#333'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 装備図鑑モーダル */}
      {showEquipmentCatalog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, overflow: 'auto', padding: '8px'
        }}>
          <div className="comic-card inventory-modal" style={{
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
            padding: 'min(32px, 4vw)', borderColor: '#9c27b0', 
            maxWidth: 'min(700px, 95vw)', width: '100%',
            maxHeight: 'min(80vh, 600px)', position: 'relative'
          }}>
            <div className="comic-text" style={{ 
              color: '#fff3e0', fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', 
              marginBottom: '16px', textAlign: 'center' 
            }}>
              📖 装備図鑑
            </div>
            
            <div className="comic-text" style={{ 
              color: '#c8e6c9', fontSize: 'clamp(0.9rem, 3vw, 1rem)', 
              marginBottom: '20px', textAlign: 'center' 
            }}>
              ガチャで入手できる全装備と所持数
            </div>
            
            <div className="inventory-scroll" style={{
              maxHeight: 'min(60vh, 400px)', overflowY: 'auto',
              padding: 'min(4px, 1vw)',
              border: '2px solid rgba(156, 39, 176, 0.3)',
              borderRadius: '10px',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              {/* 装備カテゴリー別表示 */}
              {['weapon', 'shield', 'accessory'].map(category => {
                const categoryItems = GACHA_ITEMS.filter(item => item.type === category)
                const categoryName = category === 'weapon' ? '武器' : category === 'shield' ? '盾' : 'アクセサリー'
                const categoryIcon = category === 'weapon' ? '⚔️' : category === 'shield' ? '🛡️' : '💎'
                
                return (
                  <div key={category} style={{ marginBottom: '20px' }}>
                    <div className="comic-text" style={{
                      color: '#fff3e0', fontSize: 'clamp(1rem, 3.5vw, 1.3rem)',
                      marginBottom: '12px', textAlign: 'center',
                      textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
                    }}>
                      {categoryIcon} {categoryName}
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 90vw), 1fr))',
                      gap: 'min(12px, 3vw)'
                    }}>
                      {categoryItems.map(item => {
                        const ownedCount = inventory.items.filter(invItem => invItem.id === item.id).length
                        const rarityColor = item.rarity === 'legendary' ? '#ffd700' :
                                          item.rarity === 'epic' ? '#9c27b0' :
                                          item.rarity === 'rare' ? '#2196f3' : '#4caf50'
                        const rarityText = item.rarity === 'legendary' ? 'レジェンド' :
                                         item.rarity === 'epic' ? 'エピック' :
                                         item.rarity === 'rare' ? 'レア' : 'コモン'
                        
                        return (
                          <div key={item.id} className="comic-card" style={{
                            padding: 'min(16px, 4vw)',
                            background: ownedCount > 0 
                              ? `linear-gradient(135deg, ${rarityColor}20, ${rarityColor}10)`
                              : 'linear-gradient(135deg, rgba(100, 100, 100, 0.2), rgba(80, 80, 80, 0.1))',
                            borderColor: ownedCount > 0 ? rarityColor : '#666',
                            opacity: ownedCount > 0 ? 1 : 0.6,
                            position: 'relative'
                          }}>
                            {/* 所持数バッジ */}
                            {ownedCount > 0 && (
                              <div style={{
                                position: 'absolute', top: '-8px', right: '-8px',
                                background: rarityColor, color: 'white',
                                borderRadius: '50%', width: '24px', height: '24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 'bold',
                                border: '2px solid white'
                              }}>
                                {ownedCount}
                              </div>
                            )}
                            
                            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '4px' }}>
                                {item.icon}
                              </div>
                              <div className="comic-text" style={{ 
                                fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', 
                                color: ownedCount > 0 ? '#fff3e0' : '#aaa',
                                marginBottom: '4px'
                              }}>
                                {item.name}
                              </div>
                              <div style={{
                                fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                                color: rarityColor,
                                fontWeight: 'bold',
                                marginBottom: '8px'
                              }}>
                                {rarityText}
                              </div>
                            </div>
                            
                            <div className="comic-text" style={{ 
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                              color: ownedCount > 0 ? '#c8e6c9' : '#888',
                              textAlign: 'center',
                              lineHeight: '1.3'
                            }}>
                              {item.description}
                            </div>
                            
                            {ownedCount === 0 && (
                              <div className="comic-text" style={{
                                fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                                color: '#ff6b6b',
                                textAlign: 'center',
                                marginTop: '8px'
                              }}>
                                未所持
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => setShowEquipmentCatalog(false)} 
                className="comic-button font-button-sm"
                style={{ 
                  background: 'linear-gradient(45deg, #666, #555)', 
                  color: 'white', 
                  borderColor: '#333'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BulletHell

