const CACHE_NAME = 'roomos-v4';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/api.js',
    './js/state.js',
    './js/store.js',
    './js/sync.js',
    './js/ui/login.js',
    './js/ui/group_setup.js',
    './js/ui/dashboard.js',
    './js/ui/roster.js',
    './js/ui/crew.js',
    './js/ui/rules.js',
    './js/ui/profile.js',
    './js/ui/transactions.js',
    './js/ui/chat.js',
    './js/ui/toast.js',
    './manifest.json',
    './icon.svg'
];

// Install: Cache Static Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Fetch: Network First, fall back to Cache for HTML/CSS/JS
// For API: We will handle that in the application layer (api.js) or here?
// Strategy: 
// 1. Static Assets -> Cache First (stale-while-revalidate could be better but Cache First is safer for offline)
// 2. API -> Network Only (handled by app logic for now, or we can intercept here)
// Let's stick to Stale-While-Revalidate for static assets to ensure updates
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Ignore API calls (handled by JS) and non-GET
    if (url.pathname.includes('/server/') || event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request).then((response) => {
                // Update cache
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });

            // Return cached if available, else network
            return cached || networkFetch;
        })
    );
});
