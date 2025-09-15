import React, { useEffect, useState } from 'react'
import { api, type FavoriteItem } from '../lib/api'

const LS_KEY = 'favoriteUploads'

const Favorites: React.FC = () => {
  const items = [
    { title: 'モモンガの写真', desc: 'ふわふわ滑空！' },
    { title: 'お気に入りの曲', desc: '楽しい気分になるプレイリスト' },
    { title: '参考リンク', desc: '面白いサイトのブックマーク' },
  ]

  const [uploads, setUploads] = useState<FavoriteItem[]>([])
  const [textName, setTextName] = useState('')
  const [textBody, setTextBody] = useState('')

  useEffect(() => {
    api
      .listFavorites()
      .then(list => {
        setUploads(list)
        window.localStorage.setItem(LS_KEY, JSON.stringify(list))
      })
      .catch(err => {
        console.error(err)
        const cached = window.localStorage.getItem(LS_KEY)
        if (cached) {
          try {
            setUploads(JSON.parse(cached))
          } catch {
            /* ignore */
          }
        }
      })
  }, [])

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      const name = window.prompt('名前を入力してください', file.name) || file.name
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        try {
          const res = await api.addFavorite({ name, dataUrl, mime: file.type })
          const item: FavoriteItem = {
            id: res.id,
            name,
            kind: 'file',
            dataUrl,
            mime: file.type,
            createdAt: new Date().toISOString(),
          }
          setUploads(prev => {
            const next = [...prev, item]
            window.localStorage.setItem(LS_KEY, JSON.stringify(next))
            return next
          })
        } catch (err) {
          console.error(err)
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textBody.trim()) return
    const name = textName || '無題'
    try {
      const res = await api.addFavorite({ name, text: textBody })
      const item: FavoriteItem = {
        id: res.id,
        name,
        kind: 'text',
        text: textBody,
        createdAt: new Date().toISOString(),
      }
      setUploads(prev => {
        const next = [...prev, item]
        window.localStorage.setItem(LS_KEY, JSON.stringify(next))
        return next
      })
      setTextName('')
      setTextBody('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteFavorite(id)
      setUploads(prev => {
        const next = prev.filter(item => item.id !== id)
        window.localStorage.setItem(LS_KEY, JSON.stringify(next))
        return next
      })
    } catch (err) {
      console.error(err)
    }
  }

  const renderPreview = (item: FavoriteItem) => {
    if (item.kind === 'text' && item.text) {
      return <p style={{ whiteSpace: 'pre-wrap' }}>{item.text}</p>
    }
    const { dataUrl, mime, name } = item
    if (mime?.startsWith('image/')) {
      return <img src={dataUrl} alt={name} style={{ maxWidth: '100%' }} />
    }
    if (mime?.startsWith('audio/')) {
      return <audio controls src={dataUrl} />
    }
    if (mime?.startsWith('video/')) {
      return <video controls src={dataUrl} style={{ maxWidth: '100%' }} />
    }
    return (
      <a href={dataUrl} download={name} style={{ color: 'white', textDecoration: 'underline' }}>
        {name}
      </a>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: 'white', textShadow: '1px 1px 2px #333' }}>好きなもの置き場</h2>
      <input type="file" multiple onChange={handleUpload} style={{ marginTop: 12 }} />
      <form onSubmit={handleTextSubmit} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input value={textName} onChange={(e) => setTextName(e.target.value)} placeholder="名前" />
        <textarea value={textBody} onChange={(e) => setTextBody(e.target.value)} placeholder="テキストを入力" />
        <button type="submit">テキスト追加</button>
      </form>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.3)', color: 'white', padding: 16, borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ marginBottom: 8 }}>{it.title}</h3>
            <p>{it.desc}</p>
          </div>
        ))}
        {uploads.map((item) => (
          <div key={item.id} style={{ background: 'rgba(0,0,0,0.3)', color: 'white', padding: 16, borderRadius: 12, border: '2px solid rgba(255,255,255,0.2)' }}>
            <h3 style={{ marginBottom: 8 }}>{item.name}</h3>
            {renderPreview(item)}
            <button onClick={() => handleDelete(item.id)} style={{ marginTop: 8 }}>
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Favorites

