class CryptoNewsApp {
    constructor() {
        // التأكد من وجود CONFIG قبل إنشاء NewsService
        if (typeof CONFIG === 'undefined') {
            console.error('CONFIG غير معرف');
            return;
        }
        
        this.newsService = new NewsService();
        this.currentNews = [];
        this.filteredNews = [];
        this.displayedCount = 0;
        this.itemsPerPage = 10;
        
        this.init();
    }
 // أضف هذه الدالة
    updateStats(news) {
        console.log('🔄 Updating stats with', news.length, 'news items');
        
        const totalNewsElement = document.getElementById('totalNews');
        const totalSourcesElement = document.getElementById('totalSources');
        const lastUpdateElement = document.getElementById('lastUpdate');
        
        if (totalNewsElement) {
            totalNewsElement.textContent = news.length;
            console.log('✅ Total news updated:', news.length);
        }
        
        if (totalSourcesElement) {
            const uniqueSources = [...new Set(news.map(item => item.source))];
            totalSourcesElement.textContent = uniqueSources.length;
            console.log('✅ Total sources updated:', uniqueSources.length);
        }
        
        if (lastUpdateElement) {
            const lastUpdate = this.newsService.getFormattedLastUpdate();
            lastUpdateElement.textContent = lastUpdate;
            console.log('✅ Last update updated:', lastUpdate);
        }
    }
    
    // أضف دالة إخفاء التحميل
    hideLoading() {
        const loadingElement = document.getElementById('loadingSpinner');
        if (loadingElement) {
            loadingElement.style.display = 'none';
            console.log('✅ Loading spinner hidden');
        }
    }
    
    // أضف دالة عرض التحميل
    showLoading() {
        const loadingElement = document.getElementById('loadingSpinner');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            console.log('🔄 Loading spinner shown');
        }
    }
    
    async init() {
        this.setupEventListeners();
        this.showLoading();
        
        try {
            await this.loadNews();
            this.setupAutoRefresh();
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            this.showError('فشل في تحميل الأخبار');
        }
    }

    setupEventListeners() {
        // البحث
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // فلترة المصادر
        const sourceFilter = document.getElementById('sourceFilter');
        if (sourceFilter) {
            sourceFilter.addEventListener('change', (e) => {
                this.handleSourceFilter(e.target.value);
            });
        }

        // زر التحديث
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshNews();
            });
        }

        // التمرير اللانهائي
        window.addEventListener('scroll', () => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
                this.loadMoreNews();
            }
        });
    }

     async loadNews() {
        try {
            this.showLoading();
            console.log('🔄 Loading news...');
            
            const news = await this.newsService.fetchAllNews();
            console.log('📰 News loaded:', news.length);
            
            this.currentNews = news;
            this.filteredNews = news;
            
            // تحديث الإحصائيات
            this.updateStats(news);
            
            // عرض الأخبار
            this.displayNews(news);
            
            // إخفاء شاشة التحميل
            this.hideLoading();
            
        } catch (error) {
            console.error('❌ Error loading news:', error);
            this.hideLoading();
        }
    }

    displayNews() {
        const container = document.getElementById('newsContainer');
        if (!container) return;

        const startIndex = 0;
        const endIndex = this.currentPage * this.newsPerPage;
        const newsToShow = this.filteredNews.slice(startIndex, endIndex);

        if (this.currentPage === 1) {
            container.innerHTML = '';
        }

        newsToShow.forEach((newsItem, index) => {
            if (index >= (this.currentPage - 1) * this.newsPerPage) {
                const newsElement = this.createNewsElement(newsItem);
                container.appendChild(newsElement);
            }
        });

        // تطبيق تصغير الصور
        setTimeout(() => this.resizeImages(), 500);
    }

    createNewsElement(newsItem) {
        const article = document.createElement('article');
        article.className = 'news-item';
        article.style.direction = 'ltr';
        article.style.textAlign = 'left';

        const thumbnailHTML = newsItem.thumbnail ? 
            `<img src="${newsItem.thumbnail}" 
                 alt="${newsItem.title}" 
                 class="news-thumbnail"
                 onerror="this.style.display='none'"
                 loading="lazy">` : '';

        article.innerHTML = `
            ${thumbnailHTML}
            <div class="news-content">
                <h2 class="news-title">
                    <a href="${newsItem.link}" target="_blank" rel="noopener">
                        ${newsItem.title}
                    </a>
                </h2>
                <p class="news-description">${newsItem.description}</p>
                <div class="news-meta">
                    <span class="news-source" style="color: ${newsItem.sourceColor}">
                        ${newsItem.source}
                    </span>
                    <time class="news-date">
                        ${new Date(newsItem.pubDate).toLocaleDateString('ar-SA')}
                    </time>
                </div>
            </div>
        `;

        return article;
    }

    resizeImages() {
        const images = document.querySelectorAll('.news-thumbnail, img');
        images.forEach(img => {
            img.style.maxWidth = '100%';
            img.style.maxHeight = '200px';
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            img.style.display = 'block';
            img.style.margin = '10px 0';
        });
    }

    handleSearch(query) {
        this.filteredNews = this.newsService.searchNews(this.currentNews, query);
        this.currentPage = 1;
        this.displayNews();
    }

    handleSourceFilter(source) {
        this.filteredNews = this.newsService.filterBySource(this.currentNews, source);
        this.currentPage = 1;
        this.displayNews();
    }

    async refreshNews() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'جاري التحديث...';
        }

        try {
            await this.loadNews();
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.textContent = 'تحديث';
            }
        }
    }

    loadMoreNews() {
        if (this.isLoading) return;
        
        const totalPages = Math.ceil(this.filteredNews.length / this.newsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.displayNews();
        }
    }

      updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `آخر تحديث: ${this.newsService.getFormattedLastUpdate()}`;
        }
    }

    updateSourceFilter() {
        const sourceFilter = document.getElementById('sourceFilter');
        if (!sourceFilter) return;

        const sources = this.newsService.getActiveSources(this.currentNews);
        sourceFilter.innerHTML = '<option value="">جميع المصادر</option>';
        
        sources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });
    }

    showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        this.hideLoading();
    }

    setupAutoRefresh() {
        // تحديث تلقائي كل 5 دقائق
        setInterval(() => {
            this.loadNews();
        }, 5 * 60 * 1000);

        // تحديث وقت آخر تحديث كل دقيقة
        setInterval(() => {
            this.updateLastUpdateTime();
        }, 60 * 1000);

        // تصغير الصور كل ثانيتين
        setInterval(() => {
            this.resizeImages();
        }, 2000);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التأكد من وجود جميع المتطلبات
    if (typeof CONFIG === 'undefined') {
        console.error('يجب تحميل ملف config.js أولاً');
        return;
    }
    
    if (typeof NewsService === 'undefined') {
        console.error('يجب تحميل ملف NewsService.js أولاً');
        return;
    }

    // إنشاء التطبيق
    window.app = new CryptoNewsApp();
});

// دالة مساعدة لتصغير الصور (يمكن استدعاؤها من أي مكان)
function resizeAllImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.style.maxWidth = '100%';
        img.style.maxHeight = '200px';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.display = 'block';
        img.style.margin = '10px 0';
        
        img.onerror = function() {
            this.style.display = 'none';
        };
    });
}

// تشغيل تصغير الصور فور تحميل الصفحة
resizeAllImages();
setInterval(resizeAllImages, 2000);

