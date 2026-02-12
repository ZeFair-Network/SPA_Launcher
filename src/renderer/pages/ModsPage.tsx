import React, { useState, useEffect } from 'react';
import ProgressBar from '../components/ProgressBar';

interface ModInfo {
  fileName: string;
  enabled: boolean;
  size: number;
}

export default function ModsPage() {
  const [mods, setMods] = useState<ModInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ percent: 0, status: '' });
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    loadMods();
  }, []);

  async function loadMods() {
    setLoading(true);
    const list = await window.api.getModsList();
    setMods(list);
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncError('');
    setSyncProgress({ percent: 0, status: 'Подключение к серверу...' });

    const unsub = window.api.onSyncProgress((data) => {
      setSyncProgress(data);
    });

    const result = await window.api.syncMods();
    unsub();

    if (!result.success) {
      setSyncError(result.error || 'Ошибка синхронизации');
    }

    setSyncing(false);
    await loadMods();
  }

  async function handleToggle(fileName: string, enabled: boolean) {
    const updated = await window.api.toggleMod(fileName, enabled);
    setMods(updated);
  }

  async function handleDelete(fileName: string) {
    const updated = await window.api.deleteMod(fileName);
    setMods(updated);
  }

  async function handleAdd() {
    const result = await window.api.addMod();
    if (result) setMods(result);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className="mods-page">
      <div className="mods-header">
        <h2>Моды</h2>
        <div className="mods-actions">
          <button className="mod-btn" onClick={handleSync} disabled={syncing}>
            {syncing ? 'Синхронизация...' : 'Синхронизировать'}
          </button>
          <button className="mod-btn secondary" onClick={handleAdd} disabled={syncing}>
            Добавить мод
          </button>
          <button className="mod-btn secondary" onClick={() => window.api.openModsFolder()}>
            Открыть папку
          </button>
        </div>
      </div>

      {syncing && (
        <div style={{ marginBottom: 16 }}>
          <ProgressBar percent={syncProgress.percent} status={syncProgress.status} />
        </div>
      )}

      {syncError && (
        <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>{syncError}</div>
      )}

      {loading ? (
        <div className="mods-empty">Загрузка...</div>
      ) : mods.length === 0 ? (
        <div className="mods-empty">
          Моды не установлены.<br />
          Нажмите «Синхронизировать» чтобы скачать моды с сервера.
        </div>
      ) : (
        <div className="mods-list">
          {mods.map((mod) => (
            <div key={mod.fileName} className="mod-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={mod.enabled}
                  onChange={(e) => handleToggle(mod.fileName, e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <span className="mod-name" style={{ opacity: mod.enabled ? 1 : 0.5 }}>
                {mod.fileName}
              </span>
              <span className="mod-size">{formatSize(mod.size)}</span>
              <button className="mod-delete" onClick={() => handleDelete(mod.fileName)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
