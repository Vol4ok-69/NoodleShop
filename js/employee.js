import { GetUserFromBase } from './token.js';

const user = await GetUserFromBase();
if (!user || user.post !== 2 || user.post !==3) {
    Swal.fire({
      icon: 'error',
      title: 'Доступ запрещен',
      text: 'У вас нет прав для доступа'
    }).then(() => { window.location.href = 'index.html'; });
}