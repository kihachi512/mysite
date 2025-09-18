import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AppDataProvider } from './contexts/AppDataContext';
import './App.css';

const App: React.FC = () => {
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
            <Link to="/tweets" aria-label="大広間投稿ページ">大広間</Link>
            <Link to="/favorites" aria-label="お気に入りファイル管理">宝物庫</Link>
            <Link to="/export" aria-label="データ共有ページ">共有</Link>
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