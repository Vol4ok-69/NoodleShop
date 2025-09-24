import { db, ref,get,set } from './firebase-config.js';

async function registrationUser() {
    const email = document.getElementById("Email").value;
    const login = document.getElementById("Login").value;
    const password = document.getElementById("Password").value;
    const confirmPassword = document.getElementById("ConfirmPassword").value;
    const name = document.getElementById("Name").value;
    const surname = document.getElementById("Surname").value;
    const phone = document.getElementById("Phone").value;

    if (!email || !password || !login || !confirmPassword || !name || !surname || !phone) {
        Swal.fire({
            icon: "error",
            title: "Ошибка...",
            text: "Введите все данные!",
        });
        return;
    }
    
    if(!isEmail(email)){
        Swal.fire({
            icon: "error",
            title: "Ошибка...",
            text: "Введите корректный email!",
        });
        return;
    }
    
    if(!isPhoneNumber(phone)){
        Swal.fire({
            icon: "error",
            title: "Ошибка...",
            text: "Введите корректный номер телефона!",
        });
        return;
    }
    
    if(password !== confirmPassword){
        Swal.fire({
            icon: "error",
            title: "Ошибка...",
            text: "Пароли не совпадают!",
        });
        return;
    }

    try {
        const usersRef = ref(db, 'Users');
        const snapshot = await get(usersRef);
        const users = snapshot.val() || [];

        const userExist = users.some(u => 
            u && (
                (u.login && u.login.toLowerCase() === login.toLowerCase()) || 
                (u.email && u.email.toLowerCase() === email.toLowerCase()) || 
                (u.phone && u.phone === phone)
            )
        );

        if (userExist) {
            Swal.fire({
                icon: "error",
                title: "Ошибка...",
                text: "Такой аккаунт уже существует",
            });
            return;
        } else {
            const newUser = {
                date: Date.now(),
                email: email,
                hash_password: GetHash(password),
                id: await GetId(),
                login: login,
                name: name,
                phone: phone,
                post: 1,
                surname: surname
            };


            const newUsersArray = [...users, newUser];
            await set(usersRef, newUsersArray);

            Swal.fire({
                icon: "success",
                title: "Успешно!",
                text: "Регистрация прошла успешно!"
            }).then(() => {
                const secret = "Vol4ok69";
                const header = { alg: 'HS256', typ: 'JWT' };
                const payload = {
                    userId: newUser.id,
                    email: newUser.email,
                    login: newUser.login,
                    post: newUser.post,
                    exp: Math.floor(Date.now() / 1000) + 3600,
                };
                const sHeader = JSON.stringify(header);
                const sPayload = JSON.stringify(payload);
    
                const token = KJUR.jws.JWS.sign("HS256", sHeader, sPayload, secret);
                localStorage.setItem('token', token);
                window.location.href = 'index.html';
            });
        }
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        Swal.fire({
            icon: "error",
            title: "Ошибка...",
            text: "Произошла ошибка при регистрации. Попробуйте позже.",
        });
    }
}

function GetHash(password) {
    const prefix = "TiMoHa69_";
    const suffix = "_IdIot_69";
    
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    let a = prefix + hash.toString(16) + suffix;
    hash = 0;
    
    for (let i = 0; i < a.length; i++) {
        const char = a.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    return hash.toString(16);
}

async function GetId() {
    try {
        const snapshot = await get(ref(db, '/'));
        const allData = snapshot.val();
        
        // Получаем массив пользователей
        const users = allData && allData.Users ? allData.Users : [];
        
        if (users.length === 0) {
            return Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        }
        
        // Находим максимальный ID
        let maxId = 0;
        for (const user of users) {
            if (user && user.id) {
                const idNum = parseInt(user.id);
                if (!isNaN(idNum) && idNum > maxId) {
                    maxId = idNum;
                }
            }
        }
        
        return maxId > 0 ? maxId + 1 : Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        
    } catch (error) {
        console.error('Ошибка при получении ID:', error);
        return Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
    }
}

function isEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const trimmedEmail = email.trim();
    if (trimmedEmail.length === 0) return false;
    
    if (trimmedEmail.indexOf('@') === -1) return false;
    if (trimmedEmail.indexOf('.') === -1) return false;
    
    const parts = trimmedEmail.split('@');
    if (parts.length !== 2) return false;
    
    const [localPart, domainPart] = parts;
    
    if (localPart.length === 0) return false;
    if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
    if (localPart.includes('..')) return false;
    
    if (domainPart.length === 0) return false;
    if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;
    if (domainPart.includes('..')) return false;

    if (domainPart.indexOf('.') === -1) return false;
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    return emailRegex.test(trimmedEmail);
}

function isPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    let cleanedPhone = phone.trim();
    
    const hasPlus = cleanedPhone.startsWith('+');
    if (hasPlus) {
        cleanedPhone = '+' + cleanedPhone.substring(1).replace(/\D/g, '');
    } else {
        cleanedPhone = cleanedPhone.replace(/\D/g, '');
    }
    
    if (hasPlus) {
        if (cleanedPhone.length < 12 || cleanedPhone.length > 16) return false;
    } else {
        if (cleanedPhone.length < 10 || cleanedPhone.length > 11) return false;
    }
    
    if (hasPlus) {
        if (!/^\+\d+$/.test(cleanedPhone)) return false;
    } else {
        if (!/^\d+$/.test(cleanedPhone)) return false;
    }
    
    if (hasPlus && cleanedPhone.startsWith('+7') && cleanedPhone.length !== 12) return false;
    
    return true;
}
if (document.location.pathname.endsWith("registration.html"))
    document.getElementById('registerButton').addEventListener('click', registrationUser);
export {isEmail,isPhoneNumber,GetHash};