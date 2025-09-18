import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AppDataProvider } from './contexts/AppDataContext';
import './App.css';

const App: React.FC = () => {
  return (
    <AppDataProvider>
      <div className="app">
        <div className="header" style={{ padding: 20, textAlign: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}><h1 className="title">さすらいのモモンガカーニバル</h1></Link>
                <nav className="nav" style={{ marginTop: 12, display: 'inline-flex' }}>
                  <Link to="/">拠点</Link>
                  <Link to="/games/omikuji">御神籤</Link>
                  <Link to="/games/bullet-hell">弾幕</Link>
                  <Link to="/tweets">つぶやき</Link>
                  <Link to="/favorites">宝物庫</Link>
                </nav>
        </div>
        <div style={{ padding: 20 }}>
          <Outlet />
        </div>
        <div className="footer" style={{ textAlign: 'center', padding: 20 }}>
          <p>© さすらいのモモンガカーニバル</p>
        </div>
      </div>
    </AppDataProvider>
  );
};

export default App;