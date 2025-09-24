import { addDish, updateDish } from './dishes.js';

export function initModal() {
    const modal = document.getElementById('dish-modal');
    const closeBtn = document.getElementById('close-modal');
    const addBtn = document.getElementById('add-dish-btn');
    const form = document.getElementById('dish-form');
    
    addBtn.addEventListener('click', () => {
        document.getElementById('modal-title').textContent = 'Добавить блюдо';
        form.reset();
        modal.classList.remove('hidden');
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dishData = {
            name: document.getElementById('dish-name').value,
            category: document.getElementById('dish-category').value,
            description: document.getElementById('dish-description').value,
            price: parseInt(document.getElementById('dish-price').value),
            image: document.getElementById('dish-image').value || 'https://source.unsplash.com/400x300/?noodles'
        };
        
        const dishId = document.getElementById('dish-id').value;
        
        if (dishId) {
            await updateDish(dishId, dishData);
        } else {
            await addDish(dishData);
        }
        
        modal.classList.add('hidden');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

export function openEditDishModal(dish) {
    document.getElementById('modal-title').textContent = 'Редактировать блюдо';
    document.getElementById('dish-id').value = dish.key;
    document.getElementById('dish-name').value = dish.name;
    document.getElementById('dish-category').value = dish.category;
    document.getElementById('dish-description').value = dish.description;
    document.getElementById('dish-price').value = dish.price;
    document.getElementById('dish-image').value = dish.image || '';
    
    document.getElementById('dish-modal').classList.remove('hidden');
}

// Добавляем функцию в глобальную область видимости
window.openEditDishModal = openEditDishModal;