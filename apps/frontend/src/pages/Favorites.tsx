import React, { useState } from 'react'
import { useAppData, type FavoriteItem } from '../contexts/AppDataContext'

const Favorites: React.FC = () => {
  const { favorites, addFavorite, removeFavorite, momoPayPoints, spendMomoPayPoints } = useAppData()
  const [textName, setTextName] = useState('')
  const [textBody, setTextBody] = useState('')
  const UPLOAD_COST = 100 // アップロードの費用（100MOMOPay）


  const genId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    // MOMOPayをチェック
    if (momoPayPoints < UPLOAD_COST) {
      alert(`ファイルアップロードには${UPLOAD_COST}MOMOPayが必要です。演習林でMOMOPayを稼いでください！`)
      e.target.value = ''
      return
    }
    
    const file = e.target.files[0] // 最初のファイルのみ使用
    
    if (!confirm(`ファイルをアップロードします。${UPLOAD_COST}MOMOPayを消費しますか？`)) {
      e.target.value = ''
      return
    }
    
    const name = window.prompt('ファイル名を入力（必須）', file.name)
    if (!name || !name.trim()) {
      alert('名前は必須です。キャンセルします。')
      e.target.value = ''
      return
    }
    
    // MOMOPayを消費
    if (!spendMomoPayPoints(UPLOAD_COST)) {
      alert('MOMOPay不足。')
      e.target.value = ''
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const item: FavoriteItem = {
        id: genId(),
        name: name.trim(),
        kind: 'file',
        dataUrl,
        mime: file.type,
        createdAt: new Date().toISOString(),
      }
      addFavorite(item)
      alert('ファイルをアップロードしました！')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textBody.trim() || !textName.trim()) return
    
    // MOMOPayをチェック
    if (momoPayPoints < UPLOAD_COST) {
      alert(`テキスト追加には${UPLOAD_COST}MOMOPayが必要です。演習林でMOMOPayを稼いでください！`)
      return
    }
    
    if (!confirm(`テキストを宝物庫に追加します。${UPLOAD_COST}MOMOPayを消費しますか？`)) {
      return
    }
    
    // MOMOPayを消費
    if (!spendMomoPayPoints(UPLOAD_COST)) {
      alert('MOMOPay不足。')
      return
    }
    
    const item: FavoriteItem = {
      id: genId(),
      name: textName.trim(),
      kind: 'text',
      text: textBody,
      createdAt: new Date().toISOString(),
    }
    addFavorite(item)
    setTextName('')
    setTextBody('')
  }

  const handleDelete = (id: string) => {
    removeFavorite(id)
  }

  const renderPreview = (item: FavoriteItem) => {

    if (item.kind === 'text') {
      return <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '200px', overflowY: 'auto' }}>{item.text}</p>
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
        <h2 className="comic-text" style={{ color: '#fff3e0', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', fontSize: '2.4rem', marginBottom: '12px' }}>🌲 宝物庫 🌲</h2>
        <p className="comic-text" style={{ color: '#c8e6c9', fontSize: '1.3rem', textShadow: '2px 2px 0px rgba(0,0,0,0.5)', marginBottom: '16px' }}>好きなファイルやテキストを保存しよう</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="comic-text" style={{ fontSize: '1.2rem', color: '#ffd93d', textShadow: '2px 2px 0px #f57f17, 0 0 8px rgba(255,217,61,0.5)' }}>
            💰 MOMOPay: {momoPayPoints}
          </div>
          <div className="comic-text" style={{ fontSize: '1rem', color: '#c8e6c9', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
            費用: {UPLOAD_COST}MOMOPay
          </div>
        </div>
        {momoPayPoints < UPLOAD_COST && (
          <div className="comic-text" style={{ fontSize: '0.9rem', color: '#ff6b6b', textShadow: '1px 1px 0px rgba(0,0,0,0.5)', marginTop: '8px' }}>
            ⚠️ MOMOPay不足。演習林で稼いでください！
          </div>
        )}
      </div>
      
      <div className="comic-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '24px', borderColor: '#8bc34a', marginBottom: '24px' }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '18px', fontSize: '1.5rem' }}>📤 ファイルをアップロード</h3>
        <input 
          type="file" 
          onChange={handleUpload} 
          disabled={momoPayPoints < UPLOAD_COST}
          className="comic-input"
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderColor: momoPayPoints < UPLOAD_COST ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)',
            background: momoPayPoints < UPLOAD_COST ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
            color: momoPayPoints < UPLOAD_COST ? 'rgba(255,255,255,0.5)' : 'white',
            fontSize: '1.1rem',
            cursor: momoPayPoints < UPLOAD_COST ? 'not-allowed' : 'pointer'
          }} 
        />
        <p className="comic-text" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginTop: '10px' }}>画像、動画、音声、テキストファイルなど対応（1ファイルずつ）</p>
      </div>

      <div className="comic-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '24px', borderColor: '#8bc34a', marginBottom: '24px' }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '18px', fontSize: '1.5rem' }}>📝 テキストを追加</h3>
        <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            value={textName} 
            onChange={(e) => setTextName(e.target.value)} 
            placeholder="タイトル（必須）"
            required 
            className="comic-input"
            style={{
              padding: '12px',
              borderColor: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1.1rem'
            }}
          />
          <textarea 
            value={textBody} 
            onChange={(e) => setTextBody(e.target.value)} 
            placeholder="テキストを入力..." 
            rows={4}
            className="comic-input"
            style={{
              padding: '12px',
              borderColor: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1.1rem',
              resize: 'vertical'
            }}
          />
          <button 
            type="submit" 
            disabled={momoPayPoints < UPLOAD_COST}
            className="comic-button"
            style={{
              padding: '14px 28px',
              background: momoPayPoints < UPLOAD_COST ? '#666' : 'linear-gradient(45deg, #66bb6a, #4caf50)',
              color: momoPayPoints < UPLOAD_COST ? '#ccc' : 'white',
              fontSize: '1.2rem',
              alignSelf: 'flex-start',
              borderColor: momoPayPoints < UPLOAD_COST ? '#333' : '#2e7d32',
              cursor: momoPayPoints < UPLOAD_COST ? 'not-allowed' : 'pointer'
            }}
          >
            ✨ テキスト追加 ({UPLOAD_COST}P)
          </button>
        </form>
      </div>

      <div style={{ marginTop: '30px' }}>
            <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '24px', fontSize: '1.5rem' }}>🗂️ 保存済みアイテム ({favorites.length}件)</h3>
            {favorites.length === 0 ? (
          <div className="comic-card" style={{ 
            textAlign: 'center', 
            color: '#c8e6c9', 
            padding: '48px', 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.05))', 
            borderColor: '#8bc34a',
            borderStyle: 'dashed'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>📦</div>
            <div className="comic-text" style={{ fontSize: '1.2rem' }}>まだ何も保存されていません</div>
            <div className="comic-text" style={{ fontSize: '1rem', marginTop: '8px' }}>ファイルアップロードかテキスト追加</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {favorites.map((item) => (
              <div key={item.id} className="comic-card" style={{ 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
                color: '#fff3e0', 
                padding: '24px', 
                borderColor: '#8bc34a',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 className="comic-text" style={{ margin: 0, fontSize: '1.2rem' }}>{item.name}</h4>
                  <button 
                    onClick={() => handleDelete(item.id)} 
                    className="comic-button"
                    style={{ 
                      background: 'linear-gradient(45deg, #ff6b6b, #f44336)',
                      color: 'white',
                      padding: '6px 12px',
                      fontSize: '0.9rem',
                      borderColor: '#d32f2f'
                    }}
                  >
                    🗑️ 削除
                  </button>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  {renderPreview(item)}
                </div>
                <div className="comic-text" style={{ 
                  fontSize: '0.9rem', 
                  color: 'rgba(255,255,255,0.7)',
                  borderTop: '2px solid rgba(255,255,255,0.2)',
                  paddingTop: '10px'
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

