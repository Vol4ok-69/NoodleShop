import { GetUserFromBase } from '../token.js';

export async function ensureAdmin() {
  const user = await GetUserFromBase();
  if (!user || user.post !== 3) {
    Swal.fire({
      icon: 'error',
      title: 'Доступ запрещен',
      text: 'У вас нет прав для доступа к админ-панели'
    }).then(() => { window.location.href = 'index.html'; });
    throw new Error('not admin');
  }
  return user;
}
