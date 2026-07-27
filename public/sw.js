const CACHE_NAME = 'skillmarket-v1'
const STATIC_ASSETS = ['/', '/logo.svg', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => {
      self.clients.matchAll().then((clients) =>
        clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('push', function (event) {
  if (!event.data) return
  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/logo.svg',
      badge: data.badge || '/logo.svg',
      data: { url: data.data?.url || '/' },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  } catch (e) {
    // ignore
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(clients.openWindow(url))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/api/') || url.pathname.includes('socket')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ success: false, error: 'OFFLINE' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
    return
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone())
        return response
      })
    }))
  )
})
