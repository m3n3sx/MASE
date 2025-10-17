<?php
/**
 * Diagnostics & Recovery Page
 * 
 * Admin interface for plugin diagnostics and recovery tools
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Recovery & Diagnostics
 */

if (!defined('ABSPATH')) {
    exit;
}

// Get diagnostic results if available
$diagnostic_results = get_option('woow_diagnostic_results', []);
$last_check = isset($diagnostic_results['timestamp']) ? $diagnostic_results['timestamp'] : null;
$health_score = isset($diagnostic_results['health_score']) ? $diagnostic_results['health_score'] : null;
$critical_issues = isset($diagnostic_results['critical_issues']) ? $diagnostic_results['critical_issues'] : [];

?>

<div class="wrap woow-diagnostics-page">
    <h1>🔍 WOOW Admin Styler - Diagnostics & Recovery</h1>
    
    <div class="woow-diagnostics-header">
        <div class="woow-health-score">
            <?php if ($health_score !== null): ?>
                <div class="health-score-circle <?php echo $health_score >= 80 ? 'good' : ($health_score >= 60 ? 'warning' : 'critical'); ?>">
                    <span class="score"><?php echo $health_score; ?>%</span>
                    <span class="label">Health Score</span>
                </div>
            <?php else: ?>
                <div class="health-score-circle unknown">
                    <span class="score">?</span>
                    <span class="label">Run Diagnostics</span>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="woow-quick-actions">
            <button type="button" class="button button-primary" id="run-diagnostics">
                🔍 Run Full Diagnostics
            </button>
            <button type="button" class="button" id="run-recovery" <?php echo empty($critical_issues) ? 'disabled' : ''; ?>>
                🔧 Auto Recovery
            </button>
            <button type="button" class="button" id="export-diagnostics">
                📄 Export Report
            </button>
            <button type="button" class="button button-secondary" id="reset-plugin" onclick="confirmReset()">
                🔄 Reset Plugin
            </button>
        </div>
    </div>
    
    <?php if ($last_check): ?>
        <p class="woow-last-check">
            Last diagnostic check: <strong><?php echo date('Y-m-d H:i:s', $last_check); ?></strong>
        </p>
    <?php endif; ?>
    
    <?php if (!empty($critical_issues)): ?>
        <div class="notice notice-error">
            <h3>🚨 Critical Issues Detected</h3>
            <ul>
                <?php foreach ($critical_issues as $issue): ?>
                    <li><strong><?php echo esc_html($issue['message']); ?></strong></li>
                <?php endforeach; ?>
            </ul>
            <p>
                <button type="button" class="button button-primary" id="fix-critical-issues">
                    Fix Critical Issues
                </button>
            </p>
        </div>
    <?php endif; ?>
    
    <div id="diagnostics-results" class="woow-diagnostics-results">
        <?php if (isset($diagnostic_results['results'])): ?>
            <?php $this->renderDiagnosticResults($diagnostic_results['results']); ?>
        <?php else: ?>
            <div class="notice notice-info">
                <p>No diagnostic data available. Click "Run Full Diagnostics" to perform a comprehensive health check.</p>
            </div>
        <?php endif; ?>
    </div>
    
    <div class="woow-recovery-tools">
        <h2>🛠️ Recovery Tools</h2>
        
        <div class="recovery-tool-grid">
            <div class="recovery-tool">
                <h3>🗑️ Clear Cache</h3>
                <p>Clear all plugin caches and transients</p>
                <button type="button" class="button" onclick="runRecoveryAction('clear_cache')">
                    Clear Cache
                </button>
            </div>
            
            <div class="recovery-tool">
                <h3>⚙️ Reset Settings</h3>
                <p>Reset all plugin settings to defaults</p>
                <button type="button" class="button" onclick="runRecoveryAction('reset_settings')">
                    Reset Settings
                </button>
            </div>
            
            <div class="recovery-tool">
                <h3>📝 Clear Error Log</h3>
                <p>Clear all error logs and diagnostic data</p>
                <button type="button" class="button" onclick="runRecoveryAction('clear_error_log')">
                    Clear Errors
                </button>
            </div>
            
            <div class="recovery-tool">
                <h3>🔄 Reinitialize AJAX</h3>
                <p>Reinitialize AJAX endpoints and handlers</p>
                <button type="button" class="button" onclick="runRecoveryAction('reinitialize_ajax')">
                    Reinitialize AJAX
                </button>
            </div>
            
            <div class="recovery-tool">
                <h3>🚀 Optimize Performance</h3>
                <p>Clear performance data and optimize</p>
                <button type="button" class="button" onclick="runRecoveryAction('optimize_performance')">
                    Optimize
                </button>
            </div>
            
            <div class="recovery-tool">
                <h3>🔒 Fix Permissions</h3>
                <p>Fix file and directory permissions</p>
                <button type="button" class="button" onclick="runRecoveryAction('fix_permissions')">
                    Fix Permissions
                </button>
            </div>
        </div>
    </div>
    
    <div class="woow-system-info">
        <h2>💻 System Information</h2>
        
        <table class="form-table">
            <tr>
                <th>Plugin Version</th>
                <td><?php echo MAS_V2_VERSION; ?></td>
            </tr>
            <tr>
                <th>WordPress Version</th>
                <td><?php echo get_bloginfo('version'); ?></td>
            </tr>
            <tr>
                <th>PHP Version</th>
                <td><?php echo PHP_VERSION; ?></td>
            </tr>
            <tr>
                <th>Server Software</th>
                <td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></td>
            </tr>
            <tr>
                <th>Memory Limit</th>
                <td><?php echo ini_get('memory_limit'); ?></td>
            </tr>
            <tr>
                <th>Memory Usage</th>
                <td><?php echo size_format(memory_get_usage(true)); ?></td>
            </tr>
            <tr>
                <th>Max Execution Time</th>
                <td><?php echo ini_get('max_execution_time'); ?>s</td>
            </tr>
            <tr>
                <th>Active Theme</th>
                <td><?php echo wp_get_theme()->get('Name') . ' ' . wp_get_theme()->get('Version'); ?></td>
            </tr>
            <tr>
                <th>Active Plugins</th>
                <td><?php echo count(get_option('active_plugins', [])); ?> plugins active</td>
            </tr>
        </table>
    </div>
    
    <div id="diagnostics-log" class="woow-diagnostics-log" style="display: none;">
        <h3>📋 Diagnostic Log</h3>
        <div class="log-content"></div>
    </div>
