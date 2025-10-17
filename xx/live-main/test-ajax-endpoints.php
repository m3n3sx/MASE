<?php
/**
 * 🧪 AJAX Endpoints Testing Suite
 * 
 * Comprehensive testing script to verify all AJAX endpoints are properly
 * registered, secured, and returning correct response formats.
 * 
 * @package ModernAdminStyler
 * @version 2.4.1 - AJAX Testing Suite
 */

// ========================================
// 🧪 AJAX ENDPOINT TESTING CLASS
// ========================================

class AjaxEndpointTester {
    
    private $test_results = [];
    private $endpoints_to_test = [
        'mas_save_live_settings',
        'mas_get_live_settings', 
        'mas_reset_live_setting',
        'mas_v2_save_settings',
        'mas_v2_database_check'
    ];
    
    public function __construct() {
        // Ensure we're in admin context for testing
        if (!is_admin()) {
            wp_die('This test must be run in admin context');
        }
        
        // Enable debug mode for testing
        if (!defined('WP_DEBUG')) {
            define('WP_DEBUG', true);
        }
    }
    
    /**
     * 🚀 Run all tests
     */
    public function runAllTests() {
        echo "<h1>🧪 WOOW! Admin Styler - AJAX Endpoint Testing Suite</h1>\n";
        echo "<div style='font-family: monospace; background: #f0f0f0; padding: 20px;'>\n";
        
        $this->testHookRegistration();
        $this->testEndpointAvailability();
        $this->testSecurityValidation();
        $this->testResponseFormats();
        $this->testPerformance();
        
        $this->displayResults();
        
        echo "</div>\n";
    }
    
    /**
     * 🔗 Test hook registration
     */
    private function testHookRegistration() {
        echo "<h2>🔗 Testing Hook Registration</h2>\n";
        
        foreach ($this->endpoints_to_test as $endpoint) {
            $hook_name = "wp_ajax_{$endpoint}";
            $is_registered = has_action($hook_name);
            
            $this->test_results['hooks'][$endpoint] = $is_registered;
            
            $status = $is_registered ? '✅ REGISTERED' : '❌ MISSING';
            echo "<div>{$endpoint}: {$status}</div>\n";
            
            if ($is_registered) {
                // Get hook details
                global $wp_filter;
                if (isset($wp_filter[$hook_name])) {
                    $callbacks = $wp_filter[$hook_name]->callbacks;
                    echo "<div style='margin-left: 20px; color: #666;'>Callbacks: " . count($callbacks) . "</div>\n";
                }
            }
        }
        
        echo "<br>\n";
    }
    
    /**
     * 🌐 Test endpoint availability
     */
    private function testEndpointAvailability() {
        echo "<h2>🌐 Testing Endpoint Availability</h2>\n";
        
        foreach ($this->endpoints_to_test as $endpoint) {
            echo "<div><strong>Testing {$endpoint}:</strong></div>\n";
            
            try {
                // Simulate AJAX request
                $_POST['action'] = $endpoint;
                $_POST['nonce'] = wp_create_nonce('mas_live_edit_nonce');
                
                // Capture output
                ob_start();
                
                // Trigger the action
                do_action("wp_ajax_{$endpoint}");
                
                $output = ob_get_clean();
                
                // Check if we got a response
                if (!empty($output)) {
                    $response = json_decode($output, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $this->test_results['availability'][$endpoint] = [
                            'status' => 'success',
                            'response' => $response
                        ];
                        echo "<div style='margin-left: 20px; color: green;'>✅ Endpoint responds with valid JSON</div>\n";
                    } else {
                        $this->test_results['availability'][$endpoint] = [
                            'status' => 'invalid_json',
                            'output' => $output
                        ];
                        echo "<div style='margin-left: 20px; color: orange;'>⚠️ Endpoint responds but invalid JSON</div>\n";
                    }
                } else {
                    $this->test_results['availability'][$endpoint] = [
                        'status' => 'no_response',
                        'output' => null
                    ];
                    echo "<div style='margin-left: 20px; color: red;'>❌ No response from endpoint</div>\n";
                }
                
            } catch (Exception $e) {
                $this->test_results['availability'][$endpoint] = [
                    'status' => 'exception',
                    'error' => $e->getMessage()
                ];
                echo "<div style='margin-left: 20px; color: red;'>💥 Exception: {$e->getMessage()}</div>\n";
            }
            
            // Clean up
            unset($_POST['action'], $_POST['nonce']);
        }
        
        echo "<br>\n";
    }
    
