import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO } from '../hooks/useSEO'
import { trackGamePlayed, trackAreaVisited, AREAS } from '../utils/achievements'

type PuzzleSize = 3 | 4 | 5

type GameState = 'menu' | 'playing' | 'completed' | 'paused'

type GameStats = {
  moves: number
  time: number
  started: boolean
  startTime?: number
}

const NumberPuzzle: React.FC = () => {
  useSEO({
    title: '数字並べパズル',
    description: '1から8（または15）までの数字を順番に並べるスライディングパズル。3×3、4×4、5×5の3つの難易度。完成するとMOMOPayを獲得！',
    keywords: '数字並べ,スライディングパズル,パズルゲーム,ロジック,思考,MOMOPay,無料パズル,ブラウザゲーム',
    ogTitle: '数字並べパズル | モモンガカーニバル',
    ogDescription: 'スライディング数字パズル！3つの難易度でMOMOPayを稼ごう。'
  });

  const { addMomoPayPoints } = useAppData()
  const [puzzleSize, setPuzzleSize] = useState<PuzzleSize>(3)
  const [board, setBoard] = useState<(number | null)[]>([])
  const [gameState, setGameState] = useState<GameState>('menu')
  const [stats, setStats] = useState<GameStats>({
    moves: 0,
    time: 0,
    started: false
  })

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.GAMES)
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (gameState === 'playing' && stats.started) {
      interval = setInterval(() => {
        setStats(prev => ({
          ...prev,
          time: prev.startTime ? Math.floor((Date.now() - prev.startTime) / 1000) : prev.time
        }))
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [gameState, stats.started])

  // Initialize board
  const initializeBoard = (size: PuzzleSize) => {
    const totalCells = size * size
    const numbers: (number | null)[] = Array.from({ length: totalCells - 1 }, (_, i) => i + 1)
    numbers.push(null) // Empty space
    
    // Shuffle until solvable
    let shuffled: (number | null)[]
    let attempts = 0
    
    do {
      shuffled = [...numbers].sort(() => Math.random() - 0.5)
      attempts++
    } while (!isSolvable(shuffled, size) && attempts < 1000)
    
    // If still not solvable after many attempts, use a known solvable state
    if (!isSolvable(shuffled, size)) {
      shuffled = generateSolvableBoard(size)
    }
    
    return shuffled
  }

  // Check if puzzle is solvable
  const isSolvable = (board: (number | null)[], size: PuzzleSize): boolean => {
    const numbers = board.filter(n => n !== null) as number[]
    let inversions = 0
    
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const numI = numbers[i]
        const numJ = numbers[j]
        if (numI && numJ && numI > numJ) {
          inversions++
        }
      }
    }
    
    if (size % 2 === 1) {
      // Odd size: solvable if inversions are even
      return inversions % 2 === 0
    } else {
      // Even size: more complex rules
      const emptyRow = Math.floor(board.indexOf(null) / size)
      const emptyRowFromBottom = size - emptyRow
      
      if (emptyRowFromBottom % 2 === 1) {
        return inversions % 2 === 0
      } else {
        return inversions % 2 === 1
      }
    }
  }

  // Generate a solvable board by making moves from solved state
  const generateSolvableBoard = (size: PuzzleSize): (number | null)[] => {
    const solved: (number | null)[] = Array.from({ length: size * size - 1 }, (_, i) => i + 1)
    solved.push(null)
    
    const board = [...solved]
    const moves = size * size * 10 // Make many random moves
    
    for (let i = 0; i < moves; i++) {
      const emptyIndex = board.indexOf(null)
      const neighbors = getNeighbors(emptyIndex, size)
      const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)]
      
      if (randomNeighbor !== undefined && randomNeighbor < board.length && randomNeighbor >= 0) {
        // Swap empty space with random neighbor
        const temp = board[emptyIndex]
        const swapValue = board[randomNeighbor]
        board[emptyIndex] = swapValue!
        board[randomNeighbor] = temp!
      }
    }
    
    return board
  }

  // Get valid neighbors for a position
  const getNeighbors = (index: number, size: PuzzleSize): number[] => {
    const neighbors: number[] = []
    const row = Math.floor(index / size)
    const col = index % size
    
    // Up
    if (row > 0) neighbors.push(index - size)
    // Down
    if (row < size - 1) neighbors.push(index + size)
    // Left
    if (col > 0) neighbors.push(index - 1)
    // Right
    if (col < size - 1) neighbors.push(index + 1)
    
    return neighbors
  }

  // Check if puzzle is solved
  const isSolved = (board: (number | null)[]): boolean => {
    for (let i = 0; i < board.length - 1; i++) {
      if (board[i] !== i + 1) return false
    }
    return board[board.length - 1] === null
  }

  // Handle tile click
  const handleTileClick = (index: number) => {
    if (gameState !== 'playing') return
    
    const emptyIndex = board.indexOf(null)
    const neighbors = getNeighbors(emptyIndex, puzzleSize)
    
    if (neighbors.includes(index)) {
      const newBoard = [...board]
      const temp = newBoard[index]
      newBoard[emptyIndex] = temp!
      newBoard[index] = null
      
      setBoard(newBoard)
      setStats(prev => ({ ...prev, moves: prev.moves + 1 }))
      
      // Check if solved
      if (isSolved(newBoard)) {
        setGameState('completed')
        
        // Calculate reward based on size and performance
        const baseReward = puzzleSize === 3 ? 30 : puzzleSize === 4 ? 60 : 100
        const timeBonus = Math.max(0, 300 - stats.time) // Bonus for solving quickly
        const moveBonus = Math.max(0, (puzzleSize * puzzleSize * 5) - stats.moves) // Bonus for fewer moves
        const totalReward = baseReward + Math.floor(timeBonus / 10) + Math.floor(moveBonus / 5)
        
        addMomoPayPoints(totalReward)
        trackGamePlayed()
        
        // Show completion message
        setTimeout(() => {
          alert(`🎉 パズル完成！\n\n移動回数: ${stats.moves}\n所要時間: ${formatTime(stats.time)}\n\n獲得MOMOPay: ${totalReward}\n（基本: ${baseReward} + ボーナス: ${totalReward - baseReward}）`)
        }, 500)
      }
    }
  }

  // Start new game
  const startNewGame = (size: PuzzleSize) => {
    setPuzzleSize(size)
    const newBoard = initializeBoard(size)
    setBoard(newBoard)
    setStats({
      moves: 0,
      time: 0,
      started: true,
      startTime: Date.now()
    })
    setGameState('playing')
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get tile color based on number
  const getTileColor = (number: number | null): string => {
    if (number === null) return 'transparent'
    
    const hue = (number * 137.5) % 360 // Golden angle for nice color distribution
    return `hsl(${hue}, 70%, 60%)`
  }

  // Render game menu
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
          onClick={() => startNewGame(3)}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32',
            padding: 'min(16px, 4vw)'
          }}
        >
          🟢 簡単 (3×3) - 基本報酬 30P
        </button>
        
        <button 
          onClick={() => startNewGame(4)}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #ff9800, #f57c00)',
            color: 'white',
            borderColor: '#e65100',
            padding: 'min(16px, 4vw)'
          }}
        >
          🟡 普通 (4×4) - 基本報酬 60P
        </button>
        
        <button 
          onClick={() => startNewGame(5)}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #f44336, #d32f2f)',
            color: 'white',
            borderColor: '#b71c1c',
            padding: 'min(16px, 4vw)'
          }}
        >
          🔴 難しい (5×5) - 基本報酬 100P
        </button>
      </div>
      
      <div className="comic-text font-body-md" style={{ 
        color: '#c8e6c9',
        marginTop: 'min(24px, 6vw)',
        lineHeight: '1.6'
      }}>
        数字を順番に並べ替えよう！<br />
        空きマスの隣の数字をクリックして移動<br />
        早く少ない手数でクリアするとボーナス！
      </div>
    </div>
  )

  // Render game board
  const renderGame = () => (
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
          移動: {stats.moves}
        </div>
        <div className="comic-text font-body-md" style={{ color: '#c8e6c9' }}>
          時間: {formatTime(stats.time)}
        </div>
        <div className="comic-text font-body-md" style={{ color: '#c8e6c9' }}>
          難易度: {puzzleSize}×{puzzleSize}
        </div>
      </div>

      {/* Puzzle board */}
      <div 
        className="comic-card puzzle-board"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${puzzleSize}, 1fr)`,
          gap: '4px',
          maxWidth: 'min(400px, 90vw)',
          margin: '0 auto min(24px, 6vw) auto',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))',
          borderColor: '#8bc34a'
        }}
      >
        {board.map((number, index) => (
          <div
            key={index}
            onClick={() => handleTileClick(index)}
            className={number !== null ? 'comic-card puzzle-tile' : ''}
            style={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: puzzleSize === 3 ? '1.5rem' : puzzleSize === 4 ? '1.2rem' : '1rem',
              fontWeight: 'bold',
              cursor: number !== null ? 'pointer' : 'default',
              background: number !== null 
                ? `linear-gradient(135deg, ${getTileColor(number)}, ${getTileColor(number)}cc)`
                : 'transparent',
              borderColor: number !== null ? getTileColor(number) : 'transparent',
              color: number !== null ? '#fff' : 'transparent',
              textShadow: number !== null ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
              transition: 'all 0.2s ease',
              transform: number !== null ? 'scale(1)' : 'scale(0)',
              minHeight: puzzleSize === 3 ? '60px' : puzzleSize === 4 ? '50px' : '40px',
              minWidth: puzzleSize === 3 ? '60px' : puzzleSize === 4 ? '50px' : '40px'
            }}
            onMouseEnter={(e) => {
              if (number !== null) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (number !== null) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {number}
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
          onClick={() => startNewGame(puzzleSize)}
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

  // Render completion screen
  const renderCompletion = () => (
    <div style={{ textAlign: 'center' }}>
      <div className="comic-text font-title-lg" style={{ 
        color: '#ffd700',
        marginBottom: 'min(16px, 4vw)',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        🎉 パズル完成！ 🎉
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
          難易度: {puzzleSize}×{puzzleSize}<br />
          移動回数: {stats.moves}<br />
          所要時間: {formatTime(stats.time)}
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
          onClick={() => startNewGame(puzzleSize)}
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
        🔢 数字並べパズル 🧩
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(32px, 8vw)', 
        color: '#c8e6c9'
      }}>
        数字を順番に並べ替えよう！
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

export default NumberPuzzle