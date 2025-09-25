import { db, ref, onValue, update, remove } from '../firebase-config.js';
import { findKeyById } from './utils.js';

let usersData = [];

export function loadUsers() {
  const usersRef = ref(db, 'Users');
  onValue(usersRef, snapshot => {
    const data = snapshot.val();
    usersData = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
    displayUsers(usersData);
  }, (err) => console.error('users onValue error', err));
}

function displayUsers(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">Пользователи не найдены</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr class="border-b">
      <td class="px-4 py-2">${u.id}</td>
      <td class="px-4 py-2">${u.name || ''} ${u.surname || ''}</td>
      <td class="px-4 py-2">${u.login || ''}</td>
      <td class="px-4 py-2">${u.email || ''}</td>
      <td class="px-4 py-2">
        <select class="user-role" data-user-id="${u.id}">
          <option value="1" ${u.post == 1 ? 'selected' : ''}>Пользователь</option>
          <option value="2" ${u.post == 2 ? 'selected' : ''}>Сотрудник</option>
          <option value="3" ${u.post == 3 ? 'selected' : ''}>Администратор</option>
        </select>
      </td>
      <td class="px-4 py-2">${u.date ? new Date(u.date).toLocaleDateString('ru-RU') : ''}</td>
      <td class="px-4 py-2"><button class="delete-user text-red-500" data-user-id="${u.id}">Удалить</button></td>
    </tr>
  `).join('');

  document.querySelectorAll('.user-role').forEach(s => s.addEventListener('change', onRoleChange));
  document.querySelectorAll('.delete-user').forEach(b => b.addEventListener('click', onDeleteUser));
}

async function onRoleChange(e) {
  const userId = e.target.getAttribute('data-user-id');
  const newRole = parseInt(e.target.value);
  try {
    const key = await findKeyById('Users', isNaN(Number(userId)) ? userId : Number(userId));
    if (key === null) throw new Error('Пользователь не найден');
    const userRef = ref(db, `Users/${key}`);
    await update(userRef, { post: newRole });
    Swal.fire({ icon: 'success', title: 'Успех', text: 'Роль пользователя обновлена' });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось обновить роль' });
  }
}

async function onDeleteUser(e) {
  const userId = e.target.getAttribute('data-user-id');
  const res = await Swal.fire({
    title: 'Вы уверены?',
    text: 'Пользователь будет удален безвозвратно',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Да, удалить!'
  });
  if (!res.isConfirmed) return;
  try {
    const key = await findKeyById('Users', isNaN(Number(userId)) ? userId : Number(userId));
    if (key === null) throw new Error('Пользователь не найден');
    const userRef = ref(db, `Users/${key}`);
    await remove(userRef);
    Swal.fire({ icon: 'success', title: 'Удалено', text: 'Пользователь удалён' });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось удалить пользователя' });
  }
}
