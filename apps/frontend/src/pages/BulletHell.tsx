import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAppData } from '../contexts/AppDataContext'

type Player = { x: number; y: number; r: number; fireRate: number; power: number }
type Bullet = { x: number; y: number; vx: number; vy: number; r: number; from: 'player' | 'enemy'; power?: number }
type Enemy = { x: number; y: number; r: number; hp: number; pattern: number; maxHp: number }
type PowerUp = { x: number; y: number; r: number; type: 'fireRate' | 'power' | 'shield'; collected: boolean }

const BulletHell: React.FC = () => {
  const { momoPayPoints, addMomoPayPoints } = useAppData()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [lives, setLives] = useState(5)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [highScores, setHighScores] = useState<number[]>([])
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [lastTap, setLastTap] = useState(0)
  const [shield, setShield] = useState(0)
  const [wave, setWave] = useState(1)
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
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        
        const x = (touch.clientX - rect.left) * (400 / rect.width)
        const y = (touch.clientY - rect.top) * (280 / rect.height)
        
        // より直感的な操作：タッチ位置に向かってプレイヤーを移動
        const player = playerRef.current
        const targetX = Math.max(player.r, Math.min(400 - player.r, x))
        const targetY = Math.max(player.r, Math.min(280 - player.r, y))
        
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
  }, [lastTap, touchStart, running])

  // Load high scores from localStorage (通算記録)
  useEffect(() => {
    const saved = localStorage.getItem('bullet-hell-all-time-scores')
    if (saved) {
      try {
        setHighScores(JSON.parse(saved))
      } catch {
        setHighScores([])
      }
    }
  }, [])

  // Save high scores to localStorage (通算記録)
  useEffect(() => {
    if (highScores.length > 0) {
      localStorage.setItem('bullet-hell-all-time-scores', JSON.stringify(highScores))
    }
  }, [highScores])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height

    const loop = () => {
      // time
      setTime(t => t + 1)

      // spawn enemies (difficulty increases with waves)
      const spawnRate = Math.max(60, 120 - wave * 10)
      if (time % spawnRate === 0) {
        const enemyHp = Math.min(2 + Math.floor(wave / 2), 8)
        enemiesRef.current.push({ 
          x: Math.random() * (w - 40) + 20, 
          y: 40, 
          r: 10, 
          hp: enemyHp, 
          maxHp: enemyHp,
          pattern: Math.floor(Math.random() * Math.min(3 + Math.floor(wave / 3), 6))
        })
      }

      // spawn power-ups occasionally
      if (time % 600 === 0 && Math.random() < 0.7) {
        const powerUpTypes: PowerUp['type'][] = ['fireRate', 'power', 'shield']
        powerUpsRef.current.push({
          x: Math.random() * (w - 40) + 20,
          y: 60,
          r: 8,
          type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
          collected: false
        })
      }
      // enemies shoot
      enemiesRef.current.forEach((e, idx) => {
        if (time % 40 === 0) {
          const ang = Math.atan2(playerRef.current.y - e.y, playerRef.current.x - e.x)
          bulletsRef.current.push({ x: e.x, y: e.y, vx: Math.cos(ang) * 2.2, vy: Math.sin(ang) * 2.2, r: 3, from: 'enemy' })
        }
        // enhanced movement patterns
        if (e.pattern === 0) e.x += Math.sin(time * 0.05 + idx) * 1.2
        if (e.pattern === 1) e.y += Math.sin(time * 0.08 + idx) * 0.8
        if (e.pattern === 2) { e.x += Math.cos(time * 0.06 + idx) * 1.0; e.y += Math.sin(time * 0.06 + idx) * 0.5 }
        if (e.pattern === 3) { e.x += Math.sin(time * 0.04 + idx) * 2.0; e.y += 0.3 }
        if (e.pattern === 4) { e.x += Math.cos(time * 0.07 + idx) * 1.5; e.y += Math.cos(time * 0.05 + idx) * 1.0 }
        if (e.pattern === 5) { 
          const spiral = time * 0.03 + idx
          e.x += Math.cos(spiral) * 1.8; 
          e.y += Math.sin(spiral) * 1.2 + 0.2
        }
      })

      // move player
      const p = playerRef.current
      const s = 3
      if (keysRef.current['ArrowLeft']) p.x -= s
      if (keysRef.current['ArrowRight']) p.x += s
      if (keysRef.current['ArrowUp']) p.y -= s
      if (keysRef.current['ArrowDown']) p.y += s
      p.x = Math.max(p.r, Math.min(w - p.r, p.x))
      p.y = Math.max(p.r, Math.min(h - p.r, p.y))

      // move bullets
      bulletsRef.current.forEach(b => { b.x += b.vx; b.y += b.vy })
      bulletsRef.current = bulletsRef.current.filter(b => b.x > -10 && b.x < w + 10 && b.y > -10 && b.y < h + 10)

      // move power-ups
      powerUpsRef.current.forEach(p => { p.y += 1 })
      powerUpsRef.current = powerUpsRef.current.filter(p => p.y < h + 10 && !p.collected)

      // collect power-ups
      for (const powerUp of powerUpsRef.current) {
        const dx = p.x - powerUp.x, dy = p.y - powerUp.y
        if (dx * dx + dy * dy < (p.r + powerUp.r) * (p.r + powerUp.r)) {
          powerUp.collected = true
          if (powerUp.type === 'fireRate') {
            playerRef.current.fireRate = Math.min(playerRef.current.fireRate + 0.3, 3)
          } else if (powerUp.type === 'power') {
            playerRef.current.power = Math.min(playerRef.current.power + 0.5, 3)
          } else if (powerUp.type === 'shield') {
            setShield(s => Math.min(s + 30, 60))
          }
          setScore(prev => prev + 25) // パワーアップ取得で25点
        }
      }

      // collision: enemy bullets with player
      for (const b of bulletsRef.current.filter(b => b.from === 'enemy')) {
        const dx = p.x - b.x, dy = p.y - b.y
        if (dx * dx + dy * dy < (p.r + b.r) * (p.r + b.r)) {
          bulletsRef.current.splice(bulletsRef.current.indexOf(b), 1)
          if (shield > 0) {
            setShield(s => Math.max(0, s - 10))
          } else {
            setLives(v => Math.max(0, v - 1))
            if (lives - 1 <= 0) {
              setRunning(false)
              setGameOver(true)
              // ハイスコアに追加（TOP3のみ保持）
              setHighScores(prev => {
                const newScores = [...prev, score].sort((a, b) => b - a).slice(0, 3)
                return newScores
              })
              // スコアをMOMOPayポイントに変換（10スコア = 1ポイント）
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
            setScore(prev => prev + 10 * damage) // ダメージに応じてスコア
            break
          }
        }
      })
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0)
      
      // 敵を倒すと追加スコア
      const killedEnemyCount = beforeEnemyCount - enemiesRef.current.length
      if (killedEnemyCount > 0) {
        setScore(prev => prev + killedEnemyCount * 50) // 敵を倒すと50点
      }

      // ウェーブ進行チェック（30秒ごと）
      if (time > 0 && time % 1800 === 0) {
        setWave(w => w + 1)
        setScore(prev => prev + wave * 100) // ウェーブクリアボーナス
      }

      // draw
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, w, h)
      
      // enemies with HP bars
      for (const e of enemiesRef.current) {
        ctx.fillStyle = '#FFD166'
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill()
        
        // HP bar
        if (e.hp < e.maxHp) {
          const barWidth = 20
          const barHeight = 3
          ctx.fillStyle = '#ff4444'
          ctx.fillRect(e.x - barWidth/2, e.y - e.r - 8, barWidth, barHeight)
          ctx.fillStyle = '#44ff44'
          ctx.fillRect(e.x - barWidth/2, e.y - e.r - 8, barWidth * (e.hp / e.maxHp), barHeight)
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
      
      // player with shield effect
      if (shield > 0) {
        ctx.strokeStyle = '#ffd93d'
        ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.fillStyle = '#4ECDC4'
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      
      // draw UI
      ctx.fillStyle = '#fff3e0'
      ctx.font = 'bold 16px Comic Sans MS'
      ctx.textAlign = 'left'
      ctx.fillText(`スコア: ${score}`, 10, 25)
      ctx.fillText(`ウェーブ: ${wave}`, 10, 45)
      
      // power-up status
      ctx.font = 'bold 12px Comic Sans MS'
      ctx.fillText(`連射: ${playerRef.current.fireRate.toFixed(1)}x`, 10, 65)
      ctx.fillText(`威力: ${playerRef.current.power.toFixed(1)}x`, 10, 80)
      if (shield > 0) {
        ctx.fillStyle = '#ffd93d'
        ctx.fillText(`シールド: ${shield}`, 10, 95)
      }

      if (running) rafRef.current = requestAnimationFrame(loop)
    }
    if (running) rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running, time])

  const start = useCallback(() => {
    bulletsRef.current = []
    enemiesRef.current = []
    powerUpsRef.current = []
    playerRef.current = { x: 200, y: 240, r: 6, fireRate: 1, power: 1 }
    lastShotRef.current = 0
    setLives(5)
    setTime(0)
    setScore(0)
    setShield(0)
    setWave(1)
    setGameOver(false)
    setRunning(true)
  }, [])

  const shoot = useCallback(() => {
    if (!running) return
    const now = Date.now()
    const fireDelay = 200 / playerRef.current.fireRate // 連射速度に応じた発射間隔
    if (now - lastShotRef.current < fireDelay) return
    
    lastShotRef.current = now
    const player = playerRef.current
    
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
  }, [running])

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
      <div style={{ color: '#fff3e0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div className="comic-text" style={{ fontSize: '1.4rem', textShadow: '3px 3px 0px #2e7d32, 0 0 10px rgba(255,255,255,0.3)' }}>残機: {lives}</div>
          <div className="comic-text" style={{ fontSize: '1.4rem', textShadow: '3px 3px 0px #2e7d32, 0 0 10px rgba(255,255,255,0.3)' }}>ウェーブ: {wave}</div>
          <div className="comic-text" style={{ fontSize: '1.2rem', color: '#ffd93d', textShadow: '2px 2px 0px #f57f17, 0 0 8px rgba(255,217,61,0.5)' }}>
            💰 MOMOPay: {momoPayPoints}
          </div>
          {shield > 0 && (
            <div className="comic-text" style={{ fontSize: '1.2rem', color: '#ffd93d', textShadow: '2px 2px 0px #f57f17, 0 0 8px rgba(255,217,61,0.5)' }}>
              🛡️ シールド: {shield}
            </div>
          )}
        </div>
        <div className="comic-text" style={{ fontSize: '1rem', marginTop: 6, color: '#c8e6c9' }}>
          矢印キーで移動 / スペースでショット / パワーアップ(F:連射 P:威力 S:シールド)を取ろう！
        </div>
        <div className="comic-text" style={{ fontSize: '0.9rem', marginTop: 4, color: '#a5d6a7' }}>
          スマホ：スワイプで移動・ダブルタップでショット
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={280} 
        style={{ border: '4px solid #333', borderRadius: 12, background: '#0b1020', width: 'min(92vw, 480px)', height: 'auto', touchAction: 'none' }} 
        onClick={shoot}
        role="application"
        aria-label="弾幕シューティングゲーム。矢印キーで移動、スペースキーで発射。"
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
          <div className="comic-text" style={{ color: '#ffd93d', fontSize: '1.1rem', marginBottom: '16px' }}>
            💰 獲得MOMOPay: {Math.floor(score / 10)}ポイント
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
      
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={start} 
          disabled={running} 
          className="comic-button"
          style={{ 
            padding: '12px 20px', 
            background: running ? '#666' : 'linear-gradient(45deg, #66bb6a, #4caf50)', 
            color: 'white', 
            borderColor: running ? '#333' : '#2e7d32'
          }}
          aria-label={running ? 'ゲーム実行中' : 'ゲームを開始する'}
        >
          {running ? 'プレイ中' : 'スタート'}
        </button>
      </div>
    </div>
  )
}

export default BulletHell

