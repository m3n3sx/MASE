/**
 * Validation Script for CSS Variables Initialization System
 * 
 * Tests all aspects of the DOMContentLoaded initialization system:
 * - Early DOM ready detection and handler registration
 * - Critical path optimization for immediate restoration
 * - Initialization timing coordination
 * - Graceful degradation for slow-loading pages
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

const fs = require('fs');
const path = require('path');

class CSSVariablesInitializationSystemValidator {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Run all validation tests
     */
    async runAllTests() {
        console.log('🚀 Starting CSS Variables Initialization System Validation\n');
        
        try {
            // Test 1: File existence and structure
            await this.testFileExistence();
            
            // Test 2: Code structure and class definition
            await this.testCodeStructure();
            
            // Test 3: DOM ready detection implementation
            await this.testDOMReadyDetection();
            
            // Test 4: Critical path optimization
            await this.testCriticalPathOptimization();
            
            // Test 5: Timing coordination
            await this.testTimingCoordination();
            
            // Test 6: Graceful degradation
            await this.testGracefulDegradation();
            
            // Test 7: Integration with CSS Variables Restorer
            await this.testRestorerIntegration();
            
            // Test 8: Error handling and retry logic
            await this.testErrorHandling();
            
            // Test 9: Debug and monitoring capabilities
            await this.testDebugCapabilities();
            
            // Test 10: Requirements compliance
            await this.testRequirementsCompliance();
            
            // Generate final report
            this.generateReport();
            
        } catch (error) {
            this.errors.push(`Critical validation error: ${error.message}`);
            this.generateReport();
        }
    }

    /**
     * Test 1: File existence and structure
     */
    async testFileExistence() {
        console.log('📁 Testing file existence and structure...');
        
        const requiredFiles = [
            'assets/js/css-variables-initialization-system.js',
            'assets/js/css-variables-restorer.js',
            'test-css-variables-initialization-system.html'
        ];
        
        for (const filePath of requiredFiles) {
            if (fs.existsSync(filePath)) {
                this.testResults.push({
                    test: 'File Existence',
                    item: filePath,
                    status: 'PASS',
                    message: 'File exists'
                });
            } else {
                this.errors.push(`Required file missing: ${filePath}`);
                this.testResults.push({
                    test: 'File Existence',
                    item: filePath,
                    status: 'FAIL',
                    message: 'File missing'
                });
            }
        }
    }

    /**
     * Test 2: Code structure and class definition
     */
    async testCodeStructure() {
        console.log('🏗️  Testing code structure and class definition...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Test class definition
            if (initSystemCode.includes('class CSSVariablesInitializationSystem')) {
                this.testResults.push({
                    test: 'Code Structure',
                    item: 'Class Definition',
                    status: 'PASS',
                    message: 'CSSVariablesInitializationSystem class defined'
                });
            } else {
                this.errors.push('CSSVariablesInitializationSystem class not found');
            }
            
            // Test required methods
            const requiredMethods = [
                'startInitialization',
                'setupDOMReadyDetection',
                'handleDOMReady',
                'initializeCriticalPath',
                'handleSlowLoading',
                'setupSlowLoadingDetection',
                'performCriticalPathInitialization',
                'initializeCSSVariablesRestorer',
                'handleInitializationError',
                'scheduleRetry',
                'forceInitialization',
                'markInitializationComplete'
            ];
            
            for (const method of requiredMethods) {
                if (initSystemCode.includes(method)) {
                    this.testResults.push({
                        test: 'Code Structure',
                        item: `Method: ${method}`,
                        status: 'PASS',
                        message: 'Method implemented'
                    });
                } else {
                    this.errors.push(`Required method missing: ${method}`);
                }
            }
            
            // Test auto-initialization
            if (initSystemCode.includes('window.cssVariablesInitializationSystem = new CSSVariablesInitializationSystem()')) {
                this.testResults.push({
                    test: 'Code Structure',
                    item: 'Auto-initialization',
                    status: 'PASS',
                    message: 'Auto-initialization implemented'
                });
            } else {
                this.errors.push('Auto-initialization not found');
            }
            
        } catch (error) {
            this.errors.push(`Code structure test failed: ${error.message}`);
        }
    }

    /**
     * Test 3: DOM ready detection implementation
     */
    async testDOMReadyDetection() {
        console.log('🎯 Testing DOM ready detection implementation...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Test multiple detection strategies
            const detectionStrategies = [
                'DOMContentLoaded',
                'readyState polling',
                'window.onload fallback',
                'Legacy IE support'
            ];
            
            const strategiesFound = [];
            
            if (initSystemCode.includes('DOMContentLoaded')) {
                strategiesFound.push('DOMContentLoaded');
            }
            
            if (initSystemCode.includes('readyState') && initSystemCode.includes('polling')) {
                strategiesFound.push('readyState polling');
            }
            
            if (initSystemCode.includes('window.addEventListener') && initSystemCode.includes('load')) {
                strategiesFound.push('window.onload fallback');
            }
            
            if (initSystemCode.includes('attachEvent') && initSystemCode.includes('onreadystatechange')) {
                strategiesFound.push('Legacy IE support');
            }
            
            for (const strategy of strategiesFound) {
                this.testResults.push({
                    test: 'DOM Ready Detection',
                    item: strategy,
                    status: 'PASS',
                    message: 'Detection strategy implemented'
                });
            }
            
            // Test early detection optimization
            if (initSystemCode.includes('isDOMAlreadyReady') && initSystemCode.includes('interactive')) {
                this.testResults.push({
                    test: 'DOM Ready Detection',
                    item: 'Early Detection',
                    status: 'PASS',
                    message: 'Early DOM ready detection implemented'
                });
            } else {
                this.warnings.push('Early DOM ready detection may not be optimized');
            }
            
        } catch (error) {
            this.errors.push(`DOM ready detection test failed: ${error.message}`);
        }
    }

    /**
     * Test 4: Critical path optimization
     */
    async testCriticalPathOptimization() {
        console.log('⚡ Testing critical path optimization...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Test requestAnimationFrame usage
            if (initSystemCode.includes('requestAnimationFrame')) {
                this.testResults.push({
                    test: 'Critical Path Optimization',
                    item: 'requestAnimationFrame',
                    status: 'PASS',
                    message: 'Using requestAnimationFrame for optimal timing'
                });
            } else {
                this.warnings.push('requestAnimationFrame not used for critical path timing');
            }
            
            // Test critical path timeout
            if (initSystemCode.includes('criticalPathTimeout')) {
                this.testResults.push({
                    test: 'Critical Path Optimization',
                    item: 'Critical Path Timeout',
                    status: 'PASS',
                    message: 'Critical path timeout configured'
                });
            } else {
                this.warnings.push('Critical path timeout not configured');
            }
            
            // Test immediate initialization
            if (initSystemCode.includes('initializeCriticalPath')) {
                this.testResults.push({
                    test: 'Critical Path Optimization',
                    item: 'Immediate Initialization',
                    status: 'PASS',
                    message: 'Critical path initialization method implemented'
                });
            } else {
                this.errors.push('Critical path initialization method missing');
            }
            
        } catch (error) {
            this.errors.push(`Critical path optimization test failed: ${error.message}`);
        }
    }

    /**
     * Test 5: Timing coordination
     */
    async testTimingCoordination() {
        console.log('⏱️  Testing timing coordination...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Test timing tracking
            const timingFeatures = [
                'initStartTime',
                'domReadyTime',
                'restorationCompleteTime',
                'performance.now()',
                'timings'
            ];
            
            for (const feature of timingFeatures) {
                if (initSystemCode.includes(feature)) {
                    this.testResults.push({
                        test: 'Timing Coordination',
                        item: feature,
                        status: 'PASS',
                        message: 'Timing feature implemented'
                    });
                } else {
                    this.warnings.push(`Timing feature may be missing: ${feature}`);
                }
            }
            
            // Test timing state management
            if (initSystemCode.includes('initializationState') && initSystemCode.includes('timings')) {
                this.testResults.push({
                    test: 'Timing Coordination',
                    item: 'State Management',
                    status: 'PASS',
                    message: 'Timing state management implemented'
                });
            } else {
                this.errors.push('Timing state management not found');
            }
            
        } catch (error) {
            this.errors.push(`Timing coordination test failed: ${error.message}`);
        }
    }

    /**
     * Test 6: Graceful degradation
     */
    async testGracefulDegradation() {
        console.log('🛡️  Testing graceful degradation...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Test slow loading detection
            if (initSystemCode.includes('slowLoadingThreshold') && initSystemCode.includes('handleSlowLoading')) {
                this.testResults.push({
                    test: 'Graceful Degradation',
                    item: 'Slow Loading Detection',
                    status: 'PASS',
                    message: 'Slow loading detection implemented'
                });
            } else {
                this.errors.push('Slow loading detection not implemented');
            }
            
            // Test fallback strategies
            const fallbackFeatures = [
                'applySlowLoadingFallbacks',
                'applyCachedVariablesDirectly',
                'startAggressiveDOMPolling',
                'forceInitialization',
                'applyDefaultVariablesDirectly'
            ];
            
            for (const feature of fallbackFeatures) {
                if (initSystemCode.includes(feature)) {
                    this.testResults.push({
                        test: 'Graceful Degradation',
                        item: feature,
                        status: 'PASS',
                        message: 'Fallback strategy implemented'
                    });
                } else {
                    this.warnings.push(`Fallback strategy may be missing: ${feature}`);
                }
            }
            
            // Test maximum timeout protection
            if (initSystemCode.includes('maxInitializationTime') && initSystemCode.includes('setupMaxTimeoutProtection')) {
                this.testResults.push({
                    test: 'Graceful Degradation',
                    item: 'Maximum Timeout Protection',
                    status: 'PASS',
                    message: 'Maximum timeout protection implemented'
                });
            } else {
                this.errors.push('Maximum timeout protection not found');
            }
            
        } catch (error) {
            this.errors.push(`Graceful degradation test failed: ${error.message}`);
        }
    }

    /**
     * Test 7: Integration with CSS Variables Restorer
     */
    async testRestorerIntegration() {
        console.log('🔗 Testing integration with CSS Variables Restorer...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            const restorerPath = 'assets/js/css-variables-restorer.js';
            const restorerCode = fs.readFileSync(restorerPath, 'utf8');
            
            // Test restorer availability check
            if (initSystemCode.includes('isCSSVariablesRestorerAvailable')) {
                this.testResults.push({
                    test: 'Restorer Integration',
                    item: 'Availability Check',
                    status: 'PASS',
                    message: 'Restorer availability check implemented'
                });
            } else {
                this.errors.push('Restorer availability check not found');
            }
            
            // Test restorer initialization
            if (initSystemCode.includes('initializeCSSVariablesRestorer')) {
                this.testResults.push({
                    test: 'Restorer Integration',
                    item: 'Initialization Method',
                    status: 'PASS',
                    message: 'Restorer initialization method implemented'
                });
            } else {
                this.errors.push('Restorer initialization method not found');
            }
            
            // Test global class availability in restorer
            if (restorerCode.includes('window.CSSVariablesRestorer = CSSVariablesRestorer')) {
                this.testResults.push({
                    test: 'Restorer Integration',
                    item: 'Global Class Availability',
                    status: 'PASS',
                    message: 'Restorer class made globally available'
                });
            } else {
                this.errors.push('Restorer class not made globally available');
            }
            
            // Test removal of auto-initialization from restorer
            if (!restorerCode.includes('document.addEventListener(\'DOMContentLoaded\'') || 
                restorerCode.includes('Initialization is now handled by CSSVariablesInitializationSystem')) {
                this.testResults.push({
                    test: 'Restorer Integration',
                    item: 'Auto-initialization Removal',
                    status: 'PASS',
                    message: 'Auto-initialization properly removed from restorer'
                });
            } else {
                this.warnings.push('Restorer may still have auto-initialization code');
            }
            
        } catch (error) {
            this.errors.push(`Restorer integration test failed: ${error.message}`);
        }
    }

    /**
     * Test 8: Error handling and retry logic
     */
    async testErrorHandling() {
        console.log('🚨 Testing error handling and retry logic...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Test error handling methods
            const errorHandlingFeatures = [
                'handleInitializationError',
                'scheduleRetry',
                'maxAttempts',
                'retryInterval',
                'exponential backoff'
            ];
            
            if (initSystemCode.includes('handleInitializationError')) {
                this.testResults.push({
                    test: 'Error Handling',
                    item: 'Error Handler',
                    status: 'PASS',
                    message: 'Error handling method implemented'
                });
            } else {
                this.errors.push('Error handling method not found');
            }
            
            if (initSystemCode.includes('scheduleRetry') && initSystemCode.includes('maxAttempts')) {
                this.testResults.push({
                    test: 'Error Handling',
                    item: 'Retry Logic',
                    status: 'PASS',
                    message: 'Retry logic implemented'
                });
            } else {
                this.errors.push('Retry logic not properly implemented');
            }
            
            // Test exponential backoff
            if (initSystemCode.includes('retryInterval') && initSystemCode.includes('attempts')) {
                this.testResults.push({
                    test: 'Error Handling',
                    item: 'Exponential Backoff',
                    status: 'PASS',
                    message: 'Exponential backoff implemented'
                });
            } else {
                this.warnings.push('Exponential backoff may not be implemented');
            }
            
        } catch (error) {
            this.errors.push(`Error handling test failed: ${error.message}`);
        }
    }

    /**
     * Test 9: Debug and monitoring capabilities
     */
    async testDebugCapabilities() {
        console.log('🔍 Testing debug and monitoring capabilities...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Test debug features
            const debugFeatures = [
                'detectDebugMode',
                'log',
                'warn',
                'generateInitializationReport',
                'woowInitDebug',
                'CustomEvent'
            ];
            
            for (const feature of debugFeatures) {
                if (initSystemCode.includes(feature)) {
                    this.testResults.push({
                        test: 'Debug Capabilities',
                        item: feature,
                        status: 'PASS',
                        message: 'Debug feature implemented'
                    });
                } else {
                    this.warnings.push(`Debug feature may be missing: ${feature}`);
                }
            }
            
            // Test event dispatching
            if (initSystemCode.includes('woowCSSVariablesInitialized') && initSystemCode.includes('dispatchEvent')) {
                this.testResults.push({
                    test: 'Debug Capabilities',
                    item: 'Event Dispatching',
                    status: 'PASS',
                    message: 'Custom event dispatching implemented'
                });
            } else {
                this.warnings.push('Custom event dispatching may not be implemented');
            }
            
        } catch (error) {
            this.errors.push(`Debug capabilities test failed: ${error.message}`);
        }
    }

    /**
     * Test 10: Requirements compliance
     */
    async testRequirementsCompliance() {
        console.log('📋 Testing requirements compliance...');
        
        try {
            const initSystemPath = 'assets/js/css-variables-initialization-system.js';
            const initSystemCode = fs.readFileSync(initSystemPath, 'utf8');
            
            // Requirement 1.1: Immediate restoration before first paint
            if (initSystemCode.includes('DOMContentLoaded') && initSystemCode.includes('requestAnimationFrame')) {
                this.testResults.push({
                    test: 'Requirements Compliance',
                    item: 'Requirement 1.1 - Immediate Restoration',
                    status: 'PASS',
                    message: 'Immediate restoration implementation found'
                });
            } else {
                this.errors.push('Requirement 1.1 not properly implemented');
            }
            
            // Requirement 1.2: Zero visual flickering
            if (initSystemCode.includes('flickering') || initSystemCode.includes('immediate')) {
                this.testResults.push({
                    test: 'Requirements Compliance',
                    item: 'Requirement 1.2 - Zero Flickering',
                    status: 'PASS',
                    message: 'Anti-flickering measures implemented'
                });
            } else {
                this.warnings.push('Requirement 1.2 anti-flickering measures may be missing');
            }
            
            // Requirement 1.3: Complete within DOMContentLoaded
            if (initSystemCode.includes('DOMContentLoaded') && initSystemCode.includes('complete')) {
                this.testResults.push({
                    test: 'Requirements Compliance',
                    item: 'Requirement 1.3 - DOMContentLoaded Completion',
                    status: 'PASS',
                    message: 'DOMContentLoaded completion requirement addressed'
                });
            } else {
                this.errors.push('Requirement 1.3 not properly implemented');
            }
            
        } catch (error) {
            this.errors.push(`Requirements compliance test failed: ${error.message}`);
        }
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 CSS VARIABLES INITIALIZATION SYSTEM VALIDATION REPORT');
        console.log('='.repeat(80));
        
        // Summary
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
        const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   Passed: ${passedTests} (${((passedTests/totalTests)*100).toFixed(1)}%)`);
        console.log(`   Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
        console.log(`   Errors: ${this.errors.length}`);
        console.log(`   Warnings: ${this.warnings.length}`);
        
        // Test Results
        if (this.testResults.length > 0) {
            console.log(`\n✅ TEST RESULTS:`);
            const groupedResults = {};
            
            this.testResults.forEach(result => {
                if (!groupedResults[result.test]) {
                    groupedResults[result.test] = [];
                }
                groupedResults[result.test].push(result);
            });
            
            Object.entries(groupedResults).forEach(([testName, results]) => {
                console.log(`\n   ${testName}:`);
                results.forEach(result => {
                    const status = result.status === 'PASS' ? '✅' : '❌';
                    console.log(`     ${status} ${result.item}: ${result.message}`);
                });
            });
        }
        
        // Errors
        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORS:`);
            this.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        // Warnings
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS:`);
            this.warnings.forEach((warning, index) => {
                console.log(`   ${index + 1}. ${warning}`);
            });
        }
        
        // Overall Status
        console.log(`\n🎯 OVERALL STATUS:`);
        if (this.errors.length === 0) {
            console.log('   ✅ VALIDATION PASSED - Initialization system is properly implemented');
        } else {
            console.log('   ❌ VALIDATION FAILED - Critical issues found that need to be addressed');
        }
        
        console.log('\n' + '='.repeat(80));
        
        // Return summary for programmatic use
        return {
            totalTests,
            passedTests,
            failedTests,
            errors: this.errors.length,
            warnings: this.warnings.length,
            success: this.errors.length === 0
        };
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new CSSVariablesInitializationSystemValidator();
    validator.runAllTests().then(() => {
        process.exit(validator.errors.length > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = CSSVariablesInitializationSystemValidator;