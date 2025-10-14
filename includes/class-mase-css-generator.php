<?php
/**
 * MASE CSS Generator Class
 *
 * Generates CSS from settings and provides minification.
 *
 * @package Modern_Admin_Styler_Enterprise
 * @since 1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class MASE_CSS_Generator
 *
 * Generates and minifies CSS from settings.
 */
class MASE_CSS_Generator {

	/**
	 * Generate CSS from settings.
	 *
	 * @param array $settings Settings array.
	 * @return string Generated CSS.
	 */
	public function generate( $settings ) {
		$css = '';
		
		// Generate admin bar CSS.
		$css .= $this->generate_admin_bar_css( $settings );
		
		// Generate admin menu CSS.
		$css .= $this->generate_admin_menu_css( $settings );
		
		return $css;
	}

	/**
	 * Minify CSS by removing whitespace and comments.
	 *
	 * @param string $css CSS to minify.
	 * @return string Minified CSS.
	 */
	public function minify( $css ) {
		// Remove comments.
		$css = preg_replace( '!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css );
		
		// Remove whitespace.
		$css = str_replace( array( "\r\n", "\r", "\n", "\t", '  ', '    ', '    ' ), '', $css );
		$css = preg_replace( '/\s+/', ' ', $css );
		$css = preg_replace( '/\s*([{}|:;,])\s*/', '$1', $css );
		
		return trim( $css );
	}

	/**
	 * Generate admin bar CSS.
	 *
	 * @param array $settings Settings array.
	 * @return string Admin bar CSS.
	 */
	private function generate_admin_bar_css( $settings ) {
		if ( empty( $settings['admin_bar'] ) ) {
			return '';
		}

		$admin_bar = $settings['admin_bar'];
		$css       = '';

		if ( ! empty( $admin_bar['bg_color'] ) ) {
			$css .= sprintf(
				'body.wp-admin #wpadminbar { background-color: %s !important; }',
				esc_attr( $admin_bar['bg_color'] )
			);
		}

		if ( ! empty( $admin_bar['text_color'] ) ) {
			$css .= sprintf(
				'body.wp-admin #wpadminbar, body.wp-admin #wpadminbar a, body.wp-admin #wpadminbar .ab-item { color: %s !important; }',
				esc_attr( $admin_bar['text_color'] )
			);
		}

		if ( ! empty( $admin_bar['height'] ) ) {
			$css .= sprintf(
				'body.wp-admin #wpadminbar { height: %spx !important; }',
				absint( $admin_bar['height'] )
			);
		}

		return $css;
	}

	/**
	 * Generate admin menu CSS.
	 *
	 * @param array $settings Settings array.
	 * @return string Admin menu CSS.
	 */
	private function generate_admin_menu_css( $settings ) {
		if ( empty( $settings['admin_menu'] ) ) {
			return '';
		}

		$admin_menu = $settings['admin_menu'];
		$css        = '';

		if ( ! empty( $admin_menu['bg_color'] ) ) {
			$css .= sprintf(
				'body.wp-admin #adminmenu, body.wp-admin #adminmenu .wp-submenu { background-color: %s !important; }',
				esc_attr( $admin_menu['bg_color'] )
			);
		}

		if ( ! empty( $admin_menu['text_color'] ) ) {
			$css .= sprintf(
				'body.wp-admin #adminmenu a, body.wp-admin #adminmenu .wp-submenu a { color: %s !important; }',
				esc_attr( $admin_menu['text_color'] )
			);
		}

		if ( ! empty( $admin_menu['hover_bg_color'] ) ) {
			$css .= sprintf(
				'body.wp-admin #adminmenu a:hover, body.wp-admin #adminmenu .wp-submenu a:hover { background-color: %s !important; }',
				esc_attr( $admin_menu['hover_bg_color'] )
			);
		}

		if ( ! empty( $admin_menu['hover_text_color'] ) ) {
			$css .= sprintf(
				'body.wp-admin #adminmenu a:hover, body.wp-admin #adminmenu .wp-submenu a:hover { color: %s !important; }',
				esc_attr( $admin_menu['hover_text_color'] )
			);
		}

		if ( ! empty( $admin_menu['width'] ) ) {
			$css .= sprintf(
				'body.wp-admin #adminmenu { width: %spx !important; }',
				absint( $admin_menu['width'] )
			);
		}

		return $css;
	}
}
