import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import App from './App.tsx'
import { useSEO, SEO_PRESETS } from './hooks/useSEO'
import { logger } from './utils/logger'
import { performanceMonitor } from './utils/performance'
import { initStorageMonitor } from './utils/storageMonitor'
import { getDailyBonus, claimDailyBonus, getActiveEvents, economyEventManager } from './utils/economyEvents'
import { useAppData } from './contexts/AppDataContext'

// ホームページコンポーネント
// eslint-disable-next-line react-refresh/only-export-components
const HomePage: React.FC = () => {
  useSEO(SEO_PRESETS.home);
  const { addMomoPayPoints } = useAppData()
  const [dailyBonus, setDailyBonus] = React.useState(getDailyBonus())
  const [activeEvents] = React.useState(getActiveEvents())

  // 初期化時に経済イベントを確実にセットアップ
  React.useEffect(() => {
    economyEventManager.ensureInitialized()
  }, [])

  const handleClaimBonus = () => {
    const amount = claimDailyBonus()
    if (amount > 0) {
      addMomoPayPoints(amount)
      setDailyBonus(getDailyBonus()) // Refresh to show claimed state
      alert(`🎁 デイリーボーナス獲得！\n+${amount}MOMOPay`)
    }
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-xl" style={{ marginBottom: 'min(24px, 6vw)', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', color: '#fff3e0', lineHeight: '1.2' }}>🌲 森の拠点へようこそ！ 🐿️</div>
      <div className="comic-text font-title-sm" style={{ marginBottom: 'min(24px, 6vw)', color: '#c8e6c9', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>さすらいのモモンガカーニバル</div>

      {/* デイリーボーナス */}
      {dailyBonus && !dailyBonus.claimed && (
        <div className="comic-card animate-bounce-in daily-bonus-card" style={{
          background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.4), rgba(255, 152, 0, 0.3))',
          borderColor: '#ffc107',
          padding: 'min(16px, 4vw)',
          marginBottom: 'min(24px, 6vw)',
          maxWidth: '500px',
          margin: '0 auto min(24px, 6vw) auto'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
            {dailyBonus.icon}
          </div>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '8px'
          }}>
            {dailyBonus.title}
          </div>
          <div className="comic-text font-body-sm" style={{ 
            color: '#c8e6c9',
            marginBottom: '12px'
          }}>
            {dailyBonus.description}
          </div>
          <button
            onClick={handleClaimBonus}
            className="comic-button font-button-md"
            style={{
              background: 'linear-gradient(45deg, #ffc107, #ffb300)',
              color: '#000',
              borderColor: '#f57f17',
              animation: 'pulse 2s infinite'
            }}
          >
            🎁 {dailyBonus.amount}MOMOPay受け取る
          </button>
        </div>
      )}

      {/* アクティブな経済イベント */}
      {activeEvents.length > 0 && (
        <div className="comic-card animate-glow event-card" style={{
          background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(123, 31, 162, 0.2))',
          borderColor: '#9c27b0',
          padding: 'min(16px, 4vw)',
          marginBottom: 'min(24px, 6vw)',
          maxWidth: '600px',
          margin: '0 auto min(24px, 6vw) auto'
        }}>
          <div className="comic-text font-title-sm" style={{ 
            color: '#fff3e0',
            marginBottom: '12px'
          }}>
            🎪 開催中イベント
          </div>
          {activeEvents.map(event => (
            <div key={event.id} style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>{event.icon}</span>
              <span className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
                {event.title}: {event.description}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* 主要エリア（5つに整理） */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 45vw), 1fr))', gap: 'min(20px, 4vw)', maxWidth: '600px', margin: '0 auto', padding: '0 10px' }}>
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))', padding: 'min(24px, 6vw)', borderColor: '#ffc107', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>🎮</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>遊技場</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>ゲーム・売店</div>
          </div>
        </Link>
        <Link to="/plaza" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: 'min(24px, 6vw)', borderColor: '#8bc34a', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>🏛️</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>広場</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>おしゃべり・交流</div>
          </div>
        </Link>
        <Link to="/personal" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(160, 82, 45, 0.2))', padding: 'min(24px, 6vw)', borderColor: '#8b4513', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>🌳</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>木の洞</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>秘密の隠れ家</div>
          </div>
        </Link>
        <Link to="/momo-economy" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(218, 165, 32, 0.3), rgba(184, 134, 11, 0.2))', padding: 'min(24px, 6vw)', borderColor: '#daa520', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>🌰</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>どんぐり銀座</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>森の経済活動</div>
          </div>
        </Link>
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.3), rgba(33, 150, 243, 0.2))', padding: 'min(24px, 6vw)', borderColor: '#2196f3', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>⚙️</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>設定</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>各種設定</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

