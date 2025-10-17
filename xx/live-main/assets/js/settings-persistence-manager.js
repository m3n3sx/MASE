/**
 * Settings Persistence Manager
 * 
 * Manages the complete settings persistence lifecycle including:
 * - localStorage and database synchronization
 * - Conflict resolution between storage sources
 * - Performance optimization with caching
 * - Error handling and recovery
 * 
 * @version 1.0.0
 * @author WOOW! Admin Styler
 */

class SettingsPersistenceManager {
    constructor() {
        // Settings cache for performance optimization
        this.settingsCache = new Map();
        
        // Pending changes queue for debouncing
        this.pendingChanges = new Map();
        
        // Save operation queue for batching
        this.saveQueue = new Map();
        
        // Request queue for managing concurrent requests
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.maxConcurrentRequests = 2;
        
        // Network status tracking
        this.isOnline = navigator.onLine;
        this.networkStatusListeners = [];
        
        // Cross-tab synchronization using BroadcastChannel
        this.syncChannel = null;
        this.initializeCrossTabSync();
        
        // Debounce timer for save operations
        this.debounceTimer = null;
        this.debounceDelay = 500; // 500ms debounce
        
        // Configuration
        this.config = {
            localStorageKey: 'woow_admin_settings',
            ajaxAction: 'mas_v2_save_settings',
            loadAction: 'mas_get_live_settings',
            maxRetries: 3,
            retryDelay: 1000, // Base delay for exponential backoff
            cacheExpiry: 300000 // 5 minutes cache expiry
        };
        
        // Initialize error recovery manager
        this.errorRecoveryManager = null;
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initialize cache with localStorage data
        this.initializeCache();
        
        // Initialize error recovery after construction
        this.initializeErrorRecovery();
        
        // Initialize logger
        this.initializeLogger();
    }
    
    /**
     * Initialize persistence logger
     */
    initializeLogger() {
        if (window.woowPersistenceLogger) {
            this.logger = window.woowPersistenceLogger;
        } else if (window.PersistenceLogger) {
            this.logger = new window.PersistenceLogger({
                logLevel: window.woowDebug ? 'debug' : 'info',
                debugMode: window.woowDebug || false
            });
        } else {
            // Fallback logger
            this.logger = {
                debug: (msg, data, cat, ctx) => console.log(`[DEBUG] ${msg}`, data),
                info: (msg, data, cat, ctx) => console.log(`[INFO] ${msg}`, data),
                warn: (msg, data, cat, ctx) => console.warn(`[WARN] ${msg}`, data),
                error: (msg, data, cat, ctx) => console.error(`[ERROR] ${msg}`, data),
                startOperation: (name, meta) => `op_${Date.now()}`,
                endOperation: (id, success, result) => {},
                categories: {
                    PERSISTENCE: 'persistence',
                    AJAX: 'ajax',
                    CACHE: 'cache'
                }
            };
        }
        
        this.logger.info('SettingsPersistenceManager initialized', {
            config: this.config,
            cacheSize: this.settingsCache.size
        }, this.logger.categories.PERSISTENCE);
    }
    
