#!/usr/bin/env node

/**
 * WOOW Admin Integration System Validation Script
 * 
 * Validates the integration between CSS Variables Restoration System 
 * and existing WOOW Admin Styler system.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * Usage: node validate-woow-admin-integration.js
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

class WOOWIntegrationValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        
        this.startTime = Date.now();
    }

    /**
     * Log test result
     */
    log(level, message, details = null) {
        const timestamp = new Date().toISOString();
        const colorMap = {
            'PASS': colors.green,
            'FAIL': colors.red,
            'WARN': colors.yellow,
            'INFO': colors.blue
        };
        
        const color = colorMap[level] || colors.reset;
        console.log(`${color}[${level}]${colors.reset} ${message}`);
        
        if (details) {
            console.log(`${colors.cyan}Details:${colors.reset}`, details);
        }
        
        this.results.tests.push({
            timestamp,
            level,
            message,
            details
        });
        
        if (level === 'PASS') this.results.passed++;
        else if (level === 'FAIL') this.results.failed++;
        else if (level === 'WARN') this.results.warnings++;
    }

    /**
     * Test file existence and basic structure
     */
    testFileStructure() {
        this.log('INFO', 'Testing file structure...');
        
        const requiredFiles = [
            'assets/js/woow-admin-integration-system.js',
            'assets/js/css-variables-restorer.js',
            'assets/js/css-variables-initialization-system.js',
            'woow-admin-styler.php'
        ];
        
        let allFilesExist = true;
        
        requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                this.log('PASS', `File exists: ${file}`);
            } else {
                this.log('FAIL', `Missing required file: ${file}`);
                allFilesExist = false;
            }
        });
        
        return allFilesExist;
    }

    /**
     * Test integration system JavaScript structure
     */
    testIntegrationSystemStructure() {
        this.log('INFO', 'Testing integration system structure...');
        
        const integrationFile = 'assets/js/woow-admin-integration-system.js';
        
        if (!fs.existsSync(integrationFile)) {
            this.log('FAIL', 'Integration system file not found');
            return false;
        }
        
        const content = fs.readFileSync(integrationFile, 'utf8');
        
        // Test for required class definition
        if (content.includes('class WOOWAdminIntegrationSystem')) {
            this.log('PASS', 'WOOWAdminIntegrationSystem class found');
        } else {
            this.log('FAIL', 'WOOWAdminIntegrationSystem class not found');
            return false;
        }
        
        // Test for required methods
        const requiredMethods = [
            'initialize',
            'detectExistingSystems',
            'initializeRestorationIntegration',
            'setupBackwardCompatibility',
            'createMigrationPath',
            'establishUnifiedInterface'
        ];
        
        let allMethodsFound = true;
        
        requiredMethods.forEach(method => {
            if (content.includes(method)) {
                this.log('PASS', `Method found: ${method}`);
            } else {
                this.log('FAIL', `Missing required method: ${method}`);
                allMethodsFound = false;
            }
        });
        
        // Test for requirements compliance
        const requirements = ['5.1', '5.2', '5.3', '5.4'];
        requirements.forEach(req => {
            if (content.includes(`Requirements: ${req}`) || content.includes(`Requirement ${req}`)) {
                this.log('PASS', `Requirement ${req} documented`);
            } else {
                this.log('WARN', `Requirement ${req} not explicitly documented`);
            }
        });
        
        return allMethodsFound;
    }

    /**
     * Test PHP integration
     */
    testPHPIntegration() {
        this.log('INFO', 'Testing PHP integration...');
        
        const phpFile = 'woow-admin-styler.php';
        
        if (!fs.existsSync(phpFile)) {
            this.log('FAIL', 'Main PHP file not found');
            return false;
        }
        
        const content = fs.readFileSync(phpFile, 'utf8');
        
        // Test for integration assets enqueuing
        if (content.includes('woow-admin-integration')) {
            this.log('PASS', 'Integration assets enqueuing found');
        } else {
            this.log('FAIL', 'Integration assets enqueuing not found');
            return false;
        }
        
        // Test for AJAX endpoints
        const requiredEndpoints = [
            'woow_load_css_variables',
            'woow_save_css_variables',
            'woow_test_connection'
        ];
        
        let allEndpointsFound = true;
        
        requiredEndpoints.forEach(endpoint => {
            if (content.includes(endpoint)) {
                this.log('PASS', `AJAX endpoint found: ${endpoint}`);
            } else {
                this.log('FAIL', `Missing AJAX endpoint: ${endpoint}`);
                allEndpointsFound = false;
            }
        });
        
        // Test for helper methods
        const requiredHelpers = [
            'generateCSSVariablesArray',
            'convertCSSVariablesToSettings',
            'enqueueIntegrationAssets'
        ];
        
        requiredHelpers.forEach(helper => {
            if (content.includes(helper)) {
                this.log('PASS', `Helper method found: ${helper}`);
            } else {
                this.log('FAIL', `Missing helper method: ${helper}`);
                allEndpointsFound = false;
            }
        });
        
        return allEndpointsFound;
    }

    /**
     * Test backward compatibility features
     */
    testBackwardCompatibility() {
        this.log('INFO', 'Testing backward compatibility features...');
        
        const integrationFile = 'assets/js/woow-admin-integration-system.js';
        const content = fs.readFileSync(integrationFile, 'utf8');
        
        // Test for legacy API compatibility
        const legacyAPIs = [
            'initializeMASTheme',
            'applyCSSVariable',
            'WOOW_ThemeManager'
        ];
        
        let compatibilityFound = true;
        
        legacyAPIs.forEach(api => {
            if (content.includes(api)) {
                this.log('PASS', `Legacy API compatibility found: ${api}`);
            } else {
                this.log('FAIL', `Missing legacy API compatibility: ${api}`);
                compatibilityFound = false;
            }
        });
        
        // Test for legacy event mapping
        const legacyEvents = [
            'masThemeReady',
            'masThemeError',
            'masLiveChange'
        ];
        
        legacyEvents.forEach(event => {
            if (content.includes(event)) {
                this.log('PASS', `Legacy event mapping found: ${event}`);
            } else {
                this.log('FAIL', `Missing legacy event mapping: ${event}`);
                compatibilityFound = false;
            }
        });
        
        return compatibilityFound;
    }

    /**
     * Test migration system
     */
    testMigrationSystem() {
        this.log('INFO', 'Testing migration system...');
        
        const integrationFile = 'assets/js/woow-admin-integration-system.js';
        const content = fs.readFileSync(integrationFile, 'utf8');
        
        // Test for migration methods
        const migrationMethods = [
            'migrateLegacyLocalStorage',
            'migrateLegacyCSSVariables',
            'migrateLegacyEventListeners',
            'convertLegacyVariables'
        ];
        
        let allMigrationMethodsFound = true;
        
        migrationMethods.forEach(method => {
            if (content.includes(method)) {
                this.log('PASS', `Migration method found: ${method}`);
            } else {
                this.log('FAIL', `Missing migration method: ${method}`);
                allMigrationMethodsFound = false;
            }
        });
        
        // Test for legacy pattern detection
        if (content.includes('detectLegacyInitialization')) {
            this.log('PASS', 'Legacy pattern detection found');
        } else {
            this.log('FAIL', 'Legacy pattern detection not found');
            allMigrationMethodsFound = false;
        }
        
        return allMigrationMethodsFound;
    }

    /**
     * Test unified interface
     */
    testUnifiedInterface() {
        this.log('INFO', 'Testing unified interface...');
        
        const integrationFile = 'assets/js/woow-admin-integration-system.js';
        const content = fs.readFileSync(integrationFile, 'utf8');
        
        // Test for unified interfaces
        const unifiedInterfaces = [
            'woowCSSVariables',
            'woowTheme'
        ];
        
        let allInterfacesFound = true;
        
        unifiedInterfaces.forEach(interfaceName => {
            if (content.includes(interfaceName)) {
                this.log('PASS', `Unified interface found: ${interfaceName}`);
            } else {
                this.log('FAIL', `Missing unified interface: ${interfaceName}`);
                allInterfacesFound = false;
            }
        });
        
        // Test for interface methods
        const interfaceMethods = [
            'apply',
            'getCurrent',
            'refresh',
            'getState'
        ];
        
        interfaceMethods.forEach(method => {
            if (content.includes(`${method}:`)) {
                this.log('PASS', `Interface method found: ${method}`);
            } else {
                this.log('WARN', `Interface method may be missing: ${method}`);
            }
        });
        
        return allInterfacesFound;
    }

    /**
     * Test error handling and debugging
     */
    testErrorHandling() {
        this.log('INFO', 'Testing error handling and debugging...');
        
        const integrationFile = 'assets/js/woow-admin-integration-system.js';
        const content = fs.readFileSync(integrationFile, 'utf8');
        
        // Test for error handling
        const errorHandlingFeatures = [
            'handleIntegrationError',
            'scheduleIntegrationRetry',
            'attemptLegacyFallback',
            'try {',
            'catch ('
        ];
        
        let errorHandlingFound = true;
        
        errorHandlingFeatures.forEach(feature => {
            if (content.includes(feature)) {
                this.log('PASS', `Error handling feature found: ${feature}`);
            } else {
                this.log('FAIL', `Missing error handling feature: ${feature}`);
                errorHandlingFound = false;
            }
        });
        
        // Test for debugging features
        const debugFeatures = [
            'detectDebugMode',
            'log(',
            'warn(',
            'generateIntegrationReport'
        ];
        
        debugFeatures.forEach(feature => {
            if (content.includes(feature)) {
                this.log('PASS', `Debug feature found: ${feature}`);
            } else {
                this.log('FAIL', `Missing debug feature: ${feature}`);
                errorHandlingFound = false;
            }
        });
        
        return errorHandlingFound;
    }

    /**
     * Test code quality and standards
     */
    testCodeQuality() {
        this.log('INFO', 'Testing code quality and standards...');
        
        const integrationFile = 'assets/js/woow-admin-integration-system.js';
        const content = fs.readFileSync(integrationFile, 'utf8');
        
        let qualityScore = 0;
        const totalChecks = 8;
        
        // Test for JSDoc comments
        if (content.includes('/**') && content.includes('*/')) {
            this.log('PASS', 'JSDoc comments found');
            qualityScore++;
        } else {
            this.log('WARN', 'JSDoc comments not found');
        }
        
        // Test for proper class structure
        if (content.includes('constructor()') && content.includes('class ')) {
            this.log('PASS', 'Proper class structure found');
            qualityScore++;
        } else {
            this.log('FAIL', 'Improper class structure');
        }
        
        // Test for method binding
        if (content.includes('.bind(this)')) {
            this.log('PASS', 'Method binding found');
            qualityScore++;
        } else {
            this.log('WARN', 'Method binding not found');
        }
        
        // Test for async/await usage
        if (content.includes('async ') && content.includes('await ')) {
            this.log('PASS', 'Async/await usage found');
            qualityScore++;
        } else {
            this.log('WARN', 'Async/await usage not found');
        }
        
        // Test for proper event handling
        if (content.includes('addEventListener') && content.includes('CustomEvent')) {
            this.log('PASS', 'Proper event handling found');
            qualityScore++;
        } else {
            this.log('FAIL', 'Improper event handling');
        }
        
        // Test for performance considerations
        if (content.includes('performance.now()') || content.includes('requestAnimationFrame')) {
            this.log('PASS', 'Performance considerations found');
            qualityScore++;
        } else {
            this.log('WARN', 'Performance considerations not found');
        }
        
        // Test for memory management
        if (content.includes('clearTimeout') || content.includes('removeEventListener')) {
            this.log('PASS', 'Memory management found');
            qualityScore++;
        } else {
            this.log('WARN', 'Memory management not found');
        }
        
        // Test for browser compatibility
        if (content.includes('typeof window') && content.includes('typeof module')) {
            this.log('PASS', 'Browser compatibility checks found');
            qualityScore++;
        } else {
            this.log('WARN', 'Browser compatibility checks not found');
        }
        
        const qualityPercentage = (qualityScore / totalChecks) * 100;
        this.log('INFO', `Code quality score: ${qualityScore}/${totalChecks} (${qualityPercentage.toFixed(1)}%)`);
        
        return qualityPercentage >= 70; // 70% minimum quality threshold
    }

    /**
     * Test integration with existing systems
     */
    testSystemIntegration() {
        this.log('INFO', 'Testing system integration...');
        
        const integrationFile = 'assets/js/woow-admin-integration-system.js';
        const content = fs.readFileSync(integrationFile, 'utf8');
        
        // Test for system detection
        const systemDetectionFeatures = [
            'detectExistingSystems',
            'systemsDetected',
            'CSSVariablesRestorer',
            'WOOW_ThemeManager'
        ];
        
        let integrationFound = true;
        
        systemDetectionFeatures.forEach(feature => {
            if (content.includes(feature)) {
                this.log('PASS', `System integration feature found: ${feature}`);
            } else {
                this.log('FAIL', `Missing system integration feature: ${feature}`);
                integrationFound = false;
            }
        });
        
        // Test for coordination features
        const coordinationFeatures = [
            'setupRestorationEventListeners',
            'handleRestorationComplete',
            'updateLegacyThemeManager',
            'updateLiveEditSystem'
        ];
        
        coordinationFeatures.forEach(feature => {
            if (content.includes(feature)) {
                this.log('PASS', `System coordination feature found: ${feature}`);
            } else {
                this.log('FAIL', `Missing system coordination feature: ${feature}`);
                integrationFound = false;
            }
        });
        
        return integrationFound;
    }

    /**
     * Run all validation tests
     */
    async runValidation() {
        console.log(`${colors.bright}${colors.blue}WOOW Admin Integration System Validation${colors.reset}`);
        console.log(`${colors.cyan}Starting validation at ${new Date().toISOString()}${colors.reset}\n`);
        
        const tests = [
            () => this.testFileStructure(),
            () => this.testIntegrationSystemStructure(),
            () => this.testPHPIntegration(),
            () => this.testBackwardCompatibility(),
            () => this.testMigrationSystem(),
            () => this.testUnifiedInterface(),
            () => this.testErrorHandling(),
            () => this.testCodeQuality(),
            () => this.testSystemIntegration()
        ];
        
        let allTestsPassed = true;
        
        for (const test of tests) {
            try {
                const result = test();
                if (!result) {
                    allTestsPassed = false;
                }
            } catch (error) {
                this.log('FAIL', `Test execution error: ${error.message}`);
                allTestsPassed = false;
            }
            console.log(''); // Add spacing between tests
        }
        
        // Generate final report
        this.generateFinalReport(allTestsPassed);
        
        return allTestsPassed;
    }

    /**
     * Generate final validation report
     */
    generateFinalReport(allTestsPassed) {
        const duration = Date.now() - this.startTime;
        const totalTests = this.results.passed + this.results.failed;
        const successRate = totalTests > 0 ? (this.results.passed / totalTests * 100).toFixed(1) : 0;
        
        console.log(`${colors.bright}${colors.magenta}VALIDATION REPORT${colors.reset}`);
        console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
        console.log(`Duration: ${duration}ms`);
        console.log(`Total Tests: ${totalTests}`);
        console.log(`${colors.green}Passed: ${this.results.passed}${colors.reset}`);
        console.log(`${colors.red}Failed: ${this.results.failed}${colors.reset}`);
        console.log(`${colors.yellow}Warnings: ${this.results.warnings}${colors.reset}`);
        console.log(`Success Rate: ${successRate}%`);
        
        if (allTestsPassed) {
            console.log(`\n${colors.bright}${colors.green}✅ VALIDATION PASSED${colors.reset}`);
            console.log(`${colors.green}The WOOW Admin Integration System meets all requirements.${colors.reset}`);
        } else {
            console.log(`\n${colors.bright}${colors.red}❌ VALIDATION FAILED${colors.reset}`);
            console.log(`${colors.red}The integration system has issues that need to be addressed.${colors.reset}`);
        }
        
        // Save detailed report to file
        const reportData = {
            timestamp: new Date().toISOString(),
            duration,
            summary: {
                totalTests,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                successRate: parseFloat(successRate),
                overallResult: allTestsPassed ? 'PASSED' : 'FAILED'
            },
            tests: this.results.tests
        };
        
        fs.writeFileSync('woow-integration-validation-report.json', JSON.stringify(reportData, null, 2));
        console.log(`\n${colors.cyan}Detailed report saved to: woow-integration-validation-report.json${colors.reset}`);
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new WOOWIntegrationValidator();
    validator.runValidation().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error(`${colors.red}Validation error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = WOOWIntegrationValidator;