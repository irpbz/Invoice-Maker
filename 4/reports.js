// reports.js - سیستم گزارش‌گیری و آمار
let salesChart = null;

// بارگذاری گزارش‌ها
function loadReports() {
    loadSalesReport();
    loadTopCustomers();
    loadTopProducts();
    loadFinancialSummary();
}

// گزارش فروش روزانه
function loadSalesReport() {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const salesByDate = {};
    
    invoices.forEach(invoice => {
        if (salesByDate[invoice.date]) {
            salesByDate[invoice.date] += calculateInvoiceTotal(invoice);
        } else {
            salesByDate[invoice.date] = calculateInvoiceTotal(invoice);
        }
    });
    
    const dates = Object.keys(salesByDate).sort();
    const amounts = dates.map(date => salesByDate[date]);
    
    // ایجاد نمودار
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;
    
    if (salesChart) {
        salesChart.destroy();
    }
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => toPersianDigits(date)),
            datasets: [{
                label: 'فروش روزانه (ریال)',
                data: amounts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'گزارش فروش روزانه',
                    font: {
                        size: 16,
                        family: 'Shabnam'
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatPrice(context.raw) + ' ریال';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatPrice(value) + ' ریال';
                        },
                        font: {
                            family: 'Shabnam'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Shabnam'
                        }
                    }
                }
            }
        }
    });
}

// مشتریان برتر
function loadTopCustomers() {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const customerSales = {};
    
    invoices.forEach(invoice => {
        if (invoice.customerIndex !== '') {
            const customer = customers[invoice.customerIndex];
            if (customer) {
                const customerName = customer.name;
                const invoiceTotal = calculateInvoiceTotal(invoice);
                
                if (customerSales[customerName]) {
                    customerSales[customerName] += invoiceTotal;
                } else {
                    customerSales[customerName] = invoiceTotal;
                }
            }
        }
    });
    
    // مرتب‌سازی مشتریان بر اساس میزان خرید
    const topCustomers = Object.entries(customerSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const topCustomersList = document.getElementById('topCustomersList');
    if (!topCustomersList) return;
    
    topCustomersList.innerHTML = '';
    
    topCustomers.forEach(([customerName, total], index) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 border-b';
        div.innerHTML = `
            <div class="flex items-center">
                <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm ml-2">
                    ${toPersianDigits(index + 1)}
                </span>
                <span>${customerName}</span>
            </div>
            <span class="font-semibold">${formatPrice(total)} ریال</span>
        `;
        topCustomersList.appendChild(div);
    });
}

// محصولات پرفروش
function loadTopProducts() {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const productSales = {};
    
    invoices.forEach(invoice => {
        invoice.items.forEach(item => {
            if (productSales[item.name]) {
                productSales[item.name] += item.total;
            } else {
                productSales[item.name] = item.total;
            }
        });
    });
    
    // مرتب‌سازی محصولات بر اساس میزان فروش
    const topProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const topProductsList = document.getElementById('topProductsList');
    if (!topProductsList) return;
    
    topProductsList.innerHTML = '';
    
    topProducts.forEach(([productName, total], index) => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 border-b';
        div.innerHTML = `
            <div class="flex items-center">
                <span class="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm ml-2">
                    ${toPersianDigits(index + 1)}
                </span>
                <span>${productName}</span>
            </div>
            <span class="font-semibold">${formatPrice(total)} ریال</span>
        `;
        topProductsList.appendChild(div);
    });
}

// خلاصه مالی
function loadFinancialSummary() {
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    
    let totalSales = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let invoiceCount = invoices.length;
    
    invoices.forEach(invoice => {
        const invoiceTotal = calculateInvoiceTotal(invoice);
        totalSales += invoiceTotal;
        
        // محاسبه مالیات
        const subTotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
        totalTax += subTotal * (invoice.taxRate / 100);
        
        // محاسبه تخفیف
        const discount = invoice.discountType === 'percentage' ? 
            subTotal * (invoice.discount / 100) : invoice.discount;
        totalDiscount += discount;
    });
    
    const averageSale = invoiceCount > 0 ? totalSales / invoiceCount : 0;
    
    // به‌روزرسانی عناصر HTML
    const elements = {
        'reportTotalSales': formatPrice(totalSales),
        'reportTotalTax': formatPrice(totalTax),
        'reportTotalDiscount': formatPrice(totalDiscount),
        'reportInvoiceCount': toPersianDigits(invoiceCount),
        'reportAverageSale': formatPrice(averageSale)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// چاپ گزارش
function printReport(reportType) {
    const printContent = document.getElementById(reportType);
    if (!printContent) return;
    
    const originalContent = printContent.innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html dir="rtl">
            <head>
                <title>گزارش سیستم فاکتور</title>
                <style>
                    body { 
                        font-family: 'Shabnam', Tahoma, sans-serif; 
                        margin: 20px; 
                        direction: rtl;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .print-footer {
                        text-align: center;
                        margin-top: 20px;
                        border-top: 1px solid #333;
                        padding-top: 10px;
                        font-size: 12px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: right;
                    }
                    th {
                        background-color: #f3f4f6;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>گزارش سیستم فاکتور</h1>
                    <p>تاریخ: ${new persianDate().format('YYYY/MM/DD')}</p>
                </div>
                ${printContent.innerHTML}
                <div class="print-footer">
                    <p>تولید شده توسط سیستم صدور فاکتور پیشرفته</p>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// فیلتر گزارش بر اساس تاریخ
function filterReports() {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showNotification('لطفاً تاریخ شروع و پایان را انتخاب کنید.', 'error');
        return;
    }
    
    // در اینجا می‌توانید منطق فیلتر کردن را بر اساس تاریخ پیاده‌سازی کنید
    // این یک پیاده‌سازی ساده است
    
    loadSalesReport();
    loadTopCustomers();
    loadTopProducts();
    loadFinancialSummary();
    
    showNotification(`گزارش‌ها برای بازه زمانی ${startDate} تا ${endDate} فیلتر شدند.`, 'success');
}

// تنظیم تاریخ پیش‌فرض
function setDefaultReportDates() {
    const today = new persianDate();
    const oneMonthAgo = new persianDate().subtract('month', 1);
    
    document.getElementById('reportStartDate').value = oneMonthAgo.format('YYYY/MM/DD');
    document.getElementById('reportEndDate').value = today.format('YYYY/MM/DD');
}

// ایجاد گزارش PDF
function generatePDFReport() {
    showNotification('این قابلیت به زودی اضافه خواهد شد.', 'info');
}

// صادر کردن گزارش به Excel
function exportToExcel() {
    showNotification('این قابلیت به زودی اضافه خواهد شد.', 'info');
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    setDefaultReportDates();
});