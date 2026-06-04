const CACHE_NAME = 'spoton-wc26-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/Logo 192x192.png',
  '/Logo 512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Cache-first for static assets, network-first for API
  const url = new URL(event.request.url)

  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return // let network handle these
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((resp) => {
        if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp
        const clone = resp.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return resp
      })
    })
  )
})
