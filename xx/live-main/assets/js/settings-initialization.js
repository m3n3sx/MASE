/**
 * Settings Initialization Controller
 * 
 * Coordinates settings restoration on page load with proper async/await handling
 * and initialization queue to prevent race conditions.
 * 
 * @version 1.0.0
 * @author WOOW! Admin Styler
 */

class SettingsInitializationController {
    constructor() {
        // Initialization state tracking
        this.initializationPromise = null;
        this.isInitialized = false;
        this.initializationStarted = false;
        this.isFallbackMode = false;
        this.recoveryInterval = null;
        
        // Queue for operations waiting for initialization
        this.initializationQueue = [];
        this.isProcessingQueue = false;
        
        // Dependencies
        this.persistenceManager = null;
        this.cssVariableManager = null;
        
        // Configuration
        this.config = {
            initializationTimeout: 10000, // 10 seconds
            retryAttempts: 3,
            retryDelay: 1000,
            debugMode: window.woowDebug || false
        };
        
        // Performance tracking
        this.performanceMetrics = {
            initStartTime: null,
            initEndTime: null,
            settingsLoadTime: null,
            cssApplicationTime: null,
            uiRestorationTime: null
        };
        
        // Error tracking
        this.initializationErrors = [];
        
        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.handleDOMReady = this.handleDOMReady.bind(this);
        this.handleWindowLoad = this.handleWindowLoad.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
        
        this.log('SettingsInitializationController constructed');
    }
    
    /**
     * Set up event listeners for initialization triggers
     * Enhanced to coordinate with other systems and prevent timing conflicts
     * Implements requirement 8.2: Coordinate DOM ready events between systems
     * Implements requirement 8.4: Prevent duplicate settings loading and application
     */
    setupEventListeners() {
        // Check if we should coordinate with integration system
        if (window.SettingsInitializationIntegration) {
            this.log('Coordinated initialization mode detected');
            this.isCoordinatedMode = true;
            
            // In coordinated mode, wait for integration system to trigger initialization
            window.addEventListener('woow-integration-ready', this.handleIntegrationReady.bind(this));
            window.addEventListener('woow-force-initialization', this.initialize);
            
            // Set up a fallback timer in case integration system fails
            this.setupFallbackInitialization();
        } else {
            // Standard initialization mode
            this.log('Standard initialization mode');
            this.isCoordinatedMode = false;
            
            // DOM ready event
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', this.handleDOMReady);
            } else {
                // DOM is already ready
                setTimeout(this.handleDOMReady, 0);
            }
            
            // Window load event as fallback
            if (document.readyState !== 'complete') {
                window.addEventListener('load', this.handleWindowLoad);
            }
            
            // Custom initialization event
            window.addEventListener('woow-force-initialization', this.initialize);
        }
        
