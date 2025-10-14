# Modern Admin Styler Enterprise (MASE)

Enterprise-grade WordPress admin styling plugin designed for simplicity, reliability, and maintainability.

## Description

Modern Admin Styler Enterprise (MASE) provides a clean, maintainable solution for customizing the WordPress admin interface. This version prioritizes simplicity over feature complexity, learning from previous iterations that suffered from over-engineering.

### Key Features

- **Admin Bar Customization**: Change colors, height, and appearance
- **Admin Menu Styling**: Customize menu colors, hover states, and width
- **Live Preview**: See changes in real-time as you adjust settings
- **Performance Optimized**: CSS generation under 100ms, intelligent caching
- **Security First**: Nonce verification, capability checks, input sanitization
- **WordPress Native**: Uses only WordPress core APIs, no external dependencies

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher

## Installation

1. Upload the `modern-admin-styler` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to 'Modern Admin Styler' in the admin menu to configure settings

## Usage

1. Go to **Modern Admin Styler** in your WordPress admin menu
2. Adjust colors using the color pickers
3. See live preview of changes as you make them
4. Click **Save Settings** to apply changes permanently

## Architecture

MASE follows a clean, minimal architecture:

- **Maximum 15 files** - Complexity kept under control
- **Single JavaScript file** - No module bundling complexity
- **WordPress native patterns** - No external dependencies
- **PSR-4 autoloading** - Clean class loading
- **80%+ test coverage** - Reliability ensured

## File Structure

```
modern-admin-styler/
├── modern-admin-styler.php          # Main plugin file
├── includes/                         # PHP classes
│   ├── class-mase-settings.php
│   ├── class-mase-css-generator.php
│   ├── class-mase-admin.php
│   └── class-mase-cache.php
├── assets/
│   ├── js/
│   │   └── mase-admin.js            # Single JavaScript file
│   └── css/
│       └── mase-admin.css           # Admin styles
└── tests/                            # Unit tests
```

## Development

### Coding Standards

This plugin follows WordPress Coding Standards (WPCS). All code includes:
- Proper docblocks with parameter and return types
- WordPress naming conventions
- Security best practices (nonce verification, capability checks, sanitization)

### Testing

Run tests with PHPUnit:
```bash
phpunit
```

Minimum test coverage: 80%

## Security

MASE implements multiple security layers:
- **CSRF Protection**: Nonce verification on all AJAX requests
- **Authorization**: Capability checks (`manage_options`)
- **Input Sanitization**: All user input sanitized before storage
- **Output Escaping**: All output properly escaped
- **SQL Injection Prevention**: WordPress prepared statements

## Performance

- CSS generation: <100ms
- Memory usage: <10MB
- Page load impact: <200ms
- Intelligent caching with WordPress transients

## Testing

MASE includes comprehensive testing to ensure reliability and performance.

### Run Tests

```bash
cd tests
./run-tests.sh
```

### Test Coverage

- Performance tests (CSS generation speed, memory usage)
- Integration tests (settings, caching, validation)
- Manual testing checklist in TESTING.md

See [TESTING.md](TESTING.md) for detailed testing guide.

## Changelog

### 1.0.0
- Initial release
- Admin bar customization
- Admin menu styling
- Live preview functionality
- Performance optimization with caching
- Comprehensive test suite

## Support

For issues, questions, or contributions, please visit the plugin repository.

## License

GPL v2 or later - https://www.gnu.org/licenses/gpl-2.0.html

## Credits

Developed by the MASE Development Team, learning from the failures of MAS5 and MAS7 to create a simple, reliable solution.
