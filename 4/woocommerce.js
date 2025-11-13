// woocommerce.js - سیستم اتصال کامل به ووکامرس
class WoocommerceIntegration {
    constructor() {
        this.apiUrl = '';
        this.consumerKey = '';
        this.consumerSecret = '';
        this.isConnected = false;
        this.isSyncing = false;
        this.syncProgress = {
            total: 0,
            current: 0,
            percentage: 0,
            type: '',
            items: []
        };
        
        console.log('✅ WoocommerceIntegration initialized');
    }

    // تنظیمات اتصال
    setConfig(apiUrl, consumerKey, consumerSecret) {
        try {
            // اعتبارسنجی آدرس
            if (!apiUrl.startsWith('http')) {
                throw new Error('آدرس وبسایت باید با http یا https شروع شود');
            }
            
            this.apiUrl = apiUrl.replace(/\/$/, '') + '/wp-json/wc/v3/';
            this.consumerKey = consumerKey;
            this.consumerSecret = consumerSecret;
            this.isConnected = true;
            
            console.log('🔧 Woocommerce config set:', {
                apiUrl: this.apiUrl,
                hasKey: !!consumerKey,
                hasSecret: !!consumerSecret
            });
            
            // ذخیره تنظیمات
            localStorage.setItem('woocommerceConfig', JSON.stringify({
                apiUrl,
                consumerKey,
                consumerSecret,
                connected: true,
                configuredAt: new Date().toISOString()
            }));
            
            return true;
        } catch (error) {
            console.error('❌ Error setting config:', error);
            this.isConnected = false;
            throw error;
        }
    }

