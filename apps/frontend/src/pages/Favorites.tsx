import React from 'react'

const Favorites: React.FC = () => {
  const items = [
    { title: 'モモンガの写真', desc: 'ふわふわ滑空！' },
    { title: 'お気に入りの曲', desc: '楽しい気分になるプレイリスト' },
    { title: '参考リンク', desc: '面白いサイトのブックマーク' },
  ]
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: 'white', textShadow: '1px 1px 2px #333' }}>好きなもの置き場</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.3)', color: 'white', padding: 16, borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ marginBottom: 8 }}>{it.title}</h3>
            <p>{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Favorites

