import React, { useState } from 'react'
import { useAppData } from '../contexts/AppDataContext'

const DataExport: React.FC = () => {
  const { favorites, tweets } = useAppData()
  const [shareUrl, setShareUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false)


  // データを圧縮してリンクを短縮
  const compressData = (data: any): string => {
    // 必要な情報を保持してデータを圧縮
    const compactData = {
      f: data.favorites.map((fav: any) => ({
        id: fav.id,
        name: fav.name,
        kind: fav.kind,
        text: fav.text,
        dataUrl: fav.dataUrl,
        mime: fav.mime,
        createdAt: fav.createdAt
      })),
      t: data.tweets.map((tweet: any) => ({
        id: tweet.id,
        content: tweet.content,
        createdAt: tweet.createdAt,
        likes: tweet.likes,
        likedBy: tweet.likedBy,
        expiresAt: tweet.expiresAt
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
        favorites: (compactData.f || []).map((fav: any) => ({
          id: fav.id,
          name: fav.name,
          kind: fav.kind,
          text: fav.text,
          dataUrl: fav.dataUrl,
          mime: fav.mime,
          createdAt: fav.createdAt
        })),
        tweets: (compactData.t || []).map((tweet: any) => ({
          id: tweet.id,
          content: tweet.content,
          createdAt: tweet.createdAt,
          likes: tweet.likes || 0,
          likedBy: tweet.likedBy || [],
          expiresAt: tweet.expiresAt
        }))
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
    
    // 既にインポート済みかチェック（セッションストレージを使用）
    const importKey = `imported_${importDataParam}`
    const alreadyImported = sessionStorage.getItem(importKey)
    
    if (importDataParam && !alreadyImported) {
      try {
        let data
        
        if (isCompressed) {
          // 新しい圧縮形式
          data = decompressData(importDataParam)
        } else {
          // 旧形式（互換性のため）
          const oldData = JSON.parse(decodeURIComponent(escape(atob(importDataParam))))
          // 旧形式を新形式に変換
          data = {
            favorites: (oldData.favorites || []).map((fav: any) => ({
              id: fav.id,
              name: fav.name,
              kind: fav.kind || 'file',
              text: fav.text,
              dataUrl: fav.dataUrl,
              mime: fav.mime,
              createdAt: fav.createdAt || new Date().toISOString()
            })),
            tweets: (oldData.tweets || []).map((tweet: any) => ({
              id: tweet.id,
              content: tweet.content || tweet.text,
              createdAt: tweet.createdAt || tweet.timestamp,
              likes: tweet.likes || 0,
              likedBy: tweet.likedBy || [],
              expiresAt: tweet.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }))
          }
        }
        
        if (data && data.favorites && data.tweets) {
          localStorage.setItem('favoriteUploads', JSON.stringify(data.favorites))
          localStorage.setItem('tweets', JSON.stringify(data.tweets))
          
          // インポート済みフラグを設定
          sessionStorage.setItem(importKey, 'true')
          
          // URLパラメータをクリアしてから再読み込み
          const url = new URL(window.location.href)
          url.searchParams.delete('d')
          url.searchParams.delete('import')
          
          alert('共有されたデータをインポートしました！ページを再読み込みしてください。')
          window.location.href = url.toString()
        }
      } catch (error) {
        console.error('Failed to import shared data:', error)
      }
    }
  }, [])

  // JSONファイルとしてエクスポート
  const exportAsJson = () => {
    try {
      const data = {
        favorites,
        tweets,
        exportDate: new Date().toISOString(),
        version: '2.0'
      }
      
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `momonga_carnival_data_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      
      setJsonExportSuccess(true)
      setTimeout(() => setJsonExportSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to export JSON:', error)
      alert('JSONファイルのエクスポートに失敗しました')
    }
  }

  // JSONファイルからインポート
  const importFromJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)
        
        if (jsonData.favorites && jsonData.tweets) {
          // データの確認
          const confirmMessage = `インポートしようとしているデータ:\n- 宝物庫: ${jsonData.favorites.length}件\n- つぶやき: ${jsonData.tweets.length}件\n\n現在のデータは上書きされます。続行しますか？`
          
          if (confirm(confirmMessage)) {
            localStorage.setItem('favoriteUploads', JSON.stringify(jsonData.favorites))
            localStorage.setItem('tweets', JSON.stringify(jsonData.tweets))
            
            alert('JSONファイルからデータをインポートしました！ページを再読み込みしてください。')
            window.location.reload()
          }
        } else {
          alert('無効なJSONファイル形式です')
        }
      } catch (error) {
        console.error('Failed to import JSON:', error)
        alert('JSONファイルの読み込みに失敗しました')
      }
    }
    
    reader.readAsText(file)
    event.target.value = ''
  }

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

      {/* JSONファイル形式でのエクスポート・インポート */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: '24px', 
        borderColor: '#8bc34a', 
        marginBottom: '24px' 
      }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '18px', fontSize: '1.5rem' }}>📄 JSONファイル方式</h3>
        <p className="comic-text" style={{ color: '#c8e6c9', marginBottom: '16px', fontSize: '1rem' }}>
          より確実にファイルデータを含めてエクスポート・インポートできます
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* JSONエクスポート */}
          <button 
            onClick={exportAsJson}
            className="comic-button"
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #2196f3, #1976d2)',
              color: 'white',
              fontSize: '1.1rem',
              borderColor: '#0d47a1'
            }}
          >
            📥 JSONファイルでエクスポート
          </button>
          
          {jsonExportSuccess && (
            <div style={{ 
              padding: '12px',
              background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.8), rgba(139, 195, 74, 0.6))',
              borderRadius: '8px',
              textAlign: 'center',
              animation: 'fadeIn 0.3s ease-in'
            }}>
              <p className="comic-text" style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>
                ✅ JSONファイルをダウンロードしました！
              </p>
            </div>
          )}
          
          {/* JSONインポート */}
          <div>
            <label className="comic-text" style={{ color: '#fff3e0', display: 'block', marginBottom: '8px', fontSize: '1rem' }}>
              📤 JSONファイルからインポート:
            </label>
            <input 
              type="file" 
              accept=".json"
              onChange={importFromJson}
              className="comic-input"
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderColor: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '1rem'
              }} 
            />
            <p className="comic-text" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginTop: '8px' }}>
              💡 エクスポートしたJSONファイルを選択してデータを復元できます
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default DataExport