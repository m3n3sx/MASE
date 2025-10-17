/**
 * Complete system demo showing TestResultAnalyzer and DashboardGenerator integration
 */

const TestResultAnalyzer = require('./tests/reporting/test-result-analyzer');
const DashboardGenerator = require('./tests/reporting/dashboard-generator');
const fs = require('fs').promises;

async function createComprehensiveTestData() {
    // Create comprehensive mock historical data
    const mockHistory = [];
    const baseDate = new Date('2025-01-01');
    
    for (let i = 0; i < 20; i++) {
        const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
        
        // Simulate realistic test patterns with trends
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Weekend tests tend to be more stable (less changes)
        const basePassRate = isWeekend ? 85 + (i * 0.5) : 75 + (i * 1.2) + (Math.random() * 15 - 7.5);
        const totalTests = 120 + Math.floor(Math.random() * 30);
        const passedTests = Math.floor(totalTests * Math.max(0.6, Math.min(1.0, basePassRate / 100)));
        const failedTests = totalTests - passedTests;
        const executionTime = 90000 + Math.floor(Math.random() * 120000) + (isWeekend ? -20000 : 0);
        
        mockHistory.push({
            timestamp: date.toISOString(),
            executionId: `exec-${String(i + 1).padStart(3, '0')}`,
            summary: {
                totalTests,
                passedTests,
                failedTests,
                skippedTests: Math.floor(Math.random() * 3),
                executionTime
            },
            environment: i % 3 === 0 ? 'staging' : 'ci-cd',
            branch: i % 5 === 0 ? 'develop' : 'main',
            commit: `commit-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).substr(2, 7)}`,
            tests: [
                { name: 'admin-bar-persistence', status: Math.random() > 0.05 ? 'passed' : 'failed' },
                { name: 'css-variable-restoration', status: Math.random() > 0.08 ? 'passed' : 'failed' },
                { name: 'multi-tab-sync', status: Math.random() > 0.12 ? 'passed' : 'failed' },
                { name: 'flaky-network-test', status: Math.random() > 0.4 ? 'passed' : 'failed', error: 'network timeout' },
                { name: 'intermittent-ui-test', status: Math.random() > 0.35 ? 'passed' : 'failed', error: 'element not found' }
            ]
        });
    }
    
    // Ensure directories exist
    await fs.mkdir('tests/results', { recursive: true });
    await fs.mkdir('tests/reporting/reports', { recursive: true });
    await fs.mkdir('tests/artifacts/screenshots', { recursive: true });
    await fs.mkdir('tests/artifacts/videos', { recursive: true });
    await fs.mkdir('tests/artifacts/logs', { recursive: true });
    
    // Write mock history
    await fs.writeFile('tests/results/test-history.json', JSON.stringify(mockHistory, null, 2));
    
    // Create some mock artifacts
    await fs.writeFile('tests/artifacts/screenshots/admin-bar-failure.png', 'mock screenshot data');
    await fs.writeFile('tests/artifacts/screenshots/multi-tab-sync-failure.png', 'mock screenshot data');
    await fs.writeFile('tests/artifacts/videos/test-execution.mp4', 'mock video data');
    await fs.writeFile('tests/artifacts/logs/test-execution.log', 'mock log data\ntest started\ntest completed');
    
    return mockHistory;
}

