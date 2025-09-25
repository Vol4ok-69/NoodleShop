import { db, ref, onValue, set, update, remove, get } from '../firebase-config.js';
import { findKeyById } from './utils.js';

let dishesData = [];
let sortField = 'name';
let sortDirection = 'asc';

export function loadDishes() {
  const dishesRef = ref(db, 'Dishes');
  onValue(dishesRef, snapshot => {
    const data = snapshot.val();
    dishesData = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
    sortDishes(sortField, false);
    updateDishesStatistics(dishesData);
    displayDishes(dishesData);
  },
  (err) => console.error('dishes onValue error', err));
}

export function displayDishes(dishes) {
  const tbody = document.getElementById('dishes-table-body');
  if (!tbody) return;
  if (!dishes || dishes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Блюда не найдены</td></tr>';
    return;
  }

  tbody.innerHTML = dishes.map(d => `
    <tr class="border-b">
      <td class="px-4 py-2">${d.id}</td>
      <td class="px-4 py-2">${d.name}</td>
      <td class="px-4 py-2">${d.category}</td>
      <td class="px-4 py-2">${d.price}₽</td>
      <td class="px-4 py-2">${d.purchased || 0}</td>
      <td class="px-4 py-2">
        <button class="edit-dish text-blue-500 mr-2" data-dish-id="${d.id}">Ред.</button>
        <button class="delete-dish text-red-500" data-dish-id="${d.id}">Уд.</button>
      </td>
    </tr>
  `).join('');

  addDishEventListeners();
}

function addDishEventListeners() {
  document.querySelectorAll('.edit-dish').forEach(b => b.addEventListener('click', onEditDish));
  document.querySelectorAll('.delete-dish').forEach(b => b.addEventListener('click', onDeleteDish));
}

async function onEditDish(e) {
  const id = e.target.getAttribute('data-dish-id');
  const dish = dishesData.find(d => d.id === id);
  if (!dish) return Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Блюдо не найдено' });
  window.dispatchEvent(new CustomEvent('openDishModal', { detail: { dish } }));
}

async function onDeleteDish(e) {
  const id = e.target.getAttribute('data-dish-id');
  const confirmed = await Swal.fire({
    title: 'Вы уверены?',
    text: 'Блюдо будет удалено',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Да, удалить!'
  });
  if (!confirmed.isConfirmed) return;
  try {
    const key = await findKeyById('Dishes', id);
    if (key === null) throw new Error('Не найден ключ блюда');
    const dishRef = ref(db, `Dishes/${key}`);
    await remove(dishRef);
    Swal.fire({ icon: 'success', title: 'Удалено', text: 'Блюдо удалено' });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось удалить блюдо' });
  }
}

export async function addDish(dishData) {
  try {
    const keyExisting = await findKeyById('Dishes', dishData.id);
    if (keyExisting !== null) throw new Error('Блюдо с таким id уже существует');

    const dishesRef = ref(db, 'Dishes');
    const snap = await get(dishesRef);
    const val = snap.val();
    if (Array.isArray(val)) {
      const idx = val.length;
      await set(ref(db, `Dishes/${idx}`), { ...dishData, purchased: 0 });
    } else {
      const newKey = Date.now().toString();
      await set(ref(db, `Dishes/${newKey}`), { ...dishData, purchased: 0 });
    }
    Swal.fire({ icon: 'success', title: 'Успех', text: 'Блюдо добавлено' });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: err.message || 'Не удалось добавить блюдо' });
  }
}

export async function updateDish(dishId, dishData) {
  try {
    const key = await findKeyById('Dishes', dishId);
    if (key === null) throw new Error('Блюдо не найдено');
    const dishRef = ref(db, `Dishes/${key}`);
    await update(dishRef, dishData);
    Swal.fire({ icon: 'success', title: 'Успех', text: 'Блюдо обновлено' });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось обновить блюдо' });
  }
}

export function sortDishes(field, rerender = true) {
  if (sortField === field) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  else { sortField = field; sortDirection = 'asc'; }
  dishesData.sort((a, b) => {
    let va = a[field]; let vb = b[field];
    if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
    if (va < vb) return sortDirection === 'asc' ? -1 : 1;
    if (va > vb) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
  if (rerender) displayDishes(dishesData);
}

function updateDishesStatistics(dishes) {
  const totalDishesEl = document.getElementById('total-dishes');
  if (totalDishesEl) totalDishesEl.textContent = dishes.length;
  const totalSales = dishes.reduce((s, d) => s + ((d.price || 0) * (d.purchased || 0)), 0);
  const totalSalesEl = document.getElementById('total-sales');
  if (totalSalesEl) totalSalesEl.textContent = `${totalSales}₽`;
  window.dispatchEvent(new CustomEvent('dishesStatisticsUpdated', { detail: { dishes } }));
}
