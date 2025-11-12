// utils.js - توابع کمکی سیستم
// تبدیل ارقام به فارسی
function toPersianDigits(num) {
    if (num === null || num === undefined) return '';
    
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// فرمت کردن قیمت با جداکننده سه‌تایی
function formatPrice(amount) {
    if (amount === null || amount === undefined) return '۰';
    
    // تبدیل به عدد در صورت رشته بودن
    amount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    amount = Math.floor(amount);
    
    // فرمت کردن با جداکننده هزارگان
    let formatted = amount.toLocaleString('fa-IR');
    
    // اطمینان از استفاده از جداکننده فارسی
    formatted = formatted.replace(/,/g, '،');
    
    return formatted;
}

// تبدیل عدد به حروف فارسی
function numberToPersianWords(num) {
    if (num === 0) return 'صفر';
    if (num > 999999999999) return 'عدد بسیار بزرگ';
    
    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const scales = ['', 'هزار', 'میلیون', 'میلیارد'];
    
    function convertThreeDigit(n) {
        let result = '';
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;
        const ten = Math.floor(remainder / 10);
        const unit = remainder % 10;
        
        if (hundred > 0) {
            result += hundreds[hundred];
            if (remainder > 0) result += ' و ';
        }
        
        if (remainder > 0) {
            if (ten === 1) {
                result += teens[unit];
            } else {
                if (ten > 1) {
                    result += tens[ten];
                    if (unit > 0) result += ' و ';
                }
                if (unit > 0 && ten !== 1) {
                    result += units[unit];
                }
            }
        }
        
        return result;
    }
    
    let result = '';
    let scaleIndex = 0;
    
    while (num > 0) {
        const chunk = num % 1000;
        if (chunk !== 0) {
            let chunkText = convertThreeDigit(chunk);
            if (scaleIndex > 0) {
                chunkText += ' ' + scales[scaleIndex];
            }
            if (result !== '') {
                result = chunkText + ' و ' + result;
            } else {
                result = chunkText;
            }
        }
        num = Math.floor(num / 1000);
        scaleIndex++;
    }
    
    return result;
}

// اعتبارسنجی شماره ملی
function validateNationalId(nationalId) {
    if (!nationalId) return false;
    
    // حذف فاصله و خط تیره
    nationalId = nationalId.toString().replace(/[\s-]/g, '');
    
    // بررسی طول
    if (nationalId.length !== 10) return false;
    
    // بررسی اینکه تمام ارقام هستند
    if (!/^\d+$/.test(nationalId)) return false;
    
    // الگوریتم اعتبارسنجی شماره ملی
    const check = parseInt(nationalId[9]);
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
        sum += parseInt(nationalId[i]) * (10 - i);
    }
    
    const remainder = sum % 11;
    
    return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
}

// اعتبارسنجی کد اقتصادی
function validateEconomicCode(economicCode) {
    if (!economicCode) return false;
    
    // حذف فاصله و خط تیره
    economicCode = economicCode.toString().replace(/[\s-]/g, '');
    
    // بررسی طول
    if (economicCode.length !== 12) return false;
    
    // بررسی اینکه تمام ارقام هستند
    if (!/^\d+$/.test(economicCode)) return false;
    
    return true;
}

// اعتبارسنجی کد پستی
function validatePostalCode(postalCode) {
    if (!postalCode) return false;
    
    // حذف فاصله و خط تیره
    postalCode = postalCode.toString().replace(/[\s-]/g, '');
    
    // بررسی طول
    if (postalCode.length !== 10) return false;
    
    // بررسی اینکه تمام ارقام هستند
    if (!/^\d+$/.test(postalCode)) return false;
    
    return true;
}

// اعتبارسنجی شماره تلفن
function validatePhoneNumber(phone) {
    if (!phone) return false;
    
    // حذف فاصله و خط تیره
    phone = phone.toString().replace(/[\s-]/g, '');
    
    // الگوی شماره تلفن ایران
    const pattern = /^(0|\\+98|98)?9\d{9}$/;
    
    return pattern.test(phone);
}

