/* ═══════════════════════════════════════════════════════════════════════════
   PRAGATI Service Worker — v2.1 (Fixed)

   Fixes:
   - Cross-origin API calls (Render backend) are NEVER cached — pass-through only
   - offlineFallback returns JSON for API requests, not HTML
   - No more "Failed to convert value to Response" crash
   - SW version bump forces reinstall and clears bad cached API responses

   Strategy:
   - App shell (HTML/CSS/JS) → Cache First
   - Same-origin API calls   → Network only (no cache)
   - Cross-origin API calls  → Network only (pass-through, no intercept)
   - Google Fonts             → Cache First with long TTL
   - Images/Icons             → Cache First
   ═══════════════════════════════════════════════════════════════════════════ */

const CACHE_NAME      = 'pragati-v3';  // bumped from v1 — forces cache clear
const FONT_CACHE_NAME = 'pragati-fonts-v2';

// App shell resources to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(err => {
        console.warn('[SW] Pre-cache partial failure (OK):', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete ALL old caches (including bad API cache) ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(key => {
          // Delete everything except current caches
          if (key !== CACHE_NAME && key !== FONT_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Non-GET requests: NEVER intercept (POST/PUT/DELETE go straight to network)
  if (request.method !== 'GET') return;

  // 2. Browser extensions: ignore
  if (!url.protocol.startsWith('http')) return;

  // 3. Cross-origin requests (Render backend, ML service, Cloudinary, etc.)
  //    NEVER cache — just pass through to network
  if (url.origin !== self.location.origin) {
    // Let the browser handle it natively — no event.respondWith
    return;
  }

  // 4. Google Fonts (same as before — safe to cache)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE_NAME));
    return;
  }

  // 5. Same-origin /api/* calls: Network Only — no caching, no fallback
  //    (These are relative API calls, rare in this setup, but handle cleanly)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'Network unavailable', offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // 6. Same-origin static assets: Cache First
  if (
    url.pathname.endsWith('.js')    ||
    url.pathname.endsWith('.css')   ||
    url.pathname.endsWith('.png')   ||
    url.pathname.endsWith('.jpg')   ||
    url.pathname.endsWith('.svg')   ||
    url.pathname.endsWith('.ico')   ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // 7. HTML navigation: Network First, SPA fallback to /index.html
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // 8. Everything else: Network First
  event.respondWith(networkFirst(request));
});

/* ── Strategies ──────────────────────────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type !== 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type !== 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || new Response('', { status: 503 });
  }
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache  = await caches.open(CACHE_NAME);
    // SPA: always serve index.html for navigation failures
    return (
      (await cache.match(request))    ||
      (await cache.match('/index.html')) ||
      (await cache.match('/offline.html')) ||
      new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } })
    );
  }
}

/* ── Push Notifications ──────────────────────────────────────────────────── */
self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: 'PRAGATI', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || 'PRAGATI', {
      body:    data.body    || 'New notification from PRAGATI',
      icon:    '/icon-192x192.png',
      badge:   '/icon-72x72.png',
      tag:     data.tag     || 'pragati-notif',
      data:    data.url     || '/dashboard',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open',    title: '📖 Open App' },
        { action: 'dismiss', title: '✕ Dismiss'  },
      ],
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
