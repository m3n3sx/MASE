/**
 * Validation script for DebugLogger implementation
 * Tests all core functionality to ensure requirements are met
 */

// Mock browser environment for Node.js testing
const mockBrowser = () => {
    global.window = {
        location: {
            search: '?woow_debug=1',
            hostname: 'localhost',
            href: 'http://localhost:3000'
        },
        localStorage: {
            data: {},
            getItem: function(key) { return this.data[key] || null; },
            setItem: function(key, value) { this.data[key] = value; },
            removeItem: function(key) { delete this.data[key]; },
            clear: function() { this.data = {}; }
        },
        performance: {
            now: () => Date.now()
        },
        console: console,
        document: {
            documentElement: {
                style: {
                    setProperty: (prop, value) => console.log(`CSS: ${prop} = ${value}`),
                    removeProperty: (prop) => console.log(`CSS: Removed ${prop}`),
                    length: 0
                }
            },
            createElement: () => ({
                href: '',
                download: '',
                click: () => console.log('Download clicked')
            })
        },
        getComputedStyle: () => ({
            length: 4,
            0: '--woow-surface-bar',
            1: '--woow-surface-menu', 
            2: '--woow-text-primary',
            3: '--woow-accent-primary',
            getPropertyValue: (prop) => {
                const values = {
                    '--woow-surface-bar': '#23282d',
                    '--woow-surface-menu': '#ffffff',
                    '--woow-text-primary': '#1d2327',
                    '--woow-accent-primary': '#2271b1'
                };
                return values[prop] || '';
            }
        }),
        URL: {
            createObjectURL: () => 'blob:mock-url'
        },
        Blob: function() {}
    };
    
    global.localStorage = global.window.localStorage;
    global.performance = global.window.performance;
    global.document = global.window.document;
    global.getComputedStyle = global.window.getComputedStyle;
};

// Set up mock environment
mockBrowser();

// Load DebugLogger
const DebugLogger = require('./assets/js/debug-logger.js');

