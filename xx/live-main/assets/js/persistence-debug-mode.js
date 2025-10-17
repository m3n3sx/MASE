/**
 * Persistence Debug Mode
 * 
 * Development mode debugging features with verbose logging, performance timing,
 * and step-by-step persistence flow tracking.
 * 
 * @package WOOW! Admin Styler
 * @version 1.0.0
 * @author WOOW! Admin Styler Team
 */

class PersistenceDebugMode {
    constructor(options = {}) {
        // Configuration
        this.config = {
            enabled: options.enabled || window.woowDebug || false,
            verboseLogging: options.verboseLogging !== false,
            performanceTiming: options.performanceTiming !== false,
            flowTracking: options.flowTracking !== false,
            visualIndicators: options.visualIndicators !== false,
            consoleGrouping: options.consoleGrouping !== false,
            stackTraces: options.stackTraces || false,
            networkLogging: options.networkLogging !== false,
            storageLogging: options.storageLogging !== false,
            maxFlowSteps: options.maxFlowSteps || 100,
            timingThreshold: options.timingThreshold || 100 // ms
        };
        
        // Debug state
        this.isActive = false;
        this.debugSession = null;
        this.flowSteps = [];
        this.performanceMarks = new Map();
        this.operationTimings = new Map();
        this.networkRequests = [];
        this.storageOperations = [];
        
        // UI elements
        this.debugPanel = null;
        this.debugToggle = null;
        
        // References
        this.logger = null;
        this.persistenceManager = null;
        
        // Initialize if enabled
        if (this.config.enabled) {
            this.initialize();
        }
    }
    
    /**
     * Initialize debug mode
     */
    initialize() {
        // Get references
        this.initializeReferences();
        
        // Create debug session
        this.startDebugSession();
        
        // Set up interceptors
        this.setupInterceptors();
        
        // Create debug UI
        if (this.config.visualIndicators) {
            this.createDebugUI();
        }
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        this.isActive = true;
        
        this.log('🐛 Debug mode initialized', {
            config: this.config,
            sessionId: this.debugSession.id
        });
    }
    
    /**
     * Initialize references to other components
     */
    initializeReferences() {
        // Get logger
        if (window.woowPersistenceLogger) {
            this.logger = window.woowPersistenceLogger;
        } else if (window.PersistenceLogger) {
            this.logger = new window.PersistenceLogger({
                logLevel: 'debug',
                debugMode: true
            });
        }
        
        // Get persistence manager
        if (window.settingsPersistenceManager) {
            this.persistenceManager = window.settingsPersistenceManager;
        } else if (window.SettingsPersistenceManager) {
            this.persistenceManager = new window.SettingsPersistenceManager();
        }
    }
    
