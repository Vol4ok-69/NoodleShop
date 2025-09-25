import { db, ref, get, update, set } from './firebase-config.js';
import { isEmail, isPhoneNumber, GetHash } from './registration.js';
import { GetUserFromToken, GetUserFromBase } from './token.js';

let userData = null;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
});

async function loadUserData() {
  const token = localStorage.getItem('token');
  const accountInfo = document.getElementById('account-info');

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {
    const payload = GetUserFromToken();
    if (!payload) throw new Error('Invalid token');
    
    currentUserId = parseInt(payload.userId);

    userData = await GetUserFromBase();
    
    if (!userData) {
      accountInfo.innerHTML = `<p class="text-red-500">Пользователь не найден</p>`;
      return;
    }

    displayUserData(userData);
  } catch (err) {
    console.error('Ошибка загрузки данных или декодирования токена:', err);
    localStorage.removeItem('token');
    window.location.href = 'authentication.html';
  }
}

function displayUserData(user) {
  const accountInfo = document.getElementById('account-info');

  accountInfo.innerHTML = `
    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-4">Личная информация</h2>

      <div class="flex items-center gap-6 mb-6">
        <div id="profile-avatar" class="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold overflow-hidden"
             style="${user.avatar ? `background-image: url('${user.avatar}'); background-size: cover; background-position: center;` : '' }">
          ${!user.avatar ? (user.name ? user.name[0] + (user.surname ? user.surname[0] : '') : '') : ''}
        </div>

        <div class="flex flex-col">
          <div class="flex gap-2">
            <button id="change-avatar-btn" class="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Изменить фото</button>
            <button id="remove-avatar-btn" class="px-3 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">${user.avatar ? 'Удалить фото' : 'Сбросить'}</button>
          </div>
          <small class="text-gray-500 mt-2">Поддерживается: JPG/PNG/WebP. Максимум ~2 МБ.</small>
        </div>

        <input type="file" id="avatar-input" accept="image/*" class="hidden">
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${renderField('Имя', 'name', user.name)}
        ${renderField('Фамилия', 'surname', user.surname)}
        ${renderField('Логин', 'login', user.login)}
        ${renderField('Email', 'email', user.email)}
        ${renderField('Телефон', 'phone', user.phone)}
        <div class="mb-4">
          <label class="block text-gray-600 mb-1">Дата регистрации</label>
          <p class="font-semibold">${user.date ? new Date(user.date).toLocaleDateString('ru-RU') : 'Не указано'}</p>
        </div>
      </div>
    </div>

    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-4">Смена пароля</h2>
      <form id="password-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="mb-4">
          <label class="block text-gray-600 mb-1">Текущий пароль</label>
          <input type="password" id="current-password" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-600 mb-1">Новый пароль</label>
          <input type="password" id="new-password" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div class="mb-4">
          <label class="block text-gray-600 mb-1">Подтвердите новый пароль</label>
          <input type="password" id="confirm-password" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
        </div>
        <div class="mb-4 flex items-end">
          <button type="button" id="change-password-btn" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Сменить пароль</button>
        </div>
      </form>
    </div>

    <div>
      <h2 class="text-2xl font-bold mb-4">История заказов</h2>
      <p class="text-gray-600">Здесь будет история ваших заказов</p>
    </div>
  `;

  const avatarInput = document.getElementById('avatar-input');
  const changeBtn = document.getElementById('change-avatar-btn');
  const removeBtn = document.getElementById('remove-avatar-btn');

  changeBtn.addEventListener('click', () => avatarInput.click());
  avatarInput.addEventListener('change', onAvatarSelected);
  removeBtn.addEventListener('click', onRemoveAvatar);

  document.getElementById('change-password-btn').addEventListener('click', changePassword);
}

function renderField(label, field, value) {
  const safeVal = value || '';
  return `
    <div class="mb-4">
      <label class="block text-gray-600 mb-1">${label}</label>
      <p class="font-semibold view-field" id="${field}-view">${safeVal || 'Не указано'}</p>

      <div class="edit-field hidden flex items-center gap-2 mt-2" id="${field}-edit-block">
        <input type="${field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}"
               id="${field}-edit"
               value="${safeVal}"
               class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        <button type="button" class="ml-2 px-3 py-2 bg-blue-500 text-white rounded-md" onclick="saveField('${field}')">✓</button>
        <button type="button" class="ml-1 px-3 py-2 bg-gray-500 text-white rounded-md" onclick="cancelEdit('${field}')">✗</button>
      </div>

      <button type="button" class="mt-1 text-blue-500 text-sm" id="${field}-edit-btn" onclick="enableEdit('${field}')">Изменить</button>
    </div>
  `;
}

