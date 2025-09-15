import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="header" style={{ padding: 20, textAlign: 'center' }}>
        <h1 className="title">さすらいのモモンガカーニバル</h1>
        <nav style={{ marginTop: 12, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Link to="/">ホーム</Link>
          <Link to="/minigame">ミニゲーム</Link>
          <Link to="/bbs">掲示板</Link>
          <Link to="/favorites">好きなもの置き場</Link>
        </nav>
      </div>
      <div style={{ padding: 20 }}>
        <Outlet />
      </div>
      <div className="footer" style={{ textAlign: 'center', padding: 20 }}>
        <p>© さすらいのモモンガカーニバル</p>
      </div>
    </div>
  );
};

export default App;