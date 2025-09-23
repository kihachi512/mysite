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

  const getAvatarDisplay = (): React.ReactNode => {
    const baseStyle = {
      position: 'relative' as const,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      overflow: 'hidden',
      ...getSizeStyles(size),
      ...style
    }

    let avatarContent = '🐿️' // Base momonga

    // Add special effects
    if (avatarState.special) {
      const specialEffects: { [key: string]: string } = {
        'sparkles': '✨',
        'rainbow-trail': '🌈'
      }
      const effect = specialEffects[avatarState.special]
      if (effect) {
        avatarContent += effect
      }
    }

    // Add hat
    if (avatarState.hat) {
      const hats: { [key: string]: string } = {
        'santa-hat': '🎄',
        'crown': '👑',
        'chef-hat': '👨‍🍳',
        'wizard-hat': '🧙‍♂️'
      }
      const hat = hats[avatarState.hat]
      if (hat) {
        avatarContent = hat + avatarContent
      }
    }

    // Add accessories (overlay on face)
    if (avatarState.accessory) {
      const accessories: { [key: string]: string } = {
        'sunglasses': '😎',
        'monocle': '🧐',
        'heart-eyes': '😍'
      }
      const accessory = accessories[avatarState.accessory]
      if (accessory && avatarState.accessory !== 'sunglasses') {
        // Replace base face for some accessories
        avatarContent = avatarContent.replace('🐿️', accessory)
      }
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
        <span style={{ position: 'relative', zIndex: 2 }}>
          {avatarContent}
        </span>
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

  return getAvatarDisplay() as React.ReactElement
}

export default Avatar