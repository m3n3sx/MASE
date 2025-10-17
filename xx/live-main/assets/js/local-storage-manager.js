/**
 * LocalStorageManager - Fallback storage management for CSS variables
 * 
 * Handles localStorage operations with error handling, cache expiration,
 * validation mechanisms, and versioned data structures.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
class LocalStorageManager {
    constructor() {
        this.storageKey = 'woow_css_variables';
        this.maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.currentVersion = '1.0';
        this.maxRetries = 3;
        this.retryDelay = 100; // milliseconds
    }

    /**
     * Get all CSS variables from localStorage with validation
     * Requirements: 3.1, 3.2
     * 
     * @returns {Object} CSS variables object or empty object if failed/expired
     */
    getAllVariables() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                console.log('[LocalStorageManager] No cached data found');
                return {};
            }

            const parsed = JSON.parse(stored);
            
            // Validate data structure
            if (!this.isValidCacheStructure(parsed)) {
                console.warn('[LocalStorageManager] Invalid cache structure, clearing cache');
                this.clearCache();
                return {};
            }

            // Check if data is expired
            if (this.isExpired(parsed.timestamp)) {
                console.log('[LocalStorageManager] Cache expired, clearing cache');
                this.clearCache();
                return {};
            }

            // Check version compatibility
            if (!this.isVersionCompatible(parsed.version)) {
                console.log('[LocalStorageManager] Version incompatible, clearing cache');
                this.clearCache();
                return {};
            }

            console.log(`[LocalStorageManager] Loaded ${Object.keys(parsed.variables).length} variables from cache`);
            return parsed.variables || {};

        } catch (error) {
            console.warn('[LocalStorageManager] Error reading from localStorage:', error);
            this.handleStorageError(error);
            return {};
        }
    }

    /**
     * Update cache with new CSS variables
     * Requirements: 3.3, 3.4
     * 
     * @param {Object} variables - CSS variables to cache
     * @param {Object} options - Additional options (source, metadata)
     * @returns {boolean} Success status
     */
    updateCache(variables, options = {}) {
        if (!variables || typeof variables !== 'object') {
            console.warn('[LocalStorageManager] Invalid variables provided for caching');
            return false;
        }

        try {
            // Validate variables before caching
            const validatedVariables = this.validateVariables(variables);
            
            const cacheData = {
                variables: validatedVariables,
                timestamp: Date.now(),
                version: this.currentVersion,
                source: options.source || 'unknown',
                metadata: {
                    variableCount: Object.keys(validatedVariables).length,
                    lastUpdate: new Date().toISOString(),
                    userAgent: navigator.userAgent.substring(0, 100), // Truncated for storage efficiency
                    ...options.metadata
                }
            };

            return this.writeToStorage(cacheData);

        } catch (error) {
            console.warn('[LocalStorageManager] Error updating cache:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * Clear all cached data
     * Requirements: 3.3
     * 
     * @returns {boolean} Success status
     */
    clearCache() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('[LocalStorageManager] Cache cleared successfully');
            return true;
        } catch (error) {
            console.warn('[LocalStorageManager] Error clearing cache:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * Get specific CSS variable from cache
     * Requirements: 3.1, 3.2
     * 
     * @param {string} cssVar - CSS variable name
     * @returns {string|null} Variable value or null if not found
     */
    getVariable(cssVar) {
        const allVariables = this.getAllVariables();
        return allVariables[cssVar] || null;
    }

    /**
     * Update specific CSS variable in cache
     * Requirements: 3.3
     * 
     * @param {string} cssVar - CSS variable name
     * @param {string} value - CSS variable value
     * @returns {boolean} Success status
     */
    updateVariable(cssVar, value) {
        const allVariables = this.getAllVariables();
        allVariables[cssVar] = value;
        return this.updateCache(allVariables, { source: 'single-update' });
    }

    /**
     * Get cache metadata and statistics
     * Requirements: 3.2, 3.4
     * 
     * @returns {Object|null} Cache metadata or null if no cache
     */
    getCacheInfo() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return null;

            const parsed = JSON.parse(stored);
            
            return {
                timestamp: parsed.timestamp,
                version: parsed.version,
                source: parsed.source,
                variableCount: parsed.metadata?.variableCount || 0,
                lastUpdate: parsed.metadata?.lastUpdate,
                isExpired: this.isExpired(parsed.timestamp),
                isValid: this.isValidCacheStructure(parsed),
                isVersionCompatible: this.isVersionCompatible(parsed.version),
                ageInHours: Math.round((Date.now() - parsed.timestamp) / (1000 * 60 * 60))
            };

        } catch (error) {
            console.warn('[LocalStorageManager] Error getting cache info:', error);
            return null;
        }
    }

    /**
     * Cleanup expired or invalid cache entries
     * Requirements: 3.3
     * 
     * @returns {boolean} Success status
     */
    cleanup() {
        const cacheInfo = this.getCacheInfo();
        
        if (!cacheInfo) {
            console.log('[LocalStorageManager] No cache to cleanup');
            return true;
        }

        if (cacheInfo.isExpired || !cacheInfo.isValid || !cacheInfo.isVersionCompatible) {
            console.log('[LocalStorageManager] Cleaning up invalid/expired cache');
            return this.clearCache();
        }

        console.log('[LocalStorageManager] Cache is valid, no cleanup needed');
        return true;
    }

    // Private helper methods

    /**
     * Check if cached data has expired
     * Requirements: 3.2
     * 
     * @param {number} timestamp - Cache timestamp
     * @returns {boolean} True if expired
     */
    isExpired(timestamp) {
        if (!timestamp || typeof timestamp !== 'number') {
            return true;
        }
        return (Date.now() - timestamp) > this.maxAge;
    }

    /**
     * Validate cache data structure
     * Requirements: 3.2, 3.4
     * 
     * @param {Object} data - Parsed cache data
     * @returns {boolean} True if valid structure
     */
    isValidCacheStructure(data) {
        return data &&
               typeof data === 'object' &&
               typeof data.variables === 'object' &&
               typeof data.timestamp === 'number' &&
               typeof data.version === 'string' &&
               data.variables !== null;
    }

    /**
     * Check version compatibility
     * Requirements: 3.4
     * 
     * @param {string} version - Cached version
     * @returns {boolean} True if compatible
     */
    isVersionCompatible(version) {
        if (!version) return false;
        
        // Simple version compatibility check
        // In the future, this could be more sophisticated
        const majorVersion = version.split('.')[0];
        const currentMajorVersion = this.currentVersion.split('.')[0];
        
        return majorVersion === currentMajorVersion;
    }

    /**
     * Validate CSS variables object
     * Requirements: 3.2
     * 
     * @param {Object} variables - Variables to validate
     * @returns {Object} Validated variables
     */
    validateVariables(variables) {
        const validated = {};
        
        for (const [key, value] of Object.entries(variables)) {
            // Validate CSS variable name
            if (this.isValidCSSVariableName(key) && this.isValidCSSValue(value)) {
                validated[key] = value;
            } else {
                console.warn(`[LocalStorageManager] Invalid CSS variable: ${key}=${value}`);
            }
        }
        
        return validated;
    }

    /**
     * Validate CSS variable name
     * Requirements: 3.2
     * 
     * @param {string} name - CSS variable name
     * @returns {boolean} True if valid
     */
    isValidCSSVariableName(name) {
        return typeof name === 'string' &&
               name.startsWith('--') &&
               name.length > 2 &&
               name.length < 100 &&
               /^--[a-zA-Z0-9-_]+$/.test(name);
    }

    /**
     * Validate CSS value
     * Requirements: 3.2
     * 
     * @param {string} value - CSS value
     * @returns {boolean} True if valid
     */
    isValidCSSValue(value) {
        return typeof value === 'string' &&
               value.length > 0 &&
               value.length < 1000 &&
               !value.includes('\n') &&
               !value.includes('\r');
    }

    /**
     * Write data to localStorage with retry mechanism
     * Requirements: 3.1, 3.3
     * 
     * @param {Object} data - Data to write
     * @returns {boolean} Success status
     */
    writeToStorage(data) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const serialized = JSON.stringify(data);
                
                // Check if data size is reasonable (< 5MB)
                if (serialized.length > 5 * 1024 * 1024) {
                    console.warn('[LocalStorageManager] Data too large for localStorage');
                    return false;
                }

                localStorage.setItem(this.storageKey, serialized);
                console.log(`[LocalStorageManager] Cache updated successfully (${serialized.length} bytes)`);
                return true;

            } catch (error) {
                console.warn(`[LocalStorageManager] Write attempt ${attempt} failed:`, error);
                
                // Handle quota exceeded immediately, don't retry
                if (error.name === 'QuotaExceededError') {
                    this.handleStorageError(error);
                    return false;
                }
                
                if (attempt < this.maxRetries) {
                    // Wait before retry for other errors
                    setTimeout(() => {}, this.retryDelay * attempt);
                } else {
                    this.handleStorageError(error);
                    return false;
                }
            }
        }
        
        return false;
    }

    /**
     * Handle localStorage errors with appropriate actions
     * Requirements: 3.1
     * 
     * @param {Error} error - Storage error
     */
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('[LocalStorageManager] localStorage quota exceeded, attempting cleanup');
            this.handleQuotaExceeded();
        } else if (error.name === 'SecurityError') {
            console.warn('[LocalStorageManager] localStorage access denied (private browsing?)');
        } else {
            console.warn('[LocalStorageManager] localStorage error:', error);
        }
    }

    /**
     * Handle quota exceeded error
     * Requirements: 3.3
     */
    handleQuotaExceeded() {
        try {
            // Try to clear our cache to free up space
            this.clearCache();
            console.log('[LocalStorageManager] Cleared cache due to quota exceeded');
        } catch (error) {
            console.warn('[LocalStorageManager] Failed to clear cache during quota handling:', error);
        }
    }

    /**
     * Check if localStorage is available
     * Requirements: 3.1
     * 
     * @returns {boolean} True if localStorage is available
     */
    isStorageAvailable() {
        try {
            const testKey = '__woow_storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('[LocalStorageManager] localStorage not available:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * Requirements: 3.2
     * 
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            const size = stored ? stored.length : 0;
            
            return {
                isAvailable: this.isStorageAvailable(),
                cacheSize: size,
                cacheSizeKB: Math.round(size / 1024),
                hasCache: !!stored,
                cacheInfo: this.getCacheInfo()
            };
        } catch (error) {
            return {
                isAvailable: false,
                cacheSize: 0,
                cacheSizeKB: 0,
                hasCache: false,
                error: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalStorageManager;
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
    window.LocalStorageManager = LocalStorageManager;
}