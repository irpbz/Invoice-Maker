// data.js - مدیریت کامل داده‌های سیستم فاکتور
let sellers = [];
let customers = [];
let products = [];
let currentCustomerPage = 1;
let currentProductPage = 1;
const itemsPerPage = 12;
let selectedProducts = [];
let bulkEditMode = false;

// تابع debounce برای جلوگیری از فراخوانی‌های مکرر
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// تابع همگام‌سازی با IndexedDB
const debouncedSync = debounce(async () => {
    try {
        if (typeof syncWithIndexedDB === 'function') {
            await syncWithIndexedDB();
            console.log('✅ Data auto-synced with IndexedDB');
        }
    } catch (error) {
        console.error('❌ Auto-sync failed:', error);
    }
}, 1000);

// بارگذاری داده‌های کاربر جاری
function loadUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.id) {
        const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
        sellers = userData.sellers || [];
        customers = userData.customers || [];
        products = userData.products || [];
    } else {
        // بارگذاری از localStorage قدیمی برای سازگاری
        sellers = JSON.parse(localStorage.getItem('sellers') || '[]');
        customers = JSON.parse(localStorage.getItem('customers') || '[]');
        products = JSON.parse(localStorage.getItem('products') || '[]');
    }
}

// ذخیره داده‌های کاربر جاری با همگام‌سازی بهبود یافته
function saveUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userData = {
        sellers: sellers,
        customers: customers,
        products: products,
        invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
        customerAccounts: JSON.parse(localStorage.getItem('customerAccounts') || '{}'),
        lastUpdated: new Date().toISOString()
    };
    
    if (currentUser && currentUser.id) {
        localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
    } else {
        // ذخیره در localStorage قدیمی برای سازگاری
        localStorage.setItem('sellers', JSON.stringify(sellers));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('products', JSON.stringify(products));
    }
    
    // همگام‌سازی با IndexedDB با مدیریت خطای بهتر
    setTimeout(async () => {
        try {
            if (typeof syncWithIndexedDB === 'function') {
                const result = await syncWithIndexedDB();
                if (!result.success) {
                    console.warn('⚠️ Sync completed with warnings:', result.message);
                }
            }
        } catch (error) {
            console.error('❌ Auto-sync failed, but data is safe in localStorage:', error);
            // داده‌ها در localStorage ذخیره شده‌اند، بنابراین خطا بحرانی نیست
        }
    }, 500);
}

// مدیریت فروشنده‌ها
function addSeller() {
    const seller = {
        name: document.getElementById('sellerNameInput').value,
        phone: document.getElementById('sellerPhoneInput').value,
        nationalId: document.getElementById('sellerNationalIdInput').value,
        economicCode: document.getElementById('sellerEconomicCodeInput').value,
        postalCode: document.getElementById('sellerPostalCodeInput').value,
        accountNumber: document.getElementById('sellerAccountNumberInput').value,
        address: document.getElementById('sellerAddressInput').value,
        logo: null,
        signature: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const logoInput = document.getElementById('sellerLogoInput');
    const signatureInput = document.getElementById('sellerSignatureInput');

    function saveSellerData() {
        if (seller.name) {
            const existingIndex = sellers.findIndex(s => s.name === seller.name);
            if (existingIndex >= 0) {
                const existingSeller = sellers[existingIndex];
                seller.logo = seller.logo || existingSeller.logo;
                seller.signature = seller.signature || existingSeller.signature;
                seller.createdAt = existingSeller.createdAt;
                sellers[existingIndex] = seller;
            } else {
                sellers.push(seller);
            }
            saveUserData();
            loadSellers();
            clearSellerInputs();
            showNotification('فروشنده با موفقیت ذخیره شد.', 'success');
        } else {
            showNotification('لطفاً نام فروشنده را وارد کنید.', 'error');
        }
    }

    if (logoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            seller.logo = e.target.result;
            if (signatureInput.files[0]) {
                const sigReader = new FileReader();
                sigReader.onload = (e) => {
                    seller.signature = e.target.result;
                    saveSellerData();
                };
                sigReader.readAsDataURL(signatureInput.files[0]);
            } else {
                saveSellerData();
            }
        };
        reader.readAsDataURL(logoInput.files[0]);
    } else if (signatureInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            seller.signature = e.target.result;
            saveSellerData();
        };
        reader.readAsDataURL(signatureInput.files[0]);
    } else {
        saveSellerData();
    }
}

function loadSellers() {
    const sellerSelect = document.getElementById('sellerSelect');
    const sellerSelectInvoice = document.getElementById('sellerSelectInvoice');
    const sellerList = document.getElementById('sellerList');
    
    if (!sellerSelect || !sellerSelectInvoice || !sellerList) return;
    
    sellerSelect.innerHTML = '<option value="">انتخاب فروشنده</option>';
    sellerSelectInvoice.innerHTML = '<option value="">انتخاب فروشنده</option>';
    sellerList.innerHTML = '';
    
    sellers.forEach((seller, index) => {
        sellerSelect.innerHTML += `<option value="${index}">${seller.name}</option>`;
        sellerSelectInvoice.innerHTML += `<option value="${index}">${seller.name}</option>`;
        
        const div = document.createElement('div');
        div.className = 'border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition';
        div.innerHTML = `
            <div class="flex items-start mb-4">
                ${seller.logo ? `<img src="${seller.logo}" class="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg ml-4">` : ''}
                <div>
                    <h3 class="text-base sm:text-lg font-semibold text-gray-800">${seller.name}</h3>
                    <p class="text-gray-600">${seller.phone || '-'}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                ${seller.nationalId ? `<p><span class="text-gray-500">کد ملی:</span> ${toPersianDigits(seller.nationalId)}</p>` : ''}
                ${seller.economicCode ? `<p><span class="text-gray-500">کد اقتصادی:</span> ${toPersianDigits(seller.economicCode)}</p>` : ''}
                ${seller.postalCode ? `<p><span class="text-gray-500">کد پستی:</span> ${toPersianDigits(seller.postalCode)}</p>` : ''}
                ${seller.accountNumber ? `<p><span class="text-gray-500">شماره حساب:</span> ${toPersianDigits(seller.accountNumber)}</p>` : ''}
            </div>
            ${seller.address ? `<p class="text-gray-700 mb-4"><span class="text-gray-500">آدرس:</span> ${seller.address}</p>` : ''}
            <div class="flex justify-end gap-2">
                <button onclick="editSeller(${index})" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">ویرایش</button>
                <button onclick="deleteSeller(${index})" class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">حذف</button>
            </div>
        `;
        sellerList.appendChild(div);
    });
}

function editSeller(index) {
    const seller = sellers[index];
    document.getElementById('sellerNameInput').value = seller.name;
    document.getElementById('sellerPhoneInput').value = seller.phone;
    document.getElementById('sellerNationalIdInput').value = seller.nationalId;
    document.getElementById('sellerEconomicCodeInput').value = seller.economicCode;
    document.getElementById('sellerPostalCodeInput').value = seller.postalCode;
    document.getElementById('sellerAccountNumberInput').value = seller.accountNumber;
    document.getElementById('sellerAddressInput').value = seller.address;
}

function deleteSeller(index) {
    if (confirm('آیا از حذف این فروشنده اطمینان دارید؟')) {
        sellers.splice(index, 1);
        saveUserData();
        loadSellers();
        showNotification('فروشنده با موفقیت حذف شد.', 'success');
    }
}

function clearSellerInputs() {
    document.getElementById('sellerNameInput').value = '';
    document.getElementById('sellerPhoneInput').value = '';
    document.getElementById('sellerNationalIdInput').value = '';
    document.getElementById('sellerEconomicCodeInput').value = '';
    document.getElementById('sellerPostalCodeInput').value = '';
    document.getElementById('sellerAccountNumberInput').value = '';
    document.getElementById('sellerAddressInput').value = '';
    document.getElementById('sellerLogoInput').value = '';
    document.getElementById('sellerSignatureInput').value = '';
}

