/**
 * Error Recovery Manager
 * 
 * Handles different types of errors in the settings persistence system:
 * - Network errors with offline queue management
 * - Database errors with fallback strategies
 * - Validation errors with user feedback
 * - Conflict resolution errors
 * 
 * @version 1.0.0
 * @author WOOW! Admin Styler
 */

class ErrorRecoveryManager {
    constructor(persistenceManager) {
        this.persistenceManager = persistenceManager;
        
        // Error tracking
        this.errorHistory = [];
        this.offlineQueue = new Map();
        this.retryQueue = new Map();
        
        // Configuration
        this.config = {
            maxErrorHistory: 100,
            maxRetryAttempts: 3,
            retryDelayBase: 1000, // 1 second base delay
            offlineQueueLimit: 50,
            notificationTimeout: 5000 // 5 seconds
        };
        
        // Error type definitions
        this.errorTypes = {
            NETWORK: 'network',
            DATABASE: 'database',
            VALIDATION: 'validation',
            CONFLICT: 'conflict',
            STORAGE: 'storage',
            UNKNOWN: 'unknown'
        };
        
        // Initialize feedback system integration
        this.feedbackSystem = window.WoowUserFeedback || null;
        if (!this.feedbackSystem) {
            console.warn('UserFeedbackSystem not available. Using fallback notifications.');
            this.initializeFallbackNotifications();
        }
        
        // Enhanced notification queue and management
        this.notificationQueue = [];
        this.activeToasts = new Map();
        this.toastConfig = {
            maxConcurrent: 3,
            defaultTimeout: 5000,
            successTimeout: 3000,
            errorTimeout: 0, // Persistent until dismissed
            warningTimeout: 7000,
            infoTimeout: 5000
        };
        
        // Initialize error handling
        this.initializeErrorHandling();
    }
    
