/**
 * AJAX Response Handler
 * 
 * Handles consistent processing of AJAX responses for the settings persistence system.
 * Provides specialized handling for save/load operations with comprehensive error recovery,
 * retry logic, and user feedback integration.
 * 
 * @package WOOW! Admin Styler
 * @version 1.0.0
 * @author WOOW! Admin Styler Team
 */

class AjaxResponseHandler {
    constructor(persistenceManager) {
        this.persistenceManager = persistenceManager;
        
        // Retry queue for failed requests
        this.retryQueue = new Map();
        
        // Configuration
        this.config = {
            maxRetries: 3,
            retryDelayBase: 1000, // 1 second base delay
            exponentialBackoffMultiplier: 2,
            requestTimeout: 30000, // 30 seconds
            networkErrorCodes: [0, 408, 429, 500, 502, 503, 504],
            retryableErrorMessages: [
                'network error',
                'timeout',
                'connection failed',
                'server error',
                'service unavailable'
            ]
        };
        
        // Response type handlers
        this.responseHandlers = {
            save: this.handleSaveResponse.bind(this),
            load: this.handleLoadResponse.bind(this),
            sync: this.handleSyncResponse.bind(this),
            reset: this.handleResetResponse.bind(this)
        };
        
        // Error recovery manager reference
        this.errorRecoveryManager = null;
        
        // User feedback system reference
        this.userFeedbackSystem = null;
        
        // Initialize dependencies
        this.initializeDependencies();
        
        this.log('🚀 AjaxResponseHandler initialized');
    }
    
    /**
     * Initialize dependency references
     */
    initializeDependencies() {
        // Initialize error recovery manager if available
        if (typeof ErrorRecoveryManager !== 'undefined') {
            this.errorRecoveryManager = new ErrorRecoveryManager(this.persistenceManager);
        }
        
        // Initialize user feedback system - use global instance if available
        if (window.WoowUserFeedback) {
            this.userFeedbackSystem = window.WoowUserFeedback;
        } else if (typeof UserFeedbackSystem !== 'undefined') {
            this.userFeedbackSystem = new UserFeedbackSystem();
        }
        
        // Track loading operations for AJAX requests
        this.activeLoadingOperations = new Map();
    }
    
    /**
     * Show loading indicator for AJAX operation
     * 
     * @param {string} operation - Operation type (save, load, sync, etc.)
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     * @returns {Object} Loading control object
     */
    showLoadingIndicator(operation, message, options = {}) {
        if (!this.userFeedbackSystem) {
            this.log(`🔄 ${message}`);
            return { hide: () => {} };
        }
        
        const loadingId = `ajax_${operation}_${Date.now()}`;
        const loadingControl = this.userFeedbackSystem.showLoading(message, loadingId, {
            showSpinner: true,
            showProgress: false,
            cancelable: false,
            ...options
        });
        
        // Track the loading operation
        this.activeLoadingOperations.set(operation, loadingControl);
        
        return loadingControl;
    }
    
    /**
     * Hide loading indicator for operation
     * 
     * @param {string} operation - Operation type
     */
    hideLoadingIndicator(operation) {
        const loadingControl = this.activeLoadingOperations.get(operation);
        if (loadingControl) {
            loadingControl.hide();
            this.activeLoadingOperations.delete(operation);
        }
    }
    
    /**
     * Show progress indicator for bulk operations
     * 
     * @param {string} operationName - Name of the operation
     * @param {number} total - Total number of items
     * @param {Object} options - Additional options
     * @returns {Object} Progress control object
     */
    showProgressIndicator(operationName, total, options = {}) {
        if (!this.userFeedbackSystem) {
            this.log(`🔄 ${operationName}: 0/${total}`);
            return { 
                update: () => {}, 
                complete: () => {}, 
                cancel: () => {} 
            };
        }
        
        return this.userFeedbackSystem.showProgress(operationName, total, {
            showPercentage: true,
            showItemCount: true,
            showTimeEstimate: true,
            cancelable: false,
            ...options
        });
    }
    