</div>

<style>
.woow-diagnostics-page {
    max-width: 1200px;
}

.woow-diagnostics-header {
    display: flex;
    align-items: center;
    gap: 30px;
    margin: 20px 0;
    padding: 20px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.woow-health-score {
    flex-shrink: 0;
}

.health-score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    position: relative;
}

.health-score-circle.good {
    background: linear-gradient(135deg, #4CAF50, #45a049);
}

.health-score-circle.warning {
    background: linear-gradient(135deg, #FF9800, #f57c00);
}

.health-score-circle.critical {
    background: linear-gradient(135deg, #f44336, #d32f2f);
}

.health-score-circle.unknown {
    background: linear-gradient(135deg, #9E9E9E, #757575);
}

.health-score-circle .score {
    font-size: 24px;
    line-height: 1;
}

.health-score-circle .label {
    font-size: 12px;
    margin-top: 5px;
}

.woow-quick-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.woow-last-check {
    color: #666;
    font-style: italic;
}

.woow-diagnostics-results {
    margin: 20px 0;
}

.diagnostic-check {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 10px 0;
    padding: 15px;
}

.diagnostic-check.status-pass {
    border-left: 4px solid #4CAF50;
}

.diagnostic-check.status-warning {
    border-left: 4px solid #FF9800;
}

.diagnostic-check.status-critical {
    border-left: 4px solid #f44336;
}

.diagnostic-check.status-error {
    border-left: 4px solid #9C27B0;
}

.diagnostic-check h3 {
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.diagnostic-check .status-icon {
    font-size: 18px;
}

.diagnostic-check .details {
    margin-top: 10px;
    padding: 10px;
    background: #f9f9f9;
    border-radius: 4px;
}

.recovery-tool-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.recovery-tool {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
}

.recovery-tool h3 {
    margin: 0 0 10px 0;
    color: #333;
}

.recovery-tool p {
    color: #666;
    margin: 0 0 15px 0;
}

.woow-system-info {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

.woow-diagnostics-log {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

.log-content {
    background: #f1f1f1;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    font-family: monospace;
    font-size: 12px;
    max-height: 300px;
    overflow-y: auto;
}

.loading {
    opacity: 0.6;
    pointer-events: none;
}

.spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 5px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>

<script>
jQuery(document).ready(function($) {
    
    // Run diagnostics
    $('#run-diagnostics').on('click', function() {
        runDiagnostics();
    });
    
    // Run recovery
    $('#run-recovery').on('click', function() {
        runAutoRecovery();
    });
    
    // Export diagnostics
    $('#export-diagnostics').on('click', function() {
        exportDiagnostics();
    });
    
    // Fix critical issues
    $('#fix-critical-issues').on('click', function() {
        runAutoRecovery();
    });
    
    function runDiagnostics() {
        const button = $('#run-diagnostics');
        const originalText = button.text();
        
        button.html('<span class="spinner"></span>Running Diagnostics...').prop('disabled', true);
        showLog('Starting comprehensive diagnostics...');
        
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'woow_run_diagnostics',
                nonce: '<?php echo wp_create_nonce('woow_diagnostics'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    displayDiagnosticResults(response.data);
                    showLog('Diagnostics completed successfully');
                    location.reload(); // Reload to show updated results
                } else {
                    showLog('Diagnostics failed: ' + response.data);
                }
            },
            error: function() {
                showLog('Diagnostics request failed');
            },
            complete: function() {
                button.text(originalText).prop('disabled', false);
            }
        });
    }
    
    function runAutoRecovery() {
        const button = $('#run-recovery');
        const originalText = button.text();
        
        button.html('<span class="spinner"></span>Running Recovery...').prop('disabled', true);
        showLog('Starting automatic recovery...');
        
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'woow_run_recovery',
                nonce: '<?php echo wp_create_nonce('woow_recovery'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    displayRecoveryResults(response.data);
                    showLog('Recovery completed successfully');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showLog('Recovery failed: ' + response.data);
                }
            },
            error: function() {
                showLog('Recovery request failed');
            },
            complete: function() {
                button.text(originalText).prop('disabled', false);
            }
        });
    }
    
    function exportDiagnostics() {
        const button = $('#export-diagnostics');
        const originalText = button.text();
        
        button.html('<span class="spinner"></span>Exporting...').prop('disabled', true);
        
        $.ajax({
            url: ajaxurl,
            method: 'POST',
            data: {
                action: 'woow_export_diagnostics',
                nonce: '<?php echo wp_create_nonce('woow_export'); ?>'
            },
            success: function(response) {
                if (response.success) {
                    downloadDiagnosticReport(response.data);
                    showLog('Diagnostic report exported successfully');
                } else {
                    showLog('Export failed: ' + response.data);
                }
            },
            error: function() {
                showLog('Export request failed');
            },
            complete: function() {
                button.text(originalText).prop('disabled', false);
            }
        });
    }
    
    function displayDiagnosticResults(results) {
        // This would update the diagnostic results display
        console.log('Diagnostic results:', results);
    }
    
    function displayRecoveryResults(results) {
        let message = 'Recovery actions completed:\n';
        for (const [action, result] of Object.entries(results)) {
            message += `- ${action}: ${result.success ? 'Success' : 'Failed'}\n`;
        }
        alert(message);
    }
    
    function downloadDiagnosticReport(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'woow-diagnostic-report-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function showLog(message) {
        const logDiv = $('#diagnostics-log');
        const logContent = logDiv.find('.log-content');
        
        logDiv.show();
        logContent.append(new Date().toLocaleTimeString() + ': ' + message + '\n');
        logContent.scrollTop(logContent[0].scrollHeight);
    }
    
});

