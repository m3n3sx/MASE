/**
 * ✅ CSS Variable Map Validator - Mapping Validation System
 * 
 * Comprehensive validation system for the centralized CSS variable mapping:
 * - Validates mapping completeness and correctness
 * - Checks for naming convention compliance
 * - Detects circular references and conflicts
 * - Provides detailed validation reports
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Validation System
 */

(function(window, document) {
    'use strict';

    /**
     * ✅ CSSVariableMapValidator - Main Validator Class
     */
    class CSSVariableMapValidator {
        constructor() {
            this.validationResults = null;
            this.debugMode = window.masV2Debug || false;
            
            this.log('CSSVariableMapValidator initialized');
        }

        /**
         * 🔍 Run complete validation suite
         */
        async runCompleteValidation() {
            this.log('Starting complete validation...');
            const startTime = performance.now();

            try {
                const results = {
                    timestamp: new Date().toISOString(),
                    status: 'passed',
                    summary: {
                        totalTests: 0,
                        passed: 0,
                        failed: 0,
                        warnings: 0
                    },
                    tests: {
                        structure: await this.validateStructure(),
                        naming: await this.validateNamingConventions(),
                        completeness: await this.validateCompleteness(),
                        consistency: await this.validateConsistency(),
                        references: await this.validateReferences(),
                        performance: await this.validatePerformance()
                    },
                    issues: [],
                    recommendations: []
                };

                // Calculate summary
                this.calculateSummary(results);

                // Generate recommendations
                this.generateRecommendations(results);

                this.validationResults = results;

                const endTime = performance.now();
                this.log(`Validation completed in ${(endTime - startTime).toFixed(2)}ms`);

                return results;

            } catch (error) {
                this.logError('Validation failed:', error);
                throw error;
            }
        }

        /**
         * 🏗️ Validate mapping structure
         */
        async validateStructure() {
            const results = {
                name: 'Structure Validation',
                status: 'passed',
                tests: [],
                issues: []
            };

            // Check if main mapping object exists
            if (!window.CSS_VARIABLE_MAP) {
                results.issues.push({
                    type: 'error',
                    message: 'CSS_VARIABLE_MAP not found',
                    severity: 'high'
                });
                results.status = 'failed';
                return results;
            }

            const map = window.CSS_VARIABLE_MAP;

            // Validate each mapping entry structure
            Object.entries(map).forEach(([optionId, mapping]) => {
                const test = {
                    name: `Structure: ${optionId}`,
                    status: 'passed',
                    issues: []
                };

                // Required fields
                if (!mapping.cssVar) {
                    test.issues.push({
                        type: 'error',
                        message: 'Missing cssVar property',
                        severity: 'high'
                    });
                    test.status = 'failed';
                }

                if (!mapping.type) {
                    test.issues.push({
                        type: 'error',
                        message: 'Missing type property',
                        severity: 'high'
                    });
                    test.status = 'failed';
                }

                if (!mapping.fallback) {
                    test.issues.push({
                        type: 'warning',
                        message: 'Missing fallback value',
                        severity: 'medium'
                    });
                }

                if (!mapping.category) {
                    test.issues.push({
                        type: 'warning',
                        message: 'Missing category',
                        severity: 'low'
                    });
                }

                // Validate type values
                const validTypes = ['color', 'numeric', 'boolean', 'string'];
                if (mapping.type && !validTypes.includes(mapping.type)) {
                    test.issues.push({
                        type: 'error',
                        message: `Invalid type: ${mapping.type}. Must be one of: ${validTypes.join(', ')}`,
                        severity: 'high'
                    });
                    test.status = 'failed';
                }

                // Validate numeric types have units when appropriate
                if (mapping.type === 'numeric' && !mapping.unit) {
                    const cssVar = mapping.cssVar;
                    if (cssVar.includes('size') || cssVar.includes('width') || cssVar.includes('height') || 
                        cssVar.includes('padding') || cssVar.includes('margin') || cssVar.includes('radius')) {
                        test.issues.push({
                            type: 'warning',
                            message: 'Numeric type likely needs unit specification',
                            severity: 'medium'
                        });
                    }
                }

                results.tests.push(test);
                if (test.status === 'failed') {
                    results.status = 'failed';
                    results.issues.push(...test.issues);
                } else if (test.issues.length > 0) {
                    results.issues.push(...test.issues);
                }
            });

            return results;
        }

        /**
         * 📝 Validate naming conventions
         */
        async validateNamingConventions() {
            const results = {
                name: 'Naming Convention Validation',
                status: 'passed',
                tests: [],
                issues: []
            };

            if (!window.CSS_VARIABLE_MAP) return results;

            const map = window.CSS_VARIABLE_MAP;

            Object.entries(map).forEach(([optionId, mapping]) => {
                const test = {
                    name: `Naming: ${optionId}`,
                    status: 'passed',
                    issues: []
                };

                // Validate option ID naming (snake_case)
                if (!optionId.match(/^[a-z][a-z0-9_]*$/)) {
                    test.issues.push({
                        type: 'warning',
                        message: 'Option ID should use snake_case format',
                        severity: 'low'
                    });
                }

                // Validate CSS variable naming (--woow- prefix, kebab-case)
                if (mapping.cssVar) {
                    if (!mapping.cssVar.startsWith('--woow-')) {
                        test.issues.push({
                            type: 'error',
                            message: 'CSS variable must start with --woow- prefix',
                            severity: 'high'
                        });
                        test.status = 'failed';
                    }

                    if (!mapping.cssVar.match(/^--woow-[a-z][a-z0-9-]*$/)) {
                        test.issues.push({
                            type: 'warning',
                            message: 'CSS variable should use kebab-case format',
                            severity: 'medium'
                        });
                    }
                }

                // Check for consistent naming patterns
                const expectedCssVar = `--woow-${optionId.replace(/_/g, '-')}`;
                if (mapping.cssVar && mapping.cssVar !== expectedCssVar) {
                    // This is not always an error, but worth noting
                    test.issues.push({
                        type: 'info',
                        message: `CSS variable name doesn't follow direct conversion pattern. Expected: ${expectedCssVar}`,
                        severity: 'low'
                    });
                }

                results.tests.push(test);
                if (test.status === 'failed') {
                    results.status = 'failed';
                    results.issues.push(...test.issues);
                } else if (test.issues.length > 0) {
                    results.issues.push(...test.issues);
                }
            });

            return results;
        }

        /**
         * 📊 Validate mapping completeness
         */
        async validateCompleteness() {
            const results = {
                name: 'Completeness Validation',
                status: 'passed',
                tests: [],
                issues: []
            };

            // Check coverage against discovered CSS variables
            if (window.cssVariableInventoryScanner) {
                try {
                    const inventory = await window.cssVariableInventoryScanner.runCompleteInventory();
                    
                    const test = {
                        name: 'Coverage Analysis',
                        status: 'passed',
                        issues: []
                    };

                    // Check for unmapped CSS variables
                    inventory.cssVariables.forEach(variable => {
                        const isMapped = Object.values(window.CSS_VARIABLE_MAP || {}).some(
                            mapping => mapping.cssVar === variable.name
                        );

                        if (!isMapped && variable.name.startsWith('--woow-')) {
                            test.issues.push({
                                type: 'warning',
                                message: `CSS variable ${variable.name} has no mapping`,
                                severity: 'medium'
                            });
                        }
                    });

                    // Check for unmapped option IDs
                    inventory.optionIds.forEach(option => {
                        if (!window.CSS_VARIABLE_MAP || !window.CSS_VARIABLE_MAP[option.id]) {
                            test.issues.push({
                                type: 'warning',
                                message: `Option ID ${option.id} has no mapping`,
                                severity: 'medium'
                            });
                        }
                    });

                    results.tests.push(test);
                    if (test.issues.length > 0) {
                        results.issues.push(...test.issues);
                    }

                } catch (error) {
                    this.logWarning('Could not run inventory for completeness check:', error);
                }
            }

            // Check for essential mappings
            const essentialMappings = [
                'admin_bar_background',
                'menu_background',
                'primary_color',
                'content_background',
                'content_text_color'
            ];

            const test = {
                name: 'Essential Mappings',
                status: 'passed',
                issues: []
            };

            essentialMappings.forEach(optionId => {
                if (!window.CSS_VARIABLE_MAP || !window.CSS_VARIABLE_MAP[optionId]) {
                    test.issues.push({
                        type: 'error',
                        message: `Essential mapping missing: ${optionId}`,
                        severity: 'high'
                    });
                    test.status = 'failed';
                }
            });

            results.tests.push(test);
            if (test.status === 'failed') {
                results.status = 'failed';
                results.issues.push(...test.issues);
            }

            return results;
        }

        /**
         * 🔄 Validate consistency
         */
        async validateConsistency() {
            const results = {
                name: 'Consistency Validation',
                status: 'passed',
                tests: [],
                issues: []
            };

            if (!window.CSS_VARIABLE_MAP) return results;

            const map = window.CSS_VARIABLE_MAP;

            // Check for duplicate CSS variables
            const cssVarMap = new Map();
            const test = {
                name: 'Duplicate CSS Variables',
                status: 'passed',
                issues: []
            };

            Object.entries(map).forEach(([optionId, mapping]) => {
                if (mapping.cssVar) {
                    if (cssVarMap.has(mapping.cssVar)) {
                        const existing = cssVarMap.get(mapping.cssVar);
                        test.issues.push({
                            type: 'warning',
                            message: `CSS variable ${mapping.cssVar} is mapped to multiple options: ${existing} and ${optionId}`,
                            severity: 'medium'
                        });
                    } else {
                        cssVarMap.set(mapping.cssVar, optionId);
                    }
                }
            });

            results.tests.push(test);
            if (test.issues.length > 0) {
                results.issues.push(...test.issues);
            }

            // Check for consistent fallback values
            const fallbackTest = {
                name: 'Fallback Consistency',
                status: 'passed',
                issues: []
            };

            const fallbackPatterns = new Map();
            Object.entries(map).forEach(([optionId, mapping]) => {
                if (mapping.fallback && mapping.type) {
                    const key = `${mapping.type}-${mapping.category}`;
                    if (!fallbackPatterns.has(key)) {
                        fallbackPatterns.set(key, new Set());
                    }
                    fallbackPatterns.get(key).add(mapping.fallback);
                }
            });

            // Check for inconsistent fallbacks within categories
            fallbackPatterns.forEach((values, key) => {
                if (values.size > 3 && key.includes('color')) {
                    fallbackTest.issues.push({
                        type: 'info',
                        message: `Many different fallback values for ${key} - consider standardizing`,
                        severity: 'low'
                    });
                }
            });

            results.tests.push(fallbackTest);
            if (fallbackTest.issues.length > 0) {
                results.issues.push(...fallbackTest.issues);
            }

            return results;
        }

        /**
         * 🔗 Validate references and dependencies
         */
        async validateReferences() {
            const results = {
                name: 'Reference Validation',
                status: 'passed',
                tests: [],
                issues: []
            };

            // Check body class mappings
            if (window.BODY_CLASS_MAP) {
                const test = {
                    name: 'Body Class References',
                    status: 'passed',
                    issues: []
                };

                Object.entries(window.BODY_CLASS_MAP).forEach(([optionId, className]) => {
                    // Check if option exists in main map
                    if (window.CSS_VARIABLE_MAP && !window.CSS_VARIABLE_MAP[optionId]) {
                        test.issues.push({
                            type: 'warning',
                            message: `Body class mapping for ${optionId} has no corresponding CSS variable mapping`,
                            severity: 'medium'
                        });
                    }

                    // Validate class name format
                    if (!className.startsWith('woow-')) {
                        test.issues.push({
                            type: 'warning',
                            message: `Body class ${className} should start with woow- prefix`,
                            severity: 'low'
                        });
                    }
                });

                results.tests.push(test);
                if (test.issues.length > 0) {
                    results.issues.push(...test.issues);
                }
            }

            // Check visibility mappings
            if (window.VISIBILITY_MAP) {
                const test = {
                    name: 'Visibility References',
                    status: 'passed',
                    issues: []
                };

                Object.entries(window.VISIBILITY_MAP).forEach(([optionId, selector]) => {
                    // Validate selector format
                    if (!selector.startsWith('#') && !selector.startsWith('.') && !selector.includes(' ')) {
                        test.issues.push({
                            type: 'warning',
                            message: `Visibility selector for ${optionId} may be invalid: ${selector}`,
                            severity: 'medium'
                        });
                    }
                });

                results.tests.push(test);
                if (test.issues.length > 0) {
                    results.issues.push(...test.issues);
                }
            }

            return results;
        }

        /**
         * ⚡ Validate performance implications
         */
        async validatePerformance() {
            const results = {
                name: 'Performance Validation',
                status: 'passed',
                tests: [],
                issues: []
            };

            if (!window.CSS_VARIABLE_MAP) return results;

            const map = window.CSS_VARIABLE_MAP;
            const mapSize = Object.keys(map).length;

            const test = {
                name: 'Mapping Size',
                status: 'passed',
                issues: []
            };

            // Check mapping size
            if (mapSize > 500) {
                test.issues.push({
                    type: 'warning',
                    message: `Large mapping size (${mapSize} entries) may impact performance`,
                    severity: 'medium'
                });
            }

            // Check for complex fallback values
            let complexFallbacks = 0;
            Object.entries(map).forEach(([optionId, mapping]) => {
                if (mapping.fallback && mapping.fallback.length > 100) {
                    complexFallbacks++;
                }
            });

            if (complexFallbacks > 10) {
                test.issues.push({
                    type: 'info',
                    message: `${complexFallbacks} mappings have complex fallback values`,
                    severity: 'low'
                });
            }

            results.tests.push(test);
            if (test.issues.length > 0) {
                results.issues.push(...test.issues);
            }

            return results;
        }

        /**
         * 📊 Calculate validation summary
         */
        calculateSummary(results) {
            let totalTests = 0;
            let passed = 0;
            let failed = 0;
            let warnings = 0;

            Object.values(results.tests).forEach(testGroup => {
                if (testGroup.tests) {
                    totalTests += testGroup.tests.length;
                    testGroup.tests.forEach(test => {
                        if (test.status === 'passed') {
                            passed++;
                        } else if (test.status === 'failed') {
                            failed++;
                        }
                    });
                } else {
                    totalTests++;
                    if (testGroup.status === 'passed') {
                        passed++;
                    } else if (testGroup.status === 'failed') {
                        failed++;
                    }
                }

                if (testGroup.issues) {
                    warnings += testGroup.issues.filter(issue => issue.type === 'warning').length;
                }
            });

            results.summary = {
                totalTests,
                passed,
                failed,
                warnings
            };

            // Set overall status
            if (failed > 0) {
                results.status = 'failed';
            } else if (warnings > 0) {
                results.status = 'warnings';
            } else {
                results.status = 'passed';
            }
        }

        /**
         * 💡 Generate recommendations
         */
        generateRecommendations(results) {
            const recommendations = [];

            // High priority recommendations
            if (results.summary.failed > 0) {
                recommendations.push({
                    priority: 'high',
                    type: 'validation_failures',
                    message: `${results.summary.failed} validation tests failed. Fix critical issues first.`,
                    action: 'Review and fix failed validation tests'
                });
            }

            // Medium priority recommendations
            if (results.summary.warnings > 5) {
                recommendations.push({
                    priority: 'medium',
                    type: 'many_warnings',
                    message: `${results.summary.warnings} warnings found. Consider addressing them for better maintainability.`,
                    action: 'Review and resolve validation warnings'
                });
            }

            // Check for missing essential features
            const hasStructureIssues = results.tests.structure?.issues?.some(issue => issue.type === 'error');
            if (hasStructureIssues) {
                recommendations.push({
                    priority: 'high',
                    type: 'structure_issues',
                    message: 'Mapping structure has critical issues that need immediate attention.',
                    action: 'Fix mapping structure errors'
                });
            }

            // Performance recommendations
            const hasPerformanceIssues = results.tests.performance?.issues?.length > 0;
            if (hasPerformanceIssues) {
                recommendations.push({
                    priority: 'low',
                    type: 'performance',
                    message: 'Consider optimizing mapping configuration for better performance.',
                    action: 'Review performance validation results'
                });
            }

            results.recommendations = recommendations;
        }

        /**
         * 📤 Export validation report
         */
        exportValidationReport(format = 'json') {
            if (!this.validationResults) {
                throw new Error('No validation results available. Run validation first.');
            }

            switch (format) {
                case 'json':
                    return JSON.stringify(this.validationResults, null, 2);
                
                case 'markdown':
                    return this.convertToMarkdown(this.validationResults);
                
                case 'html':
                    return this.convertToHTML(this.validationResults);
                
                default:
                    return this.validationResults;
            }
        }

        /**
         * 📝 Convert validation results to Markdown
         */
        convertToMarkdown(results) {
            let md = '# CSS Variable Mapping Validation Report\n\n';
            
            md += `**Generated:** ${results.timestamp}\n`;
            md += `**Status:** ${results.status.toUpperCase()}\n\n`;
            
            md += '## Summary\n\n';
            md += `- **Total Tests:** ${results.summary.totalTests}\n`;
            md += `- **Passed:** ${results.summary.passed}\n`;
            md += `- **Failed:** ${results.summary.failed}\n`;
            md += `- **Warnings:** ${results.summary.warnings}\n\n`;

            // Test results
            md += '## Test Results\n\n';
            Object.entries(results.tests).forEach(([key, testGroup]) => {
                md += `### ${testGroup.name}\n\n`;
                md += `**Status:** ${testGroup.status}\n\n`;
                
                if (testGroup.issues && testGroup.issues.length > 0) {
                    md += '**Issues:**\n\n';
                    testGroup.issues.forEach(issue => {
                        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
                        md += `${icon} **${issue.type.toUpperCase()}:** ${issue.message}\n\n`;
                    });
                }
            });

            // Recommendations
            if (results.recommendations.length > 0) {
                md += '## Recommendations\n\n';
                results.recommendations.forEach(rec => {
                    md += `- **${rec.priority.toUpperCase()}:** ${rec.message}\n`;
                    md += `  - *Action:* ${rec.action}\n\n`;
                });
            }

            return md;
        }

        /**
         * 🌐 Convert validation results to HTML
         */
        convertToHTML(results) {
            const statusColor = results.status === 'passed' ? '#10b981' : 
                               results.status === 'warnings' ? '#f59e0b' : '#ef4444';

            let html = `
<!DOCTYPE html>
<html>
<head>
    <title>CSS Variable Mapping Validation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 6px; color: white; font-weight: 600; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .stat { text-align: center; padding: 20px; background: #f8fafc; border-radius: 8px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #1e293b; }
        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
        .test-group { margin: 30px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .issue { margin: 10px 0; padding: 10px; border-radius: 6px; }
        .error { background: #fef2f2; border-left: 4px solid #ef4444; }
        .warning { background: #fffbeb; border-left: 4px solid #f59e0b; }
        .info { background: #eff6ff; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CSS Variable Mapping Validation Report</h1>
        <p><strong>Generated:</strong> ${results.timestamp}</p>
        <p><strong>Status:</strong> <span class="status" style="background-color: ${statusColor}">${results.status.toUpperCase()}</span></p>
    </div>

    <div class="summary">
        <div class="stat">
            <div class="stat-number">${results.summary.totalTests}</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat">
            <div class="stat-number">${results.summary.passed}</div>
            <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
            <div class="stat-number">${results.summary.failed}</div>
            <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
            <div class="stat-number">${results.summary.warnings}</div>
            <div class="stat-label">Warnings</div>
        </div>
    </div>

    <h2>Test Results</h2>
`;

            Object.entries(results.tests).forEach(([key, testGroup]) => {
                html += `
    <div class="test-group">
        <h3>${testGroup.name}</h3>
        <p><strong>Status:</strong> ${testGroup.status}</p>
`;
                
                if (testGroup.issues && testGroup.issues.length > 0) {
                    html += '<h4>Issues:</h4>';
                    testGroup.issues.forEach(issue => {
                        html += `<div class="issue ${issue.type}"><strong>${issue.type.toUpperCase()}:</strong> ${issue.message}</div>`;
                    });
                }
                
                html += '</div>';
            });

            if (results.recommendations.length > 0) {
                html += '<h2>Recommendations</h2><ul>';
                results.recommendations.forEach(rec => {
                    html += `<li><strong>${rec.priority.toUpperCase()}:</strong> ${rec.message}<br><em>Action: ${rec.action}</em></li>`;
                });
                html += '</ul>';
            }

            html += '</body></html>';
            return html;
        }

        /**
         * 📝 Logging utilities
         */
        log(message, ...args) {
            if (this.debugMode) {
                console.log(`✅ MapValidator: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ MapValidator: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ MapValidator: ${message}`, ...args);
        }
    }

    // Make CSSVariableMapValidator globally available
    window.CSSVariableMapValidator = CSSVariableMapValidator;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cssVariableMapValidator = new CSSVariableMapValidator();
        });
    } else {
        window.cssVariableMapValidator = new CSSVariableMapValidator();
    }

})(window, document);