/**
 * CSS Variables Integration System
 * 
 * Connects the CSS Variables Restoration System with the existing WOOW Admin Styler system.
 * Provides backward compatibility, migration path, and unified initialization.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * @version 1.0.0
 * @author WOOW Admin Styler
 */

class CSSVariablesIntegrationSystem {
    constructor() {
        // Integration state tracking
        this.isIntegrated = false;
        this.integrationStartTime = null;
        this.legacySystemDetected = false;
        this.migrationRequired = false;
        
        // System references
        this.restorationSystem = null;
        this.legacySystem = null;
        this.liveEditEngine = null;
        
        // Configuration
        this.integrationTimeout = 5000; // 5 seconds
        this.retryInterval = 500; // 500ms
        this.maxRetries = 10;
        
        // State management
        this.integrationState = {
            phase: 'initializing', // initializing, detecting, migrating, integrating, complete, failed
            attempts: 0,
            errors: [],
            warnings: [],
            timings: {},
            systems: {
                restoration: false,
                legacy: false,
                liveEdit: false,
                cssVariableMap: false
            }
        };
        
        // Debug mode detection
        this.isDebugMode = this.detectDebugMode();
        this.logs = [];
        
        // Start integration process
        this.startIntegration();
    }

    /**
     * Start the integration process
     * Requirements: 5.1, 5.2
     */
    startIntegration() {
        this.integrationStartTime = performance.now();
        this.integrationState.timings.start = this.integrationStartTime;
        
        this.log('Starting CSS Variables Integration System');
        
        // Phase 1: Detect existing systems
        this.detectExistingSystems();
        
        // Phase 2: Initialize integration based on detected systems
        this.initializeIntegration();
    }

    /**
     * Detect existing CSS variable management systems
     * Requirements: 5.1, 5.3
     */
    detectExistingSystems() {
        this.log('Detecting existing CSS variable management systems');
        this.integrationState.phase = 'detecting';
        
        // Detect CSS Variables Restoration System
        if (window.CSSVariablesRestorer || window.cssVariablesRestorer) {
            this.integrationState.systems.restoration = true;
            this.restorationSystem = window.cssVariablesRestorer || window.CSSVariablesRestorer;
            this.log('CSS Variables Restoration System detected');
        }
        
        // Detect CSS Variable Map
        if (window.CSS_VARIABLE_MAP) {
            this.integrationState.systems.cssVariableMap = true;
            this.log('CSS Variable Map detected', { 
                variableCount: Object.keys(window.CSS_VARIABLE_MAP).length 
            });
        }
        
        // Detect Live Edit Engine
        if (window.liveEditEngine || window.LiveEditEngine) {
            this.integrationState.systems.liveEdit = true;
            this.liveEditEngine = window.liveEditEngine || window.LiveEditEngine;
            this.log('Live Edit Engine detected');
        }
        
        // Detect legacy CSS variable systems
        this.detectLegacySystems();
        
        // Log detection results
        this.log('System detection complete', {
            systems: this.integrationState.systems,
            legacyDetected: this.legacySystemDetected,
            migrationRequired: this.migrationRequired
        });
    }

    /**
     * Detect legacy CSS variable management systems
     * Requirements: 5.3, 5.4
     */
    detectLegacySystems() {
        this.log('Detecting legacy CSS variable systems');
        
        // Check for legacy theme manager
        if (window.themeManager || window.ThemeManager) {
            this.legacySystemDetected = true;
            this.legacySystem = window.themeManager || window.ThemeManager;
            this.log('Legacy Theme Manager detected');
        }
        
        // Check for legacy CSS variable applications in DOM
        const legacyVariables = this.detectLegacyCSSVariables();
        if (legacyVariables.length > 0) {
            this.legacySystemDetected = true;
            this.migrationRequired = true;
            this.log('Legacy CSS variables detected in DOM', { 
                count: legacyVariables.length,
                variables: legacyVariables.slice(0, 5) // Log first 5 for debugging
            });
        }
        
        // Check for legacy initialization patterns
        if (this.detectLegacyInitialization()) {
            this.legacySystemDetected = true;
            this.log('Legacy initialization patterns detected');
        }
    }

