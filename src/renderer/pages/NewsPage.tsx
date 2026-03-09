import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, RefreshCw, Newspaper } from 'lucide-react';

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.getNews();
      if (result.success) {
        setNews(result.data || []);
      } else {
        setError(result.error || 'Ошибка загрузки новостей');
      }
    } catch {
      setError('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="news-page">
      <div className="news-header">
        <h2>Новости</h2>
        <button
          className="news-refresh-btn"
          onClick={fetchNews}
          disabled={loading}
          title="Обновить"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {loading && (
        <div className="news-loading">
          <RefreshCw size={28} className="spin" />
          <p>Загрузка новостей...</p>
        </div>
      )}

      {!loading && error && (
        <div className="news-error glass-card">
          <p>{error}</p>
          <button className="mod-btn" onClick={fetchNews}>Повторить</button>
        </div>
      )}

      {!loading && !error && news.length === 0 && (
        <div className="news-empty">
          <Newspaper size={40} strokeWidth={1.2} />
          <p>Новостей пока нет</p>
        </div>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="news-list">
          {news.map((item) => (
            <motion.div
              key={item.id}
              className="news-card glass-card"
              onClick={() => setSelected(item)}
              whileHover={{ y: -3, boxShadow: '0 0 20px rgba(139,92,246,0.35)' }}
              whileTap={{ scale: 0.98 }}
              style={{ cursor: 'pointer' }}
            >
              <div className="news-date">
                <Calendar size={11} />
                {formatDate(item.created_at)}
              </div>
              <div className="news-title">{item.title}</div>
              <div className="news-body news-body-clamp">{item.body}</div>
              <div className="news-read-more">Читать далее →</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Полноэкранный просмотр новости */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="news-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              className="news-modal"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="news-modal-close"
                onClick={() => setSelected(null)}
                title="Закрыть"
              >
                <X size={18} />
              </button>

              <div className="news-modal-date">
                <Calendar size={13} />
                {formatDate(selected.created_at)}
              </div>

              <h2 className="news-modal-title">{selected.title}</h2>

              {selected.image_url && (
                <img
                  className="news-modal-image"
                  src={selected.image_url}
                  alt={selected.title}
                />
              )}

              <div className="news-modal-body">{selected.body}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
