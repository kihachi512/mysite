import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO } from '../hooks/useSEO'
import { trackAreaVisited, AREAS } from '../utils/achievements'
import { getDiscountPrice, hasSpecialOffer, getActiveEvents } from '../utils/economyEvents'

type CostumeItem = {
  id: string
  name: string
  description: string
  icon: string
  category: 'hat' | 'accessory' | 'outfit' | 'special' | 'background'
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  preview: string // Emoji or text representation
  owned?: boolean
  isDuplicate?: boolean
  compensationAmount?: number
}

type AvatarState = {
  hat?: string
  accessory?: string
  outfit?: string
  special?: string
  background?: string
}

const COSTUME_ITEMS: CostumeItem[] = [
  // Hats
  {
    id: 'santa-hat',
    name: 'サンタ帽',
    description: 'クリスマスにぴったりの赤い帽子',
    icon: '🎅',
    category: 'hat',
    price: 150,
    rarity: 'common',
    preview: '🎄'
  },
  {
    id: 'crown',
    name: '王冠',
    description: 'モモンガ王の証！キラキラ光る黄金の冠',
    icon: '👑',
    category: 'hat',
    price: 800,
    rarity: 'legendary',
    preview: '✨'
  },
  {
    id: 'chef-hat',
    name: 'シェフ帽',
    description: 'どんぐり料理の専門家に変身',
    icon: '👨‍🍳',
    category: 'hat',
    price: 300,
    rarity: 'rare',
    preview: '🍽️'
  },
  {
    id: 'wizard-hat',
    name: '魔法使いの帽子',
    description: '不思議な力が宿っていそう',
    icon: '🧙‍♂️',
    category: 'hat',
    price: 600,
    rarity: 'epic',
    preview: '⭐'
  },

  // Accessories
  {
    id: 'sunglasses',
    name: 'サングラス',
    description: 'クールなモモンガに変身',
    icon: '🕶️',
    category: 'accessory',
    price: 200,
    rarity: 'common',
    preview: '😎'
  },
  {
    id: 'monocle',
    name: '片眼鏡',
    description: '知的な紳士モモンガスタイル',
    icon: '🧐',
    category: 'accessory',
    price: 400,
    rarity: 'rare',
    preview: '🎩'
  },
  {
    id: 'heart-eyes',
    name: 'ハートの瞳',
    description: '恋する乙女モモンガ',
    icon: '😍',
    category: 'accessory',
    price: 250,
    rarity: 'common',
    preview: '💕'
  },

  // Outfits
  {
    id: 'tuxedo',
    name: 'タキシード',
    description: 'フォーマルな装いで特別な日に',
    icon: '🤵',
    category: 'outfit',
    price: 500,
    rarity: 'rare',
    preview: '✨'
  },
  {
    id: 'ninja-outfit',
    name: '忍者装束',
    description: '影に隠れるモモンガ忍者',
    icon: '🥷',
    category: 'outfit',
    price: 700,
    rarity: 'epic',
    preview: '⚡'
  },
  {
    id: 'superhero-cape',
    name: 'スーパーヒーローマント',
    description: '正義の味方モモンガマン！',
    icon: '🦸',
    category: 'outfit',
    price: 900,
    rarity: 'legendary',
    preview: '💫'
  },

  // Special Effects
  {
    id: 'sparkles',
    name: 'キラキラオーラ',
    description: '全身がキラキラ光る特殊効果',
    icon: '✨',
    category: 'special',
    price: 1000,
    rarity: 'legendary',
    preview: '🌟'
  },
  {
    id: 'rainbow-trail',
    name: '虹の軌跡',
    description: '移動時に虹が現れる美しい効果',
    icon: '🌈',
    category: 'special',
    price: 1200,
    rarity: 'legendary',
    preview: '🦄'
  },

  // Backgrounds
  {
    id: 'forest-bg',
    name: '森の背景',
    description: 'モモンガの故郷、美しい森',
    icon: '🌲',
    category: 'background',
    price: 300,
    rarity: 'common',
    preview: '🍃'
  },
  {
    id: 'space-bg',
    name: '宇宙背景',
    description: '星空の中を飛び回るスペースモモンガ',
    icon: '🌌',
    category: 'background',
    price: 600,
    rarity: 'rare',
    preview: '🚀'
  },
  {
    id: 'castle-bg',
    name: '城の背景',
    description: '王様モモンガにふさわしい豪華な城',
    icon: '🏰',
    category: 'background',
    price: 1000,
    rarity: 'epic',
    preview: '👑'
  }
]

