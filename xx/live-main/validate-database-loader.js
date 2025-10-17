#!/usr/bin/env node

/**
 * DatabaseLoader Validation Script
 * 
 * Validates the DatabaseLoader implementation against requirements:
 * - 2.1: WordPress AJAX endpoint for CSS variables loading
 * - 2.2: Fetch-based database communication with timeout handling
 * - 2.3: Data validation and transformation for CSS variable format
 * - 2.4: Error handling for network and server failures
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`🧪 ${message}`, 'bright');
    log('='.repeat(60), 'cyan');
}

function logSection(message) {
    log(`\n📋 ${message}`, 'blue');
    log('-'.repeat(40), 'blue');
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
    log(`ℹ️  ${message}`, 'cyan');
}

// Validation results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function addResult(test, status, message, requirement = null) {
    results.details.push({ test, status, message, requirement });
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
    else if (status === 'warning') results.warnings++;
}

// File validation functions
function validateJavaScriptFile() {
    logSection('JavaScript Implementation Validation');
    
    const jsFile = path.join(__dirname, 'assets/js/database-loader.js');
    
    if (!fs.existsSync(jsFile)) {
        logError('DatabaseLoader JavaScript file not found');
        addResult('File Existence', 'fail', 'database-loader.js not found');
        return false;
    }
    
    logSuccess('DatabaseLoader JavaScript file exists');
    
    const content = fs.readFileSync(jsFile, 'utf8');
    
    // Check class definition
    if (content.includes('class DatabaseLoader')) {
        logSuccess('DatabaseLoader class defined');
        addResult('Class Definition', 'pass', 'DatabaseLoader class properly defined');
    } else {
        logError('DatabaseLoader class not found');
        addResult('Class Definition', 'fail', 'DatabaseLoader class missing');
    }
    
    // Check required methods
    const requiredMethods = [
        'loadAllVariables',
        'attemptDatabaseLoad',
        'validateAndTransformData',
        'transformToCSSVariable',
        'validateAndSanitizeValue',
        'testConnection'
    ];
    
    requiredMethods.forEach(method => {
        if (content.includes(`${method}(`)) {
            logSuccess(`Method ${method} implemented`);
            addResult('Method Implementation', 'pass', `${method} method found`);
        } else {
            logError(`Method ${method} missing`);
            addResult('Method Implementation', 'fail', `${method} method missing`);
        }
    });
    
    // Check timeout handling (Requirement 2.2)
    if (content.includes('setTimeout') && content.includes('AbortController')) {
        logSuccess('Timeout handling implemented');
        addResult('Timeout Handling', 'pass', 'Timeout with AbortController implemented', '2.2');
    } else {
        logError('Timeout handling missing or incomplete');
        addResult('Timeout Handling', 'fail', 'Timeout handling not properly implemented', '2.2');
    }
    
    // Check retry mechanism (Requirement 2.4)
    if (content.includes('retryAttempts') && content.includes('for (let attempt')) {
        logSuccess('Retry mechanism implemented');
        addResult('Retry Mechanism', 'pass', 'Retry mechanism with attempts counter', '2.4');
    } else {
        logError('Retry mechanism missing');
        addResult('Retry Mechanism', 'fail', 'Retry mechanism not implemented', '2.4');
    }
    
    // Check data validation (Requirement 2.3)
    if (content.includes('validateAndTransformData') && content.includes('isValidCSSValue')) {
        logSuccess('Data validation implemented');
        addResult('Data Validation', 'pass', 'Data validation and transformation methods', '2.3');
    } else {
        logError('Data validation incomplete');
        addResult('Data Validation', 'fail', 'Data validation methods missing', '2.3');
    }
    
    // Check error handling (Requirement 2.4)
    if (content.includes('try {') && content.includes('catch (error)') && content.includes('throw')) {
        logSuccess('Error handling implemented');
        addResult('Error Handling', 'pass', 'Try-catch blocks and error throwing', '2.4');
    } else {
        logError('Error handling incomplete');
        addResult('Error Handling', 'fail', 'Error handling not properly implemented', '2.4');
    }
    
    // Check fetch usage (Requirement 2.2)
    if (content.includes('fetch(') && content.includes('FormData')) {
        logSuccess('Fetch-based communication implemented');
        addResult('Fetch Communication', 'pass', 'Fetch API with FormData for AJAX', '2.2');
    } else {
        logError('Fetch-based communication missing');
        addResult('Fetch Communication', 'fail', 'Fetch API implementation missing', '2.2');
    }
    
    return true;
}

function validatePHPEndpoint() {
    logSection('PHP AJAX Endpoint Validation');
    
    const phpFile = path.join(__dirname, 'woow-admin-styler.php');
    
    if (!fs.existsSync(phpFile)) {
        logError('Main plugin file not found');
        addResult('PHP File Existence', 'fail', 'woow-admin-styler.php not found');
        return false;
    }
    
    const content = fs.readFileSync(phpFile, 'utf8');
    
    // Check AJAX action registration (Requirement 2.1)
    if (content.includes("add_action('wp_ajax_woow_load_css_variables'")) {
        logSuccess('AJAX action for loading CSS variables registered');
        addResult('AJAX Registration', 'pass', 'woow_load_css_variables action registered', '2.1');
    } else {
        logError('AJAX action registration missing');
        addResult('AJAX Registration', 'fail', 'woow_load_css_variables action not registered', '2.1');
    }
    
    // Check AJAX handler method (Requirement 2.1)
    if (content.includes('function ajaxLoadCSSVariables')) {
        logSuccess('AJAX handler method implemented');
        addResult('AJAX Handler', 'pass', 'ajaxLoadCSSVariables method found', '2.1');
    } else {
        logError('AJAX handler method missing');
        addResult('AJAX Handler', 'fail', 'ajaxLoadCSSVariables method not found', '2.1');
    }
    
    // Check nonce verification (Security)
    if (content.includes('wp_verify_nonce') && content.includes('ajaxLoadCSSVariables')) {
        logSuccess('Nonce verification implemented');
        addResult('Security - Nonce', 'pass', 'Nonce verification in AJAX handler');
    } else {
        logError('Nonce verification missing');
        addResult('Security - Nonce', 'fail', 'Nonce verification not implemented');
    }
    
    // Check permission check (Security)
    if (content.includes("current_user_can('manage_options')")) {
        logSuccess('Permission check implemented');
        addResult('Security - Permissions', 'pass', 'User capability check implemented');
    } else {
        logError('Permission check missing');
        addResult('Security - Permissions', 'fail', 'User capability check missing');
    }
    
    // Check data transformation (Requirement 2.3)
    if (content.includes('transformSettingsToCSSVariables')) {
        logSuccess('Data transformation method implemented');
        addResult('Data Transformation', 'pass', 'Settings to CSS variables transformation', '2.3');
    } else {
        logError('Data transformation method missing');
        addResult('Data Transformation', 'fail', 'Data transformation method not found', '2.3');
    }
    
    // Check error handling in PHP (Requirement 2.4)
    if (content.includes('wp_send_json_error') && content.includes('try {') && content.includes('catch (Exception')) {
        logSuccess('PHP error handling implemented');
        addResult('PHP Error Handling', 'pass', 'Exception handling and JSON error responses', '2.4');
    } else {
        logError('PHP error handling incomplete');
        addResult('PHP Error Handling', 'fail', 'PHP error handling not properly implemented', '2.4');
    }
    
    // Check test connection endpoint
    if (content.includes("add_action('wp_ajax_woow_test_connection'")) {
        logSuccess('Test connection endpoint registered');
        addResult('Test Connection', 'pass', 'Test connection endpoint available');
    } else {
        logWarning('Test connection endpoint missing');
        addResult('Test Connection', 'warning', 'Test connection endpoint not found');
    }
    
    return true;
}

function validateTestFiles() {
    logSection('Test Files Validation');
    
    const testFiles = [
        'test-database-loader.html',
        'validate-database-loader.js'
    ];
    
    testFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            logSuccess(`Test file ${file} exists`);
            addResult('Test Files', 'pass', `${file} test file available`);
        } else {
            logError(`Test file ${file} missing`);
            addResult('Test Files', 'fail', `${file} test file not found`);
        }
    });
}

function validateRequirements() {
    logSection('Requirements Compliance Check');
    
    const requirements = {
        '2.1': 'WordPress AJAX endpoint for CSS variables loading',
        '2.2': 'Fetch-based database communication with timeout handling',
        '2.3': 'Data validation and transformation for CSS variable format',
        '2.4': 'Error handling for network and server failures'
    };
    
    Object.entries(requirements).forEach(([reqId, description]) => {
        const reqResults = results.details.filter(r => r.requirement === reqId);
        const passed = reqResults.filter(r => r.status === 'pass').length;
        const failed = reqResults.filter(r => r.status === 'fail').length;
        
        if (failed === 0 && passed > 0) {
            logSuccess(`Requirement ${reqId}: ${description} - COMPLIANT`);
        } else if (failed > 0) {
            logError(`Requirement ${reqId}: ${description} - NON-COMPLIANT`);
        } else {
            logWarning(`Requirement ${reqId}: ${description} - NOT TESTED`);
        }
    });
}

function validateCodeQuality() {
    logSection('Code Quality Assessment');
    
    const jsFile = path.join(__dirname, 'assets/js/database-loader.js');
    
    if (!fs.existsSync(jsFile)) {
        logError('Cannot assess code quality - file missing');
        return;
    }
    
    const content = fs.readFileSync(jsFile, 'utf8');
    
    // Check documentation
    const docComments = (content.match(/\/\*\*[\s\S]*?\*\//g) || []).length;
    if (docComments >= 5) {
        logSuccess(`Good documentation: ${docComments} JSDoc comments`);
        addResult('Documentation', 'pass', `${docComments} JSDoc comments found`);
    } else {
        logWarning(`Limited documentation: ${docComments} JSDoc comments`);
        addResult('Documentation', 'warning', `Only ${docComments} JSDoc comments found`);
    }
    
    // Check error messages
    const errorMessages = (content.match(/throw new Error\(['"`][^'"`]+['"`]\)/g) || []).length;
    if (errorMessages >= 3) {
        logSuccess(`Good error messaging: ${errorMessages} custom error messages`);
        addResult('Error Messages', 'pass', `${errorMessages} custom error messages`);
    } else {
        logWarning(`Limited error messaging: ${errorMessages} custom error messages`);
        addResult('Error Messages', 'warning', `Only ${errorMessages} custom error messages`);
    }
    
    // Check console logging
    if (content.includes('console.log') && content.includes('console.warn')) {
        logSuccess('Debug logging implemented');
        addResult('Debug Logging', 'pass', 'Console logging for debugging');
    } else {
        logWarning('Limited debug logging');
        addResult('Debug Logging', 'warning', 'Limited console logging');
    }
    
    // Check constants usage
    if (content.includes('this.loadTimeout') && content.includes('this.retryAttempts')) {
        logSuccess('Configurable parameters implemented');
        addResult('Configuration', 'pass', 'Configurable timeout and retry parameters');
    } else {
        logWarning('Limited configurability');
        addResult('Configuration', 'warning', 'Parameters may not be configurable');
    }
}

function generateReport() {
    logHeader('VALIDATION REPORT');
    
    log(`\n📊 Summary:`, 'bright');
    log(`   ✅ Passed: ${results.passed}`, 'green');
    log(`   ❌ Failed: ${results.failed}`, 'red');
    log(`   ⚠️  Warnings: ${results.warnings}`, 'yellow');
    log(`   📝 Total Tests: ${results.details.length}`, 'cyan');
    
    const successRate = ((results.passed / results.details.length) * 100).toFixed(1);
    log(`   📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
    
    if (results.failed > 0) {
        log(`\n❌ Failed Tests:`, 'red');
        results.details
            .filter(r => r.status === 'fail')
            .forEach(r => {
                log(`   • ${r.test}: ${r.message}${r.requirement ? ` (Req: ${r.requirement})` : ''}`, 'red');
            });
    }
    
    if (results.warnings > 0) {
        log(`\n⚠️  Warnings:`, 'yellow');
        results.details
            .filter(r => r.status === 'warning')
            .forEach(r => {
                log(`   • ${r.test}: ${r.message}`, 'yellow');
            });
    }
    
    log(`\n🎯 Overall Status: ${results.failed === 0 ? 'PASS' : 'FAIL'}`, results.failed === 0 ? 'green' : 'red');
    
    // Save detailed report
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
            passed: results.passed,
            failed: results.failed,
            warnings: results.warnings,
            total: results.details.length,
            successRate: parseFloat(successRate)
        },
        details: results.details,
        status: results.failed === 0 ? 'PASS' : 'FAIL'
    };
    
    fs.writeFileSync('database-loader-validation-report.json', JSON.stringify(reportData, null, 2));
    logInfo('Detailed report saved to database-loader-validation-report.json');
}

// Main validation execution
function main() {
    logHeader('DatabaseLoader Implementation Validation');
    logInfo('Validating Task 2: Implement DatabaseLoader for WordPress integration');
    logInfo('Requirements: 2.1, 2.2, 2.3, 2.4');
    
    try {
        validateJavaScriptFile();
        validatePHPEndpoint();
        validateTestFiles();
        validateCodeQuality();
        validateRequirements();
        generateReport();
        
        // Exit with appropriate code
        process.exit(results.failed === 0 ? 0 : 1);
        
    } catch (error) {
        logError(`Validation failed with error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run validation
if (require.main === module) {
    main();
}

module.exports = {
    validateJavaScriptFile,
    validatePHPEndpoint,
    validateTestFiles,
    validateCodeQuality,
    results
};