// Use a versioned cache name that changes on each deployment
// Increment this version when deploying new builds to force cache refresh
const CACHE_NAME = 'rory-inventory-v2'
const STATIC_CACHE_NAME = 'rory-inventory-static-v2'

const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo.png',
  '/logo-white.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('Cache install failed:', error)
      })
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim()
    })
  )
})

// Fetch event - network first for dynamic content, cache for static assets
self.addEventListener('fetch', (event) => {
  // Skip caching for Google APIs and external resources
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('accounts.google.com') ||
    event.request.url.includes('apis.google.com')
  ) {
    return // Let these requests go through normally
  }

  // Network-first strategy for HTML and JS files (always get fresh content)
  if (
    event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.url.match(/\.(js|css|html)$/)
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network succeeds, update cache and return response
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then((response) => {
            return response || caches.match('/index.html')
          })
        })
    )
    return
  }

  // Cache-first strategy for static assets (images, fonts, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Return cached version, but also update in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache)
              })
            }
          }).catch(() => {
            // Network failed, that's okay, we have cache
          })
          return response
        }
        
        // Not in cache, fetch from network
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
      })
      .catch(() => {
        // If both cache and network fail, return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
      })
  )
})

