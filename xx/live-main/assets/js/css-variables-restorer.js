/**
 * CSS Variables Restoration System - Core Orchestrator
 * 
 * Provides immediate, flicker-free restoration of all --woow-* CSS variables
 * after page load with database primary source and localStorage fallback.
 * 
 * @version 1.0.0
 * @author WOOW Admin Styler
 */

class CSSVariablesRestorer {
    constructor() {
        // Initialize timing tracking
        this.restorationStartTime = null;
        this.isRestored = false;
        this.isInitialized = false;
        
        // Configuration
        this.databaseTimeout = 2000; // 2 seconds
        this.backgroundSyncDelay = 5000; // 5 seconds
        this.storageKey = 'woow_css_variables';
        this.maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        // State tracking
        this.appliedVariables = new Map();
        this.restorationState = {
            isComplete: false,
            source: null,
            variableCount: 0,
            duration: 0,
            errors: [],
            warnings: []
        };
        
        // Debug mode detection
        this.isDebugMode = this.detectDebugMode();
        this.logs = [];
        
        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.handleDatabaseFailure = this.handleDatabaseFailure.bind(this);
        this.scheduleBackgroundSync = this.scheduleBackgroundSync.bind(this);
    }

    /**
     * Main initialization method - coordinates entire restoration process
     * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1
     */
    async initialize() {
        if (this.isInitialized) {
            this.log('Restoration already initialized, skipping');
            return;
        }

        this.restorationStartTime = performance.now();
        this.isInitialized = true;
        
        this.log('Starting CSS variables restoration');
        
        try {
            // Step 1: Immediate application of cached values to prevent flickering (Req 1.1, 1.2)
            this.applyImmediateCache();
            
            // Step 2: Attempt database load with fallback (Req 2.1, 3.1)
            await this.restoreFromPrimarySource();
            
            // Step 3: Mark restoration as complete
            this.markRestorationComplete();
            
        } catch (error) {
            this.handleCriticalError(error);
        }
    }

    /**
     * Apply localStorage values immediately to prevent visual flickering
     * Requirements: 1.1, 1.2, 3.1
     */
    applyImmediateCache() {
        this.log('Applying immediate cache to prevent flickering');
        
        try {
            const cachedValues = this.getAllVariablesFromStorage();
            
            if (Object.keys(cachedValues).length > 0) {
                this.applyVariablesToDOM(cachedValues, 'localStorage-immediate');
                this.log('Applied immediate cache', { count: Object.keys(cachedValues).length });
            } else {
                // Apply default values if no cache available
                const defaultValues = this.getDefaultVariables();
                this.applyVariablesToDOM(defaultValues, 'defaults-immediate');
                this.log('Applied default values (no cache available)', { count: Object.keys(defaultValues).length });
            }
        } catch (error) {
            this.warn('Failed to apply immediate cache', error);
            // Fallback to defaults
            const defaultValues = this.getDefaultVariables();
            this.applyVariablesToDOM(defaultValues, 'defaults-fallback');
        }
    }

    /**
     * Attempt to restore from database with timeout and fallback
     * Requirements: 1.3, 1.4, 2.1, 3.1
     */
    async restoreFromPrimarySource() {
        this.log('Attempting database restoration');
        
        try {
            // Create database load promise with timeout (Req 1.3, 1.4)
            const databasePromise = this.loadFromDatabase();
            const timeoutPromise = this.createTimeout(this.databaseTimeout);
            
            const databaseValues = await Promise.race([databasePromise, timeoutPromise]);
            
            if (databaseValues && Object.keys(databaseValues).length > 0) {
                // Database load successful (Req 2.1)
                this.applyVariablesToDOM(databaseValues, 'database');
                this.updateLocalStorageCache(databaseValues);
                this.restorationState.source = 'database';
                this.log('Restored from database', { count: Object.keys(databaseValues).length });
            } else {
                throw new Error('Database returned empty or invalid data');
            }
            
        } catch (error) {
            this.handleDatabaseFailure(error);
        }
    }

