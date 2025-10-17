<?php
/**
 * CSS Variable Manager Service
 * 
 * Handles server-side CSS variable generation from settings data
 * Integrates with WordPress wp_add_inline_style() for immediate application
 * 
 * @package ModernAdminStyler
 * @version 4.0.0
 */

namespace ModernAdminStyler\Services;

class CSSVariableManager {
    
    /**
     * @var SettingsManager Settings manager instance
     */
    private $settings_manager;
    
    /**
     * @var array CSS variable mapping configuration
     */
    private $variable_mapping;
    
    /**
     * @var array Default fallback values
     */
    private $default_values;
    
    /**
     * @var string CSS handle for WordPress integration
     */
    private $css_handle = 'woow-admin-variables';
    
    /**
     * Initialize CSS Variable Manager
     * 
     * @param SettingsManager $settings_manager Settings manager instance
     */
    public function __construct($settings_manager = null) {
        $this->settings_manager = $settings_manager ?: new SettingsManager();
        $this->variable_mapping = $this->buildVariableMapping();
        $this->default_values = $this->getDefaultValues();
        
        // Hook into WordPress
        $this->hookToWordPress();
    }
    
    /**
     * Generate CSS variables from settings data
     * Enhanced for Task 3.4 with comprehensive validation and fallback handling
     * Requirements: 5.1, 5.2, 5.4, 7.4
     * 
     * @param array $settings Settings data array
     * @return string Generated CSS variables
     */
    public function generateCSSVariables($settings = null) {
        try {
            // TASK 3.4: Use fallback system for corrupted or missing settings
            $validated_settings = $this->createFallbackSystem($settings);
            
            if (!is_array($validated_settings)) {
                throw new \InvalidArgumentException('Failed to get valid settings from fallback system');
            }
            
            $css_variables = [];
            $validation_errors = [];
            
            // Generate CSS variables from mapping with enhanced validation
            foreach ($this->variable_mapping as $setting_key => $css_config) {
                $setting_value = $validated_settings[$setting_key] ?? $css_config['default'] ?? null;
                
                // Skip if no value available
                if ($setting_value === null) {
                    continue;
                }
                
                try {
                    // TASK 3.4: Validate CSS value before injection
                    if (!$this->validateCSSValueBeforeInjection($setting_value, $css_config['type'], $css_config)) {
                        throw new \InvalidArgumentException("Validation failed for setting: $setting_key");
                    }
                    
                    // Convert and validate the value
                    $css_value = $this->convertSettingToCSSValue($setting_value, $css_config);
                    
                    if ($css_value !== null) {
                        $css_variables[$css_config['variable']] = $css_value;
                    } else {
                        throw new \InvalidArgumentException("Conversion failed for setting: $setting_key");
                    }
                    
                } catch (\Exception $e) {
                    $validation_errors[] = [
                        'setting_key' => $setting_key,
                        'setting_value' => $setting_value,
                        'error' => $e->getMessage()
                    ];
                    
                    // TASK 3.4: Use default value as fallback for invalid settings
                    if (isset($css_config['default'])) {
                        try {
                            $fallback_value = $this->convertSettingToCSSValue($css_config['default'], $css_config);
                            if ($fallback_value !== null) {
                                $css_variables[$css_config['variable']] = $fallback_value;
                                error_log("MAS V2 CSS Variables: Using default fallback for $setting_key: {$css_config['default']}");
                            }
                        } catch (\Exception $fallback_error) {
                            error_log("MAS V2 CSS Variables: Fallback also failed for $setting_key: " . $fallback_error->getMessage());
                        }
                    }
                }
            }
            
            // TASK 3.4: Log validation errors for debugging
            if (!empty($validation_errors)) {
                $this->logCSSGenerationError(
                    'CSS variable validation errors occurred',
                    ['validation_errors' => $validation_errors],
                    ['Check setting values', 'Verify data types', 'Review range constraints']
                );
            }
            
            // Build CSS string with validation
            $css_output = $this->buildCSSString($css_variables);
            
            // TASK 3.4: Final validation of generated CSS
            if (!$this->validateCSSValues($css_output)) {
                throw new \Exception('Generated CSS failed final validation');
            }
            
            // Store successful generation timestamp
            set_transient('woow_css_last_success', current_time('mysql'), DAY_IN_SECONDS);
            
            error_log(sprintf(
                'MAS V2 CSS Variables: Successfully generated %d variables (%d bytes) with %d validation errors',
                count($css_variables),
                strlen($css_output),
                count($validation_errors)
            ));
            
            return $css_output;
            
        } catch (\Exception $e) {
            // TASK 3.4: Enhanced error logging for CSS generation failures
            $this->logCSSGenerationError(
                $e,
                [
                    'method' => 'generateCSSVariables',
                    'settings_provided' => $settings !== null,
                    'settings_count' => is_array($settings) ? count($settings) : 0
                ],
                [
                    'Check database connectivity',
                    'Verify settings data integrity',
                    'Review error logs for validation failures',
                    'Consider clearing CSS cache'
                ]
            );
            
            return $this->generateFallbackCSS();
        }
    }
    
