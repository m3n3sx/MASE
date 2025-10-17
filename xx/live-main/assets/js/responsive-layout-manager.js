/**
 * 📱 ResponsiveLayoutManager - Responsive Layout Management System
 * 
 * Advanced responsive layout system with:
 * - Breakpoint management for mobile/tablet/desktop
 * - Preview mode for different screen sizes
 * - Adaptive controls in micro-panels
 * - Responsive conflict detection
 * - Automatic layout adjustments
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 */

(function(window, document) {
    'use strict';

    /**
     * 📱 ResponsiveLayoutManager - Main Responsive Layout Class
     */
    class ResponsiveLayoutManager {
        constructor(options = {}) {
            this.options = {
                breakpoints: {
                    mobile: 768,
                    tablet: 1024,
                    desktop: 1200
                },
                previewSizes: {
                    mobile: { width: 375, height: 667 },
                    tablet: { width: 768, height: 1024 },
                    desktop: { width: 1200, height: 800 }
                },
                adaptiveControls: true,
                autoAdjust: true,
                previewMode: false,
                smoothTransitions: true,
                ...options
            };

            this.currentBreakpoint = 'desktop';
            this.previousBreakpoint = 'desktop';
            this.isPreviewMode = false;
            this.previewContainer = null;
            this.originalStyles = new Map();
            this.responsiveRules = new Map();
            this.adaptiveElements = new Set();
            
            this.layoutManager = window.layoutManagerInstance;
            this.conflictDetector = window.conflictDetectorInstance;
            this.debugMode = window.masV2Debug || false;
            
            this.init();
        }

        /**
         * 🚀 Initialize responsive layout manager
         */
        init() {
            this.detectCurrentBreakpoint();
            this.setupBreakpointObserver();
            this.createPreviewInterface();
            this.setupResponsiveRules();
            this.makeElementsAdaptive();
            this.setupEventListeners();
            
            this.log('ResponsiveLayoutManager initialized');
        }

        /**
         * 📏 Detect current breakpoint
         */
        detectCurrentBreakpoint() {
            const width = window.innerWidth;
            const breakpoints = this.options.breakpoints;
            
            if (width < breakpoints.mobile) {
                this.currentBreakpoint = 'mobile';
            } else if (width < breakpoints.tablet) {
                this.currentBreakpoint = 'tablet';
            } else {
                this.currentBreakpoint = 'desktop';
            }
            
            this.log(`Current breakpoint: ${this.currentBreakpoint} (${width}px)`);
        }

        /**
         * 👁️ Setup breakpoint observer
         */
        setupBreakpointObserver() {
            // Use ResizeObserver for better performance
            if (window.ResizeObserver) {
                this.resizeObserver = new ResizeObserver((entries) => {
                    this.handleViewportChange();
                });
                this.resizeObserver.observe(document.body);
            } else {
                // Fallback to window resize
                window.addEventListener('resize', () => {
                    this.handleViewportChange();
                });
            }
            
            // Also listen for orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleViewportChange();
                }, 100);
            });
        }

        /**
         * 🔄 Handle viewport changes
         */
        handleViewportChange() {
            this.previousBreakpoint = this.currentBreakpoint;
            this.detectCurrentBreakpoint();
            
            if (this.previousBreakpoint !== this.currentBreakpoint) {
                this.onBreakpointChange();
            }
            
            // Update adaptive elements
            this.updateAdaptiveElements();
            
            // Check for responsive conflicts
            if (this.conflictDetector) {
                this.conflictDetector.scheduleCheck();
            }
        }

        /**
         * 🎯 Handle breakpoint changes
         */
        onBreakpointChange() {
            this.log(`Breakpoint changed: ${this.previousBreakpoint} → ${this.currentBreakpoint}`);
            
            // Apply responsive rules
            this.applyResponsiveRules();
            
            // Update layout manager options
            this.updateLayoutManagerForBreakpoint();
            
            // Update micro-panel controls
            this.updateMicroPanelControls();
            
            // Trigger custom event
            this.triggerBreakpointEvent();
        }

        /**
         * 🎨 Create preview interface
         */
        createPreviewInterface() {
            // Create preview toolbar
            const toolbar = document.createElement('div');
            toolbar.className = 'woow-responsive-toolbar';
            toolbar.innerHTML = `
                <div class="woow-responsive-controls">
                    <button class="woow-preview-btn" data-size="mobile">📱 Mobile</button>
                    <button class="woow-preview-btn" data-size="tablet">📱 Tablet</button>
                    <button class="woow-preview-btn" data-size="desktop">🖥️ Desktop</button>
                    <button class="woow-preview-btn woow-exit-preview" style="display: none;">❌ Exit Preview</button>
                    <span class="woow-current-size"></span>
                </div>
            `;
            
            // Add styles
            this.addPreviewStyles();
            
            // Position toolbar
            toolbar.style.cssText = `
                position: fixed;
                top: 32px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10003;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            document.body.appendChild(toolbar);
            this.previewToolbar = toolbar;
            
            // Setup toolbar events
            this.setupPreviewEvents();
            
            // Update current size display
            this.updateSizeDisplay();
        }

        /**
         * 🎨 Add preview styles
         */
        addPreviewStyles() {
            const style = document.createElement('style');
            style.id = 'responsive-layout-styles';
            style.textContent = `
                .woow-responsive-toolbar {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 12px;
                }
                
                .woow-preview-btn {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 6px 12px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    transition: all 0.2s ease;
                }
                
                .woow-preview-btn:hover {
                    background: #e9ecef;
                    border-color: #adb5bd;
                }
                
                .woow-preview-btn.active {
                    background: #007cba;
                    color: white;
                    border-color: #007cba;
                }
                
                .woow-current-size {
                    color: #6c757d;
                    font-size: 11px;
                    margin-left: 10px;
                }
                
                .woow-preview-container {
                    position: fixed;
                    top: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 10002;
                    overflow: hidden;
                    transition: all 0.3s ease;
                }
                
                .woow-preview-frame {
                    width: 100%;
                    height: 100%;
                    border: none;
                    display: block;
                }
                
                .woow-preview-header {
                    background: #f8f9fa;
                    padding: 8px 12px;
                    border-bottom: 1px solid #dee2e6;
                    font-size: 11px;
                    color: #6c757d;
                    text-align: center;
                }
                
                /* Responsive adaptations */
                .woow-adaptive-mobile {
                    font-size: 14px !important;
                }
                
                .woow-adaptive-mobile .woow-drag-handle {
                    width: 24px !important;
                    height: 24px !important;
                }
                
                .woow-adaptive-tablet {
                    font-size: 15px !important;
                }
                
                .woow-adaptive-desktop {
                    font-size: 16px !important;
                }
                
                /* Micro-panel responsive styles */
                .woow-micro-panel.woow-mobile-mode {
                    position: fixed !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    top: auto !important;
                    width: 100% !important;
                    max-height: 50vh !important;
                    border-radius: 8px 8px 0 0 !important;
                }
                
                .woow-micro-panel.woow-tablet-mode {
                    max-width: 400px !important;
                }
                
                /* Hide elements on small screens */
                @media (max-width: 768px) {
                    .woow-hide-mobile {
                        display: none !important;
                    }
                }
                
                @media (max-width: 1024px) {
                    .woow-hide-tablet {
                        display: none !important;
                    }
                }
                
                /* Responsive grid adjustments */
                .woow-responsive-grid {
                    display: grid;
                    gap: 10px;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                
                @media (max-width: 768px) {
                    .woow-responsive-grid {
                        grid-template-columns: 1fr;
                        gap: 5px;
                    }
                }
                
                /* Responsive text scaling */
                .woow-responsive-text {
                    font-size: clamp(14px, 2.5vw, 18px);
                    line-height: 1.5;
                }
                
                /* Responsive spacing */
                .woow-responsive-spacing {
                    padding: clamp(10px, 2vw, 20px);
                    margin: clamp(5px, 1vw, 15px);
                }
            `;
            
            document.head.appendChild(style);
        }

        /**
         * 🎧 Setup preview events
         */
        setupPreviewEvents() {
            const buttons = this.previewToolbar.querySelectorAll('.woow-preview-btn');
            
            buttons.forEach(button => {
                button.addEventListener('click', (event) => {
                    const size = button.getAttribute('data-size');
                    
                    if (button.classList.contains('woow-exit-preview')) {
                        this.exitPreviewMode();
                    } else if (size) {
                        this.enterPreviewMode(size);
                    }
                });
            });
        }

        /**
         * 👁️ Enter preview mode
         */
        enterPreviewMode(size) {
            if (this.isPreviewMode) {
                this.exitPreviewMode();
            }
            
            this.isPreviewMode = true;
            const dimensions = this.options.previewSizes[size];
            
            // Create preview container
            this.previewContainer = document.createElement('div');
            this.previewContainer.className = 'woow-preview-container';
            this.previewContainer.style.width = dimensions.width + 'px';
            this.previewContainer.style.height = dimensions.height + 'px';
            
            // Add header
            const header = document.createElement('div');
            header.className = 'woow-preview-header';
            header.textContent = `${size.charAt(0).toUpperCase() + size.slice(1)} Preview (${dimensions.width}×${dimensions.height})`;
            this.previewContainer.appendChild(header);
            
            // Create iframe for isolated preview
            const iframe = document.createElement('iframe');
            iframe.className = 'woow-preview-frame';
            iframe.style.height = (dimensions.height - 30) + 'px'; // Account for header
            this.previewContainer.appendChild(iframe);
            
            document.body.appendChild(this.previewContainer);
            
            // Clone current page content into iframe
            this.setupPreviewContent(iframe, size);
            
            // Update toolbar
            this.updatePreviewToolbar(size);
            
            this.log(`Entered ${size} preview mode`);
        }

        /**
         * 📄 Setup preview content
         */
        setupPreviewContent(iframe, size) {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Clone current document
            const clonedHTML = document.documentElement.cloneNode(true);
            
            // Remove scripts to avoid conflicts
            const scripts = clonedHTML.querySelectorAll('script');
            scripts.forEach(script => script.remove());
            
            // Add responsive class to body
            const body = clonedHTML.querySelector('body');
            body.classList.add(`woow-preview-${size}`);
            
            // Write to iframe
            doc.open();
            doc.write('<!DOCTYPE html>' + clonedHTML.outerHTML);
            doc.close();
            
            // Apply size-specific styles
            this.applyPreviewStyles(doc, size);
        }

        /**
         * 🎨 Apply preview styles
         */
        applyPreviewStyles(doc, size) {
            const style = doc.createElement('style');
            style.textContent = `
                body {
                    margin: 0;
                    padding: 10px;
                    font-size: ${size === 'mobile' ? '14px' : size === 'tablet' ? '15px' : '16px'};
                }
                
                .woow-responsive-toolbar {
                    display: none !important;
                }
                
                .woow-preview-container {
                    display: none !important;
                }
                
                /* Size-specific adjustments */
                ${size === 'mobile' ? `
                    .woow-drag-handle {
                        width: 24px !important;
                        height: 24px !important;
                    }
                    
                    .woow-micro-panel {
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        width: 100% !important;
                        max-height: 50vh !important;
                    }
                ` : ''}
                
                ${size === 'tablet' ? `
                    .woow-micro-panel {
                        max-width: 400px !important;
                    }
                ` : ''}
            `;
            
            doc.head.appendChild(style);
        }

        /**
         * 🚪 Exit preview mode
         */
        exitPreviewMode() {
            if (!this.isPreviewMode) return;
            
            this.isPreviewMode = false;
            
            // Remove preview container
            if (this.previewContainer && this.previewContainer.parentNode) {
                this.previewContainer.parentNode.removeChild(this.previewContainer);
                this.previewContainer = null;
            }
            
            // Update toolbar
            this.updatePreviewToolbar(null);
            
            this.log('Exited preview mode');
        }

        /**
         * 🔄 Update preview toolbar
         */
        updatePreviewToolbar(activeSize) {
            const buttons = this.previewToolbar.querySelectorAll('.woow-preview-btn');
            const exitButton = this.previewToolbar.querySelector('.woow-exit-preview');
            
            buttons.forEach(button => {
                const size = button.getAttribute('data-size');
                if (size === activeSize) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
            
            if (activeSize) {
                exitButton.style.display = 'inline-block';
            } else {
                exitButton.style.display = 'none';
            }
        }

        /**
         * 📏 Update size display
         */
        updateSizeDisplay() {
            const sizeDisplay = this.previewToolbar.querySelector('.woow-current-size');
            const width = window.innerWidth;
            const height = window.innerHeight;
            sizeDisplay.textContent = `${width}×${height} (${this.currentBreakpoint})`;
        }

        /**
         * 📋 Setup responsive rules
         */
        setupResponsiveRules() {
            // Define responsive behavior rules
            this.responsiveRules.set('micro-panels', {
                mobile: {
                    position: 'fixed',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    width: '100%',
                    maxHeight: '50vh',
                    borderRadius: '8px 8px 0 0'
                },
                tablet: {
                    maxWidth: '400px',
                    position: 'absolute'
                },
                desktop: {
                    maxWidth: '300px',
                    position: 'absolute'
                }
            });
            
            this.responsiveRules.set('drag-handles', {
                mobile: {
                    width: '24px',
                    height: '24px',
                    fontSize: '14px'
                },
                tablet: {
                    width: '20px',
                    height: '20px',
                    fontSize: '12px'
                },
                desktop: {
                    width: '18px',
                    height: '18px',
                    fontSize: '11px'
                }
            });
            
            this.responsiveRules.set('grid-layout', {
                mobile: {
                    gridTemplateColumns: '1fr',
                    gap: '5px'
                },
                tablet: {
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px'
                },
                desktop: {
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px'
                }
            });
        }

        /**
         * 🎯 Apply responsive rules
         */
        applyResponsiveRules() {
            this.responsiveRules.forEach((rules, selector) => {
                const rule = rules[this.currentBreakpoint];
                if (!rule) return;
                
                let elements = [];
                
                switch (selector) {
                    case 'micro-panels':
                        elements = document.querySelectorAll('.woow-micro-panel, .mas-micro-panel');
                        break;
                    case 'drag-handles':
                        elements = document.querySelectorAll('.woow-drag-handle');
                        break;
                    case 'grid-layout':
                        elements = document.querySelectorAll('.woow-responsive-grid');
                        break;
                }
                
                elements.forEach(element => {
                    Object.entries(rule).forEach(([property, value]) => {
                        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
                        element.style.setProperty(cssProperty, value, 'important');
                    });
                    
                    // Add breakpoint class
                    element.classList.remove('woow-mobile-mode', 'woow-tablet-mode', 'woow-desktop-mode');
                    element.classList.add(`woow-${this.currentBreakpoint}-mode`);
                });
            });
        }

        /**
         * 🎨 Make elements adaptive
         */
        makeElementsAdaptive() {
            const selectors = [
                '.woow-draggable',
                '.mas-draggable',
                '.woow-micro-panel',
                '.mas-micro-panel',
                '.widget'
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    this.adaptiveElements.add(element);
                    this.makeElementAdaptive(element);
                });
            });
        }

        /**
         * 🎯 Make single element adaptive
         */
        makeElementAdaptive(element) {
            // Store original styles
            if (!this.originalStyles.has(element)) {
                const computedStyle = window.getComputedStyle(element);
                this.originalStyles.set(element, {
                    fontSize: computedStyle.fontSize,
                    padding: computedStyle.padding,
                    margin: computedStyle.margin,
                    width: computedStyle.width,
                    height: computedStyle.height
                });
            }
            
            // Add adaptive classes
            element.classList.add('woow-adaptive-element');
            element.classList.add(`woow-adaptive-${this.currentBreakpoint}`);
            
            // Apply responsive attributes
            this.applyResponsiveAttributes(element);
        }

        /**
         * 📱 Apply responsive attributes
         */
        applyResponsiveAttributes(element) {
            // Add data attributes for CSS targeting
            element.setAttribute('data-breakpoint', this.currentBreakpoint);
            element.setAttribute('data-viewport-width', window.innerWidth);
            
            // Apply size-specific classes
            element.classList.remove('woow-mobile-size', 'woow-tablet-size', 'woow-desktop-size');
            element.classList.add(`woow-${this.currentBreakpoint}-size`);
            
            // Handle touch-specific adaptations
            if (this.currentBreakpoint === 'mobile') {
                element.classList.add('woow-touch-optimized');
                
                // Increase touch targets
                if (this.isInteractiveElement(element)) {
                    const rect = element.getBoundingClientRect();
                    if (rect.width < 44 || rect.height < 44) {
                        element.style.minWidth = '44px';
                        element.style.minHeight = '44px';
                    }
                }
            } else {
                element.classList.remove('woow-touch-optimized');
            }
        }

        /**
         * 🔄 Update adaptive elements
         */
        updateAdaptiveElements() {
            this.adaptiveElements.forEach(element => {
                if (document.contains(element)) {
                    this.makeElementAdaptive(element);
                } else {
                    // Remove from set if element no longer exists
                    this.adaptiveElements.delete(element);
                    this.originalStyles.delete(element);
                }
            });
            
            // Update size display
            this.updateSizeDisplay();
        }

        /**
         * 🎛️ Update layout manager for breakpoint
         */
        updateLayoutManagerForBreakpoint() {
            if (!this.layoutManager) return;
            
            const breakpointOptions = {
                mobile: {
                    gridSize: 15,
                    snapThreshold: 20,
                    alignmentThreshold: 8
                },
                tablet: {
                    gridSize: 12,
                    snapThreshold: 18,
                    alignmentThreshold: 6
                },
                desktop: {
                    gridSize: 10,
                    snapThreshold: 15,
                    alignmentThreshold: 5
                }
            };
            
            const options = breakpointOptions[this.currentBreakpoint];
            if (options) {
                this.layoutManager.updateOptions(options);
            }
        }

        /**
         * 🎛️ Update micro-panel controls
         */
        updateMicroPanelControls() {
            const microPanels = document.querySelectorAll('.woow-micro-panel, .mas-micro-panel');
            
            microPanels.forEach(panel => {
                // Update positioning based on breakpoint
                if (this.currentBreakpoint === 'mobile') {
                    panel.classList.add('woow-mobile-mode');
                    panel.classList.remove('woow-tablet-mode', 'woow-desktop-mode');
                } else if (this.currentBreakpoint === 'tablet') {
                    panel.classList.add('woow-tablet-mode');
                    panel.classList.remove('woow-mobile-mode', 'woow-desktop-mode');
                } else {
                    panel.classList.add('woow-desktop-mode');
                    panel.classList.remove('woow-mobile-mode', 'woow-tablet-mode');
                }
                
                // Update control sizes
                const controls = panel.querySelectorAll('input, button, select');
                controls.forEach(control => {
                    if (this.currentBreakpoint === 'mobile') {
                        control.style.fontSize = '16px'; // Prevent zoom on iOS
                        control.style.minHeight = '44px';
                    } else {
                        control.style.fontSize = '';
                        control.style.minHeight = '';
                    }
                });
            });
        }

        /**
         * 🖱️ Check if element is interactive
         */
        isInteractiveElement(element) {
            const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
            return interactiveTags.includes(element.tagName) || 
                   element.tabIndex >= 0 || 
                   element.onclick !== null ||
                   element.classList.contains('woow-draggable') ||
                   element.classList.contains('mas-draggable');
        }

        /**
         * 🎧 Setup event listeners
         */
        setupEventListeners() {
            // Listen for layout changes
            document.addEventListener('woow:element-dropped', () => {
                this.updateAdaptiveElements();
            });
            
            // Listen for micro-panel events
            document.addEventListener('woow:micro-panel-opened', (event) => {
                if (event.detail && event.detail.panel) {
                    this.makeElementAdaptive(event.detail.panel);
                }
            });
            
            // Listen for dynamic element additions
            if (window.eventManagerInstance) {
                const originalRegister = window.eventManagerInstance.registerControlHandler;
                window.eventManagerInstance.registerControlHandler = (...args) => {
                    const result = originalRegister.apply(window.eventManagerInstance, args);
                    // Re-scan for adaptive elements
                    setTimeout(() => this.makeElementsAdaptive(), 100);
                    return result;
                };
            }
        }

        /**
         * 🎯 Trigger breakpoint event
         */
        triggerBreakpointEvent() {
            const event = new CustomEvent('woow:breakpoint-changed', {
                detail: {
                    current: this.currentBreakpoint,
                    previous: this.previousBreakpoint,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                },
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(event);
        }

        /**
         * 📊 Get responsive statistics
         */
        getStats() {
            return {
                currentBreakpoint: this.currentBreakpoint,
                previousBreakpoint: this.previousBreakpoint,
                isPreviewMode: this.isPreviewMode,
                adaptiveElements: this.adaptiveElements.size,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                breakpoints: this.options.breakpoints,
                responsiveRules: this.responsiveRules.size
            };
        }

        /**
         * ⚙️ Update options
         */
        updateOptions(newOptions) {
            this.options = { ...this.options, ...newOptions };
            
            // Update breakpoints if changed
            if (newOptions.breakpoints) {
                this.detectCurrentBreakpoint();
                this.onBreakpointChange();
            }
            
            this.log('Options updated:', newOptions);
        }

        /**
         * 🔄 Refresh responsive system
         */
        refresh() {
            this.detectCurrentBreakpoint();
            this.makeElementsAdaptive();
            this.applyResponsiveRules();
            this.updateSizeDisplay();
            
            this.log('ResponsiveLayoutManager refreshed');
        }

        /**
         * 🧹 Destroy responsive layout manager
         */
        destroy() {
            // Disconnect observers
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
            
            // Exit preview mode
            this.exitPreviewMode();
            
            // Remove toolbar
            if (this.previewToolbar && this.previewToolbar.parentNode) {
                this.previewToolbar.parentNode.removeChild(this.previewToolbar);
            }
            
            // Remove styles
            const styles = document.getElementById('responsive-layout-styles');
            if (styles && styles.parentNode) {
                styles.parentNode.removeChild(styles);
            }
            
            // Restore original styles
            this.originalStyles.forEach((styles, element) => {
                if (document.contains(element)) {
                    Object.entries(styles).forEach(([property, value]) => {
                        element.style[property] = value;
                    });
                }
            });
            
            // Clear collections
            this.adaptiveElements.clear();
            this.originalStyles.clear();
            this.responsiveRules.clear();
            
            this.log('ResponsiveLayoutManager destroyed');
        }

        /**
         * 📝 Logging utilities
         */
        log(message, data = null) {
            if (this.debugMode) {
                console.log(`📱 ResponsiveLayoutManager: ${message}`, data || '');
            }
        }

        logError(message, error = null) {
            console.error(`❌ ResponsiveLayoutManager: ${message}`, error);
        }
    }

    // Make ResponsiveLayoutManager globally available
    window.ResponsiveLayoutManager = ResponsiveLayoutManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.responsiveLayoutManagerInstance = new ResponsiveLayoutManager();
        });
    } else {
        window.responsiveLayoutManagerInstance = new ResponsiveLayoutManager();
    }

})(window, document);