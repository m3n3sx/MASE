/**
 * Minimal Live Preview - CSS Variables Approach
 */
(function($) {
    'use strict';
    
    console.log('[MAS Live Preview] Loading...');
    
    $(document).ready(function() {
        if (typeof masV2Global === 'undefined') {
            console.error('[MAS Live Preview] masV2Global not found!');
            return;
        }
        
        console.log('[MAS Live Preview] Initializing...');
        
        var debounceTimer;
        function debounce(func, delay) {
            return function() {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(func, delay);
            };
        }
        
        // Apply CSS variable directly
        function applyCSSVariable(setting, value) {
            var root = document.documentElement;
            var cssVar = '--mas-' + setting.replace(/_/g, '-');
            root.style.setProperty(cssVar, value);
            console.log('[MAS Live Preview] Applied:', cssVar, '=', value);
        }
        
        // Track changes
        function trackChange(setting, value) {
            if (!setting || !value) return;
            
            // Apply directly as CSS variable
            if (setting.includes('color') || setting.includes('_bg')) {
                applyCSSVariable(setting, value);
            } else if (setting.includes('height') || setting.includes('width')) {
                applyCSSVariable(setting, value + 'px');
            } else {
                applyCSSVariable(setting, value);
            }
        }
        
        var debouncedTrack = debounce(function(setting, value) {
            trackChange(setting, value);
        }, 100);
        
        // Bind events with delegation
        $(document).on('change', '.mas-v2-color', function() {
            var name = $(this).attr('name');
            if (!name) return;
            var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            if (!setting) return;
            debouncedTrack(setting, $(this).val());
        });
        
        $(document).on('input', '.mas-v2-input', function() {
            var name = $(this).attr('name');
            if (!name) return;
            var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            if (!setting) return;
            debouncedTrack(setting, $(this).val());
        });
        
        $(document).on('change', '.mas-v2-checkbox input[type="checkbox"]', function() {
            var name = $(this).attr('name');
            if (!name) return;
            var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            if (!setting) return;
            debouncedTrack(setting, $(this).is(':checked') ? '1' : '0');
        });
        
        console.log('[MAS Live Preview] Initialized with CSS variables');
    });
    
})(jQuery);
