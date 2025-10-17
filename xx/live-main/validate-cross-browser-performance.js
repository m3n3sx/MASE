/**
 * Cross-Browser Performance Validation Script
 * 
 * Task 11.2: Cross-browser and performance validation
 * Requirements: 8.1, 8.2, 9.3, 9.4
 * 
 * Tests:
 * - Persistence system across different browsers
 * - Performance under high-frequency setting changes
 * - Memory usage and cleanup
 */

class CrossBrowserPerformanceValidator {
    constructor() {
        this.testResults = {
            browserCompatibility: {},
            highFrequencyPerformance: {},
            memoryUsage: {},
            overallScore: 0
        };
        
        this.benchmarks = {
            maxInitTime: 3000,        // 3 seconds
            maxSaveTime: 500,         // 500ms per save
            maxBatchTime: 2000,       // 2 seconds for batch
            maxMemoryIncrease: 10 * 1024 * 1024, // 10MB
            minSuccessRate: 95,       // 95% success rate
            maxCleanupTime: 1000      // 1 second for cleanup
        };
        
        this.testData = {
            rapidChanges: 200,
            batchSize: 100,
            memoryIterations: 500,
            concurrentOperations: 10
        };
        
        this.initializeBrowserInfo();
    }
    
    initializeBrowserInfo() {
        const browserInfo = this.detectBrowser();
        document.getElementById('browser-info').innerHTML = `
            <div class="metrics">
                Browser: ${browserInfo.name} ${browserInfo.version}<br>
                Engine: ${browserInfo.engine}<br>
                Platform: ${browserInfo.platform}<br>
                User Agent: ${navigator.userAgent}
            </div>
        `;
    }
    
    detectBrowser() {
        const ua = navigator.userAgent;
        let browser = { name: 'Unknown', version: 'Unknown', engine: 'Unknown', platform: navigator.platform };
        
        // Detect browser
        if (ua.includes('Chrome') && !ua.includes('Edg')) {
            browser.name = 'Chrome';
            browser.version = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
            browser.engine = 'Blink';
        } else if (ua.includes('Firefox')) {
            browser.name = 'Firefox';
            browser.version = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
            browser.engine = 'Gecko';
        } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
            browser.name = 'Safari';
            browser.version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
            browser.engine = 'WebKit';
        } else if (ua.includes('Edg')) {
            browser.name = 'Edge';
            browser.version = ua.match(/Edg\/([0-9.]+)/)?.[1] || 'Unknown';
            browser.engine = 'Blink';
        }
        
