# Implementation Plan

- [x] 1. Initialize project structure and version control
  - Create plugin directory structure with includes/, assets/js/, assets/css/, and tests/ folders
  - Create main plugin file with proper WordPress headers
  - Initialize git repository with .gitignore excluding WordPress core, node_modules, vendor
  - Create README.md with plugin description and installation instructions
  - _Requirements: 1.1, 1.2, 9.1, 9.2, 9.3_

- [x] 2. Implement PSR-4 autoloader and plugin activation
  - Write mase_autoloader() function to load classes from includes/ directory
  - Register autoloader with spl_autoload_register()
  - Implement mase_activate() function with WordPress version check (5.0+)
  - Register activation hook to initialize default settings
  - _Requirements: 1.1, 1.3, 5.1, 5.2, 5.3_

- [x] 3. Create MASE_Settings class with defaults and validation
  - Implement MASE_Settings class with OPTION_NAME constant
  - Write get_option() method to retrieve settings from WordPress options
  - Write get_defaults() method returning complete settings schema
  - Implement validate() method with color format and numeric range validation
  - Write update_option() method with validation before saving
  - Write reset_to_defaults() method for corrupted settings recovery
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 15.1, 15.2, 24.1, 24.2, 31.1, 31.2, 31.3, 31.4_

- [ ] 4. Create MASE_CSS_Generator class for CSS generation
  - Implement MASE_CSS_Generator class with generate() method
  - Write generate_admin_bar_css() private method for admin bar styles
  - Write generate_admin_menu_css() private method for menu styles
  - Implement minify() method to remove whitespace and comments
  - Ensure CSS uses body.wp-admin prefix for specificity
  - Optimize for <100ms generation time using string concatenation
  - _Requirements: 10.1, 10.2, 10.3, 12.1, 12.2, 12.3, 13.1, 13.2, 13.3, 17.1, 17.2, 32.1, 32.2, 32.3, 32.4_

- [ ] 5. Create MASE_Cache class for transient management
  - Implement MASE_Cache class with CACHE_KEY constant
  - Write get_cached_css() method to retrieve from WordPress transients
  - Write set_cached_css() method to store CSS with expiration
  - Implement invalidate_cache() method to delete transient
  - _Requirements: 20.1, 20.2, 20.3_

- [ ] 6. Create MASE_Admin class with dependency injection
  - Implement MASE_Admin class constructor accepting MASE_Settings and MASE_CSS_Generator
  - Register admin_menu hook in constructor
  - Register admin_enqueue_scripts hook in constructor
  - Register admin_head hook in constructor
  - Register wp_ajax_mase_save_settings hook in constructor
  - Verify admin context before initialization
  - _Requirements: 2.1, 33.1, 33.3, 34.1, 34.2, 41.1, 41.2, 41.3, 41.4_

- [ ] 7. Implement admin menu and settings page rendering
  - Write add_admin_menu() method to create top-level menu entry
  - Implement render_settings_page() method with capability check
  - Create settings form with nonce field for CSRF protection
  - Build admin bar settings section with color and height fields
  - Build admin menu settings section with color, hover, and width fields
  - Build performance settings section with minification and cache duration
  - Add proper labels with for attributes for accessibility
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 21.3, 22.1, 23.1, 23.2, 30.2, 30.3, 33.2_

- [ ] 8. Implement asset enqueuing with conditional loading
  - Write enqueue_assets() method with hook parameter check
  - Enqueue wp-color-picker style and script
  - Enqueue mase-admin.js with jQuery and wp-color-picker dependencies
  - Enqueue mase-admin.css for settings page styles
  - Only load assets on MASE settings page (not all admin pages)
  - _Requirements: 19.1, 19.3, 33.4_

- [ ] 9. Implement CSS injection into admin pages
  - Write inject_custom_css() method to output CSS in admin_head
  - Integrate MASE_Cache to check for cached CSS first
  - Generate CSS using MASE_CSS_Generator if cache miss
  - Apply minification if enabled in settings
  - Cache generated CSS with configured duration
  - Handle generation errors by falling back to cached CSS
  - _Requirements: 10.4, 10.5, 16.5, 20.1, 20.2_

- [ ] 10. Implement AJAX save handler with security
  - Write handle_ajax_save_settings() method
  - Verify nonce using check_ajax_referer()
  - Check user capability with current_user_can('manage_options')
  - Sanitize input using sanitize_hex_color() and absint()
  - Validate input using MASE_Settings validate() method
  - Save settings and invalidate cache on success
  - Return JSON response with wp_send_json_success() or wp_send_json_error()
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 21.1, 21.2, 22.1, 22.2, 22.3, 24.1, 24.2, 24.3_