    /**
     * Build CSS variable mapping configuration
     * Enhanced with complete mapping between setting keys and CSS variable names
     * Requirements: 5.2, 5.3
     * 
     * @return array Variable mapping configuration
     */
    public function buildVariableMapping() {
        return [
            // ========================================
            // 🎨 ADMIN BAR VARIABLES
            // ========================================
            'admin_bar_background' => [
                'variable' => '--woow-surface-bar',
                'type' => 'color',
                'default' => '#23282d',
                'description' => 'Admin bar background color',
                'priority' => 1 // High priority for immediate application
            ],
            'admin_bar_text_color' => [
                'variable' => '--woow-surface-bar-text',
                'type' => 'color',
                'default' => '#ffffff',
                'description' => 'Admin bar text color',
                'priority' => 1
            ],
            'admin_bar_hover_color' => [
                'variable' => '--woow-surface-bar-hover',
                'type' => 'color',
                'default' => '#00a0d2',
                'description' => 'Admin bar hover color',
                'priority' => 2
            ],
            'admin_bar_height' => [
                'variable' => '--woow-surface-bar-height',
                'type' => 'size',
                'unit' => 'px',
                'default' => 32,
                'description' => 'Admin bar height',
                'priority' => 1,
                'min_value' => 20,
                'max_value' => 80
            ],
            'admin_bar_font_size' => [
                'variable' => '--woow-surface-bar-font-size',
                'type' => 'size',
                'unit' => 'px',
                'default' => 13,
                'description' => 'Admin bar font size',
                'priority' => 2,
                'min_value' => 10,
                'max_value' => 24
            ],
            
            // ========================================
            // 📋 MENU VARIABLES
            // ========================================
            // Fix: Align with design document naming
            'menu_background' => [
                'variable' => '--woow-surface-menu',
                'type' => 'color',
                'default' => '#23282d',
                'description' => 'Menu background color',
                'priority' => 1
            ],
            'menu_background_color' => [ // Legacy support
                'variable' => '--woow-surface-menu',
                'type' => 'color',
                'default' => '#23282d',
                'description' => 'Menu background color (legacy)',
                'priority' => 1
            ],
            'menu_text_color' => [
                'variable' => '--woow-surface-menu-text',
                'type' => 'color',
                'default' => '#ffffff',
                'description' => 'Menu text color',
                'priority' => 1
            ],
            'menu_hover_color' => [
                'variable' => '--woow-surface-menu-hover',
                'type' => 'color',
                'default' => '#32373c',
                'description' => 'Menu hover color',
                'priority' => 2
            ],
            'menu_width' => [
                'variable' => '--woow-surface-menu-width',
                'type' => 'size',
                'unit' => 'px',
                'default' => 160,
                'description' => 'Menu width',
                'priority' => 3,
                'min_value' => 120,
                'max_value' => 300
            ],
            
            // ========================================
            // 📄 CONTENT VARIABLES
            // ========================================
            // Fix: Align with design document naming
            'content_background' => [
                'variable' => '--woow-surface-content',
                'type' => 'color',
                'default' => '#ffffff',
                'description' => 'Content background color',
                'priority' => 1
            ],
            'content_background_color' => [ // Legacy support
                'variable' => '--woow-surface-content',
                'type' => 'color',
                'default' => '#ffffff',
                'description' => 'Content background color (legacy)',
                'priority' => 1
            ],
            'content_padding' => [
                'variable' => '--woow-space-content-padding',
                'type' => 'size',
                'unit' => 'px',
                'default' => 20,
                'description' => 'Content padding',
                'priority' => 3,
                'min_value' => 0,
                'max_value' => 100
            ],
            
            // ========================================
            // 🎨 ACCENT AND THEME VARIABLES
            // ========================================
            'accent_color' => [
                'variable' => '--woow-color-accent',
                'type' => 'color',
                'default' => '#0073aa',
                'description' => 'Accent color',
                'priority' => 2
            ],
            'primary_color' => [
                'variable' => '--woow-color-primary',
                'type' => 'color',
                'default' => '#0073aa',
                'description' => 'Primary theme color',
                'priority' => 2
            ],
            'secondary_color' => [
                'variable' => '--woow-color-secondary',
                'type' => 'color',
                'default' => '#666666',
                'description' => 'Secondary theme color',
                'priority' => 3
            ],
            
            // ========================================
            // 📝 TYPOGRAPHY VARIABLES
            // ========================================
            'global_font_size' => [
                'variable' => '--woow-font-size-base',
                'type' => 'size',
                'unit' => 'px',
                'default' => 13,
                'description' => 'Base font size',
                'priority' => 2,
                'min_value' => 10,
                'max_value' => 20
            ],
            'global_line_height' => [
                'variable' => '--woow-line-height-base',
                'type' => 'number',
                'default' => 1.4,
                'description' => 'Base line height',
                'priority' => 3,
                'min_value' => 1.0,
                'max_value' => 2.0
            ],
            'headings_scale' => [
                'variable' => '--woow-font-scale-heading',
                'type' => 'number',
                'default' => 1.2,
                'description' => 'Heading font scale',
                'priority' => 3,
                'min_value' => 1.0,
                'max_value' => 2.0
            ],
            'body_font' => [
                'variable' => '--woow-font-family-base',
                'type' => 'font-family',
                'default' => 'system-ui, -apple-system, sans-serif',
                'description' => 'Base font family',
                'priority' => 3
            ],
            'headings_font' => [
                'variable' => '--woow-font-family-heading',
                'type' => 'font-family',
                'default' => 'inherit',
                'description' => 'Heading font family',
                'priority' => 3
            ],
            
            // ========================================
            // 🎛️ FEATURE TOGGLES
            // ========================================
            'enable_animations' => [
                'variable' => '--woow-animation-enabled',
                'type' => 'boolean',
                'default' => false,
                'description' => 'Enable animations',
                'priority' => 4
            ],
            'glassmorphism_enabled' => [
                'variable' => '--woow-glassmorphism-enabled',
                'type' => 'boolean',
                'default' => false,
                'description' => 'Enable glassmorphism effects',
                'priority' => 4
            ],
            'admin_bar_floating' => [
                'variable' => '--woow-bar-floating',
                'type' => 'boolean',
                'default' => false,
                'description' => 'Floating admin bar',
                'priority' => 4
            ],
            'menu_floating' => [
                'variable' => '--woow-menu-floating',
                'type' => 'boolean',
                'default' => false,
                'description' => 'Floating menu',
                'priority' => 4
            ],
            'menu_compact_mode' => [
                'variable' => '--woow-menu-compact',
                'type' => 'boolean',
                'default' => false,
                'description' => 'Compact menu mode',
                'priority' => 4
            ],
            
            // ========================================
            // 🎨 ADVANCED STYLING VARIABLES
            // ========================================
            'border_radius' => [
                'variable' => '--woow-border-radius-base',
                'type' => 'size',
                'unit' => 'px',
                'default' => 4,
                'description' => 'Base border radius',
                'priority' => 4,
                'min_value' => 0,
                'max_value' => 20
            ],
            'shadow_intensity' => [
                'variable' => '--woow-shadow-intensity',
                'type' => 'number',
                'default' => 0.1,
                'description' => 'Shadow intensity (0-1)',
                'priority' => 4,
                'min_value' => 0,
                'max_value' => 1
            ],
            'transition_speed' => [
                'variable' => '--woow-transition-speed',
                'type' => 'size',
                'unit' => 'ms',
                'default' => 200,
                'description' => 'Base transition speed',
                'priority' => 4,
                'min_value' => 50,
                'max_value' => 1000
            ]
        ];
    }
    
    /**
     * Convert setting value to CSS value based on type
     * Enhanced with config-based validation and range checking
     * Requirements: 5.2, 5.3
     * 
     * @param mixed $value Setting value
     * @param array $config Variable configuration
     * @return string|null CSS value or null if invalid
     */
    private function convertSettingToCSSValue($value, $config) {
        $type = $config['type'];
        
        try {
            switch ($type) {
                case 'color':
                    return $this->convertColorValue($value);
                    
                case 'size':
                    return $this->convertSizeValue($value, $config['unit'] ?? 'px', $config);
                    
                case 'number':
                    return $this->convertNumberValue($value, $config);
                    
                case 'font-family':
                    return $this->convertFontFamilyValue($value);
                    
                case 'boolean':
                    return $this->convertBooleanValue($value);
                    
                default:
                    // Fallback to string sanitization
                    return $this->sanitizeStringValue($value);
            }
        } catch (\Exception $e) {
            error_log("MAS V2 CSS Variable Conversion Error for {$config['variable']}: " . $e->getMessage());
            return $config['default'] ?? null;
        }
    }
    
    /**
     * Convert and validate color values
     * Enhanced with comprehensive color format support and conversion
     * Requirements: 5.2, 5.3
     */
    private function convertColorValue($value) {
        if (empty($value)) {
            return null;
        }
        
        // Remove any whitespace
        $value = trim($value);
        
        // Validate and normalize hex colors
        if (preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $value, $matches)) {
            // Expand 3-digit hex to 6-digit
            if (strlen($matches[1]) === 3) {
                $expanded = '';
                for ($i = 0; $i < 3; $i++) {
                    $expanded .= str_repeat($matches[1][$i], 2);
                }
                return '#' . $expanded;
            }
            return strtolower($value); // Normalize to lowercase
        }
        
        // Validate RGB/RGBA with enhanced pattern matching
        if (preg_match('/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)$/i', $value, $matches)) {
            $r = floatval($matches[1]);
            $g = floatval($matches[2]);
            $b = floatval($matches[3]);
            $a = isset($matches[4]) ? floatval($matches[4]) : null;
            
            // Validate RGB values (0-255)
            if ($r < 0 || $r > 255 || $g < 0 || $g > 255 || $b < 0 || $b > 255) {
                throw new \InvalidArgumentException("RGB values must be between 0-255: $value");
            }
            
            // Validate alpha value (0-1)
            if ($a !== null && ($a < 0 || $a > 1)) {
                throw new \InvalidArgumentException("Alpha value must be between 0-1: $value");
            }
            
            // Format the color properly
            if ($a !== null) {
                return sprintf('rgba(%d, %d, %d, %.2f)', intval($r), intval($g), intval($b), $a);
            } else {
                return sprintf('rgb(%d, %d, %d)', intval($r), intval($g), intval($b));
            }
        }
        
        // Validate HSL/HSLA with enhanced pattern matching
        if (preg_match('/^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*([\d.]+))?\s*\)$/i', $value, $matches)) {
            $h = floatval($matches[1]);
            $s = floatval($matches[2]);
            $l = floatval($matches[3]);
            $a = isset($matches[4]) ? floatval($matches[4]) : null;
            
            // Validate HSL values
            if ($h < 0 || $h > 360) {
                throw new \InvalidArgumentException("Hue value must be between 0-360: $value");
            }
            if ($s < 0 || $s > 100) {
                throw new \InvalidArgumentException("Saturation value must be between 0-100%: $value");
            }
            if ($l < 0 || $l > 100) {
                throw new \InvalidArgumentException("Lightness value must be between 0-100%: $value");
            }
            
            // Validate alpha value (0-1)
            if ($a !== null && ($a < 0 || $a > 1)) {
                throw new \InvalidArgumentException("Alpha value must be between 0-1: $value");
            }
            
            // Format the color properly
            if ($a !== null) {
                return sprintf('hsla(%.1f, %.1f%%, %.1f%%, %.2f)', $h, $s, $l, $a);
            } else {
                return sprintf('hsl(%.1f, %.1f%%, %.1f%%)', $h, $s, $l);
            }
        }
        
        // Validate CSS named colors (comprehensive list)
        $named_colors = [
            // CSS Keywords
            'transparent', 'inherit', 'initial', 'unset', 'currentcolor',
            // Basic colors
            'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
            'gray', 'grey', 'silver', 'maroon', 'navy', 'olive', 'lime', 'aqua', 'teal', 'fuchsia',
            // Extended colors (common ones)
            'aliceblue', 'antiquewhite', 'aquamarine', 'azure', 'beige', 'bisque', 'blanchedalmond',
            'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse', 'chocolate', 'coral',
            'cornflowerblue', 'cornsilk', 'crimson', 'darkblue', 'darkcyan', 'darkgoldenrod',
            'darkgray', 'darkgrey', 'darkgreen', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
            'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue',
            'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue',
            'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
            'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'greenyellow', 'honeydew', 'hotpink',
            'indianred', 'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen',
            'lemonchiffon', 'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow',
            'lightgray', 'lightgrey', 'lightgreen', 'lightpink', 'lightsalmon', 'lightseagreen',
            'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow',
            'limegreen', 'linen', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
            'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
            'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
            'oldlace', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen',
            'paleturquoise', 'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum',
            'powderblue', 'purple', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
            'seagreen', 'seashell', 'sienna', 'skyblue', 'slateblue', 'slategray', 'slategrey',
            'snow', 'springgreen', 'steelblue', 'tan', 'thistle', 'tomato', 'turquoise', 'violet',
            'wheat', 'whitesmoke', 'yellowgreen'
        ];
        