// مدیریت خریدارها
function addCustomer() {
    const customer = {
        name: document.getElementById('customerNameInput').value,
        phone: document.getElementById('customerPhoneInput').value,
        nationalId: document.getElementById('customerNationalIdInput').value,
        economicCode: document.getElementById('customerEconomicCodeInput').value,
        postalCode: document.getElementById('customerPostalCodeInput').value,
        accountNumber: document.getElementById('customerAccountNumberInput').value,
        address: document.getElementById('customerAddressInput').value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (customer.name) {
        const existingIndex = customers.findIndex(c => c.name === customer.name);
        if (existingIndex >= 0) {
            const existingCustomer = customers[existingIndex];
            customer.createdAt = existingCustomer.createdAt;
            customers[existingIndex] = customer;
        } else {
            customers.push(customer);
        }
        saveUserData();
        loadCustomers();
        clearCustomerInputs();
        showNotification('مشتری با موفقیت ذخیره شد.', 'success');
    } else {
        showNotification('لطفاً نام خریدار را وارد کنید.', 'error');
    }
}

// تابع بهبود یافته برای بارگذاری خریداران با صفحه‌بندی
function loadCustomers() {
    const customerSelect = document.getElementById('customerSelect');
    const customerList = document.getElementById('customerList');
    const accountingCustomerSelect = document.getElementById('accountingCustomerSelect');
    const invoiceCustomerFilter = document.getElementById('invoiceCustomerFilter');
    
    if (!customerSelect || !customerList) return;
    
    customerSelect.innerHTML = '<option value="">انتخاب خریدار</option>';
    customerList.innerHTML = '';
    
    if (accountingCustomerSelect) {
        accountingCustomerSelect.innerHTML = '<option value="">انتخاب مشتری</option>';
    }
    
    if (invoiceCustomerFilter) {
        invoiceCustomerFilter.innerHTML = '<option value="">همه مشتریان</option>';
    }
    
    // محاسبه محدوده نمایش
    const startIndex = (currentCustomerPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, customers.length);
    const totalPages = Math.ceil(customers.length / itemsPerPage);
    
    // نمایش خریداران صفحه جاری
    for (let i = startIndex; i < endIndex; i++) {
        const customer = customers[i];
        
        customerSelect.innerHTML += `<option value="${i}">${customer.name} ${customer.source === 'woocommerce' ? '🛒' : ''}</option>`;
        
        if (accountingCustomerSelect) {
            accountingCustomerSelect.innerHTML += `<option value="${i}">${customer.name} - ${customer.phone || 'بدون تلفن'} ${customer.source === 'woocommerce' ? '🛒' : ''}</option>`;
        }
        
        if (invoiceCustomerFilter) {
            invoiceCustomerFilter.innerHTML += `<option value="${i}">${customer.name} ${customer.source === 'woocommerce' ? '🛒' : ''}</option>`;
        }
        
        const div = document.createElement('div');
        div.className = 'border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition';
        
        const woocommerceBadge = customer.source === 'woocommerce' ? 
            '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">ووکامرس</span>' : '';
        
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800">${customer.name}</h3>
                ${woocommerceBadge}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                ${customer.phone ? `<p><span class="text-gray-500">تلفن:</span> ${toPersianDigits(customer.phone)}</p>` : ''}
                ${customer.email ? `<p><span class="text-gray-500">ایمیل:</span> ${customer.email}</p>` : ''}
                ${customer.nationalId ? `<p><span class="text-gray-500">کد ملی:</span> ${toPersianDigits(customer.nationalId)}</p>` : ''}
                ${customer.woocommerceId ? `<p><span class="text-gray-500">ID ووکامرس:</span> ${toPersianDigits(customer.woocommerceId)}</p>` : ''}
            </div>
            ${customer.address ? `<p class="text-gray-700 mb-4"><span class="text-gray-500">آدرس:</span> ${customer.address}</p>` : ''}
            <div class="flex justify-end gap-2">
                <button onclick="editCustomer(${i})" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">ویرایش</button>
                <button onclick="deleteCustomer(${i})" class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">حذف</button>
            </div>
        `;
        customerList.appendChild(div);
    }
    
    // افزودن صفحه‌بندی
    addCustomerPagination(totalPages);
    
    // بارگذاری مشتریان در تب حسابداری
    if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
    updateCustomerSearch();
}

// تابع افزودن صفحه‌بندی خریداران
function addCustomerPagination(totalPages) {
    const customerList = document.getElementById('customerList');
    if (!customerList || totalPages <= 1) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'mt-6 flex justify-center items-center gap-2';
    paginationDiv.innerHTML = `
        <button onclick="changeCustomerPage(1)" ${currentCustomerPage === 1 ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentCustomerPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-double-right"></i>
        </button>
        <button onclick="changeCustomerPage(${currentCustomerPage - 1})" ${currentCustomerPage === 1 ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentCustomerPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-right"></i>
        </button>
        
        <div class="flex gap-1">
            ${generateCustomerPageNumbers(totalPages)}
        </div>
        
        <button onclick="changeCustomerPage(${currentCustomerPage + 1})" ${currentCustomerPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentCustomerPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-left"></i>
        </button>
        <button onclick="changeCustomerPage(${totalPages})" ${currentCustomerPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentCustomerPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-double-left"></i>
        </button>
        
        <span class="text-sm text-gray-600 mx-2">
            صفحه ${toPersianDigits(currentCustomerPage)} از ${toPersianDigits(totalPages)}
        </span>
        <span class="text-sm text-gray-600">
            (${toPersianDigits(customers.length)} مشتری)
        </span>
    `;
    
    customerList.appendChild(paginationDiv);
}

// تابع تولید شماره صفحات
function generateCustomerPageNumbers(totalPages) {
    let pagesHtml = '';
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentCustomerPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pagesHtml += `
            <button onclick="changeCustomerPage(${i})" 
                    class="w-10 h-10 rounded-lg ${currentCustomerPage === i ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}">
                ${toPersianDigits(i)}
            </button>
        `;
    }
    
    return pagesHtml;
}

// تابع تغییر صفحه خریداران
function changeCustomerPage(newPage) {
    const totalPages = Math.ceil(customers.length / itemsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    
    currentCustomerPage = newPage;
    loadCustomers();
    
    // اسکرول به بالای لیست
    const customerList = document.getElementById('customerList');
    if (customerList) {
        customerList.scrollIntoView({ behavior: 'smooth' });
    }
}

// تابع بهبود یافته برای بارگذاری محصولات با صفحه‌بندی
function loadProducts() {
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    productList.innerHTML = '';
    
    // محاسبه محدوده نمایش
    const startIndex = (currentProductPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, products.length);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    
    // نمایش محصولات صفحه جاری
    for (let i = startIndex; i < endIndex; i++) {
        const product = products[i];
        
        const woocommerceBadge = product.source === 'woocommerce' ? 
            '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">ووکامرس</span>' : '';
        
        const stockStatus = product.stock === Infinity ? 
            '<span class="text-green-600 font-semibold">نامحدود</span>' : 
            (product.stock > 10 ? 
                `<span class="text-green-600">${toPersianDigits(product.stock)} عدد</span>` : 
                `<span class="text-red-600">${toPersianDigits(product.stock)} عدد (موجودی کم)</span>`);
        
        const div = document.createElement('div');
        div.className = 'border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-start flex-1">
                    ${product.image ? `<img src="${product.image}" class="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg ml-4">` : ''}
                    <div class="flex-1">
                        <h3 class="text-base sm:text-lg font-semibold text-gray-800">${product.name}</h3>
                        <p class="text-gray-600">کد: ${product.code}</p>
                    </div>
                </div>
                ${woocommerceBadge}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <p><span class="text-gray-500">موجودی:</span> ${stockStatus}</p>
                <p><span class="text-gray-500">قیمت:</span> ${formatPrice(product.price ?? 0)} ریال</p>
                ${product.woocommerceId ? `<p><span class="text-gray-500">ID ووکامرس:</span> ${toPersianDigits(product.woocommerceId)}</p>` : ''}
            </div>
            ${product.description ? `<p class="text-gray-700 mb-4"><span class="text-gray-500">توضیحات:</span> ${product.description}</p>` : ''}
            <div class="flex justify-end gap-2">
                <button onclick="editProduct(${i})" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">ویرایش</button>
                <button onclick="deleteProduct(${i})" class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">حذف</button>
            </div>
        `;
        productList.appendChild(div);
    }
    
    // افزودن صفحه‌بندی
    addProductPagination(totalPages);
    updateProductSearch();
}

// تابع افزودن صفحه‌بندی محصولات
function addProductPagination(totalPages) {
    const productList = document.getElementById('productList');
    if (!productList || totalPages <= 1) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'mt-6 flex justify-center items-center gap-2';
    paginationDiv.innerHTML = `
        <button onclick="changeProductPage(1)" ${currentProductPage === 1 ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentProductPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-double-right"></i>
        </button>
        <button onclick="changeProductPage(${currentProductPage - 1})" ${currentProductPage === 1 ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentProductPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-right"></i>
        </button>
        
        <div class="flex gap-1">
            ${generateProductPageNumbers(totalPages)}
        </div>
        
        <button onclick="changeProductPage(${currentProductPage + 1})" ${currentProductPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentProductPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-left"></i>
        </button>
        <button onclick="changeProductPage(${totalPages})" ${currentProductPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-2 bg-gray-200 rounded-lg ${currentProductPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}">
            <i class="fas fa-angle-double-left"></i>
        </button>
        
        <span class="text-sm text-gray-600 mx-2">
            صفحه ${toPersianDigits(currentProductPage)} از ${toPersianDigits(totalPages)}
        </span>
        <span class="text-sm text-gray-600">
            (${toPersianDigits(products.length)} محصول)
        </span>
    `;
    
    productList.appendChild(paginationDiv);
}

// تابع تولید شماره صفحات محصولات
function generateProductPageNumbers(totalPages) {
    let pagesHtml = '';
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentProductPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pagesHtml += `
            <button onclick="changeProductPage(${i})" 
                    class="w-10 h-10 rounded-lg ${currentProductPage === i ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}">
                ${toPersianDigits(i)}
            </button>
        `;
    }
    
    return pagesHtml;
}

// تابع تغییر صفحه محصولات
function changeProductPage(newPage) {
    const totalPages = Math.ceil(products.length / itemsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    
    currentProductPage = newPage;
    loadProducts();
    
    // اسکرول به بالای لیست
    const productList = document.getElementById('productList');
    if (productList) {
        productList.scrollIntoView({ behavior: 'smooth' });
    }
}

function editCustomer(index) {
    const customer = customers[index];
    document.getElementById('customerNameInput').value = customer.name;
    document.getElementById('customerPhoneInput').value = customer.phone;
    document.getElementById('customerNationalIdInput').value = customer.nationalId;
    document.getElementById('customerEconomicCodeInput').value = customer.economicCode;
    document.getElementById('customerPostalCodeInput').value = customer.postalCode;
    document.getElementById('customerAccountNumberInput').value = customer.accountNumber;
    document.getElementById('customerAddressInput').value = customer.address;
}

function deleteCustomer(index) {
    if (confirm('آیا از حذف این خریدار اطمینان دارید؟')) {
        customers.splice(index, 1);
        saveUserData();
        loadCustomers();
        showNotification('مشتری با موفقیت حذف شد.', 'success');
    }
}

function clearCustomerInputs() {
    document.getElementById('customerNameInput').value = '';
    document.getElementById('customerPhoneInput').value = '';
    document.getElementById('customerNationalIdInput').value = '';
    document.getElementById('customerEconomicCodeInput').value = '';
    document.getElementById('customerPostalCodeInput').value = '';
    document.getElementById('customerAccountNumberInput').value = '';
    document.getElementById('customerAddressInput').value = '';
}

// جستجوی خریدار
function updateCustomerSearch() {
    const searchInput = document.getElementById('customerSearch');
    const dropdown = document.getElementById('customerSearchDropdown');
    
    if (!searchInput || !dropdown) return;
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        dropdown.innerHTML = '';
        const filteredCustomers = customers.filter(c => 
            c.name.toLowerCase().includes(query) || 
            (c.nationalId && c.nationalId.toLowerCase().includes(query))
        );
        
        filteredCustomers.forEach((customer, index) => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            div.textContent = `${customer.name} (${customer.nationalId || '-'})`;
            div.addEventListener('click', () => {
                document.getElementById('customerSearch').value = `${customer.name} (${customer.nationalId || '-'})`;
                document.getElementById('customerIndex').value = customers.indexOf(customer);
                dropdown.classList.remove('show');
            });
            dropdown.appendChild(div);
        });
        dropdown.classList.toggle('show', filteredCustomers.length > 0);
    });
    
    searchInput.addEventListener('blur', () => {
        setTimeout(() => dropdown.classList.remove('show'), 200);
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value) {
            const query = searchInput.value.toLowerCase();
            const filteredCustomers = customers.filter(c => 
                c.name.toLowerCase().includes(query) || 
                (c.nationalId && c.nationalId.toLowerCase().includes(query))
            );
            dropdown.classList.toggle('show', filteredCustomers.length > 0);
        }
    });
}

// مدیریت انبارداری
function addProduct() {
    const unlimitedStock = document.getElementById('unlimitedStock').checked;
    const product = {
        code: document.getElementById('productCodeInput').value,
        name: document.getElementById('productNameInput').value,
        stock: unlimitedStock ? Infinity : parseInt(document.getElementById('productStockInput').value) || 0,
        price: parseInt(document.getElementById('productPriceInput').value) || 0,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const imageInput = document.getElementById('productImageInput');

    function saveProductData() {
        if (product.name && product.code) {
            const existingIndex = products.findIndex(p => p.code === product.code);
            if (existingIndex >= 0) {
                const existingProduct = products[existingIndex];
                product.image = product.image || existingProduct.image;
                product.createdAt = existingProduct.createdAt;
                products[existingIndex] = product;
            } else {
                products.push(product);
            }
            saveUserData();
            loadProducts();
            clearProductInputs();
            showNotification('محصول با موفقیت ذخیره شد.', 'success');
        } else {
            showNotification('لطفاً کد و نام محصول را وارد کنید.', 'error');
        }
    }

    if (imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            product.image = e.target.result;
            saveProductData();
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        saveProductData();
    }
}



function editProduct(index) {
    const product = products[index];
    document.getElementById('productCodeInput').value = product.code;
    document.getElementById('productNameInput').value = product.name;
    document.getElementById('productStockInput').value = product.stock === Infinity ? '' : product.stock;
    document.getElementById('unlimitedStock').checked = product.stock === Infinity;
    document.getElementById('productStockInput').disabled = product.stock === Infinity;
    document.getElementById('productPriceInput').value = product.price;
}

function deleteProduct(index) {
    if (confirm('آیا از حذف این محصول اطمینان دارید؟')) {
        products.splice(index, 1);
        saveUserData();
        loadProducts();
        showNotification('محصول با موفقیت حذف شد.', 'success');
    }
}

function clearProductInputs() {
    document.getElementById('productCodeInput').value = '';
    document.getElementById('productNameInput').value = '';
    document.getElementById('productStockInput').value = '';
    document.getElementById('unlimitedStock').checked = false;
    document.getElementById('productStockInput').disabled = false;
    document.getElementById('productPriceInput').value = '';
    document.getElementById('productImageInput').value = '';
}

// مدیریت چک‌باکس نامحدود
document.addEventListener('DOMContentLoaded', function() {
    const unlimitedStockCheckbox = document.getElementById('unlimitedStock');
    if (unlimitedStockCheckbox) {
        unlimitedStockCheckbox.addEventListener('change', (e) => {
            const stockInput = document.getElementById('productStockInput');
            if (stockInput) {
                stockInput.disabled = e.target.checked;
                if (e.target.checked) {
                    stockInput.value = '';
                }
            }
        });
    }
});

// جستجوی محصولات
function updateProductSearch() {
    const searchInput = document.getElementById('itemSearch');
    const dropdown = document.getElementById('itemSearchDropdown');
    const imagePreview = document.getElementById('itemImagePreview');
    
    if (!searchInput || !dropdown) return;
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        dropdown.innerHTML = '';
        const filteredProducts = products.filter(p => 
            p.code.toLowerCase().includes(query) || 
            p.name.toLowerCase().includes(query)
        );
        
        filteredProducts.forEach((product, index) => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            div.textContent = `${product.name} (${product.code})`;
            div.addEventListener('click', () => {
                document.getElementById('itemSearch').value = `${product.name} (${product.code})`;
                document.getElementById('itemCode').value = products.indexOf(product);
                document.getElementById('itemName').value = product.name;
                document.getElementById('itemPrice').value = product.price;
                dropdown.classList.remove('show');
                
                if (product.image && imagePreview) {
                    imagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}" class="rounded-lg shadow-md max-w-full h-auto">`;
                    imagePreview.classList.remove('hidden');
                } else if (imagePreview) {
                    imagePreview.innerHTML = '';
                    imagePreview.classList.add('hidden');
                }
            });
            dropdown.appendChild(div);
        });
        dropdown.classList.toggle('show', filteredProducts.length > 0);
    });
    
    searchInput.addEventListener('blur', () => {
        setTimeout(() => dropdown.classList.remove('show'), 200);
    });
    
    searchInput.addEventListener('focus', () => {
        if (searchInput.value) {
            const query = searchInput.value.toLowerCase();
            const filteredProducts = products.filter(p => 
                p.code.toLowerCase().includes(query) || 
                p.name.toLowerCase().includes(query)
            );
            dropdown.classList.toggle('show', filteredProducts.length > 0);
        }
    });
}