async function demoCompleteSystem() {
    console.log('🚀 Complete Test Analysis & Dashboard System Demo\n');
    
    // Create comprehensive test data
    console.log('📝 Creating comprehensive test data...');
    await createComprehensiveTestData();
    
    // Initialize components
    const analyzer = new TestResultAnalyzer({
        resultsDir: 'tests/results',
        reportsDir: 'tests/reporting/reports',
        flakyThreshold: 0.75,
        trendPeriod: 30,
        performanceRegressionThreshold: 0.15
    });

    const dashboardGenerator = new DashboardGenerator({
        outputDir: 'tests/reporting/dashboard',
        artifactsDir: 'tests/artifacts',
        realtimeUpdate: true
    });

    // Current comprehensive test results
    const currentTestResults = {
        executionId: 'demo-comprehensive-latest',
        summary: {
            totalTests: 145,
            passedTests: 132,
            failedTests: 13,
            skippedTests: 0,
            executionTime: 185000
        },
        environment: 'ci-cd',
        branch: 'main',
        commit: 'latest-comprehensive-commit',
        e2eResults: {
            totalTests: 45,
            passedTests: 41,
            failedTests: 4,
            failures: [
                {
                    testName: 'admin-bar-color-persistence',
                    browser: 'chrome',
                    error: 'CSS variable --woow-surface-bar not applied after page refresh',
                    screenshot: 'tests/artifacts/screenshots/admin-bar-failure.png'
                },
                {
                    testName: 'multi-tab-synchronization',
                    browser: 'firefox',
                    error: 'BroadcastChannel message not received in secondary tab',
                    screenshot: 'tests/artifacts/screenshots/multi-tab-sync-failure.png'
                }
            ]
        },
        unitResults: {
            totalTests: 70,
            passedTests: 65,
            failedTests: 5
        },
        integrationResults: {
            totalTests: 30,
            passedTests: 26,
            failedTests: 4
        },
        performanceResults: {
            totalTests: 15,
            passedTests: 12,
            failedTests: 3,
            averageExecutionTime: 1250,
            memoryUsage: 45.2
        },
        stressResults: {
            totalTests: 10,
            passedTests: 8,
            failedTests: 2,
            concurrentUsers: 50,
            successfulOperations: 4850,
            failedOperations: 150
        }
    };

    try {
        console.log('📊 Running comprehensive test analysis...');
        const analysisResults = await analyzer.analyzeTestResults(currentTestResults);
        
        console.log('🎨 Generating interactive dashboard...');
        const dashboardResults = await dashboardGenerator.generateDashboard(currentTestResults, analysisResults);
        
        console.log('\n✅ Complete system analysis finished successfully!\n');
        
        // Display comprehensive results
        console.log('📈 ANALYSIS SUMMARY:');
        console.log(`├─ Total Tests: ${analysisResults.summary.totalTests}`);
        console.log(`├─ Pass Rate: ${analysisResults.summary.passRate.toFixed(1)}%`);
        console.log(`├─ Execution Time: ${analyzer.formatDuration(analysisResults.summary.executionTime)}`);
        console.log(`└─ Test Categories: ${Object.keys(analysisResults.categories).length}`);
        
        // Trending insights
        if (analysisResults.trends && !analysisResults.trends.insufficient_data) {
            console.log('\n📊 TRENDING INSIGHTS:');
            
            if (analysisResults.trends.passRateTrend) {
                const trend = analysisResults.trends.passRateTrend;
                console.log(`├─ Pass Rate: ${trend.trend} (${trend.change > 0 ? '+' : ''}${trend.change}%)`);
            }
            
            if (analysisResults.trends.stabilityScore) {
                const stability = analysisResults.trends.stabilityScore;
                console.log(`├─ Stability: ${stability.score}/100 (${stability.status})`);
            }
            
            if (analysisResults.trends.velocityTrend) {
                const velocity = analysisResults.trends.velocityTrend;
                console.log(`├─ Velocity: ${velocity.velocity} ${velocity.unit} (${velocity.trend})`);
            }
            
            if (analysisResults.trends.qualityTrend) {
                const quality = analysisResults.trends.qualityTrend;
                console.log(`└─ Quality: ${quality.score}/100 (${quality.trend})`);
            }
        }
        
        // Historical comparison
        if (analysisResults.trends?.historicalComparison) {
            console.log('\n📅 HISTORICAL COMPARISON:');
            Object.entries(analysisResults.trends.historicalComparison).forEach(([period, data]) => {
                console.log(`├─ ${period.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${data.runs} runs, ${data.avgPassRate}% avg`);
            });
        }
        
        // Predictions
        if (analysisResults.trends?.trendPredictions?.available) {
            console.log('\n🔮 PREDICTIONS:');
            const predictions = analysisResults.trends.trendPredictions;
            console.log(`├─ Next Pass Rate: ${predictions.passRate.nextRun.toFixed(1)}% (${predictions.passRate.confidence.level})`);
            console.log(`└─ Next Duration: ${analyzer.formatDuration(predictions.executionTime.nextRun)} (${predictions.executionTime.confidence.level})`);
        }
        
        // Flaky tests
        if (analysisResults.flakyTests.length > 0) {
            console.log(`\n⚠️  FLAKY TESTS (${analysisResults.flakyTests.length}):`);
            analysisResults.flakyTests.slice(0, 3).forEach((test, index) => {
                const prefix = index === analysisResults.flakyTests.length - 1 ? '└─' : '├─';
                console.log(`${prefix} ${test.name}: ${(test.passRate * 100).toFixed(1)}% (${test.runs} runs)`);
            });
        }
        
        // Recommendations
        if (analysisResults.recommendations.length > 0) {
            console.log(`\n💡 RECOMMENDATIONS (${analysisResults.recommendations.length}):`);
            analysisResults.recommendations.slice(0, 3).forEach((rec, index) => {
                const prefix = index === analysisResults.recommendations.length - 1 ? '└─' : '├─';
                console.log(`${prefix} ${rec.title} (${rec.priority})`);
            });
        }
        
        // Dashboard info
        console.log('\n🎨 DASHBOARD GENERATED:');
        console.log(`├─ Location: ${dashboardResults.dashboardPath}`);
        console.log(`├─ Components: ${dashboardResults.componentsGenerated}`);
        console.log(`└─ Artifacts: ${dashboardResults.artifactsCollected}`);
        
        // Generated files
        console.log('\n📁 GENERATED FILES:');
        console.log('├─ Analysis Reports:');
        console.log('│  ├─ tests/reporting/reports/test-summary.md');
        console.log('│  ├─ tests/reporting/reports/trend-analysis.md');
        console.log('│  ├─ tests/reporting/reports/flaky-tests.md');
        console.log('│  └─ tests/reporting/reports/test-analysis.json');
        console.log('├─ Interactive Dashboard:');
        console.log('│  ├─ tests/reporting/dashboard/index.html');
        console.log('│  ├─ tests/reporting/dashboard/styles.css');
        console.log('│  └─ tests/reporting/dashboard/dashboard.js');
        console.log('└─ Component Files:');
        console.log('   ├─ summary.html, trends.html, failures.html');
        console.log('   └─ performance.html, artifacts.html, recommendations.html');
        
        console.log('\n🌐 To view the dashboard:');
        console.log(`   Open: file://${process.cwd()}/tests/reporting/dashboard/index.html`);
        
        // Show sample from comprehensive analysis
        try {
            const analysisJson = await fs.readFile('tests/reporting/reports/test-analysis.json', 'utf8');
            const analysis = JSON.parse(analysisJson);
            console.log('\n📄 SAMPLE ANALYSIS DATA:');
            console.log(`├─ Timestamp: ${analysis.timestamp}`);
            console.log(`├─ Total Recommendations: ${analysis.recommendations?.length || 0}`);
            console.log(`├─ Flaky Tests: ${analysis.flakyTests?.length || 0}`);
            console.log(`└─ Trend Data Points: ${Object.keys(analysis.trends || {}).length}`);
        } catch (error) {
            console.log('\n📄 Analysis data saved successfully');
        }
        
    } catch (error) {
        console.error('❌ System demo failed:', error.message);
        console.error(error.stack);
    }
}

// Run the complete system demo
demoCompleteSystem();