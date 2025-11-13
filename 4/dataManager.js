// dataManager.js - مدیریت ذخیره‌سازی و بازیابی داده‌ها

// تابع برای export تمام داده‌ها به فایل JSON
function exportData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let data;
    
    if (currentUser && currentUser.id) {
        data = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
    } else {
        data = {
            sellers: JSON.parse(localStorage.getItem('sellers') || '[]'),
            customers: JSON.parse(localStorage.getItem('customers') || '[]'),
            products: JSON.parse(localStorage.getItem('products') || '[]'),
            invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
            customerAccounts: JSON.parse(localStorage.getItem('customerAccounts') || '{}')
        };
    }

    data.version = '2.0';
    data.exportDate = new persianDate().format('YYYY/MM/DD HH:mm:ss');
    data.exportedBy = currentUser.name || 'کاربر';

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `invoice_system_backup_${new persianDate().format('YYYY-MM-DD')}.json`;
    link.click();
    
    showNotification('داده‌ها با موفقیت ذخیره شدند.', 'success');
}

// تابع برای import داده‌ها از فایل JSON
function importData() {
    document.getElementById('importFile').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('آیا از بازیابی داده‌ها اطمینان دارید؟ داده‌های فعلی overwrite خواهند شد.')) {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                
                if (currentUser && currentUser.id) {
                    localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(data));
                } else {
                    // ذخیره در localStorage قدیمی برای سازگاری
                    if (data.sellers) localStorage.setItem('sellers', JSON.stringify(data.sellers));
                    if (data.customers) localStorage.setItem('customers', JSON.stringify(data.customers));
                    if (data.products) localStorage.setItem('products', JSON.stringify(data.products));
                    if (data.invoices) localStorage.setItem('invoices', JSON.stringify(data.invoices));
                    if (data.customerAccounts) localStorage.setItem('customerAccounts', JSON.stringify(data.customerAccounts));
                }
                
                // بارگذاری مجدد داده‌ها
                if (typeof loadUserData === 'function') loadUserData();
                if (typeof loadSellers === 'function') loadSellers();
                if (typeof loadCustomers === 'function') loadCustomers();
                if (typeof loadProducts === 'function') loadProducts();
                if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
                
                // همگام‌سازی با IndexedDB
                if (typeof syncWithIndexedDB === 'function') {
                    await syncWithIndexedDB();
                }
                
                showNotification('داده‌ها با موفقیت بازیابی شدند.', 'success');
            }
        } catch (error) {
            showNotification('خطا در بازیابی فایل. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
    
    // reset file input
    event.target.value = '';
}

// تابع پشتیبان‌گیری خودکار
function autoBackup() {
    const lastBackup = localStorage.getItem('lastAutoBackup');
    const today = new persianDate().format('YYYY/MM/DD');
    
    if (lastBackup !== today) {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            let data;
            
            if (currentUser && currentUser.id) {
                data = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
            } else {
                data = {
                    sellers: JSON.parse(localStorage.getItem('sellers') || '[]'),
                    customers: JSON.parse(localStorage.getItem('customers') || '[]'),
                    products: JSON.parse(localStorage.getItem('products') || '[]'),
                    invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
                    customerAccounts: JSON.parse(localStorage.getItem('customerAccounts') || '{}')
                };
            }
            
            data.autoBackupDate = new persianDate().format('YYYY/MM/DD HH:mm:ss');
            localStorage.setItem('autoBackup', JSON.stringify(data));
            localStorage.setItem('lastAutoBackup', today);
            
            // همگام‌سازی با IndexedDB
            if (typeof syncWithIndexedDB === 'function') {
                syncWithIndexedDB().catch(error => {
                    console.error('Auto-backup sync failed:', error);
                });
            }
            
            console.log('Auto backup completed');
        } catch (error) {
            console.error('Auto backup error:', error);
        }
    }
}

