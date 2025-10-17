#!/usr/bin/env node

/**
 * LocalStorageManager Validation Script
 * Tests all requirements: 3.1, 3.2, 3.3, 3.4
 */

// Mock localStorage for Node.js environment
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    
    getItem(key) {
        return this.store[key] || null;
    }
    
    setItem(key, value) {
        if (typeof value !== 'string') {
            throw new Error('Value must be a string');
        }
        // Simulate quota exceeded error for very large data
        if (value.length > 6 * 1024 * 1024) { // 6MB limit (lower than the 11MB test)
            const error = new Error('QuotaExceededError');
            error.name = 'QuotaExceededError';
            throw error;
        }
        this.store[key] = value;
    }
    
    removeItem(key) {
        delete this.store[key];
    }
    
    clear() {
        this.store = {};
    }
    
    get length() {
        return Object.keys(this.store).length;
    }
}

// Mock browser environment
global.localStorage = new MockLocalStorage();
global.window = { localStorage: global.localStorage };
global.navigator = { userAgent: 'Node.js Test Environment' };
global.performance = { now: () => Date.now() };

// Load the LocalStorageManager
const LocalStorageManager = require('./assets/js/local-storage-manager.js');

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    test(name, testFn) {
        try {
            const result = testFn();
            if (result) {
                console.log(`✓ ${name}`);
                this.passed++;
            } else {
                console.log(`✗ ${name}`);
                this.failed++;
            }
        } catch (error) {
            console.log(`✗ ${name} - Error: ${error.message}`);
            this.failed++;
        }
    }
    
    async asyncTest(name, testFn) {
        try {
            const result = await testFn();
            if (result) {
                console.log(`✓ ${name}`);
                this.passed++;
            } else {
                console.log(`✗ ${name}`);
                this.failed++;
            }
        } catch (error) {
            console.log(`✗ ${name} - Error: ${error.message}`);
            this.failed++;
        }
    }
    
    summary() {
        const total = this.passed + this.failed;
        console.log(`\n=== Test Summary ===`);
        console.log(`Total: ${total}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Success Rate: ${((this.passed / total) * 100).toFixed(1)}%`);
        return this.failed === 0;
    }
}

