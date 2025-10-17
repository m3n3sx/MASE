/**
 * DebugLogger - Comprehensive development debugging for CSS Variables Restoration System
 * 
 * Provides debug mode detection, performance timing, metrics collection,
 * console utilities, and restoration report generation.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

class DebugLogger {
    constructor() {
        this.isDebugMode = this.detectDebugMode();
        this.logs = [];
        this.startTime = performance.now();
        this.metrics = {
            restorationStart: null,
            restorationEnd: null,
            databaseLoadStart: null,
            databaseLoadEnd: null,
            localStorageLoadStart: null,
            localStorageLoadEnd: null,
            variableApplicationStart: null,
            variableApplicationEnd: null,
            totalVariablesApplied: 0,
            errorCount: 0,
            warningCount: 0
        };
        
        // Install console utilities if in debug mode
        if (this.isDebugMode) {
            this.installConsoleUtilities();
        }
    }

    /**
     * Detect if debug mode is enabled
     * Requirements: 4.1 - Debug mode detection
     */
    detectDebugMode() {
        // Check URL parameter
        if (window.location.search.includes('woow_debug=1')) {
            return true;
        }
        
        // Check localStorage setting
        try {
            if (localStorage.getItem('woow_debug') === '1') {
                return true;
            }
        } catch (error) {
            // localStorage might not be available
        }
        
        // Check global window variable
        if (window.woowDebugMode === true) {
            return true;
        }
        
        // Check if running in development environment
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('.local')) {
            return true;
        }
        
        return false;
    }

    /**
     * Log information message with timing
     * Requirements: 4.2 - Detailed error information with context
     */
    log(message, data = null) {
        const timestamp = performance.now() - this.startTime;
        const logEntry = {
            timestamp: timestamp.toFixed(2) + 'ms',
            message,
            data,
            level: 'info',
            time: new Date().toISOString()
        };
        
        this.logs.push(logEntry);
        
        if (this.isDebugMode) {
            console.log(`[WOOW CSS Restore ${logEntry.timestamp}] ${message}`, data || '');
        }
    }

    /**
     * Log warning message with error context
     * Requirements: 4.2 - Detailed error information with context
     */
    warn(message, error = null) {
        const timestamp = performance.now() - this.startTime;
        const logEntry = {
            timestamp: timestamp.toFixed(2) + 'ms',
            message,
            error: error?.message || error,
            stack: error?.stack,
            level: 'warn',
            time: new Date().toISOString()
        };
        
        this.logs.push(logEntry);
        this.metrics.warningCount++;
        
        if (this.isDebugMode) {
            console.warn(`[WOOW CSS Restore ${logEntry.timestamp}] ${message}`, error || '');
        }
    }

    /**
     * Log error message with full context
     * Requirements: 4.2 - Detailed error information with context
     */
    error(message, error = null) {
        const timestamp = performance.now() - this.startTime;
        const logEntry = {
            timestamp: timestamp.toFixed(2) + 'ms',
            message,
            error: error?.message || error,
            stack: error?.stack,
            level: 'error',
            time: new Date().toISOString()
        };
        
        this.logs.push(logEntry);
        this.metrics.errorCount++;
        
        if (this.isDebugMode) {
            console.error(`[WOOW CSS Restore ${logEntry.timestamp}] ${message}`, error || '');
        }
    }

    /**
     * Start timing a specific operation
     * Requirements: 4.1 - Performance timing and metrics collection
     */
    startTiming(operation) {
        const key = `${operation}Start`;
        if (this.metrics.hasOwnProperty(key)) {
            this.metrics[key] = performance.now();
            this.log(`Started ${operation}`);
        }
    }

    /**
     * End timing a specific operation
     * Requirements: 4.1 - Performance timing and metrics collection
     */
    endTiming(operation) {
        const startKey = `${operation}Start`;
        const endKey = `${operation}End`;
        
        if (this.metrics.hasOwnProperty(startKey) && this.metrics.hasOwnProperty(endKey)) {
            this.metrics[endKey] = performance.now();
            
            if (this.metrics[startKey]) {
                const duration = this.metrics[endKey] - this.metrics[startKey];
                this.log(`Completed ${operation} in ${duration.toFixed(2)}ms`);
                return duration;
            }
        }
        
        return null;
    }

    /**
     * Record variable application metrics
     * Requirements: 4.1 - Performance timing and metrics collection
     */
    recordVariableApplication(count, source) {
        this.metrics.totalVariablesApplied += count;
        this.log(`Applied ${count} variables from ${source}`, {
            count,
            source,
            totalApplied: this.metrics.totalVariablesApplied
        });
    }

    /**
     * Generate comprehensive restoration report
     * Requirements: 4.4 - Restoration report generation
     */
    generateReport() {
        const totalTime = (performance.now() - this.startTime).toFixed(2);
        
        // Calculate operation durations
        const operationDurations = {};
        const operations = ['restoration', 'databaseLoad', 'localStorageLoad', 'variableApplication'];
        
        operations.forEach(op => {
            const startKey = `${op}Start`;
            const endKey = `${op}End`;
            
            if (this.metrics[startKey] && this.metrics[endKey]) {
                operationDurations[op] = (this.metrics[endKey] - this.metrics[startKey]).toFixed(2) + 'ms';
            }
        });

        const report = {
            summary: {
                totalTime: totalTime + 'ms',
                logCount: this.logs.length,
                errorCount: this.metrics.errorCount,
                warningCount: this.metrics.warningCount,
                variablesApplied: this.metrics.totalVariablesApplied,
                debugMode: this.isDebugMode
            },
            performance: {
                operationDurations,
                startTime: new Date(Date.now() - parseFloat(totalTime)).toISOString(),
                endTime: new Date().toISOString()
            },
            logs: this.logs,
            metrics: this.metrics
        };
        
        if (this.isDebugMode) {
            console.group('🔍 CSS Variables Restoration Report');
            console.table(report.summary);
            console.table(operationDurations);
            console.groupCollapsed('Detailed Logs');
            console.table(this.logs);
            console.groupEnd();
            console.groupEnd();
        }
        
        return report;
    }

    /**
     * Install console utilities for manual debugging
     * Requirements: 4.3 - Console utilities for manual CSS variable debugging
     */
    installConsoleUtilities() {
        // Create global debug utilities object
        window.woowDebugCSS = {
            /**
             * Show all currently applied --woow-* CSS variables
             */
            showAppliedVariables: () => {
                const style = getComputedStyle(document.documentElement);
                const woowVars = {};
                
                // Iterate through all CSS properties to find --woow-* variables
                for (let i = 0; i < style.length; i++) {
                    const prop = style[i];
                    if (prop.startsWith('--woow-')) {
                        woowVars[prop] = style.getPropertyValue(prop).trim();
                    }
                }
                
                console.group('🎨 Applied WOOW CSS Variables');
                console.table(woowVars);
                console.groupEnd();
                
                return woowVars;
            },

            /**
             * Test applying a CSS variable manually
             */
            testVariable: (cssVar, value) => {
                if (!cssVar.startsWith('--')) {
                    cssVar = '--woow-' + cssVar;
                }
                
                const oldValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
                document.documentElement.style.setProperty(cssVar, value);
                
                console.log(`🧪 Applied ${cssVar}: ${value} (was: ${oldValue || 'unset'})`);
                
                return {
                    variable: cssVar,
                    newValue: value,
                    oldValue: oldValue || 'unset'
                };
            },

            /**
             * Reset all variables to their default values
             */
            resetToDefaults: () => {
                // This would need access to VariableApplicator - for now, provide guidance
                console.warn('🔄 To reset variables, use: new VariableApplicator().applyVariables(applicator.getDefaultVariables(), "manual-reset")');
                
                // Clear any manually set variables
                const style = document.documentElement.style;
                const toRemove = [];
                
                for (let i = 0; i < style.length; i++) {
                    const prop = style[i];
                    if (prop.startsWith('--woow-')) {
                        toRemove.push(prop);
                    }
                }
                
                toRemove.forEach(prop => {
                    style.removeProperty(prop);
                });
                
                console.log(`🧹 Cleared ${toRemove.length} manually set variables`);
                return toRemove;
            },

            /**
             * Show current debug logger state
             */
            showDebugState: () => {
                const logger = window.woowCSSDebugLogger;
                if (logger) {
                    return logger.generateReport();
                } else {
                    console.warn('Debug logger not found');
                    return null;
                }
            },

            /**
             * Enable/disable debug mode
             */
            setDebugMode: (enabled) => {
                try {
                    localStorage.setItem('woow_debug', enabled ? '1' : '0');
                    console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}. Reload page to take effect.`);
                } catch (error) {
                    console.warn('Could not save debug mode setting:', error);
                }
            },

            /**
             * Export debug logs as JSON
             */
            exportLogs: () => {
                const logger = window.woowCSSDebugLogger;
                if (logger) {
                    const report = logger.generateReport();
                    const dataStr = JSON.stringify(report, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(dataBlob);
                    link.download = `woow-css-debug-${new Date().toISOString().slice(0, 19)}.json`;
                    link.click();
                    
                    console.log('📁 Debug logs exported');
                    return report;
                } else {
                    console.warn('Debug logger not found');
                    return null;
                }
            },

            /**
             * Show help for debug utilities
             */
            help: () => {
                console.group('🆘 WOOW CSS Debug Utilities Help');
                console.log('Available commands:');
                console.log('• woowDebugCSS.showAppliedVariables() - Show all applied --woow-* variables');
                console.log('• woowDebugCSS.testVariable(name, value) - Test applying a variable');
                console.log('• woowDebugCSS.resetToDefaults() - Clear manually set variables');
                console.log('• woowDebugCSS.showDebugState() - Show current debug state');
                console.log('• woowDebugCSS.setDebugMode(true/false) - Enable/disable debug mode');
                console.log('• woowDebugCSS.exportLogs() - Export debug logs as JSON');
                console.log('• woowDebugCSS.help() - Show this help');
                console.groupEnd();
            }
        };

        // Make debug logger globally accessible
        window.woowCSSDebugLogger = this;

        // Log that utilities are available
        this.log('Console utilities installed', {
            utilities: Object.keys(window.woowDebugCSS),
            globalLogger: 'window.woowCSSDebugLogger'
        });

        // Show help on first load if debug mode is explicitly enabled
        if (window.location.search.includes('woow_debug=1')) {
            console.log('🔍 WOOW CSS Debug mode enabled. Type woowDebugCSS.help() for available commands.');
        }
    }

    /**
     * Clear all logs and reset metrics
     */
    clearLogs() {
        this.logs = [];
        this.metrics = {
            restorationStart: null,
            restorationEnd: null,
            databaseLoadStart: null,
            databaseLoadEnd: null,
            localStorageLoadStart: null,
            localStorageLoadEnd: null,
            variableApplicationStart: null,
            variableApplicationEnd: null,
            totalVariablesApplied: 0,
            errorCount: 0,
            warningCount: 0
        };
        this.startTime = performance.now();
        
        this.log('Debug logs cleared and metrics reset');
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Get filtered logs by level
     */
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Check if debug mode is currently active
     */
    isDebugActive() {
        return this.isDebugMode;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugLogger;
}