const AvatarCustomization: React.FC = () => {
  useSEO({
    title: 'アバターカスタマイズ',
    description: 'モモンガアイコンを自分好みにカスタマイズ！帽子、アクセサリー、衣装、特殊効果でオリジナルアバターを作成。MOMOPayでアイテムを購入しよう。',
    keywords: 'アバター,カスタマイズ,モモンガ,アイコン,コスチューム,帽子,アクセサリー,衣装,MOMOPay,着せ替え',
    ogTitle: 'アバターカスタマイズ | モモンガカーニバル',
    ogDescription: 'モモンガくんを自分好みにカスタマイズ！豊富な衣装でオリジナルアバターを作ろう。'
  });

  const { momoPayPoints, spendMomoPayPoints, addMomoPayPoints } = useAppData()
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [currentAvatar, setCurrentAvatar] = useState<AvatarState>({})
  const [selectedCategory, setSelectedCategory] = useState<'hat' | 'accessory' | 'outfit' | 'special' | 'background'>('hat')
  const [activeEvents] = useState(getActiveEvents())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.GAMES)
  }, [])

  // Load avatar data
  useEffect(() => {
    const initializeAvatar = async () => {
      try {
        setIsLoading(true)
        await loadAvatarData()
        setError(null)
      } catch (err) {
        setError('アバターデータの読み込みに失敗しました')
        console.error('Avatar initialization failed:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAvatar()
  }, [])

  const loadAvatarData = () => {
    try {
      const savedOwned = localStorage.getItem('avatar-owned-items')
      if (savedOwned) {
        setOwnedItems(JSON.parse(savedOwned))
      }

      const savedAvatar = localStorage.getItem('avatar-current')
      if (savedAvatar) {
        setCurrentAvatar(JSON.parse(savedAvatar))
      }
      
      // デバッグログ追加
      console.log('Avatar data loaded successfully', {
        ownedItems: savedOwned ? JSON.parse(savedOwned) : [],
        currentAvatar: savedAvatar ? JSON.parse(savedAvatar) : {}
      })
    } catch (error) {
      console.error('Failed to load avatar data:', error)
      // エラー時のフォールバック
      setOwnedItems([])
      setCurrentAvatar({})
    }
  }

  const saveAvatarData = (owned: string[], avatar: AvatarState) => {
    try {
      localStorage.setItem('avatar-owned-items', JSON.stringify(owned))
      localStorage.setItem('avatar-current', JSON.stringify(avatar))
    } catch (error) {
      console.error('Failed to save avatar data:', error)
    }
  }

  // ガチャシステムの状態
  const [showGacha, setShowGacha] = useState(false)
  const [gachaResult, setGachaResult] = useState<CostumeItem | null>(null)

  // レアリティ別排出率
  const GACHA_RATES = {
    legendary: 0.03,  // 3%
    epic: 0.12,       // 12% 
    rare: 0.25,       // 25%
    common: 0.60      // 60%
  }

  // ガチャを実行
  const performGacha = () => {
    const gachaCost = 500 // 500MOMOPay
    if (momoPayPoints < gachaCost) {
      alert('MOMOPayが不足しています！')
      return
    }

    // MOMOPay消費
    if (!spendMomoPayPoints(gachaCost)) return

    // レアリティ抽選
    const random = Math.random()
    let selectedRarity: CostumeItem['rarity'] = 'common'
    
    if (random < GACHA_RATES.legendary) {
      selectedRarity = 'legendary'
    } else if (random < GACHA_RATES.legendary + GACHA_RATES.epic) {
      selectedRarity = 'epic'
    } else if (random < GACHA_RATES.legendary + GACHA_RATES.epic + GACHA_RATES.rare) {
      selectedRarity = 'rare'
    } else {
      selectedRarity = 'common'
    }

    // 選択されたレアリティのアイテムから抽選
    const availableItems = COSTUME_ITEMS.filter(item => item.rarity === selectedRarity)
    const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)]

    if (!selectedItem) {
      console.error('No item selected from gacha')
      return
    }

    // 重複チェック
    const isDuplicate = ownedItems.includes(selectedItem.id)

    if (isDuplicate) {
      // 重複の場合はMOMOPayで返金
      const compensation = Math.floor(selectedItem.price * 0.3) // 30%返金
      addMomoPayPoints(compensation)
    } else {
      // 新規アイテムの場合はインベントリに追加
      const newOwned = [...ownedItems, selectedItem.id]
      setOwnedItems(newOwned)
      saveAvatarData(newOwned, currentAvatar)
    }

    setGachaResult({ ...selectedItem, isDuplicate, compensationAmount: isDuplicate ? Math.floor(selectedItem.price * 0.3) : undefined })
    setShowGacha(false)

    // ガチャ結果音（レアリティに応じて変化）
    setTimeout(() => {
      if (selectedItem.rarity === 'legendary') {
        // レジェンダリー音は鳴らないが、視覚的演出を重視
        console.log('Legendary item obtained!')
      } else if (selectedItem.rarity === 'epic') {
        console.log('Epic item obtained!')
      } else if (selectedItem.rarity === 'rare') {
        console.log('Rare item obtained!')
      } else {
        console.log('Common item obtained!')
      }
    }, 100)
  }

  const equipItem = (item: CostumeItem) => {
    if (!ownedItems.includes(item.id)) {
      alert('このアイテムは購入が必要です')
      return
    }

    const newAvatar = {
      ...currentAvatar,
      [item.category]: item.id
    }
    setCurrentAvatar(newAvatar)
    saveAvatarData(ownedItems, newAvatar)
    alert(`✨ ${item.name}を装備しました！`)
  }

  const unequipCategory = (category: string) => {
    const newAvatar = { ...currentAvatar }
    delete newAvatar[category as keyof AvatarState]
    setCurrentAvatar(newAvatar)
    saveAvatarData(ownedItems, newAvatar)
    alert(`${getCategoryName(category)}を外しました`)
  }

  const getCategoryName = (category: string): string => {
    const names = {
      'hat': '帽子',
      'accessory': 'アクセサリー',
      'outfit': '衣装',
      'special': '特殊効果',
      'background': '背景'
    }
    return names[category as keyof typeof names] || category
  }

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return '#ffd700'
      case 'epic': return '#9c27b0'
      case 'rare': return '#2196f3'
      case 'common': return '#4caf50'
      default: return '#666'
    }
  }

  const getEquippedItem = (category: string): CostumeItem | null => {
    const itemId = currentAvatar[category as keyof AvatarState]
    return itemId ? COSTUME_ITEMS.find(item => item.id === itemId) || null : null
  }

  const generateAvatarDisplay = () => {
    return (
      <div style={{ 
        position: 'relative', 
        display: 'inline-block',
        width: 'clamp(4rem, 12vw, 8rem)',
        height: 'clamp(4rem, 12vw, 8rem)'
      }}>
        {/* Base momonga image */}
        <img 
          src="/momonga-icon.png" 
          alt="モモンガアバター"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            position: 'relative',
            zIndex: 1
          }}
        />
        
        {/* Hat overlay */}
        {currentAvatar.hat && (
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            zIndex: 3
          }}>
            {getHatEmoji(currentAvatar.hat)}
          </div>
        )}

        {/* Accessory overlay */}
        {currentAvatar.accessory && (
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            zIndex: 3
          }}>
            {getAccessoryEmoji(currentAvatar.accessory)}
          </div>
        )}

        {/* Special effects overlay */}
        {currentAvatar.special && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            zIndex: 4,
            animation: currentAvatar.special === 'sparkles' ? 'sparkle 2s infinite' : 'none'
          }}>
            {getSpecialEffectEmoji(currentAvatar.special)}
          </div>
        )}

        {/* Outfit indicator */}
        {currentAvatar.outfit && (
          <div style={{
            position: 'absolute',
            bottom: '-5%',
            right: '-5%',
            fontSize: 'clamp(0.8rem, 2vw, 1.2rem)',
            zIndex: 3
          }}>
            {getOutfitEmoji(currentAvatar.outfit)}
          </div>
        )}
      </div>
    )
  }

  const getHatEmoji = (hatId: string): string => {
    const hats: { [key: string]: string } = {
      'santa-hat': '🎅',
      'crown': '👑',
      'chef-hat': '👨‍🍳',
      'wizard-hat': '🧙‍♂️'
    }
    return hats[hatId] || ''
  }

  const getAccessoryEmoji = (accessoryId: string): string => {
    const accessories: { [key: string]: string } = {
      'sunglasses': '🕶️',
      'monocle': '🧐',
      'heart-eyes': '💕'
    }
    return accessories[accessoryId] || ''
  }

  const getOutfitEmoji = (outfitId: string): string => {
    const outfits: { [key: string]: string } = {
      'tuxedo': '🤵',
      'ninja-outfit': '🥷',
      'superhero-cape': '🦸'
    }
    return outfits[outfitId] || ''
  }

  const getSpecialEffectEmoji = (specialId: string): string => {
    const effects: { [key: string]: string } = {
      'sparkles': '✨',
      'rainbow-trail': '🌈'
    }
    return effects[specialId] || ''
  }

  const filteredItems = COSTUME_ITEMS.filter(item => item.category === selectedCategory)

  // ローディング状態とエラー状態の処理
  if (isLoading) {
    return (
      <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
        <div className="comic-text font-title-lg" style={{ 
          marginBottom: 'min(24px, 6vw)', 
          color: '#fff3e0', 
          lineHeight: '1.2' 
        }}>
          📦 アバターデータを読み込み中...
        </div>
        <div className="loading-spinner" style={{ margin: '20px auto' }}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
        <div className="comic-text font-title-lg" style={{ 
          marginBottom: 'min(24px, 6vw)', 
          color: '#ff5722', 
          lineHeight: '1.2' 
        }}>
          ⚠️ エラーが発生しました
        </div>
        <div className="comic-text font-body-md" style={{ 
          marginBottom: 'min(24px, 6vw)', 
          color: '#c8e6c9'
        }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="comic-button font-button-md"
          style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}
        >
          🔄 ページを再読み込み
        </button>
      </div>
    )
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        👗 アバターカスタマイズ ✨
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(24px, 6vw)', 
        color: '#c8e6c9'
      }}>
        モモンガくんを着せ替えよう！
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 10px' }}>
        {/* アクティブな経済イベント */}
        {activeEvents.filter(event => event.effects.affectedItems?.includes('avatar-items')).map(event => (
          <div key={event.id} className="comic-card animate-glow" style={{
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))',
            borderColor: '#4caf50',
            padding: 'min(16px, 4vw)',
            marginBottom: 'min(24px, 6vw)'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{event.icon}</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '8px'
            }}>
              {event.title}
            </div>
            <div className="comic-text font-body-sm" style={{ 
              color: '#c8e6c9'
            }}>
              {event.description}
            </div>
          </div>
        ))}

        {/* Current Avatar Display */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))',
          borderColor: '#ffc107',
          padding: 'min(24px, 6vw)',
          marginBottom: 'min(24px, 6vw)'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '16px'
          }}>
            現在のアバター
          </div>
          
          <div className="avatar-current-display" style={{ 
            marginBottom: '16px',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {generateAvatarDisplay()}
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
            gap: 'min(12px, 3vw)' 
          }}>
            {['hat', 'accessory', 'outfit', 'special', 'background'].map(category => {
              const equipped = getEquippedItem(category)
              return (
                <div key={category} className="comic-text font-body-xs" style={{ color: '#c8e6c9' }}>
                  {getCategoryName(category)}<br />
                  {equipped ? (
                    <span>
                      {equipped.icon} {equipped.name}
                      <button
                        onClick={() => unequipCategory(category)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #666',
                          color: '#ccc',
                          borderRadius: '12px',
                          padding: '2px 6px',
                          fontSize: '0.7rem',
                          marginLeft: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        外す
                      </button>
                    </span>
                  ) : (
                    <span style={{ opacity: 0.6 }}>なし</span>
                  )}
                </div>
              )
            })}
          </div>
          
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            marginTop: '12px'
          }}>
            💰 所持MOMOPay: {momoPayPoints} | 所持アイテム: {ownedItems.length}個
          </div>
        </div>

        {/* ガチャボタン */}
        <div className="comic-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))',
          borderColor: '#ffc107',
          padding: 'min(20px, 5vw)',
          marginBottom: 'min(24px, 6vw)',
          maxWidth: '500px',
          margin: '0 auto min(24px, 6vw) auto'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '12px'
          }}>
            🎰 コスチュームガチャ
          </div>
          
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            marginBottom: '16px',
            lineHeight: '1.6'
          }}>
            🏆 レジェンド: 3% | ⚡ エピック: 12%<br/>
            🌟 レア: 25% | 🌿 コモン: 60%<br/>
            重複時は30%分のMOMOPayで返金！
          </div>

          <button
            onClick={() => setShowGacha(true)}
            className="comic-button font-button-lg"
            style={{
              background: momoPayPoints >= 500 
                ? 'linear-gradient(45deg, #ffc107, #ffb300)'
                : 'linear-gradient(45deg, #666, #555)',
              color: momoPayPoints >= 500 ? '#000' : '#ccc',
              borderColor: momoPayPoints >= 500 ? '#f57f17' : '#333',
              fontSize: 'clamp(1rem, 3vw, 1.3rem)',
              padding: 'min(12px 24px, 3vw 6vw, 16px 32px)'
            }}
            disabled={momoPayPoints < 500}
          >
            🎰 ガチャを引く (500P)
          </button>
        </div>

        {/* Category Selector */}
        <div className="costume-categories" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 'min(12px, 3vw)', 
          marginBottom: 'min(24px, 6vw)',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'hat', label: '👒 帽子' },
            { id: 'accessory', label: '🕶️ アクセ' },
            { id: 'outfit', label: '👔 衣装' },
            { id: 'special', label: '✨ 特殊' },
            { id: 'background', label: '🖼️ 背景' }
            ].map((category: { id: string; label: string }) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as 'hat' | 'accessory' | 'outfit' | 'special' | 'background')}
              className="comic-button font-button-sm"
              style={{
                background: selectedCategory === category.id 
                  ? 'linear-gradient(45deg, #9c27b0, #7b1fa2)' 
                  : 'linear-gradient(45deg, #666, #555)',
                color: 'white',
                borderColor: selectedCategory === category.id ? '#4a148c' : '#333'
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="costume-items-grid stagger-children" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 90vw), 1fr))', 
          gap: 'min(20px, 5vw)'
        }}>
          {filteredItems.map((item) => {
            const isOwned = ownedItems.includes(item.id)
            const isEquipped = currentAvatar[item.category] === item.id
            
            // 価格計算（経済イベント適用）
            const originalPrice = item.price
            const discountedPrice = getDiscountPrice(originalPrice, 'avatar-items')
            const specialOffer = hasSpecialOffer(item.id)
            const finalPrice = specialOffer ? specialOffer.sale : discountedPrice
            const isOnSale = finalPrice < originalPrice
            
            return (
              <div key={item.id} className="comic-card" style={{
                background: isEquipped 
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))'
                  : isOwned
                  ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(30, 136, 229, 0.1))'
                  : 'linear-gradient(135deg, rgba(66, 66, 66, 0.3), rgba(97, 97, 97, 0.2))',
                padding: 'min(20px, 5vw)',
                borderColor: isEquipped ? '#4caf50' : getRarityColor(item.rarity),
                position: 'relative'
              }}>
                {/* Rarity badge */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: getRarityColor(item.rarity),
                  color: item.rarity === 'common' ? '#000' : '#fff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  {item.rarity.toUpperCase()}
                </div>

                <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '12px' }}>
                  {item.icon}
                </div>
                
                <div className="comic-text font-title-sm" style={{ 
                  color: '#fff3e0',
                  marginBottom: '8px'
                }}>
                  {item.name}
                </div>
                
                <div className="comic-text font-body-sm" style={{ 
                  color: '#c8e6c9',
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}>
                  {item.description}
                </div>

                <div className="comic-text font-body-sm" style={{
                  color: isOnSale ? '#4caf50' : '#ffc107',
                  marginBottom: '16px'
                }}>
                  {isOnSale ? (
                    <span>
                      💰 <span style={{ textDecoration: 'line-through', color: '#999' }}>{originalPrice}P</span>{' '}
                      <span style={{ fontWeight: 'bold' }}>{finalPrice}P</span>
                      <span style={{ color: '#ff5722', fontSize: '0.8em' }}> SALE!</span>
                    </span>
                  ) : (
                    `💰 ${finalPrice}MOMOPay`
                  )}
                </div>

                {isEquipped ? (
                  <div className="comic-text font-body-sm" style={{
                    color: '#4caf50',
                    fontWeight: 'bold'
                  }}>
                    ✅ 装備中
                  </div>
                ) : isOwned ? (
                  <button
                    onClick={() => equipItem(item)}
                    className="comic-button font-button-sm"
                    style={{
                      background: 'linear-gradient(45deg, #4caf50, #45a049)',
                      color: 'white',
                      borderColor: '#2e7d32',
                      width: '100%'
                    }}
                  >
                    装備する
                  </button>
                ) : (
                  <div className="comic-text font-body-sm" style={{
                    color: '#999',
                    fontStyle: 'italic'
                  }}>
                    🎰 ガチャで入手可能
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ガチャモーダル */}
      {showGacha && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 'min(8px, 2vw)'
        }}>
          <div className="comic-card" style={{
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.9), rgba(255, 152, 0, 0.8))',
            padding: 'clamp(20px, 4vw, 32px)', borderColor: '#ffc107', 
            maxWidth: 'min(450px, 98vw)', width: '100%',
            textAlign: 'center',
            margin: 'auto'
          }}>
            <div className="comic-text font-title-md" style={{ 
              color: '#fff3e0', 
              marginBottom: '16px' 
            }}>
              🎰 コスチュームガチャ 👗
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#000',
              marginBottom: '16px' 
            }}>
              💰 現在のMOMOPay: {momoPayPoints}
            </div>
            <div className="comic-text font-body-sm" style={{ 
              color: '#333', 
              marginBottom: '24px', 
              lineHeight: '1.4'
            }}>
              🏆 レジェンド: 3%<br/>
              ⚡ エピック: 12% | 🌟 レア: 25%<br/>
              🌿 コモン: 60%
            </div>
            
            <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 12px)', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={performGacha} 
                disabled={momoPayPoints < 500}
                className="comic-button font-button-md"
                style={{ 
                  background: momoPayPoints < 500 ? '#666' : 'linear-gradient(45deg, #4caf50, #45a049)', 
                  color: 'white',
                  borderColor: momoPayPoints < 500 ? '#333' : '#2e7d32',
                  minWidth: 'clamp(140px, 35vw, 200px)',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                  padding: 'clamp(10px 16px, 2.5vw 4vw, 12px 20px)'
                }}
              >
                🎰 ガチャを引く (500P)
              </button>
            </div>
            
            <button 
              onClick={() => setShowGacha(false)} 
              className="comic-button font-button-sm"
              style={{ 
                background: 'linear-gradient(45deg, #666, #555)', 
                color: 'white', 
                borderColor: '#333'
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* ガチャ結果表示 */}
      {gachaResult && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001, animation: 'fadeIn 0.3s ease-in-out'
        }}>
          <div style={{
            animation: 'bounce 0.5s ease-in-out'
          }}>
            <div className="comic-card" style={{
              background: gachaResult.rarity === 'legendary' ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 193, 7, 0.9))' :
                        gachaResult.rarity === 'epic' ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.95), rgba(142, 36, 170, 0.9))' :
                        gachaResult.rarity === 'rare' ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.95), rgba(30, 136, 229, 0.9))' :
                        'linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(139, 195, 74, 0.9))',
              padding: 'clamp(20px, 5vw, 32px)', textAlign: 'center', 
              minWidth: 'clamp(280px, 70vw, 350px)', maxWidth: 'min(400px, 95vw)',
              borderColor: gachaResult.rarity === 'legendary' ? '#ffd700' :
                          gachaResult.rarity === 'epic' ? '#9c27b0' :
                          gachaResult.rarity === 'rare' ? '#2196f3' : '#4caf50',
              borderWidth: '4px',
              boxShadow: gachaResult.rarity === 'legendary' ? '0 0 30px rgba(255, 215, 0, 0.6), 0 10px 30px rgba(0,0,0,0.5)' :
                        gachaResult.rarity === 'epic' ? '0 0 30px rgba(156, 39, 176, 0.6), 0 10px 30px rgba(0,0,0,0.5)' :
                        gachaResult.rarity === 'rare' ? '0 0 30px rgba(33, 150, 243, 0.6), 0 10px 30px rgba(0,0,0,0.5)' :
                        '0 0 20px rgba(76, 175, 80, 0.6), 0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ 
                fontSize: 'clamp(3rem, 8vw, 5rem)', 
                marginBottom: '12px',
                filter: gachaResult.rarity === 'legendary' ? 'drop-shadow(0 0 10px gold)' : 
                       gachaResult.rarity === 'epic' ? 'drop-shadow(0 0 8px purple)' :
                       gachaResult.rarity === 'rare' ? 'drop-shadow(0 0 6px blue)' : 'none'
              }}>
                {gachaResult.icon}
              </div>
              
              <div className="comic-text font-title-md" style={{ 
                color: gachaResult.rarity === 'legendary' ? '#000' : '#fff', 
                marginBottom: '8px',
                textShadow: gachaResult.rarity === 'legendary' ? 'none' : '2px 2px 4px rgba(0,0,0,0.7)'
              }}>
                {gachaResult.isDuplicate ? '重複！' : '新アイテム！'}
              </div>
              
              <div className="comic-text font-title-sm" style={{ 
                color: gachaResult.rarity === 'legendary' ? '#000' : '#fff',
                marginBottom: '8px' 
              }}>
                {gachaResult.name}
              </div>
              
              <div className="comic-text font-body-sm" style={{ 
                color: gachaResult.rarity === 'legendary' ? '#333' : '#f0f0f0',
                marginBottom: '12px' 
              }}>
                {gachaResult.description}
              </div>
              
              <div style={{
                background: gachaResult.rarity === 'legendary' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                padding: '8px 12px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div className="comic-text font-body-sm" style={{
                  color: gachaResult.rarity === 'legendary' ? '#000' : '#fff',
                  fontWeight: 'bold'
                }}>
                  {gachaResult.rarity === 'legendary' ? '🏆 LEGENDARY' :
                   gachaResult.rarity === 'epic' ? '⚡ EPIC' :
                   gachaResult.rarity === 'rare' ? '🌟 RARE' : '🌿 COMMON'}
                </div>
                {gachaResult.isDuplicate && gachaResult.compensationAmount && (
                  <div className="comic-text font-body-sm" style={{
                    color: gachaResult.rarity === 'legendary' ? '#000' : '#ffd93d',
                    marginTop: '4px'
                  }}>
                    💰 +{gachaResult.compensationAmount}P 返金
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setGachaResult(null)} 
                className="comic-button font-button-md"
                style={{
                  background: gachaResult.rarity === 'legendary' ? 'linear-gradient(45deg, #000, #333)' : 'linear-gradient(45deg, #fff, #ddd)',
                  color: gachaResult.rarity === 'legendary' ? '#fff' : '#000',
                  borderColor: gachaResult.rarity === 'legendary' ? '#000' : '#ccc',
                  width: '100%'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/momo-bank" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #ffc107, #ffb300)',
            color: '#000',
            borderColor: '#f57f17'
          }}>
            🏦 銀行でMOMOPay稼ぐ
          </button>
        </Link>
        
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🏠 拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default AvatarCustomization