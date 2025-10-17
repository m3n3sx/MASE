<?php
/**
 * WordPress Compatibility Manager
 * 
 * Ensures proper WordPress hook integration, version compatibility,
 * and namespace conflict resolution
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - WordPress Compatibility
 */

namespace ModernAdminStyler\Services;

class WordPressCompatibilityManager {
    
    private $min_wp_version = '5.0';
    private $min_php_version = '7.4';
    private $compatibility_issues = [];
    private $hooks_registered = [];
    private $namespace_conflicts = [];
    
    public function __construct() {
        $this->init();
    }
    
    /**
     * Initialize WordPress compatibility checks and fixes
     */
    public function init() {
        // Run compatibility checks early
        add_action('plugins_loaded', [$this, 'checkCompatibility'], 1);
        
        // Ensure proper hook timing
        add_action('init', [$this, 'registerHooks'], 1);
        
        // Handle plugin conflicts
        add_action('plugins_loaded', [$this, 'handlePluginConflicts'], 999);
        
        // Add admin notices for compatibility issues
        add_action('admin_notices', [$this, 'displayCompatibilityNotices']);
        
        // Register activation/deactivation hooks properly
        $this->registerPluginLifecycleHooks();
        
        // Ensure proper multisite compatibility
        if (is_multisite()) {
            $this->initMultisiteCompatibility();
        }
        
        // Handle theme compatibility
        add_action('after_setup_theme', [$this, 'handleThemeCompatibility']);
        
        // Ensure Gutenberg/Block Editor compatibility
        add_action('enqueue_block_editor_assets', [$this, 'handleBlockEditorCompatibility']);
        
        // Handle REST API compatibility
        add_action('rest_api_init', [$this, 'handleRestApiCompatibility']);
    }
    
    /**
     * Check WordPress and PHP version compatibility
     */
    public function checkCompatibility() {
        global $wp_version;
        
        // Check WordPress version
        if (version_compare($wp_version, $this->min_wp_version, '<')) {
            $this->compatibility_issues[] = [
                'type' => 'wordpress_version',
                'message' => sprintf(
                    'WOOW Admin Styler requires WordPress %s or higher. You are running %s.',
                    $this->min_wp_version,
                    $wp_version
                ),
                'severity' => 'error'
            ];
        }
        
        // Check PHP version
        if (version_compare(PHP_VERSION, $this->min_php_version, '<')) {
            $this->compatibility_issues[] = [
                'type' => 'php_version',
                'message' => sprintf(
                    'WOOW Admin Styler requires PHP %s or higher. You are running %s.',
                    $this->min_php_version,
                    PHP_VERSION
                ),
                'severity' => 'error'
            ];
        }
        
        // Check required PHP extensions
        $required_extensions = ['json', 'mbstring'];
        foreach ($required_extensions as $extension) {
            if (!extension_loaded($extension)) {
                $this->compatibility_issues[] = [
                    'type' => 'php_extension',
                    'message' => sprintf(
                        'WOOW Admin Styler requires the PHP %s extension.',
                        $extension
                    ),
                    'severity' => 'error'
                ];
            }
        }
        
        // Check WordPress functions
        $required_functions = [
            'wp_enqueue_script',
            'wp_enqueue_style',
            'current_user_can',
            'wp_create_nonce',
            'wp_verify_nonce',
            'sanitize_text_field'
        ];
        
        foreach ($required_functions as $function) {
            if (!function_exists($function)) {
                $this->compatibility_issues[] = [
                    'type' => 'wordpress_function',
                    'message' => sprintf(
                        'Required WordPress function %s is not available.',
                        $function
                    ),
                    'severity' => 'error'
                ];
            }
        }
        
        // Check database compatibility
        $this->checkDatabaseCompatibility();
        
        // If critical errors exist, prevent plugin activation
        $critical_errors = array_filter($this->compatibility_issues, function($issue) {
            return $issue['severity'] === 'error';
        });
        
        if (!empty($critical_errors)) {
            add_action('admin_init', [$this, 'deactivatePlugin']);
        }
    }
    
