/**
 * Memory Optimizer
 * 
 * Implements automatic memory cleanup and optimization for better performance
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Performance Optimization
 */

class MemoryOptimizer {
    constructor() {
        this.memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
        this.cleanupInterval = 30000; // 30 seconds
        this.monitoringInterval = 5000; // 5 seconds
        this.isMonitoring = false;
        this.cleanupTasks = new Set();
        this.memoryHistory = [];
        this.maxHistorySize = 100;
        
        this.init();
    }
    
    /**
     * Initialize memory optimizer
     */
    init() {
        this.startMonitoring();
        this.registerCleanupTasks();
        this.setupPeriodicCleanup();
        this.setupPageUnloadCleanup();
        
        console.log('🧹 MemoryOptimizer: Memory optimization system initialized');
    }
    
    /**
     * Start memory monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        setInterval(() => {
            this.checkMemoryUsage();
        }, this.monitoringInterval);
        
        console.log('🧹 MemoryOptimizer: Memory monitoring started');
    }
    
    /**
     * Check current memory usage
     */
    checkMemoryUsage() {
        if (!performance.memory) {
            return null;
        }
        
        const memoryInfo = {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
            timestamp: Date.now(),
            percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        };
        
        // Add to history
        this.memoryHistory.push(memoryInfo);
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }
        
        // Check if cleanup is needed
        if (memoryInfo.used > this.memoryThreshold || memoryInfo.percentage > 80) {
            console.warn('🧹 MemoryOptimizer: High memory usage detected', memoryInfo);
            this.performCleanup('high_memory');
        }
        
        // Report to performance monitor
        if (window.performanceMonitor) {
            window.performanceMonitor.recordMemoryUsage(memoryInfo);
        }
        
