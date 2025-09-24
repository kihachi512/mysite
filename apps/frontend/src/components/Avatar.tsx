import React, { useState, useEffect } from 'react'

type AvatarState = {
  hat?: string
  accessory?: string
  outfit?: string
  special?: string
  background?: string
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
  const [avatarState, setAvatarState] = useState<AvatarState>({})

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
        setAvatarState(JSON.parse(savedAvatar))
      }
    } catch (error) {
      console.error('Failed to load avatar state:', error)
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

    const backgroundStyle = showBackground && avatarState.background 
      ? getBackgroundStyle(avatarState.background)
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
        
        {/* Hat overlay */}
        {avatarState.hat && (
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${parseInt(sizeStyles.fontSize) * 0.6}rem`,
            zIndex: 3
          }}>
            {getHatEmoji(avatarState.hat)}
          </div>
        )}

        {/* Accessory overlay */}
        {avatarState.accessory && (
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: `${parseInt(sizeStyles.fontSize) * 0.5}rem`,
            zIndex: 3
          }}>
            {getAccessoryEmoji(avatarState.accessory)}
          </div>
        )}

        {/* Special effects overlay */}
        {avatarState.special && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: `${parseInt(sizeStyles.fontSize) * 0.4}rem`,
            zIndex: 4,
            animation: avatarState.special === 'sparkles' ? 'sparkle 2s infinite' : 'none'
          }}>
            {getSpecialEffectEmoji(avatarState.special)}
          </div>
        )}

        {/* Outfit indicator (small icon) */}
        {avatarState.outfit && (
          <div style={{
            position: 'absolute',
            bottom: '-5%',
            right: '-5%',
            fontSize: `${parseInt(sizeStyles.fontSize) * 0.3}rem`,
            zIndex: 3
          }}>
            {getOutfitEmoji(avatarState.outfit)}
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

  return getAvatarDisplay()
}

export default Avatar