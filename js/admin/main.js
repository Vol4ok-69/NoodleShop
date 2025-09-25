// main.js — точка входа админ-панели
import { initTabs } from './ui-tabs.js';
import { initModal } from './modal.js';
import { loadUsers } from './users.js';
import { loadDishes } from './dishes.js';
import { loadStatistics } from './statistics.js';
import { loadOrders } from './orders.js';
import { ensureAdmin } from './auth-guard.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureAdmin();
  } catch (e) {
    return;
  }

  initTabs();
  initModal();
  loadUsers();
  loadDishes();
  loadOrders();
  loadStatistics();

  const first = document.querySelector('.tab-button');
  if (first) first.click();
});
