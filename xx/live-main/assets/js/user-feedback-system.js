/**
 * User Feedback System
 * 
 * Provides comprehensive user feedback for settings persistence operations:
 * - Toast notifications for save/load operations
 * - Loading indicators during AJAX operations
 * - Progress feedback for bulk operations
 * - Success/error state management
 * 
 * @version 1.0.0
 * @author WOOW! Admin Styler
 */

class UserFeedbackSystem {
    constructor() {
        // Configuration
        this.config = {
            notificationTimeout: 5000, // 5 seconds
            loadingMinDuration: 300, // Minimum loading duration for UX
            progressUpdateInterval: 100, // Progress update frequency
            maxNotifications: 5, // Maximum concurrent notifications
            animationDuration: 300, // Animation duration in ms
            soundEnabled: true, // Enable notification sounds
            queueNotifications: true, // Queue notifications when max reached
            persistentErrors: true // Keep error notifications until manually dismissed
        };
        
        // State tracking
        this.activeNotifications = new Map();
        this.loadingStates = new Map();
        this.progressOperations = new Map();
        this.notificationQueue = [];
        
        // Sound system
        this.sounds = {
            success: this.createNotificationSound('success'),
            error: this.createNotificationSound('error'),
            warning: this.createNotificationSound('warning'),
            info: this.createNotificationSound('info')
        };
        
        // Initialize the system
        this.initializeFeedbackSystem();
    }
    
    /**
     * Initialize the feedback system
     */
    initializeFeedbackSystem() {
        // Inject CSS styles
        this.injectStyles();
        
        // Create notification container
        this.createNotificationContainer();
        
        // Create loading overlay template
        this.createLoadingOverlay();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('User Feedback System initialized');
    }
    
    /**
     * Show success notification
     * 
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     */
    showSuccess(message, options = {}) {
        return this.showNotification(message, 'success', {
            icon: '✓',
            autoClose: true,
            timeout: 3000, // Shorter timeout for success messages
            sound: options.sound !== false, // Enable sound by default
            ...options
        });
    }
    
    /**
     * Show error notification
     * 
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     */
    showError(message, options = {}) {
        return this.showNotification(message, 'error', {
            icon: '✕',
            autoClose: false, // Errors should be manually dismissed
            ...options
        });
    }
    
    /**
     * Show warning notification
     * 
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     */
    showWarning(message, options = {}) {
        return this.showNotification(message, 'warning', {
            icon: '⚠',
            autoClose: true,
            ...options
        });
    }
    
    /**
     * Show info notification
     * 
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     */
    showInfo(message, options = {}) {
        return this.showNotification(message, 'info', {
            icon: 'ℹ',
            autoClose: true,
            ...options
        });
    }
    
