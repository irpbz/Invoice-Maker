// indexedDB.js - مدیریت ذخیره‌سازی در IndexedDB

const DB_NAME = 'InvoiceSystemDB';
const DB_VERSION = 3; // افزایش نسخه برای پشتیبانی بهتر
let db;

// باز کردن یا ایجاد دیتابیس
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            
            // اضافه کردن event handler برای خطاهای connection
            db.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
            };
            
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            const oldVersion = event.oldVersion;
            
            console.log(`Upgrading IndexedDB from version ${oldVersion} to ${DB_VERSION}`);
            
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
            
            // در نسخه 3، اضافه کردن indexes برای جستجوی بهتر
            if (oldVersion < 3) {
                // اضافه کردن indexes به existing stores
                const stores = ['sellers', 'customers', 'products', 'invoices'];
                stores.forEach(storeName => {
                    if (database.objectStoreNames.contains(storeName)) {
                        const store = request.transaction.objectStore(storeName);
                        // ایجاد index برای جستجوی سریع‌تر
                        if (storeName === 'products' && !store.indexNames.contains('code')) {
                            store.createIndex('code', 'code', { unique: true });
                        }
                        if (storeName === 'customers' && !store.indexNames.contains('nationalId')) {
                            store.createIndex('nationalId', 'nationalId', { unique: false });
                        }
                    }
                });
                
                // ایجاد store برای لاگ‌ها
                if (!database.objectStoreNames.contains('syncLogs')) {
                    database.createObjectStore('syncLogs', { keyPath: 'id', autoIncrement: true });
                }
                if (!database.objectStoreNames.contains('syncErrors')) {
                    database.createObjectStore('syncErrors', { keyPath: 'id', autoIncrement: true });
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
        
        // اضافه کردن timestamp اگر وجود ندارد
        if (typeof data === 'object' && !Array.isArray(data)) {
            if (!data.createdAt) {
                data.createdAt = new Date().toISOString();
            }
            data.updatedAt = new Date().toISOString();
        }
        
        const request = store.put(data);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        transaction.oncomplete = () => {
            console.log(`✅ Data saved to ${storeName}`);
        };
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

// همگام‌سازی localStorage با IndexedDB - بهبود یافته
async function syncWithIndexedDB() {
    try {
        await openDatabase();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const syncResults = {
            sellers: 0,
            customers: 0,
            products: 0,
            invoices: 0,
            customerAccounts: 0,
            userData: 0
        };
        
        // ذخیره کاربر جاری
        if (currentUser && currentUser.id) {
            await saveToIndexedDB('users', currentUser);
            syncResults.users = 1;
        }
        
        // ذخیره داده‌های کاربر جاری
        if (currentUser && currentUser.id) {
            const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
            if (Object.keys(userData).length > 0) {
                await saveToIndexedDB('userData', {
                    userId: currentUser.id,
                    data: userData,
                    lastSync: new Date().toISOString()
                });
                syncResults.userData = 1;
                
                // ذخیره جداگانه هر entity برای جستجوی بهتر
                if (userData.sellers && userData.sellers.length > 0) {
                    for (const seller of userData.sellers) {
                        await saveToIndexedDB('sellers', { ...seller, userId: currentUser.id });
                    }
                    syncResults.sellers = userData.sellers.length;
                }
                
                if (userData.customers && userData.customers.length > 0) {
                    for (const customer of userData.customers) {
                        await saveToIndexedDB('customers', { ...customer, userId: currentUser.id });
                    }
                    syncResults.customers = userData.customers.length;
                }
                
                if (userData.products && userData.products.length > 0) {
                    for (const product of userData.products) {
                        await saveToIndexedDB('products', { ...product, userId: currentUser.id });
                    }
                    syncResults.products = userData.products.length;
                }
            }
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
                if (Array.isArray(data) && data.length > 0) {
                    for (const item of data) {
                        await saveToIndexedDB(storeName, item);
                    }
                    syncResults[storeName] = data.length;
                } else if (typeof data === 'object' && Object.keys(data).length > 0) {
                    await saveToIndexedDB(storeName, { id: 'main', data });
                    syncResults[storeName] = 1;
                }
            }
        }
        
        // ذخیره لاگ همگام‌سازی
        await saveToIndexedDB('syncLogs', {
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            results: syncResults,
            type: 'auto-sync'
        });
        
        console.log('✅ Data synced with IndexedDB:', syncResults);
        showNotification('داده‌ها با IndexedDB همگام‌سازی شدند.', 'success');
        return syncResults;
    } catch (error) {
        console.error('❌ Sync error:', error);
        
        // ذخیره خطای همگام‌سازی
        try {
            if (db) {
                await saveToIndexedDB('syncErrors', {
                    timestamp: new Date().toISOString(),
                    error: error.message,
                    stack: error.stack
                });
            }
        } catch (logError) {
            console.error('Failed to log sync error:', logError);
        }
        
        showNotification('خطا در همگام‌سازی با IndexedDB.', 'error');
        throw error;
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
    openDatabase().then(() => {
        console.log('✅ IndexedDB connection established');
    }).catch(error => {
        console.error('❌ Failed to open IndexedDB:', error);
    });
});