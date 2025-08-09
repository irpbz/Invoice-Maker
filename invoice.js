let items = [];
let invoiceLogo = null;
let invoiceSignature = null;

// تنظیم تاریخ شمسی
document.getElementById('invoiceDate').value = new persianDate().format('YYYY/MM/DD');

// بارگذاری لوگو و امضا در تب صدور فاکتور
document.getElementById('invoiceLogoInput').addEventListener('change', (e) => {
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            invoiceLogo = e.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

document.getElementById('invoiceSignatureInput').addEventListener('change', (e) => {
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            invoiceSignature = e.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});

function addItem() {
    const codeIndex = document.getElementById('itemCode').value;
    const name = document.getElementById('itemName').value;
    const qty = parseInt(document.getElementById('itemQty').value) || 0;
    const price = parseInt(document.getElementById('itemPrice').value) || 0;
    if (name && qty > 0 && price >= 0) {
        let product = null;
        if (codeIndex !== '') {
            product = products[codeIndex];
            if (product && product.stock !== Infinity && product.stock < qty) {
                alert('موجودی کافی نیست!');
                return;
            }
        }
        items.push({
            code: product ? product.code : '',
            name,
            qty,
            price,
            total: qty * price,
            image: product ? product.image : null
        });
        if (product && product.stock !== Infinity) {
            product.stock -= qty;
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
        }
        updateTable();
        clearItemInputs();
        document.getElementById('itemImagePreview').innerHTML = '';
        document.getElementById('itemImagePreview').classList.add('hidden');
    } else {
        alert('لطفاً تمامی فیلدها را به درستی پر کنید.');
    }
}

function editItem(index) {
    const item = items[index];
    const code = prompt('کد محصول:', item.code);
    const name = prompt('شرح:', item.name);
    const qty = parseInt(prompt('تعداد:', item.qty)) || 0;
    const price = parseInt(prompt('قیمت واحد:', item.price)) || 0;
    if (name && qty > 0 && price >= 0) {
        const oldQty = item.qty;
        let product = null;
        if (code && code !== item.code) {
            product = products.find(p => p.code === code);
            if (product && product.stock !== Infinity && product.stock < qty) {
                alert('موجودی کافی نیست!');
                return;
            }
        }
        if (item.code && item.code !== code) {
            const oldProduct = products.find(p => p.code === item.code);
            if (oldProduct && oldProduct.stock !== Infinity) {
                oldProduct.stock += oldQty;
            }
        }
        items[index] = {
            code: product ? product.code : code,
            name,
            qty,
            price,
            total: qty * price,
            image: product ? product.image : item.image
        };
        if (product && product.stock !== Infinity) {
            product.stock -= qty;
        }
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
        updateTable();
    } else {
        alert('لطفاً تمامی فیلدها را به درستی پر کنید.');
    }
}

function deleteItem(index) {
    const item = items[index];
    if (item.code) {
        const product = products.find(p => p.code === item.code);
        if (product && product.stock !== Infinity) {
            product.stock += item.qty;
            localStorage.setItem('products', JSON.stringify(products));
            loadProducts();
        }
    }
    items.splice(index, 1);
    updateTable();
}

function updateTable() {
    const table = document.getElementById('itemTable');
    table.innerHTML = '';
    let subTotal = 0;
    let totalQty = 0;
    const currency = document.getElementById('currency').value;
    items.forEach((item, index) => {
        subTotal += item.total;
        totalQty += item.qty;
        const priceDisplay = formatPrice(item.price);
        const totalDisplay = formatPrice(item.total);
        const row = `
            <tr class="border-t table-row">
                <td class="p-2 sm:p-3 border">${toPersianDigits(index + 1)}</td>
                <td class="p-2 sm:p-3 border">${item.image ? `<img src="${item.image}" class="w-[50px] h-[50px] object-cover rounded">` : '-'}</td>
                <td class="p-2 sm:p-3 border">${item.code || '-'}</td>
                <td class="p-2 sm:p-3 border">${item.name}</td>
                <td class="p-2 sm:p-3 border">${toPersianDigits(item.qty)}</td>
                <td class="p-2 sm:p-3 border">${priceDisplay} ${currency === 'rial' ? 'ریال' : 'تومان'}</td>
                <td class="p-2 sm:p-3 border">${totalDisplay} ${currency === 'rial' ? 'ریال' : 'تومان'}</td>
                <td class="p-2 sm:p-3 border">
                    <button onclick="editItem(${index})" class="text-blue-500 hover:text-blue-700 transition">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
                <td class="p-2 sm:p-3 border">
                    <button onclick="deleteItem(${index})" class="text-red-500 hover:text-red-700 transition">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
        table.innerHTML += row;
    });
    table.innerHTML += `
        <tr class="border-t font-bold bg-gray-100">
            <td class="p-2 sm:p-3 border" colspan="4">جمع</td>
            <td class="p-2 sm:p-3 border">${toPersianDigits(totalQty)}</td>
            <td class="p-2 sm:p-3 border">-</td>
            <td class="p-2 sm:p-3 border">${formatPrice(subTotal)} ${currency === 'rial' ? 'ریال' : 'تومان'}</td>
            <td class="p-2 sm:p-3 border" colspan="2"></td>
        </tr>
    `;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const discountValue = parseInt(document.getElementById('discount').value) || 0;
    const discountType = document.getElementById('discountType').value;
    const previousDebt = parseInt(document.getElementById('previousDebt').value) || 0;
    const customAmount = parseInt(document.getElementById('customAmount').value) || 0;
    const customName = document.getElementById('customName').value || 'هزینه اضافی';
    const prepaymentAmount = parseInt(document.getElementById('prepaymentAmount').value) || 0;
    const prepaymentName = document.getElementById('prepaymentName').value || 'پیش‌پرداخت';
    const prepaymentType = document.getElementById('prepaymentType').value;

    const totalTax = subTotal * (taxRate / 100);
    let discount = discountType === 'percentage' ? subTotal * (discountValue / 100) : discountValue;
    let grandTotal = subTotal + totalTax - discount + previousDebt + customAmount;
    if (prepaymentType === 'subtract') {
        grandTotal -= prepaymentAmount;
    } else {
        grandTotal += prepaymentAmount;
    }

    document.getElementById('totalTax').textContent = `${formatPrice(totalTax.toFixed(0))} ${currency === 'rial' ? 'ریال' : 'تومان'}`;
    document.getElementById('discountAmount').textContent = `${formatPrice(discount.toFixed(0))} ${currency === 'rial' ? 'ریال' : 'تومان'}`;
    document.getElementById('debtAmount').textContent = `${formatPrice(previousDebt)} ${currency === 'rial' ? 'ریال' : 'تومان'}`;
    document.getElementById('customAmountContainer').innerHTML = `<p><strong>${customName}:</strong> <span id="customAmountDisplay">${formatPrice(customAmount)} ${currency === 'rial' ? 'ریال' : 'تومان'}</span></p>`;
    document.getElementById('prepaymentAmountContainer').innerHTML = `<p><strong>${prepaymentName}:</strong> <span id="prepaymentAmountDisplay">${formatPrice(prepaymentAmount)} ${currency === 'rial' ? 'ریال' : 'تومان'}</span></p>`;
    document.getElementById('grandTotal').textContent = `${formatPrice(grandTotal.toFixed(0))} ${currency === 'rial' ? 'ریال' : 'تومان'}`;
    document.getElementById('grandTotalText').textContent = numberToPersianWords(Math.floor(grandTotal)) + (currency === 'rial' ? ' ریال' : ' تومان');
}

function clearItemInputs() {
    document.getElementById('itemSearch').value = '';
    document.getElementById('itemCode').value = '';
    document.getElementById('itemName').value = '';
    document.getElementById('itemQty').value = '';
    document.getElementById('itemPrice').value = '';
}

function resetForm() {
    items = [];
    document.getElementById('invoiceDate').value = new persianDate().format('YYYY/MM/DD');
    document.getElementById('invoiceNumber').value = '';
    document.getElementById('previousDebt').value = '';
    document.getElementById('currency').value = 'rial';
    document.getElementById('invoiceType').value = 'صورتحساب فروش';
    document.getElementById('sellerSelectInvoice').value = '';
    document.getElementById('invoiceTitle').value = '';
    document.getElementById('customerSearch').value = '';
    document.getElementById('customerIndex').value = '';
    document.getElementById('taxRate').value = '';
    document.getElementById('discount').value = '';
    document.getElementById('discountType').value = 'numeric';
    document.getElementById('customName').value = '';
    document.getElementById('customAmount').value = '';
    document.getElementById('prepaymentName').value = 'پیش‌پرداخت';
    document.getElementById('prepaymentAmount').value = '';
    document.getElementById('prepaymentType').value = 'subtract';
    document.getElementById('customText').value = '';
    document.getElementById('invoiceLogoInput').value = '';
    document.getElementById('invoiceSignatureInput').value = '';
    document.getElementById('includeSignature').checked = true;
    invoiceLogo = null;
    invoiceSignature = null;
    updateTable();
    document.getElementById('invoicePreview').classList.add('hidden');
    document.getElementById('savedInvoices').classList.add('hidden');
}

function generateInvoice() {
    const invoiceDate = document.getElementById('invoiceDate').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const invoiceType = document.getElementById('invoiceType').value;
    const sellerIndex = document.getElementById('sellerSelectInvoice').value;
    const invoiceTitle = document.getElementById('invoiceTitle').value;
    const customerIndex = document.getElementById('customerIndex').value;
    const currency = document.getElementById('currency').value;
    const customText = document.getElementById('customText').value;
    const includeSignature = document.getElementById('includeSignature').checked;

    let sellerInfo = '';
    let logoSrc = invoiceLogo;
    let signatureSrc = includeSignature ? invoiceSignature : null;
    let sellerNameOrTitle = invoiceTitle;
    if (sellerIndex !== '') {
        const seller = sellers[sellerIndex];
        sellerNameOrTitle = seller.name || invoiceTitle;
        sellerInfo = `
            <div class="info-box mb-6">
                <h3 class="text-lg font-semibold">مشخصات فروشنده</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${seller.name ? `<div class="summary-item"><p><strong>نام:</strong> ${seller.name}</p></div>` : ''}
                    ${seller.phone ? `<div class="summary-item"><p><strong>تلفن:</strong> ${toPersianDigits(seller.phone)}</p></div>` : ''}
                    ${seller.nationalId ? `<div class="summary-item"><p><strong>کد ملی:</strong> ${toPersianDigits(seller.nationalId)}</p></div>` : ''}
                    ${seller.economicCode ? `<div class="summary-item"><p><strong>کد اقتصادی:</strong> ${toPersianDigits(seller.economicCode)}</p></div>` : ''}
                    ${seller.postalCode ? `<div class="summary-item"><p><strong>کد پستی:</strong> ${toPersianDigits(seller.postalCode)}</p></div>` : ''}
                    ${seller.accountNumber ? `<div class="summary-item"><p><strong>شماره حساب:</strong> ${toPersianDigits(seller.accountNumber)}</p></div>` : ''}
                    ${seller.address ? `<div class="summary-item"><p><strong>آدرس:</strong> ${seller.address}</p></div>` : ''}
                </div>
            </div>
        `;
        logoSrc = logoSrc || seller.logo;
        signatureSrc = includeSignature ? (signatureSrc || seller.signature) : null;
    } else if (invoiceTitle) {
        sellerInfo = `
            <div class="info-box mb-6">
                <h3 class="text-lg font-semibold">${invoiceTitle}</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="summary-item"><p><strong>عنوان:</strong> ${invoiceTitle}</p></div>
                </div>
            </div>`;
    }

    let customerInfo = '';
    if (customerIndex !== '') {
        const customer = customers[customerIndex];
        customerInfo = `
            <div class="info-box mb-6">
                <h3 class="text-lg font-semibold">مشخصات خریدار</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${customer.name ? `<div class="summary-item"><p><strong>نام:</strong> ${customer.name}</p></div>` : ''}
                    ${customer.phone ? `<div class="summary-item"><p><strong>تلفن:</strong> ${toPersianDigits(customer.phone)}</p></div>` : ''}
                    ${customer.nationalId ? `<div class="summary-item"><p><strong>کد ملی:</strong> ${toPersianDigits(customer.nationalId)}</p></div>` : ''}
                    ${customer.economicCode ? `<div class="summary-item"><p><strong>کد اقتصادی:</strong> ${toPersianDigits(customer.economicCode)}</p></div>` : ''}
                    ${customer.postalCode ? `<div class="summary-item"><p><strong>کد پستی:</strong> ${toPersianDigits(customer.postalCode)}</p></div>` : ''}
                    ${customer.accountNumber ? `<div class="summary-item"><p><strong>شماره حساب:</strong> ${toPersianDigits(customer.accountNumber)}</p></div>` : ''}
                    ${customer.address ? `<div class="summary-item"><p><strong>آدرس:</strong> ${customer.address}</p></div>` : ''}
                </div>
            </div>
        `;
    }

    let itemRows = '';
    let subTotal = 0;
    let totalQty = 0;
    items.forEach((item, index) => {
        subTotal += item.total;
        totalQty += item.qty;
        const priceDisplay = formatPrice(item.price);
        const totalDisplay = formatPrice(item.total);
        itemRows += `
            <tr class="border-t table-row">
                <td class="p-2 sm:p-3 border">${toPersianDigits(index + 1)}</td>
                <td class="p-2 sm:p-3 border">${item.image ? `<img src="${item.image}" class="w-[50px] h-[50px] object-cover rounded">` : '-'}</td>
                <td class="p-2 sm:p-3 border">${item.code || '-'}</td>
                <td class="p-2 sm:p-3 border">${item.name}</td>
                <td class="p-2 sm:p-3 border">${toPersianDigits(item.qty)}</td>
                <td class="p-2 sm:p-3 border">${priceDisplay} ${currency === 'rial' ? 'ریال' : 'تومان'}</td>
                <td class="p-2 sm:p-3 border">${totalDisplay} ${currency === 'rial' ? 'ریال' : 'تومان'}</td>
            </tr>`;
    });
    itemRows += `
        <tr class="border-t font-bold bg-gray-100">
            <td class="p-2 sm:p-3 border" colspan="4">جمع</td>
            <td class="p-2 sm:p-3 border">${toPersianDigits(totalQty)}</td>
            <td class="p-2 sm:p-3 border">-</td>
            <td class="p-2 sm:p-3 border">${formatPrice(subTotal)} ${currency === 'rial' ? 'ریال' : 'تومان'}</td>
        </tr>
    `;

    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const discountValue = parseInt(document.getElementById('discount').value) || 0;
    const discountType = document.getElementById('discountType').value;
    const previousDebt = parseInt(document.getElementById('previousDebt').value) || 0;
    const customAmount = parseInt(document.getElementById('customAmount').value) || 0;
    const customName = document.getElementById('customName').value || 'هزینه اضافی';
    const prepaymentAmount = parseInt(document.getElementById('prepaymentAmount').value) || 0;
    const prepaymentName = document.getElementById('prepaymentName').value || 'پیش‌پرداخت';
    const prepaymentType = document.getElementById('prepaymentType').value;

    const totalTax = subTotal * (taxRate / 100);
    let discount = discountType === 'percentage' ? subTotal * (discountValue / 100) : discountValue;
    let grandTotal = subTotal + totalTax - discount + previousDebt + customAmount;
    if (prepaymentType === 'subtract') {
        grandTotal -= prepaymentAmount;
    } else {
        grandTotal += prepaymentAmount;
    }

    const previewContent = `
        <div class="p-4 sm:p-8 bg-white rounded-lg shadow-lg text-right">
            <div class="grid grid-cols-4 gap-4 mb-6">
                <!-- سمت راست: لوگو (1/4) -->
                <div class="col-span-1 flex justify-end items-center">
                    ${logoSrc ? `<img src="${logoSrc}" class="w-24 sm:w-32 h-auto logo-container">` : ''}
                </div>
                <!-- وسط: نوع فاکتور و عنوان/نام فروشنده (2/4) -->
                <div class="col-span-2 flex flex-col justify-center items-center text-center">
                    <h2 class="text-xl sm:text-2xl font-bold">${invoiceType}</h2>
                    <p class="text-lg sm:text-xl">${sellerNameOrTitle || '-'}</p>
                </div>
                <!-- سمت چپ: شماره و تاریخ (1/4) -->
                <div class="col-span-1 flex flex-col justify-center items-start">
                    ${invoiceNumber ? `<p class="text-gray-600">شماره: ${toPersianDigits(invoiceNumber)}</p>` : ''}
                    <p class="text-gray-600">${invoiceDate}</p>
                </div>
            </div>
            ${sellerInfo}
            ${customerInfo}
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-4">اقلام فاکتور</h3>
                <table class="w-full text-right border-collapse text-sm sm:text-base">
                    <thead>
                        <tr class="bg-gray-200">
                            <th class="p-2 sm:p-3 border">ردیف</th>
                            <th class="p-2 sm:p-3 border">تصویر</th>
                            <th class="p-2 sm:p-3 border">کد محصول</th>
                            <th class="p-2 sm:p-3 border">شرح</th>
                            <th class="p-2 sm:p-3 border">تعداد</th>
                            <th class="p-2 sm:p-3 border">قیمت واحد</th>
                            <th class="p-2 sm:p-3 border">مجموع</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>
            </div>
            <div class="summary-box mb-6">
                <h3 class="text-lg font-semibold mb-4">جمع‌بندی</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${totalTax ? `<div class="summary-item"><p><strong>مالیات (${toPersianDigits(taxRate)}%):</strong> ${formatPrice(totalTax.toFixed(0))} ${currency === 'rial' ? 'ریال' : 'تومان'}</p></div>` : ''}
                    ${discount ? `<div class="summary-item"><p><strong>تخفیف:</strong> ${formatPrice(discount.toFixed(0))} ${currency === 'rial' ? 'ریال' : 'تومان'}</p></div>` : ''}
                    ${previousDebt ? `<div class="summary-item"><p><strong>مانده از قبل:</strong> ${formatPrice(previousDebt)} ${currency === 'rial' ? 'ریال' : 'تومان'}</p></div>` : ''}
                    ${customAmount ? `<div class="summary-item"><p><strong>${customName}:</strong> ${formatPrice(customAmount)} ${currency === 'rial' ? 'ریال' : 'تومان'}</p></div>` : ''}
                    ${prepaymentAmount ? `<div class="summary-item"><p><strong>${prepaymentName}:</strong> ${formatPrice(prepaymentAmount)} ${currency === 'rial' ? 'ریال' : 'تومان'}</p></div>` : ''}
                    <div class="col-span-1 sm:col-span-2 grand-total"><p class="text-lg sm:text-xl"><strong>مجموع کل:</strong> ${formatPrice(grandTotal.toFixed(0))} ${currency === 'rial' ? 'ریال' : 'تومان'} | ${numberToPersianWords(Math.floor(grandTotal))} ${currency === 'rial' ? 'ریال' : 'تومان'}</p></div>
                </div>
            </div>
            ${customText ? `
                <div class="info-box mb-6">
                    <h3 class="text-lg font-semibold mb-2">توضیحات</h3>
                    <div class="summary-item"><p>${customText}</p></div>
                </div>` : ''}
            ${signatureSrc ? `
                <div class="mt-6 flex justify-between">
                    <div class="text-right">
                        <h3 class="text-lg font-semibold mb-2">امضا فروشنده:</h3>
                        <img src="${signatureSrc}" class="w-24 sm:w-32 h-auto">
                        <p class="text-xs text-gray-500 mt-2">با سپاس از خرید و انتخاب شما - ${invoiceDate}</p>
                    </div>
                    <div class="text-right">
                        <h3 class="text-lg font-semibold mb-2">امضا خریدار:</h3>
                        <div class="w-24 sm:w-32 h-12 border border-gray-300 rounded"></div>
                    </div>
                </div>` : ''}
        </div>
    `;
    document.getElementById('previewContent').innerHTML = previewContent;
    document.getElementById('invoicePreview').classList.remove('hidden');
    document.getElementById('savedInvoices').classList.add('hidden');
}

function generateImage() {
    const invoicePreview = document.getElementById('invoicePreview');
    html2canvas(invoicePreview, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `invoice-${document.getElementById('invoiceNumber').value || 'preview'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

function saveInvoice() {
    const invoice = {
        date: document.getElementById('invoiceDate').value,
        number: document.getElementById('invoiceNumber').value,
        type: document.getElementById('invoiceType').value,
        sellerIndex: document.getElementById('sellerSelectInvoice').value,
        invoiceTitle: document.getElementById('invoiceTitle').value,
        customerIndex: document.getElementById('customerIndex').value,
        items: [...items],
        taxRate: parseFloat(document.getElementById('taxRate').value) || 0,
        discount: parseInt(document.getElementById('discount').value) || 0,
        discountType: document.getElementById('discountType').value,
        previousDebt: parseInt(document.getElementById('previousDebt').value) || 0,
        customName: document.getElementById('customName').value || 'هزینه اضافی',
        customAmount: parseInt(document.getElementById('customAmount').value) || 0,
        prepaymentName: document.getElementById('prepaymentName').value || 'پیش‌پرداخت',
        prepaymentAmount: parseInt(document.getElementById('prepaymentAmount').value) || 0,
        prepaymentType: document.getElementById('prepaymentType').value,
        customText: document.getElementById('customText').value,
        logo: invoiceLogo,
        signature: document.getElementById('includeSignature').checked ? invoiceSignature : null
    };
    let savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    savedInvoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(savedInvoices));
    alert('فاکتور با موفقیت ذخیره شد.');
}

function loadInvoices() {
    const savedInvoicesList = document.getElementById('savedInvoicesList');
    savedInvoicesList.innerHTML = '';
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    savedInvoices.forEach((invoice, index) => {
        const div = document.createElement('div');
        div.className = 'border p-4 sm:p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition';
        div.innerHTML = `
            <h3 class="text-base sm:text-lg font-semibold text-gray-800 mb-2">${invoice.type} ${invoice.number ? 'شماره ' + toPersianDigits(invoice.number) : ''}</h3>
            <p class="text-gray-600 mb-2">تاریخ: ${invoice.date}</p>
            ${invoice.sellerIndex !== '' ? `<p class="text-gray-600 mb-2">فروشنده: ${sellers[invoice.sellerIndex]?.name || '-'}</p>` : invoice.invoiceTitle ? `<p class="text-gray-600 mb-2">عنوان: ${invoice.invoiceTitle}</p>` : ''}
            ${invoice.customerIndex !== '' ? `<p class="text-gray-600 mb-2">خریدار: ${customers[invoice.customerIndex]?.name || '-'}</p>` : ''}
            <p class="text-gray-600 mb-4">مجموع: ${formatPrice(calculateInvoiceTotal(invoice))} ${invoice.currency || 'ریال'}</p>
            <div class="flex justify-end gap-2">
                <button onclick="viewInvoice(${index})" class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">مشاهده</button>
                <button onclick="deleteInvoice(${index})" class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2 transition">حذف</button>
            </div>
        `;
        savedInvoicesList.appendChild(div);
    });
    document.getElementById('savedInvoices').classList.remove('hidden');
    document.getElementById('invoicePreview').classList.add('hidden');
}

function calculateInvoiceTotal(invoice) {
    let subTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const totalTax = subTotal * (invoice.taxRate / 100);
    let discount = invoice.discountType === 'percentage' ? subTotal * (invoice.discount / 100) : invoice.discount;
    let grandTotal = subTotal + totalTax - discount + invoice.previousDebt + invoice.customAmount;
    if (invoice.prepaymentType === 'subtract') {
        grandTotal -= invoice.prepaymentAmount;
    } else {
        grandTotal += invoice.prepaymentAmount;
    }
    return grandTotal.toFixed(0);
}

function viewInvoice(index) {
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const invoice = savedInvoices[index];
    document.getElementById('invoiceDate').value = invoice.date;
    document.getElementById('invoiceNumber').value = invoice.number;
    document.getElementById('invoiceType').value = invoice.type;
    document.getElementById('sellerSelectInvoice').value = invoice.sellerIndex;
    document.getElementById('invoiceTitle').value = invoice.invoiceTitle;
    document.getElementById('customerIndex').value = invoice.customerIndex;
    document.getElementById('customerSearch').value = invoice.customerIndex !== '' ? `${customers[invoice.customerIndex]?.name} (${customers[invoice.customerIndex]?.nationalId || '-'})` : '';
    document.getElementById('taxRate').value = invoice.taxRate;
    document.getElementById('discount').value = invoice.discount;
    document.getElementById('discountType').value = invoice.discountType;
    document.getElementById('previousDebt').value = invoice.previousDebt;
    document.getElementById('customName').value = invoice.customName;
    document.getElementById('customAmount').value = invoice.customAmount;
    document.getElementById('prepaymentName').value = invoice.prepaymentName;
    document.getElementById('prepaymentAmount').value = invoice.prepaymentAmount;
    document.getElementById('prepaymentType').value = invoice.prepaymentType;
    document.getElementById('customText').value = invoice.customText;
    invoiceLogo = invoice.logo;
    invoiceSignature = invoice.signature;
    document.getElementById('includeSignature').checked = !!invoice.signature;
    items = [...invoice.items];
    updateTable();
    generateInvoice();
    openTab('invoiceTab');
}

function deleteInvoice(index) {
    if (confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
        let savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        savedInvoices.splice(index, 1);
        localStorage.setItem('invoices', JSON.stringify(savedInvoices));
        loadInvoices();
    }
}