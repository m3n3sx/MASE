/**
 * CSS Variables Performance Monitor
 * 
 * Comprehensive performance monitoring and optimization system for CSS variables restoration.
 * Provides timing metrics, memory usage tracking, performance benchmarks, and regression testing.
 * 
 * Requirements: 1.3, 1.4, 6.1, 6.2, 6.3, 6.4
 * 
 * @version 1.0.0
 * @author WOOW Admin Styler
 */

class CSSVariablesPerformanceMonitor {
    constructor() {
        // Performance tracking state
        this.metrics = {
            restoration: {
                startTime: null,
                endTime: null,
                duration: 0,
                phases: new Map(),
                variableCount: 0,
                source: null
            },
            memory: {
                initial: null,
                peak: null,
                final: null,
                cleanup: []
            },
            timing: {
                domReady: null,
                firstPaint: null,
                firstContentfulPaint: null,
                largestContentfulPaint: null
            },
            benchmarks: {
                baseline: null,
                current: null,
                history: []
            }
        };

        // Performance thresholds (Requirements: 1.3, 1.4)
        this.thresholds = {
            restoration: {
                immediate: 50,      // Target < 50ms for immediate cache application
                database: 2000,     // Target < 2000ms for database load
                total: 2500         // Target < 2500ms for complete restoration
            },
            memory: {
                maxUsage: 100 * 1024,  // Target < 100KB for restoration system
                maxVariables: 1000      // Maximum variables to track
            },
            regression: {
                maxSlowdown: 1.2,   // Alert if 20% slower than baseline
                minSamples: 5       // Minimum samples for regression analysis
            }
        };

        // Monitoring state
        this.isMonitoring = false;
        this.observers = [];
        this.cleanupTasks = [];
        
        // Bind methods
        this.startMonitoring = this.startMonitoring.bind(this);
        this.stopMonitoring = this.stopMonitoring.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Initialize performance observers
        this.initializeObservers();
    }

    /**
     * Start performance monitoring for restoration process
     * Requirements: 1.3, 1.4
     */
    startMonitoring(restorerInstance = null) {
        if (this.isMonitoring) {
            console.warn('[Performance Monitor] Already monitoring');
            return;
        }

        this.isMonitoring = true;
        this.metrics.restoration.startTime = performance.now();
        
        // Record initial memory usage
        this.recordMemoryUsage('initial');
        
        // Start timing observers
        this.startTimingObservers();
        
        // Hook into restorer if provided
        if (restorerInstance) {
            this.hookIntoRestorer(restorerInstance);
        }
        
        console.log('[Performance Monitor] Started monitoring CSS variables restoration');
    }

    /**
     * Stop monitoring and generate performance report
     * Requirements: 1.3, 1.4
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return null;
        }

        this.isMonitoring = false;
        this.metrics.restoration.endTime = performance.now();
        this.metrics.restoration.duration = this.metrics.restoration.endTime - this.metrics.restoration.startTime;
        
        // Record final memory usage
        this.recordMemoryUsage('final');
        
        // Stop observers
        this.stopTimingObservers();
        
        // Generate performance report
        const report = this.generatePerformanceReport();
        
        // Check for performance regressions
        this.checkPerformanceRegression(report);
        
        // Store benchmark data
        this.storeBenchmarkData(report);
        
        console.log('[Performance Monitor] Stopped monitoring, duration:', 
                   this.metrics.restoration.duration.toFixed(2) + 'ms');
        
        return report;
    }

    /**
     * Record performance phase timing
     * Requirements: 1.3, 1.4
     */
    recordPhase(phaseName, startTime, endTime = null) {
        const actualEndTime = endTime || performance.now();
        const duration = actualEndTime - startTime;
        
        this.metrics.restoration.phases.set(phaseName, {
            startTime,
            endTime: actualEndTime,
            duration,
            timestamp: Date.now()
        });
        
        // Record peak memory during phase
        this.recordMemoryUsage('peak');
        
        console.log(`[Performance Monitor] Phase "${phaseName}": ${duration.toFixed(2)}ms`);
    }

