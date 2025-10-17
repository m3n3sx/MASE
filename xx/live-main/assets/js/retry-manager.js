/**
 * Retry Manager
 * 
 * Advanced retry logic system with exponential backoff, circuit breaker pattern,
 * and intelligent failure handling for AJAX requests.
 * 
 * @package WOOW! Admin Styler
 * @version 1.0.0
 */

class RetryManager {
    constructor(options = {}) {
        // Configuration
        this.config = {
            maxRetries: 3,
            baseDelay: 1000, // 1 second base delay
            maxDelay: 30000, // 30 seconds max delay
            backoffMultiplier: 2, // Exponential backoff multiplier
            jitterFactor: 0.1, // Add randomness to prevent thundering herd
            circuitBreakerThreshold: 5, // Failures before circuit opens
            circuitBreakerTimeout: 60000, // 1 minute circuit breaker timeout
            retryableErrors: ['network', 'timeout', 'server', '500', '502', '503', '504'],
            nonRetryableErrors: ['security', 'validation', 'permission', '400', '401', '403', '404'],
            ...options
        };
        
        // Retry queue for failed requests
        this.retryQueue = new Map();
        
        // Circuit breaker state per endpoint
        this.circuitBreakers = new Map();
        
        // Request statistics for monitoring
        this.stats = {
            totalRequests: 0,
            totalRetries: 0,
            successfulRetries: 0,
            failedRetries: 0,
            circuitBreakerTrips: 0
        };
        
        // Active retry timers
        this.retryTimers = new Map();
        
        // Network status tracking
        this.isOnline = navigator.onLine;
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        this.log('🚀 RetryManager initialized');
    }
    
    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.log('🌐 Network back online - processing retry queue');
            this.processRetryQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.log('📴 Network offline detected');
        });
    }
    
    /**
     * Add request to retry queue
     * 
     * @param {string} requestId - Unique request identifier
     * @param {Function} requestFunction - Function to retry
     * @param {Object} requestData - Request data
     * @param {Object} options - Retry options
     * @returns {Promise} Retry promise
     */
    async addToRetryQueue(requestId, requestFunction, requestData, options = {}) {
        const retryConfig = {
            maxRetries: options.maxRetries || this.config.maxRetries,
            baseDelay: options.baseDelay || this.config.baseDelay,
            backoffMultiplier: options.backoffMultiplier || this.config.backoffMultiplier,
            endpoint: options.endpoint || 'unknown',
            ...options
        };
        
        // Check circuit breaker
        if (this.isCircuitOpen(retryConfig.endpoint)) {
            this.log(`⚡ Circuit breaker open for ${retryConfig.endpoint} - rejecting request`);
            throw new Error(`Circuit breaker open for ${retryConfig.endpoint}`);
        }
        
        const retryData = {
            requestId,
            requestFunction,
            requestData,
            config: retryConfig,
            attempts: 0,
            createdAt: Date.now(),
            lastAttempt: null,
            errors: []
        };
        
        this.retryQueue.set(requestId, retryData);
        this.stats.totalRequests++;
        
        this.log(`🔄 Added to retry queue: ${requestId} (endpoint: ${retryConfig.endpoint})`);
        
        // Start retry process
        return this.executeRetry(requestId);
    }
    
    /**
     * Execute retry for a specific request
     * 
     * @param {string} requestId - Request identifier
     * @returns {Promise} Retry result
     */
    async executeRetry(requestId) {
        const retryData = this.retryQueue.get(requestId);
        
        if (!retryData) {
            throw new Error(`Retry data not found for request: ${requestId}`);
        }
        
        return new Promise((resolve, reject) => {
            this.performRetryAttempt(requestId, resolve, reject);
        });
    }
    
    /**
     * Perform individual retry attempt
     * 
     * @param {string} requestId - Request identifier
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     */
    async performRetryAttempt(requestId, resolve, reject) {
        const retryData = this.retryQueue.get(requestId);
        
        if (!retryData) {
            reject(new Error(`Retry data not found for request: ${requestId}`));
            return;
        }
        
        retryData.attempts++;
        retryData.lastAttempt = Date.now();
        
        this.log(`🔄 Retry attempt ${retryData.attempts}/${retryData.config.maxRetries} for ${requestId}`);
        
        try {
            // Check if we're online for network requests
            if (!this.isOnline && this.isNetworkRequest(retryData)) {
                this.log(`📴 Offline - delaying retry for ${requestId}`);
                this.scheduleRetry(requestId, resolve, reject, 5000); // Wait 5 seconds when offline
                return;
            }
            
            // Execute the request function
            const result = await retryData.requestFunction(retryData.requestData);
            
            // Success - clean up and resolve
            this.handleRetrySuccess(requestId, result);
            resolve(result);
            
        } catch (error) {
            this.handleRetryError(requestId, error, resolve, reject);
        }
    }
    
    /**
     * Handle successful retry
     * 
     * @param {string} requestId - Request identifier
     * @param {*} result - Success result
     */
    handleRetrySuccess(requestId, result) {
        const retryData = this.retryQueue.get(requestId);
        
        if (retryData) {
            this.log(`✅ Retry successful for ${requestId} after ${retryData.attempts} attempts`);
            
            // Update statistics
            this.stats.successfulRetries++;
            
            // Reset circuit breaker for this endpoint
            this.resetCircuitBreaker(retryData.config.endpoint);
            
            // Clean up
            this.cleanupRetry(requestId);
        }
    }
    
    /**
     * Handle retry error
     * 
     * @param {string} requestId - Request identifier
     * @param {Error} error - Error object
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     */
    handleRetryError(requestId, error, resolve, reject) {
        const retryData = this.retryQueue.get(requestId);
        
        if (!retryData) {
            reject(error);
            return;
        }
        
        // Store error for analysis
        retryData.errors.push({
            attempt: retryData.attempts,
            error: error.message,
            timestamp: Date.now()
        });
        
        this.log(`❌ Retry attempt ${retryData.attempts} failed for ${requestId}: ${error.message}`);
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
            this.log(`🚫 Non-retryable error for ${requestId}: ${error.message}`);
            this.handleFinalFailure(requestId, error);
            reject(error);
            return;
        }
        
        // Check if max retries reached
        if (retryData.attempts >= retryData.config.maxRetries) {
            this.log(`🚫 Max retries reached for ${requestId}`);
            this.handleFinalFailure(requestId, error);
            reject(new Error(`Max retries (${retryData.config.maxRetries}) exceeded for request ${requestId}`));
            return;
        }
        
        // Schedule next retry
        const delay = this.calculateRetryDelay(retryData.attempts, retryData.config);
        this.scheduleRetry(requestId, resolve, reject, delay);
    }
    
    /**
     * Handle final failure after all retries exhausted
     * 
     * @param {string} requestId - Request identifier
     * @param {Error} finalError - Final error
     */
    handleFinalFailure(requestId, finalError) {
        const retryData = this.retryQueue.get(requestId);
        
        if (retryData) {
            // Update statistics
            this.stats.failedRetries++;
            
            // Update circuit breaker
            this.recordFailure(retryData.config.endpoint);
            
            // Log failure details
            this.log(`💥 Final failure for ${requestId} after ${retryData.attempts} attempts:`, {
                endpoint: retryData.config.endpoint,
                errors: retryData.errors,
                totalTime: Date.now() - retryData.createdAt
            });
            
            // Clean up
            this.cleanupRetry(requestId);
        }
    }
    
    /**
     * Schedule next retry attempt
     * 
     * @param {string} requestId - Request identifier
     * @param {Function} resolve - Promise resolve function
     * @param {Function} reject - Promise reject function
     * @param {number} delay - Delay in milliseconds
     */
    scheduleRetry(requestId, resolve, reject, delay) {
        this.log(`⏰ Scheduling retry for ${requestId} in ${delay}ms`);
        
        // Clear any existing timer
        const existingTimer = this.retryTimers.get(requestId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        
        // Schedule new retry
        const timer = setTimeout(() => {
            this.retryTimers.delete(requestId);
            this.performRetryAttempt(requestId, resolve, reject);
        }, delay);
        
        this.retryTimers.set(requestId, timer);
        this.stats.totalRetries++;
    }
    
    /**
     * Calculate retry delay with exponential backoff and jitter
     * 
     * @param {number} attempt - Current attempt number
     * @param {Object} config - Retry configuration
     * @returns {number} Delay in milliseconds
     */
    calculateRetryDelay(attempt, config) {
        // Exponential backoff
        let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
        
        // Apply maximum delay limit
        delay = Math.min(delay, config.maxDelay || this.config.maxDelay);
        
        // Add jitter to prevent thundering herd
        const jitter = delay * this.config.jitterFactor * Math.random();
        delay += jitter;
        
        return Math.round(delay);
    }
    
    /**
     * Check if error is retryable
     * 
     * @param {Error} error - Error object
     * @returns {boolean} Whether error is retryable
     */
    isRetryableError(error) {
        const errorMessage = error.message.toLowerCase();
        const errorCode = error.status || error.code;
        
        // Check non-retryable errors first
        for (const nonRetryable of this.config.nonRetryableErrors) {
            if (errorMessage.includes(nonRetryable.toLowerCase()) || 
                errorCode === nonRetryable) {
                return false;
            }
        }
        
        // Check retryable errors
        for (const retryable of this.config.retryableErrors) {
            if (errorMessage.includes(retryable.toLowerCase()) || 
                errorCode === retryable) {
                return true;
            }
        }
        
        // Default to non-retryable for unknown errors
        return false;
    }
    
    /**
     * Check if request is network-related
     * 
     * @param {Object} retryData - Retry data
     * @returns {boolean} Whether request is network-related
     */
    isNetworkRequest(retryData) {
        // Simple heuristic - check if request function involves network calls
        const functionString = retryData.requestFunction.toString();
        return functionString.includes('fetch') || 
               functionString.includes('ajax') || 
               functionString.includes('XMLHttpRequest');
    }
    
    /**
     * Process retry queue when network comes back online
     * Enhanced with intelligent batching and priority handling
     * Requirements: 1.3, 1.4
     */
    async processRetryQueue() {
        if (this.retryQueue.size === 0) {
            return;
        }
        
        this.log(`🔄 Processing ${this.retryQueue.size} items in retry queue`);
        
        // Group retries by priority and endpoint
        const prioritizedRetries = this.prioritizeRetries();
        
        // Process high priority retries first
        for (const priority of ['high', 'medium', 'low']) {
            const retries = prioritizedRetries[priority] || [];
            if (retries.length === 0) continue;
            
            this.log(`🔄 Processing ${retries.length} ${priority} priority retries`);
            
            // Process in smaller batches to avoid overwhelming server
            const batchSize = this.getBatchSizeForPriority(priority);
            const batches = this.createRetryBatches(retries, batchSize);
            
            for (const batch of batches) {
                await this.processBatchRetries(batch);
                
                // Add delay between batches
                if (batches.indexOf(batch) < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }
        
        this.log('✅ Retry queue processing completed');
    }

    /**
     * Prioritize retries based on endpoint configuration and age
     * Requirements: 1.3, 1.4
     */
    prioritizeRetries() {
        const prioritized = { high: [], medium: [], low: [] };
        
        for (const [requestId, retryData] of this.retryQueue.entries()) {
            // Determine priority based on endpoint and age
            let priority = 'medium';
            
            // Check endpoint priority
            if (retryData.config.priority) {
                priority = retryData.config.priority;
            }
            
            // Increase priority for older requests
            const age = Date.now() - retryData.createdAt;
            if (age > 300000) { // 5 minutes
                priority = priority === 'low' ? 'medium' : 'high';
            }
            
            // Decrease priority for frequently failing requests
            if (retryData.attempts > 2) {
                priority = priority === 'high' ? 'medium' : 'low';
            }
            
            prioritized[priority].push({ requestId, ...retryData });
        }
        
        return prioritized;
    }

    /**
     * Get optimal batch size based on priority
     * Requirements: 1.3
     */
    getBatchSizeForPriority(priority) {
        const batchSizes = {
            high: 2,    // Process high priority requests carefully
            medium: 3,  // Balanced processing
            low: 5      // Batch low priority requests more aggressively
        };
        
        return batchSizes[priority] || 3;
    }

    /**
     * Create retry batches
     * Requirements: 1.3
     */
    createRetryBatches(retries, batchSize) {
        const batches = [];
        for (let i = 0; i < retries.length; i += batchSize) {
            batches.push(retries.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Process a batch of retries with controlled concurrency
     * Requirements: 1.3, 1.4
     */
    async processBatchRetries(batch) {
        const promises = batch.map(async (retryData, index) => {
            // Stagger requests within batch
            const delay = index * 50; // 50ms between requests in batch
            
            return new Promise(resolve => {
                setTimeout(async () => {
                    try {
                        await this.executeRetry(retryData.requestId);
                        resolve({ success: true, requestId: retryData.requestId });
                    } catch (error) {
                        resolve({ success: false, requestId: retryData.requestId, error });
                    }
                }, delay);
            });
        });
        
        const results = await Promise.allSettled(promises);
        
        // Log batch results
        const successful = results.filter(r => r.value?.success).length;
        const failed = results.length - successful;
        
        this.log(`📊 Batch completed: ${successful} successful, ${failed} failed`);
        
        return results;
    }
    
    /**
     * Clean up retry data
     * 
     * @param {string} requestId - Request identifier
     */
    cleanupRetry(requestId) {
        // Remove from retry queue
        this.retryQueue.delete(requestId);
        
        // Clear any pending timer
        const timer = this.retryTimers.get(requestId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(requestId);
        }
    }
    
    /**
     * Cancel retry for specific request
     * 
     * @param {string} requestId - Request identifier
     * @returns {boolean} Whether retry was cancelled
     */
    cancelRetry(requestId) {
        const retryData = this.retryQueue.get(requestId);
        
        if (retryData) {
            this.log(`🚫 Cancelling retry for ${requestId}`);
            this.cleanupRetry(requestId);
            return true;
        }
        
        return false;
    }
    
    // Circuit Breaker Methods
    
    /**
     * Check if circuit breaker is open for endpoint
     * 
     * @param {string} endpoint - Endpoint identifier
     * @returns {boolean} Whether circuit is open
     */
    isCircuitOpen(endpoint) {
        const circuitData = this.circuitBreakers.get(endpoint);
        
        if (!circuitData) {
            return false;
        }
        
        if (circuitData.state === 'open') {
            // Check if timeout has passed
            if (Date.now() - circuitData.openedAt > this.config.circuitBreakerTimeout) {
                // Move to half-open state
                circuitData.state = 'half-open';
                this.log(`🔄 Circuit breaker for ${endpoint} moved to half-open state`);
                return false;
            }
            return true;
        }
        
        return false;
    }
    
    /**
     * Record failure for circuit breaker
     * 
     * @param {string} endpoint - Endpoint identifier
     */
    recordFailure(endpoint) {
        let circuitData = this.circuitBreakers.get(endpoint);
        
        if (!circuitData) {
            circuitData = {
                failures: 0,
                successes: 0,
                state: 'closed',
                openedAt: null
            };
            this.circuitBreakers.set(endpoint, circuitData);
        }
        
        circuitData.failures++;
        
        // Check if threshold reached
        if (circuitData.failures >= this.config.circuitBreakerThreshold && 
            circuitData.state === 'closed') {
            
            circuitData.state = 'open';
            circuitData.openedAt = Date.now();
            this.stats.circuitBreakerTrips++;
            
            this.log(`⚡ Circuit breaker opened for ${endpoint} after ${circuitData.failures} failures`);
        }
    }
    
    /**
     * Reset circuit breaker for endpoint
     * 
     * @param {string} endpoint - Endpoint identifier
     */
    resetCircuitBreaker(endpoint) {
        const circuitData = this.circuitBreakers.get(endpoint);
        
        if (circuitData) {
            circuitData.failures = 0;
            circuitData.successes++;
            circuitData.state = 'closed';
            circuitData.openedAt = null;
            
            this.log(`✅ Circuit breaker reset for ${endpoint}`);
        }
    }
    
    /**
     * Enhanced request queuing with intelligent scheduling
     * Requirements: 1.3, 1.4
     */
    async addToRequestQueue(requests, options = {}) {
        const queueId = `queue_${Date.now()}`;
        const scheduling = options.scheduling || 'fifo'; // 'fifo', 'priority', 'adaptive'
        const maxConcurrency = options.maxConcurrency || 3;
        
        try {
            this.log(`📥 Adding ${requests.length} requests to queue (${scheduling})`);
            
            // Schedule requests based on strategy
            let scheduledRequests;
            switch (scheduling) {
                case 'priority':
                    scheduledRequests = this.scheduleByPriority(requests);
                    break;
                case 'adaptive':
                    scheduledRequests = await this.scheduleAdaptively(requests);
                    break;
                default:
                    scheduledRequests = requests; // FIFO
            }
            
            // Process scheduled requests
            const results = [];
            for (let i = 0; i < scheduledRequests.length; i += maxConcurrency) {
                const batch = scheduledRequests.slice(i, i + maxConcurrency);
                const batchResults = await this.processConcurrentRequests(batch);
                results.push(...batchResults);
                
                // Adaptive delay between batches
                if (i + maxConcurrency < scheduledRequests.length) {
                    const delay = this.calculateAdaptiveDelay(batchResults);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            return {
                queueId,
                totalRequests: requests.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results
            };
            
        } catch (error) {
            this.log(`❌ Request queue processing failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Schedule requests by priority
     * Requirements: 1.3
     */
    scheduleByPriority(requests) {
        return requests.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            return aPriority - bPriority;
        });
    }

    /**
     * Schedule requests adaptively based on system state
     * Requirements: 1.3, 1.4
     */
    async scheduleAdaptively(requests) {
        // Analyze current system state
        const systemLoad = await this.analyzeSystemLoad();
        const networkConditions = this.analyzeNetworkConditions();
        
        // Adjust request order based on conditions
        return requests.sort((a, b) => {
            let scoreA = this.calculateRequestScore(a, systemLoad, networkConditions);
            let scoreB = this.calculateRequestScore(b, systemLoad, networkConditions);
            
            return scoreB - scoreA; // Higher score first
        });
    }

    /**
     * Calculate request score for adaptive scheduling
     * Requirements: 1.4
     */
    calculateRequestScore(request, systemLoad, networkConditions) {
        let score = 0;
        
        // Priority weight
        const priorityWeights = { high: 100, medium: 50, low: 25 };
        score += priorityWeights[request.priority] || 50;
        
        // Age weight (older requests get higher priority)
        const age = Date.now() - (request.timestamp || Date.now());
        score += Math.min(age / 1000, 50); // Max 50 points for age
        
        // System load adjustment
        if (systemLoad.cpu < 50) {
            score += 20; // Boost score when system is not busy
        }
        
        // Network conditions adjustment
        if (networkConditions.quality === 'good') {
            score += 15;
        } else if (networkConditions.quality === 'poor') {
            score -= 10;
        }
        
        // Request type weight
        if (request.type === 'save') {
            score += 10; // Prioritize save operations
        }
        
        return score;
    }

    /**
     * Analyze current system load
     * Requirements: 1.4
     */
    async analyzeSystemLoad() {
        const startTime = performance.now();
        
        // Simple CPU load estimation based on timing
        await new Promise(resolve => setTimeout(resolve, 1));
        const endTime = performance.now();
        const actualDelay = endTime - startTime;
        
        // Estimate CPU load (rough approximation)
        const expectedDelay = 1;
        const cpuLoad = Math.min(((actualDelay - expectedDelay) / expectedDelay) * 100, 100);
        
        return {
            cpu: Math.max(0, cpuLoad),
            memory: this.getMemoryUsage(),
            activeRequests: this.retryQueue.size
        };
    }

    /**
     * Analyze network conditions
     * Requirements: 1.4
     */
    analyzeNetworkConditions() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        let quality = 'unknown';
        let speed = 'unknown';
        
        if (connection) {
            const effectiveType = connection.effectiveType;
            
            switch (effectiveType) {
                case '4g':
                    quality = 'excellent';
                    speed = 'fast';
                    break;
                case '3g':
                    quality = 'good';
                    speed = 'medium';
                    break;
                case '2g':
                    quality = 'poor';
                    speed = 'slow';
                    break;
                default:
                    quality = 'fair';
                    speed = 'medium';
            }
        }
        
        return {
            quality,
            speed,
            online: navigator.onLine,
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || 0
        };
    }

    /**
     * Get memory usage estimation
     * Requirements: 1.4
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }
        
        return { percentage: 0 };
    }

    /**
     * Process concurrent requests with error handling
     * Requirements: 1.3, 1.4
     */
    async processConcurrentRequests(requests) {
        const promises = requests.map(async (request) => {
            try {
                const result = await this.executeRequest(request);
                return { success: true, request, result };
            } catch (error) {
                // Add to retry queue if retryable
                if (this.isRetryableError(error)) {
                    await this.addToRetryQueue(
                        `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        request.function,
                        request.data,
                        { endpoint: request.endpoint }
                    );
                }
                
                return { success: false, request, error: error.message };
            }
        });
        
        const results = await Promise.allSettled(promises);
        return results.map(result => result.value || result.reason);
    }

    /**
     * Execute individual request
     * Requirements: 1.3
     */
    async executeRequest(request) {
        if (typeof request.function === 'function') {
            return await request.function(request.data);
        } else {
            throw new Error('Invalid request function');
        }
    }

    /**
     * Calculate adaptive delay between batches
     * Requirements: 1.4
     */
    calculateAdaptiveDelay(batchResults) {
        const failureRate = batchResults.filter(r => !r.success).length / batchResults.length;
        
        // Base delay of 100ms
        let delay = 100;
        
        // Increase delay based on failure rate
        if (failureRate > 0.5) {
            delay *= 3; // High failure rate
        } else if (failureRate > 0.2) {
            delay *= 2; // Moderate failure rate
        }
        
        // Add jitter to prevent thundering herd
        delay += Math.random() * 50;
        
        return Math.min(delay, 2000); // Cap at 2 seconds
    }

    // Statistics and Monitoring
    
    /**
     * Get retry statistics
     * 
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            activeRetries: this.retryQueue.size,
            pendingTimers: this.retryTimers.size,
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([endpoint, data]) => ({
                endpoint,
                ...data
            })),
            config: this.config
        };
    }
    
    /**
     * Get detailed retry information
     * 
     * @returns {Object} Detailed retry information
     */
    getRetryDetails() {
        const retries = [];
        
        for (const [requestId, retryData] of this.retryQueue) {
            retries.push({
                requestId,
                endpoint: retryData.config.endpoint,
                attempts: retryData.attempts,
                maxRetries: retryData.config.maxRetries,
                createdAt: retryData.createdAt,
                lastAttempt: retryData.lastAttempt,
                errors: retryData.errors,
                timeElapsed: Date.now() - retryData.createdAt
            });
        }
        
        return {
            activeRetries: retries,
            totalRetries: this.stats.totalRetries,
            successRate: this.stats.totalRetries > 0 ? 
                (this.stats.successfulRetries / this.stats.totalRetries) * 100 : 0
        };
    }
    
    /**
     * Clear all retry data
     */
    clearAll() {
        // Clear all timers
        for (const timer of this.retryTimers.values()) {
            clearTimeout(timer);
        }
        
        // Clear all data
        this.retryQueue.clear();
        this.retryTimers.clear();
        this.circuitBreakers.clear();
        
        // Reset statistics
        this.stats = {
            totalRequests: 0,
            totalRetries: 0,
            successfulRetries: 0,
            failedRetries: 0,
            circuitBreakerTrips: 0
        };
        
        this.log('🧹 All retry data cleared');
    }
    
    /**
     * Configure retry settings
     * 
     * @param {Object} newConfig - New configuration
     */
    configure(newConfig) {
        Object.assign(this.config, newConfig);
        this.log('⚙️ Retry configuration updated:', newConfig);
    }
    
    // Logging
    
    /**
     * Debug logging
     * 
     * @param {string} message - Log message
     * @param {*} data - Optional data to log
     */
    log(message, data = null) {
        if (window.masV2Debug || window.woowDebug) {
            if (data) {
                console.log(`[RetryManager] ${message}`, data);
            } else {
                console.log(`[RetryManager] ${message}`);
            }
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RetryManager;
}

// Global instance for immediate use
window.RetryManager = RetryManager;