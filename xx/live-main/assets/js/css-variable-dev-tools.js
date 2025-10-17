/**
 * CSS Variable Development Tools and Debugging Utilities
 * Provides comprehensive development workflow support for CSS variable mapping system
 */

class CSSVariableDevTools {
    constructor(mapper, inventoryScanner, validationEngine) {
        this.mapper = mapper;
        this.inventoryScanner = inventoryScanner;
        this.validationEngine = validationEngine;
        this.performanceMetrics = new Map();
        this.validationCache = new Map();
        this.realTimeValidation = false;
        
        this.initializeConsoleUtilities();
        this.setupPerformanceMonitoring();
    }

    /**
     * Generate comprehensive mapping coverage report for development workflow
     * Requirements: 2.1, 2.2
     */
    generateCoverageReport() {
        console.group('🔍 CSS Variable Mapping Coverage Report');
        
        try {
            const startTime = performance.now();
            const inventory = this.inventoryScanner ? this.inventoryScanner.scanAll() : { optionIds: [], cssVariables: [] };
            const validation = this.validationEngine ? this.validationEngine.validateMappings() : { 
                coverage: { mapped: 0, unmapped: 0, percentage: 0 },
                issues: [],
                recommendations: []
            };
        
            const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalOptions: inventory.optionIds.length,
                totalCSSVariables: inventory.cssVariables.length,
                mappedOptions: validation.coverage.mapped,
                unmappedOptions: validation.coverage.unmapped,
                coveragePercentage: validation.coverage.percentage,
                unusedMappings: this.findUnusedMappings(inventory)
            },
            details: {
                unmappedOptions: validation.issues.filter(issue => issue.type === 'unmapped_option'),
                invalidMappings: validation.issues.filter(issue => issue.type === 'invalid_mapping'),
                suggestions: validation.recommendations,
                performance: {
                    reportGenerationTime: performance.now() - startTime,
                    averageLookupTime: this.calculateAverageLookupTime(),
                    cacheHitRate: this.calculateCacheHitRate()
                }
            },
            categories: this.generateCategoryBreakdown(inventory),
            trends: this.generateTrendAnalysis()
        };

            this.displayCoverageReport(report);
            this.storeCoverageHistory(report);
            
