import React, { useState, useEffect } from 'react';
import './ProfilePage.css';

interface AuthData {
  username: string;
  uuid: string;
  token: string;
  skinUrl?: string | null;
}

export default function ProfilePage() {
  const [auth, setAuth]                 = useState<AuthData | null>(null);
  const [skinUploading, setSkinUploading] = useState(false);
  const [copied, setCopied]             = useState(false);
  const [playedMinutes, setPlayedMinutes] = useState(0);
  const [modsCount, setModsCount]       = useState(0);

  useEffect(() => {
    window.api.getAuth().then(setAuth);
    window.api.getModsList().then(list => setModsCount(list.length)).catch(() => {});

    const minutes = parseInt(localStorage.getItem('spa-played-minutes') || '0', 10);
    setPlayedMinutes(isNaN(minutes) ? 0 : minutes);
  }, []);

  async function handleUploadSkin() {
    setSkinUploading(true);
    const result = await window.api.uploadSkin();
    setSkinUploading(false);
    if (result.success && result.skinUrl) {
      setAuth(prev => prev ? { ...prev, skinUrl: result.skinUrl } : prev);
    }
  }

  async function handleDeleteSkin() {
    const result = await window.api.deleteSkin();
    if (result.success) {
      setAuth(prev => prev ? { ...prev, skinUrl: null } : prev);
    }
  }

  function handleCopyUuid() {
    if (!auth?.uuid) return;
    navigator.clipboard.writeText(auth.uuid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function formatPlayTime(minutes: number): string {
    if (minutes < 60) return `${minutes} мин`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}м` : `${h} ч`;
  }

  if (!auth) {
    return (
      <div className="profile-page">
        <div className="profile-loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {auth.username[0].toUpperCase()}
          </div>
          <div className="profile-avatar-ring" />
        </div>
        <div className="profile-identity">
          <h2 className="profile-username">{auth.username}</h2>
          <button className="profile-uuid" onClick={handleCopyUuid} title="Нажмите, чтобы скопировать">
            <span className="profile-uuid-label">UUID</span>
            <span className="profile-uuid-value">{auth.uuid}</span>
            <span className="profile-uuid-copy">{copied ? '✓' : '⎘'}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat-card">
          <div className="profile-stat-value">{formatPlayTime(playedMinutes)}</div>
          <div className="profile-stat-label">Время в игре</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{modsCount}</div>
          <div className="profile-stat-label">Модов</div>
        </div>
      </div>

      {/* Skin */}
      <div className="profile-section">
        <h3 className="profile-section-title">Скин</h3>
        <div className="profile-skin-row">
          <div className="profile-skin-status">
            {auth.skinUrl ? (
              <span className="profile-skin-badge profile-skin-badge--set">Загружен</span>
            ) : (
              <span className="profile-skin-badge profile-skin-badge--none">Не установлен</span>
            )}
            <span className="profile-skin-hint">PNG 64×64</span>
          </div>
          <div className="profile-skin-actions">
            {auth.skinUrl && (
              <button
                className="profile-btn profile-btn--danger"
                onClick={handleDeleteSkin}
                disabled={skinUploading}
              >
                Удалить
              </button>
            )}
            <button
              className="profile-btn profile-btn--primary"
              onClick={handleUploadSkin}
              disabled={skinUploading}
            >
              {skinUploading ? 'Загрузка...' : auth.skinUrl ? 'Изменить' : 'Загрузить скин'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
