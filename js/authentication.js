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
    const emailLogin = document.getElementById("emailLogin").value;
    const password = document.getElementById("password").value;
    
    if (!emailLogin || !password) {
        Swal.fire({
            icon: "error",
            title: "Ошибка...",
            text: "Введите логин и пароль!",
          });
        return;
    }
    
    try {
        const snapshot = await get(ref(db, 'Users'));
        const users = snapshot.val();

        const filteredUsers = Object.values(users).filter(u => u);

        const user = filteredUsers.find(u => (u.login.toLowerCase() === emailLogin.toLowerCase() || u.email.toLowerCase() === emailLogin.toLowerCase()) && u.hash_password === GetHash(password));
        
         if (user) {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = {
            userId: user.id,
            email: user.email,
            login: user.login,
            post: user.post,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        };

        const secret = "Vol4ok69";

        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(payload);
        const token = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, secret);
    
        localStorage.setItem('token', token);
        
        window.location.href = "index.html";
    } else {
           
            Swal.fire({
                icon: "error",
                title: "Ошибка...",
                text: "Неправильный логин или пароль!",
              });
        }
    } catch (error) {
    }
}

document.getElementById('loginbutton').addEventListener('click', loginUser);