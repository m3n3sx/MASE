/**
 * 🔄 CSS Variable Migration System - Backward Compatibility Layer
 * 
 * Provides seamless migration from legacy data-css-var attributes to centralized mapping:
 * - Feature flag system to switch between old and new approaches
 * - Legacy data-css-var attribute support during transition
 * - Deprecation warnings for legacy usage patterns
 * - Migration utilities for updating existing code
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Migration System
 */

(function(window, document) {
    'use strict';

    /**
     * 🚩 Feature Flags Configuration
     */
    const MIGRATION_FLAGS = {
        // Core migration flags
        USE_CENTRALIZED_MAPPING: true,          // Enable new centralized mapping system
        SUPPORT_LEGACY_ATTRIBUTES: true,        // Support legacy data-css-var attributes
        SHOW_DEPRECATION_WARNINGS: true,        // Show warnings for legacy usage
        AUTO_MIGRATE_LEGACY: false,             // Automatically migrate legacy attributes
        STRICT_MODE: false,                     // Fail on legacy usage (for testing)
        
        // Development flags
        LOG_MIGRATION_ACTIVITY: true,           // Log migration activities
        COLLECT_MIGRATION_STATS: true,         // Collect usage statistics
        GENERATE_MIGRATION_REPORT: true,       // Generate migration reports
        
        // Performance flags
        CACHE_LEGACY_LOOKUPS: true,            // Cache legacy attribute lookups
        BATCH_LEGACY_UPDATES: true,            // Batch legacy DOM updates
        
        // Testing flags
        MOCK_LEGACY_SYSTEM: false,             // Mock legacy system for testing
        FORCE_LEGACY_MODE: false               // Force legacy mode for comparison
    };

    /**
     * 🔄 CSS Variable Migration Manager
     */
    class CSSVariableMigrationManager {
        constructor(options = {}) {
            // Configuration
            this.flags = { ...MIGRATION_FLAGS, ...options.flags };
            this.cssMapper = options.cssMapper || window.cssVariableMapperInstance;
            this.debugMode = options.debugMode || window.masV2Debug || false;
            
            // Migration state
            this.migrationStats = {
                legacyAttributesFound: 0,
                legacyAttributesUsed: 0,
                deprecationWarningsShown: 0,
                autoMigrationsPerformed: 0,
                fallbacksUsed: 0,
                startTime: Date.now()
            };
            
            // Caches for performance
            this.legacyAttributeCache = new Map();
            this.deprecationWarningCache = new Set();
            this.migrationReportData = [];
            
            // Legacy system compatibility
            this.legacyMethods = new Map();
            
            this.initialize();
        }

        /**
         * 🚀 Initialize migration system
         */
        initialize() {
            this.log('Initializing CSS Variable Migration System', {
                flags: this.flags,
                timestamp: new Date().toISOString()
            });

            // Setup legacy method compatibility
            this.setupLegacyMethodCompatibility();
            
            // Scan for legacy attributes if enabled
            if (this.flags.SUPPORT_LEGACY_ATTRIBUTES) {
                this.scanForLegacyAttributes();
            }
            
            // Setup auto-migration if enabled
            if (this.flags.AUTO_MIGRATE_LEGACY) {
                this.setupAutoMigration();
            }
            
            // Setup migration reporting
            if (this.flags.GENERATE_MIGRATION_REPORT) {
                this.setupMigrationReporting();
            }

            this.log('Migration system initialized successfully');
        }

        /**
         * 🔍 Enhanced getCSSVariable with backward compatibility
         */
        getCSSVariableWithFallback(optionId, element = null, context = {}) {
            const startTime = performance.now();
            let cssVar = null;
            let source = 'unknown';
            let migrationNeeded = false;

            try {
                // Strategy 1: Try centralized mapping first (if enabled)
                if (this.flags.USE_CENTRALIZED_MAPPING && this.cssMapper) {
                    cssVar = this.cssMapper.getCSSVariable(optionId);
                    if (cssVar && cssVar !== this.generateFallbackCSSVar(optionId)) {
                        source = 'centralized';
                        this.recordMigrationActivity('centralized_lookup_success', {
                            optionId,
                            cssVar,
                            duration: performance.now() - startTime
                        });
                        return { cssVar, source, migrationNeeded };
                    }
                }

                // Strategy 2: Try legacy data-css-var attribute (if enabled)
                if (this.flags.SUPPORT_LEGACY_ATTRIBUTES && element) {
                    const legacyCssVar = this.getLegacyCSSVariable(optionId, element);
                    if (legacyCssVar) {
                        cssVar = legacyCssVar;
                        source = 'legacy_attribute';
                        migrationNeeded = true;
                        
                        // Show deprecation warning
                        if (this.flags.SHOW_DEPRECATION_WARNINGS) {
                            this.showDeprecationWarning(optionId, element, legacyCssVar);
                        }
                        
                        // Auto-migrate if enabled
                        if (this.flags.AUTO_MIGRATE_LEGACY) {
                            this.autoMigrateLegacyAttribute(optionId, element, legacyCssVar);
                        }
                        
                        this.migrationStats.legacyAttributesUsed++;
                        this.recordMigrationActivity('legacy_attribute_used', {
                            optionId,
                            cssVar: legacyCssVar,
                            element: element.tagName + (element.id ? '#' + element.id : ''),
                            duration: performance.now() - startTime
                        });
                        
                        return { cssVar, source, migrationNeeded };
                    }
                }

                // Strategy 3: Generate fallback CSS variable
                cssVar = this.generateFallbackCSSVar(optionId);
                source = 'fallback';
                this.migrationStats.fallbacksUsed++;
                
                this.logWarning(`No mapping found for ${optionId}, using fallback: ${cssVar}`);
                this.recordMigrationActivity('fallback_used', {
                    optionId,
                    cssVar,
                    duration: performance.now() - startTime
                });

                return { cssVar, source, migrationNeeded };

            } catch (error) {
                this.logError('Error in getCSSVariableWithFallback:', error);
                
                // Emergency fallback
                cssVar = this.generateFallbackCSSVar(optionId);
                source = 'emergency_fallback';
                
                return { cssVar, source, migrationNeeded: true };
            }
        }

        /**
         * 🏷️ Get CSS variable from legacy data-css-var attribute
         */
        getLegacyCSSVariable(optionId, element) {
            if (!element) return null;

            // Check cache first
            const cacheKey = `${optionId}_${element.getAttribute('data-option-id') || 'unknown'}`;
            if (this.flags.CACHE_LEGACY_LOOKUPS && this.legacyAttributeCache.has(cacheKey)) {
                return this.legacyAttributeCache.get(cacheKey);
            }

            let legacyCssVar = null;

            // Strategy 1: Direct data-css-var attribute on element
            legacyCssVar = element.getAttribute('data-css-var');
            if (legacyCssVar) {
                if (this.flags.CACHE_LEGACY_LOOKUPS) {
                    this.legacyAttributeCache.set(cacheKey, legacyCssVar);
                }
                return legacyCssVar;
            }

            // Strategy 2: Look for data-css-var on parent elements
            let parent = element.parentElement;
            let depth = 0;
            const maxDepth = 5; // Limit search depth for performance

            while (parent && depth < maxDepth) {
                legacyCssVar = parent.getAttribute('data-css-var');
                if (legacyCssVar) {
                    if (this.flags.CACHE_LEGACY_LOOKUPS) {
                        this.legacyAttributeCache.set(cacheKey, legacyCssVar);
                    }
                    return legacyCssVar;
                }
                parent = parent.parentElement;
                depth++;
            }

            // Strategy 3: Look for option-specific data attribute
            legacyCssVar = element.getAttribute(`data-css-var-${optionId.replace(/_/g, '-')}`);
            if (legacyCssVar) {
                if (this.flags.CACHE_LEGACY_LOOKUPS) {
                    this.legacyAttributeCache.set(cacheKey, legacyCssVar);
                }
                return legacyCssVar;
            }

            return null;
        }

        /**
         * ⚠️ Show deprecation warning for legacy usage
         */
        showDeprecationWarning(optionId, element, legacyCssVar) {
            const warningKey = `${optionId}_${legacyCssVar}`;
            
            // Avoid duplicate warnings
            if (this.deprecationWarningCache.has(warningKey)) {
                return;
            }
            
            this.deprecationWarningCache.add(warningKey);
            this.migrationStats.deprecationWarningsShown++;

            const elementInfo = this.getElementInfo(element);
            const suggestedMapping = this.suggestCentralizedMapping(optionId, legacyCssVar);

            const warning = {
                type: 'deprecation',
                message: `Legacy data-css-var attribute usage detected`,
                details: {
                    optionId,
                    legacyCssVar,
                    element: elementInfo,
                    suggestedMapping,
                    migrationGuide: 'https://docs.example.com/css-variable-migration'
                },
                timestamp: new Date().toISOString()
            };

            // Log warning
            console.warn(
                `🚨 DEPRECATED: data-css-var="${legacyCssVar}" for option "${optionId}"`,
                '\n📍 Element:', elementInfo,
                '\n💡 Suggested mapping:', suggestedMapping,
                '\n📖 Migration guide: https://docs.example.com/css-variable-migration'
            );

            // Store for reporting
            this.recordMigrationActivity('deprecation_warning', warning);

            // Show visual warning in development mode
            if (this.debugMode && this.flags.LOG_MIGRATION_ACTIVITY) {
                this.showVisualDeprecationWarning(element, warning);
            }
        }

        /**
         * 🔄 Auto-migrate legacy attribute to centralized mapping
         */
        autoMigrateLegacyAttribute(optionId, element, legacyCssVar) {
            try {
                // Create mapping entry suggestion
                const mappingEntry = this.createMappingEntry(optionId, legacyCssVar, element);
                
                // Add to centralized mapping if possible
                if (this.cssMapper && window.CSS_VARIABLE_MAP) {
                    window.CSS_VARIABLE_MAP[optionId] = mappingEntry;
                    
                    // Reinitialize mapper with new mapping
                    if (typeof this.cssMapper.initializeMappings === 'function') {
                        this.cssMapper.initializeMappings();
                    }
                }

                // Remove legacy attribute
                element.removeAttribute('data-css-var');
                
                // Add migration marker
                element.setAttribute('data-migrated-from-legacy', 'true');
                element.setAttribute('data-migration-timestamp', Date.now().toString());

                this.migrationStats.autoMigrationsPerformed++;
                
                this.log(`Auto-migrated ${optionId}: ${legacyCssVar} → centralized mapping`);
                
                this.recordMigrationActivity('auto_migration', {
                    optionId,
                    legacyCssVar,
                    mappingEntry,
                    element: this.getElementInfo(element)
                });

            } catch (error) {
                this.logError(`Auto-migration failed for ${optionId}:`, error);
            }
        }

        /**
         * 🔍 Scan for legacy attributes in the DOM
         */
        scanForLegacyAttributes() {
            const startTime = performance.now();
            
            try {
                // Find all elements with data-css-var attributes
                const legacyElements = document.querySelectorAll('[data-css-var]');
                this.migrationStats.legacyAttributesFound = legacyElements.length;

                if (legacyElements.length > 0) {
                    this.log(`Found ${legacyElements.length} elements with legacy data-css-var attributes`);

                    // Process each legacy element
                    legacyElements.forEach((element, index) => {
                        const cssVar = element.getAttribute('data-css-var');
                        const optionId = element.getAttribute('data-option-id') || `legacy_${index}`;
                        
                        this.recordMigrationActivity('legacy_attribute_found', {
                            optionId,
                            cssVar,
                            element: this.getElementInfo(element),
                            index
                        });
                    });
                }

                const duration = performance.now() - startTime;
                this.log(`Legacy attribute scan completed in ${duration.toFixed(2)}ms`);

            } catch (error) {
                this.logError('Error scanning for legacy attributes:', error);
            }
        }

        /**
         * 🛠️ Setup legacy method compatibility
         */
        setupLegacyMethodCompatibility() {
            // Store original methods if they exist
            if (window.getCSSVariable) {
                this.legacyMethods.set('getCSSVariable', window.getCSSVariable);
            }

            // Override with backward-compatible version
            window.getCSSVariable = (optionId, element) => {
                if (this.flags.FORCE_LEGACY_MODE && this.legacyMethods.has('getCSSVariable')) {
                    return this.legacyMethods.get('getCSSVariable')(optionId, element);
                }

                const result = this.getCSSVariableWithFallback(optionId, element);
                return result.cssVar;
            };

            // Add migration-aware method
            window.getCSSVariableWithMigrationInfo = (optionId, element) => {
                return this.getCSSVariableWithFallback(optionId, element);
            };

            this.log('Legacy method compatibility established');
        }

        /**
         * 🔧 Generate fallback CSS variable name
         */
        generateFallbackCSSVar(optionId) {
            return `--woow-${optionId.replace(/_/g, '-')}`;
        }

        /**
         * 💡 Suggest centralized mapping for legacy usage
         */
        suggestCentralizedMapping(optionId, legacyCssVar) {
            // Determine type based on CSS variable name patterns
            let type = 'string';
            let unit = '';
            
            if (legacyCssVar.includes('color') || legacyCssVar.includes('bg')) {
                type = 'color';
            } else if (legacyCssVar.includes('width') || legacyCssVar.includes('height') || 
                      legacyCssVar.includes('size') || legacyCssVar.includes('padding') || 
                      legacyCssVar.includes('margin')) {
                type = 'numeric';
                unit = 'px';
            } else if (legacyCssVar.includes('font-size')) {
                type = 'numeric';
                unit = 'rem';
            } else if (legacyCssVar.includes('opacity') || legacyCssVar.includes('scale')) {
                type = 'numeric';
            }

            return {
                optionId,
                mapping: {
                    cssVar: legacyCssVar,
                    type,
                    unit,
                    fallback: this.guessFallbackValue(type, unit),
                    category: this.guessCategory(optionId),
                    description: `Migrated from legacy data-css-var attribute`,
                    migrated: true
                }
            };
        }

        /**
         * 🎯 Create mapping entry from legacy attribute
         */
        createMappingEntry(optionId, legacyCssVar, element) {
            const suggestion = this.suggestCentralizedMapping(optionId, legacyCssVar);
            
            // Try to get current value for better fallback
            const computedStyle = window.getComputedStyle(element);
            const currentValue = computedStyle.getPropertyValue(legacyCssVar);
            
            if (currentValue) {
                suggestion.mapping.fallback = currentValue.trim();
            }

            return suggestion.mapping;
        }

        /**
         * 🔮 Guess fallback value based on type
         */
        guessFallbackValue(type, unit) {
            switch (type) {
                case 'color':
                    return '#000000';
                case 'numeric':
                    return unit ? `0${unit}` : '0';
                case 'boolean':
                    return '0';
                default:
                    return 'initial';
            }
        }

        /**
         * 📂 Guess category based on option ID
         */
        guessCategory(optionId) {
            const id = optionId.toLowerCase();
            
            if (id.includes('admin_bar') || id.includes('wpadminbar')) return 'admin-bar';
            if (id.includes('menu')) return 'menu';
            if (id.includes('font') || id.includes('text')) return 'typography';
            if (id.includes('color') || id.includes('bg')) return 'color';
            if (id.includes('space') || id.includes('margin') || id.includes('padding')) return 'spacing';
            if (id.includes('radius') || id.includes('border')) return 'border';
            if (id.includes('shadow')) return 'shadow';
            if (id.includes('postbox')) return 'postbox';
            
            return 'misc';
        }

        /**
         * 📊 Record migration activity for reporting
         */
        recordMigrationActivity(type, data) {
            if (!this.flags.COLLECT_MIGRATION_STATS) return;

            const activity = {
                type,
                data,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };

            this.migrationReportData.push(activity);

            // Limit report data size
            if (this.migrationReportData.length > 1000) {
                this.migrationReportData = this.migrationReportData.slice(-500);
            }
        }

        /**
         * 📈 Generate migration report
         */
        generateMigrationReport() {
            const now = Date.now();
            const uptime = now - this.migrationStats.startTime;
            
            const report = {
                summary: {
                    ...this.migrationStats,
                    uptime,
                    reportGeneratedAt: new Date().toISOString()
                },
                flags: this.flags,
                activities: this.migrationReportData,
                recommendations: this.generateMigrationRecommendations(),
                performance: {
                    cacheSize: this.legacyAttributeCache.size,
                    warningsCached: this.deprecationWarningCache.size,
                    activitiesRecorded: this.migrationReportData.length
                }
            };

            return report;
        }

        /**
         * 💡 Generate migration recommendations
         */
        generateMigrationRecommendations() {
            const recommendations = [];

            if (this.migrationStats.legacyAttributesFound > 0) {
                recommendations.push({
                    type: 'legacy_cleanup',
                    priority: 'high',
                    message: `Found ${this.migrationStats.legacyAttributesFound} legacy data-css-var attributes that should be migrated`,
                    action: 'Run migration utility to convert to centralized mappings'
                });
            }

            if (this.migrationStats.fallbacksUsed > 10) {
                recommendations.push({
                    type: 'missing_mappings',
                    priority: 'medium',
                    message: `${this.migrationStats.fallbacksUsed} fallback CSS variables were used`,
                    action: 'Add proper mappings to CSS_VARIABLE_MAP for better performance'
                });
            }

            if (this.migrationStats.deprecationWarningsShown > 0) {
                recommendations.push({
                    type: 'deprecation_warnings',
                    priority: 'medium',
                    message: `${this.migrationStats.deprecationWarningsShown} deprecation warnings were shown`,
                    action: 'Update code to use centralized mapping system'
                });
            }

            return recommendations;
        }

        /**
         * 🎨 Show visual deprecation warning (development mode)
         */
        showVisualDeprecationWarning(element, warning) {
            if (!this.debugMode) return;

            // Create warning overlay
            const overlay = document.createElement('div');
            overlay.className = 'woow-migration-warning-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 193, 7, 0.2);
                border: 2px dashed #ffc107;
                pointer-events: none;
                z-index: 999999;
                font-size: 12px;
                color: #856404;
                padding: 4px;
                box-sizing: border-box;
            `;
            overlay.textContent = `⚠️ Legacy: ${warning.details.legacyCssVar}`;

            // Position relative to element
            const rect = element.getBoundingClientRect();
            overlay.style.position = 'fixed';
            overlay.style.top = rect.top + 'px';
            overlay.style.left = rect.left + 'px';
            overlay.style.width = rect.width + 'px';
            overlay.style.height = rect.height + 'px';

            document.body.appendChild(overlay);

            // Remove after 3 seconds
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 3000);
        }

        /**
         * 🔧 Setup auto-migration observer
         */
        setupAutoMigration() {
            if (!window.MutationObserver) return;

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                this.processMutatedElement(node);
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            this.log('Auto-migration observer setup complete');
        }

        /**
         * 🔄 Process mutated element for auto-migration
         */
        processMutatedElement(element) {
            // Check if element has legacy attributes
            const cssVar = element.getAttribute('data-css-var');
            const optionId = element.getAttribute('data-option-id');

            if (cssVar && optionId) {
                this.autoMigrateLegacyAttribute(optionId, element, cssVar);
            }

            // Check child elements
            const legacyChildren = element.querySelectorAll('[data-css-var]');
            legacyChildren.forEach((child) => {
                const childCssVar = child.getAttribute('data-css-var');
                const childOptionId = child.getAttribute('data-option-id') || 'auto_' + Date.now();
                
                if (childCssVar) {
                    this.autoMigrateLegacyAttribute(childOptionId, child, childCssVar);
                }
            });
        }

        /**
         * 🔧 Setup migration reporting
         */
        setupMigrationReporting() {
            // Generate report every 30 seconds in debug mode
            if (this.debugMode) {
                setInterval(() => {
                    const report = this.generateMigrationReport();
                    this.log('Migration Report:', report);
                }, 30000);
            }

            // Generate report on page unload
            window.addEventListener('beforeunload', () => {
                const report = this.generateMigrationReport();
                
                // Store report in localStorage for persistence
                try {
                    localStorage.setItem('woow_migration_report', JSON.stringify(report));
                } catch (error) {
                    this.logError('Failed to store migration report:', error);
                }
            });
        }

        /**
         * 📋 Get element information for reporting
         */
        getElementInfo(element) {
            return {
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                attributes: Array.from(element.attributes).reduce((acc, attr) => {
                    if (attr.name.startsWith('data-')) {
                        acc[attr.name] = attr.value;
                    }
                    return acc;
                }, {}),
                xpath: this.getElementXPath(element)
            };
        }

        /**
         * 🗺️ Get XPath for element
         */
        getElementXPath(element) {
            if (element.id) {
                return `//*[@id="${element.id}"]`;
            }
            
            const parts = [];
            while (element && element.nodeType === Node.ELEMENT_NODE) {
                let index = 0;
                let sibling = element.previousSibling;
                
                while (sibling) {
                    if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === element.tagName) {
                        index++;
                    }
                    sibling = sibling.previousSibling;
                }
                
                const tagName = element.tagName.toLowerCase();
                const pathIndex = index > 0 ? `[${index + 1}]` : '';
                parts.unshift(`${tagName}${pathIndex}`);
                
                element = element.parentNode;
            }
            
            return parts.length ? '/' + parts.join('/') : '';
        }

        /**
         * 📊 Get migration statistics
         */
        getMigrationStats() {
            return {
                ...this.migrationStats,
                uptime: Date.now() - this.migrationStats.startTime,
                flags: this.flags,
                cacheStats: {
                    legacyAttributeCache: this.legacyAttributeCache.size,
                    deprecationWarningCache: this.deprecationWarningCache.size
                }
            };
        }

        /**
         * 🧹 Clear migration caches
         */
        clearMigrationCaches() {
            this.legacyAttributeCache.clear();
            this.deprecationWarningCache.clear();
            this.migrationReportData = [];
            
            this.log('Migration caches cleared');
        }

        /**
         * 📝 Logging utilities
         */
        log(message, ...args) {
            if (this.flags.LOG_MIGRATION_ACTIVITY || this.debugMode) {
                console.log(`🔄 Migration: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ Migration: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ Migration: ${message}`, ...args);
        }
    }

    // Make migration manager globally available
    window.CSSVariableMigrationManager = CSSVariableMigrationManager;

    // Auto-initialize migration manager when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cssVariableMigrationManager = new CSSVariableMigrationManager({
                debugMode: window.masV2Debug || false
            });
            console.log('🔄 CSS Variable Migration System initialized');
        });
    } else {
        window.cssVariableMigrationManager = new CSSVariableMigrationManager({
            debugMode: window.masV2Debug || false
        });
        console.log('🔄 CSS Variable Migration System initialized');
    }

})(window, document);