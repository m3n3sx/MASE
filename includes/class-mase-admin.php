<?php
/**
 * MASE Admin Interface Class
 *
 * @package Modern_Admin_Styler_Enterprise
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MASE_Admin {

	private $settings;
	private $generator;
	private $cache;

	public function __construct( MASE_Settings $settings, MASE_CSS_Generator $generator, MASE_CacheManager $cache ) {
		if ( ! is_admin() ) {
			return;
		}

		$this->settings  = $settings;
		$this->generator = $generator;
		$this->cache     = $cache;

		add_action( 'admin_menu', array( $this, 'add_admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		add_action( 'admin_head', array( $this, 'inject_custom_css' ), 999 );
		add_action( 'wp_ajax_mase_save_settings', array( $this, 'handle_ajax_save_settings' ) );
	}

	public function add_admin_menu() {
		add_menu_page(
			__( 'Modern Admin Styler', 'mase' ),
			__( 'Admin Styler', 'mase' ),
			'manage_options',
			'mase-settings',
			array( $this, 'render_settings_page' ),
			'dashicons-admin-appearance',
			100
		);
	}

	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'mase' ) );
		}
		
		// Get current settings for the form.
		$settings = $this->settings->get_option();
		
		include plugin_dir_path( __FILE__ ) . 'admin-settings-page.php';
	}

	public function enqueue_assets( $hook ) {
		if ( 'toplevel_page_mase-settings' !== $hook ) {
			return;
		}

		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );

		wp_enqueue_style(
			'mase-admin',
			plugins_url( '../assets/css/mase-admin.css', __FILE__ ),
			array(),
			'1.0.0'
		);

		wp_enqueue_script(
			'mase-admin',
			plugins_url( '../assets/js/mase-admin.js', __FILE__ ),
			array( 'jquery', 'wp-color-picker' ),
			'1.0.0',
			true
		);
	}


	/**
	 * Inject custom CSS into admin pages.
	 *
	 * Uses advanced caching with automatic generation on cache miss.
	 */
	public function inject_custom_css() {
		try {
			$settings       = $this->settings->get_option();
			$cache_duration = ! empty( $settings['performance']['cache_duration'] ) 
				? absint( $settings['performance']['cache_duration'] ) 
				: 3600;

			// Use advanced cache manager with automatic generation.
			$css = $this->cache->remember(
				'generated_css',
				function() use ( $settings ) {
					$css = $this->generator->generate( $settings );

					// Apply minification if enabled.
					if ( ! empty( $settings['performance']['enable_minification'] ) ) {
						$css = $this->generator->minify( $css );
					}

					return $css;
				},
				$cache_duration
			);

			// Output CSS if we have any.
			if ( ! empty( $css ) ) {
				echo '<style id="mase-custom-css" type="text/css">' . "\n";
				echo $css . "\n";
				echo '</style>' . "\n";
			}

		} catch ( Exception $e ) {
			// Log error and try to use cached CSS as fallback.
			error_log( 'MASE CSS Generation Error: ' . $e->getMessage() );

			// Try to get any cached CSS as fallback.
			$fallback_css = $this->cache->get_cached_css();
			if ( false !== $fallback_css && ! empty( $fallback_css ) ) {
				echo '<style id="mase-custom-css" type="text/css">' . "\n";
				echo $fallback_css . "\n";
				echo '</style>' . "\n";
			}
		}
	}

	/**

	 * Handle AJAX save settings request.
	 */
	public function handle_ajax_save_settings() {
		// Verify nonce.
		if ( ! check_ajax_referer( 'mase_save_settings', 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid nonce', 'mase' ) ), 403 );
		}

		// Check user capability.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Unauthorized access', 'mase' ) ), 403 );
		}

		// Get and validate settings.
		$input = isset( $_POST['settings'] ) ? $_POST['settings'] : array();
		
		// Save settings.
		$result = $this->settings->update_option( $input );

		if ( $result ) {
			// Invalidate cache on successful save.
			$this->cache->invalidate( 'generated_css' );

			wp_send_json_success( array(
				'message' => __( 'Settings saved successfully', 'mase' ),
			) );
		} else {
			wp_send_json_error( array(
				'message' => __( 'Failed to save settings', 'mase' ),
			) );
		}
	}
}
