import React, { useState } from 'react'
import { useAppData } from '../contexts/AppDataContext'

const DataExport: React.FC = () => {
  const { favorites, tweets } = useAppData()
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false)



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
          💾 データ管理 💾
        </h2>
        <p className="comic-text" style={{ color: '#c8e6c9', fontSize: '1.3rem', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>
          あなたの森の秘密基地をバックアップ・復元しよう
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



      {/* JSONファイル形式でのエクスポート・インポート */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: '24px', 
        borderColor: '#8bc34a', 
        marginBottom: '24px' 
      }}>
        <h3 className="comic-text" style={{ color: '#fff3e0', marginBottom: '18px', fontSize: '1.5rem' }}>📄 データのバックアップ・復元</h3>
        <p className="comic-text" style={{ color: '#c8e6c9', marginBottom: '16px', fontSize: '1rem' }}>
          すべてのデータをJSONファイルとしてダウンロードして、他のデバイスや環境で復元できます
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
            💾 データをバックアップ
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
                ✅ バックアップファイルをダウンロードしました！
              </p>
            </div>
          )}
          
          {/* JSONインポート */}
          <div>
            <label className="comic-text" style={{ color: '#fff3e0', display: 'block', marginBottom: '8px', fontSize: '1rem' }}>
              📥 バックアップファイルから復元:
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
              💡 バックアップしたJSONファイルを選択してデータを復元できます
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

export default DataExport