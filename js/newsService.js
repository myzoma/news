// خدمة جلب الأخبار
class NewsService {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = null;
        this.isLoading = false;
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
            
            // تخزين في الكاش
            this.cache.set('allNews', allNews);
            this.lastUpdate = new Date();
            
            // حفظ في التخزين المحلي
            this.saveToLocalStorage(allNews);
            
        } catch (error) {
            console.error('خطأ في جلب الأخبار:', error);
            // محاولة تحميل من التخزين المحلي
            return this.loadFromLocalStorage();
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
                thumbnail: this.createThumbnail(item.thumbnail || item.enclosure?.link || null),
                categories: item.categories || [],
                id: this.generateId(item.link)
            }));
            
        } catch (error) {
            console.error(`خطأ في جلب أخبار ${source.name}:`, error);
            return [];
        }
    }

    // إنشاء صورة مصغرة محسنة
    createThumbnail(imageUrl) {
        if (!imageUrl) return null;
        
        // تحسين الصور حسب المصدر
        if (imageUrl.includes('youtube.com') || imageUrl.includes('ytimg.com')) {
            return imageUrl.replace('maxresdefault', 'mqdefault').replace('hqdefault', 'mqdefault');
        }
        
        if (imageUrl.includes('imgur.com')) {
            return imageUrl.replace(/\.(jpg|jpeg|png|gif)$/i, 's$1');
        }
        
        // للصور العامة - إضافة معاملات للحجم المصغر
        const url = new URL(imageUrl);
        url.searchParams.set('w', '80');
        url.searchParams.set('h', '80');
        url.searchParams.set('fit', 'crop');
        
        return url.toString();
    }

    // تنظيف وصف الخبر مع مساحة أكبر للنص
    cleanDescription(description) {
        if (!description) return '';
        
        // إزالة HTML tags
        const cleanText = description.replace(/<[^>]*>/g, '');
        
        // تقصير النص مع إعطاء مساحة أكبر
        return cleanText.length > 180 ? 
            cleanText.substring(0, 180) + '...' : 
            cleanText;
    }

    // توليد معرف فريد
    generateId(url) {
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    }

    // حفظ في التخزين المحلي
    saveToLocalStorage(news) {
        try {
            const data = {
                news: news,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.STORAGE_KEYS.NEWS_CACHE, JSON.stringify(data));
            localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_UPDATE, this.lastUpdate.toISOString());
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
}
