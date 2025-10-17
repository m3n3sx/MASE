/**
 * Permission Manager - Client-side permission handling for WordPress Admin Editor
 * 
 * Handles permission checks, caching, and integration with the server-side PermissionController
 */
class PermissionManager {
    constructor(options = {}) {
        this.options = {
            ajaxUrl: options.ajaxUrl || '/wp-admin/admin-ajax.php',
            nonce: options.nonce || '',
            cacheTimeout: options.cacheTimeout || 300000, // 5 minutes
            ...options
        };
        
        this.permissionCache = new Map();
        this.userPermissions = null;
        this.currentUserId = options.currentUserId || 0;
        
        this.init();
    }
    
    /**
     * Initialize permission manager
     */
    init() {
        this.loadUserPermissions();
        this.bindEvents();
        this.startCacheCleanup();
    }
    
    /**
     * Load current user permissions from server
     */
    async loadUserPermissions() {
        try {
            const response = await this.makeAjaxRequest('get_user_permissions', {
                user_id: this.currentUserId
            });
            
            if (response.success) {
                this.userPermissions = response.data;
                this.cacheUserPermissions();
                this.triggerPermissionsLoaded();
            } else {
                console.error('Failed to load user permissions:', response.data);
            }
        } catch (error) {
            console.error('Error loading user permissions:', error);
        }
    }
    
    /**
     * Check if current user can edit specific element
     * 
     * @param {string} elementSelector CSS selector of element
     * @returns {Promise<boolean>}
     */
    async canEditElement(elementSelector) {
        const cacheKey = `edit_element_${elementSelector}`;
        
        // Check cache first
        if (this.permissionCache.has(cacheKey)) {
            const cached = this.permissionCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.options.cacheTimeout) {
                return cached.value;
            }
        }
        
        // Check user permissions if loaded
        if (this.userPermissions) {
            const canEdit = this.checkElementPermission(elementSelector);
            this.cachePermission(cacheKey, canEdit);
            return canEdit;
        }
        
        // Fallback to server check
        try {
            const response = await this.makeAjaxRequest('check_edit_permission', {
                element_selector: elementSelector
            });
            
            if (response.success) {
                const canEdit = response.data.can_edit;
                this.cachePermission(cacheKey, canEdit);
                return canEdit;
            }
        } catch (error) {
            console.error('Error checking element permission:', error);
        }
        
