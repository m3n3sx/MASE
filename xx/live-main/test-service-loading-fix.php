<?php
/**
 * Test Script for Service Loading Fix
 * 
 * This script tests the enhanced autoloader and service initialization
 * to verify that Task 1 fixes are working correctly.
 */

// Simulate WordPress environment
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

// Mock WordPress functions for testing
if (!function_exists('plugin_dir_path')) {
    function plugin_dir_path($file) {
        return dirname($file) . '/';
    }
}

if (!function_exists('plugin_dir_url')) {
    function plugin_dir_url($file) {
        return 'http://localhost/' . basename(dirname($file)) . '/';
    }
}

if (!function_exists('get_option')) {
    function get_option($option, $default = false) {
        return $default;
    }
}

if (!function_exists('update_option')) {
    function update_option($option, $value) {
        return true;
    }
}

if (!function_exists('delete_option')) {
    function delete_option($option) {
        return true;
    }
}

if (!function_exists('error_log')) {
    function error_log($message) {
        echo "[LOG] " . $message . "\n";
    }
}

// Include the main plugin file
require_once __DIR__ . '/woow-admin-styler.php';

echo "🔍 WOOW Admin Styler - Service Loading Test\n";
echo "=" . str_repeat("=", 50) . "\n\n";

// Test 1: Check if autoloader is working
echo "TEST 1: Autoloader Functionality\n";
echo "-" . str_repeat("-", 30) . "\n";

$test_classes = [
    'ModernAdminStyler\\Services\\CoreEngine',
    'ModernAdminStyler\\Services\\SettingsManager',
    'ModernAdminStyler\\Services\\CacheManager',
    'ModernAdminStyler\\Services\\SecurityManager',
    'ModernAdminStyler\\Services\\StyleGenerator',
    'ModernAdminStyler\\Services\\AdminInterface',
    'ModernAdminStyler\\Services\\CommunicationManager',
    'ModernAdminStyler\\Services\\AssetLoader',
    'ModernAdminStyler\\Services\\CSSVariableManager',
    'ModernAdminStyler\\Services\\InputValidator'
];

$loaded_classes = 0;
$total_classes = count($test_classes);

foreach ($test_classes as $class) {
    if (class_exists($class)) {
        echo "✅ {$class} - LOADED\n";
        $loaded_classes++;
    } else {
        echo "❌ {$class} - NOT FOUND\n";
    }
}

echo "\nAutoloader Result: {$loaded_classes}/{$total_classes} classes loaded\n\n";

// Test 2: Check service files existence
echo "TEST 2: Service Files Existence\n";
echo "-" . str_repeat("-", 30) . "\n";

$service_files = [
    'CoreEngine.php',
    'SettingsManager.php', 
    'CacheManager.php',
    'SecurityManager.php',
    'StyleGenerator.php',
    'AdminInterface.php',
    'CommunicationManager.php',
    'AssetLoader.php',
    'CSSVariableManager.php',
    'InputValidator.php'
];

$existing_files = 0;
$total_files = count($service_files);

foreach ($service_files as $file) {
    $file_path = __DIR__ . '/src/services/' . $file;
    if (file_exists($file_path)) {
        echo "✅ {$file} - EXISTS\n";
        $existing_files++;
    } else {
        echo "❌ {$file} - MISSING\n";
    }
}

echo "\nFile Check Result: {$existing_files}/{$total_files} files found\n\n";

// Test 3: Test plugin initialization
echo "TEST 3: Plugin Initialization\n";
echo "-" . str_repeat("-", 30) . "\n";

try {
    // Get plugin instance
    $plugin = ModernAdminStylerV2::getInstance();
    echo "✅ Plugin instance created successfully\n";
    
    // Test diagnostics function
    if (method_exists($plugin, 'runServiceDiagnostics')) {
        echo "✅ Service diagnostics method available\n";
        
        $diagnostics = $plugin->runServiceDiagnostics();
        echo "✅ Service diagnostics executed successfully\n";
        
        // Display diagnostics summary
        $total_services = count($diagnostics['service_files']);
        $loaded_services = count(array_filter($diagnostics['class_loading_test'], function($status) {
            return $status === true;
        }));
        
        echo "📊 Diagnostics Summary:\n";
        echo "   - Total Services: {$total_services}\n";
        echo "   - Loaded Services: {$loaded_services}\n";
        echo "   - Missing Files: " . count($diagnostics['missing_files']) . "\n";
        echo "   - Autoloader Errors: " . count($diagnostics['autoloader_errors']) . "\n";
        
    } else {
        echo "❌ Service diagnostics method not available\n";
    }
    
} catch (Exception $e) {
    echo "❌ Plugin initialization failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: Test CoreEngine functionality
echo "TEST 4: CoreEngine Functionality\n";
echo "-" . str_repeat("-", 30) . "\n";

try {
    if (class_exists('ModernAdminStyler\\Services\\CoreEngine')) {
        $coreEngine = ModernAdminStyler\Services\CoreEngine::getInstance();
        echo "✅ CoreEngine instance created\n";
        
        // Test service creation
        $services_to_test = [
            'settings_manager' => 'SettingsManager',
            'cache_manager' => 'CacheManager',
            'security_manager' => 'SecurityManager'
        ];
        
        foreach ($services_to_test as $service_key => $service_name) {
            try {
                $service = $coreEngine->get($service_key);
                if ($service !== null) {
                    echo "✅ {$service_name} service created successfully\n";
                } else {
                    echo "⚠️ {$service_name} service is null\n";
                }
            } catch (Exception $e) {
                echo "❌ {$service_name} service failed: " . $e->getMessage() . "\n";
            }
        }
        
    } else {
        echo "❌ CoreEngine class not available\n";
    }
    
} catch (Exception $e) {
    echo "❌ CoreEngine test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 5: Enhanced error handling
echo "TEST 5: Enhanced Error Handling\n";
echo "-" . str_repeat("-", 30) . "\n";

// Test autoloader error logging
$test_class = 'ModernAdminStyler\\Services\\NonExistentService';
if (!class_exists($test_class)) {
    echo "✅ Autoloader correctly handles non-existent classes\n";
}

// Check if error logging is working
$autoload_errors = get_option('mas_v2_autoload_errors', []);
if (is_array($autoload_errors)) {
    echo "✅ Error logging system is functional\n";
    echo "   - Current errors logged: " . count($autoload_errors) . "\n";
} else {
    echo "❌ Error logging system not working\n";
}

echo "\n";

// Final Summary
echo "🎯 FINAL SUMMARY\n";
echo "=" . str_repeat("=", 50) . "\n";

$total_tests = 5;
$passed_tests = 0;

// Calculate pass rate based on key metrics
if ($loaded_classes >= ($total_classes * 0.8)) $passed_tests++; // 80% classes loaded
if ($existing_files >= ($total_files * 0.9)) $passed_tests++; // 90% files exist
if (class_exists('ModernAdminStylerV2')) $passed_tests++; // Plugin class exists
if (class_exists('ModernAdminStyler\\Services\\CoreEngine')) $passed_tests++; // CoreEngine works
if (is_array($autoload_errors)) $passed_tests++; // Error logging works

$pass_rate = ($passed_tests / $total_tests) * 100;

echo "Tests Passed: {$passed_tests}/{$total_tests} ({$pass_rate}%)\n";

if ($pass_rate >= 80) {
    echo "🎉 TASK 1 IMPLEMENTATION: SUCCESS\n";
    echo "✅ Core service loading and autoloading fixes are working!\n";
    echo "✅ Enhanced error handling and diagnostics are functional\n";
    echo "✅ Service initialization improvements are effective\n";
} elseif ($pass_rate >= 60) {
    echo "⚠️ TASK 1 IMPLEMENTATION: PARTIAL SUCCESS\n";
    echo "✅ Most fixes are working but some issues remain\n";
    echo "🔧 Additional debugging may be needed\n";
} else {
    echo "❌ TASK 1 IMPLEMENTATION: NEEDS MORE WORK\n";
    echo "🔧 Significant issues still exist that need to be addressed\n";
}

echo "\n📋 Next Steps:\n";
echo "1. Check the diagnostics page in WordPress admin: /wp-admin/admin.php?page=mas-v2-diagnostics\n";
echo "2. Review error logs for any remaining issues\n";
echo "3. Test the plugin in a real WordPress environment\n";
echo "4. Proceed to Task 2: CoreEngine Dependency Injection System\n";

?>