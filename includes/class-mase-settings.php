<?php
/**
 * MASE Settings Management Class
 *
 * Handles settings storage, retrieval, validation, and defaults.
 *
 * @package Modern_Admin_Styler_Enterprise
 * @since 1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class MASE_Settings
 *
 * Centralized settings management with validation and defaults.
 */
class MASE_Settings {

	/**
	 * WordPress option name for storing settings.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'mase_settings';

	/**
	 * Get option value.
	 *
	 * @param string|null $key     Optional. Specific setting key to retrieve.
	 * @param mixed       $default Optional. Default value if key not found.
	 * @return mixed Setting value or full settings array.
	 */
	public function get_option( $key = null, $default = null ) {
		$settings = get_option( self::OPTION_NAME, $this->get_defaults() );

		if ( null === $key ) {
			return $settings;
		}

		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}

	/**
	 * Update option value.
	 *
	 * @param array $data Settings data to save.
	 * @return bool True on success, false on failure.
	 */
	public function update_option( $data ) {
		$validated = $this->validate( $data );
		
		if ( is_wp_error( $validated ) ) {
			return false;
		}

		return update_option( self::OPTION_NAME, $validated );
	}

	/**
	 * Get default settings.
	 *
	 * @return array Default settings array.
	 */
	public function get_defaults() {
		return array(
			'admin_bar'   => array(
				'bg_color'    => '#23282d',
				'text_color'  => '#ffffff',
				'height'      => 32,
			),
			'admin_menu'  => array(
				'bg_color'          => '#23282d',
				'text_color'        => '#ffffff',
				'hover_bg_color'    => '#191e23',
				'hover_text_color'  => '#00b9eb',
				'width'             => 160,
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
	 * @param array $input Input data to validate.
	 * @return array|WP_Error Validated data or WP_Error on failure.
	 */
	public function validate( $input ) {
		$validated = array();
		$errors    = array();

		// Validate admin bar settings.
		if ( isset( $input['admin_bar'] ) ) {
			$validated['admin_bar'] = array();

			if ( isset( $input['admin_bar']['bg_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_bar']['bg_color'] );
				if ( $color ) {
					$validated['admin_bar']['bg_color'] = $color;
				} else {
					$errors['admin_bar_bg_color'] = 'Invalid hex color format';
				}
			}

			if ( isset( $input['admin_bar']['text_color'] ) ) {
				$color = sanitize_hex_color( $input['admin_bar']['text_color'] );
				if ( $color ) {
					$validated['admin_bar']['text_color'] = $color;
				} else {
					$errors['admin_bar_text_color'] = 'Invalid hex color format';
				}
			}

			if ( isset( $input['admin_bar']['height'] ) ) {
				$height = absint( $input['admin_bar']['height'] );
				if ( $height >= 0 && $height <= 500 ) {
					$validated['admin_bar']['height'] = $height;
				} else {
					$errors['admin_bar_height'] = 'Height must be between 0 and 500';
				}
			}
		}

		// Validate admin menu settings.
		if ( isset( $input['admin_menu'] ) ) {
			$validated['admin_menu'] = array();

			$color_fields = array( 'bg_color', 'text_color', 'hover_bg_color', 'hover_text_color' );
			foreach ( $color_fields as $field ) {
				if ( isset( $input['admin_menu'][ $field ] ) ) {
					$color = sanitize_hex_color( $input['admin_menu'][ $field ] );
					if ( $color ) {
						$validated['admin_menu'][ $field ] = $color;
					} else {
						$errors[ 'admin_menu_' . $field ] = 'Invalid hex color format';
					}
				}
			}

			if ( isset( $input['admin_menu']['width'] ) ) {
				$width = absint( $input['admin_menu']['width'] );
				if ( $width >= 0 && $width <= 500 ) {
					$validated['admin_menu']['width'] = $width;
				} else {
					$errors['admin_menu_width'] = 'Width must be between 0 and 500';
				}
			}
		}

		// Validate performance settings.
		if ( isset( $input['performance'] ) ) {
			$validated['performance'] = array();

			if ( isset( $input['performance']['enable_minification'] ) ) {
				$validated['performance']['enable_minification'] = (bool) $input['performance']['enable_minification'];
			}

			if ( isset( $input['performance']['cache_duration'] ) ) {
				$duration = absint( $input['performance']['cache_duration'] );
				if ( $duration >= 300 && $duration <= 86400 ) {
					$validated['performance']['cache_duration'] = $duration;
				} else {
					$errors['cache_duration'] = 'Cache duration must be between 300 and 86400 seconds';
				}
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error( 'validation_failed', 'Validation failed', $errors );
		}

		// Merge with defaults to ensure all keys exist.
		return array_merge( $this->get_defaults(), $validated );
	}

	/**
	 * Reset settings to defaults.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function reset_to_defaults() {
		return update_option( self::OPTION_NAME, $this->get_defaults() );
	}

	/**
	 * Initialize default settings on plugin activation.
	 *
	 * Only sets defaults if settings don't already exist.
	 *
	 * @return bool True if defaults were set, false if settings already exist.
	 */
	public function initialize_defaults() {
		$existing = get_option( self::OPTION_NAME );
		
		if ( false === $existing ) {
			return update_option( self::OPTION_NAME, $this->get_defaults() );
		}
		
		return false;
	}

	/**
	 * Get default color palettes.
	 *
	 * @return array Array of color palettes.
	 */
	public function get_default_palettes() {
		return array(
			'default'           => array(
				'name'       => 'WordPress Default',
				'admin_bar'  => array(
					'bg_color'   => '#23282d',
					'text_color' => '#ffffff',
				),
				'admin_menu' => array(
					'bg_color'          => '#23282d',
					'text_color'        => '#ffffff',
					'hover_bg_color'    => '#191e23',
					'hover_text_color'  => '#00b9eb',
				),
			),
			'professional_blue' => array(
				'name'       => 'Professional Blue',
				'admin_bar'  => array(
					'bg_color'   => '#3B82F6',
					'text_color' => '#ffffff',
				),
				'admin_menu' => array(
					'bg_color'          => '#1E40AF',
					'text_color'        => '#ffffff',
					'hover_bg_color'    => '#1D4ED8',
					'hover_text_color'  => '#E0E7FF',
				),
			),
			'creative_purple'   => array(
				'name'       => 'Creative Purple',
				'admin_bar'  => array(
					'bg_color'   => '#8B5CF6',
					'text_color' => '#ffffff',
				),
				'admin_menu' => array(
					'bg_color'          => '#7C3AED',
					'text_color'        => '#ffffff',
					'hover_bg_color'    => '#8B5CF6',
					'hover_text_color'  => '#EDE9FE',
				),
			),
			'energetic_green'   => array(
				'name'       => 'Energetic Green',
				'admin_bar'  => array(
					'bg_color'   => '#10B981',
					'text_color' => '#ffffff',
				),
				'admin_menu' => array(
					'bg_color'          => '#059669',
					'text_color'        => '#ffffff',
					'hover_bg_color'    => '#10B981',
					'hover_text_color'  => '#D1FAE5',
				),
			),
			'warm_orange'       => array(
				'name'       => 'Warm Orange',
				'admin_bar'  => array(
					'bg_color'   => '#F97316',
					'text_color' => '#ffffff',
				),
				'admin_menu' => array(
					'bg_color'          => '#EA580C',
					'text_color'        => '#ffffff',
					'hover_bg_color'    => '#F97316',
					'hover_text_color'  => '#FED7AA',
				),
			),
		);
	}

	/**
	 * Apply a color palette.
	 *
	 * @param string $palette_id Palette ID to apply.
	 * @return bool True on success, false on failure.
	 */
	public function apply_palette( $palette_id ) {
		$palettes = $this->get_default_palettes();

		if ( ! isset( $palettes[ $palette_id ] ) ) {
			return false;
		}

		$palette          = $palettes[ $palette_id ];
		$current_settings = $this->get_option();

		// Apply palette colors to current settings.
		$current_settings['admin_bar']  = array_merge(
			$current_settings['admin_bar'],
			$palette['admin_bar']
		);
		$current_settings['admin_menu'] = array_merge(
			$current_settings['admin_menu'],
			$palette['admin_menu']
		);

		return $this->update_option( $current_settings );
	}
}