    /**
     * 🛡️ Test security validation
     */
    private function testSecurityValidation() {
        echo "<h2>🛡️ Testing Security Validation</h2>\n";
        
        foreach ($this->endpoints_to_test as $endpoint) {
            echo "<div><strong>Security test for {$endpoint}:</strong></div>\n";
            
            // Test 1: No nonce
            $this->testSecurityScenario($endpoint, 'no_nonce', [
                'action' => $endpoint
                // No nonce provided
            ]);
            
            // Test 2: Invalid nonce
            $this->testSecurityScenario($endpoint, 'invalid_nonce', [
                'action' => $endpoint,
                'nonce' => 'invalid_nonce_value'
            ]);
            
            // Test 3: Valid nonce but no capability
            if (function_exists('wp_set_current_user')) {
                // Temporarily set user with no capabilities
                $original_user = wp_get_current_user();
                wp_set_current_user(0); // No user
                
                $this->testSecurityScenario($endpoint, 'no_capability', [
                    'action' => $endpoint,
                    'nonce' => wp_create_nonce('mas_live_edit_nonce')
                ]);
                
                // Restore original user
                wp_set_current_user($original_user->ID);
            }
        }
        
        echo "<br>\n";
    }
    
    /**
     * 🛡️ Test individual security scenario
     */
    private function testSecurityScenario($endpoint, $scenario, $post_data) {
        try {
            $_POST = $post_data;
            
            ob_start();
            do_action("wp_ajax_{$endpoint}");
            $output = ob_get_clean();
            
            $response = json_decode($output, true);
            
            if ($response && isset($response['success']) && $response['success'] === false) {
                echo "<div style='margin-left: 20px; color: green;'>✅ {$scenario}: Properly rejected</div>\n";
                $this->test_results['security'][$endpoint][$scenario] = 'pass';
            } else {
                echo "<div style='margin-left: 20px; color: red;'>❌ {$scenario}: Security bypass detected</div>\n";
                $this->test_results['security'][$endpoint][$scenario] = 'fail';
            }
            
        } catch (Exception $e) {
            echo "<div style='margin-left: 20px; color: orange;'>⚠️ {$scenario}: Exception (may be expected)</div>\n";
            $this->test_results['security'][$endpoint][$scenario] = 'exception';
        }
        
        // Clean up
        $_POST = [];
    }
    
    /**
     * 📋 Test response formats
     */
    private function testResponseFormats() {
        echo "<h2>📋 Testing Response Formats</h2>\n";
        
        foreach ($this->endpoints_to_test as $endpoint) {
            if (isset($this->test_results['availability'][$endpoint]['response'])) {
                $response = $this->test_results['availability'][$endpoint]['response'];
                
                echo "<div><strong>Format test for {$endpoint}:</strong></div>\n";
                
                // Test required fields
                $required_fields = ['success', 'data'];
                $format_valid = true;
                
                foreach ($required_fields as $field) {
                    if (!isset($response[$field])) {
                        echo "<div style='margin-left: 20px; color: red;'>❌ Missing required field: {$field}</div>\n";
                        $format_valid = false;
                    } else {
                        echo "<div style='margin-left: 20px; color: green;'>✅ Has required field: {$field}</div>\n";
                    }
                }
                
                // Test data structure
                if (isset($response['data']) && is_array($response['data'])) {
                    $data_fields = ['message', 'timestamp'];
                    foreach ($data_fields as $field) {
                        if (!isset($response['data'][$field])) {
                            echo "<div style='margin-left: 20px; color: orange;'>⚠️ Missing recommended data field: {$field}</div>\n";
                        } else {
                            echo "<div style='margin-left: 20px; color: green;'>✅ Has data field: {$field}</div>\n";
                        }
                    }
                }
                
                $this->test_results['format'][$endpoint] = $format_valid;
            }
        }
        
        echo "<br>\n";
    }
    
