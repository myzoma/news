class NewsService {
    constructor() {
        this.cache = new Map();
        this.lastUpdate = null;
        this.isLoading = false;
        
        // إصلاح قراءة آخر تحديث من LocalStorage
        this.initializeLastUpdate();
    }

    // إصلاح تهيئة آخر تحديث
    initializeLastUpdate() {
        try {
            const savedUpdate = localStorage.getItem('lastUpdate');
            if (savedUpdate && savedUpdate !== 'null' && savedUpdate !== 'undefined') {
                const date = new Date(savedUpdate);
                if (!isNaN(date.getTime()) && date.getTime() > 0) {
                    this.lastUpdate = date;
                }
            }
        } catch (error) {
            console.error('خطأ في تهيئة آخر تحديث:', error);
        }
    }

    // إصلاح تحديث كاش الأخبار
    updateNewsCache(allNews) {
        this.cache.set('allNews', allNews);
        // إنشاء تاريخ جديد صحيح
        this.lastUpdate = new Date();
        
        // التأكد من الحفظ الصحيح
        try {
            localStorage.setItem('lastUpdate', this.lastUpdate.toISOString());
            console.log('تم حفظ آخر تحديث:', this.lastUpdate.toISOString());
        } catch (error) {
            console.error('خطأ في حفظ آخر تحديث:', error);
        }
    }

    // دالة للحصول على آخر تحديث بتنسيق صحيح
    getFormattedLastUpdate() {
        if (!this.lastUpdate || isNaN(this.lastUpdate.getTime())) {
            return 'لم يتم التحديث بعد';
        }
        
        const now = new Date();
        const diffInMinutes = Math.floor((now - this.lastUpdate) / (1000 * 60));
        
        if (diffInMinutes < 1) {
            return 'الآن';
        } else if (diffInMinutes < 60) {
            return `منذ ${diffInMinutes} دقيقة`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `منذ ${hours} ساعة`;
        } else {
            return this.lastUpdate.toLocaleString('ar-SA');
        }
    }

    // جلب الأخبار من جميع المصادر مع إصلاح التحديث
    async fetchAllNews() {
        if (this.isLoading) return this.cache.get('allNews') || [];
        
        this.isLoading = true;
        const allNews = [];
        
        try {
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
            
            // تحديث الكاش مع إصلاح التاريخ
            this.updateNewsCache(allNews);
            this.saveToLocalStorage(allNews);
            
        } catch (error) {
            console.error('خطأ في جلب الأخبار:', error);
            return this.loadFromLocalStorage();
        } finally {
            this.isLoading = false;
        }
        
        return allNews;
    }

    // إصلاح جلب الأخبار من مصدر واحد مع اتجاه النص
   async fetchFromSource(source) {
    try {
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
            thumbnail: this.processThumbnail(item.thumbnail || item.enclosure?.link || null),
            categories: item.categories || [],
            id: this.generateId(item.link),
            isEnglish: this.isEnglishContent(item.title, item.description),
            textDirection: 'ltr'
        }));
        
    } catch (error) {
        console.error(`خطأ في جلب أخبار ${source.name}:`, error);
        return [];
    }
}
// دالة جديدة لمعالجة الصور المصغرة
processThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;
    
    // التحقق من صحة الرابط
    try {
        new URL(thumbnailUrl);
        return {
            url: thumbnailUrl,
            isValid: true
        };
    } catch (error) {
        console.warn('رابط صورة غير صحيح:', thumbnailUrl);
        return null;
    }
}
// دالة لعرض الأخبار مع صور صغيرة على الجانب
function updateNewsDisplayWithSideImages(newsService, newsArray) {
    const container = document.getElementById('news-container');
    
    if (container) {
        container.innerHTML = '';
        
        newsArray.forEach(newsItem => {
            const newsElement = document.createElement('div');
            newsElement.className = 'news-item english-content';
            newsElement.style.direction = 'ltr';
            newsElement.style.textAlign = 'left';
            newsElement.style.display = 'flex';
            newsElement.style.gap = '15px';
            
            // إنشاء HTML للصورة الجانبية
            const thumbnailHTML = newsItem.thumbnail && newsItem.thumbnail.isValid ? 
                `<div class="news-image-container" style="flex-shrink: 0;">
                    <img src="${newsItem.thumbnail.url}" 
                         alt="${newsItem.title}" 
                         class="news-thumbnail-small"
                         onerror="this.parentElement.style.display='none'"
                         loading="lazy">
                 </div>` : '';
            
            newsElement.innerHTML = `
                ${thumbnailHTML}
                <div class="news-content" style="flex: 1;">
                    <div class="news-title" style="direction: ltr; text-align: left;">
                        ${newsItem.title}
                    </div>
                    <div class="news-description" style="direction: ltr; text-align: left;">
                        ${newsItem.description}
                    </div>
                    <div class="news-meta" style="direction: ltr; text-align: left;">
                        <span class="news-source" style="color: ${newsItem.sourceColor}">
                            ${newsItem.source}
                        </span>
                        <span class="news-date">
                            ${new Date(newsItem.pubDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            `;
            
            container.appendChild(newsElement);
        });
    }
}
    // فحص إذا كان المحتوى باللغة الإنجليزية
    isEnglishContent(title, description) {
        const text = (title + ' ' + (description || '')).toLowerCase();
        const arabicRegex = /[\u0600-\u06FF]/;
        return !arabicRegex.test(text);
    }

    // تنظيف وصف الخبر
   cleanDescription(description) {
    if (!description) return '';
    
    // إزالة HTML tags والصور
    let cleanText = description.replace(/<img[^>]*>/gi, ''); // إزالة تاغات الصور
    cleanText = cleanText.replace(/<[^>]*>/g, ''); // إزالة باقي HTML tags
    cleanText = cleanText.replace(/\[.*?\]/g, ''); // إزالة النصوص بين الأقواس المربعة
    
    // تقصير النص
    return cleanText.length > 200 ? 
        cleanText.substring(0, 200) + '...' : 
        cleanText;
}
    // توليد معرف فريد
    generateId(url) {
        return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    }

    // إصلاح حفظ في التخزين المحلي
    saveToLocalStorage(news) {
        try {
            const now = new Date();
            const data = {
                news: news,
                timestamp: now.getTime(),
                lastUpdateISO: now.toISOString()
            };
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.NEWS_CACHE, JSON.stringify(data));
            localStorage.setItem('lastUpdate', now.toISOString());
            
            // تحديث المتغير المحلي
            this.lastUpdate = now;
            
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
            
            // استعادة آخر تحديث
            if (data.lastUpdateISO) {
                this.lastUpdate = new Date(data.lastUpdateISO);
            }
            
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

    // باقي الدوال كما هي...
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

    searchNews(news, query) {
        if (!query) return news;
        
        const searchTerm = query.toLowerCase();
        return news.filter(item => 
            item.title.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.source.toLowerCase().includes(searchTerm)
        );
    }

    filterBySource(news, source) {
        if (!source) return news;
        return news.filter(item => item.source === source);
    }

    getActiveSources(news) {
        const sources = new Set();
        news.forEach(item => sources.add(item.source));
        return Array.from(sources);
    }
}
