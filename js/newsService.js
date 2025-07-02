class NewsService {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = null;
        this.isLoading = false;
        
        // تحميل آخر تحديث من LocalStorage مع التحقق من صحة التاريخ
        this.loadLastUpdateFromStorage();
    }

    // تحميل آخر تحديث من التخزين المحلي
    loadLastUpdateFromStorage() {
        try {
            const savedUpdate = localStorage.getItem('lastUpdate');
            if (savedUpdate) {
                const date = new Date(savedUpdate);
                // التحقق من صحة التاريخ
                if (!isNaN(date.getTime())) {
                    this.lastUpdate = date;
                } else {
                    console.warn('تاريخ غير صحيح في التخزين المحلي');
                    this.lastUpdate = null;
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل آخر تحديث:', error);
            this.lastUpdate = null;
        }
    }

    // الحصول على آخر تحديث مع التنسيق المناسب
    getLastUpdate() {
        if (!this.lastUpdate) {
            return 'لم يتم التحديث بعد';
        }
        
        try {
            return this.lastUpdate.toLocaleString('ar-SA', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('خطأ في تنسيق التاريخ:', error);
            return this.lastUpdate.toString();
        }
    }

    // تحديث كاش الأخبار مع إصلاح مشكلة التاريخ
    updateNewsCache(allNews) {
        try {
            this.cache.set('allNews', allNews);
            this.lastUpdate = new Date(); // إنشاء تاريخ جديد
            
            // التأكد من حفظ التاريخ بشكل صحيح
            const isoString = this.lastUpdate.toISOString();
            localStorage.setItem('lastUpdate', isoString);
            
            console.log('تم تحديث الكاش في:', this.lastUpdate);
        } catch (error) {
            console.error('خطأ في تحديث الكاش:', error);
        }
    }

    // جلب الأخبار من جميع المصادر
    async fetchAllNews() {
        if (this.isLoading) return this.cache.get('allNews') || [];
        
        this.isLoading = true;
        const allNews = [];
        
        try {
            // جلب الأخبار من كل مصدر
            const promises = Object.entries(CONFIG.NEWS_SOURCES).map(
                ([key, source]) => this.fetchFromSource(source)
            );
            
            const results = await Promise.allSettled(promises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    allNews.push(...result.value);
                }
            });
            
            // ترتيب الأخبار حسب التاريخ
            allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            
            // تحديث الكاش وآخر تحديث
            this.updateNewsCache(allNews);
            
            // حفظ في التخزين المحلي
            this.saveToLocalStorage(allNews);
            
        } catch (error) {
            console.error('خطأ في جلب الأخبار:', error);
            // محاولة تحميل من التخزين المحلي
            const cachedNews = this.loadFromLocalStorage();
            if (cachedNews.length > 0) {
                return cachedNews;
            }
        } finally {
            this.isLoading = false;
        }
        
        return allNews;
    }

    // جلب الأخبار من مصدر واحد
    async fetchFromSource(source) {
        try {
            // استخدام RSS2JSON API
            const proxyUrl = CONFIG.RSS_PROXY_SERVICES[0];
            const response = await fetch(`${proxyUrl}${encodeURIComponent(source.rss)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error('RSS parsing failed');
            }
            
            return data.items.map(item => ({
                title: item.title,
                description: this.cleanDescription(item.description),
                link: item.link,
                pubDate: item.pubDate,
                source: source.name,
                sourceColor: source.color,
                thumbnail: item.thumbnail || item.enclosure?.link || null,
                categories: item.categories || [],
                id: this.generateId(item.link),
                // إضافة اتجاه النص للغة الإنجليزية
                textDirection: this.detectTextDirection(item.title, item.description)
            }));
            
        } catch (error) {
            console.error(`خطأ في جلب أخبار ${source.name}:`, error);
            return [];
        }
    }

    // تحديد اتجاه النص بناءً على المحتوى
    detectTextDirection(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        
        // فحص وجود أحرف عربية
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
        
        if (arabicRegex.test(text)) {
            return 'rtl'; // من اليمين إلى اليسار للعربية
        } else {
            return 'ltr'; // من اليسار إلى اليمين للإنجليزية
        }
    }

    // تنظيف وصف الخبر
    cleanDescription(description) {
        if (!description) return '';
        
        // إزالة HTML tags
        const cleanText = description.replace(/<[^>]*>/g, '');
        
        // تقصير النص
        return cleanText.length > 200 ? 
            cleanText.substring(0, 200) + '...' : 
            cleanText;
    }

    // توليد معرف فريد
    generateId(url) {
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    }

    // حفظ في التخزين المحلي مع تحديث التاريخ
    saveToLocalStorage(news) {
        try {
            const currentTime = new Date();
            const data = {
                news: news,
                timestamp: currentTime.getTime(), // استخدام getTime() للحصول على timestamp صحيح
                lastUpdate: currentTime.toISOString()
            };
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.NEWS_CACHE, JSON.stringify(data));
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, currentTime.toISOString());
            
            // تحديث lastUpdate في الكلاس
            this.lastUpdate = currentTime;
            
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
        }
    }

    // تحميل من التخزين المحلي
    loadFromLocalStorage() {
        try {
            const cached = localStorage.getItem(CONFIG.STORAGE_KEYS.NEWS_CACHE);
            if (!cached) return [];
            
            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;
            
            // تحديث آخر تحديث من البيانات المحفوظة
            if (data.lastUpdate) {
                this.lastUpdate = new Date(data.lastUpdate);
            }
            
            // التحقق من صلاحية الكاش
            if (age < CONFIG.CACHE_DURATION) {
                return data.news || [];
            }
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات المحفوظة:', error);
        }
        
        return [];
    }

    // جلب أسعار العملات من CoinGecko
    async fetchCryptoPrices() {
        try {
            const response = await fetch(
                `${CONFIG.COINGECKO_API}/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,solana&vs_currencies=usd&include_24hr_change=true`
            );
            
            if (!response.ok) throw new Error('Failed to fetch prices');
            
            return await response.json();
        } catch (error) {
            console.error('خطأ في جلب الأسعار:', error);
            return null;
        }
    }

    // البحث في الأخبار
    searchNews(news, query) {
        if (!query) return news;
        
        const searchTerm = query.toLowerCase();
        return news.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.source.toLowerCase().includes(searchTerm)
        );
    }

    // فلترة حسب المصدر
    filterBySource(news, source) {
        if (!source) return news;
        return news.filter(item => item.source === source);
    }

    // الحصول على المصادر النشطة
    getActiveSources(news) {
        const sources = new Set();
        news.forEach(item => sources.add(item.source));
        return Array.from(sources);
    }

    // إعادة تعيين آخر تحديث (للاختبار)
    resetLastUpdate() {
        this.lastUpdate = null;
        localStorage.removeItem('lastUpdate');
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_UPDATE);
    }

    // فرض تحديث الأخبار
    async forceRefresh() {
        this.cache.clear();
        return await this.fetchAllNews();
    }
}
