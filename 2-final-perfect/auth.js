// auth.js - سیستم احراز هویت (اصلاح شده)
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users') || '[]');

// ایجاد کاربران پیش‌فرض اگر وجود نداشته باشد
function initializeDefaultUsers() {
    console.log('Initializing default users...');
    
    // اگر users خالی است یا ساختار اشتباه دارد، کاربران پیش‌فرض ایجاد کن
    if (!Array.isArray(users) || users.length === 0) {
        console.log('Creating default users...');
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin',
                role: 'admin',
                name: 'مدیر سیستم',
                email: 'admin@system.com',
                phone: '09123456789',
                createdAt: new persianDate().format('YYYY/MM/DD HH:mm:ss'),
                lastLogin: null,
                isActive: true
            },
            {
                id: 2,
                username: 'user',
                password: 'user',
                role: 'user',
                name: 'کاربر عادی',
                email: 'user@system.com',
                phone: '09123456780',
                createdAt: new persianDate().format('YYYY/MM/DD HH:mm:ss'),
                lastLogin: null,
                isActive: true
            }
        ];
        users = defaultUsers;
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Default users created successfully');
    } else {
        console.log('Users already exist:', users.length, 'users found');
    }
}

// ورود به سیستم
function login() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('loginError');
    
    if (!usernameInput || !passwordInput || !errorElement) {
        console.error('Login form elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    console.log('Login attempt for username:', username);
    
    if (!username || !password) {
        errorElement.textContent = 'لطفاً نام کاربری و رمز عبور را وارد کنید.';
        errorElement.classList.remove('hidden');
        return;
    }
    
    // اطمینان از بارگذاری کاربران
    if (users.length === 0) {
        initializeDefaultUsers();
    }
    
    // بارگذاری مجدد کاربران از localStorage برای اطمینان
    try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            users = JSON.parse(storedUsers);
        }
    } catch (error) {
        console.error('Error loading users from localStorage:', error);
        initializeDefaultUsers();
    }
    
    console.log('Available users:', users);
    
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.isActive === true
    );
    
    if (user) {
        console.log('Login successful for user:', user.name);
        
        // به‌روزرسانی تاریخ آخرین ورود
        user.lastLogin = new persianDate().format('YYYY/MM/DD HH:mm:ss');
        localStorage.setItem('users', JSON.stringify(users));
        
        // ذخیره کاربر جاری (بدون رمز عبور)
        currentUser = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            email: user.email,
            phone: user.phone,
            lastLogin: user.lastLogin
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // پنهان کردن صفحه ورود و نمایش صفحه اصلی
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        
        // نمایش اطلاعات کاربر
        const userInfoElement = document.getElementById('userInfo');
        if (userInfoElement) {
            userInfoElement.textContent = `${user.name} (${user.role === 'admin' ? 'مدیر' : 'کاربر'})`;
        }
        
        // بارگذاری داده‌های کاربر
        if (typeof loadUserData === 'function') {
            loadUserData();
        }
        
        // نمایش تب مناسب
        if (typeof openTab === 'function') {
            openTab('sellerTab');
        }
        
        // نمایش پیام خوش‌آمدگویی
        showNotification(`خوش آمدید ${user.name}`, 'success');
        
        // راه‌اندازی تایمر عدم فعالیت
        resetInactivityTimer();
        
    } else {
        console.log('Login failed - user not found or invalid credentials');
        errorElement.textContent = 'نام کاربری یا رمز عبور اشتباه است.';
        errorElement.classList.remove('hidden');
        
        // لرزاندن فرم
        const loginContainer = document.querySelector('.login-container');
        loginContainer.style.animation = 'shake 0.5s';
        setTimeout(() => {
            loginContainer.style.animation = '';
        }, 500);
    }
}

