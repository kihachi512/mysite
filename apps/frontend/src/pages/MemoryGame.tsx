import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO } from '../hooks/useSEO'
import { trackMemoryGamePlayed, trackAreaVisited, AREAS } from '../utils/achievements'

type CardSymbol = '🐿️' | '🌰' | '🌲' | '🍂' | '🌙' | '⭐' | '🌈' | '🎈' | '🎭' | '🎪' | '🎨' | '🎯' | '🎮' | '🎲' | '🎪' | '🎊'

type Card = {
  id: number
  symbol: CardSymbol
  isFlipped: boolean
  isMatched: boolean
}

type GameDifficulty = 'easy' | 'normal' | 'hard'

type GameState = 'menu' | 'playing' | 'completed'

type GameStats = {
  moves: number
  matches: number
  time: number
  started: boolean
  startTime?: number
}

const SYMBOLS: CardSymbol[] = ['🐿️', '🌰', '🌲', '🍂', '🌙', '⭐', '🌈', '🎈', '🎭', '🎪', '🎨', '🎯', '🎮', '🎲', '🎪', '🎊']

const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, gridCols: 4, reward: 40 },
  normal: { pairs: 8, gridCols: 4, reward: 70 },
  hard: { pairs: 12, gridCols: 6, reward: 120 }
}

