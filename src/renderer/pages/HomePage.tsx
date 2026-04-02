import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Loader2, Gamepad2, Clock, Package, MemoryStick } from 'lucide-react';
import { MCProgressBar } from '../components/minecraft';

type Status = 'checking' | 'ready' | 'downloading' | 'installing-fabric' | 'launching' | 'running';

interface Props {
  modsCount?: number;
}

export default function HomePage({ modsCount = 0 }: Props) {
  const [status, setStatus] = useState<Status>('checking');
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [logs, setLogs] = useState<string[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [error, setError] = useState('');
  const [ramGb, setRamGb] = useState(4);
  const [playedMinutes, setPlayedMinutes] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkInstallation();

    // Load played time in minutes (migrate from old hours key if needed)
    let minutes = parseInt(localStorage.getItem('spa-played-minutes') || '', 10);
    if (isNaN(minutes)) {
      const oldHours = parseInt(localStorage.getItem('spa-played-hours') || '0', 10);
      minutes = oldHours * 60;
      localStorage.setItem('spa-played-minutes', String(minutes));
    }
    setPlayedMinutes(minutes);

    // Load RAM setting
    window.api.getSettings().then((s: any) => {
      const maxRam = parseInt(s?.maxRam || '4096', 10);
      setRamGb(Math.round(maxRam / 1024));
    }).catch(() => {});

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

  // Track play time while game is running (stored as minutes)
  useEffect(() => {
    if (status !== 'running') return;
    const start = Date.now();
    const interval = setInterval(() => {
      const addedMin = (Date.now() - start) / 60000;
      const base = parseInt(localStorage.getItem('spa-played-minutes') || '0', 10);
      setPlayedMinutes(Math.floor(base + addedMin));
    }, 60000);
    return () => {
      clearInterval(interval);
      const addedMin = Math.round((Date.now() - start) / 60000);
      if (addedMin > 0) {
        const base = parseInt(localStorage.getItem('spa-played-minutes') || '0', 10);
        const total = base + addedMin;
        localStorage.setItem('spa-played-minutes', String(total));
        setPlayedMinutes(total);
      }
    };
  }, [status]);

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
      setStatus('ready');
    }
  }

  async function handlePlay() {
    setError('');

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

  function formatPlayTime(minutes: number): string {
    if (minutes < 60) return `${minutes}м`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}ч ${m}м` : `${h}ч`;
  }

  function getButtonText(): string {
    switch (status) {
      case 'checking':          return 'Проверка...';
      case 'downloading':       return 'Установка...';
      case 'installing-fabric': return 'Установка Fabric...';
      case 'launching':         return 'Запуск...';
      case 'running':           return 'Игра запущена';
      case 'ready':             return 'Играть';
    }
  }

  function getButtonClass(): string {
    if (status === 'downloading' || status === 'installing-fabric') return 'play-btn installing';
    if (status === 'running') return 'play-btn running';
    return 'play-btn';
  }

  function getButtonIcon() {
    switch (status) {
      case 'checking':          return <Loader2 size={22} className="spin" />;
      case 'downloading':       return <Download size={22} />;
      case 'installing-fabric': return <Loader2 size={22} className="spin" />;
      case 'launching':         return <Loader2 size={22} className="spin" />;
      case 'running':           return <Gamepad2 size={22} />;
      default:                  return <Play size={22} />;
    }
  }

  const isDisabled = status !== 'ready';

  return (
    <div className="home-page">
      <div className="home-bg-glow" />

      {/* Title */}
      <div className="server-info">
        <h2>SP.A</h2>
        <p className="server-version">Minecraft 1.21.11 · Fabric</p>
      </div>

      {/* Play button */}
      <div className="play-section">
        <motion.button
          className={getButtonClass()}
          onClick={handlePlay}
          disabled={isDisabled}
          whileHover={!isDisabled ? { scale: 1.05 } : {}}
          whileTap={!isDisabled ? { scale: 0.95 } : {}}
          animate={status === 'ready' ? {
            boxShadow: [
              'var(--shadow-glow)',
              'var(--shadow-glow-lg)',
              'var(--shadow-glow)',
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

        {error && (
          <div className="play-status" style={{ color: 'var(--danger)' }}>{error}</div>
        )}
      </div>

      {/* Stats cards */}
      <div className="home-stats">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Clock size={16} className="stat-icon" />
          <div className="stat-value">{formatPlayTime(playedMinutes)}</div>
          <div className="stat-label">Время в игре</div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Package size={16} className="stat-icon" />
          <div className="stat-value">{modsCount}</div>
          <div className="stat-label">Активных модов</div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MemoryStick size={16} className="stat-icon" />
          <div className="stat-value">{ramGb} ГБ</div>
          <div className="stat-label">Оперативная память</div>
        </motion.div>
      </div>

      {/* Console */}
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
