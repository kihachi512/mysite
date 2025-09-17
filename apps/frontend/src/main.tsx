import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
// old Minigame removed
import Favorites from './pages/Favorites.tsx'
import './index.css'
import OmikujiRoulette from './pages/OmikujiRoulette.tsx'
import BulletHell from './pages/BulletHell.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <div style={{ color: 'white', textAlign: 'center', padding: '40px 20px' }}>
        <div className="comic-text" style={{ fontSize: '2.8rem', marginBottom: '24px', textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', color: '#fff3e0' }}>🌲 森の秘密基地へようこそ！ 🌲</div>
        <div className="comic-text" style={{ fontSize: '1.4rem', marginBottom: '36px', color: '#c8e6c9', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>さすらいのモモンガカーニバル</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <div className="comic-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '24px', borderColor: '#8bc34a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔮</div>
            <div className="comic-text" style={{ fontSize: '1.3rem', color: '#fff3e0' }}>御神籤</div>
            <div className="comic-text" style={{ fontSize: '1rem', color: '#c8e6c9', marginTop: '6px' }}>運試しをしよう</div>
          </div>
          <div className="comic-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '24px', borderColor: '#8bc34a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💥</div>
            <div className="comic-text" style={{ fontSize: '1.3rem', color: '#fff3e0' }}>弾幕</div>
            <div className="comic-text" style={{ fontSize: '1rem', color: '#c8e6c9', marginTop: '6px' }}>敵を倒そう</div>
          </div>
          <div className="comic-card" style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '24px', borderColor: '#8bc34a' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📁</div>
            <div className="comic-text" style={{ fontSize: '1.3rem', color: '#fff3e0' }}>宝物庫</div>
            <div className="comic-text" style={{ fontSize: '1rem', color: '#c8e6c9', marginTop: '6px' }}>ファイルを保存</div>
          </div>
        </div>
      </div> },
      { path: 'games/omikuji', element: <OmikujiRoulette /> },
      { path: 'games/bullet-hell', element: <BulletHell /> },
      { path: 'favorites', element: <Favorites /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)