    /**
     * Start a new debug session
     */
    startDebugSession() {
        this.debugSession = {
            id: `debug_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            startTime: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            config: { ...this.config }
        };
        
        this.flowSteps = [];
        this.performanceMarks.clear();
        this.operationTimings.clear();
        this.networkRequests = [];
        this.storageOperations = [];
        
        this.log('🚀 Debug session started', this.debugSession);
    }
    
    /**
     * Set up interceptors for various operations
     */
    setupInterceptors() {
        // Intercept AJAX requests
        if (this.config.networkLogging) {
            this.setupAjaxInterceptor();
        }
        
        // Intercept localStorage operations
        if (this.config.storageLogging) {
            this.setupStorageInterceptor();
        }
        
        // Intercept console methods for grouping
        if (this.config.consoleGrouping) {
            this.setupConsoleInterceptor();
        }
    }
    
    /**
     * Set up AJAX request interceptor
     */
    setupAjaxInterceptor() {
        if (typeof jQuery !== 'undefined') {
            const originalAjax = jQuery.ajax;
            const self = this;
            
            jQuery.ajax = function(options) {
                const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                const startTime = performance.now();
                
                // Log request start
                self.logNetworkRequest('start', {
                    requestId: requestId,
                    url: options.url,
                    method: options.type || 'GET',
                    data: options.data,
                    startTime: startTime
                });
                
                // Wrap success callback
                const originalSuccess = options.success;
                options.success = function(data, textStatus, jqXHR) {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    self.logNetworkRequest('success', {
                        requestId: requestId,
                        duration: duration,
                        status: jqXHR.status,
                        response: data,
                        endTime: endTime
                    });
                    
                    if (originalSuccess) {
                        originalSuccess.apply(this, arguments);
                    }
                };
                
                // Wrap error callback
                const originalError = options.error;
                options.error = function(jqXHR, textStatus, errorThrown) {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    self.logNetworkRequest('error', {
                        requestId: requestId,
                        duration: duration,
                        status: jqXHR.status,
                        error: errorThrown,
                        textStatus: textStatus,
                        endTime: endTime
                    });
                    
                    if (originalError) {
                        originalError.apply(this, arguments);
                    }
                };
                
                return originalAjax.call(this, options);
            };
        }
    }
    
    /**
     * Set up localStorage interceptor
     */
    setupStorageInterceptor() {
        const self = this;
        
        // Intercept localStorage.setItem
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            self.logStorageOperation('setItem', {
                key: key,
                value: value,
                size: value.length,
                timestamp: Date.now()
            });
            
            return originalSetItem.call(this, key, value);
        };
        
        // Intercept localStorage.getItem
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = function(key) {
            const value = originalGetItem.call(this, key);
            
            self.logStorageOperation('getItem', {
                key: key,
                found: value !== null,
                size: value ? value.length : 0,
                timestamp: Date.now()
            });
            
            return value;
        };
        
        // Intercept localStorage.removeItem
        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = function(key) {
            self.logStorageOperation('removeItem', {
                key: key,
                timestamp: Date.now()
            });
            
            return originalRemoveItem.call(this, key);
        };
    }
    
    /**
     * Set up console interceptor for grouping
     */
    setupConsoleInterceptor() {
        // This would be implemented to group related console messages
        // For now, we'll use the existing console methods
    }
    
    /**
     * Create debug UI elements
     */
    createDebugUI() {
        // Create debug toggle button
        this.createDebugToggle();
        
        // Create debug panel
        this.createDebugPanel();
        
        // Create visual indicators
        this.createVisualIndicators();
    }
    
    /**
     * Create debug toggle button
     */
    createDebugToggle() {
        this.debugToggle = document.createElement('div');
        this.debugToggle.id = 'woow-debug-toggle';
        this.debugToggle.innerHTML = '🐛';
        this.debugToggle.style.cssText = `
            position: fixed;
            top: 32px;
            left: 20px;
            width: 30px;
            height: 30px;
            background: #ff6b35;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        this.debugToggle.addEventListener('click', () => {
            this.toggleDebugPanel();
        });
        
        this.debugToggle.addEventListener('mouseenter', () => {
            this.debugToggle.style.transform = 'scale(1.1)';
        });
        
