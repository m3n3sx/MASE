/**
 * Persistence Diagnostic Tools
 * 
 * Comprehensive diagnostic dashboard for troubleshooting persistence issues.
 * Provides tools to inspect localStorage, database, and CSS variable states.
 * 
 * @package WOOW! Admin Styler
 * @version 1.0.0
 * @author WOOW! Admin Styler Team
 */

class PersistenceDiagnosticTools {
    constructor() {
        // References to other components
        this.persistenceManager = null;
        this.logger = null;
        this.cssVariableManager = null;
        
        // Diagnostic state
        this.isInitialized = false;
        this.diagnosticResults = {};
        this.lastDiagnosticRun = null;
        
        // UI elements
        this.dashboardElement = null;
        this.isVisible = false;
        
        // Configuration
        this.config = {
            autoRefreshInterval: 5000, // 5 seconds
            maxLogEntries: 100,
            enableAutoRefresh: false,
            debugMode: window.woowDebug || false
        };
        
        // Initialize the diagnostic tools
        this.initialize();
    }
    
    /**
     * Initialize diagnostic tools
     */
    initialize() {
        // Get references to other components
        this.initializeReferences();
        
        // Create diagnostic dashboard UI
        this.createDashboardUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Run initial diagnostics
        this.runDiagnostics();
        
        this.isInitialized = true;
        
        if (this.logger) {
            this.logger.info('Persistence diagnostic tools initialized', {
                config: this.config
            }, this.logger.categories.INITIALIZATION);
        }
    }
    
    /**
     * Initialize references to other components
     */
    initializeReferences() {
        // Get persistence manager
        if (window.SettingsPersistenceManager && window.settingsPersistenceManager) {
            this.persistenceManager = window.settingsPersistenceManager;
        } else if (window.SettingsPersistenceManager) {
            this.persistenceManager = new window.SettingsPersistenceManager();
        }
        
        // Get logger
        if (window.woowPersistenceLogger) {
            this.logger = window.woowPersistenceLogger;
        } else if (window.PersistenceLogger) {
            this.logger = new window.PersistenceLogger();
        }
        
        // Get CSS variable manager
        if (window.CSSVariableManager) {
            this.cssVariableManager = new window.CSSVariableManager();
        }
    }
    
    /**
     * Create diagnostic dashboard UI
     */
    createDashboardUI() {
        // Create main dashboard container
        this.dashboardElement = document.createElement('div');
        this.dashboardElement.id = 'woow-diagnostic-dashboard';
        this.dashboardElement.className = 'woow-diagnostic-dashboard';
        this.dashboardElement.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: #fff;
            border: 1px solid #ccd0d4;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            display: none;
            overflow: hidden;
        `;
        
        // Create dashboard content
        this.dashboardElement.innerHTML = this.createDashboardHTML();
        
        // Add to page
        document.body.appendChild(this.dashboardElement);
        
        // Create toggle button
        this.createToggleButton();
    }
    
    /**
     * Create toggle button for dashboard
     */
    createToggleButton() {
        const toggleButton = document.createElement('button');
        toggleButton.id = 'woow-diagnostic-toggle';
        toggleButton.innerHTML = '🔧 Diagnostics';
        toggleButton.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            background: #0073aa;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 3px;
            cursor: pointer;
            z-index: 999998;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        `;
        
        toggleButton.addEventListener('click', () => {
            this.toggleDashboard();
        });
        
        document.body.appendChild(toggleButton);
    }
    
