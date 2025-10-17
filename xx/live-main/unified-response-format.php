<?php
/**
 * Unified Response Format Validation and Examples
 * 
 * This file demonstrates and validates the unified response format
 * used across all AJAX endpoints in the WOOW Admin Styler plugin.
 * 
 * @package WOOW Admin Styler
 * @version 2.4.0 - Security Overhaul
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Unified Response Format Examples and Validation
 */
class UnifiedResponseFormatValidator {
    
    /**
     * Standard success response format
     */
    public static function getSuccessResponseExample() {
        return [
            'success' => true,
            'message' => 'Settings saved successfully!',
            'code' => 'settings_saved',
            'data' => [
                'settings' => [
                    'admin_bar_bg_color' => '#ff0000',
                    'admin_bar_text_color' => '#ffffff'
                ],
                'updated_options' => ['admin_bar_bg_color', 'admin_bar_text_color']
            ],
            'meta' => [
                'timestamp' => '2024-08-04 10:30:45',
                'timestamp_gmt' => '2024-08-04 08:30:45',
                'version' => '2.4.0',
                'execution_time_ms' => 125.67,
                'memory_usage' => 2097152,
                'memory_peak' => 3145728,
                'request_id' => 'mas_abc123_def456'
            ]
        ];
    }
    
    /**
     * Standard error response format
     */
    public static function getErrorResponseExample() {
        return [
            'success' => false,
            'message' => 'Security verification failed',
            'code' => 'security_error',
            'data' => [
                'violation_type' => 'invalid_nonce',
                'security_level' => 'high'
            ],
            'meta' => [
                'timestamp' => '2024-08-04 10:30:45',
                'timestamp_gmt' => '2024-08-04 08:30:45',
                'version' => '2.4.0',
                'execution_time_ms' => 45.23,
                'memory_usage' => 1048576,
                'memory_peak' => 1572864,
                'request_id' => 'mas_xyz789_abc123'
            ]
        ];
    }
    
    /**
     * Validation error response format
     */
    public static function getValidationErrorExample() {
        return [
            'success' => false,
            'message' => 'Invalid input data provided',
            'code' => 'validation_error',
            'data' => [
                'validation_errors' => [
                    'admin_bar_bg_color' => 'Invalid color format',
                    'menu_width' => 'Value must be between 200 and 400'
                ],
                'field_count' => 2
            ],
            'meta' => [
                'timestamp' => '2024-08-04 10:30:45',
                'timestamp_gmt' => '2024-08-04 08:30:45',
                'version' => '2.4.0',
                'execution_time_ms' => 78.91,
                'memory_usage' => 1572864,
                'memory_peak' => 2097152,
                'request_id' => 'mas_val456_err789'
            ]
        ];
    }
    
    /**
     * Rate limit error response format
     */
    public static function getRateLimitErrorExample() {
        return [
            'success' => false,
            'message' => 'Rate limit exceeded. Please wait before making more requests.',
            'code' => 'rate_limit_exceeded',
            'data' => [
                'rate_limit' => 10,
                'window_seconds' => 60,
                'retry_after' => 60
            ],
            'meta' => [
                'timestamp' => '2024-08-04 10:30:45',
                'timestamp_gmt' => '2024-08-04 08:30:45',
                'version' => '2.4.0',
                'execution_time_ms' => 12.34,
                'memory_usage' => 1048576,
                'memory_peak' => 1048576,
                'request_id' => 'mas_rate123_limit456'
            ]
        ];
    }
    
    /**
     * Database error response format
     */
    public static function getDatabaseErrorExample() {
        return [
            'success' => false,
            'message' => 'Failed to save settings to database.',
            'code' => 'database_error',
            'data' => [
                'database_operation' => 'save_settings',
                'error_type' => 'database'
            ],
            'meta' => [
                'timestamp' => '2024-08-04 10:30:45',
                'timestamp_gmt' => '2024-08-04 08:30:45',
                'version' => '2.4.0',
                'execution_time_ms' => 234.56,
                'memory_usage' => 2621440,
                'memory_peak' => 3145728,
                'request_id' => 'mas_db789_error123'
            ]
        ];
    }
    
    /**
     * Performance error response format
     */
    public static function getPerformanceErrorExample() {
        return [
            'success' => false,
            'message' => 'Request took too long to process',
            'code' => 'performance_error',
            'data' => [
                'execution_time_ms' => 750.25,
                'threshold_ms' => 500,
                'performance_impact' => 'high'
            ],
            'meta' => [
                'timestamp' => '2024-08-04 10:30:45',
                'timestamp_gmt' => '2024-08-04 08:30:45',
                'version' => '2.4.0',
                'execution_time_ms' => 750.25,
                'memory_usage' => 4194304,
                'memory_peak' => 5242880,
                'request_id' => 'mas_perf456_slow789'
            ]
        ];
    }
    
