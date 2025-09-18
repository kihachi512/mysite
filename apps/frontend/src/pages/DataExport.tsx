import React, { useState } from 'react'
import { useAppData } from '../contexts/AppDataContext'

const DataExport: React.FC = () => {
  const { favorites, tweets } = useAppData()
  const [shareUrl, setShareUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)


  // データを圧縮してリンクを短縮
  const compressData = (data: any): string => {
    // 不要な情報を削除してデータサイズを削減
    const compactData = {
      f: data.favorites.map((fav: any) => ({
        id: fav.id,
        name: fav.name,
        url: fav.url,
        type: fav.type
      })),
      t: data.tweets.map((tweet: any) => ({
        id: tweet.id,
        text: tweet.text,
        timestamp: tweet.timestamp
      }))
    }
    
    // JSONを最小化（スペース削除）
    const jsonStr = JSON.stringify(compactData)
    
    // Base64エンコード
    return btoa(unescape(encodeURIComponent(jsonStr)))
  }

  // 共有リンクを生成
  const generateShareLink = async () => {
    setIsGenerating(true)
    
    try {
      const data = {
        favorites,
        tweets
      }
      
      // データを圧縮
      const encodedData = compressData(data)
      
      // 現在のサイトのURLにクエリパラメータとして追加
      const currentUrl = window.location.origin + window.location.pathname
      const shareUrl = `${currentUrl}?d=${encodedData}`
      
      setShareUrl(shareUrl)
      
      // クリップボードにコピー
      await navigator.clipboard.writeText(shareUrl)
      
      // 成功フィードバック
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000) // 3秒後に非表示
    } catch (error) {
      console.error('Failed to generate share link:', error)
      alert('共有リンクの生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }


  // データを展開
  const decompressData = (encodedData: string) => {
    try {
      const jsonStr = decodeURIComponent(escape(atob(encodedData)))
      const compactData = JSON.parse(jsonStr)
      
      // 圧縮されたデータを元の形式に戻す
      const data = {
        favorites: compactData.f || [],
        tweets: compactData.t || []
      }
      
      return data
    } catch (error) {
      console.error('Failed to decompress data:', error)
      return null
    }
  }

  // URLパラメータからデータを自動インポート
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    
    // 新しい圧縮形式（?d=）をチェック
    let importDataParam = urlParams.get('d')
    let isCompressed = true
    
    // 旧形式（?import=）もサポート
    if (!importDataParam) {
      importDataParam = urlParams.get('import')
      isCompressed = false
    }
    
    if (importDataParam) {
      try {
        let data
        
        if (isCompressed) {
          // 新しい圧縮形式
          data = decompressData(importDataParam)
        } else {
          // 旧形式
          data = JSON.parse(decodeURIComponent(escape(atob(importDataParam))))
        }
        
        if (data && data.favorites && data.tweets) {
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
        
        {copySuccess && (
          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.8), rgba(139, 195, 74, 0.6))',
            borderRadius: '8px',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            <p className="comic-text" style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>
              ✅ 共有リンクをクリップボードにコピーしました！
            </p>
          </div>
        )}
        
        {shareUrl && (
          <div style={{ marginTop: '16px' }}>
            <p className="comic-text" style={{ color: '#fff3e0', marginBottom: '8px', fontSize: '1rem' }}>
              生成された共有リンク（自動でコピー済み）:
            </p>
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '12px', 
              borderRadius: '8px', 
              wordBreak: 'break-all',
              fontSize: '0.9rem',
              color: '#c8e6c9',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              {shareUrl}
            </div>
            <p className="comic-text" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '8px' }}>
              💡 このリンクを他の人に送ると、あなたの森の秘密基地が自動で共有されます
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

export default DataExport