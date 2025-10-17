<?php
/**
 * Unified AJAX Manager - Central Controller for All AJAX Endpoints
 * CLEAN VERSION - Focused on Live Edit Mode functionality
 * 
 * @package ModernAdminStyler
 * @version 2.4.0
 */

namespace ModernAdminStyler\Services;

require_once __DIR__ . '/AjaxSecurityManager.php';
require_once __DIR__ . '/AjaxResponseManager.php';
require_once __DIR__ . '/ErrorLogger.php';
require_once __DIR__ . '/PerformanceMonitor.php';
require_once __DIR__ . '/SecurityExceptions.php';

class UnifiedAjaxManager {
    
    private $settings_manager;
    private $security_manager;
    private $response_manager;
    private $error_logger;
    private $performance_monitor;
    private $endpoints = [];
    private $deprecated_endpoints = [];
    private $current_request = null;
    private $request_start_time;
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->request_start_time = microtime(true);
        
        $this->security_manager = new AjaxSecurityManager(); 
        $this->response_manager = new AjaxResponseManager();
        $this->error_logger = new ErrorLogger();
        $this->performance_monitor = new PerformanceMonitor();
        
        $this->registerEndpoints();
        $this->registerDeprecatedEndpoints();
        $this->initializeAjaxHooks();
    }
    
    /**
     * Register all AJAX endpoints
     */
    private function registerEndpoints() {
        $this->endpoints = [
            // Live Edit Mode Endpoints
            'mas_save_live_settings' => [
                'handler' => [$this, 'handleSaveLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'priority' => 'high',
                'timeout' => 30
            ],
            'mas_get_live_settings' => [
                'handler' => [$this, 'handleGetLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 15,
                'priority' => 'high',
                'timeout' => 15
            ],
            'mas_live_preview' => [
                'handler' => [$this, 'handleLivePreview'],
                'capability' => 'manage_options',
                'rate_limit' => 20,
                'priority' => 'high',
                'timeout' => 10
            ],
            
            // V2 Live Edit Endpoints
            'mas_v2_save_live_settings' => [
                'handler' => [$this, 'handleSaveLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'priority' => 'high',
                'timeout' => 30
            ],
            'mas_v2_get_live_settings' => [
                'handler' => [$this, 'handleGetLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 15,
                'priority' => 'high',
                'timeout' => 15
            ],
            'mas_v2_live_preview' => [
                'handler' => [$this, 'handleLivePreview'],
                'capability' => 'manage_options',
                'rate_limit' => 20,
                'priority' => 'high',
                'timeout' => 10
            ],
            
            // General Settings Endpoints
            'mas_v2_save_settings' => [
                'handler' => [$this, 'handleSaveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'priority' => 'medium',
                'timeout' => 30
            ],
            'mas_v2_get_settings' => [
                'handler' => [$this, 'handleGetSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'priority' => 'medium',
                'timeout' => 15
            ],
            
            // Utility Endpoints
            'mas_v2_clear_cache' => [
                'handler' => [$this, 'handleClearCache'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'priority' => 'low',
                'timeout' => 20
            ],
            'mas_log_error' => [
                'handler' => [$this, 'handleLogError'],
                'capability' => 'read',
                'rate_limit' => 50,
                'priority' => 'low',
                'timeout' => 5
            ]
        ];
    }
    
    /**
     * Register deprecated endpoints for backward compatibility
     */
    private function registerDeprecatedEndpoints() {
        $this->deprecated_endpoints = [
            'mas_live_edit_save' => 'mas_save_live_settings',
            'mas_live_edit_load' => 'mas_get_live_settings',
            'mas_live_edit_preview' => 'mas_live_preview',
            'woow_save_settings' => 'mas_v2_save_settings',
            'woow_load_settings' => 'mas_v2_get_settings'
        ];
    }
    
    /**
     * Initialize WordPress AJAX hooks
     */
    private function initializeAjaxHooks() {
        foreach ($this->endpoints as $action => $config) {
            add_action("wp_ajax_{$action}", [$this, 'processAjaxRequest']);
            add_action("wp_ajax_nopriv_{$action}", [$this, 'processAjaxRequest']);
        }
        
        // Register deprecated endpoints
        foreach ($this->deprecated_endpoints as $old_action => $new_action) {
            add_action("wp_ajax_{$old_action}", [$this, 'processDeprecatedRequest']);
            add_action("wp_ajax_nopriv_{$old_action}", [$this, 'processDeprecatedRequest']);
        }
    }
    
    /**
     * Process AJAX request with enhanced error handling
     */
    public function processAjaxRequest() {
        $action = str_replace(['wp_ajax_', 'wp_ajax_nopriv_'], '', current_action());
        $start_time = microtime(true);
        $request_id = 'req_' . uniqid() . '_' . substr(md5($action . $start_time), 0, 8);
        
        try {
            // Validate endpoint exists
            if (!isset($this->endpoints[$action])) {
                throw new \Exception("Unknown AJAX endpoint: {$action}");
            }
            
            $config = $this->endpoints[$action];
            $this->current_request = [
                'action' => $action,
                'config' => $config,
                'start_time' => $start_time,
                'request_id' => $request_id
            ];
            
            // Security validation
            $this->security_manager->validateRequest($action, $config);
            
            // Execute handler
            $handler = $config['handler'];
            if (!is_callable($handler)) {
                throw new \Exception("Handler not callable for action: {$action}");
            }
            
            // Set timeout
            $timeout = $config['timeout'] ?? 30;
            set_time_limit($timeout);
            
            // Execute handler
            $result = call_user_func($handler, $action, $config);
            
            // Performance monitoring
            $execution_time = (microtime(true) - $start_time) * 1000;
            $this->performance_monitor->recordAjaxRequest($action, $execution_time, true, [
                'request_id' => $request_id,
                'memory_usage' => memory_get_usage(true)
            ]);
            
        } catch (SecurityException $e) {
            $this->handleSecurityException($e, $action, $start_time, $request_id);
        } catch (\Exception $e) {
            $this->handleGeneralException($e, $action, $start_time, $request_id);
        } finally {
            $this->cleanupRequest($request_id, $start_time);
        }
    }
    
    /**
     * Handle deprecated AJAX requests
     */
    public function processDeprecatedRequest() {
        $old_action = str_replace(['wp_ajax_', 'wp_ajax_nopriv_'], '', current_action());
        $new_action = $this->deprecated_endpoints[$old_action] ?? null;
        
        if (!$new_action) {
            $this->response_manager->error('Deprecated endpoint not found', 'deprecated_not_found');
            return;
        }
        
        // Log deprecation warning
        error_log("MAS V2: Deprecated AJAX endpoint '{$old_action}' used. Please update to '{$new_action}'");
        
        // Forward to new endpoint
        $_POST['action'] = $new_action;
        $this->processAjaxRequest();
    }
    
    /**
     * Handle Live Edit Settings Save
     */
    public function handleSaveLiveSettings($action, $config) {
        try {
            // Get settings from POST data
            $settings = $_POST;
            unset($settings['nonce'], $settings['action']);
            
            // Save settings using settings manager
            $result = $this->settings_manager->saveSettings($settings);
            
            if ($result !== false) {
                // Clear CSS cache for live updates
                wp_cache_delete('mas_v2_css_cache', 'options');
                
                $this->response_manager->success([
                    'settings' => $settings,
                    'saved_count' => count($settings),
                    'live_edit_mode' => true
                ], __('Live settings saved successfully!', 'woow-admin-styler'), 'live_settings_saved');
            } else {
                $this->response_manager->databaseError(
                    __('Failed to save live settings to database.', 'woow-admin-styler'),
                    'save_live_settings'
                );
            }
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle Live Edit Settings Load
     */
    public function handleGetLiveSettings($action, $config) {
        try {
            // Get current settings
            $settings = $this->settings_manager->getSettings();
            
            $this->response_manager->success([
                'settings' => $settings,
                'loaded_count' => count($settings),
                'live_edit_mode' => true,
                'timestamp' => current_time('mysql')
            ], __('Live settings loaded successfully!', 'woow-admin-styler'), 'live_settings_loaded');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle Live Preview Generation
     */
    public function handleLivePreview($action, $config) {
        try {
            $settings = $_POST;
            unset($settings['nonce'], $settings['action']);
            
            // Generate CSS for preview
            $css = $this->generateLivePreviewCSS($settings);
            
            $this->response_manager->success([
                'css' => $css,
                'settings_count' => count($settings),
                'css_length' => strlen($css),
                'live_preview' => true
            ], __('Live preview generated successfully!', 'woow-admin-styler'), 'live_preview_generated');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Generate CSS for live preview
     */
    private function generateLivePreviewCSS($settings) {
        $css = ":root {\n";
        
        // Color variables
        $colorMappings = [
            'primary_color' => '--mas-primary-color',
            'secondary_color' => '--mas-secondary-color',
            'background_color' => '--mas-background-color',
            'text_color' => '--mas-text-color',
            'accent_color' => '--mas-accent-color',
            'border_color' => '--mas-border-color',
            'admin_bar_background' => '--woow-surface-bar',
            'admin_bar_text_color' => '--woow-surface-bar-text',
            'admin_bar_hover_color' => '--woow-surface-bar-hover',
            'menu_background' => '--woow-surface-menu',
            'menu_text_color' => '--woow-surface-menu-text',
            'menu_hover_color' => '--woow-surface-menu-hover'
        ];
        
        foreach ($colorMappings as $setting => $cssVar) {
            if (isset($settings[$setting]) && !empty($settings[$setting])) {
                $css .= "  {$cssVar}: {$settings[$setting]};\n";
            }
        }
        
        // Size and spacing variables
        $sizeMappings = [
            'font_size' => '--mas-font-size',
            'line_height' => '--mas-line-height',
            'border_radius' => '--mas-border-radius',
            'padding' => '--mas-padding',
            'margin' => '--mas-margin',
            'admin_bar_height' => '--woow-surface-bar-height',
            'menu_width' => '--woow-surface-menu-width'
        ];
        
        foreach ($sizeMappings as $setting => $cssVar) {
            if (isset($settings[$setting]) && !empty($settings[$setting])) {
                $value = $settings[$setting];
                // Add px unit if numeric
                if (is_numeric($value)) {
                    $value .= 'px';
                }
                $css .= "  {$cssVar}: {$value};\n";
            }
        }
        
        $css .= "}\n\n";
        
        // Add component-specific styles
        $css .= $this->generateComponentStyles($settings);
        
        return $css;
    }
    
    /**
     * Generate component-specific styles
     */
    private function generateComponentStyles($settings) {
        $css = "";
        
        // Admin bar styles
        if (isset($settings['admin_bar_enabled']) && $settings['admin_bar_enabled']) {
            $css .= "#wpadminbar {\n";
            if (isset($settings['admin_bar_background'])) {
                $css .= "  background-color: {$settings['admin_bar_background']};\n";
            }
            if (isset($settings['admin_bar_text_color'])) {
                $css .= "  color: {$settings['admin_bar_text_color']};\n";
            }
            $css .= "}\n\n";
        }
        
        // Menu styles
        if (isset($settings['menu_style']) && $settings['menu_style'] !== 'default') {
            $css .= "#adminmenu {\n";
            if (isset($settings['menu_background'])) {
                $css .= "  background-color: {$settings['menu_background']};\n";
            }
            if (isset($settings['menu_text_color'])) {
                $css .= "  color: {$settings['menu_text_color']};\n";
            }
            $css .= "}\n\n";
        }
        
        // Content area styles
        if (isset($settings['content_background'])) {
            $css .= "#wpbody-content {\n";
            $css .= "  background-color: {$settings['content_background']};\n";
            $css .= "}\n\n";
        }
        
        return $css;
    }
    
    /**
     * Handle general settings save
     */
    public function handleSaveSettings($action, $config) {
        try {
            $settings = $_POST;
            unset($settings['nonce'], $settings['action']);
            
            $result = $this->settings_manager->saveSettings($settings);
            
            if ($result !== false) {
                $this->response_manager->success([
                    'settings' => $settings,
                    'saved_count' => count($settings)
                ], __('Settings saved successfully!', 'woow-admin-styler'), 'settings_saved');
            } else {
                $this->response_manager->databaseError(
                    __('Failed to save settings to database.', 'woow-admin-styler'),
                    'save_settings'
                );
            }
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle general settings load
     */
    public function handleGetSettings($action, $config) {
        try {
            $settings = $this->settings_manager->getSettings();
            
            $this->response_manager->success([
                'settings' => $settings,
                'loaded_count' => count($settings)
            ], __('Settings loaded successfully!', 'woow-admin-styler'), 'settings_loaded');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle cache clearing
     */
    public function handleClearCache($action, $config) {
        try {
            // Clear WordPress caches
            wp_cache_flush();
            
            // Clear plugin-specific caches
            wp_cache_delete('mas_v2_settings', 'options');
            wp_cache_delete('mas_v2_css_cache', 'options');
            delete_transient('mas_v2_cache_test');
            
            $this->response_manager->success([
                'cache_cleared' => true,
                'timestamp' => current_time('mysql')
            ], __('Cache cleared successfully!', 'woow-admin-styler'), 'cache_cleared');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle error logging
     */
    public function handleLogError($action, $config) {
        try {
            $error_data = json_decode(stripslashes($_POST['error_data'] ?? '{}'), true);
            
            if (is_array($error_data)) {
                $error_id = $this->error_logger->logJavaScriptError($error_data);
                
                $this->response_manager->success([
                    'error_id' => $error_id,
                    'logged' => true
                ], 'Error logged successfully', 'error_logged');
            } else {
                throw new \Exception('Invalid error data format');
            }
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle security exceptions
     */
    private function handleSecurityException(SecurityException $e, $action, $start_time, $request_id = null) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, false, [
            'error_type' => 'security',
            'violation_type' => $e->getViolationType(),
            'request_id' => $request_id
        ]);
        
        $error_id = $this->error_logger->logSecurityViolation($e->getViolationType(), [
            'action' => $action,
            'message' => $e->getMessage(),
            'request_id' => $request_id
        ]);
        
        $this->response_manager->securityError($e->getMessage(), $e->getViolationType(), [
            'error_id' => $error_id,
            'request_id' => $request_id
        ]);
    }
    
    /**
     * Handle general exceptions
     */
    private function handleGeneralException(\Exception $e, $action, $start_time, $request_id = null) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, false, [
            'error_type' => get_class($e),
            'error_message' => $e->getMessage(),
            'request_id' => $request_id
        ]);
        
        $error_id = $this->error_logger->logAjaxError($action, $e, $_POST, [
            'request_id' => $request_id,
            'execution_time' => $execution_time
        ]);
        
        $this->response_manager->error($e->getMessage(), 'ajax_error', [
            'error_id' => $error_id,
            'request_id' => $request_id
        ]);
    }
    
    /**
     * Cleanup request resources
     */
    private function cleanupRequest($request_id, $start_time) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        error_log(sprintf(
            'MAS V2 AJAX Request Complete [%s]: %s | Time: %.2fms',
            $request_id,
            $this->current_request['action'] ?? 'unknown',
            $execution_time
        ));
        
        $this->current_request = null;
        
        if ($execution_time > 5000) {
            gc_collect_cycles();
        }
    }
    
    /**
     * Get endpoint registry for testing
     */
    public function getEndpointRegistry() {
        return [
            'total_endpoints' => count($this->endpoints),
            'active_endpoints' => $this->endpoints,
            'deprecated_endpoints' => $this->deprecated_endpoints,
            'high_priority_endpoints' => array_filter($this->endpoints, function($config) {
                return ($config['priority'] ?? 'medium') === 'high';
            })
        ];
    }
    
    /**
     * Get registered endpoints (backward compatibility)
     */
    public function getEndpoints() {
        return $this->endpoints;
    }
    
    /**
     * Get deprecated endpoints (backward compatibility)
     */
    public function getDeprecatedEndpoints() {
        return $this->deprecated_endpoints;
    }
}