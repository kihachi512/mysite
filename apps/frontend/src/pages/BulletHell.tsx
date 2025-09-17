import React, { useEffect, useRef, useState } from 'react'

type Player = { x: number; y: number; r: number }
type Bullet = { x: number; y: number; vx: number; vy: number; r: number }

const BulletHell: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const playerRef = useRef<Player>({ x: 200, y: 240, r: 6 })
  const bulletsRef = useRef<Bullet[]>([])
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
      // spawn pattern
      setTime(t => t + 1)
      if (time % 20 === 0) {
        const num = 16
        const speed = 2 + Math.random() * 1.5
        for (let i = 0; i < num; i++) {
          const ang = (i / num) * Math.PI * 2 + time * 0.02
          bulletsRef.current.push({ x: w / 2, y: 80, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: 3 })
        }
      }

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

      // collision
      for (const b of bulletsRef.current) {
        const dx = p.x - b.x, dy = p.y - b.y
        if (dx * dx + dy * dy < (p.r + b.r) * (p.r + b.r)) {
          setRunning(false)
        }
      }

      // draw
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, w, h)
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
    playerRef.current = { x: 200, y: 240, r: 6 }
    setTime(0)
    setRunning(true)
  }

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
      <canvas ref={canvasRef} width={400} height={280} style={{ border: '4px solid #333', borderRadius: 12, background: '#0b1020' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={start} disabled={running} style={{ padding: '8px 12px' }}>{running ? 'プレイ中' : 'スタート'}</button>
        <button onClick={() => setRunning(false)} style={{ padding: '8px 12px' }}>停止</button>
        <span style={{ color: 'white' }}>矢印キーで移動</span>
      </div>
    </div>
  )
}

export default BulletHell