    /**
     * Check database compatibility
     */
    private function checkDatabaseCompatibility() {
        global $wpdb;
        
        if (!$wpdb) {
            $this->compatibility_issues[] = [
                'type' => 'database',
                'message' => 'WordPress database connection is not available.',
                'severity' => 'error'
            ];
            return;
        }
        
        // Check database version
        $db_version = $wpdb->db_version();
        if (version_compare($db_version, '5.0', '<')) {
            $this->compatibility_issues[] = [
                'type' => 'database_version',
                'message' => sprintf(
                    'WOOW Admin Styler recommends MySQL 5.0 or higher. You are running %s.',
                    $db_version
                ),
                'severity' => 'warning'
            ];
        }
        
        // Check if options table exists
        $options_table = $wpdb->options;
        $table_exists = $wpdb->get_var("SHOW TABLES LIKE '$options_table'") === $options_table;
        
        if (!$table_exists) {
            $this->compatibility_issues[] = [
                'type' => 'database_table',
                'message' => 'WordPress options table is not accessible.',
                'severity' => 'error'
            ];
        }
    }
    
    /**
     * Register WordPress hooks with proper timing
     */
    public function registerHooks() {
        // Ensure hooks are registered at the right time
        $hooks = [
            'admin_enqueue_scripts' => 'enqueueAdminAssets',
            'wp_enqueue_scripts' => 'enqueueFrontendAssets',
            'admin_menu' => 'registerAdminMenu',
            'admin_head' => 'outputAdminStyles',
            'wp_head' => 'outputFrontendStyles',
            'admin_footer' => 'outputAdminScripts',
            'wp_footer' => 'outputFrontendScripts'
        ];
        
        foreach ($hooks as $hook => $callback) {
            if (!has_action($hook, $callback)) {
                add_action($hook, [$this, $callback]);
                $this->hooks_registered[] = $hook;
            }
        }
        
        // Register AJAX hooks
        $ajax_actions = [
            'mas_save_live_settings',
            'mas_get_live_settings',
            'mas_live_preview',
            'mas_v2_save_settings',
            'mas_v2_get_settings',
            'mas_v2_clear_cache',
            'mas_log_error'
        ];
        
        foreach ($ajax_actions as $action) {
            if (!has_action("wp_ajax_$action")) {
                add_action("wp_ajax_$action", [$this, 'handleAjaxRequest']);
                $this->hooks_registered[] = "wp_ajax_$action";
            }
        }
    }
    
    /**
     * Handle plugin conflicts and namespace issues
     */
    public function handlePluginConflicts() {
        // Check for conflicting plugins
        $conflicting_plugins = [
            'admin-color-schemes/admin-color-schemes.php' => 'Admin Color Schemes',
            'custom-admin-interface/custom-admin-interface.php' => 'Custom Admin Interface',
            'admin-menu-editor/menu-editor.php' => 'Admin Menu Editor'
        ];
        
        foreach ($conflicting_plugins as $plugin_file => $plugin_name) {
            if (is_plugin_active($plugin_file)) {
                $this->compatibility_issues[] = [
                    'type' => 'plugin_conflict',
                    'message' => sprintf(
                        'Potential conflict detected with %s plugin. Some features may not work as expected.',
                        $plugin_name
                    ),
                    'severity' => 'warning'
                ];
            }
        }
        
        // Check for namespace conflicts
        $this->checkNamespaceConflicts();
        
        // Resolve common conflicts
        $this->resolveCommonConflicts();
    }
    
    /**
     * Check for namespace conflicts
     */
    private function checkNamespaceConflicts() {
        // Check for global function conflicts
        $our_functions = [
            'mas_get_settings',
            'mas_save_settings',
            'mas_generate_css'
        ];
        
        foreach ($our_functions as $function) {
            if (function_exists($function)) {
                $this->namespace_conflicts[] = $function;
            }
        }
        
        // Check for class conflicts
        $our_classes = [
            'ModernAdminStyler',
            'MAS_Settings',
            'MAS_Ajax'
        ];
        
        foreach ($our_classes as $class) {
            if (class_exists($class) && !class_exists('ModernAdminStyler\\Services\\' . $class)) {
                $this->namespace_conflicts[] = $class;
            }
        }
        
        if (!empty($this->namespace_conflicts)) {
            $this->compatibility_issues[] = [
                'type' => 'namespace_conflict',
                'message' => sprintf(
                    'Namespace conflicts detected: %s. This may cause unexpected behavior.',
                    implode(', ', $this->namespace_conflicts)
                ),
                'severity' => 'warning'
            ];
        }
    }
    