        this.debugToggle.addEventListener('mouseleave', () => {
            this.debugToggle.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(this.debugToggle);
    }
    
    /**
     * Create debug panel
     */
    createDebugPanel() {
        this.debugPanel = document.createElement('div');
        this.debugPanel.id = 'woow-debug-panel';
        this.debugPanel.style.cssText = `
            position: fixed;
            top: 70px;
            left: 20px;
            width: 350px;
            max-height: 70vh;
            background: #1e1e1e;
            color: #f0f0f0;
            border: 1px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            z-index: 999998;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            display: none;
            overflow: hidden;
        `;
        
        this.debugPanel.innerHTML = this.createDebugPanelHTML();
        document.body.appendChild(this.debugPanel);
    }
    
    /**
     * Create debug panel HTML
     * 
     * @returns {string} Debug panel HTML
     */
    createDebugPanelHTML() {
        return `
            <div class="debug-header" style="background: #333; padding: 10px; border-bottom: 1px solid #555;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #ff6b35; font-weight: bold;">🐛 DEBUG MODE</span>
                    <div>
                        <button id="clear-debug-log" style="background: #555; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Clear</button>
                        <button id="export-debug-data" style="background: #0073aa; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Export</button>
                        <button id="close-debug-panel" style="background: #dc3232; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
                    </div>
                </div>
                <div style="margin-top: 5px; font-size: 10px; color: #ccc;">
                    Session: ${this.debugSession?.id || 'Unknown'}
                </div>
            </div>
            
            <div class="debug-tabs" style="background: #2a2a2a; padding: 5px; border-bottom: 1px solid #555;">
                <button class="debug-tab active" data-tab="flow" style="background: #ff6b35; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Flow</button>
                <button class="debug-tab" data-tab="timing" style="background: #555; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Timing</button>
                <button class="debug-tab" data-tab="network" style="background: #555; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Network</button>
                <button class="debug-tab" data-tab="storage" style="background: #555; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Storage</button>
            </div>
            
            <div class="debug-content" style="max-height: 50vh; overflow-y: auto; padding: 10px;">
                <div id="debug-tab-flow" class="debug-tab-content">
                    <div id="flow-steps">No flow steps recorded yet</div>
                </div>
                
                <div id="debug-tab-timing" class="debug-tab-content" style="display: none;">
                    <div id="timing-data">No timing data available</div>
                </div>
                
                <div id="debug-tab-network" class="debug-tab-content" style="display: none;">
                    <div id="network-requests">No network requests logged</div>
                </div>
                
                <div id="debug-tab-storage" class="debug-tab-content" style="display: none;">
                    <div id="storage-operations">No storage operations logged</div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create visual indicators
     */
    createVisualIndicators() {
        // Create activity indicator
        this.activityIndicator = document.createElement('div');
        this.activityIndicator.id = 'woow-debug-activity';
        this.activityIndicator.style.cssText = `
            position: fixed;
            top: 32px;
            left: 60px;
            width: 20px;
            height: 20px;
            background: #46b450;
            border-radius: 50%;
            z-index: 999997;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(this.activityIndicator);
    }
    
    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl+Shift+D to toggle debug panel
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                this.toggleDebugPanel();
            }
            
            // Ctrl+Shift+C to clear debug log
            if (event.ctrlKey && event.shiftKey && event.key === 'C') {
                event.preventDefault();
                this.clearDebugLog();
            }
            
