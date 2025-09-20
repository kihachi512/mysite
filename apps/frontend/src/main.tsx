import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import App from './App.tsx'
import { useSEO, SEO_PRESETS } from './hooks/useSEO'
import { logger } from './utils/logger'
import { performanceMonitor } from './utils/performance'

// ホームページコンポーネント
// eslint-disable-next-line react-refresh/only-export-components
const HomePage: React.FC = () => {
  useSEO(SEO_PRESETS.home);
  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-xl" style={{ marginBottom: 'min(24px, 6vw)', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', color: '#fff3e0', lineHeight: '1.2' }}>🌲 秘密基地へようこそ！ 🌲</div>
      <div className="comic-text font-title-sm" style={{ marginBottom: 'min(36px, 8vw)', color: '#c8e6c9', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>さすらいのモモンガカーニバル</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 45vw), 1fr))', gap: 'min(20px, 4vw)', maxWidth: '600px', margin: '0 auto', padding: '0 10px' }}>
        <Link to="/games" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))', padding: 'min(24px, 6vw)', borderColor: '#ffc107', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>🎮</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>遊技場</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>御神籤・弾幕ゲーム</div>
          </div>
        </Link>
        <Link to="/plaza" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: 'min(24px, 6vw)', borderColor: '#8bc34a', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>🏛️</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>広場</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>おしゃべり・交流</div>
          </div>
        </Link>
        <Link to="/favorites" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: 'min(24px, 6vw)', borderColor: '#8bc34a', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>📁</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>宝物庫</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>ファイルを保存</div>
          </div>
        </Link>
        <Link to="/settings" style={{ textDecoration: 'none' }}>
          <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(66, 165, 245, 0.3), rgba(33, 150, 243, 0.2))', padding: 'min(24px, 6vw)', borderColor: '#2196f3', cursor: 'pointer', transition: 'all 0.3s ease' }}>
            <div className="font-icon-md" style={{ marginBottom: '12px' }}>⚙️</div>
            <div className="comic-text font-title-sm" style={{ color: '#fff3e0' }}>設定</div>
            <div className="comic-text font-body-md" style={{ color: '#c8e6c9', marginTop: '6px' }}>一般・共有設定</div>
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
            { path: 'games', element: <Games /> },
            { path: 'games/omikuji', element: <OmikujiRoulette /> },
            { path: 'games/bullet-hell', element: <BulletHell /> },
            { path: 'games/store', element: <MOMOStore /> },
            { path: 'plaza', element: <Plaza /> },
            { path: 'plaza/hall', element: <Tweets /> },
            { path: 'plaza/chatbot', element: <Chatbot /> },
            { path: 'tweets', element: <Tweets /> }, // 後方互換性のため残す
            { path: 'favorites', element: <Favorites /> },
            { path: 'settings', element: <SettingsIndex /> },
            { path: 'settings/general', element: <GeneralSettings /> },
            { path: 'settings/share', element: <ShareSettings /> },
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

// eslint-disable-next-line react-refresh/only-export-components
const Main = () => (
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')!).render(<Main />)