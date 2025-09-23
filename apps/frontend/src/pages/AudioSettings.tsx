import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { audioManager, playSound, playBGM, stopBGM, initializeAudio, type SoundEffect, type BackgroundMusic } from '../utils/audio'

const AudioSettings: React.FC = () => {
  useSEO({
    title: '音声設定',
    description: 'BGMと効果音の設定を調整。音量調節、ミュート、効果音のテストができます。カーニバルをより楽しむためのオーディオ設定。',
    keywords: '音声設定,BGM,効果音,音量,ミュート,オーディオ設定,サウンド',
    ogTitle: '音声設定 | モモンガカーニバル',
    ogDescription: 'BGMと効果音の設定を調整してカーニバルをより楽しもう！'
  });

  const [isMuted, setIsMuted] = useState(audioManager.isMutedState)
  const [bgmVolume, setBgmVolumeState] = useState(audioManager.bgmVolumeLevel)
  const [sfxVolume, setSfxVolumeState] = useState(audioManager.sfxVolumeLevel)
  const [currentBgm, setCurrentBgm] = useState<BackgroundMusic | null>(audioManager.currentBackgroundMusic)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)

  // Initialize audio on first interaction
  const handleInitializeAudio = () => {
    initializeAudio()
    setIsAudioInitialized(true)
  }

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (!isAudioInitialized) {
      handleInitializeAudio()
    }
    
    const newMuted = !isMuted
    setIsMuted(newMuted)
    audioManager.setMuted(newMuted)
  }

  // Handle BGM volume change
  const handleBgmVolumeChange = (volume: number) => {
    if (!isAudioInitialized) {
      handleInitializeAudio()
    }
    
    setBgmVolumeState(volume)
    audioManager.setBgmVolume(volume)
  }

  // Handle SFX volume change
  const handleSfxVolumeChange = (volume: number) => {
    if (!isAudioInitialized) {
      handleInitializeAudio()
    }
    
    setSfxVolumeState(volume)
    audioManager.setSfxVolume(volume)
  }

  // Play test sound
  const handleTestSound = (effect: SoundEffect) => {
    if (!isAudioInitialized) {
      handleInitializeAudio()
    }
    playSound(effect)
  }

  // Change background music
  const handleBgmChange = (bgmType: BackgroundMusic | null) => {
    if (!isAudioInitialized) {
      handleInitializeAudio()
    }
    
    if (bgmType) {
      playBGM(bgmType)
    } else {
      stopBGM()
    }
    setCurrentBgm(bgmType)
  }

  // Update state when audio manager changes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsMuted(audioManager.isMutedState)
      setBgmVolumeState(audioManager.bgmVolumeLevel)
      setSfxVolumeState(audioManager.sfxVolumeLevel)
      setCurrentBgm(audioManager.currentBackgroundMusic)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const soundEffects: { name: string; effect: SoundEffect; description: string }[] = [
    { name: 'クリック', effect: 'click', description: 'ボタンクリック時' },
    { name: '成功', effect: 'success', description: 'ゲームクリア時' },
    { name: 'エラー', effect: 'error', description: 'エラー発生時' },
    { name: '通知', effect: 'notification', description: '新しい情報' },
    { name: 'コイン', effect: 'coin', description: 'MOMOPay獲得' },
    { name: 'パワーアップ', effect: 'powerup', description: '強化アイテム' },
    { name: '実績', effect: 'achievement', description: '実績解除時' }
  ]

  const backgroundMusics: { name: string; type: BackgroundMusic; description: string }[] = [
    { name: 'ホーム', type: 'home', description: '拠点・メインページ' },
    { name: 'ゲーム', type: 'games', description: '遊技場・ゲーム中' },
    { name: '平和', type: 'peaceful', description: 'リラックス時' },
    { name: '緊張', type: 'intense', description: 'バトル・集中時' },
    { name: '祝福', type: 'celebration', description: '成功・お祝い' },
    { name: 'メニュー', type: 'menu', description: '設定・メニュー画面' }
  ]

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🎵 音声設定 🔊
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(32px, 8vw)', 
        color: '#c8e6c9'
      }}>
        BGMと効果音をカスタマイズしよう
      </div>

      {!isAudioInitialized && (
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.1))',
          borderColor: '#ffc107',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)',
          maxWidth: '600px',
          margin: '0 auto min(24px, 6vw) auto'
        }}>
          <div className="comic-text font-body-md" style={{ 
            color: '#fff3e0',
            marginBottom: '12px'
          }}>
            音声機能を有効にする
          </div>
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            marginBottom: '16px'
          }}>
            ブラウザの制限により、最初のクリックで音声を有効化します
          </div>
          <button
            onClick={handleInitializeAudio}
            className="comic-button font-button-md"
            style={{
              background: 'linear-gradient(45deg, #4caf50, #45a049)',
              color: 'white',
              borderColor: '#2e7d32'
            }}
          >
            🔊 音声を有効にする
          </button>
        </div>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 10px' }}>
        {/* Master Controls */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))',
          borderColor: '#8bc34a',
          padding: 'min(24px, 6vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '16px'
          }}>
            全体設定
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={handleMuteToggle}
              className="comic-button font-button-md"
              style={{
                background: isMuted 
                  ? 'linear-gradient(45deg, #f44336, #d32f2f)' 
                  : 'linear-gradient(45deg, #4caf50, #45a049)',
                color: 'white',
                borderColor: isMuted ? '#b71c1c' : '#2e7d32'
              }}
            >
              {isMuted ? '🔇 ミュート中' : '🔊 音声ON'}
            </button>
            
            <div className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
              {isMuted ? '全ての音声がオフです' : '音声が有効です'}
            </div>
          </div>
        </div>

        {/* BGM Controls */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
          borderColor: '#9c27b0',
          padding: 'min(24px, 6vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '16px'
          }}>
            🎼 BGM設定
          </div>
          
          {/* BGM Volume */}
          <div style={{ marginBottom: '20px' }}>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9',
              marginBottom: '8px'
            }}>
              音量: {Math.round(bgmVolume * 100)}%
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={bgmVolume}
              onChange={(e) => handleBgmVolumeChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                maxWidth: '300px',
                accentColor: '#9c27b0'
              }}
              disabled={isMuted}
            />
          </div>

          {/* BGM Selection */}
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            marginBottom: '12px'
          }}>
            現在: {currentBgm ? backgroundMusics.find(bg => bg.type === currentBgm)?.name || 'なし' : 'なし'}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {backgroundMusics.map(bgm => (
              <button
                key={bgm.type}
                onClick={() => handleBgmChange(bgm.type)}
                className="comic-button font-button-xs"
                style={{
                  background: currentBgm === bgm.type
                    ? 'linear-gradient(45deg, #9c27b0, #7b1fa2)'
                    : 'linear-gradient(45deg, #666, #555)',
                  color: 'white',
                  borderColor: currentBgm === bgm.type ? '#4a148c' : '#333',
                  fontSize: '0.8rem'
                }}
                disabled={isMuted}
              >
                {bgm.name}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handleBgmChange(null)}
            className="comic-button font-button-sm"
            style={{
              background: 'linear-gradient(45deg, #666, #555)',
              color: 'white',
              borderColor: '#333'
            }}
            disabled={isMuted}
          >
            BGM停止
          </button>
        </div>

        {/* SFX Controls */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.1))',
          borderColor: '#ffc107',
          padding: 'min(24px, 6vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '16px'
          }}>
            🔊 効果音設定
          </div>
          
          {/* SFX Volume */}
          <div style={{ marginBottom: '20px' }}>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9',
              marginBottom: '8px'
            }}>
              音量: {Math.round(sfxVolume * 100)}%
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sfxVolume}
              onChange={(e) => handleSfxVolumeChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                maxWidth: '300px',
                accentColor: '#ffc107'
              }}
              disabled={isMuted}
            />
          </div>

          {/* Sound Effect Tests */}
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            marginBottom: '12px'
          }}>
            効果音テスト:
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '8px'
          }}>
            {soundEffects.map(sfx => (
              <button
                key={sfx.effect}
                onClick={() => handleTestSound(sfx.effect)}
                className="comic-button font-button-xs"
                style={{
                  background: 'linear-gradient(45deg, #ffc107, #ffb300)',
                  color: '#000',
                  borderColor: '#f57f17',
                  fontSize: '0.7rem',
                  padding: '8px 4px'
                }}
                disabled={isMuted}
                title={sfx.description}
              >
                {sfx.name}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.2), rgba(33, 150, 243, 0.1))',
          borderColor: '#2196f3',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            lineHeight: '1.6'
          }}>
            💡 ヒント:<br />
            • 音声はプログラムで生成されるシンプルな音です<br />
            • ブラウザによっては音声の初回再生時に許可が必要です<br />
            • 設定は自動的に保存されます<br />
            • 各ページで適した BGM が自動再生されます
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            ⚙️ 設定に戻る
          </button>
        </Link>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #666, #555)',
            color: 'white',
            borderColor: '#333'
          }}>
            🏠 拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default AudioSettings