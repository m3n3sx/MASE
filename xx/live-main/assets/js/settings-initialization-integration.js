/**
 * Settings Initialization Integration
 * 
 * Coordinates the SettingsInitializationController with existing LiveEditEngine
 * and SettingsRestorer classes to prevent race conditions and ensure proper
 * initialization timing.
 * 
 * @version 1.0.0
 * @author WOOW! Admin Styler
 */

class SettingsInitializationIntegration {
    constructor() {
        this.initializationController = null;
        this.liveEditEngine = null;
        this.settingsRestorer = null;
        
        // Integration state
        this.isIntegrated = false;
        this.integrationPromise = null;
        
        // Configuration
        this.config = {
            debugMode: window.woowDebug || false,
            integrationTimeout: 15000, // 15 seconds
            retryAttempts: 3,
            retryDelay: 2000
        };
        
        // Performance tracking
        this.integrationMetrics = {
            startTime: null,
            endTime: null,
            initControllerTime: null,
            liveEditEngineTime: null,
            settingsRestorerTime: null
        };
        
        // Bind methods
        this.integrate = this.integrate.bind(this);
        this.handleInitializationComplete = this.handleInitializationComplete.bind(this);
        
        this.log('SettingsInitializationIntegration constructed');
    }
    
    /**
     * Set up initialization timing coordination
     * Implements requirement 8.2: Ensure SettingsInitializationController runs before LiveEditEngine
     * Implements requirement 8.4: Coordinate DOM ready events between systems
     * 
     * @returns {Promise<void>}
     */
    async setupInitializationTiming() {
        this.log('Setting up initialization timing coordination...');
        
        try {
            // Prevent other systems from initializing until we're ready
            this.preventEarlyInitialization();
            
            // Set up DOM ready coordination
            this.coordinateDOMReadyEvents();
            
            // Set up initialization order enforcement
            this.enforceInitializationOrder();
            
            this.log('Initialization timing coordination set up');
            
        } catch (error) {
            this.log('Failed to set up initialization timing:', error);
            throw error;
        }
    }
    
    /**
     * Prevent other systems from initializing too early
     * Implements requirement 8.4: Prevent duplicate settings loading and application
     */
    preventEarlyInitialization() {
        // Set a flag to indicate integration is in progress
        window.woowIntegrationInProgress = true;
        
        // Override common initialization triggers temporarily
        const originalDOMContentLoaded = document.addEventListener;
        let domEventsPrevented = 0;
        
        document.addEventListener = function(type, listener, options) {
            if (type === 'DOMContentLoaded' && window.woowIntegrationInProgress) {
                // Defer DOM ready listeners until integration is complete
                window.addEventListener('woow-integration-ready', () => {
                    listener();
                });
                domEventsPrevented++;
                console.log(`🚫 DOM ready event deferred during integration (${domEventsPrevented})`);
                return;
            }
            
            // Call original method for other events
            return originalDOMContentLoaded.call(this, type, listener, options);
        };
        
        // Restore original method after integration
        setTimeout(() => {
            document.addEventListener = originalDOMContentLoaded;
            window.woowIntegrationInProgress = false;
            console.log(`✅ DOM event handling restored (${domEventsPrevented} events were deferred)`);
        }, 10000); // 10 second safety timeout
        
        this.log('Early initialization prevention set up');
    }
    
    /**
     * Coordinate DOM ready events between systems
     * Implements requirement 8.2: Coordinate DOM ready events between systems
     */
    coordinateDOMReadyEvents() {
        // Check if DOM is already ready
        if (document.readyState === 'loading') {
            // DOM is still loading, set up coordination
            document.addEventListener('DOMContentLoaded', () => {
                this.handleDOMReady();
            });
        } else {
            // DOM is already ready, trigger immediately
            setTimeout(() => this.handleDOMReady(), 0);
        }
        
        this.log('DOM ready event coordination set up');
    }
    
    /**
     * Handle DOM ready event in coordinated manner
     */
    handleDOMReady() {
        this.log('DOM ready detected, starting coordinated initialization sequence');
        
        // Start the integration process
        this.integrate().then((success) => {
            if (success) {
                this.log('Coordinated initialization sequence completed successfully');
            } else {
                this.log('Coordinated initialization sequence failed');
            }
        }).catch((error) => {
            this.log('Coordinated initialization sequence error:', error);
        });
    }
    
