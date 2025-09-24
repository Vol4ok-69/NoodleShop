import { db, ref, onValue, set, update, remove } from '../firebase-config.js';
import { GetUserFromBase } from '../token.js';

// Глобальные переменные
let currentUser = null;
let dishesData = [];
let usersData = [];

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', async function() {
    // Проверяем права доступа
    const user = await GetUserFromBase();
    
    if (!user || user.post !== 3) {
        Swal.fire({
            icon: 'error',
            title: 'Доступ запрещен',
            text: 'У вас нет прав для доступа к админ-панели'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
    
    currentUser = user;
    
    // Инициализация вкладок
    initTabs();
    
    // Загрузка данных
    loadUsers();
    loadDishes();
    loadStatistics();
    
    // Инициализация модального окна
    initModal();
});

// Инициализация вкладок
function initTabs() {
    const tabs = document.querySelectorAll('[data-tab-target]');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab-target');
            
            // Скрываем все вкладки
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Убираем активный класс со всех кнопок
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Показываем выбранную вкладку
            document.getElementById(`${target}-tab-content`).classList.add('active');
            
            // Добавляем активный класс к кнопке
            tab.classList.add('active');
        });
    });
    
    // Активируем первую вкладку
    if (tabs.length > 0) {
        tabs[0].click();
    }
}

// Загрузка пользователей
function loadUsers() {
    const usersRef = ref(db, 'Users');
    
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        usersData = data ? Object.values(data) : [];
        
        displayUsers(usersData);
    });
}

// Отображение пользователей
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
                <select class="user-role" data-user-id="${user.id}">
                    <option value="1" ${user.post == 1 ? 'selected' : ''}>Пользователь</option>
                    <option value="2" ${user.post == 2 ? 'selected' : ''}>Сотрудник</option>
                    <option value="3" ${user.post == 3 ? 'selected' : ''}>Администратор</option>
                </select>
            </td>
            <td class="px-4 py-2">${new Date(user.date).toLocaleDateString('ru-RU')}</td>
            <td class="px-4 py-2">
                <button class="delete-user text-red-500 hover:text-red-700" data-user-id="${user.id}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Добавляем обработчики событий для изменения ролей
    document.querySelectorAll('.user-role').forEach(select => {
        select.addEventListener('change', function() {
            const userId = this.getAttribute('data-user-id');
            const newRole = parseInt(this.value);
            
            updateUserRole(userId, newRole);
        });
    });
    
    // Добавляем обработчики событий для удаления пользователей
    document.querySelectorAll('.delete-user').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            deleteUser(userId);
        });
    });
}

