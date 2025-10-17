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
		add_action( 'wp_ajax_mase_apply_palette', array( $this, 'handle_ajax_apply_palette' ) );
		add_action( 'wp_ajax_mase_export_settings', array( $this, 'handle_ajax_export_settings' ) );
		add_action( 'wp_ajax_mase_import_settings', array( $this, 'handle_ajax_import_settings' ) );
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
		try {
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
		} catch ( Exception $e ) {
			error_log( 'MASE Error (save_settings): ' . $e->getMessage() );
			wp_send_json_error( array(
				'message' => __( 'An error occurred. Please try again.', 'mase' ),
			) );
		}
	}

	/**
	 * Handle AJAX apply palette request.
	 */
	public function handle_ajax_apply_palette() {
		try {
			// Verify nonce.
			if ( ! check_ajax_referer( 'mase_save_settings', 'nonce', false ) ) {
				wp_send_json_error( array( 'message' => __( 'Invalid nonce', 'mase' ) ), 403 );
			}

			// Check user capability.
			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Unauthorized access', 'mase' ) ), 403 );
			}

			// Get palette ID.
			$palette_id = isset( $_POST['palette_id'] ) ? sanitize_text_field( $_POST['palette_id'] ) : '';

			if ( empty( $palette_id ) ) {
				wp_send_json_error( array( 'message' => __( 'Invalid palette ID', 'mase' ) ) );
			}

			// Apply palette.
			$result = $this->settings->apply_palette( $palette_id );

			if ( $result ) {
				// Invalidate cache.
				$this->cache->invalidate( 'generated_css' );

				wp_send_json_success( array(
					'message' => __( 'Palette applied successfully', 'mase' ),
				) );
			} else {
				wp_send_json_error( array(
					'message' => __( 'Failed to apply palette', 'mase' ),
				) );
			}
		} catch ( Exception $e ) {
			error_log( 'MASE Error (apply_palette): ' . $e->getMessage() );
			wp_send_json_error( array(
				'message' => __( 'An error occurred. Please try again.', 'mase' ),
			) );
		}
	}

	/**
	 * Handle AJAX export settings request.
	 */
	public function handle_ajax_export_settings() {
		try {
			// Verify nonce.
			if ( ! check_ajax_referer( 'mase_save_settings', 'nonce', false ) ) {
				wp_send_json_error( array( 'message' => __( 'Invalid nonce', 'mase' ) ), 403 );
			}

			// Check user capability.
			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Unauthorized access', 'mase' ) ), 403 );
			}

			// Get current settings.
			$settings = $this->settings->get_option();

			// Prepare export data.
			$export_data = array(
				'plugin'      => 'MASE',
				'version'     => '1.1.0',
				'exported_at' => current_time( 'mysql' ),
				'settings'    => $settings,
			);

			wp_send_json_success( $export_data );
		} catch ( Exception $e ) {
			error_log( 'MASE Error (export_settings): ' . $e->getMessage() );
			wp_send_json_error( array(
				'message' => __( 'An error occurred during export. Please try again.', 'mase' ),
			) );
		}
	}

	/**
	 * Handle AJAX import settings request.
	 */
	public function handle_ajax_import_settings() {
		try {
			// Verify nonce.
			if ( ! check_ajax_referer( 'mase_save_settings', 'nonce', false ) ) {
				wp_send_json_error( array( 'message' => __( 'Invalid nonce', 'mase' ) ), 403 );
			}

			// Check user capability.
			if ( ! current_user_can( 'manage_options' ) ) {
				wp_send_json_error( array( 'message' => __( 'Unauthorized access', 'mase' ) ), 403 );
			}

			// Get import data.
			$import_data = isset( $_POST['settings_data'] ) ? wp_unslash( $_POST['settings_data'] ) : '';

			if ( empty( $import_data ) ) {
				wp_send_json_error( array( 'message' => __( 'No import data provided', 'mase' ) ) );
			}

			// Decode JSON.
			$data = json_decode( $import_data, true );

			if ( ! $data || ! isset( $data['settings'] ) ) {
				wp_send_json_error( array( 'message' => __( 'Invalid import data format', 'mase' ) ) );
			}

			// Validate plugin identifier.
			if ( ! isset( $data['plugin'] ) || 'MASE' !== $data['plugin'] ) {
				wp_send_json_error( array( 'message' => __( 'Import data is not from MASE plugin', 'mase' ) ) );
			}

			// Import settings.
			$result = $this->settings->update_option( $data['settings'] );

			if ( $result ) {
				// Invalidate cache.
				$this->cache->invalidate( 'generated_css' );

				wp_send_json_success( array(
					'message' => __( 'Settings imported successfully', 'mase' ),
				) );
			} else {
				wp_send_json_error( array(
					'message' => __( 'Failed to import settings', 'mase' ),
				) );
			}
		} catch ( Exception $e ) {
			error_log( 'MASE Error (import_settings): ' . $e->getMessage() );
			wp_send_json_error( array(
				'message' => __( 'An error occurred during import. Please try again.', 'mase' ),
			) );
		}
	}
}
