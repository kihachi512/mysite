import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'

type StoreItem = {
  id: string
  name: string
  description: string
  price: number
  type: 'setting' | 'feature'
  icon: string
  purchased?: boolean
}

// 売店のアイテム
const STORE_ITEMS: StoreItem[] = [
  {
    id: 'dark-mode',
    name: 'ダークモード設定',
    description: '目に優しい暗いテーマに変更できます',
    price: 500,
    type: 'setting',
    icon: '🌙'
  },
  {
    id: 'auto-save',
    name: '自動保存機能',
    description: 'データを自動でバックアップします',
    price: 300,
    type: 'feature',
    icon: '💾'
  },
  {
    id: 'premium-theme',
    name: 'プレミアムテーマ',
    description: '特別な色彩テーマを利用できます',
    price: 800,
    type: 'setting',
    icon: '🎨'
  },
  {
    id: 'notification-sound',
    name: '通知音設定',
    description: 'ゲームの効果音をカスタマイズできます',
    price: 200,
    type: 'setting',
    icon: '🔊'
  }
]

const MOMOStore: React.FC = () => {
  const { momoPayPoints, addMomoPayPoints } = useAppData()
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const [inventory, setInventory] = useState<any>({ items: [] })

  // Load purchased items from localStorage
  useEffect(() => {
    const savedPurchases = localStorage.getItem('momostore-purchases')
    if (savedPurchases) {
      try {
        setPurchasedItems(JSON.parse(savedPurchases))
      } catch {
        setPurchasedItems([])
      }
    }

    // Load inventory for equipment selling
    const savedInventory = localStorage.getItem('bullet-hell-inventory')
    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory))
      } catch {
        setInventory({ items: [] })
      }
    }
  }, [])

  // Save purchased items to localStorage
  const savePurchases = (items: string[]) => {
    localStorage.setItem('momostore-purchases', JSON.stringify(items))
  }

  const purchaseItem = (item: StoreItem) => {
    if (momoPayPoints < item.price) {
      alert('MOMOPayが不足しています！')
      return
    }

    if (purchasedItems.includes(item.id)) {
      alert('既に購入済みです！')
      return
    }

    if (confirm(`${item.name}を${item.price}MOMOPayで購入しますか？`)) {
      addMomoPayPoints(-item.price)
      const newPurchases = [...purchasedItems, item.id]
      setPurchasedItems(newPurchases)
      savePurchases(newPurchases)
      
      // Apply setting if it's a setting type
      if (item.type === 'setting') {
        applySettingPurchase(item.id)
      }
      
      alert(`${item.name}を購入しました！`)
    }
  }

  const applySettingPurchase = (itemId: string) => {
    // Store the purchased setting
    const settings = JSON.parse(localStorage.getItem('app-settings') || '{}')
    settings[itemId] = true
    localStorage.setItem('app-settings', JSON.stringify(settings))
  }

  const sellEquipment = (item: any, index: number) => {
    const sellPrice = getSellPrice(item.rarity)
    if (confirm(`${item.name}を${sellPrice}MOMOPayで売却しますか？\n（元の価値より格安での買取となります）`)) {
      // Remove item from inventory
      const newInventory = { ...inventory }
      newInventory.items.splice(index, 1)
      setInventory(newInventory)
      localStorage.setItem('bullet-hell-inventory', JSON.stringify(newInventory))
      
      // Add MOMOPay
      addMomoPayPoints(sellPrice)
      alert(`${item.name}を${sellPrice}MOMOPayで売却しました！`)
    }
  }

  const getSellPrice = (rarity: string): number => {
    switch (rarity) {
      case 'legendary': return 80
      case 'epic': return 40
      case 'rare': return 20
      case 'common': return 10
      default: return 5
    }
  }

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return '#ffd700'
      case 'epic': return '#9c27b0'
      case 'rare': return '#2196f3'
      case 'common': return '#9e9e9e'
      default: return '#9e9e9e'
    }
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🏪 売店 (MOMOStore) 🏪
      </div>
      
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1rem, 3vw, 1.2rem)', 
        marginBottom: 'min(24px, 6vw)', 
        color: '#ffd93d'
      }}>
        💰 現在のMOMOPay: {momoPayPoints}
      </div>

      {/* 設定・機能購入セクション */}
      <div style={{ marginBottom: 'min(40px, 10vw)' }}>
        <div className="comic-text" style={{ 
          fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', 
          marginBottom: 'min(20px, 5vw)', 
          color: '#fff3e0' 
        }}>
          ⚙️ 設定・機能
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 45vw), 1fr))', 
          gap: 'min(16px, 4vw)', 
          maxWidth: '1000px', 
          margin: '0 auto',
          padding: '0 10px'
        }}>
          {STORE_ITEMS.map((item) => {
            const isPurchased = purchasedItems.includes(item.id)
            const canAfford = momoPayPoints >= item.price
            
            return (
              <div key={item.id} className="comic-card" style={{
                background: isPurchased 
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))'
                  : 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.1))',
                padding: 'min(20px, 5vw)',
                borderColor: isPurchased ? '#4caf50' : (canAfford ? '#ffc107' : '#666'),
                opacity: isPurchased ? 0.7 : 1
              }}>
                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '12px' }}>
                  {item.icon}
                </div>
                <div className="comic-text" style={{ 
                  fontSize: 'clamp(1.1rem, 3.5vw, 1.3rem)', 
                  color: '#fff3e0',
                  marginBottom: '8px'
                }}>
                  {item.name}
                </div>
                <div className="comic-text" style={{ 
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', 
                  color: '#c8e6c9',
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}>
                  {item.description}
                </div>
                
                {isPurchased ? (
                  <div className="comic-text" style={{ 
                    color: '#4caf50', 
                    fontSize: 'clamp(1rem, 3vw, 1.1rem)',
                    fontWeight: 'bold'
                  }}>
                    ✅ 購入済み
                  </div>
                ) : (
                  <button 
                    onClick={() => purchaseItem(item)}
                    disabled={!canAfford}
                    className="comic-button"
                    style={{ 
                      padding: 'min(8px 16px, 2vw)', 
                      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                      background: canAfford 
                        ? 'linear-gradient(45deg, #ffc107, #ffb300)' 
                        : 'linear-gradient(45deg, #666, #555)',
                      color: canAfford ? '#000' : '#ccc',
                      borderColor: canAfford ? '#f57f17' : '#333',
                      width: '100%'
                    }}
                  >
                    💰 {item.price}MOMOPay
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 装備売却セクション */}
      <div style={{ marginBottom: 'min(40px, 10vw)' }}>
        <div className="comic-text" style={{ 
          fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', 
          marginBottom: 'min(20px, 5vw)', 
          color: '#fff3e0' 
        }}>
          ⚔️ 装備売却 (格安買取)
        </div>
        
        {inventory.items && inventory.items.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 45vw), 1fr))', 
            gap: 'min(12px, 3vw)', 
            maxWidth: '1000px', 
            margin: '0 auto',
            padding: '0 10px'
          }}>
            {inventory.items.map((item: any, index: number) => (
              <div key={`${item.id}-${index}`} className="comic-card" style={{
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(233, 30, 99, 0.1))',
                padding: 'min(16px, 4vw)',
                borderColor: getRarityColor(item.rarity)
              }}>
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: '8px' }}>
                  {item.icon}
                </div>
                <div className="comic-text" style={{ 
                  fontSize: 'clamp(1rem, 3vw, 1.2rem)', 
                  color: '#fff3e0',
                  marginBottom: '4px'
                }}>
                  {item.name}
                </div>
                <div className="comic-text" style={{ 
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                  color: getRarityColor(item.rarity),
                  marginBottom: '8px'
                }}>
                  {item.rarity.toUpperCase()}
                </div>
                <div className="comic-text" style={{ 
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', 
                  color: '#c8e6c9',
                  marginBottom: '12px'
                }}>
                  {item.description}
                </div>
                
                <button 
                  onClick={() => sellEquipment(item, index)}
                  className="comic-button"
                  style={{ 
                    padding: 'min(6px 12px, 2vw)', 
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                    background: 'linear-gradient(45deg, #ff6b6b, #ff5252)',
                    color: 'white',
                    borderColor: '#d32f2f',
                    width: '100%'
                  }}
                >
                  💰 {getSellPrice(item.rarity)}MOMOPayで売却
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="comic-text" style={{ 
            color: '#c8e6c9', 
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            padding: 'min(20px, 5vw)'
          }}>
            売却できる装備がありません。<br />
            演習林で装備を獲得してから来てください！
          </div>
        )}
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ display: 'flex', gap: 'min(16px, 4vw)', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: 'min(12px 24px, 3vw)',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🎮 遊技場に戻る
          </button>
        </Link>
        
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: 'min(12px 24px, 3vw)',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            background: 'linear-gradient(45deg, #42a5f5, #2196f3)',
            color: 'white',
            borderColor: '#1976d2'
          }}>
            ⚙️ 設定
          </button>
        </Link>
      </div>
    </div>
  )
}

export default MOMOStore