        return memoryInfo;
    }
    
    /**
     * Register cleanup tasks
     */
    registerCleanupTasks() {
        // DOM cleanup
        this.registerCleanupTask('dom_cleanup', () => {
            this.cleanupDOMElements();
        }, 'medium');
        
        // Event listener cleanup
        this.registerCleanupTask('event_cleanup', () => {
            this.cleanupEventListeners();
        }, 'high');
        
        // Cache cleanup
        this.registerCleanupTask('cache_cleanup', () => {
            this.cleanupCaches();
        }, 'medium');
        
        // Timer cleanup
        this.registerCleanupTask('timer_cleanup', () => {
            this.cleanupTimers();
        }, 'high');
        
        // Variable cleanup
        this.registerCleanupTask('variable_cleanup', () => {
            this.cleanupVariables();
        }, 'low');
        
        // Image cleanup
        this.registerCleanupTask('image_cleanup', () => {
            this.cleanupImages();
        }, 'low');
        
        console.log(`🧹 MemoryOptimizer: ${this.cleanupTasks.size} cleanup tasks registered`);
    }
    
    /**
     * Register a cleanup task
     */
    registerCleanupTask(id, task, priority = 'medium') {
        this.cleanupTasks.add({
            id: id,
            task: task,
            priority: priority,
            lastRun: 0,
            runCount: 0
        });
    }
    
    /**
     * Setup periodic cleanup
     */
    setupPeriodicCleanup() {
        setInterval(() => {
            this.performCleanup('periodic');
        }, this.cleanupInterval);
        
        console.log('🧹 MemoryOptimizer: Periodic cleanup scheduled');
    }
    
    /**
     * Setup page unload cleanup
     */
    setupPageUnloadCleanup() {
        window.addEventListener('beforeunload', () => {
            this.performCleanup('page_unload');
        });
        
        window.addEventListener('pagehide', () => {
            this.performCleanup('page_hide');
        });
    }
    
    /**
     * Perform memory cleanup
     */
    performCleanup(trigger = 'manual') {
        const startTime = performance.now();
        const memoryBefore = this.getCurrentMemoryUsage();
        
        console.log(`🧹 MemoryOptimizer: Starting cleanup (trigger: ${trigger})`);
        
        let tasksRun = 0;
        
        // Sort tasks by priority
        const sortedTasks = Array.from(this.cleanupTasks).sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });
        
        // Run cleanup tasks
        for (const taskInfo of sortedTasks) {
            try {
                taskInfo.task();
                taskInfo.lastRun = Date.now();
                taskInfo.runCount++;
                tasksRun++;
            } catch (error) {
                console.error(`🧹 MemoryOptimizer: Cleanup task '${taskInfo.id}' failed:`, error);
                
                // Report error to error capture system
                if (window.errorCapture) {
                    window.errorCapture.reportError(`Memory cleanup task failed: ${taskInfo.id}`, {
                        taskId: taskInfo.id,
                        trigger: trigger,
                        error: error.message
                    });
                }
            }
        }
        
        // Force garbage collection if available
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
                console.log('🧹 MemoryOptimizer: Forced garbage collection');
            } catch (error) {
                console.warn('🧹 MemoryOptimizer: Garbage collection failed:', error);
            }
        }
        
        const endTime = performance.now();
        const memoryAfter = this.getCurrentMemoryUsage();
        const cleanupTime = endTime - startTime;
        
        const memoryFreed = memoryBefore ? (memoryBefore.used - (memoryAfter?.used || 0)) : 0;
        
        console.log(`🧹 MemoryOptimizer: Cleanup completed`, {
            trigger: trigger,
            tasksRun: tasksRun,
            cleanupTime: cleanupTime.toFixed(2) + 'ms',
            memoryFreed: this.formatBytes(memoryFreed),
            memoryBefore: memoryBefore ? this.formatBytes(memoryBefore.used) : 'unknown',
            memoryAfter: memoryAfter ? this.formatBytes(memoryAfter.used) : 'unknown'
        });
        
        // Report to performance monitor
        if (window.performanceMonitor) {
            window.performanceMonitor.recordCleanup({
                trigger: trigger,
                tasksRun: tasksRun,
                cleanupTime: cleanupTime,
                memoryFreed: memoryFreed
            });
        }
        
        return {
            tasksRun: tasksRun,
            cleanupTime: cleanupTime,
            memoryFreed: memoryFreed
        };
    }
    
    /**
     * Cleanup DOM elements
     */
    cleanupDOMElements() {
        let cleaned = 0;
        
        // Remove orphaned elements
        const orphanedElements = document.querySelectorAll('[data-cleanup="true"], .woow-temp, .mas-temp');
        orphanedElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
                cleaned++;
            }
        });
        
        // Clean up empty text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    return node.nodeValue.trim() === '' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        const emptyTextNodes = [];
        let node;
        while (node = walker.nextNode()) {
            emptyTextNodes.push(node);
        }
        
        emptyTextNodes.forEach(textNode => {
            if (textNode.parentNode) {
                textNode.parentNode.removeChild(textNode);
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 MemoryOptimizer: Cleaned ${cleaned} DOM elements`);
        }
    }
    
    /**
     * Cleanup event listeners
     */
    cleanupEventListeners() {
        // This is a placeholder - actual implementation would need to track listeners
        // For now, we'll clean up known temporary listeners
        
        const tempElements = document.querySelectorAll('[data-temp-listener="true"]');
        tempElements.forEach(element => {
            // Clone and replace to remove all event listeners
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
        });
        
        if (tempElements.length > 0) {
            console.log(`🧹 MemoryOptimizer: Cleaned event listeners from ${tempElements.length} elements`);
        }
    }
    
    /**
     * Cleanup caches
     */
    cleanupCaches() {
        let cleaned = 0;
        
        // Clean up Live Edit cache if available
        if (window.liveEditInstance && window.liveEditInstance.settingsCache) {
            const cacheSize = window.liveEditInstance.settingsCache.size;
            if (cacheSize > 100) { // Only clean if cache is large
                const entries = Array.from(window.liveEditInstance.settingsCache.entries());
                const keepEntries = entries.slice(-50); // Keep last 50 entries
                
                window.liveEditInstance.settingsCache.clear();
                keepEntries.forEach(([key, value]) => {
                    window.liveEditInstance.settingsCache.set(key, value);
                });
                
                cleaned += cacheSize - keepEntries.length;
            }
        }
        
        // Clean up error capture queue if available
        if (window.errorCapture && window.errorCapture.errorQueue) {
            const queueSize = window.errorCapture.errorQueue.length;
            if (queueSize > 20) { // Only clean if queue is large
                window.errorCapture.errorQueue = window.errorCapture.errorQueue.slice(-10);
                cleaned += queueSize - 10;
            }
        }
        
        // Clean up performance monitor history if available
        if (window.performanceMonitor && window.performanceMonitor.metrics) {
            const metricsSize = window.performanceMonitor.metrics.length;
            if (metricsSize > 100) {
                window.performanceMonitor.metrics = window.performanceMonitor.metrics.slice(-50);
                cleaned += metricsSize - 50;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 MemoryOptimizer: Cleaned ${cleaned} cache entries`);
        }
    }
    
    /**
     * Cleanup timers
     */
    cleanupTimers() {
        // This is a placeholder - actual implementation would need to track timers
        // For now, we'll clear any timers stored in global variables
        
        let cleaned = 0;
        
        // Check for common timer variables
        const timerVars = ['debounceTimer', 'throttleTimer', 'cleanupTimer', 'monitorTimer'];
        
        timerVars.forEach(varName => {
            if (window[varName]) {
                clearTimeout(window[varName]);
                clearInterval(window[varName]);
                window[varName] = null;
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 MemoryOptimizer: Cleaned ${cleaned} timers`);
        }
    }
    
    /**
     * Cleanup variables
     */
    cleanupVariables() {
        // Clean up temporary global variables
        const tempVars = Object.keys(window).filter(key => 
            key.startsWith('temp_') || 
            key.startsWith('_temp') || 
            key.includes('temporary')
        );
        
        tempVars.forEach(varName => {
            try {
                delete window[varName];
            } catch (error) {
                window[varName] = null;
            }
        });
        
        if (tempVars.length > 0) {
            console.log(`🧹 MemoryOptimizer: Cleaned ${tempVars.length} temporary variables`);
        }
    }
    
    /**
     * Cleanup images
     */
    cleanupImages() {
        let cleaned = 0;
        
        // Find images that are no longer visible or needed
        const images = document.querySelectorAll('img[data-cleanup-eligible="true"]');
        
        images.forEach(img => {
            // Check if image is outside viewport and not needed
            const rect = img.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (!isVisible && img.dataset.cleanupEligible === 'true') {
                // Clear the src to free memory
                img.src = '';
                img.srcset = '';
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 MemoryOptimizer: Cleaned ${cleaned} images`);
        }
    }
    
    /**
     * Get current memory usage
     */
    getCurrentMemoryUsage() {
        if (!performance.memory) {
            return null;
        }
        
        return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        };
    }
    
    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Get memory statistics
     */
    getStats() {
        const currentMemory = this.getCurrentMemoryUsage();
        
        return {
            currentMemory: currentMemory,
            memoryHistory: this.memoryHistory.slice(-10), // Last 10 entries
            cleanupTasks: Array.from(this.cleanupTasks).map(task => ({
                id: task.id,
                priority: task.priority,
                lastRun: task.lastRun,
                runCount: task.runCount
            })),
            thresholds: {
                memoryThreshold: this.memoryThreshold,
                cleanupInterval: this.cleanupInterval,
                monitoringInterval: this.monitoringInterval
            },
            isMonitoring: this.isMonitoring
        };
    }
    
    /**
     * Force cleanup
     */
    forceCleanup() {
        return this.performCleanup('manual');
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        console.log('🧹 MemoryOptimizer: Memory monitoring stopped');
    }
    
    /**
     * Destroy optimizer
     */
    destroy() {
        this.stopMonitoring();
        this.performCleanup('destroy');
        this.cleanupTasks.clear();
        this.memoryHistory = [];
        
        console.log('🧹 MemoryOptimizer: Destroyed');
    }
}

// Initialize memory optimizer
window.memoryOptimizer = new MemoryOptimizer();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryOptimizer;
}