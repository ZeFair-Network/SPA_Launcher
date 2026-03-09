import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, RefreshCw, Newspaper } from 'lucide-react';

// Парсит body: JSON-массив блоков или plain-text (legacy)
function parseBlocks(body: string): NewsBlockType[] {
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) return parsed as NewsBlockType[];
  } catch {}
  return body ? [{ type: 'paragraph', content: body }] : [];
}

// Извлекает первый текст для превью в карточке
function previewText(body: string): string {
  const blocks = parseBlocks(body);
  const first = blocks.find(b => (b.type === 'paragraph' || b.type === 'heading') && b.content);
  return first && (first.type === 'paragraph' || first.type === 'heading')
    ? first.content.slice(0, 200)
    : '';
}

// Рендерит блок в полноэкранном просмотре
function Block({ block, idx }: { block: NewsBlockType; idx: number }) {
  if (block.type === 'heading') {
    return <h3 key={idx} className="news-block-heading">{block.content}</h3>;
  }
  if (block.type === 'image') {
    return (
      <figure key={idx} className="news-block-figure">
        <img src={block.url} alt={block.caption || ''} />
        {block.caption && <figcaption className="news-block-caption">{block.caption}</figcaption>}
      </figure>
    );
  }
  // paragraph (default)
  return <p key={idx} className="news-block-paragraph">{block.content}</p>;
}

export default function NewsPage() {
  const [news, setNews]       = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
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

  useEffect(() => { fetchNews(); }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="news-page">
      <div className="news-header">
        <h2>Новости</h2>
        <button className="news-refresh-btn" onClick={fetchNews} disabled={loading} title="Обновить">
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
              {/* Обложка */}
              {item.cover_image && (
                <img className="news-card-cover" src={item.cover_image} alt={item.title} />
              )}

              <div className="news-date">
                <Calendar size={11} />
                {formatDate(item.created_at)}
              </div>
              <div className="news-title">{item.title}</div>

              {previewText(item.body) && (
                <div className="news-body news-body-clamp">{previewText(item.body)}</div>
              )}

              <div className="news-read-more">Читать далее →</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Полноэкранный просмотр */}
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
              <button className="news-modal-close" onClick={() => setSelected(null)} title="Закрыть">
                <X size={18} />
              </button>

              {/* Обложка статьи */}
              {selected.cover_image && (
                <img className="news-modal-cover" src={selected.cover_image} alt={selected.title} />
              )}

              <div className="news-modal-date">
                <Calendar size={13} />
                {formatDate(selected.created_at)}
              </div>

              <h2 className="news-modal-title">{selected.title}</h2>

              {/* Блоки содержимого */}
              <div className="news-blocks">
                {parseBlocks(selected.body).map((block, i) => (
                  <Block key={i} block={block} idx={i} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
