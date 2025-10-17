<?php
/**
 * Webhook Manager
 * 
 * Manages webhook subscriptions and notifications for external integrations.
 * Provides reliable webhook delivery with retry mechanisms and security features.
 * 
 * Requirements: 4.1, 4.2
 * 
 * @package ModernAdminStyler
 * @version 2.4.0
 */

namespace ModernAdminStyler\Services;

class WebhookManager {
    
    const WEBHOOKS_OPTION = 'mas_webhooks';
    const WEBHOOK_LOGS_OPTION = 'mas_webhook_logs';
    const MAX_RETRY_ATTEMPTS = 3;
    const RETRY_DELAY_BASE = 5; // seconds
    const WEBHOOK_TIMEOUT = 30; // seconds
    const MAX_WEBHOOKS_PER_USER = 20;
    
    private $supported_events = [
        'settings_updated',
        'schema_created',
        'schema_updated',
        'schema_deleted',
        'preview_generated',
        'export_completed',
        'import_completed',
        'api_key_created',
        'api_key_deleted'
    ];
    
    public function __construct() {
        // Schedule webhook cleanup
        if (!wp_next_scheduled('mas_cleanup_webhook_logs')) {
            wp_schedule_event(time(), 'daily', 'mas_cleanup_webhook_logs');
        }
        
        add_action('mas_cleanup_webhook_logs', [$this, 'cleanupWebhookLogs']);
    }
    
