/**
 * Lazy Loading System
 * 
 * Implements intelligent lazy loading for non-critical JavaScript modules
 * and assets to improve initial page load performance.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Performance Optimization
 */

class LazyLoader {
    constructor() {
        this.loadedModules = new Set();
        this.loadingModules = new Map();
        this.moduleRegistry = new Map();
        this.intersectionObserver = null;
        this.idleCallback = null;
        this.loadQueue = [];
        this.isIdle = false;
        
        this.init();
    }
    
    /**
     * Initialize lazy loading system
     */
    init() {
        this.setupIntersectionObserver();
        this.setupIdleCallback();
        this.registerCoreModules();
        this.startIdleLoading();
        
        console.log('🚀 LazyLoader: Lazy loading system initialized');
    }
    
    /**
     * Setup intersection observer for viewport-based loading
     */
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const moduleId = element.dataset.lazyModule;
                        
                        if (moduleId) {
                            this.loadModule(moduleId);
                            this.intersectionObserver.unobserve(element);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
        }
    }
    
    /**
     * Setup idle callback for background loading
     */
    setupIdleCallback() {
        if ('requestIdleCallback' in window) {
            this.scheduleIdleWork();
        } else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => this.processIdleQueue(), 100);
        }
    }
    
    /**
     * Schedule idle work
     */
    scheduleIdleWork() {
        requestIdleCallback((deadline) => {
            this.isIdle = true;
            this.processIdleQueue(deadline);
            
            // Schedule next idle work
            this.scheduleIdleWork();
        });
    }
    
    /**
     * Process idle loading queue
     */
    processIdleQueue(deadline = null) {
        while (this.loadQueue.length > 0 && (!deadline || deadline.timeRemaining() > 5)) {
            const moduleId = this.loadQueue.shift();
            this.loadModule(moduleId, { priority: 'idle' });
        }
    }
    
    /**
     * Register core modules for lazy loading
     */
    registerCoreModules() {
        // Non-critical modules that can be loaded lazily
        this.registerModule('css-variables-debug', {
            src: window.masV2?.assetUrl + '/assets/js/css-variables-debug-dashboard.js',
            dependencies: [],
            condition: () => window.masV2Debug || window.location.search.includes('debug=true'),
            priority: 'low'
        });
        
        this.registerModule('performance-dashboard', {
            src: window.masV2?.assetUrl + '/assets/js/performance-dashboard.js',
            dependencies: ['performance-monitor'],
            condition: () => document.querySelector('[data-page="performance"]'),
            priority: 'medium'
        });
        
        this.registerModule('error-dashboard', {
            src: window.masV2?.assetUrl + '/assets/js/error-dashboard.js',
            dependencies: ['error-capture'],
            condition: () => document.querySelector('[data-page="error-dashboard"]'),
            priority: 'medium'
        });
        
        this.registerModule('advanced-settings', {
            src: window.masV2?.assetUrl + '/assets/js/advanced-settings.js',
            dependencies: ['unified-settings-manager'],
            condition: () => document.querySelector('.woow-advanced-settings'),
            priority: 'low'
        });
        
        this.registerModule('preset-manager', {
            src: window.masV2?.assetUrl + '/assets/js/preset-manager.js',
            dependencies: ['unified-settings-manager'],
            condition: () => document.querySelector('.woow-preset-manager'),
            priority: 'low'
        });
        
        this.registerModule('analytics-tracker', {
            src: window.masV2?.assetUrl + '/assets/js/analytics-tracker.js',
            dependencies: [],
            condition: () => window.masV2?.analytics?.enabled,
            priority: 'idle'
        });
    }
    
    /**
     * Register a module for lazy loading
     */
    registerModule(id, config) {
        this.moduleRegistry.set(id, {
            id: id,
            src: config.src,
            dependencies: config.dependencies || [],
            condition: config.condition || (() => true),
            priority: config.priority || 'medium',
            loaded: false,
            loading: false,
            element: null
        });
    }
    
    /**
     * Load a module lazily
     */
    async loadModule(moduleId, options = {}) {
        const module = this.moduleRegistry.get(moduleId);
        
        if (!module) {
            console.warn(`🚀 LazyLoader: Module '${moduleId}' not registered`);
            return false;
        }
        
        if (this.loadedModules.has(moduleId)) {
            console.log(`🚀 LazyLoader: Module '${moduleId}' already loaded`);
            return true;
        }
        
        if (this.loadingModules.has(moduleId)) {
            console.log(`🚀 LazyLoader: Module '${moduleId}' already loading`);
            return this.loadingModules.get(moduleId);
        }
        
        // Check condition
        if (!module.condition()) {
            console.log(`🚀 LazyLoader: Module '${moduleId}' condition not met`);
            return false;
        }
        
        // Load dependencies first
        if (module.dependencies.length > 0) {
            const dependencyPromises = module.dependencies.map(dep => this.loadModule(dep));
            await Promise.all(dependencyPromises);
        }
        
        // Start loading
        const loadPromise = this.loadScript(module.src, moduleId);
        this.loadingModules.set(moduleId, loadPromise);
        
        try {
            await loadPromise;
            this.loadedModules.add(moduleId);
            this.loadingModules.delete(moduleId);
            
            console.log(`🚀 LazyLoader: Module '${moduleId}' loaded successfully`);
            
            // Notify performance monitor
            if (window.performanceMonitor) {
                window.performanceMonitor.recordModuleLoad(moduleId, options.priority || 'medium');
            }
            
            return true;
            
        } catch (error) {
            this.loadingModules.delete(moduleId);
            console.error(`🚀 LazyLoader: Failed to load module '${moduleId}':`, error);
            
            // Report error to error capture system
            if (window.errorCapture) {
                window.errorCapture.reportError(`Module load failed: ${moduleId}`, {
                    moduleId: moduleId,
                    src: module.src,
                    error: error.message
                });
            }
            
            return false;
        }
    }
    
    /**
     * Load script dynamically
     */
    loadScript(src, moduleId) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.defer = true;
            script.dataset.lazyModule = moduleId;
            
            script.onload = () => {
                console.log(`🚀 LazyLoader: Script loaded: ${src}`);
                resolve();
            };
            
            script.onerror = () => {
                console.error(`🚀 LazyLoader: Script failed to load: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            
            // Add to head
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load CSS dynamically
     */
    loadCSS(href, moduleId) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.dataset.lazyModule = moduleId;
            
            link.onload = () => {
                console.log(`🚀 LazyLoader: CSS loaded: ${href}`);
                resolve();
            };
            
            link.onerror = () => {
                console.error(`🚀 LazyLoader: CSS failed to load: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };
            
            // Add to head
            document.head.appendChild(link);
        });
    }
    
    /**
     * Start idle loading of low-priority modules
     */
    startIdleLoading() {
        // Add low-priority and idle modules to queue
        for (const [moduleId, module] of this.moduleRegistry) {
            if (module.priority === 'low' || module.priority === 'idle') {
                if (module.condition()) {
                    this.loadQueue.push(moduleId);
                }
            }
        }
        
        console.log(`🚀 LazyLoader: ${this.loadQueue.length} modules queued for idle loading`);
    }
    
    /**
     * Observe element for lazy loading
     */
    observe(element, moduleId) {
        if (this.intersectionObserver && element) {
            element.dataset.lazyModule = moduleId;
            this.intersectionObserver.observe(element);
        }
    }
    
    /**
     * Load module when element becomes visible
     */
    loadOnVisible(selector, moduleId) {
        const element = document.querySelector(selector);
        if (element) {
            this.observe(element, moduleId);
        } else {
            // Element not found, try again later
            setTimeout(() => this.loadOnVisible(selector, moduleId), 1000);
        }
    }
    
    /**
     * Load module on user interaction
     */
    loadOnInteraction(selector, moduleId, events = ['click', 'touchstart']) {
        const element = document.querySelector(selector);
        if (element) {
            const loadHandler = () => {
                this.loadModule(moduleId);
                events.forEach(event => {
                    element.removeEventListener(event, loadHandler);
                });
            };
            
            events.forEach(event => {
                element.addEventListener(event, loadHandler, { once: true, passive: true });
            });
        }
    }
    
    /**
     * Preload module (download but don't execute)
     */
    preloadModule(moduleId) {
        const module = this.moduleRegistry.get(moduleId);
        if (!module) return;
        
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = module.src;
        link.as = 'script';
        link.dataset.preloadModule = moduleId;
        
        document.head.appendChild(link);
        console.log(`🚀 LazyLoader: Preloading module '${moduleId}'`);
    }
    
    /**
     * Get loading statistics
     */
    getStats() {
        return {
            totalModules: this.moduleRegistry.size,
            loadedModules: this.loadedModules.size,
            loadingModules: this.loadingModules.size,
            queuedModules: this.loadQueue.length,
            loadedModulesList: Array.from(this.loadedModules),
            loadingModulesList: Array.from(this.loadingModules.keys()),
            queuedModulesList: [...this.loadQueue]
        };
    }
    
    /**
     * Force load all modules (for testing)
     */
    async loadAll() {
        const promises = [];
        for (const moduleId of this.moduleRegistry.keys()) {
            promises.push(this.loadModule(moduleId));
        }
        
        const results = await Promise.allSettled(promises);
        console.log('🚀 LazyLoader: Load all results:', results);
        return results;
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        this.loadedModules.clear();
        this.loadingModules.clear();
        this.moduleRegistry.clear();
        this.loadQueue = [];
        
        console.log('🚀 LazyLoader: Destroyed');
    }
}

// Initialize lazy loader
window.lazyLoader = new LazyLoader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyLoader;
}