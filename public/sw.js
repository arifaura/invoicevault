self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.delete('invoicevault-v1'),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  const isAppAsset = requestUrl.origin === self.location.origin
    && requestUrl.pathname.startsWith('/static/')
    && ['script', 'style'].includes(event.request.destination);

  if (!isAppAsset) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return new Response('Application asset not found.', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      return response;
    })
  );
});
