/**
 * Block Editor Compatibility Script
 * 
 * Ensures WOOW Admin Styler works properly with Gutenberg/Block Editor
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Block Editor Compatibility
 */

(function() {
    'use strict';
    
    // Wait for WordPress and block editor to be ready
    if (typeof wp === 'undefined' || !wp.domReady) {
        return;
    }
    
    wp.domReady(function() {
        initBlockEditorCompatibility();
    });
    
    /**
     * Initialize block editor compatibility
     */
    function initBlockEditorCompatibility() {
        // Check if we're in the block editor
        if (!isBlockEditor()) {
            return;
        }
        
        console.log('🎨 WOOW Admin Styler: Initializing block editor compatibility');
        
        // Disable live edit mode in block editor
        disableLiveEditInBlockEditor();
        
        // Adjust admin bar for block editor
        adjustAdminBarForBlockEditor();
        
        // Handle block editor specific events
        handleBlockEditorEvents();
        
        // Ensure proper z-index management
        manageZIndexes();
        
        // Handle block editor modals
        handleBlockEditorModals();
        
        // Monitor for block editor changes
        monitorBlockEditorChanges();
    }
    
    /**
     * Check if we're in the block editor
     */
    function isBlockEditor() {
        return document.body.classList.contains('block-editor-page') ||
               document.body.classList.contains('edit-post-visual-editor') ||
               document.body.classList.contains('edit-site-visual-editor') ||
               (typeof wp.blocks !== 'undefined' && wp.blocks.getBlockTypes);
    }
    
    /**
     * Disable live edit mode in block editor
     */
    function disableLiveEditInBlockEditor() {
        // Disable our live edit functionality in block editor
        if (window.WoowLiveEdit) {
            window.WoowLiveEdit.disable();
        }
        
        // Remove live edit triggers
        const liveEditTriggers = document.querySelectorAll('.woow-live-edit-trigger');
        liveEditTriggers.forEach(trigger => {
            trigger.style.display = 'none';
        });
        
        // Add class to indicate block editor mode
        document.body.classList.add('woow-block-editor-mode');
    }
    
    /**
     * Adjust admin bar for block editor
     */
    function adjustAdminBarForBlockEditor() {
        const adminBar = document.getElementById('wpadminbar');
        if (!adminBar) return;
        
        // Ensure admin bar stays on top
        adminBar.style.zIndex = '9999';
        adminBar.style.position = 'fixed';
        
        // Adjust admin bar height variable for block editor
        const adminBarHeight = adminBar.offsetHeight;
        document.documentElement.style.setProperty('--wp-admin--admin-bar--height', adminBarHeight + 'px');
    }
    
    /**
     * Handle block editor specific events
     */
    function handleBlockEditorEvents() {
        // Handle block selection
        if (wp.data && wp.data.subscribe) {
            wp.data.subscribe(() => {
                const selectedBlock = wp.data.select('core/block-editor').getSelectedBlock();
                if (selectedBlock) {
                    // Hide our micro panels when a block is selected
                    hideMicroPanels();
                }
            });
        }
        
        // Handle block editor ready state
        if (wp.domReady) {
            wp.domReady(() => {
                // Block editor is fully loaded
                setTimeout(() => {
                    adjustLayoutForBlockEditor();
                }, 100);
            });
        }
        
        // Handle editor mode changes
        document.addEventListener('click', function(e) {
            if (e.target.matches('.edit-post-header-toolbar__inserter-toggle')) {
                // Inserter opened - adjust our elements
                setTimeout(adjustForInserter, 100);
            }
        });
    }
    
    /**
     * Manage z-index values for block editor compatibility
     */
    function manageZIndexes() {
        const zIndexMap = {
            '#wpadminbar': 9999,
            '.woow-micro-panel': 99998,
            '.block-editor-block-toolbar': 99997,
            '.block-editor-inserter__popover': 99996,
            '.edit-post-sidebar': 99995,
            '#adminmenuwrap': 9998,
            '.components-modal__screen-overlay': 100000,
            '.components-modal__frame': 100001,
            '.components-popover': 99999,
            '.edit-post-welcome-guide': 100002
        };
        
        Object.entries(zIndexMap).forEach(([selector, zIndex]) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.zIndex = zIndex;
            });
        });
    }
    
    /**
     * Handle block editor modals
     */
    function handleBlockEditorModals() {
        // Monitor for modal creation
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Check for modal elements
                        if (node.classList && (
                            node.classList.contains('components-modal__screen-overlay') ||
                            node.classList.contains('components-popover') ||
                            node.classList.contains('block-editor-inserter__popover')
                        )) {
                            // Hide our micro panels when modals appear
                            hideMicroPanels();
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Monitor for block editor changes
     */
    function monitorBlockEditorChanges() {
        // Monitor for editor state changes
        if (wp.data && wp.data.subscribe) {
            let previousBlocks = [];
            
            wp.data.subscribe(() => {
                const currentBlocks = wp.data.select('core/block-editor').getBlocks();
                
                if (JSON.stringify(currentBlocks) !== JSON.stringify(previousBlocks)) {
                    // Blocks changed - update our compatibility
                    setTimeout(() => {
                        updateCompatibilityForBlocks(currentBlocks);
                    }, 50);
                    
                    previousBlocks = [...currentBlocks];
                }
            });
        }
        
        // Monitor for sidebar changes
        document.addEventListener('click', function(e) {
            if (e.target.matches('.edit-post-sidebar__panel-tab')) {
                setTimeout(adjustForSidebarChange, 100);
            }
        });
    }
    
    /**
     * Hide micro panels
     */
    function hideMicroPanels() {
        const microPanels = document.querySelectorAll('.woow-micro-panel');
        microPanels.forEach(panel => {
            panel.style.display = 'none';
        });
    }
    
    /**
     * Show micro panels
     */
    function showMicroPanels() {
        const microPanels = document.querySelectorAll('.woow-micro-panel');
        microPanels.forEach(panel => {
            panel.style.display = '';
        });
    }
    
    /**
     * Adjust layout for block editor
     */
    function adjustLayoutForBlockEditor() {
        const blockEditorContent = document.querySelector('.block-editor-editor-skeleton__content');
        const adminBar = document.getElementById('wpadminbar');
        
        if (blockEditorContent && adminBar) {
            const adminBarHeight = adminBar.offsetHeight;
            blockEditorContent.style.marginTop = adminBarHeight + 'px';
        }
        
        // Adjust admin menu for block editor
        const adminMenu = document.getElementById('adminmenuwrap');
        if (adminMenu) {
            adminMenu.style.position = 'fixed';
            adminMenu.style.zIndex = '9998';
        }
    }
    
    /**
     * Adjust for inserter
     */
    function adjustForInserter() {
        const inserter = document.querySelector('.block-editor-inserter__popover');
        if (inserter) {
            hideMicroPanels();
        }
    }
    
    /**
     * Adjust for sidebar changes
     */
    function adjustForSidebarChange() {
        // Recalculate positions after sidebar changes
        manageZIndexes();
    }
    
    /**
     * Update compatibility for blocks
     */
    function updateCompatibilityForBlocks(blocks) {
        // Check if any blocks need special handling
        blocks.forEach(block => {
            if (block.name === 'core/html' || block.name === 'core/shortcode') {
                // These blocks might contain admin-related content
                // Ensure our styles don't interfere
                const blockElement = document.querySelector(`[data-block=\"${block.clientId}\"]`);
                if (blockElement) {
                    blockElement.style.setProperty('--woow-surface-bar', 'initial', 'important');
                    blockElement.style.setProperty('--woow-surface-menu', 'initial', 'important');
                }
            }
        });
    }
    
    /**
     * Handle window resize for block editor
     */
    window.addEventListener('resize', function() {
        if (isBlockEditor()) {
            setTimeout(() => {
                adjustAdminBarForBlockEditor();
                adjustLayoutForBlockEditor();
            }, 100);
        }
    });
    
    /**
     * Handle full screen mode toggle
     */
    document.addEventListener('click', function(e) {
        if (e.target.matches('.edit-post-fullscreen-mode-close') || 
            e.target.matches('.edit-post-header-toolbar__document-overview-toggle')) {
            setTimeout(() => {
                adjustLayoutForBlockEditor();
                manageZIndexes();
            }, 200);
        }
    });
    
    /**
     * Handle preferences modal
     */
    document.addEventListener('click', function(e) {
        if (e.target.matches('.edit-post-more-menu__content button') ||
            e.target.closest('.edit-post-preferences-modal')) {
            setTimeout(() => {
                hideMicroPanels();
            }, 100);
        }
    });
    
    /**
     * Clean up when leaving block editor
     */
    window.addEventListener('beforeunload', function() {
        if (isBlockEditor()) {
            // Re-enable live edit mode
            if (window.WoowLiveEdit) {
                window.WoowLiveEdit.enable();
            }
            
            // Show micro panels
            showMicroPanels();
            
            // Remove block editor class
            document.body.classList.remove('woow-block-editor-mode');
        }
    });
    
    /**
     * Handle site editor compatibility
     */
    if (document.body.classList.contains('edit-site-visual-editor')) {
        // Site editor specific adjustments
        const siteEditorHeader = document.querySelector('.edit-site-header');
        const siteEditorSidebar = document.querySelector('.edit-site-sidebar');
        
        if (siteEditorHeader) {
            siteEditorHeader.style.zIndex = '9997';
        }
        
        if (siteEditorSidebar) {
            siteEditorSidebar.style.zIndex = '9996';
        }
    }
    
    /**
     * Handle widget editor compatibility
     */
    if (document.body.classList.contains('widgets-php')) {
        const widgetEditorHeader = document.querySelector('.edit-widgets-header');
        const widgetEditorSidebar = document.querySelector('.edit-widgets-sidebar');
        
        if (widgetEditorHeader) {
            widgetEditorHeader.style.top = 'var(--wp-admin--admin-bar--height, 32px)';
        }
        
        if (widgetEditorSidebar) {
            widgetEditorSidebar.style.top = 'calc(var(--wp-admin--admin-bar--height, 32px) + 60px)';
        }
    }
    
    // Export for debugging
    if (window.WoowDebug) {
        window.WoowDebug.blockEditorCompatibility = {
            isBlockEditor,
            hideMicroPanels,
            showMicroPanels,
            adjustLayoutForBlockEditor,
            manageZIndexes
        };
    }
    
})();