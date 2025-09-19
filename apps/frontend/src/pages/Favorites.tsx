import React, { useState } from 'react'
import { useAppData, type FavoriteItem } from '../contexts/AppDataContext'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'
import { validateFileType, validateFileSize, escapeHtml, detectMaliciousScript, validateInputLength } from '../utils/security'

const Favorites: React.FC = () => {
  useSEO(SEO_PRESETS.favorites);
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
    if (!file) return
    
    // セキュリティチェック：ファイルタイプの検証
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg',
      'text/plain', 'application/json', 'application/pdf'
    ]
    
    if (!validateFileType(file, allowedTypes)) {
      alert('サポートされていないファイル形式です。')
      e.target.value = ''
      return
    }
    
    // ファイルサイズの検証（10MB制限）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (!validateFileSize(file, maxSize)) {
      alert('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。')
      e.target.value = ''
      return
    }
    
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
    
    // ファイル名の検証
    if (!validateInputLength(name.trim(), 100)) {
      alert('ファイル名が長すぎます。100文字以内で入力してください。')
      e.target.value = ''
      return
    }
    
    // 悪意のあるファイル名の検出
    if (detectMaliciousScript(name.trim())) {
      alert('不正なファイル名が検出されました。')
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
      try {
        const dataUrl = reader.result as string
        
        // データURLの基本的な検証
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
          console.error('Invalid data URL generated')
          alert('ファイルの読み込みに失敗しました。')
          return
        }
        
        const item: FavoriteItem = {
          id: genId(),
          name: escapeHtml(name.trim()), // ファイル名をエスケープ
          kind: 'file',
          dataUrl,
          mime: file.type,
          createdAt: new Date().toISOString(),
        }
        addFavorite(item)
        alert('ファイルをアップロードしました！')
      } catch (error) {
        console.error('File upload error:', error)
        alert('ファイルのアップロードに失敗しました。')
      }
    }
    
    reader.onerror = () => {
      console.error('FileReader error')
      alert('ファイルの読み込みに失敗しました。')
    }
    
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textBody.trim() || !textName.trim()) return
    
    // 入力値の検証
    if (!validateInputLength(textName.trim(), 100)) {
      alert('タイトルが長すぎます。100文字以内で入力してください。')
      return
    }
    
    if (!validateInputLength(textBody.trim(), 10000)) {
      alert('テキストが長すぎます。10,000文字以内で入力してください。')
      return
    }
    
    // 悪意のあるスクリプトの検出
    if (detectMaliciousScript(textName.trim()) || detectMaliciousScript(textBody.trim())) {
      alert('不正なスクリプトが検出されました。')
      return
    }
    
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
      name: escapeHtml(textName.trim()), // タイトルをエスケープ
      kind: 'text',
      text: escapeHtml(textBody.trim()), // テキストをエスケープ
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
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'flex-start',
          padding: '12px'
        }}>
          <p className="comic-text font-body-sm" style={{ 
            whiteSpace: 'pre-wrap', 
            wordBreak: 'break-word', 
            maxHeight: '100%', 
            overflowY: 'auto',
            textAlign: 'left',
            color: '#fff3e0',
            lineHeight: '1.4',
            margin: 0,
            width: '100%'
          }}>
            {item.text && item.text.length > 100 ? `${item.text.substring(0, 100)}...` : (item.text || '')}
          </p>
        </div>
      )
    }

    const { dataUrl, mime, name } = item
    if (mime?.startsWith('image/')) {
      return (
        <img 
          src={dataUrl} 
          alt={name} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%', 
            objectFit: 'contain',
            borderRadius: '8px'
          }} 
        />
      )
    }
    if (mime?.startsWith('audio/')) {
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="font-icon-md">🎵</div>
          <audio controls src={dataUrl} style={{ width: '100%', maxWidth: '250px' }} />
        </div>
      )
    }
    if (mime?.startsWith('video/')) {
      return (
        <video 
          controls 
          src={dataUrl} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            borderRadius: '8px'
          }} 
        />
      )
    }
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '12px',
        textAlign: 'center'
      }}>
        <div className="font-icon-md">📄</div>
        <a 
          href={dataUrl} 
          download={name} 
          className="comic-button font-button-sm"
          style={{ 
            color: 'white', 
            textDecoration: 'none',
            background: 'linear-gradient(45deg, #42a5f5, #2196f3)',
            borderColor: '#1976d2',
            padding: '8px 16px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          📥 ダウンロード
        </a>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 className="comic-text font-title-lg" style={{ color: '#fff3e0', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', marginBottom: '12px' }}>🌲 宝物庫 🌲</h2>
        <p className="comic-text font-body-lg" style={{ color: '#c8e6c9', textShadow: '2px 2px 0px rgba(0,0,0,0.5)', marginBottom: '16px' }}>好きなファイルやテキストを保存しよう</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="momopay-display" style={{ textShadow: '2px 2px 0px #f57f17, 0 0 8px rgba(255,217,61,0.5)' }}>
            💰 MOMOPay: {momoPayPoints}
          </div>
          <div className="comic-text" style={{ fontSize: '1rem', color: '#c8e6c9', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
            <span className="momopay-small">費用: {UPLOAD_COST}MOMOPay</span>
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
            className="comic-button font-button-md"
            style={{
              background: momoPayPoints < UPLOAD_COST ? '#666' : 'linear-gradient(45deg, #66bb6a, #4caf50)',
              color: momoPayPoints < UPLOAD_COST ? '#ccc' : 'white',
              alignSelf: 'flex-start',
              borderColor: momoPayPoints < UPLOAD_COST ? '#333' : '#2e7d32',
              cursor: momoPayPoints < UPLOAD_COST ? 'not-allowed' : 'pointer'
            }}
          >
            <span className="momopay-small">✨ テキスト追加 ({UPLOAD_COST}P)</span>
          </button>
        </form>
      </div>

      <div style={{ marginTop: '30px' }}>
            <h3 className="comic-text font-title-md" style={{ color: '#fff3e0', marginBottom: '24px' }}>🗂️ 保存済みアイテム ({favorites.length}件)</h3>
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
          <div className="favorites-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', 
            gap: 'min(24px, 4vw)',
            padding: '0 min(8px, 2vw)'
          }}>
            {favorites.map((item) => (
              <div key={item.id} className="comic-card favorites-item" style={{ 
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
                color: '#fff3e0', 
                padding: 'min(24px, 5vw)', 
                borderColor: '#8bc34a',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '280px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}>
                {/* ヘッダー部分 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: '16px',
                  minHeight: '40px',
                  paddingTop: '8px' // ファイルタイプインジケーターとの重複を避ける
                }}>
                  <h4 className="comic-text font-title-sm" style={{ 
                    margin: 0, 
                    flex: 1, 
                    wordBreak: 'break-word',
                    lineHeight: '1.3',
                    paddingRight: '12px',
                    paddingLeft: '80px' // ファイルタイプインジケーター分のスペース確保
                  }}>
                    {item.name}
                  </h4>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }} 
                    className="comic-button font-button-sm"
                    style={{ 
                      background: 'linear-gradient(45deg, #ff6b6b, #f44336)',
                      color: 'white',
                      padding: 'min(8px 12px, 2vw 3vw)',
                      borderColor: '#d32f2f',
                      flexShrink: 0,
                      minWidth: '60px'
                    }}
                  >
                    🗑️
                  </button>
                </div>

                {/* プレビュー部分 */}
                <div style={{ 
                  flex: 1,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px'
                  }}>
                    {renderPreview(item)}
                  </div>
                </div>

                {/* フッター部分 */}
                <div className="comic-text font-body-sm" style={{ 
                  color: 'rgba(255,255,255,0.7)',
                  borderTop: '2px solid rgba(255,255,255,0.2)',
                  paddingTop: '12px',
                  textAlign: 'center'
                }}>
                  📅 {new Date(item.createdAt).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                {/* ファイルタイプインジケーター */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(76, 175, 80, 0.9)',
                  color: 'white',
                  padding: '6px 10px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  zIndex: 1 // 他の要素より前面に表示
                }}>
                  {item.kind === 'text' ? '📝 TEXT' : 
                   item.mime?.startsWith('image/') ? '🖼️ IMAGE' :
                   item.mime?.startsWith('video/') ? '🎬 VIDEO' :
                   item.mime?.startsWith('audio/') ? '🎵 AUDIO' : '📄 FILE'}
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

