/**
 * WOOW Admin Styler Integration System
 * 
 * Integrates the CSS Variables Restoration System with the existing WOOW Admin Styler system.
 * Provides backward compatibility, migration path, and unified initialization.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * @version 1.0.0
 * @author WOOW Admin Styler
 */

class WOOWAdminIntegrationSystem {
    constructor() {
        // Integration state management
        this.integrationState = {
            phase: 'initializing', // initializing, detecting, migrating, integrating, complete, failed
            isComplete: false,
            attempts: 0,
            maxAttempts: 5,
            errors: [],
            warnings: [],
            timings: {}
        };
        
        // System detection flags
        this.systemsDetected = {
            restoration: false,
            legacy: false,
            cssVariableManager: false,
            themeManager: false,
            liveEdit: false
        };
        
        // Configuration
        this.migrationTimeout = 10000; // 10 seconds
        this.retryInterval = 1000; // 1 second
        this.isDebugMode = this.detectDebugMode();
        this.logs = [];
        
        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.handleIntegrationError = this.handleIntegrationError.bind(this);
        
        // Start integration process
        this.initialize();
    }

    /**
     * Main integration initialization
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    async initialize() {
        this.log('Starting WOOW Admin Styler integration system');
        this.integrationState.timings.start = performance.now();
        
        try {
            // Phase 1: Detect existing systems
            this.detectExistingSystems();
            
            // Phase 2: Initialize restoration system integration
            await this.initializeRestorationIntegration();
            
            // Phase 3: Set up backward compatibility
            this.setupBackwardCompatibility();
            
            // Phase 4: Create migration path
            this.createMigrationPath();
            
            // Phase 5: Establish unified interface
            this.establishUnifiedInterface();
            
            // Mark integration as complete
            this.markIntegrationComplete();
            
        } catch (error) {
            this.handleIntegrationError(error);
        }
    }

    /**
     * Detect existing WOOW Admin Styler systems
     * Requirements: 5.3, 5.4
     */
    detectExistingSystems() {
        this.log('Detecting existing WOOW Admin Styler systems');
        this.integrationState.phase = 'detecting';
        
        // Detect CSS Variables Restoration System
        if (window.CSSVariablesRestorer || window.cssVariablesRestorer) {
            this.systemsDetected.restoration = true;
            this.log('CSS Variables Restoration System detected');
        }
        
        // Detect legacy theme manager
        if (window.WOOW_ThemeManager || window.initGlobalThemeManager) {
            this.systemsDetected.themeManager = true;
            this.log('Legacy Theme Manager detected');
        }
        
        // Detect CSS Variable Manager (PHP integration)
        if (window.woowAdminStyler && window.woowAdminStyler.cssVariables) {
            this.systemsDetected.cssVariableManager = true;
            this.log('CSS Variable Manager integration detected');
        }
        
        // Detect live edit system
        if (window.MASLiveEdit || window.masLiveEdit || document.querySelector('[data-mas-live-edit]')) {
            this.systemsDetected.liveEdit = true;
            this.log('Live Edit system detected');
        }
        
        // Detect legacy initialization patterns
        if (this.detectLegacyInitialization()) {
            this.systemsDetected.legacy = true;
            this.log('Legacy initialization patterns detected');
        }
        
        this.log('System detection complete', this.systemsDetected);
    }

    /**
     * Detect legacy initialization patterns
     * Requirements: 5.3, 5.4
     */
    detectLegacyInitialization() {
        // Check for legacy event listeners
        const legacyEvents = [
            'masThemeReady',
            'masThemeError',
            'masLiveChange',
            'woowThemeLoaded'
        ];
        
        // Check for legacy global variables
        const legacyGlobals = [
            'MAS_V2_VERSION',
            'masV2Settings',
            'woowLegacyMode'
        ];
        
        // Check for legacy DOM elements
        const legacySelectors = [
            '[data-mas-theme]',
            '[data-woow-legacy]',
            '.mas-v2-legacy'
        ];
        
        return legacyEvents.some(event => this.hasEventListener(event)) ||
               legacyGlobals.some(global => window[global] !== undefined) ||
               legacySelectors.some(selector => document.querySelector(selector));
    }

