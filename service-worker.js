// 阿公智慧 PWA - Service Worker
// 提供離線支援:沒網路時用上次快取的資料

const CACHE_NAME = 'grandpa-edge-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // GitHub raw 資料: 優先用網路, 失敗用快取
  if (url.hostname === 'raw.githubusercontent.com') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // 其他資源: 優先用快取, 沒有再抓網路
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