    /**
     * Record memory usage at specific points
     * Requirements: 6.1, 6.2
     */
    recordMemoryUsage(point) {
        try {
            // Use performance.memory if available (Chrome/Edge)
            if (performance.memory) {
                const memInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: performance.now()
                };
                
                this.metrics.memory[point] = memInfo;
                
                // Track peak memory usage
                if (point === 'peak' || !this.metrics.memory.peak || 
                    memInfo.used > this.metrics.memory.peak.used) {
                    this.metrics.memory.peak = memInfo;
                }
            }
        } catch (error) {
            console.warn('[Performance Monitor] Memory tracking unavailable:', error.message);
        }
    }

    /**
     * Initialize performance observers for web vitals
     * Requirements: 6.1, 6.2, 6.3, 6.4
     */
    initializeObservers() {
        try {
            // First Paint observer
            if ('PerformanceObserver' in window) {
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-paint') {
                            this.metrics.timing.firstPaint = entry.startTime;
                        } else if (entry.name === 'first-contentful-paint') {
                            this.metrics.timing.firstContentfulPaint = entry.startTime;
                        }
                    }
                });
                
                paintObserver.observe({ entryTypes: ['paint'] });
                this.observers.push(paintObserver);
                
                // Largest Contentful Paint observer
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.timing.largestContentfulPaint = lastEntry.startTime;
                });
                
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(lcpObserver);
            }
        } catch (error) {
            console.warn('[Performance Monitor] Observer initialization failed:', error.message);
        }
    }

    /**
     * Start timing-specific observers
     */
    startTimingObservers() {
        // Record DOM ready time
        if (document.readyState === 'loading') {
            const domReadyHandler = () => {
                this.metrics.timing.domReady = performance.now();
                document.removeEventListener('DOMContentLoaded', domReadyHandler);
            };
            document.addEventListener('DOMContentLoaded', domReadyHandler);
            this.cleanupTasks.push(() => {
                document.removeEventListener('DOMContentLoaded', domReadyHandler);
            });
        } else {
            this.metrics.timing.domReady = 0; // Already ready
        }
    }

    /**
     * Stop timing observers
     */
    stopTimingObservers() {
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (error) {
                console.warn('[Performance Monitor] Observer disconnect failed:', error.message);
            }
        });
        this.observers = [];
    }

    /**
     * Hook into CSS Variables Restorer for detailed monitoring
     * Requirements: 1.3, 1.4
     */
    hookIntoRestorer(restorer) {
        // Store original methods
        const originalApplyVariables = restorer.applyVariablesToDOM;
        const originalLoadFromDatabase = restorer.loadFromDatabase;
        const originalGetAllVariablesFromStorage = restorer.getAllVariablesFromStorage;
        
        // Wrap applyVariablesToDOM for timing
        restorer.applyVariablesToDOM = (variables, source) => {
            const startTime = performance.now();
            const result = originalApplyVariables.call(restorer, variables, source);
            const endTime = performance.now();
            
            this.recordPhase(`apply-variables-${source}`, startTime, endTime);
            this.metrics.restoration.variableCount = Object.keys(variables).length;
            this.metrics.restoration.source = source;
            
            return result;
        };
        
        // Wrap database loading for timing
        restorer.loadFromDatabase = async () => {
            const startTime = performance.now();
            try {
                const result = await originalLoadFromDatabase.call(restorer);
                const endTime = performance.now();
                this.recordPhase('database-load', startTime, endTime);
                return result;
            } catch (error) {
                const endTime = performance.now();
                this.recordPhase('database-load-failed', startTime, endTime);
                throw error;
            }
        };
        
        // Wrap localStorage access for timing
        restorer.getAllVariablesFromStorage = () => {
            const startTime = performance.now();
            const result = originalGetAllVariablesFromStorage.call(restorer);
            const endTime = performance.now();
            this.recordPhase('localStorage-read', startTime, endTime);
            return result;
        };
        
        // Store cleanup task to restore original methods
        this.cleanupTasks.push(() => {
            restorer.applyVariablesToDOM = originalApplyVariables;
            restorer.loadFromDatabase = originalLoadFromDatabase;
            restorer.getAllVariablesFromStorage = originalGetAllVariablesFromStorage;
        });
    }

    /**
     * Generate comprehensive performance report
     * Requirements: 1.3, 1.4, 6.1, 6.2, 6.3, 6.4
     */
    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            restoration: {
                duration: this.metrics.restoration.duration,
                variableCount: this.metrics.restoration.variableCount,
                source: this.metrics.restoration.source,
                phases: Object.fromEntries(this.metrics.restoration.phases)
            },
            memory: {
                initial: this.metrics.memory.initial,
                peak: this.metrics.memory.peak,
                final: this.metrics.memory.final,
                usage: this.calculateMemoryUsage()
            },
            timing: { ...this.metrics.timing },
            thresholds: this.evaluateThresholds(),
            score: this.calculatePerformanceScore(),
            recommendations: this.generateRecommendations()
        };
        
        // Log summary
        console.group('🚀 CSS Variables Performance Report');
        console.log('Total Duration:', report.restoration.duration.toFixed(2) + 'ms');
        console.log('Variables Applied:', report.restoration.variableCount);
        console.log('Source:', report.restoration.source);
        console.log('Performance Score:', report.score + '/100');
        console.log('Memory Usage:', report.memory.usage);
        console.table(report.restoration.phases);
        if (report.recommendations.length > 0) {
            console.warn('Recommendations:', report.recommendations);
        }
        console.groupEnd();
        
        return report;
    }

    /**
     * Calculate memory usage statistics
     * Requirements: 6.1, 6.2
     */
    calculateMemoryUsage() {
        if (!this.metrics.memory.initial || !this.metrics.memory.final) {
            return { unavailable: true };
        }
        
        const initial = this.metrics.memory.initial.used;
        const final = this.metrics.memory.final.used;
        const peak = this.metrics.memory.peak ? this.metrics.memory.peak.used : final;
        
        return {
            initial: this.formatBytes(initial),
            final: this.formatBytes(final),
            peak: this.formatBytes(peak),
            delta: this.formatBytes(final - initial),
            peakDelta: this.formatBytes(peak - initial),
            withinThreshold: (peak - initial) <= this.thresholds.memory.maxUsage
        };
    }

    /**
     * Evaluate performance against thresholds
     * Requirements: 1.3, 1.4
     */
    evaluateThresholds() {
        const evaluation = {
            restoration: {
                immediate: null,
                database: null,
                total: null
            },
            memory: null,
            overall: 'unknown'
        };
        
        // Check restoration timing thresholds
        const immediatePhase = this.metrics.restoration.phases.get('apply-variables-localStorage-immediate') ||
                              this.metrics.restoration.phases.get('apply-variables-defaults-immediate');
        
        if (immediatePhase) {
            evaluation.restoration.immediate = {
                duration: immediatePhase.duration,
                threshold: this.thresholds.restoration.immediate,
                passed: immediatePhase.duration <= this.thresholds.restoration.immediate
            };
        }
        
        const databasePhase = this.metrics.restoration.phases.get('database-load');
        if (databasePhase) {
            evaluation.restoration.database = {
                duration: databasePhase.duration,
                threshold: this.thresholds.restoration.database,
                passed: databasePhase.duration <= this.thresholds.restoration.database
            };
        }
        
        evaluation.restoration.total = {
            duration: this.metrics.restoration.duration,
            threshold: this.thresholds.restoration.total,
            passed: this.metrics.restoration.duration <= this.thresholds.restoration.total
        };
        
        // Check memory threshold
        const memoryUsage = this.calculateMemoryUsage();
        if (!memoryUsage.unavailable) {
            evaluation.memory = {
                withinThreshold: memoryUsage.withinThreshold,
                threshold: this.formatBytes(this.thresholds.memory.maxUsage)
            };
        }
        
        // Overall evaluation
        const allPassed = [
            evaluation.restoration.immediate?.passed !== false,
            evaluation.restoration.database?.passed !== false,
            evaluation.restoration.total.passed,
            evaluation.memory?.withinThreshold !== false
        ].every(Boolean);
        
        evaluation.overall = allPassed ? 'passed' : 'failed';
        
        return evaluation;
    }

    /**
     * Calculate overall performance score (0-100)
     * Requirements: 1.3, 1.4, 6.1, 6.2
     */
    calculatePerformanceScore() {
        let score = 100;
        const thresholds = this.evaluateThresholds();
        
        // Deduct points for threshold failures
        if (thresholds.restoration.immediate && !thresholds.restoration.immediate.passed) {
            score -= 30; // Immediate cache is critical
        }
        
        if (thresholds.restoration.database && !thresholds.restoration.database.passed) {
            score -= 20; // Database load timing
        }
        
        if (!thresholds.restoration.total.passed) {
            score -= 25; // Total restoration time
        }
        
        if (thresholds.memory && !thresholds.memory.withinThreshold) {
            score -= 15; // Memory usage
        }
        
        // Bonus points for exceptional performance
        if (thresholds.restoration.total.duration < this.thresholds.restoration.total * 0.5) {
            score += 10; // Very fast restoration
        }
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate performance recommendations
     * Requirements: 1.3, 1.4, 6.1, 6.2, 6.3, 6.4
     */
    generateRecommendations() {
        const recommendations = [];
        const thresholds = this.evaluateThresholds();
        
        // Immediate cache recommendations
        if (thresholds.restoration.immediate && !thresholds.restoration.immediate.passed) {
            recommendations.push({
                type: 'critical',
                message: `Immediate cache application took ${thresholds.restoration.immediate.duration.toFixed(2)}ms (target: ${this.thresholds.restoration.immediate}ms)`,
                suggestion: 'Consider reducing localStorage read operations or simplifying variable application logic'
            });
        }
        
        // Database load recommendations
        if (thresholds.restoration.database && !thresholds.restoration.database.passed) {
            recommendations.push({
                type: 'warning',
                message: `Database load took ${thresholds.restoration.database.duration.toFixed(2)}ms (target: ${this.thresholds.restoration.database}ms)`,
                suggestion: 'Consider optimizing database queries, reducing payload size, or implementing better caching'
            });
        }
        
        // Total time recommendations
        if (!thresholds.restoration.total.passed) {
            recommendations.push({
                type: 'warning',
                message: `Total restoration took ${thresholds.restoration.total.duration.toFixed(2)}ms (target: ${this.thresholds.restoration.total}ms)`,
                suggestion: 'Review overall restoration flow for optimization opportunities'
            });
        }
        
        // Memory recommendations
        if (thresholds.memory && !thresholds.memory.withinThreshold) {
            recommendations.push({
                type: 'info',
                message: `Memory usage exceeded threshold`,
                suggestion: 'Consider implementing variable cleanup or reducing cached data size'
            });
        }
        
        // Variable count recommendations
        if (this.metrics.restoration.variableCount > this.thresholds.memory.maxVariables) {
            recommendations.push({
                type: 'info',
                message: `High variable count: ${this.metrics.restoration.variableCount}`,
                suggestion: 'Consider variable consolidation or lazy loading for non-critical variables'
            });
        }
        
        return recommendations;
    }

    /**
     * Check for performance regressions
     * Requirements: 1.3, 1.4
     */
    checkPerformanceRegression(currentReport) {
        const baseline = this.getBaselineBenchmark();
        if (!baseline) {
            console.log('[Performance Monitor] No baseline available for regression testing');
            return;
        }
        
        const currentDuration = currentReport.restoration.duration;
        const baselineDuration = baseline.restoration.duration;
        const slowdownRatio = currentDuration / baselineDuration;
        
        if (slowdownRatio > this.thresholds.regression.maxSlowdown) {
            const slowdownPercent = ((slowdownRatio - 1) * 100).toFixed(1);
            console.warn(`[Performance Monitor] Performance regression detected: ${slowdownPercent}% slower than baseline`);
            console.warn(`Current: ${currentDuration.toFixed(2)}ms, Baseline: ${baselineDuration.toFixed(2)}ms`);
            
            // Store regression data
            this.storeRegressionData({
                timestamp: Date.now(),
                currentDuration,
                baselineDuration,
                slowdownRatio,
                slowdownPercent: parseFloat(slowdownPercent)
            });
        }
    }

    /**
     * Store benchmark data for future comparisons
     * Requirements: 1.3, 1.4
     */
    storeBenchmarkData(report) {
        try {
            const benchmarkData = {
                timestamp: report.timestamp,
                restoration: report.restoration,
                score: report.score,
                thresholds: report.thresholds
            };
            
            // Store in localStorage for persistence
            const key = 'woow_css_performance_benchmarks';
            const stored = localStorage.getItem(key);
            const benchmarks = stored ? JSON.parse(stored) : [];
            
            benchmarks.push(benchmarkData);
            
            // Keep only last 50 benchmarks
            if (benchmarks.length > 50) {
                benchmarks.splice(0, benchmarks.length - 50);
            }
            
            localStorage.setItem(key, JSON.stringify(benchmarks));
            
            // Update current benchmark
            this.metrics.benchmarks.current = benchmarkData;
            this.metrics.benchmarks.history = benchmarks;
            
        } catch (error) {
            console.warn('[Performance Monitor] Failed to store benchmark data:', error.message);
        }
    }

    /**
     * Get baseline benchmark for regression testing
     */
    getBaselineBenchmark() {
        if (this.metrics.benchmarks.baseline) {
            return this.metrics.benchmarks.baseline;
        }
        
        try {
            const key = 'woow_css_performance_benchmarks';
            const stored = localStorage.getItem(key);
            if (!stored) return null;
            
            const benchmarks = JSON.parse(stored);
            if (benchmarks.length < this.thresholds.regression.minSamples) {
                return null;
            }
            
            // Use median of last 10 successful runs as baseline
            const recentBenchmarks = benchmarks
                .filter(b => b.thresholds.overall === 'passed')
                .slice(-10);
                
            if (recentBenchmarks.length === 0) return null;
            
            const durations = recentBenchmarks.map(b => b.restoration.duration);
            durations.sort((a, b) => a - b);
            const medianDuration = durations[Math.floor(durations.length / 2)];
            
            this.metrics.benchmarks.baseline = recentBenchmarks.find(
                b => b.restoration.duration === medianDuration
            );
            
            return this.metrics.benchmarks.baseline;
            
        } catch (error) {
            console.warn('[Performance Monitor] Failed to get baseline benchmark:', error.message);
            return null;
        }
    }

    /**
     * Store regression data for analysis
     */
    storeRegressionData(regressionInfo) {
        try {
            const key = 'woow_css_performance_regressions';
            const stored = localStorage.getItem(key);
            const regressions = stored ? JSON.parse(stored) : [];
            
            regressions.push(regressionInfo);
            
            // Keep only last 20 regressions
            if (regressions.length > 20) {
                regressions.splice(0, regressions.length - 20);
            }
            
            localStorage.setItem(key, JSON.stringify(regressions));
            
        } catch (error) {
            console.warn('[Performance Monitor] Failed to store regression data:', error.message);
        }
    }

    /**
     * Memory optimization and cleanup
     * Requirements: 6.1, 6.2
     */
    cleanup() {
        // Stop monitoring if active
        if (this.isMonitoring) {
            this.stopMonitoring();
        }
        
        // Run cleanup tasks
        this.cleanupTasks.forEach(task => {
            try {
                task();
            } catch (error) {
                console.warn('[Performance Monitor] Cleanup task failed:', error.message);
            }
        });
        this.cleanupTasks = [];
        
        // Clear observers
        this.stopTimingObservers();
        
        // Clear large data structures
        this.metrics.restoration.phases.clear();
        this.metrics.benchmarks.history = [];
        
        console.log('[Performance Monitor] Cleanup completed');
    }

    /**
     * Format bytes for human-readable display
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get current metrics (for external access)
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Get performance history
     */
    getPerformanceHistory() {
        try {
            const key = 'woow_css_performance_benchmarks';
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('[Performance Monitor] Failed to get performance history:', error.message);
            return [];
        }
    }

    /**
     * Get regression history
     */
    getRegressionHistory() {
        try {
            const key = 'woow_css_performance_regressions';
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('[Performance Monitor] Failed to get regression history:', error.message);
            return [];
        }
    }

    /**
     * Reset all performance data
     */
    resetPerformanceData() {
        try {
            localStorage.removeItem('woow_css_performance_benchmarks');
            localStorage.removeItem('woow_css_performance_regressions');
            this.metrics.benchmarks.baseline = null;
            this.metrics.benchmarks.current = null;
            this.metrics.benchmarks.history = [];
            console.log('[Performance Monitor] Performance data reset');
        } catch (error) {
            console.warn('[Performance Monitor] Failed to reset performance data:', error.message);
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.CSSVariablesPerformanceMonitor = CSSVariablesPerformanceMonitor;
    
    // Install console utilities for performance monitoring
    window.woowPerformanceDebug = {
        startMonitoring: () => {
            if (!window.cssPerformanceMonitor) {
                window.cssPerformanceMonitor = new CSSVariablesPerformanceMonitor();
            }
            window.cssPerformanceMonitor.startMonitoring(window.cssVariablesRestorer);
        },
        
        stopMonitoring: () => {
            if (window.cssPerformanceMonitor) {
                return window.cssPerformanceMonitor.stopMonitoring();
            }
        },
        
        getMetrics: () => {
            if (window.cssPerformanceMonitor) {
                return window.cssPerformanceMonitor.getMetrics();
            }
        },
        
        getHistory: () => {
            if (window.cssPerformanceMonitor) {
                return window.cssPerformanceMonitor.getPerformanceHistory();
            }
        },
        
        getRegressions: () => {
            if (window.cssPerformanceMonitor) {
                return window.cssPerformanceMonitor.getRegressionHistory();
            }
        },
        
        resetData: () => {
            if (window.cssPerformanceMonitor) {
                window.cssPerformanceMonitor.resetPerformanceData();
            }
        },
        
        runBenchmark: async () => {
            const monitor = new CSSVariablesPerformanceMonitor();
            monitor.startMonitoring();
            
            // Simulate restoration process
            if (window.cssVariablesRestorer) {
                await window.cssVariablesRestorer.initialize();
            }
            
            return monitor.stopMonitoring();
        }
    };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesPerformanceMonitor;
}