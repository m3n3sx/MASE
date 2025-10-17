/**
 * 🛠️ CSS Variable Migration Utilities - Code Update Tools
 * 
 * Provides utilities for migrating existing code from legacy patterns:
 * - DOM attribute migration tools
 * - Code pattern detection and replacement
 * - Batch migration operations
 * - Migration validation and testing
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Migration Utilities
 */

(function(window, document) {
    'use strict';

    /**
     * 🔧 CSS Variable Migration Utilities
     */
    class CSSVariableMigrationUtilities {
        constructor(options = {}) {
            this.migrationManager = options.migrationManager || window.cssVariableMigrationManager;
            this.cssMapper = options.cssMapper || window.cssVariableMapperInstance;
            this.debugMode = options.debugMode || window.masV2Debug || false;
            
            // Migration results tracking
            this.migrationResults = {
                totalProcessed: 0,
                successful: 0,
                failed: 0,
                skipped: 0,
                warnings: 0,
                startTime: null,
                endTime: null,
                operations: []
            };

            this.log('Migration utilities initialized');
        }

        /**
         * 🔄 Migrate all legacy data-css-var attributes in DOM
         */
        async migrateAllLegacyAttributes(options = {}) {
            const {
                dryRun = false,
                batchSize = 50,
                delay = 10,
                selector = '[data-css-var]',
                backup = true
            } = options;

            this.migrationResults.startTime = Date.now();
            this.log(`Starting ${dryRun ? 'dry run' : 'live'} migration of legacy attributes`);

            try {
                // Find all elements with legacy attributes
                const elements = document.querySelectorAll(selector);
                this.migrationResults.totalProcessed = elements.length;

                if (elements.length === 0) {
                    this.log('No legacy attributes found to migrate');
                    return this.migrationResults;
                }

                // Create backup if requested
                if (backup && !dryRun) {
                    await this.createDOMBackup();
                }

                // Process elements in batches
                const batches = this.createBatches(Array.from(elements), batchSize);
                
                for (let i = 0; i < batches.length; i++) {
                    const batch = batches[i];
                    this.log(`Processing batch ${i + 1}/${batches.length} (${batch.length} elements)`);
                    
                    await this.processMigrationBatch(batch, { dryRun });
                    
                    // Add delay between batches to prevent blocking
                    if (delay > 0 && i < batches.length - 1) {
                        await this.sleep(delay);
                    }
                }

                this.migrationResults.endTime = Date.now();
                const duration = this.migrationResults.endTime - this.migrationResults.startTime;
                
                this.log(`Migration completed in ${duration}ms`, this.migrationResults);
                return this.migrationResults;

            } catch (error) {
                this.logError('Migration failed:', error);
                this.migrationResults.endTime = Date.now();
                throw error;
            }
        }

        /**
         * 📦 Process a batch of elements for migration
         */
        async processMigrationBatch(elements, options = {}) {
            const { dryRun = false } = options;

            for (const element of elements) {
                try {
                    const result = await this.migrateElement(element, { dryRun });
                    
                    if (result.success) {
                        this.migrationResults.successful++;
                    } else if (result.skipped) {
                        this.migrationResults.skipped++;
                    } else {
                        this.migrationResults.failed++;
                    }

                    if (result.warnings > 0) {
                        this.migrationResults.warnings += result.warnings;
                    }

                    this.migrationResults.operations.push(result);

                } catch (error) {
                    this.migrationResults.failed++;
                    this.logError(`Failed to migrate element:`, error);
                    
                    this.migrationResults.operations.push({
                        element: this.getElementInfo(element),
                        success: false,
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }
        }

        /**
         * 🔄 Migrate a single element
         */
        async migrateElement(element, options = {}) {
            const { dryRun = false } = options;
            const startTime = Date.now();
            
            const result = {
                element: this.getElementInfo(element),
                success: false,
                skipped: false,
                warnings: 0,
                changes: [],
                timestamp: startTime
            };

            try {
                // Get legacy CSS variable
                const legacyCssVar = element.getAttribute('data-css-var');
                if (!legacyCssVar) {
                    result.skipped = true;
                    result.reason = 'No data-css-var attribute found';
                    return result;
                }

                // Get or generate option ID
                let optionId = element.getAttribute('data-option-id');
                if (!optionId) {
                    optionId = this.generateOptionIdFromCSSVar(legacyCssVar);
                    result.warnings++;
                    result.changes.push({
                        type: 'generated_option_id',
                        value: optionId,
                        reason: 'No data-option-id found'
                    });
                }

                // Check if mapping already exists
                const existingMapping = this.cssMapper && this.cssMapper.getCSSVariable(optionId);
                if (existingMapping && existingMapping !== this.generateFallbackCSSVar(optionId)) {
                    // Mapping exists, just remove legacy attribute
                    if (!dryRun) {
                        element.removeAttribute('data-css-var');
                        element.setAttribute('data-migrated-legacy', 'true');
                    }
                    
                    result.changes.push({
                        type: 'removed_legacy_attribute',
                        oldValue: legacyCssVar,
                        reason: 'Centralized mapping exists'
                    });
                } else {
                    // Create new mapping
                    const mappingEntry = this.createMappingEntry(optionId, legacyCssVar, element);
                    
                    if (!dryRun) {
                        // Add to centralized mapping
                        if (window.CSS_VARIABLE_MAP) {
                            window.CSS_VARIABLE_MAP[optionId] = mappingEntry;
                        }
                        
                        // Update element
                        element.removeAttribute('data-css-var');
                        element.setAttribute('data-option-id', optionId);
                        element.setAttribute('data-migrated-legacy', 'true');
                        element.setAttribute('data-migration-timestamp', Date.now().toString());
                    }
                    
                    result.changes.push({
                        type: 'created_mapping',
                        optionId,
                        mapping: mappingEntry,
                        oldAttribute: legacyCssVar
                    });
                }

                result.success = true;
                result.duration = Date.now() - startTime;
                
                return result;

            } catch (error) {
                result.error = error.message;
                result.duration = Date.now() - startTime;
                return result;
            }
        }

        /**
         * 🔍 Analyze legacy usage patterns
         */
        analyzeLegacyUsage() {
            const analysis = {
                totalElements: 0,
                uniqueCSSVars: new Set(),
                uniqueOptionIds: new Set(),
                patterns: {},
                categories: {},
                recommendations: [],
                timestamp: Date.now()
            };

            // Find all legacy elements
            const elements = document.querySelectorAll('[data-css-var]');
            analysis.totalElements = elements.length;

            elements.forEach(element => {
                const cssVar = element.getAttribute('data-css-var');
                const optionId = element.getAttribute('data-option-id');
                
                if (cssVar) {
                    analysis.uniqueCSSVars.add(cssVar);
                    
                    // Analyze patterns
                    const pattern = this.identifyPattern(cssVar);
                    analysis.patterns[pattern] = (analysis.patterns[pattern] || 0) + 1;
                    
                    // Analyze categories
                    const category = this.categorizeVariable(cssVar);
                    analysis.categories[category] = (analysis.categories[category] || 0) + 1;
                }
                
                if (optionId) {
                    analysis.uniqueOptionIds.add(optionId);
                }
            });

            // Convert Sets to Arrays for JSON serialization
            analysis.uniqueCSSVars = Array.from(analysis.uniqueCSSVars);
            analysis.uniqueOptionIds = Array.from(analysis.uniqueOptionIds);

            // Generate recommendations
            analysis.recommendations = this.generateAnalysisRecommendations(analysis);

            return analysis;
        }

        /**
         * 🔧 Generate mapping suggestions for legacy usage
         */
        generateMappingSuggestions() {
            const suggestions = [];
            const elements = document.querySelectorAll('[data-css-var]');

            elements.forEach((element, index) => {
                const cssVar = element.getAttribute('data-css-var');
                const optionId = element.getAttribute('data-option-id') || 
                                this.generateOptionIdFromCSSVar(cssVar);

                if (cssVar) {
                    const suggestion = {
                        optionId,
                        element: this.getElementInfo(element),
                        currentCSSVar: cssVar,
                        suggestedMapping: this.createMappingEntry(optionId, cssVar, element),
                        confidence: this.calculateMappingConfidence(cssVar, element),
                        index
                    };

                    suggestions.push(suggestion);
                }
            });

            // Sort by confidence (highest first)
            suggestions.sort((a, b) => b.confidence - a.confidence);

            return suggestions;
        }

        /**
         * 🧪 Test migration without applying changes
         */
        testMigration(options = {}) {
            const testOptions = { ...options, dryRun: true };
            return this.migrateAllLegacyAttributes(testOptions);
        }

        /**
         * 📋 Create DOM backup before migration
         */
        async createDOMBackup() {
            const backup = {
                timestamp: Date.now(),
                url: window.location.href,
                elements: []
            };

            const elements = document.querySelectorAll('[data-css-var]');
            elements.forEach(element => {
                backup.elements.push({
                    xpath: this.getElementXPath(element),
                    attributes: this.getElementAttributes(element),
                    innerHTML: element.innerHTML
                });
            });

            // Store backup in localStorage
            try {
                const backupKey = `woow_migration_backup_${Date.now()}`;
                localStorage.setItem(backupKey, JSON.stringify(backup));
                this.log(`DOM backup created: ${backupKey}`);
                return backupKey;
            } catch (error) {
                this.logError('Failed to create DOM backup:', error);
                throw error;
            }
        }

        /**
         * 🔄 Restore DOM from backup
         */
        async restoreDOMFromBackup(backupKey) {
            try {
                const backupData = localStorage.getItem(backupKey);
                if (!backupData) {
                    throw new Error(`Backup not found: ${backupKey}`);
                }

                const backup = JSON.parse(backupData);
                let restored = 0;

                backup.elements.forEach(elementData => {
                    const element = this.findElementByXPath(elementData.xpath);
                    if (element) {
                        // Restore attributes
                        Object.entries(elementData.attributes).forEach(([name, value]) => {
                            element.setAttribute(name, value);
                        });
                        
                        // Restore innerHTML if needed
                        if (elementData.innerHTML !== element.innerHTML) {
                            element.innerHTML = elementData.innerHTML;
                        }
                        
                        restored++;
                    }
                });

                this.log(`Restored ${restored} elements from backup`);
                return { restored, total: backup.elements.length };

            } catch (error) {
                this.logError('Failed to restore from backup:', error);
                throw error;
            }
        }

        /**
         * 📊 Generate migration report
         */
        generateMigrationReport() {
            const analysis = this.analyzeLegacyUsage();
            const suggestions = this.generateMappingSuggestions();
            
            return {
                summary: {
                    totalLegacyElements: analysis.totalElements,
                    uniqueCSSVariables: analysis.uniqueCSSVars.length,
                    uniqueOptionIds: analysis.uniqueOptionIds.length,
                    migrationComplexity: this.calculateMigrationComplexity(analysis),
                    estimatedDuration: this.estimateMigrationDuration(analysis)
                },
                analysis,
                suggestions: suggestions.slice(0, 20), // Top 20 suggestions
                migrationResults: this.migrationResults,
                recommendations: this.generateMigrationRecommendations(analysis),
                timestamp: Date.now()
            };
        }

        /**
         * 🔧 Helper methods
         */
        createBatches(array, batchSize) {
            const batches = [];
            for (let i = 0; i < array.length; i += batchSize) {
                batches.push(array.slice(i, i + batchSize));
            }
            return batches;
        }

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        generateOptionIdFromCSSVar(cssVar) {
            // Convert --woow-surface-bar to surface_bar
            return cssVar
                .replace(/^--woow-/, '')
                .replace(/-/g, '_')
                .toLowerCase();
        }

        generateFallbackCSSVar(optionId) {
            return `--woow-${optionId.replace(/_/g, '-')}`;
        }

        createMappingEntry(optionId, cssVar, element) {
            // Determine type based on CSS variable name and current value
            let type = 'string';
            let unit = '';
            let fallback = 'initial';

            // Get current computed value for better type detection
            const computedStyle = window.getComputedStyle(element);
            const currentValue = computedStyle.getPropertyValue(cssVar);

            if (currentValue) {
                fallback = currentValue.trim();
                
                // Detect type from value
                if (this.isColorValue(currentValue)) {
                    type = 'color';
                } else if (this.isNumericValue(currentValue)) {
                    type = 'numeric';
                    unit = this.extractUnit(currentValue);
                } else if (this.isBooleanValue(currentValue)) {
                    type = 'boolean';
                }
            } else {
                // Fallback to name-based detection
                if (cssVar.includes('color') || cssVar.includes('bg')) {
                    type = 'color';
                    fallback = '#000000';
                } else if (cssVar.includes('width') || cssVar.includes('height') || 
                          cssVar.includes('size') || cssVar.includes('padding') || 
                          cssVar.includes('margin')) {
                    type = 'numeric';
                    unit = 'px';
                    fallback = '0px';
                }
            }

            return {
                cssVar,
                type,
                unit,
                fallback,
                category: this.categorizeVariable(cssVar),
                description: `Migrated from legacy data-css-var attribute`,
                migrated: true,
                migrationTimestamp: Date.now()
            };
        }

        identifyPattern(cssVar) {
            if (cssVar.startsWith('--woow-surface-')) return 'surface';
            if (cssVar.startsWith('--woow-text-')) return 'text';
            if (cssVar.startsWith('--woow-accent-')) return 'accent';
            if (cssVar.startsWith('--woow-space-')) return 'spacing';
            if (cssVar.startsWith('--woow-radius-')) return 'border-radius';
            if (cssVar.startsWith('--woow-shadow-')) return 'shadow';
            if (cssVar.startsWith('--woow-font-')) return 'typography';
            return 'other';
        }

        categorizeVariable(cssVar) {
            const var_lower = cssVar.toLowerCase();
            
            if (var_lower.includes('bar')) return 'admin-bar';
            if (var_lower.includes('menu')) return 'menu';
            if (var_lower.includes('font') || var_lower.includes('text')) return 'typography';
            if (var_lower.includes('color') || var_lower.includes('bg')) return 'color';
            if (var_lower.includes('space') || var_lower.includes('margin') || var_lower.includes('padding')) return 'spacing';
            if (var_lower.includes('radius') || var_lower.includes('border')) return 'border';
            if (var_lower.includes('shadow')) return 'shadow';
            if (var_lower.includes('postbox')) return 'postbox';
            
            return 'misc';
        }

        calculateMappingConfidence(cssVar, element) {
            let confidence = 0.5; // Base confidence

            // Higher confidence for well-named variables
            if (cssVar.startsWith('--woow-')) confidence += 0.3;
            if (cssVar.includes('color') || cssVar.includes('bg')) confidence += 0.1;
            if (cssVar.includes('size') || cssVar.includes('width') || cssVar.includes('height')) confidence += 0.1;

            // Higher confidence if element has option ID
            if (element.getAttribute('data-option-id')) confidence += 0.2;

            // Lower confidence for generic names
            if (cssVar.includes('var') || cssVar.includes('custom')) confidence -= 0.2;

            return Math.max(0, Math.min(1, confidence));
        }

        calculateMigrationComplexity(analysis) {
            const factors = {
                elementCount: Math.min(analysis.totalElements / 100, 1),
                uniqueVars: Math.min(analysis.uniqueCSSVars.length / 50, 1),
                patternDiversity: Math.min(Object.keys(analysis.patterns).length / 10, 1)
            };

            const complexity = (factors.elementCount + factors.uniqueVars + factors.patternDiversity) / 3;
            
            if (complexity < 0.3) return 'low';
            if (complexity < 0.7) return 'medium';
            return 'high';
        }

        estimateMigrationDuration(analysis) {
            const baseTime = 100; // ms per element
            const complexityMultiplier = analysis.totalElements > 100 ? 1.5 : 1;
            const estimated = analysis.totalElements * baseTime * complexityMultiplier;
            
            return {
                milliseconds: estimated,
                seconds: Math.ceil(estimated / 1000),
                human: this.formatDuration(estimated)
            };
        }

        formatDuration(ms) {
            if (ms < 1000) return `${ms}ms`;
            if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
            return `${Math.ceil(ms / 60000)}m`;
        }

        generateAnalysisRecommendations(analysis) {
            const recommendations = [];

            if (analysis.totalElements > 50) {
                recommendations.push({
                    type: 'batch_migration',
                    priority: 'high',
                    message: 'Large number of legacy elements detected. Consider batch migration with backups.'
                });
            }

            if (analysis.uniqueCSSVars.length > 20) {
                recommendations.push({
                    type: 'mapping_review',
                    priority: 'medium',
                    message: 'Many unique CSS variables found. Review for consolidation opportunities.'
                });
            }

            if (Object.keys(analysis.patterns).length > 5) {
                recommendations.push({
                    type: 'pattern_standardization',
                    priority: 'medium',
                    message: 'Multiple naming patterns detected. Consider standardizing variable names.'
                });
            }

            return recommendations;
        }

        generateMigrationRecommendations(analysis) {
            const recommendations = [];

            if (this.migrationResults.failed > 0) {
                recommendations.push({
                    type: 'failure_review',
                    priority: 'high',
                    message: `${this.migrationResults.failed} elements failed to migrate. Review error logs.`
                });
            }

            if (this.migrationResults.warnings > 10) {
                recommendations.push({
                    type: 'warning_review',
                    priority: 'medium',
                    message: `${this.migrationResults.warnings} warnings generated. Review for potential issues.`
                });
            }

            return recommendations;
        }

        // Value type detection helpers
        isColorValue(value) {
            return /^#[0-9A-Fa-f]{3,8}$/.test(value) || 
                   /^rgba?\(/.test(value) || 
                   /^hsla?\(/.test(value) ||
                   /^[a-z]+$/i.test(value);
        }

        isNumericValue(value) {
            return /^-?\d*\.?\d+(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax|s|ms)?$/.test(value);
        }

        isBooleanValue(value) {
            return value === '0' || value === '1' || value === 'true' || value === 'false';
        }

        extractUnit(value) {
            const match = value.match(/^-?\d*\.?\d+([a-z%]+)$/i);
            return match ? match[1] : '';
        }

        // DOM utility methods
        getElementInfo(element) {
            return {
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                xpath: this.getElementXPath(element)
            };
        }

        getElementAttributes(element) {
            const attributes = {};
            Array.from(element.attributes).forEach(attr => {
                attributes[attr.name] = attr.value;
            });
            return attributes;
        }

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

        findElementByXPath(xpath) {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        }

        /**
         * 📝 Logging utilities
         */
        log(message, ...args) {
            if (this.debugMode) {
                console.log(`🛠️ Migration Utils: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ Migration Utils: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ Migration Utils: ${message}`, ...args);
        }
    }

    // Make migration utilities globally available
    window.CSSVariableMigrationUtilities = CSSVariableMigrationUtilities;

    // Auto-initialize migration utilities when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cssVariableMigrationUtilities = new CSSVariableMigrationUtilities({
                debugMode: window.masV2Debug || false
            });
            console.log('🛠️ CSS Variable Migration Utilities initialized');
        });
    } else {
        window.cssVariableMigrationUtilities = new CSSVariableMigrationUtilities({
            debugMode: window.masV2Debug || false
        });
        console.log('🛠️ CSS Variable Migration Utilities initialized');
    }

})(window, document);