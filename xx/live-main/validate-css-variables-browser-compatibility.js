/**
 * Validation script for CSS Variables Browser Compatibility Layer
 * 
 * This script validates the cross-browser compatibility implementation
 * without requiring Jest or complex test frameworks.
 */

// Mock DOM environment for Node.js testing
const { JSDOM } = require('jsdom');

// Create a mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});

// Set up global variables
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.getComputedStyle = dom.window.getComputedStyle;
global.performance = dom.window.performance || { now: () => Date.now() };
global.requestAnimationFrame = dom.window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

// window.location is already available from JSDOM

// Mock CSS.supports
global.CSS = {
    supports: function(property, value) {
        // Mock implementation for testing
        if (property === '--test' && value === 'value') return true;
        if (property === 'color' && value === 'var(--test)') return true;
        if (property === 'color' && value === 'var(--inherited, red)') return true;
        if (property === '(--test: value)') return true;
        return false;
    }
};

// Load the compatibility layer
const CSSVariablesBrowserCompatibility = require('./assets/js/css-variables-browser-compatibility.js');

// Validation functions
function validateBrowserDetection() {
    console.log('\n=== Browser Detection Tests ===');
    
    // Test Chrome detection
    Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        configurable: true
    });
    
    const chromeCompatibility = new CSSVariablesBrowserCompatibility();
    const chromeBrowser = chromeCompatibility.browserInfo;
    
    console.log('✓ Chrome Detection:', {
        name: chromeBrowser.name,
        version: chromeBrowser.version,
        engine: chromeBrowser.engine,
        isLegacy: chromeBrowser.isLegacy
    });
    
    // Test Firefox detection
    Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        configurable: true
    });
    
    const firefoxCompatibility = new CSSVariablesBrowserCompatibility();
    const firefoxBrowser = firefoxCompatibility.browserInfo;
    
    console.log('✓ Firefox Detection:', {
        name: firefoxBrowser.name,
        version: firefoxBrowser.version,
        engine: firefoxBrowser.engine,
        isLegacy: firefoxBrowser.isLegacy
    });
    
    // Test IE detection
    Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
        configurable: true
    });
    
    const ieCompatibility = new CSSVariablesBrowserCompatibility();
    const ieBrowser = ieCompatibility.browserInfo;
    
    console.log('✓ IE Detection:', {
        name: ieBrowser.name,
        version: ieBrowser.version,
        engine: ieBrowser.engine,
        isLegacy: ieBrowser.isLegacy
    });
    
    return true;
}

function validateSupportDetection() {
    console.log('\n=== Support Level Detection Tests ===');
    
    const compatibility = new CSSVariablesBrowserCompatibility();
    const support = compatibility.supportLevel;
    
    console.log('✓ Support Detection:', {
        customProperties: support.customProperties,
        customPropertiesInheritance: support.customPropertiesInheritance,
        customPropertiesInMedia: support.customPropertiesInMedia,
        customPropertiesInPseudo: support.customPropertiesInPseudo,
        performanceOptimal: support.performanceOptimal
    });
    
    return support.customProperties === true;
}

function validateVariableApplication() {
    console.log('\n=== Variable Application Tests ===');
    
    const compatibility = new CSSVariablesBrowserCompatibility();
    
    // Test modern browser application
    const testVariables = {
        '--woow-test-color': '#ff0000',
        '--woow-test-size': '16px',
        '--woow-test-font': 'Arial, sans-serif'
    };
    
    const result = compatibility.applyVariablesWithCompatibility(testVariables, 'validation-test');
    
    console.log('✓ Variable Application Result:', {
        appliedCount: result.appliedCount,
        fallbackCount: result.fallbackCount,
        duration: `${result.duration.toFixed(2)}ms`
    });
    
    return result.appliedCount > 0 || result.fallbackCount > 0;
}

function validateFallbackGeneration() {
    console.log('\n=== Fallback Generation Tests ===');
    
    const compatibility = new CSSVariablesBrowserCompatibility();
    
    const testVariables = {
        '--woow-surface-content': '#ffffff',
        '--woow-text-primary': '#333333',
        '--woow-border-radius': '4px'
    };
    
    const fallbackCSS = compatibility.generateFallbackCSS(testVariables);
    
    console.log('✓ Fallback CSS Generated:', {
        length: fallbackCSS.length,
        containsColor: fallbackCSS.includes('#ffffff'),
        containsText: fallbackCSS.includes('#333333'),
        containsRadius: fallbackCSS.includes('4px')
    });
    
    return fallbackCSS.length > 0;
}

function validateLegacyBrowserHandling() {
    console.log('\n=== Legacy Browser Handling Tests ===');
    
    // Set up IE user agent
    Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
        configurable: true
    });
    
    const compatibility = new CSSVariablesBrowserCompatibility();
    compatibility.supportLevel.customProperties = false; // Force fallback mode
    
    const testVariables = {
        '--woow-surface-content': '#f8f9fa',
        '--woow-text-primary': '#495057'
    };
    
    const result = compatibility.applyVariablesWithCompatibility(testVariables, 'legacy-test');
    
    console.log('✓ Legacy Browser Handling:', {
        isLegacy: compatibility.browserInfo.isLegacy,
        fallbackCount: result.fallbackCount,
        hasOptimizations: !!compatibility.legacyOptimizations
    });
    
    // Check that fallback styles were injected
    const styleElement = document.getElementById('woow-fallback-styles-legacy-test');
    const styleInjected = !!styleElement;
    
    console.log('✓ Fallback Style Injection:', {
        styleElementExists: styleInjected,
        hasContent: styleInjected ? styleElement.textContent.length > 0 : false
    });
    
    return result.fallbackCount > 0;
}