// خروج از سیستم
function logout() {
    if (confirm('آیا از خروج از سیستم اطمینان دارید؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        // پنهان کردن صفحه اصلی و نمایش صفحه ورود
        document.getElementById('mainPage').classList.add('hidden');
        document.getElementById('loginPage').classList.remove('hidden');
        
        // پاک کردن فیلدهای ورود
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorElement = document.getElementById('loginError');
        
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (errorElement) errorElement.classList.add('hidden');
        
        // متوقف کردن تایمر عدم فعالیت
        clearTimeout(inactivityTimer);
        
        showNotification('با موفقیت از سیستم خارج شدید.', 'info');
    }
}

// بررسی وضعیت ورود
function checkLoginStatus() {
    try {
        console.log('Checking login status...');
        
        // ابتدا کاربران پیش‌فرض را ایجاد کن
        initializeDefaultUsers();
        
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            console.log('Found saved user:', currentUser);
            
            // بارگذاری لیست کاربران برای بررسی وجود کاربر
            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
                users = JSON.parse(storedUsers);
            }
            
            // بررسی اینکه کاربر هنوز در سیستم وجود دارد
            const userExists = users.some(u => u.id === currentUser.id && u.isActive);
            
            if (userExists) {
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('mainPage').classList.remove('hidden');
                
                const userInfoElement = document.getElementById('userInfo');
                if (userInfoElement) {
                    userInfoElement.textContent = `${currentUser.name} (${currentUser.role === 'admin' ? 'مدیر' : 'کاربر'})`;
                }
                
                if (typeof loadUserData === 'function') {
                    loadUserData();
                }
                
                // راه‌اندازی تایمر عدم فعالیت
                resetInactivityTimer();
                return true;
            } else {
                // کاربر حذف شده یا غیرفعال شده
                console.log('User no longer exists or is inactive');
                localStorage.removeItem('currentUser');
                currentUser = null;
            }
        }
        
        // اگر کاربر لاگین نبوده یا کاربر معتبر نبوده
        console.log('No valid user session found');
        return false;
        
    } catch (error) {
        console.error('Error checking login status:', error);
        // در صورت خطا، کاربران پیش‌فرض را ایجاد کن
        initializeDefaultUsers();
        return false;
    }
}

// تغییر رمز عبور
function changePassword() {
    if (!currentUser) return;
    
    const oldPassword = prompt('رمز عبور فعلی را وارد کنید:');
    if (!oldPassword) return;
    
    // بارگذاری کاربران برای بررسی رمز عبور
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return;
    
    const users = JSON.parse(storedUsers);
    const userIndex = users.findIndex(u => u.id === currentUser.id && u.password === oldPassword);
    
    if (userIndex === -1) {
        alert('رمز عبور فعلی اشتباه است.');
        return;
    }
    
    const newPassword = prompt('رمز عبور جدید را وارد کنید:');
    if (!newPassword || newPassword.length < 4) {
        alert('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.');
        return;
    }
    
    const confirmPassword = prompt('تکرار رمز عبور جدید:');
    if (newPassword !== confirmPassword) {
        alert('رمز عبور جدید و تکرار آن مطابقت ندارند.');
        return;
    }
    
    // تغییر رمز عبور
    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('رمز عبور با موفقیت تغییر یافت.');
    showNotification('رمز عبور با موفقیت تغییر یافت.', 'success');
}

// بازیابی رمز عبور
function recoverPassword() {
    const username = document.getElementById('recoveryUsername').value.trim();
    
    if (!username) {
        showNotification('لطفاً نام کاربری را وارد کنید.', 'error');
        return;
    }
    
    // بارگذاری کاربران
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
        showNotification('خطا در بارگذاری کاربران.', 'error');
        return;
    }
    
    const users = JSON.parse(storedUsers);
    const user = users.find(u => u.username === username && u.isActive);
    
    if (!user) {
        showNotification('کاربری با این نام کاربری یافت نشد.', 'error');
        return;
    }
    
    // ایجاد رمز موقت
    const temporaryPassword = Math.random().toString(36).slice(-8);
    user.password = temporaryPassword;
    
    localStorage.setItem('users', JSON.stringify(users));
    
    // نمایش رمز موقت (در سیستم واقعی این کار انجام نمی‌شود)
    alert(`رمز عبور موقت: ${temporaryPassword}\n\nلطفاً پس از ورود، رمز عبور خود را تغییر دهید.`);
    
    // بستن modal
    closePasswordRecovery();
    
    showNotification('رمز عبور موقت ایجاد شد. لطفاً پس از ورود آن را تغییر دهید.', 'success');
    
    return true;
}

