import { checkAdminAccess } from './auth.js';
import { initTabs } from './utils.js';
import { initModal } from './modal.js';
import { loadUsers } from './users.js';
import { loadDishes } from './dishes.js';
import { loadStatistics } from './statistics.js';

document.addEventListener('DOMContentLoaded', async function() {
    if (!await checkAdminAccess()) return;
    
    initTabs();
    loadUsers();
    loadDishes();
    loadStatistics();
    initModal();
});