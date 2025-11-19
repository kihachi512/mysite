import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'

const ShareSettings: React.FC = () => {
  const { favorites, tweets, momoPayPoints, highScores } = useAppData()
  const [jsonExportSuccess, setJsonExportSuccess] = useState(false)
  const [hasSharedFeature, setHasSharedFeature] = useState(false)

  // 共有機能の利用権をチェック
  useEffect(() => {
    const savedPurchases = localStorage.getItem('momostore-purchases')
    if (savedPurchases) {
      try {
        const purchases = JSON.parse(savedPurchases)
        setHasSharedFeature(purchases.includes('sharing-feature'))
      } catch {
        setHasSharedFeature(false)
      }
    }
  }, [])

  // JSONファイルとしてエクスポート
  const exportAsJson = () => {
    if (!hasSharedFeature) {
      alert('共有機能は売店で購入が必要です。')
      return
    }
    
    try {
      // 最新のデータをlocalStorageから直接取得（AppDataContextの状態と同期）
      const favoritesData = localStorage.getItem('favoriteUploads')
      const parsedFavorites = favoritesData ? JSON.parse(favoritesData) : []
      
      // MOMOStoreの購入状況を取得
      const momoStorePurchases = localStorage.getItem('momostore-purchases')
      const parsedPurchases = momoStorePurchases ? JSON.parse(momoStorePurchases) : []
      
      // アプリ設定を取得
      const appSettings = localStorage.getItem('app-settings')
      const parsedSettings = appSettings ? JSON.parse(appSettings) : {}
      
      // 弾幕ゲームのインベントリも含める
      const bulletHellInventory = localStorage.getItem('bullet-hell-inventory')
      const parsedInventory = bulletHellInventory ? JSON.parse(bulletHellInventory) : { items: [] }
      
      // MOMOPayとハイスコアも最新データを取得
      const momoPayData = localStorage.getItem('momoPayPoints')
      const parsedMomoPay = momoPayData ? parseInt(momoPayData, 10) : momoPayPoints
      
      const highScoresData = localStorage.getItem('bullet-hell-all-time-scores')
      const parsedHighScores = highScoresData ? JSON.parse(highScoresData) : highScores
      
      // 実績データを取得
      const achievementsData = localStorage.getItem('achievements')
      const parsedAchievements = achievementsData ? JSON.parse(achievementsData) : []
      
      const achievementStatsData = localStorage.getItem('achievement-stats')
      const parsedAchievementStats = achievementStatsData ? JSON.parse(achievementStatsData) : {
        gamesPlayed: 0,
        tweetsPosted: 0,
        omikujiCount: 0,
        purchasesMade: 0,
        areasVisited: []
      }
      
      
      const loginStreakData = localStorage.getItem('login-streak')
      const parsedLoginStreak = loginStreakData ? JSON.parse(loginStreakData) : {
        lastLoginDate: '',
        consecutiveDays: 0
      }
      
      
      // 銀行・アバターデータも含める
      const bankAccountData = localStorage.getItem('momo-bank-account')
      const parsedBankAccount = bankAccountData ? JSON.parse(bankAccountData) : null
      
      const bankInvestmentsData = localStorage.getItem('momo-bank-investments')
      const parsedBankInvestments = bankInvestmentsData ? JSON.parse(bankInvestmentsData) : []
      
      const bankLoansData = localStorage.getItem('momo-bank-loans')
      const parsedBankLoans = bankLoansData ? JSON.parse(bankLoansData) : []
      
      const avatarOwnedData = localStorage.getItem('avatar-owned-items')
      const parsedAvatarOwned = avatarOwnedData ? JSON.parse(avatarOwnedData) : []
      
      const avatarCurrentData = localStorage.getItem('avatar-current')
      const parsedAvatarCurrent = avatarCurrentData ? JSON.parse(avatarCurrentData) : {}
      
      const economyEventsData = localStorage.getItem('economy-events')
      const parsedEconomyEvents = economyEventsData ? JSON.parse(economyEventsData) : null
      
      const data = {
        favorites: parsedFavorites,
        // tweets は除外（1時間で自動削除されるため）
        momoPayPoints: parsedMomoPay,
        highScores: parsedHighScores,
        momoStorePurchases: parsedPurchases,
        appSettings: parsedSettings,
        bulletHellInventory: parsedInventory,
        achievements: parsedAchievements,
        achievementStats: parsedAchievementStats,
        loginStreak: parsedLoginStreak,
        bankAccount: parsedBankAccount,
        bankInvestments: parsedBankInvestments,
        bankLoans: parsedBankLoans,
        avatarOwned: parsedAvatarOwned,
        avatarCurrent: parsedAvatarCurrent,
        economyEvents: parsedEconomyEvents,
        exportDate: new Date().toISOString(),
        version: '6.0' // 経済システム・アバター対応でメジャーバージョンアップ
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
    if (!hasSharedFeature) {
      alert('共有機能は売店で購入が必要です。')
      return
    }
    
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string)
        
        if (jsonData.favorites) {
          // データの確認
          const momoPayPointsInfo = jsonData.momoPayPoints !== undefined ? `\n- MOMOPay: ${jsonData.momoPayPoints}` : ''
          const highScoresInfo = jsonData.highScores && jsonData.highScores.length > 0 ? `\n- ハイスコア: TOP${jsonData.highScores.length}` : ''
          const purchasesInfo = jsonData.momoStorePurchases && jsonData.momoStorePurchases.length > 0 ? `\n- MOMOStore購入: ${jsonData.momoStorePurchases.length}件` : ''
          const inventoryInfo = jsonData.bulletHellInventory && jsonData.bulletHellInventory.items && jsonData.bulletHellInventory.items.length > 0 ? `\n- ゲーム装備: ${jsonData.bulletHellInventory.items.length}件` : ''
          const confirmMessage = `インポートしようとしているデータ:\n- 宝物庫: ${jsonData.favorites.length}件${momoPayPointsInfo}${highScoresInfo}${purchasesInfo}${inventoryInfo}\n\n現在のデータは上書きされます。続行しますか？`
          
          if (confirm(confirmMessage)) {
            // データの検証とサニタイゼーション
            const validatedFavorites = Array.isArray(jsonData.favorites) ? 
              jsonData.favorites.slice(0, 100).filter((item: unknown) => 
                item && typeof item === 'object' && 
                typeof (item as Record<string, unknown>).id === 'string' && 
                typeof (item as Record<string, unknown>).name === 'string' &&
                ['text', 'file'].includes((item as Record<string, unknown>).kind as string)
              ) : []
            
            // 宝物庫データをインポート
            localStorage.setItem('favoriteUploads', JSON.stringify(validatedFavorites))
            
            // MOMOPayがあればインポート（範囲チェック付き）
            if (typeof jsonData.momoPayPoints === 'number' && 
                jsonData.momoPayPoints >= 0 && 
                jsonData.momoPayPoints <= 10000000) {
              localStorage.setItem('momoPayPoints', jsonData.momoPayPoints.toString())
            }
            
            // ハイスコアがあればインポート（検証付き）
            if (Array.isArray(jsonData.highScores)) {
              const validScores = jsonData.highScores
                .slice(0, 10)
                .filter((score: unknown) => typeof score === 'number' && score >= 0 && score <= 100000000)
                .sort((a: number, b: number) => b - a)
              localStorage.setItem('bullet-hell-all-time-scores', JSON.stringify(validScores))
            }
            
            // MOMOStore購入状況があればインポート（検証付き）
            if (Array.isArray(jsonData.momoStorePurchases)) {
              const validPurchases = jsonData.momoStorePurchases
                .slice(0, 50)
                .filter((item: unknown) => typeof item === 'string')
              localStorage.setItem('momostore-purchases', JSON.stringify(validPurchases))
            }
            
            // アプリ設定があればインポート（検証付き）
            if (jsonData.appSettings && typeof jsonData.appSettings === 'object') {
              // 危険な設定値をフィルタリング
              const safeSettings: Record<string, boolean> = {}
              const allowedKeys = ['dark-mode', 'sharing-feature', 'premium-theme', 'notification-sound']
              
              for (const [key, value] of Object.entries(jsonData.appSettings)) {
                if (allowedKeys.includes(key) && typeof value === 'boolean') {
                  safeSettings[key] = value
                }
              }
              
              localStorage.setItem('app-settings', JSON.stringify(safeSettings))
            }
            
            // 弾幕ゲームのインベントリがあればインポート（検証付き）
            if (jsonData.bulletHellInventory && 
                typeof jsonData.bulletHellInventory === 'object' &&
                Array.isArray(jsonData.bulletHellInventory.items)) {
              
              const validInventory = {
                items: jsonData.bulletHellInventory.items
                  .slice(0, 200) // 最大200アイテム
                  .filter((item: unknown) => 
                    item && typeof item === 'object' && 
                    typeof (item as Record<string, unknown>).id === 'string' &&
                    typeof (item as Record<string, unknown>).name === 'string'
                  ),
                equippedWeapon: jsonData.bulletHellInventory.equippedWeapon || undefined,
                equippedShield: jsonData.bulletHellInventory.equippedShield || undefined,
                equippedSpecial: jsonData.bulletHellInventory.equippedSpecial || undefined
              }
              
              localStorage.setItem('bullet-hell-inventory', JSON.stringify(validInventory))
            }
            
            // 実績データがあればインポート（検証付き）
            if (Array.isArray(jsonData.achievements)) {
              const validAchievements = jsonData.achievements
                .slice(0, 1000)
                .filter((achievement: unknown) => typeof achievement === 'string')
              localStorage.setItem('achievements', JSON.stringify(validAchievements))
            }
            
            // 実績統計があればインポート（検証付き）
            if (jsonData.achievementStats && typeof jsonData.achievementStats === 'object') {
              const validStats = {
                gamesPlayed: Math.max(0, Math.min(10000000, jsonData.achievementStats.gamesPlayed || 0)),
                tweetsPosted: Math.max(0, Math.min(10000000, jsonData.achievementStats.tweetsPosted || 0)),
                omikujiCount: Math.max(0, Math.min(10000000, jsonData.achievementStats.omikujiCount || 0)),
                purchasesMade: Math.max(0, Math.min(10000000, jsonData.achievementStats.purchasesMade || 0)),
                areasVisited: Array.isArray(jsonData.achievementStats.areasVisited) 
                  ? jsonData.achievementStats.areasVisited.slice(0, 100) 
                  : []
              }
              localStorage.setItem('achievement-stats', JSON.stringify(validStats))
            }
            
            
            // ログインストリークがあればインポート（検証付き）
            if (jsonData.loginStreak && typeof jsonData.loginStreak === 'object') {
              const validStreak = {
                lastLoginDate: typeof jsonData.loginStreak.lastLoginDate === 'string' 
                  ? jsonData.loginStreak.lastLoginDate 
                  : '',
                consecutiveDays: Math.max(0, Math.min(10000, jsonData.loginStreak.consecutiveDays || 0))
              }
              localStorage.setItem('login-streak', JSON.stringify(validStreak))
            }
            
            
            // 銀行データがあればインポート（検証付き）
            if (jsonData.bankAccount && typeof jsonData.bankAccount === 'object') {
              const validAccount = {
                balance: Math.max(0, Math.min(100000000, jsonData.bankAccount.balance || 0)),
                interestRate: Math.max(0, Math.min(10, jsonData.bankAccount.interestRate || 1)),
                lastUpdate: typeof jsonData.bankAccount.lastUpdate === 'string' 
                  ? jsonData.bankAccount.lastUpdate 
                  : new Date().toISOString().split('T')[0],
                accountType: ['basic', 'premium', 'vip'].includes(jsonData.bankAccount.accountType) 
                  ? jsonData.bankAccount.accountType 
                  : 'basic'
              }
              localStorage.setItem('momo-bank-account', JSON.stringify(validAccount))
            }
            
            if (Array.isArray(jsonData.bankInvestments)) {
              localStorage.setItem('momo-bank-investments', JSON.stringify(jsonData.bankInvestments.slice(0, 100)))
            }
            
            if (Array.isArray(jsonData.bankLoans)) {
              localStorage.setItem('momo-bank-loans', JSON.stringify(jsonData.bankLoans.slice(0, 50)))
            }
            
            // アバターデータがあればインポート（検証付き）
            if (Array.isArray(jsonData.avatarOwned)) {
              const validOwned = jsonData.avatarOwned
                .slice(0, 1000)
                .filter((item: unknown) => typeof item === 'string')
              localStorage.setItem('avatar-owned-items', JSON.stringify(validOwned))
            }
            
            if (jsonData.avatarCurrent && typeof jsonData.avatarCurrent === 'object') {
              localStorage.setItem('avatar-current', JSON.stringify(jsonData.avatarCurrent))
            }
            
            // 経済イベントデータがあればインポート
            if (jsonData.economyEvents && typeof jsonData.economyEvents === 'object') {
              localStorage.setItem('economy-events', JSON.stringify(jsonData.economyEvents))
            }
            
            alert('JSONファイルからデータをインポートしました！\n\n✅ 含まれるデータ:\n• 宝物庫（ファイル・テキスト）\n• MOMOPay・ハイスコア\n• 購入済み機能・設定\n• 装備インベントリ\n• 🏆 実績・統計データ\n• 📋 デイリーミッション・ログインストリーク\n• 🔊 音声設定\n• 🏦 銀行データ（預金・投資・融資）\n• 👗 アバター（衣装・設定）\n• 🎪 経済イベント\n\nページを再読み込みします。')
            window.location.reload()
          }
        } else {
          alert('無効なJSONファイル形式です。正しいエクスポートファイルを選択してください。')
        }
      } catch (error) {
        console.error('Failed to import JSON:', error)
        alert('JSONファイルの読み込みに失敗しました。ファイルが破損しているか、形式が正しくない可能性があります。')
      }
    }
    
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1.4rem, 4.5vw, 2.2rem)', 
        marginBottom: 'min(24px, 6vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        📤 データ共有 📤
      </div>
      
      <div className="comic-text" style={{ 
        fontSize: 'clamp(0.9rem, 3vw, 1.2rem)', 
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
          fontSize: 'clamp(1.1rem, 3.2vw, 1.3rem)' 
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
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' 
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
        background: hasSharedFeature 
          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))' 
          : 'linear-gradient(135deg, rgba(158, 158, 158, 0.2), rgba(117, 117, 117, 0.1))', 
        padding: 'min(24px, 6vw)', 
        borderColor: hasSharedFeature ? '#8bc34a' : '#666', 
        marginBottom: 'min(40px, 10vw)',
        maxWidth: '600px',
        margin: '0 auto min(40px, 10vw) auto',
        opacity: hasSharedFeature ? 1 : 0.7
      }}>
        <h3 className="comic-text" style={{ 
          color: '#fff3e0', 
          marginBottom: '18px', 
          fontSize: 'clamp(1.3rem, 4vw, 1.5rem)' 
        }}>
          📄 データのバックアップ・復元 {!hasSharedFeature && '🔒'}
        </h3>
        <p className="comic-text" style={{ 
          color: hasSharedFeature ? '#c8e6c9' : '#999', 
          marginBottom: '16px', 
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          lineHeight: '1.4'
        }}>
          {hasSharedFeature 
            ? '全データをJSONファイルでバックアップ・復元\n（宝物庫・MOMOPay・ハイスコア・購入設定・装備・🏆実績・📋ミッション・🔊音声設定・🏦銀行・👗アバター・🎪イベント）'
            : '共有機能は売店で購入が必要です。'
          }
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* JSONエクスポート */}
          <button 
            onClick={exportAsJson}
            disabled={!hasSharedFeature}
            className="comic-button"
            style={{
              padding: 'min(16px 32px, 4vw 8vw)',
              background: hasSharedFeature 
                ? 'linear-gradient(45deg, #2196f3, #1976d2)' 
                : 'linear-gradient(45deg, #666, #555)',
              color: hasSharedFeature ? 'white' : '#ccc',
              fontSize: 'clamp(1rem, 3vw, 1.1rem)',
              borderColor: hasSharedFeature ? '#0d47a1' : '#333',
              cursor: hasSharedFeature ? 'pointer' : 'not-allowed'
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
              disabled={!hasSharedFeature}
              className="comic-input"
              style={{ 
                width: '100%', 
                padding: 'min(12px, 3vw)', 
                borderColor: hasSharedFeature ? 'rgba(255,255,255,0.4)' : 'rgba(102,102,102,0.4)',
                background: hasSharedFeature ? 'rgba(255,255,255,0.05)' : 'rgba(102,102,102,0.05)',
                color: hasSharedFeature ? 'white' : '#ccc',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                cursor: hasSharedFeature ? 'pointer' : 'not-allowed'
              }} 
            />
            <p className="comic-text" style={{ 
              color: hasSharedFeature ? 'rgba(255,255,255,0.7)' : '#999', 
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
              marginTop: '8px',
              lineHeight: '1.4'
            }}>
              {hasSharedFeature 
                ? '💡 エクスポートしたJSONファイルを選択してデータを復元できます'
                : '🔒 共有機能は売店で購入が必要です'
              }
            </p>
            {!hasSharedFeature && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link to="/games/store" style={{ textDecoration: 'none' }}>
                  <button className="comic-button" style={{
                    padding: 'min(12px 24px, 3vw 6vw)',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    background: 'linear-gradient(45deg, #ffc107, #ffb300)',
                    color: '#000',
                    borderColor: '#f57f17'
                  }}>
                    🏪 MOMOStoreで購入する
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ display: 'flex', gap: 'min(16px, 4vw)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: 'min(16px 32px, 4vw 8vw)',
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