        $lower_value = strtolower($value);
        if (in_array($lower_value, $named_colors)) {
            return $lower_value;
        }
        
        // Try to convert common color formats
        $converted = $this->tryColorConversion($value);
        if ($converted !== null) {
            return $converted;
        }
        
        throw new \InvalidArgumentException("Invalid color format: $value");
    }
    
    /**
     * Try to convert various color formats
     * Requirements: 5.2, 5.3
     */
    private function tryColorConversion($value) {
        // Handle hex without # prefix
        if (preg_match('/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $value)) {
            return $this->convertColorValue('#' . $value);
        }
        
        // Handle RGB values without parentheses (e.g., "255 0 0")
        if (preg_match('/^(\d+)\s+(\d+)\s+(\d+)$/', $value, $matches)) {
            return $this->convertColorValue("rgb({$matches[1]}, {$matches[2]}, {$matches[3]})");
        }
        
        // Handle percentage RGB (e.g., "100% 0% 0%")
        if (preg_match('/^(\d+)%\s+(\d+)%\s+(\d+)%$/', $value, $matches)) {
            $r = intval(($matches[1] / 100) * 255);
            $g = intval(($matches[2] / 100) * 255);
            $b = intval(($matches[3] / 100) * 255);
            return $this->convertColorValue("rgb($r, $g, $b)");
        }
        
        return null;
    }
    
    /**
     * Convert and validate size values with units
     * Enhanced with comprehensive unit conversion support and range validation
     * Requirements: 5.2, 5.3
     */
    private function convertSizeValue($value, $unit = 'px', $config = []) {
        if ($value === null || $value === '') {
            return null;
        }
        
        // Handle values that already have units
        if (is_string($value) && preg_match('/^([\d.]+)(px|em|rem|%|vh|vw|pt|pc|in|cm|mm)$/i', $value, $matches)) {
            $numeric_value = floatval($matches[1]);
            $existing_unit = strtolower($matches[2]);
            
            // Convert between units if needed
            if ($existing_unit !== $unit) {
                $numeric_value = $this->convertBetweenUnits($numeric_value, $existing_unit, $unit);
            }
        } else {
            // Convert to number
            $numeric_value = floatval($value);
        }
        
        // Enhanced range validation using config min/max values
        $min_value = $config['min_value'] ?? 0;
        $max_value = $config['max_value'] ?? 9999;
        
        if ($numeric_value < $min_value || $numeric_value > $max_value) {
            throw new \InvalidArgumentException(
                "Size value out of range: $value (must be between $min_value and $max_value)"
            );
        }
        
        // Format the number (remove unnecessary decimals)
        $formatted_value = $numeric_value == intval($numeric_value) ? intval($numeric_value) : round($numeric_value, 2);
        
        return $formatted_value . $unit;
    }
    
    /**
     * Convert between different CSS units
     * Requirements: 5.2, 5.3
     */
    private function convertBetweenUnits($value, $from_unit, $to_unit) {
        // Base conversion rates (approximate, relative to px)
        $conversion_rates = [
            'px' => 1,
            'pt' => 1.333, // 1pt = 1.333px
            'pc' => 16,    // 1pc = 16px
            'in' => 96,    // 1in = 96px
            'cm' => 37.8,  // 1cm = 37.8px
            'mm' => 3.78,  // 1mm = 3.78px
            'em' => 16,    // 1em = 16px (approximate, context-dependent)
            'rem' => 16,   // 1rem = 16px (approximate, depends on root font-size)
        ];
        
        // Skip conversion for relative units or same units
        if ($from_unit === $to_unit || 
            in_array($from_unit, ['%', 'vh', 'vw']) || 
            in_array($to_unit, ['%', 'vh', 'vw'])) {
            return $value;
        }
        
        // Convert to px first, then to target unit
        if (isset($conversion_rates[$from_unit]) && isset($conversion_rates[$to_unit])) {
            $px_value = $value * $conversion_rates[$from_unit];
            return $px_value / $conversion_rates[$to_unit];
        }
        
        // If conversion not possible, return original value
        return $value;
    }
    
    /**
     * Convert and validate numeric values
     * Enhanced with config-based range validation
     * Requirements: 5.2, 5.3
     */
    private function convertNumberValue($value, $config = []) {
        if ($value === null || $value === '') {
            return null;
        }
        
        $numeric_value = floatval($value);
        
        // Enhanced range validation using config min/max values
        $min_value = $config['min_value'] ?? 0;
        $max_value = $config['max_value'] ?? 100;
        
        if ($numeric_value < $min_value || $numeric_value > $max_value) {
            throw new \InvalidArgumentException(
                "Number value out of range: $value (must be between $min_value and $max_value)"
            );
        }
        
        // Format the number (remove unnecessary decimals for integers)
        $formatted_value = $numeric_value == intval($numeric_value) ? intval($numeric_value) : round($numeric_value, 2);
        
        return (string) $formatted_value;
    }
    
    /**
     * Convert and validate font family values
     * Requirements: 5.2, 5.3
     */
    private function convertFontFamilyValue($value) {
        if (empty($value)) {
            return null;
        }
        
        // Sanitize font family name
        $value = trim($value);
        
        // Convert common font shortcuts
        $font_shortcuts = [
            'system' => 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            'arial' => 'Arial, sans-serif',
            'helvetica' => 'Helvetica, Arial, sans-serif',
            'georgia' => 'Georgia, serif',
            'times' => 'Times, "Times New Roman", serif',
            'courier' => 'Courier, "Courier New", monospace'
        ];
        
        if (isset($font_shortcuts[strtolower($value)])) {
            return $font_shortcuts[strtolower($value)];
        }
        
        // Basic validation - no dangerous characters
        if (preg_match('/[<>{}]/', $value)) {
            throw new \InvalidArgumentException("Invalid characters in font family: $value");
        }
        
        return $value;
    }
    
    /**
     * Convert boolean values to CSS
     * Requirements: 5.2
     */
    private function convertBooleanValue($value) {
        if ($value === null) {
            return null;
        }
        
        // Convert various boolean representations
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        
        if (is_string($value)) {
            $lower = strtolower(trim($value));
            if (in_array($lower, ['true', '1', 'yes', 'on'])) {
                return '1';
            }
            if (in_array($lower, ['false', '0', 'no', 'off', ''])) {
                return '0';
            }
        }
        
        if (is_numeric($value)) {
            return $value ? '1' : '0';
        }
        
        return '0'; // Default to false
    }
    
    /**
     * Sanitize string values for CSS
     * Requirements: 5.3
     */
    private function sanitizeStringValue($value) {
        if ($value === null) {
            return null;
        }
        
        // Basic sanitization
        $value = trim($value);
        
        // Remove dangerous characters
        $value = preg_replace('/[<>{}]/', '', $value);
        
        // Limit length
        if (strlen($value) > 200) {
            $value = substr($value, 0, 200);
        }
        
        return $value;
    }
    
    /**
     * Build CSS string from variables array
     * Enhanced with priority-based ordering for correct application
     * Requirements: 5.1, 5.3
     */
    private function buildCSSString($variables) {
        if (empty($variables)) {
            return '';
        }
        
        // Sort variables by priority for correct application order
        $sorted_variables = $this->sortVariablesByPriority($variables);
        
        $css_lines = [':root {'];
        
        foreach ($sorted_variables as $variable_name => $variable_value) {
            $css_lines[] = "  {$variable_name}: {$variable_value};";
        }
        
        $css_lines[] = '}';
        
        return implode("\n", $css_lines);
    }
    
    /**
     * Sort CSS variables by priority for correct application order
     * Requirements: 5.3
     * 
     * @param array $variables Generated CSS variables
     * @return array Sorted variables by priority
     */
    private function sortVariablesByPriority($variables) {
        // Create array with priority information
        $variables_with_priority = [];
        
        foreach ($variables as $variable_name => $variable_value) {
            // Find the priority for this variable
            $priority = 999; // Default low priority
            
            foreach ($this->variable_mapping as $setting_key => $config) {
                if ($config['variable'] === $variable_name) {
                    $priority = $config['priority'] ?? 999;
                    break;
                }
            }
            
            $variables_with_priority[] = [
                'name' => $variable_name,
                'value' => $variable_value,
                'priority' => $priority
            ];
        }
        
        // Sort by priority (lower number = higher priority)
        usort($variables_with_priority, function($a, $b) {
            if ($a['priority'] === $b['priority']) {
                // If same priority, sort alphabetically for consistency
                return strcmp($a['name'], $b['name']);
            }
            return $a['priority'] - $b['priority'];
        });
        
        // Convert back to associative array
        $sorted_variables = [];
        foreach ($variables_with_priority as $var_info) {
            $sorted_variables[$var_info['name']] = $var_info['value'];
        }
        
        return $sorted_variables;
    }
    
    /**
     * Get default fallback values
     * Requirements: 5.4
     */
    private function getDefaultValues() {
        $defaults = [];
        
        foreach ($this->variable_mapping as $setting_key => $config) {
            if (isset($config['default'])) {
                $defaults[$setting_key] = $config['default'];
            }
        }
        
        return $defaults;
    }
    
    /**
     * Generate fallback CSS with default values
     * Enhanced for Task 3.4 with comprehensive fallback handling for missing or invalid settings
     * Requirements: 5.4, 7.4
     */
    private function generateFallbackCSS() {
        try {
            // TASK 3.4: Use enhanced fallback system for corrupted or missing settings
            $fallback_settings = $this->createFallbackSystem($this->default_values);
            
            if (!empty($fallback_settings)) {
                // Generate CSS from validated fallback settings
                $fallback_css = $this->buildCSSFromValidatedSettings($fallback_settings);
                
                if (!empty($fallback_css) && $this->validateCSSValues($fallback_css)) {
                    error_log('MAS V2 CSS Variables: Generated fallback CSS from validated default values');
                    return $fallback_css;
                }
            }
            
            throw new \Exception('Default values fallback failed validation');
            
        } catch (\Exception $e) {
            // TASK 3.4: Enhanced error logging for fallback generation failures
            $this->logCSSGenerationError(
                $e,
                [
                    'method' => 'generateFallbackCSS',
                    'fallback_level' => 'default_values',
                    'default_values_count' => count($this->default_values)
                ],
                [
                    'Check default values configuration',
                    'Verify CSS validation logic',
                    'Review variable mapping integrity'
                ]
            );
            
            // TASK 3.4: Ultimate fallback - minimal essential CSS with all critical variables
            return $this->getUltimateFallbackCSS();
        }
    }
    
    /**
     * TASK 3.4: Build CSS from pre-validated settings
     * Requirements: 5.4
     */
    private function buildCSSFromValidatedSettings($settings) {
        $css_variables = [];
        
        foreach ($this->variable_mapping as $setting_key => $css_config) {
            $setting_value = $settings[$setting_key] ?? null;
            
            if ($setting_value === null) {
                continue;
            }
            
            try {
                $css_value = $this->convertSettingToCSSValue($setting_value, $css_config);
                
                if ($css_value !== null) {
                    $css_variables[$css_config['variable']] = $css_value;
                }
            } catch (\Exception $e) {
                error_log("MAS V2 CSS Variables: Failed to convert validated setting $setting_key: " . $e->getMessage());
                continue;
            }
        }
        
        return $this->buildCSSString($css_variables);
    }
    
    /**
     * TASK 3.3: Get ultimate fallback CSS when all other methods fail
     * Provides essential CSS variables for basic functionality
     * Requirements: 5.4
     */
    private function getUltimateFallbackCSS() {
        return ':root {
  /* TASK 3.3: Critical admin bar variables */
  --woow-surface-bar: #23282d;
  --woow-surface-bar-text: #ffffff;
  --woow-surface-bar-hover: #00a0d2;
  --woow-surface-bar-height: 32px;
  --woow-surface-bar-font-size: 13px;
  
  /* TASK 3.3: Critical menu variables */
  --woow-surface-menu: #23282d;
  --woow-surface-menu-text: #ffffff;
  --woow-surface-menu-hover: #32373c;
  --woow-surface-menu-width: 160px;
  
  /* TASK 3.3: Critical content variables */
  --woow-surface-content: #ffffff;
  --woow-space-content-padding: 20px;
  
  /* TASK 3.3: Critical theme variables */
  --woow-color-accent: #0073aa;
  --woow-color-primary: #0073aa;
  --woow-font-size-base: 13px;
  --woow-line-height-base: 1.4;
  
  /* TASK 3.3: Critical layout variables */
  --woow-border-radius-base: 4px;
  --woow-transition-speed: 200ms;
  --woow-shadow-intensity: 0.1;
}';
    }
    
    /**
     * Hook CSS generation to WordPress with high priority
     * Enhanced to ensure CSS variables are applied before DOM rendering
     * Requirements: 5.1, 5.4 - Task 3.3
     */
    public function hookToWordPress() {
        // TASK 3.3: Hook CSS generation to admin_head action with high priority (1)
        // This ensures CSS variables are applied before DOM rendering
        add_action('admin_head', [$this, 'addToAdminHead'], 1);
        
        // TASK 3.3: Hook to admin_enqueue_scripts with high priority for wp_add_inline_style()
        // This is the primary method for CSS variable injection
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminStyles'], 1);
        
        // TASK 3.3: Hook to login_head with high priority for login page styling
        add_action('login_head', [$this, 'addToLoginHead'], 1);
        
        // TASK 3.3: Hook to wp_head with high priority for frontend admin bar styling
        add_action('wp_head', [$this, 'addToFrontendHead'], 1);
        
        // TASK 3.3: Hook to admin_print_styles with highest priority (0) for critical CSS
        // This ensures CSS variables are available before any other styles
        add_action('admin_print_styles', [$this, 'injectCriticalCSS'], 0);
        
        // TASK 3.3: Hook to login_enqueue_scripts for login page wp_add_inline_style()
        add_action('login_enqueue_scripts', [$this, 'enqueueLoginStyles'], 1);
        
        // TASK 3.3: Hook to wp_enqueue_scripts for frontend admin bar wp_add_inline_style()
        add_action('wp_enqueue_scripts', [$this, 'enqueueFrontendStyles'], 1);
        
        // Clear CSS cache when settings are updated
        add_action('update_option_' . SettingsManager::OPTION_NAME, [$this, 'clearCSSCache']);
        
        // TASK 3.3: Hook to admin_init to register early CSS handle
        add_action('admin_init', [$this, 'registerCSSHandle'], 1);
    }
    
    /**
     * Add CSS variables to admin head with high priority
     * Enhanced for Task 3.3 - ensures CSS variables are applied before DOM rendering
     * Requirements: 5.1, 5.4 - Task 3.3
     */
    public function addToAdminHead() {
        try {
            $css_variables = $this->generateCSSVariables();
            
            // TASK 3.3: Validate CSS before injection and add fallback values
            if (!empty($css_variables) && $this->validateCSSValues($css_variables)) {
                echo "<style id='woow-css-variables'>\n{$css_variables}\n</style>\n";
                
                error_log('MAS V2 CSS Variables: Successfully added to admin head with high priority');
            } else {
                throw new \Exception('Generated CSS failed validation or is empty');
            }
            
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Failed to add to admin head: ' . $e->getMessage());
            
            // TASK 3.3: Add fallback CSS with missing or invalid settings
            $fallback_css = $this->generateFallbackCSS();
            if ($this->validateCSSValues($fallback_css)) {
                echo "<style id='woow-css-variables-fallback'>\n{$fallback_css}\n</style>\n";
            } else {
                // Ultimate fallback if even fallback CSS fails validation
                $ultimate_fallback = $this->getUltimateFallbackCSS();
                echo "<style id='woow-css-variables-ultimate-fallback'>\n{$ultimate_fallback}\n</style>\n";
            }
        }
    }
    
    /**
     * Enqueue admin styles properly with wp_add_inline_style()
     * Enhanced with comprehensive validation and fallback handling
     * Requirements: 5.1, 5.4, 7.4 - Task 3.3
     */
    public function enqueueAdminStyles() {
        // TASK 3.3: Register a dummy style handle for inline CSS injection
        wp_register_style($this->css_handle, false);
        wp_enqueue_style($this->css_handle);
        
        try {
            $css_variables = $this->generateCSSVariables();
            
            // TASK 3.3: Validate CSS before injection to ensure safe application
            if (!empty($css_variables) && $this->validateCSSValues($css_variables)) {
                // TASK 3.3: Use wp_add_inline_style() for proper WordPress integration
                wp_add_inline_style($this->css_handle, $css_variables);
                
                // Log successful CSS injection
                error_log(sprintf(
                    'MAS V2 CSS Variables: Successfully injected %d bytes of CSS with %d variables via wp_add_inline_style()',
                    strlen($css_variables),
                    substr_count($css_variables, '--woow-')
                ));
            } else {
                throw new \Exception('Generated CSS failed validation');
            }
            
        } catch (\Exception $e) {
            $this->handleCSSGenerationError($e, 'enqueue_admin_styles');
            
            // TASK 3.3: Add fallback CSS with missing or invalid settings
            $fallback_css = $this->generateFallbackCSS();
            if ($this->validateCSSValues($fallback_css)) {
                wp_add_inline_style($this->css_handle, $fallback_css);
            }
        }
    }
    
    /**
     * TASK 3.3: Inject critical CSS with highest priority (0) for immediate application
     * Ensures CSS variables are available before any other styles
     * Requirements: 5.1, 5.4
     */
    public function injectCriticalCSS() {
        try {
            // Generate only critical CSS variables (high priority ones)
            $settings = $this->settings_manager->getSettings();
            $critical_variables = [];
            
            // Filter to only priority 1 variables for critical CSS
            foreach ($this->variable_mapping as $setting_key => $config) {
                if (($config['priority'] ?? 999) === 1) {
                    $setting_value = $settings[$setting_key] ?? $config['default'];
                    $css_value = $this->convertSettingToCSSValue($setting_value, $config);
                    
                    if ($css_value !== null) {
                        $critical_variables[$config['variable']] = $css_value;
                    }
                }
            }
            
            if (!empty($critical_variables)) {
                $critical_css = $this->buildCSSString($critical_variables);
                echo "<style id='woow-critical-css'>\n{$critical_css}\n</style>\n";
                
                error_log(sprintf(
                    'MAS V2 CSS Variables: Injected %d critical variables before DOM rendering',
                    count($critical_variables)
                ));
            }
            
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Critical CSS injection failed: ' . $e->getMessage());
            
            // TASK 3.3: Fallback critical CSS with essential variables
            $fallback_critical = ':root {
  --woow-surface-bar: #23282d;
  --woow-surface-bar-text: #ffffff;
  --woow-surface-menu: #23282d;
  --woow-surface-menu-text: #ffffff;
  --woow-surface-content: #ffffff;
}';
            echo "<style id='woow-critical-css-fallback'>\n{$fallback_critical}\n</style>\n";
        }
    }
    
    /**
     * TASK 3.3: Register CSS handle early in admin_init
     * Ensures handle is available for wp_add_inline_style()
     * Requirements: 5.1
     */
    public function registerCSSHandle() {
        // Register the CSS handle early to ensure it's available
        wp_register_style($this->css_handle, false);
        
        // Also register handles for different contexts
        wp_register_style($this->css_handle . '-login', false);
        wp_register_style($this->css_handle . '-frontend', false);
    }
    
    /**
     * TASK 3.3: Enqueue login styles with wp_add_inline_style()
     * Requirements: 5.1, 5.4
     */
    public function enqueueLoginStyles() {
        $login_handle = $this->css_handle . '-login';
        wp_register_style($login_handle, false);
        wp_enqueue_style($login_handle);
        
        try {
            $css_variables = $this->generateCSSVariables();
            
            if (!empty($css_variables) && $this->validateCSSValues($css_variables)) {
                wp_add_inline_style($login_handle, $css_variables);
                
                error_log('MAS V2 CSS Variables: Login styles injected via wp_add_inline_style()');
            } else {
                throw new \Exception('Login CSS validation failed');
            }
            
        } catch (\Exception $e) {
            $this->handleCSSGenerationError($e, 'enqueue_login_styles');
            
            // TASK 3.3: Fallback for login page
            $fallback_css = $this->generateFallbackCSS();
            if ($this->validateCSSValues($fallback_css)) {
                wp_add_inline_style($login_handle, $fallback_css);
            }
        }
    }
    
    /**
     * TASK 3.3: Enqueue frontend styles with wp_add_inline_style()
     * For admin bar styling on frontend
     * Requirements: 5.1, 5.4
     */
    public function enqueueFrontendStyles() {
        // Only add if admin bar is showing and user is logged in
        if (!is_admin_bar_showing() || !is_user_logged_in()) {
            return;
        }
        
        $frontend_handle = $this->css_handle . '-frontend';
        wp_register_style($frontend_handle, false);
        wp_enqueue_style($frontend_handle);
        
        try {
            // Generate only admin bar related variables for frontend
            $settings = $this->settings_manager->getSettings();
            $frontend_variables = [];
            
            // Filter to only admin bar variables for frontend
            $admin_bar_keys = [
                'admin_bar_background',
                'admin_bar_text_color', 
                'admin_bar_hover_color',
                'admin_bar_height',
                'admin_bar_font_size'
            ];
            
            foreach ($admin_bar_keys as $key) {
                if (isset($this->variable_mapping[$key])) {
                    $config = $this->variable_mapping[$key];
                    $value = $settings[$key] ?? $config['default'];
                    $css_value = $this->convertSettingToCSSValue($value, $config);
                    
                    if ($css_value !== null) {
                        $frontend_variables[$config['variable']] = $css_value;
                    }
                }
            }
            
            if (!empty($frontend_variables)) {
                $css_output = $this->buildCSSString($frontend_variables);
                wp_add_inline_style($frontend_handle, $css_output);
                
                error_log('MAS V2 CSS Variables: Frontend admin bar styles injected via wp_add_inline_style()');
            }
            
        } catch (\Exception $e) {
            $this->handleCSSGenerationError($e, 'enqueue_frontend_styles');
        }
    }
    
    /**
     * Validate CSS values before injection
     * Enhanced for Task 3.3 with comprehensive validation and fallback handling
     * Requirements: 5.4, 7.4 - Task 3.3
     */
    public function validateCSSValues($css_string) {
        if (empty($css_string)) {
            error_log('MAS V2 CSS Variables: Empty CSS string provided for validation');
            return false;
        }
        
        // TASK 3.3: Basic CSS structure validation
        if (!preg_match('/^:root\s*\{.*\}$/s', trim($css_string))) {
            error_log('MAS V2 CSS Variables: Invalid CSS structure - must be :root { ... }');
            return false;
        }
        
        // TASK 3.3: Check for dangerous content that could cause security issues
        $dangerous_patterns = [
            '/<script/i',
            '/javascript:/i',
            '/expression\s*\(/i',
            '/@import/i',
            '/url\s*\(\s*["\']?javascript:/i',
            '/behavior\s*:/i',
            '/binding\s*:/i',
            '/-moz-binding/i',
            '/vbscript:/i',
            '/data:text\/html/i'
        ];
        
        foreach ($dangerous_patterns as $pattern) {
            if (preg_match($pattern, $css_string)) {
                error_log('MAS V2 CSS Variables: Dangerous content detected in CSS: ' . $pattern);
                return false;
            }
        }
        
        // TASK 3.3: Validate CSS variable syntax
        if (!$this->validateCSSVariableSyntax($css_string)) {
            error_log('MAS V2 CSS Variables: Invalid CSS variable syntax detected');
            return false;
        }
        
        // TASK 3.3: Check for minimum required variables for fallback handling
        $required_variables = [
            '--woow-surface-bar',
            '--woow-surface-bar-text',
            '--woow-surface-menu',
            '--woow-surface-content'
        ];
        
        $has_required = false;
        foreach ($required_variables as $required_var) {
            if (strpos($css_string, $required_var) !== false) {
                $has_required = true;
                break;
            }
        }
        
        if (!$has_required) {
            error_log('MAS V2 CSS Variables: No required variables found in CSS');
            // Don't fail validation, but log the issue
        }
        
        return true;
    }
    
    /**
     * TASK 3.3: Validate CSS variable syntax within the CSS string
     * Requirements: 5.4
     */
    private function validateCSSVariableSyntax($css_string) {
        // Extract all CSS variable declarations
        if (preg_match_all('/--[\w-]+\s*:\s*([^;]+);/', $css_string, $matches)) {
            foreach ($matches[1] as $value) {
                $value = trim($value);
                
                // Basic validation - no unclosed quotes or brackets
                if (substr_count($value, '"') % 2 !== 0 || 
                    substr_count($value, "'") % 2 !== 0 ||
                    substr_count($value, '(') !== substr_count($value, ')') ||
                    substr_count($value, '[') !== substr_count($value, ']') ||
                    substr_count($value, '{') !== substr_count($value, '}')) {
                    return false;
                }
                
                // Check for invalid characters
                if (preg_match('/[<>{}]/', $value)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Get variable mapping for external use
     * Requirements: 5.2
     */
    public function getVariableMapping() {
        return $this->variable_mapping;
    }
    
    /**
     * Add CSS variables to login head
     * Requirements: 5.1, 5.4
     */
    public function addToLoginHead() {
        try {
            $css_variables = $this->generateCSSVariables();
            
            if (!empty($css_variables)) {
                echo "<style id='woow-css-variables-login'>\n{$css_variables}\n</style>\n";
            }
            
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Failed to add to login head: ' . $e->getMessage());
            
            // Add fallback CSS
            $fallback_css = $this->generateFallbackCSS();
            echo "<style id='woow-css-variables-login-fallback'>\n{$fallback_css}\n</style>\n";
        }
    }
    
    /**
     * Add CSS variables to frontend head (for admin bar)
     * Requirements: 5.1, 5.4
     */
    public function addToFrontendHead() {
        // Only add if admin bar is showing and user is logged in
        if (!is_admin_bar_showing() || !is_user_logged_in()) {
            return;
        }
        
        try {
            // Generate only admin bar related variables for frontend
            $settings = $this->settings_manager->getSettings();
            $frontend_variables = [];
            
            // Filter to only admin bar variables for frontend
            $admin_bar_keys = [
                'admin_bar_background',
                'admin_bar_text_color', 
                'admin_bar_hover_color',
                'admin_bar_height',
                'admin_bar_font_size'
            ];
            
            foreach ($admin_bar_keys as $key) {
                if (isset($this->variable_mapping[$key])) {
                    $config = $this->variable_mapping[$key];
                    $value = $settings[$key] ?? $config['default'];
                    $css_value = $this->convertSettingToCSSValue($value, $config);
                    
                    if ($css_value !== null) {
                        $frontend_variables[$config['variable']] = $css_value;
                    }
                }
            }
            
            if (!empty($frontend_variables)) {
                $css_output = $this->buildCSSString($frontend_variables);
                echo "<style id='woow-css-variables-frontend'>\n{$css_output}\n</style>\n";
            }
            
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Failed to add to frontend head: ' . $e->getMessage());
        }
    }
    
    /**
     * Clear CSS cache when settings are updated
     * Requirements: 5.4
     */
    public function clearCSSCache() {
        // Clear any transients related to CSS generation
        delete_transient('woow_css_variables_cache');
        delete_transient('woow_generated_css');
        
        // Clear WordPress object cache if available
        if (function_exists('wp_cache_delete')) {
            wp_cache_delete('woow_css_variables', 'options');
            wp_cache_delete('woow_generated_css', 'options');
        }
        
        error_log('MAS V2 CSS Variables: Cache cleared after settings update');
    }
    
    /**
     * Get cached CSS or generate new
     * Requirements: 5.1, 5.4
     */
    public function getCachedCSS($cache_key = 'woow_generated_css') {
        // Try to get from cache first
        $cached_css = get_transient($cache_key);
        
        if ($cached_css !== false) {
            return $cached_css;
        }
        
        // Generate new CSS
        $css = $this->generateCSSVariables();
        
        // Cache for 1 hour
        set_transient($cache_key, $css, HOUR_IN_SECONDS);
        
        return $css;
    }
    
    /**
     * Get generated CSS for debugging
     * Requirements: 7.4
     */
    public function getGeneratedCSS() {
        return $this->generateCSSVariables();
    }
    
    /**
     * Handle CSS generation errors with comprehensive logging and recovery
     * Requirements: 5.4, 7.4
     */
    private function handleCSSGenerationError(\Exception $e, $context = '') {
        $error_details = [
            'message' => $e->getMessage(),
            'context' => $context,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
            'timestamp' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown'
        ];
        
        // Log comprehensive error information
        error_log(sprintf(
            'MAS V2 CSS Variables Error [%s]: %s in %s:%d - User: %d, URI: %s',
            $context,
            $e->getMessage(),
            $e->getFile(),
            $e->getLine(),
            get_current_user_id(),
            $_SERVER['REQUEST_URI'] ?? 'unknown'
        ));
        
        // Store error for debugging dashboard
        $this->storeErrorForDebugging($error_details);
        
        // Attempt recovery based on error type
        $this->attemptErrorRecovery($e, $context);
    }
    
    /**
     * Store error information for debugging dashboard
     * Requirements: 7.4
     */
    private function storeErrorForDebugging($error_details) {
        $stored_errors = get_transient('woow_css_errors') ?: [];
        
        // Keep only last 50 errors to prevent memory issues
        if (count($stored_errors) >= 50) {
            $stored_errors = array_slice($stored_errors, -49);
        }
        
        $stored_errors[] = $error_details;
        
        // Store for 24 hours
        set_transient('woow_css_errors', $stored_errors, DAY_IN_SECONDS);
    }
    
    /**
     * Attempt error recovery based on error type
     * Requirements: 5.4, 7.4
     */
    private function attemptErrorRecovery(\Exception $e, $context) {
        $error_message = $e->getMessage();
        
        // Handle specific error types
        if (strpos($error_message, 'Invalid color format') !== false) {
            $this->recoverFromColorError($context);
        } elseif (strpos($error_message, 'Size value out of range') !== false) {
            $this->recoverFromSizeError($context);
        } elseif (strpos($error_message, 'database') !== false) {
            $this->recoverFromDatabaseError($context);
        } else {
            $this->performGenericRecovery($context);
        }
    }
    
    /**
     * Recover from color validation errors
     * Requirements: 5.4, 7.4
     */
    private function recoverFromColorError($context) {
        error_log("MAS V2 CSS Variables: Attempting color error recovery for context: $context");
        
        // Reset color settings to defaults
        $settings = $this->settings_manager->getSettings();
        $color_defaults = [
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#ffffff',
            'admin_bar_hover_color' => '#00a0d2',
            'menu_background_color' => '#23282d',
            'menu_text_color' => '#ffffff',
            'menu_hover_color' => '#32373c',
            'content_background_color' => '#ffffff',
            'accent_color' => '#0073aa'
        ];
        
        foreach ($color_defaults as $key => $default_value) {
            if (isset($settings[$key])) {
                $settings[$key] = $default_value;
            }
        }
        
        // Save corrected settings
        try {
            $this->settings_manager->saveSettings($settings);
            error_log('MAS V2 CSS Variables: Color error recovery completed successfully');
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Color error recovery failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Recover from size validation errors
     * Requirements: 5.4, 7.4
     */
    private function recoverFromSizeError($context) {
        error_log("MAS V2 CSS Variables: Attempting size error recovery for context: $context");
        
        // Reset size settings to defaults
        $settings = $this->settings_manager->getSettings();
        $size_defaults = [
            'admin_bar_height' => 32,
            'admin_bar_font_size' => 13,
            'menu_width' => 160,
            'content_padding' => 20,
            'global_font_size' => 13,
            'global_line_height' => 1.4,
            'headings_scale' => 1.2
        ];
        
        foreach ($size_defaults as $key => $default_value) {
            if (isset($settings[$key])) {
                $settings[$key] = $default_value;
            }
        }
        
        // Save corrected settings
        try {
            $this->settings_manager->saveSettings($settings);
            error_log('MAS V2 CSS Variables: Size error recovery completed successfully');
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Size error recovery failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Recover from database errors
     * Requirements: 5.4, 7.4
     */
    private function recoverFromDatabaseError($context) {
        error_log("MAS V2 CSS Variables: Attempting database error recovery for context: $context");
        
        // Clear any corrupted caches
        $this->clearCSSCache();
        
        // Try to verify database integrity
        try {
            $integrity = $this->settings_manager->verifyDatabaseIntegrity();
            if (!$integrity['read_write_ok']) {
                error_log('MAS V2 CSS Variables: Database integrity check failed during recovery');
                
                // Use emergency fallback settings
                $this->useEmergencyFallback();
            }
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Database integrity check failed: ' . $e->getMessage());
            $this->useEmergencyFallback();
        }
    }
    
    /**
     * Perform generic error recovery
     * Requirements: 5.4, 7.4
     */
    private function performGenericRecovery($context) {
        error_log("MAS V2 CSS Variables: Performing generic error recovery for context: $context");
        
        // Clear all caches
        $this->clearCSSCache();
        
        // Reset to default settings
        try {
            $default_settings = $this->default_values;
            $this->settings_manager->saveSettings($default_settings);
            error_log('MAS V2 CSS Variables: Generic recovery completed - reset to defaults');
        } catch (\Exception $e) {
            error_log('MAS V2 CSS Variables: Generic recovery failed: ' . $e->getMessage());
            $this->useEmergencyFallback();
        }
    }
    
    /**
     * Use emergency fallback when all recovery attempts fail
     * Requirements: 5.4, 7.4
     */
    private function useEmergencyFallback() {
        error_log('MAS V2 CSS Variables: Using emergency fallback mode');
        
        // Store emergency flag
        set_transient('woow_css_emergency_mode', true, HOUR_IN_SECONDS);
        
        // Generate minimal emergency CSS
        $emergency_css = ':root {
  --woow-surface-bar: #23282d;
  --woow-surface-bar-text: #ffffff;
  --woow-surface-bar-hover: #00a0d2;
  --woow-surface-menu: #23282d;
  --woow-surface-menu-text: #ffffff;
  --woow-surface-menu-hover: #32373c;
  --woow-surface-content: #ffffff;
  --woow-color-accent: #0073aa;
  --woow-font-size-base: 13px;
  --woow-line-height-base: 1.4;
}';
        
        // Store emergency CSS
        set_transient('woow_emergency_css', $emergency_css, HOUR_IN_SECONDS);
    }
    
    /**
     * Check if system is in emergency mode
     * Requirements: 5.4, 7.4
     */
    public function isEmergencyMode() {
        return get_transient('woow_css_emergency_mode') !== false;
    }
    
    /**
     * Get emergency CSS if in emergency mode
     * Requirements: 5.4, 7.4
     */
    public function getEmergencyCSS() {
        if ($this->isEmergencyMode()) {
            return get_transient('woow_emergency_css') ?: $this->getUltimateFallbackCSS();
        }
        return null;
    }
    
    /**
     * TASK 3.4: Enhanced CSS value validation before injection
     * Implements comprehensive validation for CSS values to prevent injection
     * Requirements: 5.4, 7.4
     */
    public function validateCSSValueBeforeInjection($value, $type, $config = []) {
        if ($value === null || $value === '') {
            error_log("MAS V2 CSS Variables: Empty value provided for validation (type: $type)");
            return false;
        }
        
        try {
            switch ($type) {
                case 'color':
                    return $this->validateColorValue($value);
                    
                case 'size':
                    return $this->validateSizeValue($value, $config);
                    
                case 'number':
                    return $this->validateNumberValue($value, $config);
                    
                case 'font-family':
                    return $this->validateFontFamilyValue($value);
                    
                case 'boolean':
                    return $this->validateBooleanValue($value);
                    
                default:
                    return $this->validateStringValue($value);
            }
        } catch (\Exception $e) {
            error_log("MAS V2 CSS Variables: Validation error for type $type: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * TASK 3.4: Validate color values with comprehensive format checking
     * Requirements: 5.4
     */
    private function validateColorValue($value) {
        $value = trim($value);
        
        // Check for dangerous content
        if (preg_match('/[<>{}]|javascript:|expression\s*\(|url\s*\(/i', $value)) {
            error_log("MAS V2 CSS Variables: Dangerous content detected in color value: $value");
            return false;
        }
        
        // Validate hex colors
        if (preg_match('/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/', $value)) {
            return true;
        }
        
        // Validate RGB/RGBA
        if (preg_match('/^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*([\d.]+))?\s*\)$/i', $value, $matches)) {
            $r = floatval($matches[1]);
            $g = floatval($matches[2]);
            $b = floatval($matches[3]);
            $a = isset($matches[4]) ? floatval($matches[4]) : null;
            
            if ($r < 0 || $r > 255 || $g < 0 || $g > 255 || $b < 0 || $b > 255) {
                return false;
            }
            
            if ($a !== null && ($a < 0 || $a > 1)) {
                return false;
            }
            
            return true;
        }
        
        // Validate HSL/HSLA
        if (preg_match('/^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*([\d.]+))?\s*\)$/i', $value, $matches)) {
            $h = floatval($matches[1]);
            $s = floatval($matches[2]);
            $l = floatval($matches[3]);
            $a = isset($matches[4]) ? floatval($matches[4]) : null;
            
            if ($h < 0 || $h > 360 || $s < 0 || $s > 100 || $l < 0 || $l > 100) {
                return false;
            }
            
            if ($a !== null && ($a < 0 || $a > 1)) {
                return false;
            }
            
            return true;
        }
        
        // Validate named colors
        $named_colors = [
            'transparent', 'inherit', 'initial', 'unset', 'currentcolor',
            'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
            'gray', 'grey', 'silver', 'maroon', 'navy', 'olive', 'lime', 'aqua', 'teal', 'fuchsia'
        ];
        
        return in_array(strtolower($value), $named_colors);
    }
    
    /**
     * TASK 3.4: Validate size values with range checking
     * Requirements: 5.4
     */
    private function validateSizeValue($value, $config = []) {
        // Handle values with units
        if (is_string($value) && preg_match('/^([\d.]+)(px|em|rem|%|vh|vw|pt|pc|in|cm|mm)$/i', $value, $matches)) {
            $numeric_value = floatval($matches[1]);
            $unit = strtolower($matches[2]);
        } else {
            $numeric_value = floatval($value);
            $unit = 'px'; // Default unit
        }
        
        // Check for dangerous content
        if (is_string($value) && preg_match('/[<>{}]|javascript:|expression\s*\(/i', $value)) {
            error_log("MAS V2 CSS Variables: Dangerous content detected in size value: $value");
            return false;
        }
        
        // Validate numeric range
        $min_value = $config['min_value'] ?? 0;
        $max_value = $config['max_value'] ?? 9999;
        
        if ($numeric_value < $min_value || $numeric_value > $max_value) {
            error_log("MAS V2 CSS Variables: Size value out of range: $value (must be between $min_value and $max_value)");
            return false;
        }
        
        // Validate unit
        $valid_units = ['px', 'em', 'rem', '%', 'vh', 'vw', 'pt', 'pc', 'in', 'cm', 'mm'];
        if (!in_array($unit, $valid_units)) {
            error_log("MAS V2 CSS Variables: Invalid unit in size value: $unit");
            return false;
        }
        
        return true;
    }
    
    /**
     * TASK 3.4: Validate number values with range checking
     * Requirements: 5.4
     */
    private function validateNumberValue($value, $config = []) {
        if (!is_numeric($value)) {
            error_log("MAS V2 CSS Variables: Non-numeric value provided: $value");
            return false;
        }
        
        $numeric_value = floatval($value);
        
        // Check range
        $min_value = $config['min_value'] ?? 0;
        $max_value = $config['max_value'] ?? 100;
        
        if ($numeric_value < $min_value || $numeric_value > $max_value) {
            error_log("MAS V2 CSS Variables: Number value out of range: $value (must be between $min_value and $max_value)");
            return false;
        }
        
        return true;
    }
    
    /**
     * TASK 3.4: Validate font family values
     * Requirements: 5.4
     */
    private function validateFontFamilyValue($value) {
        $value = trim($value);
        
        // Check for dangerous content
        if (preg_match('/[<>{}]|javascript:|expression\s*\(|url\s*\(/i', $value)) {
            error_log("MAS V2 CSS Variables: Dangerous content detected in font family: $value");
            return false;
        }
        
        // Check length
        if (strlen($value) > 200) {
            error_log("MAS V2 CSS Variables: Font family value too long: " . strlen($value) . " characters");
            return false;
        }
        
        return true;
    }
    
    /**
     * TASK 3.4: Validate boolean values
     * Requirements: 5.4
     */
    private function validateBooleanValue($value) {
        if (is_bool($value)) {
            return true;
        }
        
        if (is_string($value)) {
            $lower = strtolower(trim($value));
            return in_array($lower, ['true', '1', 'yes', 'on', 'false', '0', 'no', 'off', '']);
        }
        
        if (is_numeric($value)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * TASK 3.4: Validate string values
     * Requirements: 5.4
     */
    private function validateStringValue($value) {
        $value = trim($value);
        
        // Check for dangerous content
        if (preg_match('/[<>{}]|javascript:|expression\s*\(|url\s*\(/i', $value)) {
            error_log("MAS V2 CSS Variables: Dangerous content detected in string value: $value");
            return false;
        }
        
        // Check length
        if (strlen($value) > 200) {
            error_log("MAS V2 CSS Variables: String value too long: " . strlen($value) . " characters");
            return false;
        }
        
        return true;
    }
    
    /**
     * TASK 3.4: Create fallback system for corrupted or missing settings
     * Implements comprehensive fallback handling with multiple fallback levels
     * Requirements: 5.4, 7.4
     */
    public function createFallbackSystem($settings = null) {
        $fallback_levels = [
            'user_settings' => $settings,
            'database_settings' => null,
            'default_values' => $this->default_values,
            'emergency_fallback' => $this->getEmergencyFallbackValues()
        ];
        
        // Try to get database settings if not provided
        if ($settings === null) {
            try {
                $fallback_levels['database_settings'] = $this->settings_manager->getSettings();
            } catch (\Exception $e) {
                error_log('MAS V2 CSS Variables: Failed to get database settings for fallback: ' . $e->getMessage());
            }
        }
        
        // Process each fallback level
        foreach ($fallback_levels as $level_name => $level_settings) {
            if ($level_settings === null) {
                continue;
            }
            
            try {
                $validated_settings = $this->validateAndSanitizeSettings($level_settings);
                
                if (!empty($validated_settings)) {
                    error_log("MAS V2 CSS Variables: Using fallback level: $level_name with " . count($validated_settings) . " settings");
                    return $validated_settings;
                }
            } catch (\Exception $e) {
                error_log("MAS V2 CSS Variables: Fallback level $level_name failed: " . $e->getMessage());
                continue;
            }
        }
        
        // Ultimate fallback - return minimal emergency settings
        error_log('MAS V2 CSS Variables: All fallback levels failed, using ultimate emergency fallback');
        return $this->getEmergencyFallbackValues();
    }
    
    /**
     * TASK 3.4: Validate and sanitize settings array
     * Requirements: 5.4
     */
    private function validateAndSanitizeSettings($settings) {
        if (!is_array($settings)) {
            throw new \InvalidArgumentException('Settings must be an array');
        }
        
        $validated_settings = [];
        
        foreach ($this->variable_mapping as $setting_key => $config) {
            $setting_value = $settings[$setting_key] ?? $config['default'] ?? null;
            
            if ($setting_value === null) {
                continue;
            }
            
            // Validate the value
            if ($this->validateCSSValueBeforeInjection($setting_value, $config['type'], $config)) {
                $validated_settings[$setting_key] = $setting_value;
            } else {
                // Use default value if validation fails
                if (isset($config['default'])) {
                    $validated_settings[$setting_key] = $config['default'];
                    error_log("MAS V2 CSS Variables: Using default value for invalid setting: $setting_key");
                }
            }
        }
        
        return $validated_settings;
    }
    
    /**
     * TASK 3.4: Get emergency fallback values
     * Requirements: 5.4
     */
    private function getEmergencyFallbackValues() {
        return [
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#ffffff',
            'admin_bar_hover_color' => '#00a0d2',
            'admin_bar_height' => 32,
            'admin_bar_font_size' => 13,
            'menu_background' => '#23282d',
            'menu_text_color' => '#ffffff',
            'menu_hover_color' => '#32373c',
            'menu_width' => 160,
            'content_background' => '#ffffff',
            'content_padding' => 20,
            'accent_color' => '#0073aa',
            'primary_color' => '#0073aa',
            'global_font_size' => 13,
            'global_line_height' => 1.4,
            'border_radius' => 4,
            'transition_speed' => 200,
            'shadow_intensity' => 0.1,
            'enable_animations' => false,
            'glassmorphism_enabled' => false
        ];
    }
    
    /**
     * TASK 3.4: Enhanced error logging for CSS generation failures
     * Implements comprehensive error logging with context and recovery suggestions
     * Requirements: 7.4
     */
    public function logCSSGenerationError($error, $context = [], $recovery_suggestions = []) {
        $error_data = [
            'timestamp' => current_time('mysql'),
            'error_message' => is_string($error) ? $error : $error->getMessage(),
            'error_type' => is_object($error) ? get_class($error) : 'string',
            'context' => $context,
            'recovery_suggestions' => $recovery_suggestions,
            'user_id' => get_current_user_id(),
            'request_uri' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'php_version' => PHP_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true)
        ];
        
        // Add stack trace if it's an exception
        if (is_object($error) && method_exists($error, 'getTraceAsString')) {
            $error_data['stack_trace'] = $error->getTraceAsString();
            $error_data['file'] = $error->getFile();
            $error_data['line'] = $error->getLine();
        }
        
        // Log to WordPress error log
        error_log(sprintf(
            'MAS V2 CSS Variables Generation Error: %s | Context: %s | User: %d | Memory: %s/%s',
            $error_data['error_message'],
            json_encode($context),
            $error_data['user_id'],
            size_format($error_data['memory_usage']),
            size_format($error_data['memory_peak'])
        ));
        
        // Store detailed error for debugging dashboard
        $this->storeDetailedErrorLog($error_data);
        
        // Send error notification if critical
        if ($this->isCriticalError($error)) {
            $this->sendCriticalErrorNotification($error_data);
        }
        
        return $error_data;
    }
    
    /**
     * TASK 3.4: Store detailed error log for debugging
     * Requirements: 7.4
     */
    private function storeDetailedErrorLog($error_data) {
        $stored_errors = get_transient('woow_css_detailed_errors') ?: [];
        
        // Keep only last 100 detailed errors to prevent memory issues
        if (count($stored_errors) >= 100) {
            $stored_errors = array_slice($stored_errors, -99);
        }
        
        $stored_errors[] = $error_data;
        
        // Store for 7 days
        set_transient('woow_css_detailed_errors', $stored_errors, 7 * DAY_IN_SECONDS);
        
        // Also store error count for monitoring
        $error_count = get_transient('woow_css_error_count') ?: 0;
        set_transient('woow_css_error_count', $error_count + 1, DAY_IN_SECONDS);
    }
    
    /**
     * TASK 3.4: Check if error is critical
     * Requirements: 7.4
     */
    private function isCriticalError($error) {
        if (is_string($error)) {
            $critical_patterns = [
                'database',
                'fatal',
                'memory',
                'security',
                'injection'
            ];
            
            foreach ($critical_patterns as $pattern) {
                if (stripos($error, $pattern) !== false) {
                    return true;
                }
            }
        }
        
        if (is_object($error)) {
            $critical_exceptions = [
                'Error',
                'ParseError',
                'TypeError',
                'FatalError'
            ];
            
            foreach ($critical_exceptions as $exception_type) {
                if ($error instanceof $exception_type) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * TASK 3.4: Send critical error notification
     * Requirements: 7.4
     */
    private function sendCriticalErrorNotification($error_data) {
        // Only send notification once per hour to prevent spam
        $notification_key = 'woow_css_critical_notification_sent';
        if (get_transient($notification_key)) {
            return;
        }
        
        // Set flag to prevent spam
        set_transient($notification_key, true, HOUR_IN_SECONDS);
        
        // Log critical error
        error_log(sprintf(
            'CRITICAL MAS V2 CSS Variables Error: %s | File: %s:%d | User: %d',
            $error_data['error_message'],
            $error_data['file'] ?? 'unknown',
            $error_data['line'] ?? 0,
            $error_data['user_id']
        ));
        
        // Store critical error flag for admin notice
        set_transient('woow_css_critical_error', $error_data, DAY_IN_SECONDS);
    }
    
    /**
     * TASK 3.4: Get error statistics for debugging
     * Requirements: 7.4
     */
    public function getErrorStatistics() {
        return [
            'total_errors' => get_transient('woow_css_error_count') ?: 0,
            'detailed_errors' => get_transient('woow_css_detailed_errors') ?: [],
            'critical_error' => get_transient('woow_css_critical_error'),
            'emergency_mode' => $this->isEmergencyMode(),
            'last_successful_generation' => get_transient('woow_css_last_success'),
            'cache_status' => [
                'generated_css' => get_transient('woow_generated_css') !== false,
                'variables_cache' => get_transient('woow_css_variables_cache') !== false,
                'emergency_css' => get_transient('woow_emergency_css') !== false
            ]
        ];
    }
    
    /**
     * TASK 3.4: Clear error logs and reset error state
     * Requirements: 7.4
     */
    public function clearErrorLogs() {
        delete_transient('woow_css_errors');
        delete_transient('woow_css_detailed_errors');
        delete_transient('woow_css_error_count');
        delete_transient('woow_css_critical_error');
        delete_transient('woow_css_critical_notification_sent');
        delete_transient('woow_css_emergency_mode');
        delete_transient('woow_emergency_css');
        
        error_log('MAS V2 CSS Variables: Error logs cleared and error state reset');
        
        return true;
    }
    
    /**
     * Clear emergency mode
     * Requirements: 5.4, 7.4
     */
    public function clearEmergencyMode() {
        delete_transient('woow_css_emergency_mode');
        delete_transient('woow_emergency_css');
        error_log('MAS V2 CSS Variables: Emergency mode cleared');
    }
    
    /**
     * Get stored errors for debugging
     * Requirements: 7.4
     */
    public function getStoredErrors() {
        return get_transient('woow_css_errors') ?: [];
    }
    
    /**
     * Clear stored errors
     * Requirements: 7.4
     */
    public function clearStoredErrors() {
        delete_transient('woow_css_errors');
        error_log('MAS V2 CSS Variables: Stored errors cleared');
    }
    
    /**
     * Get CSS generation statistics for debugging
     * Requirements: 7.4
     */
    public function getCSSStats() {
        $settings = $this->settings_manager->getSettings();
        $css = $this->generateCSSVariables($settings);
        
        return [
            'settings_count' => count($settings),
            'variables_count' => substr_count($css, '--woow-'),
            'css_size_bytes' => strlen($css),
            'generation_time' => microtime(true),
            'mapping_count' => count($this->variable_mapping),
            'default_values_count' => count($this->default_values),
            'emergency_mode' => $this->isEmergencyMode(),
            'stored_errors_count' => count($this->getStoredErrors()),
            'cache_status' => [
                'css_cache' => get_transient('woow_generated_css') !== false,
                'variables_cache' => get_transient('woow_css_variables_cache') !== false
            ]
        ];
    }
}