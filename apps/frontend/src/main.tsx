import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom'
import App from './App.tsx'
// old Minigame removed
import Favorites from './pages/Favorites.tsx'
import Tweets from './pages/Tweets.tsx'
import DataExport from './pages/DataExport.tsx'
import Games from './pages/Games.tsx'
import './index.css'
import OmikujiRoulette from './pages/OmikujiRoulette.tsx'
import BulletHell from './pages/BulletHell.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
        <div className="comic-text" style={{ fontSize: 'clamp(1.8rem, 6vw, 2.8rem)', marginBottom: 'min(24px, 6vw)', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', color: '#fff3e0', lineHeight: '1.2' }}>🌲 森の秘密基地へようこそ！ 🌲</div>
        <div className="comic-text" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', marginBottom: 'min(36px, 8vw)', color: '#c8e6c9', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>さすらいのモモンガカーニバル</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 45vw), 1fr))', gap: 'min(20px, 4vw)', maxWidth: '600px', margin: '0 auto', padding: '0 10px' }}>
          <Link to="/games" style={{ textDecoration: 'none' }}>
            <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))', padding: 'min(24px, 6vw)', borderColor: '#ffc107', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              <div style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)', marginBottom: '12px' }}>🎮</div>
              <div className="comic-text" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', color: '#fff3e0' }}>遊戯</div>
              <div className="comic-text" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)', color: '#c8e6c9', marginTop: '6px' }}>御神籤・弾幕ゲーム</div>
            </div>
          </Link>
          <Link to="/tweets" style={{ textDecoration: 'none' }}>
            <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: 'min(24px, 6vw)', borderColor: '#8bc34a', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              <div style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)', marginBottom: '12px' }}>🐦</div>
              <div className="comic-text" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', color: '#fff3e0' }}>つぶやき</div>
              <div className="comic-text" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)', color: '#c8e6c9', marginTop: '6px' }}>気軽に投稿</div>
            </div>
          </Link>
          <Link to="/favorites" style={{ textDecoration: 'none' }}>
            <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: 'min(24px, 6vw)', borderColor: '#8bc34a', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              <div style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)', marginBottom: '12px' }}>📁</div>
              <div className="comic-text" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', color: '#fff3e0' }}>宝物庫</div>
              <div className="comic-text" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)', color: '#c8e6c9', marginTop: '6px' }}>ファイルを保存</div>
            </div>
          </Link>
          <Link to="/export" style={{ textDecoration: 'none' }}>
            <div className="comic-card home-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: 'min(24px, 6vw)', borderColor: '#8bc34a', cursor: 'pointer', transition: 'all 0.3s ease' }}>
              <div style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)', marginBottom: '12px' }}>📤</div>
              <div className="comic-text" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', color: '#fff3e0' }}>共有</div>
              <div className="comic-text" style={{ fontSize: 'clamp(0.9rem, 3vw, 1rem)', color: '#c8e6c9', marginTop: '6px' }}>データを共有</div>
            </div>
          </Link>
        </div>
      </div> },
            { path: 'games', element: <Games /> },
            { path: 'games/omikuji', element: <OmikujiRoulette /> },
            { path: 'games/bullet-hell', element: <BulletHell /> },
            { path: 'tweets', element: <Tweets /> },
            { path: 'favorites', element: <Favorites /> },
            { path: 'export', element: <DataExport /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)