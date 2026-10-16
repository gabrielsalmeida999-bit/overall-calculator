const CACHE = 'overall-v35';

const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon.png',
  'logo.svg',
  'sw.js'
];

// Instala, prÃ©-cacheia e ativa imediatamente (sem esperar popup)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())   // â† assume controle imediatamente
  );
});

// Ativa: limpa caches antigos e assume todos os clientes
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())  // â† toma conta de todas as abas abertas
  );
});

// Network First para index.html â€” sempre busca versÃ£o mais recente da rede
// Cache First para assets estÃ¡ticos (Ã­cones, imagens, logo)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isPage = url.pathname === '/overall-calculator/'
               || url.pathname === '/overall-calculator/index.html'
               || url.pathname.endsWith('/');

  if (isPage) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200 && res.type !== 'opaque') {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => caches.match('index.html'));
      })
    );
  }
});
