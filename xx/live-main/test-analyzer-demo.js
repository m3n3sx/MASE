/**
 * Demo script to test the TestResultAnalyzer functionality
 */

const TestResultAnalyzer = require('./tests/reporting/test-result-analyzer');

async function demoAnalyzer() {
    console.log('🧪 Testing TestResultAnalyzer functionality...\n');
    
    const analyzer = new TestResultAnalyzer({
        resultsDir: 'tests/results',
        reportsDir: 'tests/reporting/reports',
        flakyThreshold: 0.8,
        trendPeriod: 30
    });

    // Mock test results
    const mockTestResults = {
        executionId: 'demo-exec-123',
        summary: {
            totalTests: 150,
            passedTests: 135,
            failedTests: 15,
            skippedTests: 0,
            executionTime: 180000
        },
        environment: 'ci-cd',
        branch: 'main',
        commit: 'abc123def',
        e2eResults: {
            totalTests: 50,
            passedTests: 45,
            failedTests: 5,
            failures: [
                {
                    testName: 'admin-bar-color-persistence',
                    browser: 'chrome',
                    error: 'CSS variable not applied after page refresh',
                    screenshot: 'screenshots/admin-bar-failure.png'
                },
                {
                    testName: 'multi-tab-sync',
                    browser: 'firefox',
                    error: 'BroadcastChannel not working',
                    screenshot: 'screenshots/multi-tab-failure.png'
                }
            ]
        },
        unitResults: {
            totalTests: 75,
            passedTests: 70,
            failedTests: 5
        },
        integrationResults: {
            totalTests: 25,
            passedTests: 20,
            failedTests: 5
        }
    };

    try {
        console.log('📊 Analyzing test results...');
        const results = await analyzer.analyzeTestResults(mockTestResults);
        
        console.log('\n✅ Analysis completed successfully!');
        console.log('\n📈 Summary:');
        console.log(`- Total Tests: ${results.summary.totalTests}`);
        console.log(`- Pass Rate: ${results.summary.passRate.toFixed(1)}%`);
        console.log(`- Execution Time: ${analyzer.formatDuration(results.summary.executionTime)}`);
        
        if (results.flakyTests.length > 0) {
            console.log(`\n⚠️  Flaky Tests Found: ${results.flakyTests.length}`);
            results.flakyTests.forEach(test => {
                console.log(`  - ${test.name}: ${(test.passRate * 100).toFixed(1)}% pass rate`);
            });
        }
        
        if (results.recommendations.length > 0) {
            console.log(`\n💡 Recommendations: ${results.recommendations.length}`);
            results.recommendations.forEach(rec => {
                console.log(`  - ${rec.title} (${rec.priority}): ${rec.description}`);
            });
        }
        
        console.log('\n📁 Reports generated in: tests/reporting/reports/');
        console.log('  - test-summary.md');
        console.log('  - trend-analysis.md');
        console.log('  - flaky-tests.md');
        console.log('  - test-analysis.json');
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    }
}

// Run the demo
demoAnalyzer();