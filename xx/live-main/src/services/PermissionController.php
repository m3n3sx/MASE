<?php

namespace WoowAdminStyler\Services;

/**
 * PermissionController - Granular permissions system for WordPress Admin Editor
 * 
 * Integrates with WordPress capabilities system and provides per-element editing permissions
 * and role-based access control for schemas.
 */
class PermissionController {
    
    private $permission_cache = [];
    private $role_permissions = [];
    private $element_permissions = [];
    
    /**
     * WordPress capabilities mapped to admin editor permissions
     */
    private $capability_map = [
        'edit_admin_panel' => 'manage_options',
        'edit_admin_colors' => 'edit_theme_options',
        'edit_admin_layout' => 'edit_theme_options',
        'manage_admin_schemas' => 'manage_options',
        'edit_admin_code' => 'edit_themes',
        'manage_permissions' => 'manage_options'
    ];
    
    /**
     * Default element permissions for different roles
     */
    private $default_element_permissions = [
        'administrator' => ['*'], // All elements
        'editor' => [
            '#adminmenu',
            '.wp-toolbar',
            '#wpcontent',
            '.postbox'
        ],
        'author' => [
            '#adminmenu .wp-menu-name',
            '.wp-toolbar #wp-admin-bar-my-account'
        ],
        'contributor' => [
            '#adminmenu .wp-menu-name'
        ]
    ];
    
    public function __construct() {
        $this->init_hooks();
        $this->load_permissions();
    }
    
    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        add_action('init', [$this, 'register_capabilities']);
        add_action('wp_ajax_check_edit_permission', [$this, 'ajax_check_edit_permission']);
        add_action('wp_ajax_get_user_permissions', [$this, 'ajax_get_user_permissions']);
        add_action('wp_ajax_update_user_permissions', [$this, 'ajax_update_user_permissions']);
        
