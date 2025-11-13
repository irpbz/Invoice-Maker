// indexedDB.js - مدیریت ذخیره‌سازی در IndexedDB با مدیریت خطای بهبود یافته

const DB_NAME = 'InvoiceSystemDB';
const DB_VERSION = 4; // افزایش نسخه
let db = null;
let isInitialized = false;

// تابع برای بررسی پشتیبانی مرورگر از IndexedDB
function isIndexedDBSupported() {
    return 'indexedDB' in window;
}

// باز کردن یا ایجاد دیتابیس با مدیریت خطای بهتر
function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!isIndexedDBSupported()) {
            const error = new Error('مرورگر شما از IndexedDB پشتیبانی نمی‌کند');
            console.error('❌ IndexedDB not supported');
            reject(error);
            return;
        }

        console.log('🔧 Opening IndexedDB...');
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('❌ IndexedDB open error:', event.target.error);
            reject(new Error(`خطا در باز کردن دیتابیس: ${event.target.error.message}`));
        };
        
        request.onblocked = (event) => {
            console.warn('⚠️ IndexedDB blocked:', event);
            showNotification('دیتابیس مسدود شده است. لطفاً تب‌های دیگر را ببندید.', 'warning');
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            isInitialized = true;
            
            // اضافه کردن event handler برای خطاهای connection
            db.onerror = (dbEvent) => {
                console.error('💥 Database error:', dbEvent.target.error);
            };
            
            db.onversionchange = (dbEvent) => {
                console.log('🔄 Database version changed');
                db.close();
                isInitialized = false;
            };
            
            console.log('✅ IndexedDB connection established successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            console.log('🔄 IndexedDB upgrade needed');
            const database = event.target.result;
            const oldVersion = event.oldVersion;
            
            console.log(`📊 Upgrading from version ${oldVersion} to ${DB_VERSION}`);
            
            try {
                // ایجاد object stores برای نسخه جدید
                if (oldVersion < 1 || !database.objectStoreNames.contains('sellers')) {
                    console.log('📦 Creating sellers store');
                    database.createObjectStore('sellers', { keyPath: 'id', autoIncrement: true });
                }
                
                if (oldVersion < 1 || !database.objectStoreNames.contains('customers')) {
                    console.log('📦 Creating customers store');
                    database.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
                }
                
                if (oldVersion < 1 || !database.objectStoreNames.contains('products')) {
                    console.log('📦 Creating products store');
                    database.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
                }
                
                if (oldVersion < 1 || !database.objectStoreNames.contains('invoices')) {
                    console.log('📦 Creating invoices store');
                    database.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
                }
                
                if (oldVersion < 1 || !database.objectStoreNames.contains('customerAccounts')) {
                    console.log('📦 Creating customerAccounts store');
                    database.createObjectStore('customerAccounts', { keyPath: 'customerId' });
                }
                
                // در نسخه 2، اضافه کردن store برای کاربران
                if (oldVersion < 2 || !database.objectStoreNames.contains('users')) {
                    console.log('📦 Creating users store');
                    database.createObjectStore('users', { keyPath: 'id' });
                }
                
                if (oldVersion < 2 || !database.objectStoreNames.contains('userData')) {
                    console.log('📦 Creating userData store');
                    database.createObjectStore('userData', { keyPath: 'userId' });
                }
                
                // در نسخه 3، اضافه کردن indexes برای جستجوی بهتر
                if (oldVersion < 3) {
                    console.log('📦 Adding indexes...');
                    const stores = ['sellers', 'customers', 'products', 'invoices'];
                    stores.forEach(storeName => {
                        if (database.objectStoreNames.contains(storeName)) {
                            const store = event.currentTarget.transaction.objectStore(storeName);
                            if (storeName === 'products' && !store.indexNames.contains('code')) {
                                store.createIndex('code', 'code', { unique: true });
                            }
                            if (storeName === 'customers' && !store.indexNames.contains('nationalId')) {
                                store.createIndex('nationalId', 'nationalId', { unique: false });
                            }
                        }
                    });
                }
                
                // در نسخه 4، ایجاد store برای لاگ‌ها
                if (oldVersion < 4 || !database.objectStoreNames.contains('syncLogs')) {
                    console.log('📦 Creating syncLogs store');
                    database.createObjectStore('syncLogs', { keyPath: 'id', autoIncrement: true });
                }
                
                if (oldVersion < 4 || !database.objectStoreNames.contains('syncErrors')) {
                    console.log('📦 Creating syncErrors store');
                    database.createObjectStore('syncErrors', { keyPath: 'id', autoIncrement: true });
                }
                
                console.log('✅ Database upgrade completed successfully');
            } catch (upgradeError) {
                console.error('❌ Database upgrade failed:', upgradeError);
                reject(upgradeError);
            }
        };
    });
}

