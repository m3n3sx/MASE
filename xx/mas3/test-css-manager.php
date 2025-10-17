<?php
/**
 * Quick test script for CSS Manager
 * Run: wp eval-file test-css-manager.php --path=/var/www/html
 */

// Load WordPress
if (!defined('ABSPATH')) {
    require_once dirname(__FILE__) . '/../../../wp-load.php';
}

echo "=== CSS Manager Test ===\n\n";

// Test 1: Check feature flag
$flag = get_option('mas_v2_use_unified_css_manager', 'not_set');
echo "1. Feature Flag: " . ($flag === 'not_set' ? 'NOT SET' : ($flag ? 'TRUE (Unified)' : 'FALSE (Legacy)')) . "\n";

// Test 2: Check if Unified Manager class exists
$unified_exists = class_exists('MAS_Unified_CSS_Manager');
echo "2. Unified Manager Class: " . ($unified_exists ? '✅ EXISTS' : '❌ NOT FOUND') . "\n";

// Test 3: Check if Admin class exists
$admin_exists = class_exists('MAS_CSS_Manager_Admin');
echo "3. Admin Interface Class: " . ($admin_exists ? '✅ EXISTS' : '❌ NOT FOUND') . "\n";

// Test 4: Check loaded CSS files
global $wp_styles;
if (isset($wp_styles->registered)) {
    $mas_styles = array_filter(array_keys($wp_styles->registered), function($handle) {
        return strpos($handle, 'mas-v2') !== false;
    });
    echo "4. Registered MAS CSS: " . count($mas_styles) . " files\n";
    foreach ($mas_styles as $handle) {
        echo "   - $handle\n";
    }
} else {
    echo "4. Registered MAS CSS: No styles registered yet\n";
}

// Test 5: Check if main plugin is active
$plugin_active = is_plugin_active('mas3/modern-admin-styler-v2.php');
echo "5. Plugin Active: " . ($plugin_active ? '✅ YES' : '❌ NO') . "\n";

// Test 6: Check settings
$settings = get_option('mas_v2_settings', []);
$menu_bg = $settings['menu_bg'] ?? 'not_set';
$menu_background = $settings['menu_background'] ?? 'not_set';
echo "6. Menu Settings:\n";
echo "   - menu_bg: $menu_bg\n";
echo "   - menu_background: $menu_background\n";

echo "\n=== Test Complete ===\n";