async function runTests() {
    const runner = new TestRunner();
    let manager;
    
    console.log('LocalStorageManager Validation Tests');
    console.log('=====================================\n');
    
    // Initialize manager
    runner.test('Manager initialization', () => {
        manager = new LocalStorageManager();
        return manager instanceof LocalStorageManager;
    });
    
    console.log('\n--- Requirement 3.1: localStorage operations with error handling ---');
    
    runner.test('Storage availability check', () => {
        return manager.isStorageAvailable() === true;
    });
    
    runner.test('Empty cache returns empty object', () => {
        const vars = manager.getAllVariables();
        return typeof vars === 'object' && Object.keys(vars).length === 0;
    });
    
    runner.test('Basic cache update', () => {
        const testVars = {
            '--woow-primary': '#007cba',
            '--woow-secondary': '#666666'
        };
        return manager.updateCache(testVars);
    });
    
    runner.test('Variable retrieval after update', () => {
        const vars = manager.getAllVariables();
        return vars['--woow-primary'] === '#007cba' && 
               vars['--woow-secondary'] === '#666666';
    });
    
    runner.test('Single variable operations', () => {
        const value = manager.getVariable('--woow-primary');
        const updateSuccess = manager.updateVariable('--woow-new', '#ff0000');
        const newValue = manager.getVariable('--woow-new');
        return value === '#007cba' && updateSuccess && newValue === '#ff0000';
    });
    
    runner.test('Error handling - null input', () => {
        return !manager.updateCache(null);
    });
    
    runner.test('Error handling - invalid input', () => {
        return !manager.updateCache('not an object');
    });
    
    runner.test('Error handling - corrupted localStorage', () => {
        localStorage.setItem('woow_css_variables', 'invalid json');
        const vars = manager.getAllVariables();
        return Object.keys(vars).length === 0;
    });
    
    console.log('\n--- Requirement 3.2: Cache expiration and validation ---');
    
    runner.test('Fresh cache validation', () => {
        const freshVars = { '--woow-fresh': '#123456' };
        manager.updateCache(freshVars);
        const retrieved = manager.getAllVariables();
        return retrieved['--woow-fresh'] === '#123456';
    });
    
    runner.test('Expired cache handling', () => {
        const expiredData = {
            variables: { '--woow-expired': '#999999' },
            timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
            version: '1.0'
        };
        localStorage.setItem('woow_css_variables', JSON.stringify(expiredData));
        const vars = manager.getAllVariables();
        return Object.keys(vars).length === 0;
    });
    
    runner.test('Cache info generation', () => {
        manager.updateCache({ '--woow-info': '#test' });
        const info = manager.getCacheInfo();
        return info !== null && 
               typeof info.timestamp === 'number' && 
               !info.isExpired &&
               info.isValid;
    });
    
    runner.test('CSS variable name validation', () => {
        const invalidVars = {
            'invalid-name': '#ff0000',  // Missing --
            '--': 'value',              // Too short
            '--woow-invalid!': 'value'  // Invalid characters
        };
        manager.updateCache(invalidVars);
        const vars = manager.getAllVariables();
        const hasInvalid = Object.keys(vars).some(key => 
            !key.startsWith('--') || key.includes('!')
        );
        return !hasInvalid;
    });
    
    runner.test('CSS value validation', () => {
        const invalidVars = {
            '--woow-empty': '',
            '--woow-too-long': 'x'.repeat(1001),
            '--woow-newline': 'value\nwith\nnewlines'
        };
        manager.updateCache(invalidVars);
        const vars = manager.getAllVariables();
        return !vars['--woow-empty'] && 
               !vars['--woow-too-long'] && 
               !vars['--woow-newline'];
    });
    
    console.log('\n--- Requirement 3.3: Cache update and cleanup ---');
    
    runner.test('Cache clearing', () => {
        manager.updateCache({ '--woow-clear-test': '#test' });
        const clearSuccess = manager.clearCache();
        const afterClear = manager.getAllVariables();
        return clearSuccess && Object.keys(afterClear).length === 0;
    });
    
    runner.test('Cleanup with valid cache', () => {
        manager.updateCache({ '--woow-cleanup': '#test' });
        const cleanupSuccess = manager.cleanup();
        const afterCleanup = manager.getAllVariables();
        return cleanupSuccess && Object.keys(afterCleanup).length > 0;
    });
    
    runner.test('Cleanup with expired cache', () => {
        const expiredData = {
            variables: { '--woow-expired-cleanup': '#expired' },
            timestamp: Date.now() - (25 * 60 * 60 * 1000),
            version: '1.0'
        };
        localStorage.setItem('woow_css_variables', JSON.stringify(expiredData));
        const cleanupSuccess = manager.cleanup();
        const afterCleanup = manager.getAllVariables();
        return cleanupSuccess && Object.keys(afterCleanup).length === 0;
    });
    
    runner.test('Storage stats generation', () => {
        manager.updateCache({ '--woow-stats': '#test' });
        const stats = manager.getStorageStats();
        return stats.isAvailable && 
               stats.hasCache && 
               stats.cacheSize > 0 &&
               typeof stats.cacheSizeKB === 'number';
    });
    
    console.log('\n--- Requirement 3.4: Versioning ---');
    
    runner.test('Version compatibility check', () => {
        manager.updateCache({ '--woow-version': '#test' });
        const info = manager.getCacheInfo();
        return info.version === '1.0' && info.isVersionCompatible;
    });
    
    runner.test('Incompatible version handling', () => {
        const incompatibleData = {
            variables: { '--woow-incompatible': '#old' },
            timestamp: Date.now(),
            version: '2.0' // Future version
        };
        localStorage.setItem('woow_css_variables', JSON.stringify(incompatibleData));
        const vars = manager.getAllVariables();
        return Object.keys(vars).length === 0;
    });
    
    runner.test('Missing version handling', () => {
        const noVersionData = {
            variables: { '--woow-no-version': '#test' },
            timestamp: Date.now()
            // version missing
        };
        localStorage.setItem('woow_css_variables', JSON.stringify(noVersionData));
        const vars = manager.getAllVariables();
        return Object.keys(vars).length === 0;
    });
    
    runner.test('Metadata preservation', () => {
        const testMetadata = { testKey: 'testValue', source: 'validation' };
        manager.updateCache(
            { '--woow-metadata': '#test' }, 
            { source: 'test-source', metadata: testMetadata }
        );
        const info = manager.getCacheInfo();
        return info.source === 'test-source' && info.variableCount > 0;
    });
    
    console.log('\n--- Performance and Edge Cases ---');
    
    runner.test('Large dataset handling', () => {
        const largeVars = {};
        for (let i = 0; i < 100; i++) {
            largeVars[`--woow-var-${i}`] = `#${i.toString(16).padStart(6, '0')}`;
        }
        
        const startTime = Date.now();
        const updateSuccess = manager.updateCache(largeVars);
        const updateTime = Date.now() - startTime;
        
        const retrievalStart = Date.now();
        const retrieved = manager.getAllVariables();
        const retrievalTime = Date.now() - retrievalStart;
        
        return updateSuccess && 
               updateTime < 100 && 
               Object.keys(retrieved).length === 100 &&
               retrievalTime < 50;
    });
    
    runner.test('Quota exceeded error handling', () => {
        // Create many valid variables to exceed quota
        const manyVars = {};
        for (let i = 0; i < 50000; i++) {
            manyVars[`--woow-var-${i}`] = 'x'.repeat(500); // Each variable is 500 chars
        }
        const result = manager.updateCache(manyVars);
        // Should return false (fail gracefully) and not throw an exception
        return result === false;
    });
    
    runner.test('Data structure validation', () => {
        const validStructure = {
            variables: { '--woow-valid': '#test' },
            timestamp: Date.now(),
            version: '1.0',
            source: 'test'
        };
        localStorage.setItem('woow_css_variables', JSON.stringify(validStructure));
        const vars = manager.getAllVariables();
        return vars['--woow-valid'] === '#test';
    });
    
    runner.test('Invalid structure handling', () => {
        const invalidStructure = {
            // missing variables property
            timestamp: Date.now(),
            version: '1.0'
        };
        localStorage.setItem('woow_css_variables', JSON.stringify(invalidStructure));
        const vars = manager.getAllVariables();
        return Object.keys(vars).length === 0;
    });
    
    // Final validation
    console.log('\n--- Final Integration Test ---');
    
    runner.test('Complete workflow integration', () => {
        // Clear everything
        manager.clearCache();
        
        // Add variables
        const testVars = {
            '--woow-integration-1': '#ff0000',
            '--woow-integration-2': '#00ff00',
            '--woow-integration-3': '#0000ff'
        };
        
        const updateSuccess = manager.updateCache(testVars, { source: 'integration-test' });
        const retrieved = manager.getAllVariables();
        const info = manager.getCacheInfo();
        const stats = manager.getStorageStats();
        
        return updateSuccess &&
               Object.keys(retrieved).length === 3 &&
               retrieved['--woow-integration-1'] === '#ff0000' &&
               info.source === 'integration-test' &&
               info.variableCount === 3 &&
               !info.isExpired &&
               stats.hasCache;
    });
    
    return runner.summary();
}

// Run the tests
runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
});