// تابع کمکی برای اطمینان از اتصال به دیتابیس
async function ensureDatabaseConnection() {
    if (!db || !isInitialized) {
        await openDatabase();
    }
    return db;
}

// ذخیره داده در IndexedDB با مدیریت خطای بهتر
async function saveToIndexedDB(storeName, data) {
    try {
        const database = await ensureDatabaseConnection();
        
        return new Promise((resolve, reject) => {
            try {
                const transaction = database.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // اضافه کردن timestamp اگر وجود ندارد
                if (typeof data === 'object' && !Array.isArray(data)) {
                    if (!data.createdAt) {
                        data.createdAt = new Date().toISOString();
                    }
                    data.updatedAt = new Date().toISOString();
                }
                
                const request = store.put(data);
                
                request.onerror = (event) => {
                    console.error(`❌ Error saving to ${storeName}:`, event.target.error);
                    reject(new Error(`خطا در ذخیره‌سازی در ${storeName}: ${event.target.error.message}`));
                };
                
                request.onsuccess = () => {
                    console.log(`✅ Data saved to ${storeName}`);
                    resolve(request.result);
                };
                
                transaction.oncomplete = () => {
                    console.log(`✅ Transaction completed for ${storeName}`);
                };
                
                transaction.onerror = (event) => {
                    console.error(`❌ Transaction error for ${storeName}:`, event.target.error);
                    reject(new Error(`خطای تراکنش برای ${storeName}: ${event.target.error.message}`));
                };
                
            } catch (transactionError) {
                console.error(`❌ Transaction creation error for ${storeName}:`, transactionError);
                reject(new Error(`خطا در ایجاد تراکنش برای ${storeName}`));
            }
        });
    } catch (error) {
        console.error(`❌ Database connection error for ${storeName}:`, error);
        throw error;
    }
}

// خواندن داده از IndexedDB
async function getFromIndexedDB(storeName, key) {
    try {
        const database = await ensureDatabaseConnection();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onerror = (event) => {
                console.error(`❌ Error reading from ${storeName}:`, event.target.error);
                reject(new Error(`خطا در خواندن از ${storeName}`));
            };
            
            request.onsuccess = () => {
                resolve(request.result);
            };
        });
    } catch (error) {
        console.error(`❌ Error in getFromIndexedDB for ${storeName}:`, error);
        throw error;
    }
}

// گرفتن همه داده‌ها از یک store
async function getAllFromIndexedDB(storeName) {
    try {
        const database = await ensureDatabaseConnection();
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onerror = (event) => {
                console.error(`❌ Error getting all from ${storeName}:`, event.target.error);
                reject(new Error(`خطا در دریافت داده‌ها از ${storeName}`));
            };
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
        });
    } catch (error) {
        console.error(`❌ Error in getAllFromIndexedDB for ${storeName}:`, error);
        return []; // بازگرداندن آرایه خالی به جای پرتاب خطا
    }
}

// همگام‌سازی localStorage با IndexedDB - ساده‌سازی شده
async function syncWithIndexedDB() {
    console.log('🔄 Starting sync with IndexedDB...');
    
    try {
        await ensureDatabaseConnection();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        let userData;
        
        // دریافت داده‌های کاربر
        if (currentUser && currentUser.id) {
            userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
        } else {
            userData = {
                sellers: JSON.parse(localStorage.getItem('sellers') || '[]'),
                customers: JSON.parse(localStorage.getItem('customers') || '[]'),
                products: JSON.parse(localStorage.getItem('products') || '[]')
            };
        }
        
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const customerAccounts = JSON.parse(localStorage.getItem('customerAccounts') || '{}');
        
        // ذخیره داده‌های اصلی
        const syncPromises = [];
        
        // ذخیره کاربر جاری
        if (currentUser && currentUser.id) {
            syncPromises.push(
                saveToIndexedDB('users', currentUser).catch(error => {
                    console.error('❌ Error saving user:', error);
                })
            );
        }
        
        // ذخیره داده‌های کاربر
        if (currentUser && currentUser.id) {
            syncPromises.push(
                saveToIndexedDB('userData', {
                    userId: currentUser.id,
                    data: userData,
                    lastSync: new Date().toISOString()
                }).catch(error => {
                    console.error('❌ Error saving user data:', error);
                })
            );
        }
        
        // ذخیره فروشندگان
        if (userData.sellers && userData.sellers.length > 0) {
            userData.sellers.forEach((seller, index) => {
                syncPromises.push(
                    saveToIndexedDB('sellers', {
                        ...seller,
                        syncId: `${currentUser?.id || 'anonymous'}_${index}`,
                        userId: currentUser?.id || 'anonymous'
                    }).catch(error => {
                        console.error('❌ Error saving seller:', error);
                    })
                );
            });
        }
        
        // ذخیره مشتریان
        if (userData.customers && userData.customers.length > 0) {
            userData.customers.forEach((customer, index) => {
                syncPromises.push(
                    saveToIndexedDB('customers', {
                        ...customer,
                        syncId: `${currentUser?.id || 'anonymous'}_${index}`,
                        userId: currentUser?.id || 'anonymous'
                    }).catch(error => {
                        console.error('❌ Error saving customer:', error);
                    })
                );
            });
        }
        
        // ذخیره محصولات
        if (userData.products && userData.products.length > 0) {
            userData.products.forEach((product, index) => {
                syncPromises.push(
                    saveToIndexedDB('products', {
                        ...product,
                        syncId: `${currentUser?.id || 'anonymous'}_${index}`,
                        userId: currentUser?.id || 'anonymous'
                    }).catch(error => {
                        console.error('❌ Error saving product:', error);
                    })
                );
            });
        }
        
        // ذخیره فاکتورها
        if (invoices && invoices.length > 0) {
            invoices.forEach((invoice, index) => {
                syncPromises.push(
                    saveToIndexedDB('invoices', {
                        ...invoice,
                        syncId: `${currentUser?.id || 'anonymous'}_${index}`,
                        userId: currentUser?.id || 'anonymous'
                    }).catch(error => {
                        console.error('❌ Error saving invoice:', error);
                    })
                );
            });
        }
        
        // ذخیره حساب‌های مشتریان
        if (Object.keys(customerAccounts).length > 0) {
            Object.entries(customerAccounts).forEach(([customerId, account]) => {
                syncPromises.push(
                    saveToIndexedDB('customerAccounts', {
                        customerId: customerId,
                        ...account,
                        userId: currentUser?.id || 'anonymous'
                    }).catch(error => {
                        console.error('❌ Error saving customer account:', error);
                    })
                );
            });
        }
        
        // اجرای تمام عملیات ذخیره‌سازی
        await Promise.allSettled(syncPromises);
        
        // ذخیره لاگ همگام‌سازی موفق
        await saveToIndexedDB('syncLogs', {
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 'anonymous',
            type: 'sync',
            status: 'success',
            message: 'همگام‌سازی با موفقیت انجام شد'
        }).catch(error => {
            console.error('❌ Error saving sync log:', error);
        });
        
        console.log('✅ Sync completed successfully');
        showNotification('داده‌ها با موفقیت در IndexedDB ذخیره شدند.', 'success');
        
        return { success: true, message: 'همگام‌سازی موفقیت‌آمیز بود' };
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        
        // ذخیره خطای همگام‌سازی
        try {
            await saveToIndexedDB('syncErrors', {
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack,
                type: 'sync_error'
            });
        } catch (logError) {
            console.error('❌ Failed to log sync error:', logError);
        }
        
        showNotification('خطا در همگام‌سازی با IndexedDB. داده‌ها فقط در localStorage ذخیره شدند.', 'warning');
        
        return { 
            success: false, 
            message: 'همگام‌سازی ناموفق',
            error: error.message 
        };
    }
}

// بارگذاری داده‌ها از IndexedDB به localStorage
async function loadFromIndexedDB() {
    console.log('🔄 Loading data from IndexedDB...');
    
    try {
        await ensureDatabaseConnection();
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (currentUser && currentUser.id) {
            // بارگذاری داده‌های کاربر
            const userData = await getFromIndexedDB('userData', currentUser.id);
            if (userData && userData.data) {
                localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData.data));
                console.log('✅ User data loaded from IndexedDB');
            }
        }
        
        // بارگذاری فاکتورها و حساب‌های مشتریان از stores جداگانه
        const invoices = await getAllFromIndexedDB('invoices');
        const customerAccounts = await getAllFromIndexedDB('customerAccounts');
        
        if (invoices.length > 0) {
            // فیلتر کردن فاکتورهای مربوط به کاربر جاری
            const userInvoices = invoices.filter(invoice => 
                !invoice.userId || invoice.userId === (currentUser?.id || 'anonymous')
            );
            localStorage.setItem('invoices', JSON.stringify(userInvoices));
            console.log('✅ Invoices loaded from IndexedDB');
        }
        
        if (customerAccounts.length > 0) {
            const accountsObj = {};
            customerAccounts.forEach(account => {
                if (!account.userId || account.userId === (currentUser?.id || 'anonymous')) {
                    accountsObj[account.customerId] = account;
                }
            });
            localStorage.setItem('customerAccounts', JSON.stringify(accountsObj));
            console.log('✅ Customer accounts loaded from IndexedDB');
        }
        
        showNotification('داده‌ها با موفقیت از IndexedDB بارگذاری شدند.', 'success');
        return { success: true, message: 'بارگذاری موفقیت‌آمیز بود' };
        
    } catch (error) {
        console.error('❌ Load from IndexedDB failed:', error);
        showNotification('خطا در بارگذاری داده‌ها از IndexedDB.', 'error');
        return { success: false, message: 'بارگذاری ناموفق', error: error.message };
    }
}

// پشتیبان‌گیری از IndexedDB
async function backupIndexedDB() {
    try {
        await ensureDatabaseConnection();
        
        const stores = ['sellers', 'customers', 'products', 'invoices', 'customerAccounts', 'users', 'userData'];
        const backup = {};
        
        for (const storeName of stores) {
            backup[storeName] = await getAllFromIndexedDB(storeName);
        }
        
        backup.backupDate = new Date().toISOString();
        backup.version = DB_VERSION;
        
        // ذخیره پشتیبان در localStorage
        localStorage.setItem('indexedDBBackup', JSON.stringify(backup));
        
        console.log('✅ IndexedDB backup created');
        showNotification('پشتیبان IndexedDB ایجاد شد.', 'success');
        
        return backup;
    } catch (error) {
        console.error('❌ Backup error:', error);
        showNotification('خطا در ایجاد پشتیبان IndexedDB.', 'error');
        return null;
    }
}

// تابع برای بررسی وضعیت IndexedDB
async function checkIndexedDBStatus() {
    try {
        if (!isIndexedDBSupported()) {
            return { supported: false, status: 'not_supported' };
        }
        
        await ensureDatabaseConnection();
        
        // بررسی وجود داده
        const stores = ['sellers', 'customers', 'products', 'invoices'];
        let totalItems = 0;
        
        for (const storeName of stores) {
            const items = await getAllFromIndexedDB(storeName);
            totalItems += items.length;
        }
        
        return {
            supported: true,
            status: 'connected',
            totalItems: totalItems,
            dbName: DB_NAME,
            version: DB_VERSION
        };
    } catch (error) {
        return {
            supported: true,
            status: 'error',
            error: error.message
        };
    }
}

// تابع برای پاک کردن و بازسازی دیتابیس (در صورت نیاز)
async function resetIndexedDB() {
    if (confirm('آیا از پاک کردن و بازسازی کامل IndexedDB اطمینان دارید؟ این عمل غیرقابل برگشت است!')) {
        try {
            if (db) {
                db.close();
            }
            
            const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
            
            return new Promise((resolve, reject) => {
                deleteRequest.onsuccess = () => {
                    console.log('✅ IndexedDB deleted successfully');
                    db = null;
                    isInitialized = false;
                    showNotification('IndexedDB با موفقیت پاک شد.', 'success');
                    resolve();
                };
                
                deleteRequest.onerror = (event) => {
                    console.error('❌ Error deleting IndexedDB:', event.target.error);
                    reject(new Error('خطا در پاک کردن IndexedDB'));
                };
                
                deleteRequest.onblocked = () => {
                    console.warn('⚠️ IndexedDB deletion blocked');
                    showNotification('حذف IndexedDB مسدود شده است. لطفاً تب‌های دیگر را ببندید.', 'warning');
                    reject(new Error('حذف IndexedDB مسدود شده است'));
                };
            });
        } catch (error) {
            console.error('❌ Reset error:', error);
            showNotification('خطا در بازنشانی IndexedDB.', 'error');
            throw error;
        }
    }
}

// نمایش وضعیت IndexedDB
async function showIndexedDBStatus() {
    const status = await checkIndexedDBStatus();
    
    let statusText = '';
    let statusColor = '';
    
    if (!status.supported) {
        statusText = '❌ IndexedDB پشتیبانی نمی‌شود';
        statusColor = 'text-red-600';
    } else if (status.status === 'connected') {
        statusText = `✅ IndexedDB متصل است (${status.totalItems} آیتم)`;
        statusColor = 'text-green-600';
    } else {
        statusText = `⚠️ خطا در اتصال: ${status.error}`;
        statusColor = 'text-yellow-600';
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4">وضعیت IndexedDB</h3>
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span>پشتیبانی مرورگر:</span>
                    <span class="${status.supported ? 'text-green-600' : 'text-red-600'}">
                        ${status.supported ? '✅ دارد' : '❌ ندارد'}
                    </span>
                </div>
                <div class="flex justify-between">
                    <span>وضعیت اتصال:</span>
                    <span class="${statusColor}">${statusText}</span>
                </div>
                ${status.supported ? `
                <div class="flex justify-between">
                    <span>نام دیتابیس:</span>
                    <span>${status.dbName}</span>
                </div>
                <div class="flex justify-between">
                    <span>نسخه:</span>
                    <span>${status.version}</span>
                </div>
                <div class="flex justify-between">
                    <span>تعداد آیتم‌ها:</span>
                    <span>${status.totalItems || 0}</span>
                </div>
                ` : ''}
            </div>
            <div class="mt-6 flex justify-end gap-2">
                <button onclick="resetIndexedDB()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                    بازنشانی دیتابیس
                </button>
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
    console.log('🚀 Initializing IndexedDB...');
    
    // باز کردن connection به IndexedDB هنگام بارگذاری صفحه
    openDatabase().then(() => {
        console.log('✅ IndexedDB initialized successfully');
    }).catch(error => {
        console.error('❌ IndexedDB initialization failed:', error);
        showNotification('خطا در راه‌اندازی IndexedDB. داده‌ها فقط در localStorage ذخیره می‌شوند.', 'warning');
    });
});

// اضافه کردن توابع به global scope برای دسترسی از HTML
window.syncWithIndexedDB = syncWithIndexedDB;
window.loadFromIndexedDB = loadFromIndexedDB;
window.backupIndexedDB = backupIndexedDB;
window.checkIndexedDBStatus = checkIndexedDBStatus;
window.showIndexedDBStatus = showIndexedDBStatus;
window.resetIndexedDB = resetIndexedDB;