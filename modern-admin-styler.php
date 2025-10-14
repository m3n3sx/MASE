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

/**
 * PSR-4 Autoloader for MASE classes.
 *
 * Automatically loads class files from the includes directory when a class
 * is instantiated. Follows PSR-4 naming conventions.
 *
 * @param string $class_name The fully-qualified class name.
 * @return void
 */
function mase_autoloader( $class_name ) {
	// Only autoload classes in the MASE namespace.
	if ( strpos( $class_name, 'MASE_' ) !== 0 ) {
		return;
	}

	// Convert class name to file name (MASE_Settings -> class-mase-settings.php).
	$file = 'class-' . strtolower( str_replace( '_', '-', $class_name ) ) . '.php';
	$path = MASE_PLUGIN_DIR . 'includes/' . $file;

	// Load the class file if it exists.
	if ( file_exists( $path ) ) {
		require_once $path;
	}
}

// Register the autoloader.
spl_autoload_register( 'mase_autoloader' );

/**
 * Plugin activation hook.
 *
 * Checks WordPress version requirements and initializes default settings.
 * Prevents activation if WordPress version is below 5.0.
 *
 * @return void
 */
function mase_activate() {
	// Check WordPress version requirement.
	if ( version_compare( get_bloginfo( 'version' ), '5.0', '<' ) ) {
		deactivate_plugins( plugin_basename( __FILE__ ) );
		wp_die(
			esc_html__( 'Modern Admin Styler Enterprise requires WordPress 5.0 or higher.', 'modern-admin-styler' ),
			esc_html__( 'Plugin Activation Error', 'modern-admin-styler' ),
			array( 'back_link' => true )
		);
	}

	// Initialize default settings on activation.
	$settings = new MASE_Settings();
	$settings->initialize_defaults();
}

// Register activation hook.
register_activation_hook( __FILE__, 'mase_activate' );

/**
 * Plugin deactivation hook.
 *
 * Cleans up transients but preserves settings in options table.
 *
 * @return void
 */
function mase_deactivate() {
	// Clean up cached CSS transient.
	delete_transient( MASE_Cache::CACHE_KEY );
}

// Register deactivation hook.
register_deactivation_hook( __FILE__, 'mase_deactivate' );

/**
 * Initialize the plugin.
 *
 * Instantiates core classes and sets up the plugin functionality.
 * Only runs in admin context.
 *
 * @return void
 */
function mase_init() {
	// Only initialize in admin context.
	if ( ! is_admin() ) {
		return;
	}

	// Instantiate core classes with dependency injection.
	$settings  = new MASE_Settings();
	$generator = new MASE_CSS_Generator();
	$cache     = new MASE_Cache();
	$admin     = new MASE_Admin( $settings, $generator, $cache );
}

// Hook into plugins_loaded to initialize the plugin.
add_action( 'plugins_loaded', 'mase_init' );
