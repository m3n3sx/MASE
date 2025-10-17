/**
 * AJAX Manager - Unified AJAX Communication System
 * 
 * Handles all AJAX communication between frontend and backend
 * with proper error handling, retry mechanisms, and debugging
 * 
 * @package ModernAdminStyler
 * @version 2.3.0
 */

class AjaxManager {
    constructor() {
        this.endpoints = {
            save: 'mas_v2_save_settings',
            load: 'mas_get_live_settings', 
            reset: 'mas_v2_reset_settings',
            export: 'mas_v2_export_settings',
            import: 'mas_v2_import_settings',
            saveLive: 'mas_save_live_settings',
            resetLive: 'mas_reset_live_setting',
            livePreview: 'mas_live_preview'
        };
        
        this.retryQueue = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.requestTimeout = 30000; // 30 seconds
        
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
        
        // Debug mode
        this.debug = window.masV2Debug || false;
        
        this.log('🚀 AjaxManager initialized');
    }
    
    /**
     * 🌐 Setup network status listeners
     */
    setupNetworkListeners() {
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
     * 💾 Save live settings (for micro-panel changes)
     */
    async saveLiveSettings(optionId, value) {
        const requestId = `live_${optionId}_${Date.now()}`;
        
        try {
            this.log(`💾 Saving live setting: ${optionId} = ${value}`);
            
            const response = await this.makeRequest(this.endpoints.saveLive, {
                [optionId]: value
            }, requestId);
            
            if (response.success) {
                this.log(`✅ Live setting saved: ${optionId}`);
                return response;
            } else {
                throw new Error(response.data?.message || 'Save failed');
            }
            
        } catch (error) {
            this.logError(`❌ Failed to save live setting ${optionId}:`, error);
            
            // Add to retry queue if network error
            if (this.isNetworkError(error)) {
                this.addToRetryQueue(requestId, 'saveLiveSettings', [optionId, value]);
            }
            
            throw error;
        }
    }
    
    /**
     * 💾 Save all settings (bulk save)
     */
    async saveSettings(settings) {
        const requestId = `save_${Date.now()}`;
        
        try {
            this.log('💾 Saving settings:', settings);
            
            const response = await this.makeRequest(this.endpoints.save, settings, requestId);
            
            if (response.success) {
                this.log('✅ Settings saved successfully');
                return response;
            } else {
                throw new Error(response.data?.message || 'Save failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to save settings:', error);
            
            if (this.isNetworkError(error)) {
                this.addToRetryQueue(requestId, 'saveSettings', [settings]);
            }
            
            throw error;
        }
    }

    /**
     * 📦 Batch save multiple settings with optimized performance
     * Requirements: 1.3, 1.4
     */
    async batchSaveSettings(settingsArray, options = {}) {
        const batchId = `batch_save_${Date.now()}`;
        const batchSize = options.batchSize || 10;
        const concurrency = options.concurrency || 3;
        const showProgress = options.showProgress !== false;
        
        try {
            this.log(`📦 Starting batch save: ${settingsArray.length} settings, batch size: ${batchSize}`);
            
            // Show progress indicator
            let progressCallback = null;
            if (showProgress && typeof options.onProgress === 'function') {
                progressCallback = options.onProgress;
            }
            
            // Split into batches
            const batches = this.createBatches(settingsArray, batchSize);
            const results = [];
            let completed = 0;
            
            // Process batches with controlled concurrency
            const processBatch = async (batch, batchIndex) => {
                const batchRequestId = `${batchId}_batch_${batchIndex}`;
                
                try {
                    // Convert batch to settings object
                    const batchSettings = {};
                    batch.forEach(item => {
                        if (typeof item === 'object' && item.key && item.value !== undefined) {
                            batchSettings[item.key] = item.value;
                        }
                    });
                    
                    const response = await this.makeRequest(this.endpoints.save, batchSettings, batchRequestId);
                    
                    completed += batch.length;
                    
                    if (progressCallback) {
                        progressCallback({
                            completed,
                            total: settingsArray.length,
                            percentage: Math.round((completed / settingsArray.length) * 100),
                            batchIndex,
                            totalBatches: batches.length
                        });
                    }
                    
                    return {
                        success: true,
                        batch: batchIndex,
                        count: batch.length,
                        response
                    };
                    
                } catch (error) {
                    this.logError(`❌ Batch ${batchIndex} failed:`, error);
                    
                    // Add failed batch to retry queue
                    if (this.isRetryableError(error)) {
                        this.addToRetryQueue(batchRequestId, 'batchSaveSettings', [batch, { ...options, showProgress: false }]);
                    }
                    
                    return {
                        success: false,
                        batch: batchIndex,
                        count: batch.length,
                        error: error.message
                    };
                }
            };
            
            // Process batches with concurrency control
            for (let i = 0; i < batches.length; i += concurrency) {
                const concurrentBatches = batches.slice(i, i + concurrency);
                const batchPromises = concurrentBatches.map((batch, index) => 
                    processBatch(batch, i + index)
                );
                
                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map(result => result.value || result.reason));
                
                // Small delay between concurrent batches to avoid overwhelming server
                if (i + concurrency < batches.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            const successCount = results.filter(r => r.success).length;
            const failureCount = results.length - successCount;
            
            this.log(`✅ Batch save completed: ${successCount} successful, ${failureCount} failed`);
            
            return {
                success: failureCount === 0,
                totalBatches: batches.length,
                successfulBatches: successCount,
                failedBatches: failureCount,
                results,
                batchId
            };
            
        } catch (error) {
            this.logError('❌ Batch save operation failed:', error);
            throw error;
        }
    }

    /**
     * 🔄 Batch update multiple settings with conflict resolution
     * Requirements: 1.3, 1.4
     */
    async batchUpdateSettings(updates, options = {}) {
        const updateId = `batch_update_${Date.now()}`;
        const conflictResolution = options.conflictResolution || 'merge'; // 'merge', 'overwrite', 'skip'
        
        try {
            this.log(`🔄 Starting batch update: ${Object.keys(updates).length} settings`);
            
            // Load current settings for conflict detection
            const currentSettings = await this.loadSettings();
            
            // Detect conflicts
            const conflicts = this.detectSettingConflicts(updates, currentSettings);
            
            if (conflicts.length > 0) {
                this.log(`⚠️ Detected ${conflicts.length} setting conflicts`);
                
                // Handle conflicts based on resolution strategy
                updates = this.resolveSettingConflicts(updates, currentSettings, conflicts, conflictResolution);
            }
            
            // Perform batch save
            const result = await this.batchSaveSettings(
                Object.entries(updates).map(([key, value]) => ({ key, value })),
                options
            );
            
            return {
                ...result,
                conflictsDetected: conflicts.length,
                conflictResolution,
                updateId
            };
            
        } catch (error) {
            this.logError('❌ Batch update failed:', error);
            throw error;
        }
    }
    
    /**
     * 📥 Load settings from server
     */
    async loadSettings() {
        try {
            this.log('📥 Loading settings from server');
            
            const response = await this.makeRequest(this.endpoints.load, {}, `load_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings loaded successfully');
                return response.data?.settings || response.settings || {};
            } else {
                throw new Error(response.data?.message || 'Load failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to load settings:', error);
            throw error;
        }
    }
    
    /**
     * 🎨 Generate live preview with debouncing
     */
    async livePreview(settings, requestId = null) {
        if (!requestId) {
            requestId = `live_preview_${Date.now()}`;
        }
        
        this.log(`🎨 Generating live preview`, settings);
        
        try {
            const response = await this.makeRequest(this.endpoints.livePreview, settings, requestId);
            
            if (response && response.success) {
                this.log(`✅ Live preview generated successfully`, response.data);
                return response.data;
            } else {
                throw new Error(response?.data?.message || 'Failed to generate live preview');
            }
            
        } catch (error) {
            this.logError(`❌ Failed to generate live preview`, error);
            
            // Add to retry queue for network errors
            if (this.isNetworkError(error)) {
                this.addToRetryQueue(requestId, 'livePreview', [settings, requestId]);
            }
            
            throw error;
        }
    }
    
    /**
     * 🔄 Reset settings to defaults
     */
    async resetSettings() {
        try {
            this.log('🔄 Resetting settings to defaults');
            
            const response = await this.makeRequest(this.endpoints.reset, {}, `reset_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings reset successfully');
                return response;
            } else {
                throw new Error(response.data?.message || 'Reset failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to reset settings:', error);
            throw error;
        }
    }
    
    /**
     * 📤 Export settings
     */
    async exportSettings() {
        try {
            this.log('📤 Exporting settings');
            
            const response = await this.makeRequest(this.endpoints.export, {}, `export_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings exported successfully');
                return response.data;
            } else {
                throw new Error(response.data?.message || 'Export failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to export settings:', error);
            throw error;
        }
    }
    
    /**
     * 📥 Import settings
     */
    async importSettings(data) {
        try {
            this.log('📥 Importing settings');
            
            const response = await this.makeRequest(this.endpoints.import, {
                data: JSON.stringify(data)
            }, `import_${Date.now()}`);
            
            if (response.success) {
                this.log('✅ Settings imported successfully');
                return response;
            } else {
                throw new Error(response.data?.message || 'Import failed');
            }
            
        } catch (error) {
            this.logError('❌ Failed to import settings:', error);
            throw error;
        }
    }
    
    /**
     * 🌐 Make AJAX request with proper error handling
     */
    async makeRequest(action, data = {}, requestId = null) {
        if (!this.isOnline) {
            throw new Error('Network offline');
        }
        
        const ajaxUrl = window.ajaxurl || window.masLiveEdit?.ajaxUrl || '/wp-admin/admin-ajax.php';
        const nonce = this.getNonce();
        
        if (!nonce) {
            throw new Error('Security nonce not found');
        }
        
        const requestData = {
            action: action,
            nonce: nonce,
            ...data
        };
        
        this.log(`🌐 Making request to ${action}:`, requestData);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
        
        try {
            const response = await fetch(ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(requestData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            this.log(`✅ Request ${action} completed:`, result);
            
            // Remove from retry queue if successful
            if (requestId && this.retryQueue.has(requestId)) {
                this.retryQueue.delete(requestId);
            }
            
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }
    
    /**
     * 🔄 Add request to retry queue with enhanced retry logic
     */
    addToRetryQueue(requestId, method, args) {
        if (this.retryQueue.has(requestId)) {
            const item = this.retryQueue.get(requestId);
            item.attempts++;
            
            if (item.attempts >= this.maxRetries) {
                this.log(`❌ Max retries reached for ${requestId}`);
                this.retryQueue.delete(requestId);
                
                // Trigger retry exhausted event
                this.triggerEvent('retryExhausted', {
                    requestId: requestId,
                    method: method,
                    args: args,
                    attempts: item.attempts
                });
                return;
            }
            
            // Calculate exponential backoff delay
            item.nextRetryTime = Date.now() + (this.retryDelay * Math.pow(2, item.attempts - 1));
        } else {
            this.retryQueue.set(requestId, {
                method: method,
                args: args,
                attempts: 1,
                timestamp: Date.now(),
                nextRetryTime: Date.now() + this.retryDelay,
                originalError: null
            });
        }
        
        this.log(`🔄 Added to retry queue: ${requestId} (attempt ${this.retryQueue.get(requestId).attempts})`);
        
        // Schedule retry processing
        this.scheduleRetryProcessing();
    }
    
    /**
     * 🔄 Process retry queue when network comes back
     */
    async processRetryQueue() {
        if (this.retryQueue.size === 0) return;
        
        this.log(`🔄 Processing ${this.retryQueue.size} items in retry queue`);
        
        const promises = [];
        
        for (const [requestId, item] of this.retryQueue.entries()) {
            // Add delay between retries
            const delay = item.attempts * this.retryDelay;
            
            const promise = new Promise(resolve => {
                setTimeout(async () => {
                    try {
                        await this[item.method](...item.args);
                        this.log(`✅ Retry successful: ${requestId}`);
                        resolve(true);
                    } catch (error) {
                        this.logError(`❌ Retry failed: ${requestId}`, error);
                        resolve(false);
                    }
                }, delay);
            });
            
            promises.push(promise);
        }
        
        await Promise.allSettled(promises);
    }
    
    /**
     * 🔍 Check if error is network-related
     */
    isNetworkError(error) {
        const networkErrors = [
            'Failed to fetch',
            'Network request failed',
            'Request timeout',
            'Network offline'
        ];
        
        return networkErrors.some(msg => error.message.includes(msg));
    }
    
    /**
     * 🔐 Get security nonce
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
     * 📊 Get request statistics
     */
    getStats() {
        return {
            retryQueueSize: this.retryQueue.size,
            isOnline: this.isOnline,
            endpoints: this.endpoints,
            maxRetries: this.maxRetries,
            requestTimeout: this.requestTimeout
        };
    }
    
    /**
     * 🧹 Clear retry queue
     */
    clearRetryQueue() {
        this.retryQueue.clear();
        this.log('🧹 Retry queue cleared');
    }
    
    /**
     * 📝 Debug logging
     */
    log(message, data = null) {
        if (!this.debug) return;
        
        if (data) {
            console.log(`[AjaxManager] ${message}`, data);
        } else {
            console.log(`[AjaxManager] ${message}`);
        }
    }
    
    /**
     * ❌ Error logging
     */
    logError(message, error) {
        console.error(`[AjaxManager] ${message}`, error);
        
        // Send error to backend for logging if possible
        if (this.isOnline && error.message !== 'Network offline') {
            this.sendErrorToBackend(message, error).catch(() => {
                // Silently fail - don't create infinite error loops
            });
        }
    }
    
    /**
     * 📤 Send error to backend for logging
     */
    async sendErrorToBackend(message, error) {
        try {
            const errorData = {
                message: message,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            };
            
            await fetch(window.ajaxurl || '/wp-admin/admin-ajax.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'mas_log_error',
                    nonce: this.getNonce(),
                    error_data: JSON.stringify(errorData)
                })
            });
            
        } catch (e) {
            // Silently fail
        }
    }
    
    /**
     * 🔄 Schedule retry processing with intelligent timing
     */
    scheduleRetryProcessing() {
        if (this.retryProcessingScheduled) return;
        
        this.retryProcessingScheduled = true;
        
        // Find the next retry time
        let nextRetryTime = Infinity;
        for (const [requestId, item] of this.retryQueue.entries()) {
            if (item.nextRetryTime < nextRetryTime) {
                nextRetryTime = item.nextRetryTime;
            }
        }
        
        if (nextRetryTime === Infinity) {
            this.retryProcessingScheduled = false;
            return;
        }
        
        const delay = Math.max(0, nextRetryTime - Date.now());
        
        setTimeout(() => {
            this.retryProcessingScheduled = false;
            this.processScheduledRetries();
        }, delay);
    }
    
    /**
     * 🔄 Process scheduled retries
     */
    async processScheduledRetries() {
        const now = Date.now();
        const readyRetries = [];
        
        for (const [requestId, item] of this.retryQueue.entries()) {
            if (item.nextRetryTime <= now) {
                readyRetries.push([requestId, item]);
            }
        }
        
        if (readyRetries.length === 0) {
            // Schedule next processing if there are still items in queue
            if (this.retryQueue.size > 0) {
                this.scheduleRetryProcessing();
            }
            return;
        }
        
        this.log(`🔄 Processing ${readyRetries.length} scheduled retries`);
        
        for (const [requestId, item] of readyRetries) {
            try {
                const result = await this[item.method](...item.args);
                this.log(`✅ Scheduled retry successful: ${requestId}`);
                this.retryQueue.delete(requestId);
                
                // Trigger success event
                this.triggerEvent('retrySuccess', {
                    requestId: requestId,
                    method: item.method,
                    attempts: item.attempts,
                    result: result
                });
                
            } catch (error) {
                this.logError(`❌ Scheduled retry failed: ${requestId}`, error);
                
                // Update error and schedule next retry
                item.originalError = error;
                this.addToRetryQueue(requestId, item.method, item.args);
            }
        }
        
        // Schedule next processing if there are still items in queue
        if (this.retryQueue.size > 0) {
            this.scheduleRetryProcessing();
        }
    }
    
    /**
     * 🎯 Trigger custom events
     */
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`masAjax:${eventName}`, {
            detail: data,
            bubbles: true,
            cancelable: true
        });
        
        document.dispatchEvent(event);
        this.log(`🎯 Event triggered: ${eventName}`, data);
    }
    
    /**
     * 🔧 Enhanced request validation
     */
    validateRequest(action, data) {
        // Check if action is valid
        if (!action || typeof action !== 'string') {
            throw new Error('Invalid action parameter');
        }
        
        // Check if action is in allowed endpoints
        const allowedActions = Object.values(this.endpoints);
        if (!allowedActions.includes(action)) {
            this.log(`⚠️ Warning: Action '${action}' not in predefined endpoints`);
        }
        
        // Validate data size (prevent DoS)
        const dataString = JSON.stringify(data);
        if (dataString.length > 1024 * 1024) { // 1MB limit
            throw new Error('Request data too large');
        }
        
        // Check for suspicious patterns
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /vbscript:/i,
            /on\w+\s*=/i
        ];
        
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(dataString)) {
                throw new Error('Suspicious content detected in request');
            }
        }
        
        return true;
    }
    
    /**
     * 🔄 Enhanced makeRequest with validation and retry logic
     */
    async makeRequestEnhanced(action, data = {}, options = {}) {
        const requestId = options.requestId || `req_${action}_${Date.now()}`;
        const maxRetries = options.maxRetries || this.maxRetries;
        const timeout = options.timeout || this.requestTimeout;
        
        // Validate request
        this.validateRequest(action, data);
        
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log(`🌐 Request attempt ${attempt}/${maxRetries} for ${action}`);
                
                const response = await this.makeRequest(action, data, requestId);
                
                // Success - clear any previous retry queue entries
                if (this.retryQueue.has(requestId)) {
                    this.retryQueue.delete(requestId);
                }
                
                return response;
                
            } catch (error) {
                lastError = error;
                
                // Don't retry on certain errors
                if (!this.isRetryableError(error) || attempt === maxRetries) {
                    break;
                }
                
                // Calculate delay with exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                this.log(`🔄 Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // All retries failed
        throw lastError;
    }

    /**
     * 📦 Create batches from array
     * Requirements: 1.3
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * 🔍 Detect setting conflicts
     * Requirements: 1.3
     */
    detectSettingConflicts(newSettings, currentSettings) {
        const conflicts = [];
        
        for (const [key, newValue] of Object.entries(newSettings)) {
            if (currentSettings.hasOwnProperty(key)) {
                const currentValue = currentSettings[key];
                
                // Check if values are different
                if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
                    conflicts.push({
                        key,
                        currentValue,
                        newValue,
                        type: this.getConflictType(currentValue, newValue)
                    });
                }
            }
        }
        
        return conflicts;
    }

    /**
     * 🔧 Resolve setting conflicts
     * Requirements: 1.3
     */
    resolveSettingConflicts(newSettings, currentSettings, conflicts, strategy) {
        const resolved = { ...newSettings };
        
        conflicts.forEach(conflict => {
            const { key, currentValue, newValue } = conflict;
            
            switch (strategy) {
                case 'merge':
                    if (typeof currentValue === 'object' && typeof newValue === 'object') {
                        resolved[key] = { ...currentValue, ...newValue };
                    } else {
                        resolved[key] = newValue; // Default to new value for non-objects
                    }
                    break;
                    
                case 'overwrite':
                    resolved[key] = newValue;
                    break;
                    
                case 'skip':
                    resolved[key] = currentValue;
                    break;
                    
                default:
                    resolved[key] = newValue;
            }
        });
        
        return resolved;
    }

    /**
     * 🏷️ Get conflict type
     * Requirements: 1.3
     */
    getConflictType(currentValue, newValue) {
        if (typeof currentValue !== typeof newValue) {
            return 'type_mismatch';
        }
        
        if (typeof currentValue === 'object') {
            return 'object_merge';
        }
        
        return 'value_change';
    }

    /**
     * 📊 Request queue management with priority
     * Requirements: 1.3, 1.4
     */
    async processRequestQueue(queue, options = {}) {
        const concurrency = options.concurrency || 3;
        const priorityOrder = options.priorityOrder || ['high', 'medium', 'low'];
        
        // Sort queue by priority
        const sortedQueue = [...queue].sort((a, b) => {
            const aPriority = priorityOrder.indexOf(a.priority || 'medium');
            const bPriority = priorityOrder.indexOf(b.priority || 'medium');
            return aPriority - bPriority;
        });
        
        const results = [];
        
        // Process queue with concurrency control
        for (let i = 0; i < sortedQueue.length; i += concurrency) {
            const batch = sortedQueue.slice(i, i + concurrency);
            const batchPromises = batch.map(async (request) => {
                try {
                    const result = await this.makeRequestEnhanced(
                        request.action,
                        request.data,
                        request.options
                    );
                    return { success: true, request, result };
                } catch (error) {
                    return { success: false, request, error: error.message };
                }
            });
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults.map(r => r.value || r.reason));
        }
        
        return results;
    }
    
    /**
     * 🔍 Check if error is retryable
     */
    isRetryableError(error) {
        const retryableErrors = [
            'Failed to fetch',
            'Network request failed',
            'Request timeout',
            'Network offline',
            'HTTP 500',
            'HTTP 502',
            'HTTP 503',
            'HTTP 504'
        ];
        
        return retryableErrors.some(msg => error.message.includes(msg));
    }
    
    /**
     * 📊 Get detailed statistics
     */
    getDetailedStats() {
        const queueStats = {};
        for (const [requestId, item] of this.retryQueue.entries()) {
            queueStats[requestId] = {
                method: item.method,
                attempts: item.attempts,
                nextRetry: new Date(item.nextRetryTime).toISOString(),
                age: Date.now() - item.timestamp
            };
        }
        
        return {
            ...this.getStats(),
            retryQueue: queueStats,
            retryProcessingScheduled: this.retryProcessingScheduled || false,
            networkStatus: {
                online: this.isOnline,
                connectionType: navigator.connection?.effectiveType || 'unknown',
                downlink: navigator.connection?.downlink || 'unknown'
            }
        };
    }
    
    /**
     * 🧪 Test AJAX connectivity
     */
    async testConnectivity() {
        try {
            const response = await this.makeRequest('mas_v2_database_check', {}, 'connectivity_test');
            return {
                success: true,
                latency: Date.now() - performance.now(),
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                latency: null
            };
        }
    }
}

// Create global instance
window.MasAjaxManager = new AjaxManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AjaxManager;
}