    /**
     * Resolve common plugin conflicts
     */
    private function resolveCommonConflicts() {
        // Remove conflicting admin bar modifications
        remove_action('admin_bar_menu', 'wp_admin_bar_wp_menu', 10);
        remove_action('admin_bar_menu', 'wp_admin_bar_my_sites_menu', 20);
        
        // Prevent CSS conflicts
        add_action('admin_enqueue_scripts', function() {
            wp_dequeue_style('admin-color-schemes');
            wp_dequeue_style('custom-admin-interface');
        }, 999);
        
        // Handle jQuery conflicts
        add_action('admin_enqueue_scripts', function() {
            if (wp_script_is('jquery-ui-core', 'enqueued')) {
                wp_dequeue_script('jquery-ui-core');
                wp_enqueue_script('jquery-ui-core');
            }
        }, 1);
    }
    
    /**
     * Initialize multisite compatibility
     */
    private function initMultisiteCompatibility() {
        // Network admin compatibility
        add_action('network_admin_menu', [$this, 'registerNetworkAdminMenu']);
        
        // Site-specific settings
        add_action('wpmu_new_blog', [$this, 'setupNewBlogDefaults']);
        
        // Network-wide settings
        add_filter('pre_site_option_mas_v2_network_settings', [$this, 'getNetworkSettings']);
        add_action('update_site_option_mas_v2_network_settings', [$this, 'updateNetworkSettings']);
    }
    
    /**
     * Handle theme compatibility
     */
    public function handleThemeCompatibility() {
        $theme = wp_get_theme();
        $theme_name = $theme->get('Name');
        
        // Handle specific theme conflicts
        $theme_fixes = [
            'Astra' => [$this, 'fixAstraCompatibility'],
            'GeneratePress' => [$this, 'fixGeneratePressCompatibility'],
            'OceanWP' => [$this, 'fixOceanWPCompatibility'],
            'Divi' => [$this, 'fixDiviCompatibility']
        ];
        
        if (isset($theme_fixes[$theme_name])) {
            call_user_func($theme_fixes[$theme_name]);
        }
        
        // Generic theme compatibility fixes
        $this->applyGenericThemeFixes();
    }
    
    /**
     * Apply generic theme compatibility fixes
     */
    private function applyGenericThemeFixes() {
        // Ensure admin bar compatibility
        add_theme_support('admin-bar', ['callback' => '__return_false']);
        
        // Fix admin menu positioning
        add_action('admin_head', function() {
            echo '<style>
                #adminmenuwrap { z-index: 9999; }
                #wpadminbar { z-index: 99999; }
                .woow-micro-panel { z-index: 999999; }
            </style>';
        });
    }
    
    /**
     * Handle Gutenberg/Block Editor compatibility
     */
    public function handleBlockEditorCompatibility() {
        // Ensure our styles don't conflict with block editor
        wp_enqueue_style(
            'woow-block-editor-compatibility',
            MAS_V2_PLUGIN_URL . 'assets/css/block-editor-compatibility.css',
            ['wp-edit-blocks'],
            MAS_V2_VERSION
        );
        
        // Add block editor specific JavaScript
        wp_enqueue_script(
            'woow-block-editor-js',
            MAS_V2_PLUGIN_URL . 'assets/js/block-editor-compatibility.js',
            ['wp-blocks', 'wp-element', 'wp-editor'],
            MAS_V2_VERSION,
            true
        );
    }
    
    /**
     * Handle REST API compatibility
     */
    public function handleRestApiCompatibility() {
        // Register our REST API endpoints
        register_rest_route('woow/v1', '/compatibility', [
            'methods' => 'GET',
            'callback' => [$this, 'getCompatibilityStatus'],
            'permission_callback' => function() {
                return current_user_can('manage_options');
            }
        ]);
        
        // Ensure REST API doesn't conflict with our AJAX endpoints
        add_filter('rest_pre_serve_request', [$this, 'handleRestApiConflicts'], 10, 4);
    }
    
