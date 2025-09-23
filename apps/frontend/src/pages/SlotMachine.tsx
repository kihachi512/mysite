import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO } from '../hooks/useSEO'
import { trackGamePlayed, trackAreaVisited, AREAS } from '../utils/achievements'

type SlotSymbol = '🍒' | '🍋' | '🍊' | '🍇' | '⭐' | '💎' | '7️⃣'

type GameState = 'idle' | 'spinning' | 'result'
type ReelState = 'spinning' | 'stopped'

type PayoutRule = {
  pattern: SlotSymbol[]
  payout: number
  name: string
}

const SYMBOLS: SlotSymbol[] = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣']

// 配当表（3つ揃った時の倍率）
const PAYOUT_RULES: PayoutRule[] = [
  { pattern: ['7️⃣', '7️⃣', '7️⃣'], payout: 100, name: 'ラッキー7' },
  { pattern: ['💎', '💎', '💎'], payout: 50, name: 'ダイヤモンド' },
  { pattern: ['⭐', '⭐', '⭐'], payout: 30, name: 'スター' },
  { pattern: ['🍇', '🍇', '🍇'], payout: 15, name: 'グレープ' },
  { pattern: ['🍊', '🍊', '🍊'], payout: 10, name: 'オレンジ' },
  { pattern: ['🍋', '🍋', '🍋'], payout: 8, name: 'レモン' },
  { pattern: ['🍒', '🍒', '🍒'], payout: 5, name: 'チェリー' },
  // 2つ揃いの配当
  { pattern: ['🍒', '🍒'], payout: 2, name: 'チェリー2個' },
]

// シンボル出現確率の重み付け
const SYMBOL_WEIGHTS: Record<SlotSymbol, number> = {
  '🍒': 25, // 一番出やすい
  '🍋': 20,
  '🍊': 15,
  '🍇': 12,
  '⭐': 8,
  '💎': 5,
  '7️⃣': 2  // 一番レア
}

