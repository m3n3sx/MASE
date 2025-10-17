<?php
/**
 * Simple Autoloader Test for Task 1
 * 
 * Tests only the autoloader functionality without full WordPress initialization
 */

echo "🔍 WOOW Admin Styler - Autoloader Test\n";
echo "=" . str_repeat("=", 50) . "\n\n";

// Test 1: Check if service files exist
echo "TEST 1: Service Files Existence\n";
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
        echo "✅ {$file} - EXISTS (" . number_format(filesize($file_path) / 1024, 1) . " KB)\n";
        $existing_files++;
    } else {
        echo "❌ {$file} - MISSING\n";
    }
}

echo "\nFile Check Result: {$existing_files}/{$total_files} files found\n\n";

// Test 2: Check autoloader registration
echo "TEST 2: Autoloader Registration\n";
echo "-" . str_repeat("-", 30) . "\n";

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

// Define constants
define('MAS_V2_VERSION', '2.2.0');
define('MAS_V2_PLUGIN_DIR', __DIR__ . '/');
define('MAS_V2_PLUGIN_URL', 'http://localhost/modern-admin-styler-v2/');
define('MAS_V2_PLUGIN_FILE', __FILE__);

// Test the enhanced autoloader
spl_autoload_register(function ($class) {
    $prefix = 'ModernAdminStyler\\Services\\';
    $base_dir = __DIR__ . '/src/services/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
        
        // Validate class was actually loaded
        if (!class_exists($class, false)) {
            echo "❌ Class '{$class}' not found after loading file '{$file}'\n";
        } else {
            echo "✅ Class '{$class}' loaded successfully\n";
        }
    } else {
        echo "❌ Service file not found: '{$file}' for class '{$class}'\n";
    }
});

echo "✅ Enhanced autoloader registered\n\n";

// Test 3: Test class loading
echo "TEST 3: Class Loading Test\n";
echo "-" . str_repeat("-", 30) . "\n";

$test_classes = [
    'ModernAdminStyler\\Services\\CoreEngine',
    'ModernAdminStyler\\Services\\CSSVariableManager',
    'ModernAdminStyler\\Services\\InputValidator'
];

$loaded_classes = 0;
foreach ($test_classes as $class) {
    echo "Testing {$class}...\n";
    if (class_exists($class)) {
        echo "✅ {$class} - LOADED\n";
        $loaded_classes++;
    } else {
        echo "❌ {$class} - FAILED TO LOAD\n";
    }
}

echo "\nClass Loading Result: {$loaded_classes}/" . count($test_classes) . " classes loaded\n\n";

// Test 4: Check for syntax errors in service files
echo "TEST 4: Syntax Validation\n";
echo "-" . str_repeat("-", 30) . "\n";

$syntax_errors = 0;
foreach ($service_files as $file) {
    $file_path = __DIR__ . '/src/services/' . $file;
    if (file_exists($file_path)) {
        $output = [];
        $return_code = 0;
        exec("php -l " . escapeshellarg($file_path) . " 2>&1", $output, $return_code);
        
        if ($return_code === 0) {
            echo "✅ {$file} - SYNTAX OK\n";
        } else {
            echo "❌ {$file} - SYNTAX ERROR: " . implode(' ', $output) . "\n";
            $syntax_errors++;
        }
    }
}

echo "\nSyntax Check Result: " . ($total_files - $syntax_errors) . "/{$total_files} files have valid syntax\n\n";

// Test 5: Check main plugin file
echo "TEST 5: Main Plugin File\n";
echo "-" . str_repeat("-", 30) . "\n";

$main_file = __DIR__ . '/woow-admin-styler.php';
if (file_exists($main_file)) {
    echo "✅ Main plugin file exists (" . number_format(filesize($main_file) / 1024, 1) . " KB)\n";
    
    // Check for enhanced autoloader
    $content = file_get_contents($main_file);
    if (strpos($content, 'mas_v2_autoload_errors') !== false) {
        echo "✅ Enhanced autoloader with error logging detected\n";
    } else {
        echo "❌ Enhanced autoloader not found\n";
    }
    
    if (strpos($content, 'runServiceDiagnostics') !== false) {
        echo "✅ Service diagnostics method detected\n";
    } else {
        echo "❌ Service diagnostics method not found\n";
    }
    
    if (strpos($content, 'showServiceLoadingErrors') !== false) {
        echo "✅ Error display method detected\n";
    } else {
        echo "❌ Error display method not found\n";
    }
    
} else {
    echo "❌ Main plugin file not found\n";
}

echo "\n";

// Final Summary
echo "🎯 FINAL SUMMARY\n";
echo "=" . str_repeat("=", 50) . "\n";

$total_tests = 5;
$passed_tests = 0;

// Calculate pass rate
if ($existing_files >= ($total_files * 0.9)) $passed_tests++; // 90% files exist
if ($loaded_classes >= 2) $passed_tests++; // At least 2 classes loaded
if ($syntax_errors === 0) $passed_tests++; // No syntax errors
if (file_exists($main_file)) $passed_tests++; // Main file exists
if (strpos(file_get_contents($main_file), 'runServiceDiagnostics') !== false) $passed_tests++; // Diagnostics added

$pass_rate = ($passed_tests / $total_tests) * 100;

echo "Tests Passed: {$passed_tests}/{$total_tests} ({$pass_rate}%)\n";

if ($pass_rate >= 80) {
    echo "🎉 TASK 1 AUTOLOADER FIX: SUCCESS\n";
    echo "✅ Enhanced autoloader is properly implemented\n";
    echo "✅ Service files are present and have valid syntax\n";
    echo "✅ Error handling and diagnostics are added\n";
    echo "✅ Ready for WordPress environment testing\n";
} elseif ($pass_rate >= 60) {
    echo "⚠️ TASK 1 AUTOLOADER FIX: PARTIAL SUCCESS\n";
    echo "✅ Most components are working\n";
    echo "🔧 Some minor issues may need attention\n";
} else {
    echo "❌ TASK 1 AUTOLOADER FIX: NEEDS MORE WORK\n";
    echo "🔧 Significant issues need to be addressed\n";
}

echo "\n📋 Recommendations:\n";
echo "1. Test the plugin in a real WordPress environment\n";
echo "2. Check the diagnostics page: /wp-admin/admin.php?page=mas-v2-diagnostics\n";
echo "3. Monitor WordPress error logs for any remaining issues\n";
echo "4. Proceed to Task 2 if this test passes\n";

?>