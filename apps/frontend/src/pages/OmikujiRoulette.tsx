import React, { useMemo, useState } from 'react'

const allFortunes = ['大吉','中吉','小吉','吉','凶']

const OmikujiChoice: React.FC = () => {
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null)
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
  }

  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center' }}>
      <div style={{ color: '#fff3e0', fontSize: '1.4rem', textShadow: '2px 2px 0px #2e7d32, 4px 4px 0px #1b5e20', fontWeight: 'bold' }}>🔮 一枚選んでください 🔮</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(60px, 1fr))', gap: 12, width: '100%', maxWidth: 600, padding: '0 12px' }}>
        {cards.map((c) => {
          const isOpen = revealedIdx === c.id
          return (
            <div key={c.id} style={{ aspectRatio: '2 / 3', width: '100%', position: 'relative' }}>
              <button 
                onClick={() => setRevealedIdx(c.id)} 
                disabled={revealedIdx !== null} 
                style={{ 
                  aspectRatio: '2 / 3', 
                  width: '100%', 
                  borderRadius: 12, 
                  border: '2px solid rgba(255,255,255,0.6)', 
                  background: isOpen ? '#fff' : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 50%, #1b5e20 100%)', 
                  color: isOpen ? '#333' : '#fff', 
                  fontWeight: 800, 
                  fontSize: 20, 
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)', 
                  cursor: revealedIdx === null ? 'pointer' : 'default',
                  transform: isOpen ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transition: 'transform 0.6s ease-in-out',
                  transformStyle: 'preserve-3d',
                  position: 'relative'
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
                  transform: isOpen ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}>
                  {isOpen ? c.fortune : '？'}
                </div>
              </button>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 12, border: '2px solid #8bc34a', background: 'linear-gradient(45deg, #66bb6a, #4caf50)', color: '#fff', fontSize: '1.1rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}>🔄 もう一度</button>
      </div>
    </div>
  )
}

export default OmikujiChoice

