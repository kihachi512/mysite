import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile, Heart, Star, Zap, Sparkles } from 'lucide-react'
import '../App.css'

interface BouncingBall {
  id: number
  x: number
  y: number
  color: string
  size: number
  vx: number
  vy: number
  emoji: string
}

const Minigame: React.FC = () => {
  const [balls, setBalls] = useState<BouncingBall[]>([])
  const [score, setScore] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const areaRef = useRef<HTMLDivElement | null>(null)

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  const emojis = ['😀', '😊', '🤩', '🥳', '🎉', '✨', '🌟', '💫', '🎈', '🎊']

  const getBounds = () => {
    const el = areaRef.current
    return {
      w: el ? el.clientWidth : 800,
      h: el ? el.clientHeight : 600,
    }
  }

  const createBall = (x: number, y: number): BouncingBall => ({
    id: Date.now() + Math.random(),
    x,
    y,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 30 + 20,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.5) * 10,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
  })

  const addBall = (event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    setBalls(prev => [...prev, createBall(x, y)])
    setScore(prev => prev + 10)
  }

  const startGame = () => {
    setIsPlaying(true)
    setBalls([])
    setScore(0)
    const { w, h } = getBounds()
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        setBalls(prev => [
          ...prev,
          createBall(Math.random() * (w - 100) + 50, Math.random() * (h - 100) + 50),
        ])
      }, i * 500)
    }
  }

  const stopGame = () => {
    setIsPlaying(false)
    setBalls([])
    setScore(0)
  }

  const removeBall = (id: number) => {
    setBalls(prev => prev.filter(ball => ball.id !== id))
    setScore(prev => prev + 50)
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 1000)
  }

  useEffect(() => {
    if (!isPlaying) return
    const tick = () => {
      const { w, h } = getBounds()
      setBalls(prev =>
        prev.map(ball => {
          let newX = ball.x + ball.vx
          let newY = ball.y + ball.vy
          let newVx = ball.vx
          let newVy = ball.vy

          if (newX <= 0 || newX >= w) {
            newVx = -newVx
            newX = newX <= 0 ? 0 : w
          }
          if (newY <= 0 || newY >= h) {
            newVy = -newVy
            newY = newY <= 0 ? 0 : h
          }
          return { ...ball, x: newX, y: newY, vx: newVx * 0.999, vy: newVy * 0.999 }
        })
      )
    }
    const interval = setInterval(tick, 16)
    return () => clearInterval(interval)
  }, [isPlaying])

  useEffect(() => {
    const onResize = () => setBalls(prev => [...prev])
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="game-area">
      <div className="score" style={{ marginBottom: 8 }}>
        <Star className="star-icon" />
        <span>スコア: {score}</span>
      </div>
      <motion.div
        ref={areaRef}
        className="playground"
        onClick={addBall}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence>
          {balls.map(ball => (
            <motion.div
              key={ball.id}
              className="ball"
              style={{ left: ball.x, top: ball.y, backgroundColor: ball.color, width: ball.size, height: ball.size }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360, boxShadow: `0 0 ${ball.size}px ${ball.color}` }}
              exit={{ scale: 0, rotate: 720, opacity: 0 }}
              whileHover={{ scale: 1.2 }}
              onClick={e => {
                e.stopPropagation()
                removeBall(ball.id)
              }}
              transition={{ duration: 0.3 }}
            >
              <span className="ball-emoji">{ball.emoji}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {showCelebration && (
          <motion.div className="celebration" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
            <Sparkles className="sparkle" />
            <span>+50!</span>
          </motion.div>
        )}
      </motion.div>

      <div className="controls">
        <motion.button
          className={`control-btn ${isPlaying ? 'stop' : 'start'}`}
          onClick={isPlaying ? stopGame : startGame}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={isPlaying ? { boxShadow: '0 0 20px #FF6B6B', backgroundColor: '#FF6B6B' } : { boxShadow: '0 0 20px #4ECDC4', backgroundColor: '#4ECDC4' }}
        >
          {isPlaying ? (
            <>
              <Zap className="btn-icon" />
              ゲーム停止
            </>
          ) : (
            <>
              <Heart className="btn-icon" />
              ゲーム開始
            </>
          )}
        </motion.button>
        <motion.div className="instructions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <p>🎯 クリックしてボールを追加！</p>
          <p>💥 ボールをクリックして消す！</p>
          <p>🏆 高スコアを目指そう！</p>
        </motion.div>
      </div>
    </div>
  )
}

export default Minigame

