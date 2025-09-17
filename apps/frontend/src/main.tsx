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
        <div style={{ fontSize: '2.5rem', marginBottom: '20px', textShadow: '2px 2px 0px #2e7d32, 4px 4px 0px #1b5e20', color: '#fff3e0', fontWeight: 'bold' }}>🌲 森の秘密基地へようこそ！ 🌲</div>
        <div style={{ fontSize: '1.3rem', marginBottom: '30px', color: '#c8e6c9', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>さすらいのモモンガカーニバル</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '20px', borderRadius: '16px', border: '2px solid #8bc34a', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔮</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff3e0', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>御神籤</div>
            <div style={{ fontSize: '0.9rem', color: '#c8e6c9', marginTop: '5px' }}>運試しをしよう</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '20px', borderRadius: '16px', border: '2px solid #8bc34a', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💥</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff3e0', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>弾幕</div>
            <div style={{ fontSize: '0.9rem', color: '#c8e6c9', marginTop: '5px' }}>敵を倒そう</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))', padding: '20px', borderRadius: '16px', border: '2px solid #8bc34a', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff3e0', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>宝物庫</div>
            <div style={{ fontSize: '0.9rem', color: '#c8e6c9', marginTop: '5px' }}>ファイルを保存</div>
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