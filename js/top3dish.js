import { db, ref, onValue } from './firebase-config.js';

function loadTop3Dishes() {
    const dishesContainer = document.getElementById('top3-dishes');
    
    const dishesRef = ref(db, 'Dishes/');
    
    onValue(dishesRef, (snapshot) => {
        
        dishesContainer.innerHTML = '';
        
        const data = snapshot.val();
        
        if (!data) {
            dishesContainer.innerHTML = `
                <div class="col-span-3 text-center py-10">
                    <p class="text-gray-500">Популярные блюда временно недоступны.</p>
                </div>
            `;
            return;
        }
        
        const dishes = Object.keys(data).map(key => {
            return {
                id: key,
                ...data[key]
            };
        });
        
        dishes.sort((a, b) => {
            const aPurchased = a.purchased || 0;
            const bPurchased = b.purchased || 0;
            return bPurchased - aPurchased;
        });
        
        const top3Dishes = dishes.slice(0, 3);
        
        
        top3Dishes.forEach((dish) => {
            const dishCard = `
                <div class="bg-white shadow-lg rounded-lg overflow-hidden">
                    <img src="${dish.image || 'https://source.unsplash.com/400x300/?noodles'}" 
                         alt="${dish.name}" 
                         class="w-full h-64 object-cover"
                         onerror="this.src='https://source.unsplash.com/400x300/?noodles'">
                    <div class="p-4">
                        <h3 class="text-xl font-bold">${dish.name}</h3>
                        <p class="text-gray-600 mt-2">${dish.description || ''}</p>
                        <div class="mt-4 flex justify-between items-center">
                            <span class="text-blue-600 font-semibold text-lg">${dish.price}₽</span>
                            <a href="menu.html" class="text-blue-600 hover:underline">Подробнее</a>
                        </div>
                    </div>
                </div>
            `;
            dishesContainer.innerHTML += dishCard;
        });
    }, (error) => {
        dishesContainer.innerHTML = `
            <div class="col-span-3 text-center py-10">
                <p class="text-red-500">Ошибка загрузки популярных блюд. Попробуйте позже.</p>
            </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', loadTop3Dishes);