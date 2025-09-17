import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import Minigame from './pages/Minigame.tsx'
import Favorites from './pages/Favorites.tsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <div style={{ color: 'white' }}>ようこそ！ さすらいのモモンガカーニバル</div> },
      { path: 'minigame', element: <Minigame /> },
      { path: 'favorites', element: <Favorites /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)