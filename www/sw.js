// Caches the app so it opens offline. Data files are cached the first time they are used.
const C = 'quran-shell-v5';
const SHELL = ['./', 'index.html', 'i18n.js', 'meta.js', 'core.js', 'audio.js', 'ui-quran.js', 'ui-hadith.js', 'ui-ask.js', 'ui-more.js', 'main.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'fonts/AmiriQuran-Regular.ttf', 'fonts/NotoNaskhArabic.ttf', 'data/hadith/books.json', 'data/quran/ar.json', 'data/quran/en.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