    /**
     * Enforce initialization order
     * Implements requirement 8.2: Ensure SettingsInitializationController runs before LiveEditEngine
     */
    enforceInitializationOrder() {
        // Create initialization queue
        this.initializationQueue = [];
        this.isProcessingInitializationQueue = false;
        
        // Override common initialization methods to queue them
        this.overrideInitializationMethods();
        
        this.log('Initialization order enforcement set up');
    }
    
    /**
     * Override common initialization methods to enforce order
     */
    overrideInitializationMethods() {
        // Override LiveEditEngine initialization if it exists
        if (window.LiveEditEngine && window.LiveEditEngine.prototype.init) {
            const originalLiveEditInit = window.LiveEditEngine.prototype.init;
            
            window.LiveEditEngine.prototype.init = function() {
                if (window.woowIntegrationInProgress) {
                    console.log('🚫 LiveEditEngine.init() deferred until integration complete');
                    
                    // Queue the initialization
                    window.addEventListener('woow-integration-ready', () => {
                        originalLiveEditInit.call(this);
                    });
                    
                    return;
                }
                
                // Call original method if integration is complete
                return originalLiveEditInit.call(this);
            };
        }
        
        // Override SettingsRestorer initialization if it exists
        if (window.SettingsRestorer && window.SettingsRestorer.prototype.init) {
            const originalSettingsRestorerInit = window.SettingsRestorer.prototype.init;
            
            window.SettingsRestorer.prototype.init = function() {
                if (window.woowIntegrationInProgress) {
                    console.log('🚫 SettingsRestorer.init() deferred until integration complete');
                    
                    // Queue the initialization
                    window.addEventListener('woow-integration-ready', () => {
                        originalSettingsRestorerInit.call(this);
                    });
                    
                    return;
                }
                
                // Call original method if integration is complete
                return originalSettingsRestorerInit.call(this);
            };
        }
        
        this.log('Initialization methods overridden for order enforcement');
    }
    
    /**
     * Notify systems that integration is ready
     * Implements requirement 8.4: Coordinate DOM ready events between systems
     */
    notifyIntegrationReady() {
        this.log('Notifying systems that integration is ready...');
        
        // Clear the integration in progress flag
        window.woowIntegrationInProgress = false;
        
        // Dispatch integration ready event
        window.dispatchEvent(new CustomEvent('woow-integration-ready', {
            detail: {
                success: true,
                integrationController: this,
                initializationController: this.initializationController,
                liveEditEngine: this.liveEditEngine,
                settingsRestorer: this.settingsRestorer
            }
        }));
        
        this.log('Integration ready notification sent');
    }
    
    /**
     * Main integration method
     * 
     * @returns {Promise<boolean>} Integration success status
     */
    async integrate() {
        if (this.integrationPromise) {
            this.log('Integration already in progress, returning existing promise');
            return this.integrationPromise;
        }
        
        if (this.isIntegrated) {
            this.log('Already integrated, skipping');
            return true;
        }
        
        this.integrationMetrics.startTime = performance.now();
        this.log('Starting settings initialization integration...');
        
        this.integrationPromise = this.performIntegration();
        
        try {
            const result = await this.integrationPromise;
            this.integrationMetrics.endTime = performance.now();
            
            if (result) {
                this.isIntegrated = true;
                this.log('Settings initialization integration completed successfully', {
                    duration: this.integrationMetrics.endTime - this.integrationMetrics.startTime,
                    metrics: this.integrationMetrics
                });
                
                // Dispatch integration complete event
                window.dispatchEvent(new CustomEvent('woow-integration-complete', {
                    detail: {
                        success: true,
                        metrics: this.integrationMetrics
                    }
                }));
            } else {
                this.log('Settings initialization integration failed');
            }
            
            return result;
            
        } catch (error) {
            this.integrationMetrics.endTime = performance.now();
            this.log('Settings initialization integration error:', error);
            
            // Dispatch integration failed event
            window.dispatchEvent(new CustomEvent('woow-integration-failed', {
                detail: {
                    error: error,
                    metrics: this.integrationMetrics
                }
            }));
            
            return false;
        }
    }
    