    /**
     * Create new webhook subscription
     * Requirements: 4.2
     * 
     * @param array $params Webhook parameters
     * @return \WP_REST_Response|WP_Error
     */
    public function createWebhook($params) {
        try {
            $user_id = get_current_user_id();
            $url = esc_url_raw($params['url'] ?? '');
            $events = $this->validateEvents($params['events'] ?? []);
            $secret = $this->generateWebhookSecret();
            
            // Validate required fields
            if (empty($url)) {
                return new \WP_Error('invalid_url', 'Webhook URL is required', ['status' => 400]);
            }
            
            if (empty($events)) {
                return new \WP_Error('invalid_events', 'At least one event is required', ['status' => 400]);
            }
            
            // Validate URL
            if (!filter_var($url, FILTER_VALIDATE_URL)) {
                return new \WP_Error('invalid_url', 'Invalid webhook URL format', ['status' => 400]);
            }
            
            // Check user's webhook limit
            $existing_webhooks = $this->getUserWebhooks($user_id);
            if (count($existing_webhooks) >= self::MAX_WEBHOOKS_PER_USER) {
                return new \WP_Error('webhook_limit_exceeded', 
                    'Maximum webhooks limit reached', ['status' => 429]);
            }
            
            // Test webhook URL
            $test_result = $this->testWebhookUrl($url, $secret);
            if (is_wp_error($test_result)) {
                return $test_result;
            }
            
            $webhook_id = wp_generate_uuid4();
            
            // Create webhook record
            $webhook_data = [
                'id' => $webhook_id,
                'user_id' => $user_id,
                'name' => sanitize_text_field($params['name'] ?? 'Webhook ' . date('Y-m-d H:i:s')),
                'url' => $url,
                'events' => $events,
                'secret' => $secret,
                'is_active' => true,
                'created_at' => current_time('mysql'),
                'last_triggered_at' => null,
                'success_count' => 0,
                'failure_count' => 0,
                'headers' => $this->validateHeaders($params['headers'] ?? []),
                'retry_policy' => [
                    'max_attempts' => intval($params['max_retry_attempts'] ?? self::MAX_RETRY_ATTEMPTS),
                    'delay_base' => intval($params['retry_delay'] ?? self::RETRY_DELAY_BASE)
                ],
                'filters' => $params['filters'] ?? [], // Event filtering conditions
                'metadata' => $params['metadata'] ?? []
            ];
            
            // Store webhook
            $this->storeWebhook($webhook_data);
            
            // Log webhook creation
            $this->logWebhookActivity($webhook_id, 'created', [
                'user_id' => $user_id,
                'url' => $url,
                'events' => $events
            ]);
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => [
                    'id' => $webhook_id,
                    'name' => $webhook_data['name'],
                    'url' => $url,
                    'events' => $events,
                    'secret' => $secret, // Only returned once
                    'is_active' => true,
                    'created_at' => $webhook_data['created_at']
                ]
            ], 201);
            
        } catch (\Exception $e) {
            return new \WP_Error('webhook_creation_failed', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * Get webhooks
     * Requirements: 4.2
     * 
     * @param string $webhook_id Optional webhook ID
     * @return \WP_REST_Response
     */
    public function getWebhooks($webhook_id = null) {
        $user_id = get_current_user_id();
        
        if ($webhook_id) {
            $webhook = $this->getWebhookById($webhook_id);
            
            if (!$webhook) {
                return new \WP_Error('webhook_not_found', 'Webhook not found', ['status' => 404]);
            }
            
            // Check permissions
            if (!current_user_can('manage_options') && $webhook['user_id'] !== $user_id) {
                return new \WP_Error('insufficient_permissions', 
                    'Cannot access other users webhooks', ['status' => 403]);
            }
            
            // Remove sensitive data
            $safe_webhook = $this->sanitizeWebhookData($webhook);
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $safe_webhook
            ], 200);
        }
        
        // Get user's webhooks
        $webhooks = $this->getUserWebhooks($user_id);
        
        // Remove sensitive data
        $safe_webhooks = array_map([$this, 'sanitizeWebhookData'], $webhooks);
        
        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'webhooks' => $safe_webhooks,
                'total' => count($safe_webhooks),
                'limit' => self::MAX_WEBHOOKS_PER_USER,
                'supported_events' => $this->supported_events
            ]
        ], 200);
    }
    
    /**
     * Update webhook
     * Requirements: 4.2
     * 
     * @param string $webhook_id Webhook ID
     * @param array $params Update parameters
     * @return \WP_REST_Response|WP_Error
     */
    public function updateWebhook($webhook_id, $params) {
        try {
            $webhook = $this->getWebhookById($webhook_id);
            
            if (!$webhook) {
                return new \WP_Error('webhook_not_found', 'Webhook not found', ['status' => 404]);
            }
            
            // Check permissions
            if (!current_user_can('manage_options') && 
                $webhook['user_id'] !== get_current_user_id()) {
                return new \WP_Error('insufficient_permissions', 
                    'Cannot update other users webhooks', ['status' => 403]);
            }
            
            // Update fields
            if (isset($params['name'])) {
                $webhook['name'] = sanitize_text_field($params['name']);
            }
            
            if (isset($params['url'])) {
                $new_url = esc_url_raw($params['url']);
                if (!filter_var($new_url, FILTER_VALIDATE_URL)) {
                    return new \WP_Error('invalid_url', 'Invalid webhook URL format', ['status' => 400]);
                }
                
                // Test new URL if changed
                if ($new_url !== $webhook['url']) {
                    $test_result = $this->testWebhookUrl($new_url, $webhook['secret']);
                    if (is_wp_error($test_result)) {
                        return $test_result;
                    }
                    $webhook['url'] = $new_url;
                }
            }
            
            if (isset($params['events'])) {
                $webhook['events'] = $this->validateEvents($params['events']);
            }
            
            if (isset($params['is_active'])) {
                $webhook['is_active'] = (bool) $params['is_active'];
            }
            
            if (isset($params['headers'])) {
                $webhook['headers'] = $this->validateHeaders($params['headers']);
            }
            
            if (isset($params['filters'])) {
                $webhook['filters'] = $params['filters'];
            }
            
            $webhook['updated_at'] = current_time('mysql');
            
            // Update webhook
            $this->updateWebhookData($webhook_id, $webhook);
            
            // Log update
            $this->logWebhookActivity($webhook_id, 'updated', [
                'user_id' => $webhook['user_id'],
                'changes' => array_keys($params)
            ]);
            
            return new \WP_REST_Response([
                'success' => true,
                'data' => $this->sanitizeWebhookData($webhook)
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_Error('webhook_update_failed', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * Delete webhook
     * Requirements: 4.2
     * 
     * @param string $webhook_id Webhook ID
     * @return \WP_REST_Response|WP_Error
     */
    public function deleteWebhook($webhook_id) {
        try {
            $webhook = $this->getWebhookById($webhook_id);
            
            if (!$webhook) {
                return new \WP_Error('webhook_not_found', 'Webhook not found', ['status' => 404]);
            }
            
            // Check permissions
            if (!current_user_can('manage_options') && 
                $webhook['user_id'] !== get_current_user_id()) {
                return new \WP_Error('insufficient_permissions', 
                    'Cannot delete other users webhooks', ['status' => 403]);
            }
            
            // Remove webhook
            $this->removeWebhook($webhook_id);
            
            // Log deletion
            $this->logWebhookActivity($webhook_id, 'deleted', [
                'user_id' => $webhook['user_id'],
                'url' => $webhook['url']
            ]);
            
            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Webhook deleted successfully'
            ], 200);
            
        } catch (\Exception $e) {
            return new \WP_Error('webhook_deletion_failed', $e->getMessage(), ['status' => 500]);
        }
    }
    
    /**
     * Trigger webhook for specific event
     * Requirements: 4.1, 4.2
     * 
     * @param string $event Event name
     * @param array $payload Event payload
     * @param array $context Additional context
     */
    public function triggerWebhook($event, $payload = [], $context = []) {
        if (!in_array($event, $this->supported_events)) {
            error_log("MAS Webhook: Unsupported event '{$event}'");
            return;
        }
        
        $webhooks = $this->getWebhooksForEvent($event);
        
        if (empty($webhooks)) {
            return; // No webhooks subscribed to this event
        }
        
        foreach ($webhooks as $webhook) {
            if (!$webhook['is_active']) {
                continue;
            }
            
            // Apply filters if configured
            if (!$this->passesFilters($webhook, $event, $payload)) {
                continue;
            }
            
            // Schedule webhook delivery
            $this->scheduleWebhookDelivery($webhook, $event, $payload, $context);
        }
    }
    
    /**
     * Schedule webhook delivery (can be immediate or queued)
     * Requirements: 4.2
     * 
     * @param array $webhook Webhook configuration
     * @param string $event Event name
     * @param array $payload Event payload
     * @param array $context Additional context
     */
    private function scheduleWebhookDelivery($webhook, $event, $payload, $context) {
        // For now, deliver immediately
        // In production, this could be queued for background processing
        $this->deliverWebhook($webhook, $event, $payload, $context);
    }
    
    /**
     * Deliver webhook with retry logic
     * Requirements: 4.2
     * 
     * @param array $webhook Webhook configuration
     * @param string $event Event name
     * @param array $payload Event payload
     * @param array $context Additional context
     * @param int $attempt Current attempt number
     */
    private function deliverWebhook($webhook, $event, $payload, $context, $attempt = 1) {
        $webhook_id = $webhook['id'];
        $delivery_id = wp_generate_uuid4();
        
        try {
            // Prepare webhook payload
            $webhook_payload = [
                'event' => $event,
                'timestamp' => current_time('c'),
                'delivery_id' => $delivery_id,
                'webhook_id' => $webhook_id,
                'data' => $payload,
                'context' => $context
            ];
            
            // Generate signature
            $signature = $this->generateWebhookSignature($webhook_payload, $webhook['secret']);
            
            // Prepare headers
            $headers = array_merge([
                'Content-Type' => 'application/json',
                'User-Agent' => 'MAS-Webhook/2.4.0',
                'X-MAS-Event' => $event,
                'X-MAS-Delivery' => $delivery_id,
                'X-MAS-Signature' => $signature,
                'X-MAS-Timestamp' => time()
            ], $webhook['headers'] ?? []);
            
            // Make HTTP request
            $response = wp_remote_post($webhook['url'], [
                'headers' => $headers,
                'body' => json_encode($webhook_payload),
                'timeout' => self::WEBHOOK_TIMEOUT,
                'blocking' => true,
                'sslverify' => true
            ]);
            
            if (is_wp_error($response)) {
                throw new \Exception($response->get_error_message());
            }
            
            $status_code = wp_remote_retrieve_response_code($response);
            $response_body = wp_remote_retrieve_body($response);
            
            if ($status_code >= 200 && $status_code < 300) {
                // Success
                $this->recordWebhookSuccess($webhook_id, $delivery_id, [
                    'event' => $event,
                    'attempt' => $attempt,
                    'status_code' => $status_code,
                    'response_body' => substr($response_body, 0, 1000) // Limit stored response
                ]);
                
                // Update webhook statistics
                $this->updateWebhookStats($webhook_id, true);
                
            } else {
                throw new \Exception("HTTP {$status_code}: {$response_body}");
            }
            
        } catch (\Exception $e) {
            // Record failure
            $this->recordWebhookFailure($webhook_id, $delivery_id, [
                'event' => $event,
                'attempt' => $attempt,
                'error' => $e->getMessage(),
                'max_attempts' => $webhook['retry_policy']['max_attempts']
            ]);
            
            // Retry if attempts remaining
            if ($attempt < $webhook['retry_policy']['max_attempts']) {
                $delay = $webhook['retry_policy']['delay_base'] * pow(2, $attempt - 1); // Exponential backoff
                
                // Schedule retry (in production, this would use a proper queue)
                wp_schedule_single_event(
                    time() + $delay,
                    'mas_retry_webhook_delivery',
                    [$webhook, $event, $payload, $context, $attempt + 1]
                );
            } else {
                // All retries exhausted
                $this->updateWebhookStats($webhook_id, false);
                
                // Log final failure
                error_log(sprintf(
                    'MAS Webhook delivery failed after %d attempts: %s | Webhook: %s | Event: %s',
                    $attempt,
                    $e->getMessage(),
                    $webhook_id,
                    $event
                ));
            }
        }
    }
    
    // Helper Methods
    
    /**
     * Generate webhook secret
     * Requirements: 4.2
     */
    private function generateWebhookSecret() {
        return 'whsec_' . bin2hex(random_bytes(32));
    }
    
    /**
     * Generate webhook signature
     * Requirements: 4.2
     */
    private function generateWebhookSignature($payload, $secret) {
        $payload_string = json_encode($payload, JSON_UNESCAPED_SLASHES);
        return 'sha256=' . hash_hmac('sha256', $payload_string, $secret);
    }
    
    /**
     * Test webhook URL
     * Requirements: 4.2
     */
    private function testWebhookUrl($url, $secret) {
        $test_payload = [
            'event' => 'webhook_test',
            'timestamp' => current_time('c'),
            'data' => ['message' => 'This is a test webhook delivery']
        ];
        
        $signature = $this->generateWebhookSignature($test_payload, $secret);
        
        $response = wp_remote_post($url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'User-Agent' => 'MAS-Webhook/2.4.0',
                'X-MAS-Event' => 'webhook_test',
                'X-MAS-Signature' => $signature
            ],
            'body' => json_encode($test_payload),
            'timeout' => 10,
            'blocking' => true
        ]);
        
        if (is_wp_error($response)) {
            return new \WP_Error('webhook_test_failed', 
                'Webhook URL test failed: ' . $response->get_error_message(), 
                ['status' => 400]);
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        
        if ($status_code < 200 || $status_code >= 300) {
            return new \WP_Error('webhook_test_failed', 
                "Webhook URL returned HTTP {$status_code}", 
                ['status' => 400]);
        }
        
        return true;
    }
    
    /**
     * Validate webhook events
     * Requirements: 4.2
     */
    private function validateEvents($events) {
        if (!is_array($events)) {
            return [];
        }
        
        return array_intersect($events, $this->supported_events);
    }
    
    /**
     * Validate webhook headers
     * Requirements: 4.2
     */
    private function validateHeaders($headers) {
        if (!is_array($headers)) {
            return [];
        }
        
        $safe_headers = [];
        $forbidden_headers = ['authorization', 'x-mas-signature', 'content-type'];
        
        foreach ($headers as $name => $value) {
            $name_lower = strtolower($name);
            if (!in_array($name_lower, $forbidden_headers)) {
                $safe_headers[sanitize_text_field($name)] = sanitize_text_field($value);
            }
        }
        
        return $safe_headers;
    }
    
    /**
     * Check if webhook passes filters
     * Requirements: 4.2
     */
    private function passesFilters($webhook, $event, $payload) {
        $filters = $webhook['filters'] ?? [];
        
        if (empty($filters)) {
            return true; // No filters, always pass
        }
        
        // Simple filter implementation
        // In production, this could be more sophisticated
        foreach ($filters as $filter) {
            $field = $filter['field'] ?? '';
            $operator = $filter['operator'] ?? 'equals';
            $value = $filter['value'] ?? '';
            
            if (empty($field)) {
                continue;
            }
            
            $payload_value = $this->getNestedValue($payload, $field);
            
            switch ($operator) {
                case 'equals':
                    if ($payload_value !== $value) {
                        return false;
                    }
                    break;
                    
                case 'contains':
                    if (strpos($payload_value, $value) === false) {
                        return false;
                    }
                    break;
                    
                case 'greater_than':
                    if (!is_numeric($payload_value) || $payload_value <= $value) {
                        return false;
                    }
                    break;
            }
        }
        
        return true;
    }
    
    /**
     * Get nested value from array using dot notation
     * Requirements: 4.2
     */
    private function getNestedValue($array, $key) {
        $keys = explode('.', $key);
        $value = $array;
        
        foreach ($keys as $k) {
            if (!is_array($value) || !isset($value[$k])) {
                return null;
            }
            $value = $value[$k];
        }
        
        return $value;
    }
    
    /**
     * Sanitize webhook data for API responses
     * Requirements: 4.2
     */
    private function sanitizeWebhookData($webhook) {
        $safe_webhook = $webhook;
        
        // Remove sensitive data
        unset($safe_webhook['secret']);
        
        // Add summary statistics
        $safe_webhook['statistics'] = [
            'success_count' => $webhook['success_count'],
            'failure_count' => $webhook['failure_count'],
            'success_rate' => $this->calculateSuccessRate($webhook),
            'last_triggered_at' => $webhook['last_triggered_at']
        ];
        
        return $safe_webhook;
    }
    
    /**
     * Calculate webhook success rate
     * Requirements: 4.2
     */
    private function calculateSuccessRate($webhook) {
        $total = $webhook['success_count'] + $webhook['failure_count'];
        
        if ($total === 0) {
            return 100; // No deliveries yet
        }
        
        return round(($webhook['success_count'] / $total) * 100, 2);
    }
    
    // Database Operations
    
    private function storeWebhook($webhook_data) {
        $webhooks = get_option(self::WEBHOOKS_OPTION, []);
        $webhooks[$webhook_data['id']] = $webhook_data;
        update_option(self::WEBHOOKS_OPTION, $webhooks);
    }
    
    private function getWebhookById($webhook_id) {
        $webhooks = get_option(self::WEBHOOKS_OPTION, []);
        return $webhooks[$webhook_id] ?? null;
    }
    
    private function getUserWebhooks($user_id) {
        $webhooks = get_option(self::WEBHOOKS_OPTION, []);
        
        return array_filter($webhooks, function($webhook) use ($user_id) {
            return $webhook['user_id'] == $user_id;
        });
    }
    
    private function getWebhooksForEvent($event) {
        $webhooks = get_option(self::WEBHOOKS_OPTION, []);
        
        return array_filter($webhooks, function($webhook) use ($event) {
            return in_array($event, $webhook['events']);
        });
    }
    
    private function updateWebhookData($webhook_id, $webhook_data) {
        $webhooks = get_option(self::WEBHOOKS_OPTION, []);
        $webhooks[$webhook_id] = $webhook_data;
        update_option(self::WEBHOOKS_OPTION, $webhooks);
    }
    
    private function removeWebhook($webhook_id) {
        $webhooks = get_option(self::WEBHOOKS_OPTION, []);
        unset($webhooks[$webhook_id]);
        update_option(self::WEBHOOKS_OPTION, $webhooks);
    }
    
    private function updateWebhookStats($webhook_id, $success) {
        $webhooks = get_option(self::WEBHOOKS_OPTION, []);
        
        if (isset($webhooks[$webhook_id])) {
            if ($success) {
                $webhooks[$webhook_id]['success_count']++;
            } else {
                $webhooks[$webhook_id]['failure_count']++;
            }
            
            $webhooks[$webhook_id]['last_triggered_at'] = current_time('mysql');
            update_option(self::WEBHOOKS_OPTION, $webhooks);
        }
    }
    
    private function recordWebhookSuccess($webhook_id, $delivery_id, $data) {
        $this->logWebhookDelivery($webhook_id, $delivery_id, 'success', $data);
    }
    
    private function recordWebhookFailure($webhook_id, $delivery_id, $data) {
        $this->logWebhookDelivery($webhook_id, $delivery_id, 'failure', $data);
    }
    
    private function logWebhookDelivery($webhook_id, $delivery_id, $status, $data) {
        $log_entry = [
            'webhook_id' => $webhook_id,
            'delivery_id' => $delivery_id,
            'status' => $status,
            'timestamp' => current_time('mysql'),
            'data' => $data
        ];
        
        $logs = get_option(self::WEBHOOK_LOGS_OPTION, []);
        $logs[] = $log_entry;
        
        // Keep only last 1000 log entries
        if (count($logs) > 1000) {
            $logs = array_slice($logs, -1000);
        }
        
        update_option(self::WEBHOOK_LOGS_OPTION, $logs);
    }
    
    private function logWebhookActivity($webhook_id, $action, $context) {
        error_log(sprintf(
            'MAS Webhook Activity [%s]: %s | Webhook: %s | User: %s',
            strtoupper($action),
            $action,
            $webhook_id,
            $context['user_id'] ?? 'unknown'
        ));
    }
    
    /**
     * Cleanup old webhook logs
     * Requirements: 4.2
     */
    public function cleanupWebhookLogs() {
        $logs = get_option(self::WEBHOOK_LOGS_OPTION, []);
        $cutoff_time = strtotime('-30 days');
        
        $filtered_logs = array_filter($logs, function($log) use ($cutoff_time) {
            return strtotime($log['timestamp']) > $cutoff_time;
        });
        
        update_option(self::WEBHOOK_LOGS_OPTION, array_values($filtered_logs));
        
        $removed_count = count($logs) - count($filtered_logs);
        if ($removed_count > 0) {
            error_log("MAS Webhook: Cleaned up {$removed_count} old webhook log entries");
        }
    }
}