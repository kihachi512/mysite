import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log to localStorage for debugging
    try {
      const errorLog = {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      }
      const existingLogs = JSON.parse(localStorage.getItem('error-logs') || '[]')
      existingLogs.push(errorLog)
      localStorage.setItem('error-logs', JSON.stringify(existingLogs.slice(-10))) // Keep last 10 errors
    } catch {
      // If localStorage fails, just log to console
      console.error('Failed to save error log to localStorage')
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          color: 'white', 
          textAlign: 'center', 
          padding: 'min(40px, 8vw) min(20px, 4vw)',
          background: 'linear-gradient(135deg, #2d5016 0%, #1a3d0a 30%, #0f2818 70%, #0a1f0f 100%)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div className="comic-card" style={{
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(233, 30, 99, 0.2))',
            borderColor: '#f44336',
            padding: 'min(32px, 8vw)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
              🐿️💨
            </div>
            <div className="comic-text font-title-lg" style={{ 
              color: '#fff3e0',
              marginBottom: '16px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              あれれ？何かがおかしいよ～
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              森の中で迷子になっちゃったみたい...<br />
              モモンガくんが一生懸命直してるから、<br />
              ちょっと待ってて！
            </div>
            <div className="comic-text font-body-sm" style={{ 
              color: '#ffcdd2',
              marginBottom: '24px',
              fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.3)',
              padding: '12px',
              borderRadius: '8px',
              wordBreak: 'break-word'
            }}>
              エラー詳細: {this.state.error?.message || 'Unknown error'}
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReset}
                className="comic-button font-button-md"
                style={{
                  background: 'linear-gradient(45deg, #4caf50, #45a049)',
                  color: 'white',
                  borderColor: '#2e7d32'
                }}
              >
                🔄 もう一度試す
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="comic-button font-button-md"
                style={{
                  background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                  color: 'white',
                  borderColor: '#e65100'
                }}
              >
                🏠 森の拠点に戻る
              </button>
            </div>
          </div>
          
          <div className="comic-text font-body-xs" style={{ 
            color: '#999',
            marginTop: '24px',
            maxWidth: '400px'
          }}>
            💡 問題が続く場合は、ブラウザのキャッシュをクリアするか、<br />
            設定→共有設定からデータをバックアップして<br />
            一般設定でデータをリセットしてみてください。
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary