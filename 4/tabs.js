// tabs.js - مدیریت تب‌ها و توابع ووکامرس
function openTab(tabId) {
    // مخفی کردن تمام تب‌ها
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // غیرفعال کردن تمام دکمه‌های تب
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // نمایش تب انتخاب شده
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // فعال کردن دکمه تب انتخاب شده
    const selectedButton = document.querySelector(`button[onclick="openTab('${tabId}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }

    // بارگذاری محتوای تب‌های خاص
    switch(tabId) {
        case 'woocommerceTab':
            if (typeof loadWoocommerceConfig === 'function') loadWoocommerceConfig();
            if (typeof updateSyncStats === 'function') updateSyncStats();
            if (typeof displaySyncStatus === 'function') displaySyncStatus();
            break;
			
        case 'invoiceManagementTab':
            if (typeof loadInvoiceFilters === 'function') loadInvoiceFilters();
            if (typeof loadAllInvoices === 'function') loadAllInvoices();
            if (typeof updateInvoiceStats === 'function') updateInvoiceStats();
            break;
            
        case 'reportsTab':
            if (typeof loadReports === 'function') loadReports();
            break;
            
        case 'userManagementTab':
            if (typeof loadUsersManagement === 'function') loadUsersManagement();
            break;
            
        case 'accountingTab':
            const paymentDate = document.getElementById('paymentDate');
            if (paymentDate) paymentDate.value = new persianDate().format('YYYY/MM/DD');
            if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
            break;
            
        case 'sellerTab':
            if (typeof loadSellers === 'function') loadSellers();
            break;
            
        case 'customerTab':
            if (typeof loadCustomers === 'function') loadCustomers();
            break;
            
        case 'inventoryTab':
            if (typeof loadProducts === 'function') loadProducts();
            break;
            
        case 'woocommerceTab':
            if (typeof loadWoocommerceConfig === 'function') loadWoocommerceConfig();
            if (typeof updateSyncStats === 'function') updateSyncStats();
            break;
    }
}

// نمایش تب مدیریت کاربران فقط برای مدیران
function checkUserRole() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userManagementTabButton = document.getElementById('userManagementTabButton');
        if (currentUser.role === 'admin' && userManagementTabButton) {
            userManagementTabButton.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error checking user role:', error);
    }
}

// تنظیم تاریخ‌های پیش‌فرض
function setDefaultDates() {
    const today = new persianDate().format('YYYY/MM/DD');
    
    const dateFields = [
        'invoiceDate', 'paymentDate', 'reportStartDate', 
        'reportEndDate', 'invoiceDateFilter'
    ];
    
    dateFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && !element.value) {
            element.value = today;
        }
    });
}

// ============================================================================
// توابع مدیریت ووکامرس
// ============================================================================

function saveWoocommerceConfig() {
    if (typeof window.woocommerce === 'undefined') {
        showNotification('ماژول ووکامرس بارگذاری نشده است', 'error');
        return;
    }

    const apiUrl = document.getElementById('wcApiUrl').value.trim();
    const consumerKey = document.getElementById('wcConsumerKey').value.trim();
    const consumerSecret = document.getElementById('wcConsumerSecret').value.trim();

    if (!apiUrl || !consumerKey || !consumerSecret) {
        showNotification('لطفاً تمام فیلدها را پر کنید', 'error');
        return;
    }

    try {
        window.woocommerce.setConfig(apiUrl, consumerKey, consumerSecret);
        showNotification('تنظیمات با موفقیت ذخیره شد', 'success');
    } catch (error) {
        showNotification(`خطا در ذخیره تنظیمات: ${error.message}`, 'error');
    }
}

async function testWoocommerceConnection() {
    if (typeof window.woocommerce === 'undefined') {
        showNotification('ماژول ووکامرس بارگذاری نشده است', 'error');
        return;
    }

    const statusElement = document.getElementById('connectionStatus');
    
    try {
        statusElement.className = 'p-3 rounded-lg bg-blue-100 text-blue-800';
        statusElement.innerHTML = '<i class="fas fa-sync fa-spin ml-1"></i> در حال آزمایش اتصال...';
        statusElement.classList.remove('hidden');

        const isConnected = await window.woocommerce.testConnection();
        
        if (isConnected) {
            statusElement.className = 'p-3 rounded-lg bg-green-100 text-green-800';
            statusElement.innerHTML = '<i class="fas fa-check-circle ml-1"></i> اتصال موفقیت‌آمیز بود';
            showNotification('اتصال به ووکامرس با موفقیت برقرار شد', 'success');
        } else {
            throw new Error('اتصال برقرار نشد');
        }
    } catch (error) {
        statusElement.className = 'p-3 rounded-lg bg-red-100 text-red-800';
        statusElement.innerHTML = `<i class="fas fa-times-circle ml-1"></i> خطا در اتصال: ${error.message}`;
        showNotification(`خطا در اتصال به ووکامرس: ${error.message}`, 'error');
    }
}

async function syncWoocommerceCustomers() {
    if (typeof window.woocommerce === 'undefined') {
        showNotification('ماژول ووکامرس بارگذاری نشده است', 'error');
        return;
    }

    if (window.woocommerce.isSyncing) {
        showNotification('همگام‌سازی در حال انجام است', 'warning');
        return;
    }

    try {
        addSyncLog('شروع همگام‌سازی مشتریان از ووکامرس...', 'info');
        
        let allCustomers = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && !window.woocommerce.isSyncing) {
            const response = await window.woocommerce.getCustomers(page, 50);
            
            if (response.success && response.customers.length > 0) {
                allCustomers = allCustomers.concat(response.customers);
                
                // نمایش پیشرفت
                window.woocommerce.updateProgress('customers', allCustomers.length, response.total || allCustomers.length, allCustomers);
                
                hasMore = response.hasMore;
                page++;
                
                // تأخیر کوتاه
                await new Promise(resolve => setTimeout(resolve, 200));
            } else if (!response.success) {
                throw new Error(response.error);
            } else {
                hasMore = false;
            }
        }

        if (allCustomers.length > 0) {
            await window.woocommerce.saveCustomersToSystem(allCustomers);
            addSyncLog(`همگام‌سازی مشتریان تکمیل شد: ${toPersianDigits(allCustomers.length)} مشتری`, 'success');
            showNotification(`همگام‌سازی مشتریان تکمیل شد: ${allCustomers.length} مشتری`, 'success');
        } else {
            addSyncLog('هیچ مشتری برای همگام‌سازی یافت نشد', 'warning');
            showNotification('هیچ مشتری برای همگام‌سازی یافت نشد', 'warning');
        }
    } catch (error) {
        addSyncLog(`خطا در همگام‌سازی مشتریان: ${error.message}`, 'error');
        showNotification(`خطا در همگام‌سازی مشتریان: ${error.message}`, 'error');
    } finally {
        window.woocommerce.isSyncing = false;
        updateSyncStats();
    }
}

async function syncWoocommerceProducts() {
    if (typeof window.woocommerce === 'undefined') {
        showNotification('ماژول ووکامرس بارگذاری نشده است', 'error');
        return;
    }

    if (window.woocommerce.isSyncing) {
        showNotification('همگام‌سازی در حال انجام است', 'warning');
        return;
    }

    try {
        addSyncLog('شروع همگام‌سازی محصولات از ووکامرس...', 'info');
        
        let allProducts = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && !window.woocommerce.isSyncing) {
            const response = await window.woocommerce.getProducts(page, 50);
            
            if (response.success && response.products.length > 0) {
                allProducts = allProducts.concat(response.products);
                
                // نمایش پیشرفت
                window.woocommerce.updateProgress('products', allProducts.length, response.total || allProducts.length, allProducts);
                
                hasMore = response.hasMore;
                page++;
                
                // تأخیر کوتاه
                await new Promise(resolve => setTimeout(resolve, 200));
            } else if (!response.success) {
                throw new Error(response.error);
            } else {
                hasMore = false;
            }
        }

        if (allProducts.length > 0) {
            await window.woocommerce.saveProductsToSystem(allProducts);
            addSyncLog(`همگام‌سازی محصولات تکمیل شد: ${toPersianDigits(allProducts.length)} محصول`, 'success');
            showNotification(`همگام‌سازی محصولات تکمیل شد: ${allProducts.length} محصول`, 'success');
        } else {
            addSyncLog('هیچ محصول برای همگام‌سازی یافت نشد', 'warning');
            showNotification('هیچ محصول برای همگام‌سازی یافت نشد', 'warning');
        }
    } catch (error) {
        addSyncLog(`خطا در همگام‌سازی محصولات: ${error.message}`, 'error');
        showNotification(`خطا در همگام‌سازی محصولات: ${error.message}`, 'error');
    } finally {
        window.woocommerce.isSyncing = false;
        updateSyncStats();
    }
}

async function syncAllWoocommerceData() {
    if (typeof window.woocommerce === 'undefined') {
        showNotification('ماژول ووکامرس بارگذاری نشده است', 'error');
        return;
    }

    try {
        const results = await window.woocommerce.syncAllData();
        
        let message = 'همگام‌سازی کامل تکمیل شد. ';
        if (results.customers.success) {
            message += `مشتریان: ${toPersianDigits(results.customers.count)} `;
        }
        if (results.products.success) {
            message += `محصولات: ${toPersianDigits(results.products.count)}`;
        }
        
        showNotification(message, 'success');
        
    } catch (error) {
        showNotification(`خطا در همگام‌سازی کامل: ${error.message}`, 'error');
    }
}

// توقف همگام‌سازی
function stopWoocommerceSync() {
    if (typeof window.woocommerce === 'undefined') {
        showNotification('ماژول ووکامرس بارگذاری نشده است', 'error');
        return;
    }
    
    window.woocommerce.stopSync();
    showNotification('همگام‌سازی متوقف شد', 'warning');
}

// عیب‌یابی ووکامرس
async function debugWoocommerce() {
    if (typeof window.woocommerce === 'undefined') {
        showNotification('ماژول ووکامرس بارگذاری نشده است', 'error');
        return;
    }

    try {
        showNotification('در حال عیب‌یابی...', 'info');
        addSyncLog('شروع عیب‌یابی اتصال ووکامرس...', 'info');
        
        const result = await window.woocommerce.debugConnection();
        
        if (result) {
            addSyncLog('عیب‌یابی موفقیت‌آمیز بود. جزئیات در کنسول مرورگر موجود است.', 'success');
            showNotification('عیب‌یابی موفقیت‌آمیز بود. کنسول مرورگر را بررسی کنید.', 'success');
        } else {
            addSyncLog('عیب‌یابی ناموفق بود. کنسول مرورگر را بررسی کنید.', 'error');
            showNotification('عیب‌یابی ناموفق بود. کنسول مرورگر را بررسی کنید.', 'error');
        }
    } catch (error) {
        addSyncLog(`خطا در عیب‌یابی: ${error.message}`, 'error');
        showNotification(`خطا در عیب‌یابی: ${error.message}`, 'error');
    }
}

// به‌روزرسانی آمار همگام‌سازی
function updateSyncStats() {
    try {
        const customers = window.customers || JSON.parse(localStorage.getItem('customers') || '[]');
        const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
        
        const woocommerceCustomers = customers.filter(c => c.woocommerceId).length;
        const woocommerceProducts = products.filter(p => p.woocommerceId).length;
        
        if (document.getElementById('totalCustomers')) {
            document.getElementById('totalCustomers').textContent = toPersianDigits(woocommerceCustomers);
        }
        if (document.getElementById('totalProducts')) {
            document.getElementById('totalProducts').textContent = toPersianDigits(woocommerceProducts);
        }
        if (document.getElementById('itemsCount')) {
            document.getElementById('itemsCount').textContent = `(${toPersianDigits(woocommerceCustomers + woocommerceProducts)} مورد)`;
        }
        
        // آخرین همگام‌سازی
        const lastSync = localStorage.getItem('lastWoocommerceSync');
        const lastSyncElement = document.getElementById('lastSync');
        if (lastSyncElement && lastSync) {
            const date = new Date(lastSync);
            lastSyncElement.textContent = toPersianDigits(date.toLocaleTimeString('fa-IR'));
        }
    } catch (error) {
        console.error('Error updating sync stats:', error);
    }
}

// اضافه کردن لاگ - رفع خطا
function addSyncLog(message, type = 'info') {
    const logElement = document.getElementById('syncLog');
    if (!logElement) return;

    const timestamp = new Date().toLocaleTimeString('fa-IR');
    
    const typeIcon = {
        'info': 'fas fa-info-circle text-blue-500',
        'success': 'fas fa-check-circle text-green-500',
        'error': 'fas fa-times-circle text-red-500',
        'warning': 'fas fa-exclamation-triangle text-yellow-500'
    }[type] || 'fas fa-info-circle text-blue-500';
    
    const typeColor = {
        'info': 'border-blue-200',
        'success': 'border-green-200',
        'error': 'border-red-200 bg-red-50',
        'warning': 'border-yellow-200 bg-yellow-50'
    }[type] || 'border-gray-200';
    
    const logEntry = document.createElement('div');
    logEntry.className = `flex items-center justify-between py-2 border-b ${typeColor}`;
    logEntry.innerHTML = `
        <div class="flex items-center flex-1">
            <i class="${typeIcon} ml-2"></i>
            <span class="flex-1">${message}</span>
        </div>
        <span class="text-gray-500 text-sm whitespace-nowrap mr-2">${toPersianDigits(timestamp)}</span>
    `;
    
    // رفع خطا: بررسی ایمن firstChild
    if (logElement.firstChild) {
        // بررسی اینکه آیا پیام پیش‌فرض وجود دارد
        const isPlaceholder = logElement.firstChild.className && 
                             typeof logElement.firstChild.className === 'string' && 
                             logElement.firstChild.className.includes('text-gray-500');
        
        if (isPlaceholder) {
            logElement.innerHTML = '';
        }
    }
    
    logElement.insertBefore(logEntry, logElement.firstChild);
}

// بارگذاری تنظیمات ووکامرس
function loadWoocommerceConfig() {
    try {
        const savedConfig = localStorage.getItem('woocommerceConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (document.getElementById('wcApiUrl')) {
                document.getElementById('wcApiUrl').value = config.apiUrl || '';
            }
            if (document.getElementById('wcConsumerKey')) {
                document.getElementById('wcConsumerKey').value = config.consumerKey || '';
            }
            if (document.getElementById('wcConsumerSecret')) {
                document.getElementById('wcConsumerSecret').value = config.consumerSecret || '';
            }
            
            if (config.connected && window.woocommerce) {
                window.woocommerce.setConfig(config.apiUrl, config.consumerKey, config.consumerSecret);
            }
        }
        
        updateSyncStats();
    } catch (error) {
        console.error('Error loading woocommerce config:', error);
    }
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    checkUserRole();
    
    // فعال‌سازی datepicker
    if (typeof $ !== 'undefined' && $.fn.persianDatepicker) {
        $('[id$="Date"]').persianDatepicker({
            format: 'YYYY/MM/DD',
            observer: true
        });
    }
    
    // بارگذاری تنظیمات ووکامرس
    setTimeout(loadWoocommerceConfig, 500);
});

console.log('✅ Tabs management module loaded');


// نمایش وضعیت همگام‌سازی در تب ووکامرس
function displaySyncStatus() {
    const statusContainer = document.getElementById('syncStatusContainer');
    if (!statusContainer) return;
    
    if (typeof showSyncStatus === 'function') {
        statusContainer.innerHTML = showSyncStatus();
    }
}