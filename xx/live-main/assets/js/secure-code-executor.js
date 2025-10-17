/**
 * Secure Code Executor
 * Manages secure execution of user-provided CSS and JavaScript code
 */

class SecureCodeExecutor {
    constructor(options = {}) {
        this.options = {
            maxExecutionTime: 5000,
            maxMemoryUsage: 10 * 1024 * 1024, // 10MB
            enableLogging: true,
            sandboxMode: true,
            ...options
        };
        
        this.sanitizer = new CodeSanitizer({
            strictMode: true,
            enableCSP: true,
            maxExecutionTime: this.options.maxExecutionTime
        });
        
        this.executionHistory = [];
        this.activeExecutions = new Map();
        this.executionId = 0;
        
        this.initializeSecurityFeatures();
    }

    initializeSecurityFeatures() {
        // Set up performance monitoring
        this.performanceObserver = null;
        if (typeof PerformanceObserver !== 'undefined') {
            this.performanceObserver = new PerformanceObserver((list) => {
                this.handlePerformanceEntries(list.getEntries());
            });
            
            try {
                this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (error) {
                console.warn('Performance monitoring not available:', error);
            }
        }

        // Set up memory monitoring
        this.memoryMonitor = setInterval(() => {
            this.checkMemoryUsage();
        }, 1000);

        // Set up error handling
        this.setupGlobalErrorHandling();
    }

    setupGlobalErrorHandling() {
        // Capture sandbox execution errors
        this.originalErrorHandler = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            if (source && source.includes('sandbox')) {
                this.handleSandboxError(error || new Error(message));
                return true; // Prevent default error handling
            }
            
            // Call original handler if it exists
            if (this.originalErrorHandler) {
                return this.originalErrorHandler(message, source, lineno, colno, error);
            }
            return false;
        };
    }

    /**
     * Execute CSS code securely
     * @param {string} cssCode - CSS code to execute
     * @param {Object} options - Execution options
     * @returns {Promise} - Execution result
     */
    async executeCSS(cssCode, options = {}) {
        const executionId = ++this.executionId;
        const startTime = performance.now();
        
        try {
            this.logExecution(executionId, 'css', 'started', cssCode.length);
            
            // Sanitize CSS
            const sanitized = this.sanitizer.sanitizeCSS(cssCode);
            if (!sanitized.isValid) {
                throw new Error('CSS sanitization failed: ' + sanitized.errors.join(', '));
            }

            // Apply CSS with safety checks
            const result = await this.applyCSSSecurely(sanitized.sanitizedCode, options);
            
            const executionTime = performance.now() - startTime;
            this.logExecution(executionId, 'css', 'completed', cssCode.length, executionTime);
            
            return {
                success: true,
                executionId,
                executionTime,
                warnings: sanitized.warnings,
                result
            };
            
        } catch (error) {
            const executionTime = performance.now() - startTime;
            this.logExecution(executionId, 'css', 'failed', cssCode.length, executionTime, error);
            throw error;
        }
    }

    /**
     * Execute JavaScript code securely
     * @param {string} jsCode - JavaScript code to execute
     * @param {Object} context - Execution context
     * @param {Object} options - Execution options
     * @returns {Promise} - Execution result
     */
    async executeJS(jsCode, context = {}, options = {}) {
        const executionId = ++this.executionId;
        const startTime = performance.now();
        
        try {
            this.logExecution(executionId, 'js', 'started', jsCode.length);
            
            // Check if we're in sandbox mode
            if (this.options.sandboxMode) {
                return await this.executeJSInSandbox(jsCode, context, executionId, startTime);
            } else {
                return await this.executeJSDirectly(jsCode, context, executionId, startTime);
            }
            
        } catch (error) {
            const executionTime = performance.now() - startTime;
            this.logExecution(executionId, 'js', 'failed', jsCode.length, executionTime, error);
            throw error;
        }
    }

