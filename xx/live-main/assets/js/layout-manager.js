/**
 * 🎯 LayoutManager - Advanced Drag & Drop Layout System
 * 
 * Advanced layout management system with:
 * - Drag & drop for menu elements and widgets
 * - Snap-to-grid functionality with visual guides
 * - Alignment guides and smart positioning
 * - Integration with existing EventManager
 * - Collision detection and prevention
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 */

(function(window, document) {
    'use strict';

    /**
     * 🎯 LayoutManager - Main Layout Management Class
     */
    class LayoutManager {
        constructor(options = {}) {
            this.options = {
                gridSize: 10,
                snapThreshold: 15,
                alignmentThreshold: 5,
                enableGrid: true,
                enableAlignment: true,
                enableSnapping: true,
                dragSelector: '.woow-draggable, .mas-draggable, #adminmenu li, .widget',
                dropZoneSelector: '.woow-drop-zone, .mas-drop-zone, #wpbody-content, #adminmenu',
                ...options
            };

            this.isDragging = false;
            this.dragElement = null;
            this.dragOffset = { x: 0, y: 0 };
            this.dropZones = [];
            this.alignmentGuides = [];
            this.gridOverlay = null;
            this.ghostElement = null;
            
            this.eventManager = window.eventManagerInstance;
            this.debugMode = window.masV2Debug || false;
            
            this.init();
        }

        /**
         * 🚀 Initialize the layout manager
         */
        init() {
            this.createGridOverlay();
            this.createAlignmentGuides();
            this.setupEventListeners();
            this.identifyDropZones();
            this.makeDraggable();
            
            this.log('LayoutManager initialized');
        }

        /**
         * 📐 Create grid overlay for snap-to-grid
         */
        createGridOverlay() {
            this.gridOverlay = document.createElement('div');
            this.gridOverlay.className = 'woow-grid-overlay';
            this.gridOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 9998;
                opacity: 0;
                transition: opacity 0.2s ease;
                background-image: 
                    linear-gradient(to right, rgba(0,123,255,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,123,255,0.1) 1px, transparent 1px);
                background-size: ${this.options.gridSize}px ${this.options.gridSize}px;
            `;
            
            document.body.appendChild(this.gridOverlay);
        }

        /**
         * 📏 Create alignment guides
         */
        createAlignmentGuides() {
            // Vertical guide
            const verticalGuide = document.createElement('div');
            verticalGuide.className = 'woow-alignment-guide woow-vertical-guide';
            verticalGuide.style.cssText = `
                position: fixed;
                top: 0;
                width: 1px;
                height: 100vh;
                background: rgba(255,0,0,0.8);
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.1s ease;
            `;

            // Horizontal guide
            const horizontalGuide = document.createElement('div');
            horizontalGuide.className = 'woow-alignment-guide woow-horizontal-guide';
            horizontalGuide.style.cssText = `
                position: fixed;
                left: 0;
                width: 100vw;
                height: 1px;
                background: rgba(255,0,0,0.8);
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.1s ease;
            `;

            document.body.appendChild(verticalGuide);
            document.body.appendChild(horizontalGuide);
            
            this.alignmentGuides = {
                vertical: verticalGuide,
                horizontal: horizontalGuide
            };
        }

        /**
         * 🎧 Setup event listeners
         */
        setupEventListeners() {
            // Use existing EventManager for consistent event handling
            if (this.eventManager) {
                this.eventManager.registerControlHandler('mousedown', 'div', (element, event) => {
                    if (this.isDraggableElement(element)) {
                        this.handleDragStart(element, event);
                    }
                });

                this.eventManager.registerControlHandler('mousedown', 'li', (element, event) => {
                    if (this.isDraggableElement(element)) {
                        this.handleDragStart(element, event);
                    }
                });
            }

            // Global mouse events for drag operations
            document.addEventListener('mousemove', (event) => {
                if (this.isDragging) {
                    this.handleDragMove(event);
                }
            });

            document.addEventListener('mouseup', (event) => {
                if (this.isDragging) {
                    this.handleDragEnd(event);
                }
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (event) => {
                this.handleKeyboardShortcuts(event);
            });

            // Window resize handler
            window.addEventListener('resize', () => {
                this.updateDropZones();
            });
        }

        /**
         * 🎯 Check if element is draggable
         */
        isDraggableElement(element) {
            // Check if element matches drag selector
            if (element.matches && element.matches(this.options.dragSelector)) {
                return true;
            }

            // Check if element is within a draggable container
            const draggableParent = element.closest(this.options.dragSelector);
            return !!draggableParent;
        }

        /**
         * 🏠 Identify drop zones
         */
        identifyDropZones() {
            this.dropZones = Array.from(document.querySelectorAll(this.options.dropZoneSelector))
                .map(zone => ({
                    element: zone,
                    rect: zone.getBoundingClientRect(),
                    accepts: this.getDropZoneAccepts(zone)
                }));

            this.log(`Identified ${this.dropZones.length} drop zones`);
        }

        /**
         * 📋 Get what types of elements a drop zone accepts
         */
        getDropZoneAccepts(zone) {
            const accepts = zone.getAttribute('data-accepts');
            if (accepts) {
                return accepts.split(',').map(type => type.trim());
            }

            // Default acceptance rules
            if (zone.id === 'adminmenu') {
                return ['menu-item'];
            }
            if (zone.classList.contains('widget-area')) {
                return ['widget'];
            }
            
            return ['*']; // Accept all by default
        }

        /**
         * 🎨 Make elements draggable
         */
        makeDraggable() {
            const draggableElements = document.querySelectorAll(this.options.dragSelector);
            
            draggableElements.forEach(element => {
                element.setAttribute('draggable', 'false'); // Disable native drag
                element.style.cursor = 'move';
                
                // Add visual indicator
                if (!element.classList.contains('woow-draggable-ready')) {
                    element.classList.add('woow-draggable-ready');
                    
                    // Add drag handle if needed
                    this.addDragHandle(element);
                }
            });

            this.log(`Made ${draggableElements.length} elements draggable`);
        }

        /**
         * 🔧 Add drag handle to element
         */
        addDragHandle(element) {
            // Skip if element already has a handle
            if (element.querySelector('.woow-drag-handle')) {
                return;
            }

            const handle = document.createElement('div');
            handle.className = 'woow-drag-handle';
            handle.innerHTML = '⋮⋮';
            handle.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                width: 20px;
                height: 20px;
                background: rgba(0,0,0,0.1);
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: #666;
                cursor: move;
                opacity: 0;
                transition: opacity 0.2s ease;
                z-index: 10;
            `;

            // Show handle on hover
            element.addEventListener('mouseenter', () => {
                handle.style.opacity = '1';
            });

            element.addEventListener('mouseleave', () => {
                if (!this.isDragging) {
                    handle.style.opacity = '0';
                }
            });

            // Position element relatively if needed
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.position === 'static') {
                element.style.position = 'relative';
            }

            element.appendChild(handle);
        }

        /**
         * 🎬 Handle drag start
         */
        handleDragStart(element, event) {
            // Prevent default to avoid conflicts
            event.preventDefault();
            
            // Find the actual draggable element
            const draggableElement = element.closest(this.options.dragSelector) || element;
            
            this.isDragging = true;
            this.dragElement = draggableElement;
            
            // Calculate drag offset
            const rect = draggableElement.getBoundingClientRect();
            this.dragOffset = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };

            // Create ghost element
            this.createGhostElement(draggableElement);
            
            // Show grid and guides
            if (this.options.enableGrid) {
                this.showGrid();
            }
            
            // Add dragging class
            draggableElement.classList.add('woow-dragging');
            document.body.classList.add('woow-drag-active');
            
            // Update drop zones
            this.updateDropZones();
            this.highlightDropZones(true);
            
            this.log('Drag started for element:', draggableElement);
        }

        /**
         * 👻 Create ghost element for dragging
         */
        createGhostElement(element) {
            this.ghostElement = element.cloneNode(true);
            this.ghostElement.className += ' woow-ghost-element';
            this.ghostElement.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 10000;
                opacity: 0.8;
                transform: rotate(5deg);
                transition: none;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            `;
            
            document.body.appendChild(this.ghostElement);
        }

        /**
         * 🎭 Handle drag move
         */
        handleDragMove(event) {
            if (!this.isDragging || !this.ghostElement) return;

            // Update ghost position
            const x = event.clientX - this.dragOffset.x;
            const y = event.clientY - this.dragOffset.y;
            
            // Apply snapping if enabled
            let snappedX = x;
            let snappedY = y;
            
            if (this.options.enableSnapping) {
                const snapped = this.snapToGrid(x, y);
                snappedX = snapped.x;
                snappedY = snapped.y;
            }
            
            this.ghostElement.style.left = snappedX + 'px';
            this.ghostElement.style.top = snappedY + 'px';
            
            // Update alignment guides
            if (this.options.enableAlignment) {
                this.updateAlignmentGuides(snappedX, snappedY);
            }
            
            // Check drop zones
            this.checkDropZones(event.clientX, event.clientY);
        }

        /**
         * 📐 Snap position to grid
         */
        snapToGrid(x, y) {
            const gridSize = this.options.gridSize;
            const threshold = this.options.snapThreshold;
            
            const snappedX = Math.round(x / gridSize) * gridSize;
            const snappedY = Math.round(y / gridSize) * gridSize;
            
            // Only snap if within threshold
            const deltaX = Math.abs(x - snappedX);
            const deltaY = Math.abs(y - snappedY);
            
            return {
                x: deltaX <= threshold ? snappedX : x,
                y: deltaY <= threshold ? snappedY : y
            };
        }

        /**
         * 📏 Update alignment guides
         */
        updateAlignmentGuides(x, y) {
            const elements = document.querySelectorAll(this.options.dragSelector + ':not(.woow-dragging)');
            let showVertical = false;
            let showHorizontal = false;
            let verticalX = 0;
            let horizontalY = 0;
            
            elements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const threshold = this.options.alignmentThreshold;
                
                // Check vertical alignment
                if (Math.abs(rect.left - x) <= threshold) {
                    showVertical = true;
                    verticalX = rect.left;
                } else if (Math.abs(rect.right - x) <= threshold) {
                    showVertical = true;
                    verticalX = rect.right;
                } else if (Math.abs((rect.left + rect.right) / 2 - x) <= threshold) {
                    showVertical = true;
                    verticalX = (rect.left + rect.right) / 2;
                }
                
                // Check horizontal alignment
                if (Math.abs(rect.top - y) <= threshold) {
                    showHorizontal = true;
                    horizontalY = rect.top;
                } else if (Math.abs(rect.bottom - y) <= threshold) {
                    showHorizontal = true;
                    horizontalY = rect.bottom;
                } else if (Math.abs((rect.top + rect.bottom) / 2 - y) <= threshold) {
                    showHorizontal = true;
                    horizontalY = (rect.top + rect.bottom) / 2;
                }
            });
            
            // Show/hide guides
            if (showVertical) {
                this.alignmentGuides.vertical.style.left = verticalX + 'px';
                this.alignmentGuides.vertical.style.opacity = '1';
            } else {
                this.alignmentGuides.vertical.style.opacity = '0';
            }
            
            if (showHorizontal) {
                this.alignmentGuides.horizontal.style.top = horizontalY + 'px';
                this.alignmentGuides.horizontal.style.opacity = '1';
            } else {
                this.alignmentGuides.horizontal.style.opacity = '0';
            }
        }

        /**
         * 🎯 Check drop zones during drag
         */
        checkDropZones(x, y) {
            let activeZone = null;
            
            this.dropZones.forEach(zone => {
                const rect = zone.rect;
                const isOver = x >= rect.left && x <= rect.right && 
                              y >= rect.top && y <= rect.bottom;
                
                if (isOver && this.canDropInZone(zone)) {
                    activeZone = zone;
                    zone.element.classList.add('woow-drop-zone-active');
                } else {
                    zone.element.classList.remove('woow-drop-zone-active');
                }
            });
            
            return activeZone;
        }

        /**
         * ✅ Check if element can be dropped in zone
         */
        canDropInZone(zone) {
            if (!this.dragElement) return false;
            
            const elementType = this.getElementType(this.dragElement);
            return zone.accepts.includes('*') || zone.accepts.includes(elementType);
        }

        /**
         * 🏷️ Get element type for drop zone validation
         */
        getElementType(element) {
            if (element.classList.contains('widget')) return 'widget';
            if (element.closest('#adminmenu')) return 'menu-item';
            if (element.hasAttribute('data-element-type')) {
                return element.getAttribute('data-element-type');
            }
            return 'generic';
        }

        /**
         * 🏁 Handle drag end
         */
        handleDragEnd(event) {
            if (!this.isDragging) return;
            
            const dropZone = this.checkDropZones(event.clientX, event.clientY);
            
            if (dropZone) {
                this.performDrop(dropZone, event);
            } else {
                this.cancelDrop();
            }
            
            this.cleanup();
        }

        /**
         * 📦 Perform drop operation
         */
        performDrop(dropZone, event) {
            const dropPosition = this.calculateDropPosition(dropZone, event);
            
            // Move element to new position
            this.moveElement(this.dragElement, dropZone.element, dropPosition);
            
            // Trigger custom event
            this.triggerDropEvent(this.dragElement, dropZone.element, dropPosition);
            
            this.log('Element dropped successfully', {
                element: this.dragElement,
                dropZone: dropZone.element,
                position: dropPosition
            });
        }

        /**
         * 📍 Calculate drop position within zone
         */
        calculateDropPosition(dropZone, event) {
            const rect = dropZone.rect;
            const relativeX = event.clientX - rect.left;
            const relativeY = event.clientY - rect.top;
            
            return {
                x: relativeX,
                y: relativeY,
                percentX: (relativeX / rect.width) * 100,
                percentY: (relativeY / rect.height) * 100
            };
        }

        /**
         * 🚚 Move element to new position
         */
        moveElement(element, dropZone, position) {
            // Remove from current parent
            const originalParent = element.parentNode;
            const originalNextSibling = element.nextSibling;
            
            // Store original position for undo
            element.setAttribute('data-original-parent', originalParent.id || 'unknown');
            element.setAttribute('data-original-position', Array.from(originalParent.children).indexOf(element));
            
            // Determine insertion point in drop zone
            const insertionPoint = this.findInsertionPoint(dropZone, position);
            
            if (insertionPoint) {
                dropZone.insertBefore(element, insertionPoint);
            } else {
                dropZone.appendChild(element);
            }
            
            // Update element position if needed
            if (dropZone.style.position === 'relative' || dropZone.style.position === 'absolute') {
                element.style.position = 'absolute';
                element.style.left = position.x + 'px';
                element.style.top = position.y + 'px';
            }
            
            // Save layout change
            this.saveLayoutChange(element, dropZone, position);
        }

        /**
         * 🎯 Find insertion point in drop zone
         */
        findInsertionPoint(dropZone, position) {
            const children = Array.from(dropZone.children);
            
            for (let child of children) {
                const childRect = child.getBoundingClientRect();
                const dropZoneRect = dropZone.getBoundingClientRect();
                
                const childRelativeY = childRect.top - dropZoneRect.top;
                
                if (position.y < childRelativeY) {
                    return child;
                }
            }
            
            return null; // Insert at end
        }

        /**
         * ❌ Cancel drop operation
         */
        cancelDrop() {
            // Animate ghost back to original position if possible
            if (this.ghostElement && this.dragElement) {
                const originalRect = this.dragElement.getBoundingClientRect();
                
                this.ghostElement.style.transition = 'all 0.3s ease';
                this.ghostElement.style.left = originalRect.left + 'px';
                this.ghostElement.style.top = originalRect.top + 'px';
                this.ghostElement.style.opacity = '0';
            }
            
            this.log('Drop cancelled');
        }

        /**
         * 🧹 Cleanup after drag operation
         */
        cleanup() {
            this.isDragging = false;
            
            // Remove ghost element
            if (this.ghostElement) {
                setTimeout(() => {
                    if (this.ghostElement && this.ghostElement.parentNode) {
                        this.ghostElement.parentNode.removeChild(this.ghostElement);
                    }
                    this.ghostElement = null;
                }, 300);
            }
            
            // Hide grid and guides
            this.hideGrid();
            this.hideAlignmentGuides();
            
            // Remove classes
            if (this.dragElement) {
                this.dragElement.classList.remove('woow-dragging');
                this.dragElement = null;
            }
            
            document.body.classList.remove('woow-drag-active');
            this.highlightDropZones(false);
            
            // Reset drag offset
            this.dragOffset = { x: 0, y: 0 };
        }

        /**
         * 🌐 Show grid overlay
         */
        showGrid() {
            if (this.gridOverlay) {
                this.gridOverlay.style.opacity = '1';
            }
        }

        /**
         * 🌐 Hide grid overlay
         */
        hideGrid() {
            if (this.gridOverlay) {
                this.gridOverlay.style.opacity = '0';
            }
        }

        /**
         * 📏 Hide alignment guides
         */
        hideAlignmentGuides() {
            Object.values(this.alignmentGuides).forEach(guide => {
                guide.style.opacity = '0';
            });
        }

        /**
         * 💡 Highlight drop zones
         */
        highlightDropZones(show) {
            this.dropZones.forEach(zone => {
                if (show) {
                    zone.element.classList.add('woow-drop-zone-available');
                } else {
                    zone.element.classList.remove('woow-drop-zone-available', 'woow-drop-zone-active');
                }
            });
        }

        /**
         * 🔄 Update drop zones (e.g., after window resize)
         */
        updateDropZones() {
            this.dropZones.forEach(zone => {
                zone.rect = zone.element.getBoundingClientRect();
            });
        }

        /**
         * ⌨️ Handle keyboard shortcuts
         */
        handleKeyboardShortcuts(event) {
            if (this.isDragging) {
                switch (event.key) {
                    case 'Escape':
                        this.cancelDrop();
                        this.cleanup();
                        break;
                    case 'g':
                    case 'G':
                        this.options.enableGrid = !this.options.enableGrid;
                        if (this.options.enableGrid) {
                            this.showGrid();
                        } else {
                            this.hideGrid();
                        }
                        break;
                }
            }
        }

        /**
         * 💾 Save layout change
         */
        saveLayoutChange(element, dropZone, position) {
            const layoutData = {
                elementId: element.id || this.generateElementId(element),
                dropZoneId: dropZone.id || 'unknown',
                position: position,
                timestamp: Date.now()
            };
            
            // Save via AJAX if available
            if (window.ajaxurl) {
                this.saveToBackend(layoutData);
            }
            
            // Store locally for undo functionality
            this.storeLayoutChange(layoutData);
        }

        /**
         * 🆔 Generate unique ID for element
         */
        generateElementId(element) {
            const id = 'woow-element-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            element.id = id;
            return id;
        }

        /**
         * 💾 Save to backend
         */
        async saveToBackend(layoutData) {
            try {
                const response = await fetch(window.ajaxurl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'mas_save_layout_change',
                        nonce: window.masNonce || window.mas_nonce || '',
                        layout_data: JSON.stringify(layoutData)
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.log('Layout change saved successfully');
                } else {
                    throw new Error(data.message || 'Failed to save layout change');
                }
            } catch (error) {
                this.logError('Failed to save layout change:', error);
            }
        }

        /**
         * 📚 Store layout change for undo
         */
        storeLayoutChange(layoutData) {
            if (!this.layoutHistory) {
                this.layoutHistory = [];
            }
            
            this.layoutHistory.push(layoutData);
            
            // Keep only last 50 changes
            if (this.layoutHistory.length > 50) {
                this.layoutHistory.shift();
            }
        }

        /**
         * 🎯 Trigger drop event
         */
        triggerDropEvent(element, dropZone, position) {
            const event = new CustomEvent('woow:element-dropped', {
                detail: {
                    element: element,
                    dropZone: dropZone,
                    position: position
                },
                bubbles: true,
                cancelable: true
            });
            
            document.dispatchEvent(event);
        }

        /**
         * 🔄 Refresh draggable elements
         */
        refresh() {
            this.identifyDropZones();
            this.makeDraggable();
            this.log('LayoutManager refreshed');
        }

        /**
         * ⚙️ Update options
         */
        updateOptions(newOptions) {
            this.options = { ...this.options, ...newOptions };
            
            // Update grid size if changed
            if (newOptions.gridSize) {
                this.gridOverlay.style.backgroundSize = `${newOptions.gridSize}px ${newOptions.gridSize}px`;
            }
            
            this.log('Options updated:', newOptions);
        }

        /**
         * 📊 Get layout statistics
         */
        getStats() {
            return {
                dropZones: this.dropZones.length,
                draggableElements: document.querySelectorAll(this.options.dragSelector).length,
                layoutHistory: this.layoutHistory ? this.layoutHistory.length : 0,
                isDragging: this.isDragging,
                options: this.options
            };
        }

        /**
         * 🧹 Destroy layout manager
         */
        destroy() {
            // Remove event listeners
            if (this.eventManager) {
                this.eventManager.unregisterControlHandler('mousedown', 'div');
                this.eventManager.unregisterControlHandler('mousedown', 'li');
            }
            
            // Remove overlay elements
            if (this.gridOverlay && this.gridOverlay.parentNode) {
                this.gridOverlay.parentNode.removeChild(this.gridOverlay);
            }
            
            Object.values(this.alignmentGuides).forEach(guide => {
                if (guide.parentNode) {
                    guide.parentNode.removeChild(guide);
                }
            });
            
            // Cleanup
            this.cleanup();
            
            this.log('LayoutManager destroyed');
        }

        /**
         * 📝 Logging utilities
         */
        log(message, data = null) {
            if (this.debugMode) {
                console.log(`🎯 LayoutManager: ${message}`, data || '');
            }
        }

        logError(message, error = null) {
            console.error(`❌ LayoutManager: ${message}`, error);
        }
    }

    // Make LayoutManager globally available
    window.LayoutManager = LayoutManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (window.eventManagerInstance) {
                window.layoutManagerInstance = new LayoutManager();
            }
        });
    } else {
        if (window.eventManagerInstance) {
            window.layoutManagerInstance = new LayoutManager();
        }
    }

})(window, document);