    /**
     * Handle save operation response
     * 
     * @param {Object} response - AJAX response object
     * @param {string} settingKey - Setting key that was saved
     * @param {*} settingValue - Setting value that was saved
     * @param {Object} context - Additional context information
     * @returns {Promise<Object>} Processing result
     */
    async handleSaveResponse(response, settingKey, settingValue, context = {}) {
        try {
            this.log(`💾 Processing save response for: ${settingKey}`, response);
            
            // Hide loading indicator if it was shown
            if (context.showLoading !== false) {
                this.hideLoadingIndicator('save');
            }
            
            // Validate response structure
            if (!this.isValidResponse(response)) {
                throw new Error('Invalid response structure received');
            }
            
            if (response.success) {
                // Successful save operation
                this.log(`✅ Save successful for: ${settingKey}`);
                
                // Update persistence manager cache if available
                if (this.persistenceManager && this.persistenceManager.settingsCache) {
                    this.persistenceManager.settingsCache.set(settingKey, {
                        value: settingValue,
                        timestamp: Date.now(),
                        source: 'database'
                    });
                }
                
                // Show success feedback
                this.showSuccessFeedback(`Setting "${settingKey}" saved successfully`);
                
                // Trigger success event
                this.triggerEvent('woow-setting-saved', {
                    key: settingKey,
                    value: settingValue,
                    response: response
                });
                
                return {
                    success: true,
                    data: response.data,
                    settingKey: settingKey,
                    settingValue: settingValue,
                    action: 'save_completed'
                };
                
            } else {
                // Save operation failed
                const errorMessage = this.extractErrorMessage(response);
                this.log(`❌ Save failed for: ${settingKey} - ${errorMessage}`);
                
                // Handle the error
                return await this.handleErrorResponse(
                    new Error(errorMessage),
                    {
                        operation: 'save',
                        settingKey: settingKey,
                        settingValue: settingValue,
                        originalRequest: context.originalRequest,
                        response: response
                    }
                );
            }
            
        } catch (error) {
            this.logError(`Failed to process save response for ${settingKey}:`, error);
            
            // Hide loading indicator on error
            this.hideLoadingIndicator('save');
            
            return await this.handleErrorResponse(error, {
                operation: 'save',
                settingKey: settingKey,
                settingValue: settingValue,
                originalRequest: context.originalRequest,
                response: response
            });
        }
    }
    
