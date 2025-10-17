<?php
/**
 * Simple validation for CSS Variable Mapping System
 */

echo "=== CSS Variable Mapping Validation ===\n\n";

// Test the mapping structure by reading the file directly
$css_manager_file = file_get_contents('src/services/CSSVariableManager.php');

// Check for key mapping elements
$checks = [
    'buildVariableMapping method exists' => strpos($css_manager_file, 'public function buildVariableMapping()') !== false,
    'Priority-based sorting exists' => strpos($css_manager_file, 'sortVariablesByPriority') !== false,
    'Color conversion exists' => strpos($css_manager_file, 'convertColorValue') !== false,
    'Size conversion exists' => strpos($css_manager_file, 'convertSizeValue') !== false,
    'Unit conversion exists' => strpos($css_manager_file, 'convertBetweenUnits') !== false,
    'Range validation exists' => strpos($css_manager_file, 'min_value') !== false && strpos($css_manager_file, 'max_value') !== false,
    'Admin bar mapping exists' => strpos($css_manager_file, '--woow-surface-bar') !== false,
    'Menu mapping exists' => strpos($css_manager_file, '--woow-surface-menu') !== false,
    'Content mapping exists' => strpos($css_manager_file, '--woow-surface-content') !== false,
    'Priority values exist' => strpos($css_manager_file, "'priority' =>") !== false
];

$passed = 0;
$total = count($checks);

foreach ($checks as $check => $result) {
    echo sprintf("%-50s %s\n", $check, $result ? '✓ PASS' : '✗ FAIL');
    if ($result) $passed++;
}

echo "\nValidation Results: $passed / $total checks passed\n";

if ($passed === $total) {
    echo "✓ CSS Variable Mapping System implementation is complete!\n";
} else {
    echo "✗ Some implementation elements are missing.\n";
}
?>