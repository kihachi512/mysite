import React, { useState } from 'react'
import { useAppData } from '../contexts/AppDataContext'

const DataExport: React.FC = () => {
  const { favorites, tweets } = useAppData()
  const [shareUrl, setShareUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // データをエクスポート用に準備
  const exportData = () => {
    const data = {
      favorites,
      tweets,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `momon-ga-carnival-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 共有リンクを生成
  const generateShareLink = async () => {
    setIsGenerating(true)
    
    try {
      const data = {
        favorites,
        tweets,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }
      
      // Base64エンコードしてURLに埋め込み
      const dataStr = JSON.stringify(data)
      const encodedData = btoa(unescape(encodeURIComponent(dataStr)))
      
      // 現在のサイトのURLにクエリパラメータとして追加
      const currentUrl = window.location.origin + window.location.pathname
      const shareUrl = `${currentUrl}?import=${encodedData}`
      
      setShareUrl(shareUrl)
      
      // クリップボードにコピー
      await navigator.clipboard.writeText(shareUrl)
      alert('共有リンクをクリップボードにコピーしました！')
    } catch (error) {
      console.error('Failed to generate share link:', error)
      alert('共有リンクの生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  // データをインポート
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (data.favorites && data.tweets) {
          // データをローカルストレージに保存
          localStorage.setItem('favoriteUploads', JSON.stringify(data.favorites))
          localStorage.setItem('tweets', JSON.stringify(data.tweets))
          
          alert('データをインポートしました！ページを再読み込みしてください。')
          window.location.reload()
        } else {
          alert('無効なデータファイルです')
        }
      } catch (error) {
        console.error('Failed to import data:', error)
        alert('データのインポートに失敗しました')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  // URLパラメータからデータを自動インポート
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const importData = urlParams.get('import')
    
    if (importData) {
      try {
        const data = JSON.parse(decodeURIComponent(escape(atob(importData))))
        
        if (data.favorites && data.tweets) {
          localStorage.setItem('favoriteUploads', JSON.stringify(data.favorites))
          localStorage.setItem('tweets', JSON.stringify(data.tweets))
          
          alert('共有されたデータをインポートしました！ページを再読み込みしてください。')
          window.location.reload()
        }
      } catch (error) {
        console.error('Failed to import shared data:', error)
      }
    }
  }, [])

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 className="comic-text" style={{ 
          color: '#fff3e0', 
          textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
          fontSize: '2.4rem', 
          marginBottom: '12px' 
        }}>
          📤 データ共有 📤
        </h2>
        <p className="comic-text" style={{ color: '#c8e6c9', fontSize: '1.3rem', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
          あなたの森の秘密基地を他の人と共有しよう
        </p>
      </div>

      {/* データ統計 */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: '24px', 
        borderColor: '#8bc34a', 
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '16px', fontSize: '1.5rem' }}>📊 データ統計</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <div>
            <div className="comic-text" style={{ color: '#c8e6c9', fontSize: '2rem', marginBottom: '4px' }}>📁</div>
            <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.2rem' }}>宝物庫</div>
            <div className="comic-text" style={{ color: '#c8e6c9', fontSize: '1rem' }}>{favorites.length}件</div>
          </div>
          <div>
            <div className="comic-text" style={{ color: '#c8e6c9', fontSize: '2rem', marginBottom: '4px' }}>🐦</div>
            <div className="comic-text" style={{ color: '#fff3e0', fontSize: '1.2rem' }}>つぶやき</div>
            <div className="comic-text" style={{ color: '#c8e6c9', fontSize: '1rem' }}>{tweets.length}件</div>
          </div>
        </div>
      </div>

      {/* エクスポート機能 */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: '24px', 
        borderColor: '#8bc34a', 
        marginBottom: '24px' 
      }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '18px', fontSize: '1.5rem' }}>💾 データをエクスポート</h3>
        <p className="comic-text" style={{ color: '#c8e6c9', marginBottom: '16px', fontSize: '1rem' }}>
          現在のデータをJSONファイルとしてダウンロードできます
        </p>
        <button 
          onClick={exportData}
          className="comic-button"
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(45deg, #66bb6a, #4caf50)',
            color: 'white',
            fontSize: '1.1rem',
            borderColor: '#2e7d32'
          }}
        >
          📥 ダウンロード
        </button>
      </div>

      {/* 共有リンク生成 */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: '24px', 
        borderColor: '#8bc34a', 
        marginBottom: '24px' 
      }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '18px', fontSize: '1.5rem' }}>🔗 共有リンク生成</h3>
        <p className="comic-text" style={{ color: '#c8e6c9', marginBottom: '16px', fontSize: '1rem' }}>
          データを含む共有リンクを生成して、他の人にあなたの森の秘密基地を共有できます
        </p>
        <button 
          onClick={generateShareLink}
          disabled={isGenerating}
          className="comic-button"
          style={{
            padding: '12px 24px',
            background: isGenerating ? '#666' : 'linear-gradient(45deg, #ff9800, #f57c00)',
            color: 'white',
            fontSize: '1.1rem',
            borderColor: isGenerating ? '#333' : '#e65100',
            marginBottom: '16px'
          }}
        >
          {isGenerating ? '🔄 生成中...' : '🔗 共有リンク生成'}
        </button>
        
        {shareUrl && (
          <div style={{ marginTop: '16px' }}>
            <p className="comic-text" style={{ color: '#fff3e0', marginBottom: '8px', fontSize: '1rem' }}>
              生成された共有リンク:
            </p>
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '12px', 
              borderRadius: '8px', 
              wordBreak: 'break-all',
              fontSize: '0.9rem',
              color: '#c8e6c9'
            }}>
              {shareUrl}
            </div>
          </div>
        )}
      </div>

      {/* データインポート */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: '24px', 
        borderColor: '#8bc34a' 
      }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '18px', fontSize: '1.5rem' }}>📤 データをインポート</h3>
        <p className="comic-text" style={{ color: '#c8e6c9', marginBottom: '16px', fontSize: '1rem' }}>
          JSONファイルからデータを復元できます（現在のデータは上書きされます）
        </p>
        <input 
          type="file" 
          accept=".json"
          onChange={importData}
          className="comic-input"
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderColor: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontSize: '1.1rem',
            marginBottom: '12px'
          }} 
        />
        <p className="comic-text" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
          💡 共有リンクを開くだけで自動的にデータがインポートされます
        </p>
      </div>
    </div>
  )
}

export default DataExport