    /**
     * Handle load operation response
     * 
     * @param {Object} response - AJAX response object
     * @param {Object} context - Additional context information
     * @returns {Promise<Object>} Processing result
     */
    async handleLoadResponse(response, context = {}) {
        try {
            this.log('📥 Processing load response', response);
            
            // Hide loading indicator if it was shown
            if (context.showLoading !== false) {
                this.hideLoadingIndicator('load');
            }
            
            // Validate response structure
            if (!this.isValidResponse(response)) {
                throw new Error('Invalid response structure received');
            }
            
            if (response.success) {
                // Successful load operation
                const settings = response.data?.settings || response.data || {};
                
                this.log(`✅ Load successful - ${Object.keys(settings).length} settings loaded`);
                
                // Update persistence manager cache
                if (this.persistenceManager && this.persistenceManager.updateCacheFromSettings) {
                    this.persistenceManager.updateCacheFromSettings(settings, 'database');
                }
                
                // Show success feedback (optional for load operations)
                if (context.showFeedback) {
                    this.showSuccessFeedback('Settings loaded successfully');
                }
                
                // Trigger success event
                this.triggerEvent('woow-settings-loaded', {
                    settings: settings,
                    response: response
                });
                
                return {
                    success: true,
                    data: settings,
                    settingsCount: Object.keys(settings).length,
                    action: 'load_completed'
                };
                
            } else {
                // Load operation failed
                const errorMessage = this.extractErrorMessage(response);
                this.log(`❌ Load failed - ${errorMessage}`);
                
                // Handle the error
                return await this.handleErrorResponse(
                    new Error(errorMessage),
                    {
                        operation: 'load',
                        originalRequest: context.originalRequest,
                        response: response
                    }
                );
            }
            
        } catch (error) {
            this.logError('Failed to process load response:', error);
            
            // Hide loading indicator on error
            this.hideLoadingIndicator('load');
            
            return await this.handleErrorResponse(error, {
                operation: 'load',
                originalRequest: context.originalRequest,
                response: response
            });
        }
    }  
  /**
     * Handle error response with specific error type handling
     * 
     * @param {Error} error - Error object
     * @param {Object} context - Error context information
     * @returns {Promise<Object>} Error handling result
     */
    async handleErrorResponse(error, context = {}) {
        try {
            this.logError('🚨 Handling error response:', error);
            
            // Classify the error type
            const errorType = this.classifyError(error, context);
            
            // Check if error is retryable
            const isRetryable = this.isRetryableError(error, context);
            
            // Handle specific error types
            let recoveryResult;
            
            if (isRetryable && this.shouldRetry(context)) {
                // Attempt retry with exponential backoff
                recoveryResult = await this.scheduleRetry(error, context);
            } else {
                // Use error recovery manager if available
                if (this.errorRecoveryManager) {
                    recoveryResult = await this.errorRecoveryManager.handleError(error, context);
                } else {
                    // Fallback error handling
                    recoveryResult = await this.handleErrorFallback(error, context);
                }
            }
            
            // Show error feedback to user
            this.showErrorFeedback(error, context, recoveryResult);
            
            // Trigger error event
            this.triggerEvent('woow-ajax-error', {
                error: error,
                context: context,
                recoveryResult: recoveryResult
            });
            
            return {
                success: false,
                error: error,
                errorType: errorType,
                recoveryResult: recoveryResult,
                action: 'error_handled'
            };
            
        } catch (handlingError) {
            this.logError('Failed to handle error response:', handlingError);
            
            return {
                success: false,
                error: handlingError,
                originalError: error,
                action: 'error_handling_failed'
            };
        }
    }
    
    /**
     * Handle sync operation response
     * 
     * @param {Object} response - AJAX response object
     * @param {Object} context - Additional context information
     * @returns {Promise<Object>} Processing result
     */
    async handleSyncResponse(response, context = {}) {
        try {
            this.log('🔄 Processing sync response', response);
            
            // Hide loading indicator if it was shown
            if (context.showLoading !== false) {
                this.hideLoadingIndicator('sync');
            }
            
            if (!this.isValidResponse(response)) {
                throw new Error('Invalid response structure received');
            }
            
            if (response.success) {
                const syncData = response.data || {};
                
                this.log('✅ Sync successful');
                
                // Show success feedback
                this.showSuccessFeedback('Settings synchronized successfully');
                
                // Trigger success event
                this.triggerEvent('woow-settings-synced', {
                    syncData: syncData,
                    response: response
                });
                
                return {
                    success: true,
                    data: syncData,
                    action: 'sync_completed'
                };
                
            } else {
                const errorMessage = this.extractErrorMessage(response);
                this.log(`❌ Sync failed - ${errorMessage}`);
                
                return await this.handleErrorResponse(
                    new Error(errorMessage),
                    {
                        operation: 'sync',
                        originalRequest: context.originalRequest,
                        response: response
                    }
                );
            }
            
        } catch (error) {
            this.logError('Failed to process sync response:', error);
            
            // Hide loading indicator on error
            this.hideLoadingIndicator('sync');
            
            return await this.handleErrorResponse(error, {
                operation: 'sync',
                originalRequest: context.originalRequest,
                response: response
            });
        }
    }
    
