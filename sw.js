let cacheName = 'cache';
let cacheDynamic = 'cache2';
let appShell = [
    'index.html',
    'pages/favourites.html',
    'style.css',
    'favicon.ico',
    'js/main.js',
    'js/favs.js',
    'js/sw-register.js',
    'assets/Formula1-Bold_web.ttf'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => {
                return cache.addAll(appShell);
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== cacheName && key !== cacheDynamic)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.mode === 'navigate') {
        e.respondWith(
            caches.match('index.html')
                .then((response) => response || fetch(e.request))
        );
        return;
    }

    e.respondWith(
        caches.match(e.request)
            .then((response) => {
                if (response) return response;

                return fetch(e.request)
                    .then((response) => {
                        if (!response || response.status !== 200) return response;

                        let responseToCache = response.clone();
                        caches.open(cacheDynamic)
                            .then((cache) => cache.put(e.request, responseToCache));

                        return response;
                    })
            })
    );
});
