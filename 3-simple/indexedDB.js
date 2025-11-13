// indexedDB.js - مدیریت ذخیره‌سازی در IndexedDB

const DB_NAME = 'InvoiceSystemDB';
const DB_VERSION = 2; // Increased version for multi-user support
let db;

// باز کردن یا ایجاد دیتابیس
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            const oldVersion = event.oldVersion;
            
            // ایجاد object stores برای نسخه جدید
            if (oldVersion < 1) {
                // ایجاد object stores اولیه
                if (!database.objectStoreNames.contains('sellers')) {
                    database.createObjectStore('sellers', { keyPath: 'id', autoIncrement: true });
                }
                if (!database.objectStoreNames.contains('customers')) {
                    database.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
                }
                if (!database.objectStoreNames.contains('products')) {
                    database.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                }
                if (!database.objectStoreNames.contains('invoices')) {
                    database.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
                }
                if (!database.objectStoreNames.contains('customerAccounts')) {
                    database.createObjectStore('customerAccounts', { keyPath: 'customerId' });
                }
            }
            
            // در نسخه 2، اضافه کردن store برای کاربران
            if (oldVersion < 2) {
                if (!database.objectStoreNames.contains('users')) {
                    database.createObjectStore('users', { keyPath: 'id' });
                }
                if (!database.objectStoreNames.contains('userData')) {
                    database.createObjectStore('userData', { keyPath: 'userId' });
                }
            }
        };
    });
}