    /**
     * Handle reset operation response
     * 
     * @param {Object} response - AJAX response object
     * @param {Object} context - Additional context information
     * @returns {Promise<Object>} Processing result
     */
    async handleResetResponse(response, context = {}) {
        try {
            this.log('🔄 Processing reset response', response);
            
            // Hide loading indicator if it was shown
            if (context.showLoading !== false) {
                this.hideLoadingIndicator('reset');
            }
            
            if (!this.isValidResponse(response)) {
                throw new Error('Invalid response structure received');
            }
            
            if (response.success) {
                this.log('✅ Reset successful');
                
                // Clear persistence manager cache
                if (this.persistenceManager && this.persistenceManager.clearCache) {
                    this.persistenceManager.clearCache();
                }
                
                // Show success feedback
                this.showSuccessFeedback('Settings reset to defaults successfully');
                
                // Trigger success event
                this.triggerEvent('woow-settings-reset', {
                    response: response
                });
                
                return {
                    success: true,
                    data: response.data,
                    action: 'reset_completed'
                };
                
            } else {
                const errorMessage = this.extractErrorMessage(response);
                this.log(`❌ Reset failed - ${errorMessage}`);
                
                return await this.handleErrorResponse(
                    new Error(errorMessage),
                    {
                        operation: 'reset',
                        originalRequest: context.originalRequest,
                        response: response
                    }
                );
            }
            
        } catch (error) {
            this.logError('Failed to process reset response:', error);
            
            // Hide loading indicator on error
            this.hideLoadingIndicator('reset');
            
            return await this.handleErrorResponse(error, {
                operation: 'reset',
                originalRequest: context.originalRequest,
                response: response
            });
        }
    }    /*
*
     * Schedule retry for failed request
     * 
     * @param {Error} error - Original error
     * @param {Object} context - Request context
     * @returns {Promise<Object>} Retry result
     */
    async scheduleRetry(error, context) {
        const retryId = `retry_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const currentAttempts = context.attempts || 0;
        
        if (currentAttempts >= this.config.maxRetries) {
            this.log(`❌ Max retry attempts reached for ${context.operation}`);
            return {
                success: false,
                error: new Error('Maximum retry attempts exceeded'),
                action: 'retry_limit_reached'
            };
        }
        
        // Calculate delay with exponential backoff
        const delay = this.config.retryDelayBase * 
            Math.pow(this.config.exponentialBackoffMultiplier, currentAttempts);
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const finalDelay = delay + jitter;
        
        // Add to retry queue
        this.retryQueue.set(retryId, {
            ...context,
            attempts: currentAttempts + 1,
            scheduledFor: Date.now() + finalDelay,
            originalError: error
        });
        
        this.log(`🔄 Retry scheduled for ${finalDelay}ms (attempt ${currentAttempts + 1})`);
        
        // Schedule the retry
        setTimeout(async () => {
            await this.executeRetry(retryId);
        }, finalDelay);
        
        return {
            success: true,
            action: 'retry_scheduled',
            retryId: retryId,
            delay: finalDelay,
            attempt: currentAttempts + 1
        };
    }
    
    /**
     * Execute a scheduled retry
     * 
     * @param {string} retryId - Retry identifier
     */
    async executeRetry(retryId) {
        const retryContext = this.retryQueue.get(retryId);
        
        if (!retryContext) {
            this.log(`❌ Retry context not found: ${retryId}`);
            return;
        }
        
        try {
            this.log(`🔄 Executing retry ${retryId} (attempt ${retryContext.attempts})`);
            
            // Re-execute the original request
            let result;
            
            if (retryContext.originalRequest) {
                // Make the request again (this would typically go through the persistence manager)
                if (this.persistenceManager) {
                    switch (retryContext.operation) {
                        case 'save':
                            if (retryContext.settingKey && retryContext.settingValue !== undefined) {
                                result = await this.persistenceManager.saveSetting(
                                    retryContext.settingKey,
                                    retryContext.settingValue,
                                    true // immediate save
                                );
                            }
                            break;
                            
                        case 'load':
                            result = await this.persistenceManager.loadSettings(true); // force refresh
                            break;
                            
                        case 'sync':
                            result = await this.persistenceManager.syncWithDatabase();
                            break;
                    }
                }
            }
            
            if (result) {
                // Success - remove from retry queue
                this.retryQueue.delete(retryId);
                this.log(`✅ Retry ${retryId} succeeded`);
                
                // Show success feedback
                this.showSuccessFeedback('Connection restored. Operation completed successfully.');
                
            } else {
                // Failed - schedule another retry if attempts remain
                if (retryContext.attempts < this.config.maxRetries) {
                    await this.scheduleRetry(retryContext.originalError, retryContext);
                } else {
                    this.log(`❌ Retry ${retryId} failed after max attempts`);
                    this.retryQueue.delete(retryId);
                    
                    // Show final failure feedback
                    this.showErrorFeedback(
                        new Error('Operation failed after multiple retry attempts'),
                        retryContext,
                        { success: false, action: 'retry_limit_reached' }
                    );
                }
            }
            
        } catch (retryError) {
            this.logError(`❌ Retry ${retryId} failed:`, retryError);
            
            // Handle the retry error
            await this.handleErrorResponse(retryError, {
                ...retryContext,
                isRetry: true
            });
        }
    }
    
    /**
     * Fallback error handling when error recovery manager is not available
     * 
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Fallback result
     */
    async handleErrorFallback(error, context) {
        this.log('🔧 Using fallback error handling');
        
        // Try to save to localStorage as fallback for save operations
        if (context.operation === 'save' && context.settingKey && context.settingValue !== undefined) {
            try {
                if (this.persistenceManager && this.persistenceManager.updateLocalStorage) {
                    await this.persistenceManager.updateLocalStorage(context.settingKey, context.settingValue);
                    
                    return {
                        success: true,
                        fallbackApplied: true,
                        action: 'saved_to_localStorage'
                    };
                }
            } catch (fallbackError) {
                this.logError('Fallback to localStorage failed:', fallbackError);
            }
        }
        
        // For load operations, try localStorage fallback
        if (context.operation === 'load') {
            try {
                if (this.persistenceManager && this.persistenceManager.loadFromLocalStorage) {
                    const localSettings = this.persistenceManager.loadFromLocalStorage();
                    
                    if (localSettings) {
                        return {
                            success: true,
                            data: localSettings,
                            fallbackApplied: true,
                            action: 'loaded_from_localStorage'
                        };
                    }
                }
            } catch (fallbackError) {
                this.logError('Fallback to localStorage failed:', fallbackError);
            }
        }
        
        return {
            success: false,
            fallbackApplied: false,
            action: 'no_fallback_available'
        };
    } 
   // Utility Methods
    
    /**
     * Validate response structure
     * 
     * @param {Object} response - Response to validate
     * @returns {boolean} Validation result
     */
    isValidResponse(response) {
        return response && 
               typeof response === 'object' && 
               typeof response.success === 'boolean';
    }
    
    /**
     * Extract error message from response
     * 
     * @param {Object} response - Response object
     * @returns {string} Error message
     */
    extractErrorMessage(response) {
        if (response.data && response.data.message) {
            return response.data.message;
        }
        
        if (response.message) {
            return response.message;
        }
        
        if (response.error) {
            return response.error;
        }
        
        return 'Unknown error occurred';
    }
    
    /**
     * Classify error type
     * 
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     * @returns {string} Error type
     */
    classifyError(error, context) {
        // Network errors
        if (!navigator.onLine || 
            this.config.networkErrorCodes.includes(context.response?.status) ||
            this.config.retryableErrorMessages.some(msg => 
                error.message.toLowerCase().includes(msg.toLowerCase())
            )) {
            return 'network';
        }
        
        // Validation errors
        if (error.message.includes('validation') || 
            error.message.includes('invalid') ||
            context.response?.status === 400) {
            return 'validation';
        }
        
        // Authentication/authorization errors
        if (context.response?.status === 401 || 
            context.response?.status === 403 ||
            error.message.includes('nonce') ||
            error.message.includes('permission')) {
            return 'auth';
        }
        
        // Server errors
        if (context.response?.status >= 500) {
            return 'server';
        }
        
        return 'unknown';
    }
    
    /**
     * Check if error is retryable
     * 
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     * @returns {boolean} Retryable status
     */
    isRetryableError(error, context) {
        const errorType = this.classifyError(error, context);
        
        // Network and server errors are generally retryable
        if (errorType === 'network' || errorType === 'server') {
            return true;
        }
        
        // Validation and auth errors are not retryable
        if (errorType === 'validation' || errorType === 'auth') {
            return false;
        }
        
        // Check specific error messages
        return this.config.retryableErrorMessages.some(msg => 
            error.message.toLowerCase().includes(msg.toLowerCase())
        );
    }
    
    /**
     * Check if we should retry based on context
     * 
     * @param {Object} context - Error context
     * @returns {boolean} Should retry status
     */
    shouldRetry(context) {
        const currentAttempts = context.attempts || 0;
        return currentAttempts < this.config.maxRetries && 
               context.retryable !== false;
    }
    
    /**
     * Show success feedback to user
     * 
     * @param {string} message - Success message
     */
    showSuccessFeedback(message) {
        if (this.userFeedbackSystem && this.userFeedbackSystem.showSuccess) {
            this.userFeedbackSystem.showSuccess(message);
        } else {
            this.log(`✅ ${message}`);
        }
    }
    
    /**
     * Show error feedback to user
     * 
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     * @param {Object} recoveryResult - Recovery result
     */
    showErrorFeedback(error, context, recoveryResult) {
        let message = error.message;
        
        // Customize message based on recovery result
        if (recoveryResult && recoveryResult.fallbackApplied) {
            switch (recoveryResult.action) {
                case 'saved_to_localStorage':
                    message = 'Settings saved locally. Will sync when connection is restored.';
                    break;
                case 'loaded_from_localStorage':
                    message = 'Loaded settings from local backup. Some changes may be missing.';
                    break;
                case 'retry_scheduled':
                    message = 'Connection issue detected. Retrying automatically...';
                    break;
            }
        }
        
        if (this.userFeedbackSystem) {
            if (recoveryResult && recoveryResult.fallbackApplied) {
                this.userFeedbackSystem.showWarning(message);
            } else {
                this.userFeedbackSystem.showError(message);
            }
        } else {
            this.logError(`❌ ${message}`);
        }
    }
    
    /**
     * Trigger custom event
     * 
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail data
     */
    triggerEvent(eventName, detail) {
        try {
            const event = new CustomEvent(eventName, {
                detail: detail,
                bubbles: true,
                cancelable: true
            });
            
            window.dispatchEvent(event);
            
        } catch (error) {
            this.logError('Failed to trigger event:', error);
        }
    }
    
    /**
     * Get retry queue statistics
     * 
     * @returns {Object} Retry queue stats
     */
    getRetryStats() {
        return {
            queueSize: this.retryQueue.size,
            pendingRetries: Array.from(this.retryQueue.values()).map(retry => ({
                operation: retry.operation,
                attempts: retry.attempts,
                scheduledFor: retry.scheduledFor
            }))
        };
    }
    
    /**
     * Clear retry queue
     */
    clearRetryQueue() {
        this.retryQueue.clear();
        this.log('🧹 Retry queue cleared');
    }
    
    /**
     * Debug logging
     * 
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    log(message, data = null) {
        if (window.masV2Debug || window.woowDebug) {
            if (data) {
                console.log(`[AjaxResponseHandler] ${message}`, data);
            } else {
                console.log(`[AjaxResponseHandler] ${message}`);
            }
        }
    }
    
    /**
     * Error logging
     * 
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    logError(message, error) {
        console.error(`[AjaxResponseHandler] ${message}`, error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AjaxResponseHandler;
}

// Global instance for immediate use
window.AjaxResponseHandler = AjaxResponseHandler;