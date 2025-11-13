// invoiceManagement.js - مدیریت و نمایش فاکتورها
let allInvoices = [];

// بارگذاری تمام فاکتورها
function loadAllInvoices() {
    allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    displayInvoices(allInvoices);
    updateInvoiceStats();
}

// نمایش فاکتورها با فیلتر
// تابع بهبود یافته برای نمایش فاکتورها
function displayInvoices(invoicesToShow) {
    const invoiceManagementList = document.getElementById('invoiceManagementList');
    invoiceManagementList.innerHTML = '';
    
    if (invoicesToShow.length === 0) {
        invoiceManagementList.innerHTML = `
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-search text-4xl mb-4 text-gray-300"></i>
                <p class="text-lg">هیچ فاکتوری مطابق با جستجوی شما یافت نشد</p>
                <p class="text-sm mt-2">لطفاً فیلترهای جستجو را تغییر دهید</p>
            </div>
        `;
        return;
    }
    
    // مرتب‌سازی فاکتورها بر اساس تاریخ (جدیدترین اول)
    const sortedInvoices = invoicesToShow.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedInvoices.forEach((invoice, index) => {
        const invoiceTotal = calculateInvoiceTotal(invoice);
        const customerName = invoice.customerIndex !== '' ? 
            customers[invoice.customerIndex]?.name : 'بدون مشتری';
        const sellerName = invoice.sellerIndex !== '' ? 
            sellers[invoice.sellerIndex]?.name : invoice.invoiceTitle;
        
        // بررسی وضعیت مشتری (ووکامرس یا محلی)
        const customer = invoice.customerIndex !== '' ? customers[invoice.customerIndex] : null;
        const customerBadge = customer?.source === 'woocommerce' ? 
            '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mr-2">🛒</span>' : '';
        
        const div = document.createElement('div');
        div.className = 'border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition cursor-pointer transform hover:-translate-y-1';
        div.onclick = () => viewInvoiceFromManagement(index);
        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <div class="flex items-center mb-2">
                        <h3 class="font-semibold text-lg text-gray-800">${invoice.type} ${invoice.number ? 'شماره ' + toPersianDigits(invoice.number) : ''}</h3>
                        ${customerBadge}
                    </div>
                    <p class="text-gray-600">${sellerName}</p>
                </div>
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-semibold">
                    ${formatPrice(invoiceTotal)} ریال
                </span>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div class="flex items-center">
                    <i class="fas fa-calendar text-gray-400 ml-2"></i>
                    <span class="text-gray-500">تاریخ:</span>
                    <span class="mr-2 font-medium">${invoice.date}</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-user text-gray-400 ml-2"></i>
                    <span class="text-gray-500">مشتری:</span>
                    <span class="mr-2 font-medium truncate">${customerName}</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-cube text-gray-400 ml-2"></i>
                    <span class="text-gray-500">آیتم‌ها:</span>
                    <span class="mr-2 font-medium">${toPersianDigits(invoice.items.length)}</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-check-circle text-green-400 ml-2"></i>
                    <span class="text-gray-500">وضعیت:</span>
                    <span class="mr-2 font-medium text-green-600">پرداخت شده</span>
                </div>
            </div>
            
            <div class="flex justify-between items-center pt-3 border-t">
                <div class="flex gap-2">
                    <button onclick="event.stopPropagation(); printInvoiceFromManagement(${index})" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition flex items-center">
                        <i class="fas fa-print ml-1"></i> چاپ
                    </button>
                    <button onclick="event.stopPropagation(); editInvoiceFromManagement(${index})" 
                            class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm transition flex items-center">
                        <i class="fas fa-edit ml-1"></i> ویرایش
                    </button>
                    <button onclick="event.stopPropagation(); deleteInvoiceFromManagement(${index})" 
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition flex items-center">
                        <i class="fas fa-trash ml-1"></i> حذف
                    </button>
                </div>
                <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ${toPersianDigits(index + 1)}
                </span>
            </div>
        `;
        invoiceManagementList.appendChild(div);
    });
}

// مشاهده فاکتور از مدیریت
function viewInvoiceFromManagement(index) {
    const invoice = allInvoices[index];
    generateInvoicePreview(invoice);
    document.getElementById('invoiceManagementPreview').classList.remove('hidden');
}

// ویرایش فاکتور از مدیریت
function editInvoiceFromManagement(index) {
    viewInvoice(index);
    openTab('invoiceTab');
}

// حذف فاکتور از مدیریت
function deleteInvoiceFromManagement(index) {
    if (confirm('آیا از حذف این فاکتور اطمینان دارید؟')) {
        allInvoices.splice(index, 1);
        localStorage.setItem('invoices', JSON.stringify(allInvoices));
        loadAllInvoices();
        showNotification('فاکتور با موفقیت حذف شد.', 'success');
    }
}

// چاپ فاکتور از مدیریت - استفاده از همان فرمت بخش صدور فاکتور
function printInvoiceFromManagement(index) {
    const invoice = allInvoices[index];
    
    // ذخیره موقت مقادیر فعلی
    const tempItems = [...items];
    const tempInvoiceLogo = invoiceLogo;
    const tempInvoiceSignature = invoiceSignature;
    
    // تنظیم مقادیر برای چاپ
    items = [...invoice.items];
    invoiceLogo = invoice.logo;
    invoiceSignature = invoice.signature;
    
    // تنظیم مقادیر فرم برای generateInvoice
    document.getElementById('invoiceDate').value = invoice.date;
    document.getElementById('invoiceNumber').value = invoice.number;
    document.getElementById('invoiceType').value = invoice.type;
    document.getElementById('sellerSelectInvoice').value = invoice.sellerIndex;
    document.getElementById('invoiceTitle').value = invoice.invoiceTitle;
    document.getElementById('customerIndex').value = invoice.customerIndex;
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
    document.getElementById('includeSignature').checked = !!invoice.signature;
    
    // تولید فاکتور
    generateInvoice();
    
    // کمی تأخیر برای اطمینان از تولید فاکتور
    setTimeout(() => {
        // چاپ فاکتور
        printInvoice();
        
        // بازگرداندن مقادیر قبلی
        items = tempItems;
        invoiceLogo = tempInvoiceLogo;
        invoiceSignature = tempInvoiceSignature;
        
        // به‌روزرسانی جدول
        updateTable();
    }, 500);
}

// چاپ فاکتور - استفاده از همان تابع بخش صدور فاکتور
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
    
    // محتوای چاپ - استفاده از همان استایل بخش صدور فاکتور
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

                @media print {
                    body { 
                        margin: 0; 
                        padding: 10px;
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
            <div class="invoice-page">
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

// جستجوی فاکتورها
// تابع بهبود یافته جستجوی فاکتورها
function searchInvoices() {
    const query = document.getElementById('invoiceSearchInput').value.toLowerCase();
    const customerFilter = document.getElementById('invoiceCustomerFilter').value;
    const dateFilter = document.getElementById('invoiceDateFilter').value;
    const typeFilter = document.getElementById('invoiceTypeFilter').value;
    const amountFilter = document.getElementById('invoiceAmountFilter').value;
    
    let filteredInvoices = allInvoices.filter(invoice => {
        // جستجو در متن با الگوریتم پیشرفته
        const textMatch = 
            invoice.number?.toString().includes(query) ||
            invoice.type.toLowerCase().includes(query) ||
            (invoice.invoiceTitle && invoice.invoiceTitle.toLowerCase().includes(query)) ||
            (invoice.customerIndex !== '' && customers[invoice.customerIndex]?.name.toLowerCase().includes(query)) ||
            (invoice.sellerIndex !== '' && sellers[invoice.sellerIndex]?.name.toLowerCase().includes(query)) ||
            // جستجو در آیتم‌های فاکتور
            invoice.items.some(item => 
                item.name.toLowerCase().includes(query) || 
                (item.code && item.code.toLowerCase().includes(query))
            ) ||
            // جستجو در توضیحات
            (invoice.customText && invoice.customText.toLowerCase().includes(query));
        
        // فیلتر مشتری
        const customerMatch = customerFilter === '' || invoice.customerIndex == customerFilter;
        
        // فیلتر تاریخ
        const dateMatch = dateFilter === '' || invoice.date === dateFilter;
        
        // فیلتر نوع
        const typeMatch = typeFilter === '' || invoice.type === typeFilter;
        
        // فیلتر مبلغ
        const amountMatch = checkAmountFilter(invoice, amountFilter);
        
        return textMatch && customerMatch && dateMatch && typeMatch && amountMatch;
    });updateSearchStats
    
    displayInvoices(filteredInvoices);
    updateSearchStats(filteredInvoices.length);
}

// تابع بررسی فیلتر مبلغ
function checkAmountFilter(invoice, amountFilter) {
    if (amountFilter === '') return true;
    
    const invoiceTotal = calculateInvoiceTotal(invoice);
    
    switch(amountFilter) {
        case '0-100000':
            return invoiceTotal <= 100000;
        case '100000-500000':
            return invoiceTotal > 100000 && invoiceTotal <= 500000;
        case '500000-1000000':
            return invoiceTotal > 500000 && invoiceTotal <= 1000000;
        case '1000000+':
            return invoiceTotal > 1000000;
        default:
            return true;
    }
}

// تابع به‌روزرسانی آمار جستجو
function updateSearchStats(resultsCount) {
    const searchStats = document.getElementById('searchStats');
    if (!searchStats) {
        // ایجاد عنصر آمار جستجو
        const statsElement = document.createElement('div');
        statsElement.id = 'searchStats';
        statsElement.className = 'mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200';
        
        const filterContainer = document.querySelector('.bg-white.p-4.rounded-lg.shadow.mb-6');
        filterContainer.appendChild(statsElement);
    }
    
    document.getElementById('searchStats').innerHTML = `
        <div class="flex justify-between items-center text-sm">
            <div>
                <span class="text-blue-600 font-semibold">${toPersianDigits(resultsCount)}</span>
                فاکتور از مجموع 
                <span class="text-blue-600 font-semibold">${toPersianDigits(allInvoices.length)}</span>
                فاکتور یافت شد
            </div>
            ${resultsCount === 0 ? '<span class="text-red-500">نتیجه‌ای یافت نشد</span>' : ''}
        </div>
    `;
}

// به‌روزرسانی آمار فاکتورها
function updateInvoiceStats() {
    const totalInvoices = allInvoices.length;
    const totalRevenue = allInvoices.reduce((sum, invoice) => sum + calculateInvoiceTotal(invoice), 0);
    const today = new persianDate().format('YYYY/MM/DD');
    const todayInvoices = allInvoices.filter(invoice => invoice.date === today).length;
    const todayRevenue = allInvoices
        .filter(invoice => invoice.date === today)
        .reduce((sum, invoice) => sum + calculateInvoiceTotal(invoice), 0);
    
    document.getElementById('totalInvoicesCount').textContent = toPersianDigits(totalInvoices);
    document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
    document.getElementById('todayInvoicesCount').textContent = toPersianDigits(todayInvoices);
    document.getElementById('todayRevenue').textContent = formatPrice(todayRevenue);
}

// پیش‌نمایش فاکتور
function generateInvoicePreview(invoice) {
    const previewContent = document.getElementById('invoiceManagementPreviewContent');
    
    const invoiceTotal = calculateInvoiceTotal(invoice);
    const customerName = invoice.customerIndex !== '' ? 
        customers[invoice.customerIndex]?.name : 'بدون مشتری';
    const sellerName = invoice.sellerIndex !== '' ? 
        sellers[invoice.sellerIndex]?.name : invoice.invoiceTitle;
    
    previewContent.innerHTML = `
        <div class="bg-white p-6 rounded-lg">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">پیش‌نمایش فاکتور</h3>
                <button onclick="closeInvoicePreview()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="border p-4 rounded mb-4">
                <h4 class="font-semibold text-lg mb-2">${invoice.type} ${invoice.number ? 'شماره ' + toPersianDigits(invoice.number) : ''}</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><span class="text-gray-500">تاریخ:</span> ${invoice.date}</div>
                    <div><span class="text-gray-500">فروشنده:</span> ${sellerName}</div>
                    <div><span class="text-gray-500">مشتری:</span> ${customerName}</div>
                    <div><span class="text-gray-500">تعداد آیتم:</span> ${toPersianDigits(invoice.items.length)}</div>
                </div>
                <div class="mt-2">
                    <span class="font-bold text-blue-600">مجموع: ${formatPrice(invoiceTotal)} ریال</span>
                </div>
            </div>
            
            <div class="border rounded overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="p-2 border">ردیف</th>
                            <th class="p-2 border">شرح</th>
                            <th class="p-2 border">تعداد</th>
                            <th class="p-2 border">قیمت واحد</th>
                            <th class="p-2 border">جمع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map((item, index) => `
                            <tr class="border-t">
                                <td class="p-2 border text-center">${toPersianDigits(index + 1)}</td>
                                <td class="p-2 border">${item.name}</td>
                                <td class="p-2 border text-center">${toPersianDigits(item.qty)}</td>
                                <td class="p-2 border text-left">${formatPrice(item.price)}</td>
                                <td class="p-2 border text-left">${formatPrice(item.total)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="mt-4 flex justify-end gap-2">
                <button onclick="printInvoiceFromManagement(${allInvoices.indexOf(invoice)})" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
                    <i class="fas fa-print ml-1"></i> چاپ فاکتور
                </button>
                <button onclick="closeInvoicePreview()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
                    بستن
                </button>
            </div>
        </div>
    `;
}

// بستن پیش‌نمایش
function closeInvoicePreview() {
    document.getElementById('invoiceManagementPreview').classList.add('hidden');
}

// تنظیم تاریخ پیش‌فرض برای فیلترها
function setDefaultFilterDates() {
    const today = new persianDate().format('YYYY/MM/DD');
    const dateFilter = document.getElementById('invoiceDateFilter');
    if (dateFilter) {
        dateFilter.value = today;
    }
}

// بارگذاری فیلترهای مشتری
// تابع بهبود یافته برای بارگذاری فیلترها
function loadInvoiceFilters() {
    const customerFilter = document.getElementById('invoiceCustomerFilter');
    if (!customerFilter) return;
    
    customerFilter.innerHTML = '<option value="">همه مشتریان</option>';
    
    // فقط مشتریانی که فاکتور دارند
    const customersWithInvoices = [...new Set(allInvoices
        .filter(inv => inv.customerIndex !== '')
        .map(inv => inv.customerIndex))];
    
    customersWithInvoices.forEach(customerIndex => {
        const customer = customers[customerIndex];
        if (customer) {
            const woocommerceBadge = customer.source === 'woocommerce' ? ' 🛒' : '';
            customerFilter.innerHTML += `<option value="${customerIndex}">${customer.name}${woocommerceBadge}</option>`;
        }
    });
    
    // افزودن فیلتر مبلغ
    addAmountFilter();
}

// تابع افزودن فیلتر مبلغ
function addAmountFilter() {
    const filterContainer = document.querySelector('.bg-white.p-4.rounded-lg.shadow.mb-6 .grid');
    if (!filterContainer) return;
    
    // بررسی وجود فیلتر مبلغ
    if (!document.getElementById('invoiceAmountFilter')) {
        const amountFilterHtml = `
            <div>
                <label class="block text-gray-700 mb-2 text-sm">محدوده مبلغ</label>
                <select id="invoiceAmountFilter" onchange="searchInvoices()"
                        class="w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                    <option value="">همه مقادیر</option>
                    <option value="0-100000">تا ۱۰۰,۰۰۰ ریال</option>
                    <option value="100000-500000">۱۰۰,۰۰۰ تا ۵۰۰,۰۰۰ ریال</option>
                    <option value="500000-1000000">۵۰۰,۰۰۰ تا ۱,۰۰۰,۰۰۰ ریال</option>
                    <option value="1000000+">بیش از ۱,۰۰۰,۰۰۰ ریال</option>
                </select>
            </div>
        `;
        
        // افزودن فیلتر مبلغ به انتهای فیلترها
        filterContainer.innerHTML += amountFilterHtml;
    }
}

// تابع جستجوی سریع
function quickSearch(type) {
    const searchInput = document.getElementById('invoiceSearchInput');
    
    switch(type) {
        case 'woocommerce':
            searchInput.value = 'ووکامرس';
            break;
        case 'today':
            searchInput.value = new persianDate().format('YYYY/MM/DD');
            break;
        case 'highAmount':
            document.getElementById('invoiceAmountFilter').value = '1000000+';
            searchInput.value = '';
            break;
        default:
            searchInput.value = '';
    }
    
    searchInvoices();
}

// افزودن دکمه‌های جستجوی سریع به HTML
function addQuickSearchButtons() {
    const filterContainer = document.querySelector('.bg-white.p-4.rounded-lg.shadow.mb-6');
    if (!filterContainer || document.getElementById('quickSearchButtons')) return;
    
    const quickSearchHtml = `
        <div id="quickSearchButtons" class="mt-4 pt-4 border-t">
            <label class="block text-gray-700 mb-2 text-sm">جستجوی سریع:</label>
            <div class="flex flex-wrap gap-2">
                <button onclick="quickSearch('woocommerce')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition">
                    <i class="fas fa-store ml-1"></i> فاکتورهای ووکامرس
                </button>
                <button onclick="quickSearch('today')" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition">
                    <i class="fas fa-calendar-day ml-1"></i> فاکتورهای امروز
                </button>
                <button onclick="quickSearch('highAmount')" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition">
                    <i class="fas fa-money-bill-wave ml-1"></i> فاکتورهای با مبلغ بالا
                </button>
                <button onclick="resetSearch()" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition">
                    <i class="fas fa-redo ml-1"></i> بازنشانی جستجو
                </button>
            </div>
        </div>
    `;
    
    filterContainer.innerHTML += quickSearchHtml;
}

// تابع بازنشانی جستجو
function resetSearch() {
    document.getElementById('invoiceSearchInput').value = '';
    document.getElementById('invoiceCustomerFilter').value = '';
    document.getElementById('invoiceDateFilter').value = '';
    document.getElementById('invoiceTypeFilter').value = '';
    document.getElementById('invoiceAmountFilter').value = '';
    
    loadAllInvoices();
}

// بارگذاری اولیه بهبود یافته
document.addEventListener('DOMContentLoaded', function() {
    loadInvoiceFilters();
    setDefaultFilterDates();
    addQuickSearchButtons();
});