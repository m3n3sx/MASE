/**
 * VariableApplicator - DOM CSS Variable Application System
 * 
 * Handles batched CSS custom property application with performance optimization
 * and cross-browser compatibility for the WOOW Admin Styler restoration system.
 * 
 * Requirements: 1.1, 1.2, 6.1, 6.2, 6.3
 */
class VariableApplicator {
    constructor() {
        this.appliedVariables = new Map();
        this.defaultVariables = this.loadDefaultVariables();
        this.browserCompatibility = this.detectBrowserCompatibility();
        this.performanceMetrics = {
            totalApplications: 0,
            totalDuration: 0,
            batchCount: 0
        };
        
        // Initialize browser-specific optimizations
        this.initializeBrowserOptimizations();
    }

    /**
     * Apply CSS variables to DOM with batched updates and performance optimization
     * @param {Object} variables - Object with CSS variable names as keys and values
     * @param {string} source - Source identifier for debugging (database, localStorage, defaults)
     * @returns {Object} Application result with metrics
     */
    applyVariables(variables, source = 'unknown') {
        const startTime = performance.now();
        const documentStyle = document.documentElement.style;
        let appliedCount = 0;
        let skippedCount = 0;
        const errors = [];

        try {
            // Validate input
            if (!variables || typeof variables !== 'object') {
                throw new Error('Invalid variables object provided');
            }

            // Batch DOM updates for performance
            this.startBatchUpdate();

            for (const [cssVar, value] of Object.entries(variables)) {
                try {
                    if (this.shouldApplyVariable(cssVar, value)) {
                        if (this.browserCompatibility.supportsCSSCustomProperties) {
                            // Modern browsers - direct CSS custom property application
                            documentStyle.setProperty(cssVar, value);
                        } else {
                            // Legacy browser fallback
                            this.applyLegacyFallback(cssVar, value);
                        }
                        
                        // Track applied variable
                        this.appliedVariables.set(cssVar, {
                            value,
                            source,
                            timestamp: Date.now(),
                            applied: true
                        });
                        
                        appliedCount++;
                    } else {
                        skippedCount++;
                    }
                } catch (error) {
                    errors.push({
                        variable: cssVar,
                        value,
                        error: error.message
                    });
                }
            }

            this.endBatchUpdate();

            const duration = performance.now() - startTime;
            
            // Update performance metrics
            this.updatePerformanceMetrics(appliedCount, duration);

            const result = {
                success: true,
                appliedCount,
                skippedCount,
                errorCount: errors.length,
                duration: Math.round(duration * 100) / 100,
                source,
                errors
            };

            // Log results for debugging
            this.logApplicationResult(result);

            return result;

        } catch (error) {
            const duration = performance.now() - startTime;
            const result = {
                success: false,
                appliedCount: 0,
                skippedCount: 0,
                errorCount: 1,
                duration: Math.round(duration * 100) / 100,
                source,
                errors: [{ general: error.message }]
            };

            console.error('[VariableApplicator] Application failed:', error);
            return result;
        }
    }

    /**
     * Check if a CSS variable should be applied (performance optimization)
     * @param {string} cssVar - CSS variable name
     * @param {string} value - CSS variable value
     * @returns {boolean} Whether the variable should be applied
     */
    shouldApplyVariable(cssVar, value) {
        // Validate CSS variable name
        if (!cssVar || !cssVar.startsWith('--')) {
            return false;
        }

        // Validate CSS value
        if (!this.isValidCSSValue(value)) {
            return false;
        }

        // Performance optimization: skip if value hasn't changed
        const current = this.appliedVariables.get(cssVar);
        if (current && current.value === value && current.applied) {
            return false;
        }

        return true;
    }

