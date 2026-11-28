/* Ατομική προφόρτωση: αν λείπει έστω ένα βασικό αρχείο, η εγκατάσταση αποτυγχάνει
   και παραμένει η προηγούμενη πλήρης έκδοση — ποτέ μισή εφαρμογή. */
const CACHE = 'troxonomika-27.0';
const CORE = ['./', './index.html', './app.js', './data.js', './services.js'];
const OPTIONAL = ['./manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    await Promise.all(OPTIONAL.map(u =>
      c.add(new Request(u, { cache: 'reload' })).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try {
      const fresh = await fetch(r);
      if (fresh && fresh.ok) c.put(r, fresh.clone());
      return fresh;
    } catch (err) {
      const hit = await c.match(r);
      if (hit) return hit;
      if (r.mode === 'navigate') {
        const shell = await c.match('./index.html');
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
