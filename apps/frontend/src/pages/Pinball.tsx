import React, { useEffect, useRef, useState } from 'react'

type Ball = { x: number; y: number; vx: number; vy: number; r: number }
type Bumper = { x: number; y: number; r: number }

const Pinball: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [score, setScore] = useState(0)
  const [running, setRunning] = useState(false)

  const ballRef = useRef<Ball>({ x: 150, y: 50, vx: 2, vy: 1, r: 8 })
  const bumpersRef = useRef<Bumper[]>([
    { x: 80, y: 100, r: 16 },
    { x: 160, y: 160, r: 16 },
    { x: 220, y: 90, r: 16 },
  ])
  const rafRef = useRef<number | null>(null)

  const reset = () => {
    ballRef.current = { x: 150, y: 50, vx: 2, vy: 1, r: 8 }
    setScore(0)
  }

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

      // draw
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#0e1726'
      ctx.fillRect(0, 0, width, height)

      // bumpers
      ctx.fillStyle = '#FFD166'
      for (const b of bumpersRef.current) {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill()
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
      <div style={{ color: 'white' }}>スコア: {score}</div>
      <canvas ref={canvasRef} width={300} height={400} style={{ border: '4px solid #333', borderRadius: 12, background: '#0e1726' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={launch} disabled={running} style={{ padding: '8px 12px' }}>{running ? 'プレイ中' : 'スタート'}</button>
        <button onClick={() => setRunning(false)} style={{ padding: '8px 12px' }}>停止</button>
      </div>
    </div>
  )
}

export default Pinball

