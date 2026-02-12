import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginForm from './components/LoginForm';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ModsPage from './pages/ModsPage';
import NewsPage from './pages/NewsPage';

type Page = 'home' | 'mods' | 'settings' | 'news';

interface AuthData {
  username: string;
  uuid: string;
  token: string;
  skinUrl?: string | null;
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.getAuth().then((data) => {
      setAuth(data);
      setLoading(false);
    });
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const result = await window.api.login(username, password);
    if (result.success) {
      setAuth(result.data);
    }
    return result;
  };

  const handleRegister = async (username: string, password: string) => {
    const result = await window.api.register(username, password);
    if (result.success) {
      setAuth(result.data);
    }
    return result;
  };

  const handleLogout = async () => {
    await window.api.logout();
    setAuth(null);
  };

  if (loading) {
    return (
      <>
        <TitleBar />
        <div className="app-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Загрузка...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <TitleBar />
      <div className="app-layout">
        {!auth ? (
          <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
        ) : (
          <>
            <Sidebar
              currentPage={page}
              onNavigate={setPage}
              username={auth.username}
              onLogout={handleLogout}
            />
            <div className="main-content">
              {page === 'home' && <HomePage />}
              {page === 'mods' && <ModsPage />}
              {page === 'settings' && <SettingsPage />}
              {page === 'news' && <NewsPage />}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function TitleBar() {
  return (
    <div className="titlebar">
      <span className="titlebar-title">SP.A Launcher</span>
      <div className="titlebar-controls">
        <button className="titlebar-btn" onClick={() => window.api.minimizeWindow()}>
          &#x2014;
        </button>
        <button className="titlebar-btn" onClick={() => window.api.maximizeWindow()}>
          &#x25A1;
        </button>
        <button className="titlebar-btn close" onClick={() => window.api.closeWindow()}>
          &#x2715;
        </button>
      </div>
    </div>
  );
}
