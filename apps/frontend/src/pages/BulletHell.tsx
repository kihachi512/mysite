import React, { useEffect, useRef, useState } from 'react'

type Player = { x: number; y: number; r: number }
type Bullet = { x: number; y: number; vx: number; vy: number; r: number; from: 'player' | 'enemy' }
type Enemy = { x: number; y: number; r: number; hp: number; pattern: number }

const BulletHell: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const [lives, setLives] = useState(5)
  const playerRef = useRef<Player>({ x: 200, y: 240, r: 6 })
  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const keysRef = useRef<Record<string, boolean>>({})
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true }
    const onUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false }
    
    // Touch controls for mobile
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      
      // Determine direction based on touch position relative to player
      const playerX = playerRef.current.x
      const playerY = playerRef.current.y
      
      if (x < playerX - 20) keysRef.current['ArrowLeft'] = true
      else if (x > playerX + 20) keysRef.current['ArrowRight'] = true
      
      if (y < playerY - 20) keysRef.current['ArrowUp'] = true
      else if (y > playerY + 20) keysRef.current['ArrowDown'] = true
    }
    
    const handleTouchEnd = () => {
      keysRef.current['ArrowLeft'] = false
      keysRef.current['ArrowRight'] = false
      keysRef.current['ArrowUp'] = false
      keysRef.current['ArrowDown'] = false
    }
    
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    
    return () => { 
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

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
          setLives(v => v - 1)
          if (lives - 1 <= 0) setRunning(false)
        }
      }

      // player bullets hit enemies
      bulletsRef.current.filter(b => b.from === 'player').forEach(b => {
        for (const e of enemiesRef.current) {
          const dx = e.x - b.x, dy = e.y - b.y
          if (dx * dx + dy * dy < (e.r + b.r) * (e.r + b.r)) {
            e.hp -= 1
            bulletsRef.current.splice(bulletsRef.current.indexOf(b), 1)
            break
          }
        }
      })
      enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0)

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
    setRunning(true)
  }

  const shoot = () => {
    if (!running) return
    bulletsRef.current.push({ x: playerRef.current.x, y: playerRef.current.y - 8, vx: 0, vy: -4, r: 3, from: 'player' })
  }

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
      <div style={{ color: 'white', textAlign: 'center' }}>
        <div>残機: {lives}</div>
        <div style={{ fontSize: '0.9rem', marginTop: 4 }}>矢印キーで移動 / スペースでショット / スマホはタップで移動</div>
      </div>
      <canvas ref={canvasRef} width={400} height={280} style={{ border: '4px solid #333', borderRadius: 12, background: '#0b1020', width: 'min(92vw, 480px)', height: 'auto', touchAction: 'none' }} onClick={shoot} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={start} disabled={running} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: running ? '#666' : '#4ECDC4', color: 'white' }}>{running ? 'プレイ中' : 'スタート'}</button>
        <button onClick={() => setRunning(false)} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#FF6B6B', color: 'white' }}>停止</button>
        <button onClick={shoot} disabled={!running} style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: !running ? '#666' : '#45B7D1', color: 'white' }}>ショット</button>
      </div>
    </div>
  )
}

export default BulletHell