// فرمت کردن شماره تلفن
function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // حذف فاصله و خط تیره
    phone = phone.toString().replace(/[\s-]/g, '');
    
    // اگر با 0 شروع می‌شود
    if (phone.startsWith('0')) {
        return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    // اگر با 98 شروع می‌شود
    else if (phone.startsWith('98')) {
        phone = '0' + phone.substring(2);
        return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    // اگر با +98 شروع می‌شود
    else if (phone.startsWith('+98')) {
        phone = '0' + phone.substring(3);
        return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    // اگر با 9 شروع می‌شود (فرض بر موبایل)
    else if (phone.startsWith('9') && phone.length === 10) {
        phone = '0' + phone;
        return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    return phone;
}

// تاریخ شمسی به میلادی
function persianToGregorian(persianDate) {
    if (!persianDate) return null;
    
    try {
        const parts = persianDate.split('/');
        if (parts.length !== 3) return null;
        
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        
        const pDate = new persianDate([year, month, day]);
        const gDate = pDate.toCalendar('gregorian').toLocale('en').format('YYYY/MM/DD');
        
        return gDate;
    } catch (error) {
        console.error('Error converting Persian date:', error);
        return null;
    }
}

// تاریخ میلادی به شمسی
function gregorianToPersian(gregorianDate) {
    if (!gregorianDate) return null;
    
    try {
        const parts = gregorianDate.split('/');
        if (parts.length !== 3) return null;
        
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const day = parseInt(parts[2]);
        
        const gDate = new Date(year, month - 1, day);
        const pDate = new persianDate(gDate).format('YYYY/MM/DD');
        
        return pDate;
    } catch (error) {
        console.error('Error converting Gregorian date:', error);
        return null;
    }
}

// محاسبه تفاوت بین دو تاریخ
function dateDiff(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    try {
        const start = new persianDate(startDate);
        const end = new persianDate(endDate);
        
        return end.diff(start, 'days');
    } catch (error) {
        console.error('Error calculating date difference:', error);
        return 0;
    }
}

// تولید شناسه یکتا
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ذخیره در localStorage با مدیریت خطا
function safeSetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        showNotification('خطا در ذخیره‌سازی داده‌ها', 'error');
        return false;
    }
}

// خواندن از localStorage با مدیریت خطا
function safeGetLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// حذف از localStorage با مدیریت خطا
function safeRemoveLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// کپی به کلیپ‌بورد
function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(resolve).catch(reject);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                resolve();
            } catch (error) {
                reject(error);
            }
            document.body.removeChild(textArea);
        }
    });
}