const SlotMachine: React.FC = () => {
  useSEO({
    title: 'スロットマシン',
    description: '本格的なスロットマシンでMOMOPayを賭けよう！7が揃えば大当たり！運試しのギャンブルゲーム。',
    keywords: 'スロットマシン,ギャンブル,カジノ,賭博,運試し,大当たり,MOMOPay,遊技場',
    ogTitle: 'スロットマシン | モモンガカーニバル',
    ogDescription: '本格スロットマシンで運試し！大当たりを狙ってMOMOPayを増やそう。'
  });

  const { momoPayPoints, addMomoPayPoints, spendMomoPayPoints } = useAppData()
  const [gameState, setGameState] = useState<GameState>('idle')
  const [reels, setReels] = useState<SlotSymbol[]>(['🍒', '🍒', '🍒'])
  const [reelStates, setReelStates] = useState<ReelState[]>(['stopped', 'stopped', 'stopped'])
  const [finalReels, setFinalReels] = useState<SlotSymbol[]>(['🍒', '🍒', '🍒'])
  const [betAmount, setBetAmount] = useState(10)
  const [lastWin, setLastWin] = useState(0)
  const [totalWins, setTotalWins] = useState(0)
  const [totalLosses, setTotalLosses] = useState(0)
  const [spinCount, setSpinCount] = useState(0)
  const [animationIntervals, setAnimationIntervals] = useState<NodeJS.Timeout[]>([])

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.GAMES)
  }, [])

  // 重み付きランダムでシンボルを選択
  const getRandomSymbol = (): SlotSymbol => {
    const totalWeight = Object.values(SYMBOL_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (const symbol of SYMBOLS) {
      random -= SYMBOL_WEIGHTS[symbol]
      if (random <= 0) {
        return symbol
      }
    }
    return '🍒' // フォールバック
  }

  // 配当計算
  const calculatePayout = (symbols: SlotSymbol[]): { amount: number, rule: PayoutRule | null } => {
    // 3つ揃いをチェック
    for (const rule of PAYOUT_RULES) {
      if (rule.pattern.length === 3 && 
          symbols[0] === rule.pattern[0] && 
          symbols[1] === rule.pattern[1] && 
          symbols[2] === rule.pattern[2]) {
        return { amount: betAmount * rule.payout, rule }
      }
    }

    // チェリー2個をチェック（位置は問わない）
    const cherryCount = symbols.filter(s => s === '🍒').length
    if (cherryCount >= 2) {
      const cherryRule = PAYOUT_RULES.find(r => r.name === 'チェリー2個')!
      return { amount: betAmount * cherryRule.payout, rule: cherryRule }
    }

    return { amount: 0, rule: null }
  }

  // 手動停止用のリール停止機能（一つずつ確定）
  const stopReel = (reelIndex: number) => {
    if (gameState !== 'spinning') return

    setReelStates(prevStates => {
      const newStates = [...prevStates]
      if (newStates[reelIndex] === 'stopped') return prevStates // 既に停止済み
      
      newStates[reelIndex] = 'stopped'
      
      // 該当アニメーションを停止
      if (animationIntervals[reelIndex]) {
        clearInterval(animationIntervals[reelIndex])
      }
      
      // リールに最終結果を設定して即座に確定
      setReels(prevReels => {
        const newReels = [...prevReels]
        newReels[reelIndex] = finalReels[reelIndex]!
        return newReels
      })

      // リール確定のフィードバック
      setTimeout(() => {
        // 確定音やエフェクトをここに追加可能
      }, 100)

      // 全てのリールが停止したかチェック
      if (newStates.every(state => state === 'stopped')) {
        // 最終結果判定と表示
        setTimeout(() => {
          finishGame(finalReels)
        }, 500) // 少し余韻を持たせる
      }
      
      return newStates
    })
  }

  // ゲーム終了処理
  const finishGame = (finalReelValues: SlotSymbol[]) => {
    // アニメーション停止
    animationIntervals.forEach(clearInterval)
    setAnimationIntervals([])

    // 結果判定
    const { amount, rule } = calculatePayout(finalReelValues)
    if (amount > 0) {
      addMomoPayPoints(amount)
      setLastWin(amount)
      setTotalWins(prev => prev + amount)
      
      setTimeout(() => {
        alert(`🎉 ${rule?.name} 当たり！\n+${amount}MOMOPay獲得！`)
      }, 500)
    } else {
      setTotalLosses(prev => prev + betAmount)
    }

    setSpinCount(prev => prev + 1)
    setGameState('result')
    
    // 2秒後に次のゲーム準備
    setTimeout(() => {
      setGameState('idle')
      setReelStates(['stopped', 'stopped', 'stopped'])
    }, 2000)
  }

  // スロット回転（手動・自動両対応）
  const spin = () => {
    if (gameState !== 'idle' || momoPayPoints < betAmount) {
      if (momoPayPoints < betAmount) {
        alert(`MOMOPayが不足しています！\n必要: ${betAmount}P\n現在: ${momoPayPoints}P`)
      }
      return
    }

    // ベット額を支払い
    if (!spendMomoPayPoints(betAmount)) {
      return
    }

    setGameState('spinning')
    setLastWin(0)
    trackGamePlayed()

    // 最終的な結果を事前に決定
    const newFinalReels: SlotSymbol[] = [
      getRandomSymbol(),
      getRandomSymbol(),
      getRandomSymbol()
    ]
    setFinalReels(newFinalReels)

    // 手動停止モード：全リールを回転開始
    setReelStates(['spinning', 'spinning', 'spinning'])
    
    // 各リールのアニメーション
    const intervals: NodeJS.Timeout[] = []
    for (let index = 0; index < 3; index++) {
      const interval = setInterval(() => {
        setReels(prevReels => {
          const newReels = [...prevReels]
          newReels[index] = getRandomSymbol()
          return newReels
        })
      }, 100)
      intervals.push(interval)
    }
    setAnimationIntervals(intervals)
  }

  // ベット額変更
  const changeBet = (amount: number) => {
    if (gameState === 'idle') {
      setBetAmount(Math.max(1, Math.min(1000, amount)))
    }
  }

  // 勝率計算
  const winRate = spinCount > 0 ? ((totalWins - totalLosses) / (spinCount * betAmount) * 100) : 0

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🎰 スロットマシン 💰
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(24px, 6vw)', 
        color: '#c8e6c9'
      }}>
        運試しの本格ギャンブル！
      </div>

      {/* 警告メッセージ */}
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(211, 47, 47, 0.2))',
        borderColor: '#f44336',
        padding: 'min(16px, 4vw)',
        marginBottom: 'min(24px, 6vw)',
        maxWidth: '500px',
        margin: '0 auto min(24px, 6vw) auto'
      }}>
        <div className="comic-text font-title-sm" style={{ color: '#fff3e0', marginBottom: '8px' }}>
          ⚠️ ギャンブル注意
        </div>
        <div className="comic-text font-body-sm" style={{ color: '#ffcdd2', lineHeight: '1.6' }}>
          • 運に左右される純粋なギャンブルです<br/>
          • 連続で負ける可能性があります<br/>
          • 余裕資金で楽しみましょう<br/>
          • 18歳未満プレイ禁止（建前）
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* プレイヤー情報 */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))',
          borderColor: '#ffc107',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
            gap: '12px',
            textAlign: 'center'
          }}>
            <div>
              <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>所持金</div>
              <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>{momoPayPoints}P</div>
            </div>
            <div>
              <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>ベット額</div>
              <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>{betAmount}P</div>
            </div>
            <div>
              <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>前回獲得</div>
              <div className="comic-text font-title-sm" style={{ color: lastWin > 0 ? '#4caf50' : '#fff3e0' }}>
                {lastWin > 0 ? `+${lastWin}P` : '0P'}
              </div>
            </div>
            <div>
              <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>通算損益</div>
              <div className="comic-text font-title-sm" style={{ 
                color: totalWins - totalLosses > 0 ? '#4caf50' : totalWins - totalLosses < 0 ? '#f44336' : '#fff3e0'
              }}>
                {totalWins - totalLosses > 0 ? '+' : ''}{totalWins - totalLosses}P
              </div>
            </div>
          </div>
        </div>

        {/* スロットマシン本体 */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(66, 66, 66, 0.8), rgba(33, 33, 33, 0.7))',
          borderColor: '#ffc107',
          borderWidth: '4px',
          padding: 'min(32px, 8vw)',
          marginBottom: 'min(24px, 6vw)',
          boxShadow: '0 0 20px rgba(255, 193, 7, 0.3)'
        }}>
          {/* リール表示 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'min(12px, 3vw)',
            marginBottom: 'min(24px, 6vw)'
          }}>
            {reels.map((symbol, index) => (
              <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  onClick={() => reelStates[index] === 'spinning' && stopReel(index)}
                  style={{
                    width: 'clamp(80px, 20vw, 120px)',
                    height: 'clamp(80px, 20vw, 120px)',
                    background: reelStates[index] === 'stopped' 
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(240, 240, 240, 0.8))'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(240, 240, 240, 0.6))',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(3rem, 8vw, 5rem)',
                    border: reelStates[index] === 'stopped' ? '4px solid #4caf50' : '3px solid #ffc107',
                    boxShadow: reelStates[index] === 'spinning'
                      ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 10px rgba(255, 193, 7, 0.6)'
                      : reelStates[index] === 'stopped' 
                      ? 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 15px rgba(76, 175, 80, 0.8)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                    animation: reelStates[index] === 'spinning' ? 'pulse 0.1s infinite' : 'none',
                    transform: gameState === 'result' && lastWin > 0 ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                    cursor: reelStates[index] === 'spinning' ? 'pointer' : 'default',
                    position: 'relative'
                  }}
                >
                  {symbol}
                  
                  {/* タップヒント（回転中のみ表示） */}
                  {reelStates[index] === 'spinning' && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(244, 67, 54, 0.9)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite',
                      zIndex: 10
                    }}>
                      TAP
                    </div>
                  )}
                </div>
                
                {/* リール番号表示 */}
                <div className="comic-text font-body-xs" style={{ 
                  color: reelStates[index] === 'stopped' ? '#4caf50' : '#c8e6c9',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                  {reelStates[index] === 'stopped' && ' ✓'}
                </div>
              </div>
            ))}
          </div>

          {/* 操作説明 */}
          {gameState === 'idle' && (
            <div className="comic-text font-body-sm" style={{
              color: '#c8e6c9',
              marginBottom: '16px',
              lineHeight: '1.4'
            }}>
              🎯 各リールをタップして一つずつ停止・確定！
            </div>
          )}

          {/* プレイ中のヒント */}
          {gameState === 'spinning' && (
            <div className="comic-text font-body-sm" style={{
              color: '#ffc107',
              marginBottom: '16px',
              animation: 'pulse 2s infinite'
            }}>
              👆 リールをタップして順番に停止・確定！
            </div>
          )}

          {/* スピンボタン */}
          <button
            onClick={spin}
            disabled={gameState !== 'idle' || momoPayPoints < betAmount}
            className="comic-button font-button-xl"
            style={{
              background: gameState === 'idle' && momoPayPoints >= betAmount
                ? 'linear-gradient(45deg, #f44336, #d32f2f)'
                : 'linear-gradient(45deg, #666, #555)',
              color: 'white',
              borderColor: gameState === 'idle' && momoPayPoints >= betAmount ? '#c62828' : '#333',
              fontSize: 'clamp(1.2rem, 4vw, 2rem)',
              padding: 'clamp(12px 24px, 3vw 6vw, 20px 40px)',
              minWidth: '200px',
              animation: gameState === 'spinning' ? 'pulse 1s infinite' : 'none'
            }}
          >
            {gameState === 'spinning' 
              ? '🎰 順次停止中...' 
              : gameState === 'result' 
              ? '結果表示中' 
              : `🎰 SPIN! (${betAmount}P)`}
          </button>
        </div>

        {/* ベット設定 */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(30, 136, 229, 0.1))',
          borderColor: '#2196f3',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ color: '#fff3e0', marginBottom: '12px' }}>
            💰 ベット額設定
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            justifyContent: 'center', 
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}>
            {[1, 5, 10, 25, 50, 100, 500].map(amount => (
              <button
                key={amount}
                onClick={() => changeBet(amount)}
                disabled={gameState !== 'idle'}
                className="comic-button font-button-sm"
                style={{
                  background: betAmount === amount 
                    ? 'linear-gradient(45deg, #4caf50, #45a049)'
                    : 'linear-gradient(45deg, #666, #555)',
                  color: 'white',
                  borderColor: betAmount === amount ? '#2e7d32' : '#333',
                  minWidth: '50px',
                  opacity: gameState !== 'idle' ? 0.5 : 1
                }}
              >
                {amount}P
              </button>
            ))}
          </div>

        </div>

        {/* 配当表 */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))',
          borderColor: '#4caf50',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ color: '#fff3e0', marginBottom: '12px' }}>
            💎 配当表
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '8px' 
          }}>
            {PAYOUT_RULES.filter(rule => rule.pattern.length === 3).map(rule => (
              <div 
                key={rule.name} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px'
                }}
              >
                <span className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
                  {rule.pattern.join(' ')} 
                </span>
                <span className="comic-text font-body-sm" style={{ color: '#fff3e0', fontWeight: 'bold' }}>
                  ×{rule.payout}
                </span>
              </div>
            ))}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '4px'
            }}>
              <span className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
                🍒🍒 (2個以上)
              </span>
              <span className="comic-text font-body-sm" style={{ color: '#fff3e0', fontWeight: 'bold' }}>
                ×2
              </span>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        {spinCount > 0 && (
          <div className="comic-card" style={{
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
            borderColor: '#9c27b0',
            padding: 'min(20px, 5vw)',
            marginBottom: 'min(24px, 6vw)'
          }}>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0', marginBottom: '12px' }}>
              📊 プレイ統計
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
              gap: '12px',
              textAlign: 'center'
            }}>
              <div>
                <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>回転数</div>
                <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>{spinCount}</div>
              </div>
              <div>
                <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>総獲得</div>
                <div className="comic-text font-title-sm" style={{ color: '#4caf50' }}>+{totalWins}P</div>
              </div>
              <div>
                <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>総支払</div>
                <div className="comic-text font-title-sm" style={{ color: '#f44336' }}>-{totalLosses}P</div>
              </div>
              <div>
                <div className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>収支率</div>
                <div className="comic-text font-title-sm" style={{ 
                  color: winRate > 0 ? '#4caf50' : winRate < 0 ? '#f44336' : '#fff3e0'
                }}>
                  {winRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ナビゲーション */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/momo-bank" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #ffc107, #ffb300)',
            color: '#000',
            borderColor: '#f57f17'
          }}>
            🏦 銀行でMOMOPay稼ぐ
          </button>
        </Link>
        
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

export default SlotMachine