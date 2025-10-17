/**
 * Settings Validator
 * 
 * Provides comprehensive validation and sanitization for all setting values
 * including color validation, numeric validation, string sanitization,
 * XSS prevention, and data integrity protection.
 * 
 * @version 1.0.0
 * @author WOOW! Admin Styler
 */

class SettingsValidator {
    constructor() {
        // XSS patterns for detection
        this.xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b[^>]*>/gi,
            /<object\b[^>]*>/gi,
            /<embed\b[^>]*>/gi,
            /<link\b[^>]*>/gi,
            /<meta\b[^>]*>/gi,
            /data:text\/html/gi,
            /vbscript:/gi,
            /expression\s*\(/gi
        ];
        
        // Prototype pollution patterns
        this.prototypePollutionKeys = [
            '__proto__',
            'constructor',
            'prototype'
        ];
        
        // Color validation patterns
        this.colorPatterns = {
            hex: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            hexShort: /^#[A-Fa-f0-9]{3}$/,
            hexLong: /^#[A-Fa-f0-9]{6}$/,
            rgb: /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/,
            rgba: /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([01]?\.?\d*)\s*\)$/,
            hsl: /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/
        };
        
        // Safe HTML tags for sanitization
        this.safeTags = ['p', 'strong', 'em', 'b', 'i', 'u', 'br', 'span'];
        
