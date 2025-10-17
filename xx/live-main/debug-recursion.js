// Debug recursion issue
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.getComputedStyle = dom.window.getComputedStyle;
global.performance = { now: () => Date.now() };
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

global.CSS = {
    supports: function(property, value) {
        return true;
    }
};

const CSSVariablesBrowserCompatibility = require('./assets/js/css-variables-browser-compatibility.js');

console.log('Creating compatibility instance...');
const compatibility = new CSSVariablesBrowserCompatibility();

console.log('Testing with legacy browser...');
compatibility.supportLevel.customProperties = false; // Force fallback mode

try {
    const result = compatibility.applyVariablesWithCompatibility({
        '--woow-surface-content': '#f8f9fa',
        '--woow-text-primary': '#495057'
    }, 'legacy-test');
    console.log('Result:', result);
} catch (error) {
    console.error('Error:', error.message);
}