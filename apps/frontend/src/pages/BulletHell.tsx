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
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
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
      <div style={{ color: 'white' }}>残機: {lives}　（矢印キーで移動 / スペースでショット）</div>
      <canvas ref={canvasRef} width={400} height={280} style={{ border: '4px solid #333', borderRadius: 12, background: '#0b1020', width: 'min(92vw, 480px)', height: 'auto' }} onClick={shoot} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={start} disabled={running} style={{ padding: '8px 12px' }}>{running ? 'プレイ中' : 'スタート'}</button>
        <button onClick={() => setRunning(false)} style={{ padding: '8px 12px' }}>停止</button>
        <button onClick={shoot} disabled={!running} style={{ padding: '8px 12px' }}>ショット</button>
        <span style={{ color: 'white' }}>矢印キーで移動</span>
      </div>
    </div>
  )
}

export default BulletHell

