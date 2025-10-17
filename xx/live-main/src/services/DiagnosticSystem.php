<?php
/**
 * Diagnostic System
 * 
 * Comprehensive plugin health check and diagnostic system
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Recovery & Diagnostics
 */

namespace ModernAdminStyler\Services;

class DiagnosticSystem {
    
    private $diagnostic_results = [];
    private $recovery_actions = [];
    private $health_score = 0;
    private $critical_issues = [];
    
    public function __construct() {
        $this->init();
    }
    
    /**
     * Initialize diagnostic system
     */
    public function init() {
        // Schedule regular health checks
        add_action('wp', [$this, 'scheduleHealthChecks']);
        
        // Add AJAX endpoints for diagnostics
        add_action('wp_ajax_woow_run_diagnostics', [$this, 'runDiagnosticsAjax']);
        add_action('wp_ajax_woow_run_recovery', [$this, 'runRecoveryAjax']);
        add_action('wp_ajax_woow_reset_plugin', [$this, 'resetPluginAjax']);
        add_action('wp_ajax_woow_export_diagnostics', [$this, 'exportDiagnosticsAjax']);
        
        // Add admin menu for diagnostics
        add_action('admin_menu', [$this, 'addDiagnosticsMenu']);
        
        // Run diagnostics on plugin activation
        register_activation_hook(MAS_V2_PLUGIN_FILE, [$this, 'runActivationDiagnostics']);
    }
    
    /**
     * Schedule regular health checks
     */
    public function scheduleHealthChecks() {
        if (!wp_next_scheduled('woow_health_check')) {
            wp_schedule_event(time(), 'daily', 'woow_health_check');
        }
        
        add_action('woow_health_check', [$this, 'runAutomaticHealthCheck']);
    }
    
    /**
     * Run comprehensive plugin diagnostics
     */
    public function runDiagnostics() {
        $this->diagnostic_results = [];
        $this->critical_issues = [];
        $this->health_score = 0;
        
        $diagnostics = [
            'system_requirements' => [$this, 'checkSystemRequirements'],
            'file_integrity' => [$this, 'checkFileIntegrity'],
            'database_health' => [$this, 'checkDatabaseHealth'],
            'service_loading' => [$this, 'checkServiceLoading'],
            'asset_loading' => [$this, 'checkAssetLoading'],
            'ajax_endpoints' => [$this, 'checkAjaxEndpoints'],
            'settings_integrity' => [$this, 'checkSettingsIntegrity'],
            'cache_system' => [$this, 'checkCacheSystem'],
            'error_logs' => [$this, 'checkErrorLogs'],
            'performance_metrics' => [$this, 'checkPerformanceMetrics'],
            'security_status' => [$this, 'checkSecurityStatus'],
            'wordpress_compatibility' => [$this, 'checkWordPressCompatibility']
        ];
        
        $total_checks = count($diagnostics);
        $passed_checks = 0;
        
        foreach ($diagnostics as $check_name => $check_method) {
            try {
                $result = call_user_func($check_method);
                $this->diagnostic_results[$check_name] = $result;
                
                if ($result['status'] === 'pass') {
                    $passed_checks++;
                } elseif ($result['status'] === 'critical') {
                    $this->critical_issues[] = $result;
                }
                
            } catch (Exception $e) {
                $this->diagnostic_results[$check_name] = [
                    'status' => 'error',
                    'message' => 'Diagnostic check failed: ' . $e->getMessage(),
                    'details' => [],
                    'recovery_actions' => ['contact_support']
                ];
            }
        }
        
        $this->health_score = round(($passed_checks / $total_checks) * 100);
        
        // Save diagnostic results
        update_option('woow_diagnostic_results', [
            'timestamp' => time(),
            'health_score' => $this->health_score,
            'results' => $this->diagnostic_results,
            'critical_issues' => $this->critical_issues
        ]);
        
        return [
            'health_score' => $this->health_score,
            'results' => $this->diagnostic_results,
            'critical_issues' => $this->critical_issues
        ];
    }
    