// مدیریت حسابداری مشتریان
let customerAccounts = JSON.parse(localStorage.getItem('customerAccounts') || '{}');

// تابع بهبود یافته برای بارگذاری مشتریان حسابداری
function loadAccountingCustomers() {
    const accountingCustomerSelect = document.getElementById('accountingCustomerSelect');
    if (!accountingCustomerSelect) return;
    
    accountingCustomerSelect.innerHTML = '<option value="">انتخاب مشتری</option>';
    
    // فقط مشتریانی که در customerAccounts هستند (یعنی فاکتور دارند) نمایش داده شوند
    const customersWithAccounts = customers.filter(customer => {
        const customerId = customers.indexOf(customer).toString();
        return customerAccounts[customerId] !== undefined;
    });
    
    if (customersWithAccounts.length === 0) {
        accountingCustomerSelect.innerHTML += '<option value="" disabled>هیچ مشتری با حساب مالی یافت نشد</option>';
        return;
    }
    
    customersWithAccounts.forEach((customer, index) => {
        // پیدا کردن index واقعی مشتری در آرایه اصلی
        const originalIndex = customers.indexOf(customer);
        const account = customerAccounts[originalIndex];
        const balance = account ? account.balance : 0;
        
        const balanceDisplay = balance > 0 ? 
            `<span class="text-red-600 text-xs">(بدهکار: ${formatPrice(balance)})</span>` : 
            balance < 0 ? 
            `<span class="text-green-600 text-xs">(بستانکار: ${formatPrice(Math.abs(balance))})</span>` : 
            `<span class="text-gray-600 text-xs">(تسویه)</span>`;
        
        const woocommerceBadge = customer.source === 'woocommerce' ? ' 🛒' : '';
        
        accountingCustomerSelect.innerHTML += `
            <option value="${originalIndex}">
                ${customer.name}${woocommerceBadge} - ${customer.phone || 'بدون تلفن'} ${balanceDisplay}
            </option>
        `;
    });
}

