import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO } from '../hooks/useSEO'
import { trackGamePlayed, trackAreaVisited, AREAS } from '../utils/achievements'

type GameState = 'menu' | 'playing' | 'completed' | 'paused'
type Difficulty = 'easy' | 'medium' | 'hard'

type Cell = {
  value: number | null
  isGiven: boolean
  isValid: boolean
}

type SudokuBoard = Cell[][]

type GameStats = {
  moves: number
  time: number
  started: boolean
  startTime?: number
  mistakes: number
}

const NumberPuzzle: React.FC = () => {
  useSEO({
    title: 'ミニ数独パズル',
    description: '4x4のミニ数独パズル！各行、列、2x2ブロックに1-4の数字を重複なく配置しよう。3つの難易度でMOMOPayを獲得！',
    keywords: 'ミニ数独,数独,sudoku,パズルゲーム,ロジック,思考,MOMOPay,無料パズル,ブラウザゲーム',
    ogTitle: 'ミニ数独パズル | モモンガカーニバル',
    ogDescription: '4x4ミニ数独で頭の体操！難易度3段階でMOMOPayを稼ごう。'
  });

  const { addMomoPayPoints } = useAppData()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [board, setBoard] = useState<SudokuBoard>([])
  const [gameState, setGameState] = useState<GameState>('menu')
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null)
  const [stats, setStats] = useState<GameStats>({
    moves: 0,
    time: 0,
    started: false,
    mistakes: 0
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
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, stats.started, stats.startTime])

  // 完全な4x4数独の解を生成
  const generateCompleteSudoku = (): number[][] => {
    const board = Array(4).fill(null).map(() => Array(4).fill(0))
    
    // バックトラッキングで数独を解く
    const solve = (row: number, col: number): boolean => {
      if (row === 4) return true
      if (col === 4) return solve(row + 1, 0)
      
      const numbers = [1, 2, 3, 4].sort(() => Math.random() - 0.5)
      
      for (const num of numbers) {
        if (isValidMove(board, row, col, num)) {
          if (board[row] && board[row][col] !== undefined) {
            board[row][col] = num
          }
          if (solve(row, col + 1)) return true
          if (board[row] && board[row][col] !== undefined) {
            board[row][col] = 0
          }
        }
      }
      
      return false
    }
    
    solve(0, 0)
    return board
  }

  // 数字が配置可能かチェック
  const isValidMove = (board: number[][], row: number, col: number, num: number): boolean => {
    // 行チェック
    for (let c = 0; c < 4; c++) {
      if (c !== col && board[row]?.[c] === num) return false
    }
    
    // 列チェック
    for (let r = 0; r < 4; r++) {
      if (r !== row && board[r]?.[col] === num) return false
    }
    
    // 2x2ブロックチェック
    const blockRow = Math.floor(row / 2) * 2
    const blockCol = Math.floor(col / 2) * 2
    
    for (let r = blockRow; r < blockRow + 2; r++) {
      for (let c = blockCol; c < blockCol + 2; c++) {
        if ((r !== row || c !== col) && board[r]?.[c] === num) return false
      }
    }
    
    return true
  }

  // パズルを生成（解から数字を除去）
  const generatePuzzle = (difficulty: Difficulty): SudokuBoard => {
    const solution = generateCompleteSudoku()
    const puzzle: SudokuBoard = solution.map(row => 
      row.map(value => ({ value, isGiven: true, isValid: true }))
    )
    
    // 難易度に応じて数字を除去
    const cellsToRemove = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10
    const positions = []
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        positions.push([r, c])
      }
    }
    
    // ランダムに並び替え
    positions.sort(() => Math.random() - 0.5)
    
    // 指定数のセルを空にする
    for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
      const position = positions[i]
      if (position && position.length >= 2) {
        const [r, c] = position
        if (puzzle[r] && puzzle[r][c]) {
          puzzle[r][c] = { value: null, isGiven: false, isValid: true }
        }
      }
    }
    
    return puzzle
  }

  // ボードの検証
  const validateBoard = (board: SudokuBoard): SudokuBoard => {
    const newBoard = board.map(row => row?.map(cell => ({ ...cell })) || [])
    
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const cell = newBoard[r]?.[c]
          if (cell && cell.value !== null) {
            const num = cell.value!
            const tempBoard = board.map(row => row?.map(cell => cell?.value || 0) || [])
            cell.isValid = isValidMove(tempBoard, r, c, num)
          } else if (cell) {
            cell.isValid = true
          }
        }
      }
    
    return newBoard
  }

  // パズルが完成しているかチェック
  const isPuzzleComplete = (board: SudokuBoard): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r]?.[c]?.value === null || !board[r]?.[c]?.isValid) {
          return false
        }
      }
    }
    return true
  }

  // ゲーム開始
  const startGame = (selectedDifficulty: Difficulty) => {
    const newBoard = generatePuzzle(selectedDifficulty)
    setDifficulty(selectedDifficulty)
    setBoard(newBoard)
    setSelectedCell(null)
    setStats({
      moves: 0,
      time: 0,
      started: true,
      startTime: Date.now(),
      mistakes: 0
    })
    setGameState('playing')
    trackGamePlayed()
  }

  // セルクリック処理
  const handleCellClick = (row: number, col: number) => {
    if (board[row]?.[col]?.isGiven) return
    setSelectedCell({ row, col })
  }

  // 数字入力処理
  const handleNumberInput = (num: number | null) => {
    if (!selectedCell || board[selectedCell.row]?.[selectedCell.col]?.isGiven) return
    
    const newBoard = [...board]
    const targetCell = newBoard[selectedCell.row]?.[selectedCell.col]
    const wasEmpty = targetCell?.value === null
    if (targetCell) {
      targetCell.value = num
    }
    
    // 検証
    const validatedBoard = validateBoard(newBoard)
    setBoard(validatedBoard)
    
    // 統計更新
    if (wasEmpty && num !== null && selectedCell) {
      setStats(prev => ({
        ...prev,
        moves: prev.moves + 1,
        mistakes: !validatedBoard[selectedCell.row]?.[selectedCell.col]?.isValid ? prev.mistakes + 1 : prev.mistakes
      }))
    }
    
    // 完成チェック
    if (isPuzzleComplete(validatedBoard)) {
      setGameState('completed')
      
      // 報酬計算
      const baseReward = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 200
      const timeBonus = Math.max(0, 300 - stats.time) // 5分以内のボーナス
      const accuracyBonus = Math.max(0, 50 - stats.mistakes * 10) // ミス数によるペナルティ
      const totalReward = Math.floor(baseReward + timeBonus * 0.1 + accuracyBonus)
      
      addMomoPayPoints(totalReward)
      setTimeout(() => {
        alert(`🎉 ミニ数独完成！\n\n⏱️ 時間: ${Math.floor(stats.time / 60)}分${stats.time % 60}秒\n🔢 手数: ${stats.moves}回\n❌ ミス: ${stats.mistakes}回\n\n💰 獲得MOMOPay: ${totalReward}P`)
      }, 100)
    }
  }

  // ゲームリセット
  const resetGame = () => {
    setGameState('menu')
    setBoard([])
    setSelectedCell(null)
    setStats({
      moves: 0,
      time: 0,
      started: false,
      mistakes: 0
    })
  }

  // 時間フォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // セルのスタイル
  const getCellStyle = (cell: Cell, row: number, col: number) => {
    const isSelected = selectedCell?.row === row && selectedCell?.col === col
    const isBlockBorder = (row === 1 || col === 1) // 2x2ブロックの境界
    
    return {
      width: 'min(60px, 12vw)',
      height: 'min(60px, 12vw)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 'min(24px, 5vw)',
      fontWeight: 'bold',
      border: `2px solid ${
        isSelected ? '#4caf50' : 
        !cell.isValid ? '#f44336' : 
        cell.isGiven ? '#666' : '#999'
      }`,
      borderRightWidth: isBlockBorder && col === 1 ? '4px' : '2px',
      borderBottomWidth: isBlockBorder && row === 1 ? '4px' : '2px',
      borderRightColor: isBlockBorder && col === 1 ? '#fff' : undefined,
      borderBottomColor: isBlockBorder && row === 1 ? '#fff' : undefined,
      backgroundColor: 
        isSelected ? 'rgba(76, 175, 80, 0.2)' :
        !cell.isValid ? 'rgba(244, 67, 54, 0.2)' :
        cell.isGiven ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
      color: 
        !cell.isValid ? '#f44336' :
        cell.isGiven ? '#fff3e0' : '#c8e6c9',
      cursor: cell.isGiven ? 'not-allowed' : 'pointer',
      transition: 'all 0.2s ease'
    }
  }

  if (gameState === 'menu') {
    return (
      <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
        <div className="comic-text font-title-lg" style={{ 
          marginBottom: 'min(16px, 4vw)', 
          textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
          color: '#fff3e0', 
          lineHeight: '1.2' 
        }}>
          🔢 ミニ数独パズル ✨
        </div>
        
        <div className="comic-text font-body-lg" style={{ 
          marginBottom: 'min(24px, 6vw)', 
          color: '#c8e6c9'
        }}>
          4×4の数独で頭の体操！
        </div>

        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))',
          borderColor: '#4caf50',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)',
          maxWidth: '500px',
          margin: '0 auto min(24px, 6vw) auto'
        }}>
          <div className="comic-text font-title-sm" style={{ color: '#fff3e0', marginBottom: '12px' }}>
            📋 ルール説明
          </div>
          <div className="comic-text font-body-sm" style={{ color: '#c8e6c9', textAlign: 'left', lineHeight: '1.6' }}>
            • 4×4のグリッドに1〜4の数字を配置<br/>
            • 各行に1〜4が1つずつ<br/>
            • 各列に1〜4が1つずつ<br/>
            • 各2×2ブロックに1〜4が1つずつ<br/>
            • 完成度とスピードで報酬が変わる！
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 45vw), 1fr))', 
          gap: 'min(16px, 4vw)', 
          maxWidth: '600px', 
          margin: '0 auto', 
          padding: '0 10px' 
        }}>
          <button
            onClick={() => startGame('easy')}
            className="comic-button font-button-md"
            style={{
              background: 'linear-gradient(45deg, #4caf50, #45a049)',
              color: 'white',
              borderColor: '#2e7d32',
              padding: 'min(20px, 5vw)'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>😊</div>
            <div>かんたん</div>
            <div className="font-body-sm" style={{ color: '#c8e6c9', marginTop: '4px' }}>
              6マス空き・報酬50P〜
            </div>
          </button>

          <button
            onClick={() => startGame('medium')}
            className="comic-button font-button-md"
            style={{
              background: 'linear-gradient(45deg, #ff9800, #f57c00)',
              color: 'white',
              borderColor: '#ef6c00',
              padding: 'min(20px, 5vw)'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤔</div>
            <div>ふつう</div>
            <div className="font-body-sm" style={{ color: '#fff3e0', marginTop: '4px' }}>
              8マス空き・報酬100P〜
            </div>
          </button>

          <button
            onClick={() => startGame('hard')}
            className="comic-button font-button-md"
            style={{
              background: 'linear-gradient(45deg, #f44336, #d32f2f)',
              color: 'white',
              borderColor: '#c62828',
              padding: 'min(20px, 5vw)'
            }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>😤</div>
            <div>むずかしい</div>
            <div className="font-body-sm" style={{ color: '#ffcdd2', marginTop: '4px' }}>
              10マス空き・報酬200P〜
            </div>
          </button>
        </div>

        <div style={{ marginTop: 'min(40px, 10vw)' }}>
          <Link to="/games" style={{ textDecoration: 'none' }}>
            <button className="comic-button font-button-md" style={{
              background: 'linear-gradient(45deg, #666, #555)',
              color: 'white',
              borderColor: '#444'
            }}>
              🎮 ゲーム一覧に戻る
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (gameState === 'completed') {
    return (
      <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
        <div className="comic-text font-title-lg" style={{ 
          marginBottom: 'min(24px, 6vw)', 
          textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
          color: '#4caf50', 
          lineHeight: '1.2' 
        }}>
          🎉 ミニ数独完成！ 🎉
        </div>

        <div className="comic-card animate-bounce-in" style={{
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.4), rgba(139, 195, 74, 0.3))',
          borderColor: '#4caf50',
          padding: 'min(24px, 6vw)',
          marginBottom: 'min(24px, 6vw)',
          maxWidth: '400px',
          margin: '0 auto min(24px, 6vw) auto'
        }}>
          <div className="comic-text font-title-sm" style={{ color: '#fff3e0', marginBottom: '16px' }}>
            📊 ゲーム結果
          </div>
          <div className="comic-text font-body-md" style={{ color: '#c8e6c9', lineHeight: '1.8' }}>
            難易度: {difficulty === 'easy' ? 'かんたん' : difficulty === 'medium' ? 'ふつう' : 'むずかしい'}<br/>
            時間: {formatTime(stats.time)}<br/>
            手数: {stats.moves}回<br/>
            ミス: {stats.mistakes}回
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 'min(16px, 4vw)', 
          justifyContent: 'center', 
          flexWrap: 'wrap' 
        }}>
          <button
            onClick={resetGame}
            className="comic-button font-button-md"
            style={{
              background: 'linear-gradient(45deg, #4caf50, #45a049)',
              color: 'white',
              borderColor: '#2e7d32'
            }}
          >
            🔄 もう一度
          </button>
          
          <Link to="/games" style={{ textDecoration: 'none' }}>
            <button className="comic-button font-button-md" style={{
              background: 'linear-gradient(45deg, #666, #555)',
              color: 'white',
              borderColor: '#444'
            }}>
              🎮 ゲーム一覧
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🔢 ミニ数独 - {difficulty === 'easy' ? 'かんたん' : difficulty === 'medium' ? 'ふつう' : 'むずかしい'}
      </div>

      {/* ゲーム統計 */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        marginBottom: 'min(20px, 5vw)',
        flexWrap: 'wrap'
      }}>
        <div className="comic-card" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderColor: '#666',
          padding: 'min(12px, 3vw)',
          minWidth: '80px'
        }}>
          <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>時間</div>
          <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>
            {formatTime(stats.time)}
          </div>
        </div>
        
        <div className="comic-card" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderColor: '#666',
          padding: 'min(12px, 3vw)',
          minWidth: '80px'
        }}>
          <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>手数</div>
          <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>
            {stats.moves}
          </div>
        </div>
        
        <div className="comic-card" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderColor: '#666',
          padding: 'min(12px, 3vw)',
          minWidth: '80px'
        }}>
          <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>ミス</div>
          <div className="comic-text font-title-sm" style={{ color: stats.mistakes > 0 ? '#f44336' : '#fff3e0' }}>
            {stats.mistakes}
          </div>
        </div>
      </div>

      {/* 数独ボード */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: 'min(20px, 5vw)' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '1px',
          backgroundColor: '#333',
          padding: '2px',
          borderRadius: '8px'
        }}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={getCellStyle(cell, rowIndex, colIndex)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell.value}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 数字入力パネル */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(12px, 3vw)', 
        justifyContent: 'center', 
        marginBottom: 'min(20px, 5vw)',
        flexWrap: 'wrap'
      }}>
        {[1, 2, 3, 4].map(num => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={!selectedCell || board[selectedCell.row]?.[selectedCell.col]?.isGiven === true}
            className="comic-button font-button-md"
            style={{
              background: 'linear-gradient(45deg, #2196f3, #1976d2)',
              color: 'white',
              borderColor: '#1565c0',
              width: 'min(50px, 10vw)',
              height: 'min(50px, 10vw)',
              fontSize: 'min(24px, 5vw)',
              opacity: (!selectedCell || board[selectedCell.row]?.[selectedCell.col]?.isGiven) ? 0.5 : 1
            }}
          >
            {num}
          </button>
        ))}
        
        <button
          onClick={() => handleNumberInput(null)}
          disabled={!selectedCell || board[selectedCell.row][selectedCell.col].isGiven}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #f44336, #d32f2f)',
            color: 'white',
            borderColor: '#c62828',
            width: 'min(50px, 10vw)',
            height: 'min(50px, 10vw)',
            fontSize: 'min(18px, 4vw)',
            opacity: (!selectedCell || board[selectedCell.row][selectedCell.col].isGiven) ? 0.5 : 1
          }}
        >
          ❌
        </button>
      </div>

      {/* コントロールボタン */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap' 
      }}>
        <button
          onClick={resetGame}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #ff9800, #f57c00)',
            color: 'white',
            borderColor: '#ef6c00'
          }}
        >
          🔄 リセット
        </button>
        
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #666, #555)',
            color: 'white',
            borderColor: '#444'
          }}>
            🎮 ゲーム一覧
          </button>
        </Link>
      </div>

      {selectedCell && (
        <div className="comic-text font-body-sm" style={{ 
          color: '#c8e6c9',
          marginTop: 'min(16px, 4vw)'
        }}>
          💡 選択中: 行{selectedCell.row + 1}、列{selectedCell.col + 1}
        </div>
      )}
    </div>
  )
}

export default NumberPuzzle