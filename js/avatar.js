import { GetUserFromBase } from './token.js';

document.addEventListener('DOMContentLoaded', function() {
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      const mobileMenu = document.getElementById('mobile-menu');
      
      mobileMenuButton.addEventListener('click', function() {
        mobileMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', function(event) {
        const isClickInsideMenu = mobileMenu.contains(event.target);
        const isClickOnButton = mobileMenuButton.contains(event.target);
        
        if (!isClickInsideMenu && !isClickOnButton && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
        }
      });
    });

document.addEventListener('DOMContentLoaded', async function() {
  const loginBtn = document.getElementById('login-btn');
  const userMenu = document.getElementById('user-menu');
  const userAvatar = document.getElementById('user-avatar');
  const userFullname = document.getElementById('user-fullname');
  const userLogin = document.getElementById('user-login');
  const logoutBtn = document.getElementById('logout-btn');
  const adminPage = document.getElementById('adminPage');
  const employeePage = document.getElementById('employeePage');

  try {
    const user = await GetUserFromBase();
    
    if (user) {
      userFullname.textContent = `${user.name} ${user.surname}`;
      userLogin.textContent = user.login;
      
      if (user.avatar) {
        try {
          if (user.avatar.includes('google.com/imgres')) {
            const imageUrl = GetImageFromGoogleImage(user.avatar);
            userAvatar.style.backgroundImage = `url('${imageUrl}')`;
            userAvatar.textContent = '';
          } else {
            userAvatar.style.backgroundImage = `url('${user.avatar}')`;
            userAvatar.textContent = '';
          }
          userAvatar.style.backgroundSize = 'cover';
          userAvatar.style.backgroundPosition = 'center';
        } catch (e) {
          console.error('Ошибка загрузки аватара:', e);
          userAvatar.textContent = user.name.charAt(0) + user.surname.charAt(0);
        }
      } else {
        userAvatar.textContent = user.name.charAt(0) + user.surname.charAt(0);
      }
      
      loginBtn.classList.add('hidden');
      userMenu.classList.remove('hidden');
      
      if(user.post == 3)
        adminPage.classList.remove('hidden');
      if(user.post == 2)
        employeePage.classList.remove('hidden');
    }
  } catch (e) {
    console.error(e);
  }
  
  logoutBtn.addEventListener('click', function() {
    localStorage.removeItem('token');
    window.location.reload();
  });
});

function GetImageFromGoogleImage(url) {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);
  
  const encodedImageUrl = params.get('imgurl');
  
  if (!encodedImageUrl) {
    throw new Error('URL изображения не найден в параметрах ссылки');
  }

  const imageUrl = decodeURIComponent(encodedImageUrl);

  return imageUrl;
}