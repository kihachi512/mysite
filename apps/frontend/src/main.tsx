import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
// old Minigame removed
import Favorites from './pages/Favorites.tsx'
import './index.css'
import OmikujiRoulette from './pages/OmikujiRoulette.tsx'
import Pinball from './pages/Pinball.tsx'
import BulletHell from './pages/BulletHell.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <div style={{ color: 'white' }}>ようこそ！ さすらいのモモンガカーニバル</div> },
      { path: 'games/omikuji', element: <OmikujiRoulette /> },
      { path: 'games/pinball', element: <Pinball /> },
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