// Test suite
const runValidationTests = () => {
    console.log('🔍 Starting DebugLogger Validation Tests\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    const test = (name, testFn) => {
        totalTests++;
        try {
            testFn();
            console.log(`✅ ${name}`);
            passedTests++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
        }
    };
    
    // Test 1: Debug Mode Detection (Requirement 4.1)
    test('Debug mode detection works correctly', () => {
        const logger = new DebugLogger();
        const isDebugMode = logger.detectDebugMode();
        
        if (typeof isDebugMode !== 'boolean') {
            throw new Error('Debug mode detection should return boolean');
        }
        
        // Should be true due to localhost hostname
        if (!isDebugMode) {
            throw new Error('Debug mode should be detected on localhost');
        }
    });
    
    // Test 2: Logging Methods (Requirement 4.2)
    test('Logging methods work with proper context', () => {
        const logger = new DebugLogger();
        logger.clearLogs(); // Clear initialization logs
        
        logger.log('Test info message', { test: 'data' });
        logger.warn('Test warning', new Error('Test error'));
        logger.error('Test error', new Error('Test error'));
        
        const logs = logger.logs;
        
        // Should have at least 4 logs (clear + 3 test logs)
        if (logs.length < 4) {
            throw new Error(`Expected at least 4 logs, got ${logs.length}`);
        }
        
        // Check log structure
        const testLog = logs.find(log => log.message === 'Test info message');
        if (!testLog || !testLog.timestamp || testLog.level !== 'info') {
            throw new Error('Info log structure is incorrect');
        }
        
        const warnLog = logs.find(log => log.message === 'Test warning');
        if (!warnLog || warnLog.level !== 'warn' || !warnLog.error) {
            throw new Error('Warning log structure is incorrect');
        }
    });
    
    // Test 3: Performance Timing (Requirement 4.1)
    test('Performance timing and metrics collection', () => {
        const logger = new DebugLogger();
        
        logger.startTiming('restoration');
        
        // Simulate some work
        setTimeout(() => {
            const duration = logger.endTiming('restoration');
            
            if (duration === null || duration < 0) {
                throw new Error('Timing should return valid duration');
            }
        }, 10);
        
        // Test variable application tracking
        logger.recordVariableApplication(5, 'database');
        const metrics = logger.getMetrics();
        
        if (metrics.totalVariablesApplied !== 5) {
            throw new Error(`Expected 5 variables applied, got ${metrics.totalVariablesApplied}`);
        }
    });
    
    // Test 4: Console Utilities (Requirement 4.3)
    test('Console utilities installation and functionality', () => {
        const logger = new DebugLogger();
        
        // Check if utilities are installed
        if (!global.window.woowDebugCSS) {
            throw new Error('Console utilities not installed');
        }
        
        const utilities = global.window.woowDebugCSS;
        const expectedUtilities = [
            'showAppliedVariables',
            'testVariable',
            'resetToDefaults',
            'showDebugState',
            'setDebugMode',
            'exportLogs',
            'help'
        ];
        
        for (const util of expectedUtilities) {
            if (typeof utilities[util] !== 'function') {
                throw new Error(`Utility ${util} not found or not a function`);
            }
        }
        
        // Test showAppliedVariables
        const appliedVars = utilities.showAppliedVariables();
        if (typeof appliedVars !== 'object' || Object.keys(appliedVars).length === 0) {
            throw new Error('showAppliedVariables should return object with variables');
        }
        
        // Test testVariable
        const testResult = utilities.testVariable('test-var', '#ff0000');
        if (!testResult || testResult.variable !== '--woow-test-var') {
            throw new Error('testVariable should return correct result');
        }
    });
    
    // Test 5: Report Generation (Requirement 4.4)
    test('Restoration report generation', () => {
        const logger = new DebugLogger();
        logger.clearLogs();
        
        // Add some test data
        logger.log('Test log for report');
        logger.warn('Test warning for report');
        logger.recordVariableApplication(3, 'localStorage');
        logger.startTiming('restoration');
        logger.endTiming('restoration');
        
        const report = logger.generateReport();
        
        // Check report structure
        const requiredSections = ['summary', 'performance', 'logs', 'metrics'];
        for (const section of requiredSections) {
            if (!report[section]) {
                throw new Error(`Report missing ${section} section`);
            }
        }
        
        // Check summary data
        if (typeof report.summary.logCount !== 'number' ||
            typeof report.summary.variablesApplied !== 'number' ||
            typeof report.summary.debugMode !== 'boolean') {
            throw new Error('Report summary data is incorrect');
        }
        
        if (report.summary.variablesApplied !== 3) {
            throw new Error(`Expected 3 variables in report, got ${report.summary.variablesApplied}`);
        }
    });
    
    // Test 6: Error Handling
    test('Error handling and graceful degradation', () => {
        // Test with localStorage errors
        const originalGetItem = global.window.localStorage.getItem;
        global.window.localStorage.getItem = () => {
            throw new Error('localStorage error');
        };
        
        try {
            const logger = new DebugLogger();
            // Should not throw even with localStorage errors
            const isDebugMode = logger.detectDebugMode();
            if (typeof isDebugMode !== 'boolean') {
                throw new Error('Should handle localStorage errors gracefully');
            }
        } finally {
            global.window.localStorage.getItem = originalGetItem;
        }
    });
    
    // Test 7: Utility Methods
    test('Utility methods work correctly', () => {
        const logger = new DebugLogger();
        logger.clearLogs();
        
        logger.log('Test log');
        logger.warn('Test warning');
        
        // Test filtering
        const infoLogs = logger.getLogsByLevel('info');
        const warnLogs = logger.getLogsByLevel('warn');
        
        if (infoLogs.length < 1 || warnLogs.length !== 1) {
            throw new Error('Log filtering not working correctly');
        }
        
        // Test metrics
        const metrics = logger.getMetrics();
        if (typeof metrics !== 'object' || metrics === logger.metrics) {
            throw new Error('getMetrics should return a copy of metrics');
        }
        
        // Test debug mode check
        const isDebugActive = logger.isDebugActive();
        if (typeof isDebugActive !== 'boolean') {
            throw new Error('isDebugActive should return boolean');
        }
    });
    
    // Summary
    console.log(`\n📊 Validation Results: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All DebugLogger requirements validated successfully!');
        console.log('\n✅ Requirements Coverage:');
        console.log('  4.1 - Debug mode detection and logging system: ✅');
        console.log('  4.2 - Performance timing and metrics collection: ✅');
        console.log('  4.3 - Console utilities for manual CSS variable debugging: ✅');
        console.log('  4.4 - Restoration report generation: ✅');
        return true;
    } else {
        console.log('⚠️ Some tests failed. Check implementation.');
        return false;
    }
};

// Run validation
const success = runValidationTests();
process.exit(success ? 0 : 1);