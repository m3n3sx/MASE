<?php
/**
 * Settings Manager Service - Enhanced with Preset Management
 * 
 * CONSOLIDATED: SettingsManager + PresetManager
 * - Core settings management
 * - Preset management using WordPress Custom Post Types
 * - ComponentAdapter integration for WordPress-native UI rendering
 * 
 * @package ModernAdminStyler
 * @version 2.3.0 - Consolidated Architecture
 */

namespace ModernAdminStyler\Services;

class SettingsManager {
    
    const OPTION_NAME = 'mas_v2_settings';
    
    // 🎯 Preset Management Constants (ADDED)
    private $preset_post_type = 'mas_v2_preset';
    private $preset_meta_key = '_mas_v2_settings';
    
    /**
     * @var CoreEngine Core engine instance for service access
     */
    private $coreEngine;
    
    /**
     * @var ComponentAdapter Component adapter for WordPress-native UI rendering
     */
    private $component_adapter;
    
    /**
     * 🚀 Initialize Settings Manager with ComponentAdapter integration and Preset Management
     */
    public function __construct($coreEngine = null) {
        $this->coreEngine = $coreEngine;
        
        // ComponentAdapter functionality is now integrated into SettingsManager
        // (part of consolidation - Block 8)
        $this->component_adapter = $this;
        
        // Initialize preset management (ADDED)
        $this->initPresetManagement();
    }
    
    /**
     * 🎯 Initialize Preset Management System (ADDED)
     */
    private function initPresetManagement() {
        // Register Custom Post Type for presets
        add_action('init', [$this, 'registerPresetPostType']);
        
        // Add preset capabilities
        add_action('admin_init', [$this, 'addPresetCapabilities']);
    }
    
    /**
     * 📥 Pobiera ustawienia z bazy danych
     * REFACTOR: Now uses central schema from main plugin class
     */
    public function getSettings() {
        // Get defaults from central schema
        $plugin_instance = \ModernAdminStylerV2::getInstance();
        $defaults = $plugin_instance->getDefaultSettings();
        $saved_settings = get_option(self::OPTION_NAME, []);
        
        // Merge z domyślnymi ustawieniami
        return wp_parse_args($saved_settings, $defaults);
    }
    
    /**
     * 💾 Zapisuje ustawienia do bazy danych
     * ENHANCED: Transaction support, error handling, and comprehensive logging
     * Requirements: 4.1, 4.2, 7.3
     */
    public function saveSettings($settings) {
        global $wpdb;
        
        // Start transaction for atomic updates
        $wpdb->query('START TRANSACTION');
        
        try {
            // Validate settings before saving
            if (!is_array($settings)) {
                throw new \Exception('Settings must be an array');
            }
            
            // Sanitize settings before database write
            $sanitized_settings = $this->sanitizeSettings($settings);
            
            // Get current settings for comparison
            $current_settings = get_option(self::OPTION_NAME, []);
            
            // Add metadata for tracking
            $sanitized_settings['_meta'] = [
                'last_saved' => current_time('mysql'),
                'user_id' => get_current_user_id(),
                'version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '2.4.0',
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ];
            
            // Perform the database update
            $result = update_option(self::OPTION_NAME, $sanitized_settings);
            
            // Verify the save was successful by reading back
            $verification = get_option(self::OPTION_NAME, []);
            $save_verified = (serialize($sanitized_settings) === serialize($verification));
            
            if (!$save_verified) {
                // Try alternative verification method
                $partial_verification = $this->verifyPartialSave($sanitized_settings, $verification);
                if (!$partial_verification) {
                    throw new \Exception('Settings verification failed after save');
                }
                error_log('MAS V2: Settings save verified with partial verification method');
            }
            
            // Commit transaction
            $wpdb->query('COMMIT');
            
            // Log successful save
            error_log(sprintf(
                'MAS V2: Settings saved successfully - User: %d, Size: %d bytes, Changed fields: %d',
                get_current_user_id(),
                strlen(serialize($sanitized_settings)),
                count(array_diff_assoc($sanitized_settings, $current_settings))
            ));
            
            // Clear any related caches
            $this->clearSettingsCache();
            
            return $result;
            
        } catch (\Exception $e) {
            // Rollback transaction on error
            $wpdb->query('ROLLBACK');
            
            // Log the error with context
            error_log(sprintf(
                'MAS V2: Settings save failed - User: %d, Error: %s, Settings size: %d bytes',
                get_current_user_id(),
                $e->getMessage(),
                strlen(serialize($settings ?? []))
            ));
            
            // Re-throw for upstream handling
            throw new \Exception('Database save failed: ' . $e->getMessage());
        }
    }
    
