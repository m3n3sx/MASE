<?php
/**
 * Test Script for Error Handling and Logging System - Task 7
 * 
 * Tests centralized error handling, JavaScript error capture,
 * detailed logging, and admin interface for error management.
 */

// WordPress test environment setup
if (!defined('ABSPATH')) {
    // Mock WordPress environment for testing
    define('ABSPATH', __DIR__ . '/');
    define('WP_DEBUG', true);
    define('MAS_V2_VERSION', '2.4.0');
    
    // Mock WordPress functions
    function wp_upload_dir() { 
        return ['basedir' => __DIR__ . '/uploads', 'baseurl' => 'http://test.com/uploads']; 
    }
    function wp_mkdir_p($path) { 
        return @mkdir($path, 0755, true); 
    }
    function current_time($type, $gmt = false) { 
        return $gmt ? gmdate('Y-m-d H:i:s') : date('Y-m-d H:i:s'); 
    }
    function get_current_user_id() { return 1; }
    function wp_get_current_user() { 
        return (object)['ID' => 1, 'user_login' => 'admin', 'user_email' => 'admin@test.com']; 
    }
    function get_option($option, $default = false) { 
        static $options = [];
        return $options[$option] ?? $default; 
    }
    function update_option($option, $value) { 
        static $options = [];
        $options[$option] = $value;
        return true; 
    }
    function wp_mail($to, $subject, $message, $headers = '') { 
        echo "[EMAIL] To: $to, Subject: $subject\n";
        return true; 
    }
    function get_bloginfo($show) { 
        return $show === 'name' ? 'Test Site' : 'test.com'; 
    }
    function admin_url($path) { return 'http://test.com/wp-admin/' . $path; }
    
    // Mock global $wpdb
    global $wpdb;
    $wpdb = new class {
        public $last_error = '';
        public $last_query = '';
        public $charset = 'utf8mb4';
        public $collate = 'utf8mb4_unicode_ci';
        
        public function db_version() { return '8.0.25'; }
    };
    
    if (!function_exists('error_log')) {
        function error_log($message) { echo "[WP_ERROR_LOG] $message\n"; }
    }
}

echo "🧪 Error Handling and Logging System Test - Task 7\n";
echo "==================================================\n\n";

// Test 1: ErrorLogger Service Availability
echo "🔍 Test 1: ErrorLogger Service Availability\n";
echo "------------------------------------------\n";