        // Additional AJAX endpoints for permissions interface
        add_action('wp_ajax_get_users_for_permissions', [$this, 'ajax_get_users_for_permissions']);
        add_action('wp_ajax_get_wordpress_roles', [$this, 'ajax_get_wordpress_roles']);
        add_action('wp_ajax_get_all_user_permissions', [$this, 'ajax_get_all_user_permissions']);
        add_action('wp_ajax_get_permission_templates', [$this, 'ajax_get_permission_templates']);
        add_action('wp_ajax_save_all_permissions', [$this, 'ajax_save_all_permissions']);
    }
    
    /**
     * Register custom capabilities with WordPress
     */
    public function register_capabilities() {
        $role = get_role('administrator');
        if ($role) {
            foreach ($this->capability_map as $custom_cap => $wp_cap) {
                $role->add_cap($custom_cap);
            }
        }
    }
    
    /**
     * Load permissions from database
     */
    private function load_permissions() {
        $this->role_permissions = get_option('woow_admin_role_permissions', []);
        $this->element_permissions = get_option('woow_admin_element_permissions', []);
        
        // Initialize default permissions if empty
        if (empty($this->role_permissions)) {
            $this->init_default_permissions();
        }
    }
    
    /**
     * Initialize default permissions for WordPress roles
     */
    private function init_default_permissions() {
        global $wp_roles;
        
        foreach ($wp_roles->roles as $role_name => $role_info) {
            $this->role_permissions[$role_name] = [
                'can_edit_colors' => in_array($role_name, ['administrator', 'editor']),
                'can_edit_layout' => in_array($role_name, ['administrator']),
                'can_manage_schemas' => in_array($role_name, ['administrator']),
                'can_edit_code' => in_array($role_name, ['administrator']),
                'can_manage_permissions' => in_array($role_name, ['administrator']),
                'allowed_elements' => $this->default_element_permissions[$role_name] ?? []
            ];
        }
        
        $this->save_permissions();
    }
    
    /**
     * Check if user can edit specific element
     * 
     * @param int $user_id User ID
     * @param string $element_selector CSS selector of element
     * @return bool
     */
    public function can_user_edit_element($user_id, $element_selector) {
        $cache_key = "user_{$user_id}_element_{$element_selector}";
        
        if (isset($this->permission_cache[$cache_key])) {
            return $this->permission_cache[$cache_key];
        }
        
        $user = get_user_by('id', $user_id);
        if (!$user) {
            return false;
        }
        
        // Check if user has general edit permission
        if (!$this->can_user_edit($user_id)) {
            $this->permission_cache[$cache_key] = false;
            return false;
        }
        
        // Get user roles
        $user_roles = $user->roles;
        $can_edit = false;
        
        foreach ($user_roles as $role) {
            $role_permissions = $this->role_permissions[$role] ?? [];
            $allowed_elements = $role_permissions['allowed_elements'] ?? [];
            
            // Check if user can edit all elements (*)
            if (in_array('*', $allowed_elements)) {
                $can_edit = true;
                break;
            }
            
            // Check specific element permissions
            foreach ($allowed_elements as $allowed_selector) {
                if ($this->selector_matches($element_selector, $allowed_selector)) {
                    $can_edit = true;
                    break 2;
                }
            }
        }
        
        // Check user-specific element permissions
        $user_element_permissions = $this->element_permissions[$user_id] ?? [];
        if (isset($user_element_permissions[$element_selector])) {
            $can_edit = $user_element_permissions[$element_selector];
        }
        
        $this->permission_cache[$cache_key] = $can_edit;
        return $can_edit;
    }
    
    /**
     * Check if user has general admin panel edit permission
     * 
     * @param int $user_id User ID
     * @return bool
     */
    public function can_user_edit($user_id) {
        $cache_key = "user_{$user_id}_can_edit";
        
        if (isset($this->permission_cache[$cache_key])) {
            return $this->permission_cache[$cache_key];
        }
        
        // Check custom capability first, fallback to WordPress capability
        $can_edit = user_can($user_id, 'edit_admin_panel') || 
                   user_can($user_id, $this->capability_map['edit_admin_panel']);
        $this->permission_cache[$cache_key] = $can_edit;
        
        return $can_edit;
    }
    
    /**
     * Check if user can manage schemas
     * 
     * @param int $user_id User ID
     * @return bool
     */
    public function can_user_manage_schemas($user_id) {
        return user_can($user_id, 'manage_admin_schemas') || 
               user_can($user_id, $this->capability_map['manage_admin_schemas']);
    }
    
    /**
     * Check if user can edit custom code (CSS/JS)
     * 
     * @param int $user_id User ID
     * @return bool
     */
    public function can_user_edit_code($user_id) {
        return user_can($user_id, 'edit_admin_code') || 
               user_can($user_id, $this->capability_map['edit_admin_code']);
    }
    
    /**
     * Check if user can manage permissions
     * 
     * @param int $user_id User ID
     * @return bool
     */
    public function can_user_manage_permissions($user_id) {
        return user_can($user_id, 'manage_permissions') || 
               user_can($user_id, $this->capability_map['manage_permissions']);
    }
    
    /**
     * Get all permissions for a user
     * 
     * @param int $user_id User ID
     * @return array
     */
    public function get_user_permissions($user_id) {
        $user = get_user_by('id', $user_id);
        if (!$user) {
            return [];
        }
        
        $permissions = [
            'can_edit' => $this->can_user_edit($user_id),
            'can_edit_colors' => false,
            'can_edit_layout' => false,
            'can_manage_schemas' => $this->can_user_manage_schemas($user_id),
            'can_edit_code' => $this->can_user_edit_code($user_id),
            'can_manage_permissions' => $this->can_user_manage_permissions($user_id),
            'allowed_elements' => []
        ];
        
        // Aggregate permissions from all user roles
        foreach ($user->roles as $role) {
            $role_permissions = $this->role_permissions[$role] ?? [];
            
            if ($role_permissions['can_edit_colors'] ?? false) {
                $permissions['can_edit_colors'] = true;
            }
            
            if ($role_permissions['can_edit_layout'] ?? false) {
                $permissions['can_edit_layout'] = true;
            }
            
            $allowed_elements = $role_permissions['allowed_elements'] ?? [];
            $permissions['allowed_elements'] = array_merge(
                $permissions['allowed_elements'], 
                $allowed_elements
            );
        }
        
        // Apply user-specific overrides
        $user_element_permissions = $this->element_permissions[$user_id] ?? [];
        $permissions['element_overrides'] = $user_element_permissions;
        
        return $permissions;
    }
    
    /**
     * Update permissions for a role
     * 
     * @param string $role Role name
     * @param array $permissions Permissions array
     * @return bool
     */
    public function update_role_permissions($role, $permissions) {
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            return false;
        }
        
        $this->role_permissions[$role] = array_merge(
            $this->role_permissions[$role] ?? [],
            $permissions
        );
        
        $this->save_permissions();
        $this->clear_permission_cache();
        
        return true;
    }
    
    /**
     * Update element permissions for a specific user
     * 
     * @param int $user_id User ID
     * @param string $element_selector CSS selector
     * @param bool $can_edit Permission value
     * @return bool
     */
    public function update_user_element_permission($user_id, $element_selector, $can_edit) {
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            return false;
        }
        
        if (!isset($this->element_permissions[$user_id])) {
            $this->element_permissions[$user_id] = [];
        }
        
        $this->element_permissions[$user_id][$element_selector] = $can_edit;
        
        $this->save_permissions();
        $this->clear_permission_cache();
        
        return true;
    }
    
    /**
     * Get schema permissions for user
     * 
     * @param int $user_id User ID
     * @param string $schema_id Schema ID
     * @return array
     */
    public function get_schema_permissions($user_id, $schema_id) {
        $schema_permissions = get_option('woow_admin_schema_permissions', []);
        $user_schema_perms = $schema_permissions[$schema_id][$user_id] ?? [];
        
        $default_perms = [
            'can_view' => $this->can_user_edit($user_id),
            'can_edit' => $this->can_user_manage_schemas($user_id),
            'can_delete' => $this->can_user_manage_schemas($user_id),
            'can_share' => $this->can_user_manage_schemas($user_id)
        ];
        
        return array_merge($default_perms, $user_schema_perms);
    }
    
    /**
     * Set schema permissions for user
     * 
     * @param string $schema_id Schema ID
     * @param int $user_id User ID
     * @param array $permissions Permissions array
     * @return bool
     */
    public function set_schema_permissions($schema_id, $user_id, $permissions) {
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            return false;
        }
        
        $schema_permissions = get_option('woow_admin_schema_permissions', []);
        
        if (!isset($schema_permissions[$schema_id])) {
            $schema_permissions[$schema_id] = [];
        }
        
        $schema_permissions[$schema_id][$user_id] = $permissions;
        
        return update_option('woow_admin_schema_permissions', $schema_permissions);
    }
    
    /**
     * Check if CSS selector matches allowed selector pattern
     * 
     * @param string $element_selector Element selector to check
     * @param string $allowed_selector Allowed selector pattern
     * @return bool
     */
    private function selector_matches($element_selector, $allowed_selector) {
        // Exact match
        if ($element_selector === $allowed_selector) {
            return true;
        }
        
        // Wildcard match
        if ($allowed_selector === '*') {
            return true;
        }
        
        // Parent selector match (element is child of allowed selector)
        if (strpos($element_selector, $allowed_selector) === 0) {
            return true;
        }
        
        // Pattern matching for complex selectors
        $pattern = str_replace('*', '.*', preg_quote($allowed_selector, '/'));
        return preg_match("/^{$pattern}$/", $element_selector);
    }
    
    /**
     * Save permissions to database
     */
    private function save_permissions() {
        update_option('woow_admin_role_permissions', $this->role_permissions);
        update_option('woow_admin_element_permissions', $this->element_permissions);
    }
    
    /**
     * Clear permission cache
     */
    private function clear_permission_cache() {
        $this->permission_cache = [];
    }
    
    /**
     * AJAX handler for checking edit permissions
     */
    public function ajax_check_edit_permission() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        $element_selector = sanitize_text_field($_POST['element_selector'] ?? '');
        $user_id = get_current_user_id();
        
        $can_edit = $this->can_user_edit_element($user_id, $element_selector);
        
        wp_send_json_success([
            'can_edit' => $can_edit,
            'element_selector' => $element_selector
        ]);
    }
    
    /**
     * AJAX handler for getting user permissions
     */
    public function ajax_get_user_permissions() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        $user_id = intval($_POST['user_id'] ?? get_current_user_id());
        
        if (!current_user_can('manage_permissions') && $user_id !== get_current_user_id()) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $permissions = $this->get_user_permissions($user_id);
        
        wp_send_json_success($permissions);
    }
    
    /**
     * AJAX handler for updating user permissions
     */
    public function ajax_update_user_permissions() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_permissions')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $user_id = intval($_POST['user_id'] ?? 0);
        $permissions = $_POST['permissions'] ?? [];
        
        // Sanitize permissions data
        $sanitized_permissions = [];
        foreach ($permissions as $key => $value) {
            $sanitized_key = sanitize_key($key);
            if (is_bool($value) || is_array($value)) {
                $sanitized_permissions[$sanitized_key] = $value;
            }
        }
        
        $success = $this->update_user_element_permission(
            $user_id, 
            $sanitized_permissions['element_selector'] ?? '', 
            $sanitized_permissions['can_edit'] ?? false
        );
        
        if ($success) {
            wp_send_json_success('Permissions updated successfully');
        } else {
            wp_send_json_error('Failed to update permissions');
        }
    }
    
    /**
     * Get permission templates for common roles
     * 
     * @return array
     */
    public function get_permission_templates() {
        return [
            'full_access' => [
                'name' => 'Full Access',
                'description' => 'Complete access to all admin editor features',
                'permissions' => [
                    'can_edit_colors' => true,
                    'can_edit_layout' => true,
                    'can_manage_schemas' => true,
                    'can_edit_code' => true,
                    'can_manage_permissions' => true,
                    'allowed_elements' => ['*']
                ]
            ],
            'design_only' => [
                'name' => 'Design Only',
                'description' => 'Can edit colors and basic styling',
                'permissions' => [
                    'can_edit_colors' => true,
                    'can_edit_layout' => false,
                    'can_manage_schemas' => false,
                    'can_edit_code' => false,
                    'can_manage_permissions' => false,
                    'allowed_elements' => [
                        '#adminmenu',
                        '.wp-toolbar',
                        '#wpcontent .postbox'
                    ]
                ]
            ],
            'layout_only' => [
                'name' => 'Layout Only',
                'description' => 'Can modify layout and positioning',
                'permissions' => [
                    'can_edit_colors' => false,
                    'can_edit_layout' => true,
                    'can_manage_schemas' => false,
                    'can_edit_code' => false,
                    'can_manage_permissions' => false,
                    'allowed_elements' => [
                        '#adminmenu',
                        '#wpcontent',
                        '.postbox'
                    ]
                ]
            ],
            'read_only' => [
                'name' => 'Read Only',
                'description' => 'Can view but not edit',
                'permissions' => [
                    'can_edit_colors' => false,
                    'can_edit_layout' => false,
                    'can_manage_schemas' => false,
                    'can_edit_code' => false,
                    'can_manage_permissions' => false,
                    'allowed_elements' => []
                ]
            ]
        ];
    }
    
    /**
     * AJAX handler for getting users for permissions interface
     */
    public function ajax_get_users_for_permissions() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $users = get_users([
            'fields' => ['ID', 'display_name', 'user_login'],
            'meta_query' => [
                [
                    'key' => 'wp_capabilities',
                    'compare' => 'EXISTS'
                ]
            ]
        ]);
        
        $formatted_users = [];
        foreach ($users as $user) {
            $user_data = get_userdata($user->ID);
            $formatted_users[] = [
                'id' => $user->ID,
                'display_name' => $user->display_name,
                'user_login' => $user->user_login,
                'roles' => $user_data->roles
            ];
        }
        
        wp_send_json_success($formatted_users);
    }
    
    /**
     * AJAX handler for getting WordPress roles
     */
    public function ajax_get_wordpress_roles() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        global $wp_roles;
        $roles = [];
        
        foreach ($wp_roles->roles as $role_key => $role_info) {
            $roles[$role_key] = $role_info['name'];
        }
        
        wp_send_json_success($roles);
    }
    
    /**
     * AJAX handler for getting all user permissions
     */
    public function ajax_get_all_user_permissions() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $users = get_users(['fields' => 'ID']);
        $all_permissions = [];
        
        foreach ($users as $user_id) {
            $all_permissions[$user_id] = $this->get_user_permissions($user_id);
        }
        
        wp_send_json_success($all_permissions);
    }
    
    /**
     * AJAX handler for getting permission templates
     */
    public function ajax_get_permission_templates() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $templates = $this->get_permission_templates();
        wp_send_json_success($templates);
    }
    
    /**
     * AJAX handler for saving all permissions
     */
    public function ajax_save_all_permissions() {
        check_ajax_referer('woow_admin_nonce', 'nonce');
        
        if (!$this->can_user_manage_permissions(get_current_user_id())) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $permissions_data = $_POST['permissions'] ?? '';
        if (empty($permissions_data)) {
            wp_send_json_error('No permissions data provided');
            return;
        }
        
        $permissions = json_decode(stripslashes($permissions_data), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error('Invalid permissions data format');
            return;
        }
        
        $success_count = 0;
        $error_count = 0;
        
        foreach ($permissions as $user_id => $user_permissions) {
            $user_id = intval($user_id);
            
            // Update role permissions if provided
            $user = get_userdata($user_id);
            if ($user && !empty($user->roles)) {
                foreach ($user->roles as $role) {
                    $role_permissions = [
                        'can_edit_colors' => $user_permissions['can_edit_colors'] ?? false,
                        'can_edit_layout' => $user_permissions['can_edit_layout'] ?? false,
                        'can_manage_schemas' => $user_permissions['can_manage_schemas'] ?? false,
                        'can_edit_code' => $user_permissions['can_edit_code'] ?? false,
                        'can_manage_permissions' => $user_permissions['can_manage_permissions'] ?? false,
                        'allowed_elements' => $user_permissions['allowed_elements'] ?? []
                    ];
                    
                    if ($this->update_role_permissions($role, $role_permissions)) {
                        $success_count++;
                    } else {
                        $error_count++;
                    }
                }
            }
            
            // Update element-specific permissions
            if (isset($user_permissions['element_overrides'])) {
                foreach ($user_permissions['element_overrides'] as $selector => $can_edit) {
                    if ($this->update_user_element_permission($user_id, $selector, $can_edit)) {
                        $success_count++;
                    } else {
                        $error_count++;
                    }
                }
            }
        }
        
        if ($error_count === 0) {
            wp_send_json_success([
                'message' => "Successfully updated permissions for {$success_count} items",
                'updated_count' => $success_count
            ]);
        } else {
            wp_send_json_success([
                'message' => "Updated {$success_count} items with {$error_count} errors",
                'updated_count' => $success_count,
                'error_count' => $error_count
            ]);
        }
    }
}