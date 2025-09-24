const token = localStorage.getItem('token');
    const secret = "Vol4ok69"; // Должен совпадать с секретом в authentication.js
    if (!token) {
        window.location.href = 'authentication.html';
    } else {
        try {
            const isValid = KJUR.jws.JWS.verifyJWT(token, secret, { alg: ['HS256'] });
            if (isValid) {
                const payload = KJUR.jws.JWS.parse(token).payloadObj;
                if (payload.exp < Date.now() / 1000) {
                    localStorage.removeItem('token');
                    window.location.href = 'authentication.html';
                } else {
                    // Проверка роли, если нужно
                    if (payload.post !== 3) { // Для admin.html проверяем, что это администратор
                        alert('У вас нет прав доступа к этой странице');
                        window.location.href = 'index.html';
                    }
                }
            } else {
                localStorage.removeItem('token');
                window.location.href = 'authentication.html';
            }
        } catch (e) {
            console.error('Invalid token', e);
            localStorage.removeItem('token');
            window.location.href = 'authentication.html';
        }
    }