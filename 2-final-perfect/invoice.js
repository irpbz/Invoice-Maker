// invoice.js - سیستم صدور فاکتور
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
                showNotification('موجودی کافی نیست!', 'error');
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
            saveUserData();
            loadProducts();
        }
        
        updateTable();
        clearItemInputs();
        document.getElementById('itemImagePreview').innerHTML = '';
        document.getElementById('itemImagePreview').classList.add('hidden');
    } else {
        showNotification('لطفاً تمامی فیلدها را به درستی پر کنید.', 'error');
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
                showNotification('موجودی کافی نیست!', 'error');
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
        
        saveUserData();
        loadProducts();
        updateTable();
    } else {
        showNotification('لطفاً تمامی فیلدها را به درستی پر کنید.', 'error');
    }
}

function deleteItem(index) {
    const item = items[index];
    if (item.code) {
        const product = products.find(p => p.code === item.code);
        if (product && product.stock !== Infinity) {
            product.stock += item.qty;
            saveUserData();
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
    
    showNotification('فرم با موفقیت بازنشانی شد.', 'info');
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
<div class="invoice-page">
    
    <!-- ========================================
         سربرگ فاکتور
         ======================================== -->
    <div class="invoice-header">
        
        <!-- بخش لوگو -->
        <div class="logo-section">
            <div class="logo-box">
                ${logoSrc ? `<img src="${logoSrc}" alt="لوگو">` : ''}
            </div>
        </div>
        
        <!-- بخش عنوان -->
        <div class="title-section">
            <h1>${invoiceType} ${sellerNameOrTitle ? `| ${sellerNameOrTitle}` : ''}</h1>
        </div>
        
        <!-- بخش شماره و تاریخ -->
        <div class="info-section">
            ${invoiceNumber ? `<div class="info-row"><label>شماره :</label><span>${toPersianDigits(invoiceNumber)}</span></div>` : ''}
            <div class="info-row">
                <label>تاریخ :</label>
                <span>${invoiceDate}</span>
            </div>
        </div>
        
    </div>
    
    <!-- ========================================
         کادرهای فروشنده و خریدار
         ======================================== -->
    <div class="party-boxes ${sellerIndex === '' ? 'single-buyer' : ''}">
        
        <!-- فروشنده (فقط اگر انتخاب شده باشد) -->
        ${sellerIndex !== '' ? `
        <div class="party-box seller">
            <div class="party-box-label">فروشنده</div>
            <div class="party-box-content">
                <strong>${sellers[sellerIndex]?.name || ''}</strong>
                ${sellers[sellerIndex]?.phone ? ` <span class="separator">|</span> تلفن: ${toPersianDigits(sellers[sellerIndex].phone)}` : ''}
                ${sellers[sellerIndex]?.nationalId ? ` <span class="separator">|</span> کد ملی: ${toPersianDigits(sellers[sellerIndex].nationalId)}` : ''}
                ${sellers[sellerIndex]?.economicCode ? ` <span class="separator">|</span> کد اقتصادی: ${toPersianDigits(sellers[sellerIndex].economicCode)}` : ''}
                ${sellers[sellerIndex]?.postalCode ? ` <span class="separator">|</span> کد پستی: ${toPersianDigits(sellers[sellerIndex].postalCode)}` : ''}
                ${sellers[sellerIndex]?.accountNumber ? ` <span class="separator">|</span> شماره حساب: ${toPersianDigits(sellers[sellerIndex].accountNumber)}` : ''}
                ${sellers[sellerIndex]?.address ? ` <span class="separator">|</span> آدرس: ${sellers[sellerIndex].address}` : ''}
            </div>
        </div>
        ` : ''}
        
        <!-- خریدار -->
        <div class="party-box buyer ${sellerIndex === '' ? 'wide' : ''}">
            <div class="party-box-label">خریدار</div>
            <div class="party-box-content">
                ${customerIndex !== '' ? `
                    <strong>${customers[customerIndex]?.name || ''}</strong>
                    ${customers[customerIndex]?.phone ? ` <span class="separator">|</span> تلفن: ${toPersianDigits(customers[customerIndex].phone)}` : ''}
                    ${customers[customerIndex]?.nationalId ? ` <span class="separator">|</span> کد ملی: ${toPersianDigits(customers[customerIndex].nationalId)}` : ''}
                    ${customers[customerIndex]?.economicCode ? ` <span class="separator">|</span> کد اقتصادی: ${toPersianDigits(customers[customerIndex].economicCode)}` : ''}
                    ${customers[customerIndex]?.postalCode ? ` <span class="separator">|</span> کد پستی: ${toPersianDigits(customers[customerIndex].postalCode)}` : ''}
                    ${customers[customerIndex]?.accountNumber ? ` <span class="separator">|</span> شماره حساب: ${toPersianDigits(customers[customerIndex].accountNumber)}` : ''}
                    ${customers[customerIndex]?.address ? ` <span class="separator">|</span> آدرس: ${customers[customerIndex].address}` : ''}
                ` : ''}
            </div>
        </div>
        
    </div>
    
    <!-- ========================================
         جدول اقلام فاکتور
         ======================================== -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 40px;">ردیف</th>
                <th style="width: 60px;">تصویر</th>
                <th>شرح کالا | خدمات</th>
                <th style="width: 50px;">واحد</th>
                <th style="width: 50px;">مقدار</th>
                <th style="width: 80px;">قیمت واحد</th>
                <th style="width: 90px;">قیمت کل</th>
            </tr>
        </thead>
        <tbody>
            ${items.map((item, index) => `
                <tr>
                    <td>${toPersianDigits(index + 1)}</td>
                    <td>
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" class="product-image">` : '<div class="no-image">-</div>'}
                    </td>
                    <td class="text-right">
                        <div class="product-name">${item.name}</div>
                        ${item.code ? `<div class="product-code">کد: ${item.code}</div>` : ''}
                    </td>
                    <td>عدد</td>
                    <td>${toPersianDigits(item.qty)}</td>
                    <td>${formatPrice(item.price)}</td>
                    <td>${formatPrice(item.total)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <!-- ========================================
         جمع‌بندی مالی
         ======================================== -->
    <div class="summary-section">
        
        <!-- سمت راست: مبلغ به حروف و توضیحات -->
        <div class="left-section">
            <!-- مبلغ به حروف -->
            <div class="amount-in-words">
                <label>مبلغ به حروف (${currency === 'rial' ? 'ریال' : 'تومان'}) :</label>
                <div class="words-box">
                    ${numberToPersianWords(Math.floor(grandTotal))} ${currency === 'rial' ? 'ریال' : 'تومان'}
                </div>
            </div>
            
            <!-- توضیحات (در صورت وجود) -->
            ${customText ? `
                <div class="terms-section">
                    <h4>توضیحات:</h4>
                    <p>${customText}</p>
                </div>
            ` : ''}
        </div>
        
        <!-- سمت چپ: مبالغ مالی -->
        <div class="financial-summary">
            
            <!-- قیمت کل -->
            <div class="summary-row subtotal">
                <label>قیمت کل :</label>
                <div class="value-box">${formatPrice(subTotal)}</div>
            </div>
            
            <!-- مالیات (در صورت وجود) -->
            ${totalTax > 0 ? `
            <div class="summary-row tax">
                <label>مالیات (${toPersianDigits(taxRate)}%) :</label>
                <div class="value-box">${formatPrice(totalTax.toFixed(0))}</div>
            </div>
            ` : ''}
            
            <!-- تخفیف (در صورت وجود) -->
            ${discount > 0 ? `
            <div class="summary-row discount">
                <label>تخفیف :</label>
                <div class="value-box">${formatPrice(discount.toFixed(0))}</div>
            </div>
            ` : ''}
            
            <!-- مانده از قبل (در صورت وجود) -->
            ${previousDebt > 0 ? `
            <div class="summary-row previous-debt">
                <label>مانده از قبل :</label>
                <div class="value-box">${formatPrice(previousDebt)}</div>
            </div>
            ` : ''}
            
            <!-- مقدار دلخواه (در صورت وجود) -->
            ${customAmount > 0 ? `
            <div class="summary-row custom-amount">
                <label>${customName} :</label>
                <div class="value-box">${formatPrice(customAmount)}</div>
            </div>
            ` : ''}
            
            <!-- پیش‌پرداخت (در صورت وجود) -->
            ${prepaymentAmount > 0 ? `
            <div class="summary-row prepayment">
                <label>${prepaymentName} :</label>
                <div class="value-box">${formatPrice(prepaymentAmount)}</div>
            </div>
            ` : ''}
            
            <!-- قابل پرداخت -->
            <div class="summary-row grand-total">
                <label>قابل پرداخت (${currency === 'rial' ? 'ریال' : 'تومان'}) :</label>
                <div class="value-box">${formatPrice(grandTotal.toFixed(0))}</div>
            </div>
            
        </div>
        
    </div>

    <!-- امضا در زیر قسمت قابل پرداخت -->
    ${signatureSrc ? `
    <div class="signature-below-total">
        <div class="signature-box">
            <div class="signature-label">امضا فروشنده:</div>
            <img src="${signatureSrc}" alt="امضا">
        </div>
    </div>
    ` : ''}
        
</div>

<style>
.invoice-page {
    font-family: 'Shabnam', sans-serif;
    direction: rtl;
    background: white;
    padding: 15px;
    max-width: 1000px;
    margin: 0 auto;
    font-size: 13px;
    line-height: 1.3;
}

.invoice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e5e7eb;
}

.logo-section .logo-box img {
    max-width: 80px;
    max-height: 60px;
}

.title-section h1 {
    font-size: 18px;
    font-weight: bold;
    color: #1f2937;
    margin: 0;
}

.info-section {
    text-align: left;
}

.info-row {
    margin-bottom: 3px;
    font-size: 12px;
}

.info-row label {
    font-weight: bold;
    color: #6b7280;
}

.party-boxes {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.party-box {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
}

/* حالت زمانی که فقط خریدار وجود دارد */
.party-boxes.single-buyer {
    display: block;
}

.party-box.buyer.wide {
    width: 100%;
}

.party-box-label {
    background: #3b82f6;
    color: white;
    padding: 8px;
    font-weight: bold;
    text-align: center;
    font-size: 13px;
}

.party-box-content {
    padding: 10px;
    min-height: 35px;
    font-size: 12px;
}

.separator {
    color: #6b7280;
    margin: 0 3px;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 12px;
}

.items-table th {
    background: #f3f4f6;
    padding: 8px 6px;
    border: 1px solid #e5e7eb;
    font-weight: bold;
}

.items-table td {
    padding: 6px;
    border: 1px solid #e5e7eb;
    text-align: center;
    vertical-align: middle;
}

.text-right {
    text-align: right !important;
}

.product-image {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
}

.no-image {
    color: #9ca3af;
    font-style: italic;
}

.product-name {
    font-weight: 500;
    margin-bottom: 3px;
}

.product-code {
    font-size: 11px;
    color: #6b7280;
}

.summary-section {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
}

.left-section {
    flex: 1;
}

.financial-summary {
    flex: 1;
}

.amount-in-words {
    margin-bottom: 15px;
}

.amount-in-words label {
    font-weight: bold;
    display: block;
    margin-bottom: 5px;
    font-size: 12px;
}

.words-box {
    border: 1px solid #e5e7eb;
    padding: 10px;
    border-radius: 4px;
    background: #f9fafb;
    min-height: 45px;
    font-size: 12px;
}

.terms-section {
    border: 1px solid #ffd54f;
    border-radius: 4px;
    padding: 10px;
    background: #fff9e6;
    font-size: 12px;
}

.terms-section h4 {
    margin: 0 0 5px 0;
    font-size: 12px;
    font-weight: bold;
}

.terms-section p {
    margin: 0;
    font-size: 11px;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.summary-row label {
    font-weight: bold;
    font-size: 12px;
}

.value-box {
    background: #f9fafb;
    padding: 5px 8px;
    border-radius: 3px;
    min-width: 120px;
    text-align: left;
    border: 1px solid #e5e7eb;
    font-size: 11px;
}

.summary-row.grand-total {
    border-top: 1px solid #e5e7eb;
    margin-top: 8px;
    padding-top: 10px;
}

.summary-row.grand-total .value-box {
    background: #3b82f6;
    color: white;
    font-weight: bold;
}

/* استایل امضا در زیر قسمت قابل پرداخت */
.signature-below-total {
    text-align: left;
    margin: 15px 0 0 0;
    padding-top: 15px;
    border-top: 1px dashed #e5e7eb;
}

.signature-box {
    display: inline-block;
    text-align: center;
}

.signature-label {
    font-weight: bold;
    margin-bottom: 5px;
    color: #6b7280;
    font-size: 12px;
}

.signature-box img {
    max-width: 120px;
    max-height: 150px;
}
</style>
`;

    document.getElementById('previewContent').innerHTML = previewContent;
    document.getElementById('invoicePreview').classList.remove('hidden');
    document.getElementById('savedInvoices').classList.add('hidden');
    
    showNotification('فاکتور با موفقیت تولید شد.', 'success');
}

function generateImage() {
    const invoicePreview = document.getElementById('invoicePreview');
    html2canvas(invoicePreview, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `invoice-${document.getElementById('invoiceNumber').value || 'preview'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showNotification('تصویر فاکتور با موفقیت دانلود شد.', 'success');
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
        signature: document.getElementById('includeSignature').checked ? invoiceSignature : null,
        currency: document.getElementById('currency').value,
        createdAt: new persianDate().format('YYYY/MM/DD HH:mm:ss')
    };
    
    let savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    savedInvoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(savedInvoices));
    
    // اگر مشتری انتخاب شده بود، محاسبات حسابداری را به‌روز کن
    if (invoice.customerIndex !== '') {
        calculateCustomerPurchases(invoice.customerIndex);
    }
    
    showNotification('فاکتور با موفقیت ذخیره شد.', 'success');
}

function loadInvoices() {
    const savedInvoicesList = document.getElementById('savedInvoicesList');
    savedInvoicesList.innerHTML = '';
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    
    if (savedInvoices.length === 0) {
        savedInvoicesList.innerHTML = '<div class="text-center py-8 text-gray-500">هیچ فاکتوری ذخیره نشده است.</div>';
        document.getElementById('savedInvoices').classList.remove('hidden');
        return;
    }
    
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
    document.getElementById('currency').value = invoice.currency || 'rial';
    
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
        showNotification('فاکتور با موفقیت حذف شد.', 'success');
    }
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    loadSellers();
    loadCustomers();
    loadProducts();
});

// تابع چاپ فاکتور
function printInvoice() {
    const invoicePreview = document.getElementById('invoicePreview');
    
    if (!invoicePreview || invoicePreview.classList.contains('hidden')) {
        showNotification('لطفاً ابتدا فاکتور را تولید کنید.', 'error');
        return;
    }
    
    // ذخیره محتوای اصلی
    const originalContent = document.getElementById('previewContent').innerHTML;
    
    // ایجاد پنجره چاپ
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    
    // محتوای چاپ
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>چاپ فاکتور</title>
            <style>
			@font-face {
    font-family: "Shabnam";
    src: url("https://cdn.fontcdn.ir/Fonts/Shabnam/a074a415cfe0e4f57e2ede996a73d0e509c0ea194c9678c7b87c65fb977907e7.woff2") format("woff2");
    font-weight: 100;
    font-style: normal;
}

@font-face {
    font-family: "Shabnam";
    src: url("https://cdn.fontcdn.ir/Fonts/Shabnam/87cf5dde711a284c1e25dd414d51a571b7c9aedd91b2b96f9d679869f5d65162.woff2") format("woff2");
    font-weight: 300;
    font-style: normal;
}

@font-face {
    font-family: "Shabnam";
    src: url("https://cdn.fontcdn.ir/Fonts/Shabnam/540d3f4e172bd6b5c70dd06bce57e055ce59270e95ea642b414fe0709faaa085.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
}

@font-face {
    font-family: "Shabnam";
    src: url("https://cdn.fontcdn.ir/Fonts/Shabnam/fd5931f57e84baad81cc7243cfc1c83e5ac7f5dd17818d917765063544a54441.woff2") format("woff2");
    font-weight: 500;
    font-style: normal;
}

@font-face {
    font-family: "Shabnam";
    src: url("https://cdn.fontcdn.ir/Fonts/Shabnam/1ff187f5320ec4527ebb6a71831b88289a6cb18ca33ac34476b96960f0af7282.woff2") format("woff2");
    font-weight: 700;
    font-style: normal;
}
                body {
                    font-family: 'Shabnam', Tahoma, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: black;
                    direction: rtl;
                }
                .print-container {
                    max-width: 1000px;
                    margin: 0 auto;
                    background: white;
                }
                .invoice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #e5e7eb;
                }
                .logo-section .logo-box img {
                    max-width: 120px;
                    max-height: 80px;
                }
                .title-section h1 {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1f2937;
                    margin: 0;
                }
                .info-section {
                    text-align: left;
                }
                .info-row {
                    margin-bottom: 5px;
                }
                .info-row label {
                    font-weight: bold;
                    color: #6b7280;
                }
                .party-boxes {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .party-box {
                    flex: 1;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .party-box-label {
                    background: #3b82f6;
                    color: white;
                    padding: 10px;
                    font-weight: bold;
                    text-align: center;
                }
                .party-box-content {
                    padding: 15px;
                    min-height: 100px;
                }
                .separator {
                    color: #6b7280;
                    margin: 0 5px;
                }
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                .items-table th {
                    background: #f3f4f6;
                    padding: 12px 8px;
                    border: 1px solid #e5e7eb;
                    font-weight: bold;
                }
                .items-table td {
                    padding: 10px 8px;
                    border: 1px solid #e5e7eb;
                    text-align: center;
                }
                .text-right {
                    text-align: right !important;
                }
                .product-name {
                    font-weight: 500;
                }
                .summary-section {
                    display: flex;
                    gap: 30px;
                    margin-bottom: 30px;
                }
                .amount-in-words {
                    flex: 1;
                }
                .amount-in-words label {
                    font-weight: bold;
                    display: block;
                    margin-bottom: 8px;
                }
                .words-box {
                    border: 1px solid #e5e7eb;
                    padding: 15px;
                    border-radius: 6px;
                    background: #f9fafb;
                    min-height: 60px;
                }
                .financial-summary {
                    flex: 1;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .summary-row label {
                    font-weight: bold;
                }
                .value-box {
                    background: #f9fafb;
                    padding: 8px 12px;
                    border-radius: 4px;
                    min-width: 150px;
                    text-align: left;
                    border: 1px solid #e5e7eb;
                }
                .summary-row.grand-total {
                    border-top: 2px solid #e5e7eb;
                    margin-top: 10px;
                    padding-top: 15px;
                }
                .summary-row.grand-total .value-box {
                    background: #3b82f6;
                    color: white;
                    font-weight: bold;
                }
                .signature-section {
                    text-align: left;
                    margin-top: 30px;
                }
                .signature-box img {
                    max-width: 150px;
                    max-height: 80px;
                }
                .terms-section {
                    border: 1px solid #ffd54f;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                    background: #fff9e6;
                }
                .terms-section h4 {
                    margin: 0 0 10px 0;
                    font-size: 16px;
                }
                @media print {
                    body { 
                        margin: 0; 
                        padding: 15px;
                    }
                    .print-container {
                        box-shadow: none;
                    }
                    .no-print { 
                        display: none !important; 
                    }
                }
                @page {
                    size: A4;
                    margin: 10mm;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                ${originalContent}
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px; padding: 20px; border-top: 1px solid #ccc;">
                <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    چاپ فاکتور
                </button>
                <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 5px;">
                    بستن
                </button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // نمایش پیام موفقیت
    showNotification('پنجره چاپ باز شد. لطفاً از دکمه‌های موجود در صفحه برای چاپ استفاده کنید.', 'success');
}

// تابع چاپ مستقیم (بدون باز کردن پنجره جدید)
function directPrintInvoice() {
    const invoicePreview = document.getElementById('invoicePreview');
    
    if (!invoicePreview || invoicePreview.classList.contains('hidden')) {
        showNotification('لطفاً ابتدا فاکتور را تولید کنید.', 'error');
        return;
    }
    
    // ذخیره محتوای اصلی
    const originalContent = document.getElementById('previewContent').innerHTML;
    
    // ایجاد یک div موقت برای چاپ
    const printContent = `
        <div class="print-container" style="font-family: 'Shabnam', Tahoma, sans-serif; direction: rtl; background: white; padding: 20px;">
            ${originalContent}
        </div>
    `;
    
    // ایجاد پنجره چاپ
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="fa">
        <head>
            <meta charset="UTF-8">
            <title>چاپ فاکتور</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: 'Shabnam', Tahoma, sans-serif;
                    direction: rtl;
                }
                @media print {
                    body { margin: 0; }
                }
                @page {
                    size: A4;
                    margin: 10mm;
                }
            </style>
        </head>
        <body>
            ${printContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}