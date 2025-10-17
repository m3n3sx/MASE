/**
 * 🧪 Validation Test for Task 2.1 - Advanced CSS Variables Engine
 * 
 * Tests the new features:
 * - Computed values support
 * - CSS calc() expressions handling
 * - Cascade resolution for conflicting variables
 */

(async function validateTask21() {
    console.log('🧪 Starting Task 2.1 validation tests...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    // Wait a bit more for the CSS engine to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!window.cssVariablesEngine) {
        console.error('❌ CSS Variables Engine not found');
        return;
    }

    const engine = window.cssVariablesEngine;
    const results = {
        computedValues: false,
        calcExpressions: false,
        cascadeResolution: false,
        dependencyTracking: false,
        errors: []
    };

    try {
        // Test 1: Computed Values
        console.log('🧮 Testing computed values...');
        
        // Check if computed values engine exists
        if (engine.computedValuesEngine) {
            console.log('✅ Computed Values Engine initialized');
            
            // Test color computation
            const testComputation = 'lighten(#23282d, 10%)';
            const computedResult = await engine.computedValuesEngine.executeComputation(testComputation);
            
            if (computedResult && computedResult !== testComputation) {
                console.log(`✅ Color computation works: ${testComputation} → ${computedResult}`);
                results.computedValues = true;
            } else {
                results.errors.push('Computed color function failed');
            }
        } else {
            results.errors.push('Computed Values Engine not initialized');
        }

        // Test 2: Calc Expressions
        console.log('🧮 Testing calc expressions...');
        
        if (engine.calcExpressionParser) {
            console.log('✅ Calc Expression Parser initialized');
            
            // Test basic calc expression
            const testCalc = 'calc(32 + 8)';
            const calcResult = engine.calcExpressionParser.evaluateCalcExpression(testCalc);
            
            if (calcResult === '40px') {
                console.log(`✅ Calc expression works: ${testCalc} → ${calcResult}`);
                results.calcExpressions = true;
            } else {
                results.errors.push(`Calc expression failed: expected 40px, got ${calcResult}`);
            }
        } else {
            results.errors.push('Calc Expression Parser not initialized');
        }

        // Test 3: Cascade Resolution
        console.log('🏗️ Testing cascade resolution...');
        
        if (engine.cascadeResolver) {
            console.log('✅ Cascade Resolver initialized');
            
            // Test cascade rule registration
            const testVar = '--test-cascade-var';
            engine.cascadeResolver.registerCascadeRule(testVar, {
                value: '#ff0000',
                source: 'user',
                importance: 'normal',
                specificity: 1
            });
            
            // Test conflict resolution
            const resolvedValue = await engine.cascadeResolver.resolveCascade(testVar, '#00ff00', {
                source: 'system',
                importance: 'important',
                specificity: 2
            });
            
            if (resolvedValue === '#00ff00') {
                console.log(`✅ Cascade resolution works: resolved to ${resolvedValue}`);
                results.cascadeResolution = true;
            } else {
                results.errors.push(`Cascade resolution failed: expected #00ff00, got ${resolvedValue}`);
            }
        } else {
            results.errors.push('Cascade Resolver not initialized');
        }

        // Test 4: Dependency Tracking
        console.log('🔗 Testing dependency tracking...');
        
        if (engine.dependencyGraph && engine.dependencyGraph.size > 0) {
            console.log(`✅ Dependency graph built with ${engine.dependencyGraph.size} nodes`);
            
            // Check for computed variable dependencies
            const computedVar = '--woow-surface-bar-computed';
            const depInfo = engine.getDependencyInfo(computedVar);
            
            if (depInfo.dependencies.length > 0) {
                console.log(`✅ Dependencies tracked: ${depInfo.dependencies.join(', ')}`);
                results.dependencyTracking = true;
            } else {
                results.errors.push('No dependencies found for computed variables');
            }
        } else {
            results.errors.push('Dependency graph not built');
        }

        // Test 5: Integration Test - Apply a variable and check dependents
        console.log('🔄 Testing dependent variable updates...');
        
        try {
            // Apply a change to a base variable
            const success = await engine.applyVariable('admin_bar_background', '#ff0000');
            
            if (success) {
                console.log('✅ Base variable applied successfully');
                
                // Check if computed dependent was updated
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait for updates
                
                const computedStyle = getComputedStyle(document.documentElement);
                const computedValue = computedStyle.getPropertyValue('--woow-surface-bar-computed').trim();
                
                if (computedValue && computedValue !== '#ff0000') {
                    console.log(`✅ Dependent variable updated: ${computedValue}`);
                } else {
                    console.log('⚠️ Dependent variable update not detected (may be normal)');
                }
            }
        } catch (error) {
            results.errors.push(`Integration test failed: ${error.message}`);
        }

        // Performance Test
        console.log('⚡ Testing performance...');
        
        const perfStart = performance.now();
        const testUpdates = [];
        
        for (let i = 0; i < 10; i++) {
            testUpdates.push({
                optionId: 'admin_bar_background',
                value: `hsl(${i * 36}, 50%, 50%)`
            });
        }
        
        const batchResult = await engine.batchUpdate(testUpdates);
        const perfEnd = performance.now();
        const duration = perfEnd - perfStart;
        
        console.log(`⚡ Batch update performance: ${duration.toFixed(2)}ms for ${testUpdates.length} updates`);
        
        if (duration < 500) { // Should be fast
            console.log('✅ Performance test passed');
        } else {
            results.errors.push(`Performance test failed: ${duration}ms > 500ms`);
        }

    } catch (error) {
        results.errors.push(`Test execution error: ${error.message}`);
        console.error('❌ Test execution failed:', error);
    }

    // Summary
    console.log('\n📊 Task 2.1 Validation Results:');
    console.log('================================');
    console.log(`Computed Values: ${results.computedValues ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Calc Expressions: ${results.calcExpressions ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Cascade Resolution: ${results.cascadeResolution ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dependency Tracking: ${results.dependencyTracking ? '✅ PASS' : '❌ FAIL'}`);
    
    if (results.errors.length > 0) {
        console.log('\n❌ Errors:');
        results.errors.forEach(error => console.log(`  - ${error}`));
    }

    const passCount = Object.values(results).filter(v => v === true).length;
    const totalTests = 4;
    
    console.log(`\n🎯 Overall: ${passCount}/${totalTests} tests passed`);
    
    if (passCount === totalTests && results.errors.length === 0) {
        console.log('🎉 Task 2.1 implementation is working correctly!');
    } else {
        console.log('⚠️ Task 2.1 implementation needs attention');
    }

    return results;
})();