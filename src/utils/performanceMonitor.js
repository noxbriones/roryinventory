/**
 * Performance monitoring utilities
 * Tracks key performance metrics for the application
 */

// Track page load performance
export const trackPageLoad = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  // Wait for page to fully load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      const connectTime = perfData.responseEnd - perfData.requestStart
      const renderTime = perfData.domComplete - perfData.domLoading
      const
DOMContentLoadedTime = perfData.domContentLoadedEventEnd - perfData.navigationStart

      console.log('Performance Metrics:', {
        pageLoadTime: `${pageLoadTime}ms`,
        connectTime: `${connectTime}ms`,
        renderTime: `${renderTime}ms`,
        DOMContentLoadedTime: `${DOMContentLoadedTime}ms`
      })

      // Report to analytics if available
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'page_load',
          value: pageLoadTime,
          event_category: 'Performance'
        })
      }
    }, 0)
  })
}

// Track component render performance
export const measureComponentRender = (componentName, fn) => {
  if (typeof window === 'undefined' || !window.performance) {
    return fn()
  }

  const startMark = `${componentName}-start`
  const endMark = `${componentName}-end`
  const measureName = `${componentName}-render`

  performance.mark(startMark)
  const result = fn()
  performance.mark(endMark)

  try {
    performance.measure(measureName, startMark, endMark)
    const measure = performance.getEntriesByName(measureName)[0]
    
    if (measure.duration > 16.67) { // Slower than 60fps
      console.warn(`Slow render detected in ${componentName}: ${measure.duration.toFixed(2)}ms`)
    }

    // Clean up marks
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
  } catch (e) {
    // Silently fail if performance API is not available
  }

  return result
}

// Track long tasks
export const observeLongTasks = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          console.warn('Long task detected:', {
            duration: `${entry.duration.toFixed(2)}ms`,
            startTime: entry.startTime
          })
        }
      }
    })

    observer.observe({ entryTypes: ['longtask'] })
  } catch (e) {
    // PerformanceObserver not supported or longtask not available
  }
}

// Get current performance metrics
export const getPerformanceMetrics = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const navigation = performance.getEntriesByType('navigation')[0]
  const paint = performance.getEntriesByType('paint')

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,
    
    // Paint timing
    firstPaint: paint?.find(entry => entry.name === 'first-paint')?.startTime,
    firstContentfulPaint: paint?.find(entry => entry.name === 'first-contentful-paint')?.startTime,
    
    // Resource timing
    resources: performance.getEntriesByType('resource').length
  }
}

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    trackPageLoad()
    observeLongTasks()
    
    // Log metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = getPerformanceMetrics()
        if (metrics) {
          console.log('Detailed Performance Metrics:', metrics)
        }
      }, 1000)
    })
  }
}
