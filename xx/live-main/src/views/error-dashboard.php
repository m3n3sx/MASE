<?php
/**
 * Error Dashboard View
 * 
 * Admin interface for viewing and managing plugin errors
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Error Handling System
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get error data
$error_data = get_option('mas_v2_ajax_errors', []);
$error_stats = get_option('mas_v2_error_stats', [
    'total_errors' => 0,
    'errors_today' => 0,
    'critical_errors' => 0,
    'last_error_time' => null
]);

// Handle actions
if (isset($_POST['action']) && wp_verify_nonce($_POST['nonce'], 'mas_error_dashboard')) {
    switch ($_POST['action']) {
        case 'clear_errors':
            delete_option('mas_v2_ajax_errors');
            update_option('mas_v2_error_stats', [
                'total_errors' => 0,
                'errors_today' => 0,
                'critical_errors' => 0,
                'last_error_time' => null
            ]);
            echo '<div class="notice notice-success"><p>All errors have been cleared.</p></div>';
            $error_data = [];
            break;
            
        case 'export_errors':
            $filename = 'woow-errors-' . date('Y-m-d-H-i-s') . '.json';
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            echo json_encode([
                'export_date' => current_time('mysql'),
                'plugin_version' => MAS_V2_VERSION,
                'wordpress_version' => get_bloginfo('version'),
                'error_stats' => $error_stats,
                'errors' => $error_data
            ], JSON_PRETTY_PRINT);
            exit;
    }
}

// Process error data for display
$recent_errors = array_slice(array_reverse($error_data), 0, 20);
$error_categories = [];
$error_severities = [];

foreach ($error_data as $error) {
    $category = $error['category'] ?? 'unknown';
    $severity = $error['severity'] ?? 'unknown';
    
    $error_categories[$category] = ($error_categories[$category] ?? 0) + 1;
    $error_severities[$severity] = ($error_severities[$severity] ?? 0) + 1;
}
?>

<div class="wrap">
    <h1>🔍 WOOW! Error Dashboard</h1>
    <p>Monitor and manage plugin errors for better debugging and troubleshooting.</p>
    
    <!-- Error Statistics -->
    <div class="mas-error-stats" style="display: flex; gap: 20px; margin: 20px 0;">
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">📊 Total Errors</h3>
            <div style="font-size: 2em; font-weight: bold; color: #d63638;"><?php echo count($error_data); ?></div>
        </div>
        
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">🚨 Critical Errors</h3>
            <div style="font-size: 2em; font-weight: bold; color: #dc3232;"><?php echo $error_severities['critical'] ?? 0; ?></div>
        </div>
        
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">📅 Today's Errors</h3>
            <div style="font-size: 2em; font-weight: bold; color: #f56e28;"><?php echo $error_stats['errors_today']; ?></div>
        </div>
        
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">🕒 Last Error</h3>
            <div style="font-size: 1.2em; color: #666;">
                <?php 
                if ($error_stats['last_error_time']) {
                    echo human_time_diff(strtotime($error_stats['last_error_time'])) . ' ago';
                } else {
                    echo 'No errors';
                }
                ?>
            </div>
        </div>
    </div>
    
    <!-- Error Categories Chart -->
    <?php if (!empty($error_categories)): ?>
    <div class="mas-error-categories" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0;">
        <h3>📊 Error Categories</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <?php foreach ($error_categories as $category => $count): ?>
                <div class="category-item" style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; border-radius: 50%; background: <?php echo $this->getCategoryColor($category); ?>"></div>
                    <span><strong><?php echo ucfirst($category); ?>:</strong> <?php echo $count; ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>
    
    <!-- Action Buttons -->
    <div class="mas-error-actions" style="margin: 20px 0;">
        <form method="post" style="display: inline-block; margin-right: 10px;">
            <?php wp_nonce_field('mas_error_dashboard', 'nonce'); ?>
            <input type="hidden" name="action" value="clear_errors">
            <button type="submit" class="button button-secondary" onclick="return confirm('Are you sure you want to clear all errors?')">
                🗑️ Clear All Errors
            </button>
        </form>
        
        <form method="post" style="display: inline-block; margin-right: 10px;">
            <?php wp_nonce_field('mas_error_dashboard', 'nonce'); ?>
            <input type="hidden" name="action" value="export_errors">
            <button type="submit" class="button button-secondary">
                📤 Export Errors
            </button>
        </form>
        
        <button type="button" class="button button-secondary" onclick="location.reload()">
            🔄 Refresh
        </button>
    </div>
    
    <!-- Recent Errors Table -->
    <div class="mas-recent-errors" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3>🕒 Recent Errors (Last 20)</h3>
        
        <?php if (empty($recent_errors)): ?>
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3em; margin-bottom: 10px;">🎉</div>
                <h4>No errors found!</h4>
                <p>Your WOOW! Admin Styler is running smoothly.</p>
            </div>
        <?php else: ?>
            <div class="tablenav top">
                <div class="alignleft actions">
                    <select id="error-filter-category">
                        <option value="">All Categories</option>
                        <?php foreach (array_keys($error_categories) as $category): ?>
                            <option value="<?php echo esc_attr($category); ?>"><?php echo ucfirst($category); ?></option>
                        <?php endforeach; ?>
                    </select>
                    
                    <select id="error-filter-severity">
                        <option value="">All Severities</option>
                        <?php foreach (array_keys($error_severities) as $severity): ?>
                            <option value="<?php echo esc_attr($severity); ?>"><?php echo ucfirst($severity); ?></option>
                        <?php endforeach; ?>
                    </select>
                    
                    <button type="button" class="button" onclick="filterErrors()">Filter</button>
                    <button type="button" class="button" onclick="clearFilters()">Clear Filters</button>
                </div>
            </div>
            
            <table class="wp-list-table widefat fixed striped" id="errors-table">
                <thead>
                    <tr>
                        <th style="width: 120px;">Time</th>
                        <th style="width: 80px;">Severity</th>
                        <th style="width: 100px;">Category</th>
                        <th>Message</th>
                        <th style="width: 200px;">Context</th>
                        <th style="width: 80px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_errors as $index => $error): ?>
                        <tr data-category="<?php echo esc_attr($error['category'] ?? ''); ?>" 
                            data-severity="<?php echo esc_attr($error['severity'] ?? ''); ?>">
                            <td>
                                <div style="font-size: 0.9em;">
                                    <?php echo date('M j, H:i', strtotime($error['timestamp'] ?? 'now')); ?>
                                </div>
                            </td>
                            <td>
                                <span class="severity-badge severity-<?php echo esc_attr($error['severity'] ?? 'unknown'); ?>" 
                                      style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; color: white; background: <?php echo $this->getSeverityColor($error['severity'] ?? 'unknown'); ?>">
                                    <?php echo strtoupper($error['severity'] ?? 'UNKNOWN'); ?>
                                </span>
                            </td>
                            <td>
                                <span style="color: <?php echo $this->getCategoryColor($error['category'] ?? 'unknown'); ?>; font-weight: bold;">
                                    <?php echo ucfirst($error['category'] ?? 'Unknown'); ?>
                                </span>
                            </td>
                            <td>
                                <div style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" 
                                     title="<?php echo esc_attr($error['error_message'] ?? $error['message'] ?? 'No message'); ?>">
                                    <?php echo esc_html($error['error_message'] ?? $error['message'] ?? 'No message'); ?>
                                </div>
                                <?php if (!empty($error['file'])): ?>
                                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">
                                        <?php echo esc_html(basename($error['file'])); ?>:<?php echo esc_html($error['line'] ?? '?'); ?>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="font-size: 0.8em; color: #666;">
                                    <?php if (!empty($error['action'])): ?>
                                        <div><strong>Action:</strong> <?php echo esc_html($error['action']); ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($error['user_context']['user_id'])): ?>
                                        <div><strong>User:</strong> <?php echo esc_html($error['user_context']['user_id']); ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($error['memory_usage'])): ?>
                                        <div><strong>Memory:</strong> <?php echo size_format($error['memory_usage']); ?></div>
                                    <?php endif; ?>
                                </div>
                            </td>
                            <td>
                                <button type="button" class="button button-small" onclick="showErrorDetails(<?php echo $index; ?>)">
                                    👁️ Details
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<!-- Error Details Modal -->
<div id="error-details-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100000;">
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3>🔍 Error Details</h3>
            <button type="button" onclick="closeErrorDetails()" style="background: none; border: none; font-size: 1.5em; cursor: pointer;">×</button>
        </div>
        <div id="error-details-content"></div>
    </div>
</div>

<script>
// Error data for JavaScript
const errorData = <?php echo json_encode($recent_errors); ?>;

function showErrorDetails(index) {
    const error = errorData[index];
    const modal = document.getElementById('error-details-modal');
    const content = document.getElementById('error-details-content');
    
    let html = '<div style="font-family: monospace; font-size: 0.9em;">';
    
    // Basic info
    html += '<h4>📊 Basic Information</h4>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Timestamp:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">' + (error.timestamp || 'Unknown') + '</td></tr>';
    html += '<tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Category:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">' + (error.category || 'Unknown') + '</td></tr>';
    html += '<tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Severity:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">' + (error.severity || 'Unknown') + '</td></tr>';
    html += '<tr><td style="padding: 5px; border: 1px solid #ddd;"><strong>Message:</strong></td><td style="padding: 5px; border: 1px solid #ddd;">' + (error.error_message || error.message || 'No message') + '</td></tr>';
    html += '</table>';
    
    // Stack trace
    if (error.stack_trace) {
        html += '<h4>📋 Stack Trace</h4>';
        html += '<pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; max-height: 200px;">' + error.stack_trace + '</pre>';
    }
    
    // Context information
    if (error.user_context || error.system_context || error.additional_context) {
        html += '<h4>🔍 Context Information</h4>';
        html += '<pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; max-height: 200px;">';
        html += JSON.stringify({
            user_context: error.user_context,
            system_context: error.system_context,
            additional_context: error.additional_context
        }, null, 2);
        html += '</pre>';
    }
    
    html += '</div>';
    
    content.innerHTML = html;
    modal.style.display = 'block';
}

function closeErrorDetails() {
    document.getElementById('error-details-modal').style.display = 'none';
}

function filterErrors() {
    const categoryFilter = document.getElementById('error-filter-category').value;
    const severityFilter = document.getElementById('error-filter-severity').value;
    const rows = document.querySelectorAll('#errors-table tbody tr');
    
    rows.forEach(row => {
        const category = row.getAttribute('data-category');
        const severity = row.getAttribute('data-severity');
        
        const categoryMatch = !categoryFilter || category === categoryFilter;
        const severityMatch = !severityFilter || severity === severityFilter;
        
        if (categoryMatch && severityMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function clearFilters() {
    document.getElementById('error-filter-category').value = '';
    document.getElementById('error-filter-severity').value = '';
    filterErrors();
}

// Close modal when clicking outside
document.getElementById('error-details-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeErrorDetails();
    }
});
</script>

<style>
.mas-error-stats {
    display: flex;
    gap: 20px;
    margin: 20px 0;
}

.mas-stat-card {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    flex: 1;
}

.severity-critical { background: #dc3232 !important; }
.severity-high { background: #f56e28 !important; }
.severity-medium { background: #ffb900 !important; }
.severity-low { background: #00a32a !important; }
.severity-unknown { background: #666 !important; }

#error-details-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 100000;
}
</style>

<?php
// Helper methods for colors
function getCategoryColor($category) {
    $colors = [
        'ajax' => '#0073aa',
        'javascript' => '#f56e28',
        'database' => '#d63638',
        'security' => '#dc3232',
        'performance' => '#ffb900',
        'system' => '#666'
    ];
    return $colors[$category] ?? '#666';
}

function getSeverityColor($severity) {
    $colors = [
        'critical' => '#dc3232',
        'high' => '#f56e28',
        'medium' => '#ffb900',
        'low' => '#00a32a'
    ];
    return $colors[$severity] ?? '#666';
}
?>