        return false;
    }
    
    /**
     * Check element permission against loaded user permissions
     * 
     * @param {string} elementSelector CSS selector
     * @returns {boolean}
     */
    checkElementPermission(elementSelector) {
        if (!this.userPermissions || !this.userPermissions.can_edit) {
            return false;
        }
        
        const allowedElements = this.userPermissions.allowed_elements || [];
        
        // Check for wildcard permission
        if (allowedElements.includes('*')) {
            return true;
        }
        
        // Check specific element permissions
        for (const allowedSelector of allowedElements) {
            if (this.selectorMatches(elementSelector, allowedSelector)) {
                return true;
            }
        }
        
        // Check element overrides
        const elementOverrides = this.userPermissions.element_overrides || {};
        if (elementSelector in elementOverrides) {
            return elementOverrides[elementSelector];
        }
        
        return false;
    }
    
    /**
     * Check if user can perform specific action
     * 
     * @param {string} action Action name (edit_colors, edit_layout, manage_schemas, etc.)
     * @returns {boolean}
     */
    canPerformAction(action) {
        if (!this.userPermissions) {
            return false;
        }
        
        const actionKey = `can_${action}`;
        return this.userPermissions[actionKey] || false;
    }
    
    /**
     * Get all user permissions
     * 
     * @returns {Object|null}
     */
    getUserPermissions() {
        return this.userPermissions;
    }
    
    /**
     * Check if CSS selector matches allowed selector pattern
     * 
     * @param {string} elementSelector Element selector to check
     * @param {string} allowedSelector Allowed selector pattern
     * @returns {boolean}
     */
    selectorMatches(elementSelector, allowedSelector) {
        // Exact match
        if (elementSelector === allowedSelector) {
            return true;
        }
        
        // Wildcard match
        if (allowedSelector === '*') {
            return true;
        }
        
        // Parent selector match (element is child of allowed selector)
        if (elementSelector.startsWith(allowedSelector)) {
            return true;
        }
        
        // Pattern matching for complex selectors
        try {
            const pattern = allowedSelector.replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(elementSelector);
        } catch (error) {
            console.warn('Invalid selector pattern:', allowedSelector);
            return false;
        }
    }
    
    /**
     * Cache permission result
     * 
     * @param {string} key Cache key
     * @param {boolean} value Permission value
     */
    cachePermission(key, value) {
        this.permissionCache.set(key, {
            value: value,
            timestamp: Date.now()
        });
    }
    
    /**
     * Cache user permissions in localStorage
     */
    cacheUserPermissions() {
        if (this.userPermissions) {
            const cacheData = {
                permissions: this.userPermissions,
                timestamp: Date.now(),
                userId: this.currentUserId
            };
            
            try {
                localStorage.setItem('woow_user_permissions', JSON.stringify(cacheData));
            } catch (error) {
                console.warn('Failed to cache user permissions:', error);
            }
        }
    }
    
    /**
     * Load user permissions from localStorage cache
     */
    loadCachedUserPermissions() {
        try {
            const cached = localStorage.getItem('woow_user_permissions');
            if (cached) {
                const cacheData = JSON.parse(cached);
                
                // Check if cache is valid and for current user
                if (cacheData.userId === this.currentUserId && 
                    Date.now() - cacheData.timestamp < this.options.cacheTimeout) {
                    this.userPermissions = cacheData.permissions;
                    return true;
                }
            }
        } catch (error) {
            console.warn('Failed to load cached permissions:', error);
        }
        
        return false;
    }
    
    /**
     * Clear permission cache
     */
    clearCache() {
        this.permissionCache.clear();
        localStorage.removeItem('woow_user_permissions');
    }
    
    /**
     * Refresh permissions from server
     */
    async refreshPermissions() {
        this.clearCache();
        await this.loadUserPermissions();
    }
    
    /**
     * Start cache cleanup interval
     */
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, cached] of this.permissionCache.entries()) {
                if (now - cached.timestamp > this.options.cacheTimeout) {
                    this.permissionCache.delete(key);
                }
            }
        }, this.options.cacheTimeout);
    }
    
    /**
     * Bind DOM events
     */
    bindEvents() {
        // Listen for permission changes
        document.addEventListener('woow-permissions-changed', () => {
            this.refreshPermissions();
        });
        
        // Listen for user changes
        document.addEventListener('woow-user-changed', (event) => {
            this.currentUserId = event.detail.userId;
            this.refreshPermissions();
        });
    }
    
    /**
     * Trigger permissions loaded event
     */
    triggerPermissionsLoaded() {
        const event = new CustomEvent('woow-permissions-loaded', {
            detail: {
                permissions: this.userPermissions,
                userId: this.currentUserId
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Make AJAX request to WordPress
     * 
     * @param {string} action WordPress AJAX action
     * @param {Object} data Request data
     * @returns {Promise<Object>}
     */
    async makeAjaxRequest(action, data = {}) {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('nonce', this.options.nonce);
        
        for (const [key, value] of Object.entries(data)) {
            formData.append(key, value);
        }
        
        const response = await fetch(this.options.ajaxUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    }
    
    /**
     * Create permission-aware element wrapper
     * 
     * @param {HTMLElement} element Element to wrap
     * @param {string} selector Element selector for permission check
     * @returns {Object} Wrapped element with permission methods
     */
    createPermissionAwareElement(element, selector) {
        return {
            element: element,
            selector: selector,
            
            async canEdit() {
                return await this.canEditElement(selector);
            },
            
            async enableEditing() {
                const canEdit = await this.canEditElement(selector);
                if (canEdit) {
                    element.classList.add('woow-editable');
                    element.setAttribute('data-woow-editable', 'true');
                } else {
                    element.classList.remove('woow-editable');
                    element.removeAttribute('data-woow-editable');
                }
                return canEdit;
            },
            
            async disableEditing() {
                element.classList.remove('woow-editable');
                element.removeAttribute('data-woow-editable');
            }
        };
    }
    
    /**
     * Apply permissions to multiple elements
     * 
     * @param {Array} elements Array of {element, selector} objects
     */
    async applyPermissionsToElements(elements) {
        const promises = elements.map(async ({element, selector}) => {
            const canEdit = await this.canEditElement(selector);
            
            if (canEdit) {
                element.classList.add('woow-editable');
                element.setAttribute('data-woow-editable', 'true');
            } else {
                element.classList.remove('woow-editable');
                element.removeAttribute('data-woow-editable');
                
                // Add visual indicator for non-editable elements
                element.classList.add('woow-non-editable');
            }
            
            return {element, selector, canEdit};
        });
        
        return await Promise.all(promises);
    }
    
    /**
     * Get permission status for multiple elements
     * 
     * @param {Array<string>} selectors Array of CSS selectors
     * @returns {Promise<Object>} Object mapping selectors to permission status
     */
    async getMultiplePermissions(selectors) {
        const promises = selectors.map(async (selector) => {
            const canEdit = await this.canEditElement(selector);
            return {selector, canEdit};
        });
        
        const results = await Promise.all(promises);
        const permissions = {};
        
        results.forEach(({selector, canEdit}) => {
            permissions[selector] = canEdit;
        });
        
        return permissions;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermissionManager;
} else if (typeof window !== 'undefined') {
    window.PermissionManager = PermissionManager;
}