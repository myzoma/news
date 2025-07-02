// إعدادات التطبيق
const CONFIG = {
    // مصادر الأخبار (استخدام APIs مجانية)
    NEWS_SOURCES: {
        'CoinDesk': {
            name: 'CoinDesk',
            rss: 'https://feeds.feedburner.com/CoinDesk',
            color: '#ff6b35'
        },
        'Cointelegraph': {
            name: 'Cointelegraph', 
            rss: 'https://cointelegraph.com/rss',
            color: '#00d4ff'
        },
        'CryptoNews': {
            name: 'CryptoNews',
            rss: 'https://cryptonews.com/news/feed/',
            color: '#f39c12'
        },
        'NewsBTC': {
            name: 'NewsBTC',
            rss: 'https://www.newsbtc.com/feed/',
            color: '#27ae60'
        },
        'CoinGape': {
            name: 'CoinGape',
            rss: 'https://coingape.com/feed/',
            color: '#9b59b6'
        }
    },
    
    // إعدادات عامة
    ITEMS_PER_PAGE: 10,
    AUTO_REFRESH_INTERVAL: 300000, // 5 دقائق
    CACHE_DURATION: 600000, // 10 دقائق
    
    // RSS to JSON proxy services
    RSS_PROXY_SERVICES: [
        'https://api.rss2json.com/v1/api.json?rss_url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/get?url='
    ],
    
    // CoinGecko API للأسعار (مجاني)
    COINGECKO_API: 'https://api.coingecko.com/api/v3',
    
    // إعدادات التخزين المحلي
    STORAGE_KEYS: {
        NEWS_CACHE: 'crypto_news_cache',
        LAST_UPDATE: 'last_update',
        USER_PREFERENCES: 'user_preferences'
    }
};