// دانلود فایل
function downloadFile(content, fileName, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// نمایش نوتیفیکیشن
function showNotification(message, type = 'info', duration = 3000) {
    // ایجاد عنصر نوتیفیکیشن
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // افزودن به صفحه
    document.body.appendChild(notification);
    
    // حذف خودکار پس از مدت مشخص
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
}

// فرمت کردن تاریخ برای نمایش
function formatDateForDisplay(dateString, format = 'full') {
    if (!dateString) return '';
    
    try {
        const pDate = new persianDate(dateString);
        
        switch (format) {
            case 'short':
                return pDate.format('YYYY/MM/DD');
            case 'medium':
                return pDate.format('dddd DD MMMM YYYY');
            case 'full':
                return pDate.format('dddd DD MMMM YYYY HH:mm');
            case 'time':
                return pDate.format('HH:mm');
            default:
                return pDate.format('YYYY/MM/DD');
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

// محاسبه سن
function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    try {
        const birth = new persianDate(birthDate);
        const now = new persianDate();
        return now.diff(birth, 'years');
    } catch (error) {
        console.error('Error calculating age:', error);
        return null;
    }
}

// بررسی اینکه آیا تاریخ در گذشته است
function isPastDate(dateString) {
    if (!dateString) return false;
    
    try {
        const date = new persianDate(dateString);
        const now = new persianDate();
        return date < now;
    } catch (error) {
        console.error('Error checking past date:', error);
        return false;
    }
}

// بررسی اینکه آیا تاریخ در آینده است
function isFutureDate(dateString) {
    if (!dateString) return false;
    
    try {
        const date = new persianDate(dateString);
        const now = new persianDate();
        return date > now;
    } catch (error) {
        console.error('Error checking future date:', error);
        return false;
    }
}

// گرفتن روزهای هفته
function getPersianWeekDays() {
    return [
        'شنبه',
        'یکشنبه',
        'دوشنبه',
        'سه‌شنبه',
        'چهارشنبه',
        'پنجشنبه',
        'جمعه'
    ];
}

// گرفتن ماه‌های شمسی
function getPersianMonths() {
    return [
        'فروردین',
        'اردیبهشت',
        'خرداد',
        'تیر',
        'مرداد',
        'شهریور',
        'مهر',
        'آبان',
        'آذر',
        'دی',
        'بهمن',
        'اسفند'
    ];
}

// تولید شماره فاکتور تصادفی
function generateInvoiceNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${timestamp}-${random}`;
}

// محاسبه مبلغ با احتساب مالیات و تخفیف
function calculateFinalAmount(amount, taxRate = 0, discount = 0, discountType = 'numeric') {
    amount = parseFloat(amount) || 0;
    taxRate = parseFloat(taxRate) || 0;
    discount = parseFloat(discount) || 0;
    
    let finalAmount = amount;
    
    // اعمال تخفیف
    if (discountType === 'percentage') {
        finalAmount -= amount * (discount / 100);
    } else {
        finalAmount -= discount;
    }
    
    // اعمال مالیات
    finalAmount += finalAmount * (taxRate / 100);
    
    return Math.max(0, Math.round(finalAmount));
}

// بررسی پشتیبانی از localStorage
function isLocalStorageSupported() {
    try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        return false;
    }
}

// بررسی پشتیبانی از sessionStorage
function isSessionStorageSupported() {
    try {
        const test = 'test';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch (error) {
        return false;
    }
}

// گرفتن اطلاعات مرورگر
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        browserName = 'Chrome';
        browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Firefox')) {
        browserName = 'Firefox';
        browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browserName = 'Safari';
        browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edg')) {
        browserName = 'Edge';
        browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
    }
    
    return {
        name: browserName,
        version: browserVersion,
        userAgent: ua
    };
}

// گرفتن اطلاعات سیستم
function getSystemInfo() {
    return {
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
        online: navigator.onLine,
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
}

// لاگ کردن با timestamp
function logWithTimestamp(message, level = 'info') {
    const timestamp = new Date().toLocaleString('fa-IR');
    const logMessage = `[${timestamp}] ${message}`;
    
    switch (level) {
        case 'error':
            console.error(logMessage);
            break;
        case 'warn':
            console.warn(logMessage);
            break;
        case 'debug':
            console.debug(logMessage);
            break;
        default:
            console.log(logMessage);
    }
}

// تاخیر
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// اجرای تابع با retry
async function executeWithRetry(fn, maxRetries = 3, delayMs = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await delay(delayMs * (i + 1));
            }
        }
    }
    
    throw lastError;
}

// بررسی اینکه آیا المنت در viewport است
function isElementInViewport(el) {
    if (!el) return false;
    
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// اسکرول به المنت
function scrollToElement(element, behavior = 'smooth') {
    if (!element) return;
    
    element.scrollIntoView({
        behavior: behavior,
        block: 'center'
    });
}

// گرفتن پارامترهای URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
    }
    
    return params;
}

// تنظیم پارامترهای URL
function setUrlParams(params) {
    const url = new URL(window.location);
    
    for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, value);
        }
    }
    
    window.history.replaceState({}, '', url.toString());
}

// گرفتن مقدار CSS متغیر
function getCssVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// تنظیم مقدار CSS متغیر
function setCssVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
}

// فرمت کردن فایل سایز
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// گرفتن extension فایل
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

// بررسی نوع فایل
function isImageFile(filename) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const ext = getFileExtension(filename).toLowerCase();
    return imageExtensions.includes(ext);
}

// بررسی نوع سند
function isDocumentFile(filename) {
    const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const ext = getFileExtension(filename).toLowerCase();
    return docExtensions.includes(ext);
}

// ایجاد thumbnail از تصویر
function createImageThumbnail(file, maxWidth = 200, maxHeight = 200) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// اعتبارسنجی ایمیل
function validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

// تولید رنگ تصادفی
function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// تبدیل رنگ HEX به RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// بررسی اینکه رنگ روشن است یا تیره
function isLightColor(color) {
    const rgb = hexToRgb(color);
    if (!rgb) return true;
    
    // فرمول محاسبه روشنایی
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128;
}

// ایجاد gradient رنگ
function generateGradient(color1, color2, steps = 10) {
    const gradients = [];
    for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        gradients.push(interpolateColor(color1, color2, ratio));
    }
    return gradients;
}

// درون‌یابی رنگ
function interpolateColor(color1, color2, ratio) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// گرفتن زمان باقی‌مانده
function getTimeRemaining(targetDate) {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const distance = target - now;
    
    if (distance < 0) {
        return {
            expired: true,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
        };
    }
    
    return {
        expired: false,
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
}

// فرمت کردن زمان
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
    ].join(':');
}

// ایجاد hash از رشته
function createHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// بررسی اینکه آیا object خالی است
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

// کلون کردن object (سطحی)
function shallowClone(obj) {
    return { ...obj };
}

// کلون کردن object (عمیق)
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ادغام objectها
function mergeObjects(...objects) {
    return Object.assign({}, ...objects);
}

// فیلتر کردن object بر اساس شرط
function filterObject(obj, predicate) {
    return Object.fromEntries(
        Object.entries(obj).filter(([key, value]) => predicate(key, value))
    );
}

// map کردن object
function mapObject(obj, mapper) {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, mapper(value, key)])
    );
}

// گرفتن کلیدهای object به صورت مرتب شده
function getSortedKeys(obj) {
    return Object.keys(obj).sort();
}

// گرفتن مقادیر object به صورت مرتب شده
function getSortedValues(obj) {
    return Object.values(obj).sort();
}

// ایجاد delay انیمیشن
function animateValue(start, end, duration, callback) {
    const startTime = performance.now();
    const change = end - start;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easing function
        const value = start + change * progress;
        
        callback(value);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ایجاد vibration (در صورت پشتیبانی)
function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// بررسی پشتیبانی از touch
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// گرفتن موقعیت جغرافیایی
function getGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            position => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
            }),
            error => reject(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    });
}

// ایجاد QR code
function generateQRCode(text, size = 128) {
    // این تابع نیاز به کتابخانه QR code دارد
    // در اینجا فقط ساختار کلی ارائه شده است
    console.log('QR Code generation would require a library like qrcode.js');
    return `QR Code for: ${text} (${size}x${size})`;
}

// فشرده سازی تصویر
function compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(blob => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// بارگذاری اولیه
document.addEventListener('DOMContentLoaded', function() {
    // اضافه کردن استایل‌های داینامیک اگر نیاز باشد
    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `
            .rtl { direction: rtl; }
            .ltr { direction: ltr; }
            .persian-digits { font-feature-settings: "numr"; }
        `;
        document.head.appendChild(style);
    }
});