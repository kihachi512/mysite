import React, { useState, useEffect } from 'react'

type CostumeItem = {
  id: string
  name: string
  description: string
  icon: string
  category: 'hat' | 'accessory' | 'outfit' | 'special' | 'background'
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  preview: string
}

type CostumePosition = {
  id: string
  x: number
  y: number
  scale: number
  rotation: number
  zIndex: number
}

type AvatarState = {
  costumes: CostumePosition[]
}

type AvatarProps = {
  size?: 'small' | 'medium' | 'large'
  showBackground?: boolean
  className?: string
  style?: React.CSSProperties
}

const Avatar: React.FC<AvatarProps> = ({ 
  size = 'medium', 
  showBackground = false, 
  className = '',
  style = {}
}) => {
  const [avatarState, setAvatarState] = useState<AvatarState>({ costumes: [] })

  useEffect(() => {
    loadAvatarState()
    
    // localStorageの変更を監視
    const handleStorageChange = () => {
      loadAvatarState()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // カスタムイベントも監視（同一タブ内での変更用）
    window.addEventListener('avatar-updated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('avatar-updated', handleStorageChange)
    }
  }, [])

  const loadAvatarState = () => {
    try {
      const savedAvatar = localStorage.getItem('avatar-current')
      if (savedAvatar) {
        const parsed = JSON.parse(savedAvatar)
        // 新形式のデータを期待
        if (parsed.costumes && Array.isArray(parsed.costumes)) {
          setAvatarState(parsed)
        } else {
          // 古い形式から新形式への変換は省略（編集画面で変換済み）
          setAvatarState({ costumes: [] })
        }
      }
    } catch (error) {
      console.error('Failed to load avatar state:', error)
      setAvatarState({ costumes: [] })
    }
  }

  const getSizeStyles = (size: string) => {
    switch (size) {
      case 'small':
        return { fontSize: '1.5rem', width: '32px', height: '32px' }
      case 'large':
        return { fontSize: '4rem', width: '80px', height: '80px' }
      default: // medium
        return { fontSize: '2rem', width: '48px', height: '48px' }
    }
  }

  const getAvatarDisplay = () => {
    const sizeStyles = getSizeStyles(size)
    const baseStyle = {
      position: 'relative' as const,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      overflow: 'hidden',
      ...sizeStyles,
      ...style
    }

    // 背景用のコスチュームを取得
    const backgroundCostume = avatarState.costumes?.find(c => c.id.includes('-bg'))
    const backgroundStyle = showBackground && backgroundCostume 
      ? getBackgroundStyle(backgroundCostume.id)
      : {}

    return (
      <div 
        className={className}
        style={{
          ...baseStyle,
          ...backgroundStyle
        }}
        title="アバター（カスタマイズ画面で変更可能）"
      >
        {/* Base momonga image */}
        <img 
          src="/momonga-icon.png" 
          alt="モモンガアバター"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'relative',
            zIndex: 1
          }}
        />
        
        {/* Costume overlays */}
        {avatarState.costumes && avatarState.costumes
          .filter(costume => costume && costume.id)
          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .map((costume) => {
            const item = getCostumeItem(costume.id)
            if (!item) return null

            // 背景は別途処理されるのでスキップ
            if (item.category === 'background') return null

            return (
              <div 
                key={costume.id}
                style={{
                  position: 'absolute',
                  left: `${costume.x}%`,
                  top: `${costume.y}%`,
                  transform: `translate(-50%, -50%) scale(${costume.scale * 1.2}) rotate(${costume.rotation}deg)`,
                  fontSize: `${Math.max(1, parseInt(sizeStyles.fontSize) * 0.6)}rem`,
                  zIndex: costume.zIndex,
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              >
                {item.icon}
              </div>
            )
          })}
      </div>
    )
  }


  const getBackgroundStyle = (backgroundId: string): React.CSSProperties => {
    const backgrounds: { [key: string]: React.CSSProperties } = {
      'forest-bg': {
        background: 'linear-gradient(135deg, #2d5016, #1a3d0a)',
        boxShadow: '0 0 15px rgba(45, 80, 22, 0.5)'
      },
      'space-bg': {
        background: 'linear-gradient(135deg, #000428, #004e92)',
        boxShadow: '0 0 15px rgba(0, 4, 40, 0.5)'
      },
      'castle-bg': {
        background: 'linear-gradient(135deg, #8B4513, #DAA520)',
        boxShadow: '0 0 15px rgba(139, 69, 19, 0.5)'
      }
    }
    return backgrounds[backgroundId] || {}
  }

  // コスチュームアイテムデータの取得
  const getCostumeItem = (id: string): CostumeItem | null => {
    const COSTUME_ITEMS: CostumeItem[] = [
      // Hats
      { id: 'santa-hat', name: 'サンタ帽', description: '', icon: '🎄', category: 'hat', price: 150, rarity: 'common', preview: '🎄' },
      { id: 'crown', name: '王冠', description: '', icon: '👑', category: 'hat', price: 800, rarity: 'legendary', preview: '✨' },
      { id: 'chef-hat', name: 'シェフ帽', description: '', icon: '👨‍🍳', category: 'hat', price: 300, rarity: 'rare', preview: '🍽️' },
      { id: 'wizard-hat', name: '魔法使いの帽子', description: '', icon: '🎩', category: 'hat', price: 600, rarity: 'epic', preview: '⭐' },
      
      // Accessories
      { id: 'sunglasses', name: 'サングラス', description: '', icon: '🕶️', category: 'accessory', price: 200, rarity: 'common', preview: '😎' },
      { id: 'monocle', name: '片眼鏡', description: '', icon: '🥽', category: 'accessory', price: 400, rarity: 'rare', preview: '🎩' },
      { id: 'heart-eyes', name: 'ハートの瞳', description: '', icon: '💕', category: 'accessory', price: 250, rarity: 'common', preview: '💕' },
      
      // Outfits
      { id: 'tuxedo', name: 'タキシード', description: '', icon: '👔', category: 'outfit', price: 500, rarity: 'rare', preview: '✨' },
      { id: 'ninja-outfit', name: '忍者装束', description: '', icon: '🥋', category: 'outfit', price: 700, rarity: 'epic', preview: '⚡' },
      { id: 'superhero-cape', name: 'スーパーヒーローマント', description: '', icon: '🦸', category: 'outfit', price: 900, rarity: 'legendary', preview: '💫' },
      
      // Special Effects
      { id: 'sparkles', name: 'キラキラオーラ', description: '', icon: '✨', category: 'special', price: 1000, rarity: 'legendary', preview: '🌟' },
      { id: 'rainbow-trail', name: '虹の軌跡', description: '', icon: '🌈', category: 'special', price: 1200, rarity: 'legendary', preview: '🦄' },
      
      // Backgrounds
      { id: 'forest-bg', name: '森の背景', description: '', icon: '🌲', category: 'background', price: 300, rarity: 'common', preview: '🍃' },
      { id: 'space-bg', name: '宇宙背景', description: '', icon: '🌌', category: 'background', price: 600, rarity: 'rare', preview: '🚀' },
      { id: 'castle-bg', name: '城の背景', description: '', icon: '🏰', category: 'background', price: 1000, rarity: 'epic', preview: '👑' }
    ]
    
    return COSTUME_ITEMS.find(item => item.id === id) || null
  }

  return getAvatarDisplay()
}

export default Avatar