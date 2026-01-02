export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const basePath = import.meta.env.BASE_URL || '/'
      const swPath = `${basePath}sw.js`

      navigator.serviceWorker
        .register(swPath)
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)

          // Check for updates more frequently (every 5 minutes)
          setInterval(() => {
            registration.update()
          }, 5 * 60 * 1000) // Check every 5 minutes

          // Also check on page focus (when user returns to tab)
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              registration.update()
            }
          })

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('New service worker available, reloading...')
                  // Auto-reload after a short delay to allow user to see the change
                  setTimeout(() => {
                    window.location.reload()
                  }, 1000)
                } else if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                  // Service worker activated, reload to get new version
                  window.location.reload()
                }
              })
            }
          })

          // Listen for controller change (when new SW takes control)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed, reloading...')
            window.location.reload()
          })
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    })
  }
}