    /**
     * Check if event listener exists (simplified detection)
     */
    hasEventListener(eventName) {
        // This is a simplified check - in practice, we'd need more sophisticated detection
        return document.addEventListener && 
               (window[`on${eventName}`] !== undefined || 
                document[`on${eventName}`] !== undefined);
    }

    /**
     * Initialize restoration system integration
     * Requirements: 5.1, 5.2
     */
    async initializeRestorationIntegration() {
        this.log('Initializing restoration system integration');
        this.integrationState.phase = 'integrating';
        
        // Ensure restoration system is available
        if (!this.systemsDetected.restoration) {
            // Try to initialize restoration system if not detected
            if (window.CSSVariablesRestorer) {
                window.cssVariablesRestorer = new window.CSSVariablesRestorer();
                this.systemsDetected.restoration = true;
                this.log('Initialized CSS Variables Restoration System');
            } else {
                throw new Error('CSS Variables Restoration System not available');
            }
        }
        
        // Ensure restoration system is initialized
        if (window.cssVariablesRestorer && !window.cssVariablesRestorer.isInitialized) {
            await window.cssVariablesRestorer.initialize();
            this.log('CSS Variables Restoration System initialized');
        }
        
        // Set up restoration event listeners
        this.setupRestorationEventListeners();
    }

    /**
     * Set up restoration system event listeners
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
        
        this.log('Restoration event listeners set up');
    }

    /**
     * Handle restoration completion
     * Requirements: 5.1, 5.2
     */
    handleRestorationComplete(detail) {
        this.log('Handling restoration completion');
        
        // Update legacy systems if they exist
        if (this.systemsDetected.themeManager && window.WOOW_ThemeManager) {
            this.updateLegacyThemeManager(detail);
        }
        
        // Update live edit system if it exists
        if (this.systemsDetected.liveEdit) {
            this.updateLiveEditSystem(detail);
        }
        
        // Dispatch legacy events for backward compatibility
        this.dispatchLegacyEvents('complete', detail);
    }

    /**
     * Handle restoration errors
     * Requirements: 5.1, 5.2
     */
    handleRestorationError(detail) {
        this.warn('Handling restoration error', detail);
        this.integrationState.errors.push(detail);
        
        // Dispatch legacy error events
        this.dispatchLegacyEvents('error', detail);
        
        // Attempt fallback to legacy systems
        this.attemptLegacyFallback();
    }

