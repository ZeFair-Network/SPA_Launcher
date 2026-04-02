import React, { useState, useEffect } from 'react';
import './ScreenshotsPage.css';

export default function ScreenshotsPage() {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Screenshot | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    loadScreenshots();
  }, []);

  // Escape key closes lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function loadScreenshots() {
    setLoading(true);
    setError('');
    const result = await window.api.getScreenshots();
    if (result.success) {
      setScreenshots(result.data);
      loadThumbs(result.data);
    } else {
      setError(result.error || 'Не удалось загрузить скриншоты');
    }
    setLoading(false);
  }

  function loadThumbs(list: Screenshot[]) {
    for (const s of list) {
      window.api.getScreenshotImage(s.fileName).then(img => {
        if (img) setThumbs(prev => ({ ...prev, [s.fileName]: img }));
      });
    }
  }

  async function openLightbox(s: Screenshot) {
    setSelected(s);
    setLightboxSrc(thumbs[s.fileName] ?? null);
    if (!thumbs[s.fileName]) {
      const img = await window.api.getScreenshotImage(s.fileName);
      setLightboxSrc(img);
    }
  }

  function closeLightbox() {
    setSelected(null);
    setLightboxSrc(null);
  }

  async function handleOpenExternal() {
    if (!selected) return;
    await window.api.openScreenshot(selected.fileName);
  }

  async function handleDelete(fileName: string) {
    await window.api.deleteScreenshot(fileName);
    setScreenshots(prev => prev.filter(s => s.fileName !== fileName));
    setThumbs(prev => { const n = { ...prev }; delete n[fileName]; return n; });
    if (selected?.fileName === fileName) closeLightbox();
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="screenshots-page">
      <div className="screenshots-header">
        <h2 className="screenshots-title">Скриншоты</h2>
        <div className="screenshots-actions">
          {screenshots.length > 0 && (
            <span className="screenshots-count">{screenshots.length}</span>
          )}
          <button className="ss-btn" onClick={() => window.api.openScreenshotsFolder()}>
            Открыть папку
          </button>
          <button className="ss-btn" onClick={loadScreenshots}>
            Обновить
          </button>
        </div>
      </div>

      {loading && (
        <div className="screenshots-empty">
          <p className="screenshots-empty-sub">Загрузка...</p>
        </div>
      )}

      {!loading && error && (
        <div className="screenshots-empty">
          <p className="screenshots-empty-title" style={{ color: 'var(--danger, #ef4444)' }}>{error}</p>
        </div>
      )}

      {!loading && !error && screenshots.length === 0 && (
        <div className="screenshots-empty">
          <div className="screenshots-empty-icon">📸</div>
          <p className="screenshots-empty-title">Скриншотов нет</p>
          <p className="screenshots-empty-sub">Сделайте скриншот в игре клавишей F2</p>
        </div>
      )}

      {!loading && !error && screenshots.length > 0 && (
        <div className="screenshots-grid">
          {screenshots.map(s => (
            <div
              key={s.fileName}
              className="ss-thumb"
              onClick={() => openLightbox(s)}
            >
              {thumbs[s.fileName] ? (
                <img src={thumbs[s.fileName]} alt={s.fileName} className="ss-thumb-img" />
              ) : (
                <div className="ss-thumb-skeleton" />
              )}
              <div className="ss-thumb-overlay">
                <span className="ss-thumb-date">{formatDate(s.takenAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="ss-lightbox" onClick={e => { if (e.target === e.currentTarget) closeLightbox(); }}>
          <div className="ss-lightbox-box">
            <button className="ss-lightbox-close" onClick={closeLightbox}>✕</button>

            <div className="ss-lightbox-img-wrap">
              {lightboxSrc ? (
                <img src={lightboxSrc} alt={selected.fileName} className="ss-lightbox-img" />
              ) : (
                <div className="ss-lightbox-loading">Загрузка...</div>
              )}
            </div>

            <div className="ss-lightbox-footer">
              <div className="ss-lightbox-info">
                <span className="ss-lightbox-name">{selected.fileName}</span>
                <span className="ss-lightbox-meta">
                  {formatDate(selected.takenAt)} · {formatSize(selected.size)}
                </span>
              </div>
              <div className="ss-lightbox-btns">
                <button className="ss-btn" onClick={handleOpenExternal}>Открыть</button>
                <button className="ss-btn ss-btn--danger" onClick={() => handleDelete(selected.fileName)}>
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