const MemoryGame: React.FC = () => {
  useSEO({
    title: '記憶力ゲーム',
    description: '神経衰弱風の記憶力ゲーム。同じ絵柄のカードを2枚揃えよう！3つの難易度でMOMOPayを獲得。集中力と記憶力を鍛える脳トレゲーム。',
    keywords: '記憶力ゲーム,神経衰弱,カードゲーム,脳トレ,記憶力,集中力,MOMOPay,無料ゲーム,ブラウザゲーム',
    ogTitle: '記憶力ゲーム | モモンガカーニバル',
    ogDescription: '神経衰弱風記憶力ゲーム！同じ絵柄を探してMOMOPayを獲得しよう。'
  });

  const { addMomoPayPoints } = useAppData()
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy')
  const [cards, setCards] = useState<Card[]>([])
  const [gameState, setGameState] = useState<GameState>('menu')
  const [stats, setStats] = useState<GameStats>({
    moves: 0,
    matches: 0,
    time: 0,
    started: false
  })
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [isChecking, setIsChecking] = useState(false)

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.GAMES)
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (gameState === 'playing' && stats.started && stats.startTime) {
      interval = setInterval(() => {
        setStats(prev => ({
          ...prev,
          time: prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : 0
        }))
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
    }
  }, [gameState, stats.started, stats.startTime])

  // Initialize cards for difficulty
  const initializeCards = (difficulty: GameDifficulty): Card[] => {
    const config = DIFFICULTY_CONFIG[difficulty]
    const selectedSymbols = SYMBOLS.slice(0, config.pairs)
    
    // Create pairs
    const cardSymbols: CardSymbol[] = [...selectedSymbols, ...selectedSymbols]
    
    // Shuffle
    const shuffledSymbols = cardSymbols.sort(() => Math.random() - 0.5)
    
    // Create card objects
    return shuffledSymbols.map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false
    }))
  }

  // Start new game
  const startNewGame = (selectedDifficulty: GameDifficulty) => {
    setDifficulty(selectedDifficulty)
    const newCards = initializeCards(selectedDifficulty)
    setCards(newCards)
    setStats({
      moves: 0,
      matches: 0,
      time: 0,
      started: true,
      startTime: Date.now()
    })
    setFlippedCards([])
    setIsChecking(false)
    setGameState('playing')
  }

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (isChecking || gameState !== 'playing') return
    
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return
    
    if (flippedCards.length < 2) {
      // Flip card
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, isFlipped: true } : c
      ))
      
      const newFlippedCards = [...flippedCards, cardId]
      setFlippedCards(newFlippedCards)
      
      if (newFlippedCards.length === 2) {
        setIsChecking(true)
        const [firstCardId, secondCardId] = newFlippedCards
        const firstCard = cards.find(c => c.id === firstCardId)!
        const secondCard = cards.find(c => c.id === secondCardId)!
        
        setTimeout(() => {
          if (firstCard.symbol === secondCard.symbol) {
            // Match found
            setCards(prev => prev.map(c => 
              (c.id === firstCardId || c.id === secondCardId) 
                ? { ...c, isMatched: true }
                : c
            ))
            setStats(prev => ({ ...prev, matches: prev.matches + 1 }))
            
            // Check if game complete
            const totalMatches = DIFFICULTY_CONFIG[difficulty].pairs
            if (stats.matches + 1 === totalMatches) {
              setGameState('completed')
              
              // Calculate reward
              const baseReward = DIFFICULTY_CONFIG[difficulty].reward
              const timeBonus = Math.max(0, 300 - stats.time)
              const moveBonus = Math.max(0, (totalMatches * 10) - stats.moves)
              const totalReward = baseReward + Math.floor(timeBonus / 15) + Math.floor(moveBonus / 3)
              
              addMomoPayPoints(totalReward)
              trackMemoryGamePlayed()
              
              setTimeout(() => {
                alert(`🎉 全てのペアを見つけました！\n\n移動回数: ${stats.moves + 1}\n所要時間: ${formatTime(stats.time)}\nマッチ数: ${totalMatches}\n\n獲得MOMOPay: ${totalReward}\n（基本: ${baseReward} + ボーナス: ${totalReward - baseReward}）`)
              }, 500)
            }
          } else {
            // No match - flip back
            setCards(prev => prev.map(c => 
              (c.id === firstCardId || c.id === secondCardId) 
                ? { ...c, isFlipped: false }
                : c
            ))
          }
          
          setStats(prev => ({ ...prev, moves: prev.moves + 1 }))
          setFlippedCards([])
          setIsChecking(false)
        }, 1000)
      }
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get progress percentage
  const getProgress = (): number => {
    const totalMatches = DIFFICULTY_CONFIG[difficulty].pairs
    return (stats.matches / totalMatches) * 100
  }

  // Render menu
  const renderMenu = () => (
    <div style={{ textAlign: 'center' }}>
      <div className="comic-text font-title-sm" style={{ 
        color: '#fff3e0',
        marginBottom: 'min(24px, 6vw)'
      }}>
        難易度を選択してください
      </div>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'min(16px, 4vw)', 
        maxWidth: '400px', 
        margin: '0 auto'
      }}>
        <button 
          onClick={() => startNewGame('easy')}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32',
            padding: 'min(16px, 4vw)'
          }}
        >
          🟢 簡単 (6ペア) - 基本報酬 40P
        </button>
        
        <button 
          onClick={() => startNewGame('normal')}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #ff9800, #f57c00)',
            color: 'white',
            borderColor: '#e65100',
            padding: 'min(16px, 4vw)'
          }}
        >
          🟡 普通 (8ペア) - 基本報酬 70P
        </button>
        
        <button 
          onClick={() => startNewGame('hard')}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #f44336, #d32f2f)',
            color: 'white',
            borderColor: '#b71c1c',
            padding: 'min(16px, 4vw)'
          }}
        >
          🔴 難しい (12ペア) - 基本報酬 120P
        </button>
      </div>
      
      <div className="comic-text font-body-md" style={{ 
        color: '#c8e6c9',
        marginTop: 'min(24px, 6vw)',
        lineHeight: '1.6'
      }}>
        同じ絵柄のカードを2枚揃えよう！<br />
        裏向きのカードをクリックしてめくる<br />
        早く少ない手数でクリアするとボーナス！
      </div>
    </div>
  )

  // Render game
  const renderGame = () => {
    const config = DIFFICULTY_CONFIG[difficulty]
    
    return (
      <div style={{ textAlign: 'center' }}>
        {/* Game stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          marginBottom: 'min(20px, 5vw)',
          flexWrap: 'wrap',
          gap: 'min(12px, 3vw)'
        }}>
          <div className="comic-text font-body-md" style={{ color: '#c8e6c9' }}>
            手数: {stats.moves}
          </div>
          <div className="comic-text font-body-md" style={{ color: '#c8e6c9' }}>
            時間: {formatTime(stats.time)}
          </div>
          <div className="comic-text font-body-md" style={{ color: '#c8e6c9' }}>
            ペア: {stats.matches}/{config.pairs}
          </div>
        </div>

        {/* Progress bar */}
        <div className="comic-card" style={{
          background: 'rgba(255,255,255,0.1)',
          borderColor: '#8bc34a',
          padding: '8px',
          maxWidth: '400px',
          margin: '0 auto min(20px, 5vw) auto'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            height: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
              height: '100%',
              width: `${getProgress()}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Cards grid */}
        <div 
          className="comic-card memory-board"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${config.gridCols}, 1fr)`,
            gap: '12px',
            maxWidth: difficulty === 'hard' ? 'min(600px, 95vw)' : 'min(500px, 90vw)',
            margin: '0 auto min(24px, 6vw) auto',
            padding: '16px',
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
            borderColor: '#9c27b0'
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="comic-card memory-card"
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: difficulty === 'hard' ? '2rem' : '2.5rem',
                cursor: (!card.isFlipped && !card.isMatched && !isChecking) ? 'pointer' : 'default',
                background: card.isFlipped || card.isMatched
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))'
                  : 'linear-gradient(135deg, rgba(66, 66, 66, 0.3), rgba(97, 97, 97, 0.2))',
                borderColor: card.isFlipped || card.isMatched ? '#4caf50' : '#666',
                color: card.isFlipped || card.isMatched ? '#fff' : '#999',
                transition: 'all 0.3s ease',
                transform: card.isMatched ? 'scale(0.9)' : 'scale(1)',
                opacity: card.isMatched ? 0.7 : 1,
                minHeight: 'clamp(80px, 15vw, 120px)',
                minWidth: 'clamp(80px, 15vw, 120px)',
                padding: '8px',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (!card.isFlipped && !card.isMatched && !isChecking) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!card.isMatched) {
                  e.currentTarget.style.transform = card.isMatched ? 'scale(0.9)' : 'scale(1)'
                }
              }}
            >
              {(card.isFlipped || card.isMatched) ? card.symbol : '❓'}
            </div>
          ))}
        </div>

        {/* Game controls */}
        <div style={{ 
          display: 'flex', 
          gap: 'min(12px, 3vw)', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => setGameState('menu')}
            className="comic-button font-button-sm"
            style={{
              background: 'linear-gradient(45deg, #666, #555)',
              color: 'white',
              borderColor: '#333'
            }}
          >
            メニューに戻る
          </button>
          
          <button 
            onClick={() => startNewGame(difficulty)}
            className="comic-button font-button-sm"
            style={{
              background: 'linear-gradient(45deg, #ff9800, #f57c00)',
              color: 'white',
              borderColor: '#e65100'
            }}
          >
            リトライ
          </button>
        </div>
      </div>
    )
  }

  // Render completion
  const renderCompletion = () => (
    <div style={{ textAlign: 'center' }}>
      <div className="comic-text font-title-lg" style={{ 
        color: '#ffd700',
        marginBottom: 'min(16px, 4vw)',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        🎉 全ペア発見！ 🎉
      </div>
      
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))',
        borderColor: '#ffc107',
        padding: 'min(24px, 6vw)',
        maxWidth: '400px',
        margin: '0 auto min(24px, 6vw) auto'
      }}>
        <div className="comic-text font-body-lg" style={{ color: '#fff3e0', marginBottom: '12px' }}>
          結果
        </div>
        <div className="comic-text font-body-md" style={{ color: '#c8e6c9', lineHeight: '1.6' }}>
          難易度: {difficulty === 'easy' ? '簡単' : difficulty === 'normal' ? '普通' : '難しい'}<br />
          手数: {stats.moves}<br />
          所要時間: {formatTime(stats.time)}<br />
          ペア数: {stats.matches}
        </div>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 'min(12px, 3vw)', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => setGameState('menu')}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}
        >
          メニューに戻る
        </button>
        
        <button 
          onClick={() => startNewGame(difficulty)}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #ff9800, #f57c00)',
            color: 'white',
            borderColor: '#e65100'
          }}
        >
          もう一度
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🧠 記憶力ゲーム 🃏
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(32px, 8vw)', 
        color: '#c8e6c9'
      }}>
        同じ絵柄のペアを見つけよう！
      </div>

      {/* Game content */}
      <div style={{ minHeight: '400px' }}>
        {gameState === 'menu' && renderMenu()}
        {gameState === 'playing' && renderGame()}
        {gameState === 'completed' && renderCompletion()}
      </div>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🎮 遊技場に戻る
          </button>
        </Link>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #666, #555)',
            color: 'white',
            borderColor: '#333'
          }}>
            🏠 拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default MemoryGame