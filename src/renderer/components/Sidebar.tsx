import React from 'react';
import { motion } from 'framer-motion';
import { Home, Package, Settings, Newspaper, Globe, Image, User, MessageSquare, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Page = 'home' | 'mods' | 'settings' | 'news' | 'map' | 'screenshots' | 'profile' | 'forum';

interface NavItem {
  id: Page;
  icon: LucideIcon;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'home',        icon: Home,      label: 'Главная' },
  { id: 'mods',        icon: Package,   label: 'Моды' },
  { id: 'news',        icon: Newspaper, label: 'Новости' },
  { id: 'map',         icon: Globe,     label: 'Карта мира' },
  { id: 'screenshots', icon: Image,         label: 'Скриншоты' },
  { id: 'forum',       icon: MessageSquare, label: 'Форум' },
  { id: 'profile',     icon: User,          label: 'Профиль' },
  { id: 'settings',    icon: Settings,      label: 'Настройки' },
];

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  username: string;
  onLogout: () => void;
  modsBadge?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ currentPage, onNavigate, username, onLogout, modsBadge, mobileOpen }: Props) {
  const items = navItems.map(item => ({
    ...item,
    badge: item.id === 'mods' && modsBadge ? modsBadge : undefined,
  }));

  return (
    <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <h1>SP.A</h1>
        <p>Launcher</p>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="nav-badge">+{item.badge}</span>
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">{username[0].toUpperCase()}</div>
          <div className="user-details">
            <div className="user-name">{username}</div>
            <div className="user-status">
              <span className="user-status-dot" />
              Online
            </div>
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
