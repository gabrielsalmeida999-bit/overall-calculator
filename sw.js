const CACHE = 'overall-v7';

const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon.png',
  'sw.js'
];

// Instala e pré-cacheia — NÃO chama skipWaiting automaticamente
// A página decide quando ativar (para mostrar o popup de atualização)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

// Ativa: limpa caches antigos e assume controle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Quando a página enviar { type: 'SKIP_WAITING' }, ativa imediatamente
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache First
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          if (!res || res.status !== 200 || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('index.html'));
    })
  );
});
