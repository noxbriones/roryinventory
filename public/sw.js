// Use a versioned cache name that changes on each deployment
// Increment this version when deploying new builds to force cache refresh
const CACHE_NAME = 'rory-inventory-v3'
const STATIC_CACHE_NAME = 'rory-inventory-static-v3'
const RUNTIME_CACHE_NAME = 'rory-inventory-runtime-v3'

// Maximum cache age in milliseconds (24 hours)
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000

// Maximum number of items in runtime cache
const MAX_RUNTIME_CACHE_SIZE = 50

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
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== RUNTIME_CACHE_NAME) {
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

// Helper function to limit cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    // Delete oldest entries
    await cache.delete(keys[0])
    await limitCacheSize(cacheName, maxItems)
  }
}

// Helper function to check if cached response is still fresh
function isCacheFresh(cachedResponse) {
  if (!cachedResponse) return false
  
  const cachedDate = cachedResponse.headers.get('date')
  if (!cachedDate) return true // If no date, assume it's fresh
  
  const cacheTime = new Date(cachedDate).getTime()
  const now = Date.now()
  return (now - cacheTime) < MAX_CACHE_AGE
}

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

  // Stale-while-revalidate strategy for HTML, JS, and CSS (fast + fresh)
  if (
    event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.url.match(/\.(js|css|html)$/)
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request)
        
        // Start fetch in background
        const fetchPromise = fetch(event.request)
          .then((response) => {
            // If network succeeds, update cache
            if (response && response.status === 200) {
              cache.put(event.request, response.clone())
            }
            return response
          })
          .catch(() => null)
        
        // Return cached response immediately if fresh, otherwise wait for network
        if (cachedResponse && isCacheFresh(cachedResponse)) {
          // Update cache in background
          fetchPromise.then(() => limitCacheSize(RUNTIME_CACHE_NAME, MAX_RUNTIME_CACHE_SIZE))
          return cachedResponse
        }
        
        // Wait for network response
        const networkResponse = await fetchPromise
        if (networkResponse) {
          await limitCacheSize(RUNTIME_CACHE_NAME, MAX_RUNTIME_CACHE_SIZE)
          return networkResponse
        }
        
        // Fallback to cache even if stale, or index.html
        return cachedResponse || cache.match('/index.html')
      })
    )
    return
  }

  // Cache-first strategy for static assets (images, fonts, etc.) with better performance
  event.respondWith(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request)
      
      if (cachedResponse) {
        // Return cached version immediately
        // Update in background if cache is old
        if (!isCacheFresh(cachedResponse)) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone())
            }
          }).catch(() => {
            // Network failed, that's okay, we have cache
          })
        }
        return cachedResponse
      }
      
      // Not in cache, fetch from network
      try {
        const networkResponse = await fetch(event.request)
        if (networkResponse && networkResponse.status === 200) {
          // Cache for future use
          cache.put(event.request, networkResponse.clone())
        }
        return networkResponse
      } catch (error) {
        // If both cache and network fail, return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return cache.match('/index.html')
        }
        throw error
      }
    })
  )
})

