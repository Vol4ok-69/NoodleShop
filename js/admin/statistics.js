import { db, ref, onValue } from './firebase-config.js';

export function loadStatistics() {
    const usersRef = ref(db, 'Users');
    const dishesRef = ref(db, 'Dishes');
    
    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const users = data ? Object.values(data) : [];
        document.getElementById('total-users').textContent = users.length;
    });
    
    onValue(dishesRef, (snapshot) => {
        const data = snapshot.val();
        const dishes = data ? Object.values(data) : [];
        
        document.getElementById('total-dishes').textContent = dishes.length;
        
        const totalSales = dishes.reduce((sum, dish) => {
            return sum + (dish.price * (dish.purchased || 0));
        }, 0);
        
        document.getElementById('total-sales').textContent = `${totalSales}₽`;
        updatePopularDishes(dishes);
    });
}

function updatePopularDishes(dishes) {
    const popularDishesContainer = document.getElementById('popular-dishes');
    
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