---
inclusion: always
---

## Code Quality Standards

When writing or modifying code, adhere to these quality constraints:

- Maximum cyclomatic complexity: 10 per function
- Minimum test coverage: 80%
- Maximum file length: 300 lines
- Maximum function length: 50 lines

## Architecture Constraints

This project has specific architectural limits to maintain simplicity:

- JavaScript files: Maximum 3
- PHP classes: Maximum 8
- REST endpoints: Maximum 5
- Feature count: Maximum 6

Keep the architecture lean and focused.

## File Structure Rules

- Maximum files in root directory: 10
- Test files must not be placed in root (use a dedicated test directory)
- Maximum documentation files: 3

## Development Phases

Follow this phased approach when building features:

1. **FOUNDATION** - Set up core infrastructure and dependencies
2. **CORE_FEATURES** - Implement essential functionality
3. **USER_INTERFACE** - Build user-facing components
4. **TESTING_POLISH** - Add tests and refine implementation
5. **DOCUMENTATION** - Document usage and API

Work through phases sequentially to maintain project organization.
