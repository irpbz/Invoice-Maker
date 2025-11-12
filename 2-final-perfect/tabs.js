// tabs.js - مدیریت تب‌ها
function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const button = document.querySelector(`button[onclick="openTab('${tabId}')"]`);
    if (button) button.classList.add('active');

    // بارگذاری محتوای تب‌های خاص
    if (tabId === 'invoiceManagementTab') {
        if (typeof loadInvoiceFilters === 'function') loadInvoiceFilters();
        if (typeof loadAllInvoices === 'function') loadAllInvoices();
        if (typeof updateInvoiceStats === 'function') updateInvoiceStats();
    } else if (tabId === 'reportsTab') {
        if (typeof loadReports === 'function') loadReports();
    } else if (tabId === 'userManagementTab') {
        if (typeof loadUsersManagement === 'function') loadUsersManagement();
    } else if (tabId === 'accountingTab') {
        const paymentDate = document.getElementById('paymentDate');
        if (paymentDate) paymentDate.value = new persianDate().format('YYYY/MM/DD');
        if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
    } else if (tabId === 'sellerTab') {
        if (typeof loadSellers === 'function') loadSellers();
    } else if (tabId === 'customerTab') {
        if (typeof loadCustomers === 'function') loadCustomers();
    } else if (tabId === 'inventoryTab') {
        if (typeof loadProducts === 'function') loadProducts();
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
    
    // فیلدهای تاریخ
    const dateFields = [
        'invoiceDate', 'paymentDate', 'reportStartDate', 
        'reportEndDate', 'invoiceDateFilter'
    ];
    
    dateFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) element.value = today;
    });
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
});