// old Minigame removed
import Favorites from './pages/Favorites.tsx'
import Tweets from './pages/Tweets.tsx'
import Games from './pages/Games.tsx'
import MOMOStore from './pages/MOMOStore.tsx'
import SettingsIndex from './pages/SettingsIndex.tsx'
import GeneralSettings from './pages/GeneralSettings.tsx'
import ShareSettings from './pages/ShareSettings.tsx'
import Plaza from './pages/Plaza.tsx'
import Chatbot from './pages/Chatbot.tsx'
import './index.css'
import OmikujiRoulette from './pages/OmikujiRoulette.tsx'
import BulletHell from './pages/BulletHell.tsx'
import Achievements from './pages/Achievements.tsx'
import NumberPuzzle from './pages/NumberPuzzle.tsx'
import MemoryGame from './pages/MemoryGame.tsx'
import MOMOBank from './pages/MOMOBank.tsx'
import AvatarCustomization from './pages/AvatarCustomization.tsx'
import PersonalHub from './pages/PersonalHub.tsx'
import EconomyHub from './pages/EconomyHub.tsx'
import AudioSettings from './pages/AudioSettings.tsx'
import SlotMachine from './pages/SlotMachine.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
            { path: 'games', element: <Games /> },
            { path: 'games/omikuji', element: <OmikujiRoulette /> },
            { path: 'games/bullet-hell', element: <BulletHell /> },
            { path: 'games/number-puzzle', element: <NumberPuzzle /> },
            { path: 'games/memory', element: <MemoryGame /> },
            { path: 'games/slot-machine', element: <SlotMachine /> },
            { path: 'games/store', element: <MOMOStore /> },
            { path: 'plaza', element: <Plaza /> },
            { path: 'plaza/hall', element: <Tweets /> },
            { path: 'plaza/chatbot', element: <Chatbot /> },
            { path: 'tweets', element: <Tweets /> }, // 後方互換性のため残す
            { path: 'favorites', element: <Favorites /> },
            { path: 'settings', element: <SettingsIndex /> },
            { path: 'settings/general', element: <GeneralSettings /> },
            { path: 'settings/share', element: <ShareSettings /> },
            { path: 'settings/audio', element: <AudioSettings /> },
            { path: 'achievements', element: <Achievements /> },
            { path: 'momo-bank', element: <MOMOBank /> },
            { path: 'avatar', element: <AvatarCustomization /> },
            { path: 'personal', element: <PersonalHub /> },
            { path: 'momo-economy', element: <EconomyHub /> },
    ],
  },
])

// Service Worker登録
if ('serviceWorker' in navigator && import.meta.env.VITE_ENABLE_PWA !== 'false') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logger.info('Service Worker registered successfully', {
          scope: registration.scope
        })
        
        // 更新チェック
        registration.addEventListener('updatefound', () => {
          logger.info('New Service Worker version available')
        })
      })
      .catch((error) => {
        logger.error('Service Worker registration failed', error)
      })
  })
}

// アプリケーション初期化
logger.info('Application starting', {
  version: __APP_VERSION__,
  buildDate: __BUILD_DATE__,
  userAgent: navigator.userAgent
})

// パフォーマンス監視開始
performanceMonitor.reportVitals()

// ストレージ監視開始
initStorageMonitor()

// eslint-disable-next-line react-refresh/only-export-components
const Main = () => (
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />)