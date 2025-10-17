/**
 * JavaScript Error Capture System
 * 
 * Captures and reports JavaScript errors to the server for logging
 * and debugging purposes. Provides comprehensive error context.
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Error Handling System
 */

class ErrorCapture {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 50;
        this.flushInterval = 5000; // 5 seconds
        this.isOnline = navigator.onLine;
        this.ajaxUrl = window.ajaxurl || '/wp-admin/admin-ajax.php';
        this.nonce = this.getNonce();
        
        this.init();
    }
    
    /**
     * Initialize error capture system
     */
    init() {
        this.setupGlobalErrorHandlers();
        this.setupNetworkListeners();
        this.setupPeriodicFlush();
        this.setupConsoleOverrides();
        this.setupAjaxErrorCapture();
        this.setupFetchErrorCapture();
        
        console.log('🔍 ErrorCapture: JavaScript error capture system initialized');
    }
    
    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.captureError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error ? event.error.stack : null,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: this.getViewportInfo(),
                screen: this.getScreenInfo()
            });
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                type: 'promise_rejection',
                message: event.reason ? event.reason.toString() : 'Unhandled promise rejection',
                error: event.reason,
                stack: event.reason && event.reason.stack ? event.reason.stack : null,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                viewport: this.getViewportInfo(),
                screen: this.getScreenInfo()
            });
        });
    }
    
    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 ErrorCapture: Network back online - flushing error queue');
            this.flushErrorQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 ErrorCapture: Network offline - queuing errors');
        });
    }
    
    /**
     * Setup periodic error queue flushing
     */
    setupPeriodicFlush() {
        setInterval(() => {
            if (this.errorQueue.length > 0 && this.isOnline) {
                this.flushErrorQueue();
            }
        }, this.flushInterval);
    }
    
    /**
     * Setup console error overrides
     */
    setupConsoleOverrides() {
        const originalConsoleError = console.error;
        
        console.error = (...args) => {
            // Call original console.error
            originalConsoleError.apply(console, args);
            
            // Capture the error
            this.captureError({
                type: 'console_error',
                message: args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' '),
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                stack: new Error().stack,
                viewport: this.getViewportInfo(),
                screen: this.getScreenInfo()
            });
        };
    }
    
    /**
     * Setup AJAX error capture
     */
    setupAjaxErrorCapture() {
        // Override XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            this._errorCapture = {
                method: method,
                url: url,
                startTime: Date.now()
            };
            
            return originalXHROpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            const xhr = this;
            
            // Setup error handler
            xhr.addEventListener('error', () => {
                window.errorCapture.captureError({
                    type: 'ajax_error',
                    message: `AJAX request failed: ${xhr._errorCapture.method} ${xhr._errorCapture.url}`,
                    method: xhr._errorCapture.method,
                    url: xhr._errorCapture.url,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    executionTime: Date.now() - xhr._errorCapture.startTime,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    viewport: this.getViewportInfo(),
                    screen: this.getScreenInfo()
                });
            });
            
            // Setup timeout handler
            xhr.addEventListener('timeout', () => {
                window.errorCapture.captureError({
                    type: 'ajax_timeout',
                    message: `AJAX request timeout: ${xhr._errorCapture.method} ${xhr._errorCapture.url}`,
                    method: xhr._errorCapture.method,
                    url: xhr._errorCapture.url,
                    timeout: xhr.timeout,
                    executionTime: Date.now() - xhr._errorCapture.startTime,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    viewport: this.getViewportInfo(),
                    screen: this.getScreenInfo()
                });
            });
            
            return originalXHRSend.apply(this, arguments);
        };
    }
    
    /**
     * Setup Fetch API error capture
     */
    setupFetchErrorCapture() {
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
            const startTime = Date.now();
            const url = args[0];
            const options = args[1] || {};
            
            return originalFetch.apply(this, args)
                .catch(error => {
                    window.errorCapture.captureError({
                        type: 'fetch_error',
                        message: `Fetch request failed: ${url}`,
                        url: url,
                        method: options.method || 'GET',
                        error: error.toString(),
                        stack: error.stack,
                        executionTime: Date.now() - startTime,
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent,
                        viewport: window.errorCapture.getViewportInfo(),
                        screen: window.errorCapture.getScreenInfo()
                    });
                    
                    // Re-throw the error
                    throw error;
                });
        };
    }
    
    /**
     * Capture an error and add it to the queue
     */
    captureError(errorData) {
        // Add additional context
        errorData.sessionId = this.getSessionId();
        errorData.pageLoadTime = Date.now() - performance.timing.navigationStart;
        errorData.memoryUsage = this.getMemoryUsage();
        errorData.connectionType = this.getConnectionType();
        
        // Add to queue
        this.errorQueue.push(errorData);
        
        // Limit queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift(); // Remove oldest error
        }
        
        console.log('🔍 ErrorCapture: Error captured', errorData.type, errorData.message);
        
        // Immediate flush for critical errors
        if (this.isCriticalError(errorData)) {
            this.flushErrorQueue();
        }
    }
    
    /**
     * Flush error queue to server
     */
    async flushErrorQueue() {
        if (this.errorQueue.length === 0 || !this.isOnline) {
            return;
        }
        
        const errorsToSend = [...this.errorQueue];
        this.errorQueue = [];
        
        try {
            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'mas_log_error',
                    nonce: this.nonce,
                    error_data: JSON.stringify({
                        errors: errorsToSend,
                        batch: true,
                        timestamp: Date.now()
                    })
                })
            });
            
            if (response.ok) {
                console.log(`🔍 ErrorCapture: Successfully sent ${errorsToSend.length} errors to server`);
            } else {
                console.warn('🔍 ErrorCapture: Failed to send errors to server', response.status);
                // Re-add errors to queue for retry
                this.errorQueue.unshift(...errorsToSend);
            }
            
        } catch (error) {
            console.warn('🔍 ErrorCapture: Network error while sending errors', error);
            // Re-add errors to queue for retry
            this.errorQueue.unshift(...errorsToSend);
        }
    }
    
    /**
     * Check if error is critical and needs immediate attention
     */
    isCriticalError(errorData) {
        const criticalPatterns = [
            /cannot read property/i,
            /is not a function/i,
            /permission denied/i,
            /network error/i,
            /security/i,
            /unauthorized/i
        ];
        
        return criticalPatterns.some(pattern => 
            pattern.test(errorData.message) || 
            (errorData.stack && pattern.test(errorData.stack))
        );
    }
    
    /**
     * Get viewport information
     */
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY
        };
    }
    
    /**
     * Get screen information
     */
    getScreenInfo() {
        return {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth
        };
    }
    
    /**
     * Get session ID
     */
    getSessionId() {
        let sessionId = sessionStorage.getItem('woow_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('woow_session_id', sessionId);
        }
        return sessionId;
    }
    
    /**
     * Get memory usage information
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    /**
     * Get connection type
     */
    getConnectionType() {
        if (navigator.connection) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        return null;
    }
    
    /**
     * Get security nonce
     */
    getNonce() {
        return window.masNonce || 
               window.mas_nonce || 
               window.masV2?.nonce || 
               window.masV2?.ajaxNonce ||
               window.masLiveEdit?.nonce ||
               window.woowV2?.nonce ||
               window.woowV2Global?.nonce ||
               '';
    }
    
    /**
     * Manual error reporting
     */
    reportError(message, context = {}) {
        this.captureError({
            type: 'manual_report',
            message: message,
            context: context,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            stack: new Error().stack,
            viewport: this.getViewportInfo(),
            screen: this.getScreenInfo()
        });
    }
    
    /**
     * Get error statistics
     */
    getStats() {
        return {
            queueSize: this.errorQueue.length,
            maxQueueSize: this.maxQueueSize,
            isOnline: this.isOnline,
            flushInterval: this.flushInterval,
            sessionId: this.getSessionId()
        };
    }
    
    /**
     * Clear error queue
     */
    clearQueue() {
        this.errorQueue = [];
        console.log('🔍 ErrorCapture: Error queue cleared');
    }
}

// Initialize error capture system
window.errorCapture = new ErrorCapture();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorCapture;
}