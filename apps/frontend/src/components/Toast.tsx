import React, { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type ToastMessage = {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      const duration = toast.duration || 3000
      const timer = setTimeout(() => {
        onRemove(toast.id)
      }, duration)

      return () => clearTimeout(timer)
    })
  }, [toasts, onRemove])

  const getToastStyle = (type: ToastType) => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideInRight 0.3s ease-out',
      minWidth: '300px',
      maxWidth: '500px'
    }

    switch (type) {
      case 'success':
        return { ...baseStyle, background: 'linear-gradient(135deg, #4caf50, #45a049)', color: 'white' }
      case 'error':
        return { ...baseStyle, background: 'linear-gradient(135deg, #f44336, #d32f2f)', color: 'white' }
      case 'warning':
        return { ...baseStyle, background: 'linear-gradient(135deg, #ff9800, #f57c00)', color: 'white' }
      case 'info':
        return { ...baseStyle, background: 'linear-gradient(135deg, #2196f3, #1976d2)', color: 'white' }
      default:
        return { ...baseStyle, background: 'linear-gradient(135deg, #666, #555)', color: 'white' }
    }
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return 'ℹ️'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={getToastStyle(toast.type)}
          onClick={() => onRemove(toast.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>{getIcon(toast.type)}</span>
            <span className="comic-text font-body-sm" style={{ flex: 1 }}>
              {toast.message}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(toast.id)
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '12px'
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Toast Context
export const ToastContext = React.createContext<{
  showToast: (message: string, type?: ToastType, duration?: number) => void
}>({
  showToast: () => {}
})

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString()
    const newToast: ToastMessage = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}