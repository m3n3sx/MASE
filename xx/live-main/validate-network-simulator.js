/**
 * Network Simulator Validation Script
 * Tests the network simulator functionality
 */

const NetworkSimulator = require('./tests/network/network-simulator.js');

async function validateNetworkSimulator() {
    console.log('🔧 Validating Network Simulator...\n');
    
    const simulator = new NetworkSimulator();
    let testsPassed = 0;
    let testsTotal = 0;
    
    // Test 1: Basic initialization
    testsTotal++;
    console.log('Test 1: Basic initialization');
    try {
        if (simulator.currentCondition === 'online' && !simulator.isSimulating) {
            console.log('✅ PASS: Simulator initialized correctly');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Incorrect initialization state');
        }
    } catch (error) {
        console.log('❌ FAIL: Initialization error:', error.message);
    }
    
    // Test 2: Available conditions
    testsTotal++;
    console.log('\nTest 2: Available network conditions');
    try {
        const conditions = simulator.getAvailableConditions();
        const requiredConditions = ['online', 'offline', 'slow-3g', 'fast-3g', 'timeout', 'server-error-500', 'intermittent-connection'];
        const hasAllConditions = requiredConditions.every(condition => conditions.includes(condition));
        
        if (hasAllConditions) {
            console.log('✅ PASS: All required conditions available');
            console.log('   Available conditions:', conditions.join(', '));
            testsPassed++;
        } else {
            console.log('❌ FAIL: Missing required conditions');
            console.log('   Required:', requiredConditions.join(', '));
            console.log('   Available:', conditions.join(', '));
        }
    } catch (error) {
        console.log('❌ FAIL: Error getting conditions:', error.message);
    }
    
    // Test 3: Start simulation
    testsTotal++;
    console.log('\nTest 3: Start simulation');
    try {
        await simulator.startSimulation('slow-3g');
        if (simulator.isSimulating && simulator.currentCondition === 'slow-3g') {
            console.log('✅ PASS: Simulation started correctly');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Simulation not started properly');
        }
    } catch (error) {
        console.log('❌ FAIL: Error starting simulation:', error.message);
    }
    
    // Test 4: Switch conditions
    testsTotal++;
    console.log('\nTest 4: Switch network conditions');
    try {
        await simulator.switchCondition('fast-3g');
        if (simulator.currentCondition === 'fast-3g' && simulator.isSimulating) {
            console.log('✅ PASS: Condition switched successfully');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Condition not switched properly');
        }
    } catch (error) {
        console.log('❌ FAIL: Error switching condition:', error.message);
    }
    
    // Test 5: Custom conditions
    testsTotal++;
    console.log('\nTest 5: Custom network conditions');
    try {
        simulator.addCustomCondition('test-custom', {
            latency: 1000,
            downloadThroughput: 100000,
            errorRate: 0.1
        });
        
        const conditions = simulator.getAvailableConditions();
        if (conditions.includes('test-custom')) {
            console.log('✅ PASS: Custom condition added successfully');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Custom condition not added');
        }
    } catch (error) {
        console.log('❌ FAIL: Error adding custom condition:', error.message);
    }
    
    // Test 6: Status information
    testsTotal++;
    console.log('\nTest 6: Status information');
    try {
        const status = simulator.getStatus();
        if (status && typeof status === 'object' && 
            'isSimulating' in status && 
            'currentCondition' in status &&
            'condition' in status) {
            console.log('✅ PASS: Status information available');
            console.log('   Current status:', JSON.stringify(status, null, 2));
            testsPassed++;
        } else {
            console.log('❌ FAIL: Invalid status information');
        }
    } catch (error) {
        console.log('❌ FAIL: Error getting status:', error.message);
    }
    
    // Test 7: Stop simulation
    testsTotal++;
    console.log('\nTest 7: Stop simulation');
    try {
        await simulator.stopSimulation();
        if (!simulator.isSimulating && simulator.currentCondition === 'online') {
            console.log('✅ PASS: Simulation stopped correctly');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Simulation not stopped properly');
        }
    } catch (error) {
        console.log('❌ FAIL: Error stopping simulation:', error.message);
    }
    
    // Test 8: Error handling for unknown condition
    testsTotal++;
    console.log('\nTest 8: Error handling for unknown condition');
    try {
        await simulator.startSimulation('unknown-condition');
        console.log('❌ FAIL: Should have thrown error for unknown condition');
    } catch (error) {
        if (error.message.includes('Unknown network condition')) {
            console.log('✅ PASS: Correctly handled unknown condition');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Wrong error message:', error.message);
        }
    }
    
    // Test 9: Network condition configurations
    testsTotal++;
    console.log('\nTest 9: Network condition configurations');
    try {
        const offlineCondition = simulator.conditions.offline;
        const slowCondition = simulator.conditions['slow-3g'];
        const timeoutCondition = simulator.conditions.timeout;
        
        if (offlineCondition.packetLoss === 1 && 
            slowCondition.latency === 2000 &&
            timeoutCondition.forceTimeout === true) {
            console.log('✅ PASS: Network conditions configured correctly');
            testsPassed++;
        } else {
            console.log('❌ FAIL: Network conditions not configured properly');
        }
    } catch (error) {
        console.log('❌ FAIL: Error checking condition configurations:', error.message);
    }
    
    // Test 10: History management
    testsTotal++;
    console.log('\nTest 10: History management');
    try {
        const initialRequests = simulator.getInterceptedRequests();
        simulator.clearHistory();
        const clearedRequests = simulator.getInterceptedRequests();
        
        if (Array.isArray(initialRequests) && Array.isArray(clearedRequests) && clearedRequests.length === 0) {
            console.log('✅ PASS: History management working correctly');
            testsPassed++;
        } else {
            console.log('❌ FAIL: History management not working properly');
        }
    } catch (error) {
        console.log('❌ FAIL: Error with history management:', error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed! Network Simulator is working correctly.');
        return true;
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
        return false;
    }
}

// Run validation
validateNetworkSimulator()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Validation failed with error:', error);
        process.exit(1);
    });