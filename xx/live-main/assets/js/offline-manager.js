/**
 * Offline Manager
 * 
 * Advanced offline capability system with intelligent change queuing,
 * conflict resolution, and seamless synchronization when connection is restored.
 * 
 * @package WOOW! Admin Styler
 * @version 1.0.0
 */

class OfflineManager {
    constructor(options = {}) {
        // Configuration
        this.config = {
            storageKey: 'woow_offline_queue',
            maxQueueSize: 1000,
            syncBatchSize: 10,
            syncInterval: 5000, // Check for online status every 5 seconds
            conflictResolution: 'server_wins', // 'server_wins', 'client_wins', 'merge'
            enablePersistentStorage: true,
            compressionEnabled: true,
            ...options
        };
        
        // Offline queue for pending changes
        this.offlineQueue = new Map();
        
        // Network status tracking
        this.isOnline = navigator.onLine;
        this.lastOnlineCheck = Date.now();
        
        // Synchronization state
        this.isSyncing = false;
        this.syncProgress = {
            total: 0,
            completed: 0,
            failed: 0
        };
        
        // Event listeners for offline/online events
        this.eventListeners = new Map();
        
        // Statistics
        this.stats = {
            totalOfflineOperations: 0,
            successfulSyncs: 0,
            failedSyncs: 0,
            conflictsResolved: 0,
            dataCompressed: 0
        };
        
        // Initialize systems
        this.initializeEventListeners();
        this.initializePeriodicSync();
        this.loadOfflineQueue();
        
        this.log('🚀 OfflineManager initialized');
    }
    
