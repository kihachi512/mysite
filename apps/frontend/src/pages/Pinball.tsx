import React, { useEffect, useRef, useState } from 'react'

type Ball = { x: number; y: number; vx: number; vy: number; r: number }
type Bumper = { x: number; y: number; r: number }
type Flipper = { x: number; y: number; length: number; angle: number; pivot: { x: number; y: number }; dir: 1 | -1; active: boolean }

const Pinball: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState(0)
  const [running, setRunning] = useState(false)

  const ballRef = useRef<Ball>({ x: 150, y: 320, vx: 0, vy: -6, r: 8 })
  const bumpersRef = useRef<Bumper[]>([
    { x: 80, y: 100, r: 16 },
    { x: 160, y: 160, r: 16 },
    { x: 220, y: 90, r: 16 },
  ])
  const flippersRef = useRef<Flipper[]>([
    { x: 100, y: 360, length: 50, angle: -0.6, pivot: { x: 80, y: 360 }, dir: 1, active: false },
    { x: 200, y: 360, length: 50, angle: 0.6, pivot: { x: 220, y: 360 }, dir: -1, active: false },
  ])
  const keysRef = useRef<Record<string, boolean>>({})
  const rafRef = useRef<number | null>(null)

  const reset = () => {
    ballRef.current = { x: 150, y: 320, vx: 0, vy: -6, r: 8 }
    setScore(0)
  }

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
    const width = canvas.width
    const height = canvas.height

    const loop = () => {
      const ball = ballRef.current
      // physics
      ball.vy += 0.15 // gravity
      ball.x += ball.vx
      ball.y += ball.vy

      // input -> flippers
      flippersRef.current[0].active = !!(keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A'])
      flippersRef.current[1].active = !!(keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D'])
      const maxAngle = 0.9
      const restAngles = [-0.6, 0.6]
      flippersRef.current.forEach((f, idx) => {
        const target = f.active ? f.dir * maxAngle : restAngles[idx]
        f.angle += (target - f.angle) * 0.25
      })

      // walls
      if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -0.9 }
      if (ball.x + ball.r > width) { ball.x = width - ball.r; ball.vx *= -0.9 }
      if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -0.9 }
      if (ball.y + ball.r > height) {
        setRunning(false)
      }

      // bumpers collision
      for (const b of bumpersRef.current) {
        const dx = ball.x - b.x
        const dy = ball.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist < ball.r + b.r) {
          const nx = dx / dist
          const ny = dy / dist
          const speed = Math.hypot(ball.vx, ball.vy)
          ball.vx = nx * Math.max(3, speed)
          ball.vy = ny * Math.max(3, speed)
          setScore(s => s + 10)
        }
      }

      // flippers collision (approximate segment reflect)
      for (const f of flippersRef.current) {
        const ax = f.pivot.x, ay = f.pivot.y
        const bx = ax + Math.cos(f.angle) * f.length
        const by = ay + Math.sin(f.angle) * f.length
        // distance from ball center to segment
        const vx = bx - ax, vy = by - ay
        const wx = ball.x - ax, wy = ball.y - ay
        const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)))
        const px = ax + t * vx, py = ay + t * vy
        const dx = ball.x - px, dy = ball.y - py
        const dist2 = dx * dx + dy * dy
        const rr = ball.r + 3
        if (dist2 < rr * rr) {
          // normal
          const dist = Math.sqrt(dist2) || 1
          const nx = dx / dist, ny = dy / dist
          const dot = ball.vx * nx + ball.vy * ny
          ball.vx = ball.vx - 2 * dot * nx + nx * 4
          ball.vy = ball.vy - 2 * dot * ny - ny * 4
          if (f.active) setScore(s => s + 5)
        }
      }

      // draw
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#0e1726'
      ctx.fillRect(0, 0, width, height)

      // bumpers
      ctx.fillStyle = '#FFD166'
      for (const b of bumpersRef.current) {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill()
      }

      // flippers
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 6
      for (const f of flippersRef.current) {
        ctx.beginPath()
        ctx.moveTo(f.pivot.x, f.pivot.y)
        ctx.lineTo(f.pivot.x + Math.cos(f.angle) * f.length, f.pivot.y + Math.sin(f.angle) * f.length)
        ctx.stroke()
      }

      // ball
      ctx.fillStyle = '#4ECDC4'
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill()

      if (running) rafRef.current = requestAnimationFrame(loop)
    }

    if (running) rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [running])

  const launch = () => {
    reset()
    setRunning(true)
  }

  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
      <div style={{ color: 'white' }}>スコア: {score}　（← → でフリッパー）</div>
      <canvas ref={canvasRef} width={300} height={400} style={{ border: '4px solid #333', borderRadius: 12, background: '#0e1726', width: 'min(92vw, 340px)', height: 'auto' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={launch} disabled={running} style={{ padding: '8px 12px' }}>{running ? 'プレイ中' : 'スタート'}</button>
        <button onClick={() => setRunning(false)} style={{ padding: '8px 12px' }}>停止</button>
      </div>
    </div>
  )
}

export default Pinball