        this.log('Event listeners set up', { coordinatedMode: this.isCoordinatedMode });
    }
    
    /**
     * Handle integration ready event
     * Implements requirement 8.2: Ensure SettingsInitializationController runs before LiveEditEngine
     * 
     * @param {CustomEvent} event - Integration ready event
     */
    handleIntegrationReady(event) {
        this.log('Integration system ready, starting coordinated initialization', event.detail);
        
        // Clear any fallback timers
        if (this.fallbackTimer) {
            clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
        }
        
        // Start initialization with coordination
        this.initialize();
    }
    
    /**
     * Set up fallback initialization in case integration system fails
     * Implements requirement 8.4: Prevent duplicate settings loading and application
     */
    setupFallbackInitialization() {
        // Set up a fallback timer (longer delay to allow integration system to work)
        this.fallbackTimer = setTimeout(() => {
            if (!this.isInitialized && !this.initializationStarted) {
                this.log('Integration system fallback triggered - starting standard initialization');
                this.isCoordinatedMode = false;
                
                // Switch to standard DOM ready handling
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', this.handleDOMReady);
                } else {
                    setTimeout(this.handleDOMReady, 0);
                }
            }
        }, 5000); // 5 second fallback delay
        
        this.log('Fallback initialization timer set up');
    }
    
    /**
     * Handle DOM ready event
     */
    handleDOMReady() {
        this.log('DOM ready detected, starting initialization');
        this.initialize();
    }
    
    /**
     * Handle window load event as fallback
     */
    handleWindowLoad() {
        if (!this.isInitialized && !this.initializationStarted) {
            this.log('Window load detected, starting fallback initialization');
            this.initialize();
        }
    }
    
    /**
     * Main initialization method with proper async/await handling
     * 
     * @returns {Promise<boolean>} Initialization success status
     */
    async initialize() {
        // Prevent multiple simultaneous initializations
        if (this.initializationPromise) {
            this.log('Initialization already in progress, returning existing promise');
            return this.initializationPromise;
        }
        
        if (this.isInitialized) {
            this.log('Already initialized, skipping');
            return true;
        }
        
        this.initializationStarted = true;
        this.performanceMetrics.initStartTime = performance.now();
        
        this.log('Starting settings initialization...');
        
        // Create initialization promise
        this.initializationPromise = this.performInitialization();
        
        try {
            const result = await this.initializationPromise;
            this.performanceMetrics.initEndTime = performance.now();
            
            if (result) {
                this.isInitialized = true;
                this.log('Settings initialization completed successfully', {
                    duration: this.performanceMetrics.initEndTime - this.performanceMetrics.initStartTime,
                    metrics: this.performanceMetrics
                });
                
                // Process queued operations
                await this.processInitializationQueue();
                
                // Dispatch initialization complete event
                window.dispatchEvent(new CustomEvent('woow-initialization-complete', {
                    detail: {
                        success: true,
                        metrics: this.performanceMetrics
                    }
                }));
            } else {
                this.log('Settings initialization failed');
                await this.handleInitializationFailure();
            }
            
            return result;
            
        } catch (error) {
            this.performanceMetrics.initEndTime = performance.now();
            this.initializationErrors.push({
                error: error,
                timestamp: Date.now(),
                phase: 'initialization'
            });
            
            this.log('Settings initialization error:', error);
            await this.handleInitializationFailure(error);
            return false;
        }
    }
    
    /**
     * Perform the actual initialization steps
     * 
     * @returns {Promise<boolean>} Success status
     */
    async performInitialization() {
        try {
            // Step 1: Initialize dependencies
            await this.initializeDependencies();
            
            // Step 2: Load initial settings
            const settings = await this.loadInitialSettings();
            
            if (!settings) {
                throw new Error('Failed to load initial settings');
            }
            
            // Step 3: Apply CSS variables
            await this.applyCSSVariables(settings);
            
            // Step 4: Restore UI state
            await this.restoreUIState(settings);
            
            // Step 5: Validate initialization
            const isValid = await this.validateInitialization(settings);
            
            if (!isValid) {
                throw new Error('Initialization validation failed');
            }
            
            return true;
            
        } catch (error) {
            this.log('Initialization step failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize required dependencies
     * 
     * @returns {Promise<void>}
     */
    async initializeDependencies() {
        this.log('Initializing dependencies...');
        
        // Initialize persistence manager if available
        if (window.SettingsPersistenceManager) {
            if (!this.persistenceManager) {
                this.persistenceManager = new window.SettingsPersistenceManager();
            }
        } else {
            this.log('SettingsPersistenceManager not available, will use fallback methods');
        }
        
        // Initialize CSS variable manager if available
        if (window.CSSVariableManager) {
            this.cssVariableManager = new window.CSSVariableManager();
        }
        
        // Wait for any async dependency initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        this.log('Dependencies initialized');
    }
    
    /**
     * Load initial settings from database with fallback to localStorage
     * Enhanced method with comprehensive error handling and retry logic
     * Implements requirement 8.1: Fetch settings from database as authoritative source
     * 
     * @param {boolean} forceRefresh - Force reload from database
     * @returns {Promise<Object>} Settings object
     */
    async loadInitialSettings(forceRefresh = false) {
        const startTime = performance.now();
        this.log('Loading initial settings from database...', { forceRefresh });
        
        try {
            let settings = null;
            let loadSource = 'unknown';
            
            // Prioritize database as authoritative source (requirement 8.3)
            const loadingStrategies = [
                {
                    name: 'direct-ajax-database',
                    method: () => this.loadSettingsFromDatabase(),
                    priority: 1,
                    isAuthoritative: true
                },
                {
                    name: 'persistence-manager',
                    method: () => this.loadViaPersistenceManager(forceRefresh),
                    priority: 2,
                    isAuthoritative: true
                },
                {
                    name: 'localStorage-backup',
                    method: () => this.loadSettingsFromLocalStorage(),
                    priority: 3,
                    isAuthoritative: false
                },
                {
                    name: 'defaults-fallback',
                    method: () => this.getDefaultSettings(),
                    priority: 4,
                    isAuthoritative: false
                }
            ];
            
            // Sort by priority to ensure database is tried first
            loadingStrategies.sort((a, b) => a.priority - b.priority);
            
            for (const strategy of loadingStrategies) {
                try {
                    this.log(`Trying loading strategy: ${strategy.name} (priority: ${strategy.priority})`);
                    settings = await strategy.method();
                    
                    if (settings && Object.keys(settings).length > 0) {
                        loadSource = strategy.name;
                        this.log(`Settings loaded successfully via ${strategy.name}`, {
                            settingsCount: Object.keys(settings).length,
                            isAuthoritative: strategy.isAuthoritative
                        });
                        
                        // Mark if loaded from authoritative source
                        settings._isAuthoritative = strategy.isAuthoritative;
                        break;
                    }
                } catch (strategyError) {
                    this.log(`Loading strategy ${strategy.name} failed:`, strategyError);
                    continue;
                }
            }
            
            // Validate loaded settings
            if (!settings || Object.keys(settings).length === 0) {
                throw new Error('All loading strategies failed - no settings available');
            }
            
            // Enhance settings with metadata
            settings._loadSource = loadSource;
            settings._loadTimestamp = Date.now();
            settings._loadDuration = performance.now() - startTime;
            
            this.performanceMetrics.settingsLoadTime = performance.now() - startTime;
            this.log('Settings loading completed', {
                source: loadSource,
                duration: this.performanceMetrics.settingsLoadTime,
                settingsCount: Object.keys(settings).length,
                isAuthoritative: settings._isAuthoritative
            });
            
            // Cache loaded settings for performance if from authoritative source
            if (this.persistenceManager && loadSource !== 'persistence-manager' && settings._isAuthoritative) {
                try {
                    await this.persistenceManager.batchSaveSettings(settings);
                    this.log('Authoritative settings cached in persistence manager');
                } catch (cacheError) {
                    this.log('Failed to cache settings:', cacheError);
                }
            }
            
            return settings;
            
        } catch (error) {
            this.log('Failed to load initial settings:', error);
            this.initializationErrors.push({
                error: error,
                timestamp: Date.now(),
                phase: 'loadInitialSettings'
            });
            
            // Final fallback to defaults
            const fallbackSettings = this.getDefaultSettings();
            fallbackSettings._loadSource = 'fallback-defaults';
            fallbackSettings._loadTimestamp = Date.now();
            fallbackSettings._loadError = error.message;
            fallbackSettings._isAuthoritative = false;
            
            this.performanceMetrics.settingsLoadTime = performance.now() - startTime;
            
            return fallbackSettings;
        }
    }
    
    /**
     * Load settings via persistence manager with caching
     * 
     * @param {boolean} forceRefresh - Force refresh from database
     * @returns {Promise<Object|null>} Settings object or null
     */
    async loadViaPersistenceManager(forceRefresh = false) {
        if (!this.persistenceManager) {
            return null;
        }
        
        try {
            const settings = await this.persistenceManager.loadSettings(forceRefresh);
            
            if (settings && typeof settings === 'object') {
                // Remove internal metadata keys
                const cleanSettings = {};
                Object.entries(settings).forEach(([key, value]) => {
                    if (!key.startsWith('_')) {
                        cleanSettings[key] = value;
                    }
                });
                
                return Object.keys(cleanSettings).length > 0 ? cleanSettings : null;
            }
            
            return null;
            
        } catch (error) {
            this.log('Persistence manager load failed:', error);
            return null;
        }
    }
    
    /**
     * Load settings directly from database via AJAX (primary method)
     * Implements requirement 8.1: Fetch settings from database as authoritative source
     * 
     * @returns {Promise<Object>} Settings object
     */
    async loadSettingsFromDatabase() {
        return new Promise((resolve, reject) => {
            const ajaxData = {
                action: 'mas_get_live_settings',
                nonce: window.woowAdminAjax?.nonce || window.masNonce || '',
                force_database: true // Force database query, not cache
            };
            
            jQuery.ajax({
                url: window.woowAdminAjax?.ajaxurl || window.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: ajaxData,
                timeout: 10000, // Longer timeout for database queries
                success: (response) => {
                    if (response && response.success && response.data) {
                        this.log('Settings loaded from database successfully', {
                            settingsCount: Object.keys(response.data).length
                        });
                        resolve(response.data);
                    } else if (response && response.settings) {
                        this.log('Settings loaded from database (legacy format)', {
                            settingsCount: Object.keys(response.settings).length
                        });
                        resolve(response.settings);
                    } else {
                        this.log('Database returned empty or invalid response');
                        resolve({});
                    }
                },
                error: (xhr, status, error) => {
                    this.log('Database settings load failed:', { xhr, status, error });
                    reject(new Error(`Database AJAX request failed: ${error}`));
                }
            });
        });
    }

    /**
     * Load settings via direct AJAX call (fallback method)
     * 
     * @returns {Promise<Object>} Settings object
     */
    async loadSettingsViaAjax() {
        return new Promise((resolve, reject) => {
            const ajaxData = {
                action: 'mas_get_live_settings',
                nonce: window.woowAdminAjax?.nonce || window.masNonce || ''
            };
            
            jQuery.ajax({
                url: window.woowAdminAjax?.ajaxurl || window.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: ajaxData,
                timeout: 8000,
                success: (response) => {
                    if (response && response.success && response.data) {
                        resolve(response.data);
                    } else if (response && response.settings) {
                        resolve(response.settings);
                    } else {
                        resolve({});
                    }
                },
                error: (xhr, status, error) => {
                    this.log('AJAX settings load failed:', { xhr, status, error });
                    reject(new Error(`AJAX request failed: ${error}`));
                }
            });
        });
    }
    
    /**
     * Load settings from localStorage
     * Implements requirement 7.1: Handle localStorage failures gracefully
     * 
     * @returns {Object|null} Settings object or null
     */
    loadSettingsFromLocalStorage() {
        try {
            const data = localStorage.getItem('woow_admin_settings') || 
                         localStorage.getItem('mas_live_edit_settings');
            
            if (data) {
                const settings = JSON.parse(data);
                // Remove metadata keys
                const cleanSettings = {};
                Object.entries(settings).forEach(([key, value]) => {
                    if (!key.startsWith('_')) {
                        cleanSettings[key] = value;
                    }
                });
                return cleanSettings;
            }
            
            return null;
            
        } catch (error) {
            this.log('Failed to load from localStorage:', error);
            
            // If localStorage fails, continue with database-only persistence (Requirement 7.1)
            this.log('Continuing with database-only persistence due to localStorage failure');
            return null;
        }
    }
    
    /**
     * Load settings from sessionStorage as fallback
     * 
     * @returns {Object|null} Settings object or null
     */
    loadSettingsFromSessionStorage() {
        try {
            const data = sessionStorage.getItem('woow_admin_settings') || 
                         sessionStorage.getItem('mas_live_edit_settings');
            
            if (data) {
                const settings = JSON.parse(data);
                // Remove metadata keys
                const cleanSettings = {};
                Object.entries(settings).forEach(([key, value]) => {
                    if (!key.startsWith('_')) {
                        cleanSettings[key] = value;
                    }
                });
                return cleanSettings;
            }
            
            return null;
            
        } catch (error) {
            this.log('Failed to load from sessionStorage:', error);
            return null;
        }
    }
    
    /**
     * Load settings from browser cache (if available)
     * 
     * @returns {Promise<Object|null>} Settings object or null
     */
    async loadSettingsFromBrowserCache() {
        try {
            // Try to use Cache API if available
            if ('caches' in window) {
                const cache = await caches.open('woow-admin-settings');
                const response = await cache.match('/woow-settings-cache');
                
                if (response) {
                    const settings = await response.json();
                    this.log('Settings loaded from browser cache');
                    return settings;
                }
            }
            
            return null;
            
        } catch (error) {
            this.log('Failed to load from browser cache:', error);
            return null;
        }
    }
    
    /**
     * Get default settings as final fallback
     * 
     * @returns {Object} Default settings object
     */
    getDefaultSettings() {
        return {
            admin_bar_background: '#23282d',
            admin_bar_text_color: '#ffffff',
            admin_bar_hover_color: '#00a0d2',
            admin_bar_height: 32,
            admin_bar_font_size: 13,
            menu_background: '#23282d',
            menu_text_color: '#ffffff',
            menu_hover_color: '#32373c',
            menu_width: 160,
            content_background: '#ffffff',
            content_padding: 20
        };
    }
    
    /**
     * Apply CSS variables for immediate visual effect
     * Implements requirement 8.1: Immediate CSS application on page load
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async applyCSSVariables(settings) {
        const startTime = performance.now();
        this.log('Applying CSS variables for immediate visual effect...', {
            settingsCount: Object.keys(settings).length
        });
        
        try {
            // Apply CSS variables immediately for instant visual feedback
            await this.applyCSSVariablesDirect(settings);
            
            // Also use CSS variable manager if available for additional processing
            if (this.cssVariableManager && this.cssVariableManager.applyCSSVariables) {
                try {
                    await this.cssVariableManager.applyCSSVariables(settings);
                    this.log('CSS variable manager also applied settings');
                } catch (managerError) {
                    this.log('CSS variable manager failed, but direct application succeeded:', managerError);
                }
            }
            
            // Validate that CSS variables were actually applied
            const validationResult = await this.validateCSSVariableApplication(settings);
            if (!validationResult.success) {
                this.log('CSS variable validation failed:', validationResult.errors);
                // Try fallback application
                await this.applyCSSVariablesFallback(settings);
            }
            
            this.performanceMetrics.cssApplicationTime = performance.now() - startTime;
            this.log('CSS variables applied successfully', {
                duration: this.performanceMetrics.cssApplicationTime,
                validationPassed: validationResult.success
            });
            
        } catch (error) {
            this.log('Failed to apply CSS variables:', error);
            
            // Try emergency fallback
            try {
                await this.applyCSSVariablesFallback(settings);
                this.log('Emergency CSS fallback applied');
            } catch (fallbackError) {
                this.log('Emergency CSS fallback also failed:', fallbackError);
            }
            
            // Continue with initialization even if CSS application fails
            this.performanceMetrics.cssApplicationTime = performance.now() - startTime;
        }
    }
    
    /**
     * Apply CSS variables directly to document root
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async applyCSSVariablesDirect(settings) {
        const cssVariableMapping = {
            'admin_bar_background': '--woow-surface-bar',
            'admin_bar_text_color': '--woow-surface-bar-text',
            'admin_bar_hover_color': '--woow-surface-bar-hover',
            'admin_bar_height': '--woow-surface-bar-height',
            'admin_bar_font_size': '--woow-surface-bar-font-size',
            'menu_background': '--woow-surface-menu',
            'menu_text_color': '--woow-surface-menu-text',
            'menu_hover_color': '--woow-surface-menu-hover',
            'menu_width': '--woow-surface-menu-width',
            'content_background': '--woow-surface-content',
            'content_padding': '--woow-space-content-padding'
        };
        
        const documentRoot = document.documentElement;
        let appliedCount = 0;
        
        Object.entries(settings).forEach(([key, value]) => {
            const cssVar = cssVariableMapping[key];
            if (cssVar && value !== null && value !== undefined) {
                // Add unit for numeric values that need it
                let cssValue = value;
                if (typeof value === 'number' && this.needsPixelUnit(key)) {
                    cssValue = `${value}px`;
                }
                
                documentRoot.style.setProperty(cssVar, cssValue);
                appliedCount++;
                
                this.log(`Applied CSS variable: ${cssVar} = ${cssValue}`);
            }
        });
        
        this.log(`Applied ${appliedCount} CSS variables directly`);
        
        // Force a reflow to ensure styles are applied
        documentRoot.offsetHeight;
    }
    
    /**
     * Check if a setting key needs pixel unit
     * 
     * @param {string} key - Setting key
     * @returns {boolean} Whether the key needs pixel unit
     */
    needsPixelUnit(key) {
        const pixelKeys = [
            'admin_bar_height',
            'admin_bar_font_size',
            'menu_width',
            'content_padding'
        ];
        return pixelKeys.includes(key);
    }

    /**
     * Validate that CSS variables were actually applied
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<Object>} Validation result with success status and errors
     */
    async validateCSSVariableApplication(settings) {
        const validationResult = {
            success: true,
            errors: [],
            appliedVariables: [],
            failedVariables: []
        };

        const cssVariableMapping = {
            'admin_bar_background': '--woow-surface-bar',
            'admin_bar_text_color': '--woow-surface-bar-text',
            'admin_bar_hover_color': '--woow-surface-bar-hover',
            'admin_bar_height': '--woow-surface-bar-height',
            'admin_bar_font_size': '--woow-surface-bar-font-size',
            'menu_background': '--woow-surface-menu',
            'menu_text_color': '--woow-surface-menu-text',
            'menu_hover_color': '--woow-surface-menu-hover',
            'menu_width': '--woow-surface-menu-width',
            'content_background': '--woow-surface-content',
            'content_padding': '--woow-space-content-padding'
        };

        const rootStyles = getComputedStyle(document.documentElement);

        Object.entries(settings).forEach(([settingKey, settingValue]) => {
            const cssVar = cssVariableMapping[settingKey];
            if (cssVar && settingValue !== null && settingValue !== undefined) {
                const appliedValue = rootStyles.getPropertyValue(cssVar).trim();
                
                if (appliedValue) {
                    validationResult.appliedVariables.push({
                        setting: settingKey,
                        cssVar: cssVar,
                        expectedValue: settingValue,
                        appliedValue: appliedValue
                    });
                } else {
                    validationResult.success = false;
                    validationResult.failedVariables.push({
                        setting: settingKey,
                        cssVar: cssVar,
                        expectedValue: settingValue
                    });
                    validationResult.errors.push(`CSS variable ${cssVar} not applied for setting ${settingKey}`);
                }
            }
        });

        this.log('CSS variable validation completed', {
            success: validationResult.success,
            appliedCount: validationResult.appliedVariables.length,
            failedCount: validationResult.failedVariables.length
        });

        return validationResult;
    }

    /**
     * Apply CSS variables using fallback method
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async applyCSSVariablesFallback(settings) {
        this.log('Applying CSS variables using fallback method...');

        try {
            // Create a style element for fallback CSS
            let fallbackStyleElement = document.getElementById('woow-fallback-styles');
            if (!fallbackStyleElement) {
                fallbackStyleElement = document.createElement('style');
                fallbackStyleElement.id = 'woow-fallback-styles';
                fallbackStyleElement.type = 'text/css';
                document.head.appendChild(fallbackStyleElement);
            }

            // Generate CSS rules directly
            const cssRules = [];
            const cssVariableMapping = {
                'admin_bar_background': '--woow-surface-bar',
                'admin_bar_text_color': '--woow-surface-bar-text',
                'admin_bar_hover_color': '--woow-surface-bar-hover',
                'admin_bar_height': '--woow-surface-bar-height',
                'admin_bar_font_size': '--woow-surface-bar-font-size',
                'menu_background': '--woow-surface-menu',
                'menu_text_color': '--woow-surface-menu-text',
                'menu_hover_color': '--woow-surface-menu-hover',
                'menu_width': '--woow-surface-menu-width',
                'content_background': '--woow-surface-content',
                'content_padding': '--woow-space-content-padding'
            };

            // Build CSS variables for :root
            const rootVariables = [];
            Object.entries(settings).forEach(([key, value]) => {
                const cssVar = cssVariableMapping[key];
                if (cssVar && value !== null && value !== undefined) {
                    let cssValue = value;
                    if (typeof value === 'number' && this.needsPixelUnit(key)) {
                        cssValue = `${value}px`;
                    }
                    rootVariables.push(`${cssVar}: ${cssValue}`);
                }
            });

            if (rootVariables.length > 0) {
                cssRules.push(`:root { ${rootVariables.join('; ')}; }`);
            }

            // Apply the CSS
            fallbackStyleElement.textContent = cssRules.join('\n');

            this.log('Fallback CSS variables applied via style element');

        } catch (error) {
            this.log('Fallback CSS application failed:', error);
            throw error;
        }
    }
    
    /**
     * Restore UI state to match saved settings
     * Implements requirement 8.3: Sync UI controls with saved settings from authoritative source
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async restoreUIState(settings) {
        const startTime = performance.now();
        this.log('Restoring UI state to match saved settings...', {
            settingsCount: Object.keys(settings).length,
            isAuthoritative: settings._isAuthoritative
        });
        
        try {
            // Step 1: Update form controls if they exist
            const formUpdateResult = await this.updateFormControls(settings);
            
            // Step 2: Update live edit interface if active
            const liveEditUpdateResult = await this.updateLiveEditInterface(settings);
            
            // Step 3: Update micro-panels and other UI components
            const componentUpdateResult = await this.updateUIComponents(settings);
            
            // Step 4: Trigger UI update events for other systems
            this.triggerUIUpdateEvents(settings);
            
            // Step 5: Validate UI state restoration
            const validationResult = await this.validateUIStateRestoration(settings);
            
            this.performanceMetrics.uiRestorationTime = performance.now() - startTime;
            this.log('UI state restored successfully', {
                duration: this.performanceMetrics.uiRestorationTime,
                formControls: formUpdateResult.updatedCount,
                liveEditComponents: liveEditUpdateResult.updatedCount,
                uiComponents: componentUpdateResult.updatedCount,
                validationPassed: validationResult.success
            });
            
        } catch (error) {
            this.log('Failed to restore UI state:', error);
            this.initializationErrors.push({
                error: error,
                timestamp: Date.now(),
                phase: 'restoreUIState'
            });
            // Continue with initialization even if UI restoration fails
        }
    }
    
    /**
     * Update form controls to match settings
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<Object>} Update result with count of updated controls
     */
    async updateFormControls(settings) {
        let updatedCount = 0;
        const updatedControls = [];

        Object.entries(settings).forEach(([key, value]) => {
            // Skip metadata keys
            if (key.startsWith('_')) {
                return;
            }

            // Update color inputs
            const colorInput = document.querySelector(`input[name="${key}"], input[data-setting="${key}"]`);
            if (colorInput && colorInput.type === 'color') {
                const oldValue = colorInput.value;
                colorInput.value = value;
                updatedCount++;
                updatedControls.push({
                    type: 'color',
                    key: key,
                    element: colorInput,
                    oldValue: oldValue,
                    newValue: value
                });
            }
            
            // Update range inputs
            const rangeInput = document.querySelector(`input[type="range"][name="${key}"], input[type="range"][data-setting="${key}"]`);
            if (rangeInput) {
                const oldValue = rangeInput.value;
                rangeInput.value = value;
                updatedCount++;
                updatedControls.push({
                    type: 'range',
                    key: key,
                    element: rangeInput,
                    oldValue: oldValue,
                    newValue: value
                });

                // Update associated display element
                const display = document.querySelector(`[data-display="${key}"]`);
                if (display) {
                    display.textContent = value;
                }
            }
            
            // Update select elements
            const selectElement = document.querySelector(`select[name="${key}"], select[data-setting="${key}"]`);
            if (selectElement) {
                const oldValue = selectElement.value;
                selectElement.value = value;
                updatedCount++;
                updatedControls.push({
                    type: 'select',
                    key: key,
                    element: selectElement,
                    oldValue: oldValue,
                    newValue: value
                });
            }
            
            // Update checkbox/toggle elements
            const checkboxElement = document.querySelector(`input[type="checkbox"][name="${key}"], input[type="checkbox"][data-setting="${key}"]`);
            if (checkboxElement) {
                const oldValue = checkboxElement.checked;
                checkboxElement.checked = Boolean(value);
                updatedCount++;
                updatedControls.push({
                    type: 'checkbox',
                    key: key,
                    element: checkboxElement,
                    oldValue: oldValue,
                    newValue: Boolean(value)
                });
            }

            // Update text inputs
            const textInput = document.querySelector(`input[type="text"][name="${key}"], input[type="text"][data-setting="${key}"]`);
            if (textInput) {
                const oldValue = textInput.value;
                textInput.value = value;
                updatedCount++;
                updatedControls.push({
                    type: 'text',
                    key: key,
                    element: textInput,
                    oldValue: oldValue,
                    newValue: value
                });
            }
        });
        
        this.log('Form controls updated', {
            updatedCount: updatedCount,
            controls: updatedControls.map(c => `${c.type}:${c.key}`)
        });

        return {
            updatedCount: updatedCount,
            updatedControls: updatedControls
        };
    }
    
    /**
     * Update live edit interface if active
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async updateLiveEditInterface(settings) {
        // Update LiveEditEngine cache if available
        if (window.liveEditInstance && window.liveEditInstance.settingsCache) {
            Object.entries(settings).forEach(([key, value]) => {
                window.liveEditInstance.settingsCache.set(key, value);
            });
            this.log('LiveEditEngine cache updated');
        }
        
        // Update SettingsRestorer if available
        if (window.settingsRestorer && window.settingsRestorer.applyAllSettingsToUI) {
            window.settingsRestorer.applyAllSettingsToUI(settings);
            this.log('SettingsRestorer updated');
        }
    }
    
    /**
     * Update micro-panels and other UI components
     * Implements requirement 8.3: Sync UI controls with saved settings
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<Object>} Update result with component update details
     */
    async updateUIComponents(settings) {
        const updateResult = {
            updatedComponents: [],
            failedComponents: [],
            totalUpdated: 0
        };
        
        try {
            // Update micro-panels if available
            if (window.microPanelFactory && window.microPanelFactory.updateAllPanels) {
                try {
                    await window.microPanelFactory.updateAllPanels(settings);
                    updateResult.updatedComponents.push('microPanelFactory');
                    this.log('Micro-panels updated with restored settings');
                } catch (error) {
                    updateResult.failedComponents.push({
                        component: 'microPanelFactory',
                        error: error.message
                    });
                    this.log('Failed to update micro-panels:', error);
                }
            }
            
            // Update color picker components
            const colorPickers = document.querySelectorAll('.woow-color-picker, .color-picker');
            colorPickers.forEach(picker => {
                const settingKey = picker.dataset.setting || picker.name;
                if (settingKey && settings[settingKey]) {
                    picker.value = settings[settingKey];
                    
                    // Trigger change event to update any connected components
                    picker.dispatchEvent(new Event('change', { bubbles: true }));
                    updateResult.totalUpdated++;
                }
            });
            
            if (colorPickers.length > 0) {
                updateResult.updatedComponents.push(`colorPickers(${colorPickers.length})`);
                this.log(`Updated ${colorPickers.length} color picker components`);
            }
            
            // Update range slider components
            const rangeSliders = document.querySelectorAll('.woow-range-slider, input[type="range"]');
            rangeSliders.forEach(slider => {
                const settingKey = slider.dataset.setting || slider.name;
                if (settingKey && settings[settingKey] !== undefined) {
                    slider.value = settings[settingKey];
                    
                    // Update associated display elements
                    const displayElement = document.querySelector(`[data-display="${settingKey}"]`);
                    if (displayElement) {
                        displayElement.textContent = settings[settingKey];
                    }
                    
                    // Trigger input event for real-time updates
                    slider.dispatchEvent(new Event('input', { bubbles: true }));
                    updateResult.totalUpdated++;
                }
            });
            
            if (rangeSliders.length > 0) {
                updateResult.updatedComponents.push(`rangeSliders(${rangeSliders.length})`);
                this.log(`Updated ${rangeSliders.length} range slider components`);
            }
            
            // Update toggle/switch components
            const toggles = document.querySelectorAll('.woow-toggle, .woow-switch, input[type="checkbox"][data-setting]');
            toggles.forEach(toggle => {
                const settingKey = toggle.dataset.setting || toggle.name;
                if (settingKey && settings[settingKey] !== undefined) {
                    toggle.checked = Boolean(settings[settingKey]);
                    
                    // Trigger change event
                    toggle.dispatchEvent(new Event('change', { bubbles: true }));
                    updateResult.totalUpdated++;
                }
            });
            
            if (toggles.length > 0) {
                updateResult.updatedComponents.push(`toggles(${toggles.length})`);
                this.log(`Updated ${toggles.length} toggle components`);
            }
            
            // Update custom WOOW components
            const woowComponents = document.querySelectorAll('[data-woow-component]');
            woowComponents.forEach(component => {
                const componentType = component.dataset.woowComponent;
                const settingKey = component.dataset.setting;
                
                if (settingKey && settings[settingKey] !== undefined) {
                    // Update component based on type
                    switch (componentType) {
                        case 'admin-bar-preview':
                            this.updateAdminBarPreview(component, settings);
                            break;
                        case 'menu-preview':
                            this.updateMenuPreview(component, settings);
                            break;
                        case 'content-preview':
                            this.updateContentPreview(component, settings);
                            break;
                        default:
                            // Generic update
                            if (component.tagName === 'INPUT') {
                                component.value = settings[settingKey];
                            } else {
                                component.textContent = settings[settingKey];
                            }
                    }
                    updateResult.totalUpdated++;
                }
            });
            
            if (woowComponents.length > 0) {
                updateResult.updatedComponents.push(`woowComponents(${woowComponents.length})`);
                this.log(`Updated ${woowComponents.length} WOOW components`);
            }
            
            // Update preset selector if available
            if (window.presetManager && window.presetManager.updatePresetSelector) {
                try {
                    window.presetManager.updatePresetSelector(settings);
                    updateResult.updatedComponents.push('presetManager');
                    this.log('Preset manager updated');
                } catch (error) {
                    updateResult.failedComponents.push({
                        component: 'presetManager',
                        error: error.message
                    });
                    this.log('Failed to update preset manager:', error);
                }
            }
            
            this.log('UI components update completed', {
                updatedComponents: updateResult.updatedComponents,
                totalUpdated: updateResult.totalUpdated,
                failedComponents: updateResult.failedComponents.length
            });
            
            return updateResult;
            
        } catch (error) {
            this.log('UI components update failed:', error);
            updateResult.failedComponents.push({
                component: 'general',
                error: error.message
            });
            return updateResult;
        }
    }
    
    /**
     * Update admin bar preview component
     * 
     * @param {HTMLElement} component - Preview component element
     * @param {Object} settings - Settings object
     */
    updateAdminBarPreview(component, settings) {
        const previewBar = component.querySelector('.admin-bar-preview') || component;
        
        if (settings.admin_bar_background) {
            previewBar.style.backgroundColor = settings.admin_bar_background;
        }
        if (settings.admin_bar_text_color) {
            previewBar.style.color = settings.admin_bar_text_color;
        }
        if (settings.admin_bar_height) {
            previewBar.style.height = `${settings.admin_bar_height}px`;
        }
        if (settings.admin_bar_font_size) {
            previewBar.style.fontSize = `${settings.admin_bar_font_size}px`;
        }
    }
    
    /**
     * Update menu preview component
     * 
     * @param {HTMLElement} component - Preview component element
     * @param {Object} settings - Settings object
     */
    updateMenuPreview(component, settings) {
        const previewMenu = component.querySelector('.menu-preview') || component;
        
        if (settings.menu_background) {
            previewMenu.style.backgroundColor = settings.menu_background;
        }
        if (settings.menu_text_color) {
            previewMenu.style.color = settings.menu_text_color;
        }
        if (settings.menu_width) {
            previewMenu.style.width = `${settings.menu_width}px`;
        }
    }
    
    /**
     * Update content preview component
     * 
     * @param {HTMLElement} component - Preview component element
     * @param {Object} settings - Settings object
     */
    updateContentPreview(component, settings) {
        const previewContent = component.querySelector('.content-preview') || component;
        
        if (settings.content_background) {
            previewContent.style.backgroundColor = settings.content_background;
        }
        if (settings.content_padding) {
            previewContent.style.padding = `${settings.content_padding}px`;
        }
    }
    
    /**
     * Validate that UI state restoration was successful
     * Implements requirement 8.3: Verify UI controls are synced with saved settings
     * 
     * @param {Object} settings - Settings object that was restored
     * @returns {Promise<Object>} Validation result with success status and details
     */
    async validateUIStateRestoration(settings) {
        const validationResult = {
            success: true,
            errors: [],
            validatedElements: [],
            failedElements: [],
            totalValidated: 0,
            totalFailed: 0
        };
        
        try {
            this.log('Validating UI state restoration...', {
                settingsCount: Object.keys(settings).length
            });
            
            // Validate form controls
            const formValidation = await this.validateFormControlsState(settings);
            validationResult.validatedElements.push(...formValidation.validatedElements);
            validationResult.failedElements.push(...formValidation.failedElements);
            validationResult.totalValidated += formValidation.totalValidated;
            validationResult.totalFailed += formValidation.totalFailed;
            
            // Validate CSS variables application
            const cssValidation = await this.validateCSSVariableApplication(settings);
            if (!cssValidation.success) {
                validationResult.success = false;
                validationResult.errors.push('CSS variables validation failed');
                validationResult.errors.push(...cssValidation.errors);
            }
            
            // Validate component states
            const componentValidation = await this.validateComponentStates(settings);
            validationResult.validatedElements.push(...componentValidation.validatedElements);
            validationResult.failedElements.push(...componentValidation.failedElements);
            validationResult.totalValidated += componentValidation.totalValidated;
            validationResult.totalFailed += componentValidation.totalFailed;
            
            // Validate live edit interface if active
            if (window.liveEditInstance) {
                const liveEditValidation = await this.validateLiveEditState(settings);
                if (!liveEditValidation.success) {
                    validationResult.errors.push('Live edit interface validation failed');
                    validationResult.errors.push(...liveEditValidation.errors);
                }
            }
            
            // Overall success determination
            if (validationResult.totalFailed > 0) {
                validationResult.success = false;
                validationResult.errors.push(`${validationResult.totalFailed} UI elements failed validation`);
            }
            
            // Log validation results
            this.log('UI state restoration validation completed', {
                success: validationResult.success,
                totalValidated: validationResult.totalValidated,
                totalFailed: validationResult.totalFailed,
                errorCount: validationResult.errors.length
            });
            
            return validationResult;
            
        } catch (error) {
            this.log('UI state validation error:', error);
            validationResult.success = false;
            validationResult.errors.push(`Validation error: ${error.message}`);
            return validationResult;
        }
    }
    
    /**
     * Validate form controls state
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<Object>} Validation result for form controls
     */
    async validateFormControlsState(settings) {
        const result = {
            validatedElements: [],
            failedElements: [],
            totalValidated: 0,
            totalFailed: 0
        };
        
        Object.entries(settings).forEach(([key, expectedValue]) => {
            // Skip metadata keys
            if (key.startsWith('_')) {
                return;
            }
            
            // Check color inputs
            const colorInput = document.querySelector(`input[type="color"][name="${key}"], input[type="color"][data-setting="${key}"]`);
            if (colorInput) {
                if (colorInput.value === expectedValue) {
                    result.validatedElements.push({
                        type: 'color',
                        key: key,
                        element: colorInput,
                        expectedValue: expectedValue,
                        actualValue: colorInput.value
                    });
                    result.totalValidated++;
                } else {
                    result.failedElements.push({
                        type: 'color',
                        key: key,
                        element: colorInput,
                        expectedValue: expectedValue,
                        actualValue: colorInput.value,
                        error: 'Value mismatch'
                    });
                    result.totalFailed++;
                }
            }
            
            // Check range inputs
            const rangeInput = document.querySelector(`input[type="range"][name="${key}"], input[type="range"][data-setting="${key}"]`);
            if (rangeInput) {
                const actualValue = parseFloat(rangeInput.value);
                const expected = parseFloat(expectedValue);
                
                if (actualValue === expected) {
                    result.validatedElements.push({
                        type: 'range',
                        key: key,
                        element: rangeInput,
                        expectedValue: expected,
                        actualValue: actualValue
                    });
                    result.totalValidated++;
                } else {
                    result.failedElements.push({
                        type: 'range',
                        key: key,
                        element: rangeInput,
                        expectedValue: expected,
                        actualValue: actualValue,
                        error: 'Value mismatch'
                    });
                    result.totalFailed++;
                }
            }
            
            // Check checkbox inputs
            const checkboxInput = document.querySelector(`input[type="checkbox"][name="${key}"], input[type="checkbox"][data-setting="${key}"]`);
            if (checkboxInput) {
                const expectedChecked = Boolean(expectedValue);
                
                if (checkboxInput.checked === expectedChecked) {
                    result.validatedElements.push({
                        type: 'checkbox',
                        key: key,
                        element: checkboxInput,
                        expectedValue: expectedChecked,
                        actualValue: checkboxInput.checked
                    });
                    result.totalValidated++;
                } else {
                    result.failedElements.push({
                        type: 'checkbox',
                        key: key,
                        element: checkboxInput,
                        expectedValue: expectedChecked,
                        actualValue: checkboxInput.checked,
                        error: 'Checked state mismatch'
                    });
                    result.totalFailed++;
                }
            }
        });
        
        return result;
    }
    
    /**
     * Validate component states
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<Object>} Validation result for components
     */
    async validateComponentStates(settings) {
        const result = {
            validatedElements: [],
            failedElements: [],
            totalValidated: 0,
            totalFailed: 0
        };
        
        // Validate WOOW components
        const woowComponents = document.querySelectorAll('[data-woow-component]');
        woowComponents.forEach(component => {
            const componentType = component.dataset.woowComponent;
            const settingKey = component.dataset.setting;
            
            if (settingKey && settings[settingKey] !== undefined) {
                const expectedValue = settings[settingKey];
                let actualValue;
                let isValid = false;
                
                try {
                    switch (componentType) {
                        case 'admin-bar-preview':
                            actualValue = this.getAdminBarPreviewState(component);
                            isValid = this.validateAdminBarPreviewState(actualValue, settings);
                            break;
                        case 'menu-preview':
                            actualValue = this.getMenuPreviewState(component);
                            isValid = this.validateMenuPreviewState(actualValue, settings);
                            break;
                        default:
                            if (component.tagName === 'INPUT') {
                                actualValue = component.value;
                                isValid = actualValue === expectedValue;
                            } else {
                                actualValue = component.textContent;
                                isValid = actualValue === expectedValue.toString();
                            }
                    }
                    
                    if (isValid) {
                        result.validatedElements.push({
                            type: 'woow-component',
                            componentType: componentType,
                            key: settingKey,
                            element: component,
                            expectedValue: expectedValue,
                            actualValue: actualValue
                        });
                        result.totalValidated++;
                    } else {
                        result.failedElements.push({
                            type: 'woow-component',
                            componentType: componentType,
                            key: settingKey,
                            element: component,
                            expectedValue: expectedValue,
                            actualValue: actualValue,
                            error: 'Component state mismatch'
                        });
                        result.totalFailed++;
                    }
                } catch (error) {
                    result.failedElements.push({
                        type: 'woow-component',
                        componentType: componentType,
                        key: settingKey,
                        element: component,
                        expectedValue: expectedValue,
                        actualValue: null,
                        error: `Validation error: ${error.message}`
                    });
                    result.totalFailed++;
                }
            }
        });
        
        return result;
    }
    
    /**
     * Get admin bar preview state
     * 
     * @param {HTMLElement} component - Preview component
     * @returns {Object} Current state
     */
    getAdminBarPreviewState(component) {
        const previewBar = component.querySelector('.admin-bar-preview') || component;
        const computedStyle = getComputedStyle(previewBar);
        
        return {
            backgroundColor: computedStyle.backgroundColor,
            color: computedStyle.color,
            height: computedStyle.height,
            fontSize: computedStyle.fontSize
        };
    }
    
    /**
     * Validate admin bar preview state
     * 
     * @param {Object} actualState - Current state
     * @param {Object} settings - Expected settings
     * @returns {boolean} Whether state is valid
     */
    validateAdminBarPreviewState(actualState, settings) {
        // This is a simplified validation - in practice you might need more sophisticated color comparison
        let isValid = true;
        
        if (settings.admin_bar_background && !this.colorsMatch(actualState.backgroundColor, settings.admin_bar_background)) {
            isValid = false;
        }
        
        if (settings.admin_bar_text_color && !this.colorsMatch(actualState.color, settings.admin_bar_text_color)) {
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Get menu preview state
     * 
     * @param {HTMLElement} component - Preview component
     * @returns {Object} Current state
     */
    getMenuPreviewState(component) {
        const previewMenu = component.querySelector('.menu-preview') || component;
        const computedStyle = getComputedStyle(previewMenu);
        
        return {
            backgroundColor: computedStyle.backgroundColor,
            color: computedStyle.color,
            width: computedStyle.width
        };
    }
    
    /**
     * Validate menu preview state
     * 
     * @param {Object} actualState - Current state
     * @param {Object} settings - Expected settings
     * @returns {boolean} Whether state is valid
     */
    validateMenuPreviewState(actualState, settings) {
        let isValid = true;
        
        if (settings.menu_background && !this.colorsMatch(actualState.backgroundColor, settings.menu_background)) {
            isValid = false;
        }
        
        if (settings.menu_text_color && !this.colorsMatch(actualState.color, settings.menu_text_color)) {
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Check if two colors match (simplified comparison)
     * 
     * @param {string} color1 - First color
     * @param {string} color2 - Second color
     * @returns {boolean} Whether colors match
     */
    colorsMatch(color1, color2) {
        // This is a simplified color comparison
        // In practice, you might want to convert to a standard format and compare
        if (!color1 || !color2) return false;
        
        // Normalize colors by removing spaces and converting to lowercase
        const normalized1 = color1.replace(/\s/g, '').toLowerCase();
        const normalized2 = color2.replace(/\s/g, '').toLowerCase();
        
        return normalized1 === normalized2;
    }
    
    /**
     * Validate live edit interface state
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<Object>} Validation result
     */
    async validateLiveEditState(settings) {
        const result = {
            success: true,
            errors: []
        };
        
        try {
            // Check if LiveEditEngine cache is updated
            if (window.liveEditInstance && window.liveEditInstance.settingsCache) {
                Object.entries(settings).forEach(([key, expectedValue]) => {
                    if (key.startsWith('_')) return; // Skip metadata
                    
                    const cachedValue = window.liveEditInstance.settingsCache.get(key);
                    if (cachedValue !== expectedValue) {
                        result.success = false;
                        result.errors.push(`LiveEditEngine cache mismatch for ${key}: expected ${expectedValue}, got ${cachedValue}`);
                    }
                });
            }
            
            // Check if SettingsRestorer is in sync
            if (window.settingsRestorer && window.settingsRestorer.getCurrentSettings) {
                const restorerSettings = window.settingsRestorer.getCurrentSettings();
                Object.entries(settings).forEach(([key, expectedValue]) => {
                    if (key.startsWith('_')) return; // Skip metadata
                    
                    if (restorerSettings[key] !== expectedValue) {
                        result.success = false;
                        result.errors.push(`SettingsRestorer mismatch for ${key}: expected ${expectedValue}, got ${restorerSettings[key]}`);
                    }
                });
            }
            
        } catch (error) {
            result.success = false;
            result.errors.push(`Live edit validation error: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Trigger UI update events for other components
     * 
     * @param {Object} settings - Settings object
     */
    triggerUIUpdateEvents(settings) {
        // Dispatch settings restored event
        window.dispatchEvent(new CustomEvent('woow-settings-restored', {
            detail: {
                settings: settings,
                source: 'initialization'
            }
        }));
        
        // Dispatch individual setting events
        Object.entries(settings).forEach(([key, value]) => {
            window.dispatchEvent(new CustomEvent('woow-setting-restored', {
                detail: {
                    key: key,
                    value: value,
                    source: 'initialization'
                }
            }));
        });
        
        this.log('UI update events triggered');
    }
    
    /**
     * Validate that initialization completed successfully
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<boolean>} Validation success status
     */
    async validateInitialization(settings) {
        this.log('Validating initialization...');
        
        try {
            // Check that settings were loaded
            if (!settings || Object.keys(settings).length === 0) {
                this.log('Validation failed: No settings loaded');
                return false;
            }
            
            // Check that CSS variables were applied
            const testVar = '--woow-surface-bar';
            const appliedValue = getComputedStyle(document.documentElement).getPropertyValue(testVar);
            if (!appliedValue) {
                this.log('Validation warning: CSS variables may not be applied');
                // Don't fail validation for this, as it might be expected in some cases
            }
            
            // Check that required DOM elements exist
            const requiredElements = ['#wpadminbar', '#adminmenuwrap'];
            const missingElements = requiredElements.filter(selector => !document.querySelector(selector));
            
            if (missingElements.length > 0) {
                this.log('Validation warning: Some required elements not found:', missingElements);
                // Don't fail validation as this might be expected on some admin pages
            }
            
            this.log('Initialization validation passed');
            return true;
            
        } catch (error) {
            this.log('Validation error:', error);
            return false;
        }
    }
    
    /**
     * Queue an operation to run after initialization completes
     * 
     * @param {Function} task - Task function to queue
     * @param {string} description - Task description for debugging
     * @returns {Promise} Promise that resolves when task completes
     */
    queueInitializationTask(task, description = 'Queued task') {
        return new Promise((resolve, reject) => {
            const queuedTask = {
                task: task,
                description: description,
                resolve: resolve,
                reject: reject,
                timestamp: Date.now()
            };
            
            this.initializationQueue.push(queuedTask);
            this.log(`Task queued: ${description}`);
            
            // If already initialized, process immediately
            if (this.isInitialized) {
                this.processInitializationQueue();
            }
        });
    }
    
    /**
     * Process all queued initialization tasks
     * 
     * @returns {Promise<void>}
     */
    async processInitializationQueue() {
        if (this.isProcessingQueue || this.initializationQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        this.log(`Processing ${this.initializationQueue.length} queued tasks...`);
        
        while (this.initializationQueue.length > 0) {
            const queuedTask = this.initializationQueue.shift();
            
            try {
                this.log(`Executing queued task: ${queuedTask.description}`);
                const result = await queuedTask.task();
                queuedTask.resolve(result);
            } catch (error) {
                this.log(`Queued task failed: ${queuedTask.description}`, error);
                queuedTask.reject(error);
            }
        }
        
        this.isProcessingQueue = false;
        this.log('All queued tasks processed');
    }
    
    /**
     * Handle initialization failure with recovery options
     * Enhanced with comprehensive error handling and user notifications
     * 
     * @param {Error} error - Initialization error
     * @returns {Promise<void>}
     */
    async handleInitializationFailure(error = null) {
        this.log('Handling initialization failure...', error);
        
        // Add error to tracking
        if (error) {
            this.initializationErrors.push({
                error: error,
                timestamp: Date.now(),
                phase: 'initialization-failure',
                stack: error.stack
            });
        }
        
        // Determine error type and appropriate recovery strategy
        const errorType = this.categorizeError(error);
        const recoveryStrategy = this.getRecoveryStrategy(errorType);
        
        this.log(`Error categorized as: ${errorType}, using recovery strategy: ${recoveryStrategy.name}`);
        
        // Show user notification about the issue
        this.showUserNotification(errorType, error);
        
        // Dispatch failure event with detailed information
        window.dispatchEvent(new CustomEvent('woow-initialization-failed', {
            detail: {
                error: error,
                errorType: errorType,
                errors: this.initializationErrors,
                metrics: this.performanceMetrics,
                recoveryStrategy: recoveryStrategy.name
            }
        }));
        
        // Execute recovery strategy
        try {
            await this.executeRecoveryStrategy(recoveryStrategy, error);
        } catch (recoveryError) {
            this.log('Recovery strategy failed, attempting enhanced fallback:', recoveryError);
            
            // Try enhanced fallback initialization as last resort
            try {
                await this.performEnhancedFallbackInitialization();
                this.log('Enhanced fallback initialization succeeded after recovery failure');
            } catch (enhancedFallbackError) {
                this.log('Enhanced fallback also failed:', enhancedFallbackError);
                await this.handleRecoveryFailure(recoveryError, errorType);
            }
        }
    }
    
    /**
     * Categorize error type for appropriate handling
     * 
     * @param {Error} error - The error to categorize
     * @returns {string} Error category
     */
    categorizeError(error) {
        if (!error) {
            return 'unknown';
        }
        
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('network') || errorMessage.includes('ajax') || errorMessage.includes('fetch')) {
            return 'network';
        }
        
        if (errorMessage.includes('timeout')) {
            return 'timeout';
        }
        
        if (errorMessage.includes('parse') || errorMessage.includes('json')) {
            return 'data-corruption';
        }
        
        if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
            return 'permission';
        }
        
        if (errorMessage.includes('localstorage') || errorMessage.includes('quota')) {
            return 'storage';
        }
        
        if (errorMessage.includes('css') || errorMessage.includes('style')) {
            return 'css-application';
        }
        
        if (errorMessage.includes('dom') || errorMessage.includes('element')) {
            return 'dom';
        }
        
        return 'general';
    }
    
    /**
     * Get recovery strategy based on error type
     * 
     * @param {string} errorType - Error category
     * @returns {Object} Recovery strategy object
     */
    getRecoveryStrategy(errorType) {
        const strategies = {
            network: {
                name: 'network-recovery',
                retryable: true,
                fallbackToLocalStorage: true,
                showOfflineMode: true,
                userMessage: 'Connection issue detected. Using offline mode.'
            },
            timeout: {
                name: 'timeout-recovery',
                retryable: true,
                fallbackToLocalStorage: true,
                increaseTimeout: true,
                userMessage: 'Loading is taking longer than expected. Retrying...'
            },
            'data-corruption': {
                name: 'data-recovery',
                retryable: false,
                clearCorruptedData: true,
                fallbackToDefaults: true,
                userMessage: 'Settings data appears corrupted. Restoring defaults.'
            },
            permission: {
                name: 'permission-recovery',
                retryable: false,
                fallbackToLocalStorage: true,
                showPermissionError: true,
                userMessage: 'Permission denied. Some features may be limited.'
            },
            storage: {
                name: 'storage-recovery',
                retryable: false,
                clearStorage: true,
                fallbackToDefaults: true,
                userMessage: 'Storage quota exceeded. Clearing old data.'
            },
            'css-application': {
                name: 'css-recovery',
                retryable: true,
                fallbackToBasicStyles: true,
                userMessage: 'Style application failed. Using basic styles.'
            },
            dom: {
                name: 'dom-recovery',
                retryable: true,
                waitForDOM: true,
                userMessage: 'Page not fully loaded. Waiting...'
            },
            general: {
                name: 'general-recovery',
                retryable: true,
                fallbackToLocalStorage: true,
                fallbackToDefaults: true,
                userMessage: 'Initialization failed. Attempting recovery...'
            }
        };
        
        return strategies[errorType] || strategies.general;
    }
    
    /**
     * Execute the appropriate recovery strategy
     * 
     * @param {Object} strategy - Recovery strategy object
     * @param {Error} originalError - The original error
     * @returns {Promise<void>}
     */
    async executeRecoveryStrategy(strategy, originalError) {
        this.log(`Executing recovery strategy: ${strategy.name}`);
        
        switch (strategy.name) {
            case 'network-recovery':
                await this.performNetworkRecovery(strategy);
                break;
                
            case 'timeout-recovery':
                await this.performTimeoutRecovery(strategy);
                break;
                
            case 'data-recovery':
                await this.performDataRecovery(strategy);
                break;
                
            case 'permission-recovery':
                await this.performPermissionRecovery(strategy);
                break;
                
            case 'storage-recovery':
                await this.performStorageRecovery(strategy);
                break;
                
            case 'css-recovery':
                await this.performCSSRecovery(strategy);
                break;
                
            case 'dom-recovery':
                await this.performDOMRecovery(strategy);
                break;
                
            case 'general-recovery':
            default:
                await this.performGeneralRecovery(strategy);
                break;
        }
    }
    
    /**
     * Perform network-specific recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performNetworkRecovery(strategy) {
        this.log('Performing network recovery...');
        
        // Enable offline mode
        if (strategy.showOfflineMode) {
            this.enableOfflineMode();
        }
        
        // Try localStorage fallback
        if (strategy.fallbackToLocalStorage) {
            const localSettings = this.loadSettingsFromLocalStorage();
            if (localSettings) {
                await this.applyCSSVariablesDirect(localSettings);
                await this.restoreUIState(localSettings);
                this.log('Network recovery: Applied settings from localStorage');
                return;
            }
        }
        
        // Final fallback to defaults
        await this.performFallbackInitialization();
    }
    
    /**
     * Perform timeout-specific recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performTimeoutRecovery(strategy) {
        this.log('Performing timeout recovery...');
        
        // Increase timeout for next attempt
        if (strategy.increaseTimeout) {
            this.config.initializationTimeout *= 2;
            this.log(`Increased timeout to ${this.config.initializationTimeout}ms`);
        }
        
        // Try with localStorage first
        if (strategy.fallbackToLocalStorage) {
            const localSettings = this.loadSettingsFromLocalStorage();
            if (localSettings) {
                await this.applyCSSVariablesDirect(localSettings);
                this.log('Timeout recovery: Applied settings from localStorage');
                
                // Queue a background retry for database sync
                setTimeout(() => {
                    this.retryDatabaseSync();
                }, 5000);
                
                return;
            }
        }
        
        // Fallback to defaults
        await this.performFallbackInitialization();
    }
    
    /**
     * Perform data corruption recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performDataRecovery(strategy) {
        this.log('Performing data corruption recovery...');
        
        // Clear corrupted data
        if (strategy.clearCorruptedData) {
            try {
                localStorage.removeItem('woow_admin_settings');
                localStorage.removeItem('mas_live_edit_settings');
                this.log('Cleared potentially corrupted localStorage data');
            } catch (error) {
                this.log('Failed to clear localStorage:', error);
            }
        }
        
        // Use defaults
        if (strategy.fallbackToDefaults) {
            const defaultSettings = this.getDefaultSettings();
            await this.applyCSSVariablesDirect(defaultSettings);
            await this.restoreUIState(defaultSettings);
            this.log('Data recovery: Applied default settings');
        }
    }
    
    /**
     * Perform permission-specific recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performPermissionRecovery(strategy) {
        this.log('Performing permission recovery...');
        
        // Show permission error to user
        if (strategy.showPermissionError) {
            this.showPermissionError();
        }
        
        // Try localStorage as fallback
        if (strategy.fallbackToLocalStorage) {
            const localSettings = this.loadSettingsFromLocalStorage();
            if (localSettings) {
                await this.applyCSSVariablesDirect(localSettings);
                this.log('Permission recovery: Applied settings from localStorage');
                return;
            }
        }
        
        // Use read-only mode with defaults
        await this.enableReadOnlyMode();
    }
    
    /**
     * Perform storage-specific recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performStorageRecovery(strategy) {
        this.log('Performing storage recovery...');
        
        // Clear storage to free up space
        if (strategy.clearStorage) {
            try {
                // Clear old data but keep essential items
                const essentialKeys = ['woow_admin_settings'];
                const allKeys = Object.keys(localStorage);
                
                allKeys.forEach(key => {
                    if (!essentialKeys.includes(key) && key.startsWith('woow_')) {
                        localStorage.removeItem(key);
                    }
                });
                
                this.log('Cleared non-essential localStorage data');
            } catch (error) {
                this.log('Failed to clear storage:', error);
            }
        }
        
        // Use defaults
        if (strategy.fallbackToDefaults) {
            const defaultSettings = this.getDefaultSettings();
            await this.applyCSSVariablesDirect(defaultSettings);
            this.log('Storage recovery: Applied default settings');
        }
    }
    
    /**
     * Perform CSS application recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performCSSRecovery(strategy) {
        this.log('Performing CSS recovery...');
        
        // Apply basic styles
        if (strategy.fallbackToBasicStyles) {
            const basicSettings = {
                admin_bar_background: '#23282d',
                admin_bar_text_color: '#ffffff',
                menu_background: '#23282d',
                menu_text_color: '#ffffff'
            };
            
            try {
                await this.applyCSSVariablesDirect(basicSettings);
                this.log('CSS recovery: Applied basic styles');
            } catch (error) {
                this.log('CSS recovery failed:', error);
                // Continue without CSS - functionality is more important
            }
        }
    }
    
    /**
     * Perform DOM-specific recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performDOMRecovery(strategy) {
        this.log('Performing DOM recovery...');
        
        // Wait for DOM to be ready
        if (strategy.waitForDOM) {
            await this.waitForDOMReady();
        }
        
        // Retry initialization
        try {
            await this.performFallbackInitialization();
        } catch (error) {
            this.log('DOM recovery failed:', error);
        }
    }
    
    /**
     * Perform general recovery
     * 
     * @param {Object} strategy - Recovery strategy
     * @returns {Promise<void>}
     */
    async performGeneralRecovery(strategy) {
        this.log('Performing general recovery...');
        
        // Try localStorage first
        if (strategy.fallbackToLocalStorage) {
            const localSettings = this.loadSettingsFromLocalStorage();
            if (localSettings) {
                await this.applyCSSVariablesDirect(localSettings);
                await this.restoreUIState(localSettings);
                this.log('General recovery: Applied settings from localStorage');
                return;
            }
        }
        
        // Fallback to defaults
        if (strategy.fallbackToDefaults) {
            await this.performFallbackInitialization();
        }
    }
    
    /**
     * Handle recovery failure (last resort)
     * 
     * @param {Error} recoveryError - Recovery error
     * @param {string} originalErrorType - Original error type
     * @returns {Promise<void>}
     */
    async handleRecoveryFailure(recoveryError, originalErrorType) {
        this.log('Recovery failed, using last resort measures...', recoveryError);
        
        // Add recovery error to tracking
        this.initializationErrors.push({
            error: recoveryError,
            timestamp: Date.now(),
            phase: 'recovery-failure',
            originalErrorType: originalErrorType
        });
        
        // Show critical error to user
        this.showCriticalError(recoveryError, originalErrorType);
        
        // Try absolute minimal initialization
        try {
            // Just apply basic CSS variables without any complex logic
            const minimalSettings = {
                admin_bar_background: '#23282d',
                menu_background: '#23282d'
            };
            
            document.documentElement.style.setProperty('--woow-surface-bar', minimalSettings.admin_bar_background);
            document.documentElement.style.setProperty('--woow-surface-menu', minimalSettings.menu_background);
            
            this.log('Applied minimal CSS variables as last resort');
            
            // Mark as partially initialized
            this.isInitialized = true;
            
            // Dispatch critical failure event
            window.dispatchEvent(new CustomEvent('woow-initialization-critical-failure', {
                detail: {
                    originalError: originalErrorType,
                    recoveryError: recoveryError,
                    errors: this.initializationErrors,
                    minimalMode: true
                }
            }));
            
        } catch (lastResortError) {
            this.log('Last resort initialization also failed:', lastResortError);
            
            // Complete failure - dispatch final event
            window.dispatchEvent(new CustomEvent('woow-initialization-complete-failure', {
                detail: {
                    errors: this.initializationErrors,
                    totalFailure: true
                }
            }));
        }
    }
    
    /**
     * Show user notification about initialization issues
     * 
     * @param {string} errorType - Error type
     * @param {Error} error - The error object
     */
    showUserNotification(errorType, error) {
        const strategy = this.getRecoveryStrategy(errorType);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'woow-initialization-notification';
        notification.innerHTML = `
            <div class="woow-notification-content">
                <div class="woow-notification-icon">⚠️</div>
                <div class="woow-notification-message">
                    <strong>WOOW! Admin Styler</strong><br>
                    ${strategy.userMessage}
                </div>
                <button class="woow-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            background: #fff;
            border-left: 4px solid #ffb900;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 999999;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
        
        this.log(`User notification shown for error type: ${errorType}`);
    }
    
    /**
     * Show permission error to user
     */
    showPermissionError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'woow-permission-error';
        errorDiv.innerHTML = `
            <div style="background: #dc3232; color: white; padding: 10px; margin: 10px 0; border-radius: 3px;">
                <strong>WOOW! Admin Styler - Permission Error</strong><br>
                You don't have sufficient permissions to save settings. Contact your administrator.
            </div>
        `;
        
        // Insert at top of admin content
        const adminContent = document.querySelector('#wpbody-content') || document.body;
        adminContent.insertBefore(errorDiv, adminContent.firstChild);
    }
    
    /**
     * Show critical error to user
     * 
     * @param {Error} error - The error
     * @param {string} errorType - Error type
     */
    showCriticalError(error, errorType) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'woow-critical-error';
        errorDiv.innerHTML = `
            <div style="background: #dc3232; color: white; padding: 15px; margin: 10px 0; border-radius: 3px;">
                <strong>WOOW! Admin Styler - Critical Error</strong><br>
                Initialization failed completely. Please refresh the page or contact support.<br>
                <small>Error: ${errorType} - ${error.message}</small><br>
                <button onclick="location.reload()" style="background: white; color: #dc3232; border: none; padding: 5px 10px; margin-top: 10px; border-radius: 3px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
        
        // Insert at top of admin content
        const adminContent = document.querySelector('#wpbody-content') || document.body;
        adminContent.insertBefore(errorDiv, adminContent.firstChild);
    }
    
    /**
     * Enable offline mode
     */
    enableOfflineMode() {
        document.body.classList.add('woow-offline-mode');
        
        // Show offline indicator
        const offlineIndicator = document.createElement('div');
        offlineIndicator.id = 'woow-offline-indicator';
        offlineIndicator.innerHTML = '📡 Offline Mode - Changes saved locally';
        offlineIndicator.style.cssText = `
            position: fixed;
            top: 32px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff6900;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            z-index: 999999;
            font-size: 12px;
        `;
        
        document.body.appendChild(offlineIndicator);
        
        this.log('Offline mode enabled');
    }
    
    /**
     * Enable read-only mode
     */
    async enableReadOnlyMode() {
        document.body.classList.add('woow-readonly-mode');
        
        // Apply default settings
        const defaultSettings = this.getDefaultSettings();
        await this.applyCSSVariablesDirect(defaultSettings);
        
        // Show read-only indicator
        const readOnlyIndicator = document.createElement('div');
        readOnlyIndicator.innerHTML = '🔒 Read-Only Mode - Settings cannot be saved';
        readOnlyIndicator.style.cssText = `
            position: fixed;
            top: 32px;
            left: 50%;
            transform: translateX(-50%);
            background: #666;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            z-index: 999999;
            font-size: 12px;
        `;
        
        document.body.appendChild(readOnlyIndicator);
        
        this.log('Read-only mode enabled');
    }
    
    /**
     * Wait for DOM to be ready
     * 
     * @returns {Promise<void>}
     */
    async waitForDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                const checkReady = () => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            }
        });
    }
    
    /**
     * Retry database sync in background
     */
    async retryDatabaseSync() {
        if (!this.persistenceManager) {
            return;
        }
        
        try {
            this.log('Retrying database sync in background...');
            await this.persistenceManager.syncWithDatabase();
            this.log('Background database sync successful');
            
            // Remove offline indicator if present
            const offlineIndicator = document.getElementById('woow-offline-indicator');
            if (offlineIndicator) {
                offlineIndicator.remove();
            }
            
            // Show success notification
            this.showUserNotification('general', { message: 'Connection restored. Settings synchronized.' });
            
        } catch (error) {
            this.log('Background database sync failed:', error);
            // Schedule another retry
            setTimeout(() => {
                this.retryDatabaseSync();
            }, 30000); // Retry in 30 seconds
        }
    }
    
    /**
     * Perform fallback initialization with minimal functionality
     * Enhanced to meet requirement 8.4: Provide fallback initialization if database load fails
     * 
     * @returns {Promise<void>}
     */
    async performFallbackInitialization() {
        this.log('Attempting fallback initialization...');
        
        try {
            // Step 1: Try multiple fallback sources in order of preference
            let fallbackSettings = null;
            const fallbackSources = [
                {
                    name: 'localStorage-backup',
                    method: () => this.loadSettingsFromLocalStorage()
                },
                {
                    name: 'session-storage',
                    method: () => this.loadSettingsFromSessionStorage()
                },
                {
                    name: 'browser-cache',
                    method: () => this.loadSettingsFromBrowserCache()
                },
                {
                    name: 'defaults',
                    method: () => this.getDefaultSettings()
                }
            ];
            
            for (const source of fallbackSources) {
                try {
                    this.log(`Trying fallback source: ${source.name}`);
                    const settings = await source.method();
                    
                    if (settings && Object.keys(settings).length > 0) {
                        fallbackSettings = settings;
                        fallbackSettings._fallbackSource = source.name;
                        this.log(`Fallback settings loaded from: ${source.name}`);
                        break;
                    }
                } catch (sourceError) {
                    this.log(`Fallback source ${source.name} failed:`, sourceError);
                    continue;
                }
            }
            
            if (!fallbackSettings) {
                throw new Error('All fallback sources failed');
            }
            
            // Step 2: Apply CSS variables with enhanced error handling
            await this.applyFallbackCSSVariables(fallbackSettings);
            
            // Step 3: Restore minimal UI state
            await this.restoreMinimalUIState(fallbackSettings);
            
            // Step 4: Set up recovery monitoring
            this.setupRecoveryMonitoring();
            
            // Step 5: Mark as initialized with fallback flag
            this.isInitialized = true;
            this.isFallbackMode = true;
            
            this.log('Fallback initialization completed successfully', {
                source: fallbackSettings._fallbackSource,
                settingsCount: Object.keys(fallbackSettings).length
            });
            
            // Step 6: Show user notification about fallback mode
            this.showFallbackModeNotification(fallbackSettings._fallbackSource);
            
            // Step 7: Dispatch enhanced fallback event
            window.dispatchEvent(new CustomEvent('woow-initialization-fallback', {
                detail: {
                    settings: fallbackSettings,
                    source: fallbackSettings._fallbackSource,
                    success: true,
                    isFallbackMode: true,
                    timestamp: Date.now()
                }
            }));
            
            // Step 8: Schedule background recovery attempts
            this.scheduleBackgroundRecovery();
            
        } catch (error) {
            this.log('Fallback initialization failed completely:', error);
            
            // Last resort: Apply absolute minimal CSS to prevent broken UI
            await this.applyEmergencyStyles();
            
            // Show critical error notification
            this.showCriticalFallbackError(error);
            
            throw error;
        }
    }
    
    /**
     * Load settings from sessionStorage as fallback
     * Requirement 7.1: Continue with alternative storage when localStorage fails
     * 
     * @returns {Object|null} Settings object or null
     */
    loadSettingsFromSessionStorage() {
        try {
            const data = sessionStorage.getItem('woow_admin_settings_backup') || 
                         sessionStorage.getItem('mas_live_edit_settings_backup');
            
            if (data) {
                const settings = JSON.parse(data);
                this.log('Settings loaded from sessionStorage');
                return settings;
            }
            
            return null;
            
        } catch (error) {
            this.log('Failed to load from sessionStorage:', error);
            return null;
        }
    }
    
    /**
     * Load settings from browser cache/IndexedDB as fallback
     * 
     * @returns {Promise<Object|null>} Settings object or null
     */
    async loadSettingsFromBrowserCache() {
        try {
            // Try IndexedDB if available
            if ('indexedDB' in window) {
                return await this.loadFromIndexedDB();
            }
            
            // Try cache API if available
            if ('caches' in window) {
                return await this.loadFromCacheAPI();
            }
            
            return null;
            
        } catch (error) {
            this.log('Failed to load from browser cache:', error);
            return null;
        }
    }
    
    /**
     * Load settings from IndexedDB
     * 
     * @returns {Promise<Object|null>} Settings object or null
     */
    async loadFromIndexedDB() {
        return new Promise((resolve) => {
            try {
                const request = indexedDB.open('woow_admin_settings', 1);
                
                request.onerror = () => {
                    this.log('IndexedDB open failed');
                    resolve(null);
                };
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    
                    if (!db.objectStoreNames.contains('settings')) {
                        resolve(null);
                        return;
                    }
                    
                    const transaction = db.transaction(['settings'], 'readonly');
                    const store = transaction.objectStore('settings');
                    const getRequest = store.get('current_settings');
                    
                    getRequest.onsuccess = () => {
                        if (getRequest.result) {
                            this.log('Settings loaded from IndexedDB');
                            resolve(getRequest.result.data);
                        } else {
                            resolve(null);
                        }
                    };
                    
                    getRequest.onerror = () => resolve(null);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('settings')) {
                        db.createObjectStore('settings', { keyPath: 'id' });
                    }
                };
                
            } catch (error) {
                this.log('IndexedDB error:', error);
                resolve(null);
            }
        });
    }
    
    /**
     * Load settings from Cache API
     * 
     * @returns {Promise<Object|null>} Settings object or null
     */
    async loadFromCacheAPI() {
        try {
            const cache = await caches.open('woow-admin-settings');
            const response = await cache.match('/woow-settings-backup');
            
            if (response) {
                const settings = await response.json();
                this.log('Settings loaded from Cache API');
                return settings;
            }
            
            return null;
            
        } catch (error) {
            this.log('Cache API error:', error);
            return null;
        }
    }
    
    /**
     * Apply CSS variables with enhanced fallback handling
     * Requirement 7.4: Apply fallback styles when CSS variable application fails
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async applyFallbackCSSVariables(settings) {
        const fallbackMethods = [
            {
                name: 'direct-css-variables',
                method: () => this.applyCSSVariablesDirect(settings)
            },
            {
                name: 'style-element-injection',
                method: () => this.applyCSSVariablesFallback(settings)
            },
            {
                name: 'inline-styles',
                method: () => this.applyInlineStyles(settings)
            },
            {
                name: 'css-classes',
                method: () => this.applyCSSClasses(settings)
            }
        ];
        
        let applied = false;
        
        for (const method of fallbackMethods) {
            try {
                this.log(`Trying CSS application method: ${method.name}`);
                await method.method();
                applied = true;
                this.log(`CSS applied successfully via: ${method.name}`);
                break;
            } catch (error) {
                this.log(`CSS method ${method.name} failed:`, error);
                continue;
            }
        }
        
        if (!applied) {
            this.log('All CSS application methods failed, applying emergency styles');
            await this.applyEmergencyStyles();
        }
    }
    
    /**
     * Apply styles directly to elements as fallback
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async applyInlineStyles(settings) {
        const styleMapping = {
            admin_bar_background: '#wpadminbar',
            admin_bar_text_color: '#wpadminbar, #wpadminbar a',
            menu_background: '#adminmenu',
            menu_text_color: '#adminmenu a',
            content_background: '#wpbody-content'
        };
        
        Object.entries(settings).forEach(([key, value]) => {
            const selector = styleMapping[key];
            if (selector && value) {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    switch (key) {
                        case 'admin_bar_background':
                        case 'menu_background':
                        case 'content_background':
                            element.style.backgroundColor = value;
                            break;
                        case 'admin_bar_text_color':
                        case 'menu_text_color':
                            element.style.color = value;
                            break;
                    }
                });
            }
        });
        
        this.log('Inline styles applied directly to elements');
    }
    
    /**
     * Apply CSS classes as fallback
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async applyCSSClasses(settings) {
        // Create dynamic CSS classes
        const styleElement = document.createElement('style');
        styleElement.id = 'woow-fallback-classes';
        
        const cssRules = [];
        
        if (settings.admin_bar_background) {
            cssRules.push(`
                .woow-fallback-admin-bar { 
                    background-color: ${settings.admin_bar_background} !important; 
                }
            `);
            document.getElementById('wpadminbar')?.classList.add('woow-fallback-admin-bar');
        }
        
        if (settings.menu_background) {
            cssRules.push(`
                .woow-fallback-menu { 
                    background-color: ${settings.menu_background} !important; 
                }
            `);
            document.getElementById('adminmenu')?.classList.add('woow-fallback-menu');
        }
        
        styleElement.textContent = cssRules.join('\n');
        document.head.appendChild(styleElement);
        
        this.log('CSS classes applied as fallback');
    }
    
    /**
     * Apply emergency styles to prevent broken UI
     * 
     * @returns {Promise<void>}
     */
    async applyEmergencyStyles() {
        const emergencyCSS = `
            #wpadminbar { background-color: #23282d !important; }
            #adminmenu { background-color: #23282d !important; }
            #wpbody-content { background-color: #ffffff !important; }
            .woow-emergency-mode { opacity: 0.8; }
        `;
        
        let emergencyStyle = document.getElementById('woow-emergency-styles');
        if (!emergencyStyle) {
            emergencyStyle = document.createElement('style');
            emergencyStyle.id = 'woow-emergency-styles';
            document.head.appendChild(emergencyStyle);
        }
        
        emergencyStyle.textContent = emergencyCSS;
        document.body.classList.add('woow-emergency-mode');
        
        this.log('Emergency styles applied to prevent broken UI');
    }
    
    /**
     * Restore minimal UI state for fallback mode
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<void>}
     */
    async restoreMinimalUIState(settings) {
        try {
            // Only restore essential UI elements
            const essentialElements = document.querySelectorAll(
                'input[data-setting], select[data-setting], .woow-color-picker'
            );
            
            essentialElements.forEach(element => {
                const settingKey = element.dataset.setting || element.name;
                if (settingKey && settings[settingKey] !== undefined) {
                    if (element.type === 'checkbox') {
                        element.checked = Boolean(settings[settingKey]);
                    } else {
                        element.value = settings[settingKey];
                    }
                }
            });
            
            this.log('Minimal UI state restored for fallback mode');
            
        } catch (error) {
            this.log('Failed to restore minimal UI state:', error);
            // Continue without UI restoration - CSS is more important
        }
    }
    
    /**
     * Set up monitoring for recovery opportunities
     */
    setupRecoveryMonitoring() {
        // Monitor network connectivity
        window.addEventListener('online', () => {
            this.log('Network connectivity restored, attempting recovery');
            this.attemptRecoveryFromFallback();
        });
        
        // Monitor for successful AJAX requests from other parts of the system
        const originalAjax = jQuery.ajax;
        jQuery.ajax = (options) => {
            const result = originalAjax.call(jQuery, options);
            
            result.done(() => {
                if (this.isFallbackMode && options.url && options.url.includes('admin-ajax.php')) {
                    this.log('AJAX request succeeded, network appears to be working');
                    setTimeout(() => this.attemptRecoveryFromFallback(), 2000);
                }
            });
            
            return result;
        };
        
        this.log('Recovery monitoring set up');
    }
    
    /**
     * Show notification about fallback mode
     * 
     * @param {string} source - Fallback source used
     */
    showFallbackModeNotification(source) {
        const notification = document.createElement('div');
        notification.className = 'woow-fallback-notification';
        notification.innerHTML = `
            <div class="woow-notification-content">
                <div class="woow-notification-icon">🔄</div>
                <div class="woow-notification-message">
                    <strong>WOOW! Admin Styler - Fallback Mode</strong><br>
                    Using ${source} settings. Some features may be limited.<br>
                    <button onclick="window.settingsInitController?.attemptRecoveryFromFallback()" 
                            style="background: #0073aa; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin-top: 5px; cursor: pointer;">
                        Try Recovery
                    </button>
                </div>
                <button class="woow-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 999999;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        this.log(`Fallback mode notification shown for source: ${source}`);
    }
    
    /**
     * Show critical fallback error
     * 
     * @param {Error} error - The error that caused fallback failure
     */
    showCriticalFallbackError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'woow-critical-fallback-error';
        errorDiv.innerHTML = `
            <div style="background: #dc3232; color: white; padding: 15px; margin: 10px 0; border-radius: 3px;">
                <strong>WOOW! Admin Styler - Critical Initialization Error</strong><br>
                All initialization methods failed. The plugin may not function correctly.<br>
                <small>Error: ${error.message}</small><br>
                <div style="margin-top: 10px;">
                    <button onclick="window.settingsInitController?.forceReinitialize()" 
                            style="background: white; color: #dc3232; border: none; padding: 5px 10px; margin-right: 10px; border-radius: 3px; cursor: pointer;">
                        Retry Initialization
                    </button>
                    <button onclick="location.reload()" 
                            style="background: white; color: #dc3232; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
        
        const adminContent = document.querySelector('#wpbody-content') || document.body;
        adminContent.insertBefore(errorDiv, adminContent.firstChild);
        
        this.log('Critical fallback error notification shown');
    }
    
    /**
     * Schedule background recovery attempts
     */
    scheduleBackgroundRecovery() {
        // Try recovery every 30 seconds for the first 5 minutes
        let attempts = 0;
        const maxAttempts = 10;
        
        const recoveryInterval = setInterval(() => {
            attempts++;
            
            if (attempts > maxAttempts || !this.isFallbackMode) {
                clearInterval(recoveryInterval);
                return;
            }
            
            this.log(`Background recovery attempt ${attempts}/${maxAttempts}`);
            this.attemptRecoveryFromFallback(true); // Silent recovery
            
        }, 30000);
        
        this.recoveryInterval = recoveryInterval;
        this.log('Background recovery scheduled');
    }
    
    /**
     * Attempt to recover from fallback mode
     * 
     * @param {boolean} silent - Whether to perform silent recovery
     * @returns {Promise<boolean>} Recovery success status
     */
    async attemptRecoveryFromFallback(silent = false) {
        if (!this.isFallbackMode) {
            return true;
        }
        
        this.log('Attempting recovery from fallback mode...', { silent });
        
        try {
            // Try to load settings from database again
            const settings = await this.loadSettingsFromDatabase();
            
            if (settings && Object.keys(settings).length > 0) {
                // Recovery successful
                this.isFallbackMode = false;
                
                // Apply recovered settings
                await this.applyCSSVariablesDirect(settings);
                await this.restoreUIState(settings);
                
                // Clear recovery interval
                if (this.recoveryInterval) {
                    clearInterval(this.recoveryInterval);
                    this.recoveryInterval = null;
                }
                
                // Remove fallback notifications
                const fallbackNotifications = document.querySelectorAll('.woow-fallback-notification');
                fallbackNotifications.forEach(notification => notification.remove());
                
                if (!silent) {
                    // Show success notification
                    this.showRecoverySuccessNotification();
                }
                
                // Dispatch recovery event
                window.dispatchEvent(new CustomEvent('woow-initialization-recovered', {
                    detail: {
                        settings: settings,
                        timestamp: Date.now(),
                        wasInFallbackMode: true
                    }
                }));
                
                this.log('Recovery from fallback mode successful');
                return true;
            }
            
        } catch (error) {
            this.log('Recovery attempt failed:', error);
        }
        
        return false;
    }
    
    /**
     * Show recovery success notification
     */
    showRecoverySuccessNotification() {
        const notification = document.createElement('div');
        notification.className = 'woow-recovery-success-notification';
        notification.innerHTML = `
            <div class="woow-notification-content">
                <div class="woow-notification-icon">✅</div>
                <div class="woow-notification-message">
                    <strong>WOOW! Admin Styler - Recovery Successful</strong><br>
                    Full functionality restored. Settings synchronized.
                </div>
                <button class="woow-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            background: #d4edda;
            border-left: 4px solid #28a745;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 999999;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        this.log('Recovery success notification shown');
    }
    
    /**
     * Get initialization status and metrics
     * 
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            initializationStarted: this.initializationStarted,
            queueLength: this.initializationQueue.length,
            isProcessingQueue: this.isProcessingQueue,
            errors: this.initializationErrors,
            metrics: this.performanceMetrics,
            hasPersistenceManager: !!this.persistenceManager,
            hasCSSVariableManager: !!this.cssVariableManager
        };
    }
    
    /**
     * Force re-initialization (for debugging or recovery)
     * 
     * @returns {Promise<boolean>} Success status
     */
    async forceReinitialize() {
        this.log('Forcing re-initialization...');
        
        // Reset state
        this.isInitialized = false;
        this.initializationStarted = false;
        this.initializationPromise = null;
        this.initializationErrors = [];
        
        // Clear performance metrics
        this.performanceMetrics = {
            initStartTime: null,
            initEndTime: null,
            settingsLoadTime: null,
            cssApplicationTime: null,
            uiRestorationTime: null
        };
        
        // Re-initialize
        return await this.initialize();
    }
    
    /**
     * Cleanup method for proper disposal
     */
    destroy() {
        this.log('Destroying SettingsInitializationController...');
        
        // Clear timers
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Remove event listeners
        document.removeEventListener('DOMContentLoaded', this.handleDOMReady);
        window.removeEventListener('load', this.handleWindowLoad);
        window.removeEventListener('woow-force-initialization', this.initialize);
        
        // Clear queues
        this.initializationQueue = [];
        
        // Reset state
        this.isInitialized = false;
        this.initializationStarted = false;
        this.initializationPromise = null;
        
        this.log('SettingsInitializationController destroyed');
    }
    
    /**
     * Log detailed initialization failure information for debugging
     * Implements requirement 7.4: Log specific failures for debugging
     * 
     * @param {Error} error - The initialization error
     */
    logDetailedInitializationFailure(error) {
        const failureDetails = {
            timestamp: new Date().toISOString(),
            error: {
                name: error?.name || 'Unknown',
                message: error?.message || 'No message',
                stack: error?.stack || 'No stack trace'
            },
            context: {
                phase: 'initialization',
                isOnline: navigator.onLine,
                userAgent: navigator.userAgent,
                url: window.location.href,
                localStorage: this.getLocalStorageStatus(),
                sessionStorage: this.getSessionStorageStatus(),
                domState: document.readyState,
                windowLoaded: document.readyState === 'complete'
            },
            metrics: this.performanceMetrics,
            errorHistory: this.initializationErrors.slice(-5), // Last 5 errors
            dependencies: {
                hasPersistenceManager: !!this.persistenceManager,
                hasCSSVariableManager: !!this.cssVariableManager,
                hasErrorRecoveryManager: !!(this.persistenceManager?.errorRecoveryManager),
                hasJQuery: typeof jQuery !== 'undefined',
                hasWoowAjax: !!window.woowAdminAjax
            }
        };
        
        console.group('🔍 Detailed Initialization Failure Log');
        console.error('Initialization Failure Details:', failureDetails);
        console.groupEnd();
        
        // Send to external logging if configured
        if (window.woowErrorLogging?.endpoint) {
            this.sendFailureToExternalLogging(failureDetails);
        }
        
        // Store in localStorage for debugging (if available)
        try {
            const debugKey = 'woow_initialization_debug_log';
            const existingLogs = JSON.parse(localStorage.getItem(debugKey) || '[]');
            existingLogs.push(failureDetails);
            
            // Keep only last 10 failure logs
            if (existingLogs.length > 10) {
                existingLogs.splice(0, existingLogs.length - 10);
            }
            
            localStorage.setItem(debugKey, JSON.stringify(existingLogs));
        } catch (storageError) {
            console.warn('Failed to store debug log in localStorage:', storageError);
        }
    }
    
    /**
     * Get localStorage status for debugging
     * Implements requirement 7.1: Handle localStorage failures gracefully
     * 
     * @returns {Object} localStorage status information
     */
    getLocalStorageStatus() {
        try {
            const testKey = 'woow_test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            return {
                available: true,
                quotaUsed: this.calculateLocalStorageUsage(),
                itemCount: localStorage.length,
                hasWoowSettings: !!localStorage.getItem('woow_admin_settings')
            };
        } catch (error) {
            return {
                available: false,
                error: error.message,
                quotaExceeded: error.name === 'QuotaExceededError'
            };
        }
    }
    
    /**
     * Get sessionStorage status for debugging
     * 
     * @returns {Object} sessionStorage status information
     */
    getSessionStorageStatus() {
        try {
            const testKey = 'woow_test_' + Date.now();
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            
            return {
                available: true,
                itemCount: sessionStorage.length
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }
    
    /**
     * Calculate localStorage usage
     * 
     * @returns {number} Approximate localStorage usage in bytes
     */
    calculateLocalStorageUsage() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return total;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * Enhanced fallback initialization with comprehensive error handling
     * Implements requirement 8.4: Provide fallback initialization if database load fails
     * 
     * @returns {Promise<void>}
     */
    async performEnhancedFallbackInitialization() {
        this.log('Starting enhanced fallback initialization...');
        
        const fallbackAttempts = [];
        let fallbackSettings = null;
        
        // Define fallback strategies in order of preference
        const fallbackStrategies = [
            {
                name: 'localStorage-recovery',
                description: 'Recover from localStorage backup',
                method: async () => {
                    const localStorageStatus = this.getLocalStorageStatus();
                    if (!localStorageStatus.available) {
                        throw new Error('localStorage not available: ' + localStorageStatus.error);
                    }
                    
                    const settings = this.loadSettingsFromLocalStorage();
                    if (!settings || Object.keys(settings).length === 0) {
                        throw new Error('No valid settings found in localStorage');
                    }
                    
                    return settings;
                }
            },
            {
                name: 'sessionStorage-recovery',
                description: 'Recover from sessionStorage backup',
                method: async () => {
                    const sessionStorageStatus = this.getSessionStorageStatus();
                    if (!sessionStorageStatus.available) {
                        throw new Error('sessionStorage not available: ' + sessionStorageStatus.error);
                    }
                    
                    const settings = this.loadSettingsFromSessionStorage();
                    if (!settings || Object.keys(settings).length === 0) {
                        throw new Error('No valid settings found in sessionStorage');
                    }
                    
                    return settings;
                }
            },
            {
                name: 'browser-cache-recovery',
                description: 'Recover from browser cache',
                method: async () => {
                    const settings = await this.loadSettingsFromBrowserCache();
                    if (!settings || Object.keys(settings).length === 0) {
                        throw new Error('No valid settings found in browser cache');
                    }
                    
                    return settings;
                }
            },
            {
                name: 'default-settings',
                description: 'Use default settings as last resort',
                method: async () => {
                    const settings = this.getDefaultSettings();
                    if (!settings || Object.keys(settings).length === 0) {
                        throw new Error('Failed to generate default settings');
                    }
                    
                    return settings;
                }
            }
        ];
        
        // Try each fallback strategy
        for (const strategy of fallbackStrategies) {
            const attemptStart = performance.now();
            
            try {
                this.log(`Attempting fallback strategy: ${strategy.name} - ${strategy.description}`);
                
                const settings = await strategy.method();
                
                if (settings && Object.keys(settings).length > 0) {
                    fallbackSettings = settings;
                    fallbackSettings._fallbackSource = strategy.name;
                    fallbackSettings._fallbackTimestamp = Date.now();
                    
                    const attemptDuration = performance.now() - attemptStart;
                    fallbackAttempts.push({
                        strategy: strategy.name,
                        success: true,
                        duration: attemptDuration,
                        settingsCount: Object.keys(settings).length
                    });
                    
                    this.log(`Fallback strategy ${strategy.name} succeeded`, {
                        duration: attemptDuration,
                        settingsCount: Object.keys(settings).length
                    });
                    
                    break;
                }
            } catch (strategyError) {
                const attemptDuration = performance.now() - attemptStart;
                fallbackAttempts.push({
                    strategy: strategy.name,
                    success: false,
                    duration: attemptDuration,
                    error: strategyError.message
                });
                
                this.log(`Fallback strategy ${strategy.name} failed:`, strategyError);
                continue;
            }
        }
        
        if (!fallbackSettings) {
            throw new Error('All fallback strategies failed: ' + JSON.stringify(fallbackAttempts));
        }
        
        // Apply fallback settings with enhanced error handling
        try {
            // Step 1: Apply CSS variables with fallback handling (Requirement 7.4)
            await this.applyFallbackCSSVariablesWithErrorHandling(fallbackSettings);
            
            // Step 2: Restore minimal UI state
            await this.restoreMinimalUIStateWithErrorHandling(fallbackSettings);
            
            // Step 3: Set up recovery monitoring
            this.setupEnhancedRecoveryMonitoring();
            
            // Step 4: Mark as initialized in fallback mode
            this.isInitialized = true;
            this.isFallbackMode = true;
            
            // Step 5: Show user notification about fallback mode
            this.showEnhancedFallbackModeNotification(fallbackSettings._fallbackSource, fallbackAttempts);
            
            // Step 6: Dispatch enhanced fallback event
            window.dispatchEvent(new CustomEvent('woow-initialization-fallback-enhanced', {
                detail: {
                    settings: fallbackSettings,
                    source: fallbackSettings._fallbackSource,
                    success: true,
                    isFallbackMode: true,
                    timestamp: Date.now(),
                    fallbackAttempts: fallbackAttempts,
                    metrics: this.performanceMetrics
                }
            }));
            
            // Step 7: Schedule background recovery attempts
            this.scheduleEnhancedBackgroundRecovery();
            
            this.log('Enhanced fallback initialization completed successfully', {
                source: fallbackSettings._fallbackSource,
                settingsCount: Object.keys(fallbackSettings).length,
                attempts: fallbackAttempts.length
            });
            
        } catch (applicationError) {
            this.log('Failed to apply fallback settings:', applicationError);
            
            // Last resort: Apply emergency styles
            await this.applyEmergencyStylesWithErrorHandling();
            
            throw new Error('Fallback initialization failed during application: ' + applicationError.message);
        }
    }
    
    /**
     * Apply fallback CSS variables with comprehensive error handling
     * Implements requirement 7.4: Apply fallback styles and log specific failures
     * 
     * @param {Object} settings - Fallback settings
     * @returns {Promise<void>}
     */
    async applyFallbackCSSVariablesWithErrorHandling(settings) {
        const cssApplicationAttempts = [];
        
        // Define CSS application strategies
        const cssStrategies = [
            {
                name: 'direct-css-variables',
                description: 'Apply CSS variables directly to document root',
                method: async () => await this.applyCSSVariablesDirect(settings)
            },
            {
                name: 'style-element-injection',
                description: 'Inject CSS via style element',
                method: async () => await this.applyCSSVariablesFallback(settings)
            },
            {
                name: 'inline-styles',
                description: 'Apply inline styles to specific elements',
                method: async () => await this.applyInlineStylesFallback(settings)
            },
            {
                name: 'emergency-styles',
                description: 'Apply minimal emergency styles',
                method: async () => await this.applyEmergencyStylesWithErrorHandling()
            }
        ];
        
        let cssApplied = false;
        
        for (const strategy of cssStrategies) {
            const attemptStart = performance.now();
            
            try {
                this.log(`Attempting CSS strategy: ${strategy.name} - ${strategy.description}`);
                
                await strategy.method();
                
                // Validate CSS application
                const validationResult = await this.validateCSSVariableApplication(settings);
                
                if (validationResult.success || validationResult.appliedVariables.length > 0) {
                    cssApplied = true;
                    
                    const attemptDuration = performance.now() - attemptStart;
                    cssApplicationAttempts.push({
                        strategy: strategy.name,
                        success: true,
                        duration: attemptDuration,
                        appliedVariables: validationResult.appliedVariables.length,
                        failedVariables: validationResult.failedVariables.length
                    });
                    
                    this.log(`CSS strategy ${strategy.name} succeeded`, {
                        duration: attemptDuration,
                        appliedVariables: validationResult.appliedVariables.length
                    });
                    
                    break;
                }
            } catch (strategyError) {
                const attemptDuration = performance.now() - attemptStart;
                cssApplicationAttempts.push({
                    strategy: strategy.name,
                    success: false,
                    duration: attemptDuration,
                    error: strategyError.message
                });
                
                this.log(`CSS strategy ${strategy.name} failed:`, strategyError);
                continue;
            }
        }
        
        // Log CSS application results
        this.log('CSS application attempts completed', {
            success: cssApplied,
            attempts: cssApplicationAttempts
        });
        
        if (!cssApplied) {
            throw new Error('All CSS application strategies failed: ' + JSON.stringify(cssApplicationAttempts));
        }
        
        // Store CSS application results for debugging
        try {
            localStorage.setItem('woow_css_application_debug', JSON.stringify({
                timestamp: Date.now(),
                attempts: cssApplicationAttempts,
                success: cssApplied
            }));
        } catch (storageError) {
            this.log('Failed to store CSS debug info:', storageError);
        }
    }
    
    /**
     * Restore minimal UI state with error handling
     * 
     * @param {Object} settings - Settings to apply
     * @returns {Promise<void>}
     */
    async restoreMinimalUIStateWithErrorHandling(settings) {
        this.log('Restoring minimal UI state with error handling...');
        
        const uiRestorationAttempts = [];
        
        // Define UI restoration strategies
        const restorationStrategies = [
            {
                name: 'form-controls-update',
                description: 'Update form controls with settings values',
                method: async () => await this.updateFormControlsMinimal(settings)
            },
            {
                name: 'live-edit-sync',
                description: 'Sync with live edit interface',
                method: async () => await this.syncLiveEditInterfaceMinimal(settings)
            },
            {
                name: 'ui-components-update',
                description: 'Update UI components state',
                method: async () => await this.updateUIComponentsMinimal(settings)
            }
        ];
        
        let restorationSuccess = false;
        
        for (const strategy of restorationStrategies) {
            const attemptStart = performance.now();
            
            try {
                this.log(`Attempting UI restoration strategy: ${strategy.name}`);
                
                await strategy.method();
                
                const attemptDuration = performance.now() - attemptStart;
                uiRestorationAttempts.push({
                    strategy: strategy.name,
                    success: true,
                    duration: attemptDuration
                });
                
                restorationSuccess = true;
                this.log(`UI restoration strategy ${strategy.name} succeeded`);
                
            } catch (strategyError) {
                const attemptDuration = performance.now() - attemptStart;
                uiRestorationAttempts.push({
                    strategy: strategy.name,
                    success: false,
                    duration: attemptDuration,
                    error: strategyError.message
                });
                
                this.log(`UI restoration strategy ${strategy.name} failed:`, strategyError);
                // Continue with other strategies
            }
        }
        
        this.log('UI restoration attempts completed', {
            success: restorationSuccess,
            attempts: uiRestorationAttempts
        });
        
        // Even if all strategies fail, don't throw error - UI restoration is not critical
        if (!restorationSuccess) {
            this.log('All UI restoration strategies failed, but continuing initialization');
        }
    }
    
    /**
     * Update form controls with minimal error handling
     * 
     * @param {Object} settings - Settings to apply
     * @returns {Promise<void>}
     */
    async updateFormControlsMinimal(settings) {
        try {
            // Find common form controls and update them
            const formSelectors = [
                'input[name*="admin_bar"]',
                'input[name*="menu_"]',
                'select[name*="admin_bar"]',
                'select[name*="menu_"]'
            ];
            
            let updatedCount = 0;
            
            formSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    const settingKey = this.extractSettingKeyFromElement(element);
                    if (settingKey && settings[settingKey] !== undefined) {
                        if (element.type === 'checkbox') {
                            element.checked = !!settings[settingKey];
                        } else {
                            element.value = settings[settingKey];
                        }
                        updatedCount++;
                    }
                });
            });
            
            this.log(`Updated ${updatedCount} form controls`);
            
        } catch (error) {
            this.log('Failed to update form controls:', error);
            throw error;
        }
    }
    
    /**
     * Sync with live edit interface minimally
     * 
     * @param {Object} settings - Settings to apply
     * @returns {Promise<void>}
     */
    async syncLiveEditInterfaceMinimal(settings) {
        try {
            // Try to sync with existing live edit systems
            if (window.liveEditInstance && window.liveEditInstance.updateSettings) {
                await window.liveEditInstance.updateSettings(settings);
                this.log('Synced with live edit instance');
            }
            
            if (window.LiveEditEngine && window.LiveEditEngine.prototype.updateSettings) {
                // Try to find active LiveEditEngine instances
                const liveEditElements = document.querySelectorAll('[data-live-edit]');
                if (liveEditElements.length > 0) {
                    this.log('Found live edit elements, triggering updates');
                    // Trigger custom event for live edit elements
                    liveEditElements.forEach(element => {
                        element.dispatchEvent(new CustomEvent('woow-settings-updated', {
                            detail: { settings }
                        }));
                    });
                }
            }
            
        } catch (error) {
            this.log('Failed to sync with live edit interface:', error);
            throw error;
        }
    }
    
    /**
     * Update UI components minimally
     * 
     * @param {Object} settings - Settings to apply
     * @returns {Promise<void>}
     */
    async updateUIComponentsMinimal(settings) {
        try {
            // Update micro-panels if they exist
            const microPanels = document.querySelectorAll('.woow-micro-panel');
            if (microPanels.length > 0) {
                microPanels.forEach(panel => {
                    panel.dispatchEvent(new CustomEvent('woow-settings-restored', {
                        detail: { settings }
                    }));
                });
                this.log(`Updated ${microPanels.length} micro-panels`);
            }
            
            // Update any elements with data-woow-setting attributes
            const settingElements = document.querySelectorAll('[data-woow-setting]');
            settingElements.forEach(element => {
                const settingKey = element.getAttribute('data-woow-setting');
                if (settingKey && settings[settingKey] !== undefined) {
                    element.setAttribute('data-woow-value', settings[settingKey]);
                    element.dispatchEvent(new CustomEvent('woow-setting-updated', {
                        detail: { key: settingKey, value: settings[settingKey] }
                    }));
                }
            });
            
        } catch (error) {
            this.log('Failed to update UI components:', error);
            throw error;
        }
    }
    
    /**
     * Extract setting key from form element
     * 
     * @param {HTMLElement} element - Form element
     * @returns {string|null} Setting key or null
     */
    extractSettingKeyFromElement(element) {
        // Try to extract setting key from element name or data attributes
        if (element.name) {
            // Remove common prefixes and suffixes
            let key = element.name.replace(/^(woow_|mas_)/, '').replace(/_setting$/, '');
            return key;
        }
        
        if (element.getAttribute('data-setting')) {
            return element.getAttribute('data-setting');
        }
        
        return null;
    }
    
    /**
     * Apply inline styles as fallback method
     * 
     * @param {Object} settings - Settings to apply
     * @returns {Promise<void>}
     */
    async applyInlineStylesFallback(settings) {
        const elementsToStyle = [
            { selector: '#wpadminbar', property: 'background-color', setting: 'admin_bar_background' },
            { selector: '#wpadminbar .ab-item', property: 'color', setting: 'admin_bar_text_color' },
            { selector: '#adminmenu', property: 'background-color', setting: 'menu_background' },
            { selector: '#adminmenu a', property: 'color', setting: 'menu_text_color' }
        ];
        
        let appliedCount = 0;
        
        elementsToStyle.forEach(({ selector, property, setting }) => {
            const elements = document.querySelectorAll(selector);
            const value = settings[setting];
            
            if (elements.length > 0 && value) {
                elements.forEach(element => {
                    element.style[property] = value;
                });
                appliedCount++;
                this.log(`Applied inline style: ${selector} { ${property}: ${value} }`);
            }
        });
        
        if (appliedCount === 0) {
            throw new Error('No inline styles could be applied');
        }
        
        this.log(`Applied ${appliedCount} inline styles successfully`);
    }
    
    /**
     * Apply emergency styles with error handling
     * 
     * @returns {Promise<void>}
     */
    async applyEmergencyStylesWithErrorHandling() {
        try {
            const emergencyCSS = `
                #wpadminbar { background-color: #23282d !important; }
                #wpadminbar .ab-item { color: #ffffff !important; }
                #adminmenu { background-color: #23282d !important; }
                #adminmenu a { color: #ffffff !important; }
                .woow-emergency-mode { border-left: 4px solid #dc3545 !important; }
            `;
            
            let styleElement = document.getElementById('woow-emergency-styles');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'woow-emergency-styles';
                styleElement.type = 'text/css';
                document.head.appendChild(styleElement);
            }
            
            styleElement.textContent = emergencyCSS;
            
            // Add emergency mode class to body
            document.body.classList.add('woow-emergency-mode');
            
            this.log('Emergency styles applied successfully');
            
        } catch (error) {
            this.log('Failed to apply emergency styles:', error);
            throw error;
        }
    }
    
    /**
     * Show enhanced fallback mode notification
     * 
     * @param {string} source - Fallback source used
     * @param {Array} attempts - Fallback attempts made
     */
    showEnhancedFallbackModeNotification(source, attempts) {
        const notification = document.createElement('div');
        notification.className = 'woow-fallback-notification';
        notification.innerHTML = `
            <div class="woow-notification-content">
                <div class="woow-notification-icon">🔄</div>
                <div class="woow-notification-message">
                    <strong>WOOW! Admin Styler - Fallback Mode</strong><br>
                    Using ${source.replace('-', ' ')} due to initialization issues.<br>
                    <small>Attempted ${attempts.length} recovery strategies</small>
                </div>
                <button class="woow-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                <button class="woow-notification-retry" onclick="location.reload()" style="margin-left: 10px;">Retry</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            background: #fff;
            border-left: 4px solid #ff6900;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 999999;
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 15000);
        
        this.log(`Enhanced fallback mode notification shown for source: ${source}`);
    }
    
    /**
     * Set up enhanced recovery monitoring
     */
    setupEnhancedRecoveryMonitoring() {
        // Monitor for network recovery
        const handleOnline = () => {
            this.log('Network connection restored, attempting recovery...');
            this.attemptNetworkRecovery();
        };
        
        window.addEventListener('online', handleOnline);
        
        // Monitor for localStorage recovery
        if (this.recoveryInterval) {
            clearInterval(this.recoveryInterval);
        }
        
        this.recoveryInterval = setInterval(() => {
            this.attemptPeriodicRecovery();
        }, 30000); // Check every 30 seconds
        
        this.log('Enhanced recovery monitoring set up');
    }
    
    /**
     * Attempt network recovery
     */
    async attemptNetworkRecovery() {
        if (!navigator.onLine) {
            return;
        }
        
        try {
            this.log('Attempting network recovery...');
            
            // Try to load settings from database
            const dbSettings = await this.loadSettingsFromDatabase();
            
            if (dbSettings && Object.keys(dbSettings).length > 0) {
                // Apply recovered settings
                await this.applyCSSVariablesDirect(dbSettings);
                await this.restoreUIState(dbSettings);
                
                // Update cache and localStorage
                if (this.persistenceManager) {
                    this.persistenceManager.updateCacheFromSettings(dbSettings, 'database');
                    await this.persistenceManager.saveToLocalStorage(dbSettings);
                }
                
                // Show success notification
                this.showRecoverySuccessNotification('network');
                
                // Clear fallback mode
                this.isFallbackMode = false;
                document.body.classList.remove('woow-emergency-mode');
                
                this.log('Network recovery successful');
            }
            
        } catch (error) {
            this.log('Network recovery failed:', error);
        }
    }
    
    /**
     * Attempt periodic recovery
     */
    async attemptPeriodicRecovery() {
        if (!this.isFallbackMode) {
            return;
        }
        
        try {
            this.log('Attempting periodic recovery...');
            
            // Check if localStorage is now available
            const localStorageStatus = this.getLocalStorageStatus();
            if (localStorageStatus.available && localStorageStatus.hasWoowSettings) {
                const localSettings = this.loadSettingsFromLocalStorage();
                
                if (localSettings && Object.keys(localSettings).length > 0) {
                    await this.applyCSSVariablesDirect(localSettings);
                    this.showRecoverySuccessNotification('localStorage');
                    this.log('Periodic recovery from localStorage successful');
                }
            }
            
        } catch (error) {
            this.log('Periodic recovery failed:', error);
        }
    }
    
    /**
     * Show recovery success notification
     * 
     * @param {string} source - Recovery source
     */
    showRecoverySuccessNotification(source) {
        const notification = document.createElement('div');
        notification.className = 'woow-recovery-success-notification';
        notification.innerHTML = `
            <div class="woow-notification-content">
                <div class="woow-notification-icon">✅</div>
                <div class="woow-notification-message">
                    <strong>WOOW! Admin Styler - Recovery Successful</strong><br>
                    Settings restored from ${source}
                </div>
                <button class="woow-notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            background: #fff;
            border-left: 4px solid #28a745;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            padding: 15px;
            z-index: 999999;
            max-width: 350px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            line-height: 1.4;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * Send failure information to external logging service
     * 
     * @param {Object} failureDetails - Detailed failure information
     */
    async sendFailureToExternalLogging(failureDetails) {
        try {
            await fetch(window.woowErrorLogging.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'initialization_failure',
                    plugin: 'woow-admin-styler',
                    version: window.woowVersion || 'unknown',
                    details: failureDetails
                })
            });
            
            this.log('Failure details sent to external logging service');
            
        } catch (loggingError) {
            this.log('Failed to send failure details to external logging:', loggingError);
        }
    }
    
    /**
     * Schedule enhanced background recovery
     */
    scheduleEnhancedBackgroundRecovery() {
        // Schedule immediate retry
        setTimeout(() => {
            this.attemptBackgroundRecovery();
        }, 5000);
        
        // Schedule periodic retries with exponential backoff
        let retryDelay = 10000; // Start with 10 seconds
        const maxRetryDelay = 300000; // Max 5 minutes
        let retryCount = 0;
        const maxRetries = 10;
        
        const scheduleRetry = () => {
            if (retryCount >= maxRetries || !this.isFallbackMode) {
                return;
            }
            
            setTimeout(async () => {
                try {
                    await this.attemptBackgroundRecovery();
                    
                    if (!this.isFallbackMode) {
                        this.log('Background recovery successful, stopping retries');
                        return;
                    }
                } catch (error) {
                    this.log('Background recovery attempt failed:', error);
                }
                
                retryCount++;
                retryDelay = Math.min(retryDelay * 1.5, maxRetryDelay);
                scheduleRetry();
                
            }, retryDelay);
        };
        
        scheduleRetry();
        this.log('Enhanced background recovery scheduled');
    }
    
    /**
     * Attempt background recovery
     */
    async attemptBackgroundRecovery() {
        if (!this.isFallbackMode) {
            return;
        }
        
        this.log('Attempting background recovery...');
        
        try {
            // Try to reinitialize with full functionality
            const settings = await this.loadInitialSettings(true); // Force refresh
            
            if (settings && Object.keys(settings).length > 0) {
                await this.applyCSSVariables(settings);
                await this.restoreUIState(settings);
                
                // Clear fallback mode
                this.isFallbackMode = false;
                document.body.classList.remove('woow-emergency-mode');
                
                // Show success notification
                this.showRecoverySuccessNotification('background recovery');
                
                // Clear recovery interval
                if (this.recoveryInterval) {
                    clearInterval(this.recoveryInterval);
                    this.recoveryInterval = null;
                }
                
                this.log('Background recovery completed successfully');
                
                // Dispatch recovery event
                window.dispatchEvent(new CustomEvent('woow-initialization-recovered', {
                    detail: {
                        timestamp: Date.now(),
                        source: 'background_recovery',
                        settings: settings
                    }
                }));
            }
            
        } catch (error) {
            this.log('Background recovery failed:', error);
            throw error;
        }
    }
    
    /**
     * Debug logging method
     * 
     * @param {string} message - Log message
     * @param {*} data - Additional data to log
     */
    log(message, data = null) {
        if (this.config.debugMode || window.woowDebug) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] SettingsInitializationController: ${message}`;
            
            if (data) {
                console.log(logMessage, data);
            } else {
                console.log(logMessage);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsInitializationController;
}

// Make available globally
window.SettingsInitializationController = SettingsInitializationController;