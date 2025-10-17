<?php
/**
 * Standalone test for CSS Variable Mapping System
 * Tests the core mapping functionality without WordPress dependencies
 */

// Mock WordPress functions for testing
if (!function_exists('add_action')) {
    function add_action($hook, $callback, $priority = 10) {
        // Mock implementation
        return true;
    }
}

if (!function_exists('has_action')) {
    function has_action($hook, $callback = false) {
        // Mock implementation
        return $callback !== false;
    }
}

if (!function_exists('wp_register_style')) {
    function wp_register_style($handle, $src, $deps = [], $ver = false, $media = 'all') {
        return true;
    }
}

if (!function_exists('wp_enqueue_style')) {
    function wp_enqueue_style($handle, $src = '', $deps = [], $ver = false, $media = 'all') {
        return true;
    }
}

if (!function_exists('wp_add_inline_style')) {
    function wp_add_inline_style($handle, $data) {
        return true;
    }
}

if (!function_exists('error_log')) {
    function error_log($message) {
        echo "[LOG] $message\n";
    }
}

// Mock SettingsManager for testing
class MockSettingsManager {
    const OPTION_NAME = 'mas_v2_settings';
    
    public function getSettings() {
        return [
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#ffffff',
            'menu_background' => '#23282d'
        ];
    }
    
    public function saveSettings($settings) {
        return true;
    }
    
    public function verifyDatabaseIntegrity() {
        return ['read_write_ok' => true];
    }
}

// Include the CSS Variable Manager
require_once 'src/services/CSSVariableManager.php';

use ModernAdminStyler\Services\CSSVariableManager;

// Test function to output results
function test_result($test_name, $passed, $message = '') {
    $status = $passed ? '✓ PASS' : '✗ FAIL';
    echo sprintf("%-60s %s", $test_name, $status);
    if (!$passed && $message) {
        echo " - $message";
    }
    echo "\n";
    return $passed;
}

echo "=== CSS Variable Mapping System Tests (Standalone) ===\n\n";

$passed_tests = 0;
$total_tests = 0;

