/**
 * Node.js test for CSS Variables Restorer
 * Tests basic functionality without DOM dependencies
 */

// Mock DOM environment
global.window = {
    location: { search: '' },
    performance: { now: () => Date.now() },
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    },
    document: {
        readyState: 'complete',
        documentElement: {
            style: {
                setProperty: (prop, value) => {
                    console.log(`Would set ${prop} = ${value}`);
                }
            }
        },
        addEventListener: () => {}
    },
    console: console
};

global.document = global.window.document;
global.localStorage = global.window.localStorage;
global.performance = global.window.performance;

// Load the implementation
const CSSVariablesRestorer = require('./assets/js/css-variables-restorer.js');

console.log('🧪 Testing CSS Variables Restorer in Node.js environment...\n');

// Test 1: Class instantiation
console.log('Test 1: Class instantiation');
try {
    const restorer = new CSSVariablesRestorer();
    console.log('✅ Class instantiated successfully');
    console.log(`   - Debug mode: ${restorer.isDebugMode}`);
    console.log(`   - Storage key: ${restorer.storageKey}`);
    console.log(`   - Database timeout: ${restorer.databaseTimeout}ms`);
} catch (error) {
    console.log('❌ Class instantiation failed:', error.message);
}

// Test 2: Default variables
console.log('\nTest 2: Default variables');
try {
    const restorer = new CSSVariablesRestorer();
    const defaults = restorer.getDefaultVariables();
    console.log('✅ Default variables loaded');
    console.log(`   - Variable count: ${Object.keys(defaults).length}`);
    console.log(`   - Sample variables: ${Object.keys(defaults).slice(0, 3).join(', ')}`);
} catch (error) {
    console.log('❌ Default variables failed:', error.message);
}

// Test 3: CSS value validation
console.log('\nTest 3: CSS value validation');
try {
    const restorer = new CSSVariablesRestorer();
    const validTests = [
        ['#ffffff', true],
        ['16px', true],
        ['bold', true],
        ['', false],
        ['<script>alert("xss")</script>', false],
        ['javascript:alert(1)', false],
        ['a'.repeat(1001), false]
    ];
    
    let passed = 0;
    validTests.forEach(([value, expected]) => {
        const result = restorer.isValidCSSValue(value);
        if (result === expected) {
            passed++;
        } else {
            console.log(`   ❌ Validation failed for "${value}": expected ${expected}, got ${result}`);
        }
    });
    
    console.log(`✅ CSS validation: ${passed}/${validTests.length} tests passed`);
} catch (error) {
    console.log('❌ CSS validation failed:', error.message);
}

// Test 4: Data transformation
console.log('\nTest 4: Data transformation');
try {
    const restorer = new CSSVariablesRestorer();
    const rawData = {
        'surface_bar': '#23282d',
        'text_primary': '#1d2327',
        '--woow-existing': '#ffffff',
        'invalid_value': '<script>',
        'empty_value': ''
    };
    
    const transformed = restorer.validateAndTransformData(rawData);
    console.log('✅ Data transformation completed');
    console.log(`   - Input keys: ${Object.keys(rawData).length}`);
    console.log(`   - Output keys: ${Object.keys(transformed).length}`);
    console.log(`   - Transformed keys: ${Object.keys(transformed).join(', ')}`);
} catch (error) {
    console.log('❌ Data transformation failed:', error.message);
}

// Test 5: Cache expiration
console.log('\nTest 5: Cache expiration');
try {
    const restorer = new CSSVariablesRestorer();
    const now = Date.now();
    const tests = [
        [now, false], // Current time - not expired
        [now - (12 * 60 * 60 * 1000), false], // 12 hours ago - not expired
        [now - (25 * 60 * 60 * 1000), true], // 25 hours ago - expired
        [null, true], // No timestamp - expired
        [undefined, true] // Undefined timestamp - expired
    ];
    
    let passed = 0;
    tests.forEach(([timestamp, expected]) => {
        const result = restorer.isExpired(timestamp);
        if (result === expected) {
            passed++;
        } else {
            console.log(`   ❌ Expiration test failed for ${timestamp}: expected ${expected}, got ${result}`);
        }
    });
    
    console.log(`✅ Cache expiration: ${passed}/${tests.length} tests passed`);
} catch (error) {
    console.log('❌ Cache expiration failed:', error.message);
}

// Test 6: Debug mode detection
console.log('\nTest 6: Debug mode detection');
try {
    // Test with different debug conditions
    const originalSearch = global.window.location.search;
    const originalStorage = global.localStorage.getItem;
    const originalDebugMode = global.window.woowDebugMode;
    
    // Test URL parameter
    global.window.location.search = '?woow_debug=1';
    let restorer = new CSSVariablesRestorer();
    console.log(`   URL debug: ${restorer.isDebugMode ? '✅' : '❌'}`);
    
    // Test localStorage
    global.window.location.search = '';
    global.localStorage.getItem = (key) => key === 'woow_debug' ? '1' : null;
    restorer = new CSSVariablesRestorer();
    console.log(`   localStorage debug: ${restorer.isDebugMode ? '✅' : '❌'}`);
    
    // Test global variable
    global.localStorage.getItem = () => null;
    global.window.woowDebugMode = true;
    restorer = new CSSVariablesRestorer();
    console.log(`   Global debug: ${restorer.isDebugMode ? '✅' : '❌'}`);
    
    // Restore original values
    global.window.location.search = originalSearch;
    global.localStorage.getItem = originalStorage;
    global.window.woowDebugMode = originalDebugMode;
    
    console.log('✅ Debug mode detection tests completed');
} catch (error) {
    console.log('❌ Debug mode detection failed:', error.message);
}

// Test 7: Timeout creation
console.log('\nTest 7: Timeout promise');
try {
    const restorer = new CSSVariablesRestorer();
    const timeoutPromise = restorer.createTimeout(100);
    
    timeoutPromise.catch(error => {
        if (error.message.includes('Timeout after 100ms')) {
            console.log('✅ Timeout promise works correctly');
        } else {
            console.log('❌ Timeout promise error message incorrect:', error.message);
        }
    });
    
    setTimeout(() => {
        console.log('   Timeout test completed');
    }, 150);
} catch (error) {
    console.log('❌ Timeout promise failed:', error.message);
}

console.log('\n🎉 Node.js tests completed!');
console.log('💡 Open test-css-variables-restorer.html in a browser for full DOM testing');