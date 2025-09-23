import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../hooks/useSEO'
import { trackAreaVisited, AREAS } from '../utils/achievements'
import Avatar from '../components/Avatar'

const PersonalHub: React.FC = () => {
  useSEO({
    title: 'マイページ',
    description: '個人データ、実績、デイリーミッション、アバターカスタマイズの管理ページ。あなたのカーニバル活動を一元管理。',
    keywords: 'マイページ,個人データ,実績,デイリーミッション,アバター,カスタマイズ,プロフィール',
    ogTitle: 'マイページ | モモンガカーニバル',
    ogDescription: '実績、日課、アバターなど個人データを一元管理するマイページ。'
  });

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
        👤 マイページ 👤
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(32px, 8vw)', 
        color: '#c8e6c9'
      }}>
        あなたのカーニバル活動を管理
      </div>

      {/* プロフィール表示 */}
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
        borderColor: '#9c27b0',
        padding: 'min(24px, 6vw)',
        marginBottom: 'min(32px, 8vw)',
        maxWidth: '500px',
        margin: '0 auto min(32px, 8vw) auto'
      }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <Avatar size="large" showBackground />
          <div style={{ textAlign: 'left' }}>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '8px'
            }}>
              カーニバル参加者
            </div>
            <div className="comic-text font-body-sm" style={{ 
              color: '#c8e6c9'
            }}>
              モモンガくんと一緒に<br />
              楽しいカーニバルライフ！
            </div>
          </div>
        </div>
      </div>

      {/* 個人データエリア */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 45vw), 1fr))', 
        gap: 'min(24px, 6vw)', 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '0 10px' 
      }}>
        <Link to="/achievements" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.3), rgba(255, 152, 0, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#ff5722', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🏆</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              実績・トロフィー
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              カーニバルでの足跡を確認<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">レア度別実績解除！</span>
            </div>
          </div>
        </Link>

        <Link to="/daily-missions" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.3), rgba(216, 27, 96, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#e91e63', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>📋</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              デイリーミッション
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              毎日の挑戦課題をクリア<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">連続ログインでボーナス！</span>
            </div>
          </div>
        </Link>

        <Link to="/avatar" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(123, 31, 162, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#9c27b0', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>👗</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              アバター着せ替え
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              モモンガくんをカスタマイズ<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">コスチューム・アクセサリー</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ナビゲーション */}
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

export default PersonalHub