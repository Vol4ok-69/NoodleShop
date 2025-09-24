import { GetUserFromBase } from '.public/js/token.js';

export async function checkAdminAccess() {
    const user = await GetUserFromBase();
    
    if (!user || user.post !== 3) {
        Swal.fire({
            icon: 'error',
            title: 'Доступ запрещен',
            text: 'У вас нет прав для доступа к админ-панели'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return false;
    }
    
    return true;
}