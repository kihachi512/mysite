import React, { useCallback, useState } from 'react'

type FavoriteText = {
  id: string
  name: string
  kind: 'text'
  text: string
  createdAt: string
}

type FavoriteFile = {
  id: string
  name: string
  kind: 'file'
  dataUrl: string
  mime?: string
  createdAt: string
}

export type FavoriteItem = FavoriteText | FavoriteFile

const LS_KEY = 'favoriteUploads'

const isFavoriteItem = (value: unknown): value is FavoriteItem => {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.createdAt !== 'string') return false
  if (item.kind === 'text') {
    return typeof item.text === 'string'
  }
  if (item.kind === 'file') {

    if (typeof item.dataUrl !== 'string') return false
    return item.mime == null || typeof item.mime === 'string'

  }
  return false
}


const parseIso = (value: string) => {
  const time = Date.parse(value)
  return Number.isFinite(time) ? time : 0
}

const orderByCreatedAtDesc = (items: FavoriteItem[]): FavoriteItem[] => {
  return [...items].sort((a, b) => parseIso(b.createdAt) - parseIso(a.createdAt))
}

const readCachedFavorites = (): FavoriteItem[] => {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(LS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return orderByCreatedAtDesc(parsed.filter(isFavoriteItem))

  } catch {
    return []
  }
}

const Favorites: React.FC = () => {
  const [uploads, setUploads] = useState<FavoriteItem[]>(readCachedFavorites)
  const [textName, setTextName] = useState('')
  const [textBody, setTextBody] = useState('')

  const updateUploads = useCallback((updater: React.SetStateAction<FavoriteItem[]>) => {
    setUploads(prev => {

      const nextRaw = typeof updater === 'function'
        ? (updater as (prev: FavoriteItem[]) => FavoriteItem[])(prev)
        : updater
      const next = orderByCreatedAtDesc(nextRaw.filter(isFavoriteItem))

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LS_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const genId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      const name = window.prompt('名前を入力してください', file.name) || file.name
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        const item: FavoriteItem = {
          id: genId(),
          name,
          kind: 'file',
          dataUrl,
          mime: file.type,
          createdAt: new Date().toISOString(),
        }
        updateUploads(prev => [...prev, item])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textBody.trim()) return
    const name = textName || '無題'
    const item: FavoriteItem = {
      id: genId(),
      name,
      kind: 'text',
      text: textBody,
      createdAt: new Date().toISOString(),
    }
    updateUploads(prev => [...prev, item])
    setTextName('')
    setTextBody('')
  }

  const handleDelete = async (id: string) => {
    updateUploads(prev => prev.filter(item => item.id !== id))
  }

  const renderPreview = (item: FavoriteItem) => {

    if (item.kind === 'text') {
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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#fff3e0', textShadow: '2px 2px 0px #2e7d32, 4px 4px 0px #1b5e20', fontSize: '2.2rem', marginBottom: '10px', fontWeight: 'bold' }}>🌲 宝物庫 🌲</h2>
        <p style={{ color: '#c8e6c9', fontSize: '1.2rem', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>好きなファイルやテキストを保存しよう</p>
      </div>
      
      <div style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '20px', borderRadius: '16px', border: '2px solid #8bc34a', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
        <h3 style={{ color: '#fff3e0', marginBottom: '15px', fontSize: '1.3rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>📤 ファイルをアップロード</h3>
        <input 
          type="file" 
          multiple 
          onChange={handleUpload} 
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '8px', 
            border: '2px dashed rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '1rem'
          }} 
        />
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '8px' }}>画像、動画、音声、テキストファイルなど対応</p>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '20px', borderRadius: '16px', border: '2px solid #8bc34a', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
        <h3 style={{ color: '#fff3e0', marginBottom: '15px', fontSize: '1.3rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>📝 テキストを追加</h3>
        <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            value={textName} 
            onChange={(e) => setTextName(e.target.value)} 
            placeholder="タイトル（任意）" 
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1rem'
            }}
          />
          <textarea 
            value={textBody} 
            onChange={(e) => setTextBody(e.target.value)} 
            placeholder="テキストを入力してください..." 
            rows={4}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
          <button 
            type="submit" 
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: '2px solid #8bc34a',
              background: 'linear-gradient(45deg, #66bb6a, #4caf50)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}
          >
            ✨ テキスト追加
          </button>
        </form>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#fff3e0', marginBottom: '20px', fontSize: '1.3rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>🗂️ 保存済みアイテム ({uploads.length}件)</h3>
        {uploads.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#c8e6c9', 
            padding: '40px', 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.05))', 
            borderRadius: '16px',
            border: '2px dashed #8bc34a',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📦</div>
            <div>まだ何も保存されていません</div>
            <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>ファイルをアップロードするか、テキストを追加してください</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {uploads.map((item) => (
              <div key={item.id} style={{ 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
                color: '#fff3e0', 
                padding: '20px', 
                borderRadius: '16px', 
                border: '2px solid #8bc34a',
                position: 'relative',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>{item.name}</h4>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    style={{ 
                      background: 'rgba(255,107,107,0.2)',
                      border: '1px solid rgba(255,107,107,0.4)',
                      color: '#ff6b6b',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ 削除
                  </button>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  {renderPreview(item)}
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: 'rgba(255,255,255,0.6)',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '8px'
                }}>
                  {new Date(item.createdAt).toLocaleString('ja-JP')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites

