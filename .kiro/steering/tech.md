# Technical Stack

## Core Technologies

### Backend

- **Language**: PHP 7.4+
- **Framework**: WordPress 5.8+ (tested up to 6.8)
- **API**: WordPress REST API v2
- **Database**: WordPress database with custom tables for analytics, backups, webhooks

### Frontend

- **JavaScript**: ES6+ with modular architecture
- **CSS**: Modern CSS3 with CSS variables
- **Build Tools**: None (vanilla JS/CSS for WordPress compatibility)
- **UI Framework**: Custom component system with lifecycle management

## Architecture Patterns

### Backend

- **MVC Pattern**: Controllers (API), Services (Business Logic), Models (Data)
- **Dependency Injection**: Service-based architecture
- **PSR-4 Autoloading**: Class autoloading via composer
- **REST API**: RESTful endpoints with JSON Schema validation

### Frontend

- **Module Pattern**: Self-contained JavaScript modules
- **Event Bus**: Centralized event system for component communication
- **State Management**: Centralized state with reactive updates
- **Component Lifecycle**: Init, mount, update, destroy phases

## Key Libraries & Dependencies

### PHP (Composer)

```json
{
  "phpunit/phpunit": "^9.0",
  "wp-coding-standards/wpcs": "^2.3",
  "phpstan/phpstan": "^1.0"
}
```

### JavaScript (NPM)

```json
{
  "@playwright/test": "^1.40.0",
  "jest": "^29.7.0",
  "eslint": "^8.50.0",
  "prettier": "^3.0.0"
}
```

## Common Commands

### Testing

```bash
# PHP Unit Tests
composer test
composer test:integration
composer test:e2e

# JavaScript Tests
npm test
npm run test:watch
npm run test:coverage

# E2E Tests (Playwright)
npm run test:playwright
npm run test:playwright:ui

# All Tests
npm run ci
```

### Code Quality

```bash
# PHP Linting
composer phpcs
composer phpstan

# JavaScript Linting
npm run lint
npm run lint:fix

# Code Formatting
npm run format
npm run format:check
```

### Development

```bash
# Install Dependencies
composer install
npm install

# Watch Mode (Tests)
npm run test:watch

# Debug Mode
npm run test:playwright:debug
```

## Build Process

No build step required - plugin uses vanilla JavaScript and CSS for maximum WordPress compatibility. Assets are loaded directly without transpilation or bundling.

## Performance Targets

- Initial Load: <450ms
- Bundle Size: <41KB gzipped
- Cache Hit Rate: >80%
- Lighthouse Score: >95/100
- Test Coverage: >80%