    /**
     * Handle database loading failure with localStorage fallback
     * Requirements: 3.1
     */
    handleDatabaseFailure(error) {
        this.warn('Database load failed, using localStorage fallback', error);
        this.restorationState.errors.push(error.message || error.toString());
        
        try {
            const fallbackValues = this.getAllVariablesFromStorage();
            
            if (Object.keys(fallbackValues).length > 0) {
                // Values already applied in applyImmediateCache, just update state
                this.restorationState.source = 'localStorage';
                this.log('Using localStorage fallback', { count: Object.keys(fallbackValues).length });
            } else {
                // Apply default values
                const defaultValues = this.getDefaultVariables();
                this.applyVariablesToDOM(defaultValues, 'defaults');
                this.restorationState.source = 'defaults';
                this.log('Applied default values (localStorage empty)', { count: Object.keys(defaultValues).length });
            }
            
            // Schedule background sync to retry database connection
            this.scheduleBackgroundSync();
            
        } catch (fallbackError) {
            this.warn('localStorage fallback also failed', fallbackError);
            this.restorationState.errors.push(`Fallback error: ${fallbackError.message}`);
        }
    }

    /**
     * Schedule background sync for failed database loads
     * Requirements: 2.1, 3.1
     */
    scheduleBackgroundSync() {
        this.log(`Scheduling background sync in ${this.backgroundSyncDelay}ms`);
        
        setTimeout(async () => {
            try {
                this.log('Attempting background database sync');
                const freshData = await this.loadFromDatabase();
                
                if (freshData && Object.keys(freshData).length > 0) {
                    this.applyVariablesToDOM(freshData, 'background-sync');
                    this.updateLocalStorageCache(freshData);
                    this.log('Background sync successful', { count: Object.keys(freshData).length });
                } else {
                    this.warn('Background sync returned empty data');
                }
                
            } catch (error) {
                // Silent fail for background sync - don't disrupt user experience
                this.log('Background sync failed (silent)', error.message);
            }
        }, this.backgroundSyncDelay);
    }

    /**
     * Load CSS variables from WordPress database via AJAX
     * Requirements: 2.1
     */
    async loadFromDatabase() {
        // Check if WordPress AJAX is available
        if (!window.woowAdminStyler || !window.woowAdminStyler.ajaxUrl) {
            throw new Error('WordPress AJAX not available');
        }

        const formData = new FormData();
        formData.append('action', 'woow_load_css_variables');
        formData.append('nonce', window.woowAdminStyler.nonce || '');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.databaseTimeout);

        try {
            const response = await fetch(window.woowAdminStyler.ajaxUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
                credentials: 'same-origin'
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.data || 'Unknown database error');
            }

            return this.validateAndTransformData(data.data);
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Get all CSS variables from localStorage with validation
     * Requirements: 3.1
     */
    getAllVariablesFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return {};

            const parsed = JSON.parse(stored);
            
            // Check if data is expired
            if (this.isExpired(parsed.timestamp)) {
                this.clearStorageCache();
                return {};
            }