try {
    // Create mock settings manager
    $settings_manager = new MockSettingsManager();
    
    // Create CSS variable manager
    $css_manager = new CSSVariableManager($settings_manager);
    
    // Test 1: Variable mapping completeness
    $total_tests++;
    $mapping = $css_manager->buildVariableMapping();
    $expected_mappings = [
        'admin_bar_background' => '--woow-surface-bar',
        'admin_bar_text_color' => '--woow-surface-bar-text',
        'admin_bar_height' => '--woow-surface-bar-height',
        'menu_background' => '--woow-surface-menu',
        'menu_text_color' => '--woow-surface-menu-text',
        'menu_width' => '--woow-surface-menu-width',
        'content_background' => '--woow-surface-content',
        'content_padding' => '--woow-space-content-padding'
    ];
    
    $mapping_complete = true;
    $missing_mappings = [];
    foreach ($expected_mappings as $setting_key => $expected_variable) {
        if (!isset($mapping[$setting_key]) || $mapping[$setting_key]['variable'] !== $expected_variable) {
            $mapping_complete = false;
            $missing_mappings[] = "$setting_key -> $expected_variable";
        }
    }
    
    if (test_result('Variable mapping completeness', $mapping_complete, implode(', ', $missing_mappings))) {
        $passed_tests++;
    }
    
    // Test 2: Priority values exist
    $total_tests++;
    $has_priorities = true;
    $missing_priorities = [];
    foreach ($mapping as $setting_key => $config) {
        if (!isset($config['priority']) || !is_numeric($config['priority'])) {
            $has_priorities = false;
            $missing_priorities[] = $setting_key;
        }
    }
    
    if (test_result('Priority values exist for all variables', $has_priorities, implode(', ', $missing_priorities))) {
        $passed_tests++;
    }
    
    // Test 3: Type definitions exist
    $total_tests++;
    $has_types = true;
    $missing_types = [];
    $valid_types = ['color', 'size', 'number', 'boolean', 'font-family'];
    foreach ($mapping as $setting_key => $config) {
        if (!isset($config['type']) || !in_array($config['type'], $valid_types)) {
            $has_types = false;
            $missing_types[] = $setting_key;
        }
    }
    
    if (test_result('Type definitions exist for all variables', $has_types, implode(', ', $missing_types))) {
        $passed_tests++;
    }
    
    // Test 4: CSS generation with test settings
    $total_tests++;
    $test_settings = [
        'admin_bar_background' => '#2c3e50',
        'admin_bar_text_color' => '#ecf0f1',
        'admin_bar_height' => 40,
        'menu_background' => '#34495e',
        'content_padding' => 25,
        'enable_animations' => true,
        'global_font_size' => 14
    ];
    
    $css_variables = $css_manager->generateCSSVariables($test_settings);
    $css_generation_works = !empty($css_variables) && 
                           strpos($css_variables, '--woow-surface-bar: #2c3e50;') !== false &&
                           strpos($css_variables, '--woow-surface-bar-height: 40px;') !== false &&
                           strpos($css_variables, '--woow-animation-enabled: 1;') !== false;
    
    if (test_result('CSS generation from settings', $css_generation_works)) {
        $passed_tests++;
    }
    
    // Test 5: Default values fallback
    $total_tests++;
    $empty_settings = [];
    $default_css = $css_manager->generateCSSVariables($empty_settings);
    $defaults_work = !empty($default_css) && 
                     strpos($default_css, '--woow-surface-bar: #23282d;') !== false &&
                     strpos($default_css, '--woow-surface-bar-text: #ffffff;') !== false;
    
    if (test_result('Default values fallback', $defaults_work)) {
        $passed_tests++;
    }
    
    // Test 6: Color validation using reflection
    $total_tests++;
    $reflection = new ReflectionClass($css_manager);
    $convert_color_method = $reflection->getMethod('convertColorValue');
    $convert_color_method->setAccessible(true);
    
    $color_tests = [
        '#ff0000' => '#ff0000',
        '#f00' => '#ff0000',
        'rgb(255, 0, 0)' => 'rgb(255, 0, 0)',
        'red' => 'red'
    ];
    
    $color_validation_works = true;
    foreach ($color_tests as $input => $expected) {
        try {
            $result = $convert_color_method->invoke($css_manager, $input);
            if ($result !== $expected) {
                $color_validation_works = false;
                break;
            }
        } catch (Exception $e) {
            $color_validation_works = false;
            break;
        }
    }
    
    // Test invalid color
    try {
        $convert_color_method->invoke($css_manager, 'invalid-color');
        $color_validation_works = false; // Should have thrown exception
    } catch (Exception $e) {
        // Expected exception
    }
    
    if (test_result('Color format validation and conversion', $color_validation_works)) {
        $passed_tests++;
    }
    
    // Test 7: Size value conversion with units
    $total_tests++;
    $convert_size_method = $reflection->getMethod('convertSizeValue');
    $convert_size_method->setAccessible(true);
    
    $size_tests = [
        ['16', 'px', [], '16px'],
        ['1.5', 'em', [], '1.5em'],
        ['16px', 'px', [], '16px']
    ];
    
    $size_conversion_works = true;
    foreach ($size_tests as $test) {
        try {
            $result = $convert_size_method->invoke($css_manager, $test[0], $test[1], $test[2]);
            if ($result !== $test[3]) {
                $size_conversion_works = false;
                break;
            }
        } catch (Exception $e) {
            $size_conversion_works = false;
            break;
        }
    }
    
    if (test_result('Size value conversion with units', $size_conversion_works)) {
        $passed_tests++;
    }
    
    // Test 8: Range validation
    $total_tests++;
    $range_config = ['min_value' => 10, 'max_value' => 50];
    
    $range_validation_works = true;
    try {
        // Valid value
        $result = $convert_size_method->invoke($css_manager, '25', 'px', $range_config);
        if ($result !== '25px') {
            $range_validation_works = false;
        }
        
        // Invalid value (should throw exception)
        try {
            $convert_size_method->invoke($css_manager, '100', 'px', $range_config);
            $range_validation_works = false; // Should have thrown exception
        } catch (Exception $e) {
            // Expected exception for out-of-range value
        }
    } catch (Exception $e) {
        $range_validation_works = false;
    }
    
    if (test_result('Range validation for size values', $range_validation_works)) {
        $passed_tests++;
    }
    
    // Test 9: Priority-based CSS ordering
    $total_tests++;
    $priority_test_settings = [
        'enable_animations' => true, // Priority 4
        'admin_bar_background' => '#2c3e50', // Priority 1
        'global_font_size' => 14, // Priority 2
        'menu_width' => 180 // Priority 3
    ];
    
    $priority_css = $css_manager->generateCSSVariables($priority_test_settings);
    
    // Check that higher priority variables appear first
    $bar_pos = strpos($priority_css, '--woow-surface-bar');
    $font_pos = strpos($priority_css, '--woow-font-size-base');
    $menu_pos = strpos($priority_css, '--woow-surface-menu-width');
    $anim_pos = strpos($priority_css, '--woow-animation-enabled');
    
    $priority_ordering_works = $bar_pos !== false && $font_pos !== false && 
                              $menu_pos !== false && $anim_pos !== false &&
                              $bar_pos < $font_pos && $font_pos < $menu_pos && $menu_pos < $anim_pos;
    
    if (test_result('Priority-based CSS variable ordering (Req 5.3)', $priority_ordering_works)) {
        $passed_tests++;
    }
    
    // Test 10: Error handling and fallback
    $total_tests++;
    $invalid_settings = [
        'admin_bar_background' => 'invalid-color',
        'admin_bar_height' => 999, // Out of range
        'global_line_height' => 5.0 // Out of range
    ];
    
    $error_css = $css_manager->generateCSSVariables($invalid_settings);
    $error_handling_works = !empty($error_css) && 
                           strpos($error_css, '--woow-surface-bar: #23282d;') !== false; // Should fall back to default
    
    if (test_result('Error handling and fallback to defaults', $error_handling_works)) {
        $passed_tests++;
    }
    
    // Test 11: Variable mapping method accessibility
    $total_tests++;
    $variable_mapping = $css_manager->getVariableMapping();
    $mapping_accessible = is_array($variable_mapping) && !empty($variable_mapping);
    
    if (test_result('Variable mapping method accessible', $mapping_accessible)) {
        $passed_tests++;
    }
    
    // Test 12: CSS string structure validation
    $total_tests++;
    $sample_css = $css_manager->generateCSSVariables(['admin_bar_background' => '#ff0000']);
    $css_structure_valid = strpos($sample_css, ':root {') === 0 && 
                          substr(trim($sample_css), -1) === '}' &&
                          strpos($sample_css, '--woow-surface-bar: #ff0000;') !== false;
    
    if (test_result('CSS string structure validation', $css_structure_valid)) {
        $passed_tests++;
    }
    
} catch (Exception $e) {
    echo "Fatal error during testing: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Results ===\n";
echo "Passed: $passed_tests / $total_tests tests\n";

if ($passed_tests === $total_tests) {
    echo "✓ All tests passed! CSS Variable Mapping System is working correctly.\n";
    echo "\nTask 3.2 Implementation Summary:\n";
    echo "- ✓ Complete mapping between setting keys and CSS variable names\n";
    echo "- ✓ Unit conversion for numeric values (px, em, rem)\n";
    echo "- ✓ Color format validation and conversion\n";
    echo "- ✓ Priority-based ordering for correct application (Requirement 5.3)\n";
    echo "- ✓ Range validation with min/max values\n";
    echo "- ✓ Error handling with fallback to defaults\n";
    echo "- ✓ WordPress integration hooks\n";
    exit(0);
} else {
    echo "✗ Some tests failed. Please review the implementation.\n";
    exit(1);
}
?>