    /**
     * Validate CSS value for security and correctness
     * @param {string} value - CSS value to validate
     * @returns {boolean} Whether the value is valid
     */
    isValidCSSValue(value) {
        if (typeof value !== 'string' || value.length === 0) {
            return false;
        }

        // Length check for performance
        if (value.length > 1000) {
            return false;
        }

        // Basic security check - prevent CSS injection
        const dangerousPatterns = [
            /javascript:/i,
            /expression\s*\(/i,
            /url\s*\(\s*javascript:/i,
            /@import/i
        ];

        return !dangerousPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Load default variables mapping from centralized source or fallback
     * @returns {Object} Default CSS variables object
     */
    loadDefaultVariables() {
        // Try to load from centralized CSS variable mapping
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
        return this.getHardcodedDefaults();
    }

    /**
     * Get hardcoded default CSS variables
     * @returns {Object} Default CSS variables
     */
    getHardcodedDefaults() {
        return {
            // Surface colors
            '--woow-surface-bar': '#23282d',
            '--woow-surface-menu': '#ffffff',
            '--woow-surface-content': '#ffffff',
            '--woow-surface-panel': '#f0f0f1',
            
            // Text colors
            '--woow-text-primary': '#1d2327',
            '--woow-text-secondary': '#646970',
            '--woow-text-tertiary': '#8c8f94',
            '--woow-text-inverse': '#ffffff',
            
            // Accent colors
            '--woow-accent-primary': '#2271b1',
            '--woow-accent-secondary': '#72aee6',
            '--woow-accent-success': '#00a32a',
            '--woow-accent-warning': '#dba617',
            '--woow-accent-error': '#d63638',
            
            // Border and layout
            '--woow-border-color': '#c3c4c7',
            '--woow-border-color-light': '#e0e0e0',
            '--woow-border-radius': '4px',
            '--woow-border-radius-large': '8px',
            
            // Typography
            '--woow-font-family-base': 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            '--woow-font-family-mono': 'Consolas, Monaco, "Courier New", monospace',
            '--woow-font-size-xs': '12px',
            '--woow-font-size-sm': '13px',
            '--woow-font-size-base': '14px',
            '--woow-font-size-lg': '16px',
            '--woow-font-size-xl': '18px',
            '--woow-line-height-base': '1.4',
            '--woow-line-height-heading': '1.2',
            
            // Spacing
            '--woow-spacing-xs': '4px',
            '--woow-spacing-sm': '8px',
            '--woow-spacing-md': '16px',
            '--woow-spacing-lg': '24px',
            '--woow-spacing-xl': '32px',
            '--woow-spacing-xxl': '48px',
            
            // Shadows and effects
            '--woow-shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
            '--woow-shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
            '--woow-shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
            
            // Transitions
            '--woow-transition-fast': '150ms ease',
            '--woow-transition-base': '250ms ease',
            '--woow-transition-slow': '350ms ease'
        };
    }

    /**
     * Detect browser compatibility for CSS custom properties
     * @returns {Object} Browser compatibility information
     */
    detectBrowserCompatibility() {
        const compatibility = {
            supportsCSSCustomProperties: false,
            supportsCSSSupportAPI: false,
            browserName: 'unknown',
            requiresPolyfill: false
        };

        // Detect CSS custom properties support
        if (window.CSS && CSS.supports) {
            compatibility.supportsCSSSupportAPI = true;
            compatibility.supportsCSSCustomProperties = CSS.supports('--test', 'value');
        } else {
            // Fallback detection for older browsers
            const testElement = document.createElement('div');
            testElement.style.setProperty('--test', 'value');
            compatibility.supportsCSSCustomProperties = 
                testElement.style.getPropertyValue('--test') === 'value';
        }

        // Detect browser type for specific optimizations
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('chrome')) {
            compatibility.browserName = 'chrome';
        } else if (userAgent.includes('firefox')) {
            compatibility.browserName = 'firefox';
        } else if (userAgent.includes('safari')) {
            compatibility.browserName = 'safari';
        } else if (userAgent.includes('edge')) {
            compatibility.browserName = 'edge';
        } else if (userAgent.includes('trident') || userAgent.includes('msie')) {
            compatibility.browserName = 'ie';
            compatibility.requiresPolyfill = true;
        }

        return compatibility;
    }

    /**
     * Initialize browser-specific optimizations
     */
    initializeBrowserOptimizations() {
        // Safari-specific optimizations
        if (this.browserCompatibility.browserName === 'safari') {
            // Safari sometimes needs a slight delay for CSS custom properties
            this.safariDelay = 0;
        }

        // Firefox-specific optimizations
        if (this.browserCompatibility.browserName === 'firefox') {
            // Firefox handles batch updates efficiently
            this.batchUpdateOptimization = true;
        }

        // IE11 fallback preparation
        if (this.browserCompatibility.requiresPolyfill) {
            this.prepareLegacyFallback();
        }
    }

    /**
     * Apply legacy fallback for browsers without CSS custom properties support
     * @param {string} cssVar - CSS variable name
     * @param {string} value - CSS variable value
     */
    applyLegacyFallback(cssVar, value) {
        // For IE11 and other legacy browsers, we need to apply hardcoded styles
        // This is a simplified implementation - in production, you might want
        // to use a more sophisticated polyfill
        
        const fallbackMapping = this.getLegacyFallbackMapping();
        const fallbackSelectors = fallbackMapping[cssVar];
        
        if (fallbackSelectors && fallbackSelectors.length > 0) {
            this.applyLegacyStyles(fallbackSelectors, value);
        }
    }

    /**
     * Get mapping of CSS variables to legacy selectors
     * @returns {Object} Mapping object
     */
    getLegacyFallbackMapping() {
        return {
            '--woow-surface-bar': ['.woow-admin-bar', '#adminmenu'],
            '--woow-surface-menu': ['.woow-menu', '.wp-menu'],
            '--woow-surface-content': ['.woow-content', '#wpbody-content'],
            '--woow-text-primary': ['.woow-text', 'body.wp-admin'],
            '--woow-accent-primary': ['.woow-button-primary', '.button-primary']
            // Add more mappings as needed
        };
    }

    /**
     * Apply styles to legacy selectors
     * @param {Array} selectors - CSS selectors to apply styles to
     * @param {string} value - CSS value to apply
     */
    applyLegacyStyles(selectors, value) {
        // This would require a more sophisticated implementation
        // For now, we'll just log the attempt
        console.log(`[VariableApplicator] Legacy fallback needed for selectors:`, selectors, 'value:', value);
    }

    /**
     * Prepare legacy fallback system
     */
    prepareLegacyFallback() {
        // Create a style element for legacy fallbacks if needed
        if (!document.getElementById('woow-legacy-fallback')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'woow-legacy-fallback';
            styleElement.type = 'text/css';
            document.head.appendChild(styleElement);
        }
    }

    /**
     * Start batch update for performance optimization
     */
    startBatchUpdate() {
        // For browsers that support it, we can optimize DOM updates
        if (this.batchUpdateOptimization) {
            // Implementation would depend on specific browser optimizations
            this.batchStartTime = performance.now();
        }
    }

    /**
     * End batch update
     */
    endBatchUpdate() {
        if (this.batchUpdateOptimization && this.batchStartTime) {
            const batchDuration = performance.now() - this.batchStartTime;
            this.performanceMetrics.batchCount++;
            // Log batch performance if needed
        }
    }

    /**
     * Update performance metrics
     * @param {number} appliedCount - Number of variables applied
     * @param {number} duration - Duration in milliseconds
     */
    updatePerformanceMetrics(appliedCount, duration) {
        this.performanceMetrics.totalApplications += appliedCount;
        this.performanceMetrics.totalDuration += duration;
        
        // Calculate averages
        this.performanceMetrics.averageDuration = 
            this.performanceMetrics.totalDuration / this.performanceMetrics.batchCount || 0;
        this.performanceMetrics.averageVariablesPerBatch = 
            this.performanceMetrics.totalApplications / this.performanceMetrics.batchCount || 0;
    }

    /**
     * Log application result for debugging
     * @param {Object} result - Application result object
     */
    logApplicationResult(result) {
        const logLevel = result.errorCount > 0 ? 'warn' : 'log';
        const message = `Applied ${result.appliedCount} CSS variables from ${result.source} in ${result.duration}ms`;
        
        if (result.skippedCount > 0) {
            console.log(`[VariableApplicator] ${message} (${result.skippedCount} skipped)`);
        } else {
            console[logLevel](`[VariableApplicator] ${message}`);
        }

        if (result.errors.length > 0) {
            console.warn('[VariableApplicator] Errors during application:', result.errors);
        }
    }

    /**
     * Get default variables (public method)
     * @returns {Object} Default CSS variables
     */
    getDefaultVariables() {
        return { ...this.defaultVariables };
    }

    /**
     * Get applied variables information
     * @returns {Object} Applied variables with metadata
     */
    getAppliedVariables() {
        const applied = {};
        for (const [cssVar, info] of this.appliedVariables.entries()) {
            applied[cssVar] = {
                value: info.value,
                source: info.source,
                timestamp: info.timestamp
            };
        }
        return applied;
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Reset applied variables tracking (useful for testing)
     */
    reset() {
        this.appliedVariables.clear();
        this.performanceMetrics = {
            totalApplications: 0,
            totalDuration: 0,
            batchCount: 0
        };
    }

    /**
     * Check if a specific variable has been applied
     * @param {string} cssVar - CSS variable name
     * @returns {boolean} Whether the variable has been applied
     */
    hasVariable(cssVar) {
        return this.appliedVariables.has(cssVar);
    }

    /**
     * Get current value of a specific variable
     * @param {string} cssVar - CSS variable name
     * @returns {string|null} Current value or null if not applied
     */
    getVariableValue(cssVar) {
        const info = this.appliedVariables.get(cssVar);
        return info ? info.value : null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariableApplicator;
}

// Make available globally for WordPress integration
window.VariableApplicator = VariableApplicator;