    /**
     * ⚡ Test performance
     */
    private function testPerformance() {
        echo "<h2>⚡ Testing Performance</h2>\n";
        
        foreach ($this->endpoints_to_test as $endpoint) {
            if ($this->test_results['hooks'][$endpoint]) {
                echo "<div><strong>Performance test for {$endpoint}:</strong></div>\n";
                
                $start_time = microtime(true);
                
                // Simulate request
                $_POST['action'] = $endpoint;
                $_POST['nonce'] = wp_create_nonce('mas_live_edit_nonce');
                
                ob_start();
                do_action("wp_ajax_{$endpoint}");
                ob_get_clean();
                
                $execution_time = (microtime(true) - $start_time) * 1000;
                
                $this->test_results['performance'][$endpoint] = $execution_time;
                
                $status = $execution_time < 500 ? '✅ FAST' : ($execution_time < 1000 ? '⚠️ SLOW' : '❌ TOO SLOW');
                echo "<div style='margin-left: 20px;'>{$status} ({$execution_time}ms)</div>\n";
                
                // Clean up
                unset($_POST['action'], $_POST['nonce']);
            }
        }
        
        echo "<br>\n";
    }
    
    /**
     * 📊 Display test results summary
     */
    private function displayResults() {
        echo "<h2>📊 Test Results Summary</h2>\n";
        
        $total_endpoints = count($this->endpoints_to_test);
        $registered_hooks = count(array_filter($this->test_results['hooks'] ?? []));
        $available_endpoints = count(array_filter($this->test_results['availability'] ?? [], function($result) {
            return $result['status'] === 'success';
        }));
        
        echo "<div><strong>Hook Registration:</strong> {$registered_hooks}/{$total_endpoints} endpoints registered</div>\n";
        echo "<div><strong>Endpoint Availability:</strong> {$available_endpoints}/{$total_endpoints} endpoints responding</div>\n";
        
        // Security results
        $security_passes = 0;
        $security_total = 0;
        foreach ($this->test_results['security'] ?? [] as $endpoint => $scenarios) {
            foreach ($scenarios as $scenario => $result) {
                $security_total++;
                if ($result === 'pass') {
                    $security_passes++;
                }
            }
        }
        
        echo "<div><strong>Security Tests:</strong> {$security_passes}/{$security_total} security tests passed</div>\n";
        
        // Performance results
        $fast_endpoints = 0;
        foreach ($this->test_results['performance'] ?? [] as $endpoint => $time) {
            if ($time < 500) {
                $fast_endpoints++;
            }
        }
        
        echo "<div><strong>Performance:</strong> {$fast_endpoints}/{$total_endpoints} endpoints under 500ms</div>\n";
        
        // Overall status
        $overall_health = ($registered_hooks === $total_endpoints && 
                          $available_endpoints === $total_endpoints && 
                          $security_passes === $security_total) ? 'HEALTHY' : 'NEEDS ATTENTION';
        
        $status_color = $overall_health === 'HEALTHY' ? 'green' : 'red';
        echo "<div style='margin-top: 20px; padding: 10px; background: {$status_color}; color: white;'>";
        echo "<strong>Overall Status: {$overall_health}</strong>";
        echo "</div>\n";
        
        // Detailed results (for debugging)
        if (isset($_GET['detailed']) && $_GET['detailed'] === '1') {
            echo "<h3>🔍 Detailed Results</h3>\n";
            echo "<pre>" . print_r($this->test_results, true) . "</pre>\n";
        } else {
            echo "<div style='margin-top: 10px;'>";
            echo "<a href='?detailed=1'>View Detailed Results</a>";
            echo "</div>\n";
        }
    }
    