    /**
     * Execute JavaScript in a secure sandbox
     */
    async executeJSInSandbox(jsCode, context, executionId, startTime) {
        // Use Web Workers for true isolation if available
        if (typeof Worker !== 'undefined' && this.options.useWebWorkers) {
            return await this.executeInWebWorker(jsCode, context, executionId, startTime);
        }
        
        // Fallback to sanitizer sandbox
        const result = await this.sanitizer.executeInSandbox(jsCode, context);
        const executionTime = performance.now() - startTime;
        
        this.logExecution(executionId, 'js', 'completed', jsCode.length, executionTime);
        
        return {
            success: true,
            executionId,
            executionTime,
            warnings: result.warnings,
            result: result.result
        };
    }

    /**
     * Execute JavaScript in a Web Worker for maximum isolation
     */
    async executeInWebWorker(jsCode, context, executionId, startTime) {
        return new Promise((resolve, reject) => {
            // Create worker blob
            const workerCode = `
                // Import sanitizer (simplified version for worker)
                const sanitizer = {
                    validateCode: function(code) {
                        // Basic validation in worker
                        const dangerous = [
                            /eval\\s*\\(/gi,
                            /Function\\s*\\(/gi,
                            /setTimeout\\s*\\(\\s*["'][^"']*["']/gi,
                            /setInterval\\s*\\(\\s*["'][^"']*["']/gi
                        ];
                        
                        for (let pattern of dangerous) {
                            if (pattern.test(code)) {
                                throw new Error('Dangerous pattern detected: ' + pattern.source);
                            }
                        }
                        return true;
                    }
                };
                
                self.onmessage = function(e) {
                    const { code, context, executionId } = e.data;
                    
                    try {
                        // Validate code
                        sanitizer.validateCode(code);
                        
                        // Create execution context
                        const safeContext = {
                            console: {
                                log: (...args) => self.postMessage({
                                    type: 'log',
                                    executionId,
                                    args: args
                                })
                            },
                            Math: Math,
                            JSON: JSON,
                            ...context
                        };
                        
                        // Execute code
                        const func = new Function('context', 'with(context) { ' + code + ' }');
                        const result = func(safeContext);
                        
                        self.postMessage({
                            type: 'success',
                            executionId,
                            result: result
                        });
                        
                    } catch (error) {
                        self.postMessage({
                            type: 'error',
                            executionId,
                            error: error.message
                        });
                    }
                };
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            
            // Set up timeout
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error('Worker execution timeout'));
            }, this.options.maxExecutionTime);
            
            // Handle worker messages
            worker.onmessage = (e) => {
                const { type, executionId: msgId, result, error, args } = e.data;
                
                if (msgId !== executionId) return;
                
                switch (type) {
                    case 'success':
                        clearTimeout(timeout);
                        worker.terminate();
                        const executionTime = performance.now() - startTime;
                        this.logExecution(executionId, 'js', 'completed', jsCode.length, executionTime);
                        resolve({
                            success: true,
                            executionId,
                            executionTime,
                            result
                        });
                        break;
                        
                    case 'error':
                        clearTimeout(timeout);
                        worker.terminate();
                        reject(new Error('Worker execution error: ' + error));
                        break;
                        
                    case 'log':
                        console.log('[WORKER]', ...args);
                        break;
                }
            };
            
            worker.onerror = (error) => {
                clearTimeout(timeout);
                worker.terminate();
                reject(new Error('Worker error: ' + error.message));
            };
            
            // Send code to worker
            worker.postMessage({
                code: jsCode,
                context,
                executionId
            });
        });
    }

    /**
     * Execute JavaScript directly (less secure, for trusted code only)
     */
    async executeJSDirectly(jsCode, context, executionId, startTime) {
        // Still sanitize even in direct mode
        const sanitized = this.sanitizer.sanitizeJS(jsCode);
        if (!sanitized.isValid) {
            throw new Error('JavaScript sanitization failed: ' + sanitized.errors.join(', '));
        }

        // Execute with timeout
        const result = await Promise.race([
            new Promise((resolve) => {
                try {
                    const func = new Function('context', sanitized.sanitizedCode);
                    const execResult = func(context);
                    resolve(execResult);
                } catch (error) {
                    throw error;
                }
            }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Execution timeout')), this.options.maxExecutionTime);
            })
        ]);

        const executionTime = performance.now() - startTime;
        this.logExecution(executionId, 'js', 'completed', jsCode.length, executionTime);

        return {
            success: true,
            executionId,
            executionTime,
            warnings: sanitized.warnings,
            result
        };
    }

    /**
     * Apply CSS securely with additional safety checks
     */
    async applyCSSSecurely(cssCode, options = {}) {
        const targetId = options.targetId || 'secure-dynamic-styles';
        
        // Check for CSS that might affect security-critical elements
        const securityCriticalSelectors = [
            'body', 'html', 'head', 'script', 'style',
            '[data-wp-admin]', '.wp-admin', '#adminmenu'
        ];
        
        let hasSecurityRisk = false;
        securityCriticalSelectors.forEach(selector => {
            if (cssCode.includes(selector)) {
                hasSecurityRisk = true;
            }
        });
        
        if (hasSecurityRisk && !options.allowSecurityRisk) {
            throw new Error('CSS targets security-critical elements');
        }
        
        // Apply CSS using sanitizer
        return this.sanitizer.applySafeCSS(cssCode, targetId);
    }

    /**
     * Stop execution by ID
     * @param {number} executionId - Execution ID to stop
     */
    stopExecution(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (execution) {
            if (execution.worker) {
                execution.worker.terminate();
            }
            if (execution.timeout) {
                clearTimeout(execution.timeout);
            }
            this.activeExecutions.delete(executionId);
            this.logExecution(executionId, execution.type, 'stopped');
            return true;
        }
        return false;
    }

    /**
     * Stop all active executions
     */
    stopAllExecutions() {
        const executionIds = Array.from(this.activeExecutions.keys());
        executionIds.forEach(id => this.stopExecution(id));
        return executionIds.length;
    }

    /**
     * Get execution history
     */
    getExecutionHistory(limit = 50) {
        return this.executionHistory.slice(-limit);
    }

    /**
     * Clear execution history
     */
    clearExecutionHistory() {
        this.executionHistory = [];
    }

    /**
     * Log execution events
     */
    logExecution(executionId, type, status, codeLength = 0, executionTime = 0, error = null) {
        if (!this.options.enableLogging) return;
        
        const logEntry = {
            executionId,
            type,
            status,
            codeLength,
            executionTime,
            timestamp: new Date().toISOString(),
            error: error ? error.message : null
        };
        
        this.executionHistory.push(logEntry);
        
        // Keep history size manageable
        if (this.executionHistory.length > 1000) {
            this.executionHistory = this.executionHistory.slice(-500);
        }
        
        // Log to console in development
        if (this.options.enableLogging) {
            console.log(`[SecureCodeExecutor] ${type.toUpperCase()} ${status}:`, logEntry);
        }
    }

    /**
     * Handle performance entries
     */
    handlePerformanceEntries(entries) {
        entries.forEach(entry => {
            if (entry.duration > 1000) { // Log slow operations
                console.warn('[SecureCodeExecutor] Slow operation detected:', entry);
            }
        });
    }

    /**
     * Check memory usage
     */
    checkMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize;
            if (memoryUsage > this.options.maxMemoryUsage) {
                console.warn('[SecureCodeExecutor] High memory usage detected:', memoryUsage);
                this.stopAllExecutions();
            }
        }
    }

    /**
     * Handle sandbox errors
     */
    handleSandboxError(error) {
        console.error('[SecureCodeExecutor] Sandbox error:', error);
        // Could implement additional error handling here
    }

    /**
     * Clean up resources
     */
    dispose() {
        // Stop all executions
        this.stopAllExecutions();
        
        // Clear intervals
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
        }
        
        // Disconnect performance observer
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        
        // Restore original error handler
        if (this.originalErrorHandler) {
            window.onerror = this.originalErrorHandler;
        }
        
        // Clear history
        this.clearExecutionHistory();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureCodeExecutor;
} else if (typeof window !== 'undefined') {
    window.SecureCodeExecutor = SecureCodeExecutor;
}