    /**
     * Create dashboard HTML content
     * 
     * @returns {string} Dashboard HTML
     */
    createDashboardHTML() {
        return `
            <div class="diagnostic-header" style="background: #23282d; color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 14px;">🔧 Persistence Diagnostics</h3>
                <div>
                    <button id="refresh-diagnostics" style="background: #0073aa; color: white; border: none; padding: 4px 8px; border-radius: 2px; cursor: pointer; margin-right: 8px;">Refresh</button>
                    <button id="close-diagnostics" style="background: #dc3232; color: white; border: none; padding: 4px 8px; border-radius: 2px; cursor: pointer;">×</button>
                </div>
            </div>
            
            <div class="diagnostic-content" style="max-height: 70vh; overflow-y: auto;">
                <!-- System Status -->
                <div class="diagnostic-section" style="border-bottom: 1px solid #e1e1e1; padding: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: #23282d; font-size: 13px;">📊 System Status</h4>
                    <div id="system-status-content">Loading...</div>
                </div>
                
                <!-- Persistence Flow -->
                <div class="diagnostic-section" style="border-bottom: 1px solid #e1e1e1; padding: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: #23282d; font-size: 13px;">🔄 Persistence Flow</h4>
                    <div id="persistence-flow-content">Loading...</div>
                </div>
                
                <!-- Storage States -->
                <div class="diagnostic-section" style="border-bottom: 1px solid #e1e1e1; padding: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: #23282d; font-size: 13px;">💾 Storage States</h4>
                    <div id="storage-states-content">Loading...</div>
                </div>
                
                <!-- CSS Variables -->
                <div class="diagnostic-section" style="border-bottom: 1px solid #e1e1e1; padding: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: #23282d; font-size: 13px;">🎨 CSS Variables</h4>
                    <div id="css-variables-content">Loading...</div>
                </div>
                
                <!-- Recent Logs -->
                <div class="diagnostic-section" style="border-bottom: 1px solid #e1e1e1; padding: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: #23282d; font-size: 13px;">📝 Recent Logs</h4>
                    <div id="recent-logs-content">Loading...</div>
                </div>
                
                <!-- Performance Metrics -->
                <div class="diagnostic-section" style="padding: 12px;">
                    <h4 style="margin: 0 0 8px 0; color: #23282d; font-size: 13px;">⚡ Performance</h4>
                    <div id="performance-content">Loading...</div>
                </div>
            </div>
            
            <div class="diagnostic-footer" style="background: #f1f1f1; padding: 8px 12px; font-size: 11px; color: #666;">
                Last updated: <span id="last-updated">Never</span>
                <span style="float: right;">
                    <label style="margin-right: 8px;">
                        <input type="checkbox" id="auto-refresh" ${this.config.enableAutoRefresh ? 'checked' : ''}> Auto-refresh
                    </label>
                </span>
            </div>
        `;
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupDashboardEventListeners();
        });
        
        // If DOM is already ready
        if (document.readyState !== 'loading') {
            this.setupDashboardEventListeners();
        }
        
        // Listen for settings changes
        window.addEventListener('woow-settings-changed', () => {
            if (this.isVisible) {
                this.runDiagnostics();
            }
        });
        
        // Listen for persistence operations
        window.addEventListener('woow-setting-saved', () => {
            if (this.isVisible) {
                this.runDiagnostics();
            }
        });
    }
    
    /**
     * Set up dashboard-specific event listeners
     */
    setupDashboardEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-diagnostics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.runDiagnostics();
            });
        }
        
        // Close button
        const closeBtn = document.getElementById('close-diagnostics');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideDashboard();
            });
        }
        
        // Auto-refresh checkbox
        const autoRefreshCheckbox = document.getElementById('auto-refresh');
        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', (e) => {
                this.config.enableAutoRefresh = e.target.checked;
                this.setupAutoRefresh();
            });
        }
    }
    
    /**
     * Toggle dashboard visibility
     */
    toggleDashboard() {
        if (this.isVisible) {
            this.hideDashboard();
        } else {
            this.showDashboard();
        }
    }
    
    /**
     * Show diagnostic dashboard
     */
    showDashboard() {
        if (this.dashboardElement) {
            this.dashboardElement.style.display = 'block';
            this.isVisible = true;
            
            // Run diagnostics when showing
            this.runDiagnostics();
            
            // Set up auto-refresh if enabled
            this.setupAutoRefresh();
            
            if (this.logger) {
                this.logger.info('Diagnostic dashboard shown', {}, this.logger.categories.UI);
            }
        }
    }
    
    /**
     * Hide diagnostic dashboard
     */
    hideDashboard() {
        if (this.dashboardElement) {
            this.dashboardElement.style.display = 'none';
            this.isVisible = false;
            
            // Clear auto-refresh
            if (this.autoRefreshInterval) {
                clearInterval(this.autoRefreshInterval);
                this.autoRefreshInterval = null;
            }
            
            if (this.logger) {
                this.logger.info('Diagnostic dashboard hidden', {}, this.logger.categories.UI);
            }
        }
    }
    
    /**
     * Set up auto-refresh functionality
     */
    setupAutoRefresh() {
        // Clear existing interval
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        // Set up new interval if enabled
        if (this.config.enableAutoRefresh && this.isVisible) {
            this.autoRefreshInterval = setInterval(() => {
                this.runDiagnostics();
            }, this.config.autoRefreshInterval);
        }
    }
    
    /**
     * Run comprehensive diagnostics
     */
    async runDiagnostics() {
        const startTime = performance.now();
        
        try {
            // Run all diagnostic checks
            const results = {
                systemStatus: await this.checkSystemStatus(),
                persistenceFlow: await this.checkPersistenceFlow(),
                storageStates: await this.checkStorageStates(),
                cssVariables: await this.checkCSSVariables(),
                recentLogs: this.getRecentLogs(),
                performance: this.getPerformanceMetrics()
            };
            
            this.diagnosticResults = results;
            this.lastDiagnosticRun = Date.now();
            
            // Update UI
            this.updateDashboardContent(results);
            
            const duration = performance.now() - startTime;
            
            if (this.logger) {
                this.logger.debug('Diagnostics completed', {
                    duration: duration,
                    resultsCount: Object.keys(results).length
                }, this.logger.categories.PERFORMANCE);
            }
            
        } catch (error) {
            if (this.logger) {
                this.logger.error('Diagnostics failed', {
                    error: error.message
                }, this.logger.categories.ERROR);
            }
            
            this.updateDashboardContent({
                error: 'Diagnostics failed: ' + error.message
            });
        }
    }
    
    /**
     * Check system status
     * 
     * @returns {Promise<Object>} System status information
     */
    async checkSystemStatus() {
        const status = {
            timestamp: Date.now(),
            online: navigator.onLine,
            components: {
                persistenceManager: !!this.persistenceManager,
                logger: !!this.logger,
                cssVariableManager: !!this.cssVariableManager,
                jquery: typeof jQuery !== 'undefined',
                woowAdminAjax: !!window.woowAdminAjax
            },
            browser: {
                userAgent: navigator.userAgent,
                localStorage: this.testLocalStorage(),
                sessionStorage: this.testSessionStorage(),
                cookies: navigator.cookieEnabled
            },
            page: {
                url: window.location.href,
                readyState: document.readyState,
                title: document.title
            }
        };
        
        // Check persistence manager status
        if (this.persistenceManager) {
            status.persistenceManager = {
                cacheSize: this.persistenceManager.settingsCache?.size || 0,
                pendingChanges: this.persistenceManager.pendingChanges?.size || 0,
                isOnline: this.persistenceManager.isOnline,
                config: this.persistenceManager.config
            };
        }
        
        return status;
    }
    
    /**
     * Test localStorage functionality
     * 
     * @returns {boolean} Whether localStorage is working
     */
    testLocalStorage() {
        try {
            const testKey = 'woow_test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            const result = localStorage.getItem(testKey) === 'test';
            localStorage.removeItem(testKey);
            return result;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Test sessionStorage functionality
     * 
     * @returns {boolean} Whether sessionStorage is working
     */
    testSessionStorage() {
        try {
            const testKey = 'woow_test_' + Date.now();
            sessionStorage.setItem(testKey, 'test');
            const result = sessionStorage.getItem(testKey) === 'test';
            sessionStorage.removeItem(testKey);
            return result;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Check persistence flow status
     * 
     * @returns {Promise<Object>} Persistence flow information
     */
    async checkPersistenceFlow() {
        const flow = {
            timestamp: Date.now(),
            steps: []
        };
        
        // Test UI → Cache
        try {
            if (this.persistenceManager) {
                const testKey = 'diagnostic_test_' + Date.now();
                const testValue = 'test_value_' + Date.now();
                
                // Test save to cache
                await this.persistenceManager.saveSetting(testKey, testValue, false);
                const cached = this.persistenceManager.settingsCache?.get(testKey);
                
                flow.steps.push({
                    step: 'UI → Cache',
                    status: cached ? 'success' : 'failed',
                    details: cached ? 'Setting cached successfully' : 'Failed to cache setting'
                });
                
                // Test localStorage backup
                const localData = localStorage.getItem(this.persistenceManager.config?.localStorageKey || 'woow_admin_settings');
                const localSettings = localData ? JSON.parse(localData) : {};
                
                flow.steps.push({
                    step: 'Cache → localStorage',
                    status: localSettings[testKey] ? 'success' : 'failed',
                    details: localSettings[testKey] ? 'Setting saved to localStorage' : 'Setting not found in localStorage'
                });
                
                // Clean up test data
                this.persistenceManager.settingsCache?.delete(testKey);
                delete localSettings[testKey];
                localStorage.setItem(this.persistenceManager.config?.localStorageKey || 'woow_admin_settings', JSON.stringify(localSettings));
            } else {
                flow.steps.push({
                    step: 'Persistence Manager',
                    status: 'unavailable',
                    details: 'Persistence manager not available'
                });
            }
        } catch (error) {
            flow.steps.push({
                step: 'Persistence Flow Test',
                status: 'error',
                details: error.message
            });
        }
        
        return flow;
    }
    
    /**
     * Check storage states
     * 
     * @returns {Promise<Object>} Storage state information
     */
    async checkStorageStates() {
        const states = {
            timestamp: Date.now(),
            localStorage: null,
            sessionStorage: null,
            cache: null,
            database: null
        };
        
        // Check localStorage
        try {
            const localStorageKey = this.persistenceManager?.config?.localStorageKey || 'woow_admin_settings';
            const localData = localStorage.getItem(localStorageKey);
            
            if (localData) {
                const parsed = JSON.parse(localData);
                states.localStorage = {
                    exists: true,
                    size: localData.length,
                    settingsCount: Object.keys(parsed).filter(key => !key.startsWith('_')).length,
                    lastModified: parsed._lastModified || null,
                    sample: this.getSampleSettings(parsed, 3)
                };
            } else {
                states.localStorage = {
                    exists: false,
                    message: 'No localStorage data found'
                };
            }
        } catch (error) {
            states.localStorage = {
                error: error.message
            };
        }
        
        // Check sessionStorage
        try {
            const sessionData = sessionStorage.getItem('woow_admin_settings');
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                states.sessionStorage = {
                    exists: true,
                    size: sessionData.length,
                    settingsCount: Object.keys(parsed).filter(key => !key.startsWith('_')).length,
                    sample: this.getSampleSettings(parsed, 3)
                };
            } else {
                states.sessionStorage = {
                    exists: false,
                    message: 'No sessionStorage data found'
                };
            }
        } catch (error) {
            states.sessionStorage = {
                error: error.message
            };
        }
        
        // Check cache
        if (this.persistenceManager && this.persistenceManager.settingsCache) {
            const cacheEntries = Array.from(this.persistenceManager.settingsCache.entries());
            states.cache = {
                exists: cacheEntries.length > 0,
                size: cacheEntries.length,
                entries: cacheEntries.slice(0, 5).map(([key, value]) => ({
                    key: key,
                    value: value.value,
                    timestamp: value.timestamp,
                    source: value.source
                }))
            };
        } else {
            states.cache = {
                exists: false,
                message: 'Cache not available'
            };
        }
        
        // Check database (via AJAX)
        try {
            if (this.persistenceManager) {
                const dbSettings = await this.persistenceManager.loadFromDatabase();
                if (dbSettings) {
                    states.database = {
                        exists: true,
                        settingsCount: Object.keys(dbSettings).filter(key => !key.startsWith('_')).length,
                        sample: this.getSampleSettings(dbSettings, 3)
                    };
                } else {
                    states.database = {
                        exists: false,
                        message: 'No database settings found'
                    };
                }
            } else {
                states.database = {
                    exists: false,
                    message: 'Persistence manager not available'
                };
            }
        } catch (error) {
            states.database = {
                error: error.message
            };
        }
        
        return states;
    }
    
    /**
     * Get sample settings for display
     * 
     * @param {Object} settings - Settings object
     * @param {number} count - Number of samples to return
     * @returns {Array} Sample settings
     */
    getSampleSettings(settings, count = 3) {
        const samples = [];
        const keys = Object.keys(settings).filter(key => !key.startsWith('_'));
        
        for (let i = 0; i < Math.min(count, keys.length); i++) {
            const key = keys[i];
            samples.push({
                key: key,
                value: settings[key],
                type: typeof settings[key]
            });
        }
        
        return samples;
    }
    
    /**
     * Check CSS variables state
     * 
     * @returns {Promise<Object>} CSS variables information
     */
    async checkCSSVariables() {
        const cssInfo = {
            timestamp: Date.now(),
            applied: [],
            missing: [],
            computed: []
        };
        
        // CSS variable mapping
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
        
        // Check each CSS variable
        Object.entries(cssVariableMapping).forEach(([settingKey, cssVar]) => {
            const computedValue = rootStyles.getPropertyValue(cssVar).trim();
            
            if (computedValue) {
                cssInfo.applied.push({
                    setting: settingKey,
                    cssVar: cssVar,
                    value: computedValue
                });
            } else {
                cssInfo.missing.push({
                    setting: settingKey,
                    cssVar: cssVar
                });
            }
        });
        
        // Get all computed CSS custom properties
        const allCustomProps = [];
        for (let i = 0; i < rootStyles.length; i++) {
            const prop = rootStyles[i];
            if (prop.startsWith('--woow-')) {
                allCustomProps.push({
                    property: prop,
                    value: rootStyles.getPropertyValue(prop).trim()
                });
            }
        }
        
        cssInfo.computed = allCustomProps.slice(0, 10); // Limit to first 10
        
        return cssInfo;
    }
    
    /**
     * Get recent logs
     * 
     * @returns {Array} Recent log entries
     */
    getRecentLogs() {
        if (!this.logger || !this.logger.logEntries) {
            return [];
        }
        
        return this.logger.logEntries
            .slice(-this.config.maxLogEntries)
            .map(entry => ({
                timestamp: entry.formattedTimestamp,
                level: entry.level,
                message: entry.message,
                category: entry.category,
                data: entry.data
            }));
    }
    
    /**
     * Get performance metrics
     * 
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        const metrics = {
            timestamp: Date.now(),
            logger: null,
            persistenceManager: null,
            browser: null
        };
        
        // Logger performance
        if (this.logger && this.logger.getPerformanceSummary) {
            metrics.logger = this.logger.getPerformanceSummary();
        }
        
        // Persistence manager performance
        if (this.persistenceManager && this.persistenceManager.getPerformanceMetrics) {
            metrics.persistenceManager = this.persistenceManager.getPerformanceMetrics();
        }
        
        // Browser performance
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            metrics.browser = {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                domInteractive: timing.domInteractive - timing.navigationStart
            };
        }
        
        return metrics;
    }
    
    /**
     * Update dashboard content with diagnostic results
     * 
     * @param {Object} results - Diagnostic results
     */
    updateDashboardContent(results) {
        // Update last updated timestamp
        const lastUpdatedElement = document.getElementById('last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleTimeString();
        }
        
        // Update system status
        this.updateSystemStatusContent(results.systemStatus);
        
        // Update persistence flow
        this.updatePersistenceFlowContent(results.persistenceFlow);
        
        // Update storage states
        this.updateStorageStatesContent(results.storageStates);
        
        // Update CSS variables
        this.updateCSSVariablesContent(results.cssVariables);
        
        // Update recent logs
        this.updateRecentLogsContent(results.recentLogs);
        
        // Update performance
        this.updatePerformanceContent(results.performance);
    }
    
    /**
     * Update system status content
     * 
     * @param {Object} systemStatus - System status data
     */
    updateSystemStatusContent(systemStatus) {
        const container = document.getElementById('system-status-content');
        if (!container || !systemStatus) return;
        
        const html = `
            <div style="font-size: 12px;">
                <div style="margin-bottom: 8px;">
                    <strong>Network:</strong> 
                    <span style="color: ${systemStatus.online ? '#46b450' : '#dc3232'};">
                        ${systemStatus.online ? '🟢 Online' : '🔴 Offline'}
                    </span>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Components:</strong>
                    <ul style="margin: 4px 0; padding-left: 16px;">
                        ${Object.entries(systemStatus.components).map(([name, available]) => 
                            `<li>${name}: <span style="color: ${available ? '#46b450' : '#dc3232'};">${available ? '✓' : '✗'}</span></li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Storage:</strong>
                    <ul style="margin: 4px 0; padding-left: 16px;">
                        <li>localStorage: <span style="color: ${systemStatus.browser.localStorage ? '#46b450' : '#dc3232'};">${systemStatus.browser.localStorage ? '✓' : '✗'}</span></li>
                        <li>sessionStorage: <span style="color: ${systemStatus.browser.sessionStorage ? '#46b450' : '#dc3232'};">${systemStatus.browser.sessionStorage ? '✓' : '✗'}</span></li>
                        <li>Cookies: <span style="color: ${systemStatus.browser.cookies ? '#46b450' : '#dc3232'};">${systemStatus.browser.cookies ? '✓' : '✗'}</span></li>
                    </ul>
                </div>
                
                ${systemStatus.persistenceManager ? `
                    <div>
                        <strong>Persistence Manager:</strong>
                        <ul style="margin: 4px 0; padding-left: 16px;">
                            <li>Cache Size: ${systemStatus.persistenceManager.cacheSize}</li>
                            <li>Pending Changes: ${systemStatus.persistenceManager.pendingChanges}</li>
                            <li>Online Status: ${systemStatus.persistenceManager.isOnline ? '✓' : '✗'}</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update persistence flow content
     * 
     * @param {Object} persistenceFlow - Persistence flow data
     */
    updatePersistenceFlowContent(persistenceFlow) {
        const container = document.getElementById('persistence-flow-content');
        if (!container || !persistenceFlow) return;
        
        const html = `
            <div style="font-size: 12px;">
                ${persistenceFlow.steps.map(step => `
                    <div style="margin-bottom: 6px; padding: 6px; background: ${
                        step.status === 'success' ? '#d4edda' : 
                        step.status === 'failed' ? '#f8d7da' : 
                        step.status === 'error' ? '#f8d7da' : '#fff3cd'
                    }; border-radius: 3px;">
                        <strong>${step.step}:</strong> 
                        <span style="color: ${
                            step.status === 'success' ? '#155724' : 
                            step.status === 'failed' ? '#721c24' : 
                            step.status === 'error' ? '#721c24' : '#856404'
                        };">
                            ${step.status === 'success' ? '✓' : step.status === 'failed' ? '✗' : step.status === 'error' ? '⚠' : '?'} ${step.status}
                        </span>
                        <br>
                        <small style="color: #666;">${step.details}</small>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update storage states content
     * 
     * @param {Object} storageStates - Storage states data
     */
    updateStorageStatesContent(storageStates) {
        const container = document.getElementById('storage-states-content');
        if (!container || !storageStates) return;
        
        const formatStorageInfo = (name, info) => {
            if (info.error) {
                return `<div style="color: #dc3232;">❌ ${name}: Error - ${info.error}</div>`;
            } else if (!info.exists) {
                return `<div style="color: #ffb900;">⚠ ${name}: ${info.message || 'Not found'}</div>`;
            } else {
                return `
                    <div style="color: #46b450;">✅ ${name}: ${info.settingsCount || info.size || 0} items</div>
                    ${info.sample ? `
                        <div style="margin-left: 16px; font-size: 11px; color: #666;">
                            Sample: ${info.sample.map(s => `${s.key}=${s.value}`).join(', ')}
                        </div>
                    ` : ''}
                `;
            }
        };
        
        const html = `
            <div style="font-size: 12px;">
                ${formatStorageInfo('localStorage', storageStates.localStorage)}
                ${formatStorageInfo('sessionStorage', storageStates.sessionStorage)}
                ${formatStorageInfo('Cache', storageStates.cache)}
                ${formatStorageInfo('Database', storageStates.database)}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update CSS variables content
     * 
     * @param {Object} cssVariables - CSS variables data
     */
    updateCSSVariablesContent(cssVariables) {
        const container = document.getElementById('css-variables-content');
        if (!container || !cssVariables) return;
        
        const html = `
            <div style="font-size: 12px;">
                <div style="margin-bottom: 8px;">
                    <strong>Applied Variables:</strong> ${cssVariables.applied.length}
                    ${cssVariables.applied.length > 0 ? `
                        <div style="margin-left: 16px; margin-top: 4px;">
                            ${cssVariables.applied.slice(0, 5).map(v => `
                                <div style="font-size: 11px; color: #46b450;">
                                    ✓ ${v.cssVar}: ${v.value}
                                </div>
                            `).join('')}
                            ${cssVariables.applied.length > 5 ? `<div style="font-size: 11px; color: #666;">... and ${cssVariables.applied.length - 5} more</div>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-bottom: 8px;">
                    <strong>Missing Variables:</strong> ${cssVariables.missing.length}
                    ${cssVariables.missing.length > 0 ? `
                        <div style="margin-left: 16px; margin-top: 4px;">
                            ${cssVariables.missing.slice(0, 3).map(v => `
                                <div style="font-size: 11px; color: #dc3232;">
                                    ✗ ${v.cssVar} (${v.setting})
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                ${cssVariables.computed.length > 0 ? `
                    <div>
                        <strong>All WOOW Variables:</strong> ${cssVariables.computed.length}
                        <div style="margin-left: 16px; margin-top: 4px; max-height: 100px; overflow-y: auto;">
                            ${cssVariables.computed.map(v => `
                                <div style="font-size: 11px; color: #666;">
                                    ${v.property}: ${v.value}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update recent logs content
     * 
     * @param {Array} recentLogs - Recent log entries
     */
    updateRecentLogsContent(recentLogs) {
        const container = document.getElementById('recent-logs-content');
        if (!container) return;
        
        if (!recentLogs || recentLogs.length === 0) {
            container.innerHTML = '<div style="color: #666; font-size: 12px;">No recent logs available</div>';
            return;
        }
        
        const html = `
            <div style="font-size: 11px; max-height: 150px; overflow-y: auto;">
                ${recentLogs.slice(-10).reverse().map(log => `
                    <div style="margin-bottom: 4px; padding: 4px; background: ${
                        log.level === 'error' ? '#f8d7da' : 
                        log.level === 'warn' ? '#fff3cd' : 
                        log.level === 'debug' ? '#f8f9fa' : '#d1ecf1'
                    }; border-radius: 2px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-weight: bold; color: ${
                                log.level === 'error' ? '#721c24' : 
                                log.level === 'warn' ? '#856404' : 
                                log.level === 'debug' ? '#6c757d' : '#0c5460'
                            };">
                                ${log.level.toUpperCase()}
                            </span>
                            <span style="color: #666; font-size: 10px;">${log.timestamp}</span>
                        </div>
                        <div style="color: #333; margin-top: 2px;">${log.message}</div>
                        ${log.category ? `<div style="color: #666; font-size: 10px;">Category: ${log.category}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Update performance content
     * 
     * @param {Object} performance - Performance data
     */
    updatePerformanceContent(performance) {
        const container = document.getElementById('performance-content');
        if (!container || !performance) return;
        
        const html = `
            <div style="font-size: 12px;">
                ${performance.logger ? `
                    <div style="margin-bottom: 8px;">
                        <strong>Logger:</strong>
                        <ul style="margin: 4px 0; padding-left: 16px;">
                            <li>Total Operations: ${performance.logger.totalOperations}</li>
                            <li>Success Rate: ${performance.logger.totalOperations > 0 ? 
                                Math.round((performance.logger.successfulOperations / performance.logger.totalOperations) * 100) : 0}%</li>
                            <li>Avg Response Time: ${Math.round(performance.logger.averageResponseTime)}ms</li>
                            <li>Active Operations: ${performance.logger.activeOperations}</li>
                        </ul>
                    </div>
                ` : ''}
                
                ${performance.persistenceManager ? `
                    <div style="margin-bottom: 8px;">
                        <strong>Persistence Manager:</strong>
                        <ul style="margin: 4px 0; padding-left: 16px;">
                            <li>Cache Size: ${performance.persistenceManager.cacheSize}</li>
                            <li>Pending Changes: ${performance.persistenceManager.pendingChanges}</li>
                            <li>Queue Length: ${performance.persistenceManager.requestQueueLength}</li>
                            <li>Cache Hit Rate: ${performance.persistenceManager.cacheHitRate}%</li>
                        </ul>
                    </div>
                ` : ''}
                
                ${performance.browser ? `
                    <div>
                        <strong>Browser:</strong>
                        <ul style="margin: 4px 0; padding-left: 16px;">
                            <li>Page Load: ${performance.browser.loadTime}ms</li>
                            <li>DOM Ready: ${performance.browser.domContentLoaded}ms</li>
                            <li>DOM Interactive: ${performance.browser.domInteractive}ms</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        
        container.innerHTML = html;
    }
    
    /**
     * Export diagnostic data
     * 
     * @returns {Object} Exported diagnostic data
     */
    exportDiagnosticData() {
        return {
            timestamp: Date.now(),
            config: this.config,
            results: this.diagnosticResults,
            lastRun: this.lastDiagnosticRun,
            systemInfo: {
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: Date.now()
            }
        };
    }
    
    /**
     * Download diagnostic data as JSON file
     */
    downloadDiagnosticData() {
        const data = this.exportDiagnosticData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `woow-diagnostics-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (this.logger) {
            this.logger.info('Diagnostic data downloaded', {
                filename: a.download
            }, this.logger.categories.UI);
        }
    }
}

// Create global instance
window.PersistenceDiagnosticTools = PersistenceDiagnosticTools;

// Auto-initialize if in debug mode
if (window.woowDebug) {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.woowDiagnosticTools) {
            window.woowDiagnosticTools = new PersistenceDiagnosticTools();
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistenceDiagnosticTools;
}