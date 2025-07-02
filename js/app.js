// التطبيق الرئيسي
class CryptoNewsApp {
    constructor() {
        this.newsService = new NewsService();
        this.currentNews = [];
        this.filteredNews = [];
        this.displayedCount = 0;
        this.isLoading = false;
        
        this.init();
    }

    // تهيئة التطبيق
    async init() {
        this.setupEventListeners();
        this.showLoading();
        
        // تحميل الأخبار المحفوظة أولاً
        const cachedNews = this.newsService.loadFromLocalStorage();
        if (cachedNews.length > 0) {
            this.currentNews = cachedNews;
            this.filteredNews = [...cachedNews];
            this.renderNews();
            this.updateStats();
        }
        
        // جلب أخبار جديدة
        await this.refreshNews();
        
        // تحديث تلقائي
        this.startAutoRefresh();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // زر التحديث
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshNews();
        });

        // البحث
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // فلتر المصدر
        const sourceFilter = document.getElementById('sourceFilter');
        sourceFilter.addEventListener('change', (e) => {
            this.handleSourceFilter(e.target.value);
        });

        // تحميل المزيد
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMore();
        });

        // التمرير اللانهائي
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    // عرض شاشة التحميل
    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('newsContainer').style.display = 'none';
    }

    // إخفاء شاشة التحميل
    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
        document.getElementById('newsContainer').style.display = 'block';
    }

    // تحديث الأخبار
    async refreshNews() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const refreshBtn = document.getElementById('refreshBtn');
        const originalHTML = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';
        refreshBtn.disabled = true;

        try {
            this.currentNews = await this.newsService.fetchAllNews();
            this.filteredNews = [...this.currentNews];
            this.displayedCount = 0;
            
            this.renderNews();
            this.updateStats();
            this.updateSourceFilter();
            
            // إشعار نجاح
            this.showNotification('تم تحديث الأخبار بنجاح!', 'success');
            
        } catch (error) {
            console.error('خطأ في التحديث:', error);
            this.showNotification('حدث خطأ في تحديث الأخبار', 'error');
        } finally {
            this.isLoading = false;
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
            this.hideLoading();
        }
    }

    // عرض الأخبار
    renderNews(append = false) {
        const container = document.getElementById('newsContainer');
        
        if (!append) {
            container.innerHTML = '';
            this.displayedCount = 0;
        }

        const newsToShow = this.filteredNews.slice(
            this.displayedCount, 
            this.displayedCount + CONFIG.ITEMS_PER_PAGE
        );

        if (newsToShow.length === 0 && !append) {
            this.showEmptyState();
            return;
        }

        newsToShow.forEach(item => {
            const newsElement = this.createNewsElement(item);
            container.appendChild(newsElement);
        });

        this.displayedCount += newsToShow.length;
        
        // إظهار/إخفاء زر "تحميل المزيد"
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        loadMoreBtn.style.display = 
            this.displayedCount < this.filteredNews.length ? 'block' : 'none';
    }

    // إنشاء عنصر خبر
    createNewsElement(item) {
        const article = document.createElement('article');
        article.className = 'news-item fade-in';
        article.innerHTML = `
            <div class="news-source" style="background-color: ${item.sourceColor}">
                ${item.source}
            </div>
            <h2 class="news-title">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                    ${item.title}
                </a>
            </h2>
            ${item.description ? `<p class="news-description">${item.description}</p>` : ''}
            ${item.thumbnail ? `<img src="${item.thumbnail}" alt="صورة الخبر" class="news-thumbnail" loading="lazy">` : ''}
            <div class="news-meta">
                <div class="news-date">
                    <i class="fas fa-clock"></i>
                    <span>${this.formatDate(item.pubDate)}</span>
                </div>
                <div class="news-actions">
                    <button class="btn btn-outline-primary btn-sm" onclick="navigator.share({title: '${item.title}', url: '${item.link}'}).catch(() => navigator.clipboard.writeText('${item.link}'))">
                        <i class="fas fa-share-alt"></i>
                        مشاركة
                    </button>
                </div>
            </div>
        `;
        
        return article;
    }

     // تنسيق التاريخ
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffMinutes < 60) {
            return `منذ ${diffMinutes} دقيقة`;
        } else if (diffHours < 24) {
            return `منذ ${diffHours} ساعة`;
        } else if (diffDays === 1) {
            return 'أمس';
        } else if (diffDays < 7) {
            return `منذ ${diffDays} أيام`;
        } else {
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // تحديث الإحصائيات
    updateStats() {
        document.getElementById('totalNews').textContent = this.currentNews.length;
        document.getElementById('totalSources').textContent = 
            this.newsService.getActiveSources(this.currentNews).length;
        
        const lastUpdate = this.newsService.lastUpdate;
        if (lastUpdate) {
            document.getElementById('lastUpdate').textContent = 
                this.formatDate(lastUpdate.toISOString());
        }
    }

    // تحديث فلتر المصادر
    updateSourceFilter() {
        const sourceFilter = document.getElementById('sourceFilter');
        const activeSources = this.newsService.getActiveSources(this.currentNews);
        
        // مسح الخيارات الحالية (عدا "جميع المصادر")
        sourceFilter.innerHTML = '<option value="">جميع المصادر</option>';
        
        // إضافة المصادر النشطة
        activeSources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });
    }

    // معالجة البحث
    handleSearch(query) {
        this.filteredNews = this.newsService.searchNews(this.currentNews, query);
        
        // تطبيق فلتر المصدر إذا كان مفعلاً
        const sourceFilter = document.getElementById('sourceFilter').value;
        if (sourceFilter) {
            this.filteredNews = this.newsService.filterBySource(this.filteredNews, sourceFilter);
        }
        
        this.renderNews();
    }

    // معالجة فلتر المصدر
    handleSourceFilter(source) {
        this.filteredNews = this.newsService.filterBySource(this.currentNews, source);
        
        // تطبيق البحث إذا كان مفعلاً
        const searchQuery = document.getElementById('searchInput').value;
        if (searchQuery) {
            this.filteredNews = this.newsService.searchNews(this.filteredNews, searchQuery);
        }
        
        this.renderNews();
    }

    // تحميل المزيد من الأخبار
    loadMore() {
        this.renderNews(true);
    }

    // معالجة التمرير للتحميل التلقائي
    handleScroll() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn.style.display !== 'none' && !this.isLoading) {
                this.loadMore();
            }
        }
    }

    // عرض حالة فارغة
    showEmptyState() {
        const container = document.getElementById('newsContainer');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <h3>لا توجد أخبار</h3>
                <p>لم يتم العثور على أخبار تطابق البحث أو الفلتر المحدد</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i>
                    إعادة تحميل
                </button>
            </div>
        `;
    }

    // عرض الإشعارات
    showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // إزالة الإشعار تلقائياً بعد 5 ثوان
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // بدء التحديث التلقائي
    startAutoRefresh() {
        setInterval(() => {
            if (!this.isLoading) {
                this.refreshNews();
            }
        }, CONFIG.AUTO_REFRESH_INTERVAL);
    }

    // جلب وعرض أسعار العملات
    async loadCryptoPrices() {
        try {
            const prices = await this.newsService.fetchCryptoPrices();
            if (prices) {
                this.displayPrices(prices);
            }
        } catch (error) {
            console.error('خطأ في جلب الأسعار:', error);
        }
    }

    // عرض أسعار العملات
    displayPrices(prices) {
        const pricesContainer = document.createElement('div');
        pricesContainer.className = 'crypto-prices mb-4';
        pricesContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-chart-line"></i> أسعار العملات الرقمية</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${Object.entries(prices).map(([coin, data]) => `
                            <div class="col-md-2 col-sm-4 col-6 mb-2">
                                <div class="price-item text-center">
                                    <strong>${this.getCoinName(coin)}</strong><br>
                                    <span class="price">$${data.usd.toLocaleString()}</span><br>
                                    <small class="change ${data.usd_24h_change >= 0 ? 'text-success' : 'text-danger'}">
                                        ${data.usd_24h_change >= 0 ? '+' : ''}${data.usd_24h_change.toFixed(2)}%
                                    </small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        // إدراج أسعار العملات قبل الأخبار
        const newsContainer = document.getElementById('newsContainer');
        newsContainer.parentNode.insertBefore(pricesContainer, newsContainer);
    }

    // الحصول على اسم العملة بالعربية
    getCoinName(coinId) {
        const names = {
            'bitcoin': 'بيتكوين',
            'ethereum': 'إيثيريوم',
            'binancecoin': 'بينانس',
            'cardano': 'كاردانو',
            'solana': 'سولانا'
        };
        return names[coinId] || coinId;
    }
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.cryptoNewsApp = new CryptoNewsApp();
});

// Service Worker للعمل دون اتصال
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
