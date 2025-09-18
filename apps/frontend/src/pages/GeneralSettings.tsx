import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

type AppSettings = {
  'dark-mode': boolean
  'auto-save': boolean
  'premium-theme': boolean
  'notification-sound': boolean
}

const GeneralSettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    'dark-mode': false,
    'auto-save': false,
    'premium-theme': false,
    'notification-sound': false
  })
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])

  // Load settings and purchases from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsedSettings }))
      } catch {
        // Keep default settings
      }
    }

    const savedPurchases = localStorage.getItem('momostore-purchases')
    if (savedPurchases) {
      try {
        setPurchasedItems(JSON.parse(savedPurchases))
      } catch {
        setPurchasedItems([])
      }
    }
  }, [])

  const updateSetting = (key: keyof AppSettings, value: boolean) => {
    if (!purchasedItems.includes(key)) {
      alert('この設定を利用するには売店で購入する必要があります！')
      return
    }

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('app-settings', JSON.stringify(newSettings))

    // Apply the setting immediately
    applySetting(key, value)
  }

  const applySetting = (key: string, value: boolean) => {
    switch (key) {
      case 'dark-mode':
        if (value) {
          document.body.classList.add('dark-mode')
        } else {
          document.body.classList.remove('dark-mode')
        }
        break
      case 'auto-save':
        if (value) {
          // Enable auto-save functionality
          // Auto-save logic would be implemented here
        }
        break
      case 'premium-theme':
        if (value) {
          document.body.classList.add('premium-theme')
        } else {
          document.body.classList.remove('premium-theme')
        }
        break
      case 'notification-sound':
        if (value) {
          // Enable notification sounds
          // Sound customization logic would be implemented here
        }
        break
    }
  }

  const getSettingInfo = (key: keyof AppSettings) => {
    const info = {
      'dark-mode': {
        name: 'ダークモード',
        description: '目に優しい暗いテーマに変更',
        icon: '🌙'
      },
      'auto-save': {
        name: '自動保存',
        description: 'データを定期的に自動バックアップ',
        icon: '💾'
      },
      'premium-theme': {
        name: 'プレミアムテーマ',
        description: 'エレガントなモノトーンテーマを適用',
        icon: '🎨'
      },
      'notification-sound': {
        name: '通知音',
        description: 'ゲーム効果音のカスタマイズ',
        icon: '🔊'
      }
    }
    return info[key]
  }

  const clearAllData = () => {
    if (confirm('全てのデータ（ゲーム進行、MOMOPay、設定等）を削除しますか？\nこの操作は取り消せません！')) {
      if (confirm('本当によろしいですか？全てのデータが失われます！')) {
        // Clear all localStorage data
        localStorage.clear()
        
        // Reset state
        setSettings({
          'dark-mode': false,
          'auto-save': false,
          'premium-theme': false,
          'notification-sound': false
        })
        setPurchasedItems([])
        
        // Remove applied classes
        document.body.classList.remove('dark-mode', 'premium-theme')
        
        alert('全てのデータを削除しました。ページを再読み込みします。')
        window.location.reload()
      }
    }
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
        ⚙️ 一般設定 ⚙️
      </div>
      
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1rem, 3vw, 1.2rem)', 
        marginBottom: 'min(36px, 8vw)', 
        color: '#c8e6c9'
      }}>
        購入した機能の設定を変更できます
      </div>

      {/* 設定項目 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 90vw), 1fr))', 
        gap: 'min(20px, 5vw)', 
        maxWidth: '800px', 
        margin: '0 auto min(40px, 10vw) auto',
        padding: '0 10px'
      }}>
        {(Object.keys(settings) as Array<keyof AppSettings>).map((key) => {
          const info = getSettingInfo(key)
          const isPurchased = purchasedItems.includes(key)
          const isEnabled = settings[key]
          
          return (
            <div key={key} className="comic-card" style={{
              background: isPurchased 
                ? (isEnabled 
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))'
                  : 'linear-gradient(135deg, rgba(66, 165, 245, 0.2), rgba(33, 150, 243, 0.1))')
                : 'linear-gradient(135deg, rgba(158, 158, 158, 0.2), rgba(117, 117, 117, 0.1))',
              padding: 'min(24px, 6vw)',
              borderColor: isPurchased ? (isEnabled ? '#4caf50' : '#2196f3') : '#666',
              opacity: isPurchased ? 1 : 0.6
            }}>
              <div style={{ fontSize: 'clamp(2.5rem, 6vw, 3rem)', marginBottom: '12px' }}>
                {info.icon}
              </div>
              <div className="comic-text" style={{ 
                fontSize: 'clamp(1.2rem, 4vw, 1.4rem)', 
                color: '#fff3e0',
                marginBottom: '8px'
              }}>
                {info.name}
              </div>
              <div className="comic-text" style={{ 
                fontSize: 'clamp(0.9rem, 3vw, 1rem)', 
                color: '#c8e6c9',
                marginBottom: '16px',
                lineHeight: '1.4'
              }}>
                {info.description}
              </div>
              
              {isPurchased ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <span className="comic-text" style={{ 
                    fontSize: 'clamp(1rem, 3vw, 1.1rem)',
                    color: isEnabled ? '#4caf50' : '#666'
                  }}>
                    {isEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button 
                    onClick={() => updateSetting(key, !isEnabled)}
                    className="comic-button"
                    style={{ 
                      padding: 'min(8px 16px, 2vw)', 
                      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                      background: isEnabled 
                        ? 'linear-gradient(45deg, #ff6b6b, #ff5252)' 
                        : 'linear-gradient(45deg, #4caf50, #45a049)',
                      color: 'white',
                      borderColor: isEnabled ? '#d32f2f' : '#2e7d32'
                    }}
                  >
                    {isEnabled ? '無効にする' : '有効にする'}
                  </button>
                </div>
              ) : (
                <div className="comic-text" style={{ 
                  color: '#ff6b6b', 
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                }}>
                  ⚠️ 売店で購入が必要です
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* データ管理セクション */}
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(233, 30, 99, 0.1))',
        padding: 'min(24px, 6vw)',
        borderColor: '#f44336',
        maxWidth: '500px',
        margin: '0 auto min(40px, 10vw) auto'
      }}>
        <div className="comic-text" style={{ 
          fontSize: 'clamp(1.3rem, 4vw, 1.5rem)', 
          color: '#fff3e0',
          marginBottom: '12px'
        }}>
          🗑️ データ管理
        </div>
        <div className="comic-text" style={{ 
          fontSize: 'clamp(0.9rem, 3vw, 1rem)', 
          color: '#c8e6c9',
          marginBottom: '16px',
          lineHeight: '1.4'
        }}>
          全てのゲームデータ、設定、購入履歴を削除します
        </div>
        
        <button 
          onClick={clearAllData}
          className="comic-button"
          style={{ 
            padding: 'min(12px 24px, 3vw)', 
            fontSize: 'clamp(1rem, 3vw, 1.1rem)',
            background: 'linear-gradient(45deg, #ff6b6b, #ff5252)',
            color: 'white',
            borderColor: '#d32f2f'
          }}
        >
          🗑️ 全データ削除
        </button>
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
        
        <Link to="/games/store" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: 'min(12px 24px, 3vw)',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            background: 'linear-gradient(45deg, #ffc107, #ffb300)',
            color: '#000',
            borderColor: '#f57f17'
          }}>
            🏪 売店
          </button>
        </Link>
      </div>
    </div>
  )
}

export default GeneralSettings