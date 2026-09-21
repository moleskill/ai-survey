// Обёртка над fetch для страниц админки (выполняется в браузере).
// Если сессия закончилась, отправляет на страницу входа.

export async function adminFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.assign('/admin');
    throw new Error('Нужно войти заново');
  }
  if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось выполнить запрос');
  return data;
}

export const jsonRequest = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
