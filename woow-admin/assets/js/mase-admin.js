/**
 * Modern Admin Styler Enterprise - Admin JavaScript
 *
 * Handles color pickers, live preview, AJAX form submission, and user feedback.
 *
 * @package MASE
 * @since 1.0.0
 */

(function($) {
    'use strict';
    
    /**
     * MASE Admin Object
     */
    const MASE = {
        
        /**
         * Initialize the admin interface
         */
        init: function() {
            this.initColorPickers();
            this.bindEvents();
            this.bindPaletteEvents();
            this.bindImportExportEvents();
        },
        
        /**
         * Initialize WordPress color pickers
         */
        initColorPickers: function() {
            $('.mase-color-picker').wpColorPicker({
                change: this.debounce(this.updatePreview.bind(this), 200),
                clear: this.debounce(this.updatePreview.bind(this), 200)
            });
        },
        
        /**
         * Bind event handlers
         */
        bindEvents: function() {
            $('#mase-settings-form').on('submit', this.handleSubmit.bind(this));
            $('.mase-input').on('input change', this.debounce(this.updatePreview.bind(this), 200));
        },
        
        /**
         * Handle form submission
         */
        handleSubmit: function(e) {
            e.preventDefault();
            this.saveSettings();
        },
        
        /**
         * Save settings via AJAX
         */
        saveSettings: function() {
            const $form = $('#mase-settings-form');
            const $button = $form.find('input[type="submit"]');
            const originalText = $button.val();
            
            // Disable button and show loading state
            $button.prop('disabled', true).val('Saving...');
            
            // Prepare form data
            const formData = {};
            $form.serializeArray().forEach(function(item) {
                // Parse nested field names (e.g., admin_bar[bg_color])
                const match = item.name.match(/^(\w+)\[(\w+)\]$/);
                if (match) {
                    if (!formData[match[1]]) {
                        formData[match[1]] = {};
                    }
                    formData[match[1]][match[2]] = item.value;
                }
            });
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mase_save_settings',
                    nonce: $('#mase_nonce').val(),
                    settings: formData
                },
                success: this.handleSuccess.bind(this),
                error: this.handleError.bind(this),
                complete: function() {
                    $button.prop('disabled', false).val(originalText);
                }
            });
        },
        
        /**
         * Handle successful AJAX response
         */
        handleSuccess: function(response) {
            if (response.success) {
                this.showNotice('success', response.data.message);
            } else {
                this.showNotice('error', response.data.message || 'Failed to save settings');
            }
        },
        
        /**
         * Handle AJAX error
         */
        handleError: function(xhr) {
            let message = 'Network error. Please try again.';
            
            if (xhr.status === 403) {
                message = 'Permission denied. You do not have access to perform this action.';
            } else if (xhr.status === 500) {
                message = 'Server error. Please try again later.';
            }
            
            this.showNotice('error', message);
            console.error('MASE AJAX Error:', xhr);
        },
        
        /**
         * Update live preview
         */
        updatePreview: function() {
            const settings = this.getFormData();
            const css = this.generatePreviewCSS(settings);
            this.injectPreviewCSS(css);
        },
        
        /**
         * Get current form data
         */
        getFormData: function() {
            const settings = {
                admin_bar: {},
                admin_menu: {}
            };
            
            // Admin bar settings
            settings.admin_bar.bg_color = $('#admin-bar-bg-color').val();
            settings.admin_bar.text_color = $('#admin-bar-text-color').val();
            settings.admin_bar.height = $('#admin-bar-height').val();
            
            // Admin menu settings
            settings.admin_menu.bg_color = $('#admin-menu-bg-color').val();
            settings.admin_menu.text_color = $('#admin-menu-text-color').val();
            settings.admin_menu.hover_bg_color = $('#admin-menu-hover-bg-color').val();
            settings.admin_menu.hover_text_color = $('#admin-menu-hover-text-color').val();
            settings.admin_menu.width = $('#admin-menu-width').val();
            
            return settings;
        },
        
        /**
         * Generate preview CSS (mirrors PHP CSS generation)
         */
        generatePreviewCSS: function(settings) {
            let css = '';
            
            // Admin bar CSS
            if (settings.admin_bar.bg_color) {
                css += `body.wp-admin #wpadminbar { background-color: ${settings.admin_bar.bg_color} !important; }`;
            }
            if (settings.admin_bar.text_color) {
                css += `body.wp-admin #wpadminbar, body.wp-admin #wpadminbar a, body.wp-admin #wpadminbar .ab-item { color: ${settings.admin_bar.text_color} !important; }`;
            }
            if (settings.admin_bar.height) {
                css += `body.wp-admin #wpadminbar { height: ${settings.admin_bar.height}px !important; }`;
            }
            
            // Admin menu CSS
            if (settings.admin_menu.bg_color) {
                css += `body.wp-admin #adminmenu, body.wp-admin #adminmenu .wp-submenu { background-color: ${settings.admin_menu.bg_color} !important; }`;
            }
            if (settings.admin_menu.text_color) {
                css += `body.wp-admin #adminmenu a, body.wp-admin #adminmenu .wp-submenu a { color: ${settings.admin_menu.text_color} !important; }`;
            }
            if (settings.admin_menu.hover_bg_color) {
                css += `body.wp-admin #adminmenu a:hover, body.wp-admin #adminmenu .wp-submenu a:hover { background-color: ${settings.admin_menu.hover_bg_color} !important; }`;
            }
            if (settings.admin_menu.hover_text_color) {
                css += `body.wp-admin #adminmenu a:hover, body.wp-admin #adminmenu .wp-submenu a:hover { color: ${settings.admin_menu.hover_text_color} !important; }`;
            }
            if (settings.admin_menu.width) {
                css += `body.wp-admin #adminmenu { width: ${settings.admin_menu.width}px !important; }`;
            }
            
            return css;
        },
        
        /**
         * Inject preview CSS into page
         */
        injectPreviewCSS: function(css) {
            let $style = $('#mase-preview-style');
            
            if (!$style.length) {
                $style = $('<style id="mase-preview-style" type="text/css"></style>').appendTo('head');
            }
            
            $style.text(css);
        },
        
        /**
         * Show admin notice
         */
        showNotice: function(type, message) {
            const $notice = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
            
            // Remove existing notices
            $('#mase-notices .notice').remove();
            
            // Add new notice
            $('#mase-notices').html($notice);
            
            // Auto-fade after 3 seconds
            setTimeout(function() {
                $notice.fadeOut(400, function() {
                    $(this).remove();
                });
            }, 3000);
        },
        
        /**
         * Debounce utility function
         */
        debounce: function(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },
        
        /**
         * Bind palette preset events
         */
        bindPaletteEvents: function() {
            $('.palette-preset').on('click', this.handlePaletteClick.bind(this));
        },
        
        /**
         * Handle palette preset click
         */
        handlePaletteClick: function(e) {
            e.preventDefault();
            const paletteId = $(e.currentTarget).data('palette');
            this.applyPalette(paletteId);
        },
        
        /**
         * Apply color palette
         */
        applyPalette: function(paletteId) {
            const $button = $('.palette-preset[data-palette="' + paletteId + '"]');
            $button.prop('disabled', true).css('opacity', '0.6');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mase_apply_palette',
                    nonce: $('#mase_nonce').val(),
                    palette_id: paletteId
                },
                success: function(response) {
                    if (response.success) {
                        this.showNotice('success', response.data.message);
                        // Reload page to show new settings
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else {
                        this.showNotice('error', response.data.message || 'Failed to apply palette');
                        $button.prop('disabled', false).css('opacity', '1');
                    }
                }.bind(this),
                error: function() {
                    this.showNotice('error', 'Network error. Please try again.');
                    $button.prop('disabled', false).css('opacity', '1');
                }.bind(this)
            });
        },
        
        /**
         * Bind import/export events
         */
        bindImportExportEvents: function() {
            $('#mase-export-btn').on('click', this.handleExport.bind(this));
            $('#mase-import-btn').on('click', this.handleImportClick.bind(this));
            $('#mase-import-file').on('change', this.handleImportFile.bind(this));
        },
        
        /**
         * Handle export button click
         */
        handleExport: function() {
            const $button = $('#mase-export-btn');
            $button.prop('disabled', true).text('Exporting...');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mase_export_settings',
                    nonce: $('#mase_nonce').val()
                },
                success: function(response) {
                    if (response.success) {
                        // Create download link
                        const dataStr = JSON.stringify(response.data, null, 2);
                        const dataBlob = new Blob([dataStr], {type: 'application/json'});
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = 'mase-settings-' + Date.now() + '.json';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        
                        this.showNotice('success', 'Settings exported successfully');
                    } else {
                        this.showNotice('error', response.data.message || 'Export failed');
                    }
                }.bind(this),
                error: function() {
                    this.showNotice('error', 'Network error during export');
                }.bind(this),
                complete: function() {
                    $button.prop('disabled', false).text('Export Settings');
                }
            });
        },
        
        /**
         * Handle import button click
         */
        handleImportClick: function() {
            $('#mase-import-file').click();
        },
        
        /**
         * Handle import file selection
         */
        handleImportFile: function(e) {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            
            if (file.type !== 'application/json') {
                this.showNotice('error', 'Please select a valid JSON file');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const data = JSON.parse(event.target.result);
                    this.importSettings(data);
                } catch (error) {
                    this.showNotice('error', 'Invalid JSON file format');
                }
            }.bind(this);
            
            reader.readAsText(file);
            
            // Reset file input
            e.target.value = '';
        },
        
        /**
         * Import settings data
         */
        importSettings: function(data) {
            if (!confirm('This will overwrite your current settings. Are you sure?')) {
                return;
            }
            
            const $button = $('#mase-import-btn');
            $button.prop('disabled', true).text('Importing...');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mase_import_settings',
                    nonce: $('#mase_nonce').val(),
                    settings_data: JSON.stringify(data)
                },
                success: function(response) {
                    if (response.success) {
                        this.showNotice('success', response.data.message);
                        // Reload page to show new settings
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    } else {
                        this.showNotice('error', response.data.message || 'Import failed');
                        $button.prop('disabled', false).text('Import Settings');
                    }
                }.bind(this),
                error: function() {
                    this.showNotice('error', 'Network error during import');
                    $button.prop('disabled', false).text('Import Settings');
                }.bind(this)
            });
        }
    };
    
    // Initialize on document ready
    $(document).ready(function() {
        MASE.init();
    });
    
})(jQuery);
