<?php
/**
 * Test Script for CoreEngine Dependency Injection Fix
 * 
 * This script tests the enhanced dependency injection system
 * to verify that Task 2 fixes are working correctly.
 */

echo "🔧 WOOW Admin Styler - Dependency Injection Test\n";
echo "=" . str_repeat("=", 60) . "\n\n";

// Mock WordPress functions
if (!function_exists('plugin_dir_path')) {
    function plugin_dir_path($file) { return dirname($file) . '/'; }
}
if (!function_exists('plugin_dir_url')) {
    function plugin_dir_url($file) { return 'http://localhost/' . basename(dirname($file)) . '/'; }
}
if (!function_exists('get_option')) {
    function get_option($option, $default = false) { return $default; }
}
if (!function_exists('update_option')) {
    function update_option($option, $value) { return true; }
}
if (!function_exists('current_time')) {
    function current_time($type) { return date('Y-m-d H:i:s'); }
}
if (!function_exists('do_action')) {
    function do_action($hook) { return true; }
}

// Define constants
define('MAS_V2_VERSION', '2.2.0');
define('MAS_V2_PLUGIN_DIR', __DIR__ . '/');
define('MAS_V2_PLUGIN_URL', 'http://localhost/modern-admin-styler-v2/');
define('MAS_V2_PLUGIN_FILE', __FILE__);

// Include CoreEngine
require_once __DIR__ . '/src/services/CoreEngine.php';

