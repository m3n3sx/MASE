# Project Structure

## Directory Organization

```
modern-admin-styler-v2/
├── modern-admin-styler-v2.php    # Main plugin file (entry point)
├── includes/                      # PHP backend code
│   ├── api/                      # REST API controllers
│   ├── services/                 # Business logic services
│   ├── admin/                    # Admin UI classes
│   └── class-mas-*.php           # Core classes
├── assets/                        # Frontend assets
│   ├── css/                      # Stylesheets
│   └── js/                       # JavaScript modules
│       ├── core/                 # Core system (loader, event bus, state)
│       ├── modules/              # UI modules (settings, preview, etc.)
│       ├── utils/                # Utility functions
│       ├── legacy/               # Deprecated AJAX code
│       └── types/                # TypeScript definitions
├── templates/                     # PHP template files
├── tests/                         # Test suite
│   ├── php/                      # PHPUnit tests
│   │   ├── unit/                 # Unit tests
│   │   ├── integration/          # Integration tests
│   │   ├── e2e/                  # End-to-end tests
│   │   └── rest-api/             # REST API tests
│   ├── js/                       # Jest tests
│   └── helpers/                  # Test utilities
├── docs/                          # Documentation
└── vendor/                        # Composer dependencies
```

## Key Conventions

### PHP Files
- **Naming**: `class-mas-{name}.php` (lowercase with hyphens)
- **Classes**: `MAS_{Name}` (uppercase with underscores)
- **Location**: Controllers in `includes/api/`, services in `includes/services/`

### JavaScript Files
- **Naming**: `kebab-case.js`
- **Modules**: Self-contained with init/destroy lifecycle
- **Location**: Core in `assets/js/core/`, features in `assets/js/modules/`

### CSS Files
- **Naming**: `kebab-case.css`
- **Organization**: Feature-based (one file per major feature)
- **Variables**: CSS custom properties for theming

### Test Files
- **PHP**: `test-{feature}.php` in `tests/php/{type}/`
- **JavaScript**: `{feature}.test.js` in `tests/js/`
- **Location**: Mirror source structure in tests directory

## File Placement Rules

### Source Code
- **Controllers**: `includes/api/class-mas-{name}-controller.php`
- **Services**: `includes/services/class-mas-{name}-service.php`
- **Admin UI**: `includes/admin/class-mas-{name}-admin.php`
- **Core Classes**: `includes/class-mas-{name}.php`

### Assets
- **Global CSS**: `assets/css/admin.css`
- **Feature CSS**: `assets/css/{feature-name}.css`
- **Core JS**: `assets/js/core/{name}.js`
- **Module JS**: `assets/js/modules/{name}.js`

### Tests
- **Unit Tests**: `tests/php/unit/test-{class-name}.php`
- **Integration**: `tests/php/integration/test-{feature}.php`
- **E2E Tests**: `tests/php/e2e/test-{workflow}.php`
- **JS Tests**: `tests/js/{module}.test.js`

### Documentation
- **API Docs**: `docs/API-DOCUMENTATION.md`
- **Guides**: `docs/{GUIDE-NAME}.md`
- **Specs**: Root level `{FEATURE}-{TYPE}.md`

## Important Notes

- **No root test files**: All tests must be in `tests/` directory
- **No build artifacts**: Plugin uses vanilla JS/CSS (no dist/ folder)
- **Composer autoload**: PSR-4 autoloading for PHP classes
- **WordPress standards**: Follow WordPress coding standards for PHP
- **ES6 modules**: Use modern JavaScript with module pattern
- **Backward compatibility**: Legacy code in `assets/js/legacy/` for migration period
