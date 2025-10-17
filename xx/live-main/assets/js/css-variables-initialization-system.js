/**
 * CSS Variables Initialization System
 * 
 * Handles DOMContentLoaded initialization with early DOM ready detection,
 * critical path optimization, timing coordination, and graceful degradation.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @version 1.0.0
 * @author WOOW Admin Styler
 */

class CSSVariablesInitializationSystem {
    constructor() {
        // Timing and state tracking
        this.initStartTime = performance.now();
        this.domReadyTime = null;
        this.restorationCompleteTime = null;
        this.isInitialized = false;
        this.isDOMReady = false;
        this.isSlowLoading = false;
        
        // Configuration
        this.slowLoadingThreshold = 3000; // 3 seconds
        this.criticalPathTimeout = 100; // 100ms for critical path
        this.maxInitializationTime = 5000; // 5 seconds max
        this.retryInterval = 500; // 500ms retry interval
        
        // State management
        this.initializationState = {
            phase: 'waiting', // waiting, dom-ready, restoring, complete, failed
            attempts: 0,
            maxAttempts: 10,
            errors: [],
            warnings: [],
            timings: {}
        };
        
        // Debug mode detection
        this.isDebugMode = this.detectDebugMode();
        this.logs = [];
        
        // Start initialization process immediately
        this.startInitialization();
    }

    /**
     * Start the initialization process with early DOM ready detection
     * Requirements: 1.1, 1.2, 1.3
     */
    startInitialization() {
        this.log('Starting CSS variables initialization system');
        this.initializationState.phase = 'waiting';
        this.initializationState.timings.initStart = performance.now();
        
        // Early DOM ready detection with multiple strategies
        this.setupDOMReadyDetection();
        
        // Set up slow loading detection and graceful degradation
        this.setupSlowLoadingDetection();
        
        // Set up maximum initialization timeout
        this.setupMaxTimeoutProtection();
        
        // If DOM is already ready, initialize immediately
        if (this.isDOMAlreadyReady()) {
            this.log('DOM already ready, initializing immediately');
            this.handleDOMReady();
        }
    }

    /**
     * Set up multiple DOM ready detection strategies for early detection
     * Requirements: 1.1, 1.2
     */
    setupDOMReadyDetection() {
        this.log('Setting up DOM ready detection strategies');
        
        // Strategy 1: Standard DOMContentLoaded event
        if (document.addEventListener) {
            document.addEventListener('DOMContentLoaded', this.handleDOMReady, { once: true });
            this.log('Registered DOMContentLoaded listener');
        }
        
        // Strategy 2: readyState polling for early detection
        if (document.readyState !== 'loading') {
            // DOM is already ready
            setTimeout(this.handleDOMReady, 0);
        } else {
            // Poll readyState for early detection
            this.startReadyStatePolling();
        }
        
        // Strategy 3: Fallback with window.onload
        if (window.addEventListener) {
            window.addEventListener('load', () => {
                if (!this.isDOMReady) {
                    this.warn('Falling back to window.onload for DOM ready detection');
                    this.handleDOMReady();
                }
            }, { once: true });
        }
        
        // Strategy 4: Legacy IE support
        if (document.attachEvent) {
            document.attachEvent('onreadystatechange', () => {
                if (document.readyState === 'complete' && !this.isDOMReady) {
                    this.handleDOMReady();
                }
            });
        }
    }

    /**
     * Poll document.readyState for early DOM ready detection
     * Requirements: 1.1, 1.2
     */
    startReadyStatePolling() {
        const pollInterval = 10; // Poll every 10ms for early detection
        const maxPolls = 500; // Max 5 seconds of polling
        let pollCount = 0;
        
        const poll = () => {
            pollCount++;
            
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                this.log(`DOM ready detected via polling after ${pollCount * pollInterval}ms`);
                this.handleDOMReady();
                return;
            }
            
            if (pollCount < maxPolls && !this.isDOMReady) {
                setTimeout(poll, pollInterval);
            } else if (pollCount >= maxPolls) {
                this.warn('ReadyState polling timeout, waiting for DOMContentLoaded');
            }
        };
        