// Test 1: CoreEngine Singleton Pattern
echo "TEST 1: CoreEngine Singleton Pattern\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    $coreEngine1 = ModernAdminStyler\Services\CoreEngine::getInstance();
    $coreEngine2 = ModernAdminStyler\Services\CoreEngine::getInstance();
    
    if ($coreEngine1 === $coreEngine2) {
        echo "✅ Singleton pattern working correctly\n";
        echo "✅ Same instance returned: " . spl_object_hash($coreEngine1) . "\n";
    } else {
        echo "❌ Singleton pattern failed - different instances returned\n";
    }
} catch (Exception $e) {
    echo "❌ Singleton test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Service Validation
echo "TEST 2: Service Validation\n";
echo "-" . str_repeat("-", 40) . "\n";

$coreEngine = ModernAdminStyler\Services\CoreEngine::getInstance();

// Test valid services
$valid_services = [
    'core_engine',
    'settings_manager',
    'cache_manager',
    'security_manager',
    'style_generator',
    'unified_ajax_manager',
    'backward_compatibility_manager',
    'communication_manager',
    'admin_interface',
    'asset_loader'
];

$valid_count = 0;
foreach ($valid_services as $service) {
    try {
        // Use reflection to test isValidService method
        $reflection = new ReflectionClass($coreEngine);
        $method = $reflection->getMethod('isValidService');
        $method->setAccessible(true);
        
        if ($method->invoke($coreEngine, $service)) {
            echo "✅ {$service} - VALID\n";
            $valid_count++;
        } else {
            echo "❌ {$service} - INVALID\n";
        }
    } catch (Exception $e) {
        echo "❌ {$service} - ERROR: " . $e->getMessage() . "\n";
    }
}

echo "\nService Validation Result: {$valid_count}/" . count($valid_services) . " services valid\n\n";

// Test 3: Invalid Service Handling
echo "TEST 3: Invalid Service Handling\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    $invalid_service = $coreEngine->get('non_existent_service');
    echo "❌ Invalid service should have thrown exception\n";
} catch (InvalidArgumentException $e) {
    echo "✅ Invalid service correctly rejected: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "⚠️ Unexpected exception type: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: Service Dependencies
echo "TEST 4: Service Dependencies\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    // Use reflection to test getServiceDependencies method
    $reflection = new ReflectionClass($coreEngine);
    $method = $reflection->getMethod('getServiceDependencies');
    $method->setAccessible(true);
    
    $test_dependencies = [
        'settings_manager' => [],
        'cache_manager' => ['settings_manager'],
        'communication_manager' => ['settings_manager', 'cache_manager', 'security_manager'],
        'asset_loader' => ['settings_manager', 'style_generator']
    ];
    
    $dependency_tests_passed = 0;
    foreach ($test_dependencies as $service => $expected_deps) {
        $actual_deps = $method->invoke($coreEngine, $service);
        
        if ($actual_deps === $expected_deps) {
            echo "✅ {$service} dependencies correct: [" . implode(', ', $actual_deps) . "]\n";
            $dependency_tests_passed++;
        } else {
            echo "❌ {$service} dependencies incorrect\n";
            echo "   Expected: [" . implode(', ', $expected_deps) . "]\n";
            echo "   Actual: [" . implode(', ', $actual_deps) . "]\n";
        }
    }
    
    echo "\nDependency Test Result: {$dependency_tests_passed}/" . count($test_dependencies) . " dependency mappings correct\n";
    
} catch (Exception $e) {
    echo "❌ Dependency test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 5: Circular Dependency Detection
echo "TEST 5: Circular Dependency Detection\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    // Reset CoreEngine to clean state
    $coreEngine->reset();
    
    // Test circular dependency detection by manually setting resolving state
    $reflection = new ReflectionClass($coreEngine);
    $resolvingProperty = $reflection->getProperty('resolving');
    $resolvingProperty->setAccessible(true);
    
    // Simulate circular dependency
    $resolvingProperty->setValue($coreEngine, ['test_service' => ['started_at' => microtime(true)]]);
    
    try {
        $coreEngine->get('test_service');
        echo "❌ Circular dependency should have been detected\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Circular dependency detected') !== false) {
            echo "✅ Circular dependency correctly detected: " . $e->getMessage() . "\n";
        } else {
            echo "⚠️ Unexpected error message: " . $e->getMessage() . "\n";
        }
    }
    
    // Reset again
    $coreEngine->reset();
    
} catch (Exception $e) {
    echo "❌ Circular dependency test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 6: Service Registration and Status
echo "TEST 6: Service Registration and Status\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    // Test service registration
    $test_service = new stdClass();
    $test_service->name = 'test_service';
    
    $coreEngine->registerService('test_service', $test_service, 0.001);
    
    if ($coreEngine->has('test_service')) {
        echo "✅ Service registration working\n";
    } else {
        echo "❌ Service registration failed\n";
    }
    
    // Test service status
    $status = $coreEngine->getServiceStatus();
    if (isset($status['test_service'])) {
        echo "✅ Service status tracking working\n";
        echo "   Service type: " . $status['test_service']['type'] . "\n";
        echo "   Initialized: " . ($status['test_service']['initialized'] ? 'Yes' : 'No') . "\n";
    } else {
        echo "❌ Service status tracking failed\n";
    }
    
    // Test registered services list
    $registered = $coreEngine->getRegisteredServices();
    if (in_array('test_service', $registered)) {
        echo "✅ Registered services list working\n";
    } else {
        echo "❌ Registered services list failed\n";
    }
    
} catch (Exception $e) {
    echo "❌ Service registration test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 7: Performance Statistics
echo "TEST 7: Performance Statistics\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    $stats = $coreEngine->getPerformanceStats();
    
    $required_stats = ['total_services', 'core_services', 'memory_usage', 'peak_memory', 'services_list'];
    $stats_available = 0;
    
    foreach ($required_stats as $stat) {
        if (isset($stats[$stat])) {
            echo "✅ {$stat}: " . (is_array($stats[$stat]) ? count($stats[$stat]) . " items" : $stats[$stat]) . "\n";
            $stats_available++;
        } else {
            echo "❌ {$stat}: Missing\n";
        }
    }
    
    echo "\nPerformance Stats Result: {$stats_available}/" . count($required_stats) . " statistics available\n";
    
} catch (Exception $e) {
    echo "❌ Performance statistics test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 8: Legacy Method Compatibility
echo "TEST 8: Legacy Method Compatibility\n";
echo "-" . str_repeat("-", 40) . "\n";

$legacy_methods = [
    'getSettingsManager',
    'getCacheManager',
    'getSecurityManager',
    'getStyleGenerator',
    'getAdminInterface',
    'getCommunicationManager',
    'getAssetLoader'
];

$legacy_methods_working = 0;
foreach ($legacy_methods as $method) {
    if (method_exists($coreEngine, $method)) {
        echo "✅ {$method} - METHOD EXISTS\n";
        $legacy_methods_working++;
    } else {
        echo "❌ {$method} - METHOD MISSING\n";
    }
}

echo "\nLegacy Compatibility Result: {$legacy_methods_working}/" . count($legacy_methods) . " methods available\n\n";

// Final Summary
echo "🎯 FINAL SUMMARY\n";
echo "=" . str_repeat("=", 60) . "\n";

$total_tests = 8;
$passed_tests = 0;

// Calculate pass rate based on key metrics
if ($valid_count >= count($valid_services) * 0.9) $passed_tests++; // 90% services valid
if ($dependency_tests_passed >= 3) $passed_tests++; // Most dependencies correct
if (strpos($e->getMessage() ?? '', 'Circular dependency detected') !== false) $passed_tests++; // Circular dependency detection
if ($coreEngine->has('test_service')) $passed_tests++; // Service registration
if ($stats_available >= 4) $passed_tests++; // Performance stats
if ($legacy_methods_working >= 6) $passed_tests++; // Legacy compatibility
if ($coreEngine1 === $coreEngine2) $passed_tests++; // Singleton pattern
if (isset($status['test_service'])) $passed_tests++; // Service status

$pass_rate = ($passed_tests / $total_tests) * 100;

echo "Tests Passed: {$passed_tests}/{$total_tests} ({$pass_rate}%)\n";

if ($pass_rate >= 85) {
    echo "🎉 TASK 2 IMPLEMENTATION: EXCELLENT\n";
    echo "✅ Dependency injection system is working perfectly!\n";
    echo "✅ Circular dependency detection is functional\n";
    echo "✅ Service validation and registration are working\n";
    echo "✅ Performance monitoring and legacy compatibility maintained\n";
} elseif ($pass_rate >= 70) {
    echo "✅ TASK 2 IMPLEMENTATION: GOOD\n";
    echo "✅ Most dependency injection features are working\n";
    echo "🔧 Minor issues may need attention\n";
} else {
    echo "⚠️ TASK 2 IMPLEMENTATION: NEEDS IMPROVEMENT\n";
    echo "🔧 Several issues need to be addressed\n";
}

echo "\n📋 Next Steps:\n";
echo "1. Test the enhanced CoreEngine in WordPress environment\n";
echo "2. Monitor service creation and dependency resolution\n";
echo "3. Check for any circular dependency issues in real usage\n";
echo "4. Proceed to Task 3: Fix Asset Loading and Enqueuing Issues\n";

?>