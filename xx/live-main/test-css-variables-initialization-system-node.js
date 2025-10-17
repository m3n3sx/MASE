/**
 * Node.js Test for CSS Variables Initialization System
 * 
 * Tests the initialization system in a simulated browser environment
 * to verify all functionality works correctly.
 */

// Mock browser environment
global.window = {
    location: { search: '' },
    performance: { now: () => Date.now() },
    localStorage: {
        getItem: (key) => null,
        setItem: (key, value) => {},
        removeItem: (key) => {}
    },
    addEventListener: () => {},
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
};

global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;

global.document = {
    readyState: 'loading',
    documentElement: {
        style: {
            setProperty: (prop, value) => {
                console.log(`Setting CSS property: ${prop} = ${value}`);
            }
        }
    },
    addEventListener: (event, callback, options) => {
        console.log(`Event listener registered: ${event}`);
        if (event === 'DOMContentLoaded') {
            // Store the callback to call it later with proper context
            global.domReadyCallback = callback;
            // Simulate DOM ready after a short delay
            setTimeout(() => {
                console.log('Simulating DOMContentLoaded event');
                global.document.readyState = 'interactive';
                if (global.domReadyCallback) {
                    global.domReadyCallback();
                }
            }, 100);
        }
    },
    dispatchEvent: (event) => {
        console.log(`Event dispatched: ${event.type}`);
    }
};

global.CustomEvent = class CustomEvent {
    constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
    }
};

global.console = console;

// Load the CSS Variables Restorer
const CSSVariablesRestorer = require('./assets/js/css-variables-restorer.js');

// Make it globally available
global.window.CSSVariablesRestorer = CSSVariablesRestorer;

// Load the Initialization System
try {
    require('./assets/js/css-variables-initialization-system.js');
} catch (error) {
    console.log('❌ Error loading initialization system:', error.message);
    process.exit(1);
}

// Test the initialization system
console.log('🧪 Starting Node.js test for CSS Variables Initialization System\n');

// Test 1: Check if initialization system was created
console.log('Test 1: Checking initialization system creation...');
if (global.window.cssVariablesInitializationSystem) {
    console.log('✅ Initialization system created successfully');
    
    // Get initial state
    const initialState = global.window.cssVariablesInitializationSystem.getInitializationState();
    console.log('Initial state:', initialState);
} else {
    console.log('❌ Initialization system not created');
    process.exit(1);
}

// Test 2: Check debug utilities
console.log('\nTest 2: Checking debug utilities...');
if (global.window.woowInitDebug) {
    console.log('✅ Debug utilities available');
    console.log('Available methods:', Object.keys(global.window.woowInitDebug));
} else {
    console.log('❌ Debug utilities not available');
}

// Test 3: Simulate DOM ready and check initialization
console.log('\nTest 3: Simulating DOM ready...');

// Wait for DOM ready simulation
setTimeout(() => {
    console.log('\nChecking state after DOM ready simulation...');
    
    if (global.window.cssVariablesInitializationSystem) {
        const state = global.window.cssVariablesInitializationSystem.getInitializationState();
        console.log('Current state:', state);
        
        // Generate report
        if (global.window.woowInitDebug && global.window.woowInitDebug.getInitializationReport) {
            console.log('\nGenerating initialization report...');
            const report = global.window.woowInitDebug.getInitializationReport();
        }
    }
    
    console.log('\n🎉 Node.js test completed successfully!');
}, 2000);

// Test 4: Test slow loading scenario
console.log('\nTest 4: Testing slow loading scenario...');
setTimeout(() => {
    if (global.window.cssVariablesInitializationSystem && 
        !global.window.cssVariablesInitializationSystem.isInitialized) {
        
        console.log('Triggering slow loading scenario...');
        // This would normally be triggered by the slow loading timer
        global.window.cssVariablesInitializationSystem.handleSlowLoading();
    }
}, 500);

// Test 5: Test force initialization
console.log('\nTest 5: Testing force initialization...');
setTimeout(() => {
    if (global.window.woowInitDebug && global.window.woowInitDebug.forceInitialization) {
        console.log('Testing force initialization...');
        global.window.woowInitDebug.forceInitialization();
    }
}, 1500);