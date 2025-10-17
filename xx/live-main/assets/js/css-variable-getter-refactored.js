/**
 * 🔄 Refactored getCSSVariable() Function - Centralized Mapping System
 * 
 * This refactored implementation replaces scattered attribute-based approaches
 * with a centralized mapping system that provides:
 * - Centralized mapping lookup replacing attribute-based approach
 * - Intelligent fallback generation for unmapped options
 * - Type-aware value transformation system
 * - Graceful error handling with detailed logging
 * 
 * @package ModernAdminStyler
 * @version 2.0.0 - Refactored Implementation
 */

(function(window, document) {
    'use strict';

    /**
     * 🎯 Refactored CSS Variable Getter - Main Class
     */
    class RefactoredCSSVariableGetter {
        constructor(options = {}) {
            // Configuration
            this.enableLogging = options.enableLogging !== false;
            this.enableFallbacks = options.enableFallbacks !== false;
            this.enableCaching = options.enableCaching !== false;
            this.cacheSize = options.cacheSize || 500;
            
            // Core data structures
            this.mappings = new Map();
            this.cache = this.enableCaching ? new Map() : null;
            this.fallbackCache = new Map();
            this.errorLog = [];
            
            // Performance metrics
            this.metrics = {
                lookups: 0,
                cacheHits: 0,
                cacheMisses: 0,
                fallbacksGenerated: 0,
                errors: 0,
                transformations: 0
            };
            
            // Initialize mappings
            this.initializeMappings();
            
            this.log('RefactoredCSSVariableGetter initialized', {
                mappings: this.mappings.size,
                caching: this.enableCaching,
                fallbacks: this.enableFallbacks
            });
        }

        /**
         * 🗺️ Initialize mappings from centralized configuration
         */
        initializeMappings() {
            // Load from global CSS_VARIABLE_MAP if available
            if (window.CSS_VARIABLE_MAP) {
                Object.entries(window.CSS_VARIABLE_MAP).forEach(([optionId, mapping]) => {
                    this.mappings.set(optionId, {
                        cssVar: mapping.cssVar,
                        type: mapping.type || 'string',
                        unit: mapping.unit || '',
                        fallback: mapping.fallback || '',
                        category: mapping.category || 'general',
                        description: mapping.description || '',
                        aliases: mapping.aliases || [],
                        deprecated: mapping.deprecated || false
                    });

                    // Add aliases
                    if (mapping.aliases && Array.isArray(mapping.aliases)) {
                        mapping.aliases.forEach(alias => {
                            this.mappings.set(alias, this.mappings.get(optionId));
                        });
                    }
                });
            } else {
                this.logWarning('CSS_VARIABLE_MAP not found, using fallback mode');
            }
        }

        /**
         * 🎯 Main getCSSVariable function - Centralized mapping lookup
         * 
         * @param {string} optionId - The option ID to look up
         * @param {Object} options - Additional options
         * @returns {string|null} CSS variable name or null if not found
         */
        getCSSVariable(optionId, options = {}) {
            this.metrics.lookups++;

            // Validate input
            if (!optionId || typeof optionId !== 'string') {
                this.logError('Invalid optionId provided to getCSSVariable', { optionId });
                this.metrics.errors++;
                return null;
            }

            // Check cache first (if enabled)
            if (this.enableCaching && this.cache && this.cache.has(optionId)) {
                this.metrics.cacheHits++;
                return this.cache.get(optionId);
            }

            this.metrics.cacheMisses++;

            try {
                // Look up in centralized mappings
                const mapping = this.mappings.get(optionId);
                
                if (mapping) {
                    const cssVar = mapping.cssVar;
                    
                    // Log deprecation warning if needed
                    if (mapping.deprecated) {
                        this.logWarning(`Option '${optionId}' is deprecated`, {
                            cssVar,
                            suggestion: 'Consider updating to newer option ID'
                        });
                    }
                    
                    // Cache the result
                    if (this.enableCaching && this.cache) {
                        this.setCacheValue(optionId, cssVar);
                    }
                    
                    this.log(`Mapped ${optionId} → ${cssVar}`);
                    return cssVar;
                }

                // Handle unmapped option
                return this.handleUnmappedOption(optionId, options);

            } catch (error) {
                this.logError(`Error in getCSSVariable for '${optionId}'`, error);
                this.metrics.errors++;
                
                // Return fallback on error
                if (this.enableFallbacks) {
                    return this.generateFallbackCSSVar(optionId);
                }
                
                return null;
            }
        }

        /**
         * 🔄 Transform value based on mapping type and unit
         * 
         * @param {string} optionId - The option ID
         * @param {*} value - The value to transform
         * @param {Object} options - Additional options
         * @returns {string} Transformed CSS value
         */
        transformValue(optionId, value, options = {}) {
            this.metrics.transformations++;

            // Get mapping for type information
            const mapping = this.mappings.get(optionId);
            
            if (!mapping) {
                this.logWarning(`No mapping found for transformation of '${optionId}', returning value as-is`);
                return String(value);
            }

            try {
                return this.applyTypeTransformation(value, mapping.type, mapping.unit, mapping.fallback);
            } catch (error) {
                this.logError(`Value transformation failed for '${optionId}'`, {
                    value,
                    type: mapping.type,
                    unit: mapping.unit,
                    error: error.message
                });
                
                // Return fallback value on transformation error
                return mapping.fallback || String(value);
            }
        }

        /**
         * 🔧 Apply type-specific transformation
         * 
         * @param {*} value - Value to transform
         * @param {string} type - Value type (color, numeric, boolean, string)
         * @param {string} unit - Unit for numeric values
         * @param {string} fallback - Fallback value
         * @returns {string} Transformed value
         */
        applyTypeTransformation(value, type, unit = '', fallback = '') {
            switch (type) {
                case 'boolean':
                    return this.transformBooleanValue(value);
                    
                case 'numeric':
                    return this.transformNumericValue(value, unit, fallback);
                    
                case 'color':
                    return this.transformColorValue(value, fallback);
                    
                case 'string':
                default:
                    return this.transformStringValue(value);
            }
        }

        /**
         * 🔢 Transform boolean value
         */
        transformBooleanValue(value) {
            if (typeof value === 'boolean') {
                return value ? '1' : '0';
            }
            
            if (typeof value === 'string') {
                const lowerValue = value.toLowerCase();
                if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes' || lowerValue === 'on') {
                    return '1';
                }
                if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no' || lowerValue === 'off') {
                    return '0';
                }
            }
            
            if (typeof value === 'number') {
                return value > 0 ? '1' : '0';
            }
            
            // Default to false for unknown values
            return '0';
        }

        /**
         * 🔢 Transform numeric value
         */
        transformNumericValue(value, unit, fallback) {
            const numValue = parseFloat(value);
            
            if (isNaN(numValue)) {
                if (fallback) {
                    this.logWarning(`Invalid numeric value '${value}', using fallback '${fallback}'`);
                    return fallback;
                }
                throw new Error(`Invalid numeric value: ${value}`);
            }
            
            // Handle special cases
            if (unit === '%' && numValue > 100) {
                this.logWarning(`Percentage value ${numValue} > 100%, clamping to 100%`);
                return '100%';
            }
            
            if (unit === 'px' && numValue < 0) {
                this.logWarning(`Negative pixel value ${numValue}, using 0`);
                return '0px';
            }
            
            return numValue + unit;
        }

        /**
         * 🎨 Transform color value
         */
        transformColorValue(value, fallback) {
            if (!value) {
                return fallback || 'transparent';
            }
            
            const stringValue = String(value).trim();
            
            // Validate color formats
            if (this.isValidColor(stringValue)) {
                return stringValue;
            }
            
            if (fallback) {
                this.logWarning(`Invalid color value '${value}', using fallback '${fallback}'`);
                return fallback;
            }
            
            throw new Error(`Invalid color value: ${value}`);
        }

        /**
         * 📝 Transform string value
         */
        transformStringValue(value) {
            if (value === null || value === undefined) {
                return '';
            }
            
            return String(value);
        }

        /**
         * 🎨 Validate color value
         */
        isValidColor(value) {
            if (typeof value !== 'string') return false;
            
            // Hex colors (#rgb, #rrggbb, #rrggbbaa)
            if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value)) {
                return true;
            }
            
            // RGB/RGBA functions
            if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(value)) {
                return true;
            }
            
            // HSL/HSLA functions
            if (/^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/.test(value)) {
                return true;
            }
            
            // CSS named colors (basic validation)
            const namedColors = [
                'transparent', 'currentColor', 'inherit', 'initial', 'unset',
                'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
                'gray', 'grey', 'orange', 'purple', 'pink', 'brown', 'navy', 'teal'
            ];
            
            if (namedColors.includes(value.toLowerCase())) {
                return true;
            }
            
            return false;
        }

        /**
         * 🚨 Handle unmapped option with intelligent fallback
         */
        handleUnmappedOption(optionId, options = {}) {
            this.logWarning(`No mapping found for option: ${optionId}`);
            
            if (!this.enableFallbacks) {
                return null;
            }
            
            // Check fallback cache
            if (this.fallbackCache.has(optionId)) {
                return this.fallbackCache.get(optionId);
            }
            
            // Generate intelligent fallback
            const fallbackVar = this.generateFallbackCSSVar(optionId);
            this.metrics.fallbacksGenerated++;
            
            // Cache the fallback
            this.fallbackCache.set(optionId, fallbackVar);
            
            // Suggest mapping to developer
            this.suggestMapping(optionId, fallbackVar);
            
            // Cache the result if caching is enabled
            if (this.enableCaching && this.cache) {
                this.setCacheValue(optionId, fallbackVar);
            }
            
            this.log(`Generated fallback for ${optionId} → ${fallbackVar}`);
            return fallbackVar;
        }

        /**
         * 🔧 Generate fallback CSS variable name using naming convention
         */
        generateFallbackCSSVar(optionId) {
            // Convert snake_case to kebab-case with --woow- prefix
            const kebabCase = optionId
                .toLowerCase()
                .replace(/_/g, '-')
                .replace(/[^a-z0-9-]/g, ''); // Remove invalid characters
            
            return `--woow-${kebabCase}`;
        }

        /**
         * 💡 Suggest mapping for unknown option
         */
        suggestMapping(optionId, fallbackVar) {
            // Find similar existing options
            const suggestions = this.findSimilarOptions(optionId);
            
            const suggestion = {
                optionId,
                fallbackVar,
                similarOptions: suggestions,
                timestamp: new Date().toISOString()
            };
            
            this.log(`💡 Mapping suggestion for '${optionId}':`, suggestion);
            
            // Store suggestion for development tools
            if (!window.woowMappingSuggestions) {
                window.woowMappingSuggestions = [];
            }
            window.woowMappingSuggestions.push(suggestion);
        }

        /**
         * 🔍 Find similar option IDs using string similarity
         */
        findSimilarOptions(optionId, threshold = 0.6) {
            const suggestions = [];
            
            for (const [existingOption] of this.mappings) {
                const similarity = this.calculateStringSimilarity(optionId, existingOption);
                if (similarity > threshold) {
                    suggestions.push({
                        option: existingOption,
                        similarity: Math.round(similarity * 100),
                        cssVar: this.mappings.get(existingOption).cssVar
                    });
                }
            }
            
            // Sort by similarity (highest first)
            return suggestions.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
        }

        /**
         * 📊 Calculate string similarity using Jaro-Winkler algorithm
         */
        calculateStringSimilarity(str1, str2) {
            if (str1 === str2) return 1.0;
            if (str1.length === 0 || str2.length === 0) return 0.0;
            
            const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
            const str1Matches = new Array(str1.length).fill(false);
            const str2Matches = new Array(str2.length).fill(false);
            
            let matches = 0;
            let transpositions = 0;
            
            // Find matches
            for (let i = 0; i < str1.length; i++) {
                const start = Math.max(0, i - matchWindow);
                const end = Math.min(i + matchWindow + 1, str2.length);
                
                for (let j = start; j < end; j++) {
                    if (str2Matches[j] || str1[i] !== str2[j]) continue;
                    str1Matches[i] = true;
                    str2Matches[j] = true;
                    matches++;
                    break;
                }
            }
            
            if (matches === 0) return 0.0;
            
            // Find transpositions
            let k = 0;
            for (let i = 0; i < str1.length; i++) {
                if (!str1Matches[i]) continue;
                while (!str2Matches[k]) k++;
                if (str1[i] !== str2[k]) transpositions++;
                k++;
            }
            
            const jaro = (matches / str1.length + matches / str2.length + 
                         (matches - transpositions / 2) / matches) / 3;
            
            // Jaro-Winkler prefix bonus
            let prefix = 0;
            for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
                if (str1[i] === str2[i]) prefix++;
                else break;
            }
            
            return jaro + (0.1 * prefix * (1 - jaro));
        }

        /**
         * 🗄️ Cache management
         */
        setCacheValue(key, value) {
            if (!this.cache) return;
            
            // Implement simple LRU by removing oldest entries when cache is full
            if (this.cache.size >= this.cacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(key, value);
        }

        /**
         * 🧹 Clear caches
         */
        clearCaches() {
            if (this.cache) {
                this.cache.clear();
            }
            this.fallbackCache.clear();
            this.log('Caches cleared');
        }

        /**
         * 📊 Get performance metrics
         */
        getMetrics() {
            const cacheHitRate = this.metrics.lookups > 0 ? 
                (this.metrics.cacheHits / this.metrics.lookups * 100).toFixed(2) : 0;
            
            return {
                ...this.metrics,
                cacheHitRate: `${cacheHitRate}%`,
                mappingCount: this.mappings.size,
                cacheSize: this.cache ? this.cache.size : 0,
                fallbackCacheSize: this.fallbackCache.size,
                errorLogSize: this.errorLog.length
            };
        }

        /**
         * 🔍 Get mapping information
         */
        getMappingInfo(optionId) {
            const mapping = this.mappings.get(optionId);
            if (!mapping) {
                return {
                    found: false,
                    optionId,
                    fallback: this.generateFallbackCSSVar(optionId)
                };
            }
            
            return {
                found: true,
                optionId,
                ...mapping
            };
        }

        /**
         * 📋 Get all mappings by category
         */
        getMappingsByCategory(category) {
            const categoryMappings = {};
            
            for (const [optionId, mapping] of this.mappings) {
                if (!category || mapping.category === category) {
                    categoryMappings[optionId] = mapping;
                }
            }
            
            return categoryMappings;
        }

        /**
         * 🧪 Test mapping functionality
         */
        testMapping(optionId, testValue = 'test') {
            const result = {
                optionId,
                testValue,
                success: false,
                cssVar: null,
                transformedValue: null,
                error: null
            };
            
            try {
                result.cssVar = this.getCSSVariable(optionId);
                result.transformedValue = this.transformValue(optionId, testValue);
                result.success = true;
            } catch (error) {
                result.error = error.message;
            }
            
            return result;
        }

        /**
         * 📝 Logging utilities with detailed context
         */
        log(message, data = null) {
            if (this.enableLogging) {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message,
                    data
                };
                console.log(`🔄 RefactoredCSSGetter: ${message}`, data || '');
            }
        }

        logWarning(message, data = null) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: 'warning',
                message,
                data
            };
            console.warn(`⚠️ RefactoredCSSGetter: ${message}`, data || '');
        }

        logError(message, error = null) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: 'error',
                message,
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } : error
            };
            
            this.errorLog.push(logEntry);
            console.error(`❌ RefactoredCSSGetter: ${message}`, error || '');
        }

        /**
         * 📊 Get error log
         */
        getErrorLog() {
            return [...this.errorLog];
        }

        /**
         * 🧹 Clear error log
         */
        clearErrorLog() {
            this.errorLog = [];
        }
    }

    // Make RefactoredCSSVariableGetter globally available
    window.RefactoredCSSVariableGetter = RefactoredCSSVariableGetter;

    // Create global instance
    window.refactoredCSSGetter = new RefactoredCSSVariableGetter({
        enableLogging: window.masV2Debug || false,
        enableFallbacks: true,
        enableCaching: true,
        cacheSize: 500
    });

    // Create backward-compatible getCSSVariable function
    window.getCSSVariable = function(optionId, options = {}) {
        return window.refactoredCSSGetter.getCSSVariable(optionId, options);
    };

    // Create backward-compatible transformValue function
    window.transformCSSValue = function(optionId, value, options = {}) {
        return window.refactoredCSSGetter.transformValue(optionId, value, options);
    };

    console.log('🔄 Refactored getCSSVariable() function initialized and ready');

})(window, document);