// تابع بهبود یافته برای بارگذاری اطلاعات مالی مشتری
function loadCustomerAccounting() {
    const customerIndex = document.getElementById('accountingCustomerSelect').value;
    if (customerIndex === '') return;

    const customer = customers[customerIndex];
    const customerId = customerIndex;
    
    // نمایش اطلاعات مشتری انتخاب شده
    displayCustomerAccountingInfo(customer);
    
    // اگر حساب مشتری وجود ندارد، ایجاد کن
    if (!customerAccounts[customerId]) {
        customerAccounts[customerId] = {
            payments: [],
            balance: 0,
            totalPurchases: 0,
            createdAt: new Date().toISOString()
        };
    }

    // محاسبه کل خریدها از فاکتورهای ذخیره شده
    calculateCustomerPurchases(customerId);
    
    // نمایش اطلاعات مالی
    updateAccountingDisplay(customerId);
    
    // نمایش تاریخچه تراکنش‌ها
    displayTransactionHistory(customerId);
}

// تابع نمایش اطلاعات مشتری در بخش حسابداری
function displayCustomerAccountingInfo(customer) {
    let infoContainer = document.getElementById('accountingCustomerInfo');
    if (!infoContainer) {
        infoContainer = document.createElement('div');
        infoContainer.id = 'accountingCustomerInfo';
        infoContainer.className = 'mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200';
        
        const selectContainer = document.getElementById('accountingCustomerSelect').parentNode;
        selectContainer.parentNode.insertBefore(infoContainer, selectContainer.nextSibling);
    }
    
    const woocommerceBadge = customer.source === 'woocommerce' ? 
        '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">مشتری ووکامرس</span>' : '';
    
    infoContainer.innerHTML = `
        <div class="flex justify-between items-start mb-3">
            <h4 class="font-semibold text-blue-800">اطلاعات مشتری</h4>
            ${woocommerceBadge}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
                <div class="text-gray-600">نام:</div>
                <div class="font-medium">${customer.name}</div>
            </div>
            ${customer.phone ? `
            <div>
                <div class="text-gray-600">تلفن:</div>
                <div class="font-medium">${toPersianDigits(customer.phone)}</div>
            </div>
            ` : ''}
            ${customer.email ? `
            <div>
                <div class="text-gray-600">ایمیل:</div>
                <div class="font-medium">${customer.email}</div>
            </div>
            ` : ''}
            ${customer.nationalId ? `
            <div>
                <div class="text-gray-600">کد ملی:</div>
                <div class="font-medium">${toPersianDigits(customer.nationalId)}</div>
            </div>
            ` : ''}
            ${customer.address ? `
            <div class="md:col-span-3">
                <div class="text-gray-600">آدرس:</div>
                <div class="font-medium">${customer.address}</div>
            </div>
            ` : ''}
        </div>
    `;
}

function calculateCustomerPurchases(customerId) {
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    let totalPurchases = 0;

    savedInvoices.forEach(invoice => {
        if (invoice.customerIndex == customerId) {
            const invoiceTotal = calculateInvoiceTotal(invoice);
            totalPurchases += parseInt(invoiceTotal);
        }
    });

    customerAccounts[customerId].totalPurchases = totalPurchases;
    customerAccounts[customerId].balance = totalPurchases - calculateTotalPayments(customerId);
    customerAccounts[customerId].updatedAt = new Date().toISOString();
    
    localStorage.setItem('customerAccounts', JSON.stringify(customerAccounts));
    debouncedSync(); // همگام‌سازی با IndexedDB
}

function calculateTotalPayments(customerId) {
    if (!customerAccounts[customerId] || !customerAccounts[customerId].payments) {
        return 0;
    }
    
    return customerAccounts[customerId].payments.reduce((total, payment) => total + payment.amount, 0);
}

