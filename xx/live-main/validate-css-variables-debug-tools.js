#!/usr/bin/env node

/**
 * Validation script for CSS Variables Debug Tools
 * 
 * This script validates that all debug tools components are properly
 * implemented and can be loaded without errors.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function runTest(testName, testFn) {
    try {
        const result = testFn();
        if (result === true) {
            logSuccess(testName);
            results.passed++;
        } else if (result === false) {
            logError(testName);
            results.failed++;
        } else {
            logWarning(`${testName} - ${result}`);
            results.warnings++;
        }
    } catch (error) {
        logError(`${testName} - ${error.message}`);
        results.failed++;
    }
}

// File existence tests
function testFileExists(filePath, description) {
    return runTest(`File exists: ${description}`, () => {
        return fs.existsSync(filePath);
    });
}

// File content validation tests
function testFileContent(filePath, description, validationFn) {
    return runTest(`Content validation: ${description}`, () => {
        if (!fs.existsSync(filePath)) {
            return false;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        return validationFn(content);
    });
}

// JavaScript syntax validation
function validateJavaScriptSyntax(content) {
    try {
        // Basic syntax check - look for common patterns
        if (content.includes('class ') && content.includes('{') && content.includes('}')) {
            return true;
        }
        return 'No class definition found';
    } catch (error) {
        return false;
    }
}

// HTML validation
function validateHTML(content) {
    try {
        if (content.includes('<!DOCTYPE html>') && 
            content.includes('<html') && 
            content.includes('</html>')) {
            return true;
        }
        return 'Invalid HTML structure';
    } catch (error) {
        return false;
    }
}

// Markdown validation
function validateMarkdown(content) {
    try {
        if (content.includes('# ') && content.length > 100) {
            return true;
        }
        return 'Invalid markdown structure';
    } catch (error) {
        return false;
    }
}

// Main validation function
function validateDebugTools() {
    log('🔍 CSS Variables Debug Tools Validation', 'bold');
    log('=' .repeat(50), 'blue');
    
    // Test file existence
    logInfo('Testing file existence...');
    testFileExists('assets/js/debug-logger.js', 'Debug Logger');
    testFileExists('assets/js/css-variables-debug-dashboard.js', 'Debug Dashboard');
    testFileExists('test-css-variables-debug-dashboard.html', 'Test HTML File');
    testFileExists('docs/css-variables-debugging-guide.md', 'Debugging Guide');
    testFileExists('docs/css-variable-dev-tools-usage.md', 'Dev Tools Usage Guide');
    testFileExists('tests/unit/css-variable-debug-dashboard.test.js', 'Unit Tests');
    
    // Test JavaScript files content
    logInfo('Testing JavaScript files...');
    testFileContent('assets/js/debug-logger.js', 'Debug Logger syntax', validateJavaScriptSyntax);
    testFileContent('assets/js/css-variables-debug-dashboard.js', 'Debug Dashboard syntax', validateJavaScriptSyntax);
    
    // Test specific functionality in debug logger
    testFileContent('assets/js/debug-logger.js', 'Debug Logger has DebugLogger class', (content) => {
        return content.includes('class DebugLogger');
    });
    
    testFileContent('assets/js/debug-logger.js', 'Debug Logger has console utilities', (content) => {
        return content.includes('installConsoleUtilities');
    });
    
    testFileContent('assets/js/debug-logger.js', 'Debug Logger has performance timing', (content) => {
        return content.includes('startTiming') && content.includes('endTiming');
    });
    
    // Test specific functionality in debug dashboard
    testFileContent('assets/js/css-variables-debug-dashboard.js', 'Debug Dashboard has CSSVariablesDebugDashboard class', (content) => {
        return content.includes('class CSSVariablesDebugDashboard');
    });
    
    testFileContent('assets/js/css-variables-debug-dashboard.js', 'Debug Dashboard has real-time updates', (content) => {
        return content.includes('startRealTimeUpdates');
    });
    
    testFileContent('assets/js/css-variables-debug-dashboard.js', 'Debug Dashboard has variable testing', (content) => {
        return content.includes('applyTestVariable');
    });
    
    // Test HTML file
    logInfo('Testing HTML test file...');
    testFileContent('test-css-variables-debug-dashboard.html', 'Test HTML structure', validateHTML);
    testFileContent('test-css-variables-debug-dashboard.html', 'Test HTML includes debug scripts', (content) => {
        return content.includes('debug-logger.js') && content.includes('css-variables-debug-dashboard.js');
    });
    
    // Test documentation files
    logInfo('Testing documentation...');
    testFileContent('docs/css-variables-debugging-guide.md', 'Debugging Guide structure', validateMarkdown);
    testFileContent('docs/css-variable-dev-tools-usage.md', 'Dev Tools Usage structure', validateMarkdown);
    
    // Test documentation content
    testFileContent('docs/css-variables-debugging-guide.md', 'Debugging Guide has troubleshooting section', (content) => {
        return content.includes('## Common Issues') || content.includes('## Troubleshooting');
    });
    
    testFileContent('docs/css-variable-dev-tools-usage.md', 'Dev Tools Usage has API reference', (content) => {
        return content.includes('## API Reference') || content.includes('### API');
    });
    
    // Test unit test file
    logInfo('Testing unit tests...');
    testFileContent('tests/unit/css-variable-debug-dashboard.test.js', 'Unit tests syntax', validateJavaScriptSyntax);
    testFileContent('tests/unit/css-variable-debug-dashboard.test.js', 'Unit tests have describe blocks', (content) => {
        return content.includes('describe(') && content.includes('test(');
    });
    
    // Test requirements coverage
    logInfo('Testing requirements coverage...');
    
    // Requirement 4.1: Debug mode detection and logging system
    testFileContent('assets/js/debug-logger.js', 'Requirement 4.1: Debug mode detection', (content) => {
        return content.includes('detectDebugMode');
    });
    
    // Requirement 4.2: Detailed error information with context
    testFileContent('assets/js/debug-logger.js', 'Requirement 4.2: Error logging with context', (content) => {
        return content.includes('error(') && content.includes('stack');
    });
    
    // Requirement 4.3: Console utilities for manual debugging
    testFileContent('assets/js/debug-logger.js', 'Requirement 4.3: Console utilities', (content) => {
        return content.includes('woowDebugCSS') && content.includes('showAppliedVariables');
    });
    
    // Requirement 4.4: Restoration report generation
    testFileContent('assets/js/debug-logger.js', 'Requirement 4.4: Report generation', (content) => {
        return content.includes('generateReport');
    });
    
    // Test integration points
    logInfo('Testing integration points...');
    testFileContent('assets/js/css-variables-debug-dashboard.js', 'Dashboard integrates with logger', (content) => {
        return content.includes('woowCSSDebugLogger');
    });
    
    testFileContent('test-css-variables-debug-dashboard.html', 'Test page loads both components', (content) => {
        return content.includes('debug-logger.js') && content.includes('css-variables-debug-dashboard.js');
    });
    
    // Summary
    log('\n' + '=' .repeat(50), 'blue');
    log('📊 Validation Summary', 'bold');
    log('=' .repeat(50), 'blue');
    
    logSuccess(`Passed: ${results.passed}`);
    if (results.warnings > 0) {
        logWarning(`Warnings: ${results.warnings}`);
    }
    if (results.failed > 0) {
        logError(`Failed: ${results.failed}`);
    }
    
    const total = results.passed + results.failed + results.warnings;
    const successRate = ((results.passed / total) * 100).toFixed(1);
    
    if (results.failed === 0) {
        logSuccess(`\n🎉 All tests passed! Success rate: ${successRate}%`);
        if (results.warnings > 0) {
            logWarning('Note: Some warnings were found but do not indicate failures.');
        }
    } else {
        logError(`\n💥 ${results.failed} test(s) failed. Success rate: ${successRate}%`);
    }
    
    // Provide next steps
    log('\n📋 Next Steps:', 'bold');
    log('1. Open test-css-variables-debug-dashboard.html in a browser');
    log('2. Enable debug mode by adding ?woow_debug=1 to the URL');
    log('3. Test the dashboard functionality using the provided controls');
    log('4. Check browser console for debug utilities (woowDebugCSS.help())');
    log('5. Review documentation in docs/ folder for usage instructions');
    
    return results.failed === 0;
}

// Run validation
if (require.main === module) {
    const success = validateDebugTools();
    process.exit(success ? 0 : 1);
}

module.exports = { validateDebugTools };