import React, { useState, useEffect } from 'react';

interface UpdateInfo {
  version: string;
  releaseDate: string;
  changelog: string[];
  required: boolean;
  downloadUrl: string;
  fileSize: number;
}

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Подписка на события обновлений
    const unsubAvailable = window.api.onUpdateAvailable((info) => {
      console.log('Update available:', info);
      setUpdateInfo(info);
      setHidden(false);
    });

    const unsubNotAvailable = window.api.onUpdateNotAvailable(() => {
      console.log('No updates available');
    });

    const unsubProgress = window.api.onUpdateDownloadProgress((progress) => {
      setDownloadProgress(Math.round(progress.percent));
    });

    const unsubDownloaded = window.api.onUpdateDownloaded((data) => {
      console.log('Update downloaded:', data.filePath);
      setDownloading(false);
      setDownloaded(true);
      setDownloadedFilePath(data.filePath);
    });

    const unsubError = window.api.onUpdateError((data) => {
      console.error('Update error:', data.message);
      setError(data.message);
      setDownloading(false);
    });

    const unsubRequired = window.api.onUpdateRequired((info) => {
      console.log('Required update:', info);
      setUpdateInfo(info);
      setHidden(false);
    });

    // Отписка при размонтировании
    return () => {
      unsubAvailable();
      unsubNotAvailable();
      unsubProgress();
      unsubDownloaded();
      unsubError();
      unsubRequired();
    };
  }, []);

  const handleDownload = async () => {
    if (!updateInfo?.downloadUrl) return;

    setError(null);
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const result = await window.api.downloadUpdate(updateInfo.downloadUrl);
      if (!result.success) {
        setError(result.error || 'Ошибка скачивания обновления');
        setDownloading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Неизвестная ошибка');
      setDownloading(false);
    }
  };

  const handleInstall = async () => {
    try {
      const result = await window.api.installUpdate(downloadedFilePath || undefined);
      if (!result.success) {
        setError(result.error || 'Ошибка установки обновления');
      }
    } catch (err: any) {
      setError(err.message || 'Неизвестная ошибка');
    }
  };

  const handleDismiss = () => {
    if (updateInfo?.required) {
      // Нельзя скрыть обязательное обновление
      return;
    }
    setHidden(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!updateInfo || hidden) return null;

  return (
    <div className={`update-notification glass-card ${updateInfo.required ? 'required' : ''}`}>
      <div className="update-header">
        <h3>
          {updateInfo.required ? '⚠️ Обязательное обновление' : '🔔 Доступно обновление'} v{updateInfo.version}
        </h3>
        {!updateInfo.required && (
          <button className="close-btn" onClick={handleDismiss}>×</button>
        )}
      </div>

      <div className="update-content">
        {updateInfo.changelog && updateInfo.changelog.length > 0 && (
          <div className="changelog">
            <p><strong>Что нового:</strong></p>
            <ul>
              {updateInfo.changelog.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {updateInfo.fileSize > 0 && (
          <p className="file-size">
            Размер: {formatFileSize(updateInfo.fileSize)}
          </p>
        )}

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {!downloading && !downloaded && (
          <button className="download-btn" onClick={handleDownload}>
            Скачать обновление
          </button>
        )}

        {downloading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${downloadProgress}%` }} />
            </div>
            <div className="progress-text">
              Скачивание... {downloadProgress}%
            </div>
          </div>
        )}

        {downloaded && (
          <div className="install-section">
            <p className="success-message">✅ Обновление скачано</p>
            <button className="install-btn" onClick={handleInstall}>
              Установить и перезапустить
            </button>
          </div>
        )}

        {updateInfo.required && !downloaded && (
          <p className="required-message">
            Это обновление обязательно для продолжения работы лаунчера
          </p>
        )}
      </div>
    </div>
  );
}
