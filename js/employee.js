import { db, ref, get } from './firebase-config.js';
import { GetUserFromBase } from './token.js';

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadOrders();
});

async function checkAuth() {
    try {
        const user = await GetUserFromBase();
        if (!user || (user.post !== 2 && user.post !== 3)) {
            Swal.fire({
                icon: 'error',
                title: 'Доступ запрещен',
                text: 'У вас нет прав для доступа к этой странице.',
            }).then(() => {
                window.location.href = 'index.html';
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Ошибка аутентификации',
            text: 'Пожалуйста, войдите в систему.',
        }).then(() => {
            window.location.href = 'authentication.html';
        });
    }
}

async function loadOrders() {
    const ordersTableBody = document.getElementById('orders-table-body');
    if (ordersTableBody) {
        // TODO: Implement order loading from Firebase
        ordersTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">Функционал загрузки заказов в разработке.</td></tr>';
    }
}