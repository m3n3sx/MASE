<?php
/**
 * Unified AJAX Manager - Central Controller for All AJAX Endpoints
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Security Overhaul
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
    private $request_start_time;
    
    public function __construct($settings_manager) {
        $this->settings_manager = $settings_manager;
        $this->request_start_time = microtime(true);
        
        $this->security_manager = new AjaxSecurityManager();
        $this->response_manager = new AjaxResponseManager();
        $this->error_logger = new ErrorLogger();
        $this->performance_monitor = new PerformanceMonitor();
        
        $this->registerEndpoints();
    }    

    /**
     * Register all AJAX endpoints in centralized location
     */
    public function registerEndpoints() {
        $this->endpoints = [
            // Live Edit Endpoints (High Priority - for micro-panel functionality)
            'mas_save_live_settings' => [
                'handler' => [$this, 'handleSaveLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 20,
                'description' => 'Save individual live edit settings',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            'mas_get_live_settings' => [
                'handler' => [$this, 'handleGetLiveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 30,
                'description' => 'Get current live edit settings',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            'mas_reset_live_setting' => [
                'handler' => [$this, 'handleResetLiveSetting'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Reset single setting to default',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Settings Management
            'mas_v2_save_settings' => [
                'handler' => [$this, 'handleSaveSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Save bulk settings',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            'mas_v2_reset_settings' => [
                'handler' => [$this, 'handleResetSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Reset all settings to defaults',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Import/Export
            'mas_v2_export_settings' => [
                'handler' => [$this, 'handleExportSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Export settings to JSON',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_import_settings' => [
                'handler' => [$this, 'handleImportSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Import settings from JSON',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_restore_defaults' => [
                'handler' => [$this, 'handleRestoreDefaults'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Restore all settings to default values',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            'mas_export_settings' => [
                'handler' => [$this, 'handleExportSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Export settings to JSON (legacy alias)',
                'version_added' => '2.4.0',
                'priority' => 'low',
                'deprecated' => false // Keep for backward compatibility
            ],
            'mas_import_settings' => [
                'handler' => [$this, 'handleImportSettings'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Import settings from JSON (legacy alias)',
                'version_added' => '2.4.0',
                'priority' => 'low',
                'deprecated' => false // Keep for backward compatibility
            ],
            
            // Diagnostics
            'mas_v2_database_check' => [
                'handler' => [$this, 'handleDatabaseCheck'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Check database connectivity and integrity',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_cache_check' => [
                'handler' => [$this, 'handleCacheCheck'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Check cache system status',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            
            // Cache Management
            'mas_v2_clear_cache' => [
                'handler' => [$this, 'handleClearCache'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Clear plugin cache',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Live Preview
            'mas_live_preview' => [
                'handler' => [$this, 'handleLivePreview'],
                'capability' => 'manage_options',
                'rate_limit' => 15,
                'description' => 'Generate live preview CSS',
                'version_added' => '2.4.0',
                'priority' => 'high'
            ],
            
            // Error Logging
            'mas_v2_log_error' => [
                'handler' => [$this, 'handleLogError'],
                'capability' => 'read',
                'rate_limit' => 50,
                'description' => 'Log frontend errors',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            
            // Enterprise Features
            'mas_v2_security_scan' => [
                'handler' => [$this, 'handleSecurityScan'],
                'capability' => 'manage_options',
                'rate_limit' => 2,
                'description' => 'Run security vulnerability scan',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_performance_benchmark' => [
                'handler' => [$this, 'handlePerformanceBenchmark'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Run performance benchmark tests',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_cache_flush' => [
                'handler' => [$this, 'handleCacheFlush'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Flush all caches',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            'mas_v2_cache_stats' => [
                'handler' => [$this, 'handleCacheStats'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Get cache statistics',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_metrics_report' => [
                'handler' => [$this, 'handleMetricsReport'],
                'capability' => 'manage_options',
                'rate_limit' => 5,
                'description' => 'Generate metrics report',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_css_regenerate' => [
                'handler' => [$this, 'handleCSSRegenerate'],
                'capability' => 'manage_options',
                'rate_limit' => 3,
                'description' => 'Regenerate CSS files',
                'version_added' => '2.4.0',
                'priority' => 'medium'
            ],
            'mas_v2_memory_stats' => [
                'handler' => [$this, 'handleMemoryStats'],
                'capability' => 'manage_options',
                'rate_limit' => 10,
                'description' => 'Get memory usage statistics',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ],
            'mas_v2_force_memory_optimization' => [
                'handler' => [$this, 'handleForceMemoryOptimization'],
                'capability' => 'manage_options',
                'rate_limit' => 2,
                'description' => 'Force memory optimization',
                'version_added' => '2.4.0',
                'priority' => 'low'
            ]
        ];
        
        // Register deprecated endpoints for backward compatibility
        $this->registerDeprecatedEndpoints();
        
        // Hook all endpoints to WordPress
        $this->hookEndpoints();
    }    

    /**
     * Register deprecated endpoints for backward compatibility
     */
    private function registerDeprecatedEndpoints() {
        $this->deprecated_endpoints = [
            // Legacy endpoints from main plugin file (deprecated)
            'mas_database_check' => 'mas_v2_database_check',
            'mas_cache_check' => 'mas_v2_cache_check', 
            'mas_clear_cache' => 'mas_v2_clear_cache',
            'save_mas_v2_settings' => 'mas_v2_save_settings',
            
            // Legacy endpoints from CommunicationManager (deprecated)
            'mas_v2_import_functional_settings' => 'mas_v2_import_settings',
            'mas_save_live_edit_settings' => 'mas_save_live_settings',
            
            // Old naming conventions - redirect to new endpoints
            'mas_save_live_settings_old' => 'mas_save_live_settings',
            'mas_get_live_settings_old' => 'mas_get_live_settings'
        ];
    }
    
    /**
     * Hook all endpoints to WordPress AJAX system
     */
    private function hookEndpoints() {
        foreach ($this->endpoints as $action => $config) {
            add_action("wp_ajax_{$action}", [$this, 'processAjaxRequest']);
        }
        
        // Hook deprecated endpoints
        foreach ($this->deprecated_endpoints as $old_action => $new_action) {
            add_action("wp_ajax_{$old_action}", [$this, 'processDeprecatedRequest']);
        }
    }
    
    /**
     * Unified AJAX request processor - handles all requests through single pipeline
     * ENHANCED: Better error handling, response validation, and retry mechanism support
     */
    public function processAjaxRequest() {
        $action = str_replace('wp_ajax_', '', current_action());
        $start_time = microtime(true);
        
        // Initialize request tracking
        $request_id = 'req_' . uniqid() . '_' . substr(md5($action . $start_time), 0, 8);
        
        try {
            // Validate endpoint exists
            if (!isset($this->endpoints[$action])) {
                // Check if it's a deprecated endpoint
                if (isset($this->deprecated_endpoints[$action])) {
                    $this->processDeprecatedRequest();
                    return;
                }
                throw new \Exception("Unknown AJAX endpoint: {$action}");
            }
            
            $config = $this->endpoints[$action];
            $this->current_request = [
                'action' => $action,
                'config' => $config,
                'start_time' => $start_time,
                'request_id' => $request_id
            ];
            
            // Phase 1: Pre-validation checks
            $this->validateRequestStructure($_POST);
            
            // Phase 2: Security Validation
            $this->security_manager->validateRequest($action, $config);
            
            // Phase 3: Execute Handler with timeout protection
            $handler = $config['handler'];
            if (!is_callable($handler)) {
                throw new \Exception("Handler not callable for action: {$action}");
            }
            
            // Set execution timeout for long-running operations
            $timeout = $config['timeout'] ?? 30; // 30 seconds default
            set_time_limit($timeout);
            
            $result = call_user_func($handler, $action, $config);
            
            // Phase 4: Performance Monitoring
            $execution_time = (microtime(true) - $start_time) * 1000;
            $this->performance_monitor->recordAjaxRequest($action, $execution_time, true, [
                'handler_result' => $result !== null ? 'success' : 'no_return',
                'request_id' => $request_id,
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true)
            ]);
            
            // Phase 5: Response Validation
            if (!$this->response_manager->isResponseSent()) {
                // Handler didn't send response - this is an error
                $this->response_manager->error(
                    'Handler completed but did not send response', 
                    'no_response',
                    ['request_id' => $request_id, 'action' => $action]
                );
            }
            
        } catch (SecurityException $e) {
            $this->handleSecurityException($e, $action, $start_time, $request_id);
        } catch (\Exception $e) {
            $this->handleGeneralException($e, $action, $start_time, $request_id);
        } finally {
            // Cleanup and final logging
            $this->cleanupRequest($request_id, $start_time);
        }
    }    

    /**
     * Process deprecated AJAX requests with warnings
     */
    public function processDeprecatedRequest() {
        $old_action = str_replace('wp_ajax_', '', current_action());
        $new_action = $this->deprecated_endpoints[$old_action] ?? null;
        
        if (!$new_action) {
            $this->response_manager->error('Deprecated endpoint not found', 'deprecated_endpoint');
            return;
        }
        
        // Log deprecation warning
        error_log("MAS V2: Deprecated AJAX endpoint used: {$old_action} -> use {$new_action} instead");
        
        // Add deprecation notice to response
        $this->response_manager->addMetadata('deprecation_warning', [
            'old_endpoint' => $old_action,
            'new_endpoint' => $new_action,
            'message' => 'This endpoint is deprecated and will be removed in a future version'
        ]);
        
        // Process as new endpoint
        $_POST['action'] = $new_action;
        $this->processAjaxRequest();
    }
    
    /**
     * Handle security exceptions
     */
    private function handleSecurityException(SecurityException $e, $action, $start_time) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        // Record failed performance metrics
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, false, [
            'error_type' => 'security',
            'violation_type' => $e->getViolationType()
        ]);
        
        // Log security violation (already handled by security manager)
        $error_id = $this->error_logger->logSecurityViolation($e->getViolationType(), [
            'action' => $action,
            'message' => $e->getMessage(),
            'execution_time' => $execution_time
        ]);
        
        // Send security error response
        $this->response_manager->securityError($e->getMessage(), $e->getViolationType(), [
            'error_id' => $error_id
        ]);
    }
    
    /**
     * Handle general exceptions
     * ENHANCED: Added request_id parameter and better error context
     */
    private function handleGeneralException(\Exception $e, $action, $start_time, $request_id = null) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        // Record failed performance metrics
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, false, [
            'error_type' => get_class($e),
            'error_message' => $e->getMessage(),
            'request_id' => $request_id
        ]);
        
        // Log error with comprehensive context
        $error_id = $this->error_logger->logAjaxError($action, $e, $_POST, [
            'execution_time' => $execution_time,
            'request_id' => $request_id,
            'endpoint_config' => $this->current_request['config'] ?? null,
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true)
        ]);
        
        // Send error response
        $this->response_manager->error($e->getMessage(), 'ajax_error', [
            'error_id' => $error_id,
            'request_id' => $request_id
        ]);
    }
    
    /**
     * Handle security exceptions
     * ENHANCED: Added request_id parameter and better error context
     */
    private function handleSecurityException(SecurityException $e, $action, $start_time, $request_id = null) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        
        // Record failed performance metrics
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, false, [
            'error_type' => 'security',
            'violation_type' => $e->getViolationType(),
            'request_id' => $request_id
        ]);
        
        // Log security violation (already handled by security manager)
        $error_id = $this->error_logger->logSecurityViolation($e->getViolationType(), [
            'action' => $action,
            'message' => $e->getMessage(),
            'execution_time' => $execution_time,
            'request_id' => $request_id
        ]);
        
        // Send security error response
        $this->response_manager->securityError($e->getMessage(), $e->getViolationType(), [
            'error_id' => $error_id,
            'request_id' => $request_id
        ]);
    }
    
    /**
     * Validate request structure before processing
     * ENHANCED: Better validation for AJAX requests
     */
    private function validateRequestStructure($post_data) {
        // Check if required fields are present
        if (!isset($post_data['action'])) {
            throw new \Exception('Missing required action parameter');
        }
        
        if (!isset($post_data['nonce'])) {
            throw new \Exception('Missing required nonce parameter');
        }
        
        // Check for suspicious request patterns
        $suspicious_patterns = [
            'eval(',
            'base64_decode(',
            'exec(',
            'system(',
            'shell_exec(',
            'passthru(',
            '<script',
            'javascript:',
            'vbscript:'
        ];
        
        $request_string = serialize($post_data);
        foreach ($suspicious_patterns as $pattern) {
            if (stripos($request_string, $pattern) !== false) {
                throw new SecurityException(
                    'Suspicious request pattern detected',
                    'malicious_input'
                );
            }
        }
        
        // Validate request size (prevent DoS attacks)
        $max_request_size = 1024 * 1024; // 1MB
        if (strlen($request_string) > $max_request_size) {
            throw new \Exception('Request size exceeds maximum allowed limit');
        }
        
        return true;
    }
    
    /**
     * Cleanup request resources and perform final logging
     * ENHANCED: Better resource cleanup and monitoring
     */
    private function cleanupRequest($request_id, $start_time) {
        $execution_time = (microtime(true) - $start_time) * 1000;
        $memory_usage = memory_get_usage(true);
        $memory_peak = memory_get_peak_usage(true);
        
        // Log request completion
        error_log(sprintf(
            'MAS V2 AJAX Request Complete [%s]: %s | Time: %.2fms | Memory: %s | Peak: %s',
            $request_id,
            $this->current_request['action'] ?? 'unknown',
            $execution_time,
            number_format($memory_usage / 1024 / 1024, 2) . 'MB',
            number_format($memory_peak / 1024 / 1024, 2) . 'MB'
        ));
        
        // Clear current request data
        $this->current_request = null;
        
        // Force garbage collection for long-running requests
        if ($execution_time > 5000) { // 5 seconds
            gc_collect_cycles();
        }
        
        // Check memory usage and warn if high
        if ($memory_peak > 50 * 1024 * 1024) { // 50MB
            error_log(sprintf(
                'MAS V2 High Memory Usage Warning [%s]: Peak usage %s for action %s',
                $request_id,
                number_format($memory_peak / 1024 / 1024, 2) . 'MB',
                $this->current_request['action'] ?? 'unknown'
            ));
        }
    } 
   
    /**
     * Handle save live settings - Consistent handler structure
     */
    public function handleSaveLiveSettings($action, $config) {
        try {
            // Get current settings
            $current_settings = $this->settings_manager->getSettings();
            
            // Process form data
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            
            // Update settings
            foreach ($form_data as $option_id => $value) {
                if ($option_id === 'settings') {
                    $bulk_settings = json_decode(stripslashes($value), true);
                    if (is_array($bulk_settings)) {
                        foreach ($bulk_settings as $bulk_option => $bulk_value) {
                            $current_settings[$bulk_option] = sanitize_text_field($bulk_value);
                        }
                    }
                } else {
                    $current_settings[$option_id] = sanitize_text_field($value);
                }
            }
            
            // Save settings
            $result = $this->settings_manager->saveSettings($current_settings);
            
            if ($result !== false) {
                $this->response_manager->success([
                    'settings' => $current_settings,
                    'updated_options' => array_keys($form_data)
                ], __('Live settings saved successfully!', 'woow-admin-styler'), 'live_settings_saved');
            } else {
                $this->response_manager->databaseError(
                    __('Failed to save settings to database.', 'woow-admin-styler'),
                    'save_live_settings'
                );
            }
            
        } catch (\Exception $e) {
            throw $e; // Re-throw for unified error handling
        }
    }
    
    /**
     * Handle get live settings - Consistent handler structure
     */
    public function handleGetLiveSettings($action, $config) {
        try {
            $settings = $this->settings_manager->getSettings();
            
            $this->response_manager->success([
                'settings' => $settings
            ], __('Settings retrieved successfully!', 'woow-admin-styler'), 'live_settings_loaded');
            
        } catch (\Exception $e) {
            throw $e; // Re-throw for unified error handling
        }
    }
    
    /**
     * Handle reset live setting - Consistent handler structure
     */
    public function handleResetLiveSetting($action, $config) {
        try {
            $option_id = sanitize_text_field($_POST['option_id'] ?? '');
            
            if (empty($option_id)) {
                throw new ValidationException(__('Option ID is required', 'woow-admin-styler'), 'option_id', 'required');
            }
            
            $current_settings = $this->settings_manager->getSettings();
            $default_settings = $this->settings_manager->getDefaultSettings();
            
            if (isset($default_settings[$option_id])) {
                $current_settings[$option_id] = $default_settings[$option_id];
                $result = $this->settings_manager->saveSettings($current_settings);
                
                if ($result !== false) {
                    $this->response_manager->success([
                        'option_id' => $option_id,
                        'default_value' => $default_settings[$option_id],
                        'settings' => $current_settings
                    ], sprintf(__('Option %s reset to default value!', 'woow-admin-styler'), $option_id), 'setting_reset');
                } else {
                    $this->response_manager->databaseError(__('Failed to save reset setting', 'woow-admin-styler'), 'reset_setting');
                }
            } else {
                throw new ValidationException(__('Unknown option', 'woow-admin-styler'), 'option_id', 'unknown_option');
            }
            
        } catch (\Exception $e) {
            throw $e; // Re-throw for unified error handling
        }
    }  
  
    /**
     * Handle save settings - Consistent handler structure
     */
    public function handleSaveSettings($action, $config) {
        try {
            $form_data = $_POST;
            unset($form_data['nonce'], $form_data['action']);
            
            $old_settings = $this->settings_manager->getSettings();
            $settings = $this->settings_manager->sanitizeSettings($form_data);
            $result = $this->settings_manager->saveSettings($settings);
            
            $is_success = ($result === true || serialize($settings) === serialize($old_settings));
            
            if ($is_success) {
                $this->response_manager->success([
                    'settings' => $settings
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
     * Handle reset settings - Consistent handler structure
     */
    public function handleResetSettings($action, $config) {
        try {
            $defaults = $this->settings_manager->getDefaultSettings();
            $this->settings_manager->saveSettings($defaults);
            
            $this->response_manager->success([
                'settings' => $defaults
            ], __('Settings reset to defaults!', 'woow-admin-styler'), 'settings_reset');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle export settings - Consistent handler structure
     */
    public function handleExportSettings($action, $config) {
        try {
            $settings = $this->settings_manager->getSettings();
            $export_data = [
                'version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '2.4.0',
                'exported' => current_time('mysql'),
                'settings' => $settings
            ];
            
            $this->response_manager->success([
                'data' => $export_data,
                'filename' => 'mas-v2-settings-' . date('Y-m-d') . '.json'
            ], __('Settings exported successfully!', 'woow-admin-styler'), 'settings_exported');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Handle import settings - Consistent handler structure
     */
    public function handleImportSettings($action, $config) {
        try {
            $import_data = json_decode(stripslashes($_POST['data'] ?? ''), true);
            
            if (!$import_data || !isset($import_data['settings'])) {
                throw new ValidationException(__('Invalid file format', 'woow-admin-styler'), 'data', 'invalid_format');
            }
            
            $settings = $this->settings_manager->sanitizeSettings($import_data['settings']);
            $this->settings_manager->saveSettings($settings);
            
            $this->response_manager->success([
                'settings' => $settings
            ], __('Settings imported successfully!', 'woow-admin-styler'), 'settings_imported');
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    
    /**
     * Handle restore defaults - Consistent handler structure
     */
    public function handleRestoreDefaults($action, $config) {
        try {
            // Get default settings
            $default_settings = $this->settings_manager->getDefaultSettings();
            
            if (empty($default_settings)) {
                throw new \Exception(__('Default settings not available', 'woow-admin-styler'));
            }
            
            // Save default settings
            $result = $this->settings_manager->saveSettings($default_settings);
            
            if ($result !== false) {
                // Clear any cached settings
                wp_cache_delete('mas_v2_settings', 'options');
                
                // Log the restore action
                error_log('MAS V2: Settings restored to defaults by user ' . get_current_user_id());
                
                $this->response_manager->success([
                    'settings' => $default_settings,
                    'restored_count' => count($default_settings)
                ], __('All settings restored to default values!', 'woow-admin-styler'), 'defaults_restored');
            } else {
                $this->response_manager->databaseError(
                    __('Failed to restore default settings to database.', 'woow-admin-styler'),
                    'restore_defaults'
                );
            }
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Parse memory limit string to bytes
     */
    private function parseMemoryLimit($limit) {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit)-1]);
        $limit = (int) $limit;
        
        switch($last) {
            case 'g': $limit *= 1024;
            case 'm': $limit *= 1024;
            case 'k': $limit *= 1024;
        }
        
        return $limit;
    }
    
    /**
     * Get registered endpoints (for backward compatibility)
     */
    public function getEndpoints() {
        return $this->endpoints;
    }
    
    /**
     * Get deprecated endpoints mapping (for backward compatibility)
     */
    public function getDeprecatedEndpoints() {
        return $this->deprecated_endpoints ?? [];
    }
}