// تطبيق أخبار العملات الرقمية
class CryptoNewsApp {
    constructor() {
        this.newsService = new NewsService();
        this.allNews = [];
        this.filteredNews = [];
        this.currentPage = 1;
        this.newsPerPage = 10;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadNews();
        this.setupFilters();
    }

    bindEvents() {
        // زر التحديث
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshNews();
        });

        // البحث
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // فلتر المصادر
        document.getElementById('sourceFilter').addEventListener('change', (e) => {
            this.handleSourceFilter(e.target.value);
        });

        // زر تحميل المزيد
        document.getElementById('loadMoreBtn').addEventListener('click', () => {
            this.loadMoreNews();
        });
    }

    async loadNews() {
        this.showLoading(true);
        
        try {
            this.allNews = await this.newsService.fetchAllNews();
            this.filteredNews = [...this.allNews];
            this.displayNews();
            this.updateStats();
        } catch (error) {
            console.error('خطأ في تحميل الأخبار:', error);
            this.showError('حدث خطأ في تحميل الأخبار');
        } finally {
            this.showLoading(false);
        }
    }

    displayNews() {
        const container = document.getElementById('newsContainer');
        const newsToShow = this.filteredNews.slice(0, this.currentPage * this.newsPerPage);
        
        if (newsToShow.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">لا توجد أخبار متاحة</h4>
                </div>
            `;
            return;
        }

        const newsHTML = newsToShow.map(news => this.createNewsItem(news)).join('');
        container.innerHTML = newsHTML;
        
        // إظهار/إخفاء زر تحميل المزيد
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (newsToShow.length < this.filteredNews.length) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }

    createNewsItem(news) {
        const timeAgo = this.getTimeAgo(news.pubDate);
        
        return `
            <div class="news-item">
                <div class="news-content">
                    <a href="${news.link}" target="_blank" class="news-title">
                        ${news.title}
                    </a>
                    <p class="news-description">
                        ${news.description}
                    </p>
                    <div class="news-meta">
                        <span class="news-source" style="background-color: ${news.sourceColor}40; border-color: ${news.sourceColor}60;">
                            ${news.source}
                        </span>
                        <span class="news-date">
                            ${timeAgo}
                        </span>
                    </div>
                </div>
                ${news.thumbnail ? `
                    <div class="news-thumbnail">
                        <img src="${news.thumbnail}" alt="${news.title}" loading="lazy" 
                             onerror="this.parentElement.style.display='none'">
                    </div>
                ` : ''}
            </div>
        `;
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'أمس';
        } else if (diffDays < 7) {
            return `منذ ${diffDays} أيام`;
        } else {
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    setupFilters() {
        const sourceFilter = document.getElementById('sourceFilter');
        const sources = this.newsService.getActiveSources(this.allNews);
        
        // إضافة المصادر إلى القائمة المنسدلة
        sources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });
    }

    handleSearch(query) {
        this.filteredNews = this.newsService.searchNews(this.allNews, query);
        this.currentPage = 1;
        this.displayNews();
        this.updateStats();
    }

    handleSourceFilter(source) {
        this.filteredNews = this.newsService.filterBySource(this.allNews, source);
        this.currentPage = 1;
        this.displayNews();
        this.updateStats();
    }

    loadMoreNews() {
        this.currentPage++;
        this.displayNews();
    }

    async refreshNews() {
        const refreshBtn = document.getElementById('refreshBtn');
        const icon = refreshBtn.querySelector('i');
        
        // تأثير الدوران
        icon.classList.add('fa-spin');
        refreshBtn.disabled = true;
        
        try {
            // مسح الكاش
            this.newsService.cache.clear();
            localStorage.removeItem(CONFIG.STORAGE_KEYS.NEWS_CACHE);
            
            await this.loadNews();
            this.setupFilters();
        } finally {
            icon.classList.remove('fa-spin');
            refreshBtn.disabled = false;
        }
    }

    updateStats() {
        document.getElementById('totalNews').textContent = this.filteredNews.length;
        document.getElementById('totalSources').textContent = 
            this.newsService.getActiveSources(this.filteredNews).length;
        
        const lastUpdate = this.newsService.lastUpdate;
        if (lastUpdate) {
            document.getElementById('lastUpdate').textContent = 
                lastUpdate.toLocaleTimeString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const container = document.getElementById('newsContainer');
        
        if (show) {
            spinner.style.display = 'block';
            container.style.display = 'none';
        } else {
            spinner.style.display = 'none';
            container.style.display = 'block';
        }
    }

    showError(message) {
        const container = document.getElementById('newsContainer');
        container.innerHTML = `
            <div class="alert alert-danger text-center" role="alert">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h4>خطأ</h4>
                <p>${message}</p>
                <button class="btn btn-outline-danger" onclick="location.reload()">
                    <i class="fas fa-redo"></i>
                    إعادة المحاولة
                </button>
            </div>
        `;
    }
}

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new CryptoNewsApp();
});

// إضافة تأثيرات إضافية
document.addEventListener('DOMContentLoaded', () => {
    // تأثير التمرير السلس للأزرار
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // تأثير الكتابة للبحث
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            // البحث سيتم تنفيذه في handleSearch
        }, 300);
    });

    // تحسين الأداء للصور
    const observerOptions = {
        root: null,
        rootMargin: '50px',
        threshold: 0.1
    };

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    }, observerOptions);

    // مراقبة الصور الجديدة
    const observeImages = () => {
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    };

    // استدعاء المراقبة عند إضافة محتوى جديد
    const originalDisplayNews = CryptoNewsApp.prototype.displayNews;
    CryptoNewsApp.prototype.displayNews = function() {
        originalDisplayNews.call(this);
        setTimeout(observeImages, 100);
    };
});

// إضافة دعم لوضع الظلام/النور (اختياري)
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.applyTheme();
    }

    applyTheme() {
        document.body.className = this.currentTheme === 'dark' ? 'dark-theme' : 'light-theme';
        localStorage.setItem('theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
    }
}

// تشغيل مدير الثيم
const themeManager = new ThemeManager();

// إضافة معالج الأخطاء العام
window.addEventListener('error', (e) => {
    console.error('خطأ في التطبيق:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('خطأ في Promise:', e.reason);
});
