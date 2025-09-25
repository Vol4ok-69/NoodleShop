import { db, ref, get } from './firebase-config.js';

export function GetUserFromToken() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const userFromToken = JSON.parse(atob(token.split('.')[1]));
            return userFromToken;
        } catch (e) {
            return null;
        }
    } else {
        return null;
    }
}

export async function GetUserFromBase() {
    const userFromToken = GetUserFromToken();
    if (userFromToken) {
        try {
            const usersRef = ref(db, 'Users');
            const snapshot = await get(usersRef);
            const users = snapshot.val();
            
            if (Array.isArray(users)) {
                return users.find(u => u && u.id === userFromToken.userId);
            } else {
                return Object.values(users).find(u => u && u.id === userFromToken.userId);
            }
        } catch (e) {
            return null;
        }
    } else {
        return null;
    }
}