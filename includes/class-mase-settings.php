<?php
/**
 * Settings Management Class
 *
 * Handles all settings operations including retrieval, validation,
 * sanitization, and storage using WordPress Options API.
 *
 * @package ModernAdminStyler
 * @since 1.0.0
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * MASE_Settings class.
 *
 * Centralized settings management with validation and defaults.
 *
 * @since 1.0.0
 */
class MASE_Settings {

	/**
	 * WordPress option name for storing settings.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const OPTION_NAME = 'mase_settings';

	/**
	 * Get plugin settings or a specific setting value.
	 *
	 * @since 1.0.0
	 *
	 * @param string|null $key     Optional. Specific setting key to retrieve.
	 * @param mixed       $default Optional. Default value if setting doesn't exist.
	 * @return mixed Settings array, specific value, or default.
	 */
	public function get_option( $key = null, $default = null ) {
		$settings = get_option( self::OPTION_NAME, $this->get_defaults() );

		// Return all settings if no key specified.
		if ( null === $key ) {
			return $settings;
		}

		// Handle nested keys (e.g., 'admin_bar.bg_color').
		if ( strpos( $key, '.' ) !== false ) {
			$keys  = explode( '.', $key );
			$value = $settings;

			foreach ( $keys as $k ) {
				if ( ! isset( $value[ $k ] ) ) {
					return $default;
				}
				$value = $value[ $k ];
			}

			return $value;
		}

		// Return specific key or default.
		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}

	/**
	 * Update plugin settings.
	 *
	 * Validates and sanitizes input before saving to database.
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Settings data to save.
	 * @return bool|WP_Error True on success, WP_Error on validation failure.
	 */
	public function update_option( $data ) {
		// Validate input.
		$validated = $this->validate( $data );

		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		// Merge with existing settings to preserve unmodified values.
		$current_settings = $this->get_option();
		$new_settings     = array_replace_recursive( $current_settings, $validated );

		// Save to database.
		$updated = update_option( self::OPTION_NAME, $new_settings );

		return $updated;
	}

	/**
	 * Get default settings schema.
	 *
	 * @since 1.0.0
	 *
	 * @return array Default settings.
	 */
	public function get_defaults() {
		return array(
			'admin_bar'   => array(
				'bg_color'   => '#23282d',
				'text_color' => '#ffffff',
				'height'     => 32,
			),
			'admin_menu'  => array(
				'bg_color'         => '#23282d',
				'text_color'       => '#ffffff',
				'hover_bg_color'   => '#191e23',
				'hover_text_color' => '#00b9eb',
				'width'            => 160,
			),
			'performance' => array(
				'enable_minification' => true,
				'cache_duration'      => 3600,
			),
		);
	}