- [ ] 11. Create single JavaScript file with IIFE pattern
  - Create mase-admin.js with IIFE wrapping jQuery
  - Implement MASE object with init() method
  - Write initColorPickers() to initialize wp-color-picker
  - Write bindEvents() to attach form submit and input change handlers
  - Implement debounce utility function for performance
  - _Requirements: 11.4, 36.1, 36.2, 36.3, 37.1, 37.2, 37.4_

- [ ] 12. Implement AJAX form submission in JavaScript
  - Write handleFormSubmit() to prevent default and call saveSettings()
  - Implement saveSettings() with jQuery.ajax to wp-admin/admin-ajax.php
  - Include action, nonce, and serialized form data in AJAX request
  - Disable submit button and change text to "Saving..." during request
  - Write handleSaveSuccess() to process response and show notices
  - Write handleSaveError() with retry logic for network errors
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 28.1, 28.2, 28.3, 36.4, 38.1, 38.2, 38.3, 38.4_

- [ ] 13. Implement live preview functionality
  - Write updateLivePreview() method called on input changes
  - Implement getFormData() to extract current form values
  - Write generatePreviewCSS() mirroring PHP CSS generation logic
  - Implement injectPreviewCSS() to create/update style element
  - Debounce preview updates to 200ms for performance
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 39.1, 39.3_

- [ ] 14. Implement user feedback and error handling in JavaScript
  - Write showNotice() to display success/error messages
  - Implement highlightErrors() to mark invalid form fields
  - Add error handling for 403 permission errors
  - Add error handling for network failures with retry
  - Log errors to console for debugging
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 27.1, 27.2, 27.3, 40.1, 40.2, 40.3, 40.4_

- [ ] 15. Add responsive design and accessibility features
  - Add CSS media queries for mobile responsiveness
  - Ensure touch-friendly controls (min 44px tap targets)
  - Add aria-describedby attributes to form fields
  - Implement visible focus indicators with outline styles
  - Test keyboard navigation (Tab, Enter, Escape)
  - _Requirements: 29.1, 29.2, 29.3, 30.1, 30.2, 30.3, 30.4_

- [ ]* 16. Write unit tests for MASE_Settings class
  - Test get_option() returns correct values and defaults
  - Test update_option() saves to WordPress options
  - Test validate() rejects invalid hex colors
  - Test validate() rejects out-of-range numeric values
  - Test get_defaults() returns complete schema
  - Test reset_to_defaults() restores default values
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 17. Write unit tests for MASE_CSS_Generator class
  - Test generate() produces valid CSS syntax
  - Test generate() completes in under 100ms
  - Test minify() removes whitespace correctly
  - Test minify() preserves CSS validity
  - Test admin bar CSS generation with various colors
  - Test admin menu CSS generation with hover states
  - Test CSS includes body.wp-admin prefix for specificity
  - _Requirements: 8.1, 8.2, 8.3, 17.1_

- [ ]* 18. Write unit tests for MASE_Admin class
  - Test add_admin_menu() creates menu entry
  - Test enqueue_assets() loads correct files on settings page only
  - Test inject_custom_css() outputs CSS in admin_head
  - Test AJAX handler validates nonce correctly
  - Test AJAX handler checks user capabilities
  - Test AJAX handler returns proper JSON format
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 19. Write unit tests for MASE_Cache class
  - Test get_cached_css() retrieves from transient
  - Test set_cached_css() stores in transient with expiration
  - Test invalidate_cache() deletes transient
  - Test cache expiration behavior after duration
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 20. Write integration tests for complete workflows
  - Test full settings save workflow from form to database
  - Test CSS generation and injection pipeline
  - Test AJAX save with live preview update
  - Test cache invalidation on settings change
  - Test multisite compatibility with site-specific settings
  - _Requirements: 8.1, 8.2, 8.3, 44.1, 44.2, 44.3_

- [ ] 21. Add plugin documentation and final polish
  - Write comprehensive docblocks for all classes and methods
  - Add inline comments for complex logic
  - Create user documentation in README.md
  - Add code examples for developers
  - Verify all files have proper WordPress file headers
  - _Requirements: 4.1, 4.2, 35.1_

- [ ] 22. Perform final validation and optimization
  - Run WordPress Coding Standards (WPCS) validation
  - Verify file count is within 15-file limit
  - Test plugin activation/deactivation
  - Verify memory usage is under 10MB
  - Test CSS generation performance (<100ms)
  - Verify all security measures (nonce, capabilities, sanitization, escaping)
  - _Requirements: 4.4, 6.1, 17.1, 18.1, 21.1, 21.2, 22.1, 23.1, 23.2, 24.1_
