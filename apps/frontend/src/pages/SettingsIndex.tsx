import React from 'react'
import { Link } from 'react-router-dom'

const SettingsIndex: React.FC = () => {
  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', 
        marginBottom: 'min(24px, 6vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        ⚙️ 設定 ⚙️
      </div>
      <div className="comic-text" style={{ 
        fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', 
        marginBottom: 'min(36px, 8vw)', 
        color: '#c8e6c9', 
        textShadow: '2px 2px 0px rgba(0,0,0,0.5)' 
      }}>
        設定とデータ管理
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 45vw), 1fr))', 
        gap: 'min(24px, 6vw)', 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '0 10px' 
      }}>
        <Link to="/settings/general" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.3), rgba(33, 150, 243, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#2196f3', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', marginBottom: '16px' }}>⚙️</div>
            <div className="comic-text" style={{ 
              fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              一般
            </div>
            <div className="comic-text" style={{ 
              fontSize: 'clamp(1rem, 3.5vw, 1.2rem)', 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              テーマ設定・機能管理・データ削除<br />
              <span style={{ color: '#ffd93d', fontSize: '0.9em' }}>購入済み機能の設定</span>
            </div>
          </div>
        </Link>

        <Link to="/settings/share" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#4caf50', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div style={{ fontSize: 'clamp(3rem, 8vw, 4rem)', marginBottom: '16px' }}>📤</div>
            <div className="comic-text" style={{ 
              fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              共有
            </div>
            <div className="comic-text" style={{ 
              fontSize: 'clamp(1rem, 3.5vw, 1.2rem)', 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              データのバックアップ・復元<br />
              <span style={{ color: '#ffd93d', fontSize: '0.9em' }}>JSONファイルで管理</span>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: 'min(40px, 10vw)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button" style={{
            padding: 'min(12px 24px, 3vw)',
            fontSize: 'clamp(1rem, 3vw, 1.2rem)',
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🏠 秘密基地に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default SettingsIndex