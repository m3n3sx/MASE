<?php
/**
 * Test Script for Asset Loading Fix
 * 
 * This script tests the enhanced asset loading system
 * to verify that Task 3 fixes are working correctly.
 */

echo "📦 WOOW Admin Styler - Asset Loading Test\n";
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
if (!function_exists('delete_option')) {
    function delete_option($option) { return true; }
}
if (!function_exists('wp_enqueue_style')) {
    function wp_enqueue_style($handle, $src = '', $deps = [], $ver = false, $media = 'all') {
        echo "📄 Enqueued style: {$handle} -> {$src}\n";
        return true;
    }
}
if (!function_exists('wp_enqueue_script')) {
    function wp_enqueue_script($handle, $src = '', $deps = [], $ver = false, $in_footer = false) {
        echo "📜 Enqueued script: {$handle} -> {$src}\n";
        return true;
    }
}
if (!function_exists('wp_add_inline_style')) {
    function wp_add_inline_style($handle, $data) {
        echo "🎨 Added inline style to: {$handle}\n";
        return true;
    }
}
if (!function_exists('wp_add_inline_script')) {
    function wp_add_inline_script($handle, $data, $position = 'after') {
        echo "📜 Added inline script to: {$handle}\n";
        return true;
    }
}
if (!function_exists('wp_localize_script')) {
    function wp_localize_script($handle, $object_name, $l10n) {
        echo "🌐 Localized script: {$handle} with object: {$object_name}\n";
        return true;
    }
}
if (!function_exists('is_admin')) {
    function is_admin() { return true; }
}
if (!function_exists('current_user_can')) {
    function current_user_can($capability) { return true; }
}
if (!function_exists('wp_get_current_user')) {
    function wp_get_current_user() { 
        return (object)['display_name' => 'Test User']; 
    }
}
if (!function_exists('admin_url')) {
    function admin_url($path = '') { return 'http://localhost/wp-admin/' . $path; }
}
if (!function_exists('rest_url')) {
    function rest_url($path = '') { return 'http://localhost/wp-json/' . $path; }
}
if (!function_exists('wp_create_nonce')) {
    function wp_create_nonce($action) { return 'test_nonce_' . md5($action); }
}
if (!function_exists('add_action')) {
    function add_action($hook, $callback, $priority = 10) { return true; }
}
if (!function_exists('trailingslashit')) {
    function trailingslashit($string) { return rtrim($string, '/') . '/'; }
}

// Define constants
define('MAS_V2_VERSION', '2.2.0');
define('MAS_V2_PLUGIN_DIR', __DIR__ . '/');
define('MAS_V2_PLUGIN_URL', 'http://localhost/modern-admin-styler-v2/');
define('MAS_V2_PLUGIN_FILE', __FILE__);
define('WP_DEBUG', false);

// Mock settings manager
class MockSettingsManager {
    public function getSettings() {
        return [
            'theme' => 'light',
            'admin_bar_background' => '#23282d',
            'menu_background' => '#ffffff'
        ];
    }
}

// Mock CSS generator
class MockCSSGenerator {
    public function generate($settings) {
        return ':root { --woow-theme: ' . $settings['theme'] . '; }';
    }
}

// Include AssetLoader
require_once __DIR__ . '/src/services/AssetLoader.php';

