<?php
/**
 * 🔧 AJAX Endpoint Fixes - Complete Solution
 * 
 * This file contains the fixes for the AJAX endpoint registration issues
 * identified in the micro-panel debug analysis.
 * 
 * @package ModernAdminStyler
 * @version 2.4.1 - AJAX Debug Fix
 */

// ========================================
// 🚨 CRITICAL FIX 1: EARLY INITIALIZATION
// ========================================

/**
 * Fix for woow-admin-styler.php - Ensure early AJAX hook registration
 * 
 * PROBLEM: UnifiedAjaxManager hooks may be registered too late
 * SOLUTION: Initialize CoreEngine on 'init' hook with priority 1
 */

// REPLACE THIS in woow-admin-styler.php around line 747:
/*
public function initServices() {
    $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
    $coreEngine->initialize();
}
*/

// WITH THIS:
public function initServices() {
    // 🚨 CRITICAL: Initialize early to ensure AJAX hooks are registered
    add_action('init', function() {
        $coreEngine = \ModernAdminStyler\Services\CoreEngine::getInstance();
        $coreEngine->initialize();
        
        // 🔍 DEBUG: Verify AJAX hooks are registered
        if (defined('WP_DEBUG') && WP_DEBUG) {
            $this->debugAjaxHooks();
        }
    }, 1); // Priority 1 for early initialization
}

/**
 * 🔍 Debug AJAX hook registration
 */
private function debugAjaxHooks() {
    $critical_hooks = [
        'wp_ajax_mas_save_live_settings',
        'wp_ajax_mas_get_live_settings', 
        'wp_ajax_mas_reset_live_setting',
        'wp_ajax_mas_v2_save_settings'
    ];
    
    foreach ($critical_hooks as $hook) {
        if (has_action($hook)) {
            error_log("✅ MAS V2: Hook registered - {$hook}");
        } else {
            error_log("❌ MAS V2: Hook MISSING - {$hook}");
        }
    }
}

// ========================================
// 🚨 CRITICAL FIX 2: UNIFIED AJAX MANAGER ENHANCEMENT
// ========================================

/**
 * Enhanced UnifiedAjaxManager->hookEndpoints() method
 * 
 * ADD THIS to UnifiedAjaxManager.php after line 200:
 */

/**
 * Hook all endpoints to WordPress AJAX system - ENHANCED
 */
private function hookEndpoints() {
    // 🔍 DEBUG: Log hook registration process
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("MAS V2: Starting AJAX hook registration for " . count($this->endpoints) . " endpoints");
    }
    
    foreach ($this->endpoints as $action => $config) {
        $hook_name = "wp_ajax_{$action}";
        
        // Register the hook
        add_action($hook_name, [$this, 'processAjaxRequest']);
        
        // 🔍 DEBUG: Verify each hook registration
        if (defined('WP_DEBUG') && WP_DEBUG) {
            if (has_action($hook_name)) {
                error_log("✅ MAS V2: Successfully registered - {$hook_name}");
            } else {
                error_log("❌ MAS V2: Failed to register - {$hook_name}");
            }
        }
    }
    
    // Hook deprecated endpoints with logging
    foreach ($this->deprecated_endpoints as $old_action => $new_action) {
        $hook_name = "wp_ajax_{$old_action}";
        add_action($hook_name, [$this, 'processDeprecatedRequest']);
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("⚠️ MAS V2: Registered deprecated endpoint - {$hook_name} -> {$new_action}");
        }
    }
    
    // 🔍 FINAL VERIFICATION: Test critical endpoints
    $this->verifyCriticalEndpoints();
}

/**
 * 🔍 Verify critical endpoints are properly registered
 */