    /**
     * Register plugin lifecycle hooks
     */
    private function registerPluginLifecycleHooks() {
        register_activation_hook(MAS_V2_PLUGIN_FILE, [$this, 'onPluginActivation']);
        register_deactivation_hook(MAS_V2_PLUGIN_FILE, [$this, 'onPluginDeactivation']);
        
        // Handle plugin updates
        add_action('upgrader_process_complete', [$this, 'onPluginUpdate'], 10, 2);
    }
    
    /**
     * Plugin activation handler
     */
    public function onPluginActivation() {
        // Check compatibility before activation
        $this->checkCompatibility();
        
        if (!empty($this->compatibility_issues)) {
            $critical_errors = array_filter($this->compatibility_issues, function($issue) {
                return $issue['severity'] === 'error';
            });
            
            if (!empty($critical_errors)) {
                $error_messages = array_map(function($issue) {
                    return $issue['message'];
                }, $critical_errors);
                
                wp_die(
                    '<h1>Plugin Activation Failed</h1>' .
                    '<p>WOOW Admin Styler cannot be activated due to compatibility issues:</p>' .
                    '<ul><li>' . implode('</li><li>', $error_messages) . '</li></ul>',
                    'Plugin Activation Error',
                    ['back_link' => true]
                );
            }
        }
        
        // Set up default options
        $this->setupDefaultOptions();
        
        // Create necessary database tables if needed
        $this->createDatabaseTables();
        
        // Schedule compatibility checks
        if (!wp_next_scheduled('woow_compatibility_check')) {
            wp_schedule_event(time(), 'daily', 'woow_compatibility_check');
        }
    }
    
    /**
     * Plugin deactivation handler
     */
    public function onPluginDeactivation() {
        // Clean up scheduled events
        wp_clear_scheduled_hook('woow_compatibility_check');
        
        // Clean up transients
        delete_transient('woow_compatibility_status');
        
        // Remove temporary options
        delete_option('woow_activation_errors');
    }
    
    /**
     * Setup default plugin options
     */
    private function setupDefaultOptions() {
        $default_settings = [
            'version' => MAS_V2_VERSION,
            'activated_time' => time(),
            'compatibility_checked' => true,
            'wp_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION
        ];
        
        add_option('woow_plugin_info', $default_settings);
    }
    
    /**
     * Create necessary database tables
     */
    private function createDatabaseTables() {
        global $wpdb;
        
        // We don't need custom tables for this plugin,
        // but this method is here for future extensibility
        
        // Example table creation (commented out):
        /*
        $table_name = $wpdb->prefix . 'woow_settings';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            setting_key varchar(255) NOT NULL,
            setting_value longtext NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY setting_key (setting_key)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        */
    }
    
    /**
     * Display compatibility notices in admin
     */
    public function displayCompatibilityNotices() {
        if (empty($this->compatibility_issues)) {
            return;
        }
        
        foreach ($this->compatibility_issues as $issue) {
            $class = $issue['severity'] === 'error' ? 'notice-error' : 'notice-warning';
            
            echo '<div class="notice ' . $class . ' is-dismissible">';
            echo '<p><strong>WOOW Admin Styler:</strong> ' . esc_html($issue['message']) . '</p>';
            echo '</div>';
        }
    }
    
    /**
     * Deactivate plugin if critical errors exist
     */
    public function deactivatePlugin() {
        deactivate_plugins(plugin_basename(MAS_V2_PLUGIN_FILE));
        
        if (isset($_GET['activate'])) {
            unset($_GET['activate']);
        }
    }
    
    /**
     * Get compatibility status for REST API
     */
    public function getCompatibilityStatus($request) {
        return rest_ensure_response([
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'plugin_version' => MAS_V2_VERSION,
            'compatibility_issues' => $this->compatibility_issues,
            'hooks_registered' => $this->hooks_registered,
            'namespace_conflicts' => $this->namespace_conflicts,
            'multisite' => is_multisite(),
            'theme' => wp_get_theme()->get('Name'),
            'active_plugins' => get_option('active_plugins', [])
        ]);
    }
    
    /**
     * Handle REST API conflicts
     */
    public function handleRestApiConflicts($served, $result, $request, $server) {
        // Prevent conflicts between REST API and AJAX endpoints
        if (strpos($request->get_route(), '/woow/') === 0) {
            // Our REST API endpoint - ensure proper headers
            header('X-WOOW-API: true');
        }
        
        return $served;
    }
    