async function updateUserInDB(updatedFields) {
  const usersRef = ref(db, 'Users');
  const snapshot = await get(usersRef);
  const usersVal = snapshot.val();

  if (!usersVal) {
    throw new Error('Users не найдены в БД');
  }

  if (Array.isArray(usersVal)) {
    const idx = usersVal.findIndex(u => u && u.id === currentUserId);
    if (idx === -1) throw new Error('Пользователь не найден (массив).');

    usersVal[idx] = { ...usersVal[idx], ...updatedFields };

    await set(usersRef, usersVal);
  } else {
    const key = Object.keys(usersVal).find(k => usersVal[k] && usersVal[k].id === currentUserId);
    if (!key) throw new Error('Пользователь не найден (объект).');

    const userRef = ref(db, `Users/${key}`);
    await update(userRef, updatedFields);
  }
}

window.enableEdit = function(field) {
  const view = document.getElementById(`${field}-view`);
  const editBlock = document.getElementById(`${field}-edit-block`);
  const editBtn = document.getElementById(`${field}-edit-btn`);
  if (view) view.classList.add('hidden');
  if (editBlock) editBlock.classList.remove('hidden');
  if (editBtn) editBtn.classList.add('hidden');
  const input = document.getElementById(`${field}-edit`);
  if (input) input.focus();
};

window.cancelEdit = function(field) {
  const view = document.getElementById(`${field}-view`);
  const editBlock = document.getElementById(`${field}-edit-block`);
  const editBtn = document.getElementById(`${field}-edit-btn`);
  if (view) view.classList.remove('hidden');
  if (editBlock) editBlock.classList.add('hidden');
  if (editBtn) editBtn.classList.remove('hidden');
  const input = document.getElementById(`${field}-edit`);
  if (input) input.value = userData[field] || '';
};

window.saveField = async function(field) {
  const input = document.getElementById(`${field}-edit`);
  if (!input) return;
  const newValue = input.value.trim();
  const oldValue = userData[field] || '';

  if (newValue === oldValue) {
    cancelEdit(field);
    return;
  }

  const usersSnapshot = await get(ref(db, 'Users'));
  const usersVal = usersSnapshot.val();
  let usersList = [];
  if (usersVal) usersList = Array.isArray(usersVal) ? usersVal.filter(Boolean) : Object.values(usersVal);

  if (['email', 'login', 'phone'].includes(field)) {
    const exists = usersList.some(u => u && u.id !== currentUserId && u[field] === newValue);
    if (exists) {
      Swal.fire({ icon: 'error', title: 'Ошибка', text: (field === 'email' ? 'Email' : field === 'login' ? 'Логин' : 'Телефон') + ' уже используется' });
      return;
    }
  }

  if (field === 'email' && !isEmail(newValue)) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Введите корректный email' });
    return;
  }
  if (field === 'phone' && !isPhoneNumber(newValue)) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Введите корректный номер телефона' });
    return;
  }

  try {
    await updateUserInDB({ [field]: newValue });
    userData[field] = newValue;
    const view = document.getElementById(`${field}-view`);
    if (view) view.textContent = newValue || 'Не указано';
    cancelEdit(field);
    await Swal.fire({ icon: 'success', title: 'Успех', text: 'Данные успешно обновлены' });
    window.location.reload();
  } catch (err) {
    console.error('Ошибка сохранения поля:', err);
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось обновить данные' });
  }
};


window.changePassword = async function() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!currentPassword || !newPassword || !confirmPassword) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Заполните все поля' });
    return;
  }
  if (newPassword !== confirmPassword) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Пароли не совпадают' });
    return;
  }

  const currentHash = GetHash(currentPassword);
  if (currentHash !== userData.hash_password) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Текущий пароль неверен' });
    return;
  }

  try {
    const newHash = GetHash(newPassword);
    await updateUserInDB({ hash_password: newHash });
    userData.hash_password = newHash;
    document.getElementById('password-form')?.reset();
    await Swal.fire({ icon: 'success', title: 'Успех', text: 'Пароль успешно изменен' });
    window.location.reload();
  } catch (err) {
    console.error('Ошибка смены пароля:', err);
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось изменить пароль' });
  }
};

