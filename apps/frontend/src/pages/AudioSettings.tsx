import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'

const AudioSettings: React.FC = () => {
  useSEO(SEO_PRESETS.settings);
  
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(false)

  // 設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setSoundEffectsEnabled(settings['sound-effects'] || false)
      } catch (error) {
        console.error('Failed to load audio settings:', error)
      }
    }
  }, [])

  // 効果音設定を保存
  const handleSoundEffectsToggle = (enabled: boolean) => {
    setSoundEffectsEnabled(enabled)
    
    const savedSettings = localStorage.getItem('app-settings')
    const settings = savedSettings ? JSON.parse(savedSettings) : {}
    
    settings['sound-effects'] = enabled
    
    localStorage.setItem('app-settings', JSON.stringify(settings))
    
    // イベントを発火して他のコンポーネントに通知
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'app-settings',
      newValue: JSON.stringify(settings),
      storageArea: localStorage
    }))
    
    // デバッグ用ログを削除（本番環境では不要）
  }

  // テスト用効果音再生
  const playTestSound = () => {
    if (soundEffectsEnabled) {
      // Web Audio APIを使用してシンプルなテスト音を再生
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioContextClass()
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        oscillator.frequency.setValueAtTime(880, ctx.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        
        oscillator.start()
        oscillator.stop(ctx.currentTime + 0.3)
        
        setTimeout(() => ctx.close(), 500)
      } catch {
        // テストサウンド再生エラーはサイレント処理
        alert('効果音の再生に失敗しました。ブラウザがWeb Audio APIをサポートしていない可能性があります。')
      }
    } else {
      alert('効果音を有効にしてからテストしてください')
    }
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(24px, 6vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🔊 効果音設定 🎵
      </div>
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(36px, 8vw)', 
        color: '#c8e6c9', 
        textShadow: '2px 2px 0px rgba(0,0,0,0.5)' 
      }}>
        ゲーム内効果音の設定
      </div>
      
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '0 10px' 
      }}>
        {/* 効果音設定 */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(123, 31, 162, 0.2))',
          borderColor: '#9c27b0',
          padding: 'min(24px, 6vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '16px'
          }}>
            🎮 ゲーム効果音
          </div>
          
          <div className="comic-text font-body-md" style={{ 
            color: '#c8e6c9',
            marginBottom: '20px'
          }}>
            ゲーム内での効果音（SE）を再生するかどうかを設定します。
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => handleSoundEffectsToggle(true)}
              className="comic-button font-button-md"
              style={{
                background: soundEffectsEnabled 
                  ? 'linear-gradient(45deg, #4caf50, #45a049)' 
                  : 'linear-gradient(45deg, #666, #555)',
                color: 'white',
                borderColor: soundEffectsEnabled ? '#2e7d32' : '#333'
              }}
            >
              🔊 有効
            </button>
            
            <button
              onClick={() => handleSoundEffectsToggle(false)}
              className="comic-button font-button-md"
              style={{
                background: !soundEffectsEnabled 
                  ? 'linear-gradient(45deg, #f44336, #d32f2f)' 
                  : 'linear-gradient(45deg, #666, #555)',
                color: 'white',
                borderColor: !soundEffectsEnabled ? '#c62828' : '#333'
              }}
            >
              🔇 無効
            </button>
          </div>
          
          <div className="comic-text font-body-sm" style={{ 
            color: soundEffectsEnabled ? '#4caf50' : '#f44336',
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            効果音: {soundEffectsEnabled ? '有効' : '無効'}
          </div>
          
          <button
            onClick={playTestSound}
            className="comic-button font-button-sm"
            style={{
              background: 'linear-gradient(45deg, #ff9800, #f57c00)',
              color: 'white',
              borderColor: '#ef6c00'
            }}
          >
            🎵 テスト音再生
          </button>
        </div>

        {/* 注意事項 */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 111, 0, 0.1))',
          borderColor: '#ff9800',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '12px'
          }}>
            ℹ️ 注意事項
          </div>
          
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            textAlign: 'left',
            lineHeight: '1.6'
          }}>
            • 効果音はBulletHellゲームなどで使用されます<br/>
            • ブラウザによっては初回の音声再生時に許可が必要な場合があります<br/>
            • 音が出ない場合は、ブラウザの音量設定もご確認ください<br/>
            • BGM機能は廃止されました（効果音のみサポート）
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #2196f3, #1976d2)',
            color: 'white',
            borderColor: '#1565c0'
          }}>
            ⚙️ 設定に戻る
          </button>
        </Link>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🏠 ホームに戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default AudioSettings