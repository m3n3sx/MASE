<?php
/**
 * Clear MASE Cache Script
 * 
 * Run this to clear all MASE caches after fixing the menu layout bug.
 */

// Load WordPress.
require_once __DIR__ . '/../../wp-load.php';

// Load MASE cache class.
require_once __DIR__ . '/includes/class-mase-cache.php';

// Clear all caches.
$cache = new MASE_Cache();
$result = $cache->invalidate_all_caches();

if ( $result ) {
	echo "✅ SUCCESS: All MASE caches cleared!\n";
	echo "The menu should now display vertically.\n";
	echo "Refresh your WordPress admin page.\n";
} else {
	echo "⚠️ WARNING: Some caches may not have been cleared.\n";
	echo "Try manually clearing WordPress transients.\n";
}
