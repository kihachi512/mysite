import React, { useEffect, useRef, useState } from 'react'

type Player = { x: number; y: number; r: number }
type Bullet = { x: number; y: number; vx: number; vy: number; r: number; from: 'player' | 'enemy' }
type Enemy = { x: number; y: number; r: number; hp: number; pattern: number }

const BulletHell: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [lives, setLives] = useState(5)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [highScores, setHighScores] = useState<number[]>([])
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [lastTap, setLastTap] = useState(0)
  const playerRef = useRef<Player>({ x: 200, y: 240, r: 6 })
  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const keysRef = useRef<Record<string, boolean>>({})
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { 
      keysRef.current[e.key] = true
      if (e.key === ' ' && running) {
        e.preventDefault()
        shoot()
      }
    }
    const onUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false }
    
    // Touch controls for mobile - swipe-based movement
    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === canvasRef.current) {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return
        
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top
        
        setTouchStart({ x, y })
        
        // Double tap detection for shooting
        const now = Date.now()
        if (now - lastTap < 300) {
          if (running) {
            bulletsRef.current.push({ x: playerRef.current.x, y: playerRef.current.y - 8, vx: 0, vy: -4, r: 3, from: 'player' })
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
        
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top
        
        const deltaX = x - touchStart.x
        const deltaY = y - touchStart.y
        
        // Move player based on swipe direction
        const player = playerRef.current
        const newX = Math.max(player.r, Math.min(400 - player.r, player.x + deltaX * 0.5))
        const newY = Math.max(player.r, Math.min(280 - player.r, player.y + deltaY * 0.5))
        
        player.x = newX
        player.y = newY
        
        setTouchStart({ x, y })
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

  // Load high scores from localStorage
  useEffect(() => {
    const today = new Date().toDateString()
    const saved = localStorage.getItem(`bullet-hell-scores-${today}`)
    if (saved) {
      try {
        setHighScores(JSON.parse(saved))
      } catch {
        setHighScores([])
      }
    }
  }, [])

  // Save high scores to localStorage
  useEffect(() => {
    if (highScores.length > 0) {
      const today = new Date().toDateString()
      localStorage.setItem(`bullet-hell-scores-${today}`, JSON.stringify(highScores))
    }
  }, [highScores])

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height

    const loop = () => {
      // time
      setTime(t => t + 1)

      // spawn enemies
      if (time % 120 === 0) {
        enemiesRef.current.push({ x: Math.random() * (w - 40) + 20, y: 40, r: 10, hp: 3, pattern: Math.floor(Math.random() * 3) })
      }
      // enemies shoot
      enemiesRef.current.forEach((e, idx) => {
        if (time % 40 === 0) {
          const ang = Math.atan2(playerRef.current.y - e.y, playerRef.current.x - e.x)
          bulletsRef.current.push({ x: e.x, y: e.y, vx: Math.cos(ang) * 2.2, vy: Math.sin(ang) * 2.2, r: 3, from: 'enemy' })
        }
        // simple movement patterns
        if (e.pattern === 0) e.x += Math.sin(time * 0.05 + idx) * 1.2
        if (e.pattern === 1) e.y += Math.sin(time * 0.08 + idx) * 0.8
        if (e.pattern === 2) { e.x += Math.cos(time * 0.06 + idx) * 1.0; e.y += Math.sin(time * 0.06 + idx) * 0.5 }
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

      // collision: enemy bullets with player
      for (const b of bulletsRef.current.filter(b => b.from === 'enemy')) {
        const dx = p.x - b.x, dy = p.y - b.y
        if (dx * dx + dy * dy < (p.r + b.r) * (p.r + b.r)) {
          bulletsRef.current.splice(bulletsRef.current.indexOf(b), 1)
          setLives(v => Math.max(0, v - 1))
          if (lives - 1 <= 0) {
            setRunning(false)
            setGameOver(true)
            // ハイスコアに追加
            setHighScores(prev => {
              const newScores = [...prev, score].sort((a, b) => b - a).slice(0, 10)
              return newScores
            })
          }
        }
      }

      // player bullets hit enemies
      bulletsRef.current.filter(b => b.from === 'player').forEach(b => {
        for (const e of enemiesRef.current) {
          const dx = e.x - b.x, dy = e.y - b.y
          if (dx * dx + dy * dy < (e.r + b.r) * (e.r + b.r)) {
            e.hp -= 1
            bulletsRef.current.splice(bulletsRef.current.indexOf(b), 1)
            setScore(prev => prev + 10) // 敵に当たると10点
            break
          }
        }
      })
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0)
      
      // 敵を倒すと追加スコア
      const killedEnemies = enemiesRef.current.filter(e => e.hp <= 0)
      if (killedEnemies.length > 0) {
        setScore(prev => prev + killedEnemies.length * 50) // 敵を倒すと50点
      }

      // draw
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, w, h)
      // enemies
      ctx.fillStyle = '#FFD166'
      for (const e of enemiesRef.current) { ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill() }
      // bullets
      ctx.fillStyle = '#ffadad'
      for (const b of bulletsRef.current) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = '#4ECDC4'
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      
      // draw score
      ctx.fillStyle = '#fff3e0'
      ctx.font = 'bold 16px Comic Sans MS'
      ctx.fillText(`スコア: ${score}`, 10, 25)

      if (running) rafRef.current = requestAnimationFrame(loop)
    }
    if (running) rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running, time])

  const start = () => {
    bulletsRef.current = []
    enemiesRef.current = []
    playerRef.current = { x: 200, y: 240, r: 6 }
    setLives(5)
    setTime(0)
    setScore(0)
    setGameOver(false)
    setRunning(true)
  }

  const shoot = () => {
    if (!running) return
    bulletsRef.current.push({ x: playerRef.current.x, y: playerRef.current.y - 8, vx: 0, vy: -4, r: 3, from: 'player' })
  }

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
      <div style={{ color: '#fff3e0', textAlign: 'center' }}>
        <div className="comic-text" style={{ fontSize: '1.4rem', textShadow: '3px 3px 0px #2e7d32, 0 0 10px rgba(255,255,255,0.3)' }}>残機: {lives}</div>
        <div className="comic-text" style={{ fontSize: '1rem', marginTop: 6, color: '#c8e6c9' }}>矢印キーで移動 / スペースでショット / スマホはスワイプで移動・ダブルタップでショット</div>
      </div>
      <canvas ref={canvasRef} width={400} height={280} style={{ border: '4px solid #333', borderRadius: 12, background: '#0b1020', width: 'min(92vw, 480px)', height: 'auto', touchAction: 'none' }} onClick={shoot} />
      
      {gameOver && (
        <div className="comic-card" style={{ 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
          padding: '24px', 
          borderColor: '#8bc34a',
          textAlign: 'center',
          marginTop: '12px'
        }}>
          <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.6rem', marginBottom: '16px' }}>🎮 ゲームオーバー 🎮</div>
          <div className="comic-text" style={{ color: '#c8e6c9', fontSize: '1.2rem', marginBottom: '16px' }}>最終スコア: {score}</div>
          {highScores.length > 0 && (
            <div>
              <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.2rem', marginBottom: '12px' }}>🏆 今日のハイスコア 🏆</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                {highScores.slice(0, 5).map((score, index) => (
                  <div key={index} className="comic-text" style={{ 
                    color: index === 0 ? '#ffd700' : '#c8e6c9', 
                    fontSize: '1rem',
                    fontWeight: index === 0 ? 'bold' : 'normal'
                  }}>
                    {index + 1}位: {score}点
                  </div>
                ))}
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
        >
          {running ? 'プレイ中' : 'スタート'}
        </button>
      </div>
    </div>
  )
}

export default BulletHell