    /**
     * Perform the actual integration steps
     * Enhanced to ensure proper initialization timing and prevent conflicts
     * Implements requirement 8.2: Ensure SettingsInitializationController runs before LiveEditEngine
     * Implements requirement 8.4: Prevent duplicate settings loading and application
     * 
     * @returns {Promise<boolean>} Success status
     */
    async performIntegration() {
        try {
            // Step 0: Set up initialization timing coordination
            await this.setupInitializationTiming();
            
            // Step 1: Initialize SettingsInitializationController FIRST
            await this.initializeController();
            
            // Step 2: Coordinate with existing LiveEditEngine (AFTER controller is ready)
            await this.coordinateWithLiveEditEngine();
            
            // Step 3: Integrate with SettingsRestorer (AFTER LiveEditEngine coordination)
            await this.integrateWithSettingsRestorer();
            
            // Step 4: Set up event coordination
            this.setupEventCoordination();
            
            // Step 5: Validate integration
            const isValid = await this.validateIntegration();
            
            if (!isValid) {
                throw new Error('Integration validation failed');
            }
            
            // Step 6: Notify systems that integration is ready
            this.notifyIntegrationReady();
            
            return true;
            
        } catch (error) {
            this.log('Integration step failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize the SettingsInitializationController
     * 
     * @returns {Promise<void>}
     */
    async initializeController() {
        const startTime = performance.now();
        this.log('Initializing SettingsInitializationController...');
        
        try {
            // Create controller instance if not exists
            if (!this.initializationController) {
                if (window.SettingsInitializationController) {
                    this.initializationController = new window.SettingsInitializationController();
                } else {
                    throw new Error('SettingsInitializationController class not available');
                }
            }
            
            // Initialize the controller
            const initSuccess = await this.initializationController.initialize();
            
            if (!initSuccess) {
                throw new Error('SettingsInitializationController initialization failed');
            }
            
            this.integrationMetrics.initControllerTime = performance.now() - startTime;
            this.log('SettingsInitializationController initialized successfully', {
                duration: this.integrationMetrics.initControllerTime
            });
            
        } catch (error) {
            this.log('Failed to initialize SettingsInitializationController:', error);
            throw error;
        }
    }
    
    /**
     * Coordinate with existing LiveEditEngine
     * Implements requirement 8.2: Ensure SettingsRestorer class works with new persistence system
     * Implements requirement 8.3: Fix initialization timing to prevent conflicts
     * 
     * @returns {Promise<void>}
     */
    async coordinateWithLiveEditEngine() {
        const startTime = performance.now();
        this.log('Coordinating with LiveEditEngine...');
        
        try {
            // Check if LiveEditEngine exists
            if (window.liveEditInstance) {
                this.liveEditEngine = window.liveEditInstance;
                this.log('Found existing LiveEditEngine instance');
            } else {
                // Wait for LiveEditEngine to be created
                this.liveEditEngine = await this.waitForLiveEditEngine();
            }
            
            if (!this.liveEditEngine) {
                this.log('LiveEditEngine not available, continuing without it');
                return;
            }
            
            // CRITICAL: Prevent LiveEditEngine from creating its own SettingsRestorer
            // This prevents race conditions and duplicate initialization
            await this.preventDuplicateSettingsRestorer();
            
            // Integrate with LiveEditEngine's settings cache
            await this.integrateLiveEditEngineCache();
            
            // Coordinate initialization timing to prevent conflicts
            await this.coordinateInitializationTiming();
            
            // Set up LiveEditEngine event handlers
            this.setupLiveEditEngineEventHandlers();
            
            // Override LiveEditEngine's initialization methods to use our system
            this.overrideLiveEditEngineInitialization();
            
            this.integrationMetrics.liveEditEngineTime = performance.now() - startTime;
            this.log('LiveEditEngine coordination completed', {
                duration: this.integrationMetrics.liveEditEngineTime
            });
            
        } catch (error) {
            this.log('Failed to coordinate with LiveEditEngine:', error);
            // Don't throw error - continue without LiveEditEngine integration
        }
    }
    
    /**
     * Wait for LiveEditEngine to be available
     * 
     * @returns {Promise<Object|null>} LiveEditEngine instance or null
     */
    async waitForLiveEditEngine() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds with 100ms intervals
            
            const checkForLiveEditEngine = () => {
                attempts++;
                
                if (window.liveEditInstance) {
                    this.log('LiveEditEngine found after waiting');
                    resolve(window.liveEditInstance);
                } else if (attempts >= maxAttempts) {
                    this.log('LiveEditEngine not found after waiting, continuing without it');
                    resolve(null);
                } else {
                    setTimeout(checkForLiveEditEngine, 100);
                }
            };
            
            checkForLiveEditEngine();
        });
    }
    
