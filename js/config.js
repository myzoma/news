const CONFIG = {
    RSS_PROXY_SERVICES: [
        'https://api.rss2json.com/v1/api.json?rss_url=',
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/get?url='
    ],
    
    NEWS_SOURCES: {
        coindesk: {
            name: 'CoinDesk',
            rss: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
            color: '#FF6B35'
        },
        cointelegraph: {
            name: 'Cointelegraph',
            rss: 'https://cointelegraph.com/rss',
            color: '#1DA1F2'
        },
        bitcoinmagazine: {
            name: 'Bitcoin Magazine',
            rss: 'https://bitcoinmagazine.com/feed/',
            color: '#F7931A'
        },
        decrypt: {
            name: 'Decrypt',
            rss: 'https://decrypt.co/feed',
            color: '#00D4AA'
        },
        theblock: {
            name: 'The Block',
            rss: 'https://www.theblockcrypto.com/rss.xml',
            color: '#000000'
        }
    },
    
    STORAGE_KEYS: {
        NEWS_CACHE: 'cryptoNewsCache',
        LAST_UPDATE: 'lastUpdate'
    },
    
    CACHE_DURATION: 5 * 60 * 1000,
    COINGECKO_API: 'https://api.coingecko.com/api/v3'
};