function updateAccountingDisplay(customerId) {
    const account = customerAccounts[customerId];
    const totalPayments = calculateTotalPayments(customerId);
    
    const totalPurchasesElement = document.getElementById('totalPurchases');
    const totalPaymentsElement = document.getElementById('totalPayments');
    const accountBalanceElement = document.getElementById('accountBalance');
    
    if (totalPurchasesElement) totalPurchasesElement.textContent = formatPrice(account.totalPurchases || 0);
    if (totalPaymentsElement) totalPaymentsElement.textContent = formatPrice(totalPayments);
    if (accountBalanceElement) accountBalanceElement.textContent = formatPrice(account.balance || 0);
}

function addPayment() {
    const customerIndex = document.getElementById('accountingCustomerSelect').value;
    const amount = parseInt(document.getElementById('paymentAmount').value) || 0;
    const date = document.getElementById('paymentDate').value;
    const description = document.getElementById('paymentDescription').value;

    if (customerIndex === '') {
        showNotification('لطفاً یک مشتری انتخاب کنید.', 'error');
        return;
    }

    if (amount <= 0) {
        showNotification('لطفاً مبلغ معتبر وارد کنید.', 'error');
        return;
    }

    const customerId = customerIndex;
    const payment = {
        id: Date.now(),
        amount: amount,
        date: date || new persianDate().format('YYYY/MM/DD'),
        description: description,
        timestamp: new Date().getTime(),
        createdAt: new Date().toISOString()
    };

    if (!customerAccounts[customerId]) {
        customerAccounts[customerId] = {
            payments: [],
            balance: 0,
            totalPurchases: 0,
            createdAt: new Date().toISOString()
        };
    }

    customerAccounts[customerId].payments.push(payment);
    customerAccounts[customerId].balance = customerAccounts[customerId].totalPurchases - calculateTotalPayments(customerId);
    customerAccounts[customerId].updatedAt = new Date().toISOString();
    
    localStorage.setItem('customerAccounts', JSON.stringify(customerAccounts));
    debouncedSync(); // همگام‌سازی با IndexedDB
    
    clearPaymentForm();
    loadCustomerAccounting();
    
    showNotification('پرداخت با موفقیت ثبت شد.', 'success');
}

function displayTransactionHistory(customerId) {
    const transactionHistory = document.getElementById('transactionHistory');
    if (!transactionHistory) return;
    
    transactionHistory.innerHTML = '';

    const account = customerAccounts[customerId];
    if (!account || !account.payments || account.payments.length === 0) {
        transactionHistory.innerHTML = '<div class="text-center text-gray-500 py-4">هیچ تراکنشی ثبت نشده است.</div>';
        return;
    }

    // مرتب سازی پرداخت‌ها بر اساس تاریخ (جدیدترین اول)
    const sortedPayments = account.payments.sort((a, b) => b.timestamp - a.timestamp);

    sortedPayments.forEach(payment => {
        const paymentElement = document.createElement('div');
        paymentElement.className = 'border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition transaction-item payment';
        paymentElement.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <span class="font-semibold text-green-600">پرداخت: ${formatPrice(payment.amount)} ریال</span>
                </div>
                <span class="text-gray-500 text-sm">${payment.date}</span>
            </div>
            <p class="text-gray-700 mb-2">${payment.description || 'بدون توضیح'}</p>
            <div class="flex justify-end">
                <button onclick="deletePayment('${customerId}', ${payment.id})" class="text-red-500 hover:text-red-700 transition">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        transactionHistory.appendChild(paymentElement);
    });
}

function deletePayment(customerId, paymentId) {
    if (confirm('آیا از حذف این پرداخت اطمینان دارید؟')) {
        const account = customerAccounts[customerId];
        account.payments = account.payments.filter(p => p.id !== paymentId);
        account.balance = account.totalPurchases - calculateTotalPayments(customerId);
        account.updatedAt = new Date().toISOString();
        
        localStorage.setItem('customerAccounts', JSON.stringify(customerAccounts));
        debouncedSync(); // همگام‌سازی با IndexedDB
        loadCustomerAccounting();
        showNotification('پرداخت با موفقیت حذف شد.', 'success');
    }
}

function clearPaymentForm() {
    document.getElementById('paymentAmount').value = '';
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentDescription').value = '';
}

// توابع کمکی برای مدیریت داده‌ها
function exportUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    let dataToExport;
    
    if (currentUser && currentUser.id) {
        dataToExport = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
    } else {
        dataToExport = {
            sellers: sellers,
            customers: customers,
            products: products,
            invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
            customerAccounts: JSON.parse(localStorage.getItem('customerAccounts') || '{}')
        };
    }
    
    dataToExport.exportDate = new persianDate().format('YYYY/MM/DD HH:mm:ss');
    dataToExport.version = '2.0';
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `invoice_system_backup_${new persianDate().format('YYYY-MM-DD')}.json`;
    link.click();
    
    showNotification('داده‌های کاربر با موفقیت ذخیره شدند.', 'success');
}

function importUserData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('آیا از بازیابی داده‌ها اطمینان دارید؟ داده‌های فعلی overwrite خواهند شد.')) {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                
                if (currentUser && currentUser.id) {
                    localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(data));
                } else {
                    if (data.sellers) sellers = data.sellers;
                    if (data.customers) customers = data.customers;
                    if (data.products) products = data.products;
                    if (data.invoices) localStorage.setItem('invoices', JSON.stringify(data.invoices));
                    if (data.customerAccounts) localStorage.setItem('customerAccounts', JSON.stringify(data.customerAccounts));
                    
                    saveUserData();
                }
                
                // بارگذاری مجدد داده‌ها
                loadUserData();
                loadSellers();
                loadCustomers();
                loadProducts();
                loadAccountingCustomers();
                
                showNotification('داده‌ها با موفقیت بازیابی شدند.', 'success');
            }
        } catch (error) {
            showNotification('خطا در بازیابی فایل. لطفاً از معتبر بودن فایل اطمینان حاصل کنید.', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// تابع برای پاک کردن تمام داده‌های کاربر
function clearAllUserData() {
    if (confirm('آیا از پاک کردن تمام داده‌ها اطمینان دارید؟ این عمل غیرقابل برگشت است!')) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (currentUser && currentUser.id) {
            localStorage.removeItem(`userData_${currentUser.id}`);
        } else {
            sellers = [];
            customers = [];
            products = [];
            localStorage.removeItem('sellers');
            localStorage.removeItem('customers');
            localStorage.removeItem('products');
            localStorage.removeItem('invoices');
            localStorage.removeItem('customerAccounts');
        }
        
        // بارگذاری مجدد رابط کاربری
        loadSellers();
        loadCustomers();
        loadProducts();
        loadAccountingCustomers();
        
        showNotification('تمام داده‌ها با موفقیت پاک شدند.', 'success');
    }
}

// تابع برای جستجوی پیشرفته در محصولات
function advancedProductSearch(query, field = 'all') {
    if (!query) return products;
    
    const lowerQuery = query.toLowerCase();
    
    return products.filter(product => {
        switch(field) {
            case 'code':
                return product.code.toLowerCase().includes(lowerQuery);
            case 'name':
                return product.name.toLowerCase().includes(lowerQuery);
            case 'price':
                return product.price.toString().includes(query);
            default:
                return product.code.toLowerCase().includes(lowerQuery) || 
                       product.name.toLowerCase().includes(lowerQuery) ||
                       product.price.toString().includes(query);
        }
    });
}

// تابع برای جستجوی پیشرفته در مشتریان
function advancedCustomerSearch(query, field = 'all') {
    if (!query) return customers;
    
    const lowerQuery = query.toLowerCase();
    
    return customers.filter(customer => {
        switch(field) {
            case 'name':
                return customer.name.toLowerCase().includes(lowerQuery);
            case 'phone':
                return customer.phone && customer.phone.includes(query);
            case 'nationalId':
                return customer.nationalId && customer.nationalId.includes(query);
            default:
                return customer.name.toLowerCase().includes(lowerQuery) || 
                       (customer.phone && customer.phone.includes(query)) ||
                       (customer.nationalId && customer.nationalId.includes(query));
        }
    });
}

// تابع برای دریافت آمار سریع
function getQuickStats() {
    const stats = {
        totalSellers: sellers.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        totalInvoices: JSON.parse(localStorage.getItem('invoices') || '[]').length,
        lowStockProducts: products.filter(p => p.stock !== Infinity && p.stock < 10).length,
        totalRevenue: JSON.parse(localStorage.getItem('invoices') || '[]').reduce((sum, invoice) => 
            sum + calculateInvoiceTotal(invoice), 0)
    };
    
    return stats;
}

// بارگذاری اولیه داده‌ها
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadSellers();
    loadCustomers();
    loadProducts();
    loadAccountingCustomers();
    
    // نمایش آمار سریع در کنسول (برای دیباگ)
    console.log('آمار سیستم:', getQuickStats());
    
    // همگام‌سازی اولیه با IndexedDB
    setTimeout(() => {
        if (typeof syncWithIndexedDB === 'function') {
            syncWithIndexedDB().catch(error => {
                console.error('Initial sync failed:', error);
            });
        }
    }, 2000);
});