    /**
     * Prevent LiveEditEngine from creating its own SettingsRestorer
     * This prevents race conditions and duplicate initialization
     * Implements requirement 8.3: Fix initialization timing to prevent conflicts
     * 
     * @returns {Promise<void>}
     */
    async preventDuplicateSettingsRestorer() {
        if (!this.liveEditEngine) {
            return;
        }
        
        try {
            // Check if LiveEditEngine's init method creates a SettingsRestorer
            const originalInit = this.liveEditEngine.init;
            
            if (typeof originalInit === 'function') {
                // Override the init method to prevent SettingsRestorer creation
                this.liveEditEngine.init = function() {
                    // Store the original SettingsRestorer constructor temporarily
                    const originalSettingsRestorer = window.SettingsRestorer;
                    
                    // Temporarily disable SettingsRestorer creation
                    window.SettingsRestorer = function() {
                        console.log('🚫 SettingsRestorer creation prevented by integration system');
                        return {
                            init: () => {},
                            restoreSettings: () => Promise.resolve({}),
                            applyAllSettingsToUI: () => {}
                        };
                    };
                    
                    try {
                        // Call original init
                        const result = originalInit.call(this);
                        
                        // Restore original SettingsRestorer constructor
                        window.SettingsRestorer = originalSettingsRestorer;
                        
                        return result;
                    } catch (error) {
                        // Restore original SettingsRestorer constructor even on error
                        window.SettingsRestorer = originalSettingsRestorer;
                        throw error;
                    }
                };
                
                this.log('LiveEditEngine init method overridden to prevent duplicate SettingsRestorer');
            }
            
            // Also prevent direct SettingsRestorer instantiation during our integration
            if (window.SettingsRestorer && !window.settingsRestorer) {
                const originalConstructor = window.SettingsRestorer;
                let integrationInProgress = true;
                
                window.SettingsRestorer = function(...args) {
                    if (integrationInProgress) {
                        console.log('🚫 SettingsRestorer creation deferred during integration');
                        return {
                            init: () => {},
                            restoreSettings: () => Promise.resolve({}),
                            applyAllSettingsToUI: () => {}
                        };
                    }
                    return new originalConstructor(...args);
                };
                
                // Restore after integration completes
                setTimeout(() => {
                    integrationInProgress = false;
                    window.SettingsRestorer = originalConstructor;
                }, 5000);
            }
            
        } catch (error) {
            this.log('Failed to prevent duplicate SettingsRestorer:', error);
        }
    }
    
