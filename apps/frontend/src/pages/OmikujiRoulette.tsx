import React, { useEffect, useMemo, useRef, useState } from 'react'

const fortunes = ['大吉','中吉','小吉','吉','末吉','凶','大凶']
const colors = ['#FF6B6B','#4ECDC4','#45B7D1','#FFD166','#A29BFE','#81ECEC','#55EFC4']

const degPer = 360 / fortunes.length

const OmikujiRoulette: React.FC = () => {
  const [spinning, setSpinning] = useState(false)
  const [angle, setAngle] = useState(0)
  const [result, setResult] = useState<string>('')
  const spinRef = useRef<number | null>(null)

  const segments = useMemo(() => fortunes.map((label, i) => ({ label, color: colors[i % colors.length], start: i * degPer })), [])

  useEffect(() => () => { if (spinRef.current) cancelAnimationFrame(spinRef.current) }, [])

  const spin = () => {
    if (spinning) return
    setResult('')
    setSpinning(true)
    const target = angle + 720 + Math.random() * 720
    const start = performance.now()
    const duration = 2000 + Math.random() * 1000
    const from = angle
    const animate = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      const current = from + (target - from) * eased
      setAngle(current)
      if (p < 1) {
        spinRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        const a = ((current % 360) + 360) % 360
        const idx = Math.floor(((360 - a + degPer / 2) % 360) / degPer)
        setResult(fortunes[idx])
      }
    }
    spinRef.current = requestAnimationFrame(animate)
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '20px solid #fff', filter: 'drop-shadow(0 2px 0 #333)', zIndex: 2 }} />
        <div style={{ width: 320, height: 320, borderRadius: '50%', border: '8px solid #333', position: 'relative', overflow: 'hidden', transform: `rotate(${angle}deg)`, transition: spinning ? 'none' : 'transform 0.2s', background: '#fff' }}>
          {segments.map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: '50%', height: '50%', top: '50%', left: '50%', transformOrigin: '0% 0%', transform: `rotate(${s.start}deg) skewY(${90 - degPer}deg)`, background: s.color }} />
          ))}
          {segments.map((s, i) => {
            const mid = s.start + degPer / 2
            return (
              <div key={`label-${i}`} style={{ position: 'absolute', top: '50%', left: '50%', transformOrigin: '0 0', transform: `rotate(${mid}deg) translate(80px) rotate(${-mid}deg)`, color: '#000', fontWeight: 800, textShadow: '0 1px 2px rgba(255,255,255,0.8), 0 0 3px rgba(0,0,0,0.4)' }}>
                {s.label}
              </div>
            )
          })}
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <div style={{ textAlign: 'center', color: '#333', background: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8, border: '1px solid #ccc' }}>モモンガ占い</div>
          </div>
        </div>
      </div>
      <button onClick={spin} disabled={spinning} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#4ECDC4', color: '#fff', cursor: 'pointer' }}>{spinning ? '回転中...' : '回す'}</button>
      {result && <div style={{ color: 'white', fontSize: 24 }}>結果: {result}</div>}
    </div>
  )
}

export default OmikujiRoulette