	/**
	 * Validate settings input.
	 *
	 * Checks color formats, numeric ranges, and data types.
	 *
	 * @since 1.0.0
	 *
	 * @param array $input Settings data to validate.
	 * @return array|WP_Error Validated settings or WP_Error on failure.
	 */
	public function validate( $input ) {
		$errors    = array();
		$validated = array();

		// Validate admin bar settings.
		if ( isset( $input['admin_bar'] ) ) {
			$validated['admin_bar'] = array();

			// Validate background color.
			if ( isset( $input['admin_bar']['bg_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_bar']['bg_color'] );
				if ( ! $color ) {
					$errors['admin_bar_bg_color'] = __( 'Invalid admin bar background color format. Use hex format (#rrggbb).', 'modern-admin-styler' );
				} else {
					$validated['admin_bar']['bg_color'] = $color;
				}
			}

			// Validate text color.
			if ( isset( $input['admin_bar']['text_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_bar']['text_color'] );
				if ( ! $color ) {
					$errors['admin_bar_text_color'] = __( 'Invalid admin bar text color format. Use hex format (#rrggbb).', 'modern-admin-styler' );
				} else {
					$validated['admin_bar']['text_color'] = $color;
				}
			}

			// Validate height.
			if ( isset( $input['admin_bar']['height'] ) ) {
				$height = absint( $input['admin_bar']['height'] );
				if ( $height < 0 || $height > 500 ) {
					$errors['admin_bar_height'] = __( 'Admin bar height must be between 0 and 500 pixels.', 'modern-admin-styler' );
				} else {
					$validated['admin_bar']['height'] = $height;
				}
			}
		}

		// Validate admin menu settings.
		if ( isset( $input['admin_menu'] ) ) {
			$validated['admin_menu'] = array();

			// Validate background color.
			if ( isset( $input['admin_menu']['bg_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_menu']['bg_color'] );
				if ( ! $color ) {
					$errors['admin_menu_bg_color'] = __( 'Invalid admin menu background color format.', 'modern-admin-styler' );
				} else {
					$validated['admin_menu']['bg_color'] = $color;
				}
			}

			// Validate text color.
			if ( isset( $input['admin_menu']['text_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_menu']['text_color'] );
				if ( ! $color ) {
					$errors['admin_menu_text_color'] = __( 'Invalid admin menu text color format.', 'modern-admin-styler' );
				} else {
					$validated['admin_menu']['text_color'] = $color;
				}
			}

			// Validate hover background color.
			if ( isset( $input['admin_menu']['hover_bg_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_menu']['hover_bg_color'] );
				if ( ! $color ) {
					$errors['admin_menu_hover_bg_color'] = __( 'Invalid admin menu hover background color format.', 'modern-admin-styler' );
				} else {
					$validated['admin_menu']['hover_bg_color'] = $color;
				}
			}

			// Validate hover text color.
			if ( isset( $input['admin_menu']['hover_text_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_menu']['hover_text_color'] );
				if ( ! $color ) {
					$errors['admin_menu_hover_text_color'] = __( 'Invalid admin menu hover text color format.', 'modern-admin-styler' );
				} else {
					$validated['admin_menu']['hover_text_color'] = $color;
				}
			}

			// Validate width.
			if ( isset( $input['admin_menu']['width'] ) ) {
				$width = absint( $input['admin_menu']['width'] );
				if ( $width < 0 || $width > 500 ) {
					$errors['admin_menu_width'] = __( 'Admin menu width must be between 0 and 500 pixels.', 'modern-admin-styler' );
				} else {
					$validated['admin_menu']['width'] = $width;
				}
			}
		}

		// Validate performance settings.
		if ( isset( $input['performance'] ) ) {
			$validated['performance'] = array();

			// Validate minification setting.
			if ( isset( $input['performance']['enable_minification'] ) ) {
				$validated['performance']['enable_minification'] = (bool) $input['performance']['enable_minification'];
			}

			// Validate cache duration.
			if ( isset( $input['performance']['cache_duration'] ) ) {
				$duration = absint( $input['performance']['cache_duration'] );
				if ( $duration < 300 || $duration > 86400 ) {
					$errors['cache_duration'] = __( 'Cache duration must be between 300 and 86400 seconds (5 minutes to 24 hours).', 'modern-admin-styler' );
				} else {
					$validated['performance']['cache_duration'] = $duration;
				}
			}
		}

		// Return errors if validation failed.
		if ( ! empty( $errors ) ) {
			return new WP_Error( 'validation_failed', __( 'Settings validation failed.', 'modern-admin-styler' ), $errors );
		}

		return $validated;
	}

	/**
	 * Reset settings to defaults.
	 *
	 * Used when settings are corrupted or need to be reset.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True on success, false on failure.
	 */
	public function reset_to_defaults() {
		return update_option( self::OPTION_NAME, $this->get_defaults() );
	}

	/**
	 * Initialize default settings on plugin activation.
	 *
	 * Only creates settings if they don't already exist.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if settings were created, false if they already exist.
	 */
	public function initialize_defaults() {
		// Check if settings already exist.
		$existing = get_option( self::OPTION_NAME );

		if ( false === $existing ) {
			// Settings don't exist, create them.
			return add_option( self::OPTION_NAME, $this->get_defaults(), '', 'no' );
		}

		return false;
	}
}
