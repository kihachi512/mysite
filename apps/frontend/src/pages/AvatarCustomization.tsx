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

  const { momoPayPoints, spendMomoPayPoints } = useAppData()
  const [ownedItems, setOwnedItems] = useState<string[]>([])
  const [currentAvatar, setCurrentAvatar] = useState<AvatarState>({})
  const [selectedCategory, setSelectedCategory] = useState<'hat' | 'accessory' | 'outfit' | 'special' | 'background'>('hat')
  const [previewItem, setPreviewItem] = useState<string | null>(null)

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.GAMES)
  }, [])

  // Load avatar data
  useEffect(() => {
    loadAvatarData()
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
    } catch (error) {
      console.error('Failed to load avatar data:', error)
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

  const purchaseItem = (item: CostumeItem) => {
    if (ownedItems.includes(item.id)) {
      alert('すでに持っているアイテムです！')
      return
    }

    if (momoPayPoints < item.price) {
      alert(`MOMOPayが足りません！\n必要: ${item.price}P\n現在: ${momoPayPoints}P`)
      return
    }

    if (confirm(`${item.name}を${item.price}MOMOPayで購入しますか？\n\n${item.description}`)) {
      if (spendMomoPayPoints(item.price)) {
        const newOwned = [...ownedItems, item.id]
        setOwnedItems(newOwned)
        saveAvatarData(newOwned, currentAvatar)
        alert(`🎉 ${item.name}を購入しました！\n\n「装備する」ボタンで着用できます。`)
      }
    }
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

  const generateAvatarDisplay = (): string => {
    let display = '🐿️' // Base momonga
    
    if (currentAvatar.special) {
      const special = COSTUME_ITEMS.find(item => item.id === currentAvatar.special)
      if (special) display += special.preview
    }
    
    return display
  }

  const filteredItems = COSTUME_ITEMS.filter(item => item.category === selectedCategory)

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
          
          <div style={{ 
            fontSize: 'clamp(4rem, 12vw, 8rem)',
            marginBottom: '16px',
            position: 'relative'
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

        {/* Category Selector */}
        <div style={{ 
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
          ].map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 90vw), 1fr))', 
          gap: 'min(20px, 5vw)'
        }}>
          {filteredItems.map((item) => {
            const isOwned = ownedItems.includes(item.id)
            const isEquipped = currentAvatar[item.category] === item.id
            
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
                  color: '#ffc107',
                  marginBottom: '16px'
                }}>
                  💰 {item.price}MOMOPay
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
                  <button
                    onClick={() => purchaseItem(item)}
                    disabled={momoPayPoints < item.price}
                    className="comic-button font-button-sm"
                    style={{
                      background: momoPayPoints >= item.price
                        ? 'linear-gradient(45deg, #ffc107, #ffb300)'
                        : 'linear-gradient(45deg, #666, #555)',
                      color: momoPayPoints >= item.price ? '#000' : '#ccc',
                      borderColor: momoPayPoints >= item.price ? '#f57f17' : '#333',
                      width: '100%'
                    }}
                  >
                    購入する
                  </button>
                )}
              </div>
            )
          })}
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