    /**
     * Detect legacy CSS variables in DOM
     * Requirements: 5.3, 5.4
     */
    detectLegacyCSSVariables() {
        const legacyVariables = [];
        const computedStyle = getComputedStyle(document.documentElement);
        
        // Check for old naming patterns
        const legacyPatterns = [
            /^--mas-/,
            /^--admin-styler-/,
            /^--woow-legacy-/,
            /^--old-/
        ];
        
        for (let i = 0; i < computedStyle.length; i++) {
            const property = computedStyle[i];
            
            if (property.startsWith('--')) {
                for (const pattern of legacyPatterns) {
                    if (pattern.test(property)) {
                        legacyVariables.push({
                            property,
                            value: computedStyle.getPropertyValue(property).trim()
                        });
                        break;
                    }
                }
            }
        }
        
        return legacyVariables;
    }

    /**
     * Detect legacy initialization patterns
     * Requirements: 5.3, 5.4
     */
    detectLegacyInitialization() {
        // Check for legacy event listeners
        const legacyEvents = [
            'masThemeChanged',
            'adminStylerReady',
            'legacyCSSVariablesLoaded'
        ];
        
        for (const eventName of legacyEvents) {
            if (this.hasEventListeners(eventName)) {
                return true;
            }
        }
        
        // Check for legacy global variables
        const legacyGlobals = [
            'masLegacySystem',
            'adminStylerLegacy',
            'oldCSSVariableSystem'
        ];
        
        for (const globalName of legacyGlobals) {
            if (window[globalName]) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if element has event listeners for a specific event
     * Requirements: 5.3, 5.4
     */
    hasEventListeners(eventName) {
        try {
            // This is a simplified check - in practice, detecting event listeners is complex
            // We'll check for common patterns instead
            return document.querySelector(`[data-event="${eventName}"]`) !== null ||
                   window[`on${eventName.toLowerCase()}`] !== undefined;
        } catch (error) {
            return false;
        }
    }

    /**
     * Initialize integration based on detected systems
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    async initializeIntegration() {
        this.log('Initializing integration based on detected systems');
        this.integrationState.phase = 'integrating';
        this.integrationState.timings.integrationStart = performance.now();
        
        try {
            // Step 1: Handle migration if required
            if (this.migrationRequired) {
                await this.performMigration();
            }
            
            // Step 2: Connect with restoration system
            await this.connectRestorationSystem();
            
            // Step 3: Integrate with live edit engine
            await this.integrateLiveEditEngine();
            
            // Step 4: Set up backward compatibility
            this.setupBackwardCompatibility();
            
            // Step 5: Initialize unified system
            await this.initializeUnifiedSystem();
            
            // Mark integration as complete
            this.markIntegrationComplete();
            
        } catch (error) {
            this.handleIntegrationError(error);
        }
    }

    /**
     * Perform migration from legacy systems
     * Requirements: 5.3, 5.4
     */
    async performMigration() {
        this.log('Performing migration from legacy systems');
        this.integrationState.phase = 'migrating';
        
        try {
            // Migrate legacy CSS variables to new naming convention
            const migrationMap = this.createMigrationMap();
            const migratedVariables = await this.migrateCSSVariables(migrationMap);
            
            // Update localStorage cache with migrated variables
            if (migratedVariables && Object.keys(migratedVariables).length > 0) {
                this.updateCacheWithMigratedVariables(migratedVariables);
                this.log('Migration completed', { 
                    migratedCount: Object.keys(migratedVariables).length 
                });
            }
            
            // Clean up legacy variables
            this.cleanupLegacyVariables();
            
        } catch (error) {
            this.warn('Migration failed, continuing with available systems', error);
            this.integrationState.warnings.push('Migration failed: ' + error.message);
        }
    }

    /**
     * Create migration mapping from legacy to new variable names
     * Requirements: 5.3, 5.4
     */
    createMigrationMap() {
        return {
            // Legacy admin bar variables
            '--mas-admin-bar-bg': '--woow-surface-bar',
            '--mas-admin-bar-text': '--woow-surface-bar-text',
            '--mas-admin-bar-hover': '--woow-surface-bar-hover',
            '--admin-styler-bar-height': '--woow-surface-bar-height',
            
            // Legacy menu variables
            '--mas-menu-bg': '--woow-surface-menu',
            '--mas-menu-text': '--woow-surface-menu-text',
            '--mas-menu-hover': '--woow-surface-menu-hover',
            '--admin-styler-menu-width': '--woow-surface-menu-width',
            
            // Legacy content variables
            '--mas-content-bg': '--woow-surface-content',
            '--mas-content-text': '--woow-text-primary',
            '--admin-styler-content-padding': '--woow-content-padding',
            
            // Legacy typography variables
            '--mas-font-base': '--woow-font-family-base',
            '--mas-font-size': '--woow-font-size-base',
            '--mas-line-height': '--woow-line-height-base',
            
            // Legacy color variables
            '--mas-primary': '--woow-accent-primary',
            '--mas-secondary': '--woow-accent-secondary',
            '--admin-styler-border': '--woow-border-color'
        };
    }

    /**
     * Migrate CSS variables using the migration map
     * Requirements: 5.3, 5.4
     */
    async migrateCSSVariables(migrationMap) {
        const migratedVariables = {};
        const computedStyle = getComputedStyle(document.documentElement);
        
        for (const [legacyVar, newVar] of Object.entries(migrationMap)) {
            const legacyValue = computedStyle.getPropertyValue(legacyVar).trim();
            
            if (legacyValue && legacyValue !== '') {
                migratedVariables[newVar] = legacyValue;
                this.log(`Migrated ${legacyVar} -> ${newVar}: ${legacyValue}`);
            }
        }
        
        return migratedVariables;
    }

    /**
     * Update cache with migrated variables
     * Requirements: 5.3, 5.4
     */
    updateCacheWithMigratedVariables(migratedVariables) {
        try {
            const storageKey = 'woow_css_variables';
            const existingCache = localStorage.getItem(storageKey);
            let cacheData = {};
            
            if (existingCache) {
                try {
                    cacheData = JSON.parse(existingCache);
                } catch (error) {
                    this.warn('Failed to parse existing cache, creating new cache');
                }
            }
            
            // Merge migrated variables with existing cache
            const updatedVariables = {
                ...(cacheData.variables || {}),
                ...migratedVariables
            };
            
            const newCacheData = {
                variables: updatedVariables,
                timestamp: Date.now(),
                version: '1.0',
                migrated: true,
                migrationTimestamp: Date.now()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(newCacheData));
            this.log('Updated cache with migrated variables', { 
                totalVariables: Object.keys(updatedVariables).length 
            });
            
        } catch (error) {
            this.warn('Failed to update cache with migrated variables', error);
        }
    }

    /**
     * Clean up legacy CSS variables
     * Requirements: 5.3, 5.4
     */
    cleanupLegacyVariables() {
        this.log('Cleaning up legacy CSS variables');
        
        const legacyPatterns = [
            /^--mas-/,
            /^--admin-styler-/,
            /^--woow-legacy-/,
            /^--old-/
        ];
        
        const documentStyle = document.documentElement.style;
        const propertiesToRemove = [];
        
        // Collect properties to remove
        for (let i = 0; i < documentStyle.length; i++) {
            const property = documentStyle[i];
            
            for (const pattern of legacyPatterns) {
                if (pattern.test(property)) {
                    propertiesToRemove.push(property);
                    break;
                }
            }
        }
        
        // Remove legacy properties
        propertiesToRemove.forEach(property => {
            documentStyle.removeProperty(property);
            this.log(`Removed legacy variable: ${property}`);
        });
        
        this.log(`Cleaned up ${propertiesToRemove.length} legacy variables`);
    }

    /**
     * Connect with the CSS Variables Restoration System
     * Requirements: 5.1, 5.2
     */
    async connectRestorationSystem() {
        this.log('Connecting with CSS Variables Restoration System');
        
        if (!this.integrationState.systems.restoration) {
            // Try to initialize restoration system if not detected
            if (window.CSSVariablesRestorer) {
                this.restorationSystem = new window.CSSVariablesRestorer();
                window.cssVariablesRestorer = this.restorationSystem;
                this.integrationState.systems.restoration = true;
                this.log('Initialized CSS Variables Restoration System');
            } else {
                throw new Error('CSS Variables Restoration System not available');
            }
        }
        
        // Ensure restoration system is initialized
        if (this.restorationSystem && !this.restorationSystem.isInitialized) {
            await this.restorationSystem.initialize();
            this.log('CSS Variables Restoration System initialized');
        }
        
        // Set up event listeners for restoration events
        this.setupRestorationEventListeners();
    }

    /**
     * Set up event listeners for restoration system events
     * Requirements: 5.1, 5.2
     */
    setupRestorationEventListeners() {
        // Listen for restoration completion
        document.addEventListener('woowCSSVariablesInitialized', (event) => {
            this.log('CSS Variables restoration completed', event.detail);
            this.handleRestorationComplete(event.detail);
        });
        
        // Listen for restoration errors
        document.addEventListener('woowCSSVariablesError', (event) => {
            this.warn('CSS Variables restoration error', event.detail);
            this.handleRestorationError(event.detail);
        });
    }

    /**
     * Handle restoration completion
     * Requirements: 5.1, 5.2
     */
    handleRestorationComplete(detail) {
        this.integrationState.timings.restorationComplete = performance.now();
        
        // Notify other systems that restoration is complete
        this.notifySystemsOfRestoration(detail);
        
        // Update integration state
        if (detail.state && detail.state.isComplete) {
            this.log('Restoration system integration successful');
        }
    }

    /**
     * Handle restoration errors
     * Requirements: 5.1, 5.2
     */
    handleRestorationError(detail) {
        this.integrationState.errors.push('Restoration error: ' + (detail.error || 'Unknown error'));
        this.warn('Handling restoration error', detail);
        
        // Implement fallback strategies
        this.implementRestorationFallback();
    }

    /**
     * Implement fallback strategies for restoration failures
     * Requirements: 5.1, 5.2
     */
    implementRestorationFallback() {
        this.log('Implementing restoration fallback strategies');
        
        try {
            // Apply default variables directly
            if (window.CSS_VARIABLE_MAP) {
                const defaultVariables = {};
                
                for (const [optionId, mapping] of Object.entries(window.CSS_VARIABLE_MAP)) {
                    if (mapping.cssVar && mapping.fallback) {
                        defaultVariables[mapping.cssVar] = mapping.fallback;
                    }
                }
                
                this.applyVariablesDirectly(defaultVariables, 'integration-fallback');
                this.log('Applied fallback variables from CSS_VARIABLE_MAP', { 
                    count: Object.keys(defaultVariables).length 
                });
            }
            
        } catch (error) {
            this.warn('Fallback strategy also failed', error);
        }
    }

    /**
     * Apply CSS variables directly to DOM
     * Requirements: 5.1, 5.2
     */
    applyVariablesDirectly(variables, source = 'direct') {
        const documentStyle = document.documentElement.style;
        let appliedCount = 0;
        
        for (const [cssVar, value] of Object.entries(variables)) {
            try {
                documentStyle.setProperty(cssVar, value);
                appliedCount++;
            } catch (error) {
                this.warn(`Failed to apply variable ${cssVar}: ${value}`, error);
            }
        }
        
        this.log(`Applied ${appliedCount} variables directly from ${source}`);
    }

    /**
     * Integrate with Live Edit Engine
     * Requirements: 5.1, 5.2
     */
    async integrateLiveEditEngine() {
        this.log('Integrating with Live Edit Engine');
        
        if (!this.integrationState.systems.liveEdit) {
            this.log('Live Edit Engine not detected, skipping integration');
            return;
        }
        
        try {
            // Set up coordination with Live Edit Engine
            if (this.liveEditEngine && typeof this.liveEditEngine.registerIntegrationSystem === 'function') {
                this.liveEditEngine.registerIntegrationSystem(this);
                this.log('Registered with Live Edit Engine');
            }
            
            // Set up live variable updates
            this.setupLiveVariableUpdates();
            
        } catch (error) {
            this.warn('Live Edit Engine integration failed', error);
            this.integrationState.warnings.push('Live Edit integration failed: ' + error.message);
        }
    }

    /**
     * Set up live variable updates for Live Edit Engine
     * Requirements: 5.1, 5.2
     */
    setupLiveVariableUpdates() {
        // Listen for live edit changes
        document.addEventListener('woowLiveEditChange', (event) => {
            this.handleLiveEditChange(event.detail);
        });
        
        // Listen for live edit save
        document.addEventListener('woowLiveEditSave', (event) => {
            this.handleLiveEditSave(event.detail);
        });
        
        this.log('Live variable updates configured');
    }

    /**
     * Handle live edit changes
     * Requirements: 5.1, 5.2
     */
    handleLiveEditChange(detail) {
        if (detail.type === 'css-variable' && detail.cssVar && detail.value) {
            // Apply the change immediately
            document.documentElement.style.setProperty(detail.cssVar, detail.value);
            
            // Update restoration system cache if available
            if (this.restorationSystem && typeof this.restorationSystem.updateVariable === 'function') {
                this.restorationSystem.updateVariable(detail.cssVar, detail.value);
            }
            
            this.log(`Live edit change applied: ${detail.cssVar} = ${detail.value}`);
        }
    }

    /**
     * Handle live edit save
     * Requirements: 5.1, 5.2
     */
    handleLiveEditSave(detail) {
        this.log('Live edit save detected, updating cache');
        
        // Trigger cache update in restoration system
        if (this.restorationSystem && typeof this.restorationSystem.refreshCache === 'function') {
            this.restorationSystem.refreshCache();
        }
    }

    /**
     * Set up backward compatibility for existing implementations
     * Requirements: 5.3, 5.4
     */
    setupBackwardCompatibility() {
        this.log('Setting up backward compatibility');
        
        // Maintain legacy global references
        this.maintainLegacyGlobals();
        
        // Set up legacy event compatibility
        this.setupLegacyEventCompatibility();
        
        // Provide legacy API compatibility
        this.provideLegacyAPICompatibility();
        
        this.log('Backward compatibility configured');
    }

    /**
     * Maintain legacy global references
     * Requirements: 5.3, 5.4
     */
    maintainLegacyGlobals() {
        // Maintain legacy theme manager reference
        if (this.legacySystem && !window.themeManager) {
            window.themeManager = this.legacySystem;
        }
        
        // Provide legacy CSS variable access
        if (!window.masLegacyCSS) {
            window.masLegacyCSS = {
                getVariable: (varName) => {
                    return getComputedStyle(document.documentElement).getPropertyValue(varName);
                },
                setVariable: (varName, value) => {
                    document.documentElement.style.setProperty(varName, value);
                },
                getAllVariables: () => {
                    if (this.restorationSystem && typeof this.restorationSystem.getAppliedVariables === 'function') {
                        return this.restorationSystem.getAppliedVariables();
                    }
                    return new Map();
                }
            };
        }
    }

    /**
     * Set up legacy event compatibility
     * Requirements: 5.3, 5.4
     */
    setupLegacyEventCompatibility() {
        // Map new events to legacy events
        const eventMappings = {
            'woowCSSVariablesInitialized': 'masThemeReady',
            'woowCSSVariablesError': 'masThemeError',
            'woowLiveEditChange': 'masLiveChange'
        };
        
        for (const [newEvent, legacyEvent] of Object.entries(eventMappings)) {
            document.addEventListener(newEvent, (event) => {
                // Dispatch legacy event for backward compatibility
                const legacyEventObj = new CustomEvent(legacyEvent, {
                    detail: event.detail
                });
                document.dispatchEvent(legacyEventObj);
            });
        }
    }

    /**
     * Provide legacy API compatibility
     * Requirements: 5.3, 5.4
     */
    provideLegacyAPICompatibility() {
        // Legacy initialization function
        if (!window.initializeMASTheme) {
            window.initializeMASTheme = () => {
                this.log('Legacy initialization called, delegating to integration system');
                return this.isIntegrated;
            };
        }
        
        // Legacy CSS variable getter
        if (!window.getMASVariable) {
            window.getMASVariable = (varName) => {
                // Convert legacy variable names to new names if needed
                const migrationMap = this.createMigrationMap();
                const newVarName = migrationMap[varName] || varName;
                
                return getComputedStyle(document.documentElement).getPropertyValue(newVarName);
            };
        }
        
        // Legacy CSS variable setter
        if (!window.setMASVariable) {
            window.setMASVariable = (varName, value) => {
                // Convert legacy variable names to new names if needed
                const migrationMap = this.createMigrationMap();
                const newVarName = migrationMap[varName] || varName;
                
                document.documentElement.style.setProperty(newVarName, value);
                
                // Update restoration system if available
                if (this.restorationSystem && typeof this.restorationSystem.updateVariable === 'function') {
                    this.restorationSystem.updateVariable(newVarName, value);
                }
            };
        }
    }

    /**
     * Initialize unified system
     * Requirements: 5.1, 5.2
     */
    async initializeUnifiedSystem() {
        this.log('Initializing unified CSS variable system');
        
        // Create unified interface
        this.createUnifiedInterface();
        
        // Set up system coordination
        this.setupSystemCoordination();
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
        
        this.log('Unified system initialized');
    }

    /**
     * Create unified interface for all CSS variable operations
     * Requirements: 5.1, 5.2
     */
    createUnifiedInterface() {
        window.woowCSSVariables = {
            // Get variable value
            get: (varName) => {
                return getComputedStyle(document.documentElement).getPropertyValue(varName);
            },
            
            // Set variable value
            set: (varName, value) => {
                document.documentElement.style.setProperty(varName, value);
                
                // Update restoration system
                if (this.restorationSystem && typeof this.restorationSystem.updateVariable === 'function') {
                    this.restorationSystem.updateVariable(varName, value);
                }
            },
            
            // Get all applied variables
            getAll: () => {
                if (this.restorationSystem && typeof this.restorationSystem.getAppliedVariables === 'function') {
                    return this.restorationSystem.getAppliedVariables();
                }
                return new Map();
            },
            
            // Get restoration state
            getState: () => {
                if (this.restorationSystem && typeof this.restorationSystem.getRestorationState === 'function') {
                    return this.restorationSystem.getRestorationState();
                }
                return null;
            },
            
            // Get integration state
            getIntegrationState: () => {
                return this.getIntegrationState();
            },
            
            // Refresh variables from database
            refresh: async () => {
                if (this.restorationSystem && typeof this.restorationSystem.initialize === 'function') {
                    await this.restorationSystem.initialize();
                }
            }
        };
        
        this.log('Unified interface created');
    }

    /**
     * Set up system coordination
     * Requirements: 5.1, 5.2
     */
    setupSystemCoordination() {
        // Coordinate between restoration system and live edit
        if (this.restorationSystem && this.liveEditEngine) {
            // Set up bidirectional communication
            this.setupBidirectionalCommunication();
        }
        
        // Set up cache synchronization
        this.setupCacheSynchronization();
        
        this.log('System coordination configured');
    }

    /**
     * Set up bidirectional communication between systems
     * Requirements: 5.1, 5.2
     */
    setupBidirectionalCommunication() {
        // Restoration -> Live Edit
        document.addEventListener('woowCSSVariablesInitialized', (event) => {
            if (this.liveEditEngine && typeof this.liveEditEngine.onRestorationComplete === 'function') {
                this.liveEditEngine.onRestorationComplete(event.detail);
            }
        });
        
        // Live Edit -> Restoration
        document.addEventListener('woowLiveEditSave', (event) => {
            if (this.restorationSystem && typeof this.restorationSystem.refreshCache === 'function') {
                this.restorationSystem.refreshCache();
            }
        });
        
        this.log('Bidirectional communication configured');
    }

    /**
     * Set up cache synchronization
     * Requirements: 5.1, 5.2
     */
    setupCacheSynchronization() {
        // Synchronize cache updates across systems
        const originalSetItem = localStorage.setItem.bind(localStorage);
        
        localStorage.setItem = (key, value) => {
            originalSetItem(key, value);
            
            // Notify systems of cache updates
            if (key === 'woow_css_variables') {
                this.notifySystemsOfCacheUpdate(key, value);
            }
        };
        
        this.log('Cache synchronization configured');
    }

    /**
     * Notify systems of cache updates
     * Requirements: 5.1, 5.2
     */
    notifySystemsOfCacheUpdate(key, value) {
        const event = new CustomEvent('woowCacheUpdated', {
            detail: { key, value }
        });
        document.dispatchEvent(event);
    }

    /**
     * Initialize performance monitoring
     * Requirements: 5.1, 5.2
     */
    initializePerformanceMonitoring() {
        // Monitor CSS variable application performance
        this.setupPerformanceObserver();
        
        // Set up periodic performance reports
        this.setupPerformanceReporting();
        
        this.log('Performance monitoring initialized');
    }

    /**
     * Set up performance observer
     * Requirements: 5.1, 5.2
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name.includes('css-variable')) {
                            this.log(`Performance: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['measure'] });
                this.performanceObserver = observer;
                
            } catch (error) {
                this.warn('Failed to set up performance observer', error);
            }
        }
    }

    /**
     * Set up performance reporting
     * Requirements: 5.1, 5.2
     */
    setupPerformanceReporting() {
        // Report performance metrics every 30 seconds in debug mode
        if (this.isDebugMode) {
            setInterval(() => {
                this.generatePerformanceReport();
            }, 30000);
        }
    }

    /**
     * Generate performance report
     * Requirements: 5.1, 5.2
     */
    generatePerformanceReport() {
        const report = {
            integrationTime: this.integrationState.timings.total || 0,
            systemsDetected: Object.values(this.integrationState.systems).filter(Boolean).length,
            errors: this.integrationState.errors.length,
            warnings: this.integrationState.warnings.length,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            } : null
        };
        
        this.log('Performance Report', report);
        return report;
    }

    /**
     * Notify systems of restoration completion
     * Requirements: 5.1, 5.2
     */
    notifySystemsOfRestoration(detail) {
        // Notify Live Edit Engine
        if (this.liveEditEngine && typeof this.liveEditEngine.onRestorationComplete === 'function') {
            this.liveEditEngine.onRestorationComplete(detail);
        }
        
        // Notify legacy systems
        if (this.legacySystem && typeof this.legacySystem.onRestorationComplete === 'function') {
            this.legacySystem.onRestorationComplete(detail);
        }
        
        // Dispatch global event
        const event = new CustomEvent('woowIntegrationRestorationComplete', {
            detail: { ...detail, integrationState: this.integrationState }
        });
        document.dispatchEvent(event);
    }

    /**
     * Mark integration as complete
     * Requirements: 5.1, 5.2
     */
    markIntegrationComplete() {
        this.isIntegrated = true;
        this.integrationState.phase = 'complete';
        this.integrationState.timings.complete = performance.now();
        this.integrationState.timings.total = this.integrationState.timings.complete - this.integrationStartTime;
        
        this.log('CSS Variables Integration System complete', {
            totalTime: this.integrationState.timings.total.toFixed(2) + 'ms',
            systems: this.integrationState.systems,
            errors: this.integrationState.errors.length,
            warnings: this.integrationState.warnings.length
        });
        
        // Generate integration report
        if (this.isDebugMode) {
            this.generateIntegrationReport();
        }
        
        // Dispatch completion event
        const event = new CustomEvent('woowIntegrationComplete', {
            detail: {
                state: this.integrationState,
                systems: this.integrationState.systems,
                timings: this.integrationState.timings
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Handle integration errors
     * Requirements: 5.1, 5.2
     */
    handleIntegrationError(error) {
        this.integrationState.phase = 'failed';
        this.integrationState.errors.push(error.message || error.toString());
        
        this.warn('Integration failed', error);
        
        // Attempt partial integration
        this.attemptPartialIntegration();
    }

    /**
     * Attempt partial integration when full integration fails
     * Requirements: 5.1, 5.2
     */
    attemptPartialIntegration() {
        this.log('Attempting partial integration');
        
        try {
            // At minimum, ensure CSS variables are applied
            if (window.CSS_VARIABLE_MAP) {
                const defaultVariables = {};
                
                for (const [optionId, mapping] of Object.entries(window.CSS_VARIABLE_MAP)) {
                    if (mapping.cssVar && mapping.fallback) {
                        defaultVariables[mapping.cssVar] = mapping.fallback;
                    }
                }
                
                this.applyVariablesDirectly(defaultVariables, 'partial-integration');
            }
            
            // Set up minimal unified interface
            this.createMinimalUnifiedInterface();
            
            this.integrationState.phase = 'partial';
            this.log('Partial integration successful');
            
        } catch (partialError) {
            this.warn('Partial integration also failed', partialError);
            this.integrationState.phase = 'failed';
        }
    }

    /**
     * Create minimal unified interface for partial integration
     * Requirements: 5.1, 5.2
     */
    createMinimalUnifiedInterface() {
        window.woowCSSVariables = {
            get: (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName),
            set: (varName, value) => document.documentElement.style.setProperty(varName, value),
            getIntegrationState: () => this.getIntegrationState()
        };
    }

    /**
     * Generate comprehensive integration report
     */
    generateIntegrationReport() {
        const report = {
            phase: this.integrationState.phase,
            totalTime: this.integrationState.timings.total?.toFixed(2) + 'ms',
            systems: this.integrationState.systems,
            legacyDetected: this.legacySystemDetected,
            migrationPerformed: this.migrationRequired,
            errors: this.integrationState.errors,
            warnings: this.integrationState.warnings,
            timings: this.integrationState.timings,
            logs: this.logs
        };
        
        console.group('🔗 CSS Variables Integration Report');
        console.table(this.logs);
        console.log('Integration Report:', report);
        console.groupEnd();
        
        return report;
    }

    /**
     * Get current integration state
     */
    getIntegrationState() {
        return { ...this.integrationState };
    }

    /**
     * Detect debug mode
     */
    detectDebugMode() {
        try {
            return (window.location && window.location.search.includes('woow_debug=1')) || 
                   (typeof localStorage !== 'undefined' && localStorage.getItem('woow_debug') === '1') ||
                   window.woowDebugMode === true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Debug logging
     */
    log(message, data = null) {
        const timestamp = this.integrationStartTime ? 
            (performance.now() - this.integrationStartTime).toFixed(2) + 'ms' : 
            '0ms';
            
        const logEntry = {
            timestamp,
            message,
            data,
            level: 'info'
        };
        
        this.logs.push(logEntry);
        
        if (this.isDebugMode) {
            console.log(`[WOOW Integration ${timestamp}] ${message}`, data || '');
        }
    }

    /**
     * Debug warning
     */
    warn(message, error = null) {
        const timestamp = this.integrationStartTime ? 
            (performance.now() - this.integrationStartTime).toFixed(2) + 'ms' : 
            '0ms';
            
        const logEntry = {
            timestamp,
            message,
            error: error?.message || error,
            level: 'warn'
        };
        
        this.logs.push(logEntry);
        this.integrationState.warnings.push(message);
        
        if (this.isDebugMode) {
            console.warn(`[WOOW Integration ${timestamp}] ${message}`, error || '');
        }
    }
}

// Auto-initialize the integration system
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cssVariablesIntegrationSystem = new CSSVariablesIntegrationSystem();
        });
    } else {
        // DOM is already ready
        window.cssVariablesIntegrationSystem = new CSSVariablesIntegrationSystem();
    }
    
    // Install debugging utilities
    window.woowIntegrationDebug = {
        getIntegrationState: () => {
            return window.cssVariablesIntegrationSystem?.getIntegrationState();
        },
        
        getIntegrationReport: () => {
            return window.cssVariablesIntegrationSystem?.generateIntegrationReport();
        },
        
        getPerformanceReport: () => {
            return window.cssVariablesIntegrationSystem?.generatePerformanceReport();
        },
        
        testMigration: () => {
            if (window.cssVariablesIntegrationSystem) {
                const migrationMap = window.cssVariablesIntegrationSystem.createMigrationMap();
                console.table(migrationMap);
                return migrationMap;
            }
        }
    };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesIntegrationSystem;
}