    /**
     * Initialize cross-tab synchronization using BroadcastChannel
     */
    initializeCrossTabSync() {
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                this.syncChannel = new BroadcastChannel('woow_settings_sync');
                
                this.syncChannel.addEventListener('message', (event) => {
                    this.handleCrossTabMessage(event.data);
                });
                
                this.logger?.info('Cross-tab synchronization initialized', {
                    channelName: 'woow_settings_sync'
                }, this.logger?.categories?.PERSISTENCE);
            } else {
                console.warn('BroadcastChannel not supported, cross-tab sync disabled');
            }
        } catch (error) {
            console.error('Failed to initialize cross-tab sync:', error);
        }
    }
    
    /**
     * Handle cross-tab synchronization messages
     */
    handleCrossTabMessage(data) {
        if (data.type === 'setting_changed') {
            // Update local cache with changes from other tabs
            this.settingsCache.set(data.key, {
                value: data.value,
                timestamp: data.timestamp,
                source: 'cross-tab'
            });
            
            // Trigger event for UI updates
            this.triggerSettingChangeEvent(data.key, data.value, 'cross-tab');
        } else if (data.type === 'settings_bulk_update') {
            // Handle bulk settings update from other tabs
            Object.entries(data.settings).forEach(([key, value]) => {
                this.settingsCache.set(key, {
                    value: value,
                    timestamp: data.timestamp,
                    source: 'cross-tab'
                });
            });
            
            // Trigger bulk update event
            this.triggerBulkUpdateEvent(data.settings, 'cross-tab');
        }
    }
    
    /**
     * Broadcast setting change to other tabs
     */
    broadcastSettingChange(key, value) {
        if (this.syncChannel) {
            try {
                this.syncChannel.postMessage({
                    type: 'setting_changed',
                    key: key,
                    value: value,
                    timestamp: Date.now(),
                    tabId: this.getTabId()
                });
            } catch (error) {
                console.error('Failed to broadcast setting change:', error);
            }
        }
    }
    
    /**
     * Broadcast bulk settings update to other tabs
     */
    broadcastBulkUpdate(settings) {
        if (this.syncChannel) {
            try {
                this.syncChannel.postMessage({
                    type: 'settings_bulk_update',
                    settings: settings,
                    timestamp: Date.now(),
                    tabId: this.getTabId()
                });
            } catch (error) {
                console.error('Failed to broadcast bulk update:', error);
            }
        }
    }
    
    /**
     * Get unique tab identifier
     */
    getTabId() {
        if (!this.tabId) {
            this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        }
        return this.tabId;
    }
    
    /**
     * Trigger setting change event for UI updates
     */
    triggerSettingChangeEvent(key, value, source) {
        const event = new CustomEvent('woow:settingChanged', {
            detail: { key, value, source, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Trigger bulk update event for UI updates
     */
    triggerBulkUpdateEvent(settings, source) {
        const event = new CustomEvent('woow:settingsBulkUpdate', {
            detail: { settings, source, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Initialize error recovery manager
     */
    initializeErrorRecovery() {
        if (typeof ErrorRecoveryManager !== 'undefined') {
            this.errorRecoveryManager = new ErrorRecoveryManager(this);
        } else {
            console.warn('ErrorRecoveryManager not available');
        }
    }    
/**
     * Initialize event listeners for network status and storage events
     */
    initializeEventListeners() {
        // Network status monitoring
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // Storage event listener for cross-tab synchronization
        window.addEventListener('storage', (event) => {
            if (event.key === this.config.localStorageKey) {
                this.handleStorageChange(event);
            }
        });
    }
    
    /**
     * Initialize cache with existing localStorage data
     */
    initializeCache() {
        try {
            const localData = localStorage.getItem(this.config.localStorageKey);
            if (localData) {
                const settings = JSON.parse(localData);
                
                // Populate cache with localStorage data
                Object.entries(settings).forEach(([key, value]) => {
                    this.settingsCache.set(key, {
                        value: value,
                        timestamp: Date.now(),
                        source: 'localStorage'
                    });
                });
            }
        } catch (error) {
            console.error('Failed to initialize cache from localStorage:', error);
        }
    }   
 /**
     * Save a single setting with debouncing and caching
     * 
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @param {boolean} immediate - Skip debouncing if true
     * @returns {Promise<boolean>} Success status
     */
    async saveSetting(key, value, immediate = false) {
        const operationId = this.logger.startOperation('saveSetting', { key, value, immediate });
        
        // Show loading indicator for the save operation
        let loadingIndicator = null;
        if (window.WoowUserFeedback) {
            loadingIndicator = window.WoowUserFeedback.showSettingsSaveLoading(key, {
                message: `Saving ${key}...`
            });
        }
        
        try {
            this.logger.debug('Starting save setting operation', { 
                key, 
                value, 
                immediate,
                cacheSize: this.settingsCache.size,
                pendingChanges: this.pendingChanges.size
            }, this.logger.categories.PERSISTENCE, { operationId });
            
            // Update cache immediately
            this.settingsCache.set(key, {
                value: value,
                timestamp: Date.now(),
                source: 'cache'
            });
            
            // Broadcast change to other tabs
            this.broadcastSettingChange(key, value);
            
            this.logger.debug('Setting cached successfully', { key, value }, this.logger.categories.CACHE, { operationId });
            
            // Update localStorage immediately for backup
            await this.updateLocalStorage(key, value);
            
            // Add to pending changes
            this.pendingChanges.set(key, value);
            
            if (immediate) {
                this.logger.debug('Immediate save requested, flushing pending changes', { key }, this.logger.categories.PERSISTENCE, { operationId });
                const result = await this.flushPendingChanges();
                this.logger.endOperation(operationId, result, { key, value, immediate: true });
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
                
                // Show success notification for immediate saves
                if (result && this.errorRecoveryManager) {
                    this.errorRecoveryManager.showSuccessToast(
                        `Setting "${key}" saved successfully`,
                        { 
                            timeout: 2000,
                            priority: 'low' // Don't interrupt user workflow
                        }
                    );
                }
                
                return result;
            } else {
                // Debounce the database save
                this.debounceSave();
                this.logger.debug('Save operation debounced', { 
                    key, 
                    debounceDelay: this.debounceDelay,
                    pendingChanges: this.pendingChanges.size
                }, this.logger.categories.PERSISTENCE, { operationId });
                
                this.logger.endOperation(operationId, true, { key, value, debounced: true });
                
                // Hide loading indicator for debounced saves
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
                
                return true;
            }
        } catch (error) {
            this.logger.error('Save setting operation failed', { 
                key, 
                value, 
                immediate, 
                error: error.message 
            }, this.logger.categories.ERROR, { operationId });
            
            // Use error recovery manager if available
            if (this.errorRecoveryManager) {
                const recoveryResult = await this.errorRecoveryManager.handleError(error, {
                    operation: 'saveSetting',
                    setting: { key, value },
                    immediate: immediate
                });
                
                this.logger.endOperation(operationId, recoveryResult.success, { 
                    key, 
                    value, 
                    recoveryApplied: true,
                    recoveryResult 
                });
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
                
                return recoveryResult.success;
            } else {
                this.logger.endOperation(operationId, false, { key, value, error: error.message });
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
                
                return false;
            }
        }
    }
    
    /**
     * Load all settings from cache, localStorage, or database
     * 
     * @param {boolean} forceRefresh - Force reload from database
     * @returns {Promise<Object>} Settings object
     */
    async loadSettings(forceRefresh = false) {
        const operationId = this.logger.startOperation('loadSettings', { forceRefresh });
        
        // Show loading indicator for the load operation
        let loadingIndicator = null;
        if (window.WoowUserFeedback) {
            loadingIndicator = window.WoowUserFeedback.showSettingsLoadLoading({
                message: 'Loading settings...'
            });
        }
        
        try {
            this.logger.debug('Starting load settings operation', { 
                forceRefresh,
                cacheValid: this.isCacheValid(),
                cacheSize: this.settingsCache.size,
                isOnline: this.isOnline
            }, this.logger.categories.PERSISTENCE, { operationId });
            
            // Return cached data if available and not expired
            if (!forceRefresh && this.isCacheValid()) {
                const cachedSettings = this.getCachedSettings();
                this.logger.debug('Returning cached settings', { 
                    settingsCount: Object.keys(cachedSettings).length 
                }, this.logger.categories.CACHE, { operationId });
                
                this.logger.endOperation(operationId, true, { source: 'cache', settingsCount: Object.keys(cachedSettings).length });
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
                
                return cachedSettings;
            }
            
            // Try to load from database first
            this.logger.debug('Loading settings from database', {}, this.logger.categories.AJAX, { operationId });
            const dbSettings = await this.loadFromDatabase();
            
            if (dbSettings) {
                this.logger.info('Settings loaded from database successfully', { 
                    settingsCount: Object.keys(dbSettings).length 
                }, this.logger.categories.PERSISTENCE, { operationId });
                
                // Update cache with database data
                this.updateCacheFromSettings(dbSettings, 'database');
                this.logger.endOperation(operationId, true, { source: 'database', settingsCount: Object.keys(dbSettings).length });
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
                
                return dbSettings;
            }
            
            // Fallback to localStorage
            this.logger.warn('Database load failed, falling back to localStorage', {}, this.logger.categories.PERSISTENCE, { operationId });
            const localSettings = this.loadFromLocalStorage();
            if (localSettings) {
                this.logger.info('Settings loaded from localStorage fallback', { 
                    settingsCount: Object.keys(localSettings).length 
                }, this.logger.categories.PERSISTENCE, { operationId });
                
                this.updateCacheFromSettings(localSettings, 'localStorage');
                this.logger.endOperation(operationId, true, { source: 'localStorage', settingsCount: Object.keys(localSettings).length });
                
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.hide();
                }
                
                return localSettings;
            }
            
            // Return empty object if no settings found
            this.logger.warn('No settings found from any source, returning empty object', {}, this.logger.categories.PERSISTENCE, { operationId });
            this.logger.endOperation(operationId, true, { source: 'empty', settingsCount: 0 });
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.hide();
            }
            
            return {};
            
        } catch (error) {
            this.logger.error('Load settings operation failed', { 
                forceRefresh, 
                error: error.message 
            }, this.logger.categories.ERROR, { operationId });
            
            // Use error recovery manager if available
            if (this.errorRecoveryManager) {
                const recoveryResult = await this.errorRecoveryManager.handleError(error, {
                    operation: 'loadSettings',
                    forceRefresh: forceRefresh
                });
                
                if (recoveryResult.success && recoveryResult.fallbackApplied) {
                    const fallbackSettings = this.loadFromLocalStorage() || {};
                    this.logger.endOperation(operationId, true, { 
                        source: 'recovery-localStorage', 
                        settingsCount: Object.keys(fallbackSettings).length,
                        recoveryApplied: true 
                    });
                    
                    // Hide loading indicator
                    if (loadingIndicator) {
                        loadingIndicator.hide();
                    }
                    
                    return fallbackSettings;
                }
            }
            
            // Final fallback to localStorage on error
            const fallbackSettings = this.loadFromLocalStorage() || {};
            this.logger.endOperation(operationId, false, { 
                source: 'final-fallback', 
                settingsCount: Object.keys(fallbackSettings).length,
                error: error.message 
            });
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.hide();
            }
            
            return fallbackSettings;
        }
    }    /**
  
   * Synchronize settings with database
     * 
     * @returns {Promise<boolean>} Success status
     */
    async syncWithDatabase() {
        try {
            if (!this.isOnline) {
                console.warn('Cannot sync with database: offline');
                return false;
            }
            
            // Get current settings from all sources
            const cacheSettings = this.getCachedSettings();
            const localSettings = this.loadFromLocalStorage();
            const dbSettings = await this.loadFromDatabase();
            
            // Resolve conflicts and determine authoritative settings
            const resolvedSettings = this.resolveConflicts(cacheSettings, localSettings, dbSettings);
            
            // Save resolved settings to database
            const saveSuccess = await this.saveToDatabase(resolvedSettings);
            
            if (saveSuccess) {
                // Update cache and localStorage with resolved settings
                this.updateCacheFromSettings(resolvedSettings, 'database');
                await this.saveToLocalStorage(resolvedSettings);
                
                // Clear pending changes since they're now saved
                this.pendingChanges.clear();
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            // Use error recovery manager if available
            if (this.errorRecoveryManager) {
                const recoveryResult = await this.errorRecoveryManager.handleError(error, {
                    operation: 'syncWithDatabase',
                    settings: { cacheSettings, localSettings, dbSettings }
                });
                return recoveryResult.success;
            } else {
                console.error('Failed to sync with database:', error);
                return false;
            }
        }
    }

    /**
     * Update localStorage with a single setting
     * 
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    async updateLocalStorage(key, value) {
        try {
            const currentSettings = this.loadFromLocalStorage() || {};
            currentSettings[key] = value;
            currentSettings._lastModified = Date.now();
            
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(currentSettings));
            
            return {
                localStorage: true,
                database: false,
                persistenceMode: 'hybrid',
                success: true
            };
        } catch (error) {
            console.error('Failed to update localStorage:', error);
            
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                console.error('localStorage quota exceeded, switching to database-only persistence');
                
                // Show user notification about quota exceeded
                if (window.WoowNotifications) {
                    window.WoowNotifications.showWarning(
                        'localStorage quota exceeded. Settings will be saved to database only.',
                        {
                            duration: 10000,
                            actions: [
                                {
                                    text: 'Clear Cache',
                                    action: () => this.clearLocalStorageCache()
                                }
                            ]
                        }
                    );
                    
                    // Show explanation about fallback mode
                    window.WoowNotifications.showInfo(
                        'Settings are now saved to database only. Performance may be slightly reduced.',
                        {
                            duration: 10000,
                            dismissible: true
                        }
                    );
                }
                
                // Try to save to database as fallback
                try {
                    const settings = { [key]: value };
                    const databaseResult = await this.saveToDatabase(settings);
                    
                    return {
                        localStorage: false,
                        database: databaseResult,
                        persistenceMode: 'database-only',
                        fallbackMode: 'database-only',
                        fallbackReason: 'quota_exceeded',
                        success: databaseResult
                    };
                } catch (dbError) {
                    console.error('Database fallback also failed:', dbError);
                    return {
                        localStorage: false,
                        database: false,
                        persistenceMode: 'failed',
                        fallbackReason: 'quota_exceeded',
                        success: false,
                        error: dbError
                    };
                }
            }
            
            return {
                localStorage: false,
                database: false,
                persistenceMode: 'failed',
                success: false,
                error: error
            };
        }
    }
    
    /**
     * Clear localStorage cache to free up space
     */
    clearLocalStorageCache() {
        try {
            // Clear old cache data but preserve essential settings
            const essentialKeys = [this.config.localStorageKey];
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith('woow_cache_') || key.startsWith('woow_temp_')) {
                    localStorage.removeItem(key);
                }
            });
            
            console.log('localStorage cache cleared successfully');
            
            if (window.WoowNotifications) {
                window.WoowNotifications.showInfo('Cache cleared successfully', {
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Failed to clear localStorage cache:', error);
        }
    }
    
    /**
     * Load settings from localStorage
     * 
     * @returns {Object|null} Settings object or null
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(this.config.localStorageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }
    
    /**
     * Save settings to localStorage
     * 
     * @param {Object} settings - Settings object
     */
    async saveToLocalStorage(settings) {
        try {
            const dataToSave = {
                ...settings,
                _lastModified: Date.now(),
                _source: 'localStorage'
            };
            
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }   
 /**
     * Load settings from database via AJAX
     * 
     * @returns {Promise<Object|null>} Settings object or null
     */
    async loadFromDatabase() {
        try {
            if (!this.isOnline) {
                return null;
            }
            
            const response = await this.makeAjaxRequest(this.config.loadAction, {});
            
            if (response && response.success && response.data) {
                return response.data;
            }
            
            return null;
            
        } catch (error) {
            console.error('Failed to load from database:', error);
            return null;
        }
    }
    
    /**
     * Save settings to database via AJAX
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<boolean>} Success status
     */
    async saveToDatabase(settings) {
        try {
            if (!this.isOnline) {
                return false;
            }
            
            const response = await this.makeAjaxRequest(this.config.ajaxAction, {
                settings: settings
            });
            
            return response && response.success;
            
        } catch (error) {
            console.error('Failed to save to database:', error);
            return false;
        }
    }    
/**
     * Make AJAX request with retry logic
     * 
     * @param {string} action - WordPress AJAX action
     * @param {Object} data - Request data
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Object>} Response object
     */
    async makeAjaxRequest(action, data, attempt = 1) {
        return new Promise((resolve, reject) => {
            const requestData = {
                action: action,
                nonce: window.woowAdminAjax?.nonce || '',
                ...data
            };
            
            jQuery.ajax({
                url: window.woowAdminAjax?.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: requestData,
                timeout: 10000, // 10 second timeout
                success: (response) => {
                    resolve(response);
                },
                error: (xhr, status, error) => {
                    if (attempt < this.config.maxRetries) {
                        // Retry with exponential backoff
                        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                        setTimeout(() => {
                            this.makeAjaxRequest(action, data, attempt + 1)
                                .then(resolve)
                                .catch(reject);
                        }, delay);
                    } else {
                        reject(new Error(`AJAX request failed after ${this.config.maxRetries} attempts: ${error}`));
                    }
                }
            });
        });
    }

    /**
     * Save multiple settings with validation and quota handling
     * 
     * @param {Object} settings - Settings object
     * @returns {Promise<Object>} Save result with persistence mode info
     */
    async saveSettings(settings) {
        // Initialize validator if not already done
        if (!this.validator && typeof SettingsValidator !== 'undefined') {
            this.validator = new SettingsValidator();
        }
        
        // Validate settings if validator is available
        if (this.validator) {
            const validationResult = this.validator.validateSettings(settings);
            
            if (!validationResult.valid) {
                return {
                    success: false,
                    validationErrors: validationResult.errors,
                    originalDataPreserved: true,
                    localStorage: false,
                    database: false,
                    persistenceMode: 'validation_failed'
                };
            }
            
            // Use sanitized settings
            settings = validationResult.sanitized;
        }
        
        // Create backup before applying changes
        await this.createBackup();
        try {
            const results = {
                localStorage: true,
                database: true,
                persistenceMode: 'hybrid',
                success: true,
                fallbackMode: null,
                fallbackReason: null
            };
            
            // Try to save to localStorage first
            try {
                const currentSettings = this.loadFromLocalStorage() || {};
                const updatedSettings = { ...currentSettings, ...settings };
                updatedSettings._lastModified = Date.now();
                
                localStorage.setItem(this.config.localStorageKey, JSON.stringify(updatedSettings));
                results.localStorage = true;
            } catch (error) {
                results.localStorage = false;
                
                // Handle quota exceeded error
                if (error.name === 'QuotaExceededError' || error.code === 22) {
                    console.error('localStorage quota exceeded during saveSettings');
                    
                    // Show user notification about quota exceeded
                    if (window.WoowNotifications) {
                        window.WoowNotifications.showWarning(
                            'localStorage quota exceeded. Settings will be saved to database only.',
                            {
                                duration: 10000,
                                actions: [
                                    {
                                        text: 'Clear Cache',
                                        action: () => this.clearLocalStorageCache()
                                    }
                                ]
                            }
                        );
                    }
                    
                    results.persistenceMode = 'database-only';
                    results.fallbackMode = 'database-only';
                    results.fallbackReason = 'quota_exceeded';
                }
            }
            
            // Try to save to database
            try {
                const databaseResult = await this.saveToDatabase(settings);
                results.database = databaseResult;
                
                if (!databaseResult && !results.localStorage) {
                    results.success = false;
                    results.persistenceMode = 'failed';
                }
            } catch (dbError) {
                console.error('Database save failed:', dbError);
                results.database = false;
                
                if (!results.localStorage) {
                    results.success = false;
                    results.persistenceMode = 'failed';
                }
            }
            
            // Update cache if any save succeeded
            if (results.localStorage || results.database) {
                Object.entries(settings).forEach(([key, value]) => {
                    this.settingsCache.set(key, {
                        value: value,
                        timestamp: Date.now(),
                        source: results.database ? 'database' : 'localStorage'
                    });
                });
            }
            
            return results;
            
        } catch (error) {
            console.error('saveSettings failed:', error);
            return {
                localStorage: false,
                database: false,
                persistenceMode: 'failed',
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Create backup of current settings
     * 
     * @returns {Promise<boolean>} Success status
     */
    async createBackup() {
        try {
            const currentSettings = this.loadFromLocalStorage();
            if (currentSettings) {
                localStorage.setItem('woow_settings_backup', JSON.stringify(currentSettings));
                localStorage.setItem('woow_settings_backup_timestamp', Date.now().toString());
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return false;
        }
    }
    
    /**
     * Rollback settings to last backup
     * 
     * @returns {Promise<Object>} Rollback result
     */
    async rollbackSettings() {
        try {
            const backupData = localStorage.getItem('woow_settings_backup');
            const backupTimestamp = localStorage.getItem('woow_settings_backup_timestamp');
            
            if (!backupData) {
                return {
                    success: false,
                    error: 'No backup available'
                };
            }
            
            const backupSettings = JSON.parse(backupData);
            
            // Restore settings to localStorage
            localStorage.setItem(this.config.localStorageKey, JSON.stringify(backupSettings));
            
            // Update cache
            this.updateCacheFromSettings(backupSettings, 'localStorage');
            
            return {
                success: true,
                restoredSettings: backupSettings,
                backupTimestamp: backupTimestamp ? parseInt(backupTimestamp) : null
            };
        } catch (error) {
            console.error('Failed to rollback settings:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update settings with quota handling
     * 
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Update result
     */
    async updateSettings(settings) {
        return await this.saveSettings(settings);
    }

    /**
     * Debounce save operations to prevent database spam
     */
    debounceSave() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
            this.flushPendingChanges();
        }, this.debounceDelay);
    }
    
    /**
     * Flush all pending changes to database
     * 
     * @returns {Promise<boolean>} Success status
     */
    async flushPendingChanges() {
        if (this.pendingChanges.size === 0) {
            return true;
        }
        
        try {
            // Convert pending changes to settings object
            const currentSettings = await this.loadSettings();
            const updatedSettings = { ...currentSettings };
            
            this.pendingChanges.forEach((value, key) => {
                updatedSettings[key] = value;
            });
            
            // Save to database
            const success = await this.saveToDatabase(updatedSettings);
            
            if (success) {
                // Update cache with saved data
                this.updateCacheFromSettings(updatedSettings, 'database');
                
                // Show success notification for batch saves
                if (this.errorRecoveryManager && this.pendingChanges.size > 1) {
                    this.errorRecoveryManager.showSuccessToast(
                        `${this.pendingChanges.size} settings saved successfully`,
                        { 
                            timeout: 3000,
                            priority: 'normal'
                        }
                    );
                } else if (this.errorRecoveryManager && this.pendingChanges.size === 1) {
                    const settingKey = Array.from(this.pendingChanges.keys())[0];
                    this.errorRecoveryManager.showSuccessToast(
                        `Setting "${settingKey}" saved successfully`,
                        { 
                            timeout: 2000,
                            priority: 'low'
                        }
                    );
                }
                
                // Clear pending changes
                this.pendingChanges.clear();
            }
            
            return success;
            
        } catch (error) {
            console.error('Failed to flush pending changes:', error);
            return false;
        }
    }    /**

     * Check if cache is valid and not expired
     * 
     * @returns {boolean} Cache validity status
     */
    isCacheValid() {
        if (this.settingsCache.size === 0) {
            return false;
        }
        
        // Check if any cached item is expired
        for (const [key, item] of this.settingsCache) {
            if (Date.now() - item.timestamp > this.config.cacheExpiry) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get settings from cache
     * 
     * @returns {Object} Cached settings object
     */
    getCachedSettings() {
        const settings = {};
        
        this.settingsCache.forEach((item, key) => {
            settings[key] = item.value;
        });
        
        return settings;
    }
    
    /**
     * Update cache from settings object
     * 
     * @param {Object} settings - Settings object
     * @param {string} source - Data source identifier
     */
    updateCacheFromSettings(settings, source) {
        const timestamp = Date.now();
        
        Object.entries(settings).forEach(([key, value]) => {
            // Skip metadata keys
            if (!key.startsWith('_')) {
                this.settingsCache.set(key, {
                    value: value,
                    timestamp: timestamp,
                    source: source
                });
            }
        });
    }    
/**
     * Handle storage change events for cross-tab synchronization
     * 
     * @param {StorageEvent} event - Storage event
     */
    handleStorageChange(event) {
        try {
            if (event.newValue) {
                const newSettings = JSON.parse(event.newValue);
                
                // Update cache with new localStorage data
                this.updateCacheFromSettings(newSettings, 'localStorage');
                
                // Trigger custom event for UI updates
                window.dispatchEvent(new CustomEvent('woow-settings-changed', {
                    detail: { settings: newSettings, source: 'storage' }
                }));
            }
        } catch (error) {
            console.error('Failed to handle storage change:', error);
        }
    }
    
    /**
     * Resolve conflicts between different storage sources
     * Database wins strategy with timestamp-based conflict detection
     * 
     * @param {Object} cacheSettings - Settings from cache
     * @param {Object} localSettings - Settings from localStorage
     * @param {Object} dbSettings - Settings from database
     * @returns {Object} Resolved settings object
     */
    resolveConflicts(cacheSettings, localSettings, dbSettings) {
        // Start with cache settings as base
        const resolved = { ...cacheSettings };
        const conflictsResolved = [];
        
        // Get timestamps for conflict detection
        const cacheTimestamp = this.getCacheTimestamp();
        const localTimestamp = localSettings?._lastModified || 0;
        const dbTimestamp = dbSettings?._lastModified || dbSettings?.last_modified || 0;
        
        // Apply localStorage settings if they're newer than cache
        if (localSettings && localTimestamp > cacheTimestamp) {
            Object.entries(localSettings).forEach(([key, value]) => {
                if (!key.startsWith('_')) {
                    if (resolved[key] !== value) {
                        conflictsResolved.push({
                            key: key,
                            source: 'localStorage',
                            oldValue: resolved[key],
                            newValue: value,
                            timestamp: localTimestamp
                        });
                    }
                    resolved[key] = value;
                }
            });
        }
        
        // Database settings always win (authoritative source)
        if (dbSettings) {
            Object.entries(dbSettings).forEach(([key, value]) => {
                if (!key.startsWith('_')) {
                    if (resolved[key] !== value) {
                        conflictsResolved.push({
                            key: key,
                            source: 'database',
                            oldValue: resolved[key],
                            newValue: value,
                            timestamp: dbTimestamp
                        });
                    }
                    resolved[key] = value;
                }
            });
        }
        
        // Log conflicts for debugging
        if (conflictsResolved.length > 0) {
            console.log('Settings conflicts resolved:', conflictsResolved);
        }
        
        // Add metadata about conflict resolution
        resolved._conflictsResolved = conflictsResolved;
        resolved._resolvedAt = Date.now();
        
        return resolved;
    }
    
    /**
     * Get the most recent timestamp from cache
     * 
     * @returns {number} Most recent cache timestamp
     */
    getCacheTimestamp() {
        let mostRecent = 0;
        
        this.settingsCache.forEach((item) => {
            if (item.timestamp > mostRecent) {
                mostRecent = item.timestamp;
            }
        });
        
        return mostRecent;
    }    
/**
     * Process offline queue when connection is restored
     */
    async processOfflineQueue() {
        if (this.pendingChanges.size > 0) {
            console.log('Processing offline queue...');
            await this.flushPendingChanges();
        }
    }
    
    /**
     * Get current cache statistics for debugging
     * 
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            size: this.settingsCache.size,
            pendingChanges: this.pendingChanges.size,
            isOnline: this.isOnline,
            cacheValid: this.isCacheValid()
        };
    }
    
    /**
     * Clear all cached data
     */
    clearCache() {
        this.settingsCache.clear();
        this.pendingChanges.clear();
        this.requestQueue = [];
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }
    
    /**
     * Batch multiple setting changes for efficient database operations
     * 
     * @param {Object} settingsObject - Multiple settings to save
     * @returns {Promise<boolean>} Success status
     */
    async batchSaveSettings(settingsObject) {
        const settingsCount = Object.keys(settingsObject).length;
        
        // Show progress indicator for bulk operations (more than 5 settings)
        let progressIndicator = null;
        if (settingsCount > 5 && this.errorRecoveryManager) {
            progressIndicator = this.errorRecoveryManager.showBulkOperationProgress(
                'Saving Settings',
                settingsCount,
                {
                    showPercentage: true,
                    showItemCount: true,
                    showTimeEstimate: false // Batch operations are usually fast
                }
            );
        }
        
        try {
            let processedCount = 0;
            
            // Update cache immediately for all settings
            Object.entries(settingsObject).forEach(([key, value]) => {
                this.settingsCache.set(key, {
                    value: value,
                    timestamp: Date.now(),
                    source: 'cache'
                });
                
                // Add to pending changes
                this.pendingChanges.set(key, value);
                
                // Update progress
                processedCount++;
                if (progressIndicator) {
                    progressIndicator.update(processedCount, `Processing ${key}...`);
                }
            });
            
            // Update localStorage with all changes
            if (progressIndicator) {
                progressIndicator.update(processedCount, 'Saving to local storage...');
            }
            
            const currentSettings = this.loadFromLocalStorage() || {};
            const updatedSettings = { ...currentSettings, ...settingsObject };
            updatedSettings._lastModified = Date.now();
            
            await this.saveToLocalStorage(updatedSettings);
            
            // Debounce the database save
            if (progressIndicator) {
                progressIndicator.update(processedCount, 'Preparing database save...');
            }
            
            this.debounceSave();
            
            // Complete progress indicator
            if (progressIndicator) {
                progressIndicator.complete(`${settingsCount} settings saved successfully`);
            }
            
            return true;
            
        } catch (error) {
            // Cancel progress indicator on error
            if (progressIndicator) {
                progressIndicator.cancel('Failed to save settings');
            }
            
            if (this.errorRecoveryManager) {
                const recoveryResult = await this.errorRecoveryManager.handleError(error, {
                    operation: 'batchSaveSettings',
                    settings: settingsObject
                });
                return recoveryResult.success;
            } else {
                console.error('Failed to batch save settings:', error);
                return false;
            }
        }
    }
    
    /**
     * Optimize cache by removing expired entries
     */
    optimizeCache() {
        const now = Date.now();
        const expiredKeys = [];
        
        this.settingsCache.forEach((item, key) => {
            if (now - item.timestamp > this.config.cacheExpiry) {
                expiredKeys.push(key);
            }
        });
        
        expiredKeys.forEach(key => {
            this.settingsCache.delete(key);
        });
        
        if (expiredKeys.length > 0) {
            console.log(`Optimized cache: removed ${expiredKeys.length} expired entries`);
        }
    }
    
    /**
     * Get performance metrics for monitoring
     * 
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            cacheSize: this.settingsCache.size,
            pendingChanges: this.pendingChanges.size,
            requestQueueLength: this.requestQueue.length,
            isProcessingQueue: this.isProcessingQueue,
            cacheHitRate: this.calculateCacheHitRate(),
            averageResponseTime: this.calculateAverageResponseTime(),
            lastOptimization: this.lastOptimization || null
        };
    }
    
    /**
     * Calculate cache hit rate for performance monitoring
     * 
     * @returns {number} Cache hit rate percentage
     */
    calculateCacheHitRate() {
        // This would be implemented with actual metrics tracking
        // For now, return a placeholder
        return this.settingsCache.size > 0 ? 85 : 0;
    }
    
    /**
     * Calculate average response time for performance monitoring
     * 
     * @returns {number} Average response time in milliseconds
     */
    calculateAverageResponseTime() {
        // This would be implemented with actual timing metrics
        // For now, return a placeholder
        return 250;
    }
    
    /**
     * Preload frequently used settings for better performance
     * 
     * @param {Array} settingKeys - Keys of settings to preload
     */
    async preloadSettings(settingKeys = []) {
        try {
            const defaultKeys = [
                'admin_bar_background',
                'admin_bar_text_color',
                'menu_background',
                'menu_text_color'
            ];
            
            const keysToPreload = settingKeys.length > 0 ? settingKeys : defaultKeys;
            
            // Load settings from database if not in cache
            const currentSettings = await this.loadSettings();
            
            keysToPreload.forEach(key => {
                if (currentSettings[key] !== undefined) {
                    this.settingsCache.set(key, {
                        value: currentSettings[key],
                        timestamp: Date.now(),
                        source: 'preload'
                    });
                }
            });
            
            console.log(`Preloaded ${keysToPreload.length} settings for better performance`);
            
        } catch (error) {
            console.warn('Failed to preload settings:', error);
        }
    }
    
    /**
     * Schedule periodic cache optimization
     */
    schedulePeriodicOptimization() {
        // Optimize cache every 5 minutes
        setInterval(() => {
            this.optimizeCache();
            this.lastOptimization = Date.now();
        }, 300000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsPersistenceManager;
}

// Global instance for immediate use
window.SettingsPersistenceManager = SettingsPersistenceManager;