private function verifyCriticalEndpoints() {
    $critical_endpoints = [
        'mas_save_live_settings',
        'mas_get_live_settings',
        'mas_reset_live_setting'
    ];
    
    $missing_endpoints = [];
    
    foreach ($critical_endpoints as $endpoint) {
        $hook_name = "wp_ajax_{$endpoint}";
        if (!has_action($hook_name)) {
            $missing_endpoints[] = $endpoint;
        }
    }
    
    if (!empty($missing_endpoints)) {
        error_log("🚨 MAS V2: CRITICAL - Missing AJAX endpoints: " . implode(', ', $missing_endpoints));
        
        // 🚨 EMERGENCY: Register missing endpoints directly
        $this->emergencyRegisterEndpoints($missing_endpoints);
    } else {
        error_log("✅ MAS V2: All critical AJAX endpoints registered successfully");
    }
}

/**
 * 🚨 Emergency registration for missing endpoints
 */
private function emergencyRegisterEndpoints($missing_endpoints) {
    foreach ($missing_endpoints as $endpoint) {
        if (isset($this->endpoints[$endpoint])) {
            $hook_name = "wp_ajax_{$endpoint}";
            add_action($hook_name, [$this, 'processAjaxRequest']);
            error_log("🚨 MAS V2: Emergency registered - {$hook_name}");
        }
    }
}

// ========================================
// 🚨 CRITICAL FIX 3: ENHANCED ERROR HANDLING
// ========================================

/**
 * Enhanced processAjaxRequest with better error handling
 * 
 * REPLACE the existing processAjaxRequest method in UnifiedAjaxManager.php:
 */

/**
 * Unified AJAX request processor - ENHANCED with debug logging
 */
public function processAjaxRequest() {
    $action = str_replace('wp_ajax_', '', current_action());
    $start_time = microtime(true);
    
    // 🔍 DEBUG: Log incoming request
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("🔄 MAS V2: Processing AJAX request - {$action}");
        error_log("📊 MAS V2: Request data - " . json_encode($_POST));
    }
    
    try {
        // Validate endpoint exists
        if (!isset($this->endpoints[$action])) {
            error_log("❌ MAS V2: Unknown AJAX endpoint - {$action}");
            error_log("📋 MAS V2: Available endpoints - " . implode(', ', array_keys($this->endpoints)));
            throw new \Exception("Unknown AJAX endpoint: {$action}");
        }
        
        $config = $this->endpoints[$action];
        $this->current_request = [
            'action' => $action,
            'config' => $config,
            'start_time' => $start_time
        ];
        
        // 🔍 DEBUG: Log endpoint configuration
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("⚙️ MAS V2: Endpoint config - " . json_encode($config));
        }
        
        // Phase 1: Security Validation
        $this->security_manager->validateRequest($action, $config);
        
        // Phase 2: Execute Handler
        $handler = $config['handler'];
        if (!is_callable($handler)) {
            error_log("❌ MAS V2: Handler not callable for action - {$action}");
            throw new \Exception("Handler not callable for action: {$action}");
        }
        
        // 🔍 DEBUG: Log handler execution
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("🎯 MAS V2: Executing handler for - {$action}");
        }
        
        $result = call_user_func($handler, $action, $config);
        
        // Phase 3: Performance Monitoring
        $execution_time = (microtime(true) - $start_time) * 1000;
        $this->performance_monitor->recordAjaxRequest($action, $execution_time, true, [
            'handler_result' => $result !== null ? 'success' : 'no_return'
        ]);
        
        // 🔍 DEBUG: Log successful completion
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("✅ MAS V2: Successfully processed - {$action} in {$execution_time}ms");
        }
        
        // Ensure response was sent
        if (!$this->response_manager->isResponseSent()) {
            error_log("⚠️ MAS V2: Handler did not send response for - {$action}");
            $this->response_manager->error('Handler did not send response', 'no_response');
        }
        
    } catch (SecurityException $e) {
        error_log("🛡️ MAS V2: Security exception for {$action} - " . $e->getMessage());
        $this->handleSecurityException($e, $action, $start_time);
    } catch (\Exception $e) {
        error_log("💥 MAS V2: General exception for {$action} - " . $e->getMessage());
        error_log("📍 MAS V2: Exception trace - " . $e->getTraceAsString());
        $this->handleGeneralException($e, $action, $start_time);
    }
}