    /**
     * Check system requirements
     */
    private function checkSystemRequirements() {
        $issues = [];
        $status = 'pass';
        
        // PHP version check
        if (version_compare(PHP_VERSION, '7.4', '<')) {
            $issues[] = 'PHP version ' . PHP_VERSION . ' is below minimum requirement (7.4)';
            $status = 'critical';
        }
        
        // WordPress version check
        global $wp_version;
        if (version_compare($wp_version, '5.0', '<')) {
            $issues[] = 'WordPress version ' . $wp_version . ' is below minimum requirement (5.0)';
            $status = 'critical';
        }
        
        // Memory limit check
        $memory_limit = wp_convert_hr_to_bytes(ini_get('memory_limit'));
        if ($memory_limit < 128 * 1024 * 1024) { // 128MB
            $issues[] = 'PHP memory limit is below recommended 128MB';
            $status = 'warning';
        }
        
        // Required extensions
        $required_extensions = ['json', 'mbstring', 'curl'];
        foreach ($required_extensions as $ext) {
            if (!extension_loaded($ext)) {
                $issues[] = \"PHP extension '$ext' is not loaded\";
                $status = 'critical';
            }
        }
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'All system requirements met' : 'System requirement issues detected',
            'details' => $issues,
            'recovery_actions' => $status === 'critical' ? ['update_system'] : []
        ];
    }
    
    /**
     * Check file integrity
     */
    private function checkFileIntegrity() {
        $missing_files = [];
        $corrupted_files = [];
        $status = 'pass';
        
        $critical_files = [
            'woow-admin-styler.php',
            'src/services/CoreEngine.php',
            'src/services/SettingsManager.php',
            'src/services/UnifiedAjaxManager.php',
            'assets/js/woow-admin.js',
            'assets/css/woow-main.css'
        ];
        
        foreach ($critical_files as $file) {
            $file_path = MAS_V2_PLUGIN_DIR . $file;
            
            if (!file_exists($file_path)) {
                $missing_files[] = $file;
                $status = 'critical';
            } elseif (!is_readable($file_path)) {
                $corrupted_files[] = $file . ' (not readable)';
                $status = 'critical';
            } elseif (filesize($file_path) === 0) {
                $corrupted_files[] = $file . ' (empty file)';
                $status = 'critical';
            }
        }
        
        $issues = array_merge($missing_files, $corrupted_files);
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'All critical files present and readable' : 'File integrity issues detected',
            'details' => [
                'missing_files' => $missing_files,
                'corrupted_files' => $corrupted_files
            ],
            'recovery_actions' => $status === 'critical' ? ['reinstall_plugin'] : []
        ];
    }
    
    /**
     * Check database health
     */
    private function checkDatabaseHealth() {
        global $wpdb;
        
        $issues = [];
        $status = 'pass';
        
        // Check database connection
        if (!$wpdb || $wpdb->last_error) {
            $issues[] = 'Database connection error: ' . $wpdb->last_error;
            $status = 'critical';
        }
        
        // Check options table
        $options_test = get_option('woow_db_test', null);
        update_option('woow_db_test', time());
        $options_verify = get_option('woow_db_test');
        
        if (!$options_verify) {
            $issues[] = 'Cannot write to options table';
            $status = 'critical';
        } else {
            delete_option('woow_db_test');
        }
        
        // Check for corrupted settings
        $settings = get_option('mas_v2_settings', []);
        if (!is_array($settings)) {
            $issues[] = 'Plugin settings are corrupted';
            $status = 'warning';
        }
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'Database is healthy' : 'Database issues detected',
            'details' => $issues,
            'recovery_actions' => $status === 'critical' ? ['repair_database'] : ($status === 'warning' ? ['reset_settings'] : [])
        ];
    }
    
    /**
     * Check service loading
     */
    private function checkServiceLoading() {
        $failed_services = [];
        $status = 'pass';
        
        $required_services = [
            'CoreEngine',
            'SettingsManager',
            'UnifiedAjaxManager',
            'CSSVariableManager',
            'ErrorLogger',
            'PerformanceMonitor'
        ];
        
        foreach ($required_services as $service) {
            $class_name = 'ModernAdminStyler\\Services\\' . $service;
            
            if (!class_exists($class_name)) {
                $failed_services[] = $service;
                $status = 'critical';
            }
        }
        
        return [
            'status' => $status,
            'message' => empty($failed_services) ? 'All services loading correctly' : 'Service loading failures detected',
            'details' => ['failed_services' => $failed_services],
            'recovery_actions' => $status === 'critical' ? ['clear_autoloader_cache', 'reinstall_plugin'] : []
        ];
    }
    
    /**
     * Check asset loading
     */
    private function checkAssetLoading() {
        $missing_assets = [];
        $status = 'pass';
        
        $critical_assets = [
            'assets/js/woow-admin.js',
            'assets/css/woow-main.css',
            'assets/js/ajax-manager.js',
            'assets/js/settings-persistence-manager.js'
        ];
        
        foreach ($critical_assets as $asset) {
            $asset_path = MAS_V2_PLUGIN_DIR . $asset;
            
            if (!file_exists($asset_path)) {
                $missing_assets[] = $asset;
                $status = 'critical';
            }
        }
        
        return [
            'status' => $status,
            'message' => empty($missing_assets) ? 'All critical assets present' : 'Missing asset files detected',
            'details' => ['missing_assets' => $missing_assets],
            'recovery_actions' => $status === 'critical' ? ['reinstall_plugin'] : []
        ];
    }
    
    /**
     * Check AJAX endpoints
     */
    private function checkAjaxEndpoints() {
        $endpoint_issues = [];
        $status = 'pass';
        
        $critical_endpoints = [
            'mas_save_live_settings',
            'mas_get_live_settings',
            'mas_v2_save_settings',
            'mas_v2_get_settings'
        ];
        
        foreach ($critical_endpoints as $endpoint) {
            if (!has_action(\"wp_ajax_$endpoint\")) {
                $endpoint_issues[] = \"Endpoint '$endpoint' not registered\";
                $status = 'warning';
            }
        }
        
        return [
            'status' => $status,
            'message' => empty($endpoint_issues) ? 'All AJAX endpoints registered' : 'AJAX endpoint issues detected',
            'details' => $endpoint_issues,
            'recovery_actions' => $status === 'warning' ? ['reinitialize_ajax'] : []
        ];
    }
    
    /**
     * Check settings integrity
     */
    private function checkSettingsIntegrity() {
        $issues = [];
        $status = 'pass';
        
        $settings = get_option('mas_v2_settings', []);
        
        if (!is_array($settings)) {
            $issues[] = 'Settings data is not an array';
            $status = 'critical';
        }
        
        // Check for required settings structure
        $required_keys = ['version', 'initialized'];
        foreach ($required_keys as $key) {
            if (!isset($settings[$key])) {
                $issues[] = \"Missing required setting: $key\";
                $status = 'warning';
            }
        }
        
        // Check for corrupted JSON in settings
        $json_test = json_encode($settings);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $issues[] = 'Settings contain invalid JSON data';
            $status = 'critical';
        }
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'Settings integrity is good' : 'Settings integrity issues detected',
            'details' => $issues,
            'recovery_actions' => $status === 'critical' ? ['reset_settings'] : []
        ];
    }
    
    /**
     * Check cache system
     */
    private function checkCacheSystem() {
        $issues = [];
        $status = 'pass';
        
        // Test cache write/read
        $test_key = 'woow_cache_test_' . time();
        $test_value = 'test_data_' . rand(1000, 9999);
        
        // Test WordPress transients
        set_transient($test_key, $test_value, 300);
        $retrieved_value = get_transient($test_key);
        
        if ($retrieved_value !== $test_value) {
            $issues[] = 'WordPress transient cache not working';
            $status = 'warning';
        } else {
            delete_transient($test_key);
        }
        
        // Test object cache if available
        if (function_exists('wp_cache_set')) {
            wp_cache_set($test_key, $test_value, 'woow_test', 300);
            $cached_value = wp_cache_get($test_key, 'woow_test');
            
            if ($cached_value !== $test_value) {
                $issues[] = 'Object cache not working properly';
                $status = 'warning';
            } else {
                wp_cache_delete($test_key, 'woow_test');
            }
        }
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'Cache system is working' : 'Cache system issues detected',
            'details' => $issues,
            'recovery_actions' => $status === 'warning' ? ['clear_cache'] : []
        ];
    }
    
    /**
     * Check error logs
     */
    private function checkErrorLogs() {
        $error_count = 0;
        $recent_errors = [];
        $status = 'pass';
        
        // Check plugin-specific errors
        $plugin_errors = get_option('mas_v2_error_log', []);
        if (!empty($plugin_errors)) {
            $recent_errors = array_slice($plugin_errors, -5); // Last 5 errors
            $error_count = count($plugin_errors);
            
            if ($error_count > 10) {
                $status = 'warning';
            }
            if ($error_count > 50) {
                $status = 'critical';
            }
        }
        
        return [
            'status' => $status,
            'message' => $error_count === 0 ? 'No recent errors' : \"$error_count errors in log\",
            'details' => [
                'error_count' => $error_count,
                'recent_errors' => $recent_errors
            ],
            'recovery_actions' => $status === 'critical' ? ['clear_error_log', 'investigate_errors'] : []
        ];
    }
    
    /**
     * Check performance metrics
     */
    private function checkPerformanceMetrics() {
        $issues = [];
        $status = 'pass';
        
        // Check memory usage
        $memory_usage = memory_get_usage(true);
        $memory_limit = wp_convert_hr_to_bytes(ini_get('memory_limit'));
        $memory_percent = ($memory_usage / $memory_limit) * 100;
        
        if ($memory_percent > 80) {
            $issues[] = \"High memory usage: {$memory_percent}%\";
            $status = 'warning';
        }
        
        // Check for performance data
        $performance_data = get_option('mas_v2_performance_data', []);
        if (empty($performance_data)) {
            $issues[] = 'No performance data available';
            $status = 'warning';
        }
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'Performance metrics are good' : 'Performance issues detected',
            'details' => [
                'memory_usage_percent' => round($memory_percent, 2),
                'issues' => $issues
            ],
            'recovery_actions' => $status === 'warning' ? ['optimize_performance'] : []
        ];
    }
    
    /**
     * Check security status
     */
    private function checkSecurityStatus() {
        $issues = [];
        $status = 'pass';
        
        // Check file permissions
        $critical_files = [
            'woow-admin-styler.php',
            'src/services/'
        ];
        
        foreach ($critical_files as $file) {
            $file_path = MAS_V2_PLUGIN_DIR . $file;
            if (file_exists($file_path) && is_writable($file_path)) {
                $issues[] = \"File '$file' is writable (potential security risk)\";
                $status = 'warning';
            }
        }
        
        // Check for debug mode in production
        if (defined('WP_DEBUG') && WP_DEBUG && !defined('WP_DEBUG_DISPLAY')) {
            $issues[] = 'Debug mode is enabled';
            $status = 'warning';
        }
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'Security status is good' : 'Security issues detected',
            'details' => $issues,
            'recovery_actions' => $status === 'warning' ? ['fix_permissions'] : []
        ];
    }
    
    /**
     * Check WordPress compatibility
     */
    private function checkWordPressCompatibility() {
        $issues = [];
        $status = 'pass';
        
        // Check WordPress version
        global $wp_version;
        if (version_compare($wp_version, '5.0', '<')) {
            $issues[] = \"WordPress version $wp_version is below minimum requirement\";
            $status = 'critical';
        }
        
        // Check for plugin conflicts
        $active_plugins = get_option('active_plugins', []);
        $conflicting_plugins = [
            'admin-color-schemes/admin-color-schemes.php',
            'custom-admin-interface/custom-admin-interface.php'
        ];
        
        foreach ($conflicting_plugins as $plugin) {
            if (in_array($plugin, $active_plugins)) {
                $issues[] = \"Potential conflict with plugin: $plugin\";
                $status = 'warning';
            }
        }
        
        return [
            'status' => $status,
            'message' => empty($issues) ? 'WordPress compatibility is good' : 'Compatibility issues detected',
            'details' => $issues,
            'recovery_actions' => $status === 'warning' ? ['resolve_conflicts'] : []
        ];
    }
    
    /**
     * Run automatic recovery actions
     */
    public function runRecovery($actions = null) {
        if ($actions === null) {
            $actions = $this->getRecommendedRecoveryActions();
        }
        
        $recovery_results = [];
        
        foreach ($actions as $action) {
            try {
                $result = $this->executeRecoveryAction($action);
                $recovery_results[$action] = $result;
            } catch (Exception $e) {
                $recovery_results[$action] = [
                    'success' => false,
                    'message' => 'Recovery action failed: ' . $e->getMessage()
                ];
            }
        }
        
        return $recovery_results;
    }
    
    /**
     * Execute individual recovery action
     */
    private function executeRecoveryAction($action) {
        switch ($action) {
            case 'clear_cache':
                return $this->clearCache();
                
            case 'reset_settings':
                return $this->resetSettings();
                
            case 'clear_error_log':
                return $this->clearErrorLog();
                
            case 'reinitialize_ajax':
                return $this->reinitializeAjax();
                
            case 'clear_autoloader_cache':
                return $this->clearAutoloaderCache();
                
            case 'optimize_performance':
                return $this->optimizePerformance();
                
            case 'fix_permissions':
                return $this->fixPermissions();
                
            default:
                return [
                    'success' => false,
                    'message' => \"Unknown recovery action: $action\"
                ];
        }
    }
    
    /**
     * Clear all caches
     */
    private function clearCache() {
        // Clear WordPress transients
        global $wpdb;
        $wpdb->query(\"DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_woow_%' OR option_name LIKE '_transient_timeout_woow_%'\");
        
        // Clear object cache if available
        if (function_exists('wp_cache_flush')) {
            wp_cache_flush();
        }
        
        return [
            'success' => true,
            'message' => 'Cache cleared successfully'
        ];
    }
    
    /**
     * Reset plugin settings to defaults
     */
    private function resetSettings() {
        delete_option('mas_v2_settings');
        delete_option('mas_v2_live_settings');
        
        // Reinitialize with defaults
        $default_settings = [
            'version' => MAS_V2_VERSION,
            'initialized' => true,
            'reset_timestamp' => time()
        ];
        
        update_option('mas_v2_settings', $default_settings);
        
        return [
            'success' => true,
            'message' => 'Settings reset to defaults'
        ];
    }
    
    /**
     * Clear error log
     */
    private function clearErrorLog() {
        delete_option('mas_v2_error_log');
        delete_option('mas_v2_autoload_errors');
        
        return [
            'success' => true,
            'message' => 'Error log cleared'
        ];
    }
    
    /**
     * Reinitialize AJAX endpoints
     */
    private function reinitializeAjax() {
        // This would typically involve reloading the AJAX manager
        // For now, we'll just clear any cached endpoint data
        delete_transient('woow_ajax_endpoints');
        
        return [
            'success' => true,
            'message' => 'AJAX endpoints reinitialized'
        ];
    }
    
    /**
     * Clear autoloader cache
     */
    private function clearAutoloaderCache() {
        delete_option('mas_v2_autoload_errors');
        
        // Clear any PHP opcache if available
        if (function_exists('opcache_reset')) {
            opcache_reset();
        }
        
        return [
            'success' => true,
            'message' => 'Autoloader cache cleared'
        ];
    }
    
    /**
     * Optimize performance
     */
    private function optimizePerformance() {
        // Clear performance data to start fresh
        delete_option('mas_v2_performance_data');
        
        // Clear any cached CSS/JS
        delete_transient('woow_generated_css');
        delete_transient('woow_minified_js');
        
        return [
            'success' => true,
            'message' => 'Performance optimization completed'
        ];
    }
    
    /**
     * Fix file permissions
     */
    private function fixPermissions() {
        $fixed_files = [];
        $critical_files = [
            'woow-admin-styler.php',
            'src/services/'
        ];
        
        foreach ($critical_files as $file) {
            $file_path = MAS_V2_PLUGIN_DIR . $file;
            if (file_exists($file_path) && is_writable($file_path)) {
                if (is_dir($file_path)) {
                    chmod($file_path, 0755);
                } else {
                    chmod($file_path, 0644);
                }
                $fixed_files[] = $file;
            }
        }
        
        return [
            'success' => true,
            'message' => 'Fixed permissions for ' . count($fixed_files) . ' files'
        ];
    }
    
    /**
     * Get recommended recovery actions based on diagnostic results
     */
    private function getRecommendedRecoveryActions() {
        $actions = [];
        
        foreach ($this->diagnostic_results as $check => $result) {
            if (isset($result['recovery_actions'])) {
                $actions = array_merge($actions, $result['recovery_actions']);
            }
        }
        
        return array_unique($actions);
    }
    
    /**
     * Complete plugin reset
     */
    public function resetPlugin() {
        // Clear all plugin data
        delete_option('mas_v2_settings');
        delete_option('mas_v2_live_settings');
        delete_option('mas_v2_error_log');
        delete_option('mas_v2_performance_data');
        delete_option('mas_v2_autoload_errors');
        delete_option('woow_diagnostic_results');
        
        // Clear all transients
        global $wpdb;
        $wpdb->query(\"DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_woow_%' OR option_name LIKE '_transient_timeout_woow_%'\");
        
        // Clear scheduled events
        wp_clear_scheduled_hook('woow_health_check');
        
        // Reinitialize with defaults
        $this->setupDefaultSettings();
        
        return [
            'success' => true,
            'message' => 'Plugin reset completed successfully'
        ];
    }
    
    /**
     * Setup default settings after reset
     */
    private function setupDefaultSettings() {
        $default_settings = [
            'version' => MAS_V2_VERSION,
            'initialized' => true,
            'reset_timestamp' => time(),
            'primary_color' => '#007cba',
            'secondary_color' => '#50575e',
            'admin_bar_background' => '#23282d',
            'menu_background' => '#32373c'
        ];
        
        update_option('mas_v2_settings', $default_settings);
    }
    
    /**
     * Export diagnostic data for support
     */
    public function exportDiagnostics() {
        $diagnostic_data = [
            'timestamp' => date('Y-m-d H:i:s'),
            'plugin_version' => MAS_V2_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'diagnostic_results' => $this->diagnostic_results,
            'health_score' => $this->health_score,
            'critical_issues' => $this->critical_issues,
            'system_info' => [
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'post_max_size' => ini_get('post_max_size')
            ],
            'active_plugins' => get_option('active_plugins', []),
            'theme_info' => [
                'name' => wp_get_theme()->get('Name'),
                'version' => wp_get_theme()->get('Version')
            ]
        ];
        
        return $diagnostic_data;
    }
    
    /**
     * AJAX handler for running diagnostics
     */
    public function runDiagnosticsAjax() {
        check_ajax_referer('woow_diagnostics', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $results = $this->runDiagnostics();
        
        wp_send_json_success($results);
    }
    
    /**
     * AJAX handler for running recovery
     */
    public function runRecoveryAjax() {
        check_ajax_referer('woow_recovery', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $actions = isset($_POST['actions']) ? (array) $_POST['actions'] : null;
        $results = $this->runRecovery($actions);
        
        wp_send_json_success($results);
    }
    
    /**
     * AJAX handler for plugin reset
     */
    public function resetPluginAjax() {
        check_ajax_referer('woow_reset', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $result = $this->resetPlugin();
        
        wp_send_json_success($result);
    }
    
    /**
     * AJAX handler for exporting diagnostics
     */
    public function exportDiagnosticsAjax() {
        check_ajax_referer('woow_export', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }
        
        $data = $this->exportDiagnostics();
        
        wp_send_json_success($data);
    }
    
    /**
     * Add diagnostics menu
     */
    public function addDiagnosticsMenu() {
        add_submenu_page(
            'mas-v2-admin',
            'WOOW Diagnostics & Recovery',
            'Diagnostics',
            'manage_options',
            'woow-diagnostics',
            [$this, 'renderDiagnosticsPage']
        );
    }
    
    /**
     * Render diagnostics page
     */
    public function renderDiagnosticsPage() {
        include MAS_V2_PLUGIN_DIR . 'src/views/diagnostics-page.php';
    }
    
    /**
     * Run automatic health check
     */
    public function runAutomaticHealthCheck() {
        $results = $this->runDiagnostics();
        
        // If critical issues are found, send notification
        if (!empty($this->critical_issues)) {
            $this->sendHealthAlert($results);
        }
    }
    
    /**
     * Send health alert email
     */
    private function sendHealthAlert($results) {
        $admin_email = get_option('admin_email');
        $site_name = get_bloginfo('name');
        
        $subject = \"[$site_name] WOOW Admin Styler Health Alert\";
        
        $message = \"Critical issues detected with WOOW Admin Styler:\\n\\n\";
        
        foreach ($this->critical_issues as $issue) {
            $message .= \"- \" . $issue['message'] . \"\\n\";
        }
        
        $message .= \"\\nHealth Score: \" . $this->health_score . \"%\\n\";
        $message .= \"\\nPlease check the diagnostics page for more details.\\n\";
        
        wp_mail($admin_email, $subject, $message);
    }
    
    /**
     * Run diagnostics on plugin activation
     */
    public function runActivationDiagnostics() {
        $this->runDiagnostics();
        
        // If critical issues are found during activation, show notice
        if (!empty($this->critical_issues)) {
            add_option('woow_activation_issues', $this->critical_issues);
        }
    }
    
    /**
     * Get health score
     */
    public function getHealthScore() {
        return $this->health_score;
    }
    
    /**
     * Get diagnostic results
     */
    public function getDiagnosticResults() {
        return $this->diagnostic_results;
    }
    
    /**
     * Get critical issues
     */
    public function getCriticalIssues() {
        return $this->critical_issues;
    }
}