        // Initialize logger
        this.initializeLogger();
    }
    
    /**
     * Initialize logger
     */
    initializeLogger() {
        this.logger = {
            warn: (msg, data) => console.warn(`[VALIDATOR] ${msg}`, data),
            error: (msg, data) => console.error(`[VALIDATOR] ${msg}`, data),
            debug: (msg, data) => console.log(`[VALIDATOR] ${msg}`, data)
        };
    }
    
    /**
     * Validate color value
     * 
     * @param {*} value - Color value to validate
     * @returns {Object} Validation result
     */
    validateColor(value) {
        const result = {
            valid: false,
            sanitized: '#000000',
            fallback: '#000000',
            error: null,
            wasModified: false,
            suggestion: null,
            examples: ['#ff0000', '#00ff00', '#0000ff']
        };
        
        // Check for null/undefined
        if (value == null) {
            result.error = 'Color value is null or undefined';
            this.logger.warn('Invalid color value', { input: value, error: result.error });
            return result;
        }
        
        // Check for non-string types
        if (typeof value !== 'string') {
            result.error = 'Color value must be a string';
            this.logger.warn('Invalid color value', { input: value, error: result.error });
            return result;
        }
        
        // Check for XSS attempts
        if (this.containsXSS(value)) {
            result.error = 'Potentially malicious input detected';
            result.threat = 'xss';
            this.logger.error('Security violation', { 
                input: value, 
                type: 'xss_attempt' 
            });
            return result;
        }
        
        // Trim whitespace
        const trimmed = value.trim();
        
        // Check for valid hex color (with or without #)
        let hexValue = trimmed;
        let wasModified = false;
        
        if (!hexValue.startsWith('#')) {
            hexValue = '#' + hexValue;
            wasModified = true;
        }
        
        // Convert to lowercase
        if (hexValue !== hexValue.toLowerCase()) {
            hexValue = hexValue.toLowerCase();
            wasModified = true;
        }
        
        // Check for short hex and expand
        if (this.colorPatterns.hexShort.test(hexValue)) {
            const shortHex = hexValue.slice(1);
            hexValue = '#' + shortHex.split('').map(c => c + c).join('');
            wasModified = true;
        }
        
        // Validate final hex format
        if (this.colorPatterns.hexLong.test(hexValue)) {
            result.valid = true;
            result.sanitized = hexValue;
            result.wasModified = wasModified || (value !== hexValue);
            result.error = null;
            return result;
        }
        
        // Try to parse RGB format
        const rgbMatch = trimmed.match(this.colorPatterns.rgb);
        if (rgbMatch) {
            const [, r, g, b] = rgbMatch;
            if (r <= 255 && g <= 255 && b <= 255) {
                result.valid = true;
                result.sanitized = this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
                result.wasModified = true;
                return result;
            }
        }
        
        // Try to parse RGBA format
        const rgbaMatch = trimmed.match(this.colorPatterns.rgba);
        if (rgbaMatch) {
            const [, r, g, b] = rgbaMatch;
            if (r <= 255 && g <= 255 && b <= 255) {
                result.valid = true;
                result.sanitized = this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
                result.wasModified = true;
                return result;
            }
        }
        
        // Try to parse HSL format
        const hslMatch = trimmed.match(this.colorPatterns.hsl);
        if (hslMatch) {
            const [, h, s, l] = hslMatch;
            if (h <= 360 && s <= 100 && l <= 100) {
                result.valid = true;
                result.sanitized = this.hslToHex(parseInt(h), parseInt(s), parseInt(l));
                result.wasModified = true;
                return result;
            }
        }
        
        // Invalid color format
        result.error = 'Invalid hex color format';
        result.suggestion = 'Use format #RRGGBB (e.g., #ff0000 for red)';
        
        this.logger.warn('Invalid color value', {
            input: value,
            error: result.error
        });
        
        // Show user notification
        if (window.WoowNotifications) {
            window.WoowNotifications.showError('Invalid color format', {
                details: 'Please use hex format like #ff0000 or use the color picker',
                actions: [{
                    text: 'Use Color Picker',
                    action: () => {
                        // Trigger color picker if available
                        if (window.WoowColorPicker) {
                            window.WoowColorPicker.open();
                        }
                    }
                }]
            });
        }
        
        return result;
    }
    
    /**
     * Validate numeric value
     * 
     * @param {*} value - Numeric value to validate
     * @param {Object} constraints - Validation constraints
     * @returns {Object} Validation result
     */
    validateNumber(value, constraints = {}) {
        const result = {
            valid: false,
            sanitized: 0,
            fallback: constraints.default || 0,
            error: null,
            clamped: null,
            rounded: null
        };
        
        // Check for null/undefined
        if (value == null) {
            result.error = 'Numeric value is null or undefined';
            result.sanitized = result.fallback;
            return result;
        }
        
        // Check for function type (potential XSS)
        if (typeof value === 'function') {
            result.error = 'Function not allowed as numeric value';
            result.sanitized = result.fallback;
            this.logger.error('Security violation', { 
                input: value, 
                type: 'function_injection' 
            });
            return result;
        }
        
        // Handle string values
        if (typeof value === 'string') {
            // Check for XSS attempts
            if (this.containsXSS(value)) {
                result.error = 'Potentially malicious input detected';
                result.sanitized = result.fallback;
                this.logger.error('Security violation', { 
                    input: value, 
                    type: 'xss_attempt' 
                });
                return result;
            }
            
            // Check for obviously invalid string values first
            if (value.trim() === 'not_a_number' || value.trim() === 'NaN' || 
                value.trim() === 'Infinity' || value.trim() === '-Infinity' ||
                value.includes('.') && value.split('.').length > 2) { // Multiple decimal points
                result.error = 'Value is not a valid number';
                result.sanitized = result.fallback;
                return result;
            }
            
            // Sanitize string by removing non-numeric characters
            let sanitized = value.trim();
            sanitized = sanitized.replace(/[^\d.-]/g, ''); // Remove units, currency, etc.
            sanitized = sanitized.replace(/,/g, ''); // Remove commas
            
            value = parseFloat(sanitized);
        }
        
        // Check for NaN, Infinity
        if (isNaN(value) || !isFinite(value)) {
            result.error = 'Value is not a valid number';
            result.sanitized = result.fallback;
            return result;
        }
        
        // Special handling for string representations of invalid numbers
        if (typeof value === 'string') {
            const originalString = arguments[0]; // Get original input
            if (originalString === 'NaN' || originalString === 'Infinity' || originalString === '-Infinity') {
                result.error = 'Value is not a valid number';
                result.sanitized = result.fallback;
                return result;
            }
        }
        
        // Apply constraints
        let finalValue = value;
        
        // Integer constraint
        if (constraints.integer && !Number.isInteger(finalValue)) {
            result.rounded = Math.round(finalValue);
            finalValue = result.rounded;
            result.error = 'Value must be integer, rounded to nearest';
        }
        
        // Min/max constraints
        if (constraints.min != null && finalValue < constraints.min) {
            result.clamped = constraints.min;
            finalValue = constraints.min;
            result.error = `Value ${value} is below minimum ${constraints.min}`;
        }
        
        if (constraints.max != null && finalValue > constraints.max) {
            result.clamped = constraints.max;
            finalValue = constraints.max;
            result.error = `Value ${value} is above maximum ${constraints.max}`;
        }
        
        // If we had to clamp or round, it's technically invalid but recoverable
        if (result.clamped != null || result.rounded != null) {
            result.valid = false;
            result.sanitized = finalValue;
        } else {
            result.valid = true;
            result.sanitized = finalValue;
            result.error = null;
        }
        
        return result;
    }
    
    /**
     * Validate string value
     * 
     * @param {*} value - String value to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateString(value, options = {}) {
        const result = {
            valid: true,
            sanitized: '',
            threat: null,
            error: null,
            wasModified: false,
            truncated: null
        };
        
        // Check for null/undefined
        if (value == null) {
            result.valid = false;
            result.error = 'String value is null or undefined';
            return result;
        }
        
        // Convert to string
        let stringValue = String(value);
        
        // Check for XSS attempts
        if (this.containsXSS(stringValue)) {
            result.valid = false;
            result.threat = 'xss';
            result.error = 'XSS attempt detected';
            result.sanitized = this.sanitizeXSS(stringValue);
            result.wasModified = true;
            
            this.logger.error('XSS attempt detected', {
                input: stringValue,
                sanitized: result.sanitized
            });
            
            return result;
        }
        
        // HTML sanitization if allowed
        if (options.allowHTML) {
            const sanitized = this.sanitizeHTML(stringValue);
            result.sanitized = sanitized;
            result.wasModified = sanitized !== stringValue;
        } else {
            result.sanitized = stringValue;
        }
        
        // Length constraints
        if (options.minLength && result.sanitized.length < options.minLength) {
            result.valid = false;
            result.error = `String too short (minimum ${options.minLength} characters)`;
            return result;
        }
        
        if (options.maxLength && result.sanitized.length > options.maxLength) {
            result.valid = false;
            result.error = `String too long (maximum ${options.maxLength} characters)`;
            result.truncated = result.sanitized.substring(0, options.maxLength);
            return result;
        }
        
        return result;
    }
    
    /**
     * Validate object structure
     * 
     * @param {*} value - Object to validate
     * @param {Object} schema - Validation schema
     * @returns {Object} Validation result
     */
    validateObject(value, schema) {
        const result = {
            valid: true,
            sanitized: {},
            errors: [],
            threat: null
        };
        
        // Check for null/undefined
        if (value == null) {
            result.valid = false;
            result.errors.push('Object is null or undefined');
            return result;
        }
        
        // Check for prototype pollution first
        if (this.hasPrototypePollution(value)) {
            result.valid = false;
            result.threat = 'prototype_pollution';
            result.errors.push('Prototype pollution attempt detected');
            
            this.logger.error('Prototype pollution attempt', {
                input: value
            });
            
            // Sanitize by removing dangerous keys
            value = this.sanitizePrototypePollution(value);
            return result; // Return early for security
        }
        
        // Validate each property according to schema
        for (const [key, constraints] of Object.entries(schema)) {
            if (value.hasOwnProperty(key)) {
                const propResult = this.validateProperty(value[key], constraints);
                
                if (!propResult.valid) {
                    result.valid = false;
                    result.errors.push(`${key}: ${propResult.error}`);
                }
                
                result.sanitized[key] = propResult.sanitized;
            } else if (constraints.required) {
                result.valid = false;
                result.errors.push(`Required property '${key}' is missing`);
                result.sanitized[key] = constraints.default || null;
            }
        }
        
        return result;
    }
    
    /**
     * Validate individual property
     * 
     * @param {*} value - Property value
     * @param {Object} constraints - Property constraints
     * @returns {Object} Validation result
     */
    validateProperty(value, constraints) {
        switch (constraints.type) {
            case 'color':
                return this.validateColor(value);
            case 'number':
                return this.validateNumber(value, constraints);
            case 'string':
                return this.validateString(value, constraints);
            case 'object':
                return this.validateObject(value, constraints.properties || {});
            default:
                return { valid: true, sanitized: value };
        }
    }
    
    /**
     * Validate complete settings object
     * 
     * @param {Object} settings - Settings to validate
     * @returns {Object} Validation result
     */
    validateSettings(settings) {
        const schema = {
            admin_bar_color: { type: 'color', required: false, default: '#000000' },
            font_size: { type: 'number', min: 10, max: 24, integer: true },
            theme_name: { type: 'string', maxLength: 50 },
            sidebar_width: { type: 'number', min: 200, max: 500 }
        };
        
        const result = this.validateObject(settings, schema);
        
        // Show user notification for validation errors
        if (!result.valid && window.WoowNotifications) {
            const errorCount = result.errors.length;
            window.WoowNotifications.showError(
                `${errorCount} validation error${errorCount > 1 ? 's' : ''} found`,
                {
                    details: result.errors,
                    duration: 10000
                }
            );
        }
        
        return result;
    }
    
    /**
     * Validate any value with automatic type detection
     * 
     * @param {*} value - Value to validate
     * @returns {Object} Validation result
     */
    validateValue(value) {
        const result = {
            valid: true,
            sanitized: value,
            suggestion: null
        };
        
        // Try to detect type and provide suggestions
        if (typeof value === 'string') {
            // Check if it looks like a color
            if (value.match(/^#?[0-9a-fA-F]{3,6}$/) || value.match(/^rgb/)) {
                const colorResult = this.validateColor(value);
                if (!colorResult.valid) {
                    if (value.match(/^[0-9a-fA-F]{6}$/)) {
                        colorResult.suggestion = 'Add # prefix to hex color';
                    } else if (value.match(/^#[0-9a-fA-F]{3}$/)) {
                        colorResult.suggestion = 'Expand to full 6-digit hex';
                    } else if (value.match(/^rgb/)) {
                        colorResult.suggestion = 'Convert RGB to hex format';
                    }
                }
                return colorResult;
            }
            
            // Check if it looks like a number with units
            if (value.match(/^\d+px$/)) {
                return {
                    valid: false,
                    suggestion: 'Remove unit suffix',
                    sanitized: parseInt(value)
                };
            }
        }
        
        return result;
    }
    
    /**
     * Check if string contains XSS patterns
     * 
     * @param {string} value - String to check
     * @returns {boolean} True if XSS detected
     */
    containsXSS(value) {
        return this.xssPatterns.some(pattern => pattern.test(value));
    }
    
    /**
     * Sanitize XSS from string
     * 
     * @param {string} value - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeXSS(value) {
        let sanitized = value;
        
        // Remove script tags
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Remove javascript: protocols
        sanitized = sanitized.replace(/javascript:/gi, '');
        
        // Remove event handlers
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        
        // Remove dangerous tags
        sanitized = sanitized.replace(/<(iframe|object|embed|link|meta)\b[^>]*>/gi, '');
        
        return sanitized;
    }
    
    /**
     * Sanitize HTML while preserving safe tags
     * 
     * @param {string} value - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(value) {
        // First, remove dangerous attributes from all tags
        let sanitized = value.replace(/<([^>\/]+)(\s*\/?)>/g, (match, tagContent, selfClosing) => {
            // Extract tag name
            const tagName = tagContent.split(' ')[0].toLowerCase();
            
            // Only allow safe tags
            if (this.safeTags.includes(tagName)) {
                // Remove dangerous attributes
                const cleanTag = tagContent.replace(/\s+(on\w+|javascript:|data:|src=|href=)[^>\s]*/gi, '');
                return `<${cleanTag}${selfClosing}>`;
            }
            
            return ''; // Remove unsafe tags
        });
        
        // Handle closing tags
        sanitized = sanitized.replace(/<\/([^>]+)>/g, (match, tagName) => {
            if (this.safeTags.includes(tagName.toLowerCase())) {
                return match;
            }
            return '';
        });
        
        return sanitized;
    }
    
    /**
     * Check for prototype pollution
     * 
     * @param {Object} obj - Object to check
     * @returns {boolean} True if pollution detected
     */
    hasPrototypePollution(obj) {
        return this.prototypePollutionKeys.some(key => obj.hasOwnProperty(key));
    }
    
    /**
     * Sanitize prototype pollution
     * 
     * @param {Object} obj - Object to sanitize
     * @returns {Object} Sanitized object
     */
    sanitizePrototypePollution(obj) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(obj)) {
            if (!this.prototypePollutionKeys.includes(key)) {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    }
    
    /**
     * Convert RGB to hex
     * 
     * @param {number} r - Red value
     * @param {number} g - Green value
     * @param {number} b - Blue value
     * @returns {string} Hex color
     */
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    /**
     * Convert HSL to hex
     * 
     * @param {number} h - Hue value
     * @param {number} s - Saturation value
     * @param {number} l - Lightness value
     * @returns {string} Hex color
     */
    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return this.rgbToHex(
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        );
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsValidator;
}

// Global availability for browser
if (typeof window !== 'undefined') {
    window.SettingsValidator = SettingsValidator;
}