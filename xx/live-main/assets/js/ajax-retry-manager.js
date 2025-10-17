/**
 * AJAX Retry Manager - Robust Error Handling and Retry Mechanisms
 * 
 * Provides intelligent retry logic for failed AJAX requests with:
 * - Exponential backoff for retries
 * - Request queuing for burst saves
 * - Network failure detection
 * - Comprehensive error logging
 * - Rate limiting prevention
 * 
 * @package WOOW Admin Styler
 * @version 2.4.0 - Security Overhaul
 */

class AjaxRetryManager {
    constructor(options = {}) {
        this.options = {
            maxRetries: options.maxRetries || 3,
            baseDelay: options.baseDelay || 1000, // 1 second
            maxDelay: options.maxDelay || 10000, // 10 seconds
            backoffMultiplier: options.backoffMultiplier || 2,
            queueMaxSize: options.queueMaxSize || 50,
            rateLimitDelay: options.rateLimitDelay || 60000, // 1 minute
            ...options
        };
        
        this.requestQueue = [];
        this.activeRequests = new Map();
        this.failedRequests = new Map();
        this.rateLimitedEndpoints = new Set();
        this.networkStatus = 'online';
        
        this.initializeNetworkMonitoring();
        this.initializeRequestProcessor();
    }
    
    /**
     * Initialize network status monitoring
     */
    initializeNetworkMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.networkStatus = 'online';
            this.processQueuedRequests();
        });
        
        window.addEventListener('offline', () => {
            this.networkStatus = 'offline';
        });
        
        // Initial network status
        this.networkStatus = navigator.onLine ? 'online' : 'offline';
    }
    
    /**
     * Initialize request processor
     */
    initializeRequestProcessor() {
        // Process queue every 100ms
        setInterval(() => {
            this.processQueuedRequests();
        }, 100);
        
        // Clean up old failed requests every 5 minutes
        setInterval(() => {
            this.cleanupFailedRequests();
        }, 300000);
    }
    
    /**
     * Make AJAX request with retry logic
     * 
     * @param {Object} requestConfig Request configuration
     * @returns {Promise} Request promise
     */
    async makeRequest(requestConfig) {
        const requestId = this.generateRequestId();
        const request = {
            id: requestId,
            config: requestConfig,
            attempts: 0,
            createdAt: Date.now(),
            priority: requestConfig.priority || 'normal'
        };
        
        // Check if endpoint is rate limited
        if (this.rateLimitedEndpoints.has(requestConfig.data.action)) {
            return this.queueRequest(request);
        }
        
        // Check network status
        if (this.networkStatus === 'offline') {
            return this.queueRequest(request);
        }
        
        return this.executeRequest(request);
    }
    
    /**
     * Execute AJAX request with retry logic
     * 
     * @param {Object} request Request object
     * @returns {Promise} Request promise
     */
    async executeRequest(request) {
        const { config } = request;
        request.attempts++;
        
        // Add request to active requests
        this.activeRequests.set(request.id, request);
        
        try {
            // Prepare request data with security nonce
            const requestData = {
                action: config.data.action,
                nonce: masV2Ajax.nonce,
                ...config.data
            };
            
            // Make jQuery AJAX request
            const response = await new Promise((resolve, reject) => {
                jQuery.ajax({
                    url: masV2Ajax.ajaxUrl,
                    type: 'POST',
                    data: requestData,
                    timeout: config.timeout || 30000,
                    success: (data) => resolve(data),
                    error: (xhr, status, error) => reject({ xhr, status, error })
                });
            });
            
            // Remove from active requests
            this.activeRequests.delete(request.id);
            
            // Handle successful response
            return this.handleSuccessResponse(request, response);
            
        } catch (error) {
            // Remove from active requests
            this.activeRequests.delete(request.id);
            
            // Handle error with retry logic
            return this.handleErrorResponse(request, error);
        }
    }
    
    /**
     * Handle successful response
     * 
     * @param {Object} request Request object
     * @param {Object} response Response data
     * @returns {Object} Response data
     */
    handleSuccessResponse(request, response) {
        // Remove from failed requests if it was there
        this.failedRequests.delete(request.id);
        
        // Log successful retry if this was a retry
        if (request.attempts > 1) {
            console.log(`MAS V2: Request ${request.config.data.action} succeeded after ${request.attempts} attempts`);
        }
        
        // Validate response format
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid response format');
        }
        
        // Handle WordPress AJAX response format
        if (response.success === false) {
            throw new Error(response.data?.message || 'Request failed');
        }
        
        return response;
    }
    
    /**
     * Handle error response with retry logic
     * 
     * @param {Object} request Request object
     * @param {Object} error Error object
     * @returns {Promise} Retry promise or rejection
     */
    async handleErrorResponse(request, error) {
        const { xhr, status } = error;
        
        // Determine if error is retryable
        const isRetryable = this.isRetryableError(error);
        const hasRetriesLeft = request.attempts < this.options.maxRetries;
        
        // Handle rate limiting
        if (xhr?.status === 429 || (xhr?.responseJSON?.code === 'rate_limit_exceeded')) {
            this.handleRateLimitError(request, error);
            return this.queueRequest(request);
        }
        
        // Handle security errors (don't retry)
        if (xhr?.responseJSON?.code === 'security_error') {
            this.logSecurityError(request, error);
            throw new Error('Security validation failed. Please refresh the page.');
        }
        
        // Retry if possible
        if (isRetryable && hasRetriesLeft) {
            return this.retryRequest(request, error);
        }
        
        // Log final failure
        this.logFinalFailure(request, error);
        
        // Store in failed requests
        this.failedRequests.set(request.id, {
            ...request,
            finalError: error,
            failedAt: Date.now()
        });
        
        // Throw final error
        const errorMessage = this.getErrorMessage(error);
        throw new Error(errorMessage);
    }
    
    /**
     * Retry request with exponential backoff
     * 
     * @param {Object} request Request object
     * @param {Object} error Previous error
     * @returns {Promise} Retry promise
     */
    async retryRequest(request, error) {
        const delay = this.calculateRetryDelay(request.attempts);
        
        console.log(`MAS V2: Retrying ${request.config.data.action} in ${delay}ms (attempt ${request.attempts + 1}/${this.options.maxRetries})`);
        
        // Wait for delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        return this.executeRequest(request);
    }
    
    /**
     * Calculate retry delay with exponential backoff
     * 
     * @param {number} attempt Attempt number
     * @returns {number} Delay in milliseconds
     */
    calculateRetryDelay(attempt) {
        const delay = this.options.baseDelay * Math.pow(this.options.backoffMultiplier, attempt - 1);
        return Math.min(delay, this.options.maxDelay);
    }
    
    /**
     * Check if error is retryable
     * 
     * @param {Object} error Error object
     * @returns {boolean} True if retryable
     */
    isRetryableError(error) {
        const { xhr, status } = error;
        
        // Network errors are retryable
        if (status === 'timeout' || status === 'error') {
            return true;
        }
        
        // HTTP status codes that are retryable
        const retryableStatusCodes = [0, 408, 429, 500, 502, 503, 504];
        if (xhr?.status && retryableStatusCodes.includes(xhr.status)) {
            return true;
        }
        
        // Server errors are retryable
        if (xhr?.status >= 500) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Queue request for later processing
     * 
     * @param {Object} request Request object
     * @returns {Promise} Queued request promise
     */
    queueRequest(request) {
        return new Promise((resolve, reject) => {
            // Check queue size
            if (this.requestQueue.length >= this.options.queueMaxSize) {
                reject(new Error('Request queue is full'));
                return;
            }
            
            // Add to queue with promise handlers
            this.requestQueue.push({
                ...request,
                resolve,
                reject,
                queuedAt: Date.now()
            });
            
            // Sort queue by priority
            this.requestQueue.sort((a, b) => {
                const priorityOrder = { high: 3, normal: 2, low: 1 };
                return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
            });
        });
    }
    
    /**
     * Process queued requests
     */
    async processQueuedRequests() {
        if (this.networkStatus === 'offline' || this.requestQueue.length === 0) {
            return;
        }
        
        // Process up to 3 requests at a time
        const batchSize = 3;
        const batch = this.requestQueue.splice(0, batchSize);
        
        for (const queuedRequest of batch) {
            try {
                const response = await this.executeRequest(queuedRequest);
                queuedRequest.resolve(response);
            } catch (error) {
                queuedRequest.reject(error);
            }
        }
    }
    
    /**
     * Handle rate limit error
     * 
     * @param {Object} request Request object
     * @param {Object} error Error object
     */
    handleRateLimitError(request, error) {
        const endpoint = request.config.data.action;
        
        // Add endpoint to rate limited set
        this.rateLimitedEndpoints.add(endpoint);
        
        // Remove from rate limited set after delay
        setTimeout(() => {
            this.rateLimitedEndpoints.delete(endpoint);
        }, this.options.rateLimitDelay);
        
        console.warn(`MAS V2: Rate limit hit for ${endpoint}. Queuing request.`);
    }
    
    /**
     * Log security error
     * 
     * @param {Object} request Request object
     * @param {Object} error Error object
     */
    logSecurityError(request, error) {
        console.error('MAS V2: Security error:', {
            action: request.config.data.action,
            error: error,
            attempts: request.attempts
        });
        
        // Send error to server for logging
        this.sendErrorToServer('security_error', {
            action: request.config.data.action,
            error_message: this.getErrorMessage(error),
            attempts: request.attempts
        });
    }
    
    /**
     * Log final failure
     * 
     * @param {Object} request Request object
     * @param {Object} error Error object
     */
    logFinalFailure(request, error) {
        console.error('MAS V2: Request failed after all retries:', {
            action: request.config.data.action,
            attempts: request.attempts,
            error: error
        });
        
        // Send error to server for logging
        this.sendErrorToServer('ajax_failure', {
            action: request.config.data.action,
            error_message: this.getErrorMessage(error),
            attempts: request.attempts,
            total_time: Date.now() - request.createdAt
        });
    }
    
    /**
     * Send error to server for logging
     * 
     * @param {string} errorType Error type
     * @param {Object} errorData Error data
     */
    sendErrorToServer(errorType, errorData) {
        // Don't retry error logging requests
        jQuery.ajax({
            url: masV2Ajax.ajaxUrl,
            type: 'POST',
            data: {
                action: 'mas_v2_log_error',
                nonce: masV2Ajax.nonce,
                error_data: JSON.stringify({
                    type: errorType,
                    data: errorData,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    url: window.location.href
                })
            },
            timeout: 5000
        });
    }
    
    /**
     * Get user-friendly error message
     * 
     * @param {Object} error Error object
     * @returns {string} Error message
     */
    getErrorMessage(error) {
        const { xhr, status } = error;
        
        // Check for server response message
        if (xhr?.responseJSON?.message) {
            return xhr.responseJSON.message;
        }
        
        // Check for server response data
        if (xhr?.responseJSON?.data?.message) {
            return xhr.responseJSON.data.message;
        }
        
        // Status-based messages
        switch (status) {
            case 'timeout':
                return 'Request timed out. Please try again.';
            case 'error':
                return 'Network error. Please check your connection.';
            case 'parsererror':
                return 'Server response error. Please try again.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }
    
    /**
     * Clean up old failed requests
     */
    cleanupFailedRequests() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        for (const [id, request] of this.failedRequests.entries()) {
            if (now - request.failedAt > maxAge) {
                this.failedRequests.delete(id);
            }
        }
    }
    
    /**
     * Generate unique request ID
     * 
     * @returns {string} Request ID
     */
    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Get retry manager statistics
     * 
     * @returns {Object} Statistics
     */
    getStatistics() {
        return {
            activeRequests: this.activeRequests.size,
            queuedRequests: this.requestQueue.length,
            failedRequests: this.failedRequests.size,
            rateLimitedEndpoints: Array.from(this.rateLimitedEndpoints),
            networkStatus: this.networkStatus
        };
    }
    
    /**
     * Clear all queued requests
     */
    clearQueue() {
        this.requestQueue.forEach(request => {
            request.reject(new Error('Request queue cleared'));
        });
        this.requestQueue = [];
    }
    
    /**
     * Retry all failed requests
     */
    async retryFailedRequests() {
        const failedRequests = Array.from(this.failedRequests.values());
        this.failedRequests.clear();
        
        for (const request of failedRequests) {
            try {
                // Reset attempt count for retry
                request.attempts = 0;
                await this.executeRequest(request);
            } catch (error) {
                console.error('Failed to retry request:', error);
            }
        }
    }
}

// Global instance
window.masAjaxRetryManager = new AjaxRetryManager();

// Enhanced AJAX helper functions
window.masAjax = {
    /**
     * Make AJAX request with retry logic
     * 
     * @param {string} action AJAX action
     * @param {Object} data Request data
     * @param {Object} options Request options
     * @returns {Promise} Request promise
     */
    async request(action, data = {}, options = {}) {
        return window.masAjaxRetryManager.makeRequest({
            data: { action, ...data },
            ...options
        });
    },
    
    /**
     * Save live settings with retry logic
     * 
     * @param {Object} settings Settings to save
     * @returns {Promise} Request promise
     */
    async saveLiveSettings(settings) {
        return this.request('mas_save_live_settings', { settings: JSON.stringify(settings) }, {
            priority: 'high'
        });
    },
    
    /**
     * Get live settings with retry logic
     * 
     * @returns {Promise} Request promise
     */
    async getLiveSettings() {
        return this.request('mas_get_live_settings', {}, {
            priority: 'high'
        });
    },
    
    /**
     * Reset live setting with retry logic
     * 
     * @param {string} optionId Option ID to reset
     * @returns {Promise} Request promise
     */
    async resetLiveSetting(optionId) {
        return this.request('mas_reset_live_setting', { option_id: optionId }, {
            priority: 'normal'
        });
    },
    
    /**
     * Restore all defaults with retry logic
     * 
     * @returns {Promise} Request promise
     */
    async restoreDefaults() {
        return this.request('mas_restore_defaults', {}, {
            priority: 'normal'
        });
    },
    
    /**
     * Export settings with retry logic
     * 
     * @returns {Promise} Request promise
     */
    async exportSettings() {
        return this.request('mas_export_settings', {}, {
            priority: 'low'
        });
    },
    
    /**
     * Import settings with retry logic
     * 
     * @param {Object} data Settings data to import
     * @returns {Promise} Request promise
     */
    async importSettings(data) {
        return this.request('mas_import_settings', { data: JSON.stringify(data) }, {
            priority: 'low'
        });
    }
};

// Initialize when DOM is ready
jQuery(document).ready(function($) {
    console.log('MAS V2: AJAX Retry Manager initialized');
    
    // Show network status in debug mode
    if (window.masV2Debug) {
        setInterval(() => {
            const stats = window.masAjaxRetryManager.getStatistics();
            console.log('MAS V2 AJAX Stats:', stats);
        }, 30000); // Every 30 seconds
    }
});