/**
 * Modern Admin Styler V2 - Collaborative Schema Manager
 * 
 * Real-time collaborative editing with conflict resolution and locking
 * 
 * @package ModernAdminStyler
 * @version 4.3.0 - Collaborative Schema Editing
 */

class CollaborativeSchemaManager extends SchemaManager {
    constructor() {
        super();
        
        // Collaborative features
        this.syncManager = null;
        this.activeSessions = new Map();
        this.schemaLocks = new Map();
        this.conflictQueue = [];
        this.collaborators = new Map();
        this.changeBuffer = new Map();
        this.syncInterval = null;
        this.heartbeatInterval = null;
        
        // WebSocket connection for real-time sync
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Conflict resolution strategies
        this.conflictStrategies = {
            'last_write_wins': this.resolveLastWriteWins.bind(this),
            'merge_changes': this.resolveMergeChanges.bind(this),
            'user_choice': this.resolveUserChoice.bind(this),
            'version_branch': this.resolveVersionBranch.bind(this)
        };
        
        this.initCollaborativeFeatures();
    }
    
    /**
     * 🚀 Initialize collaborative features
     */
    initCollaborativeFeatures() {
        this.initWebSocketConnection();
        this.setupSyncManager();
        this.startHeartbeat();
        this.bindCollaborativeEvents();
        
        console.log('✅ Collaborative Schema Manager initialized');
    }
    
    /**
     * 🔌 Initialize WebSocket connection
     */
    initWebSocketConnection() {
        try {
            const wsUrl = this.getWebSocketUrl();
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                console.log('🔌 WebSocket connected');
                this.reconnectAttempts = 0;
                this.authenticateSession();
                this.requestActiveCollaborators();
            };
            
            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(JSON.parse(event.data));
            };
            
