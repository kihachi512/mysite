import React, { useMemo, useState } from 'react'

const allFortunes = ['大吉','中吉','小吉','吉','凶']

const OmikujiChoice: React.FC = () => {
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [shuffled, setShuffled] = useState<string[]>(() => {
    const arr = [...allFortunes]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  })

  const cards = useMemo(() => shuffled.map((f, i) => ({ id: i, fortune: f })), [shuffled])

  const reset = () => {
    const arr = [...allFortunes]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setShuffled(arr)
    setRevealedIdx(null)
    setShowAll(false)
  }

  const handleCardClick = (cardId: number) => {
    if (revealedIdx !== null) return
    setRevealedIdx(cardId)
    // Show all cards after a short delay
    setTimeout(() => {
      setShowAll(true)
    }, 1000)
  }

  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
      <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.6rem', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)' }}>
        {revealedIdx === null ? '🔮 一枚選んでください 🔮' : showAll ? '🎉 結果発表！ 🎉' : '🔮 結果を確認中... 🔮'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(60px, 1fr))', gap: 12, width: '100%', maxWidth: 600, padding: '0 12px' }}>
        {cards.map((c) => {
          const isOpen = revealedIdx === c.id
          const isChosen = revealedIdx === c.id
          const shouldShow = showAll || isOpen
          return (
            <div key={c.id} style={{ aspectRatio: '2 / 3', width: '100%', position: 'relative' }}>
              <button 
                onClick={() => handleCardClick(c.id)} 
                disabled={revealedIdx !== null} 
                className="comic-button"
                style={{ 
                  aspectRatio: '2 / 3', 
                  width: '100%', 
                  borderRadius: 20, 
                  border: isChosen ? '4px solid #ffd700' : '3px solid rgba(255,255,255,0.8)', 
                        background: shouldShow ? 'linear-gradient(135deg, #fff3e0 0%, #fff8e1 50%, #f3e5ab 100%)' : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)',
                  color: shouldShow ? '#2e7d32' : '#fff', 
                  fontWeight: 800, 
                  fontSize: 18, 
                  boxShadow: isChosen ? '0 0 25px rgba(255, 215, 0, 0.9), 0 10px 25px rgba(0,0,0,0.5), inset 0 3px 0 rgba(255,255,255,0.3)' : '0 8px 0 rgba(0,0,0,0.3), inset 0 3px 0 rgba(255,255,255,0.3)', 
                  cursor: revealedIdx === null ? 'pointer' : 'default',
                  transform: shouldShow ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'all 0.6s ease-in-out',
                  transformStyle: 'preserve-3d',
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
                  backfaceVisibility: 'hidden',
                  transform: shouldShow ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {shouldShow ? (
                    <>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: c.fortune === '大吉' ? '#d32f2f' : 
                               c.fortune === '中吉' ? '#f57c00' : 
                               c.fortune === '小吉' ? '#388e3c' : 
                               c.fortune === '吉' ? '#1976d2' : '#424242',
                        textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
                      }}>{c.fortune}</div>
                      {isChosen && <div style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 'bold' }}>✨ あなたの選択</div>}
                    </>
                  ) : (
                    '？'
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
          <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.4rem', marginBottom: '10px' }}>
            あなたの運勢: {cards[revealedIdx!]?.fortune}
          </div>
          <div className="comic-text" style={{ color: '#c8e6c9', fontSize: '1rem' }}>
            他の選択肢も確認してみてね！
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          onClick={reset} 
          className="comic-button"
          style={{ 
            padding: '12px 24px', 
            background: 'linear-gradient(45deg, #66bb6a, #4caf50)', 
            color: '#fff', 
            fontSize: '1.2rem',
            borderColor: '#2e7d32'
          }}
        >
          🔄 もう一度
        </button>
      </div>
    </div>
  )
}

export default OmikujiChoice