    /**
     * Show loading indicator
     * 
     * @param {string} message - Loading message
     * @param {string} operationId - Unique operation identifier
     * @param {Object} options - Additional options
     * @returns {Object} Loading control object
     */
    showLoading(message, operationId, options = {}) {
        const loadingId = operationId || `loading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const loadingState = {
            id: loadingId,
            message: message,
            startTime: Date.now(),
            element: null,
            options: {
                showSpinner: true,
                showProgress: false,
                cancelable: false,
                ...options
            }
        };
        
        // Create loading element
        loadingState.element = this.createLoadingElement(loadingState);
        
        // Store loading state
        this.loadingStates.set(loadingId, loadingState);
        
        // Show loading element
        this.displayLoadingElement(loadingState.element);
        
        console.log(`Loading indicator shown: ${message} (${loadingId})`);
        
        return {
            id: loadingId,
            updateMessage: (newMessage) => this.updateLoadingMessage(loadingId, newMessage),
            updateProgress: (progress) => this.updateLoadingProgress(loadingId, progress),
            hide: () => this.hideLoading(loadingId)
        };
    }
    
    /**
     * Hide loading indicator
     * 
     * @param {string} loadingId - Loading identifier
     */
    async hideLoading(loadingId) {
        const loadingState = this.loadingStates.get(loadingId);
        
        if (!loadingState) {
            console.warn('Loading state not found:', loadingId);
            return;
        }
        
        // Ensure minimum loading duration for UX
        const elapsed = Date.now() - loadingState.startTime;
        const remainingTime = Math.max(0, this.config.loadingMinDuration - elapsed);
        
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // Hide loading element
        if (loadingState.element && loadingState.element.parentElement) {
            loadingState.element.style.opacity = '0';
            
            setTimeout(() => {
                if (loadingState.element && loadingState.element.parentElement) {
                    loadingState.element.remove();
                }
            }, this.config.animationDuration);
        }
        
        // Remove from state
        this.loadingStates.delete(loadingId);
        
        console.log(`Loading indicator hidden: ${loadingId}`);
    }
    
    /**
     * Show progress feedback for bulk operations
     * 
     * @param {string} operationName - Name of the operation
     * @param {number} total - Total number of items
     * @param {Object} options - Additional options
     * @returns {Object} Progress control object
     */
    showProgress(operationName, total, options = {}) {
        const progressId = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const progressState = {
            id: progressId,
            operationName: operationName,
            total: total,
            current: 0,
            startTime: Date.now(),
            element: null,
            options: {
                showPercentage: true,
                showItemCount: true,
                showTimeEstimate: true,
                cancelable: false,
                ...options
            }
        };
        
        // Create progress element
        progressState.element = this.createProgressElement(progressState);
        
        // Store progress state
        this.progressOperations.set(progressId, progressState);
        
        // Show progress element
        this.displayProgressElement(progressState.element);
        
        console.log(`Progress indicator shown: ${operationName} (${progressId})`);
        
        return {
            id: progressId,
            update: (current, message) => this.updateProgress(progressId, current, message),
            complete: (message) => this.completeProgress(progressId, message),
            cancel: (message) => this.cancelProgress(progressId, message)
        };
    }
    
    /**
     * Update progress
     * 
     * @param {string} progressId - Progress identifier
     * @param {number} current - Current progress
     * @param {string} message - Optional status message
     */
    updateProgress(progressId, current, message = null) {
        const progressState = this.progressOperations.get(progressId);
        
        if (!progressState) {
            console.warn('Progress state not found:', progressId);
            return;
        }
        
        progressState.current = Math.min(current, progressState.total);
        
        if (message) {
            progressState.currentMessage = message;
        }
        
        // Update UI
        this.updateProgressElement(progressState);
        
        console.log(`Progress updated: ${progressState.current}/${progressState.total} - ${message || ''}`);
    }
    
    /**
     * Complete progress operation
     * 
     * @param {string} progressId - Progress identifier
     * @param {string} message - Completion message
     */
    async completeProgress(progressId, message = 'Operation completed successfully') {
        const progressState = this.progressOperations.get(progressId);
        
        if (!progressState) {
            console.warn('Progress state not found:', progressId);
            return;
        }
        
        // Update to 100%
        progressState.current = progressState.total;
        this.updateProgressElement(progressState);
        
        // Show completion message
        this.showSuccess(message);
        
        // Hide progress after a short delay
        setTimeout(() => {
            this.hideProgress(progressId);
        }, 1000);
        
        console.log(`Progress completed: ${progressId} - ${message}`);
    }
    
    /**
     * Cancel progress operation
     * 
     * @param {string} progressId - Progress identifier
     * @param {string} message - Cancellation message
     */
    cancelProgress(progressId, message = 'Operation cancelled') {
        const progressState = this.progressOperations.get(progressId);
        
        if (!progressState) {
            console.warn('Progress state not found:', progressId);
            return;
        }
        
        // Show cancellation message
        this.showWarning(message);
        
        // Hide progress
        this.hideProgress(progressId);
        
        console.log(`Progress cancelled: ${progressId} - ${message}`);
    }
    
    /**
     * Hide progress indicator
     * 
     * @param {string} progressId - Progress identifier
     */
    hideProgress(progressId) {
        const progressState = this.progressOperations.get(progressId);
        
        if (!progressState) {
            return;
        }
        
        // Hide progress element
        if (progressState.element && progressState.element.parentElement) {
            progressState.element.style.opacity = '0';
            
            setTimeout(() => {
                if (progressState.element && progressState.element.parentElement) {
                    progressState.element.remove();
                }
            }, this.config.animationDuration);
        }
        
        // Remove from state
        this.progressOperations.delete(progressId);
    }
    
    /**
     * Show notification
     * 
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    showNotification(message, type, options = {}) {
        const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const notification = {
            id: notificationId,
            message: message,
            type: type,
            timestamp: Date.now(),
            element: null,
            options: {
                icon: '',
                autoClose: true,
                timeout: this.config.notificationTimeout,
                actions: [],
                sound: this.config.soundEnabled,
                priority: 'normal', // 'low', 'normal', 'high', 'critical'
                ...options
            }
        };
        
        // Handle notification limits and queuing
        if (this.activeNotifications.size >= this.config.maxNotifications) {
            if (this.config.queueNotifications && notification.options.priority !== 'critical') {
                // Queue non-critical notifications
                this.notificationQueue.push(notification);
                console.log(`Notification queued: ${type} - ${message} (${notificationId})`);
                return notificationId;
            } else {
                // Remove oldest notification for critical ones or when queuing is disabled
                const oldestId = this.activeNotifications.keys().next().value;
                this.hideNotification(oldestId);
            }
        }
        
        // Play notification sound
        if (notification.options.sound && this.sounds[type]) {
            this.playNotificationSound(type);
        }
        
        // Create notification element
        notification.element = this.createNotificationElement(notification);
        
        // Store notification
        this.activeNotifications.set(notificationId, notification);
        
        // Show notification
        this.displayNotificationElement(notification.element);
        
        // Auto-close if enabled (but not for persistent errors)
        if (notification.options.autoClose && !(type === 'error' && this.config.persistentErrors)) {
            setTimeout(() => {
                this.hideNotification(notificationId);
            }, notification.options.timeout);
        }
        
        console.log(`Notification shown: ${type} - ${message} (${notificationId})`);
        
        return notificationId;
    }
    
    /**
     * Hide notification
     * 
     * @param {string} notificationId - Notification identifier
     */
    hideNotification(notificationId) {
        const notification = this.activeNotifications.get(notificationId);
        
        if (!notification) {
            return;
        }
        
        // Animate out
        if (notification.element && notification.element.parentElement) {
            notification.element.style.animation = `woow-notification-slide-out ${this.config.animationDuration}ms ease-in`;
            
            setTimeout(() => {
                if (notification.element && notification.element.parentElement) {
                    notification.element.remove();
                }
            }, this.config.animationDuration);
        }
        
        // Remove from state
        this.activeNotifications.delete(notificationId);
        
        // Process queued notifications
        this.processNotificationQueue();
    }
    
    /**
     * Process queued notifications
     */
    processNotificationQueue() {
        if (this.notificationQueue.length === 0 || this.activeNotifications.size >= this.config.maxNotifications) {
            return;
        }
        
        const queuedNotification = this.notificationQueue.shift();
        
        if (queuedNotification) {
            // Play notification sound
            if (queuedNotification.options.sound && this.sounds[queuedNotification.type]) {
                this.playNotificationSound(queuedNotification.type);
            }
            
            // Create notification element
            queuedNotification.element = this.createNotificationElement(queuedNotification);
            
            // Store notification
            this.activeNotifications.set(queuedNotification.id, queuedNotification);
            
            // Show notification
            this.displayNotificationElement(queuedNotification.element);
            
            // Auto-close if enabled (but not for persistent errors)
            if (queuedNotification.options.autoClose && !(queuedNotification.type === 'error' && this.config.persistentErrors)) {
                setTimeout(() => {
                    this.hideNotification(queuedNotification.id);
                }, queuedNotification.options.timeout);
            }
            
            console.log(`Queued notification shown: ${queuedNotification.type} - ${queuedNotification.message} (${queuedNotification.id})`);
        }
    }
    
    /**
     * Create notification sound
     * 
     * @param {string} type - Notification type
     * @returns {AudioContext|null} Audio context for the sound
     */
    createNotificationSound(type) {
        if (!window.AudioContext && !window.webkitAudioContext) {
            return null; // Audio not supported
        }
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            return audioContext;
        } catch (error) {
            console.warn('Failed to create audio context:', error);
            return null;
        }
    }
    
    /**
     * Play notification sound
     * 
     * @param {string} type - Notification type
     */
    playNotificationSound(type) {
        const audioContext = this.sounds[type];
        
        if (!audioContext || !this.config.soundEnabled) {
            return;
        }
        
        try {
            // Create oscillator for different notification types
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configure sound based on type
            switch (type) {
                case 'success':
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
                    break;
                case 'error':
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.1);
                    break;
                case 'warning':
                    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                    break;
                case 'info':
                default:
                    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                    break;
            }
            
            // Configure volume envelope
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
            
            // Play sound
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    }
    
    /**
     * Clear all notifications
     */
    clearAllNotifications() {
        const notificationIds = Array.from(this.activeNotifications.keys());
        notificationIds.forEach(id => this.hideNotification(id));
    }
    
    /**
     * Create notification element
     * 
     * @param {Object} notification - Notification data
     * @returns {HTMLElement} Notification element
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = `woow-notification woow-notification-${notification.type}`;
        element.setAttribute('data-notification-id', notification.id);
        
        const iconHtml = notification.options.icon ? 
            `<span class="woow-notification-icon">${notification.options.icon}</span>` : '';
        
        const actionsHtml = notification.options.actions.length > 0 ?
            `<div class="woow-notification-actions">
                ${notification.options.actions.map(action => 
                    `<button class="woow-notification-action" data-action="${action.id}">${action.label}</button>`
                ).join('')}
            </div>` : '';
        
        element.innerHTML = `
            <div class="woow-notification-content">
                ${iconHtml}
                <div class="woow-notification-body">
                    <span class="woow-notification-message">${notification.message}</span>
                    ${actionsHtml}
                </div>
                <button class="woow-notification-close" data-close="${notification.id}">×</button>
            </div>
        `;
        
        // Add event listeners
        const closeButton = element.querySelector('.woow-notification-close');
        closeButton.addEventListener('click', () => {
            this.hideNotification(notification.id);
        });
        
        // Add action listeners
        notification.options.actions.forEach(action => {
            const actionButton = element.querySelector(`[data-action="${action.id}"]`);
            if (actionButton) {
                actionButton.addEventListener('click', () => {
                    action.callback();
                    if (action.closeOnClick !== false) {
                        this.hideNotification(notification.id);
                    }
                });
            }
        });
        
        return element;
    }
    
    /**
     * Create loading element
     * 
     * @param {Object} loadingState - Loading state data
     * @returns {HTMLElement} Loading element
     */
    createLoadingElement(loadingState) {
        const element = document.createElement('div');
        element.className = 'woow-loading-overlay';
        element.setAttribute('data-loading-id', loadingState.id);
        
        const spinnerHtml = loadingState.options.showSpinner ?
            '<div class="woow-loading-spinner"></div>' : '';
        
        const progressHtml = loadingState.options.showProgress ?
            '<div class="woow-loading-progress"><div class="woow-loading-progress-bar"></div></div>' : '';
        
        const cancelHtml = loadingState.options.cancelable ?
            '<button class="woow-loading-cancel">Cancel</button>' : '';
        
        element.innerHTML = `
            <div class="woow-loading-content">
                ${spinnerHtml}
                <div class="woow-loading-message">${loadingState.message}</div>
                ${progressHtml}
                ${cancelHtml}
            </div>
        `;
        
        // Add cancel listener
        if (loadingState.options.cancelable) {
            const cancelButton = element.querySelector('.woow-loading-cancel');
            cancelButton.addEventListener('click', () => {
                if (loadingState.options.onCancel) {
                    loadingState.options.onCancel();
                }
                this.hideLoading(loadingState.id);
            });
        }
        
        return element;
    }
    
    /**
     * Create progress element
     * 
     * @param {Object} progressState - Progress state data
     * @returns {HTMLElement} Progress element
     */
    createProgressElement(progressState) {
        const element = document.createElement('div');
        element.className = 'woow-progress-container';
        element.setAttribute('data-progress-id', progressState.id);
        
        const cancelHtml = progressState.options.cancelable ?
            '<button class="woow-progress-cancel">Cancel</button>' : '';
        
        element.innerHTML = `
            <div class="woow-progress-content">
                <div class="woow-progress-header">
                    <span class="woow-progress-title">${progressState.operationName}</span>
                    ${cancelHtml}
                </div>
                <div class="woow-progress-bar-container">
                    <div class="woow-progress-bar">
                        <div class="woow-progress-bar-fill"></div>
                    </div>
                    <span class="woow-progress-percentage">0%</span>
                </div>
                <div class="woow-progress-details">
                    <span class="woow-progress-count">0 / ${progressState.total}</span>
                    <span class="woow-progress-message"></span>
                    <span class="woow-progress-time"></span>
                </div>
            </div>
        `;
        
        // Add cancel listener
        if (progressState.options.cancelable) {
            const cancelButton = element.querySelector('.woow-progress-cancel');
            cancelButton.addEventListener('click', () => {
                if (progressState.options.onCancel) {
                    progressState.options.onCancel();
                }
                this.cancelProgress(progressState.id);
            });
        }
        
        return element;
    }
    
    /**
     * Update loading message
     * 
     * @param {string} loadingId - Loading identifier
     * @param {string} message - New message
     */
    updateLoadingMessage(loadingId, message) {
        const loadingState = this.loadingStates.get(loadingId);
        
        if (!loadingState || !loadingState.element) {
            return;
        }
        
        const messageElement = loadingState.element.querySelector('.woow-loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        loadingState.message = message;
    }
    
    /**
     * Update loading progress
     * 
     * @param {string} loadingId - Loading identifier
     * @param {number} progress - Progress percentage (0-100)
     */
    updateLoadingProgress(loadingId, progress) {
        const loadingState = this.loadingStates.get(loadingId);
        
        if (!loadingState || !loadingState.element) {
            return;
        }
        
        const progressBar = loadingState.element.querySelector('.woow-loading-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    }
    
    /**
     * Update progress element
     * 
     * @param {Object} progressState - Progress state data
     */
    updateProgressElement(progressState) {
        if (!progressState.element) {
            return;
        }
        
        const percentage = Math.round((progressState.current / progressState.total) * 100);
        const elapsed = Date.now() - progressState.startTime;
        const rate = progressState.current / (elapsed / 1000); // items per second
        const remaining = progressState.total - progressState.current;
        const estimatedTime = remaining > 0 && rate > 0 ? Math.round(remaining / rate) : 0;
        
        // Update progress bar
        const progressBarFill = progressState.element.querySelector('.woow-progress-bar-fill');
        if (progressBarFill) {
            progressBarFill.style.width = `${percentage}%`;
        }
        
        // Update percentage
        const percentageElement = progressState.element.querySelector('.woow-progress-percentage');
        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
        }
        
        // Update count
        const countElement = progressState.element.querySelector('.woow-progress-count');
        if (countElement) {
            countElement.textContent = `${progressState.current} / ${progressState.total}`;
        }
        
        // Update message
        const messageElement = progressState.element.querySelector('.woow-progress-message');
        if (messageElement && progressState.currentMessage) {
            messageElement.textContent = progressState.currentMessage;
        }
        
        // Update time estimate
        const timeElement = progressState.element.querySelector('.woow-progress-time');
        if (timeElement && progressState.options.showTimeEstimate && estimatedTime > 0) {
            timeElement.textContent = `~${estimatedTime}s remaining`;
        }
    }
    
    /**
     * Display notification element
     * 
     * @param {HTMLElement} element - Notification element
     */
    displayNotificationElement(element) {
        const container = this.getNotificationContainer();
        container.appendChild(element);
        
        // Trigger animation
        setTimeout(() => {
            element.style.animation = `woow-notification-slide-in ${this.config.animationDuration}ms ease-out`;
        }, 10);
    }
    
    /**
     * Display loading element
     * 
     * @param {HTMLElement} element - Loading element
     */
    displayLoadingElement(element) {
        document.body.appendChild(element);
        
        // Trigger animation
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    }
    
    /**
     * Display progress element
     * 
     * @param {HTMLElement} element - Progress element
     */
    displayProgressElement(element) {
        const container = this.getNotificationContainer();
        container.appendChild(element);
        
        // Trigger animation
        setTimeout(() => {
            element.style.animation = `woow-notification-slide-in ${this.config.animationDuration}ms ease-out`;
        }, 10);
    }
    
    /**
     * Get or create notification container
     * 
     * @returns {HTMLElement} Notification container
     */
    getNotificationContainer() {
        let container = document.getElementById('woow-notification-container');
        
        if (!container) {
            container = this.createNotificationContainer();
        }
        
        return container;
    }
    
    /**
     * Create notification container
     * 
     * @returns {HTMLElement} Notification container
     */
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'woow-notification-container';
        container.className = 'woow-notification-container';
        
        document.body.appendChild(container);
        
        return container;
    }
    
    /**
     * Create loading overlay template
     */
    createLoadingOverlay() {
        // Loading overlay is created dynamically when needed
        // This method is for future enhancements
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.showSuccess('Connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.showWarning('You are offline. Changes will be saved when connection is restored.');
        });
        
        // Listen for beforeunload to warn about pending operations
        window.addEventListener('beforeunload', (event) => {
            if (this.loadingStates.size > 0 || this.progressOperations.size > 0) {
                event.preventDefault();
                event.returnValue = 'Operations are still in progress. Are you sure you want to leave?';
                return event.returnValue;
            }
        });
    }
    
    /**
     * Show loading indicator for settings save operation
     * 
     * @param {string} settingKey - The setting being saved
     * @param {Object} options - Additional options
     * @returns {Object} Loading control object
     */
    showSettingsSaveLoading(settingKey, options = {}) {
        const message = options.message || `Saving ${settingKey}...`;
        const operationId = `save_${settingKey}_${Date.now()}`;
        
        return this.showLoading(message, operationId, {
            showSpinner: true,
            showProgress: false,
            cancelable: false,
            type: 'settings-save',
            settingKey: settingKey,
            ...options
        });
    }
    
    /**
     * Show loading indicator for settings load operation
     * 
     * @param {Object} options - Additional options
     * @returns {Object} Loading control object
     */
    showSettingsLoadLoading(options = {}) {
        const message = options.message || 'Loading settings...';
        const operationId = `load_settings_${Date.now()}`;
        
        return this.showLoading(message, operationId, {
            showSpinner: true,
            showProgress: false,
            cancelable: false,
            type: 'settings-load',
            ...options
        });
    }
    
    /**
     * Show loading indicator for bulk settings operations
     * 
     * @param {number} totalSettings - Total number of settings to process
     * @param {Object} options - Additional options
     * @returns {Object} Loading control object
     */
    showBulkSettingsLoading(totalSettings, options = {}) {
        const message = options.message || `Processing ${totalSettings} settings...`;
        const operationId = `bulk_settings_${Date.now()}`;
        
        return this.showLoading(message, operationId, {
            showSpinner: true,
            showProgress: true,
            cancelable: options.cancelable || false,
            type: 'bulk-settings',
            totalSettings: totalSettings,
            ...options
        });
    }
    
    /**
     * Show inline loading indicator for specific UI elements
     * 
     * @param {HTMLElement} element - Target element
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     * @returns {Object} Loading control object
     */
    showInlineLoading(element, message, options = {}) {
        const loadingId = `inline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store original element content
        const originalContent = element.innerHTML;
        const originalDisabled = element.disabled;
        
        // Create inline loading content
        const loadingContent = this.createInlineLoadingContent(message, options);
        
        // Apply loading state
        element.innerHTML = loadingContent;
        if (element.tagName === 'BUTTON' || element.tagName === 'INPUT') {
            element.disabled = true;
        }
        element.classList.add('woow-loading-state');
        
        const loadingState = {
            id: loadingId,
            element: element,
            originalContent: originalContent,
            originalDisabled: originalDisabled,
            message: message,
            startTime: Date.now()
        };
        
        this.loadingStates.set(loadingId, loadingState);
        
        return {
            id: loadingId,
            updateMessage: (newMessage) => this.updateInlineLoadingMessage(loadingId, newMessage),
            hide: () => this.hideInlineLoading(loadingId)
        };
    }
    
