import React, { useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AppDataProvider } from './contexts/AppDataContext';
import './App.css';

// テーマ適用関数
const applySetting = (key: string, value: boolean) => {
  switch (key) {
    case 'dark-mode':
      if (value) {
        document.body.classList.add('dark-mode')
      } else {
        document.body.classList.remove('dark-mode')
      }
      break
    case 'premium-theme':
      if (value) {
        document.body.classList.add('premium-theme')
      } else {
        document.body.classList.remove('premium-theme')
      }
      break
  }
}

const App: React.FC = () => {
  // アプリ起動時にテーマ設定を読み込んで適用
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        // 保存された設定をすべて適用
        Object.entries(parsedSettings).forEach(([key, value]) => {
          applySetting(key, value as boolean)
        })
      } catch {
        // 設定の読み込みに失敗した場合はデフォルトのまま
      }
    }
  }, [])

  return (
    <AppDataProvider>
      <div className="app">
        <header className="header" style={{ padding: 20, textAlign: 'center' }} role="banner">
          <Link to="/" style={{ textDecoration: 'none' }} aria-label="ホームページに戻る">
            <h1 className="title">さすらいのモモンガカーニバル</h1>
          </Link>
          <nav className="nav" style={{ marginTop: 12, display: 'inline-flex' }} role="navigation" aria-label="メインナビゲーション">
            <Link to="/" aria-label="拠点ページ">拠点</Link>
            <Link to="/games" aria-label="遊技場ページ">遊技場</Link>
            <Link to="/plaza" aria-label="広場ページ">広場</Link>
            <Link to="/favorites" aria-label="お気に入りファイル管理">宝物庫</Link>
            <Link to="/settings" aria-label="設定ページ">設定</Link>
          </nav>
        </header>
        <main style={{ padding: 20 }} role="main">
          <Outlet />
        </main>
        <footer className="footer" style={{ textAlign: 'center', padding: 20 }} role="contentinfo">
          <p>© さすらいのモモンガカーニバル</p>
        </footer>
      </div>
    </AppDataProvider>
  );
};

export default App;