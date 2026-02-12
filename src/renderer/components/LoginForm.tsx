import React, { useState } from 'react';

interface Props {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export default function LoginForm({ onLogin, onRegister }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== passwordConfirm) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    const result = isRegister
      ? await onRegister(username, password)
      : await onLogin(username, password);

    if (!result.success) {
      setError(result.error || 'Ошибка');
    }
    setLoading(false);
  };

  const canSubmit = username.trim() && password && (!isRegister || passwordConfirm);

  return (
    <div className="login-overlay">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>SP.A</h2>
        <p>{isRegister ? 'Создайте аккаунт' : 'Войдите, чтобы начать играть'}</p>

        <div className="input-group">
          <label>Никнейм</label>
          <input
            type="text"
            placeholder="Введите ваш никнейм..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
            autoFocus
          />
        </div>

        <div className="input-group">
          <label>Пароль</label>
          <input
            type="password"
            placeholder="Введите пароль..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isRegister && (
          <div className="input-group">
            <label>Подтвердите пароль</label>
            <input
              type="password"
              placeholder="Повторите пароль..."
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="submit" disabled={loading || !canSubmit}>
          {loading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>

        <button
          type="button"
          className="logout-btn"
          style={{ textAlign: 'center', width: '100%' }}
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
        >
          {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
}
