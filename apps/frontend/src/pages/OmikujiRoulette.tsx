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
      <div style={{ color: '#fff3e0', fontSize: '1.4rem', textShadow: '2px 2px 0px #2e7d32, 4px 4px 0px #1b5e20', fontWeight: 'bold' }}>
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
                style={{ 
                  aspectRatio: '2 / 3', 
                  width: '100%', 
                  borderRadius: 12, 
                  border: isChosen ? '3px solid #ffd700' : '2px solid rgba(255,255,255,0.6)', 
                  background: shouldShow ? '#fff' : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)', 
                  color: shouldShow ? '#333' : '#fff', 
                  fontWeight: 800, 
                  fontSize: 20, 
                  boxShadow: isChosen ? '0 0 20px rgba(255, 215, 0, 0.8), 0 8px 20px rgba(0,0,0,0.4)' : '0 6px 16px rgba(0,0,0,0.3)', 
                  cursor: revealedIdx === null ? 'pointer' : 'default',
                  transform: shouldShow ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'all 0.6s ease-in-out',
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                  animation: isChosen ? 'pulse 2s infinite' : 'none'
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
                      <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.fortune}</div>
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
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
          padding: '16px 24px', 
          borderRadius: '16px', 
          border: '2px solid #8bc34a',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
          textAlign: 'center',
          marginTop: '8px'
        }}>
          <div style={{ color: '#fff3e0', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
            あなたの運勢: {cards[revealedIdx!]?.fortune}
          </div>
          <div style={{ color: '#c8e6c9', fontSize: '0.9rem' }}>
            他の選択肢も確認してみてね！
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 12, border: '2px solid #8bc34a', background: 'linear-gradient(45deg, #66bb6a, #4caf50)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>🔄 もう一度</button>
      </div>
    </div>
  )
}

export default OmikujiChoice

