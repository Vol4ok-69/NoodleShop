import { db, ref, onValue } from '../firebase-config.js';

export function loadStatistics() {
  const usersRef = ref(db, 'Users');
  const dishesRef = ref(db, 'Dishes');

  onValue(usersRef, (snap) => {
    const data = snap.val();
    const users = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
    const el = document.getElementById('total-users');
    if (el) el.textContent = users.length;
  });

  onValue(dishesRef, (snap) => {
    const data = snap.val();
    const dishes = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
    const el = document.getElementById('total-dishes');
    if (el) el.textContent = dishes.length;
    const totalSales = dishes.reduce((s, d) => s + ((d.price || 0) * (d.purchased || 0)), 0);
    const salesEl = document.getElementById('total-sales');
    if (salesEl) salesEl.textContent = `${totalSales}₽`;
    updatePopular(dishes);
  });

  window.addEventListener('dishesStatisticsUpdated', (e) => updatePopular(e.detail.dishes));
}

function updatePopular(dishes) {
  const container = document.getElementById('popular-dishes');
  if (!container) return;
  const list = Array.isArray(dishes) ? dishes.slice() : [];
  const top = list.sort((a, b) => (b.purchased || 0) - (a.purchased || 0)).slice(0, 5);
  if (!top.length) { container.innerHTML = '<p class="text-gray-500">Нет данных о продажах</p>'; return; }
  container.innerHTML = top.map(d => `<div class="flex justify-between items-center p-2 bg-gray-50 rounded"><span>${d.name}</span><span class="font-semibold">${d.purchased || 0} продаж</span></div>`).join('');
}
