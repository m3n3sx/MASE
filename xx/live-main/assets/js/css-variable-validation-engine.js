/**
 * 🔍 CSS Variable Validation Engine - Comprehensive Validation System
 * 
 * Comprehensive validation system for CSS variable mappings:
 * - Coverage validation to ensure all option IDs are mapped
 * - CSS variable existence validation against actual CSS files
 * - Type validation for value transformation correctness
 * - Validation report generator with actionable recommendations
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Initial Implementation
 * @requirements 2.1, 2.2, 2.3, 2.4
 */

(function(window, document) {
    'use strict';

    /**
     * 🔍 CSS Variable Validation Engine - Main Class
     */
    class CSSVariableValidationEngine {
        constructor(options = {}) {
            // Configuration
            this.strictMode = options.strictMode || false;
            this.enablePerformanceMetrics = options.enablePerformanceMetrics || true;
            this.validationRules = options.validationRules || this.getDefaultValidationRules();
            this.debugMode = window.masV2Debug || false;
            
            // Validation state
            this.validationResults = new Map();
            this.validationErrors = [];
            this.validationWarnings = [];
            this.validationInfo = [];
            
            // Performance metrics
            this.metrics = {
                validationStartTime: null,
                validationEndTime: null,
                totalValidations: 0,
                passedValidations: 0,
                failedValidations: 0,
                warningValidations: 0,
                validationDuration: 0
            };
            
            // Dependencies
            this.cssVariableMap = null;
            this.inventoryScanner = null;
            this.cssVariableMapper = null;
            
            this.log('CSS Variable Validation Engine initialized');
        }

        /**
         * 🚀 Run comprehensive validation
         */
        async runComprehensiveValidation() {
            this.log('Starting comprehensive validation...');
            this.metrics.validationStartTime = performance.now();
            
            try {
                // Clear previous results
                this.clearValidationResults();
                
                // Initialize dependencies
                await this.initializeDependencies();
                
                // Run all validation checks
                await this.validateCoverage();
                await this.validateCSSVariableExistence();
                await this.validateTypeTransformations();
                await this.validateNamingConventions();
                await this.validateMappingConsistency();
                await this.validatePerformanceImpact();
                
                // Generate comprehensive report
                const report = this.generateValidationReport();
                
                this.metrics.validationEndTime = performance.now();
                this.metrics.validationDuration = this.metrics.validationEndTime - this.metrics.validationStartTime;
                
                this.log(`Validation completed in ${this.metrics.validationDuration.toFixed(2)}ms`);
                return report;
                
            } catch (error) {
                this.logError('Comprehensive validation failed:', error);
                throw error;
            }
        }

        /**
         * 🧹 Clear previous validation results
         */
        clearValidationResults() {
            this.validationResults.clear();
            this.validationErrors = [];
            this.validationWarnings = [];
            this.validationInfo = [];
            
            this.metrics.totalValidations = 0;
            this.metrics.passedValidations = 0;
            this.metrics.failedValidations = 0;
            this.metrics.warningValidations = 0;
        }

        /**
         * 🔧 Initialize dependencies
         */
        async initializeDependencies() {
            // Get CSS variable map
            this.cssVariableMap = window.CSS_VARIABLE_MAP || {};
            
            // Get inventory scanner
            if (window.cssVariableInventoryScanner) {
                this.inventoryScanner = window.cssVariableInventoryScanner;
            } else if (window.CSSVariableInventoryScanner) {
                this.inventoryScanner = new window.CSSVariableInventoryScanner();
            }
            
            // Get CSS variable mapper
            this.cssVariableMapper = window.cssVariableMapperInstance || 
                                   window.EnhancedCSSVariableMapper && new window.EnhancedCSSVariableMapper();
            
            if (!this.inventoryScanner) {
                throw new Error('CSSVariableInventoryScanner not available');
            }
        }

        /**
         * 📊 Validate coverage - ensure all option IDs are mapped (Requirement 2.1)
         */
        async validateCoverage() {
            this.log('Validating mapping coverage...');
            
            const validationName = 'coverage_validation';
            const startTime = performance.now();
            
            try {
                // Run inventory scan to get current state
                const inventory = await this.inventoryScanner.runCompleteInventory();
                
                const totalOptionIds = inventory.optionIds.length;
                const mappedOptionIds = inventory.optionIds.filter(option => 
                    option.mappings.cssVar || option.mappings.bodyClass || option.mappings.visibilitySelector
                ).length;
                
                const coveragePercentage = totalOptionIds > 0 ? 
                    Math.round((mappedOptionIds / totalOptionIds) * 100) : 100;
                
                // Validate coverage threshold
                const coverageThreshold = this.validationRules.coverageThreshold || 95;
                const passed = coveragePercentage >= coverageThreshold;
                
                this.recordValidationResult(validationName, {
                    passed: passed,
                    severity: passed ? 'info' : 'error',
                    message: `Mapping coverage: ${coveragePercentage}% (${mappedOptionIds}/${totalOptionIds})`,
                    details: {
                        totalOptionIds: totalOptionIds,
                        mappedOptionIds: mappedOptionIds,
                        coveragePercentage: coveragePercentage,
                        threshold: coverageThreshold,
                        unmappedOptions: inventory.optionIds
                            .filter(option => !option.mappings.cssVar && !option.mappings.bodyClass && !option.mappings.visibilitySelector)
                            .map(option => ({
                                id: option.id,
                                category: option.category,
                                suggestedMapping: this.suggestMapping(option.id)
                            }))
                    },
                    duration: performance.now() - startTime
                });
                
                // Report unmapped options as individual issues
                inventory.optionIds.forEach(option => {
                    if (!option.mappings.cssVar && !option.mappings.bodyClass && !option.mappings.visibilitySelector) {
                        this.addValidationIssue('warning', 'unmapped_option', 
                            `Option ID '${option.id}' has no mapping`, {
                                optionId: option.id,
                                category: option.category,
                                suggestion: this.suggestMapping(option.id),
                                sources: option.sources
                            });
                    }
                });
                
            } catch (error) {
                this.recordValidationResult(validationName, {
                    passed: false,
                    severity: 'error',
                    message: `Coverage validation failed: ${error.message}`,
                    error: error,
                    duration: performance.now() - startTime
                });
            }
        }

        /**
         * 🎨 Validate CSS variable existence against actual CSS files (Requirement 2.2)
         */
        async validateCSSVariableExistence() {
            this.log('Validating CSS variable existence...');
            
            const validationName = 'css_variable_existence';
            const startTime = performance.now();
            
            try {
                // Get all mapped CSS variables
                const mappedVariables = new Set();
                Object.values(this.cssVariableMap).forEach(mapping => {
                    if (mapping.cssVar) {
                        mappedVariables.add(mapping.cssVar);
                    }
                });
                
                // Get all CSS variables that actually exist
                const inventory = await this.inventoryScanner.runCompleteInventory();
                const existingVariables = new Set(inventory.cssVariables.map(v => v.name));
                
                // Find mapped variables that don't exist in CSS
                const missingVariables = [];
                mappedVariables.forEach(cssVar => {
                    if (!existingVariables.has(cssVar)) {
                        missingVariables.push(cssVar);
                    }
                });
                
                // Find existing variables that aren't mapped
                const unmappedVariables = [];
                existingVariables.forEach(cssVar => {
                    if (!mappedVariables.has(cssVar)) {
                        unmappedVariables.push(cssVar);
                    }
                });
                
                const passed = missingVariables.length === 0;
                
                this.recordValidationResult(validationName, {
                    passed: passed,
                    severity: passed ? 'info' : 'error',
                    message: `CSS variable existence check: ${missingVariables.length} missing, ${unmappedVariables.length} unmapped`,
                    details: {
                        totalMapped: mappedVariables.size,
                        totalExisting: existingVariables.size,
                        missingVariables: missingVariables,
                        unmappedVariables: unmappedVariables,
                        existencePercentage: mappedVariables.size > 0 ? 
                            Math.round(((mappedVariables.size - missingVariables.length) / mappedVariables.size) * 100) : 100
                    },
                    duration: performance.now() - startTime
                });
                
                // Report missing variables as individual issues
                missingVariables.forEach(cssVar => {
                    const optionId = this.findOptionIdForCSSVar(cssVar);
                    this.addValidationIssue('error', 'missing_css_variable',
                        `CSS variable '${cssVar}' is mapped but doesn't exist in CSS files`, {
                            cssVar: cssVar,
                            optionId: optionId,
                            suggestion: `Add ${cssVar} to CSS files or update mapping`
                        });
                });
                
                // Report unmapped variables as warnings
                unmappedVariables.forEach(cssVar => {
                    this.addValidationIssue('warning', 'unmapped_css_variable',
                        `CSS variable '${cssVar}' exists but has no option mapping`, {
                            cssVar: cssVar,
                            suggestion: this.suggestOptionIdForCSSVar(cssVar)
                        });
                });
                
            } catch (error) {
                this.recordValidationResult(validationName, {
                    passed: false,
                    severity: 'error',
                    message: `CSS variable existence validation failed: ${error.message}`,
                    error: error,
                    duration: performance.now() - startTime
                });
            }
        }

        /**
         * 🔄 Validate type transformations for correctness (Requirement 2.3)
         */
        async validateTypeTransformations() {
            this.log('Validating type transformations...');
            
            const validationName = 'type_transformations';
            const startTime = performance.now();
            
            try {
                const transformationErrors = [];
                const transformationWarnings = [];
                
                // Test each mapping with sample values
                Object.entries(this.cssVariableMap).forEach(([optionId, mapping]) => {
                    const testValues = this.generateTestValues(mapping.type);
                    
                    testValues.forEach(testValue => {
                        try {
                            const transformed = this.testTransformation(optionId, testValue.value, mapping);
                            
                            if (!this.validateTransformedValue(transformed, mapping.type, testValue.expected)) {
                                transformationErrors.push({
                                    optionId: optionId,
                                    inputValue: testValue.value,
                                    expectedType: mapping.type,
                                    transformedValue: transformed,
                                    expectedValue: testValue.expected,
                                    mapping: mapping
                                });
                            }
                        } catch (error) {
                            transformationErrors.push({
                                optionId: optionId,
                                inputValue: testValue.value,
                                error: error.message,
                                mapping: mapping
                            });
                        }
                    });
                    
                    // Validate fallback value
                    if (mapping.fallback) {
                        try {
                            const fallbackTransformed = this.testTransformation(optionId, mapping.fallback, mapping);
                            if (!this.validateTransformedValue(fallbackTransformed, mapping.type)) {
                                transformationWarnings.push({
                                    optionId: optionId,
                                    issue: 'invalid_fallback',
                                    fallbackValue: mapping.fallback,
                                    transformedValue: fallbackTransformed,
                                    expectedType: mapping.type
                                });
                            }
                        } catch (error) {
                            transformationWarnings.push({
                                optionId: optionId,
                                issue: 'fallback_transformation_error',
                                fallbackValue: mapping.fallback,
                                error: error.message
                            });
                        }
                    }
                });
                
                const passed = transformationErrors.length === 0;
                
                this.recordValidationResult(validationName, {
                    passed: passed,
                    severity: passed ? (transformationWarnings.length > 0 ? 'warning' : 'info') : 'error',
                    message: `Type transformation validation: ${transformationErrors.length} errors, ${transformationWarnings.length} warnings`,
                    details: {
                        totalMappings: Object.keys(this.cssVariableMap).length,
                        transformationErrors: transformationErrors,
                        transformationWarnings: transformationWarnings,
                        successRate: Object.keys(this.cssVariableMap).length > 0 ?
                            Math.round(((Object.keys(this.cssVariableMap).length - transformationErrors.length) / Object.keys(this.cssVariableMap).length) * 100) : 100
                    },
                    duration: performance.now() - startTime
                });
                
                // Report transformation errors
                transformationErrors.forEach(error => {
                    this.addValidationIssue('error', 'transformation_error',
                        `Type transformation failed for '${error.optionId}': ${error.error || 'Invalid transformation'}`, {
                            optionId: error.optionId,
                            inputValue: error.inputValue,
                            expectedType: error.mapping.type,
                            transformedValue: error.transformedValue,
                            suggestion: this.suggestTransformationFix(error)
                        });
                });
                
                // Report transformation warnings
                transformationWarnings.forEach(warning => {
                    this.addValidationIssue('warning', 'transformation_warning',
                        `Type transformation warning for '${warning.optionId}': ${warning.issue}`, warning);
                });
                
            } catch (error) {
                this.recordValidationResult(validationName, {
                    passed: false,
                    severity: 'error',
                    message: `Type transformation validation failed: ${error.message}`,
                    error: error,
                    duration: performance.now() - startTime
                });
            }
        }

        /**
         * 📝 Validate naming conventions (Requirement 2.4)
         */
        async validateNamingConventions() {
            this.log('Validating naming conventions...');
            
            const validationName = 'naming_conventions';
            const startTime = performance.now();
            
            try {
                const namingIssues = [];
                
                // Validate CSS variable naming
                Object.entries(this.cssVariableMap).forEach(([optionId, mapping]) => {
                    if (mapping.cssVar) {
                        // Check --woow- prefix
                        if (!mapping.cssVar.startsWith('--woow-')) {
                            namingIssues.push({
                                type: 'invalid_prefix',
                                optionId: optionId,
                                cssVar: mapping.cssVar,
                                expected: `--woow-${mapping.cssVar.replace(/^--/, '')}`,
                                severity: 'error'
                            });
                        }
                        
                        // Check kebab-case format
                        const variableName = mapping.cssVar.replace(/^--woow-/, '');
                        if (!/^[a-z0-9-]+$/.test(variableName)) {
                            namingIssues.push({
                                type: 'invalid_format',
                                optionId: optionId,
                                cssVar: mapping.cssVar,
                                issue: 'Should use kebab-case format',
                                severity: 'warning'
                            });
                        }
                        
                        // Check for consistency with option ID
                        const expectedVar = `--woow-${optionId.replace(/_/g, '-')}`;
                        if (mapping.cssVar !== expectedVar && !this.isValidAlternativeNaming(mapping.cssVar, optionId)) {
                            namingIssues.push({
                                type: 'inconsistent_naming',
                                optionId: optionId,
                                cssVar: mapping.cssVar,
                                expected: expectedVar,
                                severity: 'info'
                            });
                        }
                    }
                });
                
                // Validate option ID naming
                Object.keys(this.cssVariableMap).forEach(optionId => {
                    // Check snake_case format
                    if (!/^[a-z0-9_]+$/.test(optionId)) {
                        namingIssues.push({
                            type: 'invalid_option_format',
                            optionId: optionId,
                            issue: 'Should use snake_case format',
                            severity: 'warning'
                        });
                    }
                    
                    // Check for reserved words
                    if (this.isReservedWord(optionId)) {
                        namingIssues.push({
                            type: 'reserved_word',
                            optionId: optionId,
                            issue: 'Uses reserved word',
                            severity: 'warning'
                        });
                    }
                });
                
                const errorCount = namingIssues.filter(issue => issue.severity === 'error').length;
                const passed = errorCount === 0;
                
                this.recordValidationResult(validationName, {
                    passed: passed,
                    severity: passed ? (namingIssues.length > 0 ? 'warning' : 'info') : 'error',
                    message: `Naming convention validation: ${errorCount} errors, ${namingIssues.length - errorCount} warnings`,
                    details: {
                        totalMappings: Object.keys(this.cssVariableMap).length,
                        namingIssues: namingIssues,
                        complianceRate: Object.keys(this.cssVariableMap).length > 0 ?
                            Math.round(((Object.keys(this.cssVariableMap).length - errorCount) / Object.keys(this.cssVariableMap).length) * 100) : 100
                    },
                    duration: performance.now() - startTime
                });
                
                // Report naming issues
                namingIssues.forEach(issue => {
                    this.addValidationIssue(issue.severity, `naming_${issue.type}`,
                        `Naming convention issue for '${issue.optionId}': ${issue.issue || issue.type}`, issue);
                });
                
            } catch (error) {
                this.recordValidationResult(validationName, {
                    passed: false,
                    severity: 'error',
                    message: `Naming convention validation failed: ${error.message}`,
                    error: error,
                    duration: performance.now() - startTime
                });
            }
        }

        /**
         * 🔄 Validate mapping consistency
         */
        async validateMappingConsistency() {
            this.log('Validating mapping consistency...');
            
            const validationName = 'mapping_consistency';
            const startTime = performance.now();
            
            try {
                const consistencyIssues = [];
                
                // Check for duplicate CSS variables
                const cssVarMap = new Map();
                Object.entries(this.cssVariableMap).forEach(([optionId, mapping]) => {
                    if (mapping.cssVar) {
                        if (cssVarMap.has(mapping.cssVar)) {
                            consistencyIssues.push({
                                type: 'duplicate_css_var',
                                cssVar: mapping.cssVar,
                                optionIds: [cssVarMap.get(mapping.cssVar), optionId],
                                severity: 'error'
                            });
                        } else {
                            cssVarMap.set(mapping.cssVar, optionId);
                        }
                    }
                });
                
                // Check for circular references
                Object.entries(this.cssVariableMap).forEach(([optionId, mapping]) => {
                    if (mapping.aliases) {
                        mapping.aliases.forEach(alias => {
                            if (this.cssVariableMap[alias] && this.cssVariableMap[alias].aliases && 
                                this.cssVariableMap[alias].aliases.includes(optionId)) {
                                consistencyIssues.push({
                                    type: 'circular_reference',
                                    optionId: optionId,
                                    alias: alias,
                                    severity: 'error'
                                });
                            }
                        });
                    }
                });
                
                // Check type consistency
                Object.entries(this.cssVariableMap).forEach(([optionId, mapping]) => {
                    if (mapping.type && mapping.fallback) {
                        if (!this.isValueCompatibleWithType(mapping.fallback, mapping.type)) {
                            consistencyIssues.push({
                                type: 'type_fallback_mismatch',
                                optionId: optionId,
                                type: mapping.type,
                                fallback: mapping.fallback,
                                severity: 'warning'
                            });
                        }
                    }
                });
                
                const errorCount = consistencyIssues.filter(issue => issue.severity === 'error').length;
                const passed = errorCount === 0;
                
                this.recordValidationResult(validationName, {
                    passed: passed,
                    severity: passed ? (consistencyIssues.length > 0 ? 'warning' : 'info') : 'error',
                    message: `Mapping consistency validation: ${errorCount} errors, ${consistencyIssues.length - errorCount} warnings`,
                    details: {
                        totalMappings: Object.keys(this.cssVariableMap).length,
                        consistencyIssues: consistencyIssues
                    },
                    duration: performance.now() - startTime
                });
                
                // Report consistency issues
                consistencyIssues.forEach(issue => {
                    this.addValidationIssue(issue.severity, `consistency_${issue.type}`,
                        `Mapping consistency issue: ${issue.type}`, issue);
                });
                
            } catch (error) {
                this.recordValidationResult(validationName, {
                    passed: false,
                    severity: 'error',
                    message: `Mapping consistency validation failed: ${error.message}`,
                    error: error,
                    duration: performance.now() - startTime
                });
            }
        }

        /**
         * ⚡ Validate performance impact
         */
        async validatePerformanceImpact() {
            this.log('Validating performance impact...');
            
            const validationName = 'performance_impact';
            const startTime = performance.now();
            
            try {
                const performanceIssues = [];
                
                // Check mapping size
                const mappingCount = Object.keys(this.cssVariableMap).length;
                if (mappingCount > 1000) {
                    performanceIssues.push({
                        type: 'large_mapping_size',
                        count: mappingCount,
                        threshold: 1000,
                        severity: 'warning'
                    });
                }
                
                // Check for complex transformations
                Object.entries(this.cssVariableMap).forEach(([optionId, mapping]) => {
                    if (mapping.type === 'string' && mapping.fallback && mapping.fallback.length > 200) {
                        performanceIssues.push({
                            type: 'large_fallback_value',
                            optionId: optionId,
                            fallbackLength: mapping.fallback.length,
                            severity: 'info'
                        });
                    }
                });
                
                // Test lookup performance if mapper is available
                if (this.cssVariableMapper) {
                    const lookupTimes = [];
                    const testOptionIds = Object.keys(this.cssVariableMap).slice(0, 100);
                    
                    testOptionIds.forEach(optionId => {
                        const lookupStart = performance.now();
                        this.cssVariableMapper.getCSSVariable(optionId);
                        const lookupEnd = performance.now();
                        lookupTimes.push(lookupEnd - lookupStart);
                    });
                    
                    const averageLookupTime = lookupTimes.reduce((a, b) => a + b, 0) / lookupTimes.length;
                    if (averageLookupTime > 0.1) { // 0.1ms threshold
                        performanceIssues.push({
                            type: 'slow_lookup_performance',
                            averageTime: averageLookupTime,
                            threshold: 0.1,
                            severity: 'warning'
                        });
                    }
                }
                
                const passed = performanceIssues.filter(issue => issue.severity === 'error').length === 0;
                
                this.recordValidationResult(validationName, {
                    passed: passed,
                    severity: passed ? (performanceIssues.length > 0 ? 'warning' : 'info') : 'error',
                    message: `Performance impact validation: ${performanceIssues.length} issues found`,
                    details: {
                        mappingCount: mappingCount,
                        performanceIssues: performanceIssues
                    },
                    duration: performance.now() - startTime
                });
                
                // Report performance issues
                performanceIssues.forEach(issue => {
                    this.addValidationIssue(issue.severity, `performance_${issue.type}`,
                        `Performance issue: ${issue.type}`, issue);
                });
                
            } catch (error) {
                this.recordValidationResult(validationName, {
                    passed: false,
                    severity: 'error',
                    message: `Performance impact validation failed: ${error.message}`,
                    error: error,
                    duration: performance.now() - startTime
                });
            }
        }

        /**
         * 📊 Generate comprehensive validation report
         */
        generateValidationReport() {
            const totalValidations = this.validationResults.size;
            const passedValidations = Array.from(this.validationResults.values()).filter(r => r.passed).length;
            const failedValidations = totalValidations - passedValidations;
            
            const errorCount = this.validationErrors.length;
            const warningCount = this.validationWarnings.length;
            const infoCount = this.validationInfo.length;
            
            const overallStatus = errorCount > 0 ? 'failed' : (warningCount > 0 ? 'warnings' : 'passed');
            
            const report = {
                timestamp: new Date().toISOString(),
                status: overallStatus,
                summary: {
                    totalValidations: totalValidations,
                    passedValidations: passedValidations,
                    failedValidations: failedValidations,
                    successRate: totalValidations > 0 ? Math.round((passedValidations / totalValidations) * 100) : 100,
                    totalIssues: errorCount + warningCount + infoCount,
                    errors: errorCount,
                    warnings: warningCount,
                    info: infoCount
                },
                performance: {
                    validationDuration: this.metrics.validationDuration,
                    averageValidationTime: totalValidations > 0 ? this.metrics.validationDuration / totalValidations : 0
                },
                validationResults: this.formatValidationResults(),
                issues: {
                    errors: this.validationErrors,
                    warnings: this.validationWarnings,
                    info: this.validationInfo
                },
                recommendations: this.generateRecommendations(),
                actionableItems: this.generateActionableItems()
            };
            
            this.log('Generated validation report:', report.summary);
            return report;
        }

        /**
         * 💡 Generate actionable recommendations
         */
        generateRecommendations() {
            const recommendations = [];
            
            // High priority recommendations based on errors
            if (this.validationErrors.length > 0) {
                const errorTypes = [...new Set(this.validationErrors.map(e => e.type))];
                errorTypes.forEach(type => {
                    const count = this.validationErrors.filter(e => e.type === type).length;
                    recommendations.push({
                        priority: 'high',
                        type: type,
                        message: `Fix ${count} ${type.replace(/_/g, ' ')} error(s)`,
                        action: this.getRecommendedAction(type),
                        affectedItems: count
                    });
                });
            }
            
            // Medium priority recommendations based on warnings
            if (this.validationWarnings.length > 0) {
                const warningTypes = [...new Set(this.validationWarnings.map(w => w.type))];
                warningTypes.forEach(type => {
                    const count = this.validationWarnings.filter(w => w.type === type).length;
                    recommendations.push({
                        priority: 'medium',
                        type: type,
                        message: `Address ${count} ${type.replace(/_/g, ' ')} warning(s)`,
                        action: this.getRecommendedAction(type),
                        affectedItems: count
                    });
                });
            }
            
            // Coverage-specific recommendations
            const coverageResult = this.validationResults.get('coverage_validation');
            if (coverageResult && coverageResult.details.coveragePercentage < 95) {
                recommendations.push({
                    priority: 'high',
                    type: 'improve_coverage',
                    message: `Improve mapping coverage from ${coverageResult.details.coveragePercentage}% to 95%+`,
                    action: 'Add mappings for unmapped option IDs',
                    affectedItems: coverageResult.details.totalOptionIds - coverageResult.details.mappedOptionIds
                });
            }
            
            return recommendations.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
        }

        /**
         * 📋 Generate actionable items list
         */
        generateActionableItems() {
            const actionableItems = [];
            
            // Add specific actionable items from validation issues
            this.validationErrors.forEach(error => {
                actionableItems.push({
                    type: 'error',
                    priority: 'high',
                    title: error.message,
                    action: this.getSpecificAction(error),
                    details: error.details
                });
            });
            
            this.validationWarnings.forEach(warning => {
                actionableItems.push({
                    type: 'warning',
                    priority: 'medium',
                    title: warning.message,
                    action: this.getSpecificAction(warning),
                    details: warning.details
                });
            });
            
            return actionableItems;
        }

        // ========================================
        // 🔧 HELPER METHODS
        // ========================================

        /**
         * 📝 Record validation result
         */
        recordValidationResult(name, result) {
            this.validationResults.set(name, result);
            this.metrics.totalValidations++;
            
            if (result.passed) {
                this.metrics.passedValidations++;
            } else {
                this.metrics.failedValidations++;
            }
            
            if (result.severity === 'warning') {
                this.metrics.warningValidations++;
            }
        }

        /**
         * ➕ Add validation issue
         */
        addValidationIssue(severity, type, message, details = {}) {
            const issue = {
                type: type,
                message: message,
                details: details,
                timestamp: new Date().toISOString()
            };
            
            switch (severity) {
                case 'error':
                    this.validationErrors.push(issue);
                    break;
                case 'warning':
                    this.validationWarnings.push(issue);
                    break;
                case 'info':
                    this.validationInfo.push(issue);
                    break;
            }
        }

        /**
         * 🧪 Test transformation
         */
        testTransformation(optionId, value, mapping) {
            if (this.cssVariableMapper && typeof this.cssVariableMapper.transformValue === 'function') {
                return this.cssVariableMapper.transformValue(optionId, value);
            }
            
            // Fallback transformation logic
            switch (mapping.type) {
                case 'boolean':
                    return value ? '1' : '0';
                case 'numeric':
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) throw new Error(`Invalid numeric value: ${value}`);
                    return numValue + (mapping.unit || '');
                case 'color':
                    if (!this.isValidColor(value)) throw new Error(`Invalid color value: ${value}`);
                    return value;
                case 'string':
                default:
                    return String(value);
            }
        }

        /**
         * ✅ Validate transformed value
         */
        validateTransformedValue(transformed, expectedType, expectedValue = null) {
            if (expectedValue !== null) {
                return transformed === expectedValue;
            }
            
            switch (expectedType) {
                case 'boolean':
                    return transformed === '0' || transformed === '1';
                case 'numeric':
                    return /^-?\d*\.?\d+(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)?$/.test(transformed);
                case 'color':
                    return this.isValidColor(transformed);
                case 'string':
                default:
                    return typeof transformed === 'string';
            }
        }

        /**
         * 🎨 Validate color value
         */
        isValidColor(value) {
            if (typeof value !== 'string') return false;
            
            const trimmedValue = value.trim();
            
            // Hex colors
            if (trimmedValue.match(/^#[0-9A-Fa-f]{3,8}$/)) return true;
            
            // RGB/RGBA
            if (trimmedValue.match(/^rgba?\(/)) return true;
            
            // HSL/HSLA
            if (trimmedValue.match(/^hsla?\(/)) return true;
            
            // Named colors (basic check)
            if (trimmedValue.match(/^[a-z]+$/i)) return true;
            
            return false;
        }

        /**
         * 🧪 Generate test values for type
         */
        generateTestValues(type) {
            switch (type) {
                case 'boolean':
                    return [
                        { value: true, expected: '1' },
                        { value: false, expected: '0' },
                        { value: 1, expected: '1' },
                        { value: 0, expected: '0' }
                    ];
                case 'numeric':
                    return [
                        { value: 10, expected: null },
                        { value: '20', expected: null },
                        { value: 0, expected: null },
                        { value: -5, expected: null }
                    ];
                case 'color':
                    return [
                        { value: '#ff0000', expected: '#ff0000' },
                        { value: 'rgb(255, 0, 0)', expected: 'rgb(255, 0, 0)' },
                        { value: 'red', expected: 'red' }
                    ];
                case 'string':
                default:
                    return [
                        { value: 'test', expected: 'test' },
                        { value: 123, expected: '123' },
                        { value: '', expected: '' }
                    ];
            }
        }

        /**
         * 💡 Suggest mapping for option ID
         */
        suggestMapping(optionId) {
            return {
                cssVar: `--woow-${optionId.replace(/_/g, '-')}`,
                type: this.inferTypeFromOptionId(optionId),
                fallback: this.suggestFallbackValue(optionId),
                category: this.categorizeOptionId(optionId)
            };
        }

        /**
         * 🔍 Find option ID for CSS variable
         */
        findOptionIdForCSSVar(cssVar) {
            for (const [optionId, mapping] of Object.entries(this.cssVariableMap)) {
                if (mapping.cssVar === cssVar) {
                    return optionId;
                }
            }
            return null;
        }

        /**
         * 💡 Suggest option ID for CSS variable
         */
        suggestOptionIdForCSSVar(cssVar) {
            return cssVar.replace(/^--woow-/, '').replace(/-/g, '_');
        }

        /**
         * 🔍 Infer type from option ID
         */
        inferTypeFromOptionId(optionId) {
            const name = optionId.toLowerCase();
            if (name.includes('color') || name.includes('bg') || name.includes('background')) return 'color';
            if (name.includes('width') || name.includes('height') || name.includes('size') || name.includes('padding') || name.includes('margin')) return 'numeric';
            if (name.includes('enable') || name.includes('show') || name.includes('hide') || name.includes('floating')) return 'boolean';
            if (name.includes('font') || name.includes('family')) return 'string';
            return 'string';
        }

        /**
         * 💡 Suggest fallback value
         */
        suggestFallbackValue(optionId) {
            const type = this.inferTypeFromOptionId(optionId);
            const name = optionId.toLowerCase();
            
            switch (type) {
                case 'color':
                    if (name.includes('primary')) return '#6366f1';
                    if (name.includes('background') || name.includes('bg')) return '#ffffff';
                    if (name.includes('text')) return '#1e293b';
                    return '#000000';
                case 'numeric':
                    if (name.includes('width') || name.includes('height')) return '100px';
                    if (name.includes('padding') || name.includes('margin')) return '8px';
                    if (name.includes('size')) return '14px';
                    return '0px';
                case 'boolean':
                    return '0';
                case 'string':
                default:
                    if (name.includes('font')) return 'system-ui, sans-serif';
                    return '';
            }
        }

        /**
         * 🏷️ Categorize option ID
         */
        categorizeOptionId(optionId) {
            const name = optionId.toLowerCase();
            if (name.includes('admin_bar')) return 'admin-bar';
            if (name.includes('menu')) return 'menu';
            if (name.includes('color') || name.includes('bg')) return 'color';
            if (name.includes('font') || name.includes('text')) return 'typography';
            if (name.includes('space') || name.includes('padding') || name.includes('margin')) return 'spacing';
            return 'misc';
        }

        /**
         * ✅ Check if value is compatible with type
         */
        isValueCompatibleWithType(value, type) {
            try {
                this.testTransformation('test', value, { type: type });
                return true;
            } catch (error) {
                return false;
            }
        }

        /**
         * ✅ Check if alternative naming is valid
         */
        isValidAlternativeNaming(cssVar, optionId) {
            // Allow semantic naming that doesn't directly match option ID
            const semanticPatterns = [
                'surface', 'accent', 'text', 'bg', 'border', 'shadow',
                'space', 'radius', 'font', 'z-'
            ];
            
            return semanticPatterns.some(pattern => cssVar.includes(pattern));
        }

        /**
         * ⚠️ Check if word is reserved
         */
        isReservedWord(word) {
            const reservedWords = [
                'class', 'id', 'style', 'function', 'var', 'let', 'const',
                'return', 'if', 'else', 'for', 'while', 'do', 'switch'
            ];
            return reservedWords.includes(word.toLowerCase());
        }

        /**
         * 💡 Get recommended action for issue type
         */
        getRecommendedAction(type) {
            const actions = {
                'unmapped_option': 'Add CSS variable mapping to centralized configuration',
                'missing_css_variable': 'Add CSS variable to stylesheet or update mapping',
                'transformation_error': 'Fix type transformation logic or update mapping type',
                'invalid_prefix': 'Update CSS variable to use --woow- prefix',
                'duplicate_css_var': 'Resolve duplicate CSS variable mappings',
                'circular_reference': 'Remove circular references in aliases',
                'large_mapping_size': 'Consider splitting large mappings into categories',
                'slow_lookup_performance': 'Optimize lookup performance with caching'
            };
            
            return actions[type] || 'Review and fix the identified issue';
        }

        /**
         * 🎯 Get specific action for issue
         */
        getSpecificAction(issue) {
            if (issue.details && issue.details.suggestion) {
                return issue.details.suggestion;
            }
            
            return this.getRecommendedAction(issue.type);
        }

        /**
         * 📊 Format validation results
         */
        formatValidationResults() {
            const formatted = {};
            
            this.validationResults.forEach((result, name) => {
                formatted[name] = {
                    passed: result.passed,
                    severity: result.severity,
                    message: result.message,
                    duration: `${result.duration.toFixed(2)}ms`,
                    details: result.details
                };
            });
            
            return formatted;
        }

        /**
         * 🔧 Get default validation rules
         */
        getDefaultValidationRules() {
            return {
                coverageThreshold: 95, // Minimum coverage percentage
                maxLookupTime: 0.1, // Maximum lookup time in ms
                maxMappingSize: 1000, // Maximum number of mappings
                requireWoowPrefix: true, // Require --woow- prefix
                enforceKebabCase: true, // Enforce kebab-case for CSS variables
                enforceSnakeCase: true // Enforce snake_case for option IDs
            };
        }

        /**
         * 💡 Suggest transformation fix
         */
        suggestTransformationFix(error) {
            if (error.error && error.error.includes('Invalid numeric')) {
                return `Ensure input value is numeric. Consider adding validation or using fallback value.`;
            }
            
            if (error.error && error.error.includes('Invalid color')) {
                return `Ensure input value is a valid color format (hex, rgb, hsl, or named color).`;
            }
            
            return `Review transformation logic for type '${error.mapping.type}' and ensure proper validation.`;
        }

        /**
         * 📝 Logging utilities
         */
        log(message, ...args) {
            if (this.debugMode) {
                console.log(`🔍 ValidationEngine: ${message}`, ...args);
            }
        }

        logWarning(message, ...args) {
            console.warn(`⚠️ ValidationEngine: ${message}`, ...args);
        }

        logError(message, ...args) {
            console.error(`❌ ValidationEngine: ${message}`, ...args);
        }
    }

    // Make CSSVariableValidationEngine globally available
    window.CSSVariableValidationEngine = CSSVariableValidationEngine;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cssVariableValidationEngine = new CSSVariableValidationEngine({
                strictMode: false,
                enablePerformanceMetrics: true
            });
            console.log('🔍 CSS Variable Validation Engine initialized and ready');
        });
    } else {
        window.cssVariableValidationEngine = new CSSVariableValidationEngine({
            strictMode: false,
            enablePerformanceMetrics: true
        });
        console.log('🔍 CSS Variable Validation Engine initialized and ready');
    }

})(window, document);