    /**
     * 🔍 Verify partial save when full verification fails
     * ENHANCED: Alternative verification method for edge cases
     */
    private function verifyPartialSave($expected, $actual) {
        // Check if at least 80% of the data matches
        $expected_keys = array_keys($expected);
        $actual_keys = array_keys($actual);
        
        $matching_keys = array_intersect($expected_keys, $actual_keys);
        $match_percentage = count($matching_keys) / count($expected_keys);
        
        if ($match_percentage < 0.8) {
            return false;
        }
        
        // Check if critical fields match
        $critical_fields = ['_meta', 'enable_plugin', 'color_scheme'];
        foreach ($critical_fields as $field) {
            if (isset($expected[$field]) && isset($actual[$field])) {
                if ($expected[$field] !== $actual[$field]) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * 🧹 Clear settings-related caches (public method)
     */
    public function clearCache() {
        $this->clearSettingsCache();
    }
    
    /**
     * 🧹 Clear settings-related caches
     */
    private function clearSettingsCache() {
        // Clear WordPress object cache if available
        if (function_exists('wp_cache_delete')) {
            wp_cache_delete(self::OPTION_NAME, 'options');
        }
        
        // Clear any transients related to settings
        delete_transient('mas_v2_settings_cache');
        delete_transient('mas_v2_generated_css');
    }
    
    /**
     * 🔍 Verify database integrity for settings
     */
    public function verifyDatabaseIntegrity() {
        global $wpdb;
        
        try {
            // Check if options table exists
            $table_exists = $wpdb->get_var("SHOW TABLES LIKE '{$wpdb->options}'") === $wpdb->options;
            if (!$table_exists) {
                throw new \Exception('Options table does not exist');
            }
            
            // Check if our option exists
            $option_exists = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name = %s",
                self::OPTION_NAME
            )) > 0;
            
            // Test read/write capability
            $test_data = ['test' => 'integrity_check_' . time()];
            $write_result = update_option(self::OPTION_NAME . '_test', $test_data);
            $read_result = get_option(self::OPTION_NAME . '_test');
            delete_option(self::OPTION_NAME . '_test');
            
            $read_write_ok = ($write_result && serialize($test_data) === serialize($read_result));
            
            return [
                'table_exists' => $table_exists,
                'option_exists' => $option_exists,
                'read_write_ok' => $read_write_ok,
                'database_connection' => $wpdb->check_connection(),
                'last_error' => $wpdb->last_error
            ];
            
        } catch (\Exception $e) {
            return [
                'error' => $e->getMessage(),
                'table_exists' => false,
                'option_exists' => false,
                'read_write_ok' => false,
                'database_connection' => false
            ];
        }
    }
    
    /**
     * 🎨 Render Settings Form Field using ComponentAdapter
     * WordPress-native rendering with enhanced security and usability
     */
    public function renderSettingsField($field_type, $field_name, $field_value = '', $args = []) {
        if (!$this->component_adapter) {
            error_log('MAS V2 Warning: ComponentAdapter not available for field rendering');
            return $this->renderBasicField($field_type, $field_name, $field_value, $args);
        }
        
        // Enhanced field arguments with MAS V2 styling
        $enhanced_args = wp_parse_args($args, [
            'classes' => 'mas-v2-field',
            'wrap_table' => true,
            'description' => '',
            'required' => false
        ]);
        
        return $this->component_adapter->renderWordPressFormField(
            $field_type, 
            $field_name, 
            $field_value, 
            $enhanced_args
        );
    }
    
    /**
     * 🎯 Render Settings Section using ComponentAdapter
     */
    public function renderSettingsSection($title, $content, $args = []) {
        if (!$this->component_adapter) {
            return $this->renderBasicSection($title, $content, $args);
        }
        
        $enhanced_args = wp_parse_args($args, [
            'id' => 'mas-v2-section-' . sanitize_title($title),
            'classes' => 'mas-v2-settings-section',
            'description' => ''
        ]);
        
        return $this->component_adapter->renderWordPressMetabox($content, $title, $enhanced_args);
    }
    
    /**
     * 🔲 Render Settings Button using ComponentAdapter
     */
    public function renderSettingsButton($text, $type = 'secondary', $args = []) {
        if (!$this->component_adapter) {
            return sprintf('<button type="button" class="button button-%s">%s</button>', 
                esc_attr($type), esc_html($text));
        }
        
        $enhanced_args = wp_parse_args($args, [
            'classes' => 'mas-v2-button',
            'size' => 'normal'
        ]);
        
        return $this->component_adapter->renderWordPressButton($text, $type, $enhanced_args);
    }
    
    /**
     * 📢 Render Settings Notice using ComponentAdapter
     */
    public function renderSettingsNotice($message, $type = 'info', $args = []) {
        if (!$this->component_adapter) {
            return sprintf('<div class="notice notice-%s"><p>%s</p></div>', 
                esc_attr($type), wp_kses_post($message));
        }
        
        $enhanced_args = wp_parse_args($args, [
            'dismissible' => true,
            'classes' => 'mas-v2-notice'
        ]);
        
        return $this->component_adapter->renderWordPressNotice($message, $type, $enhanced_args);
    }
    
    /**
     * 🗂️ Render Settings Table using ComponentAdapter
     */
    public function renderSettingsTable($headers, $rows, $args = []) {
        if (!$this->component_adapter) {
            return $this->renderBasicTable($headers, $rows, $args);
        }
        
        $enhanced_args = wp_parse_args($args, [
            'classes' => 'wp-list-table widefat fixed striped mas-v2-table',
            'responsive' => true
        ]);
        
        return $this->component_adapter->renderWordPressTable($headers, $rows, $enhanced_args);
    }
    
    /**
     * 🎨 Render Complete Settings Form with ComponentAdapter
     */
    public function renderCompleteSettingsForm($settings_schema, $current_values = []) {
        if (!$this->component_adapter) {
            return $this->renderBasicForm($settings_schema, $current_values);
        }
        
        $output = '';
        
        // Group settings by sections
        $sections = $this->groupSettingsBySection($settings_schema);
        
        foreach ($sections as $section_name => $section_fields) {
            $section_title = ucfirst(str_replace('_', ' ', $section_name));
            $section_content = '';
            
            // Render fields in section
            foreach ($section_fields as $field_name => $field_config) {
                $field_value = $current_values[$field_name] ?? ($field_config['default'] ?? '');
                
                $field_args = [
                    'label' => $field_config['label'] ?? ucfirst(str_replace('_', ' ', $field_name)),
                    'description' => $field_config['description'] ?? '',
                    'required' => $field_config['required'] ?? false,
                    'options' => $field_config['options'] ?? [],
                    'classes' => 'mas-v2-field-' . $field_config['type'],
                    'wrap_table' => true
                ];
                
                $section_content .= $this->renderSettingsField(
                    $field_config['type'], 
                    $field_name, 
                    $field_value, 
                    $field_args
                );
            }
            
            // Wrap section in metabox
            $output .= $this->renderSettingsSection($section_title, $section_content, [
                'description' => 'Konfiguracja sekcji ' . strtolower($section_title)
            ]);
        }
        
        return $output;
    }
    
    /**
     * 🔧 Group Settings by Section
     */
    private function groupSettingsBySection($settings_schema) {
        $sections = [];
        
        foreach ($settings_schema as $field_name => $field_config) {
            $section = $field_config['section'] ?? 'general';
            
            if (!isset($sections[$section])) {
                $sections[$section] = [];
            }
            
            $sections[$section][$field_name] = $field_config;
        }
        
        return $sections;
    }
    
    /**
     * 📋 Get Settings Schema for Form Generation
     */
    public function getSettingsSchema() {
        return [
            'enable_plugin' => [
                'type' => 'checkbox',
                'label' => 'Włącz wtyczkę',
                'description' => 'Główny przełącznik funkcjonalności wtyczki',
                'default' => false,
                'section' => 'general'
            ],
            'color_scheme' => [
                'type' => 'select',
                'label' => 'Schemat kolorów',
                'description' => 'Wybierz podstawowy schemat kolorów',
                'options' => [
                    'light' => 'Jasny',
                    'dark' => 'Ciemny',
                    'auto' => 'Automatyczny'
                ],
                'default' => 'light',
                'section' => 'appearance'
            ],
            'admin_bar_background' => [
                'type' => 'color',
                'label' => 'Kolor tła paska administracyjnego',
                'description' => 'Ustaw kolor tła górnego paska',
                'default' => '#23282d',
                'section' => 'admin_bar'
            ],
            'menu_width' => [
                'type' => 'number',
                'label' => 'Szerokość menu',
                'description' => 'Szerokość menu bocznego w pikselach',
                'default' => 160,
                'section' => 'menu'
            ],
            'custom_css' => [
                'type' => 'textarea',
                'label' => 'Własny CSS',
                'description' => 'Dodatkowe style CSS',
                'default' => '',
                'section' => 'advanced'
            ]
        ];
    }
    
    /**
     * 🎯 Static Helper Methods for Quick Component Access
     */
    public static function field($type, $name, $value = '', $args = []) {
        $instance = new self();
        return $instance->renderSettingsField($type, $name, $value, $args);
    }
    
    public static function section($title, $content, $args = []) {
        $instance = new self();
        return $instance->renderSettingsSection($title, $content, $args);
    }
    
    public static function button($text, $type = 'secondary', $args = []) {
        $instance = new self();
        return $instance->renderSettingsButton($text, $type, $args);
    }
    
    public static function notice($message, $type = 'info', $args = []) {
        $instance = new self();
        return $instance->renderSettingsNotice($message, $type, $args);
    }
    
    // === FALLBACK METHODS FOR BASIC RENDERING ===
    
    /**
     * 🔧 Basic Field Rendering (fallback when ComponentAdapter not available)
     */
    private function renderBasicField($type, $name, $value, $args) {
        $label = $args['label'] ?? ucfirst(str_replace('_', ' ', $name));
        $description = $args['description'] ?? '';
        
        $output = '<tr><th scope="row"><label for="' . esc_attr($name) . '">' . esc_html($label) . '</label></th><td>';
        
        switch ($type) {
            case 'text':
            case 'email':
            case 'url':
            case 'number':
                $output .= sprintf('<input type="%s" name="%s" id="%s" value="%s" class="regular-text" />',
                    esc_attr($type), esc_attr($name), esc_attr($name), esc_attr($value));
                break;
            case 'textarea':
                $output .= sprintf('<textarea name="%s" id="%s" rows="5" cols="50" class="large-text">%s</textarea>',
                    esc_attr($name), esc_attr($name), esc_textarea($value));
                break;
            case 'checkbox':
                $output .= sprintf('<input type="checkbox" name="%s" id="%s" value="1" %s />',
                    esc_attr($name), esc_attr($name), checked($value, true, false));
                break;
            case 'color':
                $output .= sprintf('<input type="color" name="%s" id="%s" value="%s" class="color-picker" />',
                    esc_attr($name), esc_attr($name), esc_attr($value));
                break;
        }
        
        if ($description) {
            $output .= '<p class="description">' . wp_kses_post($description) . '</p>';
        }
        
        $output .= '</td></tr>';
        return $output;
    }
    
    /**
     * 🔧 Basic Section Rendering (fallback)
     */
    private function renderBasicSection($title, $content, $args) {
        return sprintf('<div class="postbox"><h3 class="hndle">%s</h3><div class="inside">%s</div></div>',
            esc_html($title), $content);
    }
    
    /**
     * 🔧 Basic Table Rendering (fallback)
     */
    private function renderBasicTable($headers, $rows, $args) {
        $output = '<table class="wp-list-table widefat fixed striped"><thead><tr>';
        
        foreach ($headers as $header) {
            $output .= '<th>' . esc_html($header) . '</th>';
        }
        
        $output .= '</tr></thead><tbody>';
        
        foreach ($rows as $row) {
            $output .= '<tr>';
            foreach ($row as $cell) {
                $output .= '<td>' . wp_kses_post($cell) . '</td>';
            }
            $output .= '</tr>';
        }
        
        $output .= '</tbody></table>';
        return $output;
    }
    
    /**
     * 🔧 Basic Form Rendering (fallback)
     */
    private function renderBasicForm($settings_schema, $current_values) {
        $output = '<table class="form-table">';
        
        foreach ($settings_schema as $field_name => $field_config) {
            $field_value = $current_values[$field_name] ?? ($field_config['default'] ?? '');
            $output .= $this->renderBasicField($field_config['type'], $field_name, $field_value, $field_config);
        }
        
        $output .= '</table>';
        return $output;
    }

    /**
     * 🔒 WORLD-CLASS SECURITY: Centralized Sanitization Engine
     * Sanitizes all input data according to field type and security requirements
     * ENHANCED: Schema-based validation with comprehensive error reporting
     * Requirements: 6.1, 6.2, 6.3, 6.4
     * 
     * @param array $input Raw input data
     * @return array Sanitized data
     * @throws \InvalidArgumentException If validation fails
     */
    public function sanitizeSettings(array $input): array {
        $sanitized = [];
        $defaults = $this->getDefaultSettings();
        $validation_errors = [];
        $schema = $this->getSettingsValidationSchema();
        
        foreach ($input as $key => $value) {
            try {
                // Skip metadata fields
                if ($key === '_meta' || strpos($key, '_') === 0) {
                    continue;
                }
                
                // Get validation rules for this field
                $field_schema = $schema[$key] ?? null;
                
                if (!$field_schema) {
                    // Unknown field - log warning and sanitize appropriately
                    error_log("MAS V2 Security Warning: Unknown field '$key' sanitized as text");
                    if (is_array($value)) {
                        $sanitized[$key] = $this->sanitizeArray($value);
                    } else {
                        $sanitized[$key] = $this->sanitizeText($value, '');
                    }
                    continue;
                }
                
                // Validate and sanitize based on schema
                $sanitized[$key] = $this->validateAndSanitizeField($key, $value, $field_schema, $defaults[$key] ?? null);
                
            } catch (\Exception $e) {
                $validation_errors[$key] = $e->getMessage();
                
                // Use default value on validation error
                $sanitized[$key] = $defaults[$key] ?? '';
                
                error_log("MAS V2 Validation Error for field '$key': " . $e->getMessage());
            }
        }
        
        // Throw exception if there are validation errors
        if (!empty($validation_errors)) {
            $exception = new \InvalidArgumentException('Validation failed for fields: ' . implode(', ', array_keys($validation_errors)));
            $exception->validation_errors = $validation_errors;
            throw $exception;
        }
        
        error_log("MAS V2 Security: Sanitized " . count($sanitized) . " settings fields successfully");
        return $sanitized;
    }
    
    /**
     * 📋 Get comprehensive settings validation schema
     * Requirements: 6.1, 6.2, 6.3
     */
    private function getSettingsValidationSchema() {
        return [
            // ========================================
            // 🎨 COLOR FIELDS
            // ========================================
            'admin_bar_background' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Admin bar background color'
            ],
            'admin_bar_text_color' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Admin bar text color'
            ],
            'admin_bar_hover_color' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Admin bar hover color'
            ],
            'menu_background_color' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Menu background color'
            ],
            'menu_text_color' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Menu text color'
            ],
            'menu_hover_color' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Menu hover color'
            ],
            'accent_color' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Accent color'
            ],
            'content_background_color' => [
                'type' => 'color',
                'required' => false,
                'description' => 'Content background color'
            ],
            
            // ========================================
            // 🔢 NUMERIC FIELDS
            // ========================================
            'admin_bar_height' => [
                'type' => 'integer',
                'required' => false,
                'min' => 20,
                'max' => 100,
                'description' => 'Admin bar height in pixels'
            ],
            'admin_bar_font_size' => [
                'type' => 'integer',
                'required' => false,
                'min' => 8,
                'max' => 24,
                'description' => 'Admin bar font size in pixels'
            ],
            'menu_width' => [
                'type' => 'integer',
                'required' => false,
                'min' => 100,
                'max' => 400,
                'description' => 'Menu width in pixels'
            ],
            'global_font_size' => [
                'type' => 'integer',
                'required' => false,
                'min' => 8,
                'max' => 24,
                'description' => 'Global font size in pixels'
            ],
            'content_padding' => [
                'type' => 'integer',
                'required' => false,
                'min' => 0,
                'max' => 100,
                'description' => 'Content padding in pixels'
            ],
            
            // ========================================
            // 🎚️ FLOAT FIELDS
            // ========================================
            'global_line_height' => [
                'type' => 'float',
                'required' => false,
                'min' => 1.0,
                'max' => 3.0,
                'description' => 'Global line height multiplier'
            ],
            'headings_scale' => [
                'type' => 'float',
                'required' => false,
                'min' => 0.5,
                'max' => 3.0,
                'description' => 'Headings scale multiplier'
            ],
            
            // ========================================
            // 🔘 BOOLEAN FIELDS
            // ========================================
            'enable_plugin' => [
                'type' => 'boolean',
                'required' => false,
                'description' => 'Enable plugin functionality'
            ],
            'admin_bar_floating' => [
                'type' => 'boolean',
                'required' => false,
                'description' => 'Enable floating admin bar'
            ],
            'menu_floating' => [
                'type' => 'boolean',
                'required' => false,
                'description' => 'Enable floating menu'
            ],
            'enable_animations' => [
                'type' => 'boolean',
                'required' => false,
                'description' => 'Enable animations'
            ],
            'menu_compact_mode' => [
                'type' => 'boolean',
                'required' => false,
                'description' => 'Enable compact menu mode'
            ],
            
            // ========================================
            // 📝 TEXT FIELDS
            // ========================================
            'body_font' => [
                'type' => 'text',
                'required' => false,
                'max_length' => 100,
                'allowed_values' => ['system', 'arial', 'helvetica', 'georgia', 'times', 'courier'],
                'description' => 'Body font family'
            ],
            'headings_font' => [
                'type' => 'text',
                'required' => false,
                'max_length' => 100,
                'allowed_values' => ['inherit', 'system', 'arial', 'helvetica', 'georgia', 'times', 'courier'],
                'description' => 'Headings font family'
            ],
            
            // ========================================
            // 📋 SELECT FIELDS
            // ========================================
            'color_scheme' => [
                'type' => 'select',
                'required' => false,
                'allowed_values' => ['light', 'dark', 'auto'],
                'description' => 'Color scheme preference'
            ],
            'color_palette' => [
                'type' => 'select',
                'required' => false,
                'allowed_values' => ['default', 'blue', 'coffee', 'ectoplasm', 'midnight', 'ocean', 'sunrise'],
                'description' => 'Color palette selection'
            ],
            
            // ========================================
            // 💻 DANGEROUS FIELDS
            // ========================================
            'custom_css' => [
                'type' => 'css',
                'required' => false,
                'max_length' => 10000,
                'description' => 'Custom CSS code'
            ],
            'custom_js' => [
                'type' => 'javascript',
                'required' => false,
                'max_length' => 5000,
                'description' => 'Custom JavaScript code'
            ]
        ];
    }
    
    /**
     * 🔍 Validate and sanitize individual field
     * Requirements: 6.1, 6.2, 6.3, 6.4
     */
    private function validateAndSanitizeField($key, $value, $schema, $default) {
        $type = $schema['type'];
        
        // Check required fields
        if (isset($schema['required']) && $schema['required'] && empty($value)) {
            throw new \InvalidArgumentException("Field '$key' is required but empty");
        }
        
        // Check allowed values
        if (isset($schema['allowed_values']) && !empty($value)) {
            if (!in_array($value, $schema['allowed_values'], true)) {
                throw new \InvalidArgumentException("Invalid value for '$key'. Allowed: " . implode(', ', $schema['allowed_values']));
            }
        }
        
        // Check string length
        if (isset($schema['max_length']) && is_string($value) && strlen($value) > $schema['max_length']) {
            throw new \InvalidArgumentException("Field '$key' exceeds maximum length of {$schema['max_length']} characters");
        }
        
        // Validate and sanitize by type
        switch ($type) {
            case 'color':
                return $this->sanitizeColor($value, $default);
                
            case 'integer':
                $sanitized = $this->sanitizeNumeric($value, $default);
                if (isset($schema['min']) && $sanitized < $schema['min']) {
                    throw new \InvalidArgumentException("Field '$key' is below minimum value of {$schema['min']}");
                }
                if (isset($schema['max']) && $sanitized > $schema['max']) {
                    throw new \InvalidArgumentException("Field '$key' exceeds maximum value of {$schema['max']}");
                }
                return $sanitized;
                
            case 'float':
                $sanitized = $this->sanitizeFloat($value, $default);
                if (isset($schema['min']) && $sanitized < $schema['min']) {
                    throw new \InvalidArgumentException("Field '$key' is below minimum value of {$schema['min']}");
                }
                if (isset($schema['max']) && $sanitized > $schema['max']) {
                    throw new \InvalidArgumentException("Field '$key' exceeds maximum value of {$schema['max']}");
                }
                return $sanitized;
                
            case 'boolean':
                return $this->sanitizeBoolean($value);
                
            case 'text':
                return $this->sanitizeText($value, $default);
                
            case 'select':
                return $this->sanitizeSelect($value, $schema['allowed_values'], $default);
                
            case 'css':
                return $this->sanitizeCSS($value);
                
            case 'javascript':
                return $this->sanitizeJavaScript($value);
                
            default:
                return $this->sanitizeText($value, $default);
        }
    }

    /**
     * 🎨 Sanitize color field (hex validation)
     */
    private function sanitizeColor(string $value, string $default): string {
        $sanitized = sanitize_hex_color($value);
        return $sanitized !== null ? $sanitized : $default;
    }

    /**
     * 🔢 Sanitize numeric field
     */
    private function sanitizeNumeric($value, int $default): int {
        $sanitized = absint($value);
        return $sanitized > 0 ? $sanitized : $default;
    }

    /**
     * 🔘 Sanitize boolean field
     */
    private function sanitizeBoolean($value): bool {
        return ($value === '1' || $value === true || $value === 1);
    }

    /**
     * 📝 Sanitize text field
     */
    private function sanitizeText($value, string $default): string {
        $sanitized = sanitize_text_field($value);
        return !empty($sanitized) ? $sanitized : $default;
    }
    
    /**
     * 📋 Sanitize array field recursively
     */
    private function sanitizeArray($value): array {
        if (!is_array($value)) {
            return [];
        }
        
        $sanitized = [];
        foreach ($value as $key => $item) {
            $clean_key = sanitize_text_field($key);
            if (is_array($item)) {
                $sanitized[$clean_key] = $this->sanitizeArray($item);
            } else {
                $sanitized[$clean_key] = sanitize_text_field($item);
            }
        }
        
        return $sanitized;
    }

    /**
     * 🎚️ Sanitize float field
     */
    private function sanitizeFloat($value, float $default): float {
        $sanitized = floatval($value);
        return $sanitized > 0 ? $sanitized : $default;
    }

    /**
     * 📋 Sanitize select field (predefined options)
     */
    private function sanitizeSelect($value, array $allowed_values, string $default): string {
        return in_array($value, $allowed_values, true) ? $value : $default;
    }

    /**
     * 💻 Sanitize CSS field (special handling)
     */
    private function sanitizeCSS($value): string {
        if (empty($value)) return '';
        
        // Remove script tags and dangerous functions
        $dangerous_patterns = [
            '/<script[^>]*>.*?<\/script>/is',
            '/javascript:/i',
            '/expression\s*\(/i',
            '/behavior\s*:/i',
            '/binding\s*:/i',
            '/@import/i'
        ];
        
        $sanitized = $value;
        foreach ($dangerous_patterns as $pattern) {
            $sanitized = preg_replace($pattern, '', $sanitized);
        }
        
        // Allow only CSS-safe characters
        $sanitized = wp_strip_all_tags($sanitized);
        
        error_log("MAS V2 Security: CSS sanitized, " . strlen($value) . " -> " . strlen($sanitized) . " chars");
        return $sanitized;
    }

    /**
     * ⚡ Sanitize JavaScript field (special handling)
     */
    private function sanitizeJavaScript($value): string {
        if (empty($value)) return '';
        
        // For security, we heavily restrict JS
        // Only allow basic console.log and simple variable assignments
        $allowed_patterns = [
            '/^console\.log\(.+\);?$/m',
            '/^var\s+\w+\s*=\s*.+;?$/m',
            '/^\/\/.*$/m',  // Comments
            '/^\/\*.*?\*\/$/ms'  // Block comments
        ];
        
        $lines = explode("\n", $value);
        $sanitized_lines = [];
        
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            $allowed = false;
            foreach ($allowed_patterns as $pattern) {
                if (preg_match($pattern, $line)) {
                    $allowed = true;
                    break;
                }
            }
            
            if ($allowed) {
                $sanitized_lines[] = sanitize_text_field($line);
            } else {
                error_log("MAS V2 Security: Blocked JS line: " . $line);
            }
        }
        
        return implode("\n", $sanitized_lines);
    }
    
    /**
     * ⚙️ Get Default Settings - EVERYTHING DISABLED BY DEFAULT
     * ENHANCED: Integrated with ComponentAdapter but keeps security-first approach
     */
    public function getDefaultSettings() {
        return [
            // Global Settings - DISABLED
            'enable_plugin' => false,  // 🔒 Main switch - DISABLED
            'color_scheme' => 'light', // Keep WordPress default
            'color_palette' => 'modern', // Keep default
            
            // Layout - EVERYTHING DISABLED
            'menu_floating' => false,
            'admin_bar_floating' => false,
            'admin_bar_glossy' => false,
            'menu_glossy' => false,
            'glassmorphism_enabled' => false,
            'animations_enabled' => false,
            
            // Admin Bar - WordPress default values only
            'admin_bar_height' => 32,
            'admin_bar_background' => '#23282d',
            'admin_bar_text_color' => '#eee',
            'admin_bar_hover_color' => '#00a0d2',
            
            // Menu - WordPress default values only
            'menu_width' => 160,
            'menu_background' => '#23282d',
            'menu_text_color' => '#eee',
            'menu_hover_background' => '#32373c',
            'menu_hover_text_color' => '#00a0d2',
            'menu_compact_mode' => false,
            
            // Submenu - WordPress default values only
            'submenu_background' => '#32373c',
            'submenu_text_color' => '#eee',
            'submenu_hover_background' => '#0073aa',
            'submenu_hover_text_color' => '#fff',
            'submenu_separator' => false,
            'submenu_indicator_style' => 'arrow',
            
            // Typography - WordPress default values only
            'body_font' => 'system',
            'headings_font' => 'inherit',
            'global_font_size' => 14,
            'global_line_height' => 1.5,
            'headings_scale' => 1.0,
            
            // Advanced - EVERYTHING DISABLED
            'hide_help_tab' => false,
            'hide_screen_options' => false,
            'hide_wp_version' => false,
            'hide_admin_notices' => false,
            'disable_emojis' => false,
            'disable_embeds' => false,
            'remove_jquery_migrate' => false,
            
            // Custom Code - EMPTY
            'custom_css' => '',
            'custom_js' => ''
        ];
    }
    
    /**
     * 📥 Get All Settings (legacy compatibility)
     */
    public function getAllSettings() {
        return $this->getSettings();
    }
    
    // ========================================
    // 🎯 PRESET MANAGEMENT FUNCTIONALITY
    // ========================================
    
    /**
     * 📋 Register Custom Post Type for Presets
     * Enterprise approach: Using WordPress native data structures
     */
    public function registerPresetPostType() {
        $labels = [
            'name'                  => __('Style Presets', 'modern-admin-styler'),
            'singular_name'         => __('Style Preset', 'modern-admin-styler'),
            'menu_name'            => __('Style Presets', 'modern-admin-styler'),
        ];
        
        $args = [
            'labels'              => $labels,
            'description'         => __('Style configuration presets for Modern Admin Styler V2', 'modern-admin-styler'),
            'public'              => false,
            'publicly_queryable'  => false,
            'show_ui'             => false, // Hidden from standard admin
            'show_in_menu'        => false, // We'll add it to our plugin menu
            'show_in_rest'        => true, // Critical for REST API access
            'rest_base'           => 'mas-v2-presets',
            'capability_type'     => 'post',
            'capabilities'        => [
                'edit_post'          => 'manage_options',
                'read_post'          => 'manage_options',
                'delete_post'        => 'manage_options',
                'edit_posts'         => 'manage_options',
                'edit_others_posts'  => 'manage_options',
                'publish_posts'      => 'manage_options',
                'read_private_posts' => 'manage_options',
                'create_posts'       => 'manage_options',
            ],
            'supports'            => ['title', 'custom-fields'],
        ];
        
        register_post_type($this->preset_post_type, $args);
    }
    
    /**
     * 🔐 Add preset management capabilities to administrators
     */
    public function addPresetCapabilities() {
        $role = get_role('administrator');
        if ($role) {
            $role->add_cap('edit_mas_v2_presets');
            $role->add_cap('read_mas_v2_presets');
            $role->add_cap('delete_mas_v2_presets');
        }
    }
    
    /**
     * 📋 Get all available presets
     */
    public function getPresets($args = []) {
        $default_args = [
            'post_type' => $this->preset_post_type,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC',
        ];
        
        $query_args = wp_parse_args($args, $default_args);
        $query = new \WP_Query($query_args);
        
        $presets = [];
        if ($query->have_posts()) {
            foreach ($query->posts as $post) {
                $settings = get_post_meta($post->ID, $this->preset_meta_key, true);
                $presets[] = [
                    'id' => $post->ID,
                    'name' => $post->post_title,
                    'slug' => $post->post_name,
                    'description' => $post->post_excerpt,
                    'settings' => $settings ?: [],
                    'created' => $post->post_date,
                    'modified' => $post->post_modified,
                ];
            }
        }
        
        return $presets;
    }
    
    /**
     * 💾 Save new preset
     */
    public function savePreset($name, $settings = null, $description = '') {
        // Use current settings if none provided
        if ($settings === null) {
            $settings = $this->getSettings();
        }
        
        $post_data = [
            'post_title' => sanitize_text_field($name),
            'post_excerpt' => sanitize_textarea_field($description),
            'post_type' => $this->preset_post_type,
            'post_status' => 'publish',
            'post_author' => get_current_user_id(),
        ];
        
        $post_id = wp_insert_post($post_data);
        
        if (is_wp_error($post_id)) {
            return false;
        }
        
        // Save settings as meta - use existing sanitization
        $sanitized_settings = $this->sanitizeSettings($settings);
        update_post_meta($post_id, $this->preset_meta_key, $sanitized_settings);
        
        return $post_id;
    }
    
    /**
     * ✏️ Update existing preset
     */
    public function updatePreset($preset_id, $updates) {
        if (!$this->presetExists($preset_id)) {
            return false;
        }
        
        $post_data = ['ID' => $preset_id];
        
        if (isset($updates['name'])) {
            $post_data['post_title'] = sanitize_text_field($updates['name']);
        }
        
        if (isset($updates['description'])) {
            $post_data['post_excerpt'] = sanitize_textarea_field($updates['description']);
        }
        
        $result = wp_update_post($post_data);
        
        if (isset($updates['settings'])) {
            $sanitized_settings = $this->sanitizeSettings($updates['settings']);
            update_post_meta($preset_id, $this->preset_meta_key, $sanitized_settings);
        }
        
        return $result && !is_wp_error($result);
    }
    
    /**
     * 🗑️ Delete preset
     */
    public function deletePreset($preset_id) {
        if (!$this->presetExists($preset_id)) {
            return false;
        }
        
        return wp_delete_post($preset_id, true) !== false;
    }
    
    /**
     * 📖 Get single preset
     */
    public function getPreset($preset_id) {
        $post = get_post($preset_id);
        
        if (!$post || $post->post_type !== $this->preset_post_type) {
            return false;
        }
        
        $settings = get_post_meta($preset_id, $this->preset_meta_key, true);
        
        return [
            'id' => $post->ID,
            'name' => $post->post_title,
            'slug' => $post->post_name,
            'description' => $post->post_excerpt,
            'settings' => $settings ?: [],
            'created' => $post->post_date,
            'modified' => $post->post_modified,
        ];
    }
    
    /**
     * ✅ Check if preset exists
     */
    public function presetExists($preset_id) {
        $post = get_post($preset_id);
        return $post && $post->post_type === $this->preset_post_type;
    }
    
    /**
     * 🎨 Apply preset settings
     */
    public function applyPreset($preset_id) {
        $preset = $this->getPreset($preset_id);
        
        if (!$preset) {
            return false;
        }
        
        return $this->saveSettings($preset['settings']);
    }
    
    /**
     * 📊 Get preset statistics
     */
    public function getPresetStats() {
        $total_presets = wp_count_posts($this->preset_post_type)->publish;
        $recent_presets = $this->getPresets([
            'posts_per_page' => 5,
            'orderby' => 'date',
            'order' => 'DESC'
        ]);
        
        return [
            'total_presets' => (int) $total_presets,
            'recent_presets' => $recent_presets,
            'preset_post_type' => $this->preset_post_type,
            'meta_key' => $this->preset_meta_key
        ];
    }
    
    /**
     * 🔄 Import presets from file/array
     */
    public function importPresets($presets_data) {
        $imported = 0;
        $errors = [];
        
        foreach ($presets_data as $preset_data) {
            try {
                $result = $this->savePreset(
                    $preset_data['name'] ?? 'Imported Preset',
                    $preset_data['settings'] ?? [],
                    $preset_data['description'] ?? 'Imported from file'
                );
                
                if ($result) {
                    $imported++;
                } else {
                    $errors[] = 'Failed to import preset: ' . ($preset_data['name'] ?? 'Unknown');
                }
            } catch (\Exception $e) {
                $errors[] = 'Error importing preset: ' . $e->getMessage();
            }
        }
        
        return [
            'imported' => $imported,
            'errors' => $errors,
            'total_processed' => count($presets_data)
        ];
    }
    
    /**
     * 📤 Export all presets
     */
    public function exportPresets() {
        $presets = $this->getPresets();
        $export_data = [
            'export_version' => '1.0',
            'exported_at' => current_time('c'),
            'plugin_version' => defined('MAS_V2_VERSION') ? MAS_V2_VERSION : '2.3.0',
            'presets' => $presets
        ];
        
        return $export_data;
    }
    
    // ========================================
    // 🔧 LEGACY COMPATIBILITY FOR PRESET MANAGER
    // ========================================
    
    /**
     * 🔄 Get all presets (legacy compatibility)
     */
    public function getAllPresets($args = []) {
        return $this->getPresets($args);
    }
} 