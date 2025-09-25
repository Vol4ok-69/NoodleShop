import { db, ref, onValue, set, update, remove, get } from './firebase-config.js';

let cartItems = [];

let currentUser = (function() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (e) {
        console.error('Ошибка декодирования токена при инициализации currentUser:', e);
        localStorage.removeItem('token');
        return null;
    }
})();

document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('cart-container')) {
    return;
  }

  loadUserData();
  loadCart();
});

function loadUserData() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = payload.userId;
        } catch (e) {
            console.error('Ошибка декодирования токена:', e);
            localStorage.removeItem('token');
            currentUser = null;
        }
    } else {
        currentUser = null;
    }
}

function loadCart() {
    if (!currentUser) {
        showAuthMessage();
        return;
    }

    const cartRef = ref(db, `Carts/${currentUser}`);
    
    onValue(cartRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.items) {
            cartItems = Object.values(data.items);
            displayCart();
        } else {
            cartItems = [];
            displayEmptyCart();
        }
    }, (error) => {
        console.error('Ошибка загрузки корзины:', error);
        displayEmptyCart();
    });
}

function displayEmptyCart() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;

    cartContainer.innerHTML = `
        <div class="bg-white shadow-lg rounded-lg p-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">Ваша корзина пуста</h3>
            <p class="mt-1 text-gray-500">Добавьте что-нибудь из нашего меню</p>
            <div class="mt-6">
                <a href="menu.html" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Перейти к меню
                </a>
            </div>
        </div>
    `;
}

function displayCart() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;

    if (cartItems.length === 0) {
        displayEmptyCart();
        return;
    }

    let total = 0;

    cartItems.forEach(item => {
        total += item.price * item.quantity;
    });

    cartContainer.innerHTML = `
        <div class="bg-white shadow-lg rounded-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-2xl font-bold">Ваш заказ</h2>
            </div>
            <div class="divide-y divide-gray-200" id="cart-items">
                ${cartItems.map(item => `
                    <div class="p-6 flex justify-between items-center cart-item" data-id="${item.id}">
                        <div class="flex items-center">
                            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                            <div class="ml-4">
                                <h3 class="text-lg font-semibold">${item.name}</h3>
                                <p class="text-gray-600">${item.price}₽</p>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <div class="flex items-center border border-gray-300 rounded-md">
                                <button class="decrease-quantity px-3 py-1 text-gray-600 hover:bg-gray-100" data-id="${item.id}">-</button>
                                <span class="px-3 py-1 quantity">${item.quantity}</span>
                                <button class="increase-quantity px-3 py-1 text-gray-600 hover:bg-gray-100" data-id="${item.id}">+</button>
                            </div>
                            <div class="ml-4 w-20 text-right font-semibold">${item.price * item.quantity}₽</div>
                            <button class="ml-4 remove-item text-red-500 hover:text-red-700" data-id="${item.id}">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="px-6 py-4 border-t border-gray-200">
                <div class="flex justify-between items-center text-xl font-bold">
                    <span>Итого:</span>
                    <span>${total}₽</span>
                </div>
                <button id="checkout-btn" class="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg text-lg hover:bg-blue-700">
                    Оплатить
                </button>
            </div>
        </div>
    `;

    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const dishId = this.getAttribute('data-id');
            updateQuantity(dishId, 1);
        });
    });

    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', function() {
            const dishId = this.getAttribute('data-id');
            updateQuantity(dishId, -1);
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const dishId = this.getAttribute('data-id');
            removeFromCart(dishId);
        });
    });

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            alert('Оплата пока не реализована. Переходим к оформлению заказа...');
            window.location.href = '#';
        });
    }
}

async function updateQuantity(dishId, change) {
    if (!currentUser) return;

    const itemIndex = cartItems.findIndex(item => item.id === dishId);
    if (itemIndex === -1) return;

    const newQuantity = cartItems[itemIndex].quantity + change;
    
    if (newQuantity <= 0) {
        removeFromCart(dishId);
        return;
    }

    cartItems[itemIndex].quantity = newQuantity;
    
    const cartRef = ref(db, `Carts/${currentUser}/items/${dishId}`);
    await update(cartRef, { 
        quantity: newQuantity,
        lastUpdated: Date.now()
    });
    displayCart();
}

async function removeFromCart(dishId) {
    if (!currentUser) return;

    const cartRef = ref(db, `Carts/${currentUser}/items/${dishId}`);
    await remove(cartRef);
    
    cartItems = cartItems.filter(item => item.id !== dishId);

    if (cartItems.length === 0) {
        displayEmptyCart();
    } else {
        displayCart();
    }
}

function showAuthMessage() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;

    cartContainer.innerHTML = `
        <div class="bg-white shadow-lg rounded-lg p-8 text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">Требуется авторизация</h3>
            <p class="mt-1 text-gray-500">Для просмотра корзины необходимо войти в систему</p>
            <div class="mt-6">
                <a href="authentication.html" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Войти
                </a>
            </div>
        </div>
    `;
}

export async function addToCart(dish) {
    if (!currentUser) {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUser = payload.userId;
            } catch (e) {
                console.error('Ошибка декодирования токена при добавлении в корзину:', e);
                localStorage.removeItem('token');
                currentUser = null;
            }
        }
    }

    if (!currentUser) {
        alert('Для добавления в корзину необходимо войти в систему');
        window.location.href = 'authentication.html';
        return;
    }

    const cartRef = ref(db, `Carts/${currentUser}/items/${dish.id}`);
    
    const snapshot = await get(cartRef);
    if (snapshot.exists()) {
        const currentQuantity = snapshot.val().quantity;
        await update(cartRef, { 
            quantity: currentQuantity + 1,
            lastUpdated: Date.now()
        });
    } else {
        await set(cartRef, {
            id: dish.id,
            name: dish.name,
            price: dish.price,
            image: dish.image,
            quantity: 1,
            lastUpdated: Date.now()
        });
    }
    
    alert(`"${dish.name}" добавлен в корзину!`);
}
