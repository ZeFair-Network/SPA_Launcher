import fetch from 'node-fetch';
import { storeGet, storeSet } from '../utils/store';

// TODO: заменить на адрес вашего API-сервера
const API_URL = 'http://93.123.84.190:3000';

interface AuthData {
  username: string;
  uuid: string;
  token: string;
  skinUrl?: string | null;
}

export async function login(username: string, password: string): Promise<AuthData> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка авторизации');
  }

  const authData: AuthData = {
    username: data.username,
    uuid: data.uuid,
    token: data.token,
    skinUrl: data.skinUrl || null,
  };

  storeSet('auth', authData);
  return authData;
}

export async function register(username: string, password: string): Promise<AuthData> {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка регистрации');
  }

  const authData: AuthData = {
    username: data.username,
    uuid: data.uuid,
    token: data.token,
    skinUrl: data.skinUrl || null,
  };

  storeSet('auth', authData);
  return authData;
}

export function getAuth(): AuthData | null {
  return storeGet<AuthData | null>('auth', null);
}

export function logout(): void {
  storeSet('auth', null);
}

export function getApiUrl(): string {
  return API_URL;
}

export async function uploadSkin(skinFilePath: string): Promise<string> {
  const auth = getAuth();
  if (!auth) {
    throw new Error('Необходима авторизация');
  }

  const fs = await import('fs');
  const FormData = (await import('form-data')).default;

  const formData = new FormData();
  formData.append('skin', fs.createReadStream(skinFilePath));

  const response = await fetch(`${API_URL}/api/profile/skin`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
    body: formData as any,
  });

  const data = (await response.json()) as any;

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки скина');
  }

  // Обновляем сохраненные данные
  const updatedAuth = { ...auth, skinUrl: data.skinUrl };
  storeSet('auth', updatedAuth);

  return data.skinUrl;
}

export async function deleteSkin(): Promise<void> {
  const auth = getAuth();
  if (!auth) {
    throw new Error('Необходима авторизация');
  }

  const response = await fetch(`${API_URL}/api/profile/skin`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (!response.ok) {
    const data = (await response.json()) as any;
    throw new Error(data.error || 'Ошибка удаления скина');
  }

  // Обновляем сохраненные данные
  const updatedAuth = { ...auth, skinUrl: null };
  storeSet('auth', updatedAuth);
}