            console.groupEnd();
            return report;
        } catch (error) {
            console.error('❌ Error generating coverage report:', error);
            console.groupEnd();
            return {
                timestamp: new Date().toISOString(),
                summary: { totalOptions: 0, coveragePercentage: 0 },
                details: { performance: { reportGenerationTime: 0, averageLookupTime: 0, cacheHitRate: 0 } },
                categories: {},
                trends: null,
                error: error.message
            };
        }
    }

    /**
     * Display formatted coverage report in console
     */
    displayCoverageReport(report) {
        const { summary, details } = report;
        
        // Summary section
        console.log(`📊 Coverage Summary:`);
        console.log(`   Total Options: ${summary.totalOptions}`);
        console.log(`   Mapped Options: ${summary.mappedOptions}`);
        console.log(`   Coverage: ${summary.coveragePercentage.toFixed(1)}%`);
        
        if (summary.coveragePercentage < 100) {
            console.warn(`⚠️  ${summary.unmappedOptions} unmapped options found`);
            details.unmappedOptions.forEach(issue => {
                console.log(`   • ${issue.optionId} → suggested: ${issue.suggestion}`);
            });
        } else {
            console.log('✅ All options are mapped!');
        }

        // Performance metrics
        console.log(`⚡ Performance Metrics:`);
        console.log(`   Report Generation: ${details.performance.reportGenerationTime.toFixed(2)}ms`);
        console.log(`   Average Lookup: ${details.performance.averageLookupTime.toFixed(3)}ms`);
        console.log(`   Cache Hit Rate: ${details.performance.cacheHitRate.toFixed(1)}%`);

        // Category breakdown
        console.log(`📂 Category Breakdown:`);
        Object.entries(report.categories).forEach(([category, stats]) => {
            console.log(`   ${category}: ${stats.mapped}/${stats.total} (${stats.percentage.toFixed(1)}%)`);
        });
    }

    /**
     * Enable real-time validation feedback during development
     * Requirements: 2.1, 2.2
     */
    enableRealTimeValidation() {
        this.realTimeValidation = true;
        
        // Monitor DOM mutations for new option IDs
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.validateNewElements(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-option-id']
        });

        // Monitor CSS variable usage
        this.monitorCSSVariableUsage();
        
        console.log('🔄 Real-time validation enabled');
        return observer;
    }

    /**
     * Validate newly added elements for mapping coverage
     */
    validateNewElements(element) {
        const optionElements = element.querySelectorAll('[data-option-id]');
        optionElements.forEach(el => {
            const optionId = el.getAttribute('data-option-id');
            if (optionId && !this.mapper.hasMapping(optionId)) {
                console.warn(`🚨 Unmapped option detected: ${optionId}`, el);
                console.log(`💡 Suggested mapping: ${this.mapper.generateFallbackCSSVar(optionId)}`);
            }
        });
    }

    /**
     * Monitor CSS variable usage in real-time
     */
    monitorCSSVariableUsage() {
        const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
        
        CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
            if (property.startsWith('--woow-')) {
                window.cssVariableDevTools?.logCSSVariableUsage(property, value);
            }
            return originalSetProperty.call(this, property, value, priority);
        };
    }

    /**
     * Log CSS variable usage for debugging
     */
    logCSSVariableUsage(property, value) {
        if (this.realTimeValidation) {
            const mapping = this.findMappingByCSSVar(property);
            if (!mapping) {
                console.warn(`🔍 CSS variable used without mapping: ${property} = ${value}`);
            }
        }
    }

    /**
     * Initialize browser console utilities for mapping inspection
     */
    initializeConsoleUtilities() {
        // Make dev tools globally accessible
        window.cssVariableDevTools = this;
        
        // Console utility functions
        window.inspectMapping = (optionId) => this.inspectMapping(optionId);
        window.findCSSVar = (optionId) => this.mapper.getCSSVariable(optionId);
        window.validateMappings = () => this.generateCoverageReport();
        window.showPerformanceMetrics = () => this.showPerformanceMetrics();
        window.debugCSSVariable = (cssVar) => this.debugCSSVariable(cssVar);
        
        console.log('🛠️  CSS Variable Dev Tools loaded. Available commands:');
        console.log('   • inspectMapping(optionId) - Inspect specific mapping');
        console.log('   • findCSSVar(optionId) - Get CSS variable for option');
        console.log('   • validateMappings() - Run full validation report');
        console.log('   • showPerformanceMetrics() - Display performance data');
        console.log('   • debugCSSVariable(cssVar) - Debug CSS variable usage');
    }

    /**
     * Inspect specific mapping details
     */
    inspectMapping(optionId) {
        console.group(`🔍 Inspecting mapping: ${optionId}`);
        
        const mapping = this.mapper.getMapping(optionId);
        if (!mapping) {
            console.error(`❌ No mapping found for: ${optionId}`);
            console.log(`💡 Suggested CSS variable: ${this.mapper.generateFallbackCSSVar(optionId)}`);
            console.groupEnd();
            return null;
        }

        console.log('📋 Mapping Details:');
        console.table(mapping);
        
        // Check if CSS variable exists in stylesheets
        const cssVarExists = this.checkCSSVariableExists(mapping.cssVar);
        console.log(`🎨 CSS Variable Status: ${cssVarExists ? '✅ Found' : '❌ Not found'}`);
        
        // Show current computed value
        const computedValue = getComputedStyle(document.documentElement).getPropertyValue(mapping.cssVar);
        console.log(`💻 Current Value: ${computedValue || 'Not set'}`);
        
        // Performance metrics for this mapping
        const lookupTime = this.measureLookupTime(optionId);
        console.log(`⚡ Lookup Time: ${lookupTime.toFixed(3)}ms`);
        
        console.groupEnd();
        return mapping;
    }

    /**
     * Debug CSS variable usage and dependencies
     */
    debugCSSVariable(cssVar) {
        console.group(`🐛 Debugging CSS Variable: ${cssVar}`);
        
        // Find mapping that uses this CSS variable
        const mapping = this.findMappingByCSSVar(cssVar);
        if (mapping) {
            console.log(`🔗 Mapped to option: ${mapping.optionId}`);
            console.table(mapping.details);
        } else {
            console.warn(`⚠️  No mapping found for CSS variable: ${cssVar}`);
        }

        // Check if variable is defined in CSS
        const exists = this.checkCSSVariableExists(cssVar);
        console.log(`📄 Defined in CSS: ${exists ? '✅ Yes' : '❌ No'}`);
        
        // Show current computed value
        const computedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
        console.log(`💻 Current Value: ${computedValue || 'Not set'}`);
        
        // Find elements using this variable
        const usage = this.findCSSVariableUsage(cssVar);
        if (usage.length > 0) {
            console.log(`🎯 Used by ${usage.length} elements:`);
            usage.forEach((element, index) => {
                console.log(`   ${index + 1}. ${element.tagName}${element.className ? '.' + element.className : ''}`);
            });
        }
        
        console.groupEnd();
    }

    /**
     * Setup performance monitoring and metrics collection
     * Requirements: 6.4
     */
    setupPerformanceMonitoring() {
        // Check if PerformanceObserver is available (not in Node.js test environment)
        if (typeof PerformanceObserver !== 'undefined') {
            this.performanceObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.name.includes('css-variable')) {
                        this.recordPerformanceMetric(entry);
                    }
                });
            });

            // Monitor user timing marks
            this.performanceObserver.observe({ entryTypes: ['measure', 'mark'] });
        } else {
            console.warn('PerformanceObserver not available - performance monitoring disabled');
        }
        
        // Track mapping lookup performance
        if (this.mapper && this.mapper.getCSSVariable) {
            this.originalGetCSSVariable = this.mapper.getCSSVariable.bind(this.mapper);
            this.mapper.getCSSVariable = this.instrumentedGetCSSVariable.bind(this);
        }
    }

    /**
     * Instrumented version of getCSSVariable for performance tracking
     */
    instrumentedGetCSSVariable(optionId) {
        const startTime = performance.now();
        const result = this.originalGetCSSVariable(optionId);
        const endTime = performance.now();
        
        this.recordLookupTime(optionId, endTime - startTime);
        return result;
    }

    /**
     * Record performance metrics
     */
    recordPerformanceMetric(entry) {
        try {
            if (!entry || typeof entry !== 'object') {
                console.warn('Invalid performance entry provided');
                return;
            }

            const metric = {
                name: entry.name || 'unknown',
                duration: entry.duration || 0,
                timestamp: entry.startTime || performance.now()
            };
            
            if (!this.performanceMetrics.has(metric.name)) {
                this.performanceMetrics.set(metric.name, []);
            }
            
            this.performanceMetrics.get(metric.name).push(metric);
            
            // Keep only last 100 measurements
            const metrics = this.performanceMetrics.get(metric.name);
            if (metrics.length > 100) {
                metrics.shift();
            }
        } catch (error) {
            console.error('Error recording performance metric:', error);
        }
    }

    /**
     * Record lookup time for specific option
     */
    recordLookupTime(optionId, duration) {
        const key = `lookup_${optionId}`;
        if (!this.performanceMetrics.has(key)) {
            this.performanceMetrics.set(key, []);
        }
        
        this.performanceMetrics.get(key).push({
            duration,
            timestamp: performance.now()
        });
    }

    /**
     * Show comprehensive performance metrics
     */
    showPerformanceMetrics() {
        console.group('⚡ CSS Variable Performance Metrics');
        
        const avgLookupTime = this.calculateAverageLookupTime();
        const cacheHitRate = this.calculateCacheHitRate();
        const totalLookups = this.getTotalLookups();
        
        console.log(`📊 Overall Performance:`);
        console.log(`   Average Lookup Time: ${avgLookupTime.toFixed(3)}ms`);
        console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`);
        console.log(`   Total Lookups: ${totalLookups}`);
        
        // Show slowest lookups
        const slowestLookups = this.findSlowestLookups(5);
        if (slowestLookups.length > 0) {
            console.log(`🐌 Slowest Lookups:`);
            slowestLookups.forEach((lookup, index) => {
                console.log(`   ${index + 1}. ${lookup.optionId}: ${lookup.duration.toFixed(3)}ms`);
            });
        }
        
        // Memory usage
        const memoryUsage = this.estimateMemoryUsage();
        console.log(`💾 Estimated Memory Usage: ${memoryUsage.toFixed(2)}KB`);
        
        console.groupEnd();
    }

    /**
     * Calculate average lookup time across all measurements
     */
    calculateAverageLookupTime() {
        let totalTime = 0;
        let totalCount = 0;
        
        this.performanceMetrics.forEach((metrics, key) => {
            if (key.startsWith('lookup_')) {
                metrics.forEach(metric => {
                    totalTime += metric.duration;
                    totalCount++;
                });
            }
        });
        
        return totalCount > 0 ? totalTime / totalCount : 0;
    }

    /**
     * Calculate cache hit rate
     */
    calculateCacheHitRate() {
        const cacheStats = this.mapper.getCacheStats();
        return cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100;
    }

    /**
     * Get total number of lookups performed
     */
    getTotalLookups() {
        let total = 0;
        this.performanceMetrics.forEach((metrics, key) => {
            if (key.startsWith('lookup_')) {
                total += metrics.length;
            }
        });
        return total;
    }

    /**
     * Find slowest lookups for optimization
     */
    findSlowestLookups(limit = 5) {
        const allLookups = [];
        
        this.performanceMetrics.forEach((metrics, key) => {
            if (key.startsWith('lookup_')) {
                const optionId = key.replace('lookup_', '');
                metrics.forEach(metric => {
                    allLookups.push({
                        optionId,
                        duration: metric.duration,
                        timestamp: metric.timestamp
                    });
                });
            }
        });
        
        return allLookups
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }

    /**
     * Estimate memory usage of dev tools
     */
    estimateMemoryUsage() {
        let size = 0;
        
        // Estimate size of performance metrics
        this.performanceMetrics.forEach(metrics => {
            size += metrics.length * 32; // Rough estimate per metric object
        });
        
        // Add validation cache size
        size += this.validationCache.size * 64;
        
        return size / 1024; // Convert to KB
    }

    // Helper methods
    
    findUnusedMappings(inventory) {
        try {
            const usedOptions = new Set(inventory.optionIds.map(opt => opt.id));
            const allMappings = this.mapper ? this.mapper.getAllMappings() : {};
            
            if (!allMappings || typeof allMappings !== 'object') {
                return [];
            }
            
            return Object.keys(allMappings).filter(optionId => !usedOptions.has(optionId));
        } catch (error) {
            console.warn('Error finding unused mappings:', error);
            return [];
        }
    }

    generateCategoryBreakdown(inventory) {
        const categories = {};
        const allMappings = this.mapper.getAllMappings();
        
        Object.values(allMappings).forEach(mapping => {
            const category = mapping.category || 'uncategorized';
            if (!categories[category]) {
                categories[category] = { total: 0, mapped: 0, percentage: 0 };
            }
            categories[category].total++;
            categories[category].mapped++;
        });
        
        // Calculate percentages
        Object.values(categories).forEach(cat => {
            cat.percentage = (cat.mapped / cat.total) * 100;
        });
        
        return categories;
    }

    generateTrendAnalysis() {
        // Analyze trends in coverage over time
        const history = this.getCoverageHistory();
        if (history.length < 2) return null;
        
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        
        return {
            coverageChange: latest.summary.coveragePercentage - previous.summary.coveragePercentage,
            newMappings: latest.summary.mappedOptions - previous.summary.mappedOptions,
            performanceChange: latest.details.performance.averageLookupTime - previous.details.performance.averageLookupTime
        };
    }

    checkCSSVariableExists(cssVar) {
        // Check if CSS variable is defined in any stylesheet
        for (let sheet of document.styleSheets) {
            try {
                for (let rule of sheet.cssRules || sheet.rules) {
                    if (rule.style && rule.style.getPropertyValue(cssVar)) {
                        return true;
                    }
                }
            } catch (e) {
                // Cross-origin stylesheet, skip
                continue;
            }
        }
        return false;
    }

    findMappingByCSSVar(cssVar) {
        const allMappings = this.mapper.getAllMappings();
        for (let [optionId, mapping] of Object.entries(allMappings)) {
            if (mapping.cssVar === cssVar) {
                return { optionId, details: mapping };
            }
        }
        return null;
    }

    findCSSVariableUsage(cssVar) {
        const elements = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            const computedStyle = getComputedStyle(node);
            for (let prop of computedStyle) {
                const value = computedStyle.getPropertyValue(prop);
                if (value.includes(cssVar)) {
                    elements.push(node);
                    break;
                }
            }
        }
        
        return elements;
    }

    measureLookupTime(optionId) {
        const iterations = 1000;
        const startTime = performance.now();
        
        for (let i = 0; i < iterations; i++) {
            this.mapper.getCSSVariable(optionId);
        }
        
        const endTime = performance.now();
        return (endTime - startTime) / iterations;
    }

    storeCoverageHistory(report) {
        const history = this.getCoverageHistory();
        history.push(report);
        
        // Keep only last 10 reports
        if (history.length > 10) {
            history.shift();
        }
        
        localStorage.setItem('cssVariableCoverageHistory', JSON.stringify(history));
    }

    getCoverageHistory() {
        const stored = localStorage.getItem('cssVariableCoverageHistory');
        return stored ? JSON.parse(stored) : [];
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariableDevTools;
}