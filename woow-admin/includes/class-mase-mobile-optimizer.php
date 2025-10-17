<?php
/**
 * MASE Mobile Optimizer Class
 *
 * Handles mobile device detection, low-power device detection,
 * and graceful degradation for visual effects.
 *
 * @package Modern_Admin_Styler_Enterprise
 * @since 1.2.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class MASE_Mobile_Optimizer
 *
 * Detects mobile and low-power devices and manages graceful degradation.
 */
class MASE_Mobile_Optimizer {

	/**
	 * Detect if current device is mobile.
	 * Uses WordPress wp_is_mobile() function (Requirement 9.1).
	 *
	 * @return bool True if mobile device, false otherwise.
	 */
	public function is_mobile() {
		return wp_is_mobile();
	}

	/**
	 * Detect if current device is low-power.
	 * Uses client-side detection via JavaScript and server-side heuristics (Requirement 16.1).
	 *
	 * @return bool True if low-power device detected, false otherwise.
	 */
	public function is_low_power_device() {
		// Check for stored low-power detection result.
		$stored_result = get_transient( 'mase_low_power_device_' . get_current_user_id() );
		if ( false !== $stored_result ) {
			return (bool) $stored_result;
		}

		// Server-side heuristics for low-power device detection.
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';

		// Check for common low-power device indicators.
		$low_power_indicators = array(
			'Android 4',
			'Android 5',
			'iPhone 5',
			'iPhone 6',
			'iPad 2',
			'iPad 3',
			'iPad 4',
			'iPod',
		);

		foreach ( $low_power_indicators as $indicator ) {
			if ( stripos( $user_agent, $indicator ) !== false ) {
				// Cache result for 1 hour.
				set_transient( 'mase_low_power_device_' . get_current_user_id(), true, HOUR_IN_SECONDS );
				return true;
			}
		}

		// Default to false if no indicators found.
		set_transient( 'mase_low_power_device_' . get_current_user_id(), false, HOUR_IN_SECONDS );
		return false;
	}

	/**
	 * Check if shadows should be disabled based on device and settings.
	 * Requirement 16.2: Provide option to disable shadows.
	 * Requirement 16.1: Auto-detect low-power devices.
	 *
	 * @param array $settings Visual effects settings.
	 * @return bool True if shadows should be disabled, false otherwise.
	 */
	public function should_disable_shadows( $settings ) {
		$visual_effects = isset( $settings['visual_effects'] ) ? $settings['visual_effects'] : array();

		// Check manual setting (Requirement 16.2).
		if ( isset( $visual_effects['disable_mobile_shadows'] ) && $visual_effects['disable_mobile_shadows'] ) {
			return $this->is_mobile();
		}

		// Check auto-detection setting (Requirement 16.1).
		if ( isset( $visual_effects['auto_detect_low_power'] ) && $visual_effects['auto_detect_low_power'] ) {
			return $this->is_low_power_device();
		}

		return false;
	}

	/**
	 * Display admin notice for degradation mode.
	 * Requirement 16.4: Notify user when degradation occurs.
	 */
	public function display_degradation_notice() {
		// Only show on MASE settings page.
		$screen = get_current_screen();
		if ( ! $screen || 'settings_page_mase-settings' !== $screen->id ) {
			return;
		}

		$settings = new MASE_Settings();
		$current_settings = $settings->get_option();

		// Check if degradation is active.
		if ( ! $this->should_disable_shadows( $current_settings ) ) {
			return;
		}

		// Determine reason for degradation.
		$reason = '';
		if ( $this->is_mobile() && isset( $current_settings['visual_effects']['disable_mobile_shadows'] ) && 
			 $current_settings['visual_effects']['disable_mobile_shadows'] ) {
			$reason = 'mobile device detected';
		} elseif ( $this->is_low_power_device() ) {
			$reason = 'low-power device detected';
		}

		if ( empty( $reason ) ) {
			return;
		}

		?>
		<div class="notice notice-info is-dismissible">
			<p>
				<strong>MASE Performance Mode:</strong> 
				Shadow effects have been disabled due to <?php echo esc_html( $reason ); ?> 
				to maintain optimal performance. Border radius effects remain active.
			</p>
			<p>
				<a href="<?php echo esc_url( admin_url( 'options-general.php?page=mase-settings#visual-effects' ) ); ?>">
					Manage visual effects settings
				</a>
			</p>
		</div>
		<?php
	}

	/**
	 * Enqueue client-side low-power detection script.
	 * Uses JavaScript to detect device capabilities (Requirement 16.1).
	 */
	public function enqueue_detection_script() {
		// Only enqueue on admin pages.
		if ( ! is_admin() ) {
			return;
		}

		wp_add_inline_script(
			'mase-admin',
			$this->get_detection_script(),
			'after'
		);
	}

	/**
	 * Get client-side detection script.
	 * Detects low-power devices using JavaScript APIs (Requirement 16.1).
	 *
	 * @return string JavaScript code for detection.
	 */
	private function get_detection_script() {
		return "
		(function() {
			'use strict';
			
			// Detect low-power device using JavaScript APIs
			function detectLowPowerDevice() {
				var isLowPower = false;
				
				// Check for Save-Data header support
				if (navigator.connection && navigator.connection.saveData) {
					isLowPower = true;
				}
				
				// Check for reduced motion preference (often indicates low-power mode)
				if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
					isLowPower = true;
				}
				
				// Check device memory (if available)
				if (navigator.deviceMemory && navigator.deviceMemory < 4) {
					isLowPower = true;
				}
				
				// Check hardware concurrency (CPU cores)
				if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
					isLowPower = true;
				}
				
				// Send result to server if detected
				if (isLowPower) {
					jQuery.post(ajaxurl, {
						action: 'mase_store_low_power_detection',
						nonce: jQuery('#mase_nonce').val(),
						is_low_power: true
					});
				}
			}
			
			// Run detection on page load
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', detectLowPowerDevice);
			} else {
				detectLowPowerDevice();
			}
		})();
		";
	}

	/**
	 * Handle AJAX request to store low-power detection result.
	 * Requirement 16.1: Store client-side detection result.
	 */
	public function handle_store_low_power_detection() {
		// Verify nonce.
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( $_POST['nonce'], 'mase_nonce' ) ) {
			wp_send_json_error( array( 'message' => 'Invalid nonce' ) );
		}

		// Check user capability.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Insufficient permissions' ) );
		}

		// Store detection result.
		$is_low_power = isset( $_POST['is_low_power'] ) && $_POST['is_low_power'];
		set_transient( 'mase_low_power_device_' . get_current_user_id(), $is_low_power, HOUR_IN_SECONDS );

		wp_send_json_success( array( 'message' => 'Low-power detection stored' ) );
	}
}