async function onAvatarSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const allowed = ['image/jpeg','image/png','image/webp'];
  if (!allowed.includes(file.type)) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Поддерживаются JPG/PNG/WebP' });
    e.target.value = '';
    return;
  }

  const changeBtn = document.getElementById('change-avatar-btn');
  const prevText = changeBtn ? changeBtn.textContent : null;
  if (changeBtn) { changeBtn.disabled = true; changeBtn.textContent = 'Обработка...'; }

  try {
    const dataUrl = await fileToResizedDataUrl(file, 200, 200, 0.4);

    await updateUserInDB({ avatar: dataUrl });

    userData.avatar = dataUrl;
    applyAvatarToUI(dataUrl);

    await Swal.fire({ icon: 'success', title: 'Готово', text: 'Аватар сохранён (сжатый)' });
    window.location.reload();
    document.getElementById('remove-avatar-btn').textContent = 'Удалить фото';
  } catch (err) {
    console.error('Ошибка обработки аватара:', err);
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось загрузить изображение' });
  } finally {
    if (changeBtn) { changeBtn.disabled = false; changeBtn.textContent = prevText; }
    e.target.value = '';
  }
}

function fileToResizedDataUrl(file, maxW, maxH, quality=0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxW / width, maxH / height, 1);
      const nw = Math.round(width * ratio);
      const nh = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, nw, nh);

      const canUseWebP = (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
      const mime = canUseWebP ? 'image/webp' : 'image/jpeg';

      const dataUrl = canvas.toDataURL(mime, quality);
      resolve(dataUrl);
    };
    img.onerror = e => reject(e);

    const fr = new FileReader();
    fr.onload = () => { img.src = fr.result; };
    fr.onerror = e => reject(e);
    fr.readAsDataURL(file);
  });
}

async function onRemoveAvatar() {
  const res = await Swal.fire({
    title: 'Удалить фото?',
    text: 'Фотография будет удалена из профиля',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Удалить',
    cancelButtonText: 'Отмена'
  });

  if (!res.isConfirmed) return;

  try {
    await updateUserInDB({ avatar: null });
    userData.avatar = null;
    const profileAvatar = document.getElementById('profile-avatar');
    if (profileAvatar) {
      profileAvatar.style.backgroundImage = '';
      profileAvatar.textContent = userData.name ? (userData.name[0] + (userData.surname ? userData.surname[0] : '')) : '';
    }
    const headerAvatar = document.getElementById('user-avatar');
    if (headerAvatar) {
      headerAvatar.style.backgroundImage = '';
      headerAvatar.textContent = userData.name ? (userData.name[0] + (userData.surname ? userData.surname[0] : '')) : '';
    }
    document.getElementById('remove-avatar-btn').textContent = 'Сбросить';
    await Swal.fire({ icon: 'success', title: 'Готово', text: 'Фото удалено' });
    window.location.reload();
  } catch (err) {
    console.error('Ошибка удаления аватара:', err);
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось удалить фото' });
  }
}

function resizeImageFileToBlob(file, maxW, maxH, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxW / width, maxH / height, 1);
      const nw = Math.round(width * ratio);
      const nh = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, nw, nh);

      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('toBlob вернул null')); return; }
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    img.onerror = (e) => reject(e);

    const fr = new FileReader();
    fr.onload = () => { img.src = fr.result; };
    fr.onerror = (e) => reject(e);
    fr.readAsDataURL(file);
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = (e) => reject(e);
    fr.readAsDataURL(blob);
  });
}

function applyAvatarToUI(urlOrDataUrl) {
  const profileAvatar = document.getElementById('profile-avatar');
  if (profileAvatar) {
    profileAvatar.style.backgroundImage = `url('${urlOrDataUrl}')`;
    profileAvatar.textContent = '';
    profileAvatar.style.backgroundSize = 'cover';
    profileAvatar.style.backgroundPosition = 'center';
  }
  const headerAvatar = document.getElementById('user-avatar');
  if (headerAvatar) {
    headerAvatar.style.backgroundImage = `url('${urlOrDataUrl}')`;
    headerAvatar.textContent = '';
    headerAvatar.style.backgroundSize = 'cover';
    headerAvatar.style.backgroundPosition = 'center';
  }
}