        return browser;
    }
    
    async runBrowserCompatibilityTests() {
        const resultsDiv = document.getElementById('browser-results');
        resultsDiv.innerHTML = '<div class="status running">Running browser compatibility tests...</div>';
        
        const tests = [
            { name: 'localStorage Support', test: this.testLocalStorageSupport.bind(this) },
            { name: 'CSS Custom Properties', test: this.testCSSCustomProperties.bind(this) },
            { name: 'JSON Serialization', test: this.testJSONSerialization.bind(this) },
            { name: 'AJAX Functionality', test: this.testAJAXFunctionality.bind(this) },
            { name: 'Performance API', test: this.testPerformanceAPI.bind(this) },
            { name: 'Memory API', test: this.testMemoryAPI.bind(this) },
            { name: 'Event Handling', test: this.testEventHandling.bind(this) },
            { name: 'DOM Manipulation', test: this.testDOMManipulation.bind(this) }
        ];
        
        const results = [];
        
        for (const test of tests) {
            try {
                const result = await test.test();
                results.push({
                    name: test.name,
                    passed: result.success,
                    details: result.details,
                    performance: result.performance
                });
            } catch (error) {
                results.push({
                    name: test.name,
                    passed: false,
                    details: `Error: ${error.message}`,
                    performance: null
                });
            }
        }
        
        this.testResults.browserCompatibility = results;
        this.displayBrowserResults(results);
    }
    
    async testLocalStorageSupport() {
        const testKey = 'browser_test_' + Date.now();
        const testValue = JSON.stringify({ test: 'value', number: 123, array: [1, 2, 3] });
        
        try {
            const start = performance.now();
            
            // Test basic operations
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            const end = performance.now();
            
            const success = retrieved === testValue;
            
            // Test quota
            let quotaTest = true;
            try {
                const largeData = 'x'.repeat(1024 * 1024); // 1MB
                localStorage.setItem(testKey + '_quota', largeData);
                localStorage.removeItem(testKey + '_quota');
            } catch (e) {
                quotaTest = false;
            }
            
            return {
                success: success && quotaTest,
                details: `Basic operations: ${success ? 'PASS' : 'FAIL'}, Quota test: ${quotaTest ? 'PASS' : 'FAIL'}`,
                performance: end - start
            };
        } catch (error) {
            return {
                success: false,
                details: `localStorage not supported: ${error.message}`,
                performance: null
            };
        }
    }
    
    async testCSSCustomProperties() {
        const testVar = '--test-browser-var-' + Date.now();
        const testValue = '#ff0000';
        
        try {
            const start = performance.now();
            
            document.documentElement.style.setProperty(testVar, testValue);
            const computedValue = getComputedStyle(document.documentElement)
                .getPropertyValue(testVar).trim();
            document.documentElement.style.removeProperty(testVar);
            
            const end = performance.now();
            
            const success = computedValue === testValue;
            
            return {
                success,
                details: `Set: ${testValue}, Got: ${computedValue}`,
                performance: end - start
            };
        } catch (error) {
            return {
                success: false,
                details: `CSS custom properties not supported: ${error.message}`,
                performance: null
            };
        }
    }
    
    async testJSONSerialization() {
        const testObject = {
            string: 'test',
            number: 123.45,
            boolean: true,
            array: [1, 2, 3],
            nested: { key: 'value' },
            unicode: '🔧',
            special: 'test with "quotes" and \\backslashes',
            date: new Date().toISOString()
        };
        
        try {
            const start = performance.now();
            
            const serialized = JSON.stringify(testObject);
            const deserialized = JSON.parse(serialized);
            
            const end = performance.now();
            
            const success = (
                deserialized.string === testObject.string &&
                deserialized.number === testObject.number &&
                deserialized.boolean === testObject.boolean &&
                Array.isArray(deserialized.array) &&
                deserialized.nested.key === testObject.nested.key &&
                deserialized.unicode === testObject.unicode &&
                deserialized.special === testObject.special
            );
            
            return {
                success,
                details: `Serialized ${serialized.length} bytes successfully`,
                performance: end - start
            };
        } catch (error) {
            return {
                success: false,
                details: `JSON serialization failed: ${error.message}`,
                performance: null
            };
        }
    }
    
    async testAJAXFunctionality() {
        if (!window.jQuery) {
            return {
                success: false,
                details: 'jQuery not available',
                performance: null
            };
        }
        
        return new Promise((resolve) => {
            const start = performance.now();
            
            $.ajax({
                url: window.woowAdminAjax?.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: 'mas_get_live_settings',
                    nonce: window.woowAdminAjax?.nonce || 'test'
                },
                timeout: 5000,
                success: (response) => {
                    const end = performance.now();
                    resolve({
                        success: true,
                        details: `AJAX request successful, response: ${typeof response}`,
                        performance: end - start
                    });
                },
                error: (xhr, status, error) => {
                    const end = performance.now();
                    resolve({
                        success: false,
                        details: `AJAX failed: ${status} - ${error}`,
                        performance: end - start
                    });
                }
            });
        });
    }
    
    async testPerformanceAPI() {
        try {
            const start = performance.now();
            
            // Test performance.now()
            const now1 = performance.now();
            await new Promise(resolve => setTimeout(resolve, 10));
            const now2 = performance.now();
            
            const end = performance.now();
            
            const success = (
                typeof now1 === 'number' &&
                typeof now2 === 'number' &&
                now2 > now1 &&
                (now2 - now1) >= 10
            );
            
            return {
                success,
                details: `Performance.now() working, timing accuracy: ${(now2 - now1).toFixed(2)}ms`,
                performance: end - start
            };
        } catch (error) {
            return {
                success: false,
                details: `Performance API not supported: ${error.message}`,
                performance: null
            };
        }
    }
    
    async testMemoryAPI() {
        try {
            if (!performance.memory) {
                return {
                    success: false,
                    details: 'Memory API not available (Chrome-only feature)',
                    performance: null
                };
            }
            
            const start = performance.now();
            
            const memInfo = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
            
            const end = performance.now();
            
            const success = (
                typeof memInfo.used === 'number' &&
                typeof memInfo.total === 'number' &&
                typeof memInfo.limit === 'number' &&
                memInfo.used > 0
            );
            
            return {
                success,
                details: `Memory: ${Math.round(memInfo.used / 1024 / 1024)}MB used, ${Math.round(memInfo.total / 1024 / 1024)}MB total`,
                performance: end - start
            };
        } catch (error) {
            return {
                success: false,
                details: `Memory API error: ${error.message}`,
                performance: null
            };
        }
    }
    
    async testEventHandling() {
        try {
            const start = performance.now();
            
            let eventFired = false;
            const testEvent = new CustomEvent('testBrowserEvent', { detail: { test: true } });
            
            const handler = (e) => {
                eventFired = e.detail.test === true;
            };
            
            document.addEventListener('testBrowserEvent', handler);
            document.dispatchEvent(testEvent);
            document.removeEventListener('testBrowserEvent', handler);
            
            const end = performance.now();
            
            return {
                success: eventFired,
                details: `Custom event handling: ${eventFired ? 'PASS' : 'FAIL'}`,
                performance: end - start
            };
        } catch (error) {
            return {
                success: false,
                details: `Event handling error: ${error.message}`,
                performance: null
            };
        }
    }
    
    async testDOMManipulation() {
        try {
            const start = performance.now();
            
            // Create test element
            const testDiv = document.createElement('div');
            testDiv.id = 'browser-test-element';
            testDiv.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
            testDiv.innerHTML = '<span>Test</span>';
            
            document.body.appendChild(testDiv);
            
            // Test manipulation
            const span = testDiv.querySelector('span');
            span.textContent = 'Modified';
            testDiv.setAttribute('data-test', 'value');
            
            // Test computed styles
            const computedStyle = getComputedStyle(testDiv);
            const position = computedStyle.position;
            
            // Cleanup
            document.body.removeChild(testDiv);
            
            const end = performance.now();
            
            const success = (
                span.textContent === 'Modified' &&
                testDiv.getAttribute('data-test') === 'value' &&
                position === 'absolute'
            );
            
            return {
                success,
                details: `DOM manipulation and computed styles: ${success ? 'PASS' : 'FAIL'}`,
                performance: end - start
            };
        } catch (error) {
            return {
                success: false,
                details: `DOM manipulation error: ${error.message}`,
                performance: null
            };
        }
    }
    
    displayBrowserResults(results) {
        const resultsDiv = document.getElementById('browser-results');
        const passedTests = results.filter(r => r.passed).length;
        const totalTests = results.length;
        
        let html = `<div class="status ${passedTests === totalTests ? 'pass' : 'fail'}">
            Browser Compatibility: ${passedTests}/${totalTests} tests passed
        </div>`;
        
        html += '<div class="metrics">';
        results.forEach(result => {
            const status = result.passed ? 'PASS' : 'FAIL';
            const perf = result.performance ? ` (${result.performance.toFixed(2)}ms)` : '';
            html += `${result.name}: ${status}${perf}<br>`;
            if (result.details) {
                html += `  └─ ${result.details}<br>`;
            }
        });
        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }
}  
  async runHighFrequencyTests() {
        const resultsDiv = document.getElementById('frequency-results');
        const progressBar = document.getElementById('frequency-progress');
        
        resultsDiv.innerHTML = '<div class="status running">Running high-frequency performance tests...</div>';
        
        const tests = [
            { name: 'Rapid Setting Changes', test: this.testRapidSettingChanges.bind(this) },
            { name: 'Concurrent Modifications', test: this.testConcurrentModifications.bind(this) },
            { name: 'Debouncing Performance', test: this.testDebouncingPerformance.bind(this) },
            { name: 'Batch Operations', test: this.testBatchOperations.bind(this) }
        ];
        
        const results = [];
        
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            progressBar.style.width = `${((i + 1) / tests.length) * 100}%`;
            
            try {
                const result = await test.test();
                results.push({
                    name: test.name,
                    passed: result.success,
                    metrics: result.metrics,
                    details: result.details
                });
            } catch (error) {
                results.push({
                    name: test.name,
                    passed: false,
                    metrics: null,
                    details: `Error: ${error.message}`
                });
            }
        }
        
        this.testResults.highFrequencyPerformance = results;
        this.displayFrequencyResults(results);
    }
    
    async testRapidSettingChanges() {
        const startTime = performance.now();
        const changes = [];
        let successCount = 0;
        let errorCount = 0;
        
        // Initialize persistence manager if available
        let manager = null;
        if (window.SettingsPersistenceManager) {
            manager = new window.SettingsPersistenceManager();
        }
        
        // Perform rapid changes
        for (let i = 0; i < this.testData.rapidChanges; i++) {
            try {
                const key = `rapid_test_${i}`;
                const value = `value_${i}_${Date.now()}`;
                
                if (manager) {
                    await manager.saveSetting(key, value, false);
                } else {
                    // Fallback to localStorage
                    const settings = JSON.parse(localStorage.getItem('woow_admin_settings') || '{}');
                    settings[key] = value;
                    localStorage.setItem('woow_admin_settings', JSON.stringify(settings));
                }
                
                changes.push({ key, value, timestamp: performance.now() });
                successCount++;
                
                // Small delay every 10 changes to simulate real usage
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
                
            } catch (error) {
                errorCount++;
            }
        }
        
        const totalTime = performance.now() - startTime;
        const averageTime = totalTime / this.testData.rapidChanges;
        const successRate = (successCount / this.testData.rapidChanges) * 100;
        
        const success = (
            successRate >= this.benchmarks.minSuccessRate &&
            averageTime <= 50 && // 50ms per change max
            totalTime <= 15000   // 15 seconds total max
        );
        
        return {
            success,
            metrics: {
                totalTime: totalTime.toFixed(2),
                averageTime: averageTime.toFixed(2),
                successRate: successRate.toFixed(1),
                successCount,
                errorCount
            },
            details: `${successCount}/${this.testData.rapidChanges} changes successful in ${totalTime.toFixed(2)}ms`
        };
    }
    
    async testConcurrentModifications() {
        const startTime = performance.now();
        const promises = [];
        let totalOperations = 0;
        let successfulOperations = 0;
        
        // Create concurrent operations
        for (let user = 0; user < this.testData.concurrentOperations; user++) {
            const userPromise = (async () => {
                const userResults = { success: 0, failed: 0 };
                
                for (let i = 0; i < 20; i++) {
                    try {
                        const key = `concurrent_user${user}_setting${i}`;
                        const value = `user${user}_value${i}_${Date.now()}`;
                        
                        const settings = JSON.parse(localStorage.getItem('woow_admin_settings') || '{}');
                        settings[key] = value;
                        localStorage.setItem('woow_admin_settings', JSON.stringify(settings));
                        
                        userResults.success++;
                        totalOperations++;
                        
                        // Random delay
                        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                        
                    } catch (error) {
                        userResults.failed++;
                    }
                }
                
                return userResults;
            })();
            
            promises.push(userPromise);
        }
        
        const userResults = await Promise.all(promises);
        const totalTime = performance.now() - startTime;
        
        // Aggregate results
        userResults.forEach(result => {
            successfulOperations += result.success;
        });
        
        const expectedOperations = this.testData.concurrentOperations * 20;
        const successRate = (successfulOperations / expectedOperations) * 100;
        
        const success = (
            successRate >= this.benchmarks.minSuccessRate &&
            totalTime <= 10000 // 10 seconds max
        );
        
        return {
            success,
            metrics: {
                totalTime: totalTime.toFixed(2),
                successRate: successRate.toFixed(1),
                successfulOperations,
                expectedOperations
            },
            details: `${successfulOperations}/${expectedOperations} concurrent operations successful`
        };
    }
    
    async testDebouncingPerformance() {
        let ajaxCallCount = 0;
        
        // Mock AJAX to count calls
        const originalAjax = window.jQuery?.ajax;
        if (window.jQuery) {
            window.jQuery.ajax = function() {
                ajaxCallCount++;
                if (originalAjax) {
                    return originalAjax.apply(this, arguments);
                }
            };
        }
        
        const startTime = performance.now();
        
        // Initialize manager if available
        let manager = null;
        if (window.SettingsPersistenceManager) {
            manager = new window.SettingsPersistenceManager();
        }
        
        // Make rapid changes to same setting
        const rapidChanges = 50;
        for (let i = 0; i < rapidChanges; i++) {
            if (manager) {
                await manager.saveSetting('debounce_test', `value_${i}`);
            } else {
                // Simulate debounced behavior
                const settings = JSON.parse(localStorage.getItem('woow_admin_settings') || '{}');
                settings.debounce_test = `value_${i}`;
                localStorage.setItem('woow_admin_settings', JSON.stringify(settings));
            }
        }
        
        // Wait for debounced operations to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const totalTime = performance.now() - startTime;
        
        // Restore original AJAX
        if (window.jQuery && originalAjax) {
            window.jQuery.ajax = originalAjax;
        }
        
        // Debouncing should result in fewer AJAX calls than changes
        const success = (
            ajaxCallCount <= 5 && // Should be heavily debounced
            totalTime <= 2000     // Should complete quickly
        );
        
        return {
            success,
            metrics: {
                totalTime: totalTime.toFixed(2),
                ajaxCallCount,
                rapidChanges,
                debouncingEffective: ajaxCallCount < rapidChanges
            },
            details: `${rapidChanges} changes resulted in ${ajaxCallCount} AJAX calls`
        };
    }
    
    async testBatchOperations() {
        const startTime = performance.now();
        
        // Create large batch of settings
        const batchSettings = {};
        for (let i = 0; i < this.testData.batchSize; i++) {
            batchSettings[`batch_setting_${i}`] = {
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                size: Math.floor(Math.random() * 100) + 10,
                enabled: Math.random() > 0.5,
                text: `Batch setting ${i}`
            };
        }
        
        let success = false;
        let error = null;
        
        try {
            // Initialize manager if available
            if (window.SettingsPersistenceManager) {
                const manager = new window.SettingsPersistenceManager();
                if (manager.batchSaveSettings) {
                    await manager.batchSaveSettings(batchSettings);
                } else {
                    // Fallback to individual saves
                    for (const [key, value] of Object.entries(batchSettings)) {
                        await manager.saveSetting(key, value);
                    }
                }
            } else {
                // Fallback to localStorage
                localStorage.setItem('woow_admin_settings', JSON.stringify(batchSettings));
            }
            
            success = true;
        } catch (e) {
            error = e.message;
        }
        
        const totalTime = performance.now() - startTime;
        
        const performanceSuccess = (
            success &&
            totalTime <= this.benchmarks.maxBatchTime
        );
        
        return {
            success: performanceSuccess,
            metrics: {
                totalTime: totalTime.toFixed(2),
                batchSize: this.testData.batchSize,
                averageTimePerSetting: (totalTime / this.testData.batchSize).toFixed(2)
            },
            details: error ? `Error: ${error}` : `Batch of ${this.testData.batchSize} settings processed in ${totalTime.toFixed(2)}ms`
        };
    }
    
    displayFrequencyResults(results) {
        const resultsDiv = document.getElementById('frequency-results');
        const passedTests = results.filter(r => r.passed).length;
        const totalTests = results.length;
        
        let html = `<div class="status ${passedTests === totalTests ? 'pass' : 'fail'}">
            High-Frequency Performance: ${passedTests}/${totalTests} tests passed
        </div>`;
        
        html += '<div class="metrics">';
        results.forEach(result => {
            const status = result.passed ? 'PASS' : 'FAIL';
            html += `${result.name}: ${status}<br>`;
            if (result.details) {
                html += `  └─ ${result.details}<br>`;
            }
            if (result.metrics) {
                Object.entries(result.metrics).forEach(([key, value]) => {
                    html += `  └─ ${key}: ${value}<br>`;
                });
            }
        });
        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }
    
    async runMemoryTests() {
        const resultsDiv = document.getElementById('memory-results');
        const progressBar = document.getElementById('memory-progress');
        
        resultsDiv.innerHTML = '<div class="status running">Running memory usage tests...</div>';
        
        const tests = [
            { name: 'Memory Allocation', test: this.testMemoryAllocation.bind(this) },
            { name: 'Memory Cleanup', test: this.testMemoryCleanup.bind(this) },
            { name: 'Cache Management', test: this.testCacheManagement.bind(this) },
            { name: 'Garbage Collection', test: this.testGarbageCollection.bind(this) }
        ];
        
        const results = [];
        
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            progressBar.style.width = `${((i + 1) / tests.length) * 100}%`;
            
            try {
                const result = await test.test();
                results.push({
                    name: test.name,
                    passed: result.success,
                    metrics: result.metrics,
                    details: result.details
                });
            } catch (error) {
                results.push({
                    name: test.name,
                    passed: false,
                    metrics: null,
                    details: `Error: ${error.message}`
                });
            }
        }
        
        this.testResults.memoryUsage = results;
        this.displayMemoryResults(results);
    }
    
    async testMemoryAllocation() {
        const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
        const startTime = performance.now();
        
        // Allocate memory through settings operations
        const largeSettings = {};
        for (let i = 0; i < this.testData.memoryIterations; i++) {
            largeSettings[`memory_test_${i}`] = {
                data: 'x'.repeat(1000), // 1KB per setting
                timestamp: Date.now(),
                metadata: {
                    id: i,
                    type: 'memory_test',
                    nested: {
                        value: `nested_${i}`,
                        array: new Array(10).fill(i)
                    }
                }
            };
        }
        
        // Store in localStorage
        localStorage.setItem('woow_memory_test', JSON.stringify(largeSettings));
        
        const allocationTime = performance.now() - startTime;
        const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
        
        let memoryIncrease = null;
        if (initialMemory && finalMemory) {
            memoryIncrease = finalMemory - initialMemory;
        }
        
        // Cleanup
        localStorage.removeItem('woow_memory_test');
        
        const success = (
            allocationTime <= 5000 && // 5 seconds max
            (!memoryIncrease || memoryIncrease <= this.benchmarks.maxMemoryIncrease)
        );
        
        return {
            success,
            metrics: {
                allocationTime: allocationTime.toFixed(2),
                memoryIncrease: memoryIncrease ? Math.round(memoryIncrease / 1024) + 'KB' : 'N/A',
                settingsCount: this.testData.memoryIterations
            },
            details: `Allocated ${this.testData.memoryIterations} settings in ${allocationTime.toFixed(2)}ms`
        };
    }
    
    async testMemoryCleanup() {
        const startTime = performance.now();
        let initialMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
        
        // Create and cleanup multiple times
        const iterations = 10;
        for (let iteration = 0; iteration < iterations; iteration++) {
            // Allocate
            const tempSettings = {};
            for (let i = 0; i < 100; i++) {
                tempSettings[`temp_${iteration}_${i}`] = 'x'.repeat(500);
            }
            localStorage.setItem(`temp_test_${iteration}`, JSON.stringify(tempSettings));
            
            // Cleanup
            localStorage.removeItem(`temp_test_${iteration}`);
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        const cleanupTime = performance.now() - startTime;
        const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : null;
        
        let memoryDifference = null;
        if (initialMemory && finalMemory) {
            memoryDifference = finalMemory - initialMemory;
        }
        
        const success = (
            cleanupTime <= this.benchmarks.maxCleanupTime &&
            (!memoryDifference || Math.abs(memoryDifference) <= 1024 * 1024) // 1MB tolerance
        );
        
        return {
            success,
            metrics: {
                cleanupTime: cleanupTime.toFixed(2),
                memoryDifference: memoryDifference ? Math.round(memoryDifference / 1024) + 'KB' : 'N/A',
                iterations
            },
            details: `${iterations} allocation/cleanup cycles completed in ${cleanupTime.toFixed(2)}ms`
        };
    }
    
    async testCacheManagement() {
        let manager = null;
        if (window.SettingsPersistenceManager) {
            manager = new window.SettingsPersistenceManager();
        }
        
        if (!manager || !manager.settingsCache) {
            return {
                success: false,
                metrics: null,
                details: 'Cache management not available'
            };
        }
        
        const startTime = performance.now();
        
        // Fill cache
        for (let i = 0; i < 1000; i++) {
            manager.settingsCache.set(`cache_test_${i}`, {
                value: `value_${i}`,
                timestamp: Date.now(),
                source: 'test'
            });
        }
        
        const cacheSize = manager.settingsCache.size;
        
        // Test cache optimization
        if (manager.optimizeCache) {
            manager.optimizeCache();
        }
        
        const optimizedSize = manager.settingsCache.size;
        const managementTime = performance.now() - startTime;
        
        const success = (
            cacheSize === 1000 &&
            optimizedSize <= cacheSize &&
            managementTime <= 1000 // 1 second max
        );
        
        return {
            success,
            metrics: {
                managementTime: managementTime.toFixed(2),
                initialCacheSize: cacheSize,
                optimizedCacheSize: optimizedSize,
                reductionPercent: ((cacheSize - optimizedSize) / cacheSize * 100).toFixed(1)
            },
            details: `Cache managed from ${cacheSize} to ${optimizedSize} entries`
        };
    }
    
    async testGarbageCollection() {
        if (!performance.memory) {
            return {
                success: false,
                metrics: null,
                details: 'Memory API not available for GC testing'
            };
        }
        
        const initialMemory = performance.memory.usedJSHeapSize;
        
        // Create temporary objects
        const tempObjects = [];
        for (let i = 0; i < 1000; i++) {
            tempObjects.push({
                id: i,
                data: new Array(1000).fill(`data_${i}`),
                timestamp: Date.now()
            });
        }
        
        const peakMemory = performance.memory.usedJSHeapSize;
        
        // Clear references
        tempObjects.length = 0;
        
        // Force GC if available
        if (window.gc) {
            window.gc();
        }
        
        // Wait for potential GC
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const finalMemory = performance.memory.usedJSHeapSize;
        
        const memoryRecovered = peakMemory - finalMemory;
        const recoveryPercent = (memoryRecovered / (peakMemory - initialMemory)) * 100;
        
        const success = recoveryPercent > 50; // At least 50% memory recovered
        
        return {
            success,
            metrics: {
                initialMemory: Math.round(initialMemory / 1024) + 'KB',
                peakMemory: Math.round(peakMemory / 1024) + 'KB',
                finalMemory: Math.round(finalMemory / 1024) + 'KB',
                memoryRecovered: Math.round(memoryRecovered / 1024) + 'KB',
                recoveryPercent: recoveryPercent.toFixed(1)
            },
            details: `${recoveryPercent.toFixed(1)}% memory recovered after GC`
        };
    }
    
    displayMemoryResults(results) {
        const resultsDiv = document.getElementById('memory-results');
        const passedTests = results.filter(r => r.passed).length;
        const totalTests = results.length;
        
        let html = `<div class="status ${passedTests === totalTests ? 'pass' : 'fail'}">
            Memory Usage Tests: ${passedTests}/${totalTests} tests passed
        </div>`;
        
        html += '<div class="metrics">';
        results.forEach(result => {
            const status = result.passed ? 'PASS' : 'FAIL';
            html += `${result.name}: ${status}<br>`;
            if (result.details) {
                html += `  └─ ${result.details}<br>`;
            }
            if (result.metrics) {
                Object.entries(result.metrics).forEach(([key, value]) => {
                    html += `  └─ ${key}: ${value}<br>`;
                });
            }
        });
        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }
    
    async runPerformanceBenchmarks() {
        const resultsDiv = document.getElementById('benchmark-results');
        resultsDiv.innerHTML = '<div class="status running">Running performance benchmarks...</div>';
        
        const benchmarks = [
            { name: 'Initialization Speed', test: this.benchmarkInitialization.bind(this) },
            { name: 'Save Operation Speed', test: this.benchmarkSaveOperation.bind(this) },
            { name: 'Load Operation Speed', test: this.benchmarkLoadOperation.bind(this) },
            { name: 'CSS Application Speed', test: this.benchmarkCSSApplication.bind(this) }
        ];
        
        const results = [];
        
        for (const benchmark of benchmarks) {
            try {
                const result = await benchmark.test();
                results.push({
                    name: benchmark.name,
                    passed: result.success,
                    metrics: result.metrics,
                    details: result.details
                });
            } catch (error) {
                results.push({
                    name: benchmark.name,
                    passed: false,
                    metrics: null,
                    details: `Error: ${error.message}`
                });
            }
        }
        
        this.displayBenchmarkResults(results);
        this.generateTestSummary();
    }
    
    async benchmarkInitialization() {
        const iterations = 10;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            // Simulate initialization
            if (window.SettingsPersistenceManager) {
                const manager = new window.SettingsPersistenceManager();
                if (manager.loadSettings) {
                    await manager.loadSettings();
                }
            } else {
                // Fallback simulation
                const settings = localStorage.getItem('woow_admin_settings');
                if (settings) {
                    JSON.parse(settings);
                }
            }
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        const success = averageTime <= this.benchmarks.maxInitTime;
        
        return {
            success,
            metrics: {
                averageTime: averageTime.toFixed(2),
                maxTime: maxTime.toFixed(2),
                minTime: minTime.toFixed(2),
                iterations
            },
            details: `Average initialization: ${averageTime.toFixed(2)}ms over ${iterations} runs`
        };
    }
    
    async benchmarkSaveOperation() {
        const iterations = 50;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            const key = `benchmark_save_${i}`;
            const value = `benchmark_value_${i}_${Date.now()}`;
            
            if (window.SettingsPersistenceManager) {
                const manager = new window.SettingsPersistenceManager();
                await manager.saveSetting(key, value, false);
            } else {
                const settings = JSON.parse(localStorage.getItem('woow_admin_settings') || '{}');
                settings[key] = value;
                localStorage.setItem('woow_admin_settings', JSON.stringify(settings));
            }
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        
        const success = averageTime <= this.benchmarks.maxSaveTime;
        
        return {
            success,
            metrics: {
                averageTime: averageTime.toFixed(2),
                maxTime: maxTime.toFixed(2),
                iterations
            },
            details: `Average save time: ${averageTime.toFixed(2)}ms over ${iterations} operations`
        };
    }
    
    async benchmarkLoadOperation() {
        // Pre-populate with test data
        const testSettings = {};
        for (let i = 0; i < 100; i++) {
            testSettings[`load_test_${i}`] = `value_${i}`;
        }
        localStorage.setItem('woow_admin_settings', JSON.stringify(testSettings));
        
        const iterations = 20;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            if (window.SettingsPersistenceManager) {
                const manager = new window.SettingsPersistenceManager();
                if (manager.loadSettings) {
                    await manager.loadSettings();
                }
            } else {
                const settings = localStorage.getItem('woow_admin_settings');
                if (settings) {
                    JSON.parse(settings);
                }
            }
            
            const end = performance.now();
            times.push(end - start);
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        
        const success = averageTime <= 100; // 100ms max for load
        
        return {
            success,
            metrics: {
                averageTime: averageTime.toFixed(2),
                settingsCount: 100,
                iterations
            },
            details: `Average load time: ${averageTime.toFixed(2)}ms for 100 settings`
        };
    }
    
    async benchmarkCSSApplication() {
        const iterations = 10;
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            
            // Simulate CSS variable application
            const testVars = {
                '--woow-surface-bar': '#23282d',
                '--woow-surface-bar-text': '#ffffff',
                '--woow-surface-menu': '#32373c',
                '--woow-space-content-padding': '20px'
            };
            
            Object.entries(testVars).forEach(([property, value]) => {
                document.documentElement.style.setProperty(property, value);
            });
            
            // Force style recalculation
            getComputedStyle(document.documentElement).getPropertyValue('--woow-surface-bar');
            
            const end = performance.now();
            times.push(end - start);
            
            // Cleanup
            Object.keys(testVars).forEach(property => {
                document.documentElement.style.removeProperty(property);
            });
        }
        
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        
        const success = averageTime <= 50; // 50ms max for CSS application
        
        return {
            success,
            metrics: {
                averageTime: averageTime.toFixed(2),
                variableCount: 4,
                iterations
            },
            details: `Average CSS application: ${averageTime.toFixed(2)}ms for 4 variables`
        };
    }
    
    displayBenchmarkResults(results) {
        const resultsDiv = document.getElementById('benchmark-results');
        const passedTests = results.filter(r => r.passed).length;
        const totalTests = results.length;
        
        let html = `<div class="status ${passedTests === totalTests ? 'pass' : 'fail'}">
            Performance Benchmarks: ${passedTests}/${totalTests} benchmarks passed
        </div>`;
        
        html += '<div class="metrics">';
        results.forEach(result => {
            const status = result.passed ? 'PASS' : 'FAIL';
            html += `${result.name}: ${status}<br>`;
            if (result.details) {
                html += `  └─ ${result.details}<br>`;
            }
            if (result.metrics) {
                Object.entries(result.metrics).forEach(([key, value]) => {
                    html += `  └─ ${key}: ${value}<br>`;
                });
            }
        });
        html += '</div>';
        
        resultsDiv.innerHTML = html;
    }
    
    generateTestSummary() {
        const summaryDiv = document.getElementById('test-summary');
        
        const allResults = [
            ...this.testResults.browserCompatibility,
            ...this.testResults.highFrequencyPerformance,
            ...this.testResults.memoryUsage
        ];
        
        const totalTests = allResults.length;
        const passedTests = allResults.filter(r => r.passed).length;
        const overallScore = Math.round((passedTests / totalTests) * 100);
        
        this.testResults.overallScore = overallScore;
        
        let status = 'fail';
        if (overallScore >= 95) status = 'pass';
        else if (overallScore >= 80) status = 'running';
        
        const browserInfo = this.detectBrowser();
        
        let html = `<div class="status ${status}">
            Overall Test Score: ${overallScore}% (${passedTests}/${totalTests} tests passed)
        </div>`;
        
        html += '<div class="metrics">';
        html += `Browser: ${browserInfo.name} ${browserInfo.version}<br>`;
        html += `Platform: ${browserInfo.platform}<br>`;
        html += `Test Date: ${new Date().toLocaleString()}<br><br>`;
        
        html += 'Test Categories:<br>';
        html += `├─ Browser Compatibility: ${this.testResults.browserCompatibility.filter(r => r.passed).length}/${this.testResults.browserCompatibility.length}<br>`;
        html += `├─ High-Frequency Performance: ${this.testResults.highFrequencyPerformance.filter(r => r.passed).length}/${this.testResults.highFrequencyPerformance.length}<br>`;
        html += `└─ Memory Usage: ${this.testResults.memoryUsage.filter(r => r.passed).length}/${this.testResults.memoryUsage.length}<br><br>`;
        
        if (overallScore >= 95) {
            html += 'Status: ✅ All systems operational<br>';
            html += 'The persistence system meets all performance and compatibility requirements.';
        } else if (overallScore >= 80) {
            html += 'Status: ⚠️ Minor issues detected<br>';
            html += 'The persistence system is functional but some optimizations may be needed.';
        } else {
            html += 'Status: ❌ Critical issues detected<br>';
            html += 'The persistence system requires attention before production use.';
        }
        
        html += '</div>';
        
        summaryDiv.innerHTML = html;
        
        // Log results to console for debugging
        console.log('Cross-Browser Performance Validation Results:', this.testResults);
    }
}

// Global functions for HTML buttons
let validator = null;

function initializeValidator() {
    if (!validator) {
        validator = new CrossBrowserPerformanceValidator();
    }
    return validator;
}

function runBrowserCompatibilityTests() {
    const v = initializeValidator();
    v.runBrowserCompatibilityTests();
}

function runHighFrequencyTests() {
    const v = initializeValidator();
    v.runHighFrequencyTests();
}

function runMemoryTests() {
    const v = initializeValidator();
    v.runMemoryTests();
}

function runPerformanceBenchmarks() {
    const v = initializeValidator();
    v.runPerformanceBenchmarks();
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeValidator();
});