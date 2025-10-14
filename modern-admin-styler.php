<?php
/**
 * Plugin Name: Modern Admin Styler Enterprise
 * Plugin URI: https://example.com/modern-admin-styler
 * Description: Enterprise-grade WordPress admin styling plugin with clean, maintainable architecture. Customize admin bar, menu, and interface colors with live preview.
 * Version: 1.0.0
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * Author: MASE Development Team
 * Author URI: https://example.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: modern-admin-styler
 * Domain Path: /languages
 *
 * @package ModernAdminStyler
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Current plugin version.
 */
define( 'MASE_VERSION', '1.0.0' );

/**
 * Plugin directory path.
 */
define( 'MASE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

/**
 * Plugin directory URL.
 */
define( 'MASE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
