import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ArrowLeft, ThumbsUp, MessageSquare, Pin, RefreshCw } from 'lucide-react';
import './ForumPage.css';

type Category = 'all' | 'general' | 'bugs' | 'ideas';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',     label: 'Все' },
  { id: 'general', label: 'Общее' },
  { id: 'bugs',    label: 'Баги' },
  { id: 'ideas',   label: 'Идеи' },
];

const TAG_CONFIG: Record<Exclude<Category, 'all'>, { label: string; cls: string }> = {
  general: { label: 'Общее', cls: 'forum-tag--general' },
  bugs:    { label: 'Баг',   cls: 'forum-tag--bug' },
  ideas:   { label: 'Идея',  cls: 'forum-tag--idea' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

function UserAvatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <div
      className="forum-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
    >
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

export default function ForumPage() {
  const [category, setCategory]       = useState<Category>('all');
  const [topics, setTopics]           = useState<ForumTopic[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const [selected, setSelected]       = useState<ForumTopicDetail | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);

  const [reply, setReply]             = useState('');
  const [replySending, setReplySending] = useState(false);

  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [newTitle, setNewTitle]         = useState('');
  const [newCategory, setNewCategory]   = useState<Exclude<Category, 'all'>>('general');
  const [newBody, setNewBody]           = useState('');
  const [newSending, setNewSending]     = useState(false);
  const [newError, setNewError]         = useState<string | null>(null);

  // ── Load topic list ─────────────────────────────────────────────
  const loadTopics = useCallback(async (cat: Category) => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.api.getForumTopics(cat === 'all' ? undefined : cat);
      if (result.success) {
        setTopics(result.data ?? []);
      } else {
        setError(result.error ?? 'Ошибка загрузки');
      }
    } catch {
      setError('Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTopics(category); }, [category, loadTopics]);

  // ── Open topic ──────────────────────────────────────────────────
  async function openTopic(id: number) {
    setTopicLoading(true);
    setSelected(null);
    const result = await window.api.getForumTopic(id);
    setTopicLoading(false);
    if (result.success && result.data) {
      setSelected(result.data);
      setReply('');
    }
  }

  // ── Toggle like ─────────────────────────────────────────────────
  async function handleLike(topicId: number, e: React.MouseEvent) {
    e.stopPropagation();
    const result = await window.api.toggleForumLike(topicId);
    if (!result.success || !result.data) return;

    const { liked, likes_count } = result.data;
    const update = (t: ForumTopic) =>
      t.id === topicId ? { ...t, liked: liked ? 1 : 0, likes_count } : t;

    setTopics(ts => ts.map(update));
    setSelected(prev => prev?.id === topicId ? { ...prev, liked: liked ? 1 : 0, likes_count } : prev);
  }

  // ── Send reply ──────────────────────────────────────────────────
  async function handleReply() {
    if (!reply.trim() || !selected || replySending) return;
    setReplySending(true);
    const result = await window.api.addForumComment(selected.id, reply.trim());
    setReplySending(false);
    if (result.success && result.data) {
      setSelected(prev => prev ? { ...prev, comments: [...prev.comments, result.data!] } : prev);
      setTopics(ts => ts.map(t => t.id === selected.id ? { ...t, comments_count: t.comments_count + 1 } : t));
      setReply('');
    }
  }

  // ── Create topic ────────────────────────────────────────────────
  async function handleNewTopic() {
    if (!newTitle.trim() || !newBody.trim() || newSending) return;
    setNewSending(true);
    setNewError(null);
    const result = await window.api.createForumTopic({
      title: newTitle.trim(),
      body: newBody.trim(),
      category: newCategory,
    });
    setNewSending(false);
    if (result.success && result.data) {
      setTopics(ts => [result.data!, ...ts]);
      setNewTitle('');
      setNewBody('');
      setNewCategory('general');
      setNewTopicOpen(false);
    } else {
      setNewError(result.error ?? 'Ошибка создания темы');
    }
  }

  return (
    <div className="forum-page">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="forum-header">
        <h2 className="forum-title">Форум</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="forum-refresh-btn"
            onClick={() => loadTopics(category)}
            disabled={loading}
            title="Обновить"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <motion.button
            className="forum-new-btn"
            onClick={() => setNewTopicOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus size={14} />
            Новая тема
          </motion.button>
        </div>
      </div>

      {/* ── Category tabs ───────────────────────────────────────── */}
      <div className="forum-cats">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`biome-tab ${category === cat.id ? 'biome-tab--active' : ''}`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Topic list ──────────────────────────────────────────── */}
      <div className="forum-list">
        {loading && (
          <div className="forum-empty">
            <RefreshCw size={28} className="spin" />
            <p>Загрузка...</p>
          </div>
        )}

        {!loading && error && (
          <div className="forum-error glass-card">
            <p>{error}</p>
            <button className="mod-btn" onClick={() => loadTopics(category)}>Повторить</button>
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="forum-empty">
            <MessageSquare size={36} strokeWidth={1.2} />
            <p>Тем пока нет</p>
          </div>
        )}

        {!loading && !error && topics.map(topic => {
          const tag = TAG_CONFIG[topic.category] ?? TAG_CONFIG.general;
          return (
            <motion.div
              key={topic.id}
              className={`forum-topic-card${topic.pinned ? ' forum-topic-card--pinned' : ''}`}
              onClick={() => openTopic(topic.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="forum-topic-main">
                <div className="forum-topic-meta-top">
                  {!!topic.pinned && (
                    <span className="forum-pin-badge"><Pin size={10} /> Закреплено</span>
                  )}
                  <span className={`forum-tag ${tag.cls}`}>{tag.label}</span>
                </div>
                <div className="forum-topic-title">{topic.title}</div>
                <div className="forum-topic-meta-bottom">
                  <UserAvatar name={topic.author_name} size={18} />
                  <span className="forum-topic-author">{topic.author_name}</span>
                  <span className="forum-topic-dot">·</span>
                  <span className="forum-topic-date">{formatDate(topic.created_at)}</span>
                </div>
              </div>

              <div className="forum-topic-stats">
                <button
                  className={`forum-stat-btn${topic.liked ? ' forum-stat-btn--liked' : ''}`}
                  onClick={e => handleLike(topic.id, e)}
                  title="Нравится"
                >
                  <ThumbsUp size={12} />
                  {topic.likes_count}
                </button>
                <div className="forum-stat-btn forum-stat-btn--passive" title="Ответы">
                  <MessageSquare size={12} />
                  {topic.comments_count}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Topic loading spinner ────────────────────────────────── */}
      <AnimatePresence>
        {topicLoading && (
          <motion.div
            className="forum-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <RefreshCw size={20} className="spin" /> Загрузка темы...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Topic view modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (() => {
          const tag = TAG_CONFIG[selected.category] ?? TAG_CONFIG.general;
          return (
            <motion.div
              className="forum-modal-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSelected(null)}
            >
              <motion.div
                className="forum-modal"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="forum-modal-header">
                  <button className="forum-modal-back" onClick={() => setSelected(null)}>
                    <ArrowLeft size={14} /> Назад
                  </button>
                  <button className="news-modal-close" onClick={() => setSelected(null)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="forum-modal-tags">
                  <span className={`forum-tag ${tag.cls}`}>{tag.label}</span>
                  {!!selected.pinned && (
                    <span className="forum-pin-badge"><Pin size={10} /> Закреплено</span>
                  )}
                </div>

                <h2 className="forum-modal-title">{selected.title}</h2>

                <div className="forum-modal-author-row">
                  <UserAvatar name={selected.author_name} size={26} />
                  <span className="forum-modal-author">{selected.author_name}</span>
                  <span className="forum-topic-dot">·</span>
                  <span className="forum-modal-date">{formatDate(selected.created_at)}</span>
                  <button
                    className={`forum-like-btn${selected.liked ? ' forum-like-btn--liked' : ''}`}
                    onClick={e => handleLike(selected.id, e)}
                  >
                    <ThumbsUp size={13} /> {selected.likes_count}
                  </button>
                </div>

                <p className="forum-modal-body">{selected.body}</p>

                {selected.comments.length > 0 && (
                  <div className="forum-comments">
                    <div className="forum-comments-title">
                      {selected.comments.length}&nbsp;
                      {selected.comments.length === 1 ? 'ответ' : 'ответа'}
                    </div>
                    {selected.comments.map(c => (
                      <div key={c.id} className="forum-comment">
                        <UserAvatar name={c.author_name} size={28} />
                        <div className="forum-comment-content">
                          <div className="forum-comment-header">
                            <span className="forum-comment-author">{c.author_name}</span>
                            <span className="forum-comment-date">{formatDate(c.created_at)}</span>
                          </div>
                          <p className="forum-comment-body">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="forum-reply">
                  <textarea
                    className="forum-reply-input"
                    placeholder="Написать ответ..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    rows={3}
                    disabled={replySending}
                  />
                  <motion.button
                    className="forum-reply-btn"
                    onClick={handleReply}
                    disabled={!reply.trim() || replySending}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {replySending ? 'Отправка...' : 'Отправить'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── New topic modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {newTopicOpen && (
          <motion.div
            className="forum-modal-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setNewTopicOpen(false)}
          >
            <motion.div
              className="forum-modal forum-modal--new"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="forum-modal-header">
                <h3 className="forum-modal-new-title">Новая тема</h3>
                <button className="news-modal-close" onClick={() => setNewTopicOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="forum-new-form">
                <div className="input-group">
                  <label>Заголовок</label>
                  <input
                    type="text"
                    placeholder="Краткий заголовок темы"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    disabled={newSending}
                  />
                </div>

                <div>
                  <label className="forum-new-cat-label">Раздел</label>
                  <div className="forum-new-cats">
                    {(CATEGORIES.filter(c => c.id !== 'all') as { id: Exclude<Category, 'all'>; label: string }[]).map(cat => (
                      <button
                        key={cat.id}
                        className={`biome-tab ${newCategory === cat.id ? 'biome-tab--active' : ''}`}
                        onClick={() => setNewCategory(cat.id)}
                        disabled={newSending}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label>Текст</label>
                  <textarea
                    className="forum-reply-input"
                    placeholder="Опиши суть темы..."
                    value={newBody}
                    onChange={e => setNewBody(e.target.value)}
                    rows={6}
                    disabled={newSending}
                  />
                </div>

                {newError && <p className="forum-new-error">{newError}</p>}

                <motion.button
                  className="forum-reply-btn"
                  onClick={handleNewTopic}
                  disabled={!newTitle.trim() || !newBody.trim() || newSending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{ alignSelf: 'flex-end' }}
                >
                  {newSending ? 'Создание...' : 'Создать тему'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
