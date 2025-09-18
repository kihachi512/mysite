import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'

const ShareSettings: React.FC = () => {
  const { favorites, tweets, momoPayPoints, highScores } = useAppData()
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false)

  // JSONファイルとしてエクスポート
  const exportAsJson = () => {
    try {
      // MOMOStoreの購入状況を取得
      const momoStorePurchases = localStorage.getItem('momostore-purchases')
      const parsedPurchases = momoStorePurchases ? JSON.parse(momoStorePurchases) : []
      
      // アプリ設定を取得
      const appSettings = localStorage.getItem('app-settings')
      const parsedSettings = appSettings ? JSON.parse(appSettings) : {}
      
      // 弾幕ゲームのインベントリも含める
      const bulletHellInventory = localStorage.getItem('bullet-hell-inventory')
      const parsedInventory = bulletHellInventory ? JSON.parse(bulletHellInventory) : { items: [] }
      
      const data = {
        favorites,
        tweets,
        momoPayPoints,
        highScores,
        momoStorePurchases: parsedPurchases,
        appSettings: parsedSettings,
        bulletHellInventory: parsedInventory,
        exportDate: new Date().toISOString(),
        version: '4.1'
      }
      
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // 年月日時分まで含むファイル名を生成
      const now = new Date()
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5) // 2025-01-18T15-30-45
      
      const a = document.createElement('a')
      a.href = url
      a.download = `momonga_carnival_data_${timestamp}.json`
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
          const momoPayPointsInfo = jsonData.momoPayPoints !== undefined ? `\n- MOMOPay: ${jsonData.momoPayPoints}` : ''
          const highScoresInfo = jsonData.highScores && jsonData.highScores.length > 0 ? `\n- ハイスコア: TOP${jsonData.highScores.length}` : ''
          const purchasesInfo = jsonData.momoStorePurchases && jsonData.momoStorePurchases.length > 0 ? `\n- MOMOStore購入: ${jsonData.momoStorePurchases.length}件` : ''
          const inventoryInfo = jsonData.bulletHellInventory && jsonData.bulletHellInventory.items && jsonData.bulletHellInventory.items.length > 0 ? `\n- ゲーム装備: ${jsonData.bulletHellInventory.items.length}件` : ''
          const confirmMessage = `インポートしようとしているデータ:\n- 宝物庫: ${jsonData.favorites.length}件\n- 大広間: ${jsonData.tweets.length}件${momoPayPointsInfo}${highScoresInfo}${purchasesInfo}${inventoryInfo}\n\n現在のデータは上書きされます。続行しますか？`
          
          if (confirm(confirmMessage)) {
            localStorage.setItem('favoriteUploads', JSON.stringify(jsonData.favorites))
            localStorage.setItem('tweets', JSON.stringify(jsonData.tweets))
            
            // MOMOPayがあればインポート
            if (jsonData.momoPayPoints !== undefined) {
              localStorage.setItem('momoPayPoints', jsonData.momoPayPoints.toString())
            }
            
            // ハイスコアがあればインポート
            if (jsonData.highScores && Array.isArray(jsonData.highScores)) {
              localStorage.setItem('bullet-hell-all-time-scores', JSON.stringify(jsonData.highScores))
            }
            
            // MOMOStore購入状況があればインポート
            if (jsonData.momoStorePurchases && Array.isArray(jsonData.momoStorePurchases)) {
              localStorage.setItem('momostore-purchases', JSON.stringify(jsonData.momoStorePurchases))
            }
            
            // アプリ設定があればインポート
            if (jsonData.appSettings && typeof jsonData.appSettings === 'object') {
              localStorage.setItem('app-settings', JSON.stringify(jsonData.appSettings))
            }
            
            // 弾幕ゲームのインベントリがあればインポート
            if (jsonData.bulletHellInventory && typeof jsonData.bulletHellInventory === 'object') {
              localStorage.setItem('bullet-hell-inventory', JSON.stringify(jsonData.bulletHellInventory))
            }
            
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
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', 
        marginBottom: 'min(24px, 6vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        📤 データ共有 📤
      </div>
      
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', 
        marginBottom: 'min(36px, 8vw)', 
        color: '#c8e6c9', 
        textShadow: '2px 2px 0px rgba(0,0,0,0.5)' 
      }}>
        あなたの秘密基地を他の人と共有しよう
      </div>

      {/* データ統計 */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: 'min(24px, 6vw)', 
        borderColor: '#8bc34a', 
        marginBottom: 'min(24px, 6vw)',
        maxWidth: '600px',
        margin: '0 auto min(24px, 6vw) auto'
      }}>
        <h3 className="comic-text" style={{ 
          color: '#fff3e0', 
          marginBottom: '16px', 
          fontSize: 'clamp(1.3rem, 4vw, 1.5rem)' 
        }}>
          📊 データ統計
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 25vw), 1fr))', 
          gap: 'min(16px, 4vw)' 
        }}>
          <div>
            <div className="comic-text" style={{ 
              color: '#c8e6c9', 
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
              marginBottom: '4px' 
            }}>📁</div>
            <div className="comic-text" style={{ 
              color: '#fff3e0', 
              fontSize: 'clamp(1rem, 3vw, 1.2rem)' 
            }}>宝物庫</div>
            <div className="comic-text" style={{ 
              color: '#c8e6c9', 
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' 
            }}>{favorites.length}件</div>
          </div>
          <div>
            <div className="comic-text" style={{ 
              color: '#c8e6c9', 
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
              marginBottom: '4px' 
            }}>🏠</div>
            <div className="comic-text" style={{ 
              color: '#fff3e0', 
              fontSize: 'clamp(1rem, 3vw, 1.2rem)' 
            }}>大広間</div>
            <div className="comic-text" style={{ 
              color: '#c8e6c9', 
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' 
            }}>{tweets.length}件</div>
          </div>
          <div>
            <div className="comic-text" style={{ 
              color: '#ffd93d', 
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
              marginBottom: '4px' 
            }}>💰</div>
            <div className="comic-text" style={{ 
              color: '#fff3e0', 
              fontSize: 'clamp(1rem, 3vw, 1.2rem)' 
            }}>MOMOPay</div>
            <div className="comic-text" style={{ 
              color: '#ffd93d', 
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' 
            }}>{momoPayPoints}</div>
          </div>
          <div>
            <div className="comic-text" style={{ 
              color: '#ff6b6b', 
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
              marginBottom: '4px' 
            }}>🏆</div>
            <div className="comic-text" style={{ 
              color: '#fff3e0', 
              fontSize: 'clamp(1rem, 3vw, 1.2rem)' 
            }}>ハイスコア</div>
            <div className="comic-text" style={{ 
              color: '#ff6b6b', 
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' 
            }}>
              {highScores.length > 0 ? `最高${highScores[0]}点` : '未記録'}
            </div>
          </div>
        </div>
      </div>

      {/* JSONファイル形式でのエクスポート・インポート */}
      <div className="comic-card" style={{ 
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', 
        padding: 'min(24px, 6vw)', 
        borderColor: '#8bc34a', 
        marginBottom: 'min(40px, 10vw)',
        maxWidth: '600px',
        margin: '0 auto min(40px, 10vw) auto'
      }}>
        <h3 className="comic-text" style={{ 
          color: '#fff3e0', 
          marginBottom: '18px', 
          fontSize: 'clamp(1.3rem, 4vw, 1.5rem)' 
        }}>
          📄 データのバックアップ・復元
        </h3>
        <p className="comic-text" style={{ 
          color: '#c8e6c9', 
          marginBottom: '16px', 
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          lineHeight: '1.4'
        }}>
          全てのデータ（宝物庫・大広間・MOMOPay・ハイスコア・購入設定・装備）をJSONファイルでバックアップ・復元できます
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* JSONエクスポート */}
          <button 
            onClick={exportAsJson}
            className="comic-button"
            style={{
              padding: 'min(12px 24px, 3vw)',
              background: 'linear-gradient(45deg, #2196f3, #1976d2)',
              color: 'white',
              fontSize: 'clamp(1rem, 3vw, 1.1rem)',
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
              <p className="comic-text" style={{ 
                color: '#fff', 
                fontSize: 'clamp(1rem, 3vw, 1.1rem)', 
                margin: 0 
              }}>
                ✅ JSONファイルをダウンロードしました！
              </p>
            </div>
          )}
          
          {/* JSONインポート */}
          <div>
            <label className="comic-text" style={{ 
              color: '#fff3e0', 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: 'clamp(0.9rem, 3vw, 1rem)' 
            }}>
              📤 JSONファイルからインポート:
            </label>
            <input 
              type="file" 
              accept=".json"
              onChange={importFromJson}
              className="comic-input"
              style={{ 
                width: '100%', 
                padding: 'min(12px, 3vw)', 
                borderColor: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
              }} 
            />
            <p className="comic-text" style={{ 
              color: 'rgba(255,255,255,0.7)', 
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
              marginTop: '8px',
              lineHeight: '1.4'
            }}>
              💡 エクスポートしたJSONファイルを選択してデータを復元できます
            </p>
          </div>
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ display: 'flex', gap: 'min(16px, 4vw)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: 'min(12px 24px, 3vw)',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            ⚙️ 設定に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default ShareSettings