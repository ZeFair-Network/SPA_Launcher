import React from 'react';

const NEWS = [
  {
    date: '2025-01-15',
    title: 'Добро пожаловать на SP.A!',
    body: 'Мы рады приветствовать вас на нашем сервере! SP.A — это Fabric-сервер на Minecraft 1.21.1. Присоединяйтесь к нам и получайте удовольствие от игры!',
  },
  {
    date: '2025-01-10',
    title: 'Лаунчер обновлён',
    body: 'Наш лаунчер получил обновление! Теперь он автоматически скачивает Minecraft и Fabric, управляет модами и настройками Java. Нажмите "Играть" и наслаждайтесь!',
  },
  {
    date: '2025-01-05',
    title: 'Правила сервера',
    body: 'Пожалуйста, соблюдайте правила сервера: не используйте читы, уважайте других игроков, не гриферьте. За нарушение правил — бан.',
  },
];

export default function NewsPage() {
  return (
    <div className="news-page">
      <h2>Новости</h2>

      <div className="news-list">
        {NEWS.map((item, i) => (
          <div key={i} className="news-card">
            <div className="news-date">{item.date}</div>
            <div className="news-title">{item.title}</div>
            <div className="news-body">{item.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