    /**
     * Initialize error handling system
     */
    initializeErrorHandling() {
        // Global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledError(event.reason);
        });
        
        // Global error handler for JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleUnhandledError(event.error);
        });
    }
    
    /**
     * Initialize fallback notification system when UserFeedbackSystem is not available
     */
    initializeFallbackNotifications() {
        // Create enhanced fallback notification system
        this.fallbackNotifications = {
            container: null,
            activeNotifications: new Map(),
            maxNotifications: 3,
            
            init: () => {
                if (!this.fallbackNotifications.container) {
                    this.fallbackNotifications.container = this.createFallbackContainer();
                }
            },
            
            show: (message, type, options = {}) => {
                this.fallbackNotifications.init();
                
                // Limit concurrent notifications
                if (this.fallbackNotifications.activeNotifications.size >= this.fallbackNotifications.maxNotifications) {
                    const oldestId = this.fallbackNotifications.activeNotifications.keys().next().value;
                    this.fallbackNotifications.hide(oldestId);
                }
                
                const notificationId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const notification = this.createFallbackNotification(message, type, notificationId, options);
                
                this.fallbackNotifications.container.appendChild(notification);
                this.fallbackNotifications.activeNotifications.set(notificationId, notification);
                
                // Auto-hide after timeout
                if (options.autoClose !== false) {
                    setTimeout(() => {
                        this.fallbackNotifications.hide(notificationId);
                    }, options.timeout || this.config.notificationTimeout);
                }
                
                return notificationId;
            },
            
            hide: (notificationId) => {
                const notification = this.fallbackNotifications.activeNotifications.get(notificationId);
                if (notification && notification.parentElement) {
                    notification.style.animation = 'woow-fallback-slide-out 0.3s ease-in';
                    setTimeout(() => {
                        if (notification.parentElement) {
                            notification.remove();
                        }
                    }, 300);
                }
                this.fallbackNotifications.activeNotifications.delete(notificationId);
            }
        };
    }
    
    /**
     * Create fallback notification container
     * 
     * @returns {HTMLElement} Container element
     */
    createFallbackContainer() {
        const container = document.createElement('div');
        container.id = 'woow-fallback-notification-container';
        container.style.cssText = `
            position: fixed;
            top: 32px;
            right: 20px;
            z-index: 999999;
            pointer-events: none;
        `;
        
        // Add enhanced styles
        if (!document.getElementById('woow-fallback-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'woow-fallback-notification-styles';
            styles.textContent = `
                .woow-fallback-notification {
                    pointer-events: auto;
                    max-width: 400px;
                    margin-bottom: 10px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    animation: woow-fallback-slide-in 0.3s ease-out;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    backdrop-filter: blur(10px);
                    position: relative;
                    overflow: hidden;
                }
                
                .woow-fallback-notification-success {
                    background: #d4edda;
                    color: #155724;
                    border-left: 4px solid #28a745;
                }
                
                .woow-fallback-notification-error {
                    background: #f8d7da;
                    color: #721c24;
                    border-left: 4px solid #dc3545;
                }
                
                .woow-fallback-notification-warning {
                    background: #fff3cd;
                    color: #856404;
                    border-left: 4px solid #ffc107;
                }
                
                .woow-fallback-notification-info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border-left: 4px solid #17a2b8;
                }
                
                .woow-fallback-notification-icon {
                    font-size: 16px;
                    font-weight: bold;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                
                .woow-fallback-notification-content {
                    flex: 1;
                }
                
                .woow-fallback-notification-close {
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
                
                .woow-fallback-notification-close:hover {
                    opacity: 1;
                }
                
                @keyframes woow-fallback-slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes woow-fallback-slide-out {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(container);
        return container;
    }
    
    /**
     * Create fallback notification element
     * 
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {string} notificationId - Notification ID
     * @param {Object} options - Additional options
     * @returns {HTMLElement} Notification element
     */
    createFallbackNotification(message, type, notificationId, options = {}) {
        const notification = document.createElement('div');
        notification.className = `woow-fallback-notification woow-fallback-notification-${type}`;
        notification.setAttribute('data-notification-id', notificationId);
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const icon = options.icon || icons[type] || '';
        
        notification.innerHTML = `
            ${icon ? `<span class="woow-fallback-notification-icon">${icon}</span>` : ''}
            <div class="woow-fallback-notification-content">${message}</div>
            <button class="woow-fallback-notification-close">×</button>
        `;
        
        // Add close button functionality
        const closeButton = notification.querySelector('.woow-fallback-notification-close');
        closeButton.addEventListener('click', () => {
            this.fallbackNotifications.hide(notificationId);
        });
        
        return notification;
    }
    
    /**
     * Enhanced toast notification system
     * Integrates with UserFeedbackSystem or uses fallback
     */
    
    /**
     * Show success toast notification
     * 
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    showSuccessToast(message, options = {}) {
        const toastOptions = {
            type: 'success',
            timeout: this.toastConfig.successTimeout,
            icon: '✓',
            autoClose: true,
            sound: true,
            ...options
        };
        
        return this.showEnhancedToast(message, 'success', toastOptions);
    }
    
    /**
     * Show error toast notification
     * 
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    showErrorToast(message, options = {}) {
        const toastOptions = {
            type: 'error',
            timeout: this.toastConfig.errorTimeout, // Persistent
            icon: '✕',
            autoClose: false,
            sound: true,
            actions: [
                {
                    id: 'dismiss',
                    label: 'Dismiss',
                    callback: () => {},
                    closeOnClick: true
                }
            ],
            ...options
        };
        
        return this.showEnhancedToast(message, 'error', toastOptions);
    }
    
    /**
     * Show warning toast notification
     * 
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    showWarningToast(message, options = {}) {
        const toastOptions = {
            type: 'warning',
            timeout: this.toastConfig.warningTimeout,
            icon: '⚠',
            autoClose: true,
            sound: true,
            ...options
        };
        
        return this.showEnhancedToast(message, 'warning', toastOptions);
    }
    
    /**
     * Show info toast notification
     * 
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    showInfoToast(message, options = {}) {
        const toastOptions = {
            type: 'info',
            timeout: this.toastConfig.infoTimeout,
            icon: 'ℹ',
            autoClose: true,
            sound: false, // Info messages are less intrusive
            ...options
        };
        
        return this.showEnhancedToast(message, 'info', toastOptions);
    }
    
    /**
     * Show enhanced toast notification with queue management
     * 
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    showEnhancedToast(message, type, options = {}) {
        const toastId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const toast = {
            id: toastId,
            message: message,
            type: type,
            timestamp: Date.now(),
            options: options
        };
        
        // Check if we can show immediately or need to queue
        if (this.activeToasts.size >= this.toastConfig.maxConcurrent) {
            // Queue the toast
            this.notificationQueue.push(toast);
            console.log(`Toast queued: ${type} - ${message} (${toastId})`);
            return toastId;
        }
        
        // Show immediately
        this.displayToast(toast);
        
        return toastId;
    }
    
    /**
     * Display a toast notification
     * 
     * @param {Object} toast - Toast data
     */
    displayToast(toast) {
        this.activeToasts.set(toast.id, toast);
        
        // Use UserFeedbackSystem if available, otherwise fallback
        if (this.feedbackSystem) {
            try {
                const notificationId = this.feedbackSystem.showNotification(
                    toast.message,
                    toast.type,
                    toast.options
                );
                
                // Store the feedback system notification ID
                toast.feedbackSystemId = notificationId;
                
                console.log(`Toast shown via UserFeedbackSystem: ${toast.type} - ${toast.message} (${toast.id})`);
            } catch (error) {
                console.warn('Failed to show toast via UserFeedbackSystem, using fallback:', error);
                this.showFallbackToast(toast);
            }
        } else {
            this.showFallbackToast(toast);
        }
        
        // Auto-hide if configured
        if (toast.options.autoClose && toast.options.timeout > 0) {
            setTimeout(() => {
                this.hideToast(toast.id);
            }, toast.options.timeout);
        }
    }
    
    /**
     * Show fallback toast notification
     * 
     * @param {Object} toast - Toast data
     */
    showFallbackToast(toast) {
        const fallbackId = this.fallbackNotifications.show(
            toast.message,
            toast.type,
            {
                ...toast.options,
                timeout: toast.options.timeout || this.toastConfig.defaultTimeout
            }
        );
        
        toast.fallbackId = fallbackId;
        console.log(`Toast shown via fallback: ${toast.type} - ${toast.message} (${toast.id})`);
    }
    
    /**
     * Hide a toast notification
     * 
     * @param {string} toastId - Toast identifier
     */
    hideToast(toastId) {
        const toast = this.activeToasts.get(toastId);
        
        if (!toast) {
            return;
        }
        
        // Hide via appropriate system
        if (toast.feedbackSystemId && this.feedbackSystem) {
            try {
                this.feedbackSystem.hideNotification(toast.feedbackSystemId);
            } catch (error) {
                console.warn('Failed to hide toast via UserFeedbackSystem:', error);
            }
        }
        
        if (toast.fallbackId) {
            this.fallbackNotifications.hide(toast.fallbackId);
        }
        
        // Remove from active toasts
        this.activeToasts.delete(toastId);
        
        // Process queued toasts
        this.processToastQueue();
        
        console.log(`Toast hidden: ${toastId}`);
    }
    
    /**
     * Process queued toast notifications
     */
    processToastQueue() {
        if (this.notificationQueue.length === 0 || this.activeToasts.size >= this.toastConfig.maxConcurrent) {
            return;
        }
        
        const queuedToast = this.notificationQueue.shift();
        
        if (queuedToast) {
            this.displayToast(queuedToast);
            console.log(`Queued toast displayed: ${queuedToast.type} - ${queuedToast.message} (${queuedToast.id})`);
        }
    }
    
    /**
     * Clear all active toast notifications
     */
    clearAllToasts() {
        const toastIds = Array.from(this.activeToasts.keys());
        toastIds.forEach(id => this.hideToast(id));
        
        // Clear the queue as well
        this.notificationQueue = [];
        
        console.log('All toasts cleared');
    }
    
    /**
     * Show loading indicator for settings save operations
     * 
     * @param {string} settingKey - Setting key being saved
     * @param {Object} options - Loading options
     * @returns {Object} Loading control object
     */
    showSettingsSaveLoading(settingKey, options = {}) {
        const loadingId = `save_${settingKey}_${Date.now()}`;
        const message = options.message || `Saving ${settingKey}...`;
        
        if (this.feedbackSystem && this.feedbackSystem.showLoading) {
            return this.feedbackSystem.showLoading(message, loadingId, {
                showSpinner: true,
                showProgress: false,
                cancelable: false,
                ...options
            });
        } else {
            // Fallback loading indicator
            return this.showFallbackLoading(message, loadingId, options);
        }
    }
    
    /**
     * Show loading indicator for settings load operations
     * 
     * @param {Object} options - Loading options
     * @returns {Object} Loading control object
     */
    showSettingsLoadLoading(options = {}) {
        const loadingId = `load_${Date.now()}`;
        const message = options.message || 'Loading settings...';
        
        if (this.feedbackSystem && this.feedbackSystem.showLoading) {
            return this.feedbackSystem.showLoading(message, loadingId, {
                showSpinner: true,
                showProgress: false,
                cancelable: false,
                ...options
            });
        } else {
            // Fallback loading indicator
            return this.showFallbackLoading(message, loadingId, options);
        }
    }
    
    /**
     * Show progress indicator for bulk operations
     * 
     * @param {string} operationName - Name of the bulk operation
     * @param {number} total - Total number of items
     * @param {Object} options - Progress options
     * @returns {Object} Progress control object
     */
    showBulkOperationProgress(operationName, total, options = {}) {
        if (this.feedbackSystem && this.feedbackSystem.showProgress) {
            return this.feedbackSystem.showProgress(operationName, total, {
                showPercentage: true,
                showItemCount: true,
                showTimeEstimate: true,
                cancelable: false,
                ...options
            });
        } else {
            // Fallback progress indicator
            return this.showFallbackProgress(operationName, total, options);
        }
    }
    
    /**
     * Show fallback loading indicator when UserFeedbackSystem is not available
     * 
     * @param {string} message - Loading message
     * @param {string} loadingId - Loading identifier
     * @param {Object} options - Loading options
     * @returns {Object} Loading control object
     */
    showFallbackLoading(message, loadingId, options = {}) {
        const loadingElement = this.createFallbackLoadingElement(message, loadingId, options);
        document.body.appendChild(loadingElement);
        
        // Store loading state
        this.activeLoadings = this.activeLoadings || new Map();
        this.activeLoadings.set(loadingId, {
            element: loadingElement,
            startTime: Date.now(),
            message: message
        });
        
        console.log(`Fallback loading shown: ${message} (${loadingId})`);
        
        return {
            id: loadingId,
            updateMessage: (newMessage) => this.updateFallbackLoadingMessage(loadingId, newMessage),
            hide: () => this.hideFallbackLoading(loadingId)
        };
    }
    
    /**
     * Create fallback loading element
     * 
     * @param {string} message - Loading message
     * @param {string} loadingId - Loading identifier
     * @param {Object} options - Loading options
     * @returns {HTMLElement} Loading element
     */
    createFallbackLoadingElement(message, loadingId, options = {}) {
        const overlay = document.createElement('div');
        overlay.className = 'woow-fallback-loading-overlay';
        overlay.setAttribute('data-loading-id', loadingId);
        
        overlay.innerHTML = `
            <div class="woow-fallback-loading-content">
                <div class="woow-fallback-loading-spinner"></div>
                <div class="woow-fallback-loading-message">${message}</div>
            </div>
        `;
        
        // Add styles if not already added
        if (!document.getElementById('woow-fallback-loading-styles')) {
            const styles = document.createElement('style');
            styles.id = 'woow-fallback-loading-styles';
            styles.textContent = `
                .woow-fallback-loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .woow-fallback-loading-overlay.show {
                    opacity: 1;
                }
                
                .woow-fallback-loading-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    text-align: center;
                    min-width: 200px;
                }
                
                .woow-fallback-loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #0073aa;
                    border-radius: 50%;
                    animation: woow-fallback-spin 1s linear infinite;
                    margin: 0 auto 15px;
                }
                
                .woow-fallback-loading-message {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 16px;
                    color: #333;
                    font-weight: 500;
                }
                
                @keyframes woow-fallback-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Show with animation
        setTimeout(() => {
            overlay.classList.add('show');
        }, 10);
        
        return overlay;
    }
    
    /**
     * Update fallback loading message
     * 
     * @param {string} loadingId - Loading identifier
     * @param {string} newMessage - New message
     */
    updateFallbackLoadingMessage(loadingId, newMessage) {
        const loadingState = this.activeLoadings?.get(loadingId);
        if (!loadingState) return;
        
        const messageElement = loadingState.element.querySelector('.woow-fallback-loading-message');
        if (messageElement) {
            messageElement.textContent = newMessage;
        }
        
        loadingState.message = newMessage;
    }
    
    /**
     * Hide fallback loading indicator
     * 
     * @param {string} loadingId - Loading identifier
     */
    hideFallbackLoading(loadingId) {
        const loadingState = this.activeLoadings?.get(loadingId);
        if (!loadingState) return;
        
        // Ensure minimum loading duration for UX
        const elapsed = Date.now() - loadingState.startTime;
        const minDuration = 300; // 300ms minimum
        const remainingTime = Math.max(0, minDuration - elapsed);
        
        setTimeout(() => {
            if (loadingState.element && loadingState.element.parentElement) {
                loadingState.element.classList.remove('show');
                setTimeout(() => {
                    if (loadingState.element && loadingState.element.parentElement) {
                        loadingState.element.remove();
                    }
                }, 300);
            }
            
            this.activeLoadings?.delete(loadingId);
        }, remainingTime);
        
        console.log(`Fallback loading hidden: ${loadingId}`);
    }
    
    /**
     * Show fallback progress indicator
     * 
     * @param {string} operationName - Operation name
     * @param {number} total - Total items
     * @param {Object} options - Progress options
     * @returns {Object} Progress control object
     */
    showFallbackProgress(operationName, total, options = {}) {
        const progressId = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const progressElement = this.createFallbackProgressElement(operationName, total, progressId, options);
        
        // Add to notification container or body
        const container = this.getNotificationContainer ? this.getNotificationContainer() : document.body;
        container.appendChild(progressElement);
        
        // Store progress state
        this.activeProgress = this.activeProgress || new Map();
        this.activeProgress.set(progressId, {
            element: progressElement,
            operationName: operationName,
            total: total,
            current: 0,
            startTime: Date.now()
        });
        
        console.log(`Fallback progress shown: ${operationName} (${progressId})`);
        
        return {
            id: progressId,
            update: (current, message) => this.updateFallbackProgress(progressId, current, message),
            complete: (message) => this.completeFallbackProgress(progressId, message),
            cancel: (message) => this.cancelFallbackProgress(progressId, message)
        };
    }
    
    /**
     * Create fallback progress element
     * 
     * @param {string} operationName - Operation name
     * @param {number} total - Total items
     * @param {string} progressId - Progress identifier
     * @param {Object} options - Progress options
     * @returns {HTMLElement} Progress element
     */
    createFallbackProgressElement(operationName, total, progressId, options = {}) {
        const element = document.createElement('div');
        element.className = 'woow-fallback-progress-container';
        element.setAttribute('data-progress-id', progressId);
        
        element.innerHTML = `
            <div class="woow-fallback-progress-content">
                <div class="woow-fallback-progress-header">
                    <span class="woow-fallback-progress-title">${operationName}</span>
                </div>
                <div class="woow-fallback-progress-bar-container">
                    <div class="woow-fallback-progress-bar">
                        <div class="woow-fallback-progress-bar-fill"></div>
                    </div>
                    <span class="woow-fallback-progress-percentage">0%</span>
                </div>
                <div class="woow-fallback-progress-details">
                    <span class="woow-fallback-progress-count">0 / ${total}</span>
                    <span class="woow-fallback-progress-message"></span>
                </div>
            </div>
        `;
        
        // Add styles if not already added
        if (!document.getElementById('woow-fallback-progress-styles')) {
            const styles = document.createElement('style');
            styles.id = 'woow-fallback-progress-styles';
            styles.textContent = `
                .woow-fallback-progress-container {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    margin-bottom: 10px;
                    padding: 20px;
                    max-width: 400px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    animation: woow-fallback-slide-in 0.3s ease-out;
                }
                
                .woow-fallback-progress-header {
                    margin-bottom: 15px;
                }
                
                .woow-fallback-progress-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }
                
                .woow-fallback-progress-bar-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                
                .woow-fallback-progress-bar {
                    flex: 1;
                    height: 8px;
                    background: #f0f0f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .woow-fallback-progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #0073aa, #005a87);
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .woow-fallback-progress-percentage {
                    font-size: 14px;
                    font-weight: 600;
                    color: #0073aa;
                    min-width: 40px;
                    text-align: right;
                }
                
                .woow-fallback-progress-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: #666;
                }
                
                .woow-fallback-progress-count {
                    font-weight: 500;
                }
                
                .woow-fallback-progress-message {
                    font-style: italic;
                }
            `;
            document.head.appendChild(styles);
        }
        
        return element;
    }
    
    /**
     * Update fallback progress
     * 
     * @param {string} progressId - Progress identifier
     * @param {number} current - Current progress
     * @param {string} message - Optional status message
     */
    updateFallbackProgress(progressId, current, message = null) {
        const progressState = this.activeProgress?.get(progressId);
        if (!progressState) return;
        
        progressState.current = Math.min(current, progressState.total);
        
        const percentage = Math.round((progressState.current / progressState.total) * 100);
        
        // Update progress bar
        const progressBarFill = progressState.element.querySelector('.woow-fallback-progress-bar-fill');
        if (progressBarFill) {
            progressBarFill.style.width = `${percentage}%`;
        }
        
        // Update percentage
        const percentageElement = progressState.element.querySelector('.woow-fallback-progress-percentage');
        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
        }
        
        // Update count
        const countElement = progressState.element.querySelector('.woow-fallback-progress-count');
        if (countElement) {
            countElement.textContent = `${progressState.current} / ${progressState.total}`;
        }
        
        // Update message
        if (message) {
            const messageElement = progressState.element.querySelector('.woow-fallback-progress-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
        
        console.log(`Fallback progress updated: ${progressState.current}/${progressState.total} - ${message || ''}`);
    }
    
    /**
     * Complete fallback progress
     * 
     * @param {string} progressId - Progress identifier
     * @param {string} message - Completion message
     */
    completeFallbackProgress(progressId, message = 'Operation completed successfully') {
        const progressState = this.activeProgress?.get(progressId);
        if (!progressState) return;
        
        // Update to 100%
        this.updateFallbackProgress(progressId, progressState.total, 'Completed');
        
        // Show success notification
        this.showSuccessToast(message);
        
        // Hide progress after a short delay
        setTimeout(() => {
            this.hideFallbackProgress(progressId);
        }, 1500);
        
        console.log(`Fallback progress completed: ${progressId} - ${message}`);
    }
    
    /**
     * Cancel fallback progress
     * 
     * @param {string} progressId - Progress identifier
     * @param {string} message - Cancellation message
     */
    cancelFallbackProgress(progressId, message = 'Operation cancelled') {
        this.showWarningToast(message);
        this.hideFallbackProgress(progressId);
        
        console.log(`Fallback progress cancelled: ${progressId} - ${message}`);
    }
    
    /**
     * Hide fallback progress
     * 
     * @param {string} progressId - Progress identifier
     */
    hideFallbackProgress(progressId) {
        const progressState = this.activeProgress?.get(progressId);
        if (!progressState) return;
        
        if (progressState.element && progressState.element.parentElement) {
            progressState.element.style.animation = 'woow-fallback-slide-out 0.3s ease-in';
            setTimeout(() => {
                if (progressState.element && progressState.element.parentElement) {
                    progressState.element.remove();
                }
            }, 300);
        }
        
        this.activeProgress?.delete(progressId);
    }
    
    /**
     * Update existing toast notification
     * 
     * @param {string} toastId - Toast identifier
     * @param {string} newMessage - New message
     * @param {Object} newOptions - New options
     */
    updateToast(toastId, newMessage, newOptions = {}) {
        const toast = this.activeToasts.get(toastId);
        
        if (!toast) {
            console.warn('Toast not found for update:', toastId);
            return;
        }
        
        // Update toast data
        toast.message = newMessage;
        toast.options = { ...toast.options, ...newOptions };
        
        // If using UserFeedbackSystem, we need to hide and show again
        // (most notification systems don't support in-place updates)
        this.hideToast(toastId);
        
        // Show updated toast
        setTimeout(() => {
            this.displayToast(toast);
        }, 100);
        
        console.log(`Toast updated: ${toastId} - ${newMessage}`);
    }

    /**
     * Main error handling method - routes errors to specific handlers
     * 
     * @param {Error} error - The error object
     * @param {Object} context - Context information about where the error occurred
     * @returns {Promise<Object>} Recovery result
     */
    async handleError(error, context = {}) {
        try {
            // Classify the error type
            const errorType = this.classifyError(error, context);
            
            // Log the error
            this.logError(error, errorType, context);
            
            // Route to specific error handler
            let recoveryResult;
            
            switch (errorType) {
                case this.errorTypes.NETWORK:
                    recoveryResult = await this.handleNetworkError(error, context);
                    break;
                case this.errorTypes.DATABASE:
                    recoveryResult = await this.handleDatabaseError(error, context);
                    break;
                case this.errorTypes.VALIDATION:
                    recoveryResult = await this.handleValidationError(error, context);
                    break;
                case this.errorTypes.CONFLICT:
                    recoveryResult = await this.handleConflictError(error, context);
                    break;
                case this.errorTypes.STORAGE:
                    recoveryResult = await this.handleStorageError(error, context);
                    break;
                default:
                    recoveryResult = await this.handleUnknownError(error, context);
            }
            
            return recoveryResult;
            
        } catch (recoveryError) {
            console.error('Error in error recovery:', recoveryError);
            return {
                success: false,
                error: recoveryError,
                fallbackApplied: false
            };
        }
    }
    
    /**
     * Handle network-related errors
     * 
     * @param {Error} error - Network error
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleNetworkError(error, context) {
        console.warn('Network error detected:', error.message);
        
        // Check if we're offline
        if (!navigator.onLine) {
            return await this.handleOfflineMode(context);
        }
        
        // For online network errors, try retry logic
        if (context.retryable !== false) {
            return await this.scheduleRetry(context);
        }
        
        // Show user notification
        this.showUserNotification(
            'Connection issue detected. Changes will be saved when connection is restored.',
            'warning'
        );
        
        return {
            success: false,
            error: error,
            fallbackApplied: true,
            action: 'queued_for_retry'
        };
    }
    
    /**
     * Handle database-related errors
     * 
     * @param {Error} error - Database error
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleDatabaseError(error, context) {
        console.error('Database error detected:', error.message);
        
        // Try to save to localStorage as fallback
        if (context.settings) {
            try {
                await this.persistenceManager.saveToLocalStorage(context.settings);
                
                this.showUserNotification(
                    'Database temporarily unavailable. Settings saved locally and will sync when available.',
                    'warning'
                );
                
                return {
                    success: true,
                    error: error,
                    fallbackApplied: true,
                    action: 'saved_to_localStorage'
                };
            } catch (localStorageError) {
                console.error('Failed to save to localStorage fallback:', localStorageError);
            }
        }
        
        // Schedule retry for later
        if (context.retryable !== false) {
            await this.scheduleRetry(context);
        }
        
        this.showUserNotification(
            'Unable to save settings. Please try again later.',
            'error'
        );
        
        return {
            success: false,
            error: error,
            fallbackApplied: false,
            action: 'retry_scheduled'
        };
    }
    
    /**
     * Handle validation errors
     * 
     * @param {Error} error - Validation error
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleValidationError(error, context) {
        console.warn('Validation error detected:', error.message);
        
        // Extract validation details
        const validationDetails = this.extractValidationDetails(error, context);
        
        // Show specific validation error to user
        this.showValidationError(validationDetails);
        
        // Try to recover with default values
        if (context.setting && context.defaultValue !== undefined) {
            try {
                await this.persistenceManager.saveSetting(
                    context.setting.key, 
                    context.defaultValue, 
                    true
                );
                
                this.showUserNotification(
                    `Invalid value for ${context.setting.key}. Reset to default.`,
                    'info'
                );
                
                return {
                    success: true,
                    error: error,
                    fallbackApplied: true,
                    action: 'reset_to_default'
                };
            } catch (resetError) {
                console.error('Failed to reset to default value:', resetError);
            }
        }
        
        return {
            success: false,
            error: error,
            fallbackApplied: false,
            action: 'user_correction_required'
        };
    }
    
    /**
     * Handle conflict resolution errors
     * 
     * @param {Error} error - Conflict error
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleConflictError(error, context) {
        console.warn('Conflict resolution error:', error.message);
        
        // Try to resolve conflicts manually
        if (context.conflictData) {
            try {
                // Use database as authoritative source
                const dbSettings = await this.persistenceManager.loadFromDatabase();
                
                if (dbSettings) {
                    // Update cache and localStorage with database values
                    this.persistenceManager.updateCacheFromSettings(dbSettings, 'database');
                    await this.persistenceManager.saveToLocalStorage(dbSettings);
                    
                    this.showUserNotification(
                        'Settings conflict resolved using server values.',
                        'info'
                    );
                    
                    return {
                        success: true,
                        error: error,
                        fallbackApplied: true,
                        action: 'database_values_applied'
                    };
                }
            } catch (resolutionError) {
                console.error('Failed to resolve conflict:', resolutionError);
            }
        }
        
        // Clear conflicting data and start fresh
        this.persistenceManager.clearCache();
        
        this.showUserNotification(
            'Settings conflict detected. Please refresh the page.',
            'warning'
        );
        
        return {
            success: false,
            error: error,
            fallbackApplied: true,
            action: 'cache_cleared'
        };
    }
    
    /**
     * Handle localStorage/storage errors
     * 
     * @param {Error} error - Storage error
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleStorageError(error, context) {
        console.warn('Storage error detected:', error.message);
        
        // Check if it's a quota exceeded error
        if (error.name === 'QuotaExceededError') {
            return await this.handleStorageQuotaExceeded(context);
        }
        
        // For other storage errors, try to continue without localStorage
        this.showUserNotification(
            'Local storage unavailable. Settings will only persist during this session.',
            'warning'
        );
        
        return {
            success: true,
            error: error,
            fallbackApplied: true,
            action: 'localStorage_disabled'
        };
    }
    
    /**
     * Handle unknown errors
     * 
     * @param {Error} error - Unknown error
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleUnknownError(error, context) {
        console.error('Unknown error detected:', error);
        
        // Log detailed error information for debugging
        this.logDetailedError(error, context);
        
        // Try generic recovery
        this.showUserNotification(
            'An unexpected error occurred. Please try again.',
            'error'
        );
        
        return {
            success: false,
            error: error,
            fallbackApplied: false,
            action: 'logged_for_debugging'
        };
    } 
   /**
     * Handle offline mode by queuing changes
     * 
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleOfflineMode(context) {
        console.log('Entering offline mode');
        
        // Queue the operation for when we're back online
        if (context.operation && context.data) {
            const queueId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            this.offlineQueue.set(queueId, {
                operation: context.operation,
                data: context.data,
                timestamp: Date.now(),
                attempts: 0
            });
            
            // Limit queue size
            if (this.offlineQueue.size > this.config.offlineQueueLimit) {
                const oldestKey = this.offlineQueue.keys().next().value;
                this.offlineQueue.delete(oldestKey);
            }
        }
        
        // Save to localStorage if possible
        if (context.settings) {
            try {
                await this.persistenceManager.saveToLocalStorage(context.settings);
            } catch (localError) {
                console.error('Failed to save to localStorage in offline mode:', localError);
            }
        }
        
        this.showUserNotification(
            'You are offline. Changes will be saved when connection is restored.',
            'info'
        );
        
        return {
            success: true,
            error: null,
            fallbackApplied: true,
            action: 'queued_for_online'
        };
    }
    
    /**
     * Handle storage quota exceeded
     * 
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     */
    async handleStorageQuotaExceeded(context) {
        console.warn('localStorage quota exceeded');
        
        // Try to clear old data
        try {
            // Clear error history to free up space
            this.errorHistory = this.errorHistory.slice(-10); // Keep only last 10 errors
            
            // Clear old cache entries
            const cacheStats = this.persistenceManager.getCacheStats();
            if (cacheStats.size > 50) {
                this.persistenceManager.clearCache();
            }
            
            // Try to save again with minimal data
            if (context.settings) {
                const essentialSettings = this.extractEssentialSettings(context.settings);
                await this.persistenceManager.saveToLocalStorage(essentialSettings);
                
                this.showUserNotification(
                    'Storage space low. Only essential settings saved locally.',
                    'warning'
                );
                
                return {
                    success: true,
                    error: null,
                    fallbackApplied: true,
                    action: 'essential_settings_saved'
                };
            }
        } catch (cleanupError) {
            console.error('Failed to cleanup storage:', cleanupError);
        }
        
        this.showUserNotification(
            'Storage space full. Settings will only persist during this session.',
            'warning'
        );
        
        return {
            success: false,
            error: new Error('Storage quota exceeded'),
            fallbackApplied: true,
            action: 'localStorage_disabled'
        };
    }
    
    /**
     * Schedule a retry for failed operations
     * 
     * @param {Object} context - Operation context
     * @returns {Promise<Object>} Retry result
     */
    async scheduleRetry(context) {
        const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentAttempts = context.attempts || 0;
        
        if (currentAttempts >= this.config.maxRetryAttempts) {
            console.warn('Max retry attempts reached for operation');
            return {
                success: false,
                error: new Error('Max retry attempts exceeded'),
                fallbackApplied: false,
                action: 'retry_limit_reached'
            };
        }
        
        // Calculate delay with exponential backoff
        const delay = this.config.retryDelayBase * Math.pow(2, currentAttempts);
        
        // Add to retry queue
        this.retryQueue.set(retryId, {
            ...context,
            attempts: currentAttempts + 1,
            scheduledFor: Date.now() + delay
        });
        
        // Schedule the retry
        setTimeout(async () => {
            await this.executeRetry(retryId);
        }, delay);
        
        console.log(`Retry scheduled for ${delay}ms (attempt ${currentAttempts + 1})`);
        
        return {
            success: true,
            error: null,
            fallbackApplied: true,
            action: 'retry_scheduled'
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
            console.warn('Retry context not found:', retryId);
            return;
        }
        
        try {
            console.log(`Executing retry ${retryId} (attempt ${retryContext.attempts})`);
            
            // Execute the original operation
            let result;
            
            switch (retryContext.operation) {
                case 'saveToDatabase':
                    result = await this.persistenceManager.saveToDatabase(retryContext.data);
                    break;
                case 'loadFromDatabase':
                    result = await this.persistenceManager.loadFromDatabase();
                    break;
                case 'syncWithDatabase':
                    result = await this.persistenceManager.syncWithDatabase();
                    break;
                default:
                    console.warn('Unknown retry operation:', retryContext.operation);
                    result = false;
            }
            
            if (result) {
                // Success - remove from retry queue
                this.retryQueue.delete(retryId);
                console.log(`Retry ${retryId} succeeded`);
                
                this.showUserNotification(
                    'Connection restored. Settings have been saved.',
                    'success'
                );
            } else {
                // Failed - schedule another retry if attempts remain
                if (retryContext.attempts < this.config.maxRetryAttempts) {
                    await this.scheduleRetry(retryContext);
                } else {
                    console.error(`Retry ${retryId} failed after max attempts`);
                    this.retryQueue.delete(retryId);
                }
            }
            
        } catch (retryError) {
            console.error(`Retry ${retryId} failed:`, retryError);
            
            // Handle the retry error
            await this.handleError(retryError, {
                ...retryContext,
                isRetry: true
            });
        }
    } 
   /**
     * Classify error type based on error object and context
     * 
     * @param {Error} error - The error object
     * @param {Object} context - Error context
     * @returns {string} Error type
     */
    classifyError(error, context) {
        // Network errors
        if (error.message.includes('network') || 
            error.message.includes('fetch') ||
            error.message.includes('AJAX') ||
            !navigator.onLine) {
            return this.errorTypes.NETWORK;
        }
        
        // Database errors
        if (error.message.includes('database') ||
            error.message.includes('SQL') ||
            context.operation === 'database') {
            return this.errorTypes.DATABASE;
        }
        
        // Validation errors
        if (error.message.includes('validation') ||
            error.message.includes('invalid') ||
            context.type === 'validation') {
            return this.errorTypes.VALIDATION;
        }
        
        // Conflict errors
        if (error.message.includes('conflict') ||
            context.type === 'conflict') {
            return this.errorTypes.CONFLICT;
        }
        
        // Storage errors
        if (error.name === 'QuotaExceededError' ||
            error.message.includes('localStorage') ||
            error.message.includes('storage')) {
            return this.errorTypes.STORAGE;
        }
        
        return this.errorTypes.UNKNOWN;
    }
    
    /**
     * Log error with context information
     * 
     * @param {Error} error - The error object
     * @param {string} errorType - Classified error type
     * @param {Object} context - Error context
     */
    logError(error, errorType, context) {
        const errorEntry = {
            timestamp: Date.now(),
            type: errorType,
            message: error.message,
            stack: error.stack,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Add to error history
        this.errorHistory.push(errorEntry);
        
        // Limit history size
        if (this.errorHistory.length > this.config.maxErrorHistory) {
            this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
        }
        
        // Console logging based on error type
        switch (errorType) {
            case this.errorTypes.NETWORK:
                console.warn('Network Error:', errorEntry);
                break;
            case this.errorTypes.DATABASE:
                console.error('Database Error:', errorEntry);
                break;
            case this.errorTypes.VALIDATION:
                console.warn('Validation Error:', errorEntry);
                break;
            default:
                console.error('Error:', errorEntry);
        }
    }
    
    /**
     * Show user notification using the enhanced feedback system
     * 
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, warning, error, info)
     * @param {Object} options - Additional notification options
     */
    showUserNotification(message, type = 'info', options = {}) {
        // Use the enhanced toast notification system
        switch (type) {
            case 'success':
                return this.showSuccessToast(message, options);
            case 'error':
                return this.showErrorToast(message, options);
            case 'warning':
                return this.showWarningToast(message, options);
            case 'info':
            default:
                return this.showInfoToast(message, options);
        }
    }
    
    /**
     * Extract validation details from error
     * 
     * @param {Error} error - Validation error
     * @param {Object} context - Error context
     * @returns {Object} Validation details
     */
    extractValidationDetails(error, context) {
        return {
            field: context.setting?.key || 'unknown',
            value: context.setting?.value,
            message: error.message,
            expectedType: context.setting?.type,
            constraints: context.setting?.constraints
        };
    }
    
    /**
     * Show validation error to user
     * 
     * @param {Object} validationDetails - Validation error details
     */
    showValidationError(validationDetails) {
        const message = `Invalid value for ${validationDetails.field}: ${validationDetails.message}`;
        this.showUserNotification(message, 'error');
    }
    
    /**
     * Extract essential settings to save when storage is limited
     * 
     * @param {Object} settings - Full settings object
     * @returns {Object} Essential settings only
     */
    extractEssentialSettings(settings) {
        const essential = {};
        const essentialKeys = [
            'admin_bar_background',
            'admin_bar_text_color',
            'menu_background',
            'menu_text_color'
        ];
        
        essentialKeys.forEach(key => {
            if (settings[key] !== undefined) {
                essential[key] = settings[key];
            }
        });
        
        return essential;
    }
    
    /**
     * Log detailed error information for debugging
     * 
     * @param {Error} error - The error object
     * @param {Object} context - Error context
     */
    logDetailedError(error, context) {
        const detailedLog = {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            localStorage: this.getLocalStorageInfo(),
            cacheStats: this.persistenceManager?.getCacheStats()
        };
        
        console.group('🔍 Detailed Error Log');
        console.error('Error Details:', detailedLog);
        console.groupEnd();
        
        // Send to external logging service if configured
        if (window.woowErrorLogging?.endpoint) {
            this.sendToExternalLogging(detailedLog);
        }
    }
    
    /**
     * Get localStorage information for debugging
     * 
     * @returns {Object} localStorage info
     */
    getLocalStorageInfo() {
        try {
            return {
                available: typeof Storage !== 'undefined',
                quotaUsed: JSON.stringify(localStorage).length,
                itemCount: localStorage.length
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }
    
    /**
     * Send error to external logging service
     * 
     * @param {Object} errorData - Error data to send
     */
    async sendToExternalLogging(errorData) {
        try {
            await fetch(window.woowErrorLogging.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorData)
            });
        } catch (loggingError) {
            console.warn('Failed to send error to external logging:', loggingError);
        }
    }
    
    /**
     * Handle unhandled errors
     * 
     * @param {Error} error - Unhandled error
     */
    handleUnhandledError(error) {
        // Only handle errors related to our persistence system
        if (error && (
            error.message.includes('woow') ||
            error.message.includes('settings') ||
            error.message.includes('persistence')
        )) {
            this.handleError(error, {
                type: 'unhandled',
                source: 'global_handler'
            });
        }
    }
    
    /**
     * Process offline queue when connection is restored
     */
    async processOfflineQueue() {
        if (this.offlineQueue.size === 0) {
            return;
        }
        
        console.log(`Processing ${this.offlineQueue.size} offline operations...`);
        
        const operations = Array.from(this.offlineQueue.entries());
        let successCount = 0;
        
        for (const [queueId, operation] of operations) {
            try {
                let result = false;
                
                switch (operation.operation) {
                    case 'saveToDatabase':
                        result = await this.persistenceManager.saveToDatabase(operation.data);
                        break;
                    case 'syncWithDatabase':
                        result = await this.persistenceManager.syncWithDatabase();
                        break;
                }
                
                if (result) {
                    this.offlineQueue.delete(queueId);
                    successCount++;
                }
                
            } catch (error) {
                console.error(`Failed to process offline operation ${queueId}:`, error);
            }
        }
        
        if (successCount > 0) {
            this.showUserNotification(
                `${successCount} offline changes have been saved.`,
                'success'
            );
        }
    }
    
    /**
     * Get error statistics for debugging
     * 
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorHistory.length,
            errorsByType: {},
            recentErrors: this.errorHistory.slice(-5),
            offlineQueueSize: this.offlineQueue.size,
            retryQueueSize: this.retryQueue.size
        };
        
        // Count errors by type
        this.errorHistory.forEach(error => {
            stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Clear error history
     */
    clearErrorHistory() {
        this.errorHistory = [];
        console.log('Error history cleared');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorRecoveryManager;
}

// Global instance for immediate use
window.ErrorRecoveryManager = ErrorRecoveryManager;