// Simple test to isolate the recursion issue
const { JSDOM } = require('jsdom');

// Create a mock DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.getComputedStyle = dom.window.getComputedStyle;
global.performance = { now: () => Date.now() };

// Mock CSS.supports
global.CSS = {
    supports: function(property, value) {
        return true; // Always return true for testing
    }
};

const CSSVariablesBrowserCompatibility = require('./assets/js/css-variables-browser-compatibility.js');

console.log('Creating compatibility instance...');
const compatibility = new CSSVariablesBrowserCompatibility();

console.log('Browser info:', compatibility.browserInfo);
console.log('Support level:', compatibility.supportLevel);

console.log('Testing variable application...');
try {
    const result = compatibility.applyVariablesWithCompatibility({
        '--woow-test': '#ff0000'
    }, 'test');
    console.log('Result:', result);
} catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
}