    /**
     * Create inline loading content
     * 
     * @param {string} message - Loading message
     * @param {Object} options - Additional options
     * @returns {string} HTML content
     */
    createInlineLoadingContent(message, options = {}) {
        const spinnerHtml = options.showSpinner !== false ? 
            '<span class="woow-inline-spinner"></span>' : '';
        
        return `
            <span class="woow-inline-loading">
                ${spinnerHtml}
                <span class="woow-inline-loading-message">${message}</span>
            </span>
        `;
    }
    
    /**
     * Update inline loading message
     * 
     * @param {string} loadingId - Loading identifier
     * @param {string} message - New message
     */
    updateInlineLoadingMessage(loadingId, message) {
        const loadingState = this.loadingStates.get(loadingId);
        
        if (!loadingState || !loadingState.element) {
            return;
        }
        
        const messageElement = loadingState.element.querySelector('.woow-inline-loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        loadingState.message = message;
    }
    
    /**
     * Hide inline loading indicator
     * 
     * @param {string} loadingId - Loading identifier
     */
    async hideInlineLoading(loadingId) {
        const loadingState = this.loadingStates.get(loadingId);
        
        if (!loadingState) {
            return;
        }
        
        // Ensure minimum loading duration for UX
        const elapsed = Date.now() - loadingState.startTime;
        const remainingTime = Math.max(0, this.config.loadingMinDuration - elapsed);
        
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // Restore original content
        loadingState.element.innerHTML = loadingState.originalContent;
        loadingState.element.disabled = loadingState.originalDisabled;
        loadingState.element.classList.remove('woow-loading-state');
        
        // Remove from state
        this.loadingStates.delete(loadingId);
    }
    
    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('woow-feedback-styles')) {
            return; // Already injected
        }
        
