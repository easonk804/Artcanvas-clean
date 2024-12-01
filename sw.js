const CACHE_NAME = 'artbit-v1';
const BASE_PATH = '/artcanvas-clean';
const ASSETS = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/css/style.css`,
    `${BASE_PATH}/js/app.js`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/icons/icon-192x192.png`,
    `${BASE_PATH}/icons/icon-512x512.png`,
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
        ])
    );
});

// 处理请求
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求
    if (event.request.method !== 'GET') return;

    // 跳过 chrome-extension 请求
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // 检查是否是有效的响应
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 克隆响应
                    const responseToCache = response.clone();

                    // 缓存响应
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // 如果都失败了，返回离线页面
                return caches.match(`${BASE_PATH}/index.html`);
            })
    );
});