// Обновление роли пользователя
async function updateUserRole(userId, newRole) {
    try {
        // Находим пользователя в массиве
        const userIndex = usersData.findIndex(u => u.id === parseInt(userId));
        
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }
        
        // Обновляем роль в базе данных
        const userRef = ref(db, `Users/${userIndex}`);
        await update(userRef, { post: parseInt(newRole) });
        
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

// Удаление пользователя
async function deleteUser(userId) {
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
            const userRef = ref(db, `Users/${userId}`);
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

// Загрузка блюд
function loadDishes() {
    const dishesRef = ref(db, 'Dishes');
    
    onValue(dishesRef, (snapshot) => {
        const data = snapshot.val();
        dishesData = data ? Object.values(data) : [];
        
        sortDishes(dishesData);
        updateDishesStatistics(dishesData);
    });
}

// Отображение блюд
/*
function displayDishes(dishes) {
    const tbody = document.getElementById('dishes-table-body');
    
    if (dishes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Блюда не найдены</td></tr>';
        return;
    }
    
    tbody.innerHTML = dishes.map(dish => `
        <tr class="border-b">
            <td class="px-4 py-2">${dish.id}</td>
            <td class="px-4 py-2">${dish.name}</td>
            <td class="px-4 py-2">${dish.category}</td>
            <td class="px-4 py-2">${dish.price}₽</td>
            <td class="px-4 py-2">${dish.purchased || 0}</td>
            <td class="px-4 py-2">
                <button class="edit-dish text-blue-500 hover:text-blue-700 mr-2" data-dish-id="${dish.id}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="delete-dish text-red-500 hover:text-red-700" data-dish-id="${dish.id}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Добавляем обработчики событий для редактирования блюд
    document.querySelectorAll('.edit-dish').forEach(button => {
        button.addEventListener('click', function() {
            const dishId = this.getAttribute('data-dish-id');
            const dish = dishesData.find(d => d.id === dishId);
            
            if (dish) {
                openEditDishModal(dish);
            }
        });
    });
    
    // Добавляем обработчики событий для удаления блюд
    document.querySelectorAll('.delete-dish').forEach(button => {
        button.addEventListener('click', function() {
            const dishId = this.getAttribute('data-dish-id');
            deleteDish(dishId);
        });
    });
}
*/
// Инициализация модального окна
function initModal() {
    const modal = document.getElementById('dish-modal');
    const closeBtn = document.getElementById('close-modal');
    const addBtn = document.getElementById('add-dish-btn');
    const form = document.getElementById('dish-form');
    
    // Открытие модального окна для добавления блюда
    addBtn.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Добавить блюдо';
        document.getElementById('dish-form').reset();
        document.getElementById('dish-id').value = '';

        modal.classList.remove('hidden');
    });
    
    // Закрытие модального окна
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    // Обработка отправки формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dishId = document.getElementById('dish-id').value;
        const dishData = {
            name: document.getElementById('dish-name').value,
            category: document.getElementById('dish-category').value,
            description: document.getElementById('dish-description').value,
            price: parseInt(document.getElementById('dish-price').value),
            image: document.getElementById('dish-image').value || 'https://source.unsplash.com/400x300/?noodles'
        };
        
        if (dishId) {
            // Редактирование существующего блюда
            await updateDish(dishId, dishData);
        } else {
            // Добавление нового блюда
            await addDish(dishData);
        }
        
        modal.classList.add('hidden');
    });
    
    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

// Открытие модального окна для редактирования блюда
function openEditDishModal(dish) {
    document.getElementById('modal-title').textContent = 'Редактировать блюдо';
    document.getElementById('dish-id').value = dish.id;
    document.getElementById('dish-name').value = dish.name;
    document.getElementById('dish-category').value = dish.category;
    document.getElementById('dish-description').value = dish.description;
    document.getElementById('dish-price').value = dish.price;
    document.getElementById('dish-image').value = dish.image || '';
    
    document.getElementById('dish-modal').classList.remove('hidden');
}



// Добавление нового блюда
async function addDish(dishData) {
    try {
        const id = document.getElementById('dish-id').value;
        
        // Проверяем, существует ли уже блюдо с таким ID
        const existingDishIndex = dishesData.findIndex(d => d.id === id);
        if (existingDishIndex !== -1) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Блюдо с таким ID уже существует'
            });
            return;
        }
        
        const dishRef = ref(db, `Dishes/${dishesData.length}`);
        await set(dishRef, {
            id: id,
            ...dishData,
            purchased: 0
        });
        
        Swal.fire({
            icon: 'success',
            title: 'Успех',
            text: 'Блюдо добавлено в меню'
        });
    } catch (error) {
        console.error('Ошибка добавления блюда:', error);
        Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Не удалось добавить блюдо'
        });
    }
}

// Удаление блюда
async function deleteDish(dishId) {
    const result = await Swal.fire({
        title: 'Вы уверены?',
        text: "Блюдо будет удалено из меню",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Да, удалить!',
        cancelButtonText: 'Отмена'
    });
    
    if (result.isConfirmed) {
        try {
            // Находим индекс блюда в массиве
            const dishIndex = dishesData.findIndex(d => d.id === dishId);
            
            if (dishIndex === -1) {
                throw new Error('Блюдо не найдено');
            }
            
            // Удаляем блюдо из базы данных
            const dishRef = ref(db, `Dishes/${dishIndex}`);
            await remove(dishRef);
            
            Swal.fire({
                icon: 'success',
                title: 'Удалено!',
                text: 'Блюдо было удалено из меню'
            });
        } catch (error) {
            console.error('Ошибка удаления блюда:', error);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Не удалось удалить блюдо'
            });
        }
    }
}

