import React, { useState, useEffect } from 'react';
import ProgressBar from '../components/ProgressBar';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    minRam: '512',
    maxRam: '4096',
    javaPath: '',
    jvmArgs: '',
    autoConnect: true,
  });
  const [javaFound, setJavaFound] = useState<string | null>(null);
  const [javaChecking, setJavaChecking] = useState(true);
  const [javaDownloading, setJavaDownloading] = useState(false);
  const [javaProgress, setJavaProgress] = useState({ percent: 0, status: '' });
  const [saved, setSaved] = useState(false);
  const [skinUrl, setSkinUrl] = useState<string | null>(null);
  const [skinUploading, setSkinUploading] = useState(false);

  useEffect(() => {
    window.api.getSettings().then(setSettings);
    window.api.findJava().then((path) => {
      setJavaFound(path);
      setJavaChecking(false);
    });
    window.api.getAuth().then((auth) => {
      if (auth?.skinUrl) {
        setSkinUrl(auth.skinUrl);
      }
    });
  }, []);

  const handleSave = async () => {
    await window.api.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDownloadJava = async () => {
    setJavaDownloading(true);
    const unsub = window.api.onJavaProgress((data) => {
      setJavaProgress(data);
    });

    const result = await window.api.downloadJava();
    unsub();
    setJavaDownloading(false);

    if (result.success && result.path) {
      setJavaFound(result.path);
      setSettings((prev) => ({ ...prev, javaPath: result.path! }));
    }
  };

  const handleUploadSkin = async () => {
    setSkinUploading(true);
    const result = await window.api.uploadSkin();
    setSkinUploading(false);

    if (result.success && result.skinUrl) {
      setSkinUrl(result.skinUrl);
    } else if (result.error) {
      alert(result.error);
    }
  };

  const handleDeleteSkin = async () => {
    if (!confirm('Вы уверены, что хотите удалить скин?')) {
      return;
    }

    const result = await window.api.deleteSkin();
    if (result.success) {
      setSkinUrl(null);
    } else if (result.error) {
      alert(result.error);
    }
  };

  return (
    <div className="settings-page">
      <h2>Настройки</h2>

      {/* Skin */}
      <div className="settings-section">
        <h3>Скин</h3>

        <div className="setting-row">
          <label>Текущий скин</label>
          <div className="skin-controls">
            {skinUrl ? (
              <>
                <span className="skin-status">Загружен</span>
                <button className="delete-skin-btn" onClick={handleDeleteSkin} disabled={skinUploading}>
                  Удалить
                </button>
              </>
            ) : (
              <span className="skin-status">Не установлен</span>
            )}
            <button className="upload-skin-btn" onClick={handleUploadSkin} disabled={skinUploading}>
              {skinUploading ? 'Загрузка...' : skinUrl ? 'Изменить' : 'Загрузить'}
            </button>
          </div>
        </div>

        <div className="setting-info">
          Формат: PNG 64x64 пикселей (рекомендуется)
        </div>
      </div>

      {/* Java */}
      <div className="settings-section">
        <h3>Java</h3>

        <div className="setting-row">
          <label>Статус Java</label>
          {javaChecking ? (
            <span className="java-status" style={{ color: 'var(--text-muted)' }}>Проверка...</span>
          ) : javaFound ? (
            <span className="java-status found">Найдена</span>
          ) : (
            <span className="java-status not-found">
              Не найдена
              <button className="download-java-btn" onClick={handleDownloadJava} disabled={javaDownloading}>
                Скачать Java 21
              </button>
            </span>
          )}
        </div>

        {javaDownloading && (
          <div style={{ marginTop: 12 }}>
            <ProgressBar percent={javaProgress.percent} status={javaProgress.status} />
          </div>
        )}

        <div className="setting-row">
          <label>Путь к Java</label>
          <input
            type="text"
            value={settings.javaPath || javaFound || ''}
            onChange={(e) => setSettings({ ...settings, javaPath: e.target.value })}
            placeholder="Авто-определение"
          />
        </div>
      </div>

      {/* RAM */}
      <div className="settings-section">
        <h3>Память (RAM)</h3>

        <div className="setting-row">
          <label>Минимум</label>
          <div className="ram-slider">
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={settings.minRam}
              onChange={(e) => setSettings({ ...settings, minRam: e.target.value })}
            />
            <span className="ram-value">{settings.minRam} MB</span>
          </div>
        </div>

        <div className="setting-row">
          <label>Максимум</label>
          <div className="ram-slider">
            <input
              type="range"
              min="1024"
              max="16384"
              step="256"
              value={settings.maxRam}
              onChange={(e) => setSettings({ ...settings, maxRam: e.target.value })}
            />
            <span className="ram-value">{settings.maxRam} MB</span>
          </div>
        </div>
      </div>

      {/* JVM Args */}
      <div className="settings-section">
        <h3>Дополнительно</h3>

        <div className="setting-row">
          <label>JVM аргументы</label>
          <input
            type="text"
            value={settings.jvmArgs}
            onChange={(e) => setSettings({ ...settings, jvmArgs: e.target.value })}
            placeholder="-XX:+UseG1GC"
          />
        </div>

        <div className="setting-row">
          <label>Автоподключение к серверу</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.autoConnect}
              onChange={(e) => setSettings({ ...settings, autoConnect: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <button className="save-btn" onClick={handleSave}>
        {saved ? 'Сохранено!' : 'Сохранить'}
      </button>
    </div>
  );
}
