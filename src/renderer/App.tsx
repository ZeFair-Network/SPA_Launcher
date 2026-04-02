import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Sidebar, { type Page } from './components/Sidebar';
import LoginForm from './components/LoginForm';
import UpdateNotification from './components/UpdateNotification';
import BiomeEffects from './components/effects/BiomeEffects';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import ModsPage from './pages/ModsPage';
import NewsPage from './pages/NewsPage';
import ScreenshotsPage from './pages/ScreenshotsPage';
import MapPage from './pages/MapPage';
import type { BiomeType } from './components/BiomeThemeSwitcher';

interface AuthData {
  username: string;
  uuid: string;
  token: string;
  skinUrl?: string | null;
}

function loadSavedBiome(): BiomeType {
  const saved = localStorage.getItem('spa-launcher-biome') as BiomeType | null;
  if (saved === 'default' || saved === 'cherry-blossom' || saved === 'summer') return saved;
  return 'default';
}

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBiome, setCurrentBiome] = useState<BiomeType>(loadSavedBiome);
  const [modsBadge, setModsBadge] = useState(0);

  useEffect(() => {
    // Apply saved biome on mount
    document.documentElement.setAttribute('data-biome', currentBiome);

    window.api.getAuth().then((data) => {
      setAuth(data);
      setLoading(false);
    });

    setTimeout(() => {
      window.api.checkForUpdates().catch((err) => {
        console.error('Failed to check for updates:', err);
      });
    }, 3000);
  }, []);

  // Load mods count for sidebar badge
  useEffect(() => {
    if (!auth) return;
    window.api.getModsList().then((list) => {
      setModsBadge(list.length);
    }).catch(() => {});
  }, [auth]);

  const handleBiomeChange = (biome: BiomeType) => {
    setCurrentBiome(biome);
  };

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
    setMobileMenuOpen(false);
  };

  const handleNavigate = (newPage: Page) => {
    setPage(newPage);
    setMobileMenuOpen(false);
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
      <BiomeEffects />
      <TitleBar />
      <UpdateNotification />
      <div className="app-layout">
        {!auth ? (
          <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
        ) : (
          <>
            {/* Mobile menu toggle */}
            <motion.button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu size={20} />
            </motion.button>

            {/* Mobile sidebar overlay */}
            <div
              className={`sidebar-overlay ${mobileMenuOpen ? 'visible' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            />

            <Sidebar
              currentPage={page}
              onNavigate={handleNavigate}
              username={auth.username}
              onLogout={handleLogout}
              modsBadge={modsBadge}
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />

            <div className="main-content">
              <div className="main-content-inner">
                {page === 'home'        && <HomePage modsCount={modsBadge} />}
                {page === 'mods'        && <ModsPage />}
                {page === 'settings'    && <SettingsPage currentBiome={currentBiome} onBiomeChange={handleBiomeChange} />}
                {page === 'news'        && <NewsPage />}
                {page === 'map'         && <MapPage />}
                {page === 'screenshots' && <ScreenshotsPage />}
              </div>
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

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">{icon}</div>
      <h2 className="placeholder-title">{title}</h2>
      <p className="placeholder-subtitle">Раздел в разработке</p>
    </div>
  );
}
