/**
 * Persistence Logger
 * 
 * Comprehensive logging system for persistence operations with structured logging,
 * timestamps, log levels, and filtering capabilities.
 * 
 * @package WOOW! Admin Styler
 * @version 1.0.0
 * @author WOOW! Admin Styler Team
 */

class PersistenceLogger {
    constructor(options = {}) {
        // Configuration
        this.config = {
            logLevel: options.logLevel || 'info', // debug, info, warn, error
            maxLogEntries: options.maxLogEntries || 1000,
            enableConsoleOutput: options.enableConsoleOutput !== false,
            enableLocalStorage: options.enableLocalStorage !== false,
            enableRemoteLogging: options.enableRemoteLogging || false,
            remoteEndpoint: options.remoteEndpoint || null,
            timestampFormat: options.timestampFormat || 'iso', // iso, unix, readable
            includeStackTrace: options.includeStackTrace || false,
            debugMode: options.debugMode || window.woowDebug || false
        };
        
        // Log levels with numeric values for filtering
        this.logLevels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        // Current log level numeric value
        this.currentLogLevel = this.logLevels[this.config.logLevel] || 1;
        
        // Log storage
        this.logEntries = [];
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        
        // Performance tracking
        this.performanceMetrics = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            averageResponseTime: 0,
            operationTimes: []
        };
        
        // Operation tracking
        this.activeOperations = new Map();
        this.operationHistory = [];
        
        // Log categories for filtering
        this.categories = {
            PERSISTENCE: 'persistence',
            AJAX: 'ajax',
            CACHE: 'cache',
            CSS: 'css',
            UI: 'ui',
            ERROR: 'error',
            PERFORMANCE: 'performance',
            INITIALIZATION: 'initialization',
            VALIDATION: 'validation',
            RECOVERY: 'recovery'
        };
        
        // Initialize logger
        this.initialize();
        
        this.log('info', 'PersistenceLogger initialized', {
            sessionId: this.sessionId,
            config: this.config,
            logLevel: this.config.logLevel
        }, this.categories.INITIALIZATION);
    }
    
    /**
     * Initialize the logger
     */
    initialize() {
        // Load existing logs from localStorage if enabled
        if (this.config.enableLocalStorage) {
            this.loadLogsFromStorage();
        }
        
        // Set up periodic cleanup
        this.setupPeriodicCleanup();
        
        // Set up error handlers
        this.setupErrorHandlers();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
    }
    
    /**
     * Generate unique session ID
     * 
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
    
    /**
     * Main logging method with structured logging
     * 
     * @param {string} level - Log level (debug, info, warn, error)
     * @param {string} message - Log message
     * @param {Object} data - Additional data to log
     * @param {string} category - Log category
     * @param {Object} context - Additional context information
     */
    log(level, message, data = {}, category = null, context = {}) {
        // Check if log level should be processed
        if (this.logLevels[level] < this.currentLogLevel) {
            return;
        }
        
        // Create log entry
        const logEntry = this.createLogEntry(level, message, data, category, context);
        
        // Add to log storage
        this.addLogEntry(logEntry);
        
        // Output to console if enabled
        if (this.config.enableConsoleOutput) {
            this.outputToConsole(logEntry);
        }
        
        // Save to localStorage if enabled
        if (this.config.enableLocalStorage) {
            this.saveLogsToStorage();
        }
        
        // Send to remote endpoint if enabled
        if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
            this.sendToRemoteEndpoint(logEntry);
        }
    }
    
    /**
     * Create structured log entry
     * 
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @param {string} category - Log category
     * @param {Object} context - Additional context
     * @returns {Object} Log entry object
     */
    createLogEntry(level, message, data, category, context) {
        const timestamp = Date.now();
        const entry = {
            id: `log_${timestamp}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: timestamp,
            formattedTimestamp: this.formatTimestamp(timestamp),
            sessionId: this.sessionId,
            level: level,
            message: message,
            data: this.sanitizeData(data),
            category: category || 'general',
            context: this.sanitizeData(context),
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionDuration: timestamp - this.startTime
        };
        
        // Add stack trace for errors or if enabled
        if (level === 'error' || this.config.includeStackTrace) {
            entry.stackTrace = this.getStackTrace();
        }
        
        // Add performance data if available
        if (context.operationId && this.activeOperations.has(context.operationId)) {
            const operation = this.activeOperations.get(context.operationId);
            entry.operationDuration = timestamp - operation.startTime;
            entry.operationId = context.operationId;
        }
        
        return entry;
    }
    
    /**
     * Format timestamp based on configuration
     * 
     * @param {number} timestamp - Unix timestamp
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        
        switch (this.config.timestampFormat) {
            case 'iso':
                return date.toISOString();
            case 'unix':
                return timestamp.toString();
            case 'readable':
                return date.toLocaleString();
            default:
                return date.toISOString();
        }
    }
    
    /**
     * Sanitize data to prevent circular references and large objects
     * 
     * @param {*} data - Data to sanitize
     * @returns {*} Sanitized data
     */
    sanitizeData(data) {
        if (data === null || data === undefined) {
            return data;
        }
        
        try {
            // Handle circular references and limit depth
            return JSON.parse(JSON.stringify(data, (key, value) => {
                // Skip functions
                if (typeof value === 'function') {
                    return '[Function]';
                }
                
                // Limit string length
                if (typeof value === 'string' && value.length > 1000) {
                    return value.substring(0, 1000) + '... [truncated]';
                }
                
                // Skip DOM elements
                if (value instanceof Element) {
                    return `[Element: ${value.tagName}]`;
                }
                
                return value;
            }));
        } catch (error) {
            return '[Unserializable data]';
        }
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
     * Add log entry to storage
     * 
     * @param {Object} logEntry - Log entry to add
     */
    addLogEntry(logEntry) {
        this.logEntries.push(logEntry);
        
        // Maintain maximum log entries
        if (this.logEntries.length > this.config.maxLogEntries) {
            this.logEntries = this.logEntries.slice(-this.config.maxLogEntries);
        }
    }
    
    /**
     * Output log entry to console
     * 
     * @param {Object} logEntry - Log entry to output
     */
    outputToConsole(logEntry) {
        const consoleMethod = console[logEntry.level] || console.log;
        const prefix = `[WOOW-${logEntry.level.toUpperCase()}]`;
        const timestamp = logEntry.formattedTimestamp;
        const category = logEntry.category ? `[${logEntry.category.toUpperCase()}]` : '';
        
        if (this.config.debugMode) {
            // Detailed debug output
            consoleMethod(
                `${prefix} ${timestamp} ${category} ${logEntry.message}`,
                {
                    data: logEntry.data,
                    context: logEntry.context,
                    sessionId: logEntry.sessionId,
                    operationId: logEntry.operationId,
                    duration: logEntry.operationDuration
                }
            );
        } else {
            // Simple output
            consoleMethod(`${prefix} ${category} ${logEntry.message}`, logEntry.data);
        }
    }
    
    /**
     * Save logs to localStorage
     */
    saveLogsToStorage() {
        try {
            const logsToSave = {
                sessionId: this.sessionId,
                startTime: this.startTime,
                logs: this.logEntries.slice(-100), // Save last 100 entries
                performanceMetrics: this.performanceMetrics,
                lastUpdated: Date.now()
            };
            
            localStorage.setItem('woow_persistence_logs', JSON.stringify(logsToSave));
        } catch (error) {
            // If localStorage fails, continue silently
            console.warn('Failed to save logs to localStorage:', error);
        }
    }
    
    /**
     * Load logs from localStorage
     */
    loadLogsFromStorage() {
        try {
            const savedLogs = localStorage.getItem('woow_persistence_logs');
            if (savedLogs) {
                const parsedLogs = JSON.parse(savedLogs);
                
                // Only load logs from current session or recent sessions
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                if (Date.now() - parsedLogs.lastUpdated < maxAge) {
                    this.logEntries = parsedLogs.logs || [];
                    if (parsedLogs.performanceMetrics) {
                        this.performanceMetrics = { ...this.performanceMetrics, ...parsedLogs.performanceMetrics };
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load logs from localStorage:', error);
        }
    }
    
    /**
     * Send log entry to remote endpoint
     * 
     * @param {Object} logEntry - Log entry to send
     */
    async sendToRemoteEndpoint(logEntry) {
        if (!this.config.remoteEndpoint) {
            return;
        }
        
        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    logEntry: logEntry,
                    sessionId: this.sessionId
                })
            });
        } catch (error) {
            // Fail silently for remote logging
            console.warn('Failed to send log to remote endpoint:', error);
        }
    }
    
    /**
     * Set up periodic cleanup of old logs
     */
    setupPeriodicCleanup() {
        // Clean up every 5 minutes
        setInterval(() => {
            this.cleanupOldLogs();
        }, 5 * 60 * 1000);
    }
    
    /**
     * Clean up old log entries
     */
    cleanupOldLogs() {
        const maxAge = 60 * 60 * 1000; // 1 hour
        const cutoffTime = Date.now() - maxAge;
        
        const initialCount = this.logEntries.length;
        this.logEntries = this.logEntries.filter(entry => entry.timestamp > cutoffTime);
        
        const removedCount = initialCount - this.logEntries.length;
        if (removedCount > 0) {
            this.log('debug', `Cleaned up ${removedCount} old log entries`, {
                removedCount: removedCount,
                remainingCount: this.logEntries.length
            }, this.categories.PERFORMANCE);
        }
    }
    
    /**
     * Set up global error handlers
     */
    setupErrorHandlers() {
        // Capture unhandled errors
        window.addEventListener('error', (event) => {
            this.log('error', 'Unhandled JavaScript error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            }, this.categories.ERROR);
        });
        
        // Capture unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.log('error', 'Unhandled promise rejection', {
                reason: event.reason,
                promise: event.promise
            }, this.categories.ERROR);
        });
    }
    
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor page performance
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                
                this.log('info', 'Page load performance', {
                    loadTime: loadTime,
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    domInteractive: timing.domInteractive - timing.navigationStart
                }, this.categories.PERFORMANCE);
            });
        }
    }
    
    // Convenience methods for different log levels
    
    /**
     * Log debug message
     * 
     * @param {string} message - Debug message
     * @param {Object} data - Additional data
     * @param {string} category - Log category
     * @param {Object} context - Additional context
     */
    debug(message, data = {}, category = null, context = {}) {
        this.log('debug', message, data, category, context);
    }
    
    /**
     * Log info message
     * 
     * @param {string} message - Info message
     * @param {Object} data - Additional data
     * @param {string} category - Log category
     * @param {Object} context - Additional context
     */
    info(message, data = {}, category = null, context = {}) {
        this.log('info', message, data, category, context);
    }
    
    /**
     * Log warning message
     * 
     * @param {string} message - Warning message
     * @param {Object} data - Additional data
     * @param {string} category - Log category
     * @param {Object} context - Additional context
     */
    warn(message, data = {}, category = null, context = {}) {
        this.log('warn', message, data, category, context);
    }
    
    /**
     * Log error message
     * 
     * @param {string} message - Error message
     * @param {Object} data - Additional data
     * @param {string} category - Log category
     * @param {Object} context - Additional context
     */
    error(message, data = {}, category = null, context = {}) {
        this.log('error', message, data, category, context);
    }
    
    // Operation tracking methods
    
    /**
     * Start tracking an operation
     * 
     * @param {string} operationName - Name of the operation
     * @param {Object} metadata - Operation metadata
     * @returns {string} Operation ID
     */
    startOperation(operationName, metadata = {}) {
        const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const operation = {
            id: operationId,
            name: operationName,
            startTime: Date.now(),
            metadata: metadata
        };
        
        this.activeOperations.set(operationId, operation);
        
        this.log('debug', `Started operation: ${operationName}`, {
            operationId: operationId,
            metadata: metadata
        }, this.categories.PERFORMANCE, { operationId: operationId });
        
        return operationId;
    }
    
    /**
     * End tracking an operation
     * 
     * @param {string} operationId - Operation ID
     * @param {boolean} success - Whether operation was successful
     * @param {Object} result - Operation result
     */
    endOperation(operationId, success = true, result = {}) {
        const operation = this.activeOperations.get(operationId);
        if (!operation) {
            this.warn('Attempted to end unknown operation', { operationId: operationId });
            return;
        }
        
        const endTime = Date.now();
        const duration = endTime - operation.startTime;
        
        // Update performance metrics
        this.performanceMetrics.totalOperations++;
        if (success) {
            this.performanceMetrics.successfulOperations++;
        } else {
            this.performanceMetrics.failedOperations++;
        }
        
        this.performanceMetrics.operationTimes.push(duration);
        if (this.performanceMetrics.operationTimes.length > 100) {
            this.performanceMetrics.operationTimes = this.performanceMetrics.operationTimes.slice(-100);
        }
        
        // Calculate average response time
        this.performanceMetrics.averageResponseTime = 
            this.performanceMetrics.operationTimes.reduce((a, b) => a + b, 0) / 
            this.performanceMetrics.operationTimes.length;
        
        // Add to operation history
        const completedOperation = {
            ...operation,
            endTime: endTime,
            duration: duration,
            success: success,
            result: this.sanitizeData(result)
        };
        
        this.operationHistory.push(completedOperation);
        if (this.operationHistory.length > 50) {
            this.operationHistory = this.operationHistory.slice(-50);
        }
        
        // Remove from active operations
        this.activeOperations.delete(operationId);
        
        // Log completion
        this.log(success ? 'info' : 'error', `Completed operation: ${operation.name}`, {
            operationId: operationId,
            duration: duration,
            success: success,
            result: result
        }, this.categories.PERFORMANCE, { operationId: operationId });
    }
    
    // Query and filtering methods
    
    /**
     * Get logs by level
     * 
     * @param {string} level - Log level to filter by
     * @returns {Array} Filtered log entries
     */
    getLogsByLevel(level) {
        return this.logEntries.filter(entry => entry.level === level);
    }
    
    /**
     * Get logs by category
     * 
     * @param {string} category - Category to filter by
     * @returns {Array} Filtered log entries
     */
    getLogsByCategory(category) {
        return this.logEntries.filter(entry => entry.category === category);
    }
    
    /**
     * Get logs by time range
     * 
     * @param {number} startTime - Start timestamp
     * @param {number} endTime - End timestamp
     * @returns {Array} Filtered log entries
     */
    getLogsByTimeRange(startTime, endTime) {
        return this.logEntries.filter(entry => 
            entry.timestamp >= startTime && entry.timestamp <= endTime
        );
    }
    
    /**
     * Search logs by message content
     * 
     * @param {string} searchTerm - Term to search for
     * @returns {Array} Matching log entries
     */
    searchLogs(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.logEntries.filter(entry => 
            entry.message.toLowerCase().includes(term) ||
            JSON.stringify(entry.data).toLowerCase().includes(term)
        );
    }
    
    /**
     * Get performance summary
     * 
     * @returns {Object} Performance metrics summary
     */
    getPerformanceSummary() {
        return {
            ...this.performanceMetrics,
            activeOperations: this.activeOperations.size,
            totalLogEntries: this.logEntries.length,
            sessionDuration: Date.now() - this.startTime,
            errorRate: this.performanceMetrics.totalOperations > 0 ? 
                (this.performanceMetrics.failedOperations / this.performanceMetrics.totalOperations) * 100 : 0
        };
    }
    
    /**
     * Export logs for debugging
     * 
     * @param {Object} options - Export options
     * @returns {Object} Exported log data
     */
    exportLogs(options = {}) {
        const exportData = {
            sessionId: this.sessionId,
            startTime: this.startTime,
            exportTime: Date.now(),
            config: this.config,
            performanceMetrics: this.getPerformanceSummary(),
            logs: options.includeAllLogs ? this.logEntries : this.logEntries.slice(-100),
            operationHistory: this.operationHistory,
            activeOperations: Array.from(this.activeOperations.values())
        };
        
        if (options.format === 'json') {
            return JSON.stringify(exportData, null, 2);
        }
        
        return exportData;
    }
    
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logEntries = [];
        this.operationHistory = [];
        this.activeOperations.clear();
        this.performanceMetrics = {
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            averageResponseTime: 0,
            operationTimes: []
        };
        
        if (this.config.enableLocalStorage) {
            try {
                localStorage.removeItem('woow_persistence_logs');
            } catch (error) {
                console.warn('Failed to clear logs from localStorage:', error);
            }
        }
        
        this.log('info', 'All logs cleared', {}, this.categories.INITIALIZATION);
    }
    
    /**
     * Set log level
     * 
     * @param {string} level - New log level
     */
    setLogLevel(level) {
        if (this.logLevels.hasOwnProperty(level)) {
            this.config.logLevel = level;
            this.currentLogLevel = this.logLevels[level];
            
            this.log('info', `Log level changed to: ${level}`, {
                oldLevel: this.config.logLevel,
                newLevel: level
            }, this.categories.INITIALIZATION);
        } else {
            this.warn('Invalid log level specified', { level: level });
        }
    }
}

// Create global instance
window.PersistenceLogger = PersistenceLogger;

// Create default logger instance
if (!window.woowPersistenceLogger) {
    window.woowPersistenceLogger = new PersistenceLogger({
        logLevel: window.woowDebug ? 'debug' : 'info',
        debugMode: window.woowDebug || false
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistenceLogger;
}