function runRecoveryAction(action) {
    if (!confirm(`Are you sure you want to run the "${action}" recovery action?`)) {
        return;
    }
    
    jQuery.ajax({
        url: ajaxurl,
        method: 'POST',
        data: {
            action: 'woow_run_recovery',
            actions: [action],
            nonce: '<?php echo wp_create_nonce('woow_recovery'); ?>'
        },
        success: function(response) {
            if (response.success) {
                const result = response.data[action];
                alert(result.success ? `${action} completed successfully: ${result.message}` : `${action} failed: ${result.message}`);
                if (result.success) {
                    location.reload();
                }
            } else {
                alert('Recovery action failed: ' + response.data);
            }
        },
        error: function() {
            alert('Recovery action request failed');
        }
    });
}

function confirmReset() {
    if (confirm('Are you sure you want to reset the plugin? This will clear all settings and data.')) {
        if (confirm('This action cannot be undone. Are you absolutely sure?')) {
            resetPlugin();
        }
    }
}

function resetPlugin() {
    const button = jQuery('#reset-plugin');
    const originalText = button.text();
    
    button.html('<span class="spinner"></span>Resetting...').prop('disabled', true);
    
    jQuery.ajax({
        url: ajaxurl,
        method: 'POST',
        data: {
            action: 'woow_reset_plugin',
            nonce: '<?php echo wp_create_nonce('woow_reset'); ?>'
        },
        success: function(response) {
            if (response.success) {
                alert('Plugin reset completed successfully. The page will reload.');
                location.reload();
            } else {
                alert('Plugin reset failed: ' + response.data);
            }
        },
        error: function() {
            alert('Plugin reset request failed');
        },
        complete: function() {
            button.text(originalText).prop('disabled', false);
        }
    });
}
</script>

<?php
// Helper method to render diagnostic results
if (isset($diagnostic_results['results'])) {
    foreach ($diagnostic_results['results'] as $check_name => $result) {
        $status_class = 'status-' . $result['status'];
        $status_icon = $result['status'] === 'pass' ? '✅' : 
                      ($result['status'] === 'warning' ? '⚠️' : 
                      ($result['status'] === 'critical' ? '❌' : '🔍'));
        
        echo '<div class="diagnostic-check ' . $status_class . '">';
        echo '<h3><span class="status-icon">' . $status_icon . '</span>' . ucwords(str_replace('_', ' ', $check_name)) . '</h3>';
        echo '<p>' . esc_html($result['message']) . '</p>';
        
        if (!empty($result['details'])) {
            echo '<div class="details">';
            if (is_array($result['details'])) {
                echo '<ul>';
                foreach ($result['details'] as $detail) {
                    if (is_array($detail)) {
                        foreach ($detail as $item) {
                            echo '<li>' . esc_html($item) . '</li>';
                        }
                    } else {
                        echo '<li>' . esc_html($detail) . '</li>';
                    }
                }
                echo '</ul>';
            } else {
                echo '<p>' . esc_html($result['details']) . '</p>';
            }
            echo '</div>';
        }
        
        echo '</div>';
    }
}
?>