// ========================================
// 🚨 CRITICAL FIX 4: RESPONSE FORMAT STANDARDIZATION
// ========================================

/**
 * Enhanced response handlers with consistent formatting
 * 
 * ADD THESE methods to UnifiedAjaxManager.php:
 */

/**
 * 💾 Enhanced handleSaveLiveSettings with debug logging
 */
public function handleSaveLiveSettings($action, $config) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("💾 MAS V2: handleSaveLiveSettings called");
        error_log("📊 MAS V2: POST data - " . json_encode($_POST));
    }
    
    try {
        // Get current settings
        $current_settings = $this->settings_manager->getSettings();
        
        // Process form data
        $form_data = $_POST;
        unset($form_data['nonce'], $form_data['action']);
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("🔄 MAS V2: Processing form data - " . json_encode($form_data));
        }
        
        // Update settings
        foreach ($form_data as $option_id => $value) {
            if ($option_id === 'settings') {
                $bulk_settings = json_decode(stripslashes($value), true);
                if (is_array($bulk_settings)) {
                    foreach ($bulk_settings as $bulk_option => $bulk_value) {
                        $current_settings[$bulk_option] = sanitize_text_field($bulk_value);
                        
                        if (defined('WP_DEBUG') && WP_DEBUG) {
                            error_log("🔧 MAS V2: Updated setting {$bulk_option} = {$bulk_value}");
                        }
                    }
                }
            } else {
                $current_settings[$option_id] = sanitize_text_field($value);
                
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    error_log("🔧 MAS V2: Updated setting {$option_id} = {$value}");
                }
            }
        }
        
        // Save settings
        $result = $this->settings_manager->saveSettings($current_settings);
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("💾 MAS V2: Save result - " . ($result !== false ? 'SUCCESS' : 'FAILED'));
        }
        
        if ($result !== false) {
            $response_data = [
                'settings' => $current_settings,
                'updated_options' => array_keys($form_data),
                'timestamp' => current_time('mysql'),
                'success' => true
            ];
            
            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log("✅ MAS V2: Sending success response - " . json_encode($response_data));
            }
            
            $this->response_manager->success(
                $response_data,
                __('Live settings saved successfully!', 'woow-admin-styler'),
                'live_settings_saved'
            );
        } else {
            error_log("❌ MAS V2: Database save failed for live settings");
            $this->response_manager->databaseError(
                __('Failed to save settings to database.', 'woow-admin-styler'),
                'save_live_settings'
            );
        }
        
    } catch (\Exception $e) {
        error_log("💥 MAS V2: Exception in handleSaveLiveSettings - " . $e->getMessage());
        throw $e; // Re-throw for unified error handling
    }
}

/**
 * 📖 Enhanced handleGetLiveSettings with debug logging
 */
public function handleGetLiveSettings($action, $config) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("📖 MAS V2: handleGetLiveSettings called");
    }
    
    try {
        $settings = $this->settings_manager->getSettings();
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("📊 MAS V2: Retrieved " . count($settings) . " settings");
        }
        
        $response_data = [
            'settings' => $settings,
            'count' => count($settings),
            'timestamp' => current_time('mysql'),
            'success' => true
        ];
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("✅ MAS V2: Sending settings response");
        }
        
        $this->response_manager->success(
            $response_data,
            __('Settings retrieved successfully!', 'woow-admin-styler'),
            'live_settings_loaded'
        );
        
    } catch (\Exception $e) {
        error_log("💥 MAS V2: Exception in handleGetLiveSettings - " . $e->getMessage());
        throw $e; // Re-throw for unified error handling
    }
}

// ========================================
// 🚨 CRITICAL FIX 5: NONCE VALIDATION ENHANCEMENT
// ========================================