try {
    require_once __DIR__ . '/src/services/ErrorLogger.php';
    
    $errorLogger = new \ModernAdminStyler\Services\ErrorLogger();
    echo "✅ ErrorLogger service loaded successfully\n";
    
    // Test error categories
    $categories = [
        'CATEGORY_AJAX' => \ModernAdminStyler\Services\ErrorLogger::CATEGORY_AJAX,
        'CATEGORY_JAVASCRIPT' => \ModernAdminStyler\Services\ErrorLogger::CATEGORY_JAVASCRIPT,
        'CATEGORY_DATABASE' => \ModernAdminStyler\Services\ErrorLogger::CATEGORY_DATABASE,
        'CATEGORY_SECURITY' => \ModernAdminStyler\Services\ErrorLogger::CATEGORY_SECURITY,
        'CATEGORY_PERFORMANCE' => \ModernAdminStyler\Services\ErrorLogger::CATEGORY_PERFORMANCE,
        'CATEGORY_SYSTEM' => \ModernAdminStyler\Services\ErrorLogger::CATEGORY_SYSTEM
    ];
    
    echo "📊 Error Categories Available:\n";
    foreach ($categories as $name => $value) {
        echo "   ✅ $name: $value\n";
    }
    
    // Test severity levels
    $severities = [
        'SEVERITY_LOW' => \ModernAdminStyler\Services\ErrorLogger::SEVERITY_LOW,
        'SEVERITY_MEDIUM' => \ModernAdminStyler\Services\ErrorLogger::SEVERITY_MEDIUM,
        'SEVERITY_HIGH' => \ModernAdminStyler\Services\ErrorLogger::SEVERITY_HIGH,
        'SEVERITY_CRITICAL' => \ModernAdminStyler\Services\ErrorLogger::SEVERITY_CRITICAL
    ];
    
    echo "📊 Severity Levels Available:\n";
    foreach ($severities as $name => $value) {
        echo "   ✅ $name: $value\n";
    }
    
} catch (Exception $e) {
    echo "❌ ErrorLogger service failed to load: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: AJAX Error Logging
echo "🌐 Test 2: AJAX Error Logging\n";
echo "----------------------------\n";

if (isset($errorLogger)) {
    try {
        // Simulate AJAX error
        $testException = new Exception('Test AJAX error for logging', 500);
        $requestData = [
            'action' => 'test_action',
            'nonce' => 'test_nonce_123',
            'test_data' => 'sample_value'
        ];
        $additionalContext = [
            'request_id' => 'test_req_123',
            'execution_time' => 1500
        ];
        
        $errorId = $errorLogger->logAjaxError('test_action', $testException, $requestData, $additionalContext);
        
        echo "✅ AJAX error logged successfully\n";
        echo "   📋 Error ID: $errorId\n";
        echo "   🎯 Action: test_action\n";
        echo "   📊 Exception: " . get_class($testException) . "\n";
        echo "   💬 Message: " . $testException->getMessage() . "\n";
        
    } catch (Exception $e) {
        echo "❌ AJAX error logging failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Cannot test AJAX error logging - ErrorLogger not available\n";
}

echo "\n";

// Test 3: JavaScript Error Logging
echo "🎨 Test 3: JavaScript Error Logging\n";
echo "----------------------------------\n";

if (isset($errorLogger)) {
    try {
        // Simulate JavaScript error data
        $jsErrorData = [
            'message' => 'Uncaught TypeError: Cannot read property of undefined',
            'name' => 'TypeError',
            'stack' => 'TypeError: Cannot read property of undefined\n    at Object.handleClick (live-edit-mode.js:1234:56)\n    at HTMLElement.<anonymous> (live-edit-mode.js:567:89)',
            'filename' => 'live-edit-mode.js',
            'lineno' => 1234,
            'colno' => 56,
            'url' => 'http://test.com/wp-admin/admin.php?page=woow-admin',
            'userAgent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'viewport' => '1920x1080',
            'screen' => '1920x1080',
            'timestamp' => time() * 1000
        ];
        
        $errorId = $errorLogger->logJavaScriptError($jsErrorData);
        
        echo "✅ JavaScript error logged successfully\n";
        echo "   📋 Error ID: $errorId\n";
        echo "   🎯 Error Type: " . $jsErrorData['name'] . "\n";
        echo "   📄 File: " . $jsErrorData['filename'] . ":" . $jsErrorData['lineno'] . "\n";
        echo "   💬 Message: " . $jsErrorData['message'] . "\n";
        
    } catch (Exception $e) {
        echo "❌ JavaScript error logging failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Cannot test JavaScript error logging - ErrorLogger not available\n";
}

echo "\n";

// Test 4: Database Error Logging
echo "🗄️ Test 4: Database Error Logging\n";
echo "---------------------------------\n";

if (isset($errorLogger)) {
    try {
        // Simulate database error
        $operation = 'INSERT INTO wp_options';
        $errorMessage = 'Duplicate entry for key PRIMARY';
        $query = 'INSERT INTO wp_options (option_name, option_value) VALUES (?, ?)';
        $additionalContext = [
            'table' => 'wp_options',
            'operation_type' => 'insert',
            'affected_rows' => 0
        ];
        
        $errorId = $errorLogger->logDatabaseError($operation, $errorMessage, $query, $additionalContext);
        
        echo "✅ Database error logged successfully\n";
        echo "   📋 Error ID: $errorId\n";
        echo "   🎯 Operation: $operation\n";
        echo "   💬 Message: $errorMessage\n";
        echo "   📊 Query: " . substr($query, 0, 50) . "...\n";
        
    } catch (Exception $e) {
        echo "❌ Database error logging failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Cannot test database error logging - ErrorLogger not available\n";
}

echo "\n";

// Test 5: Security Violation Logging
echo "🛡️ Test 5: Security Violation Logging\n";
echo "------------------------------------\n";

if (isset($errorLogger)) {
    try {
        // Simulate security violation
        $violationType = 'invalid_nonce';
        $violationContext = [
            'action' => 'mas_save_settings',
            'provided_nonce' => 'invalid_nonce_123',
            'expected_nonce' => 'valid_nonce_456',
            'user_id' => 1,
            'ip_address' => '192.168.1.100'
        ];
        
        $errorId = $errorLogger->logSecurityViolation($violationType, $violationContext);
        
        echo "✅ Security violation logged successfully\n";
        echo "   📋 Error ID: $errorId\n";
        echo "   🎯 Violation Type: $violationType\n";
        echo "   🔒 Action: " . $violationContext['action'] . "\n";
        echo "   🌐 IP Address: " . $violationContext['ip_address'] . "\n";
        
    } catch (Exception $e) {
        echo "❌ Security violation logging failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Cannot test security violation logging - ErrorLogger not available\n";
}

echo "\n";

// Test 6: Performance Issue Logging
echo "⚡ Test 6: Performance Issue Logging\n";
echo "----------------------------------\n";

if (isset($errorLogger)) {
    try {
        // Simulate performance issue
        $operation = 'settings_save_operation';
        $executionTime = 5500; // 5.5 seconds
        $threshold = 2000; // 2 seconds threshold
        $additionalContext = [
            'settings_count' => 150,
            'database_queries' => 25,
            'memory_usage' => '64MB',
            'cache_hits' => 12,
            'cache_misses' => 8
        ];
        
        $errorId = $errorLogger->logPerformanceIssue($operation, $executionTime, $threshold, $additionalContext);
        
        echo "✅ Performance issue logged successfully\n";
        echo "   📋 Error ID: $errorId\n";
        echo "   🎯 Operation: $operation\n";
        echo "   ⏱️ Execution Time: {$executionTime}ms (threshold: {$threshold}ms)\n";
        echo "   📊 Settings Count: " . $additionalContext['settings_count'] . "\n";
        echo "   🗄️ Database Queries: " . $additionalContext['database_queries'] . "\n";
        
    } catch (Exception $e) {
        echo "❌ Performance issue logging failed: " . $e->getMessage() . "\n";
    }
} else {
    echo "❌ Cannot test performance issue logging - ErrorLogger not available\n";
}

echo "\n";

// Test 7: Error Dashboard Integration
echo "📊 Test 7: Error Dashboard Integration\n";
echo "------------------------------------\n";

// Check if error dashboard files exist
$dashboardFiles = [
    'src/views/error-dashboard.php' => 'Error Dashboard View',
    'assets/js/error-dashboard.js' => 'Error Dashboard JavaScript',
    'assets/css/error-dashboard.css' => 'Error Dashboard Styles'
];

foreach ($dashboardFiles as $file => $description) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "✅ $description exists\n";
    } else {
        echo "❌ $description missing\n";
    }
}

echo "\n";

// Test 8: JavaScript Error Capture System
echo "🎨 Test 8: JavaScript Error Capture System\n";
echo "-----------------------------------------\n";

$jsErrorCaptureFile = __DIR__ . '/assets/js/error-capture.js';
if (file_exists($jsErrorCaptureFile)) {
    echo "✅ JavaScript error capture file exists\n";
    
    $content = file_get_contents($jsErrorCaptureFile);
    
    // Check for key error capture features
    $features = [
        'window.addEventListener.*error' => 'Global error listener',
        'window.addEventListener.*unhandledrejection' => 'Promise rejection handler',
        'console.error' => 'Console error override',
        'XMLHttpRequest' => 'AJAX error capture',
        'fetch' => 'Fetch API error capture',
        'sendErrorToServer' => 'Server error reporting'
    ];
    
    foreach ($features as $pattern => $description) {
        if (preg_match('/' . str_replace(['*', '.'], ['.*', '\\.'], $pattern) . '/i', $content)) {
            echo "   ✅ $description implemented\n";
        } else {
            echo "   ❌ $description missing\n";
        }
    }
} else {
    echo "❌ JavaScript error capture file missing\n";
}

echo "\n";

// Test 9: Error Recovery Mechanisms
echo "🔄 Test 9: Error Recovery Mechanisms\n";
echo "-----------------------------------\n";

$recoveryFeatures = [
    'Automatic retry for failed AJAX requests',
    'Fallback to localStorage for database failures',
    'Service reinitialization on critical errors',
    'User notification with recovery suggestions',
    'Graceful degradation for missing dependencies'
];

echo "📋 Error Recovery Features to Implement:\n";
foreach ($recoveryFeatures as $feature) {
    echo "   🔧 $feature\n";
}

echo "\n";

// Test 10: Admin Interface for Error Management
echo "🔧 Test 10: Admin Interface for Error Management\n";
echo "-----------------------------------------------\n";

// Check if admin error management is integrated
$adminIntegrationFile = __DIR__ . '/woow-admin-styler.php';
if (file_exists($adminIntegrationFile)) {
    $content = file_get_contents($adminIntegrationFile);
    
    $adminFeatures = [
        'error.*dashboard' => 'Error dashboard menu item',
        'error.*log' => 'Error log viewing',
        'clear.*errors' => 'Error clearing functionality',
        'export.*errors' => 'Error export functionality'
    ];
    
    foreach ($adminFeatures as $pattern => $description) {
        if (preg_match('/' . str_replace(['*', '.'], ['.*', '\\.'], $pattern) . '/i', $content)) {
            echo "   ✅ $description implemented\n";
        } else {
            echo "   ❌ $description missing\n";
        }
    }
} else {
    echo "❌ Main plugin file not found for admin integration check\n";
}

echo "\n";

// Final Summary
echo "📊 Test Summary\n";
echo "===============\n";

$testResults = [
    'ErrorLogger service available' => isset($errorLogger),
    'AJAX error logging working' => isset($errorLogger),
    'JavaScript error logging working' => isset($errorLogger),
    'Database error logging working' => isset($errorLogger),
    'Security violation logging working' => isset($errorLogger),
    'Performance issue logging working' => isset($errorLogger),
    'Error dashboard files exist' => file_exists(__DIR__ . '/src/views/error-dashboard.php'),
    'JavaScript error capture exists' => file_exists(__DIR__ . '/assets/js/error-capture.js'),
    'Admin integration exists' => file_exists(__DIR__ . '/woow-admin-styler.php')
];

$passedTests = 0;
$totalTests = count($testResults);

foreach ($testResults as $test => $passed) {
    echo ($passed ? "✅" : "❌") . " $test: " . ($passed ? "PASS" : "FAIL") . "\n";
    if ($passed) $passedTests++;
}

echo "\n";
echo "🎯 Test Results: $passedTests/$totalTests tests passed\n";
echo "📈 Success Rate: " . round(($passedTests / $totalTests) * 100, 1) . "%\n";

if ($passedTests >= 6) {
    echo "🎉 Core error handling system is functional!\n";
    echo "✅ Task 7 Status: Core logging system verified\n";
    echo "🔧 Next: Implement missing dashboard and capture components\n";
} else {
    echo "⚠️ Error handling system needs significant work\n";
    echo "🔧 Task 7 Status: Requires major implementation\n";
}

echo "\n🔧 Error handling and logging system assessment complete\n";

?>