            this.websocket.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.handleWebSocketDisconnect();
            };
            
            this.websocket.onerror = (error) => {
                console.error('🔌 WebSocket error:', error);
            };
            
        } catch (error) {
            console.warn('WebSocket not available, falling back to polling:', error);
            this.setupPollingSync();
        }
    }
    
    /**
     * 🔄 Setup sync manager
     */
    setupSyncManager() {
        this.syncManager = {
            lastSync: Date.now(),
            syncInProgress: false,
            pendingChanges: [],
            
            // Queue change for synchronization
            queueChange: (change) => {
                this.syncManager.pendingChanges.push({
                    ...change,
                    timestamp: Date.now(),
                    userId: this.getCurrentUserId(),
                    sessionId: this.getSessionId()
                });
                
                this.debouncedSync();
            },
            
            // Process incoming changes
            processIncomingChange: (change) => {
                this.handleIncomingChange(change);
            }
        };
        
        // Debounced sync function
        this.debouncedSync = this.debounce(() => {
            this.syncChanges();
        }, 1000);
    }
    
    /**
     * 💓 Start heartbeat to maintain session
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 30000); // Every 30 seconds
    }
    
    /**
     * 🎯 Bind collaborative events
     */
    bindCollaborativeEvents() {
        // Listen for schema changes
        this.addEventListener('schemaUpdated', (event) => {
            const { schema } = event.detail;
            this.broadcastSchemaChange(schema);
        });
        
        // Listen for lock requests
        this.addEventListener('schemaLockRequested', (event) => {
            const { schemaId, userId } = event.detail;
            this.handleLockRequest(schemaId, userId);
        });
        
        // Window beforeunload to release locks
        window.addEventListener('beforeunload', () => {
            this.releaseAllLocks();
        });
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseCollaboration();
            } else {
                this.resumeCollaboration();
            }
        });
    }
    
    /**
     * 🔒 Schema locking methods
     */
    async requestSchemaLock(schemaId, lockType = 'edit') {
        try {
            const userId = this.getCurrentUserId();
            const sessionId = this.getSessionId();
            
            // Check if already locked
            const existingLock = this.schemaLocks.get(schemaId);
            if (existingLock && existingLock.userId !== userId) {
                throw new Error(`Schema is locked by ${existingLock.userName} until ${new Date(existingLock.expiresAt).toLocaleTimeString()}`);
            }
            
            const lockRequest = {
                schemaId: schemaId,
                userId: userId,
                sessionId: sessionId,
                lockType: lockType,
                requestedAt: Date.now(),
                expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
            };
            
            const response = await fetch(`${this.apiBase}/${schemaId}/lock`, {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lockRequest)
            });
            
            const result = await response.json();
            
            if (result.success) {
                const lock = result.data;
                this.schemaLocks.set(schemaId, lock);
                
                // Broadcast lock acquisition
                this.broadcastMessage({
                    type: 'schema_locked',
                    schemaId: schemaId,
                    lock: lock
                });
                
                // Auto-extend lock
                this.setupLockExtension(schemaId);
                
                if (window.masToast) {
                    window.masToast.show('success', `Schema locked for editing`, 3000);
                }
                
                return lock;
                
            } else {
                throw new Error(result.message || 'Failed to acquire lock');
            }
            
        } catch (error) {
            console.error('Lock request failed:', error);
            if (window.masToast) {
                window.masToast.show('error', error.message, 5000);
            }
            throw error;
        }
    }
    
    async releaseSchemaLock(schemaId) {
        try {
            const lock = this.schemaLocks.get(schemaId);
            if (!lock) return;
            
            const response = await fetch(`${this.apiBase}/${schemaId}/lock`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.getSessionId()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.schemaLocks.delete(schemaId);
                
                // Broadcast lock release
                this.broadcastMessage({
                    type: 'schema_unlocked',
                    schemaId: schemaId,
                    userId: this.getCurrentUserId()
                });
                
                if (window.masToast) {
                    window.masToast.show('info', `Schema lock released`, 3000);
                }
            }
            
        } catch (error) {
            console.error('Lock release failed:', error);
        }
    }
    
    releaseAllLocks() {
        const lockPromises = Array.from(this.schemaLocks.keys()).map(schemaId => 
            this.releaseSchemaLock(schemaId)
        );
        
        Promise.all(lockPromises).catch(error => {
            console.error('Failed to release all locks:', error);
        });
    }
    
    /**
     * 🔄 Setup lock auto-extension
     */
    setupLockExtension(schemaId) {
        const extendLock = async () => {
            const lock = this.schemaLocks.get(schemaId);
            if (!lock) return;
            
            // Extend if less than 5 minutes remaining
            const timeRemaining = lock.expiresAt - Date.now();
            if (timeRemaining < 5 * 60 * 1000) {
                try {
                    await this.extendSchemaLock(schemaId);
                } catch (error) {
                    console.warn('Failed to extend lock:', error);
                }
            }
        };
        
        // Check every minute
        const extensionInterval = setInterval(extendLock, 60000);
        
        // Store interval for cleanup
        if (!this.lockExtensionIntervals) {
            this.lockExtensionIntervals = new Map();
        }
        this.lockExtensionIntervals.set(schemaId, extensionInterval);
    }
    
    async extendSchemaLock(schemaId) {
        const response = await fetch(`${this.apiBase}/${schemaId}/lock/extend`, {
            method: 'POST',
            headers: {
                'X-WP-Nonce': this.nonce,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: this.getSessionId(),
                extendBy: 15 * 60 * 1000 // 15 minutes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const updatedLock = result.data;
            this.schemaLocks.set(schemaId, updatedLock);
        }
    }
    
    /**
     * 🔄 Real-time synchronization
     */
    async syncChanges() {
        if (this.syncManager.syncInProgress) return;
        
        this.syncManager.syncInProgress = true;
        
        try {
            const pendingChanges = [...this.syncManager.pendingChanges];
            this.syncManager.pendingChanges = [];
            
            if (pendingChanges.length === 0) return;
            
            // Send changes to server
            const response = await fetch(`${this.apiBase}/sync`, {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    changes: pendingChanges,
                    lastSync: this.syncManager.lastSync,
                    sessionId: this.getSessionId()
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Process incoming changes from other users
                if (result.data.incomingChanges) {
                    for (const change of result.data.incomingChanges) {
                        await this.processIncomingChange(change);
                    }
                }
                
                // Update last sync timestamp
                this.syncManager.lastSync = result.data.serverTime || Date.now();
                
                // Broadcast successful sync
                this.broadcastMessage({
                    type: 'sync_completed',
                    changeCount: pendingChanges.length
                });
                
            } else {
                // Re-queue failed changes
                this.syncManager.pendingChanges.unshift(...pendingChanges);
                throw new Error(result.message || 'Sync failed');
            }
            
        } catch (error) {
            console.error('Sync failed:', error);
            
            // Re-queue changes for retry
            this.syncManager.pendingChanges.unshift(...pendingChanges);
            
            if (window.masToast) {
                window.masToast.show('warning', 'Sync failed, will retry automatically', 3000);
            }
            
        } finally {
            this.syncManager.syncInProgress = false;
        }
    }
    
    /**
     * 📨 Handle incoming changes
     */
    async processIncomingChange(change) {
        try {
            // Check for conflicts
            const conflict = await this.detectConflict(change);
            
            if (conflict) {
                await this.handleConflict(conflict, change);
            } else {
                await this.applyIncomingChange(change);
            }
            
        } catch (error) {
            console.error('Failed to process incoming change:', error);
        }
    }
    
    /**
     * ⚠️ Conflict detection and resolution
     */
    async detectConflict(incomingChange) {
        const { schemaId, property, timestamp } = incomingChange;
        
        // Check if we have local changes to the same property
        const localChanges = this.changeBuffer.get(schemaId) || [];
        const conflictingChange = localChanges.find(local => 
            local.property === property && 
            Math.abs(local.timestamp - timestamp) < 5000 // Within 5 seconds
        );
        
        if (conflictingChange) {
            return {
                type: 'property_conflict',
                schemaId: schemaId,
                property: property,
                localChange: conflictingChange,
                incomingChange: incomingChange,
                detectedAt: Date.now()
            };
        }
        
        return null;
    }
    
    async handleConflict(conflict, incomingChange) {
        console.log('🔥 Conflict detected:', conflict);
        
        // Add to conflict queue
        this.conflictQueue.push({
            ...conflict,
            incomingChange: incomingChange,
            status: 'pending'
        });
        
        // Show conflict notification
        this.showConflictNotification(conflict);
        
        // Auto-resolve based on strategy
        const strategy = this.getConflictResolutionStrategy(conflict);
        await this.resolveConflict(conflict, strategy);
    }
    
    getConflictResolutionStrategy(conflict) {
        // Default strategy based on conflict type
        switch (conflict.type) {
            case 'property_conflict':
                return 'user_choice'; // Let user decide
            case 'version_conflict':
                return 'merge_changes'; // Try to merge
            case 'lock_conflict':
                return 'last_write_wins'; // Latest change wins
            default:
                return 'user_choice';
        }
    }
    
    async resolveConflict(conflict, strategy) {
        const resolver = this.conflictStrategies[strategy];
        if (!resolver) {
            console.error('Unknown conflict resolution strategy:', strategy);
            return;
        }
        
        try {
            const resolution = await resolver(conflict);
            await this.applyConflictResolution(conflict, resolution);
            
            // Remove from queue
            this.conflictQueue = this.conflictQueue.filter(c => c !== conflict);
            
        } catch (error) {
            console.error('Conflict resolution failed:', error);
            conflict.status = 'failed';
        }
    }
    
    /**
     * 🔧 Conflict resolution strategies
     */
    async resolveLastWriteWins(conflict) {
        // Simply use the incoming change (latest timestamp wins)
        return {
            strategy: 'last_write_wins',
            action: 'accept_incoming',
            value: conflict.incomingChange.newValue
        };
    }
    
    async resolveMergeChanges(conflict) {
        // Attempt to merge changes intelligently
        const localValue = conflict.localChange.newValue;
        const incomingValue = conflict.incomingChange.newValue;
        
        // For color values, use incoming (can't merge colors easily)
        if (conflict.property.includes('color')) {
            return {
                strategy: 'merge_changes',
                action: 'accept_incoming',
                value: incomingValue,
                reason: 'Color values cannot be merged'
            };
        }
        
        // For numeric values, try averaging
        if (typeof localValue === 'number' && typeof incomingValue === 'number') {
            return {
                strategy: 'merge_changes',
                action: 'merge_values',
                value: Math.round((localValue + incomingValue) / 2),
                reason: 'Averaged numeric values'
            };
        }
        
        // Default to user choice for complex merges
        return await this.resolveUserChoice(conflict);
    }
    
    async resolveUserChoice(conflict) {
        return new Promise((resolve) => {
            this.showConflictResolutionDialog(conflict, resolve);
        });
    }
    
    async resolveVersionBranch(conflict) {
        // Create a new version branch for the conflicting change
        const branchName = `conflict-branch-${Date.now()}`;
        
        return {
            strategy: 'version_branch',
            action: 'create_branch',
            branchName: branchName,
            value: conflict.incomingChange.newValue
        };
    }
    
    /**
     * 🎨 Show conflict resolution dialog
     */
    showConflictResolutionDialog(conflict, callback) {
        const modal = document.createElement('div');
        modal.className = 'conflict-resolution-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const localUser = this.getCurrentUserName();
        const incomingUser = conflict.incomingChange.userName || 'Another user';
        
        modal.innerHTML = `
            <div class="modal-content" style="background: white; border-radius: 8px; padding: 2rem; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <h3 style="color: #d63638; margin: 0 0 1rem 0;">⚠️ Conflict Detected</h3>
                
                <p>Both you and <strong>${incomingUser}</strong> have modified the same property:</p>
                
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                    <strong>Property:</strong> ${conflict.property}<br>
                    <strong>Schema:</strong> ${this.getSchemaName(conflict.schemaId)}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                    <div style="border: 2px solid #0073aa; border-radius: 6px; padding: 1rem;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #0073aa;">Your Change</h4>
                        <div style="font-family: monospace; background: #f0f8ff; padding: 0.5rem; border-radius: 4px;">
                            ${conflict.localChange.newValue}
                        </div>
                        <small style="color: #666;">
                            ${new Date(conflict.localChange.timestamp).toLocaleTimeString()}
                        </small>
                    </div>
                    
                    <div style="border: 2px solid #d63638; border-radius: 6px; padding: 1rem;">
                        <h4 style="margin: 0 0 0.5rem 0; color: #d63638;">${incomingUser}'s Change</h4>
                        <div style="font-family: monospace; background: #fff5f5; padding: 0.5rem; border-radius: 4px;">
                            ${conflict.incomingChange.newValue}
                        </div>
                        <small style="color: #666;">
                            ${new Date(conflict.incomingChange.timestamp).toLocaleTimeString()}
                        </small>
                    </div>
                </div>
                
                <p style="color: #666; font-size: 0.9rem;">How would you like to resolve this conflict?</p>
                
                <div style="display: grid; gap: 0.5rem; margin: 1.5rem 0;">
                    <button class="resolution-btn" data-action="keep_local" style="background: #0073aa; color: white; border: none; padding: 0.75rem; border-radius: 6px; cursor: pointer;">
                        Keep My Change
                    </button>
                    <button class="resolution-btn" data-action="accept_incoming" style="background: #d63638; color: white; border: none; padding: 0.75rem; border-radius: 6px; cursor: pointer;">
                        Accept ${incomingUser}'s Change
                    </button>
                    <button class="resolution-btn" data-action="merge_manual" style="background: #dba617; color: white; border: none; padding: 0.75rem; border-radius: 6px; cursor: pointer;">
                        Merge Manually
                    </button>
                    <button class="resolution-btn" data-action="create_branch" style="background: #666; color: white; border: none; padding: 0.75rem; border-radius: 6px; cursor: pointer;">
                        Create New Version
                    </button>
                </div>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                    <button class="cancel-btn" style="background: #f0f0f1; color: #666; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        // Bind events
        modal.querySelectorAll('.resolution-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                document.body.removeChild(modal);
                
                callback({
                    strategy: 'user_choice',
                    action: action,
                    value: action === 'keep_local' ? conflict.localChange.newValue : conflict.incomingChange.newValue
                });
            });
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
            callback({
                strategy: 'user_choice',
                action: 'cancel'
            });
        });
        
        document.body.appendChild(modal);
    }
    
    /**
     * ✅ Apply conflict resolution
     */
    async applyConflictResolution(conflict, resolution) {
        try {
            switch (resolution.action) {
                case 'accept_incoming':
                    await this.applyIncomingChange(conflict.incomingChange);
                    break;
                    
                case 'keep_local':
                    // Do nothing, keep local change
                    break;
                    
                case 'merge_values':
                    await this.applyMergedValue(conflict.schemaId, conflict.property, resolution.value);
                    break;
                    
                case 'create_branch':
                    await this.createConflictBranch(conflict, resolution);
                    break;
                    
                case 'cancel':
                    // Mark conflict as unresolved
                    conflict.status = 'unresolved';
                    break;
            }
            
            // Log resolution
            console.log('✅ Conflict resolved:', resolution);
            
            if (window.masToast) {
                window.masToast.show('success', `Conflict resolved: ${resolution.strategy}`, 3000);
            }
            
        } catch (error) {
            console.error('Failed to apply conflict resolution:', error);
            throw error;
        }
    }
    
    /**
     * 📨 WebSocket message handling
     */
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'schema_change':
                this.handleIncomingSchemaChange(message.data);
                break;
                
            case 'schema_locked':
                this.handleSchemaLocked(message.data);
                break;
                
            case 'schema_unlocked':
                this.handleSchemaUnlocked(message.data);
                break;
                
            case 'collaborator_joined':
                this.handleCollaboratorJoined(message.data);
                break;
                
            case 'collaborator_left':
                this.handleCollaboratorLeft(message.data);
                break;
                
            case 'sync_request':
                this.handleSyncRequest(message.data);
                break;
                
            case 'heartbeat_response':
                this.handleHeartbeatResponse(message.data);
                break;
                
            default:
                console.log('Unknown WebSocket message:', message);
        }
    }
    
    handleIncomingSchemaChange(data) {
        this.processIncomingChange(data.change);
        
        // Show notification
        if (data.change.userId !== this.getCurrentUserId()) {
            this.showCollaboratorActivity(data.change);
        }
    }
    
    handleSchemaLocked(data) {
        const { schemaId, lock } = data;
        
        if (lock.userId !== this.getCurrentUserId()) {
            this.schemaLocks.set(schemaId, lock);
            
            if (window.masToast) {
                window.masToast.show('info', `Schema locked by ${lock.userName}`, 3000);
            }
        }
    }
    
    handleSchemaUnlocked(data) {
        const { schemaId } = data;
        this.schemaLocks.delete(schemaId);
        
        if (window.masToast) {
            window.masToast.show('info', 'Schema unlocked', 3000);
        }
    }
    
    handleCollaboratorJoined(data) {
        this.collaborators.set(data.userId, data);
        
        if (window.masToast) {
            window.masToast.show('info', `${data.userName} joined the session`, 3000);
        }
        
        this.updateCollaboratorsList();
    }
    
    handleCollaboratorLeft(data) {
        this.collaborators.delete(data.userId);
        
        if (window.masToast) {
            window.masToast.show('info', `${data.userName} left the session`, 3000);
        }
        
        this.updateCollaboratorsList();
    }
    
    /**
     * 📡 Broadcasting methods
     */
    broadcastMessage(message) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }
    
    broadcastSchemaChange(schema) {
        this.broadcastMessage({
            type: 'schema_change',
            data: {
                schemaId: schema.id,
                change: {
                    type: 'schema_update',
                    schemaId: schema.id,
                    userId: this.getCurrentUserId(),
                    userName: this.getCurrentUserName(),
                    timestamp: Date.now(),
                    changes: schema
                }
            }
        });
    }
    
    sendHeartbeat() {
        this.broadcastMessage({
            type: 'heartbeat',
            data: {
                userId: this.getCurrentUserId(),
                sessionId: this.getSessionId(),
                timestamp: Date.now()
            }
        });
    }
    
    authenticateSession() {
        this.broadcastMessage({
            type: 'authenticate',
            data: {
                userId: this.getCurrentUserId(),
                userName: this.getCurrentUserName(),
                sessionId: this.getSessionId(),
                capabilities: this.getUserCapabilities()
            }
        });
    }
    
    requestActiveCollaborators() {
        this.broadcastMessage({
            type: 'get_collaborators',
            data: {
                sessionId: this.getSessionId()
            }
        });
    }
    
    /**
     * 🎨 UI Updates for collaboration
     */
    showCollaboratorActivity(change) {
        // Create activity indicator
        const indicator = document.createElement('div');
        indicator.className = 'collaborator-activity';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: #0073aa;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 10000;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        indicator.innerHTML = `
            <span style="display: inline-block; width: 8px; height: 8px; background: #00ff00; border-radius: 50%; margin-right: 0.5rem; animation: pulse 1s infinite;"></span>
            ${change.userName} is editing...
        `;
        
        // Add CSS animation
        if (!document.getElementById('collaborator-animations')) {
            const style = document.createElement('style');
            style.id = 'collaborator-animations';
            style.textContent = `
                @keyframes fadeInOut {
                    0%, 100% { opacity: 0; transform: translateX(-100%); }
                    10%, 90% { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (document.body.contains(indicator)) {
                document.body.removeChild(indicator);
            }
        }, 3000);
    }
    
    showConflictNotification(conflict) {
        if (window.masToast) {
            window.masToast.show('warning', `Conflict detected in ${conflict.property}. Click to resolve.`, 5000);
        }
    }
    
    updateCollaboratorsList() {
        // Dispatch event for UI components to update
        const event = new CustomEvent('collaboratorsUpdated', {
            detail: {
                collaborators: Array.from(this.collaborators.values())
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 🔧 Utility methods
     */
    getCurrentUserId() {
        return window.wpUser?.ID || 'anonymous';
    }
    
    getCurrentUserName() {
        return window.wpUser?.display_name || 'Anonymous User';
    }
    
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }
    
    getUserCapabilities() {
        return window.wpUser?.capabilities || [];
    }
    
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/wp-json/modern-admin-styler/v2/websocket`;
    }
    
    getSchemaName(schemaId) {
        const schema = this.schemas.find(s => s.id === schemaId);
        return schema ? schema.name : 'Unknown Schema';
    }
    
    setupPollingSync() {
        // Fallback to polling if WebSocket is not available
        this.syncInterval = setInterval(() => {
            this.syncChanges();
        }, 5000); // Every 5 seconds
    }
    
    handleWebSocketDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
            
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                this.initWebSocketConnection();
            }, delay);
        } else {
            console.log('Max reconnection attempts reached, falling back to polling');
            this.setupPollingSync();
        }
    }
    
    pauseCollaboration() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
    }
    
    resumeCollaboration() {
        this.startHeartbeat();
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            this.initWebSocketConnection();
        }
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    async applyIncomingChange(change) {
        try {
            // Apply the change to local state
            const schema = this.schemas.find(s => s.id === change.schemaId);
            if (schema && change.property && change.newValue !== undefined) {
                // Update the property
                if (change.property.includes('.')) {
                    // Nested property
                    const parts = change.property.split('.');
                    let obj = schema;
                    for (let i = 0; i < parts.length - 1; i++) {
                        obj = obj[parts[i]];
                    }
                    obj[parts[parts.length - 1]] = change.newValue;
                } else {
                    // Direct property
                    schema[change.property] = change.newValue;
                }
                
                // Trigger update event
                this.dispatchEvent('schemaUpdatedRemotely', {
                    schema: schema,
                    change: change
                });
            }
            
        } catch (error) {
            console.error('Failed to apply incoming change:', error);
        }
    }
    
    async applyMergedValue(schemaId, property, value) {
        const schema = this.schemas.find(s => s.id === schemaId);
        if (!schema) return;
        
        // Apply merged value
        if (property.includes('.')) {
            const parts = property.split('.');
            let obj = schema;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
        } else {
            schema[property] = value;
        }
        
        // Update schema
        await this.updateSchema(schemaId, schema, false);
    }
    
    async createConflictBranch(conflict, resolution) {
        // Create a new schema version as a branch
        const originalSchema = this.schemas.find(s => s.id === conflict.schemaId);
        if (!originalSchema) return;
        
        const branchSchema = {
            ...originalSchema,
            name: `${originalSchema.name} (${resolution.branchName})`,
            version: this.incrementVersion(originalSchema.version),
            id: undefined // Will be generated
        };
        
        // Apply the conflicting change to the branch
        if (conflict.property.includes('.')) {
            const parts = conflict.property.split('.');
            let obj = branchSchema;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = resolution.value;
        } else {
            branchSchema[conflict.property] = resolution.value;
        }
        
        // Create the branch schema
        await this.createSchema(branchSchema);
    }
    
    /**
     * 🧹 Cleanup methods
     */
    destroy() {
        // Clean up intervals
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.lockExtensionIntervals) {
            this.lockExtensionIntervals.forEach(interval => clearInterval(interval));
        }
        
        // Close WebSocket
        if (this.websocket) {
            this.websocket.close();
        }
        
        // Release all locks
        this.releaseAllLocks();
        
        console.log('🧹 Collaborative Schema Manager destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollaborativeSchemaManager;
} else if (typeof window !== 'undefined') {
    window.CollaborativeSchemaManager = CollaborativeSchemaManager;
}