    /**
     * Set up backward compatibility for existing implementations
     * Requirements: 5.3, 5.4
     */
    setupBackwardCompatibility() {
        this.log('Setting up backward compatibility');
        
        // Provide legacy API compatibility
        this.provideLegacyAPICompatibility();
        
        // Map new events to legacy events
        this.setupLegacyEventMapping();
        
        // Maintain legacy global variables
        this.maintainLegacyGlobals();
        
        this.log('Backward compatibility set up');
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
                return this.integrationState.isComplete;
            };
        }
        
        // Legacy theme manager compatibility
        if (!window.WOOW_ThemeManager && this.systemsDetected.restoration) {
            window.WOOW_ThemeManager = {
                init: () => {
                    this.log('Legacy WOOW_ThemeManager.init() called');
                    return true;
                },
                applyTheme: (theme) => {
                    this.log('Legacy applyTheme called', theme);
                    return this.applyThemeViaRestoration(theme);
                },
                getCurrentTheme: () => {
                    return this.getCurrentThemeFromRestoration();
                }
            };
        }
        
        // Legacy CSS variable functions
        if (!window.applyCSSVariable) {
            window.applyCSSVariable = (cssVar, value) => {
                this.log('Legacy applyCSSVariable called', { cssVar, value });
                return this.applyCSSVariableViaRestoration(cssVar, value);
            };
        }
        
        this.log('Legacy API compatibility provided');
    }

    /**
     * Set up legacy event mapping
     * Requirements: 5.3, 5.4
     */
    setupLegacyEventMapping() {
        // Map new events to legacy events
        const eventMappings = {
            'woowCSSVariablesInitialized': 'masThemeReady',
            'woowCSSVariablesError': 'masThemeError',
            'woowLiveEditChange': 'masLiveChange'
        };
        
        Object.entries(eventMappings).forEach(([newEvent, legacyEvent]) => {
            document.addEventListener(newEvent, (event) => {
                // Dispatch legacy event for backward compatibility
                const legacyEventObj = new CustomEvent(legacyEvent, {
                    detail: event.detail
                });
                document.dispatchEvent(legacyEventObj);
                this.log(`Mapped ${newEvent} to ${legacyEvent}`);
            });
        });
        
        this.log('Legacy event mapping set up');
    }

    /**
     * Maintain legacy global variables
     * Requirements: 5.3, 5.4
     */
    maintainLegacyGlobals() {
        // Maintain legacy version info
        if (!window.MAS_V2_VERSION && window.woowAdminStyler) {
            window.MAS_V2_VERSION = window.woowAdminStyler.version || '3.0.0';
        }
        
        // Maintain legacy settings access
        if (!window.masV2Settings && window.woowAdminStyler) {
            window.masV2Settings = window.woowAdminStyler.settings || {};
        }
        
        this.log('Legacy global variables maintained');
    }

    /**
     * Create migration path from current system
     * Requirements: 5.4
     */
    createMigrationPath() {
        this.log('Creating migration path from current system');
        
        // Migrate legacy localStorage data
        this.migrateLegacyLocalStorage();
        
        // Migrate legacy CSS variables
        this.migrateLegacyCSSVariables();
        
        // Migrate legacy event listeners
        this.migrateLegacyEventListeners();
        
        // Clean up legacy artifacts (optional)
        this.cleanupLegacyArtifacts();
        
        this.log('Migration path created');
    }

    /**
     * Migrate legacy localStorage data
     * Requirements: 5.4
     */
    migrateLegacyLocalStorage() {
        try {
            const legacyKeys = [
                'mas_v2_theme',
                'woow_theme_settings',
                'mas_css_variables',
                'woow_legacy_settings'
            ];
            
            const migratedData = {};
            let migrationCount = 0;
            
            legacyKeys.forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        migratedData[key] = parsed;
                        migrationCount++;
                    } catch (error) {
                        this.warn(`Failed to parse legacy data for key: ${key}`, error);
                    }
                }
            });
            
            if (migrationCount > 0) {
                // Store migrated data in new format
                const newStorageKey = 'woow_css_variables_migrated';
                localStorage.setItem(newStorageKey, JSON.stringify({
                    migrated: migratedData,
                    migrationDate: new Date().toISOString(),
                    version: '1.0.0'
                }));
                
                this.log(`Migrated ${migrationCount} legacy localStorage items`);
            }
            
        } catch (error) {
            this.warn('Failed to migrate legacy localStorage data', error);
        }
    }

    /**
     * Migrate legacy CSS variables
     * Requirements: 5.4
     */
    migrateLegacyCSSVariables() {
        try {
            const legacyVariables = this.extractLegacyCSSVariables();
            
            if (Object.keys(legacyVariables).length > 0) {
                // Convert legacy variables to new format
                const convertedVariables = this.convertLegacyVariables(legacyVariables);
                
                // Apply converted variables via restoration system
                if (window.cssVariablesRestorer) {
                    window.cssVariablesRestorer.applyVariablesToDOM(convertedVariables, 'migration');
                    this.log(`Migrated ${Object.keys(convertedVariables).length} legacy CSS variables`);
                }
            }
            
        } catch (error) {
            this.warn('Failed to migrate legacy CSS variables', error);
        }
    }

    /**
     * Extract legacy CSS variables from DOM
     * Requirements: 5.4
     */
    extractLegacyCSSVariables() {
        const legacyVariables = {};
        const computedStyle = getComputedStyle(document.documentElement);
        
        // Look for legacy variable patterns
        const legacyPatterns = [
            /^--mas-/,
            /^--woow-legacy-/,
            /^--theme-/
        ];
        
        for (let i = 0; i < computedStyle.length; i++) {
            const property = computedStyle[i];
            
            if (legacyPatterns.some(pattern => pattern.test(property))) {
                const value = computedStyle.getPropertyValue(property);
                if (value && value.trim()) {
                    legacyVariables[property] = value.trim();
                }
            }
        }
        
        return legacyVariables;
    }

    /**
     * Convert legacy variables to new format
     * Requirements: 5.4
     */
    convertLegacyVariables(legacyVariables) {
        const converted = {};
        
        // Mapping from legacy to new variable names
        const variableMapping = {
            '--mas-admin-bar-bg': '--woow-surface-bar',
            '--mas-menu-bg': '--woow-surface-menu',
            '--mas-content-bg': '--woow-surface-content',
            '--theme-primary': '--woow-accent-primary',
            '--theme-secondary': '--woow-accent-secondary',
            '--woow-legacy-text': '--woow-text-primary'
        };
        
        Object.entries(legacyVariables).forEach(([legacyVar, value]) => {
            const newVar = variableMapping[legacyVar] || legacyVar.replace(/^--mas-/, '--woow-');
            converted[newVar] = value;
        });
        
        return converted;
    }

    /**
     * Migrate legacy event listeners
     * Requirements: 5.4
     */
    migrateLegacyEventListeners() {
        // This is a simplified migration - in practice, we'd need more sophisticated detection
        const legacyEvents = ['masThemeReady', 'masThemeError', 'masLiveChange'];
        
        legacyEvents.forEach(eventName => {
            // Check if there are existing listeners (simplified check)
            if (window[`on${eventName}`] || document[`on${eventName}`]) {
                this.log(`Legacy event listener detected for: ${eventName}`);
                // The event mapping we set up earlier will handle these
            }
        });
        
        this.log('Legacy event listeners migration completed');
    }

    /**
     * Clean up legacy artifacts (optional)
     * Requirements: 5.4
     */
    cleanupLegacyArtifacts() {
        // Only clean up if explicitly requested
        if (!this.shouldCleanupLegacy()) {
            return;
        }
        
        try {
            // Remove legacy CSS classes
            const legacyClasses = [
                'mas-v2-legacy',
                'woow-legacy-mode',
                'theme-legacy'
            ];
            
            legacyClasses.forEach(className => {
                const elements = document.querySelectorAll(`.${className}`);
                elements.forEach(element => {
                    element.classList.remove(className);
                });
            });
            
            // Remove legacy DOM attributes
            const legacyAttributes = [
                'data-mas-legacy',
                'data-woow-legacy',
                'data-theme-legacy'
            ];
            
            legacyAttributes.forEach(attr => {
                const elements = document.querySelectorAll(`[${attr}]`);
                elements.forEach(element => {
                    element.removeAttribute(attr);
                });
            });
            
            this.log('Legacy artifacts cleaned up');
            
        } catch (error) {
            this.warn('Failed to clean up legacy artifacts', error);
        }
    }

    /**
     * Check if legacy cleanup should be performed
     */
    shouldCleanupLegacy() {
        return window.woowAdminStyler?.cleanupLegacy === true ||
               localStorage.getItem('woow_cleanup_legacy') === '1' ||
               window.location.search.includes('woow_cleanup=1');
    }

    /**
     * Establish unified interface for all systems
     * Requirements: 5.1, 5.2
     */
    establishUnifiedInterface() {
        this.log('Establishing unified interface');
        
        // Create unified CSS variable interface
        window.woowCSSVariables = {
            // Apply variables
            apply: (variables, source = 'unified') => {
                if (window.cssVariablesRestorer) {
                    return window.cssVariablesRestorer.applyVariablesToDOM(variables, source);
                }
            },
            
            // Get current variables
            getCurrent: () => {
                if (window.cssVariablesRestorer) {
                    return window.cssVariablesRestorer.getAppliedVariables();
                }
                return new Map();
            },
            
            // Refresh variables from database
            refresh: async () => {
                if (window.cssVariablesRestorer && typeof window.cssVariablesRestorer.initialize === 'function') {
                    await window.cssVariablesRestorer.initialize();
                }
            },
            
            // Get restoration state
            getState: () => {
                if (window.cssVariablesRestorer) {
                    return window.cssVariablesRestorer.getRestorationState();
                }
                return null;
            }
        };
        
        // Create unified theme interface
        window.woowTheme = {
            // Apply theme
            apply: (theme) => {
                return this.applyThemeViaRestoration(theme);
            },
            
            // Get current theme
            getCurrent: () => {
                return this.getCurrentThemeFromRestoration();
            },
            
            // Switch theme
            switch: (themeName) => {
                return this.switchTheme(themeName);
            }
        };
        
        this.log('Unified interface established');
    }

    /**
     * Apply theme via restoration system
     * Requirements: 5.1, 5.2
     */
    applyThemeViaRestoration(theme) {
        if (!window.cssVariablesRestorer) {
            this.warn('Cannot apply theme: restoration system not available');
            return false;
        }
        
        try {
            // Convert theme to CSS variables
            const themeVariables = this.convertThemeToVariables(theme);
            
            // Apply via restoration system
            window.cssVariablesRestorer.applyVariablesToDOM(themeVariables, 'theme-application');
            
            this.log('Theme applied via restoration system', theme);
            return true;
            
        } catch (error) {
            this.warn('Failed to apply theme via restoration system', error);
            return false;
        }
    }

    /**
     * Get current theme from restoration system
     * Requirements: 5.1, 5.2
     */
    getCurrentThemeFromRestoration() {
        if (!window.cssVariablesRestorer) {
            return null;
        }
        
        try {
            const appliedVariables = window.cssVariablesRestorer.getAppliedVariables();
            return this.convertVariablesToTheme(appliedVariables);
        } catch (error) {
            this.warn('Failed to get current theme from restoration system', error);
            return null;
        }
    }

    /**
     * Convert theme object to CSS variables
     * Requirements: 5.1, 5.2
     */
    convertThemeToVariables(theme) {
        const variables = {};
        
        // Basic theme property mapping
        const themeMapping = {
            primaryColor: '--woow-accent-primary',
            secondaryColor: '--woow-accent-secondary',
            backgroundColor: '--woow-surface-content',
            textColor: '--woow-text-primary',
            menuColor: '--woow-surface-menu',
            barColor: '--woow-surface-bar'
        };
        
        Object.entries(theme).forEach(([key, value]) => {
            const cssVar = themeMapping[key] || `--woow-theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            variables[cssVar] = value;
        });
        
        return variables;
    }

    /**
     * Convert CSS variables to theme object
     * Requirements: 5.1, 5.2
     */
    convertVariablesToTheme(variablesMap) {
        const theme = {};
        
        // Reverse mapping from CSS variables to theme properties
        const reverseMapping = {
            '--woow-accent-primary': 'primaryColor',
            '--woow-accent-secondary': 'secondaryColor',
            '--woow-surface-content': 'backgroundColor',
            '--woow-text-primary': 'textColor',
            '--woow-surface-menu': 'menuColor',
            '--woow-surface-bar': 'barColor'
        };
        
        variablesMap.forEach((info, cssVar) => {
            const themeKey = reverseMapping[cssVar];
            if (themeKey) {
                theme[themeKey] = info.value;
            }
        });
        
        return theme;
    }

    /**
     * Switch theme
     * Requirements: 5.1, 5.2
     */
    switchTheme(themeName) {
        this.log('Switching theme', themeName);
        
        // Get predefined theme or load from server
        const theme = this.getPredefinedTheme(themeName) || this.loadThemeFromServer(themeName);
        
        if (theme) {
            return this.applyThemeViaRestoration(theme);
        } else {
            this.warn('Theme not found', themeName);
            return false;
        }
    }

    /**
     * Get predefined theme
     * Requirements: 5.1, 5.2
     */
    getPredefinedTheme(themeName) {
        const predefinedThemes = {
            light: {
                primaryColor: '#2271b1',
                secondaryColor: '#72aee6',
                backgroundColor: '#ffffff',
                textColor: '#1d2327',
                menuColor: '#ffffff',
                barColor: '#23282d'
            },
            dark: {
                primaryColor: '#72aee6',
                secondaryColor: '#2271b1',
                backgroundColor: '#1d2327',
                textColor: '#ffffff',
                menuColor: '#23282d',
                barColor: '#000000'
            }
        };
        
        return predefinedThemes[themeName];
    }

    /**
     * Load theme from server (placeholder)
     * Requirements: 5.1, 5.2
     */
    loadThemeFromServer(themeName) {
        // This would typically make an AJAX request to load theme data
        this.log('Loading theme from server (placeholder)', themeName);
        return null;
    }

    /**
     * Apply CSS variable via restoration system
     * Requirements: 5.1, 5.2
     */
    applyCSSVariableViaRestoration(cssVar, value) {
        if (!window.cssVariablesRestorer) {
            this.warn('Cannot apply CSS variable: restoration system not available');
            return false;
        }
        
        try {
            const variables = { [cssVar]: value };
            window.cssVariablesRestorer.applyVariablesToDOM(variables, 'legacy-api');
            this.log('CSS variable applied via restoration system', { cssVar, value });
            return true;
        } catch (error) {
            this.warn('Failed to apply CSS variable via restoration system', error);
            return false;
        }
    }

    /**
     * Update legacy theme manager
     * Requirements: 5.3, 5.4
     */
    updateLegacyThemeManager(detail) {
        if (window.WOOW_ThemeManager && typeof window.WOOW_ThemeManager.onRestorationComplete === 'function') {
            window.WOOW_ThemeManager.onRestorationComplete(detail);
            this.log('Updated legacy theme manager with restoration data');
        }
    }

    /**
     * Update live edit system
     * Requirements: 5.3, 5.4
     */
    updateLiveEditSystem(detail) {
        // Update various live edit systems that might exist
        const liveEditSystems = [
            window.MASLiveEdit,
            window.masLiveEdit,
            window.woowLiveEdit
        ];
        
        liveEditSystems.forEach(system => {
            if (system && typeof system.onRestorationComplete === 'function') {
                system.onRestorationComplete(detail);
                this.log('Updated live edit system with restoration data');
            }
        });
    }

    /**
     * Dispatch legacy events for backward compatibility
     * Requirements: 5.3, 5.4
     */
    dispatchLegacyEvents(type, detail) {
        const eventMappings = {
            complete: ['masThemeReady', 'woowThemeLoaded', 'themeInitialized'],
            error: ['masThemeError', 'woowThemeError', 'themeError']
        };
        
        const events = eventMappings[type] || [];
        
        events.forEach(eventName => {
            try {
                const event = new CustomEvent(eventName, { detail });
                document.dispatchEvent(event);
                this.log(`Dispatched legacy event: ${eventName}`);
            } catch (error) {
                this.warn(`Failed to dispatch legacy event: ${eventName}`, error);
            }
        });
    }

    /**
     * Attempt fallback to legacy systems
     * Requirements: 5.3, 5.4
     */
    attemptLegacyFallback() {
        this.log('Attempting fallback to legacy systems');
        
        try {
            // Try to initialize legacy theme manager
            if (window.initGlobalThemeManager && typeof window.initGlobalThemeManager === 'function') {
                window.initGlobalThemeManager();
                this.log('Initialized legacy theme manager as fallback');
            }
            
            // Try to apply cached theme from localStorage
            const cachedTheme = localStorage.getItem('woow-theme') || localStorage.getItem('mas_v2_theme');
            if (cachedTheme) {
                document.documentElement.setAttribute('data-theme', cachedTheme);
                this.log('Applied cached theme as fallback', cachedTheme);
            }
            
        } catch (error) {
            this.warn('Legacy fallback also failed', error);
        }
    }

    /**
     * Mark integration as complete
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    markIntegrationComplete() {
        this.integrationState.isComplete = true;
        this.integrationState.phase = 'complete';
        this.integrationState.timings.complete = performance.now();
        this.integrationState.timings.total = this.integrationState.timings.complete - this.integrationState.timings.start;
        
        this.log(`Integration system complete in ${this.integrationState.timings.total.toFixed(2)}ms`);
        
        // Dispatch integration complete event
        this.dispatchIntegrationCompleteEvent();
        
        // Generate report if in debug mode
        if (this.isDebugMode) {
            this.generateIntegrationReport();
        }
    }

    /**
     * Handle integration errors
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    handleIntegrationError(error) {
        this.integrationState.errors.push(error.message || error.toString());
        this.integrationState.attempts++;
        
        this.warn('Integration error occurred', error);
        
        if (this.integrationState.attempts < this.integrationState.maxAttempts) {
            this.warn(`Integration failed, scheduling retry (attempt ${this.integrationState.attempts}/${this.integrationState.maxAttempts})`);
            this.scheduleIntegrationRetry();
        } else {
            this.warn('Maximum integration attempts reached, marking as failed');
            this.integrationState.phase = 'failed';
            this.attemptLegacyFallback();
        }
    }

    /**
     * Schedule integration retry
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    scheduleIntegrationRetry() {
        const retryDelay = this.retryInterval * this.integrationState.attempts;
        
        setTimeout(() => {
            if (!this.integrationState.isComplete) {
                this.log(`Retrying integration (attempt ${this.integrationState.attempts + 1})`);
                this.initialize();
            }
        }, retryDelay);
    }

    /**
     * Dispatch integration complete event
     * Requirements: 5.1, 5.2, 5.3, 5.4
     */
    dispatchIntegrationCompleteEvent() {
        try {
            const event = new CustomEvent('woowIntegrationComplete', {
                detail: {
                    state: this.integrationState,
                    systemsDetected: this.systemsDetected,
                    timings: this.integrationState.timings
                }
            });
            
            document.dispatchEvent(event);
            this.log('Dispatched integration complete event');
            
        } catch (error) {
            this.warn('Failed to dispatch integration complete event', error);
        }
    }

    /**
     * Generate comprehensive integration report
     */
    generateIntegrationReport() {
        const report = {
            phase: this.integrationState.phase,
            isComplete: this.integrationState.isComplete,
            totalTime: this.integrationState.timings.total?.toFixed(2) + 'ms',
            attempts: this.integrationState.attempts,
            systemsDetected: this.systemsDetected,
            errors: this.integrationState.errors,
            warnings: this.integrationState.warnings,
            timings: this.integrationState.timings,
            logs: this.logs
        };
        
        console.group('🔗 WOOW Admin Integration Report');
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
        const timestamp = this.integrationState.timings.start ? 
            (performance.now() - this.integrationState.timings.start).toFixed(2) + 'ms' : 
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
        const timestamp = this.integrationState.timings.start ? 
            (performance.now() - this.integrationState.timings.start).toFixed(2) + 'ms' : 
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
            window.woowAdminIntegrationSystem = new WOOWAdminIntegrationSystem();
        });
    } else {
        // DOM is already ready
        window.woowAdminIntegrationSystem = new WOOWAdminIntegrationSystem();
    }
    
    // Install debugging utilities
    window.woowIntegrationDebug = {
        getIntegrationState: () => {
            return window.woowAdminIntegrationSystem?.getIntegrationState();
        },
        
        getIntegrationReport: () => {
            return window.woowAdminIntegrationSystem?.generateIntegrationReport();
        },
        
        retryIntegration: () => {
            if (window.woowAdminIntegrationSystem && !window.woowAdminIntegrationSystem.integrationState.isComplete) {
                window.woowAdminIntegrationSystem.initialize();
                console.log('Integration retry triggered');
            } else {
                console.log('Integration already complete or system not available');
            }
        }
    };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WOOWAdminIntegrationSystem;
}