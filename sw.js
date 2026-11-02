// Financial OS service worker. Exists so the site is installable (Add to
// Home Screen) and so the app shell opens offline. Network-first: a fresh
// index.html always wins when online; the cached copy is only a fallback.
// API calls (Supabase, SimpleFIN) are never cached.
const CACHE = 'fos-shell-v2';
const SHELL = ['./index.html', './logo-72.png', './icon-64.png', './icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === location.origin && url.pathname.endsWith('.png')) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
    return;
  }
  if (e.request.mode !== 'navigate') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html'))
  );
});
