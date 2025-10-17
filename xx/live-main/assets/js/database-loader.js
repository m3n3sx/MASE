/**
 * DatabaseLoader - WordPress Database Integration for CSS Variables
 * 
 * Handles WordPress database communication with proper error handling,
 * timeout management, and data validation for CSS variable restoration.
 */
class DatabaseLoader {
    constructor() {
        // WordPress AJAX configuration
        this.ajaxUrl = window.woowAdminStyler?.ajaxUrl || '/wp-admin/admin-ajax.php';
        this.nonce = window.woowAdminStyler?.nonce || '';
        this.loadTimeout = 2000; // 2 seconds timeout
        this.retryAttempts = 2;
        this.retryDelay = 500; // 500ms between retries
    }

    /**
     * Load all CSS variables from WordPress database
     * @returns {Promise<Object>} CSS variables object or null on failure
     */
    async loadAllVariables() {
        let lastError = null;
        
        // Retry mechanism for network failures
        for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
            try {
                const result = await this.attemptDatabaseLoad();
                if (result) {
                    return result;
                }
            } catch (error) {
                lastError = error;
                
                // Don't retry on certain errors
                if (this.isNonRetryableError(error)) {
                    break;
                }
                
                // Wait before retry (except on last attempt)
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * (attempt + 1));
                }
            }
        }
        
        throw lastError || new Error('Database load failed after all retry attempts');
    }

    /**
     * Single attempt to load from database with timeout
     * @returns {Promise<Object|null>} CSS variables or null
     */
    async attemptDatabaseLoad() {
        const formData = new FormData();
        formData.append('action', 'woow_load_css_variables');
        formData.append('nonce', this.nonce);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, this.loadTimeout);

        try {
            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.data?.message || data.data || 'Unknown database error');
            }

            return this.validateAndTransformData(data.data);
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Database load timeout after ${this.loadTimeout}ms`);
            }
            
            throw error;
        }
    }

    /**
     * Validate and transform raw database data to CSS variable format
     * @param {Object} rawData - Raw data from WordPress database
     * @returns {Object} Validated CSS variables object
     */
    validateAndTransformData(rawData) {
        if (!rawData || typeof rawData !== 'object') {
            throw new Error('Invalid data format received from database');
        }

        const validatedData = {};
        let validCount = 0;
        let invalidCount = 0;

        for (const [key, value] of Object.entries(rawData)) {
            try {
                // Transform key to CSS variable format
                const cssVarName = this.transformToCSSVariable(key);
                
                // Validate and sanitize value
                const sanitizedValue = this.validateAndSanitizeValue(value);
                
                if (sanitizedValue !== null) {
                    validatedData[cssVarName] = sanitizedValue;
                    validCount++;
                } else {
                    invalidCount++;
                    console.warn(`Invalid CSS variable value for ${key}:`, value);
                }
            } catch (error) {
                invalidCount++;
                console.warn(`Error processing CSS variable ${key}:`, error.message);
            }
        }

        // Log validation summary
        console.log(`DatabaseLoader: Validated ${validCount} variables, rejected ${invalidCount}`);

        return validatedData;
    }

    /**
     * Transform database key to CSS variable name
     * @param {string} key - Database option key
     * @returns {string} CSS variable name
     */
    transformToCSSVariable(key) {
        // If already a CSS variable, return as-is
        if (key.startsWith('--')) {
            return key;
        }

        // Transform WordPress option key to CSS variable
        // e.g., 'woow_surface_bar' -> '--woow-surface-bar'
        let cssVar = key;
        
        // Remove 'woow_' prefix if present
        if (cssVar.startsWith('woow_')) {
            cssVar = cssVar.substring(5);
        }
        
        // Replace underscores with hyphens
        cssVar = cssVar.replace(/_/g, '-');
        
        // Add CSS variable prefix
        return `--woow-${cssVar}`;
    }

    /**
     * Validate and sanitize CSS variable value
     * @param {*} value - Raw value from database
     * @returns {string|null} Sanitized value or null if invalid
     */
    validateAndSanitizeValue(value) {
        // Convert to string
        if (typeof value !== 'string') {
            if (value === null || value === undefined) {
                return null;
            }
            value = String(value);
        }

        // Basic validation
        if (value.length === 0) {
            return null;
        }

        // Length limit for security
        if (value.length > 1000) {
            console.warn('CSS variable value too long, truncating');
            value = value.substring(0, 1000);
        }

        // Remove potentially dangerous characters
        value = value.replace(/[<>]/g, '');

        // Validate CSS value format (basic check)
        if (!this.isValidCSSValue(value)) {
            return null;
        }

        return value.trim();
    }

    /**
     * Basic CSS value validation
     * @param {string} value - CSS value to validate
     * @returns {boolean} True if valid
     */
    isValidCSSValue(value) {
        // Allow common CSS value patterns
        const validPatterns = [
            /^#[0-9a-fA-F]{3,8}$/, // Hex colors
            /^rgb\([^)]+\)$/, // RGB colors
            /^rgba\([^)]+\)$/, // RGBA colors
            /^hsl\([^)]+\)$/, // HSL colors
            /^hsla\([^)]+\)$/, // HSLA colors
            /^\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)$/, // Dimensions
            /^[a-zA-Z-]+$/, // Keywords (e.g., 'bold', 'center')
            /^[a-zA-Z-]+,\s*[a-zA-Z-\s,]+$/, // Font families
            /^\d+(\.\d+)?$/, // Numbers
            /^calc\([^)]+\)$/, // Calc expressions
            /^var\(--[^)]+\)$/ // CSS variables
        ];

        // Check against patterns
        return validPatterns.some(pattern => pattern.test(value)) || 
               // Allow simple text values (fallback)
               /^[a-zA-Z0-9\s\-_.,#%()]+$/.test(value);
    }

    /**
     * Check if error should not be retried
     * @param {Error} error - Error to check
     * @returns {boolean} True if non-retryable
     */
    isNonRetryableError(error) {
        const nonRetryableMessages = [
            'nonce verification failed',
            'unauthorized',
            'forbidden',
            'invalid action',
            'malformed request'
        ];

        const message = error.message.toLowerCase();
        return nonRetryableMessages.some(msg => message.includes(msg));
    }

    /**
     * Delay utility for retry mechanism
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get connection status for debugging
     * @returns {Object} Connection status information
     */
    getConnectionStatus() {
        return {
            ajaxUrl: this.ajaxUrl,
            hasNonce: !!this.nonce,
            timeout: this.loadTimeout,
            retryAttempts: this.retryAttempts,
            isOnline: navigator.onLine
        };
    }

    /**
     * Test database connection
     * @returns {Promise<boolean>} True if connection successful
     */
    async testConnection() {
        try {
            const formData = new FormData();
            formData.append('action', 'woow_test_connection');
            formData.append('nonce', this.nonce);

            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseLoader;
}

// Global availability
window.DatabaseLoader = DatabaseLoader;