// بازیابی از پشتیبان خودکار
async function restoreAutoBackup() {
    try {
        const backup = JSON.parse(localStorage.getItem('autoBackup') || '{}');
        if (Object.keys(backup).length === 0) {
            showNotification('پشتیبان خودکاری یافت نشد.', 'warning');
            return;
        }
        
        if (confirm('آیا از بازیابی از پشتیبان خودکار اطمینان دارید؟ داده‌های فعلی overwrite خواهند شد.')) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            if (currentUser && currentUser.id) {
                localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(backup));
            } else {
                if (backup.sellers) localStorage.setItem('sellers', JSON.stringify(backup.sellers));
                if (backup.customers) localStorage.setItem('customers', JSON.stringify(backup.customers));
                if (backup.products) localStorage.setItem('products', JSON.stringify(backup.products));
                if (backup.invoices) localStorage.setItem('invoices', JSON.stringify(backup.invoices));
                if (backup.customerAccounts) localStorage.setItem('customerAccounts', JSON.stringify(backup.customerAccounts));
            }
            
            // بارگذاری مجدد داده‌ها
            if (typeof loadUserData === 'function') loadUserData();
            if (typeof loadSellers === 'function') loadSellers();
            if (typeof loadCustomers === 'function') loadCustomers();
            if (typeof loadProducts === 'function') loadProducts();
            if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
            
            // همگام‌سازی با IndexedDB
            if (typeof syncWithIndexedDB === 'function') {
                await syncWithIndexedDB();
            }
            
            showNotification('داده‌ها از پشتیبان خودکار با موفقیت بازیابی شدند.', 'success');
        }
    } catch (error) {
        showNotification('خطا در بازیابی پشتیبان خودکار.', 'error');
        console.error('Restore auto backup error:', error);
    }
}

// پاک کردن تمام داده‌ها
async function clearAllData() {
    if (confirm('آیا از پاک کردن تمام داده‌ها اطمینان دارید؟ این عمل غیرقابل برگشت است!')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (currentUser && currentUser.id) {
            localStorage.removeItem(`userData_${currentUser.id}`);
        }
        
        // پاک کردن داده‌های قدیمی
        localStorage.removeItem('sellers');
        localStorage.removeItem('customers');
        localStorage.removeItem('products');
        localStorage.removeItem('invoices');
        localStorage.removeItem('customerAccounts');
        localStorage.removeItem('autoBackup');
        localStorage.removeItem('lastAutoBackup');
        
        // بارگذاری مجدد رابط کاربری
        if (typeof loadUserData === 'function') loadUserData();
        if (typeof loadSellers === 'function') loadSellers();
        if (typeof loadCustomers === 'function') loadCustomers();
        if (typeof loadProducts === 'function') loadProducts();
        if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
        
        // پاک کردن IndexedDB
        if (typeof clearIndexedDB === 'function') {
            await clearIndexedDB();
        }
        
        showNotification('تمام داده‌ها با موفقیت پاک شدند.', 'success');
    }
}

// دریافت آمار ذخیره‌سازی
function getStorageStats() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let dataSize = 0;
    
    if (currentUser && currentUser.id) {
        const userData = localStorage.getItem(`userData_${currentUser.id}`) || '{}';
        dataSize = new Blob([userData]).size;
    } else {
        const keys = ['sellers', 'customers', 'products', 'invoices', 'customerAccounts'];
        keys.forEach(key => {
            const item = localStorage.getItem(key) || '[]';
            dataSize += new Blob([item]).size;
        });
    }
    
    const autoBackup = localStorage.getItem('autoBackup') || '{}';
    const backupSize = new Blob([autoBackup]).size;
    
    return {
        dataSize: formatFileSize(dataSize),
        backupSize: formatFileSize(backupSize),
        totalSize: formatFileSize(dataSize + backupSize)
    };
}

// نمایش اطلاعات ذخیره‌سازی
function showStorageInfo() {
    const stats = getStorageStats();
    const info = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span>حجم داده‌های اصلی:</span>
                <span class="font-semibold">${stats.dataSize}</span>
            </div>
            <div class="flex justify-between">
                <span>حجم پشتیبان‌ها:</span>
                <span class="font-semibold">${stats.backupSize}</span>
            </div>
            <div class="flex justify-between border-t pt-2">
                <span>حجم کل:</span>
                <span class="font-semibold text-blue-600">${stats.totalSize}</span>
            </div>
        </div>
    `;
    
    // ایجاد modal برای نمایش اطلاعات
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">اطلاعات ذخیره‌سازی</h3>
            ${info}
            <div class="mt-6 flex justify-end">
                <button onclick="this.closest('.fixed').remove()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    بستن
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// پشتیبان‌گیری خودکار هر بار که برنامه بارگذاری می‌شود
document.addEventListener('DOMContentLoaded', function() {
    // پشتیبان‌گیری 5 ثانیه پس از لاگین
    setTimeout(autoBackup, 5000);
    
    // پشتیبان‌گیری هر 1 ساعت
    setInterval(autoBackup, 60 * 60 * 1000);
});