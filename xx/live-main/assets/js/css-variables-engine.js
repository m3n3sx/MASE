/**
 * 🎨 CSS Variables Engine - Next-Generation CSS Custom Properties System
 * 
 * Complete redesign of CSS variables architecture with:
 * - W3C CSS Custom Properties compliance
 * - Real-time application with <50ms performance
 * - Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
 * - Centralized mapping with fallback values
 * - Advanced validation and error handling
 * - Performance monitoring and optimization
 * 
 * @package ModernAdminStyler
 * @version 2.0.0 - Complete Architecture Redesign
 * @author Kiro AI Assistant
 */

(function(window, document) {
    'use strict';

    /**
     * 🚀 CSSVariablesEngine - Core Engine Class
     */
    class CSSVariablesEngine {
        constructor(options = {}) {
            // Configuration
            this.config = {
                performanceTarget: 50, // Target <50ms per change
                enableFallbacks: true,
                enableValidation: true,
                enablePerformanceMonitoring: true,
                enableCrossBrowserSupport: true,
                enableComputedValues: true, // NEW: Enable computed values
                enableCalcExpressions: true, // NEW: Enable calc() expressions
                enableCascadeResolution: true, // NEW: Enable cascade resolution
                debugMode: options.debug || window.masV2Debug || false,
                ...options
            };

            // Core systems
            this.variableRegistry = new Map();
            this.mappingRegistry = new Map();
            this.fallbackRegistry = new Map();
            this.performanceMonitor = new PerformanceMonitor();
            this.validator = new CSSVariableValidator();
            this.browserSupport = new BrowserCompatibilityManager();
            
            // NEW: Advanced systems for task 2.1
            this.computedValuesEngine = new ComputedValuesEngine(this);
            this.calcExpressionParser = new CalcExpressionParser(this);
            this.cascadeResolver = new CascadeResolver(this);
            this.dependencyGraph = new Map(); // Track variable dependencies
            
            // State management
            this.isInitialized = false;
            this.pendingUpdates = new Set();
            this.updateQueue = [];
            this.batchUpdateTimer = null;

            this.initialize();
        }

        /**
         * 🔧 Initialize the CSS Variables Engine
         */
        async initialize() {
            try {
                this.log('🚀 Initializing CSS Variables Engine...');
                
                // Check browser support
                await this.browserSupport.initialize();
                
                // Initialize core registries
                this.initializeVariableRegistry();
                this.initializeMappingRegistry();
                this.initializeFallbackRegistry();
                
                // Setup performance monitoring
                if (this.config.enablePerformanceMonitoring) {
                    this.performanceMonitor.initialize();
                }
                
                // Setup batch update system
                this.setupBatchUpdateSystem();
                
                // Apply initial CSS architecture
                this.applyInitialArchitecture();
                
                // Build dependency graph for computed values
                this.buildDependencyGraph();
                
                // Initialize computed and calc variables
                await this.initializeComputedVariables();
                
                this.isInitialized = true;
                this.log('✅ CSS Variables Engine initialized successfully');
                
                // Trigger initialization event
                this.dispatchEvent('css-engine:initialized', {
                    engine: this,
                    performance: this.performanceMonitor.getStats()
                });
                
            } catch (error) {
                this.logError('❌ Failed to initialize CSS Variables Engine:', error);
                throw error;
            }
        }

        /**
         * 🗺️ Initialize Variable Registry with W3C compliant definitions
         */
        initializeVariableRegistry() {
            const variables = {
                // ========================================
                // 🎯 SURFACE SYSTEM (Admin Bar, Menu, etc.)
                // ========================================
                '--woow-surface-bar': {
                    category: 'surface',
                    type: 'color',
                    default: '#23282d',
                    fallback: '#333333',
                    description: 'Admin bar background color'
                },
                '--woow-surface-bar-computed': {
                    category: 'surface',
                    type: 'computed',
                    computation: 'lighten(var(--woow-surface-bar), 10%)',
                    dependencies: ['--woow-surface-bar'],
                    fallback: '#2c3338',
                    description: 'Computed lighter version of admin bar color'
                },
                '--woow-surface-bar-text': {
                    category: 'surface',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Admin bar text color'
                },
                '--woow-surface-bar-height': {
                    category: 'surface',
                    type: 'dimension',
                    unit: 'px',
                    default: '32',
                    fallback: '32',
                    min: 24,
                    max: 60,
                    description: 'Admin bar height'
                },
                '--woow-surface-bar-height-calc': {
                    category: 'surface',
                    type: 'calc',
                    expression: 'calc(var(--woow-surface-bar-height) + 8px)',
                    dependencies: ['--woow-surface-bar-height'],
                    fallback: '40px',
                    description: 'Admin bar height with padding calculated'
                },
                '--woow-surface-bar-hover': {
                    category: 'surface',
                    type: 'color',
                    default: '#0073aa',
                    fallback: '#0073aa',
                    description: 'Admin bar hover color'
                },
                '--woow-surface-bar-floating': {
                    category: 'surface',
                    type: 'boolean',
                    default: '0',
                    fallback: '0',
                    description: 'Admin bar floating mode'
                },
                '--woow-surface-bar-blur': {
                    category: 'surface',
                    type: 'dimension',
                    unit: 'px',
                    default: '10',
                    fallback: '0',
                    min: 0,
                    max: 50,
                    description: 'Admin bar backdrop blur'
                },

                // Menu System
                '--woow-surface-menu': {
                    category: 'surface',
                    type: 'color',
                    default: '#23282d',
                    fallback: '#333333',
                    description: 'Admin menu background'
                },
                '--woow-surface-menu-text': {
                    category: 'surface',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Admin menu text color'
                },
                '--woow-surface-menu-width': {
                    category: 'surface',
                    type: 'dimension',
                    unit: 'px',
                    default: '160',
                    fallback: '160',
                    min: 120,
                    max: 300,
                    description: 'Admin menu width'
                },
                '--woow-surface-menu-hover': {
                    category: 'surface',
                    type: 'color',
                    default: '#0073aa',
                    fallback: '#0073aa',
                    description: 'Menu item hover color'
                },
                '--woow-surface-menu-floating': {
                    category: 'surface',
                    type: 'boolean',
                    default: '0',
                    fallback: '0',
                    description: 'Menu floating mode'
                },

                // ========================================
                // 🎨 ACCENT SYSTEM (Primary, Secondary, etc.)
                // ========================================
                '--woow-accent-primary': {
                    category: 'accent',
                    type: 'color',
                    default: '#0073aa',
                    fallback: '#0073aa',
                    description: 'Primary accent color'
                },
                '--woow-accent-secondary': {
                    category: 'accent',
                    type: 'color',
                    default: '#00a32a',
                    fallback: '#00a32a',
                    description: 'Secondary accent color'
                },
                '--woow-accent-success': {
                    category: 'accent',
                    type: 'color',
                    default: '#00a32a',
                    fallback: '#00a32a',
                    description: 'Success state color'
                },
                '--woow-accent-warning': {
                    category: 'accent',
                    type: 'color',
                    default: '#dba617',
                    fallback: '#dba617',
                    description: 'Warning state color'
                },
                '--woow-accent-error': {
                    category: 'accent',
                    type: 'color',
                    default: '#d63638',
                    fallback: '#d63638',
                    description: 'Error state color'
                },

                // ========================================
                // 📝 TEXT SYSTEM (Typography)
                // ========================================
                '--woow-text-primary': {
                    category: 'text',
                    type: 'color',
                    default: '#1e293b',
                    fallback: '#333333',
                    description: 'Primary text color'
                },
                '--woow-text-secondary': {
                    category: 'text',
                    type: 'color',
                    default: '#64748b',
                    fallback: '#666666',
                    description: 'Secondary text color'
                },
                '--woow-text-inverse': {
                    category: 'text',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Inverse text color'
                },

                // ========================================
                // 🏠 BACKGROUND SYSTEM
                // ========================================
                '--woow-bg-primary': {
                    category: 'background',
                    type: 'color',
                    default: '#ffffff',
                    fallback: '#ffffff',
                    description: 'Primary background color'
                },
                '--woow-bg-secondary': {
                    category: 'background',
                    type: 'color',
                    default: '#f8fafc',
                    fallback: '#f8f8f8',
                    description: 'Secondary background color'
                },

                // ========================================
                // 📐 SPACING SYSTEM
                // ========================================
                '--woow-space-xs': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '0.25',
                    fallback: '0.25',
                    description: 'Extra small spacing'
                },
                '--woow-space-sm': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '0.5',
                    fallback: '0.5',
                    description: 'Small spacing'
                },
                '--woow-space-md': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '1',
                    fallback: '1',
                    description: 'Medium spacing'
                },
                '--woow-space-lg': {
                    category: 'spacing',
                    type: 'dimension',
                    unit: 'rem',
                    default: '1.5',
                    fallback: '1.5',
                    description: 'Large spacing'
                },

                // ========================================
                // 🔘 RADIUS SYSTEM
                // ========================================
                '--woow-radius-sm': {
                    category: 'radius',
                    type: 'dimension',
                    unit: 'px',
                    default: '4',
                    fallback: '4',
                    description: 'Small border radius'
                },
                '--woow-radius-md': {
                    category: 'radius',
                    type: 'dimension',
                    unit: 'px',
                    default: '8',
                    fallback: '8',
                    description: 'Medium border radius'
                },
                '--woow-radius-lg': {
                    category: 'radius',
                    type: 'dimension',
                    unit: 'px',
                    default: '12',
                    fallback: '12',
                    description: 'Large border radius'
                },

                // ========================================
                // 🎭 EFFECTS SYSTEM
                // ========================================
                '--woow-shadow-sm': {
                    category: 'effects',
                    type: 'shadow',
                    default: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    fallback: '0 1px 2px rgba(0, 0, 0, 0.1)',
                    description: 'Small shadow'
                },
                '--woow-shadow-md': {
                    category: 'effects',
                    type: 'shadow',
                    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fallback: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    description: 'Medium shadow'
                },
                '--woow-transition-fast': {
                    category: 'effects',
                    type: 'transition',
                    default: '150ms ease-in-out',
                    fallback: '0.15s ease',
                    description: 'Fast transition'
                },
                '--woow-transition-normal': {
                    category: 'effects',
                    type: 'transition',
                    default: '300ms ease-in-out',
                    fallback: '0.3s ease',
                    description: 'Normal transition'
                }
            };

            // Register all variables
            Object.entries(variables).forEach(([name, config]) => {
                this.variableRegistry.set(name, config);
            });

            this.log(`📋 Registered ${this.variableRegistry.size} CSS variables`);
        }

        /**
         * 🗺️ Initialize Mapping Registry (Option ID → CSS Variable)
         */
        initializeMappingRegistry() {
            const mappings = {
                // Admin Bar Mappings
                'admin_bar_background': '--woow-surface-bar',
                'wpadminbar_bg_color': '--woow-surface-bar',
                'admin_bar_text_color': '--woow-surface-bar-text',
                'wpadminbar_text_color': '--woow-surface-bar-text',
                'admin_bar_height': '--woow-surface-bar-height',
                'wpadminbar_height': '--woow-surface-bar-height',
                'admin_bar_hover_color': '--woow-surface-bar-hover',
                'admin_bar_floating': '--woow-surface-bar-floating',
                'wpadminbar_floating': '--woow-surface-bar-floating',

                // Menu Mappings
                'menu_background': '--woow-surface-menu',
                'menu_text_color': '--woow-surface-menu-text',
                'menu_width': '--woow-surface-menu-width',
                'menu_hover_color': '--woow-surface-menu-hover',
                'menu_floating': '--woow-surface-menu-floating',

                // Color System
                'primary_color': '--woow-accent-primary',
                'secondary_color': '--woow-accent-secondary',
                'success_color': '--woow-accent-success',
                'warning_color': '--woow-accent-warning',
                'error_color': '--woow-accent-error',

                // Typography
                'content_text_color': '--woow-text-primary',
                'content_background': '--woow-bg-primary'
            };

            Object.entries(mappings).forEach(([optionId, cssVar]) => {
                this.mappingRegistry.set(optionId, cssVar);
            });

            this.log(`🗺️ Registered ${this.mappingRegistry.size} option mappings`);
        }

        /**
         * 🛡️ Initialize Fallback Registry for unsupported browsers
         */
        initializeFallbackRegistry() {
            // Legacy browser fallbacks
            const fallbacks = {
                '--woow-surface-bar': {
                    property: 'background-color',
                    selector: '#wpadminbar'
                },
                '--woow-surface-bar-text': {
                    property: 'color',
                    selector: '#wpadminbar, #wpadminbar a'
                },
                '--woow-surface-menu': {
                    property: 'background-color',
                    selector: '#adminmenuwrap'
                },
                '--woow-surface-menu-text': {
                    property: 'color',
                    selector: '#adminmenu a'
                }
            };

            Object.entries(fallbacks).forEach(([cssVar, config]) => {
                this.fallbackRegistry.set(cssVar, config);
            });

            this.log(`🛡️ Registered ${this.fallbackRegistry.size} fallback mappings`);
        }

        /**
         * 🎨 Apply CSS variable with comprehensive error handling and performance monitoring
         */
        async applyVariable(optionId, value, options = {}) {
            const startTime = performance.now();
            
            try {
                // Get CSS variable from mapping
                const cssVar = this.mappingRegistry.get(optionId);
                if (!cssVar) {
                    throw new Error(`No CSS variable mapping found for option: ${optionId}`);
                }

                // Get variable configuration
                const varConfig = this.variableRegistry.get(cssVar);
                if (!varConfig) {
                    throw new Error(`CSS variable not registered: ${cssVar}`);
                }

                // Validate value
                if (this.config.enableValidation) {
                    const validation = this.validator.validate(value, varConfig);
                    if (!validation.isValid) {
                        throw new Error(`Validation failed: ${validation.error}`);
                    }
                    value = validation.sanitizedValue;
                }

                // Handle cascade resolution if enabled
                if (this.config.enableCascadeResolution) {
                    value = await this.cascadeResolver.resolveCascade(cssVar, value, options);
                }

                // Transform value with unit if needed (now async)
                const cssValue = await this.transformValue(value, { ...varConfig, name: cssVar });

                // Apply CSS variable
                const success = await this.setCSSProperty(cssVar, cssValue, varConfig);

                // Record performance
                const duration = performance.now() - startTime;
                this.performanceMonitor.recordUpdate(cssVar, duration, success);

                if (success) {
                    this.log(`✅ Applied ${cssVar}: ${cssValue} (${duration.toFixed(2)}ms)`);
                    
                    // Update dependent variables
                    await this.updateDependents(cssVar);
                    
                    // Trigger change event
                    this.dispatchEvent('css-variable:changed', {
                        optionId,
                        cssVar,
                        value: cssValue,
                        duration
                    });
                } else {
                    throw new Error('Failed to apply CSS property');
                }

                return success;

            } catch (error) {
                const duration = performance.now() - startTime;
                this.performanceMonitor.recordUpdate(optionId, duration, false);
                this.logError(`❌ Failed to apply ${optionId}:`, error);
                return false;
            }
        }

        /**
         * 🎯 Set CSS property with cross-browser support and fallbacks
         */
        async setCSSProperty(cssVar, value, varConfig) {
            try {
                // Primary method: CSS Custom Properties
                if (this.browserSupport.supportsCustomProperties()) {
                    document.documentElement.style.setProperty(cssVar, value);
                    
                    // Verify application
                    const appliedValue = getComputedStyle(document.documentElement)
                        .getPropertyValue(cssVar).trim();
                    
                    if (appliedValue === value.toString().trim()) {
                        return true;
                    }
                }

                // Fallback method: Direct CSS application
                if (this.config.enableFallbacks) {
                    return this.applyFallbackCSS(cssVar, value);
                }

                return false;

            } catch (error) {
                this.logError('Failed to set CSS property:', error);
                return false;
            }
        }

        /**
         * 🛡️ Apply fallback CSS for unsupported browsers
         */
        applyFallbackCSS(cssVar, value) {
            try {
                const fallback = this.fallbackRegistry.get(cssVar);
                if (!fallback) {
                    return false;
                }

                // Create or update fallback style element
                let styleElement = document.querySelector(`style[data-css-var="${cssVar}"]`);
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.setAttribute('data-css-var', cssVar);
                    document.head.appendChild(styleElement);
                }

                // Apply CSS rule
                styleElement.textContent = `
                    ${fallback.selector} {
                        ${fallback.property}: ${value} !important;
                    }
                `;

                this.log(`🛡️ Applied fallback CSS: ${cssVar} → ${fallback.selector}`);
                return true;

            } catch (error) {
                this.logError('Failed to apply fallback CSS:', error);
                return false;
            }
        }

        /**
         * 🔄 Transform value based on variable configuration
         */
        async transformValue(value, varConfig) {
            switch (varConfig.type) {
                case 'color':
                    return this.validator.sanitizeColor(value);
                
                case 'dimension':
                    const numValue = parseFloat(value);
                    return varConfig.unit ? `${numValue}${varConfig.unit}` : numValue.toString();
                
                case 'boolean':
                    return value ? '1' : '0';
                
                case 'computed':
                    if (this.config.enableComputedValues) {
                        return await this.computedValuesEngine.computeValue(varConfig.name, varConfig);
                    }
                    return varConfig.fallback;
                
                case 'calc':
                    if (this.config.enableCalcExpressions) {
                        return await this.calcExpressionParser.parseCalcExpression(varConfig.name, varConfig);
                    }
                    return varConfig.fallback;
                
                case 'shadow':
                case 'transition':
                default:
                    return value.toString();
            }
        }

        /**
         * 📦 Batch update multiple variables for optimal performance
         */
        async batchUpdate(updates) {
            const startTime = performance.now();
            const results = [];

            try {
                // Process all updates
                const promises = updates.map(({ optionId, value, options }) => 
                    this.applyVariable(optionId, value, options)
                );

                const outcomes = await Promise.allSettled(promises);
                
                outcomes.forEach((outcome, index) => {
                    results.push({
                        optionId: updates[index].optionId,
                        success: outcome.status === 'fulfilled' && outcome.value,
                        error: outcome.status === 'rejected' ? outcome.reason : null
                    });
                });

                const duration = performance.now() - startTime;
                const successCount = results.filter(r => r.success).length;

                this.log(`📦 Batch update completed: ${successCount}/${updates.length} successful (${duration.toFixed(2)}ms)`);

                return {
                    success: successCount === updates.length,
                    results,
                    duration,
                    successCount,
                    totalCount: updates.length
                };

            } catch (error) {
                this.logError('Batch update failed:', error);
                return {
                    success: false,
                    error: error.message,
                    results
                };
            }
        }

        /**
         * ⚡ Setup batch update system for performance optimization
         */
        setupBatchUpdateSystem() {
            this.batchUpdateDelay = 16; // ~60fps
            
            // Debounced batch processor
            this.processBatchUpdates = this.debounce(() => {
                if (this.updateQueue.length > 0) {
                    const updates = [...this.updateQueue];
                    this.updateQueue = [];
                    this.batchUpdate(updates);
                }
            }, this.batchUpdateDelay);
        }

        /**
         * 🎨 Apply initial CSS architecture
         */
        applyInitialArchitecture() {
            // Create base CSS architecture
            const baseCSS = this.generateBaseCSS();
            
            // Apply base styles
            let styleElement = document.querySelector('#woow-css-variables-base');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'woow-css-variables-base';
                document.head.appendChild(styleElement);
            }
            
            styleElement.textContent = baseCSS;
            this.log('🎨 Applied initial CSS architecture');
        }

        /**
         * 🏗️ Generate base CSS with all variables and fallbacks
         */
        generateBaseCSS() {
            let css = ':root {\n';
            
            // Add all CSS variables with default values
            this.variableRegistry.forEach((config, cssVar) => {
                const value = this.transformValue(config.default, config);
                css += `  ${cssVar}: ${value};\n`;
            });
            
            css += '}\n\n';
            
            // Add fallback styles for older browsers
            if (this.config.enableFallbacks) {
                css += this.generateFallbackCSS();
            }
            
            return css;
        }

        /**
         * 🛡️ Generate fallback CSS for older browsers
         */
        generateFallbackCSS() {
            let css = '/* Fallback styles for older browsers */\n';
            
            this.fallbackRegistry.forEach((fallback, cssVar) => {
                const varConfig = this.variableRegistry.get(cssVar);
                if (varConfig) {
                    const value = this.transformValue(varConfig.fallback, varConfig);
                    css += `${fallback.selector} {\n`;
                    css += `  ${fallback.property}: ${value};\n`;
                    css += '}\n';
                }
            });
            
            return css;
        }

        /**
         * 📊 Get performance statistics
         */
        getPerformanceStats() {
            return this.performanceMonitor.getStats();
        }

        /**
         * 🧮 Initialize computed and calc variables
         */
        async initializeComputedVariables() {
            const computedVariables = [];
            const calcVariables = [];

            this.variableRegistry.forEach((config, cssVar) => {
                if (config.type === 'computed') {
                    computedVariables.push({ cssVar, config });
                } else if (config.type === 'calc') {
                    calcVariables.push({ cssVar, config });
                }
            });

            // Initialize computed variables first
            for (const { cssVar, config } of computedVariables) {
                try {
                    const computedValue = await this.computedValuesEngine.computeValue(cssVar, config);
                    await this.setCSSProperty(cssVar, computedValue, config);
                } catch (error) {
                    this.logError(`Failed to initialize computed variable ${cssVar}:`, error);
                }
            }

            // Initialize calc variables
            for (const { cssVar, config } of calcVariables) {
                try {
                    const calculatedValue = await this.calcExpressionParser.parseCalcExpression(cssVar, config);
                    await this.setCSSProperty(cssVar, calculatedValue, config);
                } catch (error) {
                    this.logError(`Failed to initialize calc variable ${cssVar}:`, error);
                }
            }

            this.log(`🧮 Initialized ${computedVariables.length} computed and ${calcVariables.length} calc variables`);
        }

        /**
         * 🔗 Build dependency graph for computed and calc variables
         */
        buildDependencyGraph() {
            this.dependencyGraph.clear();
            
            this.variableRegistry.forEach((config, cssVar) => {
                if (config.dependencies && config.dependencies.length > 0) {
                    this.dependencyGraph.set(cssVar, {
                        dependencies: config.dependencies,
                        dependents: new Set()
                    });
                }
            });

            // Build reverse dependencies (dependents)
            this.dependencyGraph.forEach((info, cssVar) => {
                info.dependencies.forEach(dep => {
                    if (this.dependencyGraph.has(dep)) {
                        this.dependencyGraph.get(dep).dependents.add(cssVar);
                    } else {
                        this.dependencyGraph.set(dep, {
                            dependencies: [],
                            dependents: new Set([cssVar])
                        });
                    }
                });
            });

            this.log(`🔗 Built dependency graph with ${this.dependencyGraph.size} nodes`);
        }

        /**
         * 🔄 Update dependent variables when a dependency changes
         */
        async updateDependents(changedVar) {
            const dependencyInfo = this.dependencyGraph.get(changedVar);
            if (!dependencyInfo || dependencyInfo.dependents.size === 0) {
                return;
            }

            const updatePromises = [];
            
            for (const dependent of dependencyInfo.dependents) {
                const varConfig = this.variableRegistry.get(dependent);
                if (varConfig) {
                    if (varConfig.type === 'computed') {
                        updatePromises.push(this.recomputeVariable(dependent, varConfig));
                    } else if (varConfig.type === 'calc') {
                        updatePromises.push(this.recalculateVariable(dependent, varConfig));
                    }
                }
            }

            await Promise.all(updatePromises);
            this.log(`🔄 Updated ${updatePromises.length} dependent variables for ${changedVar}`);
        }

        /**
         * 🧮 Recompute a computed variable
         */
        async recomputeVariable(cssVar, varConfig) {
            try {
                const computedValue = await this.computedValuesEngine.computeValue(cssVar, varConfig);
                await this.setCSSProperty(cssVar, computedValue, varConfig);
                
                // Trigger dependent updates
                await this.updateDependents(cssVar);
                
                this.dispatchEvent('css-variable:recomputed', {
                    cssVar,
                    value: computedValue
                });
            } catch (error) {
                this.logError(`Failed to recompute ${cssVar}:`, error);
            }
        }

        /**
         * 🧮 Recalculate a calc variable
         */
        async recalculateVariable(cssVar, varConfig) {
            try {
                const calculatedValue = await this.calcExpressionParser.parseCalcExpression(cssVar, varConfig);
                await this.setCSSProperty(cssVar, calculatedValue, varConfig);
                
                // Trigger dependent updates
                await this.updateDependents(cssVar);
                
                this.dispatchEvent('css-variable:recalculated', {
                    cssVar,
                    value: calculatedValue
                });
            } catch (error) {
                this.logError(`Failed to recalculate ${cssVar}:`, error);
            }
        }

        /**
         * 📊 Get dependency information
         */
        getDependencyInfo(cssVar) {
            const info = this.dependencyGraph.get(cssVar);
            return {
                dependencies: info ? Array.from(info.dependencies) : [],
                dependents: info ? Array.from(info.dependents) : [],
                hasCircularDependency: this.checkCircularDependency(cssVar)
            };
        }

        /**
         * 🔍 Check for circular dependencies
         */
        checkCircularDependency(cssVar, visited = new Set(), path = []) {
            if (visited.has(cssVar)) {
                return path.includes(cssVar);
            }

            visited.add(cssVar);
            path.push(cssVar);

            const info = this.dependencyGraph.get(cssVar);
            if (info && info.dependencies) {
                for (const dep of info.dependencies) {
                    if (this.checkCircularDependency(dep, visited, [...path])) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * 🧪 Test all CSS variables
         */
        async testAllVariables() {
            const results = {
                total: this.variableRegistry.size,
                passed: 0,
                failed: 0,
                errors: []
            };

            for (const [cssVar, config] of this.variableRegistry) {
                try {
                    const testValue = this.getTestValue(config.type);
                    const success = await this.setCSSProperty(cssVar, testValue, config);
                    
                    if (success) {
                        results.passed++;
                    } else {
                        results.failed++;
                        results.errors.push(`${cssVar}: Failed to apply test value`);
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push(`${cssVar}: ${error.message}`);
                }
            }

            this.log('🧪 CSS Variables test results:', results);
            return results;
        }

        /**
         * 🎯 Get test value for variable type
         */
        getTestValue(type) {
            switch (type) {
                case 'color': return '#ff0000';
                case 'dimension': return '42';
                case 'boolean': return true;
                case 'shadow': return '0 2px 4px rgba(0,0,0,0.1)';
                case 'transition': return '300ms ease';
                default: return 'test-value';
            }
        }

        /**
         * 🔧 Utility methods
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        dispatchEvent(eventName, detail) {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        }

        log(message, ...args) {
            if (this.config.debugMode) {
                console.log(`🎨 CSSEngine: ${message}`, ...args);
            }
        }

        logError(message, ...args) {
            console.error(`❌ CSSEngine: ${message}`, ...args);
        }
    }

    /**
     * 🧮 Computed Values Engine Class - NEW for Task 2.1
     */
    class ComputedValuesEngine {
        constructor(cssEngine) {
            this.cssEngine = cssEngine;
            this.computedCache = new Map();
            this.computationFunctions = this.initializeComputationFunctions();
        }

        initializeComputationFunctions() {
            return {
                'lighten': (color, amount) => this.lightenColor(color, amount),
                'darken': (color, amount) => this.darkenColor(color, amount),
                'saturate': (color, amount) => this.saturateColor(color, amount),
                'desaturate': (color, amount) => this.desaturateColor(color, amount),
                'mix': (color1, color2, ratio) => this.mixColors(color1, color2, ratio),
                'scale': (value, factor) => this.scaleValue(value, factor),
                'add': (value1, value2) => this.addValues(value1, value2),
                'subtract': (value1, value2) => this.subtractValues(value1, value2)
            };
        }

        async computeValue(cssVar, varConfig) {
            const cacheKey = `${cssVar}:${JSON.stringify(varConfig.computation)}`;
            
            // Check cache first
            if (this.computedCache.has(cacheKey)) {
                const cached = this.computedCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 5000) { // 5 second cache
                    return cached.value;
                }
            }

            try {
                const computedValue = await this.parseAndCompute(varConfig.computation, varConfig.dependencies);
                
                // Cache the result
                this.computedCache.set(cacheKey, {
                    value: computedValue,
                    timestamp: Date.now()
                });

                return computedValue;
            } catch (error) {
                this.cssEngine.logError(`Failed to compute value for ${cssVar}:`, error);
                return varConfig.fallback;
            }
        }

        async parseAndCompute(computation, dependencies) {
            // Replace var() references with actual values
            let processedComputation = computation;
            
            for (const dep of dependencies) {
                const depValue = await this.getDependencyValue(dep);
                const varPattern = new RegExp(`var\\(${dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
                processedComputation = processedComputation.replace(varPattern, depValue);
            }

            // Parse and execute computation
            return this.executeComputation(processedComputation);
        }

        async getDependencyValue(cssVar) {
            const computedStyle = getComputedStyle(document.documentElement);
            const value = computedStyle.getPropertyValue(cssVar).trim();
            
            if (value) {
                return value;
            }

            // Fallback to registry default
            const varConfig = this.cssEngine.variableRegistry.get(cssVar);
            return varConfig ? varConfig.default : '';
        }

        executeComputation(computation) {
            // Parse function calls like lighten(#color, 10%)
            const functionPattern = /(\w+)\(([^)]+)\)/g;
            let result = computation;
            let match;

            while ((match = functionPattern.exec(computation)) !== null) {
                const [fullMatch, funcName, args] = match;
                const argList = args.split(',').map(arg => arg.trim());
                
                if (this.computationFunctions[funcName]) {
                    const computedResult = this.computationFunctions[funcName](...argList);
                    result = result.replace(fullMatch, computedResult);
                }
            }

            return result;
        }

        // Color manipulation functions
        lightenColor(color, amount) {
            const hsl = this.hexToHsl(color);
            if (hsl) {
                hsl.l = Math.min(100, hsl.l + parseFloat(amount));
                return this.hslToHex(hsl);
            }
            return color;
        }

        darkenColor(color, amount) {
            const hsl = this.hexToHsl(color);
            if (hsl) {
                hsl.l = Math.max(0, hsl.l - parseFloat(amount));
                return this.hslToHex(hsl);
            }
            return color;
        }

        saturateColor(color, amount) {
            const hsl = this.hexToHsl(color);
            if (hsl) {
                hsl.s = Math.min(100, hsl.s + parseFloat(amount));
                return this.hslToHex(hsl);
            }
            return color;
        }

        desaturateColor(color, amount) {
            const hsl = this.hexToHsl(color);
            if (hsl) {
                hsl.s = Math.max(0, hsl.s - parseFloat(amount));
                return this.hslToHex(hsl);
            }
            return color;
        }

        mixColors(color1, color2, ratio) {
            // Simple color mixing implementation
            const rgb1 = this.hexToRgb(color1);
            const rgb2 = this.hexToRgb(color2);
            const mixRatio = parseFloat(ratio) / 100;

            if (rgb1 && rgb2) {
                const mixed = {
                    r: Math.round(rgb1.r * (1 - mixRatio) + rgb2.r * mixRatio),
                    g: Math.round(rgb1.g * (1 - mixRatio) + rgb2.g * mixRatio),
                    b: Math.round(rgb1.b * (1 - mixRatio) + rgb2.b * mixRatio)
                };
                return this.rgbToHex(mixed);
            }
            return color1;
        }

        scaleValue(value, factor) {
            const numValue = parseFloat(value);
            const scaleFactor = parseFloat(factor);
            return (numValue * scaleFactor).toString();
        }

        addValues(value1, value2) {
            const num1 = parseFloat(value1);
            const num2 = parseFloat(value2);
            return (num1 + num2).toString();
        }

        subtractValues(value1, value2) {
            const num1 = parseFloat(value1);
            const num2 = parseFloat(value2);
            return (num1 - num2).toString();
        }

        // Color conversion utilities
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        rgbToHex(rgb) {
            return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
        }

        hexToHsl(hex) {
            const rgb = this.hexToRgb(hex);
            if (!rgb) return null;

            const r = rgb.r / 255;
            const g = rgb.g / 255;
            const b = rgb.b / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return { h: h * 360, s: s * 100, l: l * 100 };
        }

        hslToHex(hsl) {
            const h = hsl.h / 360;
            const s = hsl.s / 100;
            const l = hsl.l / 100;

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
                r = g = b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return this.rgbToHex({
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            });
        }
    }

    /**
     * 🧮 Calc Expression Parser Class - NEW for Task 2.1
     */
    class CalcExpressionParser {
        constructor(cssEngine) {
            this.cssEngine = cssEngine;
            this.calcCache = new Map();
        }

        async parseCalcExpression(cssVar, varConfig) {
            const cacheKey = `${cssVar}:${varConfig.expression}`;
            
            // Check cache
            if (this.calcCache.has(cacheKey)) {
                const cached = this.calcCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 3000) { // 3 second cache
                    return cached.value;
                }
            }

            try {
                const resolvedExpression = await this.resolveVariables(varConfig.expression, varConfig.dependencies);
                const result = this.evaluateCalcExpression(resolvedExpression);
                
                // Cache result
                this.calcCache.set(cacheKey, {
                    value: result,
                    timestamp: Date.now()
                });

                return result;
            } catch (error) {
                this.cssEngine.logError(`Failed to parse calc expression for ${cssVar}:`, error);
                return varConfig.fallback;
            }
        }

        async resolveVariables(expression, dependencies) {
            let resolved = expression;
            
            for (const dep of dependencies) {
                const depValue = await this.getDependencyValue(dep);
                const varPattern = new RegExp(`var\\(${dep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
                resolved = resolved.replace(varPattern, depValue);
            }

            return resolved;
        }

        async getDependencyValue(cssVar) {
            const computedStyle = getComputedStyle(document.documentElement);
            let value = computedStyle.getPropertyValue(cssVar).trim();
            
            if (!value) {
                // Fallback to registry default
                const varConfig = this.cssEngine.variableRegistry.get(cssVar);
                if (varConfig) {
                    value = this.cssEngine.transformValue(varConfig.default, varConfig);
                }
            }

            // Extract numeric value for calculations
            const numericMatch = value.match(/^([\d.-]+)/);
            return numericMatch ? numericMatch[1] : value;
        }

        evaluateCalcExpression(expression) {
            // Remove calc() wrapper if present
            const cleanExpression = expression.replace(/^calc\(|\)$/g, '');
            
            try {
                // Simple expression evaluation (supports +, -, *, /)
                // This is a basic implementation - in production, you'd want a more robust parser
                const result = this.safeEval(cleanExpression);
                return `${result}px`; // Assume pixel units for now
            } catch (error) {
                throw new Error(`Invalid calc expression: ${cleanExpression}`);
            }
        }

        safeEval(expression) {
            // Basic safe evaluation for mathematical expressions
            // Only allows numbers, operators, and parentheses
            const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
            
            if (sanitized !== expression) {
                throw new Error('Invalid characters in expression');
            }

            // Use Function constructor for safe evaluation
            try {
                return new Function('return ' + sanitized)();
            } catch (error) {
                throw new Error('Expression evaluation failed');
            }
        }
    }

    /**
     * 🏗️ Cascade Resolver Class - NEW for Task 2.1
     */
    class CascadeResolver {
        constructor(cssEngine) {
            this.cssEngine = cssEngine;
            this.cascadeRules = new Map();
            this.conflictResolutionStrategies = {
                'specificity': this.resolveBySpecificity.bind(this),
                'importance': this.resolveByImportance.bind(this),
                'source-order': this.resolveBySourceOrder.bind(this),
                'user-preference': this.resolveByUserPreference.bind(this)
            };
        }

        registerCascadeRule(cssVar, rule) {
            if (!this.cascadeRules.has(cssVar)) {
                this.cascadeRules.set(cssVar, []);
            }
            this.cascadeRules.get(cssVar).push({
                ...rule,
                timestamp: Date.now(),
                id: this.generateRuleId()
            });
        }

        async resolveCascade(cssVar, newValue, options = {}) {
            const rules = this.cascadeRules.get(cssVar) || [];
            
            // Add new rule
            const newRule = {
                value: newValue,
                source: options.source || 'user',
                importance: options.important ? 'important' : 'normal',
                specificity: options.specificity || 0,
                timestamp: Date.now(),
                id: this.generateRuleId()
            };

            rules.push(newRule);
            this.cascadeRules.set(cssVar, rules);

            // Resolve conflicts
            const resolvedValue = await this.resolveConflicts(cssVar, rules);
            
            this.cssEngine.log(`🏗️ Cascade resolved for ${cssVar}: ${resolvedValue}`);
            return resolvedValue;
        }

        async resolveConflicts(cssVar, rules) {
            if (rules.length <= 1) {
                return rules[0]?.value || null;
            }

            // Apply cascade resolution strategies in order
            let candidates = [...rules];

            // 1. Filter by importance (!important wins)
            const importantRules = candidates.filter(rule => rule.importance === 'important');
            if (importantRules.length > 0) {
                candidates = importantRules;
            }

            // 2. Resolve by specificity
            if (candidates.length > 1) {
                candidates = this.resolveBySpecificity(candidates);
            }

            // 3. Resolve by source order (last wins)
            if (candidates.length > 1) {
                candidates = this.resolveBySourceOrder(candidates);
            }

            return candidates[0]?.value || null;
        }

        resolveBySpecificity(rules) {
            const maxSpecificity = Math.max(...rules.map(rule => rule.specificity));
            return rules.filter(rule => rule.specificity === maxSpecificity);
        }

        resolveByImportance(rules) {
            const importantRules = rules.filter(rule => rule.importance === 'important');
            return importantRules.length > 0 ? importantRules : rules;
        }

        resolveBySourceOrder(rules) {
            const latestTimestamp = Math.max(...rules.map(rule => rule.timestamp));
            return rules.filter(rule => rule.timestamp === latestTimestamp);
        }

        resolveByUserPreference(rules) {
            // Prioritize user-defined rules over system defaults
            const userRules = rules.filter(rule => rule.source === 'user');
            return userRules.length > 0 ? userRules : rules;
        }

        generateRuleId() {
            return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        getCascadeInfo(cssVar) {
            const rules = this.cascadeRules.get(cssVar) || [];
            return {
                totalRules: rules.length,
                activeRule: rules[rules.length - 1],
                allRules: rules,
                hasConflicts: rules.length > 1
            };
        }

        clearCascadeRules(cssVar) {
            if (cssVar) {
                this.cascadeRules.delete(cssVar);
            } else {
                this.cascadeRules.clear();
            }
        }
    }

    /**
     * 📊 Performance Monitor Class
     */
    class PerformanceMonitor {
        constructor() {
            this.updates = [];
            this.stats = {
                totalUpdates: 0,
                successfulUpdates: 0,
                failedUpdates: 0,
                averageDuration: 0,
                maxDuration: 0,
                minDuration: Infinity
            };
        }

        initialize() {
            this.startTime = performance.now();
        }

        recordUpdate(variable, duration, success) {
            this.updates.push({
                variable,
                duration,
                success,
                timestamp: performance.now()
            });

            this.updateStats(duration, success);
        }

        updateStats(duration, success) {
            this.stats.totalUpdates++;
            
            if (success) {
                this.stats.successfulUpdates++;
            } else {
                this.stats.failedUpdates++;
            }

            this.stats.maxDuration = Math.max(this.stats.maxDuration, duration);
            this.stats.minDuration = Math.min(this.stats.minDuration, duration);
            
            // Calculate average duration
            const totalDuration = this.updates.reduce((sum, update) => sum + update.duration, 0);
            this.stats.averageDuration = totalDuration / this.updates.length;
        }

        getStats() {
            return {
                ...this.stats,
                successRate: this.stats.totalUpdates > 0 ? 
                    (this.stats.successfulUpdates / this.stats.totalUpdates) * 100 : 0,
                recentUpdates: this.updates.slice(-10)
            };
        }
    }

    /**
     * ✅ CSS Variable Validator Class
     */
    class CSSVariableValidator {
        validate(value, varConfig) {
            try {
                switch (varConfig.type) {
                    case 'color':
                        return this.validateColor(value);
                    case 'dimension':
                        return this.validateDimension(value, varConfig);
                    case 'boolean':
                        return this.validateBoolean(value);
                    case 'computed':
                        return this.validateComputed(value, varConfig);
                    case 'calc':
                        return this.validateCalc(value, varConfig);
                    default:
                        return { isValid: true, sanitizedValue: value };
                }
            } catch (error) {
                return { isValid: false, error: error.message };
            }
        }

        validateColor(value) {
            const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            if (colorRegex.test(value)) {
                return { isValid: true, sanitizedValue: value };
            }
            
            // Try to parse other color formats
            const sanitized = this.sanitizeColor(value);
            if (sanitized) {
                return { isValid: true, sanitizedValue: sanitized };
            }
            
            throw new Error(`Invalid color format: ${value}`);
        }

        validateDimension(value, varConfig) {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                throw new Error(`Invalid numeric value: ${value}`);
            }

            if (varConfig.min !== undefined && numValue < varConfig.min) {
                throw new Error(`Value ${numValue} is below minimum ${varConfig.min}`);
            }

            if (varConfig.max !== undefined && numValue > varConfig.max) {
                throw new Error(`Value ${numValue} is above maximum ${varConfig.max}`);
            }

            return { isValid: true, sanitizedValue: numValue.toString() };
        }

        validateBoolean(value) {
            const boolValue = Boolean(value);
            return { isValid: true, sanitizedValue: boolValue };
        }

        validateComputed(value, varConfig) {
            // For computed values, we validate the computation string
            if (!varConfig.computation) {
                throw new Error('Computed variable missing computation definition');
            }
            
            if (!varConfig.dependencies || varConfig.dependencies.length === 0) {
                throw new Error('Computed variable missing dependencies');
            }
            
            return { isValid: true, sanitizedValue: value };
        }

        validateCalc(value, varConfig) {
            // For calc values, we validate the expression
            if (!varConfig.expression) {
                throw new Error('Calc variable missing expression definition');
            }
            
            // Basic validation of calc expression format
            if (!varConfig.expression.includes('calc(')) {
                throw new Error('Calc expression must contain calc() function');
            }
            
            return { isValid: true, sanitizedValue: value };
        }

        sanitizeColor(color) {
            // Create a temporary element to test color validity
            const tempElement = document.createElement('div');
            tempElement.style.color = color;
            
            if (tempElement.style.color) {
                return color;
            }
            
            return null;
        }
    }

    /**
     * 🌐 Browser Compatibility Manager Class
     */
    class BrowserCompatibilityManager {
        constructor() {
            this.support = {
                customProperties: false,
                cssVariables: false,
                modernCSS: false
            };
        }

        async initialize() {
            this.checkCustomPropertiesSupport();
            this.checkModernCSSSupport();
        }

        checkCustomPropertiesSupport() {
            try {
                // Test CSS Custom Properties support
                const testElement = document.createElement('div');
                testElement.style.setProperty('--test-var', 'test');
                const testValue = testElement.style.getPropertyValue('--test-var');
                
                this.support.customProperties = testValue === 'test';
                this.support.cssVariables = this.support.customProperties;
                
            } catch (error) {
                this.support.customProperties = false;
                this.support.cssVariables = false;
            }
        }

        checkModernCSSSupport() {
            // Check for modern CSS features
            this.support.modernCSS = 'CSS' in window && 'supports' in window.CSS;
        }

        supportsCustomProperties() {
            return this.support.customProperties;
        }

        getSupport() {
            return { ...this.support };
        }
    }

    // Export classes and initialize
    window.CSSVariablesEngine = CSSVariablesEngine;
    window.PerformanceMonitor = PerformanceMonitor;
    window.CSSVariableValidator = CSSVariableValidator;
    window.BrowserCompatibilityManager = BrowserCompatibilityManager;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                window.cssVariablesEngine = new CSSVariablesEngine({
                    debug: window.masV2Debug || false
                });
                await window.cssVariablesEngine.initialize();
            } catch (error) {
                console.error('Failed to initialize CSS Variables Engine:', error);
            }
        });
    } else {
        // DOM already loaded
        setTimeout(async () => {
            try {
                window.cssVariablesEngine = new CSSVariablesEngine({
                    debug: window.masV2Debug || false
                });
                await window.cssVariablesEngine.initialize();
            } catch (error) {
                console.error('Failed to initialize CSS Variables Engine:', error);
            }
        }, 0);
    }

})(window, document);