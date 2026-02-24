import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Loader2, Gamepad2 } from 'lucide-react';
import { MCProgressBar } from '../components/minecraft';

type Status = 'checking' | 'ready' | 'downloading' | 'installing-fabric' | 'launching' | 'running';

export default function HomePage() {
  const [status, setStatus] = useState<Status>('checking');
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [logs, setLogs] = useState<string[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [error, setError] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkInstallation();

    const unsubLog = window.api.onGameLog((line) => {
      setLogs((prev) => [...prev.slice(-200), line]);
    });

    const unsubExit = window.api.onGameExit((code) => {
      setStatus('ready');
      setLogs((prev) => [...prev, `\n--- Игра завершена (код: ${code}) ---`]);
    });

    return () => {
      unsubLog();
      unsubExit();
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  async function checkInstallation() {
    setStatus('checking');
    const mcInstalled = await window.api.isMinecraftInstalled();
    const fabricInstalled = await window.api.isFabricInstalled();
    const running = await window.api.isGameRunning();

    if (running) {
      setStatus('running');
    } else if (mcInstalled && fabricInstalled) {
      setStatus('ready');
    } else {
      setStatus('ready'); // Will trigger install on play
    }
  }

  async function handlePlay() {
    setError('');

    // Check if MC is installed
    const mcInstalled = await window.api.isMinecraftInstalled();
    if (!mcInstalled) {
      setStatus('downloading');
      const unsub = window.api.onDownloadProgress((data) => {
        setProgress(data);
      });

      const result = await window.api.downloadMinecraft();
      unsub();

      if (!result.success) {
        setError(result.error || 'Ошибка скачивания');
        setStatus('ready');
        return;
      }
    }

    // Check if Fabric is installed
    const fabricInstalled = await window.api.isFabricInstalled();
    if (!fabricInstalled) {
      setStatus('installing-fabric');
      const unsub = window.api.onFabricProgress((data) => {
        setProgress(data);
      });

      const result = await window.api.installFabric();
      unsub();

      if (!result.success) {
        setError(result.error || 'Ошибка установки Fabric');
        setStatus('ready');
        return;
      }
    }

    // Launch game
    setStatus('launching');
    setConsoleOpen(true);
    setLogs([]);

    const result = await window.api.launchGame();
    if (!result.success) {
      setError(result.error || 'Ошибка запуска');
      setStatus('ready');
    } else {
      setStatus('running');
    }
  }

  function getButtonText(): string {
    switch (status) {
      case 'checking': return 'Проверка...';
      case 'downloading': return 'Установка...';
      case 'installing-fabric': return 'Установка Fabric...';
      case 'launching': return 'Запуск...';
      case 'running': return 'Игра запущена';
      case 'ready': return 'Играть';
    }
  }

  function getButtonClass(): string {
    if (status === 'downloading' || status === 'installing-fabric') return 'play-btn installing';
    if (status === 'running') return 'play-btn running';
    return 'play-btn';
  }

  function getButtonIcon() {
    switch (status) {
      case 'checking': return <Loader2 size={20} className="spin" />;
      case 'downloading': return <Download size={20} />;
      case 'installing-fabric': return <Loader2 size={20} className="spin" />;
      case 'launching': return <Loader2 size={20} className="spin" />;
      case 'running': return <Gamepad2 size={20} />;
      default: return <Play size={20} />;
    }
  }

  const isDisabled = status !== 'ready';

  return (
    <div className="home-page">
      <div className="home-bg-glow" />

      <div className="server-info">
        <h2>SP.A</h2>
      </div>

      <div className="play-section">
        <motion.button
          className={getButtonClass()}
          onClick={handlePlay}
          disabled={isDisabled}
          whileHover={!isDisabled ? { scale: 1.05 } : {}}
          whileTap={!isDisabled ? { scale: 0.95 } : {}}
          animate={status === 'ready' ? {
            boxShadow: [
              '0 0 20px rgba(139, 92, 246, 0.4)',
              '0 0 40px rgba(139, 92, 246, 0.6)',
              '0 0 20px rgba(139, 92, 246, 0.4)'
            ]
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {getButtonIcon()}
          <span>{getButtonText()}</span>
        </motion.button>

        {(status === 'downloading' || status === 'installing-fabric') && (
          <div className="progress-container">
            <MCProgressBar
              value={progress.percent}
              max={100}
              type="xp"
              showLabel
              label={progress.status}
              animated
            />
          </div>
        )}

        {error && <div className="play-status" style={{ color: 'var(--danger)' }}>{error}</div>}

        {status === 'ready' && (
          <div className="play-status">Minecraft 1.21.11</div>
        )}
      </div>

      {logs.length > 0 && (
        <div className={`console-panel ${consoleOpen ? '' : 'collapsed'}`}>
          <div className="console-toggle" onClick={() => setConsoleOpen(!consoleOpen)}>
            <span>Консоль ({logs.length} строк)</span>
            <span>{consoleOpen ? '▼' : '▲'}</span>
          </div>
          {consoleOpen && (
            <>
              {logs.map((line, i) => (
                <div key={i} className="log-line">{line}</div>
              ))}
              <div ref={logsEndRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