    /**
     * Override LiveEditEngine's initialization methods to use our system
     * Implements requirement 8.2: Ensure SettingsRestorer class works with new persistence system
     * 
     * @returns {void}
     */
    overrideLiveEditEngineInitialization() {
        if (!this.liveEditEngine || !this.initializationController) {
            return;
        }
        
        try {
            // Override loadCurrentSettings method if it exists
            if (typeof this.liveEditEngine.loadCurrentSettings === 'function') {
                const originalLoadCurrentSettings = this.liveEditEngine.loadCurrentSettings;
                
                this.liveEditEngine.loadCurrentSettings = async () => {
                    try {
                        this.log('LiveEditEngine.loadCurrentSettings called, using initialization controller');
                        
                        // Use our initialization controller instead
                        const settings = await this.initializationController.loadInitialSettings();
                        
                        // Update LiveEditEngine's cache
                        if (this.liveEditEngine.settingsCache) {
                            this.liveEditEngine.settingsCache.clear();
                            Object.entries(settings).forEach(([key, value]) => {
                                this.liveEditEngine.settingsCache.set(key, value);
                            });
                        }
                        
                        return settings;
                        
                    } catch (error) {
                        this.log('Integrated loadCurrentSettings failed:', error);
                        
                        // Fallback to original method
                        if (originalLoadCurrentSettings) {
                            return originalLoadCurrentSettings.call(this.liveEditEngine);
                        }
                        
                        return {};
                    }
                };
                
                this.log('LiveEditEngine loadCurrentSettings method overridden');
            }
            
            // Override any settings restoration methods
            if (typeof this.liveEditEngine.restoreSettingsFromStorage === 'function') {
                const originalRestoreSettingsFromStorage = this.liveEditEngine.restoreSettingsFromStorage;
                
                this.liveEditEngine.restoreSettingsFromStorage = async () => {
                    try {
                        this.log('LiveEditEngine.restoreSettingsFromStorage called, using initialization controller');
                        
                        // Use our initialization controller
                        const settings = await this.initializationController.loadInitialSettings();
                        
                        // Apply settings to UI
                        if (this.initializationController.applyCSSVariables) {
                            await this.initializationController.applyCSSVariables(settings);
                        }
                        
                        if (this.initializationController.restoreUIState) {
                            await this.initializationController.restoreUIState(settings);
                        }
                        
                        return settings;
                        
                    } catch (error) {
                        this.log('Integrated restoreSettingsFromStorage failed:', error);
                        
                        // Fallback to original method
                        if (originalRestoreSettingsFromStorage) {
                            return originalRestoreSettingsFromStorage.call(this.liveEditEngine);
                        }
                        
                        return {};
                    }
                };
                
                this.log('LiveEditEngine restoreSettingsFromStorage method overridden');
            }
            
            // Add initialization complete callback to LiveEditEngine
            this.liveEditEngine.onInitializationComplete = (detail) => {
                this.log('LiveEditEngine received initialization complete notification', detail);
                
                // Ensure LiveEditEngine is properly synchronized
                if (detail.success && this.initializationController) {
                    this.initializationController.loadInitialSettings().then((settings) => {
                        if (this.liveEditEngine.settingsCache) {
                            this.liveEditEngine.settingsCache.clear();
                            Object.entries(settings).forEach(([key, value]) => {
                                this.liveEditEngine.settingsCache.set(key, value);
                            });
                        }
                    }).catch((error) => {
                        this.log('Failed to sync LiveEditEngine after initialization complete:', error);
                    });
                }
            };
            
            this.log('LiveEditEngine initialization methods overridden');
            
        } catch (error) {
            this.log('Failed to override LiveEditEngine initialization methods:', error);
        }
    }
    
    /**
     * Integrate with LiveEditEngine's settings cache
     * 
     * @returns {Promise<void>}
     */
    async integrateLiveEditEngineCache() {
        if (!this.liveEditEngine || !this.initializationController) {
            return;
        }
        
        try {
            // Get settings from initialization controller
            const settings = await this.initializationController.loadInitialSettings();
            
            // Update LiveEditEngine's settings cache
            if (this.liveEditEngine.settingsCache) {
                // Clear existing cache
                this.liveEditEngine.settingsCache.clear();
                
                // Populate with new settings
                Object.entries(settings).forEach(([key, value]) => {
                    this.liveEditEngine.settingsCache.set(key, value);
                });
                
                this.log('LiveEditEngine settings cache updated', {
                    settingsCount: Object.keys(settings).length
                });
            }
            
            // Update localStorage through LiveEditEngine if method exists
            if (typeof this.liveEditEngine.saveToLocalStorage === 'function') {
                this.liveEditEngine.saveToLocalStorage();
                this.log('LiveEditEngine localStorage updated');
            }
            
        } catch (error) {
            this.log('Failed to integrate LiveEditEngine cache:', error);
        }
    }
    
