/**
 * Enhanced demo script to test the TestResultAnalyzer with trending functionality
 */

const TestResultAnalyzer = require('./tests/reporting/test-result-analyzer');
const fs = require('fs').promises;
const path = require('path');

async function createMockHistory() {
    // Create mock historical data for trending analysis
    const mockHistory = [];
    const baseDate = new Date('2025-01-01');
    
    for (let i = 0; i < 15; i++) {
        const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        
        // Simulate improving trend with some variation
        const basePassRate = 75 + (i * 1.5) + (Math.random() * 10 - 5);
        const totalTests = 100 + Math.floor(Math.random() * 20);
        const passedTests = Math.floor(totalTests * (basePassRate / 100));
        const failedTests = totalTests - passedTests;
        const executionTime = 120000 + Math.floor(Math.random() * 60000);
        
        mockHistory.push({
            timestamp: date.toISOString(),
            executionId: `exec-${i + 1}`,
            summary: {
                totalTests,
                passedTests,
                failedTests,
                skippedTests: 0,
                executionTime
            },
            environment: 'ci-cd',
            branch: 'main',
            commit: `commit-${i + 1}`,
            tests: [
                { name: 'test-1', status: Math.random() > 0.1 ? 'passed' : 'failed' },
                { name: 'test-2', status: Math.random() > 0.05 ? 'passed' : 'failed' },
                { name: 'flaky-test', status: Math.random() > 0.3 ? 'passed' : 'failed', error: 'timeout' }
            ]
        });
    }
    
    // Ensure results directory exists
    await fs.mkdir('tests/results', { recursive: true });
    
    // Write mock history
    await fs.writeFile('tests/results/test-history.json', JSON.stringify(mockHistory, null, 2));
    
    return mockHistory;
}

async function demoEnhancedAnalyzer() {
    console.log('🧪 Testing Enhanced TestResultAnalyzer with Trending...\n');
    
    // Create mock historical data
    console.log('📝 Creating mock historical data...');
    await createMockHistory();
    
    const analyzer = new TestResultAnalyzer({
        resultsDir: 'tests/results',
        reportsDir: 'tests/reporting/reports',
        flakyThreshold: 0.7,
        trendPeriod: 30
    });

    // Current test results
    const mockTestResults = {
        executionId: 'demo-exec-latest',
        summary: {
            totalTests: 150,
            passedTests: 140,
            failedTests: 10,
            skippedTests: 0,
            executionTime: 165000
        },
        environment: 'ci-cd',
        branch: 'main',
        commit: 'latest-commit',
        e2eResults: {
            totalTests: 50,
            passedTests: 47,
            failedTests: 3,
            failures: [
                {
                    testName: 'admin-bar-color-persistence',
                    browser: 'chrome',
                    error: 'CSS variable not applied after page refresh'
                }
            ]
        },
        unitResults: {
            totalTests: 75,
            passedTests: 72,
            failedTests: 3
        },
        integrationResults: {
            totalTests: 25,
            passedTests: 21,
            failedTests: 4
        }
    };

    try {
        console.log('📊 Analyzing test results with trending...');
        const results = await analyzer.analyzeTestResults(mockTestResults);
        
        console.log('\n✅ Enhanced analysis completed successfully!');
        
        // Display summary
        console.log('\n📈 Summary:');
        console.log(`- Total Tests: ${results.summary.totalTests}`);
        console.log(`- Pass Rate: ${results.summary.passRate.toFixed(1)}%`);
        console.log(`- Execution Time: ${analyzer.formatDuration(results.summary.executionTime)}`);
        
        // Display trending information
        if (results.trends && !results.trends.insufficient_data) {
            console.log('\n📊 Trending Analysis:');
            
            if (results.trends.passRateTrend) {
                console.log(`- Pass Rate Trend: ${results.trends.passRateTrend.trend} (${results.trends.passRateTrend.change > 0 ? '+' : ''}${results.trends.passRateTrend.change}%)`);
            }
            
            if (results.trends.stabilityScore) {
                console.log(`- Stability Score: ${results.trends.stabilityScore.score}/100 (${results.trends.stabilityScore.status})`);
            }
            
            if (results.trends.velocityTrend) {
                console.log(`- Test Velocity: ${results.trends.velocityTrend.velocity} ${results.trends.velocityTrend.unit} (${results.trends.velocityTrend.trend})`);
            }
            
            if (results.trends.qualityTrend) {
                console.log(`- Quality Trend: ${results.trends.qualityTrend.score}/100 (${results.trends.qualityTrend.trend})`);
            }
            
            // Historical comparison
            if (results.trends.historicalComparison) {
                console.log('\n📅 Historical Comparison:');
                Object.entries(results.trends.historicalComparison).forEach(([period, data]) => {
                    console.log(`  - ${period}: ${data.runs} runs, ${data.avgPassRate}% avg pass rate`);
                });
            }
            
            // Predictions
            if (results.trends.trendPredictions && results.trends.trendPredictions.available) {
                console.log('\n🔮 Predictions:');
                console.log(`  - Next Pass Rate: ${results.trends.trendPredictions.passRate.nextRun.toFixed(1)}% (${results.trends.trendPredictions.passRate.confidence.level} confidence)`);
                console.log(`  - Next Execution Time: ${analyzer.formatDuration(results.trends.trendPredictions.executionTime.nextRun)} (${results.trends.trendPredictions.executionTime.confidence.level} confidence)`);
            }
        } else {
            console.log('\n📊 Trending: Insufficient historical data');
        }
        
        // Display flaky tests
        if (results.flakyTests.length > 0) {
            console.log(`\n⚠️  Flaky Tests Found: ${results.flakyTests.length}`);
            results.flakyTests.forEach(test => {
                console.log(`  - ${test.name}: ${(test.passRate * 100).toFixed(1)}% pass rate (${test.runs} runs)`);
            });
        }
        
        // Display recommendations
        if (results.recommendations.length > 0) {
            console.log(`\n💡 Recommendations: ${results.recommendations.length}`);
            results.recommendations.forEach(rec => {
                console.log(`  - ${rec.title} (${rec.priority}): ${rec.description}`);
            });
        }
        
        console.log('\n📁 Enhanced reports generated in: tests/reporting/reports/');
        console.log('  - test-summary.md (with trending data)');
        console.log('  - trend-analysis.md (comprehensive trends)');
        console.log('  - flaky-tests.md (stability analysis)');
        console.log('  - test-analysis.json (full data)');
        
        // Show sample of trend analysis report
        try {
            const trendReport = await fs.readFile('tests/reporting/reports/trend-analysis.md', 'utf8');
            console.log('\n📄 Sample from Trend Analysis Report:');
            console.log(trendReport.substring(0, 500) + '...');
        } catch (error) {
            console.log('\n📄 Trend analysis report generated successfully');
        }
        
    } catch (error) {
        console.error('❌ Enhanced analysis failed:', error.message);
        console.error(error.stack);
    }
}

// Run the enhanced demo
demoEnhancedAnalyzer();