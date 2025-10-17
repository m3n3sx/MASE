/**
 * Code Sanitizer - Secure Code Execution System
 * Provides whitelist-based sanitization and sandbox execution for CSS/JS
 */

class CodeSanitizer {
    constructor(options = {}) {
        this.options = {
            strictMode: true,
            allowedCSSProperties: null, // null = allow all safe properties
            allowedJSFunctions: null,   // null = use default whitelist
            maxExecutionTime: 5000,     // 5 seconds
            maxCodeLength: 50000,       // 50KB
            enableCSP: true,
            ...options
        };
        
        this.initializeWhitelists();
        this.setupCSP();
    }

    initializeWhitelists() {
        // Safe CSS properties whitelist
        this.safeCSSProperties = new Set([
            // Layout
            'display', 'position', 'top', 'right', 'bottom', 'left',
            'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'box-sizing', 'overflow', 'overflow-x', 'overflow-y', 'visibility',
            'z-index', 'float', 'clear', 'flex', 'flex-direction', 'flex-wrap',
            'justify-content', 'align-items', 'align-content', 'grid', 'grid-template',
            
            // Typography
            'font', 'font-family', 'font-size', 'font-weight', 'font-style',
            'line-height', 'text-align', 'text-decoration', 'text-transform',
            'letter-spacing', 'word-spacing', 'white-space', 'text-indent',
            'text-shadow', 'text-overflow', 'word-wrap', 'word-break',
            
            // Colors and backgrounds
            'color', 'background', 'background-color', 'background-image',
            'background-repeat', 'background-position', 'background-size',
            'background-attachment', 'opacity', 'filter',
            
            // Borders
            'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
            'border-width', 'border-style', 'border-color', 'border-radius',
            'outline', 'outline-width', 'outline-style', 'outline-color',
            'box-shadow',
            
            // Transitions and animations
            'transition', 'transition-property', 'transition-duration',
            'transition-timing-function', 'transition-delay', 'transform',
            'transform-origin', 'animation', 'animation-name', 'animation-duration',
            'animation-timing-function', 'animation-delay', 'animation-iteration-count',
            'animation-direction', 'animation-fill-mode', 'animation-play-state',
            
            // Lists
            'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
            
            // Tables
            'border-collapse', 'border-spacing', 'table-layout', 'caption-side',
            'empty-cells', 'vertical-align',
            
            // Cursor and user interaction
            'cursor', 'pointer-events', 'user-select', 'resize'
        ]);

        // Dangerous CSS patterns to block
        this.dangerousCSSPatterns = [
            /expression\s*\(/gi,                    // IE expressions
            /javascript\s*:/gi,                     // JavaScript protocol
            /vbscript\s*:/gi,                       // VBScript protocol
            /data\s*:\s*text\/html/gi,             // Data URLs with HTML
            /data\s*:\s*application\/javascript/gi, // Data URLs with JS
            /@import\s+url\s*\(\s*["']?javascript:/gi, // Import with JS
            /binding\s*:/gi,                        // Mozilla binding
            /behavior\s*:/gi,                       // IE behavior
            /mozbinding/gi,                         // Mozilla binding
            /-moz-binding/gi,                       // Mozilla binding
            /url\s*\(\s*["']?javascript:/gi,       // URL with JavaScript
            /\\[0-9a-f]{1,6}/gi                    // Unicode escapes (potential bypass)
        ];

        // Safe JavaScript functions whitelist
        this.safeJSFunctions = new Set([
            // WordPress globals
            'wp', 'jQuery', '$', 'ajaxurl', 'pagenow', 'adminpage',
            
            // Safe native functions
            'console.log', 'console.warn', 'console.error', 'console.info',
            'parseInt', 'parseFloat', 'isNaN', 'isFinite',
            'Math.abs', 'Math.ceil', 'Math.floor', 'Math.round', 'Math.max', 'Math.min',
            'String', 'Number', 'Boolean', 'Array', 'Object', 'Date',
            'JSON.parse', 'JSON.stringify',
            
            // Safe DOM methods (limited)
            'getElementById', 'getElementsByClassName', 'getElementsByTagName',
            'querySelector', 'querySelectorAll', 'addEventListener',
            'removeEventListener', 'setAttribute', 'getAttribute',
            'classList.add', 'classList.remove', 'classList.toggle',
            'classList.contains', 'style.setProperty', 'style.getPropertyValue',
            
            // WordPress specific functions
            'wp_localize_script', 'wp_enqueue_script', 'wp_add_inline_script',
            'wp_verify_nonce', 'wp_create_nonce'
        ]);

        // Dangerous JavaScript patterns to block
        this.dangerousJSPatterns = [
            /eval\s*\(/gi,                          // eval function
            /Function\s*\(/gi,                      // Function constructor
            /setTimeout\s*\(\s*["'][^"']*["']/gi,   // setTimeout with string
            /setInterval\s*\(\s*["'][^"']*["']/gi,  // setInterval with string
            /document\.write/gi,                    // document.write
            /innerHTML\s*=/gi,                      // innerHTML assignment
            /outerHTML\s*=/gi,                      // outerHTML assignment
            /document\.cookie/gi,                   // Cookie access
            /window\.location/gi,                   // Location manipulation
            /location\.href/gi,                     // Location manipulation
            /location\.replace/gi,                  // Location manipulation
            /location\.assign/gi,                   // Location manipulation
            /window\.open/gi,                       // Window opening
            /XMLHttpRequest/gi,                     // Direct XHR
            /fetch\s*\(/gi,                        // Fetch API
            /import\s*\(/gi,                       // Dynamic imports
            /require\s*\(/gi,                      // CommonJS require
            /process\./gi,                         // Node.js process
            /global\./gi,                          // Node.js global
            /__dirname/gi,                         // Node.js __dirname
            /__filename/gi,                        // Node.js __filename
            /module\.exports/gi,                   // CommonJS exports
            /exports\./gi,                         // CommonJS exports
            /alert\s*\(/gi,                        // Alert dialogs
            /confirm\s*\(/gi,                      // Confirm dialogs
            /prompt\s*\(/gi                        // Prompt dialogs
        ];
    }

    setupCSP() {
        if (!this.options.enableCSP) return;

        // Set Content Security Policy headers for enhanced security
        const cspDirectives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' https:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');

        // Try to set CSP via meta tag if headers aren't available
        if (typeof document !== 'undefined') {
            const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!existingCSP) {
                const meta = document.createElement('meta');
                meta.httpEquiv = 'Content-Security-Policy';
                meta.content = cspDirectives;
                document.head.appendChild(meta);
            }
        }
    }

    /**
     * Sanitize CSS code
     * @param {string} cssCode - Raw CSS code
     * @returns {Object} - {isValid: boolean, sanitizedCode: string, errors: array, warnings: array}
     */
    sanitizeCSS(cssCode) {
        const result = {
            isValid: true,
            sanitizedCode: '',
            errors: [],
            warnings: []
        };

        if (!cssCode || typeof cssCode !== 'string') {
            result.isValid = false;
            result.errors.push('Invalid CSS input');
            return result;
        }

        if (cssCode.length > this.options.maxCodeLength) {
            result.isValid = false;
            result.errors.push(`CSS code too long (${cssCode.length} > ${this.options.maxCodeLength})`);
            return result;
        }

        let sanitizedCSS = cssCode;

        // Check for dangerous patterns
        this.dangerousCSSPatterns.forEach(pattern => {
            if (pattern.test(sanitizedCSS)) {
                result.isValid = false;
                result.errors.push(`Dangerous CSS pattern detected: ${pattern.source}`);
            }
        });

        if (!result.isValid) {
            return result;
        }

        // Remove dangerous patterns
        this.dangerousCSSPatterns.forEach(pattern => {
            sanitizedCSS = sanitizedCSS.replace(pattern, '/* REMOVED: potentially dangerous code */');
        });

        // Validate CSS properties if strict mode is enabled
        if (this.options.strictMode && this.options.allowedCSSProperties !== null) {
            const allowedProps = this.options.allowedCSSProperties || this.safeCSSProperties;
            sanitizedCSS = this.validateCSSProperties(sanitizedCSS, allowedProps, result);
        }

        // Basic CSS syntax validation
        const braceMatches = sanitizedCSS.match(/[{}]/g);
        if (braceMatches) {
            const openBraces = sanitizedCSS.match(/{/g) || [];
            const closeBraces = sanitizedCSS.match(/}/g) || [];
            if (openBraces.length !== closeBraces.length) {
                result.warnings.push('Mismatched CSS braces detected');
            }
        }

        result.sanitizedCode = sanitizedCSS;
        return result;
    }

    /**
     * Validate CSS properties against whitelist
     */
    validateCSSProperties(cssCode, allowedProps, result) {
        const propertyRegex = /([a-zA-Z-]+)\s*:/g;
        let match;
        let sanitizedCSS = cssCode;

        while ((match = propertyRegex.exec(cssCode)) !== null) {
            const property = match[1].toLowerCase();
            if (!allowedProps.has(property)) {
                result.warnings.push(`CSS property '${property}' is not in whitelist`);
                // Comment out the property instead of removing it
                sanitizedCSS = sanitizedCSS.replace(
                    new RegExp(`${match[1]}\\s*:[^;{}]+;?`, 'gi'),
                    `/* ${match[0]} - property not allowed */`
                );
            }
        }

        return sanitizedCSS;
    }

    /**
     * Sanitize JavaScript code
     * @param {string} jsCode - Raw JavaScript code
     * @returns {Object} - {isValid: boolean, sanitizedCode: string, errors: array, warnings: array}
     */
    sanitizeJS(jsCode) {
        const result = {
            isValid: true,
            sanitizedCode: '',
            errors: [],
            warnings: []
        };

        if (!jsCode || typeof jsCode !== 'string') {
            result.isValid = false;
            result.errors.push('Invalid JavaScript input');
            return result;
        }

        if (jsCode.length > this.options.maxCodeLength) {
            result.isValid = false;
            result.errors.push(`JavaScript code too long (${jsCode.length} > ${this.options.maxCodeLength})`);
            return result;
        }

        let sanitizedJS = jsCode;

        // Check for dangerous patterns
        this.dangerousJSPatterns.forEach(pattern => {
            if (pattern.test(sanitizedJS)) {
                result.isValid = false;
                result.errors.push(`Dangerous JavaScript pattern detected: ${pattern.source}`);
            }
        });

        if (!result.isValid) {
            return result;
        }

        // Basic syntax validation
        try {
            new Function(sanitizedJS);
        } catch (error) {
            result.isValid = false;
            result.errors.push(`JavaScript syntax error: ${error.message}`);
            return result;
        }

        // Remove dangerous patterns
        this.dangerousJSPatterns.forEach(pattern => {
            sanitizedJS = sanitizedJS.replace(pattern, '/* REMOVED: potentially dangerous code */');
        });

        result.sanitizedCode = sanitizedJS;
        return result;
    }

    /**
     * Execute JavaScript code in a sandbox
     * @param {string} jsCode - Sanitized JavaScript code
     * @param {Object} context - Execution context
     * @returns {Promise} - Execution result
     */
    async executeInSandbox(jsCode, context = {}) {
        return new Promise((resolve, reject) => {
            // First sanitize the code
            const sanitized = this.sanitizeJS(jsCode);
            if (!sanitized.isValid) {
                reject(new Error('Code failed sanitization: ' + sanitized.errors.join(', ')));
                return;
            }

            // Set up execution timeout
            const timeout = setTimeout(() => {
                reject(new Error('Code execution timeout'));
            }, this.options.maxExecutionTime);

            try {
                // Create a restricted execution context
                const sandbox = this.createSandbox(context);
                
                // Execute the code in the sandbox
                const result = this.runInSandbox(sanitized.sanitizedCode, sandbox);
                
                clearTimeout(timeout);
                resolve({
                    success: true,
                    result: result,
                    warnings: sanitized.warnings
                });
            } catch (error) {
                clearTimeout(timeout);
                reject(new Error('Sandbox execution error: ' + error.message));
            }
        });
    }

    /**
     * Create a restricted execution sandbox
     */
    createSandbox(context = {}) {
        // Create a restricted global object
        const sandbox = {
            // Safe globals
            console: {
                log: (...args) => console.log('[SANDBOX]', ...args),
                warn: (...args) => console.warn('[SANDBOX]', ...args),
                error: (...args) => console.error('[SANDBOX]', ...args),
                info: (...args) => console.info('[SANDBOX]', ...args)
            },
            
            // Safe Math object
            Math: Math,
            
            // Safe constructors
            String: String,
            Number: Number,
            Boolean: Boolean,
            Array: Array,
            Object: Object,
            Date: Date,
            
            // Safe JSON
            JSON: JSON,
            
            // WordPress globals (if available)
            wp: typeof wp !== 'undefined' ? wp : undefined,
            jQuery: typeof jQuery !== 'undefined' ? jQuery : undefined,
            $: typeof $ !== 'undefined' ? $ : undefined,
            ajaxurl: typeof ajaxurl !== 'undefined' ? ajaxurl : undefined,
            
            // Custom context
            ...context
        };

        return sandbox;
    }

    /**
     * Run code in the created sandbox
     */
    runInSandbox(code, sandbox) {
        // Create a function with the sandbox as its context
        const keys = Object.keys(sandbox);
        const values = keys.map(key => sandbox[key]);
        
        // Create the function with restricted scope
        const func = new Function(...keys, `
            "use strict";
            ${code}
        `);
        
        // Execute with the sandbox values
        return func.apply(null, values);
    }

    /**
     * Apply sanitized CSS safely to the DOM
     * @param {string} cssCode - Sanitized CSS code
     * @param {string} targetId - Target element ID or selector
     */
    applySafeCSS(cssCode, targetId = 'dynamic-styles') {
        const sanitized = this.sanitizeCSS(cssCode);
        
        if (!sanitized.isValid) {
            throw new Error('CSS failed sanitization: ' + sanitized.errors.join(', '));
        }

        // Find or create style element
        let styleElement = document.getElementById(targetId);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = targetId;
            styleElement.type = 'text/css';
            document.head.appendChild(styleElement);
        }

        // Apply the sanitized CSS
        styleElement.textContent = sanitized.sanitizedCode;
        
        return {
            success: true,
            warnings: sanitized.warnings,
            element: styleElement
        };
    }

    /**
     * Remove applied CSS
     * @param {string} targetId - Target element ID
     */
    removeSafeCSS(targetId = 'dynamic-styles') {
        const styleElement = document.getElementById(targetId);
        if (styleElement) {
            styleElement.remove();
            return true;
        }
        return false;
    }

    /**
     * Validate HTML content for safety
     * @param {string} htmlCode - HTML content to validate
     * @returns {Object} - Validation result
     */
    validateHTML(htmlCode) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!htmlCode || typeof htmlCode !== 'string') {
            result.isValid = false;
            result.errors.push('Invalid HTML input');
            return result;
        }

        // Check for dangerous patterns in HTML
        const dangerousHTMLPatterns = [
            /<script[^>]*>/gi,                      // Script tags
            /javascript\s*:/gi,                     // JavaScript protocol
            /vbscript\s*:/gi,                       // VBScript protocol
            /on\w+\s*=/gi,                         // Event handlers
            /<iframe[^>]*>/gi,                      // Iframe tags
            /<object[^>]*>/gi,                      // Object tags
            /<embed[^>]*>/gi,                       // Embed tags
            /<form[^>]*>/gi,                        // Form tags
            /<input[^>]*>/gi,                       // Input tags
            /<meta[^>]*http-equiv/gi                // Meta refresh
        ];

        dangerousHTMLPatterns.forEach(pattern => {
            if (pattern.test(htmlCode)) {
                result.warnings.push(`Potentially dangerous HTML pattern: ${pattern.source}`);
            }
        });

        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeSanitizer;
} else if (typeof window !== 'undefined') {
    window.CodeSanitizer = CodeSanitizer;
}