            return parsed.variables || {};
            
        } catch (error) {
            this.warn('localStorage read error', error);
            return {};
        }
    }

    /**
     * Update localStorage cache with fresh variables
     * Requirements: 3.1
     */
    updateLocalStorageCache(variables) {
        try {
            const cacheData = {
                variables,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
            this.log('Updated localStorage cache', { count: Object.keys(variables).length });
            
        } catch (error) {
            this.warn('localStorage write error', error);
        }
    }

    /**
     * Apply CSS variables to DOM with performance optimization
     * Requirements: 1.1, 1.2
     */
    applyVariablesToDOM(variables, source = 'unknown') {
        const startTime = performance.now();
        const documentStyle = document.documentElement.style;
        let appliedCount = 0;

        // Batch DOM updates for performance (Req 1.1, 1.2)
        for (const [cssVar, value] of Object.entries(variables)) {
            if (this.shouldApplyVariable(cssVar, value)) {
                documentStyle.setProperty(cssVar, value);
                this.appliedVariables.set(cssVar, { 
                    value, 
                    source, 
                    timestamp: Date.now() 
                });
                appliedCount++;
            }
        }

        const duration = performance.now() - startTime;
        this.restorationState.variableCount = appliedCount;
        
        this.log(`Applied ${appliedCount} CSS variables from ${source} in ${duration.toFixed(2)}ms`);
    }

    /**
     * Check if variable should be applied (performance optimization)
     */
    shouldApplyVariable(cssVar, value) {
        // Skip if value hasn't changed (performance optimization)
        const current = this.appliedVariables.get(cssVar);
        return !current || current.value !== value;
    }

    /**
     * Get default CSS variables
     */
    getDefaultVariables() {
        // Load from centralized mapping if available
        if (window.CSS_VARIABLE_MAP) {
            const defaults = {};
            for (const [optionId, mapping] of Object.entries(window.CSS_VARIABLE_MAP)) {
                if (mapping.cssVar && mapping.fallback) {
                    defaults[mapping.cssVar] = mapping.fallback;
                }
            }
            if (Object.keys(defaults).length > 0) {
                return defaults;
            }
        }
        
        // Fallback to hardcoded defaults
        return {
            '--woow-surface-bar': '#23282d',
            '--woow-surface-menu': '#ffffff',
            '--woow-surface-content': '#ffffff',
            '--woow-text-primary': '#1d2327',
            '--woow-text-secondary': '#646970',
            '--woow-accent-primary': '#2271b1',
            '--woow-accent-secondary': '#72aee6',
            '--woow-border-color': '#c3c4c7',
            '--woow-border-radius': '4px',
            '--woow-font-family-base': 'system-ui, -apple-system, sans-serif',
            '--woow-font-size-base': '14px',
            '--woow-line-height-base': '1.4',
            '--woow-spacing-xs': '4px',
            '--woow-spacing-sm': '8px',
            '--woow-spacing-md': '16px',
            '--woow-spacing-lg': '24px',
            '--woow-spacing-xl': '32px'
        };
    }

    /**
     * Validate and transform database data
     */
    validateAndTransformData(rawData) {
        const validatedData = {};
        
        if (!rawData || typeof rawData !== 'object') {
            return validatedData;
        }
        
        for (const [key, value] of Object.entries(rawData)) {
            // Ensure all keys are valid CSS variable names
            const cssVarName = key.startsWith('--') ? key : `--woow-${key.replace(/_/g, '-')}`;
            
            // Validate and sanitize values
            if (this.isValidCSSValue(value)) {
                validatedData[cssVarName] = value;
            }
        }
        
        return validatedData;
    }

    /**
     * Validate CSS value
     */
    isValidCSSValue(value) {
        return typeof value === 'string' && 
               value.length > 0 && 
               value.length < 1000 &&
               !value.includes('<script') && // Basic XSS protection
               !value.includes('javascript:');
    }

    /**
     * Check if cached data is expired
     */
    isExpired(timestamp) {
        return !timestamp || (Date.now() - timestamp) > this.maxAge;
    }

    /**
     * Clear localStorage cache
     */
    clearStorageCache() {
        try {
            localStorage.removeItem(this.storageKey);
            this.log('Cleared localStorage cache');
        } catch (error) {
            this.warn('localStorage clear error', error);
        }
    }

    /**
     * Create timeout promise
     */
    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        });
    }

    /**
     * Mark restoration as complete and generate report
     */
    markRestorationComplete() {
        this.isRestored = true;
        this.restorationState.isComplete = true;
        this.restorationState.duration = performance.now() - this.restorationStartTime;
        
        this.log('CSS variables restoration complete', {
            duration: this.restorationState.duration.toFixed(2) + 'ms',
            source: this.restorationState.source,
            variableCount: this.restorationState.variableCount,
            errors: this.restorationState.errors.length,
            warnings: this.restorationState.warnings.length
        });

        // Generate debug report if in debug mode
        if (this.isDebugMode) {
            this.generateDebugReport();
        }
    }

    /**
     * Handle critical errors that prevent restoration
     */
    handleCriticalError(error) {
        this.warn('Critical restoration error', error);
        this.restorationState.errors.push(`Critical: ${error.message}`);
        
        // Attempt to apply defaults as last resort
        try {
            const defaultValues = this.getDefaultVariables();
            this.applyVariablesToDOM(defaultValues, 'critical-fallback');
            this.restorationState.source = 'critical-fallback';
        } catch (fallbackError) {
            this.warn('Critical fallback also failed', fallbackError);
        }
        
        this.markRestorationComplete();
    }

    /**
     * Detect debug mode
     */
    detectDebugMode() {
        return window.location.search.includes('woow_debug=1') || 
               localStorage.getItem('woow_debug') === '1' ||
               window.woowDebugMode === true;
    }

    /**
     * Debug logging
     */
    log(message, data = null) {
        const timestamp = this.restorationStartTime ? 
            (performance.now() - this.restorationStartTime).toFixed(2) + 'ms' : 
            '0ms';
            
        const logEntry = {
            timestamp,
            message,
            data,
            level: 'info'
        };
        
        this.logs.push(logEntry);
        
        if (this.isDebugMode) {
            console.log(`[WOOW CSS Restore ${timestamp}] ${message}`, data || '');
        }
    }

    /**
     * Debug warning
     */
    warn(message, error = null) {
        const timestamp = this.restorationStartTime ? 
            (performance.now() - this.restorationStartTime).toFixed(2) + 'ms' : 
            '0ms';
            
        const logEntry = {
            timestamp,
            message,
            error: error?.message || error,
            level: 'warn'
        };
        
        this.logs.push(logEntry);
        this.restorationState.warnings.push(message);
        
        if (this.isDebugMode) {
            console.warn(`[WOOW CSS Restore ${timestamp}] ${message}`, error || '');
        }
    }

    /**
     * Generate comprehensive debug report
     */
    generateDebugReport() {
        const report = {
            totalTime: this.restorationState.duration.toFixed(2) + 'ms',
            source: this.restorationState.source,
            variableCount: this.restorationState.variableCount,
            logCount: this.logs.length,
            warnings: this.restorationState.warnings.length,
            errors: this.restorationState.errors.length,
            appliedVariables: Array.from(this.appliedVariables.entries()),
            logs: this.logs,
            state: this.restorationState
        };
        
        console.group('🎨 CSS Variables Restoration Report');
        console.table(this.logs);
        console.log('Full Report:', report);
        console.groupEnd();
        
        return report;
    }

    /**
     * Get current restoration state (for external monitoring)
     */
    getRestorationState() {
        return { ...this.restorationState };
    }

    /**
     * Get applied variables (for debugging)
     */
    getAppliedVariables() {
        return new Map(this.appliedVariables);
    }
}

