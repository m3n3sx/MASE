/**
 * Simple Live Preview - Direct CSS Injection
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
        
        var changedSettings = {};
        var debounceTimer;
        
        function applyPreview() {
            if (Object.keys(changedSettings).length === 0) return;
            
            $.ajax({
                url: masV2Global.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'mas_v2_get_preview_css',
                    nonce: masV2Global.nonce,
                    ...changedSettings
                },
                success: function(response) {
                    if (response.success && response.data.css) {
                        var $style = $('#mas-v2-live-preview-css');
                        if ($style.length === 0) {
                            $style = $('<style id="mas-v2-live-preview-css"></style>');
                            $('head').append($style);
                        }
                        $style.html(response.data.css);
                        console.log('[MAS Live Preview] CSS applied');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('[MAS Live Preview] Error:', error);
                }
            });
        }
        
        function trackChange(setting, value, skipUpdate) {
            if (!setting || value === undefined) return;
            changedSettings[setting] = value;
            console.log('[MAS Live Preview] Changed:', setting, '=', value);
            
            if (!skipUpdate) {
                var $field = $('input[name="' + setting + '"], input[name="mas_v2_settings[' + setting + ']"]');
                if ($field.length && $field.val() !== value) {
                    $field.val(value);
                }
            }
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyPreview, 300);
        }
        
        $(document).on('change', '.mas-v2-color', function() {
            var name = $(this).attr('name');
            if (!name) return;
            var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            if (!setting) return;
            trackChange(setting, $(this).val());
        });
        
        $(document).on('input', '.mas-v2-input', function() {
            var name = $(this).attr('name');
            if (!name) return;
            var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            if (!setting) return;
            trackChange(setting, $(this).val());
        });
        
        $(document).on('input change', 'input[type="range"]', function() {
            var $slider = $(this);
            var name = $slider.attr('name');
            if (!name) return;
            var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            if (!setting) return;
            var value = $slider.val();
            
            var $field = $slider.parents('.mas-v2-field').first();
            var $label = $field.find('.mas-v2-slider-value');
            if ($label.length) {
                var currentText = $label.text();
                var unit = '';
                if (currentText.includes('px')) unit = 'px';
                else if (currentText.includes('%')) unit = '%';
                else if (currentText.includes('em')) unit = 'em';
                $label.text(value + unit);
            }
            
            trackChange(setting, value);
        });
        
        $(document).on('change', '.mas-v2-checkbox input[type="checkbox"]', function() {
            var name = $(this).attr('name');
            if (!name) return;
            var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            if (!setting) return;
            trackChange(setting, $(this).is(':checked') ? '1' : '0');
        });
        
        // Initialize WordPress Color Picker with live preview
        if ($.fn.wpColorPicker) {
            $('.mas-v2-color').wpColorPicker({
                change: function(event, ui) {
                    var $input = $(this);
                    var name = $input.attr('name');
                    if (!name) return;
                    var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
                    if (!setting) return;
                    var color = ui.color.toString();
                    trackChange(setting, color);
                },
                clear: function() {
                    var $input = $(this);
                    var name = $input.attr('name');
                    if (!name) return;
                    var setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
                    if (!setting) return;
                    trackChange(setting, '');
                }
            });
        }
        
        console.log('[MAS Live Preview] Initialized');
    });
    
})(jQuery);
