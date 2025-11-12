// data.js - مدیریت کامل داده‌های سیستم فاکتور
let sellers = [];
let customers = [];
let products = [];

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

// ذخیره داده‌های کاربر جاری
function saveUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userData = {
        sellers: sellers,
        customers: customers,
        products: products,
        invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
        customerAccounts: JSON.parse(localStorage.getItem('customerAccounts') || '{}')
    };
    
    if (currentUser && currentUser.id) {
        localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
    } else {
        // ذخیره در localStorage قدیمی برای سازگاری
        localStorage.setItem('sellers', JSON.stringify(sellers));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('products', JSON.stringify(products));
    }
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
        signature: null
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
        address: document.getElementById('customerAddressInput').value
    };

    if (customer.name) {
        const existingIndex = customers.findIndex(c => c.name === customer.name);
        if (existingIndex >= 0) {
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
    
    customers.forEach((customer, index) => {
        customerSelect.innerHTML += `<option value="${index}">${customer.name}</option>`;
        
        if (accountingCustomerSelect) {
            accountingCustomerSelect.innerHTML += `<option value="${index}">${customer.name} - ${customer.phone || 'بدون تلفن'}</option>`;
        }
        
        if (invoiceCustomerFilter) {
            invoiceCustomerFilter.innerHTML += `<option value="${index}">${customer.name}</option>`;
        }
        
        const div = document.createElement('div');
        div.className = 'border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition';
        div.innerHTML = `
            <h3 class="text-base sm:text-lg font-semibold text-gray-800 mb-2">${customer.name}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                ${customer.phone ? `<p><span class="text-gray-500">تلفن:</span> ${toPersianDigits(customer.phone)}</p>` : ''}
                ${customer.nationalId ? `<p><span class="text-gray-500">کد ملی:</span> ${toPersianDigits(customer.nationalId)}</p>` : ''}
                ${customer.economicCode ? `<p><span class="text-gray-500">کد اقتصادی:</span> ${toPersianDigits(customer.economicCode)}</p>` : ''}
                ${customer.postalCode ? `<p><span class="text-gray-500">کد پستی:</span> ${toPersianDigits(customer.postalCode)}</p>` : ''}
                ${customer.accountNumber ? `<p><span class="text-gray-500">شماره حساب:</span> ${toPersianDigits(customer.accountNumber)}</p>` : ''}
            </div>
            ${customer.address ? `<p class="text-gray-700 mb-4"><span class="text-gray-500">آدرس:</span> ${customer.address}</p>` : ''}
            <div class="flex justify-end gap-2">
                <button onclick="editCustomer(${index})" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">ویرایش</button>
                <button onclick="deleteCustomer(${index})" class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">حذف</button>
            </div>
        `;
        customerList.appendChild(div);
    });
    
    // بارگذاری مشتریان در تب حسابداری
    if (typeof loadAccountingCustomers === 'function') loadAccountingCustomers();
    updateCustomerSearch();
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
        image: null
    };

    const imageInput = document.getElementById('productImageInput');

    function saveProductData() {
        if (product.name && product.code) {
            const existingIndex = products.findIndex(p => p.code === product.code);
            if (existingIndex >= 0) {
                const existingProduct = products[existingIndex];
                product.image = product.image || existingProduct.image;
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

function loadProducts() {
    const productList = document.getElementById('productList');
    if (!productList) return;
    
    productList.innerHTML = '';
    products.forEach((product, index) => {
        const div = document.createElement('div');
        div.className = 'border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition';
        div.innerHTML = `
            <div class="flex items-start mb-4">
                ${product.image ? `<img src="${product.image}" class="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg ml-4">` : ''}
                <div>
                    <h3 class="text-base sm:text-lg font-semibold text-gray-800">${product.name}</h3>
                    <p class="text-gray-600">کد: ${product.code}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <p><span class="text-gray-500">موجودی:</span> ${product.stock === Infinity ? 'نامحدود' : toPersianDigits(product.stock ?? 0)}</p>
                <p><span class="text-gray-500">قیمت:</span> ${formatPrice(product.price ?? 0)} ریال</p>
            </div>
            <div class="flex justify-end gap-2">
                <button onclick="editProduct(${index})" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">ویرایش</button>
                <button onclick="deleteProduct(${index})" class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">حذف</button>
            </div>
        `;
        productList.appendChild(div);
    });
    updateProductSearch();
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

function loadAccountingCustomers() {
    const accountingCustomerSelect = document.getElementById('accountingCustomerSelect');
    if (!accountingCustomerSelect) return;
    
    accountingCustomerSelect.innerHTML = '<option value="">انتخاب مشتری</option>';
    
    customers.forEach((customer, index) => {
        accountingCustomerSelect.innerHTML += `<option value="${index}">${customer.name} - ${customer.phone || 'بدون تلفن'}</option>`;
    });
}

function loadCustomerAccounting() {
    const customerIndex = document.getElementById('accountingCustomerSelect').value;
    if (customerIndex === '') return;

    const customer = customers[customerIndex];
    const customerId = customerIndex;
    
    // اگر حساب مشتری وجود ندارد، ایجاد کن
    if (!customerAccounts[customerId]) {
        customerAccounts[customerId] = {
            payments: [],
            balance: 0,
            totalPurchases: 0
        };
    }

    // محاسبه کل خریدها از فاکتورهای ذخیره شده
    calculateCustomerPurchases(customerId);
    
    // نمایش اطلاعات مالی
    updateAccountingDisplay(customerId);
    
    // نمایش تاریخچه تراکنش‌ها
    displayTransactionHistory(customerId);
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
    
    localStorage.setItem('customerAccounts', JSON.stringify(customerAccounts));
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
        timestamp: new Date().getTime()
    };

    if (!customerAccounts[customerId]) {
        customerAccounts[customerId] = {
            payments: [],
            balance: 0,
            totalPurchases: 0
        };
    }

    customerAccounts[customerId].payments.push(payment);
    customerAccounts[customerId].balance = customerAccounts[customerId].totalPurchases - calculateTotalPayments(customerId);
    
    localStorage.setItem('customerAccounts', JSON.stringify(customerAccounts));
    
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
        
        localStorage.setItem('customerAccounts', JSON.stringify(customerAccounts));
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
});


