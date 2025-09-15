import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Heart, Star, Zap, Sparkles } from 'lucide-react';
import './App.css';

interface BouncingBall {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  emoji: string;
}

const App: React.FC = () => {
  const [balls, setBalls] = useState<BouncingBall[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const emojis = ['😀', '😊', '🤩', '🥳', '🎉', '✨', '🌟', '💫', '🎈', '🎊'];

  const createBall = (x: number, y: number): BouncingBall => ({
    id: Date.now() + Math.random(),
    x,
    y,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 30 + 20,
    vx: (Math.random() - 0.5) * 10,
    vy: (Math.random() - 0.5) * 10,
    emoji: emojis[Math.floor(Math.random() * emojis.length)]
  });

  const addBall = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setBalls(prev => [...prev, createBall(x, y)]);
    setScore(prev => prev + 10);
  };

  const startGame = () => {
    setIsPlaying(true);
    setBalls([]);
    setScore(0);
    // 初期ボールを3つ追加
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        setBalls(prev => [...prev, createBall(
          Math.random() * 800 + 100,
          Math.random() * 400 + 100
        )]);
      }, i * 500);
    }
  };

  const stopGame = () => {
    setIsPlaying(false);
    setBalls([]);
    setScore(0);
  };

  const removeBall = (id: number) => {
    setBalls(prev => prev.filter(ball => ball.id !== id));
    setScore(prev => prev + 50);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1000);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setBalls(prev => prev.map(ball => {
        let newX = ball.x + ball.vx;
        let newY = ball.y + ball.vy;
        let newVx = ball.vx;
        let newVy = ball.vy;

        // 壁に当たった時の反射
        if (newX <= 0 || newX >= 800) {
          newVx = -newVx;
          newX = newX <= 0 ? 0 : 800;
        }
        if (newY <= 0 || newY >= 600) {
          newVy = -newVy;
          newY = newY <= 0 ? 0 : 600;
        }

        return {
          ...ball,
          x: newX,
          y: newY,
          vx: newVx * 0.999, // 少しずつ減速
          vy: newVy * 0.999
        };
      }));
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="app">
      <motion.div
        className="header"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.6 }}
      >
        <h1 className="title">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🎪
          </motion.span>
          コミカルボールアリーナ
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            🎪
          </motion.span>
        </h1>
        <div className="score">
          <Star className="star-icon" />
          <span>スコア: {score}</span>
        </div>
      </motion.div>

      <div className="game-area">
        <motion.div
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
                style={{
                  left: ball.x,
                  top: ball.y,
                  backgroundColor: ball.color,
                  width: ball.size,
                  height: ball.size,
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: 1, 
                  rotate: 360,
                  boxShadow: `0 0 ${ball.size}px ${ball.color}`
                }}
                exit={{ 
                  scale: 0, 
                  rotate: 720,
                  opacity: 0 
                }}
                whileHover={{ scale: 1.2 }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeBall(ball.id);
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="ball-emoji">{ball.emoji}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {showCelebration && (
            <motion.div
              className="celebration"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
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
            animate={isPlaying ? { 
              boxShadow: "0 0 20px #FF6B6B",
              backgroundColor: "#FF6B6B"
            } : {
              boxShadow: "0 0 20px #4ECDC4",
              backgroundColor: "#4ECDC4"
            }}
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

          <motion.div
            className="instructions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <p>🎯 クリックしてボールを追加！</p>
            <p>💥 ボールをクリックして消す！</p>
            <p>🏆 高スコアを目指そう！</p>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p>Made with <Smile className="heart" /> and lots of fun!</p>
      </motion.div>
    </div>
  );
};

export default App;