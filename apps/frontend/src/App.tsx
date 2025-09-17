import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="header" style={{ padding: 20, textAlign: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none' }}><h1 className="title">さすらいのモモンガカーニバル</h1></Link>
        <nav className="nav" style={{ marginTop: 12, display: 'inline-flex' }}>
          <Link to="/">ホーム</Link>
          <Link to="/games/omikuji">おみくじ</Link>
          <Link to="/games/pinball">ピンボール</Link>
          <Link to="/games/bullet-hell">弾幕シューティング</Link>
          <Link to="/favorites">好きなもの</Link>
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