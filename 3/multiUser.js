// multiUser.js - سیستم مدیریت چند کاربره (اصلاح شده)

// این فایل دیگر تابع initializeDefaultUsers را ندارد چون در auth.js تعریف شده

// بارگذاری مدیریت کاربران
function loadUsersManagement() {
    if (!hasPermission('admin')) {
        alert('شما دسترسی لازم برای مدیریت کاربران را ندارید.');
        return;
    }
    
    // بارگذاری کاربران از localStorage
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
        console.error('No users found in localStorage');
        return;
    }
    
    const users = JSON.parse(storedUsers);
    const userList = document.getElementById('userList');
    if (!userList) return;
    
    userList.innerHTML = '';
    
    if (users.length === 0) {
        userList.innerHTML = '<div class="text-center text-gray-500 py-4">هیچ کاربری یافت نشد.</div>';
        return;
    }
    
    users.forEach((user, index) => {
        const userElement = document.createElement('div');
        userElement.className = `user-item ${user.role} ${user.isActive ? '' : 'opacity-50'} border p-4 rounded-lg mb-4`;
        userElement.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                    <h3 class="font-semibold text-lg">${user.name}</h3>
                    <p class="text-gray-600 text-sm">${user.username} - ${user.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}</p>
                    ${user.email ? `<p class="text-gray-500 text-sm mt-1"><i class="fas fa-envelope ml-1"></i> ${user.email}</p>` : ''}
                    ${user.phone ? `<p class="text-gray-500 text-sm mt-1"><i class="fas fa-phone ml-1"></i> ${user.phone}</p>` : ''}
                </div>
                <div class="flex gap-2 flex-wrap">
                    <button onclick="editUser(${index})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition">
                        <i class="fas fa-edit ml-1"></i> ویرایش
                    </button>
                    ${user.id !== 1 ? `
                        <button onclick="toggleUserActive(${index})" class="${user.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white px-3 py-1 rounded text-sm transition">
                            <i class="fas ${user.isActive ? 'fa-ban' : 'fa-check'} ml-1"></i> ${user.isActive ? 'غیرفعال' : 'فعال'}
                        </button>
                        <button onclick="deleteUser(${index})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition">
                            <i class="fas fa-trash ml-1"></i> حذف
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
                <span><i class="fas fa-calendar ml-1"></i> ایجاد شده: ${user.createdAt}</span>
                ${user.lastLogin ? `<span><i class="fas fa-sign-in-alt ml-1"></i> آخرین ورود: ${user.lastLogin}</span>` : ''}
            </div>
            ${!user.isActive ? '<div class="text-red-500 text-xs mt-2 bg-red-50 p-2 rounded"><i class="fas fa-exclamation-triangle ml-1"></i> این کاربر غیرفعال است</div>' : ''}
        `;
        userList.appendChild(userElement);
    });
}