    /**
     * Placeholder methods for hook callbacks
     */
    public function enqueueAdminAssets() {
        // Handled by main plugin class
    }
    
    public function enqueueFrontendAssets() {
        // Handled by main plugin class
    }
    
    public function registerAdminMenu() {
        // Handled by main plugin class
    }
    
    public function outputAdminStyles() {
        // Handled by main plugin class
    }
    
    public function outputFrontendStyles() {
        // Handled by main plugin class
    }
    
    public function outputAdminScripts() {
        // Handled by main plugin class
    }
    
    public function outputFrontendScripts() {
        // Handled by main plugin class
    }
    
    public function handleAjaxRequest() {
        // Handled by UnifiedAjaxManager
    }
    
    /**
     * Theme-specific compatibility fixes
     */
    private function fixAstraCompatibility() {
        add_action('wp_head', function() {
            echo '<style>.ast-admin-bar-wrap { z-index: 99998 !important; }</style>';
        });
    }
    
    private function fixGeneratePressCompatibility() {
        add_filter('generate_admin_bar_class', function($classes) {
            return $classes . ' woow-compatible';
        });
    }
    
    private function fixOceanWPCompatibility() {
        remove_action('admin_bar_menu', 'oceanwp_admin_bar_menu', 999);
    }
    
    private function fixDiviCompatibility() {
        add_action('admin_head', function() {
            echo '<style>#et_pb_layout { z-index: 99997 !important; }</style>';
        });
    }
    
    /**
     * Network admin menu for multisite
     */
    public function registerNetworkAdminMenu() {
        add_menu_page(
            'WOOW Network Settings',
            'WOOW Styler',
            'manage_network_options',
            'woow-network-settings',
            [$this, 'renderNetworkSettingsPage'],
            'dashicons-admin-appearance',
            30
        );
    }
    
    /**
     * Render network settings page
     */
    public function renderNetworkSettingsPage() {
        echo '<div class="wrap">';
        echo '<h1>WOOW Admin Styler - Network Settings</h1>';
        echo '<p>Configure network-wide settings for all sites.</p>';
        // Add network settings form here
        echo '</div>';
    }
    
    /**
     * Setup defaults for new multisite blogs
     */
    public function setupNewBlogDefaults($blog_id) {
        switch_to_blog($blog_id);
        $this->setupDefaultOptions();
        restore_current_blog();
    }
    
    /**
     * Get network settings
     */
    public function getNetworkSettings($value) {
        return get_site_option('woow_network_settings', []);
    }
    
    /**
     * Update network settings
     */
    public function updateNetworkSettings($option, $value) {
        // Handle network settings update
        return update_site_option('woow_network_settings', $value);
    }
    
    /**
     * Handle plugin updates
     */
    public function onPluginUpdate($upgrader_object, $options) {
        if ($options['action'] === 'update' && $options['type'] === 'plugin') {
            if (isset($options['plugins'])) {
                foreach ($options['plugins'] as $plugin) {
                    if ($plugin === plugin_basename(MAS_V2_PLUGIN_FILE)) {
                        // Plugin was updated - run compatibility checks
                        $this->checkCompatibility();
                        
                        // Update version info
                        $plugin_info = get_option('woow_plugin_info', []);
                        $plugin_info['version'] = MAS_V2_VERSION;
                        $plugin_info['updated_time'] = time();
                        update_option('woow_plugin_info', $plugin_info);
                        
                        break;
                    }
                }
            }
        }
    }
    
    /**
     * Get all compatibility issues
     */
    public function getCompatibilityIssues() {
        return $this->compatibility_issues;
    }
    
    /**
     * Check if plugin is compatible
     */
    public function isCompatible() {
        $critical_errors = array_filter($this->compatibility_issues, function($issue) {
            return $issue['severity'] === 'error';
        });
        
        return empty($critical_errors);
    }
    
    /**
     * Get registered hooks
     */
    public function getRegisteredHooks() {
        return $this->hooks_registered;
    }
    
    /**
     * Get namespace conflicts
     */
    public function getNamespaceConflicts() {
        return $this->namespace_conflicts;
    }
}