    // بررسی اتصال
    async testConnection() {
        if (!this.isConnected) {
            throw new Error('اتصال به ووکامرس تنظیم نشده است');
        }

        try {
            console.log('🔌 Testing Woocommerce connection...');
            
            // تست اولیه: بررسی اینکه آدرس درست است
            const baseTest = await fetch(this.apiUrl.replace('/wp-json/wc/v3/', '/wp-json/'), {
                method: 'GET',
                mode: 'cors'
            });
            
            if (!baseTest.ok) {
                throw new Error('آدرس وبسایت نامعتبر است');
            }

            // تست API ووکامرس
            const response = await this.makeRequest('products', { per_page: 1 });
            
            console.log('✅ Connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            throw error;
        }
    }

    // درخواست به API ووکامرس
    async makeRequest(endpoint, params = {}) {
        if (!this.isConnected) {
            throw new Error('اتصال به ووکامرس تنظیم نشده است');
        }

        const url = new URL(this.apiUrl + endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        // Basic Auth برای ووکامرس
        const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);

        console.log(`🌐 Making request to: ${endpoint}`, params);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            console.log(`📡 Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                let errorMessage = `خطای API: ${response.status} ${response.statusText}`;
                
                // دریافت متن خطا
                try {
                    const errorText = await response.text();
                    console.error('Error response text:', errorText);
                    
                    if (errorText.includes('rest_cannot_view')) {
                        errorMessage = 'دسترسی API فعال نیست. لطفاً در ووکامرس تنظیمات REST API را بررسی کنید.';
                    } else if (errorText.includes('woocommerce_rest_authentication_error')) {
                        errorMessage = 'کلیدهای API نادرست هستند. لطفاً Consumer Key و Consumer Secret را بررسی کنید.';
                    } else if (errorText.includes('rest_no_route')) {
                        errorMessage = 'مسیر API یافت نشد. احتمالاً آدرس وبسایت نادرست است.';
                    } else if (response.status === 401) {
                        errorMessage = 'احراز هویت ناموفق. کلیدهای API را بررسی کنید.';
                    } else if (response.status === 404) {
                        errorMessage = 'آدرس API یافت نشد. آدرس وبسایت را بررسی کنید.';
                    } else if (response.status === 403) {
                        errorMessage = 'دسترسی ممنوع است. کلیدهای API باید دارای دسترسی خواندن باشند.';
                    }
                } catch (e) {
                    console.error('Error reading error text:', e);
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            console.log(`✅ Data received from ${endpoint}:`, {
                count: Array.isArray(data) ? data.length : 'object',
                total: response.headers.get('X-WP-Total'),
                totalPages: response.headers.get('X-WP-TotalPages')
            });

            return {
                success: true,
                data: data,
                total: response.headers.get('X-WP-Total') || '0',
                totalPages: response.headers.get('X-WP-TotalPages') || '1'
            };
        } catch (error) {
            console.error(`❌ Network error in ${endpoint}:`, error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('خطای شبکه: امکان اتصال به سرور وجود ندارد. ممکن است مشکل CORS یا آدرس نادرست باشد.');
            }
            
            throw error;
        }
    }

    // دریافت تمام مشتریان
    async getCustomers(page = 1, per_page = 100) {
        try {
            console.log(`🔍 Requesting customers - page: ${page}, per_page: ${per_page}`);
            
            const response = await this.makeRequest('customers', {
                page,
                per_page,
                orderby: 'id',
                order: 'asc'
            });

            console.log(`✅ Customers response:`, {
                page: page,
                count: response.data.length,
                total: response.total,
                hasMore: page < parseInt(response.totalPages)
            });

            const customers = response.data.map(customer => this.formatCustomerData(customer));
            return {
                success: true,
                customers: customers,
                hasMore: page < parseInt(response.totalPages),
                total: parseInt(response.total)
            };
        } catch (error) {
            console.error(`❌ Error getting customers:`, error);
            return {
                success: false,
                error: error.message,
                customers: []
            };
        }
    }

    // دریافت تمام محصولات
    async getProducts(page = 1, per_page = 100) {
        try {
            console.log(`🔍 Requesting products - page: ${page}, per_page: ${per_page}`);
            
            const response = await this.makeRequest('products', {
                page,
                per_page,
                orderby: 'id',
                order: 'asc'
            });

            console.log(`✅ Products response:`, {
                page: page,
                count: response.data.length,
                total: response.total,
                hasMore: page < parseInt(response.totalPages)
            });

            const products = response.data.map(product => this.formatProductData(product));
            return {
                success: true,
                products: products,
                hasMore: page < parseInt(response.totalPages),
                total: parseInt(response.total)
            };
        } catch (error) {
            console.error(`❌ Error getting products:`, error);
            return {
                success: false,
                error: error.message,
                products: []
            };
        }
    }

    // فرمت داده مشتری برای سیستم فاکتور
formatCustomerData(wcCustomer) {
    const customer = {
        id: Date.now() + Math.random(), // ایجاد ID یکتا
        name: `${wcCustomer.first_name || ''} ${wcCustomer.last_name || ''}`.trim() || 
              wcCustomer.username || 
              `مشتری ${wcCustomer.id}`,
        email: wcCustomer.email || '',
        phone: wcCustomer.billing?.phone || '',
        nationalId: wcCustomer.billing?.national_id || '',
        economicCode: wcCustomer.billing?.economic_code || '',
        postalCode: wcCustomer.billing?.postcode || '',
        accountNumber: wcCustomer.billing?.account_number || '',
        address: this.formatAddress(wcCustomer.billing),
        woocommerceId: wcCustomer.id,
        source: 'woocommerce',
        lastSynced: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    console.log(`👤 Formatted customer: ${customer.name}`, {
        id: customer.id,
        woocommerceId: customer.woocommerceId,
        email: customer.email
    });
    
    return customer;
}

    // فرمت داده محصول برای سیستم فاکتور
formatProductData(wcProduct) {
    // محاسبه قیمت (تبدیل به ریال)
    const price = Math.round((parseFloat(wcProduct.price) || 0) * 10);
    
    // مدیریت موجودی
    let stock = Infinity;
    if (wcProduct.manage_stock) {
        stock = wcProduct.stock_quantity !== null && wcProduct.stock_quantity !== undefined ? 
                wcProduct.stock_quantity : Infinity;
    }
    
    const product = {
        id: Date.now() + Math.random(), // ایجاد ID یکتا
        code: wcProduct.sku || `WC-${wcProduct.id}`,
        name: wcProduct.name,
        stock: stock,
        price: price,
        image: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : null,
        description: wcProduct.description || '',
        woocommerceId: wcProduct.id,
        source: 'woocommerce',
        lastSynced: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    console.log(`📦 Formatted product: ${product.name}`, {
        id: product.id,
        woocommerceId: product.woocommerceId,
        code: product.code,
        price: product.price,
        stock: product.stock
    });
    
    return product;
}

    // فرمت آدرس
    formatAddress(billing) {
        if (!billing) return '';
        
        const addressParts = [
            billing.address_1,
            billing.address_2,
            billing.city,
            billing.state,
            billing.country
        ].filter(part => part && part.trim() !== '');

        return addressParts.join('، ') || 'آدرس ثبت نشده';
    }

    // به‌روزرسانی پیشرفت
    updateProgress(type, current, total, items = []) {
        this.syncProgress = {
            type,
            current,
            total,
            percentage: total > 0 ? Math.round((current / total) * 100) : 0,
            items: items
        };
        
        this.renderProgressBar();
        this.renderSyncedItems();
    }

    // رندر نوار پیشرفت
    renderProgressBar() {
        const progressContainer = document.getElementById('syncProgressContainer');
        if (!progressContainer) return;

        const { type, current, total, percentage } = this.syncProgress;
        
        progressContainer.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow border">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-semibold">
                        <i class="fas fa-sync-alt ml-1 ${this.isSyncing ? 'fa-spin' : ''}"></i>
                        همگام‌سازی ${type === 'customers' ? 'مشتریان' : 'محصولات'}
                    </h4>
                    <span class="text-sm text-gray-600">${percentage}%</span>
                </div>
                
                <div class="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div class="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                         style="width: ${percentage}%"></div>
                </div>
                
                <div class="flex justify-between text-sm text-gray-600">
                    <span>${toPersianDigits(current)} از ${toPersianDigits(total)}</span>
                    <span>${this.isSyncing ? 'در حال انجام...' : 'تکمیل شد'}</span>
                </div>
                
                ${this.isSyncing ? `
                <div class="mt-2 text-center">
                    <button onclick="stopWoocommerceSync()" 
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition">
                        <i class="fas fa-stop ml-1"></i> توقف همگام‌سازی
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }

    // نمایش آیتم‌های همگام‌سازی شده
    renderSyncedItems() {
        const itemsContainer = document.getElementById('syncedItemsContainer');
        if (!itemsContainer) return;

        const { type, items } = this.syncProgress;
        
        if (items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>هنوز داده‌ای همگام‌سازی نشده است</p>
                </div>
            `;
            return;
        }

        // نمایش آخرین 10 آیتم
        const recentItems = items.slice(-10).reverse();
        
        itemsContainer.innerHTML = `
            <div class="space-y-2 max-h-60 overflow-y-auto">
                ${recentItems.map(item => `
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded border synced-item">
                        <div class="flex items-center">
                            ${item.image ? `
                                <img src="${item.image}" class="w-8 h-8 rounded object-cover ml-2">
                            ` : `
                                <div class="w-8 h-8 bg-blue-100 rounded flex items-center justify-center ml-2">
                                    <i class="fas ${item.type === 'customers' ? 'fa-user' : 'fa-box'} text-blue-600"></i>
                                </div>
                            `}
                            <div>
                                <div class="font-medium">${item.name}</div>
                                <div class="text-xs text-gray-500">
                                    ${item.type === 'customers' ? (item.email || 'بدون ایمیل') : `کد: ${item.code} | قیمت: ${formatPrice(item.price)} ریال`}
                                </div>
                            </div>
                        </div>
                        <span class="text-xs text-green-600">
                            <i class="fas fa-check ml-1"></i>
                            همگام‌شد
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // همگام‌سازی کامل
    async syncAllData() {
        if (this.isSyncing) {
            showNotification('همگام‌سازی در حال انجام است', 'warning');
            return;
        }

        this.isSyncing = true;
        this.syncProgress.items = [];
        
        console.group('🔄 Starting full sync');
        
        const results = {
            customers: { success: false, count: 0, error: null },
            products: { success: false, count: 0, error: null }
        };

        try {
            // همگام‌سازی مشتریان
            console.log('👥 Starting customers sync...');
            addSyncLog('شروع همگام‌سازی مشتریان...', 'info');
            
            let allCustomers = [];
            let page = 1;
            let hasMore = true;
            let totalCustomers = 0;

            // دریافت تعداد کل مشتریان
            try {
                const testResponse = await this.getCustomers(1, 1);
                totalCustomers = testResponse.total || 0;
                console.log(`📊 Total customers: ${totalCustomers}`);
            } catch (error) {
                console.error('Error getting total customers:', error);
                totalCustomers = 0;
            }

            while (hasMore && this.isSyncing) {
                console.log(`📄 Fetching customers page ${page}...`);
                
                const response = await this.getCustomers(page, 20);
                
                if (response.success && response.customers.length > 0) {
                    console.log(`✅ Got ${response.customers.length} customers`);
                    allCustomers = allCustomers.concat(response.customers);
                    
                    // به‌روزرسانی پیشرفت
                    this.updateProgress('customers', allCustomers.length, totalCustomers, allCustomers);
                    
                    // نمایش آیتم‌های جدید
                    response.customers.forEach(customer => {
                        this.syncProgress.items.push({
                            type: 'customers',
                            name: customer.name,
                            email: customer.email,
                            image: null
                        });
                    });
                    
                    hasMore = response.hasMore;
                    page++;
                    
                    // تأخیر برای کاهش بار سرور
                    await this.delay(300);
                } else if (!response.success) {
                    console.error('Failed to get customers:', response.error);
                    throw new Error(response.error);
                } else {
                    hasMore = false;
                }
            }

            if (this.isSyncing && allCustomers.length > 0) {
                console.log(`💾 Saving ${allCustomers.length} customers to system...`);
                await this.saveCustomersToSystem(allCustomers);
                results.customers = { success: true, count: allCustomers.length };
                addSyncLog(`همگام‌سازی مشتریان تکمیل شد: ${toPersianDigits(allCustomers.length)} مشتری`, 'success');
            }

            // همگام‌سازی محصولات
            if (this.isSyncing) {
                console.log('📦 Starting products sync...');
                addSyncLog('شروع همگام‌سازی محصولات...', 'info');
                
                let allProducts = [];
                page = 1;
                hasMore = true;
                let totalProducts = 0;

                // دریافت تعداد کل محصولات
                try {
                    const testResponse = await this.getProducts(1, 1);
                    totalProducts = testResponse.total || 0;
                    console.log(`📊 Total products: ${totalProducts}`);
                } catch (error) {
                    console.error('Error getting total products:', error);
                    totalProducts = 0;
                }

                while (hasMore && this.isSyncing) {
                    console.log(`📄 Fetching products page ${page}...`);
                    
                    const response = await this.getProducts(page, 20);
                    
                    if (response.success && response.products.length > 0) {
                        console.log(`✅ Got ${response.products.length} products`);
                        allProducts = allProducts.concat(response.products);
                        
                        // به‌روزرسانی پیشرفت
                        this.updateProgress('products', allProducts.length, totalProducts, allProducts);
                        
                        // نمایش آیتم‌های جدید
                        response.products.forEach(product => {
                            this.syncProgress.items.push({
                                type: 'products',
                                name: product.name,
                                code: product.code,
                                price: product.price,
                                image: product.image
                            });
                        });
                        
                        hasMore = response.hasMore;
                        page++;
                        
                        // تأخیر برای کاهش بار سرور
                        await this.delay(300);
                    } else if (!response.success) {
                        console.error('Failed to get products:', response.error);
                        throw new Error(response.error);
                    } else {
                        hasMore = false;
                    }
                }

                if (this.isSyncing && allProducts.length > 0) {
                    console.log(`💾 Saving ${allProducts.length} products to system...`);
                    await this.saveProductsToSystem(allProducts);
                    results.products = { success: true, count: allProducts.length };
                    addSyncLog(`همگام‌سازی محصولات تکمیل شد: ${toPersianDigits(allProducts.length)} محصول`, 'success');
                }
            }

        } catch (error) {
            console.error('❌ Sync error:', error);
            addSyncLog(`خطا در همگام‌سازی: ${error.message}`, 'error');
        } finally {
            this.isSyncing = false;
            this.updateProgress('complete', 0, 0, this.syncProgress.items);
            console.groupEnd();
            
            if (!this.isSyncing) {
                addSyncLog('همگام‌سازی کامل تکمیل شد', 'success');
                localStorage.setItem('lastWoocommerceSync', new Date().toISOString());
                updateSyncStats();
            }
        }

        return results;
    }

    // ذخیره مشتریان در سیستم
// ذخیره مشتریان در سیستم
async saveCustomersToSystem(wcCustomers) {
    try {
        // بارگذاری داده‌های فعلی از data.js
        if (typeof window.customers === 'undefined') {
            console.warn('⚠️ customers array not found, loading from localStorage');
            window.customers = JSON.parse(localStorage.getItem('customers') || '[]');
        }
        
        const existingCustomers = window.customers || [];
        
        console.log(`💾 Starting to save ${wcCustomers.length} customers to system`);
        console.log(`📊 Existing customers: ${existingCustomers.length}`);
        
        // ادغام با داده‌های موجود
        wcCustomers.forEach(wcCustomer => {
            const existingIndex = existingCustomers.findIndex(c => 
                c.woocommerceId === wcCustomer.woocommerceId || 
                (c.email && c.email === wcCustomer.email)
            );
            
            if (existingIndex >= 0) {
                // به‌روزرسانی مشتری موجود
                console.log(`🔄 Updating existing customer: ${wcCustomer.name}`);
                existingCustomers[existingIndex] = {
                    ...existingCustomers[existingIndex],
                    ...wcCustomer,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // افزودن مشتری جدید
                console.log(`➕ Adding new customer: ${wcCustomer.name}`);
                existingCustomers.push({
                    ...wcCustomer,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        });

        // ذخیره در متغیر جهانی
        window.customers = existingCustomers;
        
        // ذخیره در localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser && currentUser.id) {
            const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
            userData.customers = existingCustomers;
            localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
            console.log('✅ Customers saved to userData');
        } else {
            localStorage.setItem('customers', JSON.stringify(existingCustomers));
            console.log('✅ Customers saved to localStorage');
        }
        
        // به‌روزرسانی رابط کاربری
        if (typeof loadCustomers === 'function') {
            loadCustomers();
            console.log('✅ Customers UI updated');
        } else {
            console.warn('⚠️ loadCustomers function not found');
        }
        
        // همگام‌سازی با IndexedDB
        if (typeof syncWithIndexedDB === 'function') {
            setTimeout(() => {
                syncWithIndexedDB().catch(error => {
                    console.error('❌ IndexedDB sync failed:', error);
                });
            }, 1000);
        }
        
        console.log(`✅ Successfully saved ${wcCustomers.length} customers to system`);
        
    } catch (error) {
        console.error('❌ Error saving customers:', error);
        throw error;
    }
}

    // ذخیره محصولات در سیستم
    async saveProductsToSystem(wcProducts) {
    try {
        // بارگذاری داده‌های فعلی از data.js
        if (typeof window.products === 'undefined') {
            console.warn('⚠️ products array not found, loading from localStorage');
            window.products = JSON.parse(localStorage.getItem('products') || '[]');
        }
        
        const existingProducts = window.products || [];
        
        console.log(`💾 Starting to save ${wcProducts.length} products to system`);
        console.log(`📊 Existing products: ${existingProducts.length}`);
        
        // ادغام با داده‌های موجود
        wcProducts.forEach(wcProduct => {
            const existingIndex = existingProducts.findIndex(p => 
                p.woocommerceId === wcProduct.woocommerceId || 
                p.code === wcProduct.code
            );
            
            if (existingIndex >= 0) {
                // به‌روزرسانی محصول موجود
                console.log(`🔄 Updating existing product: ${wcProduct.name}`);
                existingProducts[existingIndex] = {
                    ...existingProducts[existingIndex],
                    ...wcProduct,
                    updatedAt: new Date().toISOString()
                };
            } else {
                // افزودن محصول جدید
                console.log(`➕ Adding new product: ${wcProduct.name}`);
                existingProducts.push({
                    ...wcProduct,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        });

        // ذخیره در متغیر جهانی
        window.products = existingProducts;
        
        // ذخیره در localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser && currentUser.id) {
            const userData = JSON.parse(localStorage.getItem(`userData_${currentUser.id}`) || '{}');
            userData.products = existingProducts;
            localStorage.setItem(`userData_${currentUser.id}`, JSON.stringify(userData));
            console.log('✅ Products saved to userData');
        } else {
            localStorage.setItem('products', JSON.stringify(existingProducts));
            console.log('✅ Products saved to localStorage');
        }
        
        // به‌روزرسانی رابط کاربری
        if (typeof loadProducts === 'function') {
            loadProducts();
            console.log('✅ Products UI updated');
        } else {
            console.warn('⚠️ loadProducts function not found');
        }
        
        // همگام‌سازی با IndexedDB
        if (typeof syncWithIndexedDB === 'function') {
            setTimeout(() => {
                syncWithIndexedDB().catch(error => {
                    console.error('❌ IndexedDB sync failed:', error);
                });
            }, 1000);
        }
        
        console.log(`✅ Successfully saved ${wcProducts.length} products to system`);
        
    } catch (error) {
        console.error('❌ Error saving products:', error);
        throw error;
    }
}

    // توقف همگام‌سازی
    stopSync() {
        this.isSyncing = false;
        addSyncLog('همگام‌سازی متوقف شد', 'warning');
    }

    // تاخیر
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // عیب‌یابی
    async debugConnection() {
        console.group('🔧 Woocommerce Debug');
        
        try {
            console.log('1. Checking configuration...');
            console.log('API URL:', this.apiUrl);
            console.log('Has Consumer Key:', !!this.consumerKey);
            console.log('Has Consumer Secret:', !!this.consumerSecret);
            console.log('Is Connected:', this.isConnected);

            if (!this.isConnected) {
                throw new Error('اتصال تنظیم نشده است');
            }

            console.log('2. Testing base connection...');
            const baseResponse = await fetch(this.apiUrl.replace('/wp-json/wc/v3/', '/wp-json/'));
            console.log('Base connection:', baseResponse.status, baseResponse.statusText);

            console.log('3. Testing Woocommerce API...');
            const wcTest = await this.makeRequest('', { per_page: 1 });
            console.log('WC API test:', wcTest.success);

            console.log('4. Testing customers endpoint...');
            const customersTest = await this.getCustomers(1, 1);
            console.log('Customers test:', customersTest);

            console.log('5. Testing products endpoint...');
            const productsTest = await this.getProducts(1, 1);
            console.log('Products test:', productsTest);

            console.groupEnd();
            return true;
        } catch (error) {
            console.error('Debug failed:', error);
            console.groupEnd();
            return false;
        }
    }
}

// ایجاد نمونه جهانی
window.woocommerce = new WoocommerceIntegration();

// بارگذاری خودکار تنظیمات
document.addEventListener('DOMContentLoaded', function() {
    try {
        const savedConfig = localStorage.getItem('woocommerceConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.connected && config.apiUrl && config.consumerKey && config.consumerSecret) {
                window.woocommerce.setConfig(config.apiUrl, config.consumerKey, config.consumerSecret);
                console.log('✅ Woocommerce config loaded from storage');
            }
        }
    } catch (error) {
        console.error('❌ Error loading woocommerce config:', error);
    }
});

console.log('✅ Woocommerce integration module loaded');