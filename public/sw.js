// 3D Dünyası servis çalışanı: sayfalar ağdan gelir; bağlantı yoksa çevrimdışı sayfası gösterilir.
const ONBELLEK = '3dd-v1';
const CEVRIMDISI = '/cevrimdisi.html';
self.addEventListener('install', (e) => { e.waitUntil(caches.open(ONBELLEK).then((c) => c.addAll([CEVRIMDISI, '/favicon.svg', '/logo.svg']))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== ONBELLEK).map((x) => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(CEVRIMDISI)));
});
