import React from 'react';

type Page = 'home' | 'mods' | 'settings' | 'news';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  username: string;
  onLogout: () => void;
}

const navItems: { id: Page; icon: string; label: string }[] = [
  { id: 'home', icon: '\u25B6', label: '\u0413\u043B\u0430\u0432\u043D\u0430\u044F' },
  { id: 'mods', icon: '\u2699', label: '\u041C\u043E\u0434\u044B' },
  { id: 'settings', icon: '\u2738', label: '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438' },
  { id: 'news', icon: '\u2709', label: '\u041D\u043E\u0432\u043E\u0441\u0442\u0438' },
];

export default function Sidebar({ currentPage, onNavigate, username, onLogout }: Props) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>SP.A</h1>
        <p>Launcher</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">{username[0].toUpperCase()}</div>
          <div>
            <div className="user-name">{username}</div>
            <div className="user-status">Online</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
