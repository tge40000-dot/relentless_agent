// PerformanceOptimizer.js - Performance Optimization Utilities
// CDN caching, image optimization, and performance monitoring

export const PerformanceOptimizer = {
  // CDN URL generator with caching headers
  getCdnUrl: (path, options = {}) => {
    const baseUrl = 'https://0a7be075f32d9d615349825b83ab8fcb.r2.cloudflarestorage.com/rbb';
    const url = `${baseUrl}${path}`;
    
    // Add cache busting for development
    if (options.cacheBust && process.env.NODE_ENV === 'development') {
      return `${url}?v=${Date.now()}`;
    }
    
    return url;
  },

  // Image optimization parameters
  optimizeImageUrl: (url, options = {}) => {
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width);
    if (options.height) params.append('height', options.height);
    if (options.quality) params.append('quality', options.quality);
    if (options.format) params.append('format', options.format);
    
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  },

  // Prefetch critical resources
  prefetchResource: (url, type = 'fetch') => {
    if (typeof document === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = type === 'image' ? 'prefetch' : 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  },

  // Preload critical resources
  preloadResource: (url, type = 'fetch', as = 'script') => {
    if (typeof document === 'undefined') return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    document.head.appendChild(link);
  },

  // Performance monitoring
  trackPerformance: (metricName, value) => {
    if (typeof window !== 'undefined' && window.performance) {
      const metric = {
        name: metricName,
        value: value,
        timestamp: Date.now()
      };
      
      // Send to analytics if available
      if (window.gtag) {
        window.gtag('event', 'performance_metric', metric);
      }
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance Metric:', metric);
      }
    }
  },

  // Measure page load time
  measurePageLoad: () => {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          PerformanceOptimizer.trackPerformance('page_load_time', perfData.loadEventEnd);
          PerformanceOptimizer.trackPerformance('dom_content_loaded', perfData.domContentLoadedEventEnd);
          PerformanceOptimizer.trackPerformance('first_paint', perfData.responseStart);
        }
      });
    }
  },

  // Debounce function for performance
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for performance
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Lazy load intersection observer
  createIntersectionObserver: (callback, options = {}) => {
    const defaultOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    return new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry);
          }
        });
      },
      { ...defaultOptions, ...options }
    );
  },

  // Request animation frame for smooth animations
  requestAnimationFrame: (callback) => {
    return window.requestAnimationFrame(callback);
  },

  // Cancel animation frame
  cancelAnimationFrame: (requestId) => {
    return window.cancelAnimationFrame(requestId);
  },

  // Memory management - cleanup unused resources
  cleanup: () => {
    if (typeof window !== 'undefined') {
      // Force garbage collection hint
      if (window.gc) {
        window.gc();
      }
    }
  },

  // Cache management
  setCacheItem: (key, value, ttl = 3600000) => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  getCacheItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      const now = Date.now();
      
      if (now - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  clearCache: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },

  // Service worker registration for offline support
  registerServiceWorker: async (swPath = '/sw.js') => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(swPath);
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  },

  // Critical CSS extraction
  extractCriticalCss: () => {
    // This would be used in a build process
    // Placeholder for critical CSS extraction logic
    return '';
  }
};

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  PerformanceOptimizer.measurePageLoad();
}

export default PerformanceOptimizer;
