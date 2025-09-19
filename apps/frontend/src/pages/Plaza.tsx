import React from 'react'
import { Link } from 'react-router-dom'

const Plaza: React.FC = () => {
  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🏛️ 広場 🏛️
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(32px, 8vw)', 
        color: '#c8e6c9'
      }}>
        みんなが集まる憩いの場所
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 45vw), 1fr))', 
        gap: 'min(20px, 5vw)', 
        maxWidth: '600px', 
        margin: '0 auto',
        padding: '0 10px'
      }}>
        {/* 大広間への入り口 */}
        <Link to="/plaza/hall" style={{ textDecoration: 'none' }}>
          <div className="comic-card" style={{
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))',
            padding: 'min(24px, 6vw)',
            borderColor: '#8bc34a',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>
              🐦
            </div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '8px'
            }}>
              大広間
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9',
              lineHeight: '1.4'
            }}>
              みんなでおしゃべり<br />
              1時間で自動削除される投稿
            </div>
          </div>
        </Link>

        {/* 公会堂への入り口 */}
        <Link to="/plaza/chatbot" style={{ textDecoration: 'none' }}>
          <div className="comic-card" style={{
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(123, 31, 162, 0.2))',
            padding: 'min(24px, 6vw)',
            borderColor: '#9c27b0',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>
              🐿️
            </div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '8px'
            }}>
              公会堂
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9',
              lineHeight: '1.4'
            }}>
              モモンガくんとおしゃべり<br />
              AIアシスタントとの会話
            </div>
          </div>
        </Link>
      </div>

      {/* ナビゲーションボタン */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            padding: 'min(12px 24px, 3vw)',
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

export default Plaza