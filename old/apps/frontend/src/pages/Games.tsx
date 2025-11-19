import React from 'react'
import { Link } from 'react-router-dom'
import { useSEO, SEO_PRESETS } from '../hooks/useSEO'

const Games: React.FC = () => {
  useSEO(SEO_PRESETS.games);
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
        maxWidth: '1000px', 
        margin: '0 auto', 
        padding: '0 10px' 
      }}>
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
              <span style={{ color: '#ffd93d' }} className="font-body-sm">今日の運勢をチェック！</span>
            </div>
          </div>
        </Link>

        <Link to="/games/number-puzzle" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.3), rgba(30, 136, 229, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#2196f3', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🔢</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              数独
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              論理思考で数字を配置<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">3つの難易度！</span>
            </div>
          </div>
        </Link>

        <Link to="/games/memory" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.3), rgba(216, 27, 96, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#e91e63', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🧠</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              記憶力ゲーム
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              神経衰弱風カードゲーム<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">記憶力を鍛えよう！</span>
            </div>
          </div>
        </Link>

        <Link to="/games/slot-machine" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.3), rgba(211, 47, 47, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#f44336', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🎰</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              スロットマシン
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#ffcdd2', 
              lineHeight: '1.4'
            }}>
              本格ギャンブルで一攫千金！<br />
              <span style={{ color: '#ffd93d' }} className="font-body-sm">⚠️ 18歳未満プレイ禁止</span>
            </div>
          </div>
        </Link>



        <Link to="/plaza" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ 
            background: 'linear-gradient(135deg, rgba(218, 165, 32, 0.3), rgba(184, 134, 11, 0.2))', 
            padding: 'min(32px, 8vw)', 
            borderColor: '#daa520', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            minHeight: '180px'
          }}>
            <div className="font-icon-lg" style={{ marginBottom: '16px' }}>🏛️</div>
            <div className="comic-text font-title-sm" style={{ 
              color: '#fff3e0',
              marginBottom: '12px'
            }}>
              広場
            </div>
            <div className="comic-text font-body-md" style={{ 
              color: '#c8e6c9', 
              lineHeight: '1.4'
            }}>
              交流と経済の中心地<br />
              <span className="momopay-small">どんぐり銀座も併設</span>
            </div>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: 'min(40px, 10vw)' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🌲 拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Games