        setTimeout(poll, pollInterval);
    }

    /**
     * Check if DOM is already ready
     * Requirements: 1.1, 1.2
     */
    isDOMAlreadyReady() {
        return document.readyState === 'interactive' || 
               document.readyState === 'complete' ||
               document.body !== null;
    }

    /**
     * Set up slow loading detection for graceful degradation
     * Requirements: 1.3
     */
    setupSlowLoadingDetection() {
        this.slowLoadingTimer = setTimeout(() => {
            if (!this.isDOMReady) {
                this.handleSlowLoading();
            }
        }, this.slowLoadingThreshold);
    }

    /**
     * Set up maximum initialization timeout protection
     * Requirements: 1.3
     */
    setupMaxTimeoutProtection() {
        this.maxTimeoutTimer = setTimeout(() => {
            if (!this.isInitialized) {
                this.warn('Maximum initialization time exceeded, forcing initialization');
                this.initializationState.phase = 'failed';
                this.initializationState.errors.push('Maximum initialization timeout');
                this.forceInitialization();
            }
        }, this.maxInitializationTime);
    }

    /**
     * Handle DOM ready event with critical path optimization
     * Requirements: 1.1, 1.2, 1.3
     */
    handleDOMReady() {
        if (this.isDOMReady) {
            this.log('DOM ready already handled, skipping');
            return;
        }
        
        this.isDOMReady = true;
        this.domReadyTime = performance.now();
        this.initializationState.phase = 'dom-ready';
        this.initializationState.timings.domReady = this.domReadyTime;
        
        // Clear slow loading timer since DOM is ready
        if (this.slowLoadingTimer) {
            clearTimeout(this.slowLoadingTimer);
            this.slowLoadingTimer = null;
        }
        
        const domReadyDuration = this.domReadyTime - this.initStartTime;
        this.log(`DOM ready detected in ${domReadyDuration.toFixed(2)}ms`);
        
        // Critical path optimization - initialize immediately
        this.initializeCriticalPath();
    }

    /**
     * Initialize critical path with timing optimization
     * Requirements: 1.1, 1.2, 1.3
     */
    initializeCriticalPath() {
        this.log('Starting critical path initialization');
        this.initializationState.phase = 'restoring';
        this.initializationState.timings.criticalPathStart = performance.now();
        
        // Use requestAnimationFrame for optimal timing
        requestAnimationFrame(() => {
            this.performCriticalPathInitialization();
        });
    }

    /**
     * Perform the actual critical path initialization
     * Requirements: 1.1, 1.2, 1.3
     */
    async performCriticalPathInitialization() {
        try {
            this.initializationState.attempts++;
            
            // Check if CSS Variables Restorer is available
            if (!this.isCSSVariablesRestorerAvailable()) {
                this.warn('CSS Variables Restorer not available, attempting retry');
                this.scheduleRetry();
                return;
            }
            
            // Initialize the CSS Variables Restorer
            await this.initializeCSSVariablesRestorer();
            
            // Mark initialization as complete
            this.markInitializationComplete();
            
        } catch (error) {
            this.handleInitializationError(error);
        }
    }

    /**
     * Check if CSS Variables Restorer is available
     * Requirements: 1.1, 1.2
     */
    isCSSVariablesRestorerAvailable() {
        return window.CSSVariablesRestorer || 
               window.cssVariablesRestorer ||
               (typeof CSSVariablesRestorer !== 'undefined');
    }

    /**
     * Initialize the CSS Variables Restorer
     * Requirements: 1.1, 1.2, 1.3
     */
    async initializeCSSVariablesRestorer() {
        this.log('Initializing CSS Variables Restorer');
        
        let restorer = null;
        
        // Try to get existing instance or create new one
        if (window.cssVariablesRestorer) {
            restorer = window.cssVariablesRestorer;
        } else if (window.CSSVariablesRestorer) {
            restorer = new window.CSSVariablesRestorer();
            window.cssVariablesRestorer = restorer;
        } else if (typeof CSSVariablesRestorer !== 'undefined') {
            restorer = new CSSVariablesRestorer();
            window.cssVariablesRestorer = restorer;
        } else {
            throw new Error('CSS Variables Restorer class not found');
        }
        
        // Initialize with timing coordination
        const restorationStart = performance.now();
        await restorer.initialize();
        const restorationEnd = performance.now();
        
        this.initializationState.timings.restoration = restorationEnd - restorationStart;
        this.log(`CSS Variables restoration completed in ${(restorationEnd - restorationStart).toFixed(2)}ms`);
        
        return restorer;
    }

    /**
     * Handle slow loading pages with graceful degradation
     * Requirements: 1.3
     */
    handleSlowLoading() {
        this.isSlowLoading = true;
        this.initializationState.warnings.push('Slow loading page detected');
        this.warn(`Slow loading detected after ${this.slowLoadingThreshold}ms`);
        
        // Apply immediate fallback strategies
        this.applySlowLoadingFallbacks();
        
        // Continue waiting for DOM ready but with degraded experience
        this.log('Continuing to wait for DOM ready with degraded experience');
    }

    /**
     * Apply fallback strategies for slow loading pages
     * Requirements: 1.3
     */
    applySlowLoadingFallbacks() {
        this.log('Applying slow loading fallbacks');
        
        try {
            // Try to apply cached CSS variables immediately if possible
            if (typeof localStorage !== 'undefined' && localStorage.getItem('woow_css_variables')) {
                this.applyCachedVariablesDirectly();
            }
            
            // Set up more aggressive DOM polling
            this.startAggressiveDOMPolling();
            
        } catch (error) {
            this.warn('Failed to apply slow loading fallbacks', error);
        }
    }

    /**
     * Apply cached CSS variables directly for slow loading pages
     * Requirements: 1.3
     */
    applyCachedVariablesDirectly() {
        try {
            if (typeof localStorage === 'undefined') {
                this.warn('localStorage not available for cached variables');
                return;
            }
            
            const cached = JSON.parse(localStorage.getItem('woow_css_variables'));
            if (cached && cached.variables) {
                const documentStyle = document.documentElement.style;
                let appliedCount = 0;
                
                for (const [cssVar, value] of Object.entries(cached.variables)) {
                    documentStyle.setProperty(cssVar, value);
                    appliedCount++;
                }
                
                this.log(`Applied ${appliedCount} cached variables directly for slow loading`);
            }
        } catch (error) {
            this.warn('Failed to apply cached variables directly', error);
        }
    }

    /**
     * Start aggressive DOM polling for slow loading pages
     * Requirements: 1.3
     */
    startAggressiveDOMPolling() {
        const aggressivePollInterval = 50; // Poll every 50ms
        const maxAggressivePolls = 100; // Max 5 seconds
        let pollCount = 0;
        
        const aggressivePoll = () => {
            pollCount++;
            
            if (this.isDOMAlreadyReady() && !this.isDOMReady) {
                this.log(`Aggressive polling detected DOM ready after ${pollCount * aggressivePollInterval}ms`);
                this.handleDOMReady();
                return;
            }
            
            if (pollCount < maxAggressivePolls && !this.isDOMReady) {
                setTimeout(aggressivePoll, aggressivePollInterval);
            }
        };
        
        setTimeout(aggressivePoll, aggressivePollInterval);
    }

    /**
     * Handle initialization errors with retry logic
     * Requirements: 1.3
     */
    handleInitializationError(error) {
        this.initializationState.errors.push(error.message || error.toString());
        this.warn('Initialization error occurred', error);
        
        if (this.initializationState.attempts < this.initializationState.maxAttempts) {
            this.warn(`Initialization failed, scheduling retry (attempt ${this.initializationState.attempts}/${this.initializationState.maxAttempts})`);
            this.scheduleRetry();
        } else {
            this.warn('Maximum initialization attempts reached, forcing fallback');
            this.forceInitialization();
        }
    }

    /**
     * Schedule retry for failed initialization
     * Requirements: 1.3
     */
    scheduleRetry() {
        const retryDelay = this.retryInterval * this.initializationState.attempts; // Exponential backoff
        
        setTimeout(() => {
            if (!this.isInitialized) {
                this.log(`Retrying initialization (attempt ${this.initializationState.attempts + 1})`);
                this.performCriticalPathInitialization();
            }
        }, retryDelay);
    }

    /**
     * Force initialization as last resort
     * Requirements: 1.3
     */
    forceInitialization() {
        this.warn('Forcing initialization as last resort');
        this.initializationState.phase = 'forced';
        
        try {
            // Apply default CSS variables directly
            this.applyDefaultVariablesDirectly();
            this.markInitializationComplete();
        } catch (error) {
            this.warn('Forced initialization also failed', error);
            this.initializationState.phase = 'failed';
        }
    }

    /**
     * Apply default CSS variables directly
     * Requirements: 1.3
     */
    applyDefaultVariablesDirectly() {
        const defaultVariables = {
            '--woow-surface-bar': '#23282d',
            '--woow-surface-menu': '#ffffff',
            '--woow-surface-content': '#ffffff',
            '--woow-text-primary': '#1d2327',
            '--woow-text-secondary': '#646970',
            '--woow-accent-primary': '#2271b1',
            '--woow-accent-secondary': '#72aee6',
            '--woow-border-color': '#c3c4c7',
            '--woow-border-radius': '4px',
            '--woow-font-family-base': 'system-ui, -apple-system, sans-serif',
            '--woow-font-size-base': '14px',
            '--woow-line-height-base': '1.4',
            '--woow-spacing-xs': '4px',
            '--woow-spacing-sm': '8px',
            '--woow-spacing-md': '16px',
            '--woow-spacing-lg': '24px',
            '--woow-spacing-xl': '32px'
        };
        
        const documentStyle = document.documentElement.style;
        let appliedCount = 0;
        
        for (const [cssVar, value] of Object.entries(defaultVariables)) {
            documentStyle.setProperty(cssVar, value);
            appliedCount++;
        }
        
        this.log(`Applied ${appliedCount} default variables directly`);
    }

    /**
     * Mark initialization as complete
     * Requirements: 1.1, 1.2, 1.3
     */
    markInitializationComplete() {
        if (this.isInitialized) {
            return; // Already marked complete
        }
        
        this.isInitialized = true;
        this.restorationCompleteTime = performance.now();
        this.initializationState.phase = 'complete';
        this.initializationState.timings.complete = this.restorationCompleteTime;
        
        // Clear any remaining timers
        this.clearTimers();
        
        // Calculate total initialization time
        const totalTime = this.restorationCompleteTime - this.initStartTime;
        this.initializationState.timings.total = totalTime;
        
        this.log(`Initialization system complete in ${totalTime.toFixed(2)}ms`);
        
        // Generate report if in debug mode
        if (this.isDebugMode) {
            this.generateInitializationReport();
        }
        
        // Dispatch custom event for external monitoring
        this.dispatchInitializationCompleteEvent();
    }

    /**
     * Clear all timers
     */
    clearTimers() {
        if (this.slowLoadingTimer) {
            clearTimeout(this.slowLoadingTimer);
            this.slowLoadingTimer = null;
        }
        
        if (this.maxTimeoutTimer) {
            clearTimeout(this.maxTimeoutTimer);
            this.maxTimeoutTimer = null;
        }
    }

    /**
     * Dispatch initialization complete event
     * Requirements: 1.1, 1.2, 1.3
     */
    dispatchInitializationCompleteEvent() {
        try {
            const event = new CustomEvent('woowCSSVariablesInitialized', {
                detail: {
                    state: this.initializationState,
                    timings: this.initializationState.timings,
                    isSlowLoading: this.isSlowLoading
                }
            });
            
            document.dispatchEvent(event);
            this.log('Dispatched initialization complete event');
            
        } catch (error) {
            this.warn('Failed to dispatch initialization event', error);
        }
    }

    /**
     * Generate comprehensive initialization report
     */
    generateInitializationReport() {
        const report = {
            phase: this.initializationState.phase,
            totalTime: this.initializationState.timings.total?.toFixed(2) + 'ms',
            domReadyTime: this.domReadyTime ? (this.domReadyTime - this.initStartTime).toFixed(2) + 'ms' : 'N/A',
            restorationTime: this.initializationState.timings.restoration?.toFixed(2) + 'ms' || 'N/A',
            attempts: this.initializationState.attempts,
            isSlowLoading: this.isSlowLoading,
            errors: this.initializationState.errors,
            warnings: this.initializationState.warnings,
            timings: this.initializationState.timings,
            logs: this.logs
        };
        
        console.group('🚀 CSS Variables Initialization Report');
        console.table(this.logs);
        console.log('Initialization Report:', report);
        console.groupEnd();
        
        return report;
    }

    /**
     * Get current initialization state
     */
    getInitializationState() {
        return { ...this.initializationState };
    }

    /**
     * Detect debug mode
     */
    detectDebugMode() {
        try {
            return (window.location && window.location.search.includes('woow_debug=1')) || 
                   (typeof localStorage !== 'undefined' && localStorage.getItem('woow_debug') === '1') ||
                   window.woowDebugMode === true;
        } catch (error) {
            // Fallback for environments without localStorage or window.location
            return false;
        }
    }

    /**
     * Debug logging
     */
    log(message, data = null) {
        const timestamp = (performance.now() - this.initStartTime).toFixed(2) + 'ms';
        const logEntry = {
            timestamp,
            message,
            data,
            level: 'info'
        };
        
        this.logs.push(logEntry);
        
        if (this.isDebugMode) {
            console.log(`[WOOW Init ${timestamp}] ${message}`, data || '');
        }
    }

    /**
     * Debug warning
     */
    warn(message, error = null) {
        const timestamp = (performance.now() - this.initStartTime).toFixed(2) + 'ms';
        const logEntry = {
            timestamp,
            message,
            error: error?.message || error,
            level: 'warn'
        };
        
        this.logs.push(logEntry);
        this.initializationState.warnings.push(message);
        
        if (this.isDebugMode) {
            console.warn(`[WOOW Init ${timestamp}] ${message}`, error || '');
        }
    }
}

// Auto-initialize the initialization system
if (typeof window !== 'undefined') {
    // Create global instance
    window.cssVariablesInitializationSystem = new CSSVariablesInitializationSystem();
    
    // Install debugging utilities
    window.woowInitDebug = {
        getInitializationState: () => {
            return window.cssVariablesInitializationSystem?.getInitializationState();
        },
        
        getInitializationReport: () => {
            return window.cssVariablesInitializationSystem?.generateInitializationReport();
        },
        
        forceInitialization: () => {
            if (window.cssVariablesInitializationSystem && !window.cssVariablesInitializationSystem.isInitialized) {
                window.cssVariablesInitializationSystem.forceInitialization();
                console.log('Forced initialization triggered');
            } else {
                console.log('Initialization already complete or system not available');
            }
        }
    };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesInitializationSystem;
}