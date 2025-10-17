/**
 * Permissions Interface - Visual permissions management interface
 * 
 * Provides visual permissions matrix, bulk permissions assignment,
 * and permission templates for typical roles
 */
class PermissionsInterface {
    constructor(options = {}) {
        this.options = {
            containerId: options.containerId || 'permissions-interface',
            ajaxUrl: options.ajaxUrl || '/wp-admin/admin-ajax.php',
            nonce: options.nonce || '',
            ...options
        };
        
        this.permissionController = options.permissionController || null;
        this.users = [];
        this.roles = [];
        this.permissions = {};
        this.templates = {};
        this.selectedUsers = new Set();
        
        this.init();
    }
    
    /**
     * Initialize the permissions interface
     */
    init() {
        this.createInterface();
        this.loadData();
        this.bindEvents();
    }
    
    /**
     * Create the main interface structure
     */
    createInterface() {
        const container = document.getElementById(this.options.containerId);
        if (!container) {
            console.error('Permissions interface container not found');
            return;
        }
        
        container.innerHTML = `
            <div class="permissions-interface">
                <div class="permissions-header">
                    <h2>Zarządzanie Uprawnieniami</h2>
                    <div class="permissions-actions">
                        <button id="bulk-assign-btn" class="button button-secondary">
                            Przypisz Masowo
                        </button>
                        <button id="apply-template-btn" class="button button-secondary">
                            Zastosuj Szablon
                        </button>
                        <button id="save-permissions-btn" class="button button-primary">
                            Zapisz Zmiany
                        </button>
                    </div>
                </div>
                
                <div class="permissions-tabs">
                    <button class="tab-button active" data-tab="matrix">Macierz Uprawnień</button>
                    <button class="tab-button" data-tab="templates">Szablony</button>
                    <button class="tab-button" data-tab="elements">Elementy</button>
                </div>
                
                <div class="permissions-content">
                    <div id="matrix-tab" class="tab-content active">
                        <div class="permissions-filters">
                            <div class="filter-group">
                                <label>Filtruj użytkowników:</label>
                                <select id="role-filter">
                                    <option value="">Wszystkie role</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>Szukaj:</label>
                                <input type="text" id="user-search" placeholder="Nazwa użytkownika...">
                            </div>
                        </div>
                        
                        <div class="permissions-matrix-container">
                            <table id="permissions-matrix" class="permissions-matrix">
                                <thead>
                                    <tr>
                                        <th class="user-column">
                                            <input type="checkbox" id="select-all-users">
                                            Użytkownik
                                        </th>
                                        <th>Edycja Kolorów</th>
                                        <th>Edycja Układu</th>
                                        <th>Zarządzanie Schematami</th>
                                        <th>Edycja Kodu</th>
                                        <th>Zarządzanie Uprawnieniami</th>
                                        <th>Akcje</th>
                                    </tr>
                                </thead>
                                <tbody id="permissions-matrix-body">
                                    <!-- Dynamic content -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div id="templates-tab" class="tab-content">
                        <div class="templates-section">
                            <h3>Szablony Uprawnień</h3>
                            <div id="permission-templates" class="permission-templates">
                                <!-- Dynamic content -->
                            </div>
                        </div>
                    </div>
                    
                    <div id="elements-tab" class="tab-content">
                        <div class="elements-section">
                            <h3>Uprawnienia do Elementów</h3>
                            <div class="element-permissions-container">
                                <div class="element-selector">
                                    <label>Selektor elementu:</label>
                                    <input type="text" id="element-selector-input" placeholder="#adminmenu, .wp-toolbar, etc.">
                                    <button id="add-element-btn" class="button">Dodaj Element</button>
                                </div>
                                <div id="element-permissions-list" class="element-permissions-list">
                                    <!-- Dynamic content -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Bulk Assignment Modal -->
                <div id="bulk-assignment-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Przypisanie Masowe Uprawnień</h3>
                            <span class="close">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="bulk-permissions">
                                <label><input type="checkbox" name="bulk_can_edit_colors"> Edycja Kolorów</label>
                                <label><input type="checkbox" name="bulk_can_edit_layout"> Edycja Układu</label>
                                <label><input type="checkbox" name="bulk_can_manage_schemas"> Zarządzanie Schematami</label>
                                <label><input type="checkbox" name="bulk_can_edit_code"> Edycja Kodu</label>
                                <label><input type="checkbox" name="bulk_can_manage_permissions"> Zarządzanie Uprawnieniami</label>
                            </div>
                            <div class="bulk-actions">
                                <button id="apply-bulk-permissions" class="button button-primary">Zastosuj</button>
                                <button id="cancel-bulk-assignment" class="button">Anuluj</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Template Selection Modal -->
                <div id="template-selection-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Wybierz Szablon Uprawnień</h3>
                            <span class="close">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div id="template-selection-list" class="template-selection-list">
                                <!-- Dynamic content -->
                            </div>
                            <div class="template-actions">
                                <button id="apply-template" class="button button-primary">Zastosuj Szablon</button>
                                <button id="cancel-template-selection" class="button">Anuluj</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Load users, roles, and permissions data
     */
    async loadData() {
        try {
            // Load users and roles
            await this.loadUsers();
            await this.loadRoles();
            await this.loadPermissions();
            await this.loadTemplates();
            
            // Render the interface
            this.renderMatrix();
            this.renderTemplates();
            this.renderElementPermissions();
            
        } catch (error) {
            console.error('Error loading permissions data:', error);
            this.showError('Błąd podczas ładowania danych uprawnień');
        }
    }
    
    /**
     * Load users from WordPress
     */
    async loadUsers() {
        const response = await this.makeAjaxRequest('get_users_for_permissions');
        if (response.success) {
            this.users = response.data;
        }
    }
    
    /**
     * Load WordPress roles
     */
    async loadRoles() {
        const response = await this.makeAjaxRequest('get_wordpress_roles');
        if (response.success) {
            this.roles = response.data;
            this.populateRoleFilter();
        }
    }
    
    /**
     * Load permissions for all users
     */
    async loadPermissions() {
        const response = await this.makeAjaxRequest('get_all_user_permissions');
        if (response.success) {
            this.permissions = response.data;
        }
    }
    
    /**
     * Load permission templates
     */
    async loadTemplates() {
        const response = await this.makeAjaxRequest('get_permission_templates');
        if (response.success) {
            this.templates = response.data;
        }
    }
    
    /**
     * Render the permissions matrix
     */
    renderMatrix() {
        const tbody = document.getElementById('permissions-matrix-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.users.forEach(user => {
            const userPermissions = this.permissions[user.id] || {};
            const row = this.createUserPermissionRow(user, userPermissions);
            tbody.appendChild(row);
        });
    }
    
    /**
     * Create a permission row for a user
     */
    createUserPermissionRow(user, permissions) {
        const row = document.createElement('tr');
        row.dataset.userId = user.id;
        
        const rolesBadges = user.roles.map(role => 
            `<span class="role-badge role-${role}">${role}</span>`
        ).join('');
        
        row.innerHTML = `
            <td class="user-column">
                <input type="checkbox" class="user-select" value="${user.id}">
                <div class="user-info">
                    <strong>${user.display_name}</strong>
                    <div class="user-roles">${rolesBadges}</div>
                </div>
            </td>
            <td>
                <input type="checkbox" class="permission-checkbox" 
                       data-permission="can_edit_colors" 
                       ${permissions.can_edit_colors ? 'checked' : ''}>
            </td>
            <td>
                <input type="checkbox" class="permission-checkbox" 
                       data-permission="can_edit_layout" 
                       ${permissions.can_edit_layout ? 'checked' : ''}>
            </td>
            <td>
                <input type="checkbox" class="permission-checkbox" 
                       data-permission="can_manage_schemas" 
                       ${permissions.can_manage_schemas ? 'checked' : ''}>
            </td>
            <td>
                <input type="checkbox" class="permission-checkbox" 
                       data-permission="can_edit_code" 
                       ${permissions.can_edit_code ? 'checked' : ''}>
            </td>
            <td>
                <input type="checkbox" class="permission-checkbox" 
                       data-permission="can_manage_permissions" 
                       ${permissions.can_manage_permissions ? 'checked' : ''}>
            </td>
            <td>
                <button class="button button-small edit-user-permissions" data-user-id="${user.id}">
                    Edytuj
                </button>
                <button class="button button-small reset-user-permissions" data-user-id="${user.id}">
                    Reset
                </button>
            </td>
        `;
        
        return row;
    }
    
    /**
     * Render permission templates
     */
    renderTemplates() {
        const container = document.getElementById('permission-templates');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(this.templates).forEach(([templateId, template]) => {
            const templateCard = this.createTemplateCard(templateId, template);
            container.appendChild(templateCard);
        });
    }
    
    /**
     * Create a template card
     */
    createTemplateCard(templateId, template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = templateId;
        
        const permissionsList = Object.entries(template.permissions)
            .filter(([key, value]) => value === true)
            .map(([key]) => key.replace('can_', '').replace('_', ' '))
            .join(', ');
        
        card.innerHTML = `
            <div class="template-header">
                <h4>${template.name}</h4>
                <div class="template-actions">
                    <button class="button button-small apply-template-btn" data-template-id="${templateId}">
                        Zastosuj
                    </button>
                </div>
            </div>
            <div class="template-description">
                ${template.description}
            </div>
            <div class="template-permissions">
                <strong>Uprawnienia:</strong> ${permissionsList}
            </div>
            <div class="template-elements">
                <strong>Elementy:</strong> ${template.permissions.allowed_elements.join(', ')}
            </div>
        `;
        
        return card;
    }
    
    /**
     * Render element permissions
     */
    renderElementPermissions() {
        const container = document.getElementById('element-permissions-list');
        if (!container) return;
        
        // Get all unique element selectors from permissions
        const elementSelectors = new Set();
        Object.values(this.permissions).forEach(userPerms => {
            if (userPerms.element_overrides) {
                Object.keys(userPerms.element_overrides).forEach(selector => {
                    elementSelectors.add(selector);
                });
            }
        });
        
        container.innerHTML = '';
        
        elementSelectors.forEach(selector => {
            const elementRow = this.createElementPermissionRow(selector);
            container.appendChild(elementRow);
        });
    }
    
    /**
     * Create element permission row
     */
    createElementPermissionRow(selector) {
        const row = document.createElement('div');
        row.className = 'element-permission-row';
        row.dataset.selector = selector;
        
        row.innerHTML = `
            <div class="element-selector-display">
                <code>${selector}</code>
            </div>
            <div class="element-users">
                ${this.users.map(user => {
                    const userPerms = this.permissions[user.id] || {};
                    const elementPerms = userPerms.element_overrides || {};
                    const canEdit = elementPerms[selector] || false;
                    
                    return `
                        <label class="element-user-permission">
                            <input type="checkbox" 
                                   data-user-id="${user.id}" 
                                   data-selector="${selector}"
                                   ${canEdit ? 'checked' : ''}>
                            ${user.display_name}
                        </label>
                    `;
                }).join('')}
            </div>
            <div class="element-actions">
                <button class="button button-small remove-element" data-selector="${selector}">
                    Usuń
                </button>
            </div>
        `;
        
        return row;
    }
    
    /**
     * Populate role filter dropdown
     */
    populateRoleFilter() {
        const select = document.getElementById('role-filter');
        if (!select) return;
        
        Object.entries(this.roles).forEach(([roleKey, roleName]) => {
            const option = document.createElement('option');
            option.value = roleKey;
            option.textContent = roleName;
            select.appendChild(option);
        });
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Select all users checkbox
        const selectAllCheckbox = document.getElementById('select-all-users');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleAllUsers(e.target.checked);
            });
        }
        
        // User selection checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('user-select')) {
                this.toggleUserSelection(e.target.value, e.target.checked);
            }
        });
        
        // Permission checkboxes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('permission-checkbox')) {
                this.updatePermission(e.target);
            }
        });
        
        // Bulk assignment
        document.getElementById('bulk-assign-btn')?.addEventListener('click', () => {
            this.showBulkAssignmentModal();
        });
        
        // Template application
        document.getElementById('apply-template-btn')?.addEventListener('click', () => {
            this.showTemplateSelectionModal();
        });
        
        // Save permissions
        document.getElementById('save-permissions-btn')?.addEventListener('click', () => {
            this.saveAllPermissions();
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // Element selector input
        document.getElementById('add-element-btn')?.addEventListener('click', () => {
            this.addElementSelector();
        });
        
        // Search functionality
        document.getElementById('user-search')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });
        
        // Role filter
        document.getElementById('role-filter')?.addEventListener('change', (e) => {
            this.filterUsersByRole(e.target.value);
        });
    }
    
    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
    
    /**
     * Toggle all users selection
     */
    toggleAllUsers(checked) {
        document.querySelectorAll('.user-select').forEach(checkbox => {
            checkbox.checked = checked;
            this.toggleUserSelection(checkbox.value, checked);
        });
    }
    
    /**
     * Toggle individual user selection
     */
    toggleUserSelection(userId, selected) {
        if (selected) {
            this.selectedUsers.add(userId);
        } else {
            this.selectedUsers.delete(userId);
        }
        
        // Update bulk assignment button state
        const bulkBtn = document.getElementById('bulk-assign-btn');
        if (bulkBtn) {
            bulkBtn.disabled = this.selectedUsers.size === 0;
        }
    }
    
    /**
     * Update permission for a user
     */
    updatePermission(checkbox) {
        const row = checkbox.closest('tr');
        const userId = row.dataset.userId;
        const permission = checkbox.dataset.permission;
        const value = checkbox.checked;
        
        if (!this.permissions[userId]) {
            this.permissions[userId] = {};
        }
        
        this.permissions[userId][permission] = value;
        
        // Mark as changed
        row.classList.add('changed');
    }
    
    /**
     * Show bulk assignment modal
     */
    showBulkAssignmentModal() {
        if (this.selectedUsers.size === 0) {
            this.showError('Wybierz użytkowników do przypisania uprawnień');
            return;
        }
        
        const modal = document.getElementById('bulk-assignment-modal');
        modal.style.display = 'block';
        
        // Bind modal events
        document.getElementById('apply-bulk-permissions')?.addEventListener('click', () => {
            this.applyBulkPermissions();
        });
        
        document.getElementById('cancel-bulk-assignment')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    /**
     * Apply bulk permissions to selected users
     */
    applyBulkPermissions() {
        const modal = document.getElementById('bulk-assignment-modal');
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        
        const bulkPermissions = {};
        checkboxes.forEach(checkbox => {
            const permission = checkbox.name.replace('bulk_', '');
            bulkPermissions[permission] = checkbox.checked;
        });
        
        // Apply to selected users
        this.selectedUsers.forEach(userId => {
            if (!this.permissions[userId]) {
                this.permissions[userId] = {};
            }
            
            Object.assign(this.permissions[userId], bulkPermissions);
        });
        
        // Re-render matrix
        this.renderMatrix();
        
        // Close modal
        modal.style.display = 'none';
        
        this.showSuccess(`Uprawnienia zostały przypisane do ${this.selectedUsers.size} użytkowników`);
    }
    
    /**
     * Show template selection modal
     */
    showTemplateSelectionModal() {
        if (this.selectedUsers.size === 0) {
            this.showError('Wybierz użytkowników do zastosowania szablonu');
            return;
        }
        
        const modal = document.getElementById('template-selection-modal');
        const templateList = document.getElementById('template-selection-list');
        
        // Populate template list
        templateList.innerHTML = '';
        Object.entries(this.templates).forEach(([templateId, template]) => {
            const templateOption = document.createElement('div');
            templateOption.className = 'template-option';
            templateOption.innerHTML = `
                <label>
                    <input type="radio" name="selected_template" value="${templateId}">
                    <strong>${template.name}</strong>
                    <p>${template.description}</p>
                </label>
            `;
            templateList.appendChild(templateOption);
        });
        
        modal.style.display = 'block';
        
        // Bind modal events
        document.getElementById('apply-template')?.addEventListener('click', () => {
            this.applyTemplate();
        });
        
        document.getElementById('cancel-template-selection')?.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    /**
     * Apply selected template to selected users
     */
    applyTemplate() {
        const modal = document.getElementById('template-selection-modal');
        const selectedTemplate = modal.querySelector('input[name="selected_template"]:checked');
        
        if (!selectedTemplate) {
            this.showError('Wybierz szablon do zastosowania');
            return;
        }
        
        const templateId = selectedTemplate.value;
        const template = this.templates[templateId];
        
        // Apply template to selected users
        this.selectedUsers.forEach(userId => {
            if (!this.permissions[userId]) {
                this.permissions[userId] = {};
            }
            
            Object.assign(this.permissions[userId], template.permissions);
        });
        
        // Re-render matrix
        this.renderMatrix();
        
        // Close modal
        modal.style.display = 'none';
        
        this.showSuccess(`Szablon "${template.name}" został zastosowany do ${this.selectedUsers.size} użytkowników`);
    }
    
    /**
     * Add new element selector
     */
    addElementSelector() {
        const input = document.getElementById('element-selector-input');
        const selector = input.value.trim();
        
        if (!selector) {
            this.showError('Wprowadź selektor elementu');
            return;
        }
        
        // Add to element permissions
        this.users.forEach(user => {
            if (!this.permissions[user.id]) {
                this.permissions[user.id] = {};
            }
            if (!this.permissions[user.id].element_overrides) {
                this.permissions[user.id].element_overrides = {};
            }
            this.permissions[user.id].element_overrides[selector] = false;
        });
        
        // Re-render element permissions
        this.renderElementPermissions();
        
        // Clear input
        input.value = '';
        
        this.showSuccess(`Element "${selector}" został dodany`);
    }
    
    /**
     * Filter users by search term
     */
    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#permissions-matrix-body tr');
        
        rows.forEach(row => {
            const userInfo = row.querySelector('.user-info strong').textContent.toLowerCase();
            const matches = userInfo.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }
    
    /**
     * Filter users by role
     */
    filterUsersByRole(role) {
        const rows = document.querySelectorAll('#permissions-matrix-body tr');
        
        rows.forEach(row => {
            if (!role) {
                row.style.display = '';
                return;
            }
            
            const roleBadges = row.querySelectorAll('.role-badge');
            const hasRole = Array.from(roleBadges).some(badge => 
                badge.classList.contains(`role-${role}`)
            );
            row.style.display = hasRole ? '' : 'none';
        });
    }
    
    /**
     * Save all permissions changes
     */
    async saveAllPermissions() {
        try {
            const response = await this.makeAjaxRequest('save_all_permissions', {
                permissions: this.permissions
            });
            
            if (response.success) {
                this.showSuccess('Uprawnienia zostały zapisane');
                
                // Remove changed markers
                document.querySelectorAll('.changed').forEach(element => {
                    element.classList.remove('changed');
                });
            } else {
                this.showError('Błąd podczas zapisywania uprawnień');
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            this.showError('Błąd podczas zapisywania uprawnień');
        }
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    /**
     * Make AJAX request to WordPress
     */
    async makeAjaxRequest(action, data = {}) {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('nonce', this.options.nonce);
        
        for (const [key, value] of Object.entries(data)) {
            formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PermissionsInterface;
} else if (typeof window !== 'undefined') {
    window.PermissionsInterface = PermissionsInterface;
}