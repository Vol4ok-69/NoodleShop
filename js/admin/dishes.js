import { db, ref, onValue, set, update, remove } from './firebase-config.js';

let dishesData = [];
let sortField = 'name';
let sortDirection = 'asc';

export function loadDishes() {
    const dishesRef = ref(db, 'Dishes');
    
    onValue(dishesRef, (snapshot) => {
        const data = snapshot.val();
        dishesData = data ? Object.entries(data).map(([key, value]) => ({ key, ...value })) : [];
        sortDishes('name');
    });
}

export function sortDishes(field) {
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
                <button class="edit-dish text-blue-500 hover:text-blue-700 mr-2" data-dish-key="${dish.key}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="delete-dish text-red-500 hover:text-red-700" data-dish-key="${dish.key}">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    addDishEventListeners();
}

function addDishEventListeners() {
    document.querySelectorAll('.edit-dish').forEach(button => {
        button.addEventListener('click', function() {
            const dishKey = this.getAttribute('data-dish-key');
            const dish = dishesData.find(d => d.key === dishKey);
            
            if (dish) {
                window.openEditDishModal(dish);
            }
        });
    });
    
    document.querySelectorAll('.delete-dish').forEach(button => {
        button.addEventListener('click', function() {
            const dishKey = this.getAttribute('data-dish-key');
            deleteDish(dishKey);
        });
    });
}

async function deleteDish(dishKey) {
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
            const dishRef = ref(db, `Dishes/${dishKey}`);
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

export async function addDish(dishData) {
    try {
        const dishesRef = ref(db, 'Dishes');
        const newDishRef = push(dishesRef);
        
        await set(newDishRef, {
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

export async function updateDish(dishKey, dishData) {
    try {
        const dishRef = ref(db, `Dishes/${dishKey}`);
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

// Добавляем функции в глобальную область видимости для обработки сортировки
window.sortDishes = sortDishes;