    /**
     * Coordinate initialization timing to prevent conflicts
     * 
     * @returns {Promise<void>}
     */
    async coordinateInitializationTiming() {
        if (!this.liveEditEngine) {
            return;
        }
        
        try {
            // Ensure LiveEditEngine is properly initialized
            if (typeof this.liveEditEngine.init === 'function' && !this.liveEditEngine.isActive) {
                // Queue LiveEditEngine initialization after our controller
                await this.initializationController.queueInitializationTask(
                    async () => {
                        this.liveEditEngine.init();
                        this.log('LiveEditEngine initialized via queue');
                        return true;
                    },
                    'LiveEditEngine initialization'
                );
            }
            
            // Coordinate with LiveEditEngine's prepareEditableElements
            if (typeof this.liveEditEngine.prepareEditableElements === 'function') {
                await this.initializationController.queueInitializationTask(
                    async () => {
                        this.liveEditEngine.prepareEditableElements();
                        this.log('LiveEditEngine editable elements prepared');
                        return true;
                    },
                    'LiveEditEngine editable elements preparation'
                );
            }
            
            this.log('Initialization timing coordinated');
            
        } catch (error) {
            this.log('Failed to coordinate initialization timing:', error);
        }
    }
    
    /**
     * Set up LiveEditEngine event handlers
     */
    setupLiveEditEngineEventHandlers() {
        if (!this.liveEditEngine) {
            return;
        }
        
        // Override LiveEditEngine's saveSetting method to use our persistence system
        if (this.initializationController.persistenceManager) {
            const originalSaveSetting = this.liveEditEngine.saveSetting;
            
            this.liveEditEngine.saveSetting = async (key, value, immediate = false) => {
                try {
                    // Use our persistence manager
                    const success = await this.initializationController.persistenceManager.saveSetting(key, value, immediate);
                    
                    if (success) {
                        // Update LiveEditEngine's cache
                        if (this.liveEditEngine.settingsCache) {
                            this.liveEditEngine.settingsCache.set(key, value);
                        }
                        
                        // Broadcast to other tabs via SyncManager
                        if (window.SyncManager && typeof window.SyncManager.broadcast === 'function') {
                            window.SyncManager.broadcast(key, value);
                        }
                        
                        this.log(`Setting saved via integrated persistence: ${key} = ${value}`);
                    }
                    
                    return success;
                    
                } catch (error) {
                    this.log(`Failed to save setting via integrated persistence: ${key}`, error);
                    
                    // Fallback to original method
                    if (originalSaveSetting) {
                        return originalSaveSetting.call(this.liveEditEngine, key, value, immediate);
                    }
                    
                    return false;
                }
            };
            
            this.log('LiveEditEngine saveSetting method integrated with persistence manager');
        }
        
        // Set up event listeners for LiveEditEngine events
        window.addEventListener('woow-setting-changed', (event) => {
            if (event.detail && event.detail.source !== 'initialization') {
                this.handleLiveEditEngineSettingChange(event.detail);
            }
        });
        
        this.log('LiveEditEngine event handlers set up');
    }
    
    /**
     * Handle setting changes from LiveEditEngine
     * 
     * @param {Object} detail - Event detail object
     */
    handleLiveEditEngineSettingChange(detail) {
        const { key, value } = detail;
        
        // Update our initialization controller's cache if available
        if (this.initializationController && this.initializationController.persistenceManager) {
            this.initializationController.persistenceManager.saveSetting(key, value);
        }
        
        this.log(`LiveEditEngine setting change handled: ${key} = ${value}`);
    }
    
    /**
     * Integrate with SettingsRestorer
     * 
     * @returns {Promise<void>}
     */
    async integrateWithSettingsRestorer() {
        const startTime = performance.now();
        this.log('Integrating with SettingsRestorer...');
        
        try {
            // Check if SettingsRestorer exists
            if (window.settingsRestorer) {
                this.settingsRestorer = window.settingsRestorer;
                this.log('Found existing SettingsRestorer instance');
            } else if (window.SettingsRestorer) {
                // Create new instance if class is available
                this.settingsRestorer = new window.SettingsRestorer();
                window.settingsRestorer = this.settingsRestorer;
                this.log('Created new SettingsRestorer instance');
            } else {
                this.log('SettingsRestorer not available, continuing without it');
                return;
            }
            
            // Override SettingsRestorer's restoreSettings method
            await this.overrideSettingsRestorerMethods();
            
            // Coordinate with SettingsRestorer initialization
            await this.coordinateSettingsRestorerInitialization();
            
            this.integrationMetrics.settingsRestorerTime = performance.now() - startTime;
            this.log('SettingsRestorer integration completed', {
                duration: this.integrationMetrics.settingsRestorerTime
            });
            
        } catch (error) {
            this.log('Failed to integrate with SettingsRestorer:', error);
            // Don't throw error - continue without SettingsRestorer integration
        }
    }
    
