/**
 * CONSTRUMETRIX - PERFORMANCE OPTIMIZER
 * Lazy loading, debouncing, and optimization utilities
 */

const PerformanceOptimizer = {
    /**
     * Debounce function calls
     */
    debounce(func, wait) {
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

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Lazy load images
     */
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    },

    /**
     * Measure performance
     */
    measurePerformance(label, callback) {
        const start = performance.now();
        const result = callback();
        const end = performance.now();
        console.log(`⚡ [Performance] ${label}: ${(end - start).toFixed(2)}ms`);
        return result;
    },

    /**
     * Request Idle Callback wrapper
     */
    runWhenIdle(callback) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback);
        } else {
            setTimeout(callback, 1);
        }
    },

    /**
     * Batch DOM updates
     */
    batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    },

    /**
     * Memory usage monitor
     */
    logMemoryUsage() {
        if (performance.memory) {
            const used = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
            const total = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
            console.log(`💾 Memory: ${used}MB / ${total}MB`);
        }
    },

    /**
     * Preload critical resources
     */
    preloadResources(urls) {
        urls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = url.endsWith('.js') ? 'script' : url.endsWith('.css') ? 'style' : 'fetch';
            link.href = url;
            document.head.appendChild(link);
        });
    },

    /**
     * Virtual scroll helper
     */
    createVirtualScroll(container, items, renderItem, itemHeight = 50) {
        const totalHeight = items.length * itemHeight;
        const viewportHeight = container.clientHeight;
        const visibleCount = Math.ceil(viewportHeight / itemHeight) + 2;

        let scrollTop = 0;

        const render = () => {
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + visibleCount, items.length);

            container.innerHTML = '';
            const fragment = document.createDocumentFragment();

            for (let i = startIndex; i < endIndex; i++) {
                const item = renderItem(items[i], i);
                item.style.position = 'absolute';
                item.style.top = `${i * itemHeight}px`;
                fragment.appendChild(item);
            }

            container.appendChild(fragment);
        };

        container.addEventListener('scroll', this.throttle(() => {
            scrollTop = container.scrollTop;
            render();
        }, 16)); // 60fps

        render();
    }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.PerformanceOptimizer = PerformanceOptimizer;
}