/**
 * Enhanced nonce validation in AjaxSecurityManager
 * 
 * ADD THIS method to AjaxSecurityManager.php:
 */

/**
 * 🛡️ Enhanced nonce validation with debug logging
 */
public function validateNonce($action) {
    $nonce = $_POST['nonce'] ?? $_GET['nonce'] ?? '';
    
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("🛡️ MAS V2: Validating nonce for action - {$action}");
        error_log("🔑 MAS V2: Received nonce - {$nonce}");
    }
    
    if (empty($nonce)) {
        error_log("❌ MAS V2: No nonce provided for action - {$action}");
        throw new SecurityException('Nonce is required', 'missing_nonce');
    }
    
    // Determine nonce action based on endpoint
    $nonce_action = $this->getNonceAction($action);
    
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("🔍 MAS V2: Using nonce action - {$nonce_action}");
    }
    
    if (!wp_verify_nonce($nonce, $nonce_action)) {
        error_log("❌ MAS V2: Nonce verification failed for {$action} with nonce action {$nonce_action}");
        throw new SecurityException('Invalid nonce', 'invalid_nonce');
    }
    
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log("✅ MAS V2: Nonce validation successful for - {$action}");
    }
    
    return true;
}

/**
 * 🔑 Get appropriate nonce action for endpoint
 */
private function getNonceAction($action) {
    $nonce_mappings = [
        'mas_save_live_settings' => 'mas_live_edit_nonce',
        'mas_get_live_settings' => 'mas_live_edit_nonce',
        'mas_reset_live_setting' => 'mas_live_edit_nonce',
        'mas_v2_save_settings' => 'mas_v2_nonce',
        'mas_v2_database_check' => 'mas_v2_nonce'
    ];
    
    return $nonce_mappings[$action] ?? 'mas_v2_nonce';
}

// ========================================
// 🚨 CRITICAL FIX 6: FRONTEND NONCE VERIFICATION
// ========================================

/**
 * JavaScript fix for nonce handling
 * 
 * ADD THIS to live-edit-mode.js or create separate nonce-fix.js:
 */

/*
// 🔑 Enhanced nonce management
class NonceManager {
    static getNonce() {
        // Try multiple nonce sources
        return window.masNonce || 
               window.masLiveEditNonce || 
               window.mas_v2_nonce || 
               document.querySelector('meta[name="mas-nonce"]')?.content ||
               '';
    }
    
    static validateNonce() {
        const nonce = this.getNonce();
        if (!nonce) {
            console.error('❌ MAS V2: No nonce available for AJAX requests');
            return false;
        }
        
        console.log('✅ MAS V2: Nonce available for AJAX requests');
        return true;
    }
    
    static getAjaxUrl() {
        return window.ajaxurl || '/wp-admin/admin-ajax.php';
    }
}

// 🔧 Enhanced AJAX request helper
class AjaxHelper {
    static async request(action, data = {}) {
        if (!NonceManager.validateNonce()) {
            throw new Error('No valid nonce available');
        }
        
        const requestData = {
            action: action,
            nonce: NonceManager.getNonce(),
            ...data
        };
        
        console.log(`🔄 MAS V2: Making AJAX request to ${action}`, requestData);
        
        try {
            const response = await fetch(NonceManager.getAjaxUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(requestData)
            });
            
            const result = await response.json();
            
            console.log(`✅ MAS V2: AJAX response from ${action}`, result);
            
            if (!result.success) {
                throw new Error(result.data?.message || 'AJAX request failed');
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ MAS V2: AJAX request failed for ${action}`, error);
            throw error;
        }
    }
}

// 💾 Enhanced settings save
async function saveSettings(settings) {
    return await AjaxHelper.request('mas_save_live_settings', {
        settings: JSON.stringify(settings)
    });
}

// 📖 Enhanced settings load
async function loadSettings() {
    return await AjaxHelper.request('mas_get_live_settings');
}
*/

?>