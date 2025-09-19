import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'

const allFortunes = ['大吉','中吉','小吉','吉','凶']

const OmikujiChoice: React.FC = () => {
  useSEO(SEO_PRESETS.omikuji);
  const { momoPayPoints, spendMomoPayPoints } = useAppData()
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [canPlay, setCanPlay] = useState(true)
  const OMIKUJI_COST = 10 // おみくじの費用（10MOMOPay）
  const [shuffled, setShuffled] = useState<string[]>(() => {
    const arr = [...allFortunes]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      if (temp !== undefined && arr[j] !== undefined) {
        arr[i] = arr[j]!
        arr[j] = temp
      }
    }
    return arr
  })

  const cards = useMemo(() => shuffled.map((f, i) => ({ id: i, fortune: f })), [shuffled])

  const reset = () => {
    const arr = [...allFortunes]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      if (temp !== undefined && arr[j] !== undefined) {
        arr[i] = arr[j]!
        arr[j] = temp
      }
    }
    setShuffled(arr)
    setRevealedIdx(null)
    setShowAll(false)
    setCanPlay(true)
  }

  const handleCardClick = (cardId: number) => {
    if (revealedIdx !== null || !canPlay) return
    
    // MOMOPayをチェック
    if (momoPayPoints < OMIKUJI_COST) {
      alert(`おみくじには${OMIKUJI_COST}MOMOPay必要です。演習林で稼いでください！`)
      return
    }
    
    // MOMOPayを消費
    if (!spendMomoPayPoints(OMIKUJI_COST)) {
      alert('MOMOPay不足。')
      return
    }
    
    setRevealedIdx(cardId)
    setCanPlay(false)
    // Show all cards after a short delay
    setTimeout(() => {
      setShowAll(true)
    }, 1000)
  }

  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center', maxWidth: '100%', margin: '0 auto', padding: '0 10px' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div className="comic-text" style={{ color: '#fff3e0', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', marginBottom: '8px' }}>
          {revealedIdx === null ? '🔮 一枚選んで 🔮' : showAll ? '🎉 結果発表！ 🎉' : '🔮 結果確認中... 🔮'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="momopay-display" style={{ textShadow: '2px 2px 0px #f57f17, 0 0 8px rgba(255,217,61,0.5)' }}>
            💰 MOMOPay: {momoPayPoints}
          </div>
          <div className="comic-text" style={{ fontSize: '1rem', color: '#c8e6c9', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
            <span className="momopay-small">費用: {OMIKUJI_COST}MOMOPay</span>
          </div>
        </div>
        {momoPayPoints < OMIKUJI_COST && (
          <div className="comic-text" style={{ fontSize: '0.9rem', color: '#ff6b6b', textShadow: '1px 1px 0px rgba(0,0,0,0.5)', marginTop: '8px' }}>
            ⚠️ MOMOPay不足。演習林で稼いでください！
          </div>
        )}
      </div>
      <div className="omikuji-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: 'min(12px, 3vw)', 
        width: '100%', 
        maxWidth: 'min(500px, 90vw)', 
        padding: '0 min(12px, 3vw)', 
        justifyItems: 'center', 
        justifyContent: 'center', 
        margin: '0 auto' 
      }}>
        {cards.map((c) => {
          const isOpen = revealedIdx === c.id
          const isChosen = revealedIdx === c.id
          const shouldShow = showAll || isOpen
          return (
            <div key={c.id} style={{ aspectRatio: '2 / 3', width: '100%', maxWidth: '80px', position: 'relative', margin: '0 auto' }}>
              <button 
                onClick={() => handleCardClick(c.id)} 
                disabled={revealedIdx !== null || !canPlay || momoPayPoints < OMIKUJI_COST} 
                className="comic-button"
                style={{ 
                  aspectRatio: '2 / 3', 
                  width: '100%', 
                  minWidth: 'min(60px, 15vw)',
                  maxWidth: '80px',
                  borderRadius: 'min(20px, 5vw)', 
                  border: isChosen ? '4px solid #ffd700' : '3px solid rgba(255,255,255,0.8)', 
                        background: shouldShow ? 'linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #f8f8f8 100%)' : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)',
                  color: shouldShow ? '#2e7d32' : '#fff', 
                  fontWeight: 800, 
                  fontSize: 'clamp(14px, 4vw, 18px)', 
                  boxShadow: isChosen ? '0 0 25px rgba(255, 215, 0, 0.9), 0 10px 25px rgba(0,0,0,0.5), inset 0 3px 0 rgba(255,255,255,0.3)' : '0 8px 0 rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.3)', 
                  cursor: (revealedIdx === null && canPlay && momoPayPoints >= OMIKUJI_COST) ? 'pointer' : 'not-allowed',
                  opacity: (momoPayPoints < OMIKUJI_COST && revealedIdx === null) ? 0.5 : 1,
                  transition: 'all 0.3s ease-in-out',
                  position: 'relative',
                  animation: isChosen ? 'pulse 2s infinite' : 'none',
                  textTransform: 'none'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {shouldShow ? (
                    <>
                      <div style={{ 
                        fontSize: 'clamp(18px, 5vw, 24px)', 
                        fontWeight: '900', 
                        color: c.fortune === '大吉' ? '#c62828' : 
                               c.fortune === '中吉' ? '#ef6c00' : 
                               c.fortune === '小吉' ? '#2e7d32' : 
                               c.fortune === '吉' ? '#1565c0' : '#424242',
                        textShadow: '3px 3px 6px rgba(255,255,255,0.9), 2px 2px 0px rgba(0,0,0,0.5), -1px -1px 0px rgba(255,255,255,0.7)',
                        letterSpacing: 'min(2px, 0.5vw)',
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}>{c.fortune}</div>
                      {isChosen && <div style={{ fontSize: 'clamp(10px, 3vw, 14px)', color: '#c62828', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(255,255,255,0.9), 1px 1px 0px rgba(0,0,0,0.3)', marginTop: '2px' }}>✨ あなたの選択</div>}
                    </>
                  ) : (
                    <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>？</div>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>
      {showAll && (
        <div className="comic-card" style={{ 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
          padding: '20px 28px', 
          borderColor: '#8bc34a',
          textAlign: 'center',
          marginTop: '12px'
        }}>
          <div className="comic-text" style={{ color: '#ffffff', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', marginBottom: '10px', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.5)' }}>
            あなたの運勢: {cards[revealedIdx!]?.fortune}
          </div>
          <div className="comic-text" style={{ color: '#e8f5e8', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
            他の選択肢も確認してみてね！
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={reset} 
          className="comic-button font-button-md"
          style={{ 
            background: 'linear-gradient(45deg, #66bb6a, #4caf50)', 
            color: '#fff', 
            borderColor: '#2e7d32'
          }}
        >
          🔄 もう一度
        </button>
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <button 
            className="comic-button font-button-md"
            style={{ 
              background: 'linear-gradient(45deg, #2196f3, #1976d2)', 
              color: '#fff', 
              borderColor: '#1565c0'
            }}
          >
            🏠 遊技場に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default OmikujiChoice

