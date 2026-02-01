// CONSTRUMETRIX Service Worker v2.0
// Offline-First PWA Strategy

const CACHE_NAME = 'construmetrix-v2.0';
const RUNTIME_CACHE = 'construmetrix-runtime';

// Assets to cache immediately
const STATIC_ASSETS = [
    './',
    './index.html',
    './app.js',
    './blueprints.js',
    './items.json',
    './unidades_construccion.json',
    './favicon.svg',
    './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        // For CDN resources, cache them runtime
        if (request.url.includes('cdn') || request.url.includes('googleapis') || request.url.includes('unpkg')) {
            event.respondWith(
                caches.open(RUNTIME_CACHE).then(cache => {
                    return cache.match(request).then(response => {
                        return response || fetch(request).then(networkResponse => {
                            cache.put(request, networkResponse.clone());
                            return networkResponse;
                        });
                    });
                })
            );
        }
        return;
    }

    // Network first, fallback to cache strategy
    event.respondWith(
        fetch(request)
            .then(response => {
                // Clone response for cache
                const responseClone = response.clone();
                caches.open(RUNTIME_CACHE).then(cache => {
                    cache.put(request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request).then(response => {
                    if (response) {
                        return response;
                    }
                    // If no cache, return offline page or error
                    if (request.destination === 'document') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// Background sync for future enhancements
self.addEventListener('sync', event => {
    if (event.tag === 'sync-budgets') {
        console.log('[SW] Background sync triggered');
        // Future: sync saved budgets to cloud
    }
});
