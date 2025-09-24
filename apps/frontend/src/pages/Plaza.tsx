import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'
import { trackAreaVisited, AREAS } from '../utils/achievements'

const Plaza: React.FC = () => {
  useSEO(SEO_PRESETS.plaza);
  const { momoPayPoints } = useAppData()

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.HOME)
  }, [])
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

      {/* MOMOPay残高表示 */}
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))',
        borderColor: '#ffc107',
        padding: 'min(20px, 5vw)',
        marginBottom: 'min(32px, 8vw)',
        maxWidth: '400px',
        margin: '0 auto min(32px, 8vw) auto'
      }}>
        <div className="comic-text font-title-sm" style={{ 
          color: '#fff3e0',
          marginBottom: '8px'
        }}>
          🪙 どんぐり財布
        </div>
        <div className="comic-text font-body-lg" style={{ 
          color: '#c8e6c9',
          fontSize: 'clamp(1.2rem, 4vw, 1.8rem)'
        }}>
          {momoPayPoints.toLocaleString()} MOMOPay
        </div>
      </div>

      {/* 交流エリア */}
      <div className="comic-text font-title-md" style={{ 
        color: '#fff3e0',
        marginBottom: 'min(20px, 5vw)'
      }}>
        💬 交流エリア
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 45vw), 1fr))', 
        gap: 'min(20px, 5vw)', 
        maxWidth: '600px', 
        margin: '0 auto min(40px, 10vw) auto',
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
              モモンガくんとおしゃべり
            </div>
          </div>
        </Link>
      </div>

      {/* どんぐり銀座（経済エリア） */}
      <div className="comic-text font-title-md" style={{ 
        color: '#fff3e0',
        marginBottom: 'min(20px, 5vw)'
      }}>
        🌰 どんぐり銀座
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 45vw), 1fr))', 
        gap: 'min(24px, 6vw)', 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '0 10px' 
      }}>
        <Link to="/momo-bank" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#ffc107', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🏦</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              MOMOBank
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              預金で利息を得よう<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">投資・融資も可能！</span>
            </div>
          </div>
        </Link>

        <Link to="/favorites" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(139, 195, 74, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#4caf50', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🏺</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              森の宝物庫
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              大切なものを安全に保管<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">100P で利用可能</span>
            </div>
          </div>
        </Link>

        <Link to="/momo-store" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(123, 31, 162, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#9c27b0', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🛒</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              MOMOStore
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              設定機能・装備の売買<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">森の売店がリニューアル！</span>
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