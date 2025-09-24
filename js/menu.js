import { db, ref, onValue } from './firebase-config.js';
import { addToCart } from './cart.js';


function loadMenu() {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) {
        console.error('menu-container not found in DOM');
        return;
    }
    
    const dishesRef = ref(db, 'Dishes/');
    
    onValue(dishesRef, (snapshot) => {
        const data = snapshot.val();
        
        menuContainer.innerHTML = ''; // очищаем на всякий случай
        
        if (!data) {
            menuContainer.innerHTML = `
                <div class="col-span-3 text-center py-10">
                    <p class="text-gray-500">Меню временно недоступно. Зайдите позже.</p>
                    <p class="text-sm text-gray-400 mt-2">Или добавьте блюда в Realtime Database</p>
                </div>
            `;
            return;
        }
        
        // Формируем массив блюд вне зависимости от того, массив ли это или объект
        let dishes = [];
        if (Array.isArray(data)) {
            // данные — массив объектов (как у тебя в БД)
            dishes = data.filter(Boolean).map(d => ({ id: d.id || d.name || '', ...d }));
        } else {
            // данные — объект, ключи — id
            dishes = Object.keys(data).map(key => ({ id: data[key].id || key, ...data[key] }));
        }
        
        // Группируем по категориям
        const categories = {};
        dishes.forEach(dish => {
            const category = dish.category || 'Другое';
            if (!categories[category]) categories[category] = [];
            categories[category].push(dish);
        });
        
        // Создаем секции для каждой категории
        Object.keys(categories).forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section mb-12';
            
            // Заголовок категории
            categorySection.innerHTML = `
                <h2 class="text-3xl font-bold mb-8 text-center">${category}</h2>
                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 category-dishes"></div>
            `;
            
            menuContainer.appendChild(categorySection);
            
            const dishesContainer = categorySection.querySelector('.category-dishes');
            categories[category].forEach(dish => {
                const dishCard = `
                    <div class="bg-white shadow-lg rounded-lg overflow-hidden">
                        <img src="${dish.image || 'https://source.unsplash.com/400x300/?noodles'}" 
                             alt="${dish.name}" 
                             class="w-full h-64 object-cover">
                        <div class="p-4">
                            <h3 class="text-xl font-bold">${dish.name}</h3>
                            <p class="text-gray-600 mt-2">${dish.description || ''}</p>
                            <div class="mt-4 flex justify-between items-center">
                                <span class="text-blue-600 font-semibold text-lg">${dish.price}₽</span>
                                <button class="add-to-cart bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition" 
                                        data-id="${dish.id}"
                                        data-name="${dish.name}"
                                        data-price="${dish.price}"
                                        data-image="${dish.image || 'https://source.unsplash.com/400x300/?noodles'}">
                                    В корзину
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                dishesContainer.innerHTML += dishCard;
            });
        });
        
        // Навешиваем обработчики на кнопки "В корзину"
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', addToCartHandler);
        });
        
    }, (error) => {
        console.error("Ошибка загрузки меню: ", error);
        if (menuContainer) {
            menuContainer.innerHTML = `
                <div class="col-span-3 text-center py-10">
                    <p class="text-red-500">Ошибка загрузки меню. Проверьте консоль для подробностей.</p>
                    <p class="text-sm text-gray-400 mt-2">${error.message}</p>
                </div>
            `;
        }
    });
}

function addToCartHandler(event) {
    const button = event.currentTarget;
    const dishId = button.getAttribute('data-id');
    const dishName = button.getAttribute('data-name');
    const dishPrice = parseFloat(button.getAttribute('data-price'));
    const dishImage = button.getAttribute('data-image');
    
    const dish = {
        id: dishId,
        name: dishName,
        price: dishPrice,
        image: dishImage
    };
    
    addToCart(dish);
}

document.addEventListener('DOMContentLoaded', loadMenu);