// ذخیره داده در IndexedDB
async function saveToIndexedDB(storeName, data) {
    if (!db) await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// خواندن داده از IndexedDB
async function getFromIndexedDB(storeName, key) {
    if (!db) await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// گرفتن همه داده‌ها از یک store
async function getAllFromIndexedDB(storeName) {
    if (!db) await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// حذف داده از IndexedDB
async function deleteFromIndexedDB(storeName, key) {
    if (!db) await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// همگام‌سازی localStorage با IndexedDB
async function syncWithIndexedDB() {
    try {
        await openDatabase();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // ذخیره کاربر جاری
        if (currentUser && currentUser.id) {
            await saveToIndexedDB('users', currentUser);
        }
        
        // ذخیره داده‌های کاربر جاری
        if (currentUser && currentUser.id) {
            const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
            await saveToIndexedDB('userData', {
                userId: currentUser.id,
                data: userData,
                lastSync: new Date().toISOString()
            });
        } else {
            // ذخیره داده‌های قدیمی
            const dataToSync = {
                sellers: JSON.parse(localStorage.getItem('sellers') || '[]'),
                customers: JSON.parse(localStorage.getItem('customers') || '[]'),
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
                customerAccounts: JSON.parse(localStorage.getItem('customerAccounts') || '{}')
            };
            
            for (const [storeName, data] of Object.entries(dataToSync)) {
                await saveToIndexedDB(storeName, { id: 'main', data });
            }
        }
        
        console.log('Data synced with IndexedDB');
        showNotification('داده‌ها با IndexedDB همگام‌سازی شدند.', 'success');
    } catch (error) {
        console.error('Sync error:', error);
        showNotification('خطا در همگام‌سازی با IndexedDB.', 'error');
    }
}

// بارگذاری داده‌ها از IndexedDB به localStorage
async function loadFromIndexedDB() {
    try {
        await openDatabase();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (currentUser && currentUser.id) {
            // بارگذاری داده‌های کاربر از userData store
            const userData = await getFromIndexedDB('userData', currentUser.id);
            if (userData && userData.data) {
                localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData.data));
            }
        } else {
            // بارگذاری داده‌های قدیمی
            const stores = ['sellers', 'customers', 'products', 'invoices', 'customerAccounts'];
            
            for (const storeName of stores) {
                const result = await getFromIndexedDB(storeName, 'main');
                if (result && result.data) {
                    localStorage.setItem(storeName, JSON.stringify(result.data));
                }
            }
        }
        
        console.log('Data loaded from IndexedDB');
        showNotification('داده‌ها از IndexedDB بارگذاری شدند.', 'success');
    } catch (error) {
        console.error('Load error:', error);
        showNotification('خطا در بارگذاری داده‌ها از IndexedDB.', 'error');
    }
}

// پشتیبان‌گیری از IndexedDB
async function backupIndexedDB() {
    try {
        await openDatabase();
        
        const stores = ['sellers', 'customers', 'products', 'invoices', 'customerAccounts', 'users', 'userData'];
        const backup = {};
        
        for (const storeName of stores) {
            backup[storeName] = await getAllFromIndexedDB(storeName);
        }
        
        backup.backupDate = new Date().toISOString();
        backup.version = DB_VERSION;
        
        // ذخیره پشتیبان در localStorage
        localStorage.setItem('indexedDBBackup', JSON.stringify(backup));
        
        console.log('IndexedDB backup created');
        showNotification('پشتیبان IndexedDB ایجاد شد.', 'success');
        
        return backup;
    } catch (error) {
        console.error('Backup error:', error);
        showNotification('خطا در ایجاد پشتیبان IndexedDB.', 'error');
    }
}

// بازیابی از پشتیبان IndexedDB
async function restoreIndexedDB() {
    try {
        const backup = JSON.parse(localStorage.getItem('indexedDBBackup') || '{}');
        
        if (Object.keys(backup).length === 0) {
            showNotification('پشتیبان IndexedDB یافت نشد.', 'warning');
            return;
        }
        
        if (confirm('آیا از بازیابی از پشتیبان IndexedDB اطمینان دارید؟ داده‌های فعلی overwrite خواهند شد.')) {
            await openDatabase();
            
            for (const [storeName, data] of Object.entries(backup)) {
                if (Array.isArray(data)) {
                    for (const item of data) {
                        await saveToIndexedDB(storeName, item);
                    }
                }
            }
            
            console.log('IndexedDB restored from backup');
            showNotification('IndexedDB از پشتیبان بازیابی شد.', 'success');
        }
    } catch (error) {
        console.error('Restore error:', error);
        showNotification('خطا در بازیابی IndexedDB.', 'error');
    }
}

// پاک کردن تمام داده‌های IndexedDB
async function clearIndexedDB() {
    if (confirm('آیا از پاک کردن تمام داده‌های IndexedDB اطمینان دارید؟ این عمل غیرقابل برگشت است!')) {
        try {
            await openDatabase();
            
            const stores = ['sellers', 'customers', 'products', 'invoices', 'customerAccounts', 'users', 'userData'];
            
            for (const storeName of stores) {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onerror = () => {
                    throw new Error(`Error clearing store: ${storeName}`);
                };
            }
            
            console.log('IndexedDB cleared');
            showNotification('IndexedDB با موفقیت پاک شد.', 'success');
        } catch (error) {
            console.error('Clear error:', error);
            showNotification('خطا در پاک کردن IndexedDB.', 'error');
        }
    }
}

// دریافت آمار IndexedDB
async function getIndexedDBStats() {
    try {
        await openDatabase();
        
        const stores = ['sellers', 'customers', 'products', 'invoices', 'customerAccounts', 'users', 'userData'];
        const stats = {};
        let totalSize = 0;
        
        for (const storeName of stores) {
            const data = await getAllFromIndexedDB(storeName);
            const size = new Blob([JSON.stringify(data)]).size;
            stats[storeName] = {
                count: data.length,
                size: formatFileSize(size)
            };
            totalSize += size;
        }
        
        stats.totalSize = formatFileSize(totalSize);
        return stats;
    } catch (error) {
        console.error('Stats error:', error);
        return null;
    }
}

// نمایش آمار IndexedDB
async function showIndexedDBStats() {
    const stats = await getIndexedDBStats();
    
    if (!stats) {
        showNotification('خطا در دریافت آمار IndexedDB.', 'error');
        return;
    }
    
    let info = '<div class="space-y-2">';
    
    Object.entries(stats).forEach(([storeName, data]) => {
        if (storeName !== 'totalSize') {
            info += `
                <div class="flex justify-between">
                    <span>${storeName}:</span>
                    <span>${data.count} آیتم (${data.size})</span>
                </div>
            `;
        }
    });
    
    info += `
        <div class="flex justify-between border-t pt-2 font-semibold">
            <span>حجم کل:</span>
            <span class="text-blue-600">${stats.totalSize}</span>
        </div>
    </div>`;
    
    // ایجاد modal برای نمایش آمار
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">آمار IndexedDB</h3>
            ${info}
            <div class="mt-6 flex justify-end gap-2">
                <button onclick="this.closest('.fixed').remove()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                    بستن
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    // باز کردن connection به IndexedDB هنگام بارگذاری صفحه
    openDatabase().catch(error => {
        console.error('Failed to open IndexedDB:', error);
    });
});