    /**
     * 📋 Generate test report
     */
    public function generateReport() {
        return [
            'timestamp' => current_time('mysql'),
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '2.4.1',
            'test_results' => $this->test_results,
            'recommendations' => $this->generateRecommendations()
        ];
    }
    
    /**
     * 💡 Generate recommendations based on test results
     */
    private function generateRecommendations() {
        $recommendations = [];
        
        // Check hook registration
        foreach ($this->test_results['hooks'] ?? [] as $endpoint => $registered) {
            if (!$registered) {
                $recommendations[] = "Register missing AJAX hook for {$endpoint}";
            }
        }
        
        // Check availability
        foreach ($this->test_results['availability'] ?? [] as $endpoint => $result) {
            if ($result['status'] !== 'success') {
                $recommendations[] = "Fix endpoint availability issue for {$endpoint}: {$result['status']}";
            }
        }
        
        // Check performance
        foreach ($this->test_results['performance'] ?? [] as $endpoint => $time) {
            if ($time > 1000) {
                $recommendations[] = "Optimize performance for {$endpoint} (currently {$time}ms)";
            }
        }
        
        return $recommendations;
    }
}

// ========================================
// 🚀 RUN TESTS (if accessed directly)
// ========================================

if (isset($_GET['run_ajax_tests']) && $_GET['run_ajax_tests'] === '1') {
    // Ensure WordPress is loaded
    if (!function_exists('wp_create_nonce')) {
        die('WordPress not loaded');
    }
    
    // Run the tests
    $tester = new AjaxEndpointTester();
    $tester->runAllTests();
    
    // Optionally save report
    if (isset($_GET['save_report']) && $_GET['save_report'] === '1') {
        $report = $tester->generateReport();
        file_put_contents(
            __DIR__ . '/ajax-test-report-' . date('Y-m-d-H-i-s') . '.json',
            json_encode($report, JSON_PRETTY_PRINT)
        );
        echo "<div style='margin-top: 20px; padding: 10px; background: blue; color: white;'>";
        echo "Test report saved to ajax-test-report-" . date('Y-m-d-H-i-s') . ".json";
        echo "</div>";
    }
    
    exit;
}

// ========================================
// 🎯 QUICK TEST FUNCTIONS
// ========================================

/**
 * 🧪 Quick test for specific endpoint
 */
function quick_test_endpoint($endpoint) {
    $hook_name = "wp_ajax_{$endpoint}";
    
    echo "Testing {$endpoint}:\n";
    echo "- Hook registered: " . (has_action($hook_name) ? 'YES' : 'NO') . "\n";
    
    if (has_action($hook_name)) {
        // Test with valid nonce
        $_POST['action'] = $endpoint;
        $_POST['nonce'] = wp_create_nonce('mas_live_edit_nonce');
        
        ob_start();
        do_action($hook_name);
        $output = ob_get_clean();
        
        echo "- Response: " . (!empty($output) ? 'YES' : 'NO') . "\n";
        
        if (!empty($output)) {
            $response = json_decode($output, true);
            echo "- Valid JSON: " . (json_last_error() === JSON_ERROR_NONE ? 'YES' : 'NO') . "\n";
            
            if ($response) {
                echo "- Success field: " . (isset($response['success']) ? 'YES' : 'NO') . "\n";
                echo "- Data field: " . (isset($response['data']) ? 'YES' : 'NO') . "\n";
            }
        }
        
        unset($_POST['action'], $_POST['nonce']);
    }
    
    echo "\n";
}

/**
 * 📊 Get AJAX endpoints status
 */
function get_ajax_status() {
    $endpoints = [
        'mas_save_live_settings',
        'mas_get_live_settings',
        'mas_reset_live_setting',
        'mas_v2_save_settings',
        'mas_v2_database_check'
    ];
    
    $status = [];
    
    foreach ($endpoints as $endpoint) {
        $hook_name = "wp_ajax_{$endpoint}";
        $status[$endpoint] = [
            'hook_registered' => has_action($hook_name),
            'hook_name' => $hook_name
        ];
    }
    
    return $status;
}

?>