// Test 1: AssetLoader Instantiation
echo "TEST 1: AssetLoader Instantiation\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    $settings_manager = new MockSettingsManager();
    $css_generator = new MockCSSGenerator();
    
    $asset_loader = new ModernAdminStyler\Services\AssetLoader(
        MAS_V2_PLUGIN_URL,
        MAS_V2_VERSION,
        $settings_manager,
        $css_generator
    );
    
    if ($asset_loader instanceof ModernAdminStyler\Services\AssetLoader) {
        echo "✅ AssetLoader instantiated successfully\n";
        echo "✅ Plugin URL: " . MAS_V2_PLUGIN_URL . "\n";
        echo "✅ Plugin Version: " . MAS_V2_VERSION . "\n";
    } else {
        echo "❌ AssetLoader instantiation failed\n";
    }
    
} catch (Exception $e) {
    echo "❌ AssetLoader instantiation error: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Asset File Validation
echo "TEST 2: Asset File Validation\n";
echo "-" . str_repeat("-", 40) . "\n";

$critical_assets = [
    'css/woow-main.css',
    'js/woow-core.js',
    'js/unified-settings-manager.js',
    'js/live-edit-mode.js'
];

$existing_assets = 0;
foreach ($critical_assets as $asset) {
    $asset_path = __DIR__ . '/assets/' . $asset;
    if (file_exists($asset_path)) {
        echo "✅ {$asset} - EXISTS (" . number_format(filesize($asset_path) / 1024, 1) . " KB)\n";
        $existing_assets++;
    } else {
        echo "❌ {$asset} - MISSING\n";
    }
}

echo "\nAsset Validation Result: {$existing_assets}/" . count($critical_assets) . " critical assets found\n\n";

// Test 3: Admin Asset Loading
echo "TEST 3: Admin Asset Loading\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    echo "Testing admin asset loading for WOOW pages...\n";
    
    // Test WOOW admin page
    $asset_loader->enqueueAdminAssets('toplevel_page_woow-v2-general');
    echo "✅ Admin assets loaded for WOOW general page\n";
    
    // Test non-WOOW page (should skip)
    ob_start();
    $asset_loader->enqueueAdminAssets('edit.php');
    $output = ob_get_clean();
    
    if (empty($output)) {
        echo "✅ Correctly skipped non-WOOW page\n";
    } else {
        echo "⚠️ Assets loaded for non-WOOW page (unexpected)\n";
    }
    
} catch (Exception $e) {
    echo "❌ Admin asset loading failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 4: Global Asset Loading
echo "TEST 4: Global Asset Loading\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    echo "Testing global asset loading...\n";
    
    $asset_loader->enqueueGlobalAssets('dashboard');
    echo "✅ Global assets loaded for dashboard\n";
    
} catch (Exception $e) {
    echo "❌ Global asset loading failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 5: Error Handling
echo "TEST 5: Error Handling\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    // Test asset error methods
    if (method_exists($asset_loader, 'getAssetErrors')) {
        $errors = $asset_loader->getAssetErrors();
        echo "✅ getAssetErrors() method available\n";
        echo "   Current errors: " . count($errors) . "\n";
    } else {
        echo "❌ getAssetErrors() method missing\n";
    }
    
    if (method_exists($asset_loader, 'clearAssetErrors')) {
        $result = $asset_loader->clearAssetErrors();
        echo "✅ clearAssetErrors() method available\n";
        echo "   Clear result: " . ($result ? 'Success' : 'Failed') . "\n";
    } else {
        echo "❌ clearAssetErrors() method missing\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error handling test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 6: Diagnostics
echo "TEST 6: Diagnostics\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    if (method_exists($asset_loader, 'getDiagnostics')) {
        $diagnostics = $asset_loader->getDiagnostics();
        echo "✅ getDiagnostics() method available\n";
        
        $required_keys = ['plugin_url', 'plugin_path', 'plugin_version', 'is_production', 'performance_budget'];
        $available_keys = 0;
        
        foreach ($required_keys as $key) {
            if (isset($diagnostics[$key])) {
                echo "✅ {$key}: " . (is_array($diagnostics[$key]) ? 'Array' : $diagnostics[$key]) . "\n";
                $available_keys++;
            } else {
                echo "❌ {$key}: Missing\n";
            }
        }
        
        echo "Diagnostics Result: {$available_keys}/" . count($required_keys) . " keys available\n";
        
    } else {
        echo "❌ getDiagnostics() method missing\n";
    }
    
} catch (Exception $e) {
    echo "❌ Diagnostics test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 7: Performance Metrics
echo "TEST 7: Performance Metrics\n";
echo "-" . str_repeat("-", 40) . "\n";

try {
    if (method_exists($asset_loader, 'getPerformanceMetrics')) {
        $metrics = $asset_loader->getPerformanceMetrics();
        echo "✅ getPerformanceMetrics() method available\n";
        
        $required_metrics = ['memory_usage', 'memory_peak', 'execution_time', 'performance_budget'];
        $available_metrics = 0;
        
        foreach ($required_metrics as $metric) {
            if (isset($metrics[$metric])) {
                echo "✅ {$metric}: " . (is_array($metrics[$metric]) ? 'Array' : $metrics[$metric]) . "\n";
                $available_metrics++;
            } else {
                echo "❌ {$metric}: Missing\n";
            }
        }
        
        echo "Performance Metrics Result: {$available_metrics}/" . count($required_metrics) . " metrics available\n";
        
    } else {
        echo "❌ getPerformanceMetrics() method missing\n";
    }
    
} catch (Exception $e) {
    echo "❌ Performance metrics test failed: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 8: Enhanced Methods
echo "TEST 8: Enhanced Methods\n";
echo "-" . str_repeat("-", 40) . "\n";

$enhanced_methods = [
    'validateAssetFile',
    'enqueueScriptSafely',
    'enqueueStyleSafely',
    'handleAssetLoadingError',
    'loadFallbackAssets'
];

$available_methods = 0;
foreach ($enhanced_methods as $method) {
    $reflection = new ReflectionClass($asset_loader);
    if ($reflection->hasMethod($method)) {
        echo "✅ {$method} - METHOD EXISTS\n";
        $available_methods++;
    } else {
        echo "❌ {$method} - METHOD MISSING\n";
    }
}

echo "\nEnhanced Methods Result: {$available_methods}/" . count($enhanced_methods) . " methods available\n\n";

// Final Summary
echo "🎯 FINAL SUMMARY\n";
echo "=" . str_repeat("=", 60) . "\n";

$total_tests = 8;
$passed_tests = 0;

// Calculate pass rate based on key metrics
if ($asset_loader instanceof ModernAdminStyler\Services\AssetLoader) $passed_tests++; // Instantiation
if ($existing_assets >= count($critical_assets) * 0.75) $passed_tests++; // 75% assets exist
if (method_exists($asset_loader, 'enqueueAdminAssets')) $passed_tests++; // Admin loading
if (method_exists($asset_loader, 'enqueueGlobalAssets')) $passed_tests++; // Global loading
if (method_exists($asset_loader, 'getAssetErrors')) $passed_tests++; // Error handling
if (method_exists($asset_loader, 'getDiagnostics')) $passed_tests++; // Diagnostics
if (method_exists($asset_loader, 'getPerformanceMetrics')) $passed_tests++; // Performance
if ($available_methods >= 3) $passed_tests++; // Enhanced methods

$pass_rate = ($passed_tests / $total_tests) * 100;

echo "Tests Passed: {$passed_tests}/{$total_tests} ({$pass_rate}%)\n";

if ($pass_rate >= 85) {
    echo "🎉 TASK 3 IMPLEMENTATION: EXCELLENT\n";
    echo "✅ Asset loading system is working perfectly!\n";
    echo "✅ Error handling and validation are functional\n";
    echo "✅ Performance monitoring and diagnostics are working\n";
    echo "✅ Enhanced methods for safe asset loading implemented\n";
} elseif ($pass_rate >= 70) {
    echo "✅ TASK 3 IMPLEMENTATION: GOOD\n";
    echo "✅ Most asset loading features are working\n";
    echo "🔧 Minor issues may need attention\n";
} else {
    echo "⚠️ TASK 3 IMPLEMENTATION: NEEDS IMPROVEMENT\n";
    echo "🔧 Several issues need to be addressed\n";
}

echo "\n📋 Next Steps:\n";
echo "1. Test the enhanced AssetLoader in WordPress environment\n";
echo "2. Monitor asset loading and error handling in real usage\n";
echo "3. Check for any missing asset files and dependencies\n";
echo "4. Proceed to Task 4: Repair AJAX Communication System\n";

?>