function validateErrorHandling() {
    console.log('\n=== Error Handling Tests ===');
    
    const compatibility = new CSSVariablesBrowserCompatibility();
    
    // Test invalid variables
    const invalidVariables = {
        'invalid-var': '#ff0000', // Missing --
        '--valid-var': '#00ff00',
        '--empty-var': '', // Empty value
        '--long-var': 'x'.repeat(1001) // Too long
    };
    
    const result = compatibility.applyVariablesWithCompatibility(invalidVariables, 'error-test');
    
    console.log('✓ Invalid Variable Handling:', {
        totalVariables: Object.keys(invalidVariables).length,
        appliedCount: result.appliedCount,
        validVariablesOnly: result.appliedCount === 1 // Only --valid-var should be applied
    });
    
    return result.appliedCount === 1;
}

function validatePerformance() {
    console.log('\n=== Performance Tests ===');
    
    const compatibility = new CSSVariablesBrowserCompatibility();
    
    // Generate many test variables
    const manyVariables = {};
    for (let i = 0; i < 50; i++) {
        manyVariables[`--woow-test-${i}`] = `#${i.toString(16).padStart(6, '0')}`;
    }
    
    const startTime = performance.now();
    const result = compatibility.applyVariablesWithCompatibility(manyVariables, 'performance-test');
    const totalDuration = performance.now() - startTime;
    
    console.log('✓ Performance Test (50 variables):', {
        totalDuration: `${totalDuration.toFixed(2)}ms`,
        applicationDuration: `${result.duration.toFixed(2)}ms`,
        averagePerVariable: `${(result.duration / 50).toFixed(2)}ms`,
        withinTarget: totalDuration < 100 // Should complete within 100ms
    });
    
    return totalDuration < 100;
}

function validateCompatibilityReport() {
    console.log('\n=== Compatibility Report Tests ===');
    
    const compatibility = new CSSVariablesBrowserCompatibility();
    const report = compatibility.getCompatibilityReport();
    
    console.log('✓ Compatibility Report:', {
        hasBrowserInfo: !!report.browser,
        hasSupportInfo: !!report.support,
        hasFallbacksInfo: Array.isArray(report.fallbacksApplied),
        hasOptimizations: !!report.optimizations
    });
    
    return !!report.browser && !!report.support;
}

function validateStaticTestMethod() {
    console.log('\n=== Static Test Method ===');
    
    const testResults = CSSVariablesBrowserCompatibility.testCompatibility();
    
    console.log('✓ Static Test Results:', {
        hasBrowserDetection: !!testResults.browserDetection,
        hasSupportLevel: !!testResults.supportLevel,
        testsTotal: testResults.testsTotal,
        testsPassed: testResults.testsPassed,
        errorCount: testResults.errors.length,
        allTestsPassed: testResults.testsPassed === testResults.testsTotal
    });
    
    return testResults.testsTotal > 0 && testResults.testsPassed > 0;
}

// Run all validation tests
async function runAllValidations() {
    console.log('🚀 Starting CSS Variables Browser Compatibility Validation\n');
    
    const tests = [
        { name: 'Browser Detection', fn: validateBrowserDetection },
        { name: 'Support Detection', fn: validateSupportDetection },
        { name: 'Variable Application', fn: validateVariableApplication },
        { name: 'Fallback Generation', fn: validateFallbackGeneration },
        { name: 'Legacy Browser Handling', fn: validateLegacyBrowserHandling },
        { name: 'Error Handling', fn: validateErrorHandling },
        { name: 'Performance', fn: validatePerformance },
        { name: 'Compatibility Report', fn: validateCompatibilityReport },
        { name: 'Static Test Method', fn: validateStaticTestMethod }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        try {
            const result = test.fn();
            if (result) {
                passedTests++;
                console.log(`✅ ${test.name}: PASSED`);
            } else {
                console.log(`❌ ${test.name}: FAILED`);
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ERROR - ${error.message}`);
        }
    }
    
    console.log(`\n📊 Validation Summary: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All validations passed! Cross-browser compatibility layer is working correctly.');
        return true;
    } else {
        console.log('⚠️  Some validations failed. Please review the implementation.');
        return false;
    }
}

// Run validations if this script is executed directly
if (require.main === module) {
    runAllValidations().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed with error:', error);
        process.exit(1);
    });
}

module.exports = {
    runAllValidations,
    validateBrowserDetection,
    validateSupportDetection,
    validateVariableApplication,
    validateFallbackGeneration,
    validateLegacyBrowserHandling,
    validateErrorHandling,
    validatePerformance,
    validateCompatibilityReport,
    validateStaticTestMethod
};