// تابع برای بارگذاری و یکپارچه‌سازی داده‌های ووکامرس
function integrateWoocommerceData() {
    console.log('🔄 Integrating Woocommerce data...');
    
    // بارگذاری داده‌های فعلی
    loadUserData();
    
    // بررسی و یکپارچه‌سازی مشتریان
    const woocommerceCustomers = window.customers ? 
        window.customers.filter(c => c.source === 'woocommerce') : [];
    
    if (woocommerceCustomers.length > 0) {
        console.log(`👥 Found ${woocommerceCustomers.length} Woocommerce customers`);
        // مشتریان ووکامرس به طور خودکار در آرایه customers قرار می‌گیرند
    }
    
    // بررسی و یکپارچه‌سازی محصولات
    const woocommerceProducts = window.products ? 
        window.products.filter(p => p.source === 'woocommerce') : [];
    
    if (woocommerceProducts.length > 0) {
        console.log(`📦 Found ${woocommerceProducts.length} Woocommerce products`);
        // محصولات ووکامرس به طور خودکار در آرایه products قرار می‌گیرند
    }
    
    // به‌روزرسانی رابط کاربری
    loadCustomers();
    loadProducts();
    
    console.log('✅ Woocommerce data integration completed');
}

// تابع برای دریافت آمار همگام‌سازی
function getSyncStats() {
    const customers = window.customers || [];
    const products = window.products || [];
    
    const woocommerceCustomers = customers.filter(c => c.source === 'woocommerce').length;
    const woocommerceProducts = products.filter(p => p.source === 'woocommerce').length;
    
    return {
        totalCustomers: customers.length,
        totalProducts: products.length,
        woocommerceCustomers: woocommerceCustomers,
        woocommerceProducts: woocommerceProducts,
        lastSync: localStorage.getItem('lastWoocommerceSync') || 'هرگز'
    };
}

// تابع برای نمایش وضعیت همگام‌سازی
function showSyncStatus() {
    const stats = getSyncStats();
    
    const status = `
        <div class="bg-white p-4 rounded-lg shadow mb-4">
            <h3 class="font-semibold mb-3">وضعیت همگام‌سازی ووکامرس</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-600">کل مشتریان:</span>
                    <span class="font-semibol mr-2">${toPersianDigits(stats.totalCustomers)}</span>
                </div>
                <div>
                    <span class="text-gray-600">مشتریان ووکامرس:</span>
                    <span class="font-semibold text-green-600 mr-2">${toPersianDigits(stats.woocommerceCustomers)}</span>
                </div>
                <div>
                    <span class="text-gray-600">کل محصولات:</span>
                    <span class="font-semibold mr-2">${toPersianDigits(stats.totalProducts)}</span>
                </div>
                <div>
                    <span class="text-gray-600">محصولات ووکامرس:</span>
                    <span class="font-semibold text-green-600 mr-2">${toPersianDigits(stats.woocommerceProducts)}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-gray-600">آخرین همگام‌سازی:</span>
                    <span class="font-semibold mr-2">${stats.lastSync}</span>
                </div>
            </div>
        </div>
    `;
    
    return status;
}

// تابع فعال‌سازی حالت ویرایش انبوه
function enableBulkEdit() {
    bulkEditMode = true;
    selectedProducts = [];
    
    // افزودن چک‌باکس به محصولات
    loadProducts();
    
    // نمایش نوار ابزار ویرایش انبوه
    showBulkEditToolbar();
    
    showNotification('حالت ویرایش انبوه فعال شد. محصولات مورد نظر را انتخاب کنید.', 'info');
}

// تابع غیرفعال‌سازی حالت ویرایش انبوه
function disableBulkEdit() {
    bulkEditMode = false;
    selectedProducts = [];
    
    // حذف چک‌باکس از محصولات
    loadProducts();
    
    // مخفی کردن نوار ابزار ویرایش انبوه
    hideBulkEditToolbar();
    
    showNotification('حالت ویرایش انبوه غیرفعال شد.', 'info');
}

