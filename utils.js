// تبدیل ارقام به فارسی
function toPersianDigits(num) {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    if (num == null) return '';
    return num.toString().replace(/[0-9]/g, (digit) => persianDigits[parseInt(digit)]);
}

// فرمت کردن قیمت با جداکننده سه‌تایی
function formatPrice(amount) {
    amount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    amount = Math.floor(amount);
    let formatted = amount.toLocaleString('fa-IR');
    formatted = formatted.replace(/,/g, '،');
    return formatted;
}

// تبدیل عدد به حروف فارسی
function numberToPersianWords(num) {
    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const thousands = ['هزار', 'میلیون', 'میلیارد'];
    if (num === 0) return 'صفر';
    function convertChunk(chunk, level) {
        let result = '';
        const hundred = Math.floor(chunk / 100);
        const ten = Math.floor((chunk % 100) / 10);
        const unit = chunk % 10;
        if (hundred > 0) result += hundreds[hundred] + ' و ';
        if (ten === 1) result += teens[unit];
        else {
            if (ten > 1) result += tens[ten] + (unit > 0 ? ' و ' : '');
            if (unit > 0 && ten !== 1) result += units[unit];
        }
        if (result && level > 0) result += ' ' + thousands[level - 1];
        return result;
    }
    let level = 0;
    let result = '';
    while (num > 0) {
        const chunk = num % 1000;
        if (chunk > 0) {
            const chunkText = convertChunk(chunk, level);
            result = chunkText + (result ? ' و ' + result : '');
        }
        num = Math.floor(num / 1000);
        level++;
    }
    return result.trim();
}