<?php
/**
 * MASE Cache Management Class
 *
 * Handles CSS caching using WordPress transients.
 *
 * @package Modern_Admin_Styler_Enterprise
 * @since 1.0.0
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class MASE_Cache
 *
 * Manages CSS caching with WordPress transients.
 */
class MASE_Cache {

	/**
	 * Cache key for storing generated CSS.
	 *
	 * @var string
	 */
	const CACHE_KEY = 'mase_generated_css';

	/**
	 * Get cached CSS from transient.
	 *
	 * @return string|false Cached CSS string or false if not found.
	 */
	public function get_cached_css() {
		return get_transient( self::CACHE_KEY );
	}

	/**
	 * Store CSS in transient cache.
	 *
	 * @param string $css      The CSS to cache.
	 * @param int    $duration Cache duration in seconds.
	 * @return bool True on success, false on failure.
	 */
	public function set_cached_css( $css, $duration ) {
		return set_transient( self::CACHE_KEY, $css, $duration );
	}

	/**
	 * Invalidate the CSS cache.
	 *
	 * @return bool True on success, false on failure.
	 */
	public function invalidate_cache() {
		return delete_transient( self::CACHE_KEY );
	}
}
