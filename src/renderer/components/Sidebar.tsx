import React from 'react';
import { motion } from 'framer-motion';
import { Home, Package, Settings, Newspaper, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Page = 'home' | 'mods' | 'settings' | 'news';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  username: string;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems: { id: Page; icon: LucideIcon; label: string }[] = [
  { id: 'home', icon: Home, label: 'Главная' },
  { id: 'mods', icon: Package, label: 'Моды' },
  { id: 'settings', icon: Settings, label: 'Настройки' },
  { id: 'news', icon: Newspaper, label: 'Новости' },
];

export default function Sidebar({ currentPage, onNavigate, username, onLogout, mobileOpen }: Props) {
  return (
    <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <h1>SP.A</h1>
        <p>Launcher</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={20} className="nav-icon" />
              {item.label}
            </motion.button>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">{username[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{username}</div>
            <div className="user-status">Online</div>
          </div>
        </div>
        <motion.button
          className="logout-btn"
          onClick={onLogout}
          whileHover={{ x: 2 }}
        >
          <LogOut size={12} style={{ display: 'inline', marginRight: '4px' }} />
          Выйти из аккаунта
        </motion.button>
      </div>
    </div>
  );
}
