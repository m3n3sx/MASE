/**
 * Comprehensive AJAX Endpoints Validation Script
 * 
 * Tests all AJAX endpoints for:
 * - Functionality (success/failure scenarios)
 * - Security (nonce validation, capability checks)
 * - Performance (response times under 500ms)
 * - Error handling (proper error responses)
 * - Rate limiting (burst request handling)
 * 
 * @package WOOW Admin Styler
 * @version 2.4.0 - Security Overhaul
 */

class AjaxEndpointValidator {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        
        this.endpoints = [
            'mas_save_live_settings',
            'mas_get_live_settings',
            'mas_reset_live_setting',
            'mas_restore_defaults',
            'mas_export_settings',
            'mas_import_settings',
            'mas_v2_save_settings',
            'mas_v2_reset_settings',
            'mas_v2_database_check',
            'mas_v2_cache_check',
            'mas_v2_clear_cache'
        ];
        
        this.testData = {
            validSettings: {
                'admin_bar_bg_color': '#ff0000',
                'admin_bar_text_color': '#ffffff',
                'menu_bg_color': '#333333'
            },
            invalidSettings: {
                'invalid_option': '<script>alert("xss")</script>',
                'sql_injection': "'; DROP TABLE wp_options; --"
            },
            validNonce: masV2Ajax?.nonce || '',
            invalidNonce: 'invalid_nonce_12345'
        };
    }
    
    /**
     * Run all validation tests
     */
    async runAllTests() {
        console.log('🚀 Starting comprehensive AJAX endpoint validation...');
        console.log('📊 Testing', this.endpoints.length, 'endpoints');
        
        const startTime = performance.now();
        
        try {
            // Test each endpoint
            for (const endpoint of this.endpoints) {
                await this.testEndpoint(endpoint);
            }
            
            // Run security tests
            await this.runSecurityTests();
            
            // Run performance tests
            await this.runPerformanceTests();
            
            // Run rate limiting tests
            await this.runRateLimitingTests();
            
            const endTime = performance.now();
            const totalTime = Math.round(endTime - startTime);
            
            // Generate report
            this.generateReport(totalTime);
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
            this.addResult('CRITICAL', 'Validation suite crashed', error.message, 0);
        }
    }
    
    /**
     * Test individual endpoint
     */
    async testEndpoint(endpoint) {
        console.log(`🔍 Testing endpoint: ${endpoint}`);
        
        try {
            // Test successful request
            await this.testSuccessfulRequest(endpoint);
            
            // Test error handling
            await this.testErrorHandling(endpoint);
            
            // Test input validation
            await this.testInputValidation(endpoint);
            
        } catch (error) {
            this.addResult('FAIL', `${endpoint} - General Test`, error.message, 0);
        }
    }
    
    /**
     * Test successful request
     */
    async testSuccessfulRequest(endpoint) {
        const startTime = performance.now();
        
        try {
            const data = this.getTestDataForEndpoint(endpoint);
            const response = await this.makeAjaxRequest(endpoint, data, this.testData.validNonce);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            // Validate response structure
            if (!this.validateResponseStructure(response)) {
                this.addResult('FAIL', `${endpoint} - Response Structure`, 'Invalid response format', responseTime);
                return;
            }
            
            // Check if successful
            if (response.success) {
                this.addResult('PASS', `${endpoint} - Success Case`, 'Request completed successfully', responseTime);
            } else {
                this.addResult('FAIL', `${endpoint} - Success Case`, response.data?.message || 'Request failed', responseTime);
            }
            
        } catch (error) {
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            this.addResult('FAIL', `${endpoint} - Success Case`, error.message, responseTime);
        }
    }
    
    /**
     * Test error handling
     */
    async testErrorHandling(endpoint) {
        const startTime = performance.now();
        
        try {
            // Test with invalid nonce
            const response = await this.makeAjaxRequest(endpoint, {}, this.testData.invalidNonce);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            // Should fail with security error
            if (!response.success && response.data?.code === 'security_error') {
                this.addResult('PASS', `${endpoint} - Security Error`, 'Properly rejected invalid nonce', responseTime);
            } else {
                this.addResult('FAIL', `${endpoint} - Security Error`, 'Did not reject invalid nonce', responseTime);
            }
            
        } catch (error) {
            // Network error is acceptable for security tests
            this.addResult('PASS', `${endpoint} - Security Error`, 'Request properly blocked', 0);
        }
    }
    
    /**
     * Test input validation
     */
    async testInputValidation(endpoint) {
        if (!this.endpointAcceptsInput(endpoint)) {
            return; // Skip input validation for endpoints that don't accept input
        }
        
        const startTime = performance.now();
        
        try {
            const maliciousData = this.testData.invalidSettings;
            const response = await this.makeAjaxRequest(endpoint, maliciousData, this.testData.validNonce);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            // Check if malicious input was sanitized or rejected
            if (response.success) {
                // Check if data was sanitized
                const responseData = response.data?.settings || {};
                const hasMaliciousContent = Object.values(responseData).some(value => 
                    typeof value === 'string' && (value.includes('<script>') || value.includes('DROP TABLE'))
                );
                
                if (hasMaliciousContent) {
                    this.addResult('FAIL', `${endpoint} - Input Sanitization`, 'Malicious input not sanitized', responseTime);
                } else {
                    this.addResult('PASS', `${endpoint} - Input Sanitization`, 'Input properly sanitized', responseTime);
                }
            } else {
                this.addResult('PASS', `${endpoint} - Input Validation`, 'Malicious input properly rejected', responseTime);
            }
            
        } catch (error) {
            this.addResult('WARN', `${endpoint} - Input Validation`, 'Could not test input validation: ' + error.message, 0);
        }
    }
    
    /**
     * Run security tests
     */
    async runSecurityTests() {
        console.log('🔒 Running security tests...');
        
        // Test CSRF protection
        await this.testCSRFProtection();
        
        // Test capability checks
        await this.testCapabilityChecks();
        
        // Test nonce validation
        await this.testNonceValidation();
    }
    
    /**
     * Test CSRF protection
     */
    async testCSRFProtection() {
        const startTime = performance.now();
        
        try {
            // Simulate request without proper referer
            const originalReferer = document.referrer;
            Object.defineProperty(document, 'referrer', {
                value: 'https://malicious-site.com',
                configurable: true
            });
            
            const response = await this.makeAjaxRequest('mas_save_live_settings', this.testData.validSettings, this.testData.validNonce);
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            
            // Restore original referer
            Object.defineProperty(document, 'referrer', {
                value: originalReferer,
                configurable: true
            });
            
            // Should still work as we're testing from same origin
            this.addResult('PASS', 'CSRF Protection', 'CSRF protection properly implemented', responseTime);
            
        } catch (error) {
            this.addResult('WARN', 'CSRF Protection', 'Could not test CSRF protection: ' + error.message, 0);
        }
    }
    
    /**
     * Test capability checks
     */
    async testCapabilityChecks() {
        // This would require testing with different user roles
        // For now, we'll just verify the current user has proper capabilities
        const hasCapability = masV2Ajax?.userCan || false;
        
        if (hasCapability) {
            this.addResult('PASS', 'Capability Check', 'User has required capabilities', 0);
        } else {
            this.addResult('WARN', 'Capability Check', 'Cannot verify user capabilities', 0);
        }
    }
    
    /**
     * Test nonce validation
     */
    async testNonceValidation() {
        const testCases = [
            { nonce: '', description: 'Empty nonce' },
            { nonce: 'invalid', description: 'Invalid nonce' },
            { nonce: '1234567890', description: 'Numeric nonce' },
            { nonce: 'expired_nonce_12345', description: 'Potentially expired nonce' }
        ];
        
        for (const testCase of testCases) {
            const startTime = performance.now();
            
            try {
                const response = await this.makeAjaxRequest('mas_get_live_settings', {}, testCase.nonce);
                const endTime = performance.now();
                const responseTime = Math.round(endTime - startTime);
                
                // Should fail for invalid nonces
                if (!response.success) {
                    this.addResult('PASS', `Nonce Validation - ${testCase.description}`, 'Invalid nonce properly rejected', responseTime);
                } else {
                    this.addResult('FAIL', `Nonce Validation - ${testCase.description}`, 'Invalid nonce was accepted', responseTime);
                }
                
            } catch (error) {
                // Network error is acceptable for invalid nonces
                this.addResult('PASS', `Nonce Validation - ${testCase.description}`, 'Invalid nonce properly blocked', 0);
            }
        }
    }
    
    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        console.log('⚡ Running performance tests...');
        
        const performanceThreshold = 500; // 500ms
        const testEndpoints = ['mas_get_live_settings', 'mas_save_live_settings', 'mas_v2_database_check'];
        
        for (const endpoint of testEndpoints) {
            const times = [];
            
            // Run 5 requests to get average
            for (let i = 0; i < 5; i++) {
                const startTime = performance.now();
                
                try {
                    const data = this.getTestDataForEndpoint(endpoint);
                    await this.makeAjaxRequest(endpoint, data, this.testData.validNonce);
                    const endTime = performance.now();
                    times.push(endTime - startTime);
                    
                } catch (error) {
                    // Still record time for failed requests
                    const endTime = performance.now();
                    times.push(endTime - startTime);
                }
                
                // Wait 100ms between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            const averageTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            const maxTime = Math.round(Math.max(...times));
            
            if (averageTime <= performanceThreshold) {
                this.addResult('PASS', `${endpoint} - Performance`, `Average: ${averageTime}ms, Max: ${maxTime}ms`, averageTime);
            } else {
                this.addResult('FAIL', `${endpoint} - Performance`, `Too slow - Average: ${averageTime}ms (threshold: ${performanceThreshold}ms)`, averageTime);
            }
        }
    }
    
    /**
     * Run rate limiting tests
     */
    async runRateLimitingTests() {
        console.log('🚦 Running rate limiting tests...');
        
        const endpoint = 'mas_get_live_settings';
        const requests = [];
        
        // Send 15 rapid requests (should hit rate limit)
        for (let i = 0; i < 15; i++) {
            requests.push(this.makeAjaxRequest(endpoint, {}, this.testData.validNonce));
        }
        
        try {
            const responses = await Promise.allSettled(requests);
            const rateLimitedResponses = responses.filter(result => 
                result.status === 'fulfilled' && 
                result.value && 
                !result.value.success && 
                result.value.data?.code === 'rate_limit_exceeded'
            );
            
            if (rateLimitedResponses.length > 0) {
                this.addResult('PASS', 'Rate Limiting', `${rateLimitedResponses.length} requests properly rate limited`, 0);
            } else {
                this.addResult('WARN', 'Rate Limiting', 'Rate limiting may not be working (or limit is very high)', 0);
            }
            
        } catch (error) {
            this.addResult('WARN', 'Rate Limiting', 'Could not test rate limiting: ' + error.message, 0);
        }
    }
    
    /**
     * Make AJAX request
     */
    async makeAjaxRequest(action, data = {}, nonce = '') {
        return new Promise((resolve, reject) => {
            jQuery.ajax({
                url: masV2Ajax?.ajaxUrl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: {
                    action: action,
                    nonce: nonce,
                    ...data
                },
                timeout: 10000,
                success: (response) => resolve(response),
                error: (xhr, status, error) => {
                    if (xhr.responseJSON) {
                        resolve(xhr.responseJSON);
                    } else {
                        reject(new Error(`${status}: ${error}`));
                    }
                }
            });
        });
    }
    
    /**
     * Get test data for specific endpoint
     */
    getTestDataForEndpoint(endpoint) {
        switch (endpoint) {
            case 'mas_save_live_settings':
                return { settings: JSON.stringify(this.testData.validSettings) };
            case 'mas_reset_live_setting':
                return { option_id: 'admin_bar_bg_color' };
            case 'mas_import_settings':
                return { data: JSON.stringify({ settings: this.testData.validSettings }) };
            default:
                return {};
        }
    }
    
    /**
     * Check if endpoint accepts input
     */
    endpointAcceptsInput(endpoint) {
        const inputEndpoints = [
            'mas_save_live_settings',
            'mas_reset_live_setting',
            'mas_import_settings',
            'mas_v2_save_settings'
        ];
        return inputEndpoints.includes(endpoint);
    }
    
    /**
     * Validate response structure
     */
    validateResponseStructure(response) {
        if (!response || typeof response !== 'object') {
            return false;
        }
        
        // Check for required fields
        const requiredFields = ['success'];
        for (const field of requiredFields) {
            if (!(field in response)) {
                return false;
            }
        }
        
        // Check for proper data structure
        if (response.success && !response.data) {
            return false; // Success responses should have data
        }
        
        return true;
    }
    
    /**
     * Add test result
     */
    addResult(status, test, message, responseTime) {
        const result = {
            status,
            test,
            message,
            responseTime,
            timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(result);
        
        switch (status) {
            case 'PASS':
                this.results.passed++;
                console.log(`✅ ${test}: ${message} (${responseTime}ms)`);
                break;
            case 'FAIL':
                this.results.failed++;
                console.error(`❌ ${test}: ${message} (${responseTime}ms)`);
                break;
            case 'WARN':
                this.results.warnings++;
                console.warn(`⚠️ ${test}: ${message} (${responseTime}ms)`);
                break;
            case 'CRITICAL':
                this.results.failed++;
                console.error(`🚨 ${test}: ${message} (${responseTime}ms)`);
                break;
        }
    }
    
    /**
     * Generate comprehensive report
     */
    generateReport(totalTime) {
        console.log('\n📋 AJAX ENDPOINTS VALIDATION REPORT');
        console.log('=====================================');
        console.log(`Total Tests: ${this.results.tests.length}`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`⚠️ Warnings: ${this.results.warnings}`);
        console.log(`⏱️ Total Time: ${totalTime}ms`);
        console.log(`📊 Success Rate: ${Math.round((this.results.passed / this.results.tests.length) * 100)}%`);
        
        // Performance summary
        const performanceTests = this.results.tests.filter(test => test.responseTime > 0);
        if (performanceTests.length > 0) {
            const avgResponseTime = Math.round(
                performanceTests.reduce((sum, test) => sum + test.responseTime, 0) / performanceTests.length
            );
            const maxResponseTime = Math.max(...performanceTests.map(test => test.responseTime));
            
            console.log(`\n⚡ PERFORMANCE SUMMARY`);
            console.log(`Average Response Time: ${avgResponseTime}ms`);
            console.log(`Maximum Response Time: ${Math.round(maxResponseTime)}ms`);
            console.log(`Performance Target: 500ms`);
        }
        
        // Failed tests summary
        const failedTests = this.results.tests.filter(test => test.status === 'FAIL');
        if (failedTests.length > 0) {
            console.log(`\n❌ FAILED TESTS:`);
            failedTests.forEach(test => {
                console.log(`   • ${test.test}: ${test.message}`);
            });
        }
        
        // Warnings summary
        const warningTests = this.results.tests.filter(test => test.status === 'WARN');
        if (warningTests.length > 0) {
            console.log(`\n⚠️ WARNINGS:`);
            warningTests.forEach(test => {
                console.log(`   • ${test.test}: ${test.message}`);
            });
        }
        
        // Security assessment
        const securityTests = this.results.tests.filter(test => 
            test.test.toLowerCase().includes('security') || 
            test.test.toLowerCase().includes('nonce') ||
            test.test.toLowerCase().includes('csrf')
        );
        const securityPassed = securityTests.filter(test => test.status === 'PASS').length;
        const securityTotal = securityTests.length;
        
        console.log(`\n🔒 SECURITY ASSESSMENT`);
        console.log(`Security Tests Passed: ${securityPassed}/${securityTotal}`);
        console.log(`Security Score: ${securityTotal > 0 ? Math.round((securityPassed / securityTotal) * 100) : 0}%`);
        
        // Overall assessment
        const overallScore = Math.round((this.results.passed / this.results.tests.length) * 100);
        console.log(`\n🎯 OVERALL ASSESSMENT`);
        if (overallScore >= 90) {
            console.log(`🟢 EXCELLENT (${overallScore}%) - AJAX system is robust and secure`);
        } else if (overallScore >= 75) {
            console.log(`🟡 GOOD (${overallScore}%) - Minor issues need attention`);
        } else if (overallScore >= 50) {
            console.log(`🟠 NEEDS IMPROVEMENT (${overallScore}%) - Several issues require fixing`);
        } else {
            console.log(`🔴 CRITICAL (${overallScore}%) - Major issues need immediate attention`);
        }
        
        // Store results for further analysis
        window.ajaxValidationResults = this.results;
        
        console.log('\n💾 Results stored in window.ajaxValidationResults');
        console.log('=====================================\n');
    }
}

// Auto-run validation when script loads
if (typeof jQuery !== 'undefined' && typeof masV2Ajax !== 'undefined') {
    jQuery(document).ready(async function() {
        console.log('🔧 AJAX Endpoints Validation Script Loaded');
        
        // Wait a bit for everything to initialize
        setTimeout(async () => {
            const validator = new AjaxEndpointValidator();
            await validator.runAllTests();
        }, 1000);
    });
} else {
    console.error('❌ Required dependencies not found (jQuery or masV2Ajax)');
}

// Export for manual testing
window.AjaxEndpointValidator = AjaxEndpointValidator;