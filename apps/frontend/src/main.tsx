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
        <div style={{ fontSize: '2rem', marginBottom: '20px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>🏠 秘密基地へようこそ！ 🏠</div>
        <div style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>さすらいのモモンガカーニバル</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🔮</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>おみくじ</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>運試しをしよう</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>💥</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>弾幕シューティング</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>敵を倒そう</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📁</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>好きなもの置き場</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>ファイルを保存</div>
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