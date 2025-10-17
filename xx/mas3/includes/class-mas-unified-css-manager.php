<?php
/**
 * Unified CSS Manager - Single point of control for all CSS loading
 * 
 * Eliminates duplicate loading and manages context-aware CSS enqueuing
 * 
 * @package ModernAdminStylerV2
 * @since 3.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class MAS_Unified_CSS_Manager {
    
    private static $instance = null;
    private $loaded_handles = [];
    private $plugin_url;
    private $version;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->plugin_url = plugin_dir_url(dirname(__FILE__));
        $this->version = defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '3.0.0';
        $this->init();
    }
    
    private function init() {
        // Priority 5 - load BEFORE old methods (priority 10)
        add_action('admin_enqueue_scripts', [$this, 'load_admin_css'], 5);
        add_action('wp_enqueue_scripts', [$this, 'load_frontend_css'], 5);
        add_action('login_enqueue_scripts', [$this, 'load_login_css'], 5);
        
        // Track deprecation warnings
        if (defined('WP_DEBUG') && WP_DEBUG) {
            add_action('admin_enqueue_scripts', [$this, 'check_deprecated_loading'], 999);
        }
    }
    
    public function load_admin_css($hook) {
        $context = $this->get_admin_context($hook);
        
        // Load CSS files
        $files = $this->get_css_files_for_context($context);
        foreach ($files as $handle => $file) {
            if (!$this->is_loaded($handle)) {
                wp_enqueue_style(
                    $handle,
                    $this->plugin_url . 'assets/css/' . $file,
                    [],
                    $this->version
                );
                $this->mark_loaded($handle);
            }
        }
        
        // Add inline menu CSS
        if ($this->is_loaded('mas-v2-global')) {
            $this->add_inline_menu_css('mas-v2-global');
        }
        
        // Load JavaScript for settings pages
        if ($context === 'mas_settings') {
            $this->load_settings_js();
        }
    }
    
    public function load_frontend_css() {
        // Frontend CSS loading (if needed)
        // Currently plugin is admin-only
    }
    
    public function load_login_css() {
        // Login page CSS loading (if needed)
    }
    
    private function get_admin_context($hook) {
        if (strpos($hook, 'mas-v2') !== false) {
            return 'mas_settings';
        }
        return 'admin';
    }
    
    private function get_css_files_for_context($context) {
        $files = [];
        
        // Core files for all admin pages
        $files['mas-v2-global'] = 'admin-modern.css';
        $files['mas-v2-menu-cooperative'] = 'admin-menu-cooperative.css';
        $files['mas-v2-menu-fix'] = 'menu-fix-minimal.css';
        $files['mas-v2-color-palettes'] = 'color-palettes.css';
        $files['mas-v2-cross-browser'] = 'cross-browser-compatibility.css';
        $files['mas-v2-accessibility'] = 'accessibility.css';
        
        // Context-specific files
        if ($context === 'mas_settings') {
            $files['mas-v2-palette-switcher'] = 'palette-switcher.css';
            $files['mas-v2-performance-dashboard'] = 'performance-dashboard.css';
            $files['mas-v2-notifications'] = 'notification-system.css';
            
            // WordPress core dependencies
            wp_enqueue_style('wp-color-picker');
            wp_enqueue_style('thickbox');
        }
        
        return $files;
    }
    
    private function add_inline_menu_css($handle) {
        // Get settings and generate menu CSS
        $settings = get_option('mas_v2_settings', []);
        if (empty($settings)) {
            return;
        }
        
        $menu_css = $this->generate_minimal_menu_css($settings);
        if (!empty($menu_css)) {
            wp_add_inline_style($handle, $menu_css);
        }
    }
    
    private function generate_minimal_menu_css($settings) {
        // Use main plugin's generateMenuCSS if available
        if (class_exists('Modern_Admin_Styler_V2')) {
            $plugin = Modern_Admin_Styler_V2::getInstance();
            if (method_exists($plugin, 'generateMenuCSS')) {
                return $plugin->generateMenuCSS($settings);
            }
        }
        
        // Fallback: minimal menu CSS
        $css = '';
        $menu_bg = $settings['menu_bg'] ?? $settings['menu_background'] ?? '';
        if (!empty($menu_bg)) {
            $css .= "#adminmenu,#adminmenuback,#adminmenuwrap{background:{$menu_bg}!important;}";
        }
        return $css;
    }
    
    private function is_loaded($handle) {
        return in_array($handle, $this->loaded_handles) || wp_style_is($handle, 'enqueued');
    }
    
    private function mark_loaded($handle) {
        $this->loaded_handles[] = $handle;
    }
    
    /**
     * Load JavaScript for settings pages
     */
    private function load_settings_js() {
        // WordPress core dependencies
        wp_enqueue_script('jquery');
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_media();
        
        // Phase 2 stable system
        wp_enqueue_script(
            'mas-v2-rest-client',
            $this->plugin_url . 'assets/js/mas-rest-client.js',
            [],
            $this->version,
            true
        );
        
        wp_enqueue_script(
            'mas-v2-settings-form-handler',
            $this->plugin_url . 'assets/js/mas-settings-form-handler.js',
            ['jquery', 'wp-color-picker', 'mas-v2-rest-client'],
            $this->version,
            true
        );
        
        wp_enqueue_script(
            'mas-v2-simple-live-preview',
            $this->plugin_url . 'assets/js/simple-live-preview.js',
            ['jquery', 'wp-color-picker', 'mas-v2-settings-form-handler'],
            $this->version,
            true
        );
        
        // Localize script data
        $this->localize_script_data();
    }
    
    /**
     * Localize script data for JavaScript
     */
    private function localize_script_data() {
        $settings = get_option('mas_v2_settings', []);
        
        $data = [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'restUrl' => rest_url('mas-v2/'),
            'nonce' => wp_create_nonce('mas_v2_nonce'),
            'restNonce' => wp_create_nonce('wp_rest'),
            'settings' => $settings,
            'debug_mode' => defined('WP_DEBUG') && WP_DEBUG,
            'frontendMode' => 'unified-manager',
            'unifiedCssManager' => true
        ];
        
        wp_add_inline_script('jquery', 
            'window.masV2Global = ' . wp_json_encode($data) . ';', 
            'after'
        );
        
        wp_localize_script('mas-v2-settings-form-handler', 'masV2Global', $data);
    }
    
    /**
     * Check for deprecated CSS loading (debug mode only)
     */
    public function check_deprecated_loading() {
        // Check if admin-modern.css was loaded multiple times
        global $wp_styles;
        if (isset($wp_styles->done) && is_array($wp_styles->done)) {
            $modern_css_count = 0;
            foreach ($wp_styles->done as $handle) {
                if (strpos($handle, 'mas-v2-global') !== false) {
                    $modern_css_count++;
                }
            }
            
            if ($modern_css_count > 1) {
                error_log(sprintf(
                    'MAS V2 CSS Consolidation: admin-modern.css loaded %d times (should be 1). Old enqueue methods still active.',
                    $modern_css_count
                ));
            }
        }
    }
}
