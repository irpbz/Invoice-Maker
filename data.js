let sellers = JSON.parse(localStorage.getItem('sellers') || '[]');
let customers = JSON.parse(localStorage.getItem('customers') || '[]');
let products = JSON.parse(localStorage.getItem('products') || '[]');

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
            localStorage.setItem('sellers', JSON.stringify(sellers));
            loadSellers();
            clearSellerInputs();
        } else {
            alert('لطفاً نام فروشنده را وارد کنید.');
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
                ${seller.logo ? `<img src="${seller.logo}" class="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg mr-4"style="
    margin-left: 1rem;
    margin-right: 0;
">` : ''}
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
        localStorage.setItem('sellers', JSON.stringify(sellers));
        loadSellers();
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
        localStorage.setItem('customers', JSON.stringify(customers));
        loadCustomers();
        clearCustomerInputs();
    } else {
        alert('لطفاً نام خریدار را وارد کنید.');
    }
}

function loadCustomers() {
    const customerSelect = document.getElementById('customerSelect');
    const customerList = document.getElementById('customerList');
    customerSelect.innerHTML = '<option value="">انتخاب خریدار</option>';
    customerList.innerHTML = '';
    customers.forEach((customer, index) => {
        customerSelect.innerHTML += `<option value="${index}">${customer.name}</option>`;
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
        localStorage.setItem('customers', JSON.stringify(customers));
        loadCustomers();
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
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        dropdown.innerHTML = '';
        const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(query) || (c.nationalId && c.nationalId.toLowerCase().includes(query)));
        filteredCustomers.forEach((customer, index) => {
            const div = document.createElement('div');
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
            const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(query) || (c.nationalId && c.nationalId.toLowerCase().includes(query)));
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
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
            clearProductInputs();
        } else {
            alert('لطفاً کد و نام محصول را وارد کنید.');
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
    productList.innerHTML = '';
    products.forEach((product, index) => {
        const div = document.createElement('div');
        div.className = 'border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition';
        div.innerHTML = `
            <div class="flex items-start mb-4">
                ${product.image ? `<img src="${product.image}" class="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg mr-4">` : ''}
                <div>
                    <h3 class="text-base sm:text-lg font-semibold text-gray-800">${product.name}</h3>
                    <p class="text-gray-600">کد: ${product.code}</p>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <p><span class="text-gray-500">موجودی:</span> ${product.stock === Infinity ? 'نامحدود' : toPersianDigits(product.stock ?? 0)}</p>
                <p><span class="text-gray-500">قیمت:</span> ${formatPrice(product.price ?? 0)} ${document.getElementById('currency')?.value === 'toman' ? 'تومان' : 'ریال'}</p>
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
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
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
document.getElementById('unlimitedStock').addEventListener('change', (e) => {
    const stockInput = document.getElementById('productStockInput');
    stockInput.disabled = e.target.checked;
    if (e.target.checked) {
        stockInput.value = '';
    }
});

// جستجوی محصولات
function updateProductSearch() {
    const searchInput = document.getElementById('itemSearch');
    const dropdown = document.getElementById('itemSearchDropdown');
    const imagePreview = document.getElementById('itemImagePreview');
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        dropdown.innerHTML = '';
        const filteredProducts = products.filter(p => p.code.toLowerCase().includes(query) || p.name.toLowerCase().includes(query));
        filteredProducts.forEach((product, index) => {
            const div = document.createElement('div');
            div.textContent = `${product.name} (${product.code})`;
            div.addEventListener('click', () => {
                document.getElementById('itemSearch').value = `${product.name} (${product.code})`;
                document.getElementById('itemCode').value = products.indexOf(product);
                document.getElementById('itemName').value = product.name;
                document.getElementById('itemPrice').value = product.price;
                dropdown.classList.remove('show');
                if (product.image) {
                    imagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}" class="rounded-lg shadow-md">`;
                    imagePreview.classList.remove('hidden');
                } else {
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
            const filteredProducts = products.filter(p => p.code.toLowerCase().includes(query) || p.name.toLowerCase().includes(query));
            dropdown.classList.toggle('show', filteredProducts.length > 0);
        }
    });
}