    /**
     * Validate response format
     * 
     * @param array $response Response to validate
     * @return array Validation result
     */
    public static function validateResponseFormat($response) {
        $errors = [];
        $warnings = [];
        
        // Check required fields
        $required_fields = ['success', 'message', 'code', 'data', 'meta'];
        foreach ($required_fields as $field) {
            if (!isset($response[$field])) {
                $errors[] = "Missing required field: {$field}";
            }
        }
        
        // Validate success field
        if (isset($response['success']) && !is_bool($response['success'])) {
            $errors[] = "Field 'success' must be boolean";
        }
        
        // Validate message field
        if (isset($response['message']) && !is_string($response['message'])) {
            $errors[] = "Field 'message' must be string";
        }
        
        // Validate code field
        if (isset($response['code']) && !is_string($response['code'])) {
            $errors[] = "Field 'code' must be string";
        }
        
        // Validate data field
        if (isset($response['data']) && !is_array($response['data'])) {
            $errors[] = "Field 'data' must be array";
        }
        
        // Validate meta field
        if (isset($response['meta'])) {
            if (!is_array($response['meta'])) {
                $errors[] = "Field 'meta' must be array";
            } else {
                // Check required meta fields
                $required_meta_fields = ['timestamp', 'version', 'execution_time_ms', 'request_id'];
                foreach ($required_meta_fields as $meta_field) {
                    if (!isset($response['meta'][$meta_field])) {
                        $warnings[] = "Missing recommended meta field: {$meta_field}";
                    }
                }
                
                // Validate execution time
                if (isset($response['meta']['execution_time_ms'])) {
                    $exec_time = $response['meta']['execution_time_ms'];
                    if (!is_numeric($exec_time)) {
                        $errors[] = "Meta field 'execution_time_ms' must be numeric";
                    } elseif ($exec_time > 500) {
                        $warnings[] = "Execution time ({$exec_time}ms) exceeds recommended threshold (500ms)";
                    }
                }
                
                // Validate memory usage
                if (isset($response['meta']['memory_usage'])) {
                    if (!is_numeric($response['meta']['memory_usage'])) {
                        $errors[] = "Meta field 'memory_usage' must be numeric";
                    }
                }
            }
        }
        
        // Check for deprecated fields
        $deprecated_fields = ['status', 'error', 'result'];
        foreach ($deprecated_fields as $deprecated_field) {
            if (isset($response[$deprecated_field])) {
                $warnings[] = "Deprecated field found: {$deprecated_field}";
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'score' => $this->calculateValidationScore($errors, $warnings)
        ];
    }
    
    /**
     * Calculate validation score
     * 
     * @param array $errors Validation errors
     * @param array $warnings Validation warnings
     * @return int Score from 0-100
     */
    private static function calculateValidationScore($errors, $warnings) {
        $score = 100;
        
        // Deduct points for errors (major issues)
        $score -= count($errors) * 20;
        
        // Deduct points for warnings (minor issues)
        $score -= count($warnings) * 5;
        
        return max(0, $score);
    }
    
    /**
     * Get all standard response codes
     * 
     * @return array Response codes with descriptions
     */
    public static function getStandardResponseCodes() {
        return [
            // Success codes
            'success' => 'General success',
            'settings_saved' => 'Settings saved successfully',
            'settings_loaded' => 'Settings loaded successfully',
            'settings_reset' => 'Settings reset to defaults',
            'settings_exported' => 'Settings exported successfully',
            'settings_imported' => 'Settings imported successfully',
            'cache_cleared' => 'Cache cleared successfully',
            'database_check' => 'Database check completed',
            
            // Error codes
            'error' => 'General error',
            'validation_error' => 'Input validation failed',
            'security_error' => 'Security validation failed',
            'rate_limit_exceeded' => 'Rate limit exceeded',
            'database_error' => 'Database operation failed',
            'performance_error' => 'Request took too long',
            'network_error' => 'Network connectivity issue',
            'permission_error' => 'Insufficient permissions',
            
            // Specific error codes
            'invalid_nonce' => 'Invalid security token',
            'insufficient_capability' => 'User lacks required permissions',
            'invalid_input' => 'Invalid input data',
            'missing_parameter' => 'Required parameter missing',
            'file_not_found' => 'Requested file not found',
            'service_unavailable' => 'Service temporarily unavailable'
        ];
    }
    
    /**
     * Test all response formats
     * 
     * @return array Test results
     */
    public static function testAllResponseFormats() {
        $test_responses = [
            'success' => self::getSuccessResponseExample(),
            'error' => self::getErrorResponseExample(),
            'validation_error' => self::getValidationErrorExample(),
            'rate_limit_error' => self::getRateLimitErrorExample(),
            'database_error' => self::getDatabaseErrorExample(),
            'performance_error' => self::getPerformanceErrorExample()
        ];
        
        $results = [];
        
        foreach ($test_responses as $type => $response) {
            $validation = self::validateResponseFormat($response);
            $results[$type] = [
                'response' => $response,
                'validation' => $validation
            ];
        }
        
        return $results;
    }
    
    /**
     * Generate response format documentation
     * 
     * @return string Documentation in markdown format
     */
    public static function generateDocumentation() {
        $doc = "# AJAX Response Format Documentation\n\n";
        $doc .= "## Standard Response Structure\n\n";
        $doc .= "All AJAX endpoints return responses in the following standardized format:\n\n";
        $doc .= "```json\n";
        $doc .= json_encode(self::getSuccessResponseExample(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $doc .= "\n```\n\n";
        
        $doc .= "## Response Fields\n\n";
        $doc .= "| Field | Type | Required | Description |\n";
        $doc .= "|-------|------|----------|-------------|\n";
        $doc .= "| success | boolean | Yes | Indicates if the request was successful |\n";
        $doc .= "| message | string | Yes | Human-readable message |\n";
        $doc .= "| code | string | Yes | Machine-readable response code |\n";
        $doc .= "| data | object | Yes | Response data (empty object for errors) |\n";
        $doc .= "| meta | object | Yes | Response metadata |\n\n";
        
        $doc .= "## Meta Fields\n\n";
        $doc .= "| Field | Type | Description |\n";
        $doc .= "|-------|------|-------------|\n";
        $doc .= "| timestamp | string | Server timestamp (local time) |\n";
        $doc .= "| timestamp_gmt | string | Server timestamp (GMT) |\n";
        $doc .= "| version | string | Plugin version |\n";
        $doc .= "| execution_time_ms | float | Request execution time in milliseconds |\n";
        $doc .= "| memory_usage | integer | Memory usage in bytes |\n";
        $doc .= "| memory_peak | integer | Peak memory usage in bytes |\n";
        $doc .= "| request_id | string | Unique request identifier |\n\n";
        
        $doc .= "## Standard Response Codes\n\n";
        $codes = self::getStandardResponseCodes();
        foreach ($codes as $code => $description) {
            $doc .= "- `{$code}`: {$description}\n";
        }
        
        $doc .= "\n## Error Response Examples\n\n";
        
        $error_examples = [
            'Security Error' => self::getErrorResponseExample(),
            'Validation Error' => self::getValidationErrorExample(),
            'Rate Limit Error' => self::getRateLimitErrorExample(),
            'Database Error' => self::getDatabaseErrorExample(),
            'Performance Error' => self::getPerformanceErrorExample()
        ];
        
        foreach ($error_examples as $title => $example) {
            $doc .= "### {$title}\n\n";
            $doc .= "```json\n";
            $doc .= json_encode($example, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
            $doc .= "\n```\n\n";
        }
        
        return $doc;
    }
}

// Auto-test when accessed directly
if (defined('WP_CLI') && WP_CLI) {
    // WP-CLI command to test response formats
    WP_CLI::add_command('mas test-responses', function() {
        $results = UnifiedResponseFormatValidator::testAllResponseFormats();
        
        WP_CLI::line('Testing AJAX Response Formats...');
        WP_CLI::line('');
        
        foreach ($results as $type => $result) {
            $validation = $result['validation'];
            $status = $validation['valid'] ? 'PASS' : 'FAIL';
            $score = $validation['score'];
            
            WP_CLI::line("$type: $status (Score: $score/100)");
            
            if (!empty($validation['errors'])) {
                foreach ($validation['errors'] as $error) {
                    WP_CLI::warning("  Error: $error");
                }
            }
            
            if (!empty($validation['warnings'])) {
                foreach ($validation['warnings'] as $warning) {
                    WP_CLI::line("  Warning: $warning");
                }
            }
            
            WP_CLI::line('');
        }
    });
}

// Export for JavaScript testing
if (isset($_GET['test_responses']) && current_user_can('manage_options')) {
    header('Content-Type: application/json');
    echo json_encode(UnifiedResponseFormatValidator::testAllResponseFormats(), JSON_PRETTY_PRINT);
    exit;
}

// Export documentation
if (isset($_GET['response_docs']) && current_user_can('manage_options')) {
    header('Content-Type: text/plain');
    echo UnifiedResponseFormatValidator::generateDocumentation();
    exit;
}