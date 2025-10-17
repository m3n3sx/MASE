/**
 * 🔍 CSS Variable Inventory Scanner - Discovery System
 * 
 * Automated discovery and inventory system for:
 * - CSS custom properties (--woow-* variables)
 * - Option IDs from micro-panel templates and JavaScript
 * - Mapping gaps and inconsistencies
 * - Coverage analysis and reporting
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 */

(function(window, document) {
    'use strict';

    /**
     * 🔍 CSSVariableInventoryScanner - Main Scanner Class
     */
    class CSSVariableInventoryScanner {
        constructor() {
            this.cssVariables = new Map();
            this.optionIds = new Map();
            this.mappingGaps = new Set();
            this.duplicates = new Map();
            this.debugMode = window.masV2Debug || false;
            
            this.log('CSSVariableInventoryScanner initialized');
        }

        /**
         * 🚀 Run complete inventory scan
         */
        async runCompleteInventory() {
            this.log('Starting complete inventory scan...');
            const startTime = performance.now();

            try {
                // Clear previous results
                this.clearResults();

                // Scan CSS files for variables
                await this.scanCSSVariables();

                // Scan JavaScript files for option IDs
                await this.scanJavaScriptOptionIds();

                // Scan existing mappings
                await this.scanExistingMappings();

                // Analyze gaps and inconsistencies
                this.analyzeGaps();

                // Generate comprehensive report
                const report = this.generateInventoryReport();

                const endTime = performance.now();
                this.log(`Inventory scan completed in ${(endTime - startTime).toFixed(2)}ms`);

                return report;

            } catch (error) {
                this.logError('Inventory scan failed:', error);
                throw error;
            }
        }

        /**
         * 🧹 Clear previous scan results
         */
        clearResults() {
            this.cssVariables.clear();
            this.optionIds.clear();
            this.mappingGaps.clear();
            this.duplicates.clear();
        }

        /**
         * 🎨 Scan CSS files for --woow- custom properties
         */
        async scanCSSVariables() {
            this.log('Scanning CSS variables...');

            // Get all stylesheets
            const stylesheets = Array.from(document.styleSheets);
            
            for (const stylesheet of stylesheets) {
                try {
                    await this.scanStylesheet(stylesheet);
                } catch (error) {
                    this.logWarning(`Failed to scan stylesheet: ${stylesheet.href}`, error);
                }
            }

            // Also scan inline styles and computed styles
            await this.scanInlineStyles();
            await this.scanComputedStyles();

            this.log(`Found ${this.cssVariables.size} CSS variables`);
        }

        /**
         * 📄 Scan individual stylesheet
         */
        async scanStylesheet(stylesheet) {
            if (!stylesheet.href) return; // Skip inline stylesheets for now

            try {
                const rules = stylesheet.cssRules || stylesheet.rules;
                if (!rules) return;

                for (const rule of rules) {
                    this.scanCSSRule(rule, stylesheet.href);
                }
            } catch (error) {
                // CORS or other access issues
                this.logWarning(`Cannot access stylesheet rules: ${stylesheet.href}`);
            }
        }

        /**
         * 📋 Scan CSS rule for custom properties
         */
        scanCSSRule(rule, source) {
            if (rule.type === CSSRule.STYLE_RULE) {
                const style = rule.style;
                
                for (let i = 0; i < style.length; i++) {
                    const property = style[i];
                    
                    if (property.startsWith('--woow-')) {
                        const value = style.getPropertyValue(property);
                        this.addCSSVariable(property, value, source, rule.selectorText);
                    }
                }
            } else if (rule.type === CSSRule.MEDIA_RULE || rule.type === CSSRule.SUPPORTS_RULE) {
                // Recursively scan nested rules
                const nestedRules = rule.cssRules || rule.rules;
                if (nestedRules) {
                    for (const nestedRule of nestedRules) {
                        this.scanCSSRule(nestedRule, source);
                    }
                }
            }
        }

        /**
         * 🎨 Scan inline styles
         */
        async scanInlineStyles() {
            const elementsWithStyle = document.querySelectorAll('[style]');
            
            elementsWithStyle.forEach(element => {
                const style = element.style;
                
                for (let i = 0; i < style.length; i++) {
                    const property = style[i];
                    
                    if (property.startsWith('--woow-')) {
                        const value = style.getPropertyValue(property);
                        this.addCSSVariable(property, value, 'inline', element.tagName);
                    }
                }
            });
        }

        /**
         * 💻 Scan computed styles for CSS variables
         */
        async scanComputedStyles() {
            // Scan root element computed styles
            const rootStyles = getComputedStyle(document.documentElement);
            
            // Get all property names (this is tricky as getComputedStyle doesn't enumerate custom properties)
            // We'll use a different approach - check known patterns
            const knownPrefixes = ['--woow-'];
            
            knownPrefixes.forEach(prefix => {
                // Try common variable patterns
                const commonPatterns = [
                    'accent-primary', 'accent-secondary', 'accent-tertiary',
                    'bg-primary', 'bg-secondary', 'bg-tertiary',
                    'text-primary', 'text-secondary', 'text-tertiary',
                    'surface-bar', 'surface-menu', 'surface-footer',
                    'font-family', 'font-size-base', 'font-size-sm', 'font-size-lg',
                    'space-xs', 'space-sm', 'space-md', 'space-lg', 'space-xl',
                    'radius-sm', 'radius-md', 'radius-lg', 'radius-xl',
                    'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
                    'z-panel', 'z-modal', 'z-toast'
                ];

                commonPatterns.forEach(pattern => {
                    const property = `${prefix}${pattern}`;
                    const value = rootStyles.getPropertyValue(property);
                    
                    if (value && value.trim()) {
                        this.addCSSVariable(property, value.trim(), 'computed', ':root');
                    }
                });
            });
        }

        /**
         * ➕ Add CSS variable to inventory
         */
        addCSSVariable(property, value, source, selector = '') {
            if (!this.cssVariables.has(property)) {
                this.cssVariables.set(property, {
                    name: property,
                    value: value,
                    sources: new Set(),
                    selectors: new Set(),
                    type: this.inferVariableType(value),
                    category: this.categorizeVariable(property)
                });
            }

            const variable = this.cssVariables.get(property);
            variable.sources.add(source);
            if (selector) variable.selectors.add(selector);

            // Check for duplicates with different values
            if (variable.value !== value) {
                if (!this.duplicates.has(property)) {
                    this.duplicates.set(property, new Set());
                }
                this.duplicates.get(property).add({ value, source, selector });
            }
        }

        /**
         * 🔍 Infer CSS variable type from value
         */
        inferVariableType(value) {
            if (!value || typeof value !== 'string') return 'unknown';

            const trimmedValue = value.trim();

            // Color patterns
            if (trimmedValue.match(/^#[0-9A-Fa-f]{3,8}$/)) return 'color';
            if (trimmedValue.match(/^rgb\(/)) return 'color';
            if (trimmedValue.match(/^rgba\(/)) return 'color';
            if (trimmedValue.match(/^hsl\(/)) return 'color';
            if (trimmedValue.match(/^hsla\(/)) return 'color';

            // Numeric patterns
            if (trimmedValue.match(/^-?\d*\.?\d+(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)$/)) return 'numeric';
            if (trimmedValue.match(/^-?\d*\.?\d+$/)) return 'numeric';

            // Boolean patterns
            if (trimmedValue === '0' || trimmedValue === '1') return 'boolean';
            if (trimmedValue === 'true' || trimmedValue === 'false') return 'boolean';

            // Font family
            if (trimmedValue.includes('font') || trimmedValue.includes('sans-serif') || trimmedValue.includes('serif')) return 'font';

            // Shadow
            if (trimmedValue.includes('shadow') || trimmedValue.match(/\d+px.*rgba?\(/)) return 'shadow';

            // Gradient
            if (trimmedValue.includes('gradient')) return 'gradient';

            // Transform
            if (trimmedValue.includes('translate') || trimmedValue.includes('scale') || trimmedValue.includes('rotate')) return 'transform';

            return 'string';
        }

        /**
         * 🏷️ Categorize CSS variable by name
         */
        categorizeVariable(property) {
            const name = property.toLowerCase();

            if (name.includes('color') || name.includes('bg') || name.includes('text')) return 'color';
            if (name.includes('font') || name.includes('text')) return 'typography';
            if (name.includes('space') || name.includes('margin') || name.includes('padding')) return 'spacing';
            if (name.includes('radius') || name.includes('border')) return 'border';
            if (name.includes('shadow')) return 'shadow';
            if (name.includes('z-') || name.includes('z-index')) return 'z-index';
            if (name.includes('transition') || name.includes('duration') || name.includes('ease')) return 'animation';
            if (name.includes('surface') || name.includes('bar') || name.includes('menu')) return 'surface';
            if (name.includes('blur') || name.includes('glass')) return 'effect';

            return 'misc';
        }

        /**
         * 🔍 Scan JavaScript files for option IDs
         */
        async scanJavaScriptOptionIds() {
            this.log('Scanning JavaScript option IDs...');

            // Scan existing CSSVariableMapper mappings
            if (window.cssVariableMapperInstance) {
                this.scanMapperInstance(window.cssVariableMapperInstance);
            }

            // Scan micro-panel factory configurations
            if (window.microPanelFactoryInstance) {
                this.scanMicroPanelFactory(window.microPanelFactoryInstance);
            }

            // Scan DOM for data-option-id attributes
            this.scanDOMOptionIds();

            this.log(`Found ${this.optionIds.size} option IDs`);
        }

        /**
         * 🗺️ Scan CSSVariableMapper instance
         */
        scanMapperInstance(mapper) {
            if (mapper.mappings) {
                mapper.mappings.forEach((mapping, optionId) => {
                    this.addOptionId(optionId, {
                        cssVar: mapping.cssVar,
                        type: mapping.type,
                        unit: mapping.unit,
                        source: 'CSSVariableMapper'
                    });
                });
            }

            if (mapper.bodyClassMappings) {
                mapper.bodyClassMappings.forEach((className, optionId) => {
                    this.addOptionId(optionId, {
                        bodyClass: className,
                        type: 'boolean',
                        source: 'CSSVariableMapper (body class)'
                    });
                });
            }

            if (mapper.visibilityMappings) {
                mapper.visibilityMappings.forEach((selector, optionId) => {
                    this.addOptionId(optionId, {
                        visibilitySelector: selector,
                        type: 'boolean',
                        source: 'CSSVariableMapper (visibility)'
                    });
                });
            }
        }

        /**
         * 🏭 Scan MicroPanelFactory configurations
         */
        scanMicroPanelFactory(factory) {
            if (factory.panelConfigs) {
                factory.panelConfigs.forEach((config, elementId) => {
                    if (config.options) {
                        config.options.forEach(option => {
                            this.addOptionId(option.id, {
                                cssVar: option.cssVar,
                                type: option.type,
                                unit: option.unit,
                                bodyClass: option.bodyClass,
                                default: option.default,
                                source: `MicroPanelFactory (${elementId})`
                            });
                        });
                    }
                });
            }
        }

        /**
         * 🔍 Scan DOM for data-option-id attributes
         */
        scanDOMOptionIds() {
            const elementsWithOptionId = document.querySelectorAll('[data-option-id]');
            
            elementsWithOptionId.forEach(element => {
                const optionId = element.getAttribute('data-option-id');
                const cssVar = element.getAttribute('data-css-var');
                const unit = element.getAttribute('data-unit');
                const bodyClass = element.getAttribute('data-body-class');

                this.addOptionId(optionId, {
                    cssVar: cssVar,
                    unit: unit,
                    bodyClass: bodyClass,
                    type: this.inferOptionType(element),
                    source: 'DOM attribute',
                    element: element.tagName.toLowerCase()
                });
            });
        }

        /**
         * 🔍 Infer option type from DOM element
         */
        inferOptionType(element) {
            const type = element.type || element.tagName.toLowerCase();
            
            switch (type) {
                case 'color': return 'color';
                case 'range': return 'numeric';
                case 'checkbox': return 'boolean';
                case 'text': return 'string';
                case 'select': return 'string';
                default: return 'unknown';
            }
        }

        /**
         * ➕ Add option ID to inventory
         */
        addOptionId(optionId, details) {
            if (!this.optionIds.has(optionId)) {
                this.optionIds.set(optionId, {
                    id: optionId,
                    sources: new Set(),
                    mappings: new Map(),
                    category: this.categorizeOptionId(optionId)
                });
            }

            const option = this.optionIds.get(optionId);
            option.sources.add(details.source);
            
            // Store mapping details
            if (details.cssVar) option.mappings.set('cssVar', details.cssVar);
            if (details.bodyClass) option.mappings.set('bodyClass', details.bodyClass);
            if (details.visibilitySelector) option.mappings.set('visibilitySelector', details.visibilitySelector);
            if (details.type) option.mappings.set('type', details.type);
            if (details.unit) option.mappings.set('unit', details.unit);
            if (details.default !== undefined) option.mappings.set('default', details.default);
        }

        /**
         * 🏷️ Categorize option ID by name
         */
        categorizeOptionId(optionId) {
            const name = optionId.toLowerCase();

            if (name.includes('admin_bar') || name.includes('wpadminbar')) return 'admin-bar';
            if (name.includes('menu') || name.includes('adminmenu')) return 'menu';
            if (name.includes('postbox') || name.includes('metabox')) return 'postbox';
            if (name.includes('footer') || name.includes('wpfooter')) return 'footer';
            if (name.includes('color') || name.includes('bg') || name.includes('background')) return 'color';
            if (name.includes('font') || name.includes('text') || name.includes('typography')) return 'typography';
            if (name.includes('width') || name.includes('height') || name.includes('size')) return 'dimension';
            if (name.includes('margin') || name.includes('padding') || name.includes('space')) return 'spacing';
            if (name.includes('radius') || name.includes('border')) return 'border';
            if (name.includes('shadow') || name.includes('blur')) return 'effect';
            if (name.includes('floating') || name.includes('glassmorphism') || name.includes('mode')) return 'mode';
            if (name.includes('hide') || name.includes('show') || name.includes('visible')) return 'visibility';

            return 'misc';
        }

        /**
         * 🔍 Scan existing mappings from current implementation
         */
        async scanExistingMappings() {
            this.log('Scanning existing mappings...');

            // This method analyzes the current state of mappings
            // and identifies what's already working vs what needs attention
        }

        /**
         * 🔍 Analyze gaps and inconsistencies
         */
        analyzeGaps() {
            this.log('Analyzing mapping gaps...');

            // Find option IDs without CSS variable mappings
            this.optionIds.forEach((option, optionId) => {
                if (!option.mappings.has('cssVar') && 
                    !option.mappings.has('bodyClass') && 
                    !option.mappings.has('visibilitySelector')) {
                    this.mappingGaps.add({
                        type: 'unmapped_option',
                        optionId: optionId,
                        suggestion: this.suggestCSSVariable(optionId),
                        category: option.category
                    });
                }
            });

            // Find CSS variables without option mappings
            this.cssVariables.forEach((variable, cssVar) => {
                const hasMapping = Array.from(this.optionIds.values()).some(option => 
                    option.mappings.get('cssVar') === cssVar
                );

                if (!hasMapping) {
                    this.mappingGaps.add({
                        type: 'unmapped_variable',
                        cssVar: cssVar,
                        suggestion: this.suggestOptionId(cssVar),
                        category: variable.category
                    });
                }
            });

            this.log(`Found ${this.mappingGaps.size} mapping gaps`);
        }

        /**
         * 💡 Suggest CSS variable name for option ID
         */
        suggestCSSVariable(optionId) {
            // Convert snake_case to kebab-case with --woow- prefix
            return `--woow-${optionId.replace(/_/g, '-')}`;
        }

        /**
         * 💡 Suggest option ID for CSS variable
         */
        suggestOptionId(cssVar) {
            // Remove --woow- prefix and convert kebab-case to snake_case
            return cssVar.replace(/^--woow-/, '').replace(/-/g, '_');
        }

        /**
         * 📊 Generate comprehensive inventory report
         */
        generateInventoryReport() {
            const report = {
                timestamp: new Date().toISOString(),
                summary: {
                    cssVariables: this.cssVariables.size,
                    optionIds: this.optionIds.size,
                    mappingGaps: this.mappingGaps.size,
                    duplicates: this.duplicates.size,
                    coveragePercentage: this.calculateCoveragePercentage()
                },
                cssVariables: this.generateCSSVariableReport(),
                optionIds: this.generateOptionIdReport(),
                mappingGaps: Array.from(this.mappingGaps),
                duplicates: this.generateDuplicateReport(),
                recommendations: this.generateRecommendations(),
                categories: this.generateCategoryBreakdown()
            };

            this.log('Generated inventory report:', report.summary);
            return report;
        }

        /**
         * 📊 Calculate mapping coverage percentage
         */
        calculateCoveragePercentage() {
            const totalItems = this.cssVariables.size + this.optionIds.size;
            const mappedItems = totalItems - this.mappingGaps.size;
            return totalItems > 0 ? Math.round((mappedItems / totalItems) * 100) : 100;
        }

        /**
         * 📊 Generate CSS variable report
         */
        generateCSSVariableReport() {
            const variables = [];
            
            this.cssVariables.forEach((variable, name) => {
                variables.push({
                    name: name,
                    value: variable.value,
                    type: variable.type,
                    category: variable.category,
                    sources: Array.from(variable.sources),
                    selectors: Array.from(variable.selectors)
                });
            });

            return variables.sort((a, b) => a.name.localeCompare(b.name));
        }

        /**
         * 📊 Generate option ID report
         */
        generateOptionIdReport() {
            const options = [];
            
            this.optionIds.forEach((option, id) => {
                options.push({
                    id: id,
                    category: option.category,
                    sources: Array.from(option.sources),
                    mappings: Object.fromEntries(option.mappings)
                });
            });

            return options.sort((a, b) => a.id.localeCompare(b.id));
        }

        /**
         * 📊 Generate duplicate report
         */
        generateDuplicateReport() {
            const duplicates = {};
            
            this.duplicates.forEach((values, property) => {
                duplicates[property] = Array.from(values);
            });

            return duplicates;
        }

        /**
         * 💡 Generate recommendations
         */
        generateRecommendations() {
            const recommendations = [];

            // High priority recommendations
            if (this.mappingGaps.size > 0) {
                recommendations.push({
                    priority: 'high',
                    type: 'mapping_gaps',
                    message: `${this.mappingGaps.size} unmapped items found. Consider creating mappings for better coverage.`,
                    action: 'Create centralized mapping configuration'
                });
            }

            if (this.duplicates.size > 0) {
                recommendations.push({
                    priority: 'medium',
                    type: 'duplicates',
                    message: `${this.duplicates.size} CSS variables have conflicting values across sources.`,
                    action: 'Consolidate duplicate variable definitions'
                });
            }

            // Coverage recommendations
            const coverage = this.calculateCoveragePercentage();
            if (coverage < 90) {
                recommendations.push({
                    priority: 'medium',
                    type: 'coverage',
                    message: `Mapping coverage is ${coverage}%. Aim for 95%+ coverage.`,
                    action: 'Add missing mappings to improve coverage'
                });
            }

            return recommendations;
        }

        /**
         * 📊 Generate category breakdown
         */
        generateCategoryBreakdown() {
            const cssCategories = {};
            const optionCategories = {};

            this.cssVariables.forEach(variable => {
                cssCategories[variable.category] = (cssCategories[variable.category] || 0) + 1;
            });

            this.optionIds.forEach(option => {
                optionCategories[option.category] = (optionCategories[option.category] || 0) + 1;
            });

            return {
                cssVariables: cssCategories,
                optionIds: optionCategories
            };
        }

        /**
         * 📤 Export inventory data
         */
        exportInventory(format = 'json') {
            const report = this.generateInventoryReport();

            switch (format) {
                case 'json':
                    return JSON.stringify(report, null, 2);
                
                case 'csv':
                    return this.convertToCSV(report);
                
                case 'markdown':
                    return this.convertToMarkdown(report);
                
                default:
                    return report;
            }
        }

        /**
         * 📄 Convert report to CSV format
         */
        convertToCSV(report) {
            let csv = 'Type,Name,Value,Category,Sources\n';

            // Add CSS variables
            report.cssVariables.forEach(variable => {
                csv += `CSS Variable,"${variable.name}","${variable.value}","${variable.category}","${variable.sources.join('; ')}"\n`;
            });

            // Add option IDs
            report.optionIds.forEach(option => {
                const cssVar = option.mappings.cssVar || '';
                csv += `Option ID,"${option.id}","${cssVar}","${option.category}","${option.sources.join('; ')}"\n`;
            });

            return csv;
        }

        /**
         * 📝 Convert report to Markdown format
         */
        convertToMarkdown(report) {
            let md = '# CSS Variable Inventory Report\n\n';
            
            md += `Generated: ${report.timestamp}\n\n`;
            
            md += '## Summary\n\n';
            md += `- CSS Variables: ${report.summary.cssVariables}\n`;
            md += `- Option IDs: ${report.summary.optionIds}\n`;
            md += `- Mapping Gaps: ${report.summary.mappingGaps}\n`;
            md += `- Coverage: ${report.summary.coveragePercentage}%\n\n`;

            if (report.recommendations.length > 0) {
                md += '## Recommendations\n\n';
                report.recommendations.forEach(rec => {
                    md += `- **${rec.priority.toUpperCase()}**: ${rec.message}\n`;
                    md += `  - Action: ${rec.action}\n\n`;
                });
            }

            return md;
        }

        /**
         * 📝 Logging utilities
         */
        log(message, ...args) {
            if (this.debugMode) {
                console.log(`🔍 InventoryScanner: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ InventoryScanner: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ InventoryScanner: ${message}`, ...args);
        }
    }

    // Make CSSVariableInventoryScanner globally available
    window.CSSVariableInventoryScanner = CSSVariableInventoryScanner;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cssVariableInventoryScanner = new CSSVariableInventoryScanner();
        });
    } else {
        window.cssVariableInventoryScanner = new CSSVariableInventoryScanner();
    }

})(window, document);