// افزودن کاربر جدید
function addUser() {
    if (!hasPermission('admin')) {
        alert('شما دسترسی لازم برای افزودن کاربر را ندارید.');
        return;
    }
    
    const name = document.getElementById('newUserName').value.trim();
    const username = document.getElementById('newUserUsername').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    
    if (!name || !username || !password) {
        alert('لطفاً تمام فیلدهای ضروری را پر کنید.');
        return;
    }
    
    if (password.length < 4) {
        alert('رمز عبور باید حداقل ۴ کاراکتر باشد.');
        return;
    }
    
    // بارگذاری کاربران فعلی
    const storedUsers = localStorage.getItem('users');
    let users = storedUsers ? JSON.parse(storedUsers) : [];
    
    // بررسی تکراری نبودن نام کاربری
    if (users.some(u => u.username === username)) {
        alert('این نام کاربری قبلاً استفاده شده است.');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name,
        username,
        password,
        role,
        email: '',
        phone: '',
        createdAt: new persianDate().format('YYYY/MM/DD HH:mm:ss'),
        lastLogin: null,
        isActive: true
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    loadUsersManagement();
    clearUserForm();
    
    showNotification('کاربر با موفقیت افزوده شد.', 'success');
}

// ویرایش کاربر
function editUser(index) {
    if (!hasPermission('admin')) {
        alert('شما دسترسی لازم برای ویرایش کاربر را ندارید.');
        return;
    }
    
    // بارگذاری کاربران
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return;
    
    const users = JSON.parse(storedUsers);
    const user = users[index];
    
    document.getElementById('newUserName').value = user.name;
    document.getElementById('newUserUsername').value = user.username;
    document.getElementById('newUserPassword').value = user.password;
    document.getElementById('newUserRole').value = user.role;
    
    // تغییر رفتار دکمه به ویرایش
    const addButton = document.querySelector('#userManagementTab button[onclick="addUser()"]');
    if (addButton) {
        addButton.textContent = 'ویرایش کاربر';
        addButton.setAttribute('onclick', `updateUser(${index})`);
        addButton.className = addButton.className.replace('bg-blue-600', 'bg-green-600').replace('hover:bg-blue-700', 'hover:bg-green-700');
    }
}

// به‌روزرسانی کاربر
function updateUser(index) {
    if (!hasPermission('admin')) {
        alert('شما دسترسی لازم برای ویرایش کاربر را ندارید.');
        return;
    }
    
    const name = document.getElementById('newUserName').value.trim();
    const username = document.getElementById('newUserUsername').value.trim();
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    
    if (!name || !username || !password) {
        alert('لطفاً تمام فیلدهای ضروری را پر کنید.');
        return;
    }
    
    // بارگذاری کاربران
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return;
    
    let users = JSON.parse(storedUsers);
    
    // بررسی تکراری نبودن نام کاربری (به جز کاربر جاری)
    if (users.some((u, i) => u.username === username && i !== index)) {
        alert('این نام کاربری قبلاً استفاده شده است.');
        return;
    }
    
    users[index] = {
        ...users[index],
        name,
        username,
        password,
        role
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    loadUsersManagement();
    clearUserForm();
    
    // بازگرداندن دکمه به حالت عادی
    const addButton = document.querySelector('#userManagementTab button[onclick="updateUser(' + index + ')"]');
    if (addButton) {
        addButton.textContent = 'افزودن کاربر';
        addButton.setAttribute('onclick', 'addUser()');
        addButton.className = addButton.className.replace('bg-green-600', 'bg-blue-600').replace('hover:bg-green-700', 'hover:bg-blue-700');
    }
    
    showNotification('کاربر با موفقیت ویرایش شد.', 'success');
}

// حذف کاربر
function deleteUser(index) {
    if (!hasPermission('admin')) {
        alert('شما دسترسی لازم برای حذف کاربر را ندارید.');
        return;
    }
    
    // بارگذاری کاربران
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return;
    
    const users = JSON.parse(storedUsers);
    const user = users[index];
    
    if (user.id === 1) {
        alert('امکان حذف کاربر اصلی مدیر وجود ندارد.');
        return;
    }
    
    if (confirm(`آیا از حذف کاربر "${user.name}" اطمینان دارید؟`)) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        loadUsersManagement();
        showNotification('کاربر با موفقیت حذف شد.', 'success');
    }
}

// فعال/غیرفعال کردن کاربر
function toggleUserActive(index) {
    if (!hasPermission('admin')) {
        alert('شما دسترسی لازم برای این عمل را ندارید.');
        return;
    }
    
    // بارگذاری کاربران
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return;
    
    const users = JSON.parse(storedUsers);
    const user = users[index];
    
    if (user.id === 1) {
        alert('امکان غیرفعال کردن کاربر اصلی مدیر وجود ندارد.');
        return;
    }
    
    user.isActive = !user.isActive;
    localStorage.setItem('users', JSON.stringify(users));
    loadUsersManagement();
    
    const action = user.isActive ? 'فعال' : 'غیرفعال';
    showNotification(`کاربر با موفقیت ${action} شد.`, 'success');
}

// پاک کردن فرم کاربر
function clearUserForm() {
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserRole').value = 'user';
    
    // بازگرداندن دکمه به حالت عادی
    const addButton = document.querySelector('#userManagementTab button[onclick^="updateUser"]');
    if (addButton) {
        addButton.textContent = 'افزودن کاربر';
        addButton.setAttribute('onclick', 'addUser()');
        addButton.className = addButton.className.replace('bg-green-600', 'bg-blue-600').replace('hover:bg-green-700', 'hover:bg-blue-700');
    }
}

// بارگذاری داده‌های کاربر
function loadUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) return;
    
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
    
    // به‌روزرسانی متغیرهای جهانی
    if (window.sellers) window.sellers = userData.sellers || [];
    if (window.customers) window.customers = userData.customers || [];
    if (window.products) window.products = userData.products || [];
    
    // بارگذاری در رابط کاربری
    if (typeof loadSellers === 'function') loadSellers();
    if (typeof loadCustomers === 'function') loadCustomers();
    if (typeof loadProducts === 'function') loadProducts();
    if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
}

// ذخیره داده‌های کاربر
function saveUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) return;
    
    const userData = {
        sellers: window.sellers || [],
        customers: window.customers || [],
        products: window.products || [],
        invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
        customerAccounts: JSON.parse(localStorage.getItem('customerAccounts') || '{}')
    };
    
    localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
}

// گرفتن آمار کاربران
function getUserStats() {
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return { total: 0, active: 0, admins: 0, users: 0, inactive: 0 };
    
    const users = JSON.parse(storedUsers);
    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        admins: users.filter(u => u.role === 'admin' && u.isActive).length,
        users: users.filter(u => u.role === 'user' && u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
    };
    
    return stats;
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    // کاربران پیش‌فرض در auth.js ایجاد می‌شوند
    console.log('Multi-user system initialized');
});