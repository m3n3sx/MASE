/**
 * 🚀 Enhanced CSS Variable Mapper - High-Performance Mapping System
 * 
 * Performance-optimized mapper that uses the centralized mapping configuration:
 * - O(1) lookup performance with Map-based data structures
 * - LRU cache for frequently accessed mappings
 * - Batch processing for DOM updates to minimize reflow/repaint
 * - Debounced updates for multiple variable changes
 * - Memory-efficient with automatic cleanup
 * 
 * @package ModernAdminStyler
 * @version 2.0.0 - Enhanced Performance
 */

(function(window, document) {
    'use strict';

    /**
     * 🗄️ LRU Cache Implementation for Performance
     */
    class LRUCache {
        constructor(maxSize = 1000) {
            this.maxSize = maxSize;
            this.cache = new Map();
        }

        get(key) {
            if (this.cache.has(key)) {
                // Move to end (most recently used)
                const value = this.cache.get(key);
                this.cache.delete(key);
                this.cache.set(key, value);
                return value;
            }
            return null;
        }

        set(key, value) {
            if (this.cache.has(key)) {
                this.cache.delete(key);
            } else if (this.cache.size >= this.maxSize) {
                // Remove least recently used (first item)
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            this.cache.set(key, value);
        }

        has(key) {
            return this.cache.has(key);
        }

        clear() {
            this.cache.clear();
        }

        size() {
            return this.cache.size;
        }

        getStats() {
            return {
                size: this.cache.size,
                maxSize: this.maxSize,
                utilization: Math.round((this.cache.size / this.maxSize) * 100)
            };
        }
    }

    /**
     * 🚀 Enhanced CSS Variable Mapper - Main Class
     */
    class EnhancedCSSVariableMapper {
        constructor(options = {}) {
            // Performance configuration
            this.cacheSize = options.cacheSize || 1000;
            this.batchSize = options.batchSize || 50;
            this.debounceDelay = options.debounceDelay || 16; // One frame at 60fps
            this.enableProfiling = options.enableProfiling || false;
            
            // Core data structures (optimized for O(1) lookups)
            this.cssVariableMappings = new Map();
            this.bodyClassMappings = new Map();
            this.visibilityMappings = new Map();
            this.specialHandlers = new Map();
            
            // Performance optimizations
            this.lookupCache = new LRUCache(this.cacheSize);
            this.transformCache = new LRUCache(this.cacheSize);
            this.batchQueue = [];
            this.batchTimeout = null;
            this.debounceTimeouts = new Map();
            
            // Performance metrics
            this.metrics = {
                lookups: 0,
                cacheHits: 0,
                cacheMisses: 0,
                batchUpdates: 0,
                totalApplications: 0,
                averageApplicationTime: 0,
                lastResetTime: Date.now()
            };
            
            // Debug mode
            this.debugMode = window.masV2Debug || false;
            
            // Initialize mappings
            this.initializeMappings();
            
            // Setup performance monitoring
            if (this.enableProfiling) {
                this.setupPerformanceMonitoring();
            }
            
            this.log('Enhanced CSS Variable Mapper initialized', {
                cacheSize: this.cacheSize,
                batchSize: this.batchSize,
                mappings: this.cssVariableMappings.size
            });
        }

        /**
         * 🗺️ Initialize mappings from centralized configuration
         */
        initializeMappings() {
            const startTime = performance.now();

            // Load CSS variable mappings
            if (window.CSS_VARIABLE_MAP) {
                Object.entries(window.CSS_VARIABLE_MAP).forEach(([optionId, mapping]) => {
                    this.cssVariableMappings.set(optionId, {
                        cssVar: mapping.cssVar,
                        type: mapping.type,
                        unit: mapping.unit || '',
                        fallback: mapping.fallback,
                        category: mapping.category,
                        description: mapping.description,
                        aliases: mapping.aliases || [],
                        deprecated: mapping.deprecated || false
                    });

                    // Add aliases
                    if (mapping.aliases) {
                        mapping.aliases.forEach(alias => {
                            this.cssVariableMappings.set(alias, this.cssVariableMappings.get(optionId));
                        });
                    }
                });
            }

            // Load body class mappings
            if (window.BODY_CLASS_MAP) {
                Object.entries(window.BODY_CLASS_MAP).forEach(([optionId, className]) => {
                    this.bodyClassMappings.set(optionId, className);
                });
            }

            // Load visibility mappings
            if (window.VISIBILITY_MAP) {
                Object.entries(window.VISIBILITY_MAP).forEach(([optionId, selector]) => {
                    this.visibilityMappings.set(optionId, selector);
                });
            }

            // Load special handlers
            if (window.SPECIAL_HANDLERS_MAP) {
                Object.entries(window.SPECIAL_HANDLERS_MAP).forEach(([optionId, handlerName]) => {
                    if (typeof this[handlerName] === 'function') {
                        this.specialHandlers.set(optionId, this[handlerName].bind(this));
                    }
                });
            }

            const endTime = performance.now();
            this.log(`Mappings initialized in ${(endTime - startTime).toFixed(2)}ms`, {
                cssVariables: this.cssVariableMappings.size,
                bodyClasses: this.bodyClassMappings.size,
                visibility: this.visibilityMappings.size,
                specialHandlers: this.specialHandlers.size
            });
        }

        /**
         * 🔍 Get CSS variable name for option ID (O(1) with caching + migration support)
         */
        getCSSVariable(optionId, element = null) {
            this.metrics.lookups++;

            // Check cache first
            const cacheKey = `css_var_${optionId}`;
            if (this.lookupCache.has(cacheKey)) {
                this.metrics.cacheHits++;
                return this.lookupCache.get(cacheKey);
            }

            this.metrics.cacheMisses++;

            // Use migration system if available for backward compatibility
            if (window.cssVariableMigrationManager) {
                const migrationResult = window.cssVariableMigrationManager.getCSSVariableWithFallback(
                    optionId, 
                    element, 
                    { source: 'enhanced_mapper' }
                );
                
                if (migrationResult && migrationResult.cssVar) {
                    this.lookupCache.set(cacheKey, migrationResult.cssVar);
                    
                    // Log migration activity
                    if (migrationResult.migrationNeeded) {
                        this.log(`Migration compatibility used for ${optionId}: ${migrationResult.source}`);
                    }
                    
                    return migrationResult.cssVar;
                }
            }

            // Look up in mappings (original logic)
            const mapping = this.cssVariableMappings.get(optionId);
            if (mapping) {
                const cssVar = mapping.cssVar;
                this.lookupCache.set(cacheKey, cssVar);
                return cssVar;
            }

            // Generate fallback and cache it
            const fallbackVar = this.generateFallbackCSSVar(optionId);
            this.lookupCache.set(cacheKey, fallbackVar);
            this.logWarning(`No mapping found for ${optionId}, using fallback: ${fallbackVar}`);
            
            return fallbackVar;
        }

        /**
         * 🔄 Transform value based on type and unit (cached)
         */
        transformValue(optionId, value) {
            const cacheKey = `transform_${optionId}_${value}`;
            
            // Check transform cache
            if (this.transformCache.has(cacheKey)) {
                return this.transformCache.get(cacheKey);
            }

            const mapping = this.cssVariableMappings.get(optionId);
            if (!mapping) {
                // Return value as-is for unmapped options
                this.transformCache.set(cacheKey, value);
                return value;
            }

            let transformedValue;
            
            try {
                switch (mapping.type) {
                    case 'boolean':
                        transformedValue = value ? '1' : '0';
                        break;
                        
                    case 'numeric':
                        const numValue = parseFloat(value);
                        if (isNaN(numValue)) {
                            throw new Error(`Invalid numeric value: ${value}`);
                        }
                        transformedValue = numValue + (mapping.unit || '');
                        break;
                        
                    case 'color':
                        if (typeof value === 'string' && this.isValidColor(value)) {
                            transformedValue = value;
                        } else {
                            throw new Error(`Invalid color value: ${value}`);
                        }
                        break;
                        
                    case 'string':
                    default:
                        transformedValue = String(value);
                        break;
                }
            } catch (error) {
                this.logError(`Value transformation failed for ${optionId}:`, error);
                transformedValue = mapping.fallback || value;
            }

            // Cache the result
            this.transformCache.set(cacheKey, transformedValue);
            return transformedValue;
        }

        /**
         * 🎯 Apply option with all mapping types (high-performance)
         */
        async applyOption(optionId, value, options = {}) {
            const startTime = performance.now();
            const immediate = options.immediate || false;
            const skipBatch = options.skipBatch || false;

            try {
                let applied = false;
                const operations = [];

                // Prepare CSS variable operation
                if (this.cssVariableMappings.has(optionId)) {
                    const cssVar = this.getCSSVariable(optionId);
                    const transformedValue = this.transformValue(optionId, value);
                    
                    operations.push({
                        type: 'css-variable',
                        cssVar,
                        value: transformedValue,
                        optionId
                    });
                    applied = true;
                }

                // Prepare body class operation
                if (this.bodyClassMappings.has(optionId)) {
                    const className = this.bodyClassMappings.get(optionId);
                    operations.push({
                        type: 'body-class',
                        className,
                        value: !!value,
                        optionId
                    });
                    applied = true;
                }

                // Prepare visibility operation
                if (this.visibilityMappings.has(optionId)) {
                    const selector = this.visibilityMappings.get(optionId);
                    operations.push({
                        type: 'visibility',
                        selector,
                        value: !!value,
                        optionId
                    });
                    applied = true;
                }

                // Handle special cases immediately
                if (this.specialHandlers.has(optionId)) {
                    const handler = this.specialHandlers.get(optionId);
                    await handler(value);
                    applied = true;
                }

                // Apply operations
                if (operations.length > 0) {
                    if (immediate || skipBatch) {
                        await this.applyOperationsImmediate(operations);
                    } else {
                        this.queueOperations(operations);
                    }
                }

                // Update metrics
                const endTime = performance.now();
                const duration = endTime - startTime;
                this.updatePerformanceMetrics(duration);

                if (!applied) {
                    this.logWarning(`No mappings found for option: ${optionId}`);
                }

                return applied;

            } catch (error) {
                this.logError(`Failed to apply option ${optionId}:`, error);
                return false;
            }
        }

        /**
         * 📦 Queue operations for batch processing
         */
        queueOperations(operations) {
            this.batchQueue.push(...operations);

            // Clear existing timeout
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
            }

            // Set new timeout for batch processing
            this.batchTimeout = setTimeout(() => {
                this.processBatchQueue();
            }, this.debounceDelay);
        }

        /**
         * ⚡ Process batch queue (optimized for performance)
         */
        async processBatchQueue() {
            if (this.batchQueue.length === 0) return;

            const startTime = performance.now();
            const operations = [...this.batchQueue];
            this.batchQueue = [];
            this.batchTimeout = null;

            try {
                // Group operations by type for efficient processing
                const cssVariableOps = operations.filter(op => op.type === 'css-variable');
                const bodyClassOps = operations.filter(op => op.type === 'body-class');
                const visibilityOps = operations.filter(op => op.type === 'visibility');

                // Use requestAnimationFrame for DOM updates to avoid layout thrashing
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        // Apply CSS variables in batch
                        if (cssVariableOps.length > 0) {
                            this.applyCSSVariablesBatch(cssVariableOps);
                        }

                        // Apply body classes in batch
                        if (bodyClassOps.length > 0) {
                            this.applyBodyClassesBatch(bodyClassOps);
                        }

                        // Apply visibility changes in batch
                        if (visibilityOps.length > 0) {
                            this.applyVisibilityBatch(visibilityOps);
                        }

                        resolve();
                    });
                });

                this.metrics.batchUpdates++;
                const endTime = performance.now();
                this.log(`Batch processed ${operations.length} operations in ${(endTime - startTime).toFixed(2)}ms`);

            } catch (error) {
                this.logError('Batch processing failed:', error);
            }
        }

        /**
         * 🎨 Apply CSS variables in batch (optimized)
         */
        applyCSSVariablesBatch(operations) {
            const documentStyle = document.documentElement.style;
            const bodyStyle = document.body.style;

            // Batch DOM style updates
            operations.forEach(op => {
                documentStyle.setProperty(op.cssVar, op.value);
                bodyStyle.setProperty(op.cssVar, op.value, 'important');
            });

            this.log(`Applied ${operations.length} CSS variables in batch`);
        }

        /**
         * 🏷️ Apply body classes in batch (optimized)
         */
        applyBodyClassesBatch(operations) {
            const classList = document.body.classList;

            // Batch class list updates
            operations.forEach(op => {
                if (op.value) {
                    classList.add(op.className);
                } else {
                    classList.remove(op.className);
                }
            });

            this.log(`Applied ${operations.length} body classes in batch`);
        }

        /**
         * 👁️ Apply visibility changes in batch (optimized)
         */
        applyVisibilityBatch(operations) {
            operations.forEach(op => {
                const elements = document.querySelectorAll(op.selector);
                elements.forEach(element => {
                    element.style.display = op.value ? 'none' : '';
                });
            });

            this.log(`Applied ${operations.length} visibility changes in batch`);
        }

        /**
         * ⚡ Apply operations immediately (for urgent updates)
         */
        async applyOperationsImmediate(operations) {
            const startTime = performance.now();

            operations.forEach(op => {
                switch (op.type) {
                    case 'css-variable':
                        document.documentElement.style.setProperty(op.cssVar, op.value);
                        document.body.style.setProperty(op.cssVar, op.value, 'important');
                        break;
                        
                    case 'body-class':
                        if (op.value) {
                            document.body.classList.add(op.className);
                        } else {
                            document.body.classList.remove(op.className);
                        }
                        break;
                        
                    case 'visibility':
                        const elements = document.querySelectorAll(op.selector);
                        elements.forEach(element => {
                            element.style.display = op.value ? 'none' : '';
                        });
                        break;
                }
            });

            const endTime = performance.now();
            this.log(`Applied ${operations.length} operations immediately in ${(endTime - startTime).toFixed(2)}ms`);
        }

        /**
         * 🔧 Generate fallback CSS variable name
         */
        generateFallbackCSSVar(optionId) {
            return `--woow-${optionId.replace(/_/g, '-')}`;
        }

        /**
         * 🎨 Validate color value
         */
        isValidColor(value) {
            if (typeof value !== 'string') return false;
            
            // Hex colors
            if (value.match(/^#[0-9A-Fa-f]{3,8}$/)) return true;
            
            // RGB/RGBA
            if (value.match(/^rgba?\(/)) return true;
            
            // HSL/HSLA
            if (value.match(/^hsla?\(/)) return true;
            
            // Named colors (basic check)
            if (value.match(/^[a-z]+$/i)) return true;
            
            return false;
        }

        /**
         * 📊 Update performance metrics
         */
        updatePerformanceMetrics(duration) {
            this.metrics.totalApplications++;
            
            // Calculate running average
            const currentAvg = this.metrics.averageApplicationTime;
            const newAvg = (currentAvg * (this.metrics.totalApplications - 1) + duration) / this.metrics.totalApplications;
            this.metrics.averageApplicationTime = newAvg;
        }

        /**
         * 📈 Get performance statistics
         */
        getPerformanceStats() {
            const now = Date.now();
            const uptime = now - this.metrics.lastResetTime;
            const cacheHitRate = this.metrics.lookups > 0 ? 
                (this.metrics.cacheHits / this.metrics.lookups * 100).toFixed(2) : 0;

            return {
                uptime: uptime,
                lookups: this.metrics.lookups,
                cacheHitRate: `${cacheHitRate}%`,
                cacheStats: this.lookupCache.getStats(),
                transformCacheStats: this.transformCache.getStats(),
                batchUpdates: this.metrics.batchUpdates,
                totalApplications: this.metrics.totalApplications,
                averageApplicationTime: `${this.metrics.averageApplicationTime.toFixed(2)}ms`,
                queueSize: this.batchQueue.length,
                mappingCounts: {
                    cssVariables: this.cssVariableMappings.size,
                    bodyClasses: this.bodyClassMappings.size,
                    visibility: this.visibilityMappings.size,
                    specialHandlers: this.specialHandlers.size
                }
            };
        }

        /**
         * 🧹 Clear caches and reset metrics
         */
        clearCaches() {
            this.lookupCache.clear();
            this.transformCache.clear();
            this.batchQueue = [];
            
            if (this.batchTimeout) {
                clearTimeout(this.batchTimeout);
                this.batchTimeout = null;
            }

            // Reset metrics
            this.metrics = {
                lookups: 0,
                cacheHits: 0,
                cacheMisses: 0,
                batchUpdates: 0,
                totalApplications: 0,
                averageApplicationTime: 0,
                lastResetTime: Date.now()
            };

            this.log('Caches cleared and metrics reset');
        }

        /**
         * 🔧 Setup performance monitoring
         */
        setupPerformanceMonitoring() {
            // Monitor memory usage
            if (window.performance && window.performance.memory) {
                setInterval(() => {
                    const memory = window.performance.memory;
                    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                        this.logWarning('High memory usage detected, clearing caches');
                        this.clearCaches();
                    }
                }, 30000); // Check every 30 seconds
            }

            // Monitor cache efficiency
            setInterval(() => {
                const stats = this.getPerformanceStats();
                if (parseFloat(stats.cacheHitRate) < 70) {
                    this.logWarning(`Low cache hit rate: ${stats.cacheHitRate}`);
                }
            }, 60000); // Check every minute
        }

        // ========================================
        // 🔧 SPECIAL CASE HANDLERS
        // ========================================

        /**
         * 🎨 Handle color scheme changes
         */
        handleColorScheme(value) {
            // Remove existing scheme classes
            document.body.classList.forEach(cls => {
                if (cls.startsWith('woow-color-scheme-')) {
                    document.body.classList.remove(cls);
                }
            });
            
            // Add new scheme class
            document.body.classList.add(`woow-color-scheme-${value}`);
            
            // Update data attribute
            document.documentElement.setAttribute('data-theme', value);
            
            // Store in localStorage for persistence
            localStorage.setItem('woow-theme', value);
            
            this.log(`Color scheme changed to: ${value}`);
        }

        /**
         * 🎯 Handle admin bar background (force application)
         */
        handleAdminBarBackground(value) {
            const adminBar = document.querySelector('#wpadminbar');
            if (adminBar) {
                adminBar.style.setProperty('background-color', value, 'important');
                adminBar.style.setProperty('background', value, 'important');
            }
            
            this.log(`Admin bar background forced to: ${value}`);
        }

        /**
         * 📏 Handle menu width changes
         */
        handleMenuWidth(value) {
            const menu = document.querySelector('#adminmenuwrap');
            if (menu) {
                menu.style.setProperty('width', value + 'px', 'important');
            }
            
            // Also update content margin
            const content = document.querySelector('#wpcontent');
            if (content) {
                content.style.setProperty('margin-left', value + 'px', 'important');
            }
            
            this.log(`Menu width changed to: ${value}px`);
        }

        /**
         * 🌙 Handle theme mode changes
         */
        handleThemeMode(value) {
            const modes = ['light', 'dark', 'auto'];
            if (!modes.includes(value)) {
                this.logWarning(`Invalid theme mode: ${value}`);
                return;
            }

            // Remove existing mode classes
            modes.forEach(mode => {
                document.body.classList.remove(`woow-theme-${mode}`);
            });

            // Add new mode class
            document.body.classList.add(`woow-theme-${value}`);

            // Handle auto mode
            if (value === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.body.classList.toggle('woow-theme-dark', prefersDark);
            }

            this.log(`Theme mode changed to: ${value}`);
        }

        // ========================================
        // 🛠️ DEV TOOLS SUPPORT METHODS
        // ========================================

        /**
         * Check if mapping exists for option ID
         */
        hasMapping(optionId) {
            return this.cssVariableMappings.has(optionId) || 
                   this.bodyClassMappings.has(optionId) || 
                   this.visibilityMappings.has(optionId) || 
                   this.specialHandlers.has(optionId);
        }

        /**
         * Get mapping details for option ID
         */
        getMapping(optionId) {
            if (this.cssVariableMappings.has(optionId)) {
                return this.cssVariableMappings.get(optionId);
            }
            return null;
        }

        /**
         * Get all mappings for dev tools inspection
         */
        getAllMappings() {
            const allMappings = {};
            
            // Convert Map to object for easier inspection
            this.cssVariableMappings.forEach((mapping, optionId) => {
                // Skip aliases to avoid duplicates
                if (!mapping.aliases || !mapping.aliases.includes(optionId)) {
                    allMappings[optionId] = mapping;
                }
            });
            
            return allMappings;
        }

        /**
         * Get cache statistics for dev tools
         */
        getCacheStats() {
            return {
                hits: this.metrics.cacheHits,
                misses: this.metrics.cacheMisses,
                lookupCache: this.lookupCache.getStats(),
                transformCache: this.transformCache.getStats()
            };
        }

        /**
         * Generate fallback CSS variable name (exposed for dev tools)
         */
        generateFallbackCSSVar(optionId) {
            return `--woow-${optionId.replace(/_/g, '-')}`;
        }

        /**
         * 📝 Logging utilities
         */
        log(message, ...args) {
            if (this.debugMode) {
                console.log(`🚀 EnhancedMapper: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ EnhancedMapper: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ EnhancedMapper: ${message}`, ...args);
        }
    }

    // Make EnhancedCSSVariableMapper globally available
    window.EnhancedCSSVariableMapper = EnhancedCSSVariableMapper;

    // Auto-initialize enhanced mapper when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Replace existing mapper with enhanced version
            window.cssVariableMapperInstance = new EnhancedCSSVariableMapper({
                cacheSize: 1000,
                batchSize: 50,
                debounceDelay: 16,
                enableProfiling: true
            });
            
            console.log('🚀 Enhanced CSS Variable Mapper initialized and ready');
        });
    } else {
        window.cssVariableMapperInstance = new EnhancedCSSVariableMapper({
            cacheSize: 1000,
            batchSize: 50,
            debounceDelay: 16,
            enableProfiling: true
        });
        
        console.log('🚀 Enhanced CSS Variable Mapper initialized and ready');
    }

})(window, document);