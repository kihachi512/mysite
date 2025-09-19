import React from 'react'
import { Link } from 'react-router-dom'

const Games: React.FC = () => {
  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(24px, 6vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🎮 遊技場 🎮
      </div>
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(36px, 8vw)', 
        color: '#c8e6c9', 
        textShadow: '2px 2px 0px rgba(0,0,0,0.5)' 
      }}>
        モモンガたちと一緒に遊ぼう！
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 45vw), 1fr))', 
        gap: 'min(24px, 6vw)', 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '0 10px' 
      }}>
        <Link to="/games/omikuji" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#ffc107', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🔮</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              御神籤
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              神様に運勢を占ってもらおう<br />
              <span className="momopay-small">費用: 10MOMOPay</span>
            </div>
          </div>
        </Link>

        <Link to="/games/bullet-hell" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#4caf50', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🌲</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              演習林
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              守護者として修行を積もう<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">装備ガチャで強化！</span>
            </div>
          </div>
        </Link>

        <Link to="/games/store" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(142, 36, 170, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#9c27b0', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🏪</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              売店
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              装備売却・設定機能の購入<br />
              <span className="momopay-small">MOMOStoreへようこそ！</span>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: 'min(40px, 10vw)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            padding: 'min(14px 28px, 3.5vw 7vw)',
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

export default Games