    /**
     * Override SettingsRestorer methods to use our initialization system
     * Implements requirement 8.2: Ensure SettingsRestorer class works with new persistence system
     * 
     * @returns {Promise<void>}
     */
    async overrideSettingsRestorerMethods() {
        if (!this.settingsRestorer || !this.initializationController) {
            return;
        }
        
        try {
            // Link the initialization controller to the SettingsRestorer
            if (typeof this.settingsRestorer.setInitializationController === 'function') {
                this.settingsRestorer.setInitializationController(this.initializationController);
                this.log('SettingsRestorer linked to initialization controller');
            }
            
            // Store original methods for fallback
            const originalRestoreSettings = this.settingsRestorer.restoreSettings;
            const originalApplyAllSettingsToUI = this.settingsRestorer.applyAllSettingsToUI;
            
            // The SettingsRestorer now handles integration internally via setInitializationController
            // We don't need to override methods since it checks for the controller internally
            
            // Add callback for initialization complete events
            if (typeof this.settingsRestorer.onInitializationComplete === 'function') {
                // The SettingsRestorer already has this method, no need to override
                this.log('SettingsRestorer onInitializationComplete method available');
            }
            
            this.log('SettingsRestorer integration completed');
            
        } catch (error) {
            this.log('Failed to integrate SettingsRestorer methods:', error);
        }
    }
    
    /**
     * Coordinate SettingsRestorer initialization
     * 
     * @returns {Promise<void>}
     */
    async coordinateSettingsRestorerInitialization() {
        if (!this.settingsRestorer) {
            return;
        }
        
        try {
            // Queue SettingsRestorer operations after our initialization
            await this.initializationController.queueInitializationTask(
                async () => {
                    if (typeof this.settingsRestorer.init === 'function') {
                        this.settingsRestorer.init();
                        this.log('SettingsRestorer initialized via queue');
                    }
                    return true;
                },
                'SettingsRestorer initialization'
            );
            
            this.log('SettingsRestorer initialization coordinated');
            
        } catch (error) {
            this.log('Failed to coordinate SettingsRestorer initialization:', error);
        }
    }
    
    /**
     * Set up event coordination between all components
     */
    setupEventCoordination() {
        this.log('Setting up event coordination...');
        
        // Listen for initialization complete events
        window.addEventListener('woow-initialization-complete', this.handleInitializationComplete);
        
        // Listen for settings changes and coordinate updates
        window.addEventListener('woow-settings-changed', (event) => {
            this.handleSettingsChanged(event.detail);
        });
        
        // Listen for settings restored events
        window.addEventListener('woow-settings-restored', (event) => {
            this.handleSettingsRestored(event.detail);
        });
        
        this.log('Event coordination set up');
    }
    
    /**
     * Handle initialization complete event
     * 
     * @param {CustomEvent} event - Initialization complete event
     */
    handleInitializationComplete(event) {
        this.log('Initialization complete event received', event.detail);
        
        // Notify all integrated components
        if (this.liveEditEngine && typeof this.liveEditEngine.onInitializationComplete === 'function') {
            this.liveEditEngine.onInitializationComplete(event.detail);
        }
        
        if (this.settingsRestorer && typeof this.settingsRestorer.onInitializationComplete === 'function') {
            this.settingsRestorer.onInitializationComplete(event.detail);
        }
    }
    
    /**
     * Handle settings changed event
     * 
     * @param {Object} detail - Event detail object
     */
    handleSettingsChanged(detail) {
        const { settings, source } = detail;
        
        // Coordinate updates across all components
        if (this.liveEditEngine && this.liveEditEngine.settingsCache) {
            Object.entries(settings).forEach(([key, value]) => {
                this.liveEditEngine.settingsCache.set(key, value);
            });
        }
        
        if (this.settingsRestorer && typeof this.settingsRestorer.applyAllSettingsToUI === 'function') {
            this.settingsRestorer.applyAllSettingsToUI(settings);
        }
        
        this.log('Settings changed event coordinated', { source, settingsCount: Object.keys(settings).length });
    }
    