// Make available globally but don't auto-initialize
// Initialization is now handled by CSSVariablesInitializationSystem
if (typeof window !== 'undefined') {
    // Make class available globally
    window.CSSVariablesRestorer = CSSVariablesRestorer;
    
    // Install console debugging utilities
    window.woowDebugCSS = {
        showAppliedVariables: () => {
            if (window.cssVariablesRestorer) {
                const applied = window.cssVariablesRestorer.getAppliedVariables();
                const vars = {};
                applied.forEach((info, cssVar) => {
                    vars[cssVar] = {
                        value: info.value,
                        source: info.source,
                        timestamp: new Date(info.timestamp).toLocaleTimeString()
                    };
                });
                console.table(vars);
                return vars;
            }
        },
        
        getRestorationReport: () => {
            if (window.cssVariablesRestorer) {
                return window.cssVariablesRestorer.generateDebugReport();
            }
        },
        
        testVariable: (cssVar, value) => {
            document.documentElement.style.setProperty(cssVar, value);
            console.log(`Applied ${cssVar}: ${value}`);
        },
        
        resetToDefaults: () => {
            if (window.cssVariablesRestorer) {
                const defaults = window.cssVariablesRestorer.getDefaultVariables();
                window.cssVariablesRestorer.applyVariablesToDOM(defaults, 'manual-reset');
                console.log('Reset to default variables');
            }
        },
        
        getCurrentState: () => {
            if (window.cssVariablesRestorer) {
                return window.cssVariablesRestorer.getRestorationState();
            }
        }
    };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesRestorer;
}