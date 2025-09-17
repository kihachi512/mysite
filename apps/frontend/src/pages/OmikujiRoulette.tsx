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
      <div style={{ color: 'white' }}>一枚選んでください</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(60px, 1fr))', gap: 12, width: '100%', maxWidth: 600, padding: '0 12px' }}>
        {cards.map((c) => {
          const isOpen = revealedIdx === c.id
          return (
            <button key={c.id} onClick={() => setRevealedIdx(c.id)} disabled={revealedIdx !== null} style={{ aspectRatio: '2 / 3', width: '100%', borderRadius: 12, border: '2px solid rgba(255,255,255,0.6)', background: isOpen ? '#fff' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: isOpen ? '#333' : '#fff', fontWeight: 800, fontSize: 20, boxShadow: '0 6px 16px rgba(0,0,0,0.3)', cursor: revealedIdx === null ? 'pointer' : 'default' }}>
              {isOpen ? c.fortune : '？'}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={reset} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#45B7D1', color: '#fff' }}>もう一度</button>
      </div>
    </div>
  )
}

export default OmikujiChoice

