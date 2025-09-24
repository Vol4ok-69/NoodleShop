import { db, ref, onValue, update, remove } from './firebase-config.js';

let usersData = [];

export function loadUsers() {
    const usersRef = ref(db, 'Users');
    
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        usersData = data ? Object.entries(data).map(([key, value]) => ({ key, ...value })) : [];
        displayUsers(usersData);
    });
}

function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Пользователи не найдены</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr class="border-b">
            <td class="px-4 py-2">${user.id}</td>
            <td class="px-4 py-2">${user.name} ${user.surname}</td>
            <td class="px-4 py-2">${user.login}</td>
            <td class="px-4 py-2">${user.email}</td>
            <td class="px-4 py-2">
                <select class="user-role" data-user-key="${user.key}">
                    <option value="1" ${user.post == 1 ? 'selected' : ''}>Пользователь</option>
                    <option value="2" ${user.post == 2 ? 'selected' : ''}>Сотрудник</option>
                    <option value="3" ${user.post == 3 ? 'selected' : ''}>Администратор</option>
                </select>
            </td>
            <td class="px-4 py-2">${new Date(user.date).toLocaleDateString('ru-RU')}</td>
            <td class="px-4 py-2">
                <button class="delete-user text-red-500 hover:text-red-700" data-user-key="${user.key}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.user-role').forEach(select => {
        select.addEventListener('change', function() {
            const userKey = this.getAttribute('data-user-key');
            const newRole = parseInt(this.value);
            updateUserRole(userKey, newRole);
        });
    });
    
    document.querySelectorAll('.delete-user').forEach(button => {
        button.addEventListener('click', function() {
            const userKey = this.getAttribute('data-user-key');
            deleteUser(userKey);
        });
    });
}

async function updateUserRole(userKey, newRole) {
    try {
        const userRef = ref(db, `Users/${userKey}`);
        await update(userRef, { post: newRole });
        
        Swal.fire({
            icon: 'success',
            title: 'Успех',
            text: 'Роль пользователя обновлена'
        });
    } catch (error) {
        console.error('Ошибка обновления роли:', error);
        Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Не удалось обновить роль пользователя'
        });
    }
}

async function deleteUser(userKey) {
    const result = await Swal.fire({
        title: 'Вы уверены?',
        text: "Пользователь будет удален безвозвратно",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Да, удалить!',
        cancelButtonText: 'Отмена'
    });
    
    if (result.isConfirmed) {
        try {
            const userRef = ref(db, `Users/${userKey}`);
            await remove(userRef);
            
            Swal.fire({
                icon: 'success',
                title: 'Удалено!',
                text: 'Пользователь был удален'
            });
        } catch (error) {
            console.error('Ошибка удаления пользователя:', error);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Не удалось удалить пользователя'
            });
        }
    }
}