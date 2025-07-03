// إعدادات التطبيق
const CONFIG = {
    // مصادر الأخبار
    NEWS_SOURCES: {
        coindesk: {
            name: 'CoinDesk',
            rss: 'https://feeds.feedburner.com/CoinDesk',
            color: '#f7931a'
        },
        cointelegraph: {
            name: 'Cointelegraph',
            rss: 'https://cointelegraph.com/rss',
            color: '#1a73e8'
        },
        bitcoinmagazine: {
            name: 'Bitcoin Magazine',
            rss: 'https://bitcoinmagazine.com/feed',
            color: '#ff6b35'
        },
        decrypt: {
            name: 'Decrypt',
            rss: 'https://decrypt.co/feed',
            color: '#00d4aa'
        },
        theblock: {
            name: 'The Block',
            rss: 'https://www.theblockcrypto.com/rss.xml',
            color: '#1e1e1e'
        }
    },

    // خدمات RSS Proxy
    RSS_PROXY_SERVICES: [
        'https://api.rss2json.com/v1/api.json?rss_url=',
        'https://api.allorigins.win/get?url=',
        'https://cors-anywhere.herokuapp.com/'
    ],

    // API العملات الرقمية
    COINGECKO_API: 'https://api.coingecko.com/api/v3',

    // مفاتيح التخزين المحلي
    STORAGE_KEYS: {
        NEWS_CACHE: 'crypto_news_cache',
        LAST_UPDATE: 'crypto_news_last_update',
        USER_PREFERENCES: 'crypto_news_preferences'
    },

    // مدة الكاش (بالميلي ثانية)
    CACHE_DURATION: 15 * 60 * 1000, // 15 دقيقة

    // إعدادات العرض
    DISPLAY: {
        NEWS_PER_PAGE: 10,
        MAX_DESCRIPTION_LENGTH: 180,
        THUMBNAIL_SIZE: {
            DESKTOP: { width: 80, height: 80 },
            MOBILE: { width: 50, height: 50 }
        }
    }
};

// تصدير الإعدادات للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
