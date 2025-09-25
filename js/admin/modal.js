import { addDish, updateDish } from './dishes.js';

export function initModal() {
  const modal = document.getElementById('dish-modal');
  const closeBtn = document.getElementById('close-modal');
  const form = document.getElementById('dish-form');

  // делегированное открытие кнопки (на случай, если кнопка рендерится позже)
  document.addEventListener('click', (ev) => {
    const target = ev.target;
    if (!target) return;
    if (target.closest && target.closest('#add-dish-btn')) {
      openAddModal();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', () => modal?.classList.add('hidden'));
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  window.addEventListener('openDishModal', (e) => { if (e?.detail?.dish) openEditModal(e.detail.dish); });

  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const dishKeyEl = document.getElementById('dish-key');
      const dishKey = dishKeyEl ? dishKeyEl.value : '';
      const dishId = document.getElementById('dish-id')?.value?.trim() || '';
      const dishData = {
        id: dishId,
        name: document.getElementById('dish-name')?.value?.trim() || '',
        category: document.getElementById('dish-category')?.value || '',
        description: document.getElementById('dish-description')?.value?.trim() || '',
        price: parseInt(document.getElementById('dish-price')?.value) || 0,
        image: document.getElementById('dish-image')?.value || 'https://source.unsplash.com/400x300/?noodles'
      };

      if (!dishId) {
        return Swal.fire({ icon: 'error', title: 'Ошибка', text: 'Id блюда обязателен' });
      }

      try {
        if (dishKey) {
          await updateDish(dishId, dishData);
        } else {
          await addDish(dishData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        modal?.classList.add('hidden');
      }
    });
  }
}

function openAddModal() {
  const modal = document.getElementById('dish-modal');
  const form = document.getElementById('dish-form');
  if (!modal || !form) return;
  document.getElementById('modal-title').textContent = 'Добавить блюдо';
  form.reset();
  const keyEl = document.getElementById('dish-key');
  if (keyEl) keyEl.value = '';
  modal.classList.remove('hidden');
}

function openEditModal(dish) {
  const modal = document.getElementById('dish-modal');
  const form = document.getElementById('dish-form');
  if (!modal || !form) return;
  document.getElementById('modal-title').textContent = 'Редактировать блюдо';
  const keyEl = document.getElementById('dish-key');
  if (keyEl) keyEl.value = ''; // при необходимости сюда можно положить реальный ключ
  document.getElementById('dish-id').value = dish.id || '';
  document.getElementById('dish-name').value = dish.name || '';
  document.getElementById('dish-category').value = dish.category || '';
  document.getElementById('dish-description').value = dish.description || '';
  document.getElementById('dish-price').value = dish.price || 0;
  document.getElementById('dish-image').value = dish.image || '';
  modal.classList.remove('hidden');
}