            // Ctrl+Shift+E to export debug data
            if (event.ctrlKey && event.shiftKey && event.key === 'E') {
                event.preventDefault();
                this.exportDebugData();
            }
        });
    }
    
    /**
     * Toggle debug panel visibility
     */
    toggleDebugPanel() {
        if (!this.debugPanel) return;
        
        const isVisible = this.debugPanel.style.display !== 'none';
        this.debugPanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.updateDebugPanel();
            this.setupDebugPanelEventListeners();
        }
        
        this.log(isVisible ? '🙈 Debug panel hidden' : '👁 Debug panel shown');
    }
    
    /**
     * Set up debug panel event listeners
     */
    setupDebugPanelEventListeners() {
        // Tab switching
        const tabs = this.debugPanel.querySelectorAll('.debug-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchDebugTab(tabName);
            });
        });
        
        // Clear button
        const clearBtn = this.debugPanel.querySelector('#clear-debug-log');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearDebugLog();
            });
        }
        
        // Export button
        const exportBtn = this.debugPanel.querySelector('#export-debug-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportDebugData();
            });
        }
        
        // Close button
        const closeBtn = this.debugPanel.querySelector('#close-debug-panel');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.toggleDebugPanel();
            });
        }
    }
    
    /**
     * Switch debug panel tab
     * 
     * @param {string} tabName - Tab name to switch to
     */
    switchDebugTab(tabName) {
        // Update tab buttons
        const tabs = this.debugPanel.querySelectorAll('.debug-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.style.background = '#ff6b35';
                tab.classList.add('active');
            } else {
                tab.style.background = '#555';
                tab.classList.remove('active');
            }
        });
        
        // Update tab content
        const contents = this.debugPanel.querySelectorAll('.debug-tab-content');
        contents.forEach(content => {
            content.style.display = content.id === `debug-tab-${tabName}` ? 'block' : 'none';
        });
        
        // Update content based on tab
        this.updateTabContent(tabName);
    }
    
    /**
     * Update debug panel content
     */
    updateDebugPanel() {
        this.updateTabContent('flow');
        this.updateTabContent('timing');
        this.updateTabContent('network');
        this.updateTabContent('storage');
    }
    
    /**
     * Update specific tab content
     * 
     * @param {string} tabName - Tab name to update
     */
    updateTabContent(tabName) {
        switch (tabName) {
            case 'flow':
                this.updateFlowContent();
                break;
            case 'timing':
                this.updateTimingContent();
                break;
            case 'network':
                this.updateNetworkContent();
                break;
            case 'storage':
                this.updateStorageContent();
                break;
        }
    }
    
    /**
     * Update flow content
     */
    updateFlowContent() {
        const container = this.debugPanel?.querySelector('#flow-steps');
        if (!container) return;
        
        if (this.flowSteps.length === 0) {
            container.innerHTML = '<div style="color: #888;">No flow steps recorded yet</div>';
            return;
        }
        
        const html = this.flowSteps.slice(-20).map((step, index) => `
            <div style="margin-bottom: 8px; padding: 6px; background: #333; border-radius: 4px; border-left: 3px solid ${this.getStepColor(step.type)};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${this.getStepColor(step.type)}; font-weight: bold;">${step.type}</span>
                    <span style="color: #888; font-size: 10px;">${new Date(step.timestamp).toLocaleTimeString()}</span>
                </div>
                <div style="color: #f0f0f0; margin-top: 2px;">${step.message}</div>
                ${step.data ? `<div style="color: #ccc; font-size: 10px; margin-top: 2px;">${JSON.stringify(step.data, null, 2).substring(0, 200)}${JSON.stringify(step.data).length > 200 ? '...' : ''}</div>` : ''}
                ${step.duration ? `<div style="color: #ff6b35; font-size: 10px; margin-top: 2px;">Duration: ${step.duration}ms</div>` : ''}
            </div>
        `).join('');
        
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }
    
    /**
     * Get color for step type
     * 
     * @param {string} type - Step type
     * @returns {string} Color code
     */
    getStepColor(type) {
        const colors = {
            'start': '#46b450',
            'cache': '#0073aa',
            'localStorage': '#ffb900',
            'ajax': '#ff6b35',
            'database': '#9b59b6',
            'css': '#e74c3c',
            'ui': '#1abc9c',
            'error': '#dc3232',
            'end': '#46b450'
        };
        
        return colors[type] || '#f0f0f0';
    }
    
    /**
     * Update timing content
     */
    updateTimingContent() {
        const container = this.debugPanel?.querySelector('#timing-data');
        if (!container) return;
        
        if (this.operationTimings.size === 0) {
            container.innerHTML = '<div style="color: #888;">No timing data available</div>';
            return;
        }
        
        const timings = Array.from(this.operationTimings.entries()).map(([operation, data]) => `
            <div style="margin-bottom: 6px; padding: 4px; background: #333; border-radius: 3px;">
                <div style="color: #ff6b35; font-weight: bold;">${operation}</div>
                <div style="color: #f0f0f0; font-size: 10px;">
                    Duration: ${data.duration}ms | 
                    Started: ${new Date(data.startTime).toLocaleTimeString()} |
                    ${data.status || 'completed'}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = timings;
    }
    
    /**
     * Update network content
     */
    updateNetworkContent() {
        const container = this.debugPanel?.querySelector('#network-requests');
        if (!container) return;
        
        if (this.networkRequests.length === 0) {
            container.innerHTML = '<div style="color: #888;">No network requests logged</div>';
            return;
        }
        
        const html = this.networkRequests.slice(-10).map(req => `
            <div style="margin-bottom: 6px; padding: 4px; background: #333; border-radius: 3px; border-left: 3px solid ${req.type === 'error' ? '#dc3232' : '#46b450'};">
                <div style="color: #ff6b35; font-weight: bold;">${req.method} ${req.url}</div>
                <div style="color: #f0f0f0; font-size: 10px;">
                    Status: ${req.status || 'pending'} | 
                    Duration: ${req.duration ? Math.round(req.duration) + 'ms' : 'pending'} |
                    ${new Date(req.timestamp).toLocaleTimeString()}
                </div>
                ${req.error ? `<div style="color: #dc3232; font-size: 10px;">Error: ${req.error}</div>` : ''}
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    /**
     * Update storage content
     */
    updateStorageContent() {
        const container = this.debugPanel?.querySelector('#storage-operations');
        if (!container) return;
        
        if (this.storageOperations.length === 0) {
            container.innerHTML = '<div style="color: #888;">No storage operations logged</div>';
            return;
        }
        
        const html = this.storageOperations.slice(-15).map(op => `
            <div style="margin-bottom: 4px; padding: 3px; background: #333; border-radius: 3px;">
                <div style="color: #ffb900; font-weight: bold;">${op.operation}</div>
                <div style="color: #f0f0f0; font-size: 10px;">
                    Key: ${op.key} | 
                    ${op.size ? `Size: ${op.size}b | ` : ''}
                    ${new Date(op.timestamp).toLocaleTimeString()}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    }
    
    // Public API methods
    
    /**
     * Log a flow step
     * 
     * @param {string} type - Step type
     * @param {string} message - Step message
     * @param {Object} data - Additional data
     * @param {number} duration - Step duration in ms
     */
    logFlowStep(type, message, data = null, duration = null) {
        if (!this.isActive) return;
        
        const step = {
            id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            type: type,
            message: message,
            data: data,
            duration: duration,
            timestamp: Date.now(),
            stackTrace: this.config.stackTraces ? this.getStackTrace() : null
        };
        
        this.flowSteps.push(step);
        
        // Maintain max steps
        if (this.flowSteps.length > this.config.maxFlowSteps) {
            this.flowSteps = this.flowSteps.slice(-this.config.maxFlowSteps);
        }
        
        // Show activity indicator
        this.showActivity();
        
        // Update UI if visible
        if (this.debugPanel && this.debugPanel.style.display !== 'none') {
            this.updateFlowContent();
        }
        
        // Verbose console logging
        if (this.config.verboseLogging) {
            const color = this.getStepColor(type);
            console.log(`%c[FLOW] ${type}: ${message}`, `color: ${color}; font-weight: bold;`, data);
        }
    }
    
    /**
     * Start performance timing
     * 
     * @param {string} operation - Operation name
     * @returns {string} Timing ID
     */
    startTiming(operation) {
        if (!this.isActive || !this.config.performanceTiming) return null;
        
        const timingId = `timing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const startTime = performance.now();
        
        this.operationTimings.set(timingId, {
            operation: operation,
            startTime: startTime,
            realStartTime: Date.now()
        });
        
        // Performance mark
        if (performance.mark) {
            performance.mark(`woow-${operation}-start`);
        }
        
        this.logFlowStep('start', `Started timing: ${operation}`, { timingId, operation });
        
        return timingId;
    }
    
    /**
     * End performance timing
     * 
     * @param {string} timingId - Timing ID
     * @param {string} status - Operation status
     * @param {Object} result - Operation result
     */
    endTiming(timingId, status = 'completed', result = null) {
        if (!this.isActive || !this.config.performanceTiming || !timingId) return;
        
        const timing = this.operationTimings.get(timingId);
        if (!timing) return;
        
        const endTime = performance.now();
        const duration = endTime - timing.startTime;
        
        // Update timing data
        timing.endTime = endTime;
        timing.duration = duration;
        timing.status = status;
        timing.result = result;
        
        // Performance mark and measure
        if (performance.mark && performance.measure) {
            performance.mark(`woow-${timing.operation}-end`);
            try {
                performance.measure(
                    `woow-${timing.operation}`,
                    `woow-${timing.operation}-start`,
                    `woow-${timing.operation}-end`
                );
            } catch (e) {
                // Ignore measure errors
            }
        }
        
        // Log slow operations
        if (duration > this.config.timingThreshold) {
            this.logFlowStep('timing', `Slow operation detected: ${timing.operation}`, {
                duration: duration,
                threshold: this.config.timingThreshold,
                status: status
            }, duration);
        }
        
        this.logFlowStep('end', `Completed timing: ${timing.operation}`, {
            duration: duration,
            status: status,
            result: result
        }, duration);
        
        // Update UI if visible
        if (this.debugPanel && this.debugPanel.style.display !== 'none') {
            this.updateTimingContent();
        }
    }
    
    /**
     * Log network request
     * 
     * @param {string} type - Request type (start, success, error)
     * @param {Object} data - Request data
     */
    logNetworkRequest(type, data) {
        if (!this.isActive || !this.config.networkLogging) return;
        
        let request = this.networkRequests.find(req => req.requestId === data.requestId);
        
        if (!request) {
            request = {
                requestId: data.requestId,
                timestamp: Date.now(),
                type: type,
                method: data.method,
                url: data.url
            };
            this.networkRequests.push(request);
        }
        
        // Update request data
        Object.assign(request, data);
        request.type = type;
        
        // Maintain max requests
        if (this.networkRequests.length > 50) {
            this.networkRequests = this.networkRequests.slice(-50);
        }
        
        // Log flow step
        this.logFlowStep('ajax', `Network ${type}: ${data.method || 'GET'} ${data.url}`, data, data.duration);
        
        // Update UI if visible
        if (this.debugPanel && this.debugPanel.style.display !== 'none') {
            this.updateNetworkContent();
        }
    }
    
    /**
     * Log storage operation
     * 
     * @param {string} operation - Storage operation
     * @param {Object} data - Operation data
     */
    logStorageOperation(operation, data) {
        if (!this.isActive || !this.config.storageLogging) return;
        
        const storageOp = {
            operation: operation,
            ...data
        };
        
        this.storageOperations.push(storageOp);
        
        // Maintain max operations
        if (this.storageOperations.length > 100) {
            this.storageOperations = this.storageOperations.slice(-100);
        }
        
        // Log flow step
        this.logFlowStep('localStorage', `Storage ${operation}: ${data.key}`, data);
        
        // Update UI if visible
        if (this.debugPanel && this.debugPanel.style.display !== 'none') {
            this.updateStorageContent();
        }
    }
    
    /**
     * Show activity indicator
     */
    showActivity() {
        if (!this.activityIndicator) return;
        
        this.activityIndicator.style.opacity = '1';
        
        // Hide after 500ms
        setTimeout(() => {
            if (this.activityIndicator) {
                this.activityIndicator.style.opacity = '0';
            }
        }, 500);
    }
    
    /**
     * Get stack trace
     * 
     * @returns {string} Stack trace
     */
    getStackTrace() {
        try {
            throw new Error();
        } catch (error) {
            return error.stack || 'Stack trace not available';
        }
    }
    
    /**
     * Clear debug log
     */
    clearDebugLog() {
        this.flowSteps = [];
        this.operationTimings.clear();
        this.networkRequests = [];
        this.storageOperations = [];
        
        this.updateDebugPanel();
        
        this.log('🧹 Debug log cleared');
    }
    
    /**
     * Export debug data
     */
    exportDebugData() {
        const debugData = {
            session: this.debugSession,
            config: this.config,
            flowSteps: this.flowSteps,
            operationTimings: Array.from(this.operationTimings.entries()),
            networkRequests: this.networkRequests,
            storageOperations: this.storageOperations,
            exportTime: Date.now()
        };
        
        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `woow-debug-${this.debugSession.id}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('📁 Debug data exported', { filename: a.download });
    }
    
    /**
     * Enable debug mode
     */
    enable() {
        if (!this.isActive) {
            this.config.enabled = true;
            this.initialize();
        }
    }
    
    /**
     * Disable debug mode
     */
    disable() {
        this.isActive = false;
        this.config.enabled = false;
        
        // Remove UI elements
        if (this.debugToggle) {
            this.debugToggle.remove();
            this.debugToggle = null;
        }
        
        if (this.debugPanel) {
            this.debugPanel.remove();
            this.debugPanel = null;
        }
        
        if (this.activityIndicator) {
            this.activityIndicator.remove();
            this.activityIndicator = null;
        }
        
        this.log('🐛 Debug mode disabled');
    }
    
    /**
     * Log message (fallback method)
     * 
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     */
    log(message, data = null) {
        if (this.logger) {
            this.logger.debug(message, data, 'debug-mode');
        } else {
            console.log(`[DEBUG] ${message}`, data);
        }
    }
}

// Create global instance
window.PersistenceDebugMode = PersistenceDebugMode;

// Auto-initialize if debug mode is enabled
if (window.woowDebug) {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.woowDebugMode) {
            window.woowDebugMode = new PersistenceDebugMode({
                enabled: true
            });
        }
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistenceDebugMode;
}