    /**
     * Handle settings restored event
     * 
     * @param {Object} detail - Event detail object
     */
    handleSettingsRestored(detail) {
        const { settings, source } = detail;
        
        this.log('Settings restored event received', { source, settingsCount: Object.keys(settings).length });
        
        // Ensure all components are synchronized
        this.handleSettingsChanged(detail);
    }
    
    /**
     * Validate that integration completed successfully
     * 
     * @returns {Promise<boolean>} Validation success status
     */
    async validateIntegration() {
        this.log('Validating integration...');
        
        try {
            // Check that initialization controller is working
            if (!this.initializationController || !this.initializationController.isInitialized) {
                this.log('Validation failed: SettingsInitializationController not initialized');
                return false;
            }
            
            // Check that settings can be loaded
            const settings = await this.initializationController.loadInitialSettings();
            if (!settings || Object.keys(settings).length === 0) {
                this.log('Validation warning: No settings loaded');
                // Don't fail validation for this
            }
            
            // Check component integration
            if (this.liveEditEngine) {
                if (!this.liveEditEngine.settingsCache || this.liveEditEngine.settingsCache.size === 0) {
                    this.log('Validation warning: LiveEditEngine cache is empty');
                }
            }
            
            this.log('Integration validation passed');
            return true;
            
        } catch (error) {
            this.log('Validation error:', error);
            return false;
        }
    }
    
    /**
     * Get integration status and metrics
     * 
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isIntegrated: this.isIntegrated,
            hasInitializationController: !!this.initializationController,
            hasLiveEditEngine: !!this.liveEditEngine,
            hasSettingsRestorer: !!this.settingsRestorer,
            metrics: this.integrationMetrics,
            initializationControllerStatus: this.initializationController ? this.initializationController.getStatus() : null
        };
    }
    
    /**
     * Force re-integration (for debugging or recovery)
     * 
     * @returns {Promise<boolean>} Success status
     */
    async forceReintegration() {
        this.log('Forcing re-integration...');
        
        // Reset state
        this.isIntegrated = false;
        this.integrationPromise = null;
        
        // Clear metrics
        this.integrationMetrics = {
            startTime: null,
            endTime: null,
            initControllerTime: null,
            liveEditEngineTime: null,
            settingsRestorerTime: null
        };
        
        // Re-integrate
        return await this.integrate();
    }
    
    /**
     * Cleanup method for proper disposal
     */
    destroy() {
        this.log('Destroying SettingsInitializationIntegration...');
        
        // Remove event listeners
        window.removeEventListener('woow-initialization-complete', this.handleInitializationComplete);
        
        // Cleanup components
        if (this.initializationController && typeof this.initializationController.destroy === 'function') {
            this.initializationController.destroy();
        }
        
        // Reset state
        this.isIntegrated = false;
        this.integrationPromise = null;
        this.initializationController = null;
        this.liveEditEngine = null;
        this.settingsRestorer = null;
        
        this.log('SettingsInitializationIntegration destroyed');
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
            const logMessage = `[${timestamp}] SettingsInitializationIntegration: ${message}`;
            
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
    module.exports = SettingsInitializationIntegration;
}

// Make available globally
window.SettingsInitializationIntegration = SettingsInitializationIntegration;

// Auto-initialize integration when DOM is ready
(function() {
    let integrationInstance = null;
    
    function initializeIntegration() {
        if (!integrationInstance) {
            integrationInstance = new SettingsInitializationIntegration();
            window.settingsInitializationIntegration = integrationInstance;
            
            // Start integration
            integrationInstance.integrate().then((success) => {
                if (success) {
                    console.log('✅ Settings initialization integration completed successfully');
                } else {
                    console.warn('⚠️ Settings initialization integration failed');
                }
            }).catch((error) => {
                console.error('❌ Settings initialization integration error:', error);
            });
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeIntegration);
    } else {
        // DOM is already ready
        setTimeout(initializeIntegration, 0);
    }
})();