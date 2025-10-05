import React, { useState } from 'react'
import Toast from '../components/Toast'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type ToastMessage = {
  id: string
  message: string
  type: ToastType
  duration?: number
}

// Toast Context
// eslint-disable-next-line react-refresh/only-export-components
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

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}