// Обновление блюда
async function updateDish(dishId, dishData) {
    try {
        const dishRef = ref(db, `Dishes/${dishId}`);
        await update(dishRef, dishData);
        
        Swal.fire({
            icon: 'success',
            title: 'Успех',
            text: 'Блюдо обновлено'
        });
    } catch (error) {
        console.error('Ошибка обновления блюда:', error);
        Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Не удалось обновить блюдо'
        });
    }
}

// Загрузка статистики
function loadStatistics() {
    const usersRef = ref(db, 'Users');
    const dishesRef = ref(db, 'Dishes');
    
    // Загрузка количества пользователей
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const users = data ? Object.values(data) : [];
        document.getElementById('total-users').textContent = users.length;
    });
    
    // Загрузка количества блюд и продаж
    onValue(dishesRef, (snapshot) => {
        const data = snapshot.val();
        const dishes = data ? Object.values(data) : [];
        
        document.getElementById('total-dishes').textContent = dishes.length;
        
        // Расчет общей суммы продаж
        const totalSales = dishes.reduce((sum, dish) => {
            return sum + (dish.price * (dish.purchased || 0));
        }, 0);
        
        document.getElementById('total-sales').textContent = `${totalSales}₽`;
        
        // Обновление популярных блюд
        updatePopularDishes(dishes);
    });
}

// Обновление статистики блюд
function updateDishesStatistics(dishes) {
    document.getElementById('total-dishes').textContent = dishes.length;
    
    const totalSales = dishes.reduce((sum, dish) => {
        return sum + (dish.price * (dish.purchased || 0));
    }, 0);
    
    document.getElementById('total-sales').textContent = `${totalSales}₽`;
    
    updatePopularDishes(dishes);
}

// Обновление списка популярных блюд
function updatePopularDishes(dishes) {
    const popularDishesContainer = document.getElementById('popular-dishes');
    
    // Сортируем блюда по количеству продаж
    const popularDishes = [...dishes]
        .sort((a, b) => (b.purchased || 0) - (a.purchased || 0))
        .slice(0, 5);
    
    if (popularDishes.length === 0) {
        popularDishesContainer.innerHTML = '<p class="text-gray-500">Нет данных о продажах</p>';
        return;
    }
    
    popularDishesContainer.innerHTML = popularDishes.map(dish => `
        <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>${dish.name}</span>
            <span class="font-semibold">${dish.purchased || 0} продаж</span>
        </div>
    `).join('');
}

// Переменные для сортировки
let sortField = 'name';
let sortDirection = 'asc';

// Функция сортировки блюд
function sortDishes(field) {
    if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortField = field;
        sortDirection = 'asc';
    }
    
    dishesData.sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];
        
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    displayDishes(dishesData);
}

// Обновите заголовки таблицы для поддержки сортировки
function displayDishes(dishes) {
    const tbody = document.getElementById('dishes-table-body');
    
    if (dishes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Блюда не найдены</td></tr>';
        return;
    }
    
    tbody.innerHTML = `
        <tr class="border-b">
            <th class="px-4 py-2 cursor-pointer" onclick="sortDishes('id')">ID ↗</th>
            <th class="px-4 py-2 cursor-pointer" onclick="sortDishes('name')">Название ↗</th>
            <th class="px-4 py-2 cursor-pointer" onclick="sortDishes('category')">Категория ↗</th>
            <th class="px-4 py-2 cursor-pointer" onclick="sortDishes('price')">Цена ↗</th>
            <th class="px-4 py-2 cursor-pointer" onclick="sortDishes('purchased')">Продано ↗</th>
            <th class="px-4 py-2">Действия</th>
        </tr>
        ${dishes.map(dish => `
            <tr class="border-b">
                <td class="px-4 py-2">${dish.id}</td>
                <td class="px-4 py-2">${dish.name}</td>
                <td class="px-4 py-2">${dish.category}</td>
                <td class="px-4 py-2">${dish.price}₽</td>
                <td class="px-4 py-2">${dish.purchased || 0}</td>
                <td class="px-4 py-2">
                    <button class="edit-dish text-blue-500 hover:text-blue-700 mr-2" data-dish-id="${dish.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button class="delete-dish text-red-500 hover:text-red-700" data-dish-id="${dish.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('')}
    `;
    
    // Добавляем обработчики событий
    addDishEventListeners();
}