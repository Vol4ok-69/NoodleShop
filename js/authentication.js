import { db, ref} from './firebase-config.js';
import {get } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { GetHash } from './registration.js';
import { GetUserFromBase } from './token.js';

if (document.location.pathname.endsWith("authentication.html"))
{const user = await GetUserFromBase();
if (user) {
    Swal.fire({
      icon: 'warn',
      title: 'Вы уже авторизованы',
      text: 'У вас нет прав для доступа, выйдите для продолжения'
    }).then(() => { window.location.href = 'index.html'; });
}}

async function loginUser() {
    //получение email и пароля из формы
    const emailLogin = document.getElementById("emailLogin").value;
    const password = document.getElementById("password").value;
    
    //простая валидация формы
    if (!emailLogin || !password) {
        Swal.fire({
            icon: "error",
            title: "Ошибка...",
            text: "Введите логин и пароль!",
          });
        return;
    }
    
    try {
        //получение данных из коллекции "Users"
        const snapshot = await get(ref(db, 'Users'));
        const users = snapshot.val();

        //фильтрация потенциальных пустых элементов
        const filteredUsers = Object.values(users).filter(u => u);

        //поиск пользователя с соответствующим email/login и паролем
        const user = filteredUsers.find(u => (u.login.toLowerCase() === emailLogin.toLowerCase() || u.email.toLowerCase() === emailLogin.toLowerCase()) && u.hash_password === GetHash(password));
        
         if (user) {
        // Замените простую base64 кодировку на использование jsrsasign
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = {
            userId: user.id,
            email: user.email,
            login: user.login,
            post: user.post,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        };

        const secret = "Vol4ok69"; // Используйте более сложный ключ

        // Используем jsrsasign для подписи токена
        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(payload);
        const token = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, secret);
    
        // Сохраняем токен в localStorage
        localStorage.setItem('token', token);
        
        // Перенаправляем пользователя
        window.location.href = "index.html";
    } else {
            //пользователь не найден или неверный email(login)/пароль
            console.error('Пользователь не найден или неверный логин(email)/пароль.');
            Swal.fire({
                icon: "error",
                title: "Ошибка...",
                text: "Неправильный логин или пароль!",
              });
        }
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
    }
}

document.getElementById('loginbutton').addEventListener('click', loginUser);