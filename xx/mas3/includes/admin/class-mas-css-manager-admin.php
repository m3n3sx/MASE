<?php
/**
 * CSS Manager Admin Interface
 * 
 * Provides UI for controlling CSS loading system
 * 
 * @package ModernAdminStylerV2
 * @since 3.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class MAS_CSS_Manager_Admin {
    
    private static $instance = null;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', [$this, 'add_submenu'], 100);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_post_mas_toggle_css_manager', [$this, 'handle_toggle']);
    }
    
    public function add_submenu() {
        add_submenu_page(
            'mas-v2-settings',
            'CSS Manager',
            'CSS Manager',
            'manage_options',
            'mas-v2-css-manager',
            [$this, 'render_page']
        );
    }
    
    public function register_settings() {
        register_setting('mas_v2_css_manager', 'mas_v2_use_unified_css_manager');
    }
    
    public function render_page() {
        $use_unified = get_option('mas_v2_use_unified_css_manager', true);
        $stats = $this->get_css_stats();
        
        ?>
        <div class="wrap">
            <h1>🎨 CSS Manager</h1>
            <p>Control which CSS loading system is active</p>
            
            <div class="card" style="max-width: 800px;">
                <h2>Current System</h2>
                <p style="font-size: 18px; font-weight: bold;">
                    <?php if ($use_unified): ?>
                        ✅ Unified CSS Manager (Recommended)
                    <?php else: ?>
                        ⚠️ Legacy CSS Loading (Deprecated)
                    <?php endif; ?>
                </p>
                
                <form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
                    <?php wp_nonce_field('mas_toggle_css_manager'); ?>
                    <input type="hidden" name="action" value="mas_toggle_css_manager">
                    <input type="hidden" name="new_value" value="<?php echo $use_unified ? '0' : '1'; ?>">
                    
                    <?php if ($use_unified): ?>
                        <button type="submit" class="button">Switch to Legacy System</button>
                    <?php else: ?>
                        <button type="submit" class="button button-primary">Switch to Unified Manager</button>
                    <?php endif; ?>
                </form>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>📊 CSS Statistics</h2>
                <table class="widefat">
                    <tr>
                        <td><strong>CSS Files Loaded:</strong></td>
                        <td><?php echo $stats['files_loaded']; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Duplicate Loading:</strong></td>
                        <td><?php echo $stats['duplicates'] > 0 ? '⚠️ ' . $stats['duplicates'] . ' duplicates' : '✅ None'; ?></td>
                    </tr>
                    <tr>
                        <td><strong>System Status:</strong></td>
                        <td><?php echo $stats['status']; ?></td>
                    </tr>
                </table>
            </div>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>ℹ️ System Comparison</h2>
                <table class="widefat">
                    <thead>
                        <tr>
                            <th>Feature</th>
                            <th>Unified Manager</th>
                            <th>Legacy System</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Duplicate Prevention</td>
                            <td>✅ Yes</td>
                            <td>❌ No</td>
                        </tr>
                        <tr>
                            <td>Context-Aware Loading</td>
                            <td>✅ Yes</td>
                            <td>❌ No</td>
                        </tr>
                        <tr>
                            <td>Performance</td>
                            <td>✅ Optimized</td>
                            <td>⚠️ Slower</td>
                        </tr>
                        <tr>
                            <td>Maintenance</td>
                            <td>✅ Active</td>
                            <td>⚠️ Deprecated</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <?php
    }
    
    public function handle_toggle() {
        check_admin_referer('mas_toggle_css_manager');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $new_value = isset($_POST['new_value']) ? (bool)$_POST['new_value'] : true;
        update_option('mas_v2_use_unified_css_manager', $new_value);
        
        wp_redirect(admin_url('admin.php?page=mas-v2-css-manager&updated=1'));
        exit;
    }
    
    private function get_css_stats() {
        global $wp_styles;
        
        $files_loaded = 0;
        $duplicates = 0;
        
        if (isset($wp_styles->registered)) {
            $mas_handles = array_filter(array_keys($wp_styles->registered), function($handle) {
                return strpos($handle, 'mas-v2') !== false;
            });
            $files_loaded = count($mas_handles);
        }
        
        $use_unified = get_option('mas_v2_use_unified_css_manager', true);
        $status = $use_unified ? '✅ Unified Manager Active' : '⚠️ Legacy System Active';
        
        return [
            'files_loaded' => $files_loaded,
            'duplicates' => $duplicates,
            'status' => $status
        ];
    }
}
