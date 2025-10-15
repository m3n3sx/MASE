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
	 * Current plugin version for migration tracking.
	 *
	 * @var string
	 */
	const PLUGIN_VERSION = '1.2.0';

	/**
	 * Option name for storing plugin version.
	 *
	 * @var string
	 */
	const VERSION_OPTION_NAME = 'mase_version';

	/**
	 * Get option value.
	 *
	 * Retrieves settings from WordPress options table and merges with defaults
	 * to ensure completeness (Requirement 16.3).
	 *
	 * @param string|null $key     Optional. Specific setting key to retrieve.
	 * @param mixed       $default Optional. Default value if key not found.
	 * @return mixed Setting value or full settings array.
	 */
	public function get_option( $key = null, $default = null ) {
		$defaults = $this->get_defaults();
		$settings = get_option( self::OPTION_NAME, array() );

		// Merge with defaults to ensure all keys exist (Requirement 16.3).
		$settings = $this->array_merge_recursive_distinct( $defaults, $settings );

		if ( null === $key ) {
			return $settings;
		}

		return isset( $settings[ $key ] ) ? $settings[ $key ] : $default;
	}

	/**
	 * Recursively merge arrays, with values from the second array taking precedence.
	 *
	 * Unlike array_merge_recursive, this function does not convert values to arrays
	 * when keys are duplicated. Instead, values from $array2 overwrite values from $array1.
	 *
	 * @param array $array1 Base array with default values.
	 * @param array $array2 Array with user values that override defaults.
	 * @return array Merged array.
	 */
	private function array_merge_recursive_distinct( array $array1, array $array2 ) {
		$merged = $array1;

		foreach ( $array2 as $key => $value ) {
			if ( is_array( $value ) && isset( $merged[ $key ] ) && is_array( $merged[ $key ] ) ) {
				$merged[ $key ] = $this->array_merge_recursive_distinct( $merged[ $key ], $value );
			} else {
				$merged[ $key ] = $value;
			}
		}

		return $merged;
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
			'typography'  => array(
				'admin_bar'  => array(
					'font_size'      => 13,
					'font_weight'    => 400,
					'line_height'    => 1.5,
					'letter_spacing' => 0,
					'text_transform' => 'none',
				),
				'admin_menu' => array(
					'font_size'      => 13,
					'font_weight'    => 400,
					'line_height'    => 1.5,
					'letter_spacing' => 0,
					'text_transform' => 'none',
				),
				'content'    => array(
					'font_size'      => 13,
					'font_weight'    => 400,
					'line_height'    => 1.6,
					'letter_spacing' => 0,
					'text_transform' => 'none',
				),
			),
			'visual_effects' => array(
				'admin_bar' => array(
					'border_radius'    => 0,
					'shadow_intensity' => 'none',
					'shadow_direction' => 'bottom',
					'shadow_blur'      => 10,
					'shadow_color'     => 'rgba(0, 0, 0, 0.15)',
				),
				'admin_menu' => array(
					'border_radius'    => 0,
					'shadow_intensity' => 'none',
					'shadow_direction' => 'bottom',
					'shadow_blur'      => 10,
					'shadow_color'     => 'rgba(0, 0, 0, 0.15)',
				),
				'buttons' => array(
					'border_radius'    => 3,
					'shadow_intensity' => 'subtle',
					'shadow_direction' => 'bottom',
					'shadow_blur'      => 8,
					'shadow_color'     => 'rgba(0, 0, 0, 0.1)',
				),
				'form_fields' => array(
					'border_radius'    => 3,
					'shadow_intensity' => 'none',
					'shadow_direction' => 'bottom',
					'shadow_blur'      => 5,
					'shadow_color'     => 'rgba(0, 0, 0, 0.05)',
				),
				'preset' => 'flat',
				'disable_mobile_shadows' => false,
				'auto_detect_low_power' => true,
			),
			'spacing' => array(
				'menu_padding' => array(
					'top'    => 10,
					'right'  => 15,
					'bottom' => 10,
					'left'   => 15,
					'unit'   => 'px',
				),
				'menu_margin' => array(
					'top'    => 2,
					'right'  => 0,
					'bottom' => 2,
					'left'   => 0,
					'unit'   => 'px',
				),
				'admin_bar_padding' => array(
					'top'    => 0,
					'right'  => 10,
					'bottom' => 0,
					'left'   => 10,
					'unit'   => 'px',
				),
				'submenu_spacing' => array(
					'padding_top'    => 8,
					'padding_right'  => 12,
					'padding_bottom' => 8,
					'padding_left'   => 12,
					'margin_top'     => 0,
					'offset_left'    => 0,
					'unit'           => 'px',
				),
				'content_margin' => array(
					'top'    => 20,
					'right'  => 20,
					'bottom' => 20,
					'left'   => 20,
					'unit'   => 'px',
				),
				'mobile_overrides' => array(
					'enabled' => false,
					'menu_padding' => array(
						'top'    => 8,
						'right'  => 12,
						'bottom' => 8,
						'left'   => 12,
						'unit'   => 'px',
					),
					'admin_bar_padding' => array(
						'top'    => 0,
						'right'  => 8,
						'bottom' => 0,
						'left'   => 8,
						'unit'   => 'px',
					),
				),
				'preset' => 'default',
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

		// Validate typography settings.
		if ( isset( $input['typography'] ) ) {
			$typography_result = $this->validate_typography( $input['typography'] );
			if ( is_wp_error( $typography_result ) ) {
				$errors = array_merge( $errors, $typography_result->get_error_data() );
			} else {
				$validated['typography'] = $typography_result;
			}
		}

		// Validate visual effects settings.
		if ( isset( $input['visual_effects'] ) ) {
			$visual_effects_result = $this->validate_visual_effects( $input['visual_effects'] );
			if ( is_wp_error( $visual_effects_result ) ) {
				$errors = array_merge( $errors, $visual_effects_result->get_error_data() );
			} else {
				$validated['visual_effects'] = $visual_effects_result;
			}
		}

		// Validate spacing settings.
		if ( isset( $input['spacing'] ) ) {
			$spacing_result = $this->validate_spacing( $input['spacing'] );
			if ( is_wp_error( $spacing_result ) ) {
				$errors = array_merge( $errors, $spacing_result->get_error_data() );
			} else {
				$validated['spacing'] = $spacing_result;
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error( 'validation_failed', 'Validation failed', $errors );
		}

		// Merge with defaults to ensure all keys exist.
		return array_merge( $this->get_defaults(), $validated );
	}

	/**
	 * Validate typography settings.
	 *
	 * @param array $typography Typography settings to validate.
	 * @return array|WP_Error Validated typography data or WP_Error on failure.
	 */
	private function validate_typography( $typography ) {
		$validated = array();
		$errors    = array();

		$elements = array( 'admin_bar', 'admin_menu', 'content' );

		foreach ( $elements as $element ) {
			if ( ! isset( $typography[ $element ] ) ) {
				continue;
			}

			$validated[ $element ] = array();
			$element_data          = $typography[ $element ];

			// Validate font_size (10-32px).
			if ( isset( $element_data['font_size'] ) ) {
				$font_size = absint( $element_data['font_size'] );
				if ( $font_size >= 10 && $font_size <= 32 ) {
					$validated[ $element ]['font_size'] = $font_size;
				} else {
					$errors[ 'typography_' . $element . '_font_size' ] = 'Font size must be between 10 and 32 pixels';
				}
			}

			// Validate font_weight (300, 400, 500, 600, 700).
			if ( isset( $element_data['font_weight'] ) ) {
				$font_weight     = absint( $element_data['font_weight'] );
				$allowed_weights = array( 300, 400, 500, 600, 700 );
				if ( in_array( $font_weight, $allowed_weights, true ) ) {
					$validated[ $element ]['font_weight'] = $font_weight;
				} else {
					$errors[ 'typography_' . $element . '_font_weight' ] = 'Font weight must be 300, 400, 500, 600, or 700';
				}
			}

			// Validate line_height (1.0-2.5).
			if ( isset( $element_data['line_height'] ) ) {
				$line_height = floatval( $element_data['line_height'] );
				if ( $line_height >= 1.0 && $line_height <= 2.5 ) {
					$validated[ $element ]['line_height'] = round( $line_height, 1 );
				} else {
					$errors[ 'typography_' . $element . '_line_height' ] = 'Line height must be between 1.0 and 2.5';
				}
			}

			// Validate letter_spacing (-2 to 5px).
			if ( isset( $element_data['letter_spacing'] ) ) {
				$letter_spacing = intval( $element_data['letter_spacing'] );
				if ( $letter_spacing >= -2 && $letter_spacing <= 5 ) {
					$validated[ $element ]['letter_spacing'] = $letter_spacing;
				} else {
					$errors[ 'typography_' . $element . '_letter_spacing' ] = 'Letter spacing must be between -2 and 5 pixels';
				}
			}

			// Validate text_transform (none, uppercase, lowercase, capitalize).
			if ( isset( $element_data['text_transform'] ) ) {
				$text_transform      = strtolower( sanitize_text_field( $element_data['text_transform'] ) );
				$allowed_transforms  = array( 'none', 'uppercase', 'lowercase', 'capitalize' );
				if ( in_array( $text_transform, $allowed_transforms, true ) ) {
					$validated[ $element ]['text_transform'] = $text_transform;
				} else {
					$errors[ 'typography_' . $element . '_text_transform' ] = 'Text transform must be none, uppercase, lowercase, or capitalize';
				}
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error( 'typography_validation_failed', 'Typography validation failed', $errors );
		}

		return $validated;
	}

	/**
	 * Validate visual effects settings.
	 *
	 * @param array $visual_effects Visual effects settings to validate.
	 * @return array|WP_Error Validated visual effects data or WP_Error on failure.
	 */
	private function validate_visual_effects( $visual_effects ) {
		$validated = array();
		$errors    = array();

		$elements = array( 'admin_bar', 'admin_menu', 'buttons', 'form_fields' );

		foreach ( $elements as $element ) {
			if ( ! isset( $visual_effects[ $element ] ) ) {
				continue;
			}

			$validated[ $element ] = array();
			$element_data          = $visual_effects[ $element ];

			// Validate border_radius (0-30px).
			if ( isset( $element_data['border_radius'] ) ) {
				$border_radius = absint( $element_data['border_radius'] );
				if ( $border_radius >= 0 && $border_radius <= 30 ) {
					$validated[ $element ]['border_radius'] = $border_radius;
				} else {
					$errors[ 've_' . $element . '_border_radius' ] = 'Border radius must be between 0 and 30 pixels';
				}
			}

			// Validate shadow_intensity (none, subtle, medium, strong).
			if ( isset( $element_data['shadow_intensity'] ) ) {
				$shadow_intensity    = strtolower( sanitize_text_field( $element_data['shadow_intensity'] ) );
				$allowed_intensities = array( 'none', 'subtle', 'medium', 'strong' );
				if ( in_array( $shadow_intensity, $allowed_intensities, true ) ) {
					$validated[ $element ]['shadow_intensity'] = $shadow_intensity;
				} else {
					$errors[ 've_' . $element . '_shadow_intensity' ] = 'Shadow intensity must be none, subtle, medium, or strong';
				}
			}

			// Validate shadow_direction (top, right, bottom, left, center).
			if ( isset( $element_data['shadow_direction'] ) ) {
				$shadow_direction    = strtolower( sanitize_text_field( $element_data['shadow_direction'] ) );
				$allowed_directions  = array( 'top', 'right', 'bottom', 'left', 'center' );
				if ( in_array( $shadow_direction, $allowed_directions, true ) ) {
					$validated[ $element ]['shadow_direction'] = $shadow_direction;
				} else {
					$errors[ 've_' . $element . '_shadow_direction' ] = 'Shadow direction must be top, right, bottom, left, or center';
				}
			}

			// Validate shadow_blur (0-30px).
			if ( isset( $element_data['shadow_blur'] ) ) {
				$shadow_blur = absint( $element_data['shadow_blur'] );
				if ( $shadow_blur >= 0 && $shadow_blur <= 30 ) {
					$validated[ $element ]['shadow_blur'] = $shadow_blur;
				} else {
					$errors[ 've_' . $element . '_shadow_blur' ] = 'Shadow blur must be between 0 and 30 pixels';
				}
			}

			// Validate shadow_color (rgba or hex format).
			if ( isset( $element_data['shadow_color'] ) ) {
				$shadow_color = sanitize_text_field( $element_data['shadow_color'] );
				// Check for valid rgba or hex color format.
				if ( preg_match( '/^(rgba?\([^)]+\)|#[0-9a-f]{3,8})$/i', $shadow_color ) ) {
					$validated[ $element ]['shadow_color'] = $shadow_color;
				} else {
					$errors[ 've_' . $element . '_shadow_color' ] = 'Invalid shadow color format. Use rgba() or hex format';
				}
			}
		}

		// Validate preset.
		if ( isset( $visual_effects['preset'] ) ) {
			$preset          = strtolower( sanitize_text_field( $visual_effects['preset'] ) );
			$allowed_presets = array( 'flat', 'subtle', 'elevated', 'floating', 'custom' );
			if ( in_array( $preset, $allowed_presets, true ) ) {
				$validated['preset'] = $preset;
			} else {
				$errors['ve_preset'] = 'Preset must be flat, subtle, elevated, floating, or custom';
			}
		}

		// Validate disable_mobile_shadows (Requirement 9.5, 16.2).
		if ( isset( $visual_effects['disable_mobile_shadows'] ) ) {
			$validated['disable_mobile_shadows'] = (bool) $visual_effects['disable_mobile_shadows'];
		}

		// Validate auto_detect_low_power (Requirement 16.1).
		if ( isset( $visual_effects['auto_detect_low_power'] ) ) {
			$validated['auto_detect_low_power'] = (bool) $visual_effects['auto_detect_low_power'];
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error( 'visual_effects_validation_failed', 'Visual effects validation failed', $errors );
		}

		return $validated;
	}

	/**
	 * Get spacing preset definitions.
	 *
	 * Defines four spacing presets: compact, default, comfortable, and spacious.
	 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
	 *
	 * @return array Spacing presets with values for all spacing controls.
	 */
	public function get_spacing_presets() {
		return array(
			'compact' => array(
				'menu_padding' => array(
					'top'    => 6,
					'right'  => 10,
					'bottom' => 6,
					'left'   => 10,
				),
				'menu_margin' => array(
					'top'    => 1,
					'right'  => 0,
					'bottom' => 1,
					'left'   => 0,
				),
				'admin_bar_padding' => array(
					'top'    => 0,
					'right'  => 8,
					'bottom' => 0,
					'left'   => 8,
				),
				'submenu_spacing' => array(
					'padding_top'    => 6,
					'padding_right'  => 10,
					'padding_bottom' => 6,
					'padding_left'   => 10,
					'margin_top'     => 0,
					'offset_left'    => 0,
				),
				'content_margin' => array(
					'top'    => 15,
					'right'  => 15,
					'bottom' => 15,
					'left'   => 15,
				),
			),
			'default' => array(
				'menu_padding' => array(
					'top'    => 10,
					'right'  => 15,
					'bottom' => 10,
					'left'   => 15,
				),
				'menu_margin' => array(
					'top'    => 2,
					'right'  => 0,
					'bottom' => 2,
					'left'   => 0,
				),
				'admin_bar_padding' => array(
					'top'    => 0,
					'right'  => 10,
					'bottom' => 0,
					'left'   => 10,
				),
				'submenu_spacing' => array(
					'padding_top'    => 8,
					'padding_right'  => 12,
					'padding_bottom' => 8,
					'padding_left'   => 12,
					'margin_top'     => 0,
					'offset_left'    => 0,
				),
				'content_margin' => array(
					'top'    => 20,
					'right'  => 20,
					'bottom' => 20,
					'left'   => 20,
				),
			),
			'comfortable' => array(
				'menu_padding' => array(
					'top'    => 12,
					'right'  => 18,
					'bottom' => 12,
					'left'   => 18,
				),
				'menu_margin' => array(
					'top'    => 3,
					'right'  => 0,
					'bottom' => 3,
					'left'   => 0,
				),
				'admin_bar_padding' => array(
					'top'    => 0,
					'right'  => 12,
					'bottom' => 0,
					'left'   => 12,
				),
				'submenu_spacing' => array(
					'padding_top'    => 10,
					'padding_right'  => 14,
					'padding_bottom' => 10,
					'padding_left'   => 14,
					'margin_top'     => 2,
					'offset_left'    => 0,
				),
				'content_margin' => array(
					'top'    => 25,
					'right'  => 25,
					'bottom' => 25,
					'left'   => 25,
				),
			),
			'spacious' => array(
				'menu_padding' => array(
					'top'    => 16,
					'right'  => 24,
					'bottom' => 16,
					'left'   => 24,
				),
				'menu_margin' => array(
					'top'    => 4,
					'right'  => 0,
					'bottom' => 4,
					'left'   => 0,
				),
				'admin_bar_padding' => array(
					'top'    => 0,
					'right'  => 15,
					'bottom' => 0,
					'left'   => 15,
				),
				'submenu_spacing' => array(
					'padding_top'    => 12,
					'padding_right'  => 16,
					'padding_bottom' => 12,
					'padding_left'   => 16,
					'margin_top'     => 4,
					'offset_left'    => 0,
				),
				'content_margin' => array(
					'top'    => 30,
					'right'  => 30,
					'bottom' => 30,
					'left'   => 30,
				),
			),
		);
	}

	/**
	 * Apply a spacing preset to current settings.
	 *
	 * Retrieves preset values and applies them to all spacing settings.
	 * Requirements: 7.6, 7.7
	 *
	 * @param string $preset_name Preset name (compact, default, comfortable, spacious).
	 * @return array|false Updated settings array on success, false on invalid preset.
	 */
	public function apply_spacing_preset( $preset_name ) {
		$presets = $this->get_spacing_presets();

		// Validate preset name.
		if ( ! isset( $presets[ $preset_name ] ) ) {
			return false;
		}

		$preset_values    = $presets[ $preset_name ];
		$current_settings = $this->get_option();

		// Ensure spacing array exists.
		if ( ! isset( $current_settings['spacing'] ) ) {
			$current_settings['spacing'] = array();
		}

		// Apply preset values to all spacing settings.
		foreach ( $preset_values as $key => $values ) {
			if ( ! isset( $current_settings['spacing'][ $key ] ) ) {
				$current_settings['spacing'][ $key ] = array();
			}

			// Merge preset values with existing structure (preserving unit if set).
			foreach ( $values as $prop => $value ) {
				$current_settings['spacing'][ $key ][ $prop ] = $value;
			}

			// Ensure unit is set (default to px if not present).
			if ( ! isset( $current_settings['spacing'][ $key ]['unit'] ) ) {
				$current_settings['spacing'][ $key ]['unit'] = 'px';
			}
		}

		// Update preset field to selected preset name.
		$current_settings['spacing']['preset'] = $preset_name;

		return $current_settings;
	}

	/**
	 * Convert spacing value between px and rem units.
	 *
	 * Converts spacing values between pixels and rem units using a base font size.
	 * Requirements: 6.1, 6.2, 6.3, 6.4
	 *
	 * @param float  $value          Value to convert.
	 * @param string $from_unit      Source unit (px or rem).
	 * @param string $to_unit        Target unit (px or rem).
	 * @param int    $base_font_size Base font size in pixels (default 16).
	 * @return float Converted value.
	 */
	private function convert_spacing_unit( $value, $from_unit, $to_unit, $base_font_size = 16 ) {
		// No conversion needed if units are the same.
		if ( $from_unit === $to_unit ) {
			return $value;
		}

		// Convert px to rem.
		if ( 'px' === $from_unit && 'rem' === $to_unit ) {
			return round( $value / $base_font_size, 3 );
		}

		// Convert rem to px.
		if ( 'rem' === $from_unit && 'px' === $to_unit ) {
			return round( $value * $base_font_size );
		}

		// Return original value if conversion not supported.
		return $value;
	}

	/**
	 * Convert all spacing values to a target unit.
	 *
	 * Iterates through all spacing settings and converts values to the target unit.
	 * Requirements: 6.5
	 *
	 * @param array  $spacing    Spacing settings array.
	 * @param string $target_unit Target unit (px or rem).
	 * @return array Spacing settings with converted values.
	 */
	public function convert_all_spacing_units( $spacing, $target_unit ) {
		// Validate target unit.
		if ( ! in_array( $target_unit, array( 'px', 'rem' ), true ) ) {
			return $spacing;
		}

		// Define spacing sections to convert.
		$sections = array(
			'menu_padding',
			'menu_margin',
			'admin_bar_padding',
			'submenu_spacing',
			'content_margin',
		);

		// Convert each section.
		foreach ( $sections as $section ) {
			if ( ! isset( $spacing[ $section ] ) || ! is_array( $spacing[ $section ] ) ) {
				continue;
			}

			// Get current unit for this section.
			$current_unit = isset( $spacing[ $section ]['unit'] ) ? $spacing[ $section ]['unit'] : 'px';

			// Skip if already in target unit.
			if ( $current_unit === $target_unit ) {
				continue;
			}

			// Convert each numeric value in the section.
			foreach ( $spacing[ $section ] as $key => $value ) {
				// Skip non-numeric values (like 'unit' field).
				if ( 'unit' === $key || ! is_numeric( $value ) ) {
					continue;
				}

				// Convert the value.
				$spacing[ $section ][ $key ] = $this->convert_spacing_unit(
					$value,
					$current_unit,
					$target_unit
				);
			}

			// Update unit field.
			$spacing[ $section ]['unit'] = $target_unit;
		}

		// Handle mobile overrides if enabled.
		if ( isset( $spacing['mobile_overrides']['enabled'] ) && $spacing['mobile_overrides']['enabled'] ) {
			$mobile_sections = array( 'menu_padding', 'admin_bar_padding' );

			foreach ( $mobile_sections as $section ) {
				if ( ! isset( $spacing['mobile_overrides'][ $section ] ) ) {
					continue;
				}

				$current_unit = isset( $spacing['mobile_overrides'][ $section ]['unit'] ) ?
					$spacing['mobile_overrides'][ $section ]['unit'] : 'px';

				if ( $current_unit === $target_unit ) {
					continue;
				}

				foreach ( $spacing['mobile_overrides'][ $section ] as $key => $value ) {
					if ( 'unit' === $key || ! is_numeric( $value ) ) {
						continue;
					}

					$spacing['mobile_overrides'][ $section ][ $key ] = $this->convert_spacing_unit(
						$value,
						$current_unit,
						$target_unit
					);
				}

				$spacing['mobile_overrides'][ $section ]['unit'] = $target_unit;
			}
		}

		return $spacing;
	}

	/**
	 * Validate spacing settings.
	 *
	 * Validates all spacing values against defined constraints and returns
	 * specific error messages for invalid fields.
	 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
	 *
	 * @param array $spacing Spacing settings to validate.
	 * @return array|WP_Error Validated spacing data or WP_Error with field errors.
	 */
	private function validate_spacing( $spacing ) {
		$validated = array();
		$errors    = array();

		// Validate menu padding (0-50px range).
		if ( isset( $spacing['menu_padding'] ) && is_array( $spacing['menu_padding'] ) ) {
			$validated['menu_padding'] = array();
			$sides = array( 'top', 'right', 'bottom', 'left' );

			foreach ( $sides as $side ) {
				if ( isset( $spacing['menu_padding'][ $side ] ) ) {
					$value = floatval( $spacing['menu_padding'][ $side ] );
					$unit  = isset( $spacing['menu_padding']['unit'] ) ? $spacing['menu_padding']['unit'] : 'px';

					// Validate based on unit.
					if ( 'px' === $unit ) {
						if ( $value < 0 || $value > 50 ) {
							$errors[ 'menu_padding_' . $side ] = sprintf(
								'Menu padding %s must be between 0 and 50 pixels',
								$side
							);
						} else {
							$validated['menu_padding'][ $side ] = intval( $value );
						}
					} elseif ( 'rem' === $unit ) {
						if ( $value < 0 || $value > 5 ) {
							$errors[ 'menu_padding_' . $side ] = sprintf(
								'Menu padding %s must be between 0 and 5 rem',
								$side
							);
						} else {
							$validated['menu_padding'][ $side ] = round( $value, 3 );
						}
					}
				}
			}

			// Validate unit.
			if ( isset( $spacing['menu_padding']['unit'] ) ) {
				$unit = strtolower( sanitize_text_field( $spacing['menu_padding']['unit'] ) );
				if ( in_array( $unit, array( 'px', 'rem' ), true ) ) {
					$validated['menu_padding']['unit'] = $unit;
				} else {
					$errors['menu_padding_unit'] = 'Menu padding unit must be px or rem';
				}
			}
		}

		// Validate menu margin (-20 to 100px range).
		if ( isset( $spacing['menu_margin'] ) && is_array( $spacing['menu_margin'] ) ) {
			$validated['menu_margin'] = array();
			$sides = array( 'top', 'right', 'bottom', 'left' );

			foreach ( $sides as $side ) {
				if ( isset( $spacing['menu_margin'][ $side ] ) ) {
					$value = floatval( $spacing['menu_margin'][ $side ] );
					$unit  = isset( $spacing['menu_margin']['unit'] ) ? $spacing['menu_margin']['unit'] : 'px';

					// Validate based on unit.
					if ( 'px' === $unit ) {
						if ( $value < -20 || $value > 100 ) {
							$errors[ 'menu_margin_' . $side ] = sprintf(
								'Menu margin %s must be between -20 and 100 pixels',
								$side
							);
						} else {
							$validated['menu_margin'][ $side ] = intval( $value );
						}
					} elseif ( 'rem' === $unit ) {
						if ( $value < 0 || $value > 5 ) {
							$errors[ 'menu_margin_' . $side ] = sprintf(
								'Menu margin %s must be between 0 and 5 rem',
								$side
							);
						} else {
							$validated['menu_margin'][ $side ] = round( $value, 3 );
						}
					}
				}
			}

			// Validate unit.
			if ( isset( $spacing['menu_margin']['unit'] ) ) {
				$unit = strtolower( sanitize_text_field( $spacing['menu_margin']['unit'] ) );
				if ( in_array( $unit, array( 'px', 'rem' ), true ) ) {
					$validated['menu_margin']['unit'] = $unit;
				} else {
					$errors['menu_margin_unit'] = 'Menu margin unit must be px or rem';
				}
			}
		}

		// Validate admin bar padding (0-30px range).
		if ( isset( $spacing['admin_bar_padding'] ) && is_array( $spacing['admin_bar_padding'] ) ) {
			$validated['admin_bar_padding'] = array();
			$sides = array( 'top', 'right', 'bottom', 'left' );

			foreach ( $sides as $side ) {
				if ( isset( $spacing['admin_bar_padding'][ $side ] ) ) {
					$value = floatval( $spacing['admin_bar_padding'][ $side ] );
					$unit  = isset( $spacing['admin_bar_padding']['unit'] ) ? $spacing['admin_bar_padding']['unit'] : 'px';

					// Validate based on unit.
					if ( 'px' === $unit ) {
						if ( $value < 0 || $value > 30 ) {
							$errors[ 'admin_bar_padding_' . $side ] = sprintf(
								'Admin bar padding %s must be between 0 and 30 pixels',
								$side
							);
						} else {
							$validated['admin_bar_padding'][ $side ] = intval( $value );
						}
					} elseif ( 'rem' === $unit ) {
						if ( $value < 0 || $value > 5 ) {
							$errors[ 'admin_bar_padding_' . $side ] = sprintf(
								'Admin bar padding %s must be between 0 and 5 rem',
								$side
							);
						} else {
							$validated['admin_bar_padding'][ $side ] = round( $value, 3 );
						}
					}
				}
			}

			// Validate unit.
			if ( isset( $spacing['admin_bar_padding']['unit'] ) ) {
				$unit = strtolower( sanitize_text_field( $spacing['admin_bar_padding']['unit'] ) );
				if ( in_array( $unit, array( 'px', 'rem' ), true ) ) {
					$validated['admin_bar_padding']['unit'] = $unit;
				} else {
					$errors['admin_bar_padding_unit'] = 'Admin bar padding unit must be px or rem';
				}
			}
		}

		// Validate submenu spacing (0-30px padding, -50 to 50px offset).
		if ( isset( $spacing['submenu_spacing'] ) && is_array( $spacing['submenu_spacing'] ) ) {
			$validated['submenu_spacing'] = array();
			$padding_sides = array( 'padding_top', 'padding_right', 'padding_bottom', 'padding_left' );

			// Validate padding values (0-30px range).
			foreach ( $padding_sides as $side ) {
				if ( isset( $spacing['submenu_spacing'][ $side ] ) ) {
					$value = floatval( $spacing['submenu_spacing'][ $side ] );
					$unit  = isset( $spacing['submenu_spacing']['unit'] ) ? $spacing['submenu_spacing']['unit'] : 'px';

					// Validate based on unit.
					if ( 'px' === $unit ) {
						if ( $value < 0 || $value > 30 ) {
							$errors[ 'submenu_spacing_' . $side ] = sprintf(
								'Submenu %s must be between 0 and 30 pixels',
								str_replace( '_', ' ', $side )
							);
						} else {
							$validated['submenu_spacing'][ $side ] = intval( $value );
						}
					} elseif ( 'rem' === $unit ) {
						if ( $value < 0 || $value > 5 ) {
							$errors[ 'submenu_spacing_' . $side ] = sprintf(
								'Submenu %s must be between 0 and 5 rem',
								str_replace( '_', ' ', $side )
							);
						} else {
							$validated['submenu_spacing'][ $side ] = round( $value, 3 );
						}
					}
				}
			}

			// Validate margin_top.
			if ( isset( $spacing['submenu_spacing']['margin_top'] ) ) {
				$value = floatval( $spacing['submenu_spacing']['margin_top'] );
				$unit  = isset( $spacing['submenu_spacing']['unit'] ) ? $spacing['submenu_spacing']['unit'] : 'px';

				if ( 'px' === $unit ) {
					if ( $value < -10 || $value > 50 ) {
						$errors['submenu_spacing_margin_top'] = 'Submenu margin top must be between -10 and 50 pixels';
					} else {
						$validated['submenu_spacing']['margin_top'] = intval( $value );
					}
				} elseif ( 'rem' === $unit ) {
					if ( $value < 0 || $value > 5 ) {
						$errors['submenu_spacing_margin_top'] = 'Submenu margin top must be between 0 and 5 rem';
					} else {
						$validated['submenu_spacing']['margin_top'] = round( $value, 3 );
					}
				}
			}

			// Validate offset_left (-50 to 50px range).
			if ( isset( $spacing['submenu_spacing']['offset_left'] ) ) {
				$value = floatval( $spacing['submenu_spacing']['offset_left'] );
				$unit  = isset( $spacing['submenu_spacing']['unit'] ) ? $spacing['submenu_spacing']['unit'] : 'px';

				if ( 'px' === $unit ) {
					if ( $value < -50 || $value > 50 ) {
						$errors['submenu_spacing_offset_left'] = 'Submenu offset must be between -50 and 50 pixels';
					} else {
						$validated['submenu_spacing']['offset_left'] = intval( $value );
					}
				} elseif ( 'rem' === $unit ) {
					if ( $value < -5 || $value > 5 ) {
						$errors['submenu_spacing_offset_left'] = 'Submenu offset must be between -5 and 5 rem';
					} else {
						$validated['submenu_spacing']['offset_left'] = round( $value, 3 );
					}
				}
			}

			// Validate unit.
			if ( isset( $spacing['submenu_spacing']['unit'] ) ) {
				$unit = strtolower( sanitize_text_field( $spacing['submenu_spacing']['unit'] ) );
				if ( in_array( $unit, array( 'px', 'rem' ), true ) ) {
					$validated['submenu_spacing']['unit'] = $unit;
				} else {
					$errors['submenu_spacing_unit'] = 'Submenu spacing unit must be px or rem';
				}
			}
		}

		// Validate content margin (0-100px range).
		if ( isset( $spacing['content_margin'] ) && is_array( $spacing['content_margin'] ) ) {
			$validated['content_margin'] = array();
			$sides = array( 'top', 'right', 'bottom', 'left' );

			foreach ( $sides as $side ) {
				if ( isset( $spacing['content_margin'][ $side ] ) ) {
					$value = floatval( $spacing['content_margin'][ $side ] );
					$unit  = isset( $spacing['content_margin']['unit'] ) ? $spacing['content_margin']['unit'] : 'px';

					// Validate based on unit.
					if ( 'px' === $unit ) {
						if ( $value < 0 || $value > 100 ) {
							$errors[ 'content_margin_' . $side ] = sprintf(
								'Content margin %s must be between 0 and 100 pixels',
								$side
							);
						} else {
							$validated['content_margin'][ $side ] = intval( $value );
						}
					} elseif ( 'rem' === $unit ) {
						if ( $value < 0 || $value > 5 ) {
							$errors[ 'content_margin_' . $side ] = sprintf(
								'Content margin %s must be between 0 and 5 rem',
								$side
							);
						} else {
							$validated['content_margin'][ $side ] = round( $value, 3 );
						}
					}
				}
			}

			// Validate unit.
			if ( isset( $spacing['content_margin']['unit'] ) ) {
				$unit = strtolower( sanitize_text_field( $spacing['content_margin']['unit'] ) );
				if ( in_array( $unit, array( 'px', 'rem' ), true ) ) {
					$validated['content_margin']['unit'] = $unit;
				} else {
					$errors['content_margin_unit'] = 'Content margin unit must be px or rem';
				}
			}
		}

		// Validate mobile overrides if present.
		if ( isset( $spacing['mobile_overrides'] ) && is_array( $spacing['mobile_overrides'] ) ) {
			$validated['mobile_overrides'] = array();

			// Validate enabled flag.
			if ( isset( $spacing['mobile_overrides']['enabled'] ) ) {
				$validated['mobile_overrides']['enabled'] = (bool) $spacing['mobile_overrides']['enabled'];
			}

			// Validate mobile menu padding if enabled.
			if ( isset( $spacing['mobile_overrides']['menu_padding'] ) && is_array( $spacing['mobile_overrides']['menu_padding'] ) ) {
				$validated['mobile_overrides']['menu_padding'] = array();
				$sides = array( 'top', 'right', 'bottom', 'left' );

				foreach ( $sides as $side ) {
					if ( isset( $spacing['mobile_overrides']['menu_padding'][ $side ] ) ) {
						$value = floatval( $spacing['mobile_overrides']['menu_padding'][ $side ] );
						$unit  = isset( $spacing['mobile_overrides']['menu_padding']['unit'] ) ? $spacing['mobile_overrides']['menu_padding']['unit'] : 'px';

						if ( 'px' === $unit ) {
							if ( $value < 0 || $value > 50 ) {
								$errors[ 'mobile_menu_padding_' . $side ] = sprintf(
									'Mobile menu padding %s must be between 0 and 50 pixels',
									$side
								);
							} else {
								$validated['mobile_overrides']['menu_padding'][ $side ] = intval( $value );
							}
						} elseif ( 'rem' === $unit ) {
							if ( $value < 0 || $value > 5 ) {
								$errors[ 'mobile_menu_padding_' . $side ] = sprintf(
									'Mobile menu padding %s must be between 0 and 5 rem',
									$side
								);
							} else {
								$validated['mobile_overrides']['menu_padding'][ $side ] = round( $value, 3 );
							}
						}
					}
				}

				if ( isset( $spacing['mobile_overrides']['menu_padding']['unit'] ) ) {
					$unit = strtolower( sanitize_text_field( $spacing['mobile_overrides']['menu_padding']['unit'] ) );
					if ( in_array( $unit, array( 'px', 'rem' ), true ) ) {
						$validated['mobile_overrides']['menu_padding']['unit'] = $unit;
					}
				}
			}

			// Validate mobile admin bar padding if enabled.
			if ( isset( $spacing['mobile_overrides']['admin_bar_padding'] ) && is_array( $spacing['mobile_overrides']['admin_bar_padding'] ) ) {
				$validated['mobile_overrides']['admin_bar_padding'] = array();
				$sides = array( 'top', 'right', 'bottom', 'left' );

				foreach ( $sides as $side ) {
					if ( isset( $spacing['mobile_overrides']['admin_bar_padding'][ $side ] ) ) {
						$value = floatval( $spacing['mobile_overrides']['admin_bar_padding'][ $side ] );
						$unit  = isset( $spacing['mobile_overrides']['admin_bar_padding']['unit'] ) ? $spacing['mobile_overrides']['admin_bar_padding']['unit'] : 'px';

						if ( 'px' === $unit ) {
							if ( $value < 0 || $value > 30 ) {
								$errors[ 'mobile_admin_bar_padding_' . $side ] = sprintf(
									'Mobile admin bar padding %s must be between 0 and 30 pixels',
									$side
								);
							} else {
								$validated['mobile_overrides']['admin_bar_padding'][ $side ] = intval( $value );
							}
						} elseif ( 'rem' === $unit ) {
							if ( $value < 0 || $value > 5 ) {
								$errors[ 'mobile_admin_bar_padding_' . $side ] = sprintf(
									'Mobile admin bar padding %s must be between 0 and 5 rem',
									$side
								);
							} else {
								$validated['mobile_overrides']['admin_bar_padding'][ $side ] = round( $value, 3 );
							}
						}
					}
				}

				if ( isset( $spacing['mobile_overrides']['admin_bar_padding']['unit'] ) ) {
					$unit = strtolower( sanitize_text_field( $spacing['mobile_overrides']['admin_bar_padding']['unit'] ) );
					if ( in_array( $unit, array( 'px', 'rem' ), true ) ) {
						$validated['mobile_overrides']['admin_bar_padding']['unit'] = $unit;
					}
				}
			}
		}

		// Validate preset field.
		if ( isset( $spacing['preset'] ) ) {
			$preset = strtolower( sanitize_text_field( $spacing['preset'] ) );
			$allowed_presets = array( 'compact', 'default', 'comfortable', 'spacious', 'custom' );
			if ( in_array( $preset, $allowed_presets, true ) ) {
				$validated['preset'] = $preset;
			} else {
				$errors['preset'] = 'Invalid spacing preset';
			}
		}

		if ( ! empty( $errors ) ) {
			return new WP_Error( 'spacing_validation_failed', 'Spacing validation failed', $errors );
		}

		return $validated;
	}

	/**
	 * Generate accessibility validation warnings for spacing settings.
	 *
	 * Checks for potential accessibility issues without blocking save.
	 * Requirements: 20.1, 20.2, 20.6
	 *
	 * @param array $spacing Validated spacing settings.
	 * @return array Array of warning messages.
	 */
	public function get_spacing_accessibility_warnings( $spacing ) {
		$warnings = array();

		// Check menu padding for touch target size (minimum 44x44px).
		if ( isset( $spacing['menu_padding'] ) && is_array( $spacing['menu_padding'] ) ) {
			$unit = isset( $spacing['menu_padding']['unit'] ) ? $spacing['menu_padding']['unit'] : 'px';
			
			// Convert to px for comparison if needed.
			$top    = isset( $spacing['menu_padding']['top'] ) ? floatval( $spacing['menu_padding']['top'] ) : 0;
			$bottom = isset( $spacing['menu_padding']['bottom'] ) ? floatval( $spacing['menu_padding']['bottom'] ) : 0;
			
			if ( 'rem' === $unit ) {
				$top    = $top * 16;
				$bottom = $bottom * 16;
			}
			
			$total_vertical_padding = $top + $bottom;
			
			// Assuming base menu item height is ~20px, check if total height meets 44px minimum.
			$estimated_height = 20 + $total_vertical_padding;
			
			if ( $estimated_height < 44 ) {
				$warnings[] = sprintf(
					'Menu padding may create touch targets smaller than 44x44px (estimated height: %dpx). Consider increasing vertical padding for better mobile accessibility.',
					intval( $estimated_height )
				);
			}
		}

		// Check admin bar padding for touch target size.
		if ( isset( $spacing['admin_bar_padding'] ) && is_array( $spacing['admin_bar_padding'] ) ) {
			$unit = isset( $spacing['admin_bar_padding']['unit'] ) ? $spacing['admin_bar_padding']['unit'] : 'px';
			
			$top    = isset( $spacing['admin_bar_padding']['top'] ) ? floatval( $spacing['admin_bar_padding']['top'] ) : 0;
			$bottom = isset( $spacing['admin_bar_padding']['bottom'] ) ? floatval( $spacing['admin_bar_padding']['bottom'] ) : 0;
			
			if ( 'rem' === $unit ) {
				$top    = $top * 16;
				$bottom = $bottom * 16;
			}
			
			$total_vertical_padding = $top + $bottom;
			
			// Admin bar default height is 32px.
			$estimated_height = 32 + $total_vertical_padding;
			
			if ( $estimated_height < 44 ) {
				$warnings[] = sprintf(
					'Admin bar padding may create touch targets smaller than 44x44px (estimated height: %dpx). Consider increasing vertical padding for better mobile accessibility.',
					intval( $estimated_height )
				);
			}
		}

		// Check submenu padding for touch target size.
		if ( isset( $spacing['submenu_spacing'] ) && is_array( $spacing['submenu_spacing'] ) ) {
			$unit = isset( $spacing['submenu_spacing']['unit'] ) ? $spacing['submenu_spacing']['unit'] : 'px';
			
			$top    = isset( $spacing['submenu_spacing']['padding_top'] ) ? floatval( $spacing['submenu_spacing']['padding_top'] ) : 0;
			$bottom = isset( $spacing['submenu_spacing']['padding_bottom'] ) ? floatval( $spacing['submenu_spacing']['padding_bottom'] ) : 0;
			
			if ( 'rem' === $unit ) {
				$top    = $top * 16;
				$bottom = $bottom * 16;
			}
			
			$total_vertical_padding = $top + $bottom;
			
			// Assuming base submenu item height is ~18px.
			$estimated_height = 18 + $total_vertical_padding;
			
			if ( $estimated_height < 44 ) {
				$warnings[] = sprintf(
					'Submenu padding may create touch targets smaller than 44x44px (estimated height: %dpx). Consider increasing vertical padding for better mobile accessibility.',
					intval( $estimated_height )
				);
			}
		}

		// Check for negative margins that could create overlaps.
		if ( isset( $spacing['menu_margin'] ) && is_array( $spacing['menu_margin'] ) ) {
			$unit = isset( $spacing['menu_margin']['unit'] ) ? $spacing['menu_margin']['unit'] : 'px';
			
			$top    = isset( $spacing['menu_margin']['top'] ) ? floatval( $spacing['menu_margin']['top'] ) : 0;
			$bottom = isset( $spacing['menu_margin']['bottom'] ) ? floatval( $spacing['menu_margin']['bottom'] ) : 0;
			
			if ( 'rem' === $unit ) {
				$top    = $top * 16;
				$bottom = $bottom * 16;
			}
			
			if ( $top < 0 || $bottom < 0 ) {
				$warnings[] = 'Negative menu margins detected. This may cause menu items to overlap, making them difficult to click or tap. Verify that all menu items remain accessible.';
			}
		}

		// Check for negative submenu offset that could cause alignment issues.
		if ( isset( $spacing['submenu_spacing']['offset_left'] ) ) {
			$offset = floatval( $spacing['submenu_spacing']['offset_left'] );
			$unit   = isset( $spacing['submenu_spacing']['unit'] ) ? $spacing['submenu_spacing']['unit'] : 'px';
			
			if ( 'rem' === $unit ) {
				$offset = $offset * 16;
			}
			
			if ( $offset < -20 ) {
				$warnings[] = sprintf(
					'Large negative submenu offset (%dpx) may cause submenus to overlap with parent menu items or extend off-screen. Verify submenu positioning on different screen sizes.',
					intval( $offset )
				);
			}
			
			if ( $offset > 20 ) {
				$warnings[] = sprintf(
					'Large positive submenu offset (%dpx) may create a gap between parent and submenu items, making the relationship unclear. Consider reducing the offset for better usability.',
					intval( $offset )
				);
			}
		}

		// Check for very small padding that could affect readability.
		if ( isset( $spacing['menu_padding'] ) && is_array( $spacing['menu_padding'] ) ) {
			$unit = isset( $spacing['menu_padding']['unit'] ) ? $spacing['menu_padding']['unit'] : 'px';
			
			$left  = isset( $spacing['menu_padding']['left'] ) ? floatval( $spacing['menu_padding']['left'] ) : 0;
			$right = isset( $spacing['menu_padding']['right'] ) ? floatval( $spacing['menu_padding']['right'] ) : 0;
			
			if ( 'rem' === $unit ) {
				$left  = $left * 16;
				$right = $right * 16;
			}
			
			if ( $left < 8 || $right < 8 ) {
				$warnings[] = 'Menu padding below 8px may make text difficult to read and reduce visual comfort. Consider increasing horizontal padding for better readability.';
			}
		}

		return $warnings;
	}

	/**
	 * Get shadow preset definitions.
	 *
	 * @return array Shadow presets with intensity and blur values.
	 */
	public function get_shadow_presets() {
		return array(
			'flat' => array(
				'name'        => 'Flat',
				'description' => 'No shadows, clean flat design',
				'admin_bar'   => array(
					'intensity' => 'none',
					'blur'      => 0,
				),
				'admin_menu'  => array(
					'intensity' => 'none',
					'blur'      => 0,
				),
				'buttons'     => array(
					'intensity' => 'none',
					'blur'      => 0,
				),
				'form_fields' => array(
					'intensity' => 'none',
					'blur'      => 0,
				),
			),
			'subtle' => array(
				'name'        => 'Subtle',
				'description' => 'Light shadows for gentle depth',
				'admin_bar'   => array(
					'intensity' => 'subtle',
					'blur'      => 8,
				),
				'admin_menu'  => array(
					'intensity' => 'subtle',
					'blur'      => 6,
				),
				'buttons'     => array(
					'intensity' => 'subtle',
					'blur'      => 5,
				),
				'form_fields' => array(
					'intensity' => 'subtle',
					'blur'      => 3,
				),
			),
			'elevated' => array(
				'name'        => 'Elevated',
				'description' => 'Medium shadows for clear hierarchy',
				'admin_bar'   => array(
					'intensity' => 'medium',
					'blur'      => 12,
				),
				'admin_menu'  => array(
					'intensity' => 'medium',
					'blur'      => 10,
				),
				'buttons'     => array(
					'intensity' => 'medium',
					'blur'      => 8,
				),
				'form_fields' => array(
					'intensity' => 'subtle',
					'blur'      => 5,
				),
			),
			'floating' => array(
				'name'        => 'Floating',
				'description' => 'Strong shadows for dramatic depth',
				'admin_bar'   => array(
					'intensity' => 'strong',
					'blur'      => 20,
				),
				'admin_menu'  => array(
					'intensity' => 'strong',
					'blur'      => 15,
				),
				'buttons'     => array(
					'intensity' => 'medium',
					'blur'      => 10,
				),
				'form_fields' => array(
					'intensity' => 'subtle',
					'blur'      => 6,
				),
			),
		);
	}

	/**
	 * Detect if current visual effects settings match a preset.
	 *
	 * @param array $visual_effects Current visual effects settings.
	 * @return string Preset name or 'custom' if no match.
	 */
	public function detect_visual_effects_preset( $visual_effects ) {
		$presets = $this->get_shadow_presets();

		foreach ( $presets as $preset_id => $preset_data ) {
			$matches = true;

			foreach ( array( 'admin_bar', 'admin_menu', 'buttons', 'form_fields' ) as $element ) {
				if ( ! isset( $visual_effects[ $element ] ) || ! isset( $preset_data[ $element ] ) ) {
					$matches = false;
					break;
				}

				$current = $visual_effects[ $element ];
				$preset  = $preset_data[ $element ];

				if ( $current['shadow_intensity'] !== $preset['intensity'] ||
					 absint( $current['shadow_blur'] ) !== absint( $preset['blur'] ) ) {
					$matches = false;
					break;
				}
			}

			if ( $matches ) {
				return $preset_id;
			}
		}

		return 'custom';
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

	/**
	 * Get current plugin version from database.
	 *
	 * @return string|false Current version or false if not set.
	 */
	public function get_current_version() {
		return get_option( self::VERSION_OPTION_NAME, false );
	}

	/**
	 * Update plugin version in database.
	 *
	 * @param string $version Version to store.
	 * @return bool True on success, false on failure.
	 */
	private function update_version( $version ) {
		return update_option( self::VERSION_OPTION_NAME, $version );
	}

	/**
	 * Check if migration is needed.
	 *
	 * @return bool True if migration needed, false otherwise.
	 */
	public function needs_migration() {
		$current_version = $this->get_current_version();
		
		// Fresh install - no migration needed.
		if ( false === $current_version ) {
			return false;
		}

		// Compare versions.
		return version_compare( $current_version, self::PLUGIN_VERSION, '<' );
	}

	/**
	 * Run all necessary migrations.
	 *
	 * Checks current version and runs appropriate migration methods.
	 * Requirement 15.4: Preserve existing settings during plugin update.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function run_migrations() {
		$current_version = $this->get_current_version();

		// Fresh install - initialize version and defaults.
		if ( false === $current_version ) {
			$this->initialize_defaults();
			$this->update_version( self::PLUGIN_VERSION );
			return true;
		}

		// No migration needed.
		if ( ! $this->needs_migration() ) {
			return true;
		}

		$success = true;

		// Migrate from v1.1 or earlier to v1.2 (visual effects feature).
		if ( version_compare( $current_version, '1.2.0', '<' ) ) {
			$success = $this->migrate_to_v1_2();
		}

		// Update version if all migrations successful.
		if ( $success ) {
			$this->update_version( self::PLUGIN_VERSION );
		}

		return $success;
	}

	/**
	 * Migrate settings from v1.1 to v1.2.
	 *
	 * Adds visual effects settings while preserving all existing settings.
	 * Requirements: 15.1-15.6
	 * - 15.1: Store in WordPress options table (existing structure)
	 * - 15.2: Use structured array format (existing structure)
	 * - 15.3: Return default values for missing keys
	 * - 15.4: Preserve existing settings during update
	 * - 15.5: Cache separately (handled by MASE_CacheManager)
	 * - 15.6: Display error on database write failure
	 *
	 * @return bool True on success, false on failure.
	 */
	public function migrate_to_v1_2() {
		// Get existing settings.
		$existing_settings = get_option( self::OPTION_NAME, array() );

		// If settings don't exist, initialize with defaults.
		if ( empty( $existing_settings ) ) {
			return $this->initialize_defaults();
		}

		// Check if visual_effects already exists (migration already done).
		if ( isset( $existing_settings['visual_effects'] ) ) {
			return true;
		}

		// Get default visual effects settings.
		$defaults = $this->get_defaults();
		$visual_effects_defaults = $defaults['visual_effects'];

		// Add visual effects to existing settings without modifying other settings.
		$existing_settings['visual_effects'] = $visual_effects_defaults;

		// Save updated settings.
		$result = update_option( self::OPTION_NAME, $existing_settings );

		// Log migration result.
		if ( $result ) {
			error_log( 'MASE: Successfully migrated settings to v1.2 (added visual effects)' );
		} else {
			error_log( 'MASE: Failed to migrate settings to v1.2 - database write error' );
		}

		return $result;
	}

	/**
	 * Verify migration integrity.
	 *
	 * Checks that all expected settings keys exist after migration.
	 *
	 * @return array Array with 'success' boolean and 'missing_keys' array.
	 */
	public function verify_migration() {
		$current_settings = get_option( self::OPTION_NAME, array() );
		$defaults = $this->get_defaults();
		$missing_keys = array();

		// Check top-level keys.
		foreach ( array_keys( $defaults ) as $key ) {
			if ( ! isset( $current_settings[ $key ] ) ) {
				$missing_keys[] = $key;
			}
		}

		// Check visual effects sub-keys.
		if ( isset( $current_settings['visual_effects'] ) ) {
			foreach ( array_keys( $defaults['visual_effects'] ) as $key ) {
				if ( ! isset( $current_settings['visual_effects'][ $key ] ) ) {
					$missing_keys[] = 'visual_effects.' . $key;
				}
			}
		}

		return array(
			'success'      => empty( $missing_keys ),
			'missing_keys' => $missing_keys,
		);
	}
}
