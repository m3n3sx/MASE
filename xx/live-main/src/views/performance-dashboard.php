<?php
/**
 * Performance Dashboard View
 * 
 * Admin interface for monitoring and optimizing plugin performance
 * 
 * @package ModernAdminStyler
 * @version 2.4.0 - Performance Monitoring System
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get performance data
$performance_metrics = get_option('mas_v2_performance_metrics', []);
$slow_queries = get_option('mas_v2_slow_queries', []);
$performance_stats = get_option('mas_v2_performance_stats', [
    'total_requests' => 0,
    'average_response_time' => 0,
    'slow_requests' => 0,
    'memory_usage_avg' => 0,
    'cache_hit_rate' => 0
]);

// Handle actions
if (isset($_POST['action']) && wp_verify_nonce($_POST['nonce'], 'mas_performance_dashboard')) {
    switch ($_POST['action']) {
        case 'clear_metrics':
            delete_option('mas_v2_performance_metrics');
            delete_option('mas_v2_slow_queries');
            update_option('mas_v2_performance_stats', [
                'total_requests' => 0,
                'average_response_time' => 0,
                'slow_requests' => 0,
                'memory_usage_avg' => 0,
                'cache_hit_rate' => 0
            ]);
            echo '<div class="notice notice-success"><p>All performance metrics have been cleared.</p></div>';
            $performance_metrics = [];
            $slow_queries = [];
            break;
            
        case 'export_metrics':
            $filename = 'woow-performance-metrics-' . date('Y-m-d-H-i-s') . '.json';
            header('Content-Type: application/json');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            echo json_encode([
                'export_date' => current_time('mysql'),
                'plugin_version' => MAS_V2_VERSION,
                'wordpress_version' => get_bloginfo('version'),
                'performance_stats' => $performance_stats,
                'performance_metrics' => $performance_metrics,
                'slow_queries' => $slow_queries,
                'system_info' => [
                    'php_version' => PHP_VERSION,
                    'memory_limit' => ini_get('memory_limit'),
                    'max_execution_time' => ini_get('max_execution_time'),
                    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown'
                ]
            ], JSON_PRETTY_PRINT);
            exit;
    }
}

// Process performance data for display
$recent_metrics = array_slice(array_reverse($performance_metrics), 0, 50);
$performance_categories = [];
$response_times = [];

foreach ($performance_metrics as $metric) {
    $action = $metric['action'] ?? 'unknown';
    $performance_categories[$action] = ($performance_categories[$action] ?? 0) + 1;
    
    if (isset($metric['execution_time_ms'])) {
        $response_times[] = $metric['execution_time_ms'];
    }
}

// Calculate statistics
$avg_response_time = !empty($response_times) ? array_sum($response_times) / count($response_times) : 0;
$max_response_time = !empty($response_times) ? max($response_times) : 0;
$min_response_time = !empty($response_times) ? min($response_times) : 0;
$slow_requests_count = count(array_filter($response_times, function($time) { return $time > 500; }));

// Memory usage statistics
$memory_usage = array_column($performance_metrics, 'memory_usage');
$avg_memory = !empty($memory_usage) ? array_sum($memory_usage) / count($memory_usage) : 0;
$max_memory = !empty($memory_usage) ? max($memory_usage) : 0;
?>

<div class="wrap">
    <h1>⚡ WOOW! Performance Dashboard</h1>
    <p>Monitor and optimize plugin performance for better user experience.</p>
    
    <!-- Performance Statistics -->
    <div class="mas-performance-stats" style="display: flex; gap: 20px; margin: 20px 0;">
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">📊 Total Requests</h3>
            <div style="font-size: 2em; font-weight: bold; color: #0073aa;"><?php echo count($performance_metrics); ?></div>
        </div>
        
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">⏱️ Avg Response Time</h3>
            <div style="font-size: 2em; font-weight: bold; color: <?php echo $avg_response_time > 500 ? '#d63638' : '#00a32a'; ?>">
                <?php echo round($avg_response_time, 1); ?>ms
            </div>
        </div>
        
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">🐌 Slow Requests</h3>
            <div style="font-size: 2em; font-weight: bold; color: <?php echo $slow_requests_count > 0 ? '#d63638' : '#00a32a'; ?>">
                <?php echo $slow_requests_count; ?>
            </div>
        </div>
        
        <div class="mas-stat-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3 style="margin: 0 0 10px 0; color: #333;">💾 Avg Memory</h3>
            <div style="font-size: 1.5em; font-weight: bold; color: #666;">
                <?php echo size_format($avg_memory); ?>
            </div>
        </div>
    </div>
    
    <!-- Performance Charts -->
    <div class="mas-performance-charts" style="display: flex; gap: 20px; margin: 20px 0;">
        <!-- Response Time Chart -->
        <div class="mas-chart-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3>📈 Response Time Trends</h3>
            <canvas id="responseTimeChart" width="400" height="200"></canvas>
        </div>
        
        <!-- Memory Usage Chart -->
        <div class="mas-chart-card" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1;">
            <h3>💾 Memory Usage Trends</h3>
            <canvas id="memoryUsageChart" width="400" height="200"></canvas>
        </div>
    </div>
    
    <!-- Performance Breakdown -->
    <?php if (!empty($performance_categories)): ?>
    <div class="mas-performance-breakdown" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0;">
        <h3>📊 Performance by Action</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <?php foreach ($performance_categories as $action => $count): ?>
                <div class="action-item" style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; border-radius: 50%; background: <?php echo $this->getActionColor($action); ?>"></div>
                    <span><strong><?php echo esc_html($action); ?>:</strong> <?php echo $count; ?> requests</span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>
    
    <!-- System Information -->
    <div class="mas-system-info" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0;">
        <h3>💻 System Performance Info</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div>
                <h4>Memory</h4>
                <p><strong>Current Usage:</strong> <?php echo size_format(memory_get_usage(true)); ?></p>
                <p><strong>Peak Usage:</strong> <?php echo size_format(memory_get_peak_usage(true)); ?></p>
                <p><strong>Memory Limit:</strong> <?php echo ini_get('memory_limit'); ?></p>
                <p><strong>Usage Percentage:</strong> 
                    <?php 
                    $current = memory_get_usage(true);
                    $limit = wp_convert_hr_to_bytes(ini_get('memory_limit'));
                    $percentage = ($current / $limit) * 100;
                    echo round($percentage, 2) . '%';
                    ?>
                </p>
            </div>
            
            <div>
                <h4>Performance</h4>
                <p><strong>Max Response Time:</strong> <?php echo round($max_response_time, 1); ?>ms</p>
                <p><strong>Min Response Time:</strong> <?php echo round($min_response_time, 1); ?>ms</p>
                <p><strong>Max Memory Usage:</strong> <?php echo size_format($max_memory); ?></p>
                <p><strong>Slow Query Threshold:</strong> 100ms</p>
            </div>
            
            <div>
                <h4>System</h4>
                <p><strong>PHP Version:</strong> <?php echo PHP_VERSION; ?></p>
                <p><strong>Max Execution Time:</strong> <?php echo ini_get('max_execution_time'); ?>s</p>
                <p><strong>WordPress Version:</strong> <?php echo get_bloginfo('version'); ?></p>
                <p><strong>Plugin Version:</strong> <?php echo MAS_V2_VERSION; ?></p>
            </div>
        </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="mas-performance-actions" style="margin: 20px 0;">
        <form method="post" style="display: inline-block; margin-right: 10px;">
            <?php wp_nonce_field('mas_performance_dashboard', 'nonce'); ?>
            <input type="hidden" name="action" value="clear_metrics">
            <button type="submit" class="button button-secondary" onclick="return confirm('Are you sure you want to clear all performance metrics?')">
                🗑️ Clear All Metrics
            </button>
        </form>
        
        <form method="post" style="display: inline-block; margin-right: 10px;">
            <?php wp_nonce_field('mas_performance_dashboard', 'nonce'); ?>
            <input type="hidden" name="action" value="export_metrics">
            <button type="submit" class="button button-secondary">
                📤 Export Metrics
            </button>
        </form>
        
        <button type="button" class="button button-secondary" onclick="location.reload()">
            🔄 Refresh
        </button>
        
        <button type="button" class="button button-primary" onclick="runPerformanceTest()">
            🧪 Run Performance Test
        </button>
    </div>
    
    <!-- Recent Performance Metrics -->
    <div class="mas-recent-metrics" style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3>🕒 Recent Performance Metrics (Last 50)</h3>
        
        <?php if (empty($recent_metrics)): ?>
            <div style="text-align: center; padding: 40px; color: #666;">
                <div style="font-size: 3em; margin-bottom: 10px;">⚡</div>
                <h4>No performance data yet!</h4>
                <p>Performance metrics will appear here as your plugin processes requests.</p>
            </div>
        <?php else: ?>
            <div class="tablenav top">
                <div class="alignleft actions">
                    <select id="metrics-filter-action">
                        <option value="">All Actions</option>
                        <?php foreach (array_keys($performance_categories) as $action): ?>
                            <option value="<?php echo esc_attr($action); ?>"><?php echo esc_html($action); ?></option>
                        <?php endforeach; ?>
                    </select>
                    
                    <select id="metrics-filter-performance">
                        <option value="">All Performance</option>
                        <option value="fast">Fast (&lt; 200ms)</option>
                        <option value="normal">Normal (200-500ms)</option>
                        <option value="slow">Slow (&gt; 500ms)</option>
                    </select>
                    
                    <button type="button" class="button" onclick="filterMetrics()">Filter</button>
                    <button type="button" class="button" onclick="clearMetricsFilters()">Clear Filters</button>
                </div>
            </div>
            
            <table class="wp-list-table widefat fixed striped" id="metrics-table">
                <thead>
                    <tr>
                        <th style="width: 120px;">Time</th>
                        <th style="width: 150px;">Action</th>
                        <th style="width: 100px;">Response Time</th>
                        <th style="width: 100px;">Memory</th>
                        <th style="width: 80px;">Success</th>
                        <th>Context</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_metrics as $index => $metric): ?>
                        <tr data-action="<?php echo esc_attr($metric['action'] ?? ''); ?>" 
                            data-performance="<?php echo $this->getPerformanceClass($metric['execution_time_ms'] ?? 0); ?>">
                            <td>
                                <div style="font-size: 0.9em;">
                                    <?php echo date('M j, H:i:s', strtotime($metric['date'] ?? 'now')); ?>
                                </div>
                            </td>
                            <td>
                                <strong><?php echo esc_html($metric['action'] ?? 'Unknown'); ?></strong>
                            </td>
                            <td>
                                <span class="response-time response-time-<?php echo $this->getPerformanceClass($metric['execution_time_ms'] ?? 0); ?>" 
                                      style="padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; background: <?php echo $this->getPerformanceColor($metric['execution_time_ms'] ?? 0); ?>">
                                    <?php echo round($metric['execution_time_ms'] ?? 0, 1); ?>ms
                                </span>
                            </td>
                            <td>
                                <?php echo size_format($metric['memory_usage'] ?? 0); ?>
                            </td>
                            <td>
                                <span style="color: <?php echo ($metric['success'] ?? false) ? '#00a32a' : '#d63638'; ?>">
                                    <?php echo ($metric['success'] ?? false) ? '✅' : '❌'; ?>
                                </span>
                            </td>
                            <td>
                                <div style="font-size: 0.8em; color: #666;">
                                    <?php if (!empty($metric['user_id'])): ?>
                                        <div><strong>User:</strong> <?php echo esc_html($metric['user_id']); ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($metric['database_queries'])): ?>
                                        <div><strong>DB Queries:</strong> <?php echo esc_html($metric['database_queries']); ?></div>
                                    <?php endif; ?>
                                    <?php if (!empty($metric['cache_hits'])): ?>
                                        <div><strong>Cache Hits:</strong> <?php echo esc_html($metric['cache_hits']); ?></div>
                                    <?php endif; ?>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<script>
// Performance data for JavaScript
const performanceData = <?php echo json_encode($recent_metrics); ?>;

function filterMetrics() {
    const actionFilter = document.getElementById('metrics-filter-action').value;
    const performanceFilter = document.getElementById('metrics-filter-performance').value;
    const rows = document.querySelectorAll('#metrics-table tbody tr');
    
    rows.forEach(row => {
        const action = row.getAttribute('data-action');
        const performance = row.getAttribute('data-performance');
        
        const actionMatch = !actionFilter || action === actionFilter;
        const performanceMatch = !performanceFilter || performance === performanceFilter;
        
        if (actionMatch && performanceMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function clearMetricsFilters() {
    document.getElementById('metrics-filter-action').value = '';
    document.getElementById('metrics-filter-performance').value = '';
    filterMetrics();
}

function runPerformanceTest() {
    if (!confirm('This will run a performance test that may take a few seconds. Continue?')) {
        return;
    }
    
    const startTime = performance.now();
    
    // Run a series of AJAX requests to test performance
    const testRequests = [
        { action: 'mas_get_live_settings', data: {} },
        { action: 'mas_v2_get_settings', data: {} },
        { action: 'mas_live_preview', data: { test: 'performance' } }
    ];
    
    Promise.all(testRequests.map(request => 
        fetch(ajaxurl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: request.action,
                nonce: '<?php echo wp_create_nonce('mas_v2_ajax_nonce'); ?>',
                ...request.data
            })
        })
    )).then(responses => {
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        alert(`Performance test completed!\nTotal time: ${totalTime.toFixed(2)}ms\nRequests: ${testRequests.length}\nAverage: ${(totalTime / testRequests.length).toFixed(2)}ms per request`);
        
        // Refresh the page to see new metrics
        setTimeout(() => location.reload(), 1000);
    }).catch(error => {
        alert('Performance test failed: ' + error.message);
    });
}

// Initialize charts if Chart.js is available
if (typeof Chart !== 'undefined') {
    // Response Time Chart
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
    new Chart(responseTimeCtx, {
        type: 'line',
        data: {
            labels: performanceData.slice(-20).map((_, i) => i + 1),
            datasets: [{
                label: 'Response Time (ms)',
                data: performanceData.slice(-20).map(m => m.execution_time_ms || 0),
                borderColor: '#0073aa',
                backgroundColor: 'rgba(0, 115, 170, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    }
                }
            }
        }
    });
    
    // Memory Usage Chart
    const memoryUsageCtx = document.getElementById('memoryUsageChart').getContext('2d');
    new Chart(memoryUsageCtx, {
        type: 'line',
        data: {
            labels: performanceData.slice(-20).map((_, i) => i + 1),
            datasets: [{
                label: 'Memory Usage (MB)',
                data: performanceData.slice(-20).map(m => (m.memory_usage || 0) / (1024 * 1024)),
                borderColor: '#00a32a',
                backgroundColor: 'rgba(0, 163, 42, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Memory Usage (MB)'
                    }
                }
            }
        }
    });
}
</script>

<style>
.mas-performance-stats {
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

.response-time-fast { background: #00a32a !important; }
.response-time-normal { background: #ffb900 !important; }
.response-time-slow { background: #d63638 !important; }
</style>

<?php
// Helper methods for colors and classifications
function getActionColor($action) {
    $colors = [
        'mas_save_live_settings' => '#0073aa',
        'mas_get_live_settings' => '#00a32a',
        'mas_live_preview' => '#f56e28',
        'mas_v2_save_settings' => '#0073aa',
        'mas_v2_get_settings' => '#00a32a'
    ];
    return $colors[$action] ?? '#666';
}

function getPerformanceColor($responseTime) {
    if ($responseTime < 200) return '#00a32a';
    if ($responseTime < 500) return '#ffb900';
    return '#d63638';
}

function getPerformanceClass($responseTime) {
    if ($responseTime < 200) return 'fast';
    if ($responseTime < 500) return 'normal';
    return 'slow';
}
?>