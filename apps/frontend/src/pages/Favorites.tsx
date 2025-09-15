import React, { useState } from 'react'

type UploadItem = {
  file: File
  url: string
}

const Favorites: React.FC = () => {
  const items = [
    { title: 'モモンガの写真', desc: 'ふわふわ滑空！' },
    { title: 'お気に入りの曲', desc: '楽しい気分になるプレイリスト' },
    { title: '参考リンク', desc: '面白いサイトのブックマーク' },
  ]

  const [uploads, setUploads] = useState<UploadItem[]>([])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newItems = Array.from(e.target.files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))
    setUploads((prev) => [...prev, ...newItems])
  }

  const renderPreview = (item: UploadItem) => {
    const { file, url } = item
    if (file.type.startsWith('image/')) {
      return <img src={url} alt={file.name} style={{ maxWidth: '100%' }} />
    }
    if (file.type.startsWith('audio/')) {
      return <audio controls src={url} />
    }
    if (file.type.startsWith('video/')) {
      return <video controls src={url} style={{ maxWidth: '100%' }} />
    }
    return (
      <a href={url} download={file.name} style={{ color: 'white', textDecoration: 'underline' }}>
        {file.name}
      </a>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: 'white', textShadow: '1px 1px 2px #333' }}>好きなもの置き場</h2>
      <input type="file" multiple onChange={handleUpload} style={{ marginTop: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.3)', color: 'white', padding: 16, borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ marginBottom: 8 }}>{it.title}</h3>
            <p>{it.desc}</p>
          </div>
        ))}
        {uploads.map((item, i) => (
          <div key={`u-${i}`} style={{ background: 'rgba(0,0,0,0.3)', color: 'white', padding: 16, borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ marginBottom: 8 }}>{item.file.name}</h3>
            {renderPreview(item)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Favorites