        const styles = document.createElement('style');
        styles.id = 'woow-feedback-styles';
        styles.textContent = `
            /* Notification Container */
            .woow-notification-container {
                position: fixed;
                top: 32px;
                right: 20px;
                z-index: 999999;
                pointer-events: none;
            }
            
            /* Notification Styles */
            .woow-notification {
                pointer-events: auto;
                max-width: 400px;
                margin-bottom: 10px;
                padding: 16px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease-out;
            }
            
            .woow-notification-success {
                background: #d4edda;
                color: #155724;
                border-left: 4px solid #28a745;
            }
            
            .woow-notification-error {
                background: #f8d7da;
                color: #721c24;
                border-left: 4px solid #dc3545;
            }
            
            .woow-notification-warning {
                background: #fff3cd;
                color: #856404;
                border-left: 4px solid #ffc107;
            }
            
            .woow-notification-info {
                background: #d1ecf1;
                color: #0c5460;
                border-left: 4px solid #17a2b8;
            }
            
            .woow-notification-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            
            .woow-notification-icon {
                font-size: 16px;
                font-weight: bold;
                flex-shrink: 0;
                margin-top: 2px;
            }
            
            .woow-notification-body {
                flex: 1;
            }
            
            .woow-notification-message {
                display: block;
                margin-bottom: 8px;
            }
            
            .woow-notification-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }
            
            .woow-notification-action {
                background: rgba(0,0,0,0.1);
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 12px;
                cursor: pointer;
                color: inherit;
            }
            
            .woow-notification-action:hover {
                background: rgba(0,0,0,0.2);
            }
            
            .woow-notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: inherit;
                opacity: 0.7;
                flex-shrink: 0;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .woow-notification-close:hover {
                opacity: 1;
            }
            
            /* Loading Overlay */
            .woow-loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 999998;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease-out;
            }
            
            .woow-loading-content {
                background: white;
                padding: 32px;
                border-radius: 8px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            
            /* Inline Loading States */
            .woow-loading-state {
                position: relative;
                pointer-events: none;
                opacity: 0.7;
            }
            
            .woow-inline-loading {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
                color: #666;
            }
            
            .woow-inline-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #0073aa;
                border-radius: 50%;
                animation: woow-inline-spin 1s linear infinite;
            }
            
            @keyframes woow-inline-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Enhanced Loading Spinner */
            .woow-loading-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #0073aa;
                border-radius: 50%;
                animation: woow-spin 1s linear infinite;
                margin: 0 auto 16px;
            }
            
            .woow-loading-message {
                font-size: 16px;
                color: #333;
                margin-bottom: 16px;
            }
            
            .woow-loading-progress {
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 16px;
            }
            
            .woow-loading-progress-bar {
                height: 100%;
                background: #0073aa;
                width: 0%;
                transition: width 0.3s ease-out;
            }
            
            .woow-loading-cancel {
                background: #dc3545;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .woow-loading-cancel:hover {
                background: #c82333;
            }
            
            /* Progress Container */
            .woow-progress-container {
                pointer-events: auto;
                max-width: 500px;
                margin-bottom: 10px;
                padding: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 14px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease-out;
            }
            
            .woow-progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .woow-progress-title {
                font-weight: 600;
                font-size: 16px;
                color: #333;
            }
            
            .woow-progress-cancel {
                background: #dc3545;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .woow-progress-cancel:hover {
                background: #c82333;
            }
            
            .woow-progress-bar-container {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            
            .woow-progress-bar {
                flex: 1;
                height: 12px;
                background: #f0f0f0;
                border-radius: 6px;
                overflow: hidden;
            }
            
            .woow-progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #0073aa, #005a87);
                width: 0%;
                transition: width 0.3s ease-out;
            }
            
            .woow-progress-percentage {
                font-weight: 600;
                color: #0073aa;
                min-width: 40px;
                text-align: right;
            }
            
            .woow-progress-details {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #666;
            }
            
            .woow-progress-count {
                font-weight: 500;
            }
            
            .woow-progress-message {
                font-style: italic;
            }
            
            .woow-progress-time {
                color: #888;
            }
            
            /* Animations */
            @keyframes woow-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes woow-notification-slide-in {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes woow-notification-slide-out {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .woow-notification-container {
                    right: 10px;
                    left: 10px;
                }
                
                .woow-notification {
                    max-width: none;
                }
                
                .woow-progress-container {
                    max-width: none;
                }
                
                .woow-loading-content {
                    width: 95%;
                    padding: 24px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    /**
     * Get system status
     * 
     * @returns {Object} System status
     */
    getStatus() {
        return {
            activeNotifications: this.activeNotifications.size,
            loadingOperations: this.loadingStates.size,
            progressOperations: this.progressOperations.size,
            isOnline: navigator.onLine
        };
    }
    
    /**
     * Cleanup method for destroying the feedback system
     */
    destroy() {
        // Clear all notifications
        this.clearAllNotifications();
        
        // Hide all loading indicators
        Array.from(this.loadingStates.keys()).forEach(id => this.hideLoading(id));
        
        // Hide all progress indicators
        Array.from(this.progressOperations.keys()).forEach(id => this.hideProgress(id));
        
        // Remove container
        const container = document.getElementById('woow-notification-container');
        if (container) {
            container.remove();
        }
        
        // Remove styles
        const styles = document.getElementById('woow-feedback-styles');
        if (styles) {
            styles.remove();
        }
        
        console.log('User Feedback System destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserFeedbackSystem;
}

// Global instance for immediate use
window.WoowUserFeedback = new UserFeedbackSystem();