// بررسی سطح دسترسی
function hasPermission(requiredRole) {
    if (!currentUser) return false;
    
    // بارگذاری اطلاعات کامل کاربر
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return false;
    
    const users = JSON.parse(storedUsers);
    const user = users.find(u => u.id === currentUser.id);
    
    if (!user || !user.isActive) return false;
    
    if (requiredRole === 'admin') {
        return user.role === 'admin';
    }
    
    // کاربر عادی به تمام امکانات به جز مدیریت کاربران دسترسی دارد
    return true;
}

// نمایش پروفایل کاربر
function showUserProfile() {
    if (!currentUser) return;
    
    // بارگذاری اطلاعات کامل کاربر
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return;
    
    const users = JSON.parse(storedUsers);
    const user = users.find(u => u.id === currentUser.id);
    if (!user) return;
    
    const profileHtml = `
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 class="text-xl font-semibold mb-4">پروفایل کاربری</h3>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="font-medium">نام:</span>
                    <span>${user.name}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">نام کاربری:</span>
                    <span>${user.username}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">نقش:</span>
                    <span>${user.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">ایمیل:</span>
                    <span>${user.email || 'ثبت نشده'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">تلفن:</span>
                    <span>${user.phone || 'ثبت نشده'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">تاریخ ایجاد:</span>
                    <span>${user.createdAt}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">آخرین ورود:</span>
                    <span>${user.lastLogin || 'اولین ورود'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-medium">وضعیت:</span>
                    <span class="${user.isActive ? 'text-green-600' : 'text-red-600'}">${user.isActive ? 'فعال' : 'غیرفعال'}</span>
                </div>
            </div>
            <div class="mt-6 flex gap-2">
                <button onclick="changePassword()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                    تغییر رمز عبور
                </button>
                <button onclick="closeProfile()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                    بستن
                </button>
            </div>
        </div>
    `;
    
    // ایجاد modal برای نمایش پروفایل
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.innerHTML = profileHtml;
        modal.classList.remove('hidden');
    }
}

// بستن پروفایل
function closeProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// مدیریت session timeout
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(logoutDueToInactivity, 30 * 60 * 1000); // 30 دقیقه
}

function logoutDueToInactivity() {
    if (currentUser) {
        showNotification('به دلیل عدم فعالیت، از سیستم خارج شدید.', 'warning');
        logout();
    }
}

// ردیابی فعالیت کاربر
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);
document.addEventListener('touchstart', resetInactivityTimer);

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    // اضافه کردن استایل انیمیشن لرزش
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
    
    // ایجاد کاربران پیش‌فرض
    initializeDefaultUsers();
    
    // بررسی وضعیت ورود
    setTimeout(checkLoginStatus, 100);
    
    // اضافه کردن event listener برای کلید Enter در فرم ورود
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput && passwordInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
        
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // اضافه کردن event listener برای modal پروفایل
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                closeProfile();
            }
        });
    }
    
    // اضافه کردن event listener برای modal بازیابی رمز عبور
    const passwordRecoveryModal = document.getElementById('passwordRecoveryModal');
    if (passwordRecoveryModal) {
        passwordRecoveryModal.addEventListener('click', function(e) {
            if (e.target === passwordRecoveryModal) {
                closePasswordRecovery();
            }
        });
        
        // اضافه کردن event listener برای کلید Enter در فرم بازیابی
        const recoveryInput = document.getElementById('recoveryUsername');
        if (recoveryInput) {
            recoveryInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    recoverPassword();
                }
            });
        }
    }
});

// شروع تایمر هنگام بارگذاری صفحه
if (currentUser) {
    resetInactivityTimer();
}

// اضافه کردن این تابع به auth.js برای دیباگ
function debugLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput && passwordInput) {
        usernameInput.value = 'admin';
        passwordInput.value = 'admin';
        console.log('Auto-filled admin credentials for testing');
    }
}

// فراخوانی در بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    // برای تست سریع، می‌توانید این خط را فعال کنید:
    // setTimeout(debugLogin, 1000);
});