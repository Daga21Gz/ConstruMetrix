// CONSTRUMETRIX Service Worker v2.0
// Offline-First PWA Strategy

const CACHE_NAME = 'construmetrix-v2.3';
const RUNTIME_CACHE = 'construmetrix-runtime';

// Assets to cache immediately
const STATIC_ASSETS = [
    './',
    './index.html',
    './app.js',
    './geo-visor.js',
    './blueprints.js',
    './advanced-features.js',
    './performance-optimizer.js',
    './items.json',
    './unidades_construccion.json',
    './lines.geojson',
    './towers.geojson',
    './Servidumbre.geojson',
    './gis-worker.js',
    './gis-api-service.js',
    './monitoring.js',
    './fuentes-oficiales.js',
    './firebase-service.js',
    './style.css',
    './elite-colors.css',
    './animations.css',
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
// Stale-While-Revalidate Strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. API / Cloud calls: Network Only
    if (url.origin !== location.origin && !request.url.includes('cdn') && !request.url.includes('unpkg')) {
        return;
    }

    // 2. Static Assets & App Shell: Stale-While-Revalidate
    event.respondWith(
        caches.open(RUNTIME_CACHE).then(cache => {
            return cache.match(request).then(cachedResponse => {
                const fetchPromise = fetch(request).then(networkResponse => {
                    // Update cache with new version
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(() => {
                    // Start offline fallback if network fails
                    return cachedResponse;
                });

                // Return cached response immediately if available, otherwise wait for network
                return cachedResponse || fetchPromise;
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