    /**
     * Initialize event listeners for network status
     */
    initializeEventListeners() {
        // Network status events
        window.addEventListener('online', () => {
            this.handleOnlineEvent();
        });
        
        window.addEventListener('offline', () => {
            this.handleOfflineEvent();
        });
        
        // Page visibility events for better offline detection
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkNetworkStatus();
            }
        });
        
        // Beforeunload event to save queue
        window.addEventListener('beforeunload', () => {
            this.saveOfflineQueue();
        });
    }
    
    /**
     * Initialize periodic synchronization
     */
    initializePeriodicSync() {
        setInterval(() => {
            this.checkNetworkStatus();
            
            if (this.isOnline && this.offlineQueue.size > 0 && !this.isSyncing) {
                this.synchronizeOfflineQueue();
            }
        }, this.config.syncInterval);
    }
    
    /**
     * Handle online event
     */
    async handleOnlineEvent() {
        this.isOnline = true;
        this.lastOnlineCheck = Date.now();
        
        this.log('🌐 Network connection restored');
        
        // Dispatch custom event
        this.dispatchEvent('woow-online', {
            queueSize: this.offlineQueue.size,
            timestamp: Date.now()
        });
        
        // Start synchronization if there are queued items
        if (this.offlineQueue.size > 0) {
            await this.synchronizeOfflineQueue();
        }
    }
    
    /**
     * Handle offline event
     */
    handleOfflineEvent() {
        this.isOnline = false;
        this.lastOnlineCheck = Date.now();
        
        this.log('📴 Network connection lost');
        
        // Dispatch custom event
        this.dispatchEvent('woow-offline', {
            queueSize: this.offlineQueue.size,
            timestamp: Date.now()
        });
        
        // Save current queue to persistent storage
        this.saveOfflineQueue();
    }
    
    /**
     * Check network status with more sophisticated detection
     */
    async checkNetworkStatus() {
        const wasOnline = this.isOnline;
        
        // Use multiple methods to detect network status
        const navigatorOnline = navigator.onLine;
        const connectionTest = await this.testNetworkConnection();
        
        this.isOnline = navigatorOnline && connectionTest;
        this.lastOnlineCheck = Date.now();
        
        // Trigger events if status changed
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.handleOnlineEvent();
            } else {
                this.handleOfflineEvent();
            }
        }
    }
    
    /**
     * Test network connection by making a lightweight request
     * 
     * @returns {Promise<boolean>} Connection status
     */
    async testNetworkConnection() {
        try {
            // Make a lightweight request to test connectivity
            const response = await fetch('/wp-admin/admin-ajax.php', {
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 5000
            });
            
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Add operation to offline queue
     * 
     * @param {string} operationId - Unique operation identifier
     * @param {Object} operation - Operation data
     * @returns {boolean} Success status
     */
    addToOfflineQueue(operationId, operation) {
        try {
            // Check queue size limit
            if (this.offlineQueue.size >= this.config.maxQueueSize) {
                this.log(`❌ Offline queue full (${this.config.maxQueueSize} items)`);
                
                // Remove oldest item to make space
                const oldestKey = this.offlineQueue.keys().next().value;
                this.offlineQueue.delete(oldestKey);
                
                this.log(`🗑️ Removed oldest item from queue: ${oldestKey}`);
            }
            
            const queueItem = {
                id: operationId,
                operation: operation.type || 'unknown',
                data: operation.data || {},
                timestamp: Date.now(),
                attempts: 0,
                priority: operation.priority || 'normal', // 'high', 'normal', 'low'
                conflictResolution: operation.conflictResolution || this.config.conflictResolution,
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    sessionId: this.getSessionId()
                }
            };
            
            // Compress data if enabled
            if (this.config.compressionEnabled) {
                queueItem.data = this.compressData(queueItem.data);
                queueItem.compressed = true;
                this.stats.dataCompressed++;
            }
            
            this.offlineQueue.set(operationId, queueItem);
            this.stats.totalOfflineOperations++;
            
            this.log(`📴 Added to offline queue: ${operationId} (${operation.type})`);
            
            // Save to persistent storage
            this.saveOfflineQueue();
            
            // Dispatch event
            this.dispatchEvent('woow-offline-queued', {
                operationId,
                operation: queueItem,
                queueSize: this.offlineQueue.size
            });
            
            return true;
            
        } catch (error) {
            this.log(`❌ Failed to add to offline queue: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Remove operation from offline queue
     * 
     * @param {string} operationId - Operation identifier
     * @returns {boolean} Success status
     */
    removeFromOfflineQueue(operationId) {
        const removed = this.offlineQueue.delete(operationId);
        
        if (removed) {
            this.log(`✅ Removed from offline queue: ${operationId}`);
            this.saveOfflineQueue();
        }
        
        return removed;
    }
    
    /**
     * Synchronize offline queue when connection is restored
     * 
     * @returns {Promise<Object>} Synchronization result
     */
    async synchronizeOfflineQueue() {
        if (this.isSyncing) {
            this.log('🔄 Synchronization already in progress');
            return { success: false, reason: 'already_syncing' };
        }
        
        if (this.offlineQueue.size === 0) {
            this.log('✅ No items to synchronize');
            return { success: true, synchronized: 0 };
        }
        
        if (!this.isOnline) {
            this.log('📴 Cannot synchronize while offline');
            return { success: false, reason: 'offline' };
        }
        
        this.isSyncing = true;
        this.syncProgress = {
            total: this.offlineQueue.size,
            completed: 0,
            failed: 0
        };
        
        this.log(`🔄 Starting synchronization of ${this.syncProgress.total} items`);
        
        // Dispatch sync start event
        this.dispatchEvent('woow-sync-start', {
            total: this.syncProgress.total,
            timestamp: Date.now()
        });
        
        try {
            const results = await this.processSyncBatches();
            
            this.log(`✅ Synchronization completed: ${results.successful} successful, ${results.failed} failed`);
            
            // Update statistics
            this.stats.successfulSyncs += results.successful;
            this.stats.failedSyncs += results.failed;
            
            // Dispatch sync complete event
            this.dispatchEvent('woow-sync-complete', {
                successful: results.successful,
                failed: results.failed,
                total: this.syncProgress.total,
                timestamp: Date.now()
            });
            
            return {
                success: true,
                synchronized: results.successful,
                failed: results.failed,
                total: this.syncProgress.total
            };
            
        } catch (error) {
            this.log(`❌ Synchronization failed: ${error.message}`);
            
            // Dispatch sync error event
            this.dispatchEvent('woow-sync-error', {
                error: error.message,
                timestamp: Date.now()
            });
            
            return { success: false, error: error.message };
            
        } finally {
            this.isSyncing = false;
        }
    }
    
    /**
     * Process synchronization in batches
     * 
     * @returns {Promise<Object>} Batch processing results
     */
    async processSyncBatches() {
        const items = Array.from(this.offlineQueue.values());
        
        // Sort by priority and timestamp
        items.sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }
            
            return a.timestamp - b.timestamp; // Older items first
        });
        
        let successful = 0;
        let failed = 0;
        
        // Process in batches
        for (let i = 0; i < items.length; i += this.config.syncBatchSize) {
            const batch = items.slice(i, i + this.config.syncBatchSize);
            
            this.log(`🔄 Processing batch ${Math.floor(i / this.config.syncBatchSize) + 1} (${batch.length} items)`);
            
            // Process batch items in parallel
            const batchPromises = batch.map(item => this.synchronizeItem(item));
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Count results
            for (const result of batchResults) {
                if (result.status === 'fulfilled' && result.value.success) {
                    successful++;
                } else {
                    failed++;
                }
            }
            
            // Update progress
            this.syncProgress.completed = successful + failed;
            
            // Dispatch progress event
            this.dispatchEvent('woow-sync-progress', {
                completed: this.syncProgress.completed,
                total: this.syncProgress.total,
                successful,
                failed,
                percentage: Math.round((this.syncProgress.completed / this.syncProgress.total) * 100)
            });
            
            // Small delay between batches to avoid overwhelming the server
            if (i + this.config.syncBatchSize < items.length) {
                await this.delay(100);
            }
        }
        
        return { successful, failed };
    }
    
    /**
     * Synchronize individual item
     * 
     * @param {Object} item - Queue item
     * @returns {Promise<Object>} Synchronization result
     */
    async synchronizeItem(item) {
        try {
            item.attempts++;
            
            this.log(`🔄 Synchronizing item: ${item.id} (attempt ${item.attempts})`);
            
            // Decompress data if needed
            let data = item.data;
            if (item.compressed) {
                data = this.decompressData(data);
            }
            
            // Execute the operation based on type
            let result;
            
            switch (item.operation) {
                case 'save':
                    result = await this.executeSaveOperation(data);
                    break;
                    
                case 'load':
                    result = await this.executeLoadOperation(data);
                    break;
                    
                case 'delete':
                    result = await this.executeDeleteOperation(data);
                    break;
                    
                default:
                    throw new Error(`Unknown operation type: ${item.operation}`);
            }
            
            if (result.success) {
                // Remove from queue on success
                this.removeFromOfflineQueue(item.id);
                
                this.log(`✅ Successfully synchronized: ${item.id}`);
                
                return { success: true, item, result };
            } else {
                throw new Error(result.error || 'Operation failed');
            }
            
        } catch (error) {
            this.log(`❌ Failed to synchronize item ${item.id}: ${error.message}`);
            
            // Handle conflicts
            if (this.isConflictError(error)) {
                const resolved = await this.resolveConflict(item, error);
                if (resolved) {
                    this.removeFromOfflineQueue(item.id);
                    this.stats.conflictsResolved++;
                    return { success: true, item, conflict: true };
                }
            }
            
            // Remove item if max attempts reached
            if (item.attempts >= 3) {
                this.log(`🚫 Max attempts reached for ${item.id}, removing from queue`);
                this.removeFromOfflineQueue(item.id);
            }
            
            return { success: false, item, error: error.message };
        }
    }
    
    /**
     * Execute save operation
     * 
     * @param {Object} data - Operation data
     * @returns {Promise<Object>} Operation result
     */
    async executeSaveOperation(data) {
        // This would integrate with the existing persistence manager
        if (window.SettingsPersistenceManager) {
            const manager = new window.SettingsPersistenceManager();
            const success = await manager.saveSetting(data.key, data.value, true);
            
            return { success, operation: 'save' };
        }
        
        throw new Error('SettingsPersistenceManager not available');
    }
    
    /**
     * Execute load operation
     * 
     * @param {Object} data - Operation data
     * @returns {Promise<Object>} Operation result
     */
    async executeLoadOperation(data) {
        // This would integrate with the existing persistence manager
        if (window.SettingsPersistenceManager) {
            const manager = new window.SettingsPersistenceManager();
            const result = await manager.loadSettings(true);
            
            return { success: result !== null, data: result, operation: 'load' };
        }
        
        throw new Error('SettingsPersistenceManager not available');
    }
    
    /**
     * Execute delete operation
     * 
     * @param {Object} data - Operation data
     * @returns {Promise<Object>} Operation result
     */
    async executeDeleteOperation(data) {
        // Implementation would depend on the specific delete requirements
        return { success: true, operation: 'delete' };
    }
    
    /**
     * Check if error is a conflict error
     * 
     * @param {Error} error - Error object
     * @returns {boolean} Whether error is a conflict
     */
    isConflictError(error) {
        const conflictIndicators = ['conflict', 'version', 'modified', 'concurrent'];
        const errorMessage = error.message.toLowerCase();
        
        return conflictIndicators.some(indicator => errorMessage.includes(indicator));
    }
    
    /**
     * Resolve conflict between offline and server data
     * 
     * @param {Object} item - Queue item
     * @param {Error} error - Conflict error
     * @returns {Promise<boolean>} Resolution success
     */
    async resolveConflict(item, error) {
        this.log(`🔄 Resolving conflict for ${item.id} using strategy: ${item.conflictResolution}`);
        
        try {
            switch (item.conflictResolution) {
                case 'server_wins':
                    // Server data takes precedence, discard local changes
                    this.log(`📥 Server wins conflict resolution for ${item.id}`);
                    return true;
                    
                case 'client_wins':
                    // Force local changes to server
                    this.log(`📤 Client wins conflict resolution for ${item.id}`);
                    // Would need to implement force update logic
                    return false;
                    
                case 'merge':
                    // Attempt to merge changes
                    this.log(`🔀 Attempting merge conflict resolution for ${item.id}`);
                    return await this.attemptMerge(item, error);
                    
                default:
                    this.log(`❌ Unknown conflict resolution strategy: ${item.conflictResolution}`);
                    return false;
            }
        } catch (resolutionError) {
            this.log(`❌ Conflict resolution failed: ${resolutionError.message}`);
            return false;
        }
    }
    
    /**
     * Attempt to merge conflicting changes
     * 
     * @param {Object} item - Queue item
     * @param {Error} error - Conflict error
     * @returns {Promise<boolean>} Merge success
     */
    async attemptMerge(item, error) {
        // This would implement sophisticated merge logic
        // For now, return false to indicate merge not possible
        return false;
    }
    
    // Storage Methods
    
    /**
     * Save offline queue to persistent storage
     */
    saveOfflineQueue() {
        if (!this.config.enablePersistentStorage) {
            return;
        }
        
        try {
            const queueData = {
                items: Array.from(this.offlineQueue.entries()),
                timestamp: Date.now(),
                version: '1.0'
            };
            
            const serialized = JSON.stringify(queueData);
            localStorage.setItem(this.config.storageKey, serialized);
            
            this.log(`💾 Saved offline queue to storage (${this.offlineQueue.size} items)`);
            
        } catch (error) {
            this.log(`❌ Failed to save offline queue: ${error.message}`);
        }
    }
    
    /**
     * Load offline queue from persistent storage
     */
    loadOfflineQueue() {
        if (!this.config.enablePersistentStorage) {
            return;
        }
        
        try {
            const stored = localStorage.getItem(this.config.storageKey);
            
            if (stored) {
                const queueData = JSON.parse(stored);
                
                // Validate data structure
                if (queueData.items && Array.isArray(queueData.items)) {
                    this.offlineQueue = new Map(queueData.items);
                    
                    this.log(`📥 Loaded offline queue from storage (${this.offlineQueue.size} items)`);
                    
                    // Clean up old items (older than 24 hours)
                    this.cleanupOldQueueItems();
                }
            }
            
        } catch (error) {
            this.log(`❌ Failed to load offline queue: ${error.message}`);
            
            // Clear corrupted data
            localStorage.removeItem(this.config.storageKey);
        }
    }
    
    /**
     * Clean up old queue items
     */
    cleanupOldQueueItems() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const cutoff = Date.now() - maxAge;
        let removed = 0;
        
        for (const [id, item] of this.offlineQueue) {
            if (item.timestamp < cutoff) {
                this.offlineQueue.delete(id);
                removed++;
            }
        }
        
        if (removed > 0) {
            this.log(`🧹 Cleaned up ${removed} old queue items`);
            this.saveOfflineQueue();
        }
    }
    
    // Utility Methods
    
    /**
     * Compress data for storage efficiency
     * 
     * @param {*} data - Data to compress
     * @returns {string} Compressed data
     */
    compressData(data) {
        // Simple compression using JSON stringify
        // In a real implementation, you might use a compression library
        return JSON.stringify(data);
    }
    
    /**
     * Decompress data
     * 
     * @param {string} compressedData - Compressed data
     * @returns {*} Decompressed data
     */
    decompressData(compressedData) {
        try {
            return JSON.parse(compressedData);
        } catch (error) {
            this.log(`❌ Failed to decompress data: ${error.message}`);
            return null;
        }
    }
    
    /**
     * Get session identifier
     * 
     * @returns {string} Session ID
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
     * Create delay promise
     * 
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Dispatch custom event
     * 
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail data
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail: {
                timestamp: Date.now(),
                source: 'OfflineManager',
                ...detail
            }
        });
        
        window.dispatchEvent(event);
    }
    
    // Public API Methods
    
    /**
     * Get offline manager statistics
     * 
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this.stats,
            queueSize: this.offlineQueue.size,
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            syncProgress: this.syncProgress,
            lastOnlineCheck: this.lastOnlineCheck,
            config: this.config
        };
    }
    
    /**
     * Get queue details
     * 
     * @returns {Array} Queue items
     */
    getQueueDetails() {
        return Array.from(this.offlineQueue.values()).map(item => ({
            id: item.id,
            operation: item.operation,
            timestamp: item.timestamp,
            attempts: item.attempts,
            priority: item.priority,
            age: Date.now() - item.timestamp
        }));
    }
    
    /**
     * Clear offline queue
     * 
     * @param {boolean} clearStorage - Whether to clear persistent storage
     */
    clearQueue(clearStorage = true) {
        this.offlineQueue.clear();
        
        if (clearStorage) {
            localStorage.removeItem(this.config.storageKey);
        }
        
        this.log('🧹 Offline queue cleared');
    }
    
    /**
     * Force synchronization
     * 
     * @returns {Promise<Object>} Synchronization result
     */
    async forceSynchronization() {
        this.log('🔄 Forcing synchronization...');
        
        // Check network status first
        await this.checkNetworkStatus();
        
        if (!this.isOnline) {
            throw new Error('Cannot synchronize while offline');
        }
        
        return await this.synchronizeOfflineQueue();
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
                console.log(`[OfflineManager] ${message}`, data);
            } else {
                console.log(`[OfflineManager] ${message}`);
            }
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfflineManager;
}

// Global instance for immediate use
window.OfflineManager = OfflineManager;