// تابع نمایش نوار ابزار ویرایش انبوه
function showBulkEditToolbar() {
    // حذف نوار ابزار قبلی اگر وجود دارد
    hideBulkEditToolbar();
    
    const inventoryTab = document.getElementById('inventoryTab');
    const productList = document.getElementById('productList');
    
    if (!inventoryTab || !productList) return;
    
    const toolbar = document.createElement('div');
    toolbar.id = 'bulkEditToolbar';
    toolbar.className = 'bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6';
    toolbar.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 class="font-semibold text-blue-800 mb-2">ویرایش انبوه محصولات</h3>
                <p class="text-sm text-blue-600" id="selectedProductsCount">
                    ${toPersianDigits(selectedProducts.length)} محصول انتخاب شده
                </p>
            </div>
            
            <div class="flex flex-wrap gap-2">
                <button onclick="selectAllProducts()" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition flex items-center">
                    <i class="fas fa-check-square ml-1"></i> انتخاب همه
                </button>
                <button onclick="deselectAllProducts()" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition flex items-center">
                    <i class="fas fa-times-circle ml-1"></i> لغو انتخاب همه
                </button>
                <button onclick="showBulkStockModal()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition flex items-center">
                    <i class="fas fa-boxes ml-1"></i> ویرایش موجودی
                </button>
                <button onclick="showBulkPriceModal()" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm transition flex items-center">
                    <i class="fas fa-tag ml-1"></i> ویرایش قیمت
                </button>
                <button onclick="disableBulkEdit()" class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition flex items-center">
                    <i class="fas fa-times ml-1"></i> انصراف
                </button>
            </div>
        </div>
    `;
    
    inventoryTab.insertBefore(toolbar, productList);
}

// تابع مخفی کردن نوار ابزار ویرایش انبوه
function hideBulkEditToolbar() {
    const toolbar = document.getElementById('bulkEditToolbar');
    if (toolbar) {
        toolbar.remove();
    }
}

// تابع به‌روزرسانی تعداد محصولات انتخاب شده
function updateSelectedProductsCount() {
    const countElement = document.getElementById('selectedProductsCount');
    if (countElement) {
        countElement.textContent = `${toPersianDigits(selectedProducts.length)} محصول انتخاب شده`;
    }
}

// تابع انتخاب/لغو انتخاب یک محصول
function toggleProductSelection(index) {
    const productIndex = selectedProducts.indexOf(index);
    
    if (productIndex === -1) {
        selectedProducts.push(index);
    } else {
        selectedProducts.splice(productIndex, 1);
    }
    
    updateSelectedProductsCount();
}

// تابع انتخاب همه محصولات
function selectAllProducts() {
    selectedProducts = [];
    for (let i = 0; i < products.length; i++) {
        selectedProducts.push(i);
    }
    
    // به‌روزرسانی چک‌باکس‌ها
    loadProducts();
    updateSelectedProductsCount();
    
    showNotification(`همه ${toPersianDigits(products.length)} محصول انتخاب شدند.`, 'success');
}

// تابع لغو انتخاب همه محصولات
function deselectAllProducts() {
    selectedProducts = [];
    
    // به‌روزرسانی چک‌باکس‌ها
    loadProducts();
    updateSelectedProductsCount();
    
    showNotification('همه انتخاب‌ها لغو شد.', 'info');
}

// تابع بهبود یافته برای بارگذاری محصولات با قابلیت ویرایش انبوه
function loadProducts() {
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    productList.innerHTML = '';
    
    // محاسبه محدوده نمایش
    const startIndex = (currentProductPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, products.length);
    const totalPages = Math.ceil(products.length / itemsPerPage);
    
    // نمایش محصولات صفحه جاری
    for (let i = startIndex; i < endIndex; i++) {
        const product = products[i];
        
        const woocommerceBadge = product.source === 'woocommerce' ? 
            '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">ووکامرس</span>' : '';
        
        const stockStatus = product.stock === Infinity ? 
            '<span class="text-green-600 font-semibold">نامحدود</span>' : 
            (product.stock > 10 ? 
                `<span class="text-green-600">${toPersianDigits(product.stock)} عدد</span>` : 
                `<span class="text-red-600">${toPersianDigits(product.stock)} عدد (موجودی کم)</span>`);
        
        const isSelected = selectedProducts.includes(i);
        
        const div = document.createElement('div');
        div.className = `border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition ${isSelected ? 'ring-2 ring-blue-500' : ''}`;
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-start flex-1">
                    ${bulkEditMode ? `
                        <label class="flex items-center mt-1 ml-2">
                            <input type="checkbox" ${isSelected ? 'checked' : ''} 
                                   onchange="toggleProductSelection(${i})" 
                                   class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
                        </label>
                    ` : ''}
                    
                    ${product.image ? `<img src="${product.image}" class="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg ml-4">` : ''}
                    <div class="flex-1">
                        <h3 class="text-base sm:text-lg font-semibold text-gray-800">${product.name}</h3>
                        <p class="text-gray-600">کد: ${product.code}</p>
                    </div>
                </div>
                ${woocommerceBadge}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <p><span class="text-gray-500">موجودی:</span> ${stockStatus}</p>
                <p><span class="text-gray-500">قیمت:</span> ${formatPrice(product.price ?? 0)} ریال</p>
                ${product.woocommerceId ? `<p><span class="text-gray-500">ID ووکامرس:</span> ${toPersianDigits(product.woocommerceId)}</p>` : ''}
            </div>
            ${product.description ? `<p class="text-gray-700 mb-4"><span class="text-gray-500">توضیحات:</span> ${product.description}</p>` : ''}
            <div class="flex justify-between items-center">
                <div class="flex gap-2">
                    <button onclick="editProduct(${i})" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">ویرایش</button>
                    <button onclick="deleteProduct(${i})" class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">حذف</button>
                </div>
                ${bulkEditMode && isSelected ? `
                    <span class="text-blue-600 text-sm">
                        <i class="fas fa-check-circle ml-1"></i> انتخاب شده
                    </span>
                ` : ''}
            </div>
        `;
        productList.appendChild(div);
    }
    
    // افزودن دکمه ویرایش انبوه اگر فعال نیست
    if (!bulkEditMode) {
        addBulkEditButton();
    }
    
    // افزودن صفحه‌بندی
    addProductPagination(totalPages);
    updateProductSearch();
}

// تابع افزودن دکمه ویرایش انبوه
function addBulkEditButton() {
    const productList = document.getElementById('productList');
    if (!productList || document.getElementById('bulkEditButton')) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'bulkEditButton';
    buttonContainer.className = 'mt-6 flex justify-center';
    buttonContainer.innerHTML = `
        <button onclick="enableBulkEdit()" 
                class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:-translate-y-1 shadow-md flex items-center">
            <i class="fas fa-edit ml-2"></i>
            ویرایش انبوه محصولات
        </button>
    `;
    
    productList.appendChild(buttonContainer);
}

