import { db, ref, onValue, update } from '../firebase-config.js';

export function loadOrders() {
  const ordersRef = ref(db, 'Orders');
  onValue(ordersRef, snapshot => {
    const data = snapshot.val();
    const orders = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.entries(data).map(([k,v]) => ({ key: k, ...v }))) : [];
    displayOrders(orders);
  }, (err) => console.error('orders onValue error', err));
}

function displayOrders(orders) {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  if (!orders || orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Заказы не найдены</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const id = o.id || o.key || '';
    const user = o.userName || o.user || '—';
    const sum = o.total || o.sum || calculateSum(o.items || o.cart || []);
    const status = o.status || 'Новый';
    const date = o.date ? new Date(o.date).toLocaleString('ru-RU') : '';
    return `
      <tr class="border-b">
        <td class="px-4 py-2">${id}</td>
        <td class="px-4 py-2">${user}</td>
        <td class="px-4 py-2">${sum}₽</td>
        <td class="px-4 py-2">
          <select class="order-status" data-order-key="${o.key || id}">
            <option value="Новый" ${status === 'Новый' ? 'selected' : ''}>Новый</option>
            <option value="В обработке" ${status === 'В обработке' ? 'selected' : ''}>В обработке</option>
            <option value="Готов" ${status === 'Готов' ? 'selected' : ''}>Готов</option>
            <option value="Выполнен" ${status === 'Выполнен' ? 'selected' : ''}>Выполнен</option>
            <option value="Отменен" ${status === 'Отменен' ? 'selected' : ''}>Отменен</option>
          </select>
        </td>
        <td class="px-4 py-2">${date}</td>
        <td class="px-4 py-2"><button class="view-order text-blue-600" data-order-key="${o.key || id}">Просмотреть</button></td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.order-status').forEach(s => s.addEventListener('change', onChangeStatus));
  document.querySelectorAll('.view-order').forEach(b => b.addEventListener('click', onViewOrder));
}

async function onChangeStatus(e) {
  const key = e.target.getAttribute('data-order-key');
  const newStatus = e.target.value;
  try {
    const orderRef = ref(db, `Orders/${key}`);
    await update(orderRef, { status: newStatus });
    Swal.fire({ icon: 'success', title: 'Успех', text: 'Статус обновлён' });
  } catch (err) {
    Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Не удалось изменить статус' });
  }
}

function onViewOrder(e) {
  const key = e.target.getAttribute('data-order-key');
  Swal.fire({ title: `Заказ ${key}`, html: `<p>Откройте Orders/${key} в БД для подробностей.</p>` });
}

function calculateSum(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((s, it) => s + ((it.price || 0) * (it.count || it.quantity || 1)), 0);
}
