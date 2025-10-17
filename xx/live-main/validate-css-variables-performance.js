#!/usr/bin/env node

/**
 * CSS Variables Performance Validation Script
 * 
 * Automated performance testing and validation for CSS variables restoration system.
 * Runs comprehensive performance tests and generates detailed reports.
 * 
 * Requirements: 1.3, 1.4, 6.1, 6.2, 6.3, 6.4
 * 
 * Usage: node validate-css-variables-performance.js [options]
 * Options:
 *   --benchmark    Run benchmark tests
 *   --regression   Run regression tests
 *   --report       Generate detailed report
 *   --iterations   Number of test iterations (default: 10)
 * 
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment for Node.js testing
global.performance = {
    now: () => Date.now(),
    memory: {
        usedJSHeapSize: process.memoryUsage().heapUsed,
        totalJSHeapSize: process.memoryUsage().heapTotal,
        jsHeapSizeLimit: process.memoryUsage().heapTotal * 4
    }
};

// Create localStorage mock
const localStorageMock = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
};

global.localStorage = localStorageMock;

global.window = {
    location: { search: '' },
    localStorage: localStorageMock,
    CSS: { supports: () => true },
    PerformanceObserver: function() {
        return { observe: () => {}, disconnect: () => {} };
    },
    woowAdminStyler: {
        ajaxUrl: '/wp-admin/admin-ajax.php',
        nonce: 'test-nonce'
    }
};

global.document = {
    documentElement: {
        style: {
            setProperty: () => {}
        }
    },
    readyState: 'complete',
    addEventListener: () => {},
    removeEventListener: () => {}
};

// Mock FormData for Node.js
global.FormData = class FormData {
    constructor() {
        this.data = new Map();
    }
    
    append(key, value) {
        this.data.set(key, value);
    }
    
    get(key) {
        return this.data.get(key);
    }
};

global.fetch = async (url, options) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50));
    
    if (options.body && options.body.get && options.body.get('action') === 'woow_load_css_variables') {
        return {
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    'surface_bar': '#23282d',
                    'surface_menu': '#ffffff',
                    'surface_content': '#ffffff',
                    'text_primary': '#1d2327',
                    'text_secondary': '#646970',
                    'accent_primary': '#2271b1',
                    'accent_secondary': '#72aee6',
                    'border_color': '#c3c4c7',
                    'border_radius': '4px'
                }
            })
        };
    }
    
    throw new Error('Network error');
};

global.console = {
    log: (...args) => process.stdout.write(args.join(' ') + '\n'),
    warn: (...args) => process.stderr.write('WARN: ' + args.join(' ') + '\n'),
    error: (...args) => process.stderr.write('ERROR: ' + args.join(' ') + '\n'),
    group: () => {},
    groupEnd: () => {},
    table: () => {}
};

// Load the CSS Variables system
const CSSVariablesRestorer = require('./assets/js/css-variables-restorer.js');
const CSSVariablesPerformanceMonitor = require('./assets/js/css-variables-performance-monitor.js');

class PerformanceValidator {
    constructor(options = {}) {
        this.options = {
            iterations: options.iterations || 10,
            benchmark: options.benchmark || false,
            regression: options.regression || false,
            report: options.report || false,
            outputFile: options.outputFile || 'css-variables-performance-report.json',
            verbose: options.verbose || false
        };
        
        this.results = [];
        this.startTime = Date.now();
    }

    /**
     * Run comprehensive performance validation
     */
    async run() {
        console.log('🚀 CSS Variables Performance Validation');
        console.log('========================================');
        console.log(`Iterations: ${this.options.iterations}`);
        console.log(`Benchmark: ${this.options.benchmark ? 'Yes' : 'No'}`);
        console.log(`Regression: ${this.options.regression ? 'Yes' : 'No'}`);
        console.log('');

        try {
            // Run performance tests
            await this.runPerformanceTests();
            
            // Run benchmark if requested
            if (this.options.benchmark) {
                await this.runBenchmarkTests();
            }
            
            // Run regression tests if requested
            if (this.options.regression) {
                await this.runRegressionTests();
            }
            
            // Generate report
            const report = this.generateReport();
            
            if (this.options.report) {
                this.saveReport(report);
            }
            
            this.printSummary(report);
            
            // Exit with appropriate code
            const success = report.summary.overallStatus === 'passed';
            process.exit(success ? 0 : 1);
            
        } catch (error) {
            console.error('Validation failed:', error.message);
            if (this.options.verbose) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Run basic performance tests
     */
    async runPerformanceTests() {
        console.log('Running performance tests...');
        
        for (let i = 0; i < this.options.iterations; i++) {
            process.stdout.write(`  Iteration ${i + 1}/${this.options.iterations}... `);
            
            const result = await this.runSingleTest();
            this.results.push(result);
            
            const status = result.thresholds.overall === 'passed' ? '✅' : '❌';
            const duration = result.restoration.duration.toFixed(2);
            console.log(`${status} ${duration}ms (Score: ${result.score}/100)`);
            
            // Small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log('');
    }

    /**
     * Run a single performance test
     */
    async runSingleTest() {
        const restorer = new CSSVariablesRestorer();
        const monitor = new CSSVariablesPerformanceMonitor();
        
        // Start monitoring
        monitor.startMonitoring(restorer);
        
        // Run restoration
        await restorer.initialize();
        
        // Stop monitoring and get report
        const report = monitor.stopMonitoring();
        
        // Cleanup
        monitor.cleanup();
        
        return report;
    }

    /**
     * Run benchmark tests for baseline establishment
     */
    async runBenchmarkTests() {
        console.log('Running benchmark tests...');
        
        const benchmarkResults = [];
        const benchmarkIterations = Math.max(20, this.options.iterations * 2);
        
        for (let i = 0; i < benchmarkIterations; i++) {
            process.stdout.write(`  Benchmark ${i + 1}/${benchmarkIterations}... `);
            
            const result = await this.runSingleTest();
            benchmarkResults.push(result);
            
            const duration = result.restoration.duration.toFixed(2);
            console.log(`${duration}ms`);
        }
        
        // Calculate benchmark statistics
        const durations = benchmarkResults.map(r => r.restoration.duration);
        const scores = benchmarkResults.map(r => r.score);
        
        const benchmark = {
            iterations: benchmarkIterations,
            duration: {
                min: Math.min(...durations),
                max: Math.max(...durations),
                avg: durations.reduce((a, b) => a + b, 0) / durations.length,
                median: this.calculateMedian(durations),
                p95: this.calculatePercentile(durations, 95),
                p99: this.calculatePercentile(durations, 99)
            },
            score: {
                min: Math.min(...scores),
                max: Math.max(...scores),
                avg: scores.reduce((a, b) => a + b, 0) / scores.length
            },
            consistency: this.calculateConsistency(durations)
        };
        
        console.log('');
        console.log('Benchmark Results:');
        console.log(`  Duration - Min: ${benchmark.duration.min.toFixed(2)}ms, Max: ${benchmark.duration.max.toFixed(2)}ms, Avg: ${benchmark.duration.avg.toFixed(2)}ms`);
        console.log(`  Score - Min: ${benchmark.score.min.toFixed(1)}, Max: ${benchmark.score.max.toFixed(1)}, Avg: ${benchmark.score.avg.toFixed(1)}`);
        console.log(`  Consistency: ${benchmark.consistency.toFixed(1)}%`);
        console.log('');
        
        this.benchmark = benchmark;
    }

    /**
     * Run regression tests against baseline
     */
    async runRegressionTests() {
        console.log('Running regression tests...');
        
        if (!this.benchmark) {
            console.log('  No benchmark data available, skipping regression tests');
            return;
        }
        
        // Use current results for regression comparison
        const currentDurations = this.results.map(r => r.restoration.duration);
        const currentAvg = currentDurations.reduce((a, b) => a + b, 0) / currentDurations.length;
        const baselineAvg = this.benchmark.duration.avg;
        
        const regressionRatio = currentAvg / baselineAvg;
        const regressionPercent = ((regressionRatio - 1) * 100);
        
        let regressionStatus = 'passed';
        let regressionMessage = '';
        
        if (regressionRatio > 1.2) {
            regressionStatus = 'failed';
            regressionMessage = `Significant regression: ${regressionPercent.toFixed(1)}% slower`;
        } else if (regressionRatio > 1.1) {
            regressionStatus = 'warning';
            regressionMessage = `Minor regression: ${regressionPercent.toFixed(1)}% slower`;
        } else if (regressionRatio < 0.9) {
            regressionStatus = 'improved';
            regressionMessage = `Performance improved: ${Math.abs(regressionPercent).toFixed(1)}% faster`;
        } else {
            regressionStatus = 'stable';
            regressionMessage = `Performance stable: ${regressionPercent.toFixed(1)}% change`;
        }
        
        this.regression = {
            status: regressionStatus,
            message: regressionMessage,
            currentAvg: currentAvg.toFixed(2),
            baselineAvg: baselineAvg.toFixed(2),
            ratio: regressionRatio,
            percent: regressionPercent
        };
        
        const statusIcon = regressionStatus === 'failed' ? '❌' : 
                          regressionStatus === 'warning' ? '⚠️' : 
                          regressionStatus === 'improved' ? '🚀' : '✅';
        
        console.log(`  ${statusIcon} ${regressionMessage}`);
        console.log(`  Current: ${this.regression.currentAvg}ms, Baseline: ${this.regression.baselineAvg}ms`);
        console.log('');
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        const durations = this.results.map(r => r.restoration.duration);
        const scores = this.results.map(r => r.score);
        const passedTests = this.results.filter(r => r.thresholds.overall === 'passed').length;
        
        const report = {
            metadata: {
                timestamp: new Date().toISOString(),
                iterations: this.options.iterations,
                duration: Date.now() - this.startTime,
                nodeVersion: process.version,
                platform: process.platform
            },
            summary: {
                totalTests: this.results.length,
                passedTests,
                failedTests: this.results.length - passedTests,
                successRate: (passedTests / this.results.length * 100).toFixed(1),
                overallStatus: passedTests === this.results.length ? 'passed' : 'failed'
            },
            performance: {
                duration: {
                    min: Math.min(...durations),
                    max: Math.max(...durations),
                    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
                    median: this.calculateMedian(durations),
                    p95: this.calculatePercentile(durations, 95),
                    p99: this.calculatePercentile(durations, 99)
                },
                score: {
                    min: Math.min(...scores),
                    max: Math.max(...scores),
                    avg: scores.reduce((a, b) => a + b, 0) / scores.length
                },
                consistency: this.calculateConsistency(durations)
            },
            thresholds: {
                immediate: this.evaluateThreshold(this.results, 'immediate', 50),
                database: this.evaluateThreshold(this.results, 'database', 2000),
                total: this.evaluateThreshold(this.results, 'total', 2500)
            },
            benchmark: this.benchmark || null,
            regression: this.regression || null,
            rawResults: this.options.verbose ? this.results : null
        };
        
        // Generate recommendations after report is created to avoid circular reference
        report.recommendations = this.generateRecommendationsFromReport(report);
        
        return report;
    }

    /**
     * Evaluate threshold performance
     */
    evaluateThreshold(results, type, threshold) {
        let values = [];
        
        switch (type) {
            case 'immediate':
                values = results.map(r => {
                    const phase = r.restoration.phases['apply-variables-localStorage-immediate'] ||
                                r.restoration.phases['apply-variables-defaults-immediate'];
                    return phase ? phase.duration : 0;
                }).filter(v => v > 0);
                break;
            case 'database':
                values = results.map(r => {
                    const phase = r.restoration.phases['database-load'];
                    return phase ? phase.duration : 0;
                }).filter(v => v > 0);
                break;
            case 'total':
                values = results.map(r => r.restoration.duration);
                break;
        }
        
        if (values.length === 0) return null;
        
        const passed = values.filter(v => v <= threshold).length;
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        
        return {
            threshold,
            avg: avg.toFixed(2),
            min: Math.min(...values).toFixed(2),
            max: Math.max(...values).toFixed(2),
            passed,
            total: values.length,
            passRate: (passed / values.length * 100).toFixed(1),
            status: passed === values.length ? 'passed' : 'failed'
        };
    }

    /**
     * Generate performance recommendations from report
     */
    generateRecommendationsFromReport(report) {
        const recommendations = [];
        
        // Check immediate cache performance
        const immediate = report.thresholds.immediate;
        if (immediate && immediate.status === 'failed') {
            recommendations.push({
                type: 'critical',
                category: 'immediate_cache',
                message: `Immediate cache application averaging ${immediate.avg}ms (target: <${immediate.threshold}ms)`,
                suggestion: 'Optimize localStorage read operations and reduce variable application complexity'
            });
        }
        
        // Check database performance
        const database = report.thresholds.database;
        if (database && database.status === 'failed') {
            recommendations.push({
                type: 'warning',
                category: 'database_load',
                message: `Database load averaging ${database.avg}ms (target: <${database.threshold}ms)`,
                suggestion: 'Optimize database queries, reduce payload size, or improve caching strategy'
            });
        }
        
        // Check total performance
        const total = report.thresholds.total;
        if (total && total.status === 'failed') {
            recommendations.push({
                type: 'warning',
                category: 'total_time',
                message: `Total restoration averaging ${total.avg}ms (target: <${total.threshold}ms)`,
                suggestion: 'Review overall restoration flow for optimization opportunities'
            });
        }
        
        // Check consistency
        if (report.performance.consistency < 80) {
            recommendations.push({
                type: 'info',
                category: 'consistency',
                message: `Performance consistency is ${report.performance.consistency.toFixed(1)}% (target: >80%)`,
                suggestion: 'Investigate sources of performance variability and implement stabilization measures'
            });
        }
        
        // Check regression
        if (this.regression && this.regression.status === 'failed') {
            recommendations.push({
                type: 'critical',
                category: 'regression',
                message: this.regression.message,
                suggestion: 'Investigate recent changes that may have impacted performance'
            });
        }
        
        return recommendations;
    }

    /**
     * Save report to file
     */
    saveReport(report) {
        try {
            fs.writeFileSync(this.options.outputFile, JSON.stringify(report, null, 2));
            console.log(`Report saved to: ${this.options.outputFile}`);
        } catch (error) {
            console.error(`Failed to save report: ${error.message}`);
        }
    }

    /**
     * Print summary to console
     */
    printSummary(report) {
        console.log('Performance Validation Summary');
        console.log('=============================');
        console.log(`Overall Status: ${report.summary.overallStatus === 'passed' ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Success Rate: ${report.summary.successRate}% (${report.summary.passedTests}/${report.summary.totalTests})`);
        console.log('');
        
        console.log('Performance Metrics:');
        console.log(`  Duration - Avg: ${report.performance.duration.avg.toFixed(2)}ms, P95: ${report.performance.duration.p95.toFixed(2)}ms`);
        console.log(`  Score - Avg: ${report.performance.score.avg.toFixed(1)}/100`);
        console.log(`  Consistency: ${report.performance.consistency.toFixed(1)}%`);
        console.log('');
        
        if (report.thresholds.immediate) {
            const status = report.thresholds.immediate.status === 'passed' ? '✅' : '❌';
            console.log(`Immediate Cache: ${status} ${report.thresholds.immediate.avg}ms (target: <${report.thresholds.immediate.threshold}ms)`);
        }
        
        if (report.thresholds.database) {
            const status = report.thresholds.database.status === 'passed' ? '✅' : '❌';
            console.log(`Database Load: ${status} ${report.thresholds.database.avg}ms (target: <${report.thresholds.database.threshold}ms)`);
        }
        
        if (report.thresholds.total) {
            const status = report.thresholds.total.status === 'passed' ? '✅' : '❌';
            console.log(`Total Time: ${status} ${report.thresholds.total.avg}ms (target: <${report.thresholds.total.threshold}ms)`);
        }
        
        console.log('');
        
        if (report.recommendations.length > 0) {
            console.log('Recommendations:');
            report.recommendations.forEach((rec, index) => {
                const icon = rec.type === 'critical' ? '🔴' : rec.type === 'warning' ? '🟡' : '🔵';
                console.log(`  ${icon} ${rec.message}`);
                console.log(`     ${rec.suggestion}`);
            });
            console.log('');
        }
        
        console.log(`Validation completed in ${report.metadata.duration}ms`);
    }

    /**
     * Calculate median value
     */
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? 
            (sorted[mid - 1] + sorted[mid]) / 2 : 
            sorted[mid];
    }

    /**
     * Calculate percentile value
     */
    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    /**
     * Calculate consistency percentage
     */
    calculateConsistency(values) {
        if (values.length < 2) return 100;
        
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / avg;
        
        // Convert to consistency percentage (lower CV = higher consistency)
        return Math.max(0, (1 - coefficientOfVariation) * 100);
    }
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--benchmark':
                options.benchmark = true;
                break;
            case '--regression':
                options.regression = true;
                break;
            case '--report':
                options.report = true;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--iterations':
                options.iterations = parseInt(args[++i]) || 10;
                break;
            case '--output':
                options.outputFile = args[++i] || 'css-variables-performance-report.json';
                break;
            case '--help':
                console.log(`
CSS Variables Performance Validation

Usage: node validate-css-variables-performance.js [options]

Options:
  --benchmark      Run benchmark tests for baseline establishment
  --regression     Run regression tests against baseline
  --report         Generate detailed JSON report
  --verbose        Enable verbose output
  --iterations N   Number of test iterations (default: 10)
  --output FILE    Output file for report (default: css-variables-performance-report.json)
  --help           Show this help message

Examples:
  node validate-css-variables-performance.js
  node validate-css-variables-performance.js --benchmark --iterations 20
  node validate-css-variables-performance.js --regression --report
                `);
                process.exit(0);
                break;
        }
    }
    
    return options;
}

// Main execution
if (require.main === module) {
    const options = parseArgs();
    const validator = new PerformanceValidator(options);
    validator.run().catch(error => {
        console.error('Validation failed:', error.message);
        process.exit(1);
    });
}

module.exports = PerformanceValidator;