// تابع نمایش مودال ویرایش انبوه موجودی
function showBulkStockModal() {
    if (selectedProducts.length === 0) {
        showNotification('لطفاً حداقل یک محصول را انتخاب کنید.', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'bulkStockModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full max-w-md">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="font-semibold text-lg">ویرایش انبوه موجودی</h3>
                <button onclick="closeBulkStockModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-4">
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">نوع عملیات</label>
                    <select id="bulkStockOperation" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="increase">افزایش موجودی</option>
                        <option value="decrease">کاهش موجودی</option>
                        <option value="set">تنظیم موجودی به مقدار مشخص</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">مقدار</label>
                    <input type="number" id="bulkStockValue" min="0" 
                           class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="مقدار را وارد کنید">
                </div>
                
                <div class="mb-4">
                    <label class="flex items-center">
                        <input type="checkbox" id="bulkStockIgnoreUnlimited" class="ml-2 w-4 h-4">
                        <span class="text-gray-700">عدم تغییر محصولات با موجودی نامحدود</span>
                    </label>
                </div>
                
                <div class="bg-blue-50 p-3 rounded-lg mb-4">
                    <h4 class="font-semibold text-blue-800 mb-2">تأثیر بر محصولات انتخاب شده:</h4>
                    <div id="bulkStockPreview" class="text-sm text-blue-600">
                        در حال محاسبه...
                    </div>
                </div>
                
                <div class="flex justify-end gap-2">
                    <button onclick="closeBulkStockModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
                        انصراف
                    </button>
                    <button onclick="applyBulkStockChanges()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">
                        اعمال تغییرات
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // محاسبه پیش‌نمایش
    calculateStockPreview();
    
    // اضافه کردن event listener برای به‌روزرسانی پیش‌نمایش
    document.getElementById('bulkStockOperation').addEventListener('change', calculateStockPreview);
    document.getElementById('bulkStockValue').addEventListener('input', calculateStockPreview);
}

// تابع بستن مودال ویرایش موجودی
function closeBulkStockModal() {
    const modal = document.getElementById('bulkStockModal');
    if (modal) {
        modal.remove();
    }
}

// تابع محاسبه پیش‌نمایش تغییرات موجودی
function calculateStockPreview() {
    const operation = document.getElementById('bulkStockOperation').value;
    const value = parseInt(document.getElementById('bulkStockValue').value) || 0;
    const ignoreUnlimited = document.getElementById('bulkStockIgnoreUnlimited').checked;
    
    let affectedProducts = 0;
    let unlimitedProducts = 0;
    
    selectedProducts.forEach(index => {
        const product = products[index];
        if (product.stock === Infinity) {
            unlimitedProducts++;
        } else {
            affectedProducts++;
        }
    });
    
    let previewText = '';
    
    if (ignoreUnlimited && unlimitedProducts > 0) {
        previewText += `${toPersianDigits(unlimitedProducts)} محصول با موجودی نامحدود تغییر نمی‌کند. `;
    }
    
    if (affectedProducts > 0) {
        previewText += `${toPersianDigits(affectedProducts)} محصول تغییر خواهد کرد.`;
        
        if (value > 0) {
            switch(operation) {
                case 'increase':
                    previewText += ` موجودی ${toPersianDigits(value)} واحد افزایش می‌یابد.`;
                    break;
                case 'decrease':
                    previewText += ` موجودی ${toPersianDigits(value)} واحد کاهش می‌یابد.`;
                    break;
                case 'set':
                    previewText += ` موجودی به ${toPersianDigits(value)} واحد تنظیم می‌شود.`;
                    break;
            }
        }
    }
    
    const previewElement = document.getElementById('bulkStockPreview');
    if (previewElement) {
        previewElement.textContent = previewText || 'هیچ تغییری اعمال نخواهد شد.';
    }
}

// تابع اعمال تغییرات موجودی
function applyBulkStockChanges() {
    const operation = document.getElementById('bulkStockOperation').value;
    const value = parseInt(document.getElementById('bulkStockValue').value);
    const ignoreUnlimited = document.getElementById('bulkStockIgnoreUnlimited').checked;
    
    if (isNaN(value) || value < 0) {
        showNotification('لطفاً مقدار معتبر وارد کنید.', 'error');
        return;
    }
    
    let changedCount = 0;
    
    selectedProducts.forEach(index => {
        const product = products[index];
        
        // اگر محصول موجودی نامحدود دارد و گزینه ignore checked است، تغییر نده
        if (product.stock === Infinity && ignoreUnlimited) {
            return;
        }
        
        switch(operation) {
            case 'increase':
                if (product.stock === Infinity) {
                    // اگر نامحدود است، همانطور باقی بماند
                    return;
                }
                product.stock += value;
                changedCount++;
                break;
                
            case 'decrease':
                if (product.stock === Infinity) {
                    // اگر نامحدود است، همانطور باقی بماند
                    return;
                }
                product.stock = Math.max(0, product.stock - value);
                changedCount++;
                break;
                
            case 'set':
                product.stock = value;
                changedCount++;
                break;
        }
        
        product.updatedAt = new Date().toISOString();
    });
    
    saveUserData();
    loadProducts();
    closeBulkStockModal();
    
    showNotification(`موجودی ${toPersianDigits(changedCount)} محصول با موفقیت به‌روزرسانی شد.`, 'success');
}

// تابع نمایش مودال ویرایش انبوه قیمت
function showBulkPriceModal() {
    if (selectedProducts.length === 0) {
        showNotification('لطفاً حداقل یک محصول را انتخاب کنید.', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'bulkPriceModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full max-w-md">
            <div class="p-4 border-b flex justify-between items-center">
                <h3 class="font-semibold text-lg">ویرایش انبوه قیمت</h3>
                <button onclick="closeBulkPriceModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-4">
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">نوع عملیات</label>
                    <select id="bulkPriceOperation" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="increase">افزایش قیمت</option>
                        <option value="decrease">کاهش قیمت</option>
                        <option value="set">تنظیم قیمت به مقدار مشخص</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">مقدار</label>
                    <input type="number" id="bulkPriceValue" min="0" 
                           class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                           placeholder="مقدار را وارد کنید">
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">نوع مقدار</label>
                    <div class="flex gap-4">
                        <label class="flex items-center">
                            <input type="radio" name="bulkPriceType" value="fixed" checked class="ml-2 w-4 h-4">
                            <span class="text-gray-700">مقدار ثابت (ریال)</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="bulkPriceType" value="percent" class="ml-2 w-4 h-4">
                            <span class="text-gray-700">درصد</span>
                        </label>
                    </div>
                </div>
                
                <div class="bg-purple-50 p-3 rounded-lg mb-4">
                    <h4 class="font-semibold text-purple-800 mb-2">تأثیر بر محصولات انتخاب شده:</h4>
                    <div id="bulkPricePreview" class="text-sm text-purple-600">
                        در حال محاسبه...
                    </div>
                </div>
                
                <div class="flex justify-end gap-2">
                    <button onclick="closeBulkPriceModal()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
                        انصراف
                    </button>
                    <button onclick="applyBulkPriceChanges()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">
                        اعمال تغییرات
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // محاسبه پیش‌نمایش
    calculatePricePreview();
    
    // اضافه کردن event listener برای به‌روزرسانی پیش‌نمایش
    document.getElementById('bulkPriceOperation').addEventListener('change', calculatePricePreview);
    document.getElementById('bulkPriceValue').addEventListener('input', calculatePricePreview);
    document.querySelectorAll('input[name="bulkPriceType"]').forEach(radio => {
        radio.addEventListener('change', calculatePricePreview);
    });
}

// تابع بستن مودال ویرایش قیمت
function closeBulkPriceModal() {
    const modal = document.getElementById('bulkPriceModal');
    if (modal) {
        modal.remove();
    }
}

// تابع محاسبه پیش‌نمایش تغییرات قیمت
function calculatePricePreview() {
    const operation = document.getElementById('bulkPriceOperation').value;
    const value = parseInt(document.getElementById('bulkPriceValue').value) || 0;
    const priceType = document.querySelector('input[name="bulkPriceType"]:checked').value;
    
    let previewText = `${toPersianDigits(selectedProducts.length)} محصول تغییر خواهد کرد. `;
    
    if (value > 0) {
        switch(operation) {
            case 'increase':
                if (priceType === 'fixed') {
                    previewText += `قیمت ${toPersianDigits(value)} ریال افزایش می‌یابد.`;
                } else {
                    previewText += `قیمت ${toPersianDigits(value)}٪ افزایش می‌یابد.`;
                }
                break;
            case 'decrease':
                if (priceType === 'fixed') {
                    previewText += `قیمت ${toPersianDigits(value)} ریال کاهش می‌یابد.`;
                } else {
                    previewText += `قیمت ${toPersianDigits(value)}٪ کاهش می‌یابد.`;
                }
                break;
            case 'set':
                previewText += `قیمت به ${formatPrice(value)} ریال تنظیم می‌شود.`;
                break;
        }
        
        // نمایش نمونه‌ای از تغییرات
        if (selectedProducts.length > 0) {
            const sampleProduct = products[selectedProducts[0]];
            const oldPrice = sampleProduct.price;
            let newPrice = oldPrice;
            
            switch(operation) {
                case 'increase':
                    if (priceType === 'fixed') {
                        newPrice = oldPrice + value;
                    } else {
                        newPrice = Math.round(oldPrice * (1 + value / 100));
                    }
                    break;
                case 'decrease':
                    if (priceType === 'fixed') {
                        newPrice = Math.max(0, oldPrice - value);
                    } else {
                        newPrice = Math.round(oldPrice * (1 - value / 100));
                    }
                    break;
                case 'set':
                    newPrice = value;
                    break;
            }
            
            if (operation !== 'set') {
                previewText += ` نمونه: ${formatPrice(oldPrice)} → ${formatPrice(newPrice)}`;
            }
        }
    }
    
    const previewElement = document.getElementById('bulkPricePreview');
    if (previewElement) {
        previewElement.textContent = previewText;
    }
}

// تابع اعمال تغییرات قیمت
function applyBulkPriceChanges() {
    const operation = document.getElementById('bulkPriceOperation').value;
    const value = parseInt(document.getElementById('bulkPriceValue').value);
    const priceType = document.querySelector('input[name="bulkPriceType"]:checked').value;
    
    if (isNaN(value) || value < 0) {
        showNotification('لطفاً مقدار معتبر وارد کنید.', 'error');
        return;
    }
    
    let changedCount = 0;
    
    selectedProducts.forEach(index => {
        const product = products[index];
        const oldPrice = product.price;
        let newPrice = oldPrice;
        
        switch(operation) {
            case 'increase':
                if (priceType === 'fixed') {
                    newPrice = oldPrice + value;
                } else {
                    newPrice = Math.round(oldPrice * (1 + value / 100));
                }
                break;
                
            case 'decrease':
                if (priceType === 'fixed') {
                    newPrice = Math.max(0, oldPrice - value);
                } else {
                    newPrice = Math.round(oldPrice * (1 - value / 100));
                }
                break;
                
            case 'set':
                newPrice = value;
                break;
        }
        
        product.price = newPrice;
        product.updatedAt = new Date().toISOString();
        changedCount++;
    });
    
    saveUserData();
    loadProducts();
    closeBulkPriceModal();
    
    showNotification(`قیمت ${toPersianDigits(changedCount)} محصول با موفقیت به‌روزرسانی شد.`, 'success');
}