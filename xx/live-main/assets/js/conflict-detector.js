/**
 * 🔍 ConflictDetector - Layout Conflict Detection System
 * 
 * Advanced conflict detection system with:
 * - Overlapping elements detection
 * - Visual indicators for problematic layouts
 * - Auto-fix suggestions for common problems
 * - Performance optimized collision detection
 * - Accessibility conflict detection
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 */

(function(window, document) {
    'use strict';

    /**
     * 🔍 ConflictDetector - Main Conflict Detection Class
     */
    class ConflictDetector {
        constructor(options = {}) {
            this.options = {
                overlapThreshold: 5, // pixels
                zIndexConflictThreshold: 10,
                accessibilityCheck: true,
                performanceMode: false,
                autoFix: false,
                visualIndicators: true,
                checkInterval: 1000, // ms
                ...options
            };

            this.conflicts = new Map();
            this.conflictElements = new Set();
            this.observers = new Map();
            this.checkTimer = null;
            this.isChecking = false;
            
            this.debugMode = window.masV2Debug || false;
            this.layoutManager = window.layoutManagerInstance;
            
            this.init();
        }

        /**
         * 🚀 Initialize conflict detector
         */
        init() {
            this.setupObservers();
            this.createIndicatorStyles();
            this.startPeriodicChecks();
            
            // Listen for layout changes
            document.addEventListener('woow:element-dropped', () => {
                this.scheduleCheck();
            });
            
            // Listen for window resize
            window.addEventListener('resize', () => {
                this.scheduleCheck();
            });
            
            this.log('ConflictDetector initialized');
        }

        /**
         * 👁️ Setup mutation observers
         */
        setupObservers() {
            // Observe DOM changes
            const domObserver = new MutationObserver((mutations) => {
                let shouldCheck = false;
                
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || 
                        mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || 
                         mutation.attributeName === 'class')) {
                        shouldCheck = true;
                    }
                });
                
                if (shouldCheck) {
                    this.scheduleCheck();
                }
            });
            
            domObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            
            this.observers.set('dom', domObserver);
        }

        /**
         * 🎨 Create indicator styles
         */
        createIndicatorStyles() {
            if (!this.options.visualIndicators) return;
            
            const style = document.createElement('style');
            style.id = 'conflict-detector-styles';
            style.textContent = `
                .woow-conflict-overlay {
                    position: absolute;
                    pointer-events: none;
                    z-index: 10000;
                    border: 2px solid #ff4444;
                    background: rgba(255, 68, 68, 0.1);
                    border-radius: 4px;
                    animation: woow-conflict-pulse 2s infinite;
                }
                
                .woow-conflict-warning {
                    position: relative;
                }
                
                .woow-conflict-warning::before {
                    content: '⚠️';
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: #ff4444;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    z-index: 10001;
                    animation: woow-warning-bounce 1s infinite;
                }
                
                .woow-conflict-suggestion {
                    position: fixed;
                    top: 50px;
                    right: 20px;
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 4px;
                    padding: 15px;
                    max-width: 300px;
                    z-index: 10002;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                .woow-conflict-suggestion h4 {
                    margin: 0 0 10px 0;
                    color: #856404;
                    font-size: 14px;
                }
                
                .woow-conflict-suggestion p {
                    margin: 0 0 10px 0;
                    font-size: 12px;
                    color: #856404;
                }
                
                .woow-conflict-suggestion button {
                    background: #007cba;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    margin-right: 5px;
                }
                
                .woow-conflict-suggestion button:hover {
                    background: #005a87;
                }
                
                .woow-conflict-suggestion .close {
                    position: absolute;
                    top: 5px;
                    right: 8px;
                    background: none;
                    color: #856404;
                    font-size: 16px;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                }
                
                @keyframes woow-conflict-pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.7; }
                }
                
                @keyframes woow-warning-bounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
                
                .woow-accessibility-issue {
                    outline: 3px dashed #ff6b35 !important;
                    outline-offset: 2px;
                }
                
                .woow-zindex-conflict {
                    box-shadow: 0 0 0 2px #9b59b6 !important;
                }
            `;
            
            document.head.appendChild(style);
        }

        /**
         * ⏰ Start periodic conflict checks
         */
        startPeriodicChecks() {
            if (this.checkTimer) {
                clearInterval(this.checkTimer);
            }
            
            this.checkTimer = setInterval(() => {
                if (!this.isChecking) {
                    this.checkForConflicts();
                }
            }, this.options.checkInterval);
        }

        /**
         * 📅 Schedule a conflict check
         */
        scheduleCheck() {
            // Debounce rapid changes
            if (this.scheduleTimer) {
                clearTimeout(this.scheduleTimer);
            }
            
            this.scheduleTimer = setTimeout(() => {
                this.checkForConflicts();
            }, 100);
        }

        /**
         * 🔍 Main conflict detection method
         */
        async checkForConflicts() {
            if (this.isChecking) return;
            
            this.isChecking = true;
            this.clearPreviousConflicts();
            
            try {
                const elements = this.getElementsToCheck();
                const conflicts = [];
                
                // Check for overlapping elements
                const overlapConflicts = await this.checkOverlappingElements(elements);
                conflicts.push(...overlapConflicts);
                
                // Check for z-index conflicts
                const zIndexConflicts = await this.checkZIndexConflicts(elements);
                conflicts.push(...zIndexConflicts);
                
                // Check for accessibility issues
                if (this.options.accessibilityCheck) {
                    const a11yConflicts = await this.checkAccessibilityConflicts(elements);
                    conflicts.push(...a11yConflicts);
                }
                
                // Check for responsive issues
                const responsiveConflicts = await this.checkResponsiveConflicts(elements);
                conflicts.push(...responsiveConflicts);
                
                // Process conflicts
                this.processConflicts(conflicts);
                
                this.log(`Conflict check completed. Found ${conflicts.length} conflicts.`);
                
            } catch (error) {
                this.logError('Error during conflict check:', error);
            } finally {
                this.isChecking = false;
            }
        }

        /**
         * 📋 Get elements to check for conflicts
         */
        getElementsToCheck() {
            const selectors = [
                '.woow-draggable',
                '.mas-draggable',
                '.widget',
                '#adminmenu li',
                '.woow-micro-panel',
                '.mas-micro-panel'
            ];
            
            const elements = [];
            selectors.forEach(selector => {
                elements.push(...document.querySelectorAll(selector));
            });
            
            return elements.filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
        }

        /**
         * 🔄 Check for overlapping elements
         */
        async checkOverlappingElements(elements) {
            const conflicts = [];
            const threshold = this.options.overlapThreshold;
            
            for (let i = 0; i < elements.length; i++) {
                for (let j = i + 1; j < elements.length; j++) {
                    const element1 = elements[i];
                    const element2 = elements[j];
                    
                    // Skip if elements are parent/child
                    if (element1.contains(element2) || element2.contains(element1)) {
                        continue;
                    }
                    
                    const rect1 = element1.getBoundingClientRect();
                    const rect2 = element2.getBoundingClientRect();
                    
                    const overlap = this.calculateOverlap(rect1, rect2);
                    
                    if (overlap.area > threshold) {
                        conflicts.push({
                            type: 'overlap',
                            severity: this.calculateOverlapSeverity(overlap, rect1, rect2),
                            elements: [element1, element2],
                            details: {
                                overlapArea: overlap.area,
                                overlapPercentage: overlap.percentage,
                                rect1: rect1,
                                rect2: rect2
                            },
                            suggestions: this.generateOverlapSuggestions(element1, element2, overlap)
                        });
                    }
                }
            }
            
            return conflicts;
        }

        /**
         * 📐 Calculate overlap between two rectangles
         */
        calculateOverlap(rect1, rect2) {
            const left = Math.max(rect1.left, rect2.left);
            const right = Math.min(rect1.right, rect2.right);
            const top = Math.max(rect1.top, rect2.top);
            const bottom = Math.min(rect1.bottom, rect2.bottom);
            
            if (left < right && top < bottom) {
                const area = (right - left) * (bottom - top);
                const area1 = rect1.width * rect1.height;
                const area2 = rect2.width * rect2.height;
                const percentage = (area / Math.min(area1, area2)) * 100;
                
                return { area, percentage, left, right, top, bottom };
            }
            
            return { area: 0, percentage: 0 };
        }

        /**
         * 📊 Calculate overlap severity
         */
        calculateOverlapSeverity(overlap, rect1, rect2) {
            if (overlap.percentage > 50) return 'critical';
            if (overlap.percentage > 25) return 'high';
            if (overlap.percentage > 10) return 'medium';
            return 'low';
        }

        /**
         * 🎯 Check for z-index conflicts
         */
        async checkZIndexConflicts(elements) {
            const conflicts = [];
            const zIndexMap = new Map();
            
            elements.forEach(element => {
                const style = window.getComputedStyle(element);
                const zIndex = parseInt(style.zIndex) || 0;
                const position = style.position;
                
                if (position !== 'static') {
                    if (!zIndexMap.has(zIndex)) {
                        zIndexMap.set(zIndex, []);
                    }
                    zIndexMap.get(zIndex).push(element);
                }
            });
            
            // Check for elements with same z-index that might conflict
            zIndexMap.forEach((elementsAtLevel, zIndex) => {
                if (elementsAtLevel.length > 1) {
                    for (let i = 0; i < elementsAtLevel.length; i++) {
                        for (let j = i + 1; j < elementsAtLevel.length; j++) {
                            const element1 = elementsAtLevel[i];
                            const element2 = elementsAtLevel[j];
                            
                            const rect1 = element1.getBoundingClientRect();
                            const rect2 = element2.getBoundingClientRect();
                            
                            if (this.calculateOverlap(rect1, rect2).area > 0) {
                                conflicts.push({
                                    type: 'zindex',
                                    severity: 'medium',
                                    elements: [element1, element2],
                                    details: {
                                        zIndex: zIndex,
                                        message: 'Elements with same z-index are overlapping'
                                    },
                                    suggestions: this.generateZIndexSuggestions(element1, element2, zIndex)
                                });
                            }
                        }
                    }
                }
            });
            
            return conflicts;
        }

        /**
         * ♿ Check for accessibility conflicts
         */
        async checkAccessibilityConflicts(elements) {
            const conflicts = [];
            
            elements.forEach(element => {
                const issues = [];
                
                // Check for missing alt text on images
                if (element.tagName === 'IMG' && !element.alt) {
                    issues.push('Missing alt text');
                }
                
                // Check for insufficient color contrast
                const style = window.getComputedStyle(element);
                const contrast = this.calculateColorContrast(style.color, style.backgroundColor);
                if (contrast < 4.5) {
                    issues.push('Insufficient color contrast');
                }
                
                // Check for missing focus indicators
                if (element.tabIndex >= 0 && !this.hasFocusIndicator(element)) {
                    issues.push('Missing focus indicator');
                }
                
                // Check for overlapping interactive elements
                if (this.isInteractiveElement(element)) {
                    const rect = element.getBoundingClientRect();
                    if (rect.width < 44 || rect.height < 44) {
                        issues.push('Touch target too small (minimum 44px)');
                    }
                }
                
                if (issues.length > 0) {
                    conflicts.push({
                        type: 'accessibility',
                        severity: 'high',
                        elements: [element],
                        details: {
                            issues: issues
                        },
                        suggestions: this.generateAccessibilitySuggestions(element, issues)
                    });
                }
            });
            
            return conflicts;
        }

        /**
         * 📱 Check for responsive conflicts
         */
        async checkResponsiveConflicts(elements) {
            const conflicts = [];
            const viewportWidth = window.innerWidth;
            
            elements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const issues = [];
                
                // Check if element extends beyond viewport
                if (rect.right > viewportWidth) {
                    issues.push('Element extends beyond viewport width');
                }
                
                // Check for fixed positioning on mobile
                if (viewportWidth < 768) {
                    const style = window.getComputedStyle(element);
                    if (style.position === 'fixed' && rect.width > viewportWidth * 0.9) {
                        issues.push('Fixed element too wide for mobile');
                    }
                }
                
                // Check for horizontal scrolling
                if (document.body.scrollWidth > viewportWidth) {
                    issues.push('Page causes horizontal scrolling');
                }
                
                if (issues.length > 0) {
                    conflicts.push({
                        type: 'responsive',
                        severity: 'medium',
                        elements: [element],
                        details: {
                            issues: issues,
                            viewportWidth: viewportWidth
                        },
                        suggestions: this.generateResponsiveSuggestions(element, issues)
                    });
                }
            });
            
            return conflicts;
        }

        /**
         * 🎨 Calculate color contrast ratio
         */
        calculateColorContrast(color1, color2) {
            // Simplified contrast calculation
            // In a real implementation, you'd convert colors to RGB and calculate proper contrast
            const rgb1 = this.parseColor(color1);
            const rgb2 = this.parseColor(color2);
            
            if (!rgb1 || !rgb2) return 7; // Assume good contrast if can't parse
            
            const l1 = this.getLuminance(rgb1);
            const l2 = this.getLuminance(rgb2);
            
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            
            return (lighter + 0.05) / (darker + 0.05);
        }

        /**
         * 🎨 Parse color string to RGB
         */
        parseColor(color) {
            // Simple RGB parsing - would need more robust implementation
            const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                return {
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3])
                };
            }
            return null;
        }

        /**
         * 💡 Get luminance of RGB color
         */
        getLuminance(rgb) {
            const { r, g, b } = rgb;
            const [rs, gs, bs] = [r, g, b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        }

        /**
         * 👁️ Check if element has focus indicator
         */
        hasFocusIndicator(element) {
            const style = window.getComputedStyle(element, ':focus');
            return style.outline !== 'none' || style.boxShadow !== 'none';
        }

        /**
         * 🖱️ Check if element is interactive
         */
        isInteractiveElement(element) {
            const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
            return interactiveTags.includes(element.tagName) || 
                   element.tabIndex >= 0 || 
                   element.onclick !== null;
        }

        /**
         * 🔧 Process detected conflicts
         */
        processConflicts(conflicts) {
            this.conflicts.clear();
            this.conflictElements.clear();
            
            conflicts.forEach((conflict, index) => {
                this.conflicts.set(index, conflict);
                conflict.elements.forEach(element => {
                    this.conflictElements.add(element);
                });
                
                if (this.options.visualIndicators) {
                    this.showConflictIndicator(conflict);
                }
                
                if (this.options.autoFix && conflict.suggestions.length > 0) {
                    this.attemptAutoFix(conflict);
                }
            });
            
            // Show conflict summary
            if (conflicts.length > 0) {
                this.showConflictSummary(conflicts);
            }
            
            // Trigger custom event
            this.triggerConflictEvent(conflicts);
        }

        /**
         * 🚨 Show visual conflict indicator
         */
        showConflictIndicator(conflict) {
            conflict.elements.forEach(element => {
                // Add conflict class
                element.classList.add(`woow-${conflict.type}-conflict`);
                
                // Create overlay for overlap conflicts
                if (conflict.type === 'overlap' && conflict.details.overlapArea > 0) {
                    this.createOverlapOverlay(conflict);
                }
                
                // Add warning indicator
                if (!element.querySelector('.woow-conflict-warning')) {
                    element.classList.add('woow-conflict-warning');
                }
            });
        }

        /**
         * 📊 Create overlap overlay
         */
        createOverlapOverlay(conflict) {
            const { left, right, top, bottom } = conflict.details;
            
            const overlay = document.createElement('div');
            overlay.className = 'woow-conflict-overlay';
            overlay.style.cssText = `
                left: ${left}px;
                top: ${top}px;
                width: ${right - left}px;
                height: ${bottom - top}px;
            `;
            
            document.body.appendChild(overlay);
            
            // Store reference for cleanup
            if (!this.overlays) this.overlays = [];
            this.overlays.push(overlay);
        }

        /**
         * 📋 Show conflict summary
         */
        showConflictSummary(conflicts) {
            if (!this.options.visualIndicators) return;
            
            const summary = document.createElement('div');
            summary.className = 'woow-conflict-suggestion';
            summary.innerHTML = `
                <button class="close" onclick="this.parentElement.remove()">×</button>
                <h4>Layout Conflicts Detected</h4>
                <p>Found ${conflicts.length} layout conflicts that may affect user experience.</p>
                <button onclick="window.conflictDetectorInstance.showConflictDetails()">View Details</button>
                <button onclick="window.conflictDetectorInstance.autoFixAll()">Auto-Fix All</button>
            `;
            
            document.body.appendChild(summary);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (summary.parentElement) {
                    summary.parentElement.removeChild(summary);
                }
            }, 10000);
        }

        /**
         * 🔧 Generate overlap suggestions
         */
        generateOverlapSuggestions(element1, element2, overlap) {
            const suggestions = [];
            
            if (overlap.percentage > 50) {
                suggestions.push({
                    type: 'reposition',
                    description: 'Move one element to avoid overlap',
                    action: () => this.repositionElement(element2, element1)
                });
            }
            
            suggestions.push({
                type: 'resize',
                description: 'Reduce element size to prevent overlap',
                action: () => this.resizeElement(element1, 0.8)
            });
            
            suggestions.push({
                type: 'zindex',
                description: 'Adjust z-index to control layering',
                action: () => this.adjustZIndex(element1, element2)
            });
            
            return suggestions;
        }

        /**
         * 🔧 Generate z-index suggestions
         */
        generateZIndexSuggestions(element1, element2, currentZIndex) {
            return [
                {
                    type: 'zindex-adjust',
                    description: 'Increase z-index of one element',
                    action: () => {
                        element1.style.zIndex = currentZIndex + 1;
                    }
                },
                {
                    type: 'position-adjust',
                    description: 'Change positioning to avoid conflict',
                    action: () => this.repositionElement(element2, element1)
                }
            ];
        }

        /**
         * ♿ Generate accessibility suggestions
         */
        generateAccessibilitySuggestions(element, issues) {
            const suggestions = [];
            
            issues.forEach(issue => {
                switch (issue) {
                    case 'Missing alt text':
                        suggestions.push({
                            type: 'alt-text',
                            description: 'Add descriptive alt text',
                            action: () => {
                                element.alt = 'Descriptive alt text needed';
                            }
                        });
                        break;
                        
                    case 'Insufficient color contrast':
                        suggestions.push({
                            type: 'contrast',
                            description: 'Improve color contrast',
                            action: () => this.improveContrast(element)
                        });
                        break;
                        
                    case 'Missing focus indicator':
                        suggestions.push({
                            type: 'focus',
                            description: 'Add focus indicator',
                            action: () => this.addFocusIndicator(element)
                        });
                        break;
                        
                    case 'Touch target too small (minimum 44px)':
                        suggestions.push({
                            type: 'touch-target',
                            description: 'Increase touch target size',
                            action: () => this.increaseTouchTarget(element)
                        });
                        break;
                }
            });
            
            return suggestions;
        }

        /**
         * 📱 Generate responsive suggestions
         */
        generateResponsiveSuggestions(element, issues) {
            const suggestions = [];
            
            issues.forEach(issue => {
                if (issue.includes('viewport width')) {
                    suggestions.push({
                        type: 'responsive-width',
                        description: 'Make element responsive',
                        action: () => this.makeResponsive(element)
                    });
                }
                
                if (issue.includes('horizontal scrolling')) {
                    suggestions.push({
                        type: 'overflow',
                        description: 'Fix horizontal overflow',
                        action: () => this.fixOverflow(element)
                    });
                }
            });
            
            return suggestions;
        }

        /**
         * 🔧 Auto-fix methods
         */
        repositionElement(element, referenceElement) {
            const rect = referenceElement.getBoundingClientRect();
            element.style.position = 'absolute';
            element.style.left = (rect.right + 10) + 'px';
            element.style.top = rect.top + 'px';
        }

        resizeElement(element, scale) {
            const rect = element.getBoundingClientRect();
            element.style.width = (rect.width * scale) + 'px';
            element.style.height = (rect.height * scale) + 'px';
        }

        adjustZIndex(element1, element2) {
            const z1 = parseInt(window.getComputedStyle(element1).zIndex) || 0;
            const z2 = parseInt(window.getComputedStyle(element2).zIndex) || 0;
            element1.style.zIndex = Math.max(z1, z2) + 1;
        }

        improveContrast(element) {
            const style = window.getComputedStyle(element);
            if (style.color === 'rgb(0, 0, 0)') {
                element.style.color = '#333';
            } else {
                element.style.color = '#000';
            }
        }

        addFocusIndicator(element) {
            element.style.outline = '2px solid #007cba';
            element.style.outlineOffset = '2px';
        }

        increaseTouchTarget(element) {
            element.style.minWidth = '44px';
            element.style.minHeight = '44px';
            element.style.padding = '10px';
        }

        makeResponsive(element) {
            element.style.maxWidth = '100%';
            element.style.width = 'auto';
        }

        fixOverflow(element) {
            element.style.overflowX = 'auto';
            element.style.maxWidth = '100%';
        }

        /**
         * 🔧 Attempt auto-fix for conflict
         */
        attemptAutoFix(conflict) {
            if (conflict.suggestions.length > 0) {
                const suggestion = conflict.suggestions[0]; // Use first suggestion
                try {
                    suggestion.action();
                    this.log(`Auto-fixed ${conflict.type} conflict using ${suggestion.type}`);
                } catch (error) {
                    this.logError(`Auto-fix failed for ${conflict.type}:`, error);
                }
            }
        }

        /**
         * 🔧 Auto-fix all conflicts
         */
        autoFixAll() {
            this.conflicts.forEach(conflict => {
                this.attemptAutoFix(conflict);
            });
            
            // Re-check after fixes
            setTimeout(() => {
                this.checkForConflicts();
            }, 500);
        }

        /**
         * 📋 Show conflict details
         */
        showConflictDetails() {
            console.group('Layout Conflicts Details');
            this.conflicts.forEach((conflict, index) => {
                console.log(`Conflict ${index + 1}:`, conflict);
            });
            console.groupEnd();
        }

        /**
         * 🧹 Clear previous conflicts
         */
        clearPreviousConflicts() {
            // Remove conflict classes
            this.conflictElements.forEach(element => {
                element.classList.remove(
                    'woow-overlap-conflict',
                    'woow-zindex-conflict',
                    'woow-accessibility-conflict',
                    'woow-responsive-conflict',
                    'woow-conflict-warning'
                );
            });
            
            // Remove overlays
            if (this.overlays) {
                this.overlays.forEach(overlay => {
                    if (overlay.parentElement) {
                        overlay.parentElement.removeChild(overlay);
                    }
                });
                this.overlays = [];
            }
            
            // Remove existing suggestions
            const suggestions = document.querySelectorAll('.woow-conflict-suggestion');
            suggestions.forEach(suggestion => {
                if (suggestion.parentElement) {
                    suggestion.parentElement.removeChild(suggestion);
                }
            });
        }

        /**
         * 🎯 Trigger conflict event
         */
        triggerConflictEvent(conflicts) {
            const event = new CustomEvent('woow:conflicts-detected', {
                detail: {
                    conflicts: conflicts,
                    count: conflicts.length,
                    severity: this.getOverallSeverity(conflicts)
                },
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(event);
        }

        /**
         * 📊 Get overall severity
         */
        getOverallSeverity(conflicts) {
            const severities = conflicts.map(c => c.severity);
            if (severities.includes('critical')) return 'critical';
            if (severities.includes('high')) return 'high';
            if (severities.includes('medium')) return 'medium';
            return 'low';
        }

        /**
         * 📊 Get conflict statistics
         */
        getStats() {
            const stats = {
                totalConflicts: this.conflicts.size,
                conflictsByType: {},
                conflictsBySeverity: {},
                affectedElements: this.conflictElements.size
            };
            
            this.conflicts.forEach(conflict => {
                stats.conflictsByType[conflict.type] = (stats.conflictsByType[conflict.type] || 0) + 1;
                stats.conflictsBySeverity[conflict.severity] = (stats.conflictsBySeverity[conflict.severity] || 0) + 1;
            });
            
            return stats;
        }

        /**
         * ⚙️ Update options
         */
        updateOptions(newOptions) {
            this.options = { ...this.options, ...newOptions };
            
            if (newOptions.checkInterval) {
                this.startPeriodicChecks();
            }
            
            this.log('Options updated:', newOptions);
        }

        /**
         * 🧹 Destroy conflict detector
         */
        destroy() {
            // Clear timers
            if (this.checkTimer) {
                clearInterval(this.checkTimer);
            }
            if (this.scheduleTimer) {
                clearTimeout(this.scheduleTimer);
            }
            
            // Disconnect observers
            this.observers.forEach(observer => {
                observer.disconnect();
            });
            
            // Clear conflicts
            this.clearPreviousConflicts();
            
            // Remove styles
            const styles = document.getElementById('conflict-detector-styles');
            if (styles) {
                styles.parentElement.removeChild(styles);
            }
            
            this.log('ConflictDetector destroyed');
        }

        /**
         * 📝 Logging utilities
         */
        log(message, data = null) {
            if (this.debugMode) {
                console.log(`🔍 ConflictDetector: ${message}`, data || '');
            }
        }

        logError(message, error = null) {
            console.error(`❌ ConflictDetector: ${message}`, error);
        }
    }

    // Make ConflictDetector globally available
    window.ConflictDetector = ConflictDetector;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.conflictDetectorInstance = new ConflictDetector();
        });
    } else {
        window.conflictDetectorInstance = new ConflictDetector();
    }

})(window, document);