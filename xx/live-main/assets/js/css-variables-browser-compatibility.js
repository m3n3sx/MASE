/**
 * CSS Variables Browser Compatibility Layer
 * 
 * Provides cross-browser compatibility for CSS custom properties with:
 * - Feature detection for CSS custom properties support
 * - Fallback mechanisms for unsupported browsers
 * - Browser-specific workarounds and optimizations
 * - Graceful degradation for legacy browsers
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

class CSSVariablesBrowserCompatibility {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.supportLevel = this.detectSupportLevel();
        this.fallbackStyles = new Map();
        this.appliedFallbacks = new Set();
        this.isApplying = false;
        
        // Initialize browser-specific optimizations
        this.initializeBrowserOptimizations();
        
        // Initialize fallback mapping
        this.initializeFallbackMapping();
    }

    /**
     * Detect browser and version information
     * @returns {Object} Browser information object
     */
    detectBrowser() {
        const ua = navigator.userAgent;
        const browserInfo = {
            name: 'unknown',
            version: 0,
            engine: 'unknown',
            isLegacy: false
        };

        // Chrome/Chromium-based browsers
        if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
            const match = ua.match(/Chrome\/(\d+)/);
            browserInfo.name = 'chrome';
            browserInfo.version = match ? parseInt(match[1]) : 0;
            browserInfo.engine = 'blink';
        }
        // Edge (Chromium-based)
        else if (ua.includes('Edg/')) {
            const match = ua.match(/Edg\/(\d+)/);
            browserInfo.name = 'edge';
            browserInfo.version = match ? parseInt(match[1]) : 0;
            browserInfo.engine = 'blink';
        }
        // Firefox
        else if (ua.includes('Firefox/')) {
            const match = ua.match(/Firefox\/(\d+)/);
            browserInfo.name = 'firefox';
            browserInfo.version = match ? parseInt(match[1]) : 0;
            browserInfo.engine = 'gecko';
        }
        // Safari
        else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
            const match = ua.match(/Version\/(\d+)/);
            browserInfo.name = 'safari';
            browserInfo.version = match ? parseInt(match[1]) : 0;
            browserInfo.engine = 'webkit';
        }
        // Internet Explorer
        else if (ua.includes('MSIE') || ua.includes('Trident/')) {
            const match = ua.match(/(?:MSIE |rv:)(\d+)/);
            browserInfo.name = 'ie';
            browserInfo.version = match ? parseInt(match[1]) : 0;
            browserInfo.engine = 'trident';
            browserInfo.isLegacy = true;
        }

        return browserInfo;
    }

    /**
     * Detect CSS custom properties support level
     * @returns {Object} Support level information
     */
    detectSupportLevel() {
        const support = {
            customProperties: false,
            customPropertiesInheritance: false,
            customPropertiesInMedia: false,
            customPropertiesInPseudo: false,
            performanceOptimal: false
        };

        // Basic CSS custom properties support
        if (window.CSS && CSS.supports) {
            support.customProperties = CSS.supports('--test', 'value') && 
                                     CSS.supports('color', 'var(--test)');
        }

        // Fallback detection for older browsers
        if (!support.customProperties && window.getComputedStyle) {
            try {
                const testEl = document.createElement('div');
                testEl.style.setProperty('--test-var', 'test-value');
                document.body.appendChild(testEl);
                
                const computed = getComputedStyle(testEl);
                support.customProperties = computed.getPropertyValue('--test-var') === 'test-value';
                
                document.body.removeChild(testEl);
            } catch (error) {
                support.customProperties = false;
            }
        }

        // Advanced feature detection
        if (support.customProperties) {
            try {
                support.customPropertiesInheritance = CSS.supports('color', 'var(--inherited, red)');
                support.customPropertiesInMedia = CSS.supports('(--test: value)');
                support.customPropertiesInPseudo = true;
            } catch (e) {
                // Fallback to basic support
            }

            // Performance optimization detection
            support.performanceOptimal = (this.browserInfo.name === 'chrome' && this.browserInfo.version >= 49) ||
                                       (this.browserInfo.name === 'firefox' && this.browserInfo.version >= 31) ||
                                       (this.browserInfo.name === 'safari' && this.browserInfo.version >= 9) ||
                                       (this.browserInfo.name === 'edge' && this.browserInfo.version >= 16);
        }

        return support;
    }

    /**
     * Initialize browser-specific optimizations
     */
    initializeBrowserOptimizations() {
        // Chrome/Blink optimizations
        if (this.browserInfo.engine === 'blink') {
            this.blinkOptimizations = {
                useBatchedUpdates: true,
                useComputedStyleCache: true,
                preferSetProperty: true
            };
        }
        // Firefox/Gecko optimizations
        else if (this.browserInfo.engine === 'gecko') {
            this.geckoOptimizations = {
                avoidFrequentReflows: true,
                useDocumentFragment: false,
                batchSimilarProperties: true
            };
        }
        // Safari/WebKit optimizations
        else if (this.browserInfo.engine === 'webkit') {
            this.webkitOptimizations = {
                useRequestAnimationFrame: true,
                avoidComplexSelectors: true,
                preferInlineStyles: false
            };
        }
        // IE/Legacy optimizations
        else if (this.browserInfo.isLegacy) {
            this.legacyOptimizations = {
                useStyleSheets: true,
                avoidComplexCSS: true,
                minimizeReflows: true,
                useSimpleSelectors: true
            };
        }
    }

    /**
     * Apply CSS variables with browser compatibility
     * @param {Object} variables - CSS variables to apply
     * @param {string} source - Source of variables (database, localStorage, defaults)
     */
    applyVariablesWithCompatibility(variables, source = 'unknown') {
        // Prevent recursion
        if (this.isApplying) {
            return { appliedCount: 0, fallbackCount: 0, duration: 0 };
        }
        
        this.isApplying = true;
        const startTime = performance.now();
        let appliedCount = 0;
        let fallbackCount = 0;

        try {
            if (this.supportLevel.customProperties) {
                // Modern browsers with CSS custom properties support
                appliedCount = this.applyModernVariables(variables);
            } else {
                // Legacy browsers - use fallback mechanism
                fallbackCount = this.applyFallbackVariables(variables, source);
            }
        } catch (error) {
            console.warn('[WOOW CSS Compatibility] Error applying variables:', error);
        } finally {
            this.isApplying = false;
        }

        const duration = performance.now() - startTime;
        
        // Log compatibility information
        this.logCompatibilityInfo({
            appliedCount,
            fallbackCount,
            duration,
            source,
            browserInfo: this.browserInfo,
            supportLevel: this.supportLevel
        });

        return { appliedCount, fallbackCount, duration };
    }

    /**
     * Apply variables for modern browsers
     * @param {Object} variables - CSS variables to apply
     * @returns {number} Number of variables applied
     */
    applyModernVariables(variables) {
        const documentStyle = document.documentElement.style;
        let appliedCount = 0;

        for (const [cssVar, value] of Object.entries(variables)) {
            if (this.isValidCSSVariable(cssVar, value)) {
                try {
                    documentStyle.setProperty(cssVar, value);
                    appliedCount++;
                } catch (error) {
                    console.warn(`[WOOW CSS Compatibility] Failed to apply ${cssVar}:`, error);
                }
            }
        }

        return appliedCount;
    }

    /**
     * Apply fallback variables for legacy browsers
     * @param {Object} variables - CSS variables to apply
     * @param {string} source - Source identifier
     * @returns {number} Number of fallback styles applied
     */
    applyFallbackVariables(variables, source) {
        const fallbackCSS = this.generateFallbackCSS(variables);
        
        if (fallbackCSS) {
            this.injectFallbackStyles(fallbackCSS, source);
            return Object.keys(variables).length;
        }

        return 0;
    }

    /**
     * Generate fallback CSS for legacy browsers
     * @param {Object} variables - CSS variables to convert
     * @returns {string} Generated CSS string
     */
    generateFallbackCSS(variables) {
        const cssRules = [];

        for (const [cssVar, value] of Object.entries(variables)) {
            const properties = this.fallbackStyles.get(cssVar);
            if (properties && properties.length > 0) {
                for (const property of properties) {
                    cssRules.push(`${property.selector} { ${property.property}: ${value} !important; }`);
                }
            }
        }

        return cssRules.join('\n');
    }

    /**
     * Initialize fallback mapping for CSS variables
     */
    initializeFallbackMapping() {
        const mappings = [
            // Color variables
            { cssVar: '--woow-surface-bar', properties: [
                { selector: '.woow-admin-bar', property: 'background-color' },
                { selector: '#adminmenu', property: 'background-color' }
            ]},
            { cssVar: '--woow-surface-menu', properties: [
                { selector: '.woow-menu', property: 'background-color' },
                { selector: '#adminmenu .wp-submenu', property: 'background-color' }
            ]},
            { cssVar: '--woow-surface-content', properties: [
                { selector: '.woow-content', property: 'background-color' },
                { selector: '#wpbody-content', property: 'background-color' }
            ]},
            { cssVar: '--woow-text-primary', properties: [
                { selector: '.woow-text', property: 'color' },
                { selector: '#adminmenu a', property: 'color' }
            ]},
            { cssVar: '--woow-text-secondary', properties: [
                { selector: '.woow-text-secondary', property: 'color' },
                { selector: '#adminmenu .wp-submenu a', property: 'color' }
            ]},
            { cssVar: '--woow-accent-primary', properties: [
                { selector: '.woow-accent', property: 'color' },
                { selector: '.button-primary', property: 'background-color' }
            ]},
            { cssVar: '--woow-border-radius', properties: [
                { selector: '.woow-rounded', property: 'border-radius' },
                { selector: '.button', property: 'border-radius' }
            ]},
            { cssVar: '--woow-font-family-base', properties: [
                { selector: 'body.woow-admin', property: 'font-family' }
            ]},
            { cssVar: '--woow-font-size-base', properties: [
                { selector: 'body.woow-admin', property: 'font-size' }
            ]},
            { cssVar: '--woow-spacing-md', properties: [
                { selector: '.woow-spacing-md', property: 'padding' }
            ]}
        ];

        for (const mapping of mappings) {
            this.fallbackStyles.set(mapping.cssVar, mapping.properties);
        }
    }

    /**
     * Inject fallback styles into the document
     * @param {string} cssText - CSS text to inject
     * @param {string} source - Source identifier
     */
    injectFallbackStyles(cssText, source) {
        const styleId = `woow-fallback-styles-${source}`;
        
        // Remove existing fallback styles for this source
        const existingStyle = document.getElementById(styleId);
        if (existingStyle) {
            existingStyle.remove();
        }

        // Create and inject new style element
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.type = 'text/css';
        styleElement.textContent = cssText;
        
        // Insert at the beginning of head to allow overrides
        const head = document.head || document.getElementsByTagName('head')[0];
        head.insertBefore(styleElement, head.firstChild);
        
        this.appliedFallbacks.add(styleId);
    }  
  /**
     * Validate CSS variable name and value
     * @param {string} cssVar - CSS variable name
     * @param {string} value - CSS variable value
     * @returns {boolean} Whether the variable is valid
     */
    isValidCSSVariable(cssVar, value) {
        // Basic validation
        if (!cssVar || !value || typeof cssVar !== 'string' || typeof value !== 'string') {
            return false;
        }

        // CSS variable name validation
        if (!cssVar.startsWith('--')) {
            return false;
        }

        // Value length validation
        if (value.length > 1000) {
            return false;
        }

        // Browser-specific validation
        if (this.browserInfo.isLegacy) {
            // More restrictive validation for legacy browsers
            return this.isValidForLegacyBrowser(value);
        }

        return true;
    }

    /**
     * Validate CSS variable for legacy browsers
     * @param {string} value - CSS variable value
     * @returns {boolean} Whether valid for legacy browsers
     */
    isValidForLegacyBrowser(value) {
        // Avoid complex values that might break in IE
        const complexPatterns = [
            /calc\(/,
            /var\(/,
            /url\(/,
            /rgba?\([^)]*,\s*[^)]*,\s*[^)]*,\s*[^)]*\)/
        ];

        return !complexPatterns.some(pattern => pattern.test(value));
    }

    /**
     * Log compatibility information
     * @param {Object} info - Compatibility information
     */
    logCompatibilityInfo(info) {
        let isDebugMode = false;
        
        try {
            isDebugMode = (window.location && window.location.search.includes('woow_debug=1')) || 
                         (typeof localStorage !== 'undefined' && localStorage.getItem('woow_debug') === '1');
        } catch (error) {
            // Ignore localStorage errors in test environments
        }

        if (isDebugMode) {
            console.log('[WOOW CSS Compatibility] Application Summary:', {
                browser: `${info.browserInfo.name} ${info.browserInfo.version}`,
                engine: info.browserInfo.engine,
                support: info.supportLevel.customProperties ? 'Native' : 'Fallback',
                applied: info.appliedCount,
                fallbacks: info.fallbackCount,
                duration: `${info.duration.toFixed(2)}ms`,
                source: info.source
            });
        }
    }

    /**
     * Get browser compatibility report
     * @returns {Object} Compatibility report
     */
    getCompatibilityReport() {
        return {
            browser: this.browserInfo,
            support: this.supportLevel,
            fallbacksApplied: Array.from(this.appliedFallbacks),
            optimizations: {
                blink: this.blinkOptimizations || null,
                gecko: this.geckoOptimizations || null,
                webkit: this.webkitOptimizations || null,
                legacy: this.legacyOptimizations || null
            }
        };
    }

    /**
     * Test browser compatibility
     * @returns {Object} Test results
     */
    static testCompatibility() {
        const compatibility = new CSSVariablesBrowserCompatibility();
        const testResults = {
            browserDetection: compatibility.browserInfo,
            supportLevel: compatibility.supportLevel,
            testsPassed: 0,
            testsTotal: 0,
            errors: []
        };

        // Test 1: Basic CSS custom properties
        testResults.testsTotal++;
        try {
            const testEl = document.createElement('div');
            testEl.style.setProperty('--test-var', 'test-value');
            document.body.appendChild(testEl);
            
            const computed = getComputedStyle(testEl);
            const value = computed.getPropertyValue('--test-var');
            
            if (value === 'test-value') {
                testResults.testsPassed++;
            } else {
                testResults.errors.push('Basic CSS custom properties test failed');
            }
            
            document.body.removeChild(testEl);
        } catch (error) {
            testResults.errors.push(`Basic test error: ${error.message}`);
        }

        // Test 2: CSS.supports availability
        testResults.testsTotal++;
        if (window.CSS && CSS.supports) {
            testResults.testsPassed++;
        } else {
            testResults.errors.push('CSS.supports not available');
        }

        // Test 3: Fallback mechanism
        testResults.testsTotal++;
        try {
            const fallbackCSS = compatibility.generateFallbackCSS({
                '--woow-test-color': '#ff0000'
            });
            
            if (fallbackCSS && fallbackCSS.length > 0) {
                testResults.testsPassed++;
            } else {
                testResults.errors.push('Fallback CSS generation failed');
            }
        } catch (error) {
            testResults.errors.push(`Fallback test error: ${error.message}`);
        }

        return testResults;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesBrowserCompatibility;
} else {
    window.CSSVariablesBrowserCompatibility = CSSVariablesBrowserCompatibility;
}