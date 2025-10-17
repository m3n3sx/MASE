<?php
/**
 * API Authentication Manager
 * 
 * Handles API key generation, validation, and management for external integrations.
 * Provides secure authentication mechanisms with proper key rotation and access control.
 * 
 * Requirements: 4.1, 4.2
 * 
 * @package ModernAdminStyler
 * @version 2.4.0
 */

namespace ModernAdminStyler\Services;

class ApiAuthenticationManager {
    
    const API_KEYS_OPTION = 'mas_api_keys';
    const KEY_LENGTH = 64;
    const MAX_KEYS_PER_USER = 10;
    
    private $encryption_key;
    
    public function __construct() {
        $this->encryption_key = $this->getEncryptionKey();
    }
    
    /**
     * Create new API key
     * Requirements: 4.2
     * 
     * @param array $params API key parameters
     * @return \WP_REST_Response|WP_Error
     */
    public function createApiKey($params) {
        try {
            $user_id = get_current_user_id();
            $name = sanitize_text_field($params['name'] ?? '');
            $permissions = $this->validatePermissions($params['permissions'] ?? []);
            $expires_at = $this->validateExpirationDate($params['expires_at'] ?? null);
            
            // Validate required fields
            if (empty($name)) {
                return new \WP_Error('invalid_name', 'API key name is required', ['status' => 400]);
            }
            
            // Check user's key limit
            $existing_keys = $this->getUserApiKeys($user_id);
            if (count($existing_keys) >= self::MAX_KEYS_PER_USER) {
                return new \WP_Error('key_limit_exceeded', 
                    'Maximum API keys limit reached', ['status' => 429]);
            }
            
            // Generate secure API key
            $api_key = $this->generateSecureKey();
            $key_id = wp_generate_uuid4();
            
            // Create key record
            $key_data = [
                'id' => $key_id,
                'user_id' => $user_id,
                'name' => $name,
                'key_hash' => $this->hashKey($api_key),
                'permissions' => $permissions,
                'created_at' => current_time('mysql'),
                'expires_at' => $expires_at,
                'last_used_at' => null,
                'usage_count' => 0,
                'is_active' => true,
                'allowed_origins' => $params['allowed_origins'] ?? [],
                'rate_limit' => intval($params['rate_limit'] ?? 1000), // requests per hour
                'metadata' => $params['metadata'] ?? []
            ];
            
            // Store key
            $this->storeApiKey($key_data);
            
            // Log key creation
            $this->logApiKeyActivity($key_id, 'created', [
                'user_id' => $user_id,
                'name' => $name
            ]);
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'id' => $key_id,
                    'name' => $name,
                    'api_key' => $api_key, // Only returned once
                    'permissions' => $permissions,
                    'expires_at' => $expires_at,
                    'rate_limit' => $key_data['rate_limit'],
                    'created_at' => $key_data['created_at']
                ]
            ], 201);
            
        } catch (\Exception $e) {
            return new \WP_Error('key_creation_failed', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * Validate API key
     * Requirements: 4.1, 4.2
     * 
     * @param string $api_key The API key to validate
     * @return array|WP_Error Validation result
     */
    public function validateApiKey($api_key) {
        try {
            if (empty($api_key)) {
                return new \WP_Error('missing_api_key', 'API key is required', ['status' => 401]);
            }
            
            // Find key by hash
            $key_data = $this->findKeyByHash($this->hashKey($api_key));
            
            if (!$key_data) {
                $this->logApiKeyActivity(null, 'invalid_key_attempt', [
                    'key_prefix' => substr($api_key, 0, 8) . '...',
                    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
                ]);
                
                return new \WP_Error('invalid_api_key', 'Invalid API key', ['status' => 401]);
            }
            
            // Check if key is active
            if (!$key_data['is_active']) {
                return new \WP_Error('inactive_api_key', 'API key is inactive', ['status' => 401]);
            }
            
            // Check expiration
            if ($key_data['expires_at'] && strtotime($key_data['expires_at']) < time()) {
                return new \WP_Error('expired_api_key', 'API key has expired', ['status' => 401]);
            }
            
            // Check rate limiting
            $rate_limit_check = $this->checkApiKeyRateLimit($key_data);
            if (is_wp_error($rate_limit_check)) {
                return $rate_limit_check;
            }
            
            // Check origin restrictions
            $origin_check = $this->checkOriginRestrictions($key_data);
            if (is_wp_error($origin_check)) {
                return $origin_check;
            }
            
            // Update usage statistics
            $this->updateKeyUsage($key_data['id']);
            
            // Log successful authentication
            $this->logApiKeyActivity($key_data['id'], 'authenticated', [
                'user_id' => $key_data['user_id'],
                'endpoint' => $_SERVER['REQUEST_URI'] ?? 'unknown'
            ]);
            
            return [
                'user_id' => $key_data['user_id'],
                'key_id' => $key_data['id'],
                'permissions' => $key_data['permissions'],
                'rate_limit' => $key_data['rate_limit']
            ];
            
        } catch (\Exception $e) {
            return new \WP_Error('validation_error', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * Get user's API keys
     * Requirements: 4.2
     * 
     * @param int $user_id User ID (optional, defaults to current user)
     * @return \WP_REST_Response
     */
    public function getApiKeys($user_id = null) {
        $user_id = $user_id ?: get_current_user_id();
        
        if (!current_user_can('manage_options') && $user_id !== get_current_user_id()) {
            return new \WP_Error('insufficient_permissions', 
                'Cannot access other users API keys', ['status' => 403]);
        }
        
        $keys = $this->getUserApiKeys($user_id);
        
        // Remove sensitive data
        $safe_keys = array_map(function($key) {
            unset($key['key_hash']);
            $key['key_preview'] = substr($key['id'], 0, 8) . '...';
            return $key;
        }, $keys);
        
        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'keys' => $safe_keys,
                'total' => count($safe_keys),
                'limit' => self::MAX_KEYS_PER_USER
            ]
        ], 200);
    }
    
    /**
     * Delete API key
     * Requirements: 4.2
     * 
     * @param string $key_id Key ID to delete
     * @return \WP_REST_Response|WP_Error
     */
    public function deleteApiKey($key_id) {
        try {
            $key_data = $this->getApiKeyById($key_id);
            
            if (!$key_data) {
                return new \WP_Error('key_not_found', 'API key not found', ['status' => 404]);
            }
            
            // Check permissions
            if (!current_user_can('manage_options') && 
                $key_data['user_id'] !== get_current_user_id()) {
                return new \WP_Error('insufficient_permissions', 
                    'Cannot delete other users API keys', ['status' => 403]);
            }
            
            // Remove key
            $this->removeApiKey($key_id);
            
            // Log deletion
            $this->logApiKeyActivity($key_id, 'deleted', [
                'user_id' => $key_data['user_id'],
                'name' => $key_data['name']
            ]);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => 'API key deleted successfully'
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_Error('deletion_failed', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * Rotate API key
     * Requirements: 4.2
     * 
     * @param string $key_id Key ID to rotate
     * @return \WP_REST_Response|WP_Error
     */
    public function rotateApiKey($key_id) {
        try {
            $key_data = $this->getApiKeyById($key_id);
            
            if (!$key_data) {
                return new \WP_Error('key_not_found', 'API key not found', ['status' => 404]);
            }
            
            // Check permissions
            if (!current_user_can('manage_options') && 
                $key_data['user_id'] !== get_current_user_id()) {
                return new \WP_Error('insufficient_permissions', 
                    'Cannot rotate other users API keys', ['status' => 403]);
            }
            
            // Generate new key
            $new_api_key = $this->generateSecureKey();
            $new_key_hash = $this->hashKey($new_api_key);
            
            // Update key data
            $key_data['key_hash'] = $new_key_hash;
            $key_data['rotated_at'] = current_time('mysql');
            $key_data['usage_count'] = 0; // Reset usage count
            
            $this->updateApiKey($key_id, $key_data);
            
            // Log rotation
            $this->logApiKeyActivity($key_id, 'rotated', [
                'user_id' => $key_data['user_id']
            ]);
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'id' => $key_id,
                    'api_key' => $new_api_key, // Only returned once
                    'rotated_at' => $key_data['rotated_at']
                ]
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_Error('rotation_failed', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * Get API key statistics
     * Requirements: 4.2
     * 
     * @return array Statistics data
     */
    public function getApiKeyStatistics() {
        $all_keys = $this->getAllApiKeys();
        
        $stats = [
            'total_keys' => count($all_keys),
            'active_keys' => count(array_filter($all_keys, function($k) { return $k['is_active']; })),
            'expired_keys' => 0,
            'usage_stats' => [
                'total_requests' => 0,
                'requests_last_24h' => 0,
                'most_used_key' => null
            ],
            'user_distribution' => []
        ];
        
        $now = time();
        $yesterday = $now - DAY_IN_SECONDS;
        
        foreach ($all_keys as $key) {
            // Count expired keys
            if ($key['expires_at'] && strtotime($key['expires_at']) < $now) {
                $stats['expired_keys']++;
            }
            
            // Usage statistics
            $stats['usage_stats']['total_requests'] += $key['usage_count'];
            
            // User distribution
            $user_id = $key['user_id'];
            $stats['user_distribution'][$user_id] = ($stats['user_distribution'][$user_id] ?? 0) + 1;
        }
        
        return $stats;
    }
    
    // Private Helper Methods
    
    /**
     * Generate secure API key
     * Requirements: 4.2
     */
    private function generateSecureKey() {
        $prefix = 'mas_';
        $random_bytes = random_bytes(self::KEY_LENGTH / 2);
        $key = $prefix . bin2hex($random_bytes);
        
        return $key;
    }
    
    /**
     * Hash API key for storage
     * Requirements: 4.2
     */
    private function hashKey($key) {
        return hash_hmac('sha256', $key, $this->encryption_key);
    }
    
    /**
     * Get or create encryption key
     * Requirements: 4.2
     */
    private function getEncryptionKey() {
        $key = get_option('mas_api_encryption_key');
        
        if (!$key) {
            $key = bin2hex(random_bytes(32));
            update_option('mas_api_encryption_key', $key);
        }
        
        return $key;
    }
    
    /**
     * Store API key in database
     * Requirements: 4.2
     */
    private function storeApiKey($key_data) {
        $keys = get_option(self::API_KEYS_OPTION, []);
        $keys[$key_data['id']] = $key_data;
        update_option(self::API_KEYS_OPTION, $keys);
    }
    
    /**
     * Find API key by hash
     * Requirements: 4.2
     */
    private function findKeyByHash($hash) {
        $keys = get_option(self::API_KEYS_OPTION, []);
        
        foreach ($keys as $key_data) {
            if (hash_equals($key_data['key_hash'], $hash)) {
                return $key_data;
            }
        }
        
        return null;
    }
    
    /**
     * Get API key by ID
     * Requirements: 4.2
     */
    private function getApiKeyById($key_id) {
        $keys = get_option(self::API_KEYS_OPTION, []);
        return $keys[$key_id] ?? null;
    }
    
    /**
     * Get user's API keys
     * Requirements: 4.2
     */
    private function getUserApiKeys($user_id) {
        $keys = get_option(self::API_KEYS_OPTION, []);
        
        return array_filter($keys, function($key) use ($user_id) {
            return $key['user_id'] == $user_id;
        });
    }
    
    /**
     * Get all API keys
     * Requirements: 4.2
     */
    private function getAllApiKeys() {
        return get_option(self::API_KEYS_OPTION, []);
    }
    
    /**
     * Update API key
     * Requirements: 4.2
     */
    private function updateApiKey($key_id, $key_data) {
        $keys = get_option(self::API_KEYS_OPTION, []);
        $keys[$key_id] = $key_data;
        update_option(self::API_KEYS_OPTION, $keys);
    }
    
    /**
     * Remove API key
     * Requirements: 4.2
     */
    private function removeApiKey($key_id) {
        $keys = get_option(self::API_KEYS_OPTION, []);
        unset($keys[$key_id]);
        update_option(self::API_KEYS_OPTION, $keys);
    }
    
    /**
     * Update key usage statistics
     * Requirements: 4.2
     */
    private function updateKeyUsage($key_id) {
        $keys = get_option(self::API_KEYS_OPTION, []);
        
        if (isset($keys[$key_id])) {
            $keys[$key_id]['usage_count']++;
            $keys[$key_id]['last_used_at'] = current_time('mysql');
            update_option(self::API_KEYS_OPTION, $keys);
        }
    }
    
    /**
     * Check API key rate limiting
     * Requirements: 4.2
     */
    private function checkApiKeyRateLimit($key_data) {
        $rate_limit = $key_data['rate_limit'];
        $key_id = $key_data['id'];
        
        $rate_key = "mas_api_rate_key_{$key_id}";
        $current_count = get_transient($rate_key) ?: 0;
        
        if ($current_count >= $rate_limit) {
            return new \WP_Error('rate_limit_exceeded', 
                "API key rate limit exceeded. Limit: {$rate_limit} requests per hour.", 
                ['status' => 429]);
        }
        
        set_transient($rate_key, $current_count + 1, HOUR_IN_SECONDS);
        return true;
    }
    
    /**
     * Check origin restrictions
     * Requirements: 4.2
     */
    private function checkOriginRestrictions($key_data) {
        $allowed_origins = $key_data['allowed_origins'] ?? [];
        
        if (empty($allowed_origins)) {
            return true; // No restrictions
        }
        
        $origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
        
        if (empty($origin)) {
            return new \WP_Error('missing_origin', 'Origin header required', ['status' => 400]);
        }
        
        $origin_host = parse_url($origin, PHP_URL_HOST);
        
        foreach ($allowed_origins as $allowed) {
            if (fnmatch($allowed, $origin_host)) {
                return true;
            }
        }
        
        return new \WP_Error('origin_not_allowed', 
            'Origin not allowed for this API key', ['status' => 403]);
    }
    
    /**
     * Validate permissions array
     * Requirements: 4.2
     */
    private function validatePermissions($permissions) {
        $valid_permissions = [
            'read_settings',
            'write_settings',
            'read_schemas',
            'write_schemas',
            'export_data',
            'import_data',
            'manage_webhooks',
            'batch_operations'
        ];
        
        if (!is_array($permissions)) {
            return ['read_settings']; // Default permission
        }
        
        return array_intersect($permissions, $valid_permissions);
    }
    
    /**
     * Validate expiration date
     * Requirements: 4.2
     */
    private function validateExpirationDate($expires_at) {
        if (empty($expires_at)) {
            return null; // No expiration
        }
        
        $timestamp = strtotime($expires_at);
        
        if ($timestamp === false || $timestamp <= time()) {
            throw new \Exception('Invalid expiration date');
        }
        
        // Maximum 1 year expiration
        $max_expiration = time() + YEAR_IN_SECONDS;
        if ($timestamp > $max_expiration) {
            $timestamp = $max_expiration;
        }
        
        return date('Y-m-d H:i:s', $timestamp);
    }
    
    /**
     * Log API key activity
     * Requirements: 4.2
     */
    private function logApiKeyActivity($key_id, $action, $context = []) {
        $log_entry = [
            'key_id' => $key_id,
            'action' => $action,
            'context' => $context,
            'timestamp' => current_time('mysql'),
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        
        // Store in transient for recent activity (last 24 hours)
        $activity_key = 'mas_api_activity_' . date('Y-m-d');
        $activity = get_transient($activity_key) ?: [];
        $activity[] = $log_entry;
        
        // Keep only last 1000 entries per day
        if (count($activity) > 1000) {
            $activity = array_slice($activity, -1000);
        }
        
        set_transient($activity_key, $activity, DAY_IN_SECONDS);
        
        // Also log to WordPress error log for critical actions
        if (in_array($action, ['created', 'deleted', 'rotated', 'invalid_key_attempt'])) {
            error_log(sprintf(
                'MAS API Key Activity [%s]: %s | Key: %s | User: %s | IP: %s',
                strtoupper($action),
                $action,
                $key_id ?: 'unknown',
                $context['user_id'] ?? 'unknown',
                $log_entry['ip_address']
            ));
        }
    }
}