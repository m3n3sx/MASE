/**
 * Modern Admin Styler Enterprise - Admin JavaScript
 *
 * Handles color pickers, live preview, AJAX form submission, and user feedback.
 *
 * @package MASE
 * @since 1.2.0
 */

(function($) {
    'use strict';
    
    /**
     * MASE Admin Object
     */
    var MASE = {
        
        /**
         * Configuration
         */
        config: {
            ajaxUrl: typeof ajaxurl !== 'undefined' ? ajaxurl : '',
            nonce: '',
            debounceDelay: 300,
            autoSaveDelay: 2000,
            noticeTimeout: 3000
        },
        
        /**
         * State management
         */
        state: {
            livePreviewEnabled: false,
            currentPalette: null,
            currentTemplate: null,
            isDirty: false,
            isSaving: false
        },
        
        /**
         * Palette Manager Module
         * Handles palette application, saving, and deletion
         * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
         */
        paletteManager: {
            /**
             * Apply a color palette
             * Requirement 1.3: Apply palette via AJAX
             * 
             * @param {string} paletteId - The palette ID to apply
             */
            apply: function(paletteId) {
                var self = MASE;
                
                // Show loading state
                self.showNotice('info', 'Applying palette...', false);
                
                // Disable all palette buttons during operation
                $('.mase-palette-apply-btn').prop('disabled', true).css('opacity', '0.6');
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_apply_palette',
                        nonce: self.config.nonce,
                        palette_id: paletteId
                    },
                    success: function(response) {
                        if (response.success) {
                            // Update state
                            self.state.currentPalette = paletteId;
                            self.state.isDirty = false;
                            
                            // Update UI to show active palette badge (Requirement 1.4)
                            self.paletteManager.updateActiveBadge(paletteId);
                            
                            // Show success message
                            self.showNotice('success', response.data.message || 'Palette applied successfully!');
                            
                            // Reload page to show new settings
                            setTimeout(function() {
                                location.reload();
                            }, 1000);
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to apply palette');
                            $('.mase-palette-apply-btn').prop('disabled', false).css('opacity', '1');
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to perform this action.';
                        } else if (xhr.status === 500) {
                            message = 'Server error. Please try again later.';
                        }
                        self.showNotice('error', message);
                        $('.mase-palette-apply-btn').prop('disabled', false).css('opacity', '1');
                    }
                });
            },
            
            /**
             * Save a custom color palette
             * Requirement 1.3: Save custom palette with name and colors
             * 
             * @param {string} name - The palette name
             * @param {Object} colors - Object containing color values
             */
            save: function(name, colors) {
                var self = MASE;
                
                // Validate inputs
                if (!name || name.trim() === '') {
                    self.showNotice('error', 'Please enter a palette name');
                    return;
                }
                
                if (!colors || Object.keys(colors).length === 0) {
                    self.showNotice('error', 'Please select colors for the palette');
                    return;
                }
                
                // Show loading state
                self.showNotice('info', 'Saving custom palette...', false);
                
                // Disable save button
                $('#mase-save-custom-palette-btn').prop('disabled', true);
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_save_custom_palette',
                        nonce: self.config.nonce,
                        name: name,
                        colors: colors
                    },
                    success: function(response) {
                        if (response.success) {
                            self.showNotice('success', response.data.message || 'Custom palette saved successfully!');
                            
                            // Reload page to show new palette
                            setTimeout(function() {
                                location.reload();
                            }, 1000);
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to save custom palette');
                            $('#mase-save-custom-palette-btn').prop('disabled', false);
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to perform this action.';
                        }
                        self.showNotice('error', message);
                        $('#mase-save-custom-palette-btn').prop('disabled', false);
                    }
                });
            },
            
            /**
             * Delete a custom color palette
             * Requirement 1.3: Delete custom palette with confirmation
             * 
             * @param {string} paletteId - The palette ID to delete
             */
            delete: function(paletteId) {
                var self = MASE;
                
                // Confirm deletion
                if (!confirm('Are you sure you want to delete this custom palette? This action cannot be undone.')) {
                    return;
                }
                
                // Show loading state
                self.showNotice('info', 'Deleting custom palette...', false);
                
                // Disable delete button
                $('.mase-palette-delete-btn[data-palette-id="' + paletteId + '"]').prop('disabled', true);
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_delete_custom_palette',
                        nonce: self.config.nonce,
                        palette_id: paletteId
                    },
                    success: function(response) {
                        if (response.success) {
                            self.showNotice('success', response.data.message || 'Custom palette deleted successfully!');
                            
                            // Remove palette card from UI
                            $('.mase-palette-card[data-palette-id="' + paletteId + '"]').fadeOut(300, function() {
                                $(this).remove();
                            });
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to delete custom palette');
                            $('.mase-palette-delete-btn[data-palette-id="' + paletteId + '"]').prop('disabled', false);
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to perform this action.';
                        }
                        self.showNotice('error', message);
                        $('.mase-palette-delete-btn[data-palette-id="' + paletteId + '"]').prop('disabled', false);
                    }
                });
            },
            
            /**
             * Update active palette badge in UI
             * Requirement 1.4: Show active palette badge
             * 
             * @param {string} paletteId - The palette ID that is now active
             */
            updateActiveBadge: function(paletteId) {
                // Remove all active badges and classes
                $('.mase-palette-card').removeClass('active');
                $('.mase-active-badge').remove();
                
                // Add active class and badge to the selected palette
                var $paletteCard = $('.mase-palette-card[data-palette-id="' + paletteId + '"]');
                $paletteCard.addClass('active');
                
                // Add active badge if it doesn't exist
                if ($paletteCard.find('.mase-active-badge').length === 0) {
                    $paletteCard.find('.mase-palette-info').append(
                        '<span class="mase-active-badge">Active</span>'
                    );
                }
            },
            
            /**
             * Collect current color values from form
             * Used when saving custom palettes
             * 
             * @return {Object} Object containing color values
             */
            collectColors: function() {
                return {
                    primary: $('#palette-primary-color').val() || '',
                    secondary: $('#palette-secondary-color').val() || '',
                    accent: $('#palette-accent-color').val() || '',
                    background: $('#palette-background-color').val() || '',
                    text: $('#palette-text-color').val() || '',
                    text_secondary: $('#palette-text-secondary-color').val() || ''
                };
            }
        },
        
        /**
         * Template Manager Module
         * Handles template application, saving, and deletion
         * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
         */
        templateManager: {
            /**
             * Apply a template
             * Requirement 2.4: Apply template via AJAX
             * Requirement 16.2: Create automatic backup before template application (if enabled)
             * 
             * @param {string} templateId - The template ID to apply
             */
            apply: function(templateId) {
                var self = MASE;
                
                // Create automatic backup before applying template (Requirement 16.2)
                self.backupManager.createAutoBackupBeforeTemplate(function() {
                    // Show loading state
                    self.showNotice('info', 'Applying template...', false);
                    
                    // Disable all template buttons during operation
                    $('.mase-template-apply-btn').prop('disabled', true).css('opacity', '0.6');
                    
                    $.ajax({
                        url: self.config.ajaxUrl,
                        type: 'POST',
                        data: {
                            action: 'mase_apply_template',
                            nonce: self.config.nonce,
                            template_id: templateId
                        },
                        success: function(response) {
                            if (response.success) {
                                // Update state
                                self.state.currentTemplate = templateId;
                                self.state.isDirty = false;
                                
                                // Update UI to show active template badge (Requirement 2.5)
                                self.templateManager.updateActiveBadge(templateId);
                                
                                // Show success message
                                self.showNotice('success', response.data.message || 'Template applied successfully!');
                                
                                // Reload page to show new settings
                                setTimeout(function() {
                                    location.reload();
                                }, 1000);
                            } else {
                                self.showNotice('error', response.data.message || 'Failed to apply template');
                                $('.mase-template-apply-btn').prop('disabled', false).css('opacity', '1');
                            }
                        },
                        error: function(xhr) {
                            var message = 'Network error. Please try again.';
                            if (xhr.status === 403) {
                                message = 'Permission denied. You do not have access to perform this action.';
                            } else if (xhr.status === 500) {
                                message = 'Server error. Please try again later.';
                            }
                            self.showNotice('error', message);
                            $('.mase-template-apply-btn').prop('disabled', false).css('opacity', '1');
                        }
                    });
                });
            },
            
            /**
             * Save a custom template
             * Requirement 2.4: Save custom template with name and settings snapshot
             * 
             * @param {string} name - The template name
             * @param {Object} settings - Complete settings snapshot
             */
            save: function(name, settings) {
                var self = MASE;
                
                // Validate inputs
                if (!name || name.trim() === '') {
                    self.showNotice('error', 'Please enter a template name');
                    return;
                }
                
                if (!settings || Object.keys(settings).length === 0) {
                    self.showNotice('error', 'No settings to save');
                    return;
                }
                
                // Show loading state
                self.showNotice('info', 'Saving custom template...', false);
                
                // Disable save button
                $('#mase-save-custom-template-btn').prop('disabled', true);
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_save_custom_template',
                        nonce: self.config.nonce,
                        name: name,
                        settings: settings
                    },
                    success: function(response) {
                        if (response.success) {
                            self.showNotice('success', response.data.message || 'Custom template saved successfully!');
                            
                            // Reload page to show new template
                            setTimeout(function() {
                                location.reload();
                            }, 1000);
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to save custom template');
                            $('#mase-save-custom-template-btn').prop('disabled', false);
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to perform this action.';
                        }
                        self.showNotice('error', message);
                        $('#mase-save-custom-template-btn').prop('disabled', false);
                    }
                });
            },
            
            /**
             * Delete a custom template
             * Requirement 2.4: Delete custom template with confirmation
             * 
             * @param {string} templateId - The template ID to delete
             */
            delete: function(templateId) {
                var self = MASE;
                
                // Confirm deletion
                if (!confirm('Are you sure you want to delete this custom template? This action cannot be undone.')) {
                    return;
                }
                
                // Show loading state
                self.showNotice('info', 'Deleting custom template...', false);
                
                // Disable delete button
                $('.mase-template-delete-btn[data-template-id="' + templateId + '"]').prop('disabled', true);
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_delete_custom_template',
                        nonce: self.config.nonce,
                        template_id: templateId
                    },
                    success: function(response) {
                        if (response.success) {
                            self.showNotice('success', response.data.message || 'Custom template deleted successfully!');
                            
                            // Remove template card from UI
                            $('.mase-template-card[data-template-id="' + templateId + '"]').fadeOut(300, function() {
                                $(this).remove();
                            });
                            
                            // Also remove from preview cards if present
                            $('.mase-template-preview-card[data-template-id="' + templateId + '"]').fadeOut(300, function() {
                                $(this).remove();
                            });
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to delete custom template');
                            $('.mase-template-delete-btn[data-template-id="' + templateId + '"]').prop('disabled', false);
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to perform this action.';
                        }
                        self.showNotice('error', message);
                        $('.mase-template-delete-btn[data-template-id="' + templateId + '"]').prop('disabled', false);
                    }
                });
            },
            
            /**
             * Update active template badge in UI
             * Requirement 2.5: Show active template badge
             * 
             * @param {string} templateId - The template ID that is now active
             */
            updateActiveBadge: function(templateId) {
                // Remove all active badges and classes
                $('.mase-template-card, .mase-template-preview-card').removeClass('active');
                $('.mase-active-badge').remove();
                
                // Add active class and badge to the selected template
                var $templateCard = $('.mase-template-card[data-template-id="' + templateId + '"], .mase-template-preview-card[data-template-id="' + templateId + '"]');
                $templateCard.addClass('active');
                
                // Add active badge if it doesn't exist
                if ($templateCard.find('.mase-active-badge').length === 0) {
                    $templateCard.find('.mase-template-info, .mase-template-content').first().append(
                        '<span class="mase-active-badge">Active</span>'
                    );
                }
            },
            
            /**
             * Collect current settings snapshot for saving custom template
             * Used when saving custom templates
             * 
             * @return {Object} Complete settings snapshot
             */
            collectSettings: function() {
                var self = MASE;
                
                // Collect all current form data
                var settings = self.collectFormData();
                
                // Ensure we have all required sections
                if (!settings.palettes) {
                    settings.palettes = { current: 'professional-blue', custom: [] };
                }
                if (!settings.templates) {
                    settings.templates = { current: 'default', custom: [] };
                }
                if (!settings.typography) {
                    settings.typography = {};
                }
                if (!settings.visual_effects) {
                    settings.visual_effects = {};
                }
                if (!settings.effects) {
                    settings.effects = {};
                }
                if (!settings.advanced) {
                    settings.advanced = {};
                }
                if (!settings.mobile) {
                    settings.mobile = {};
                }
                if (!settings.accessibility) {
                    settings.accessibility = {};
                }
                
                return settings;
            }
        },
        
        /**
         * Live Preview Module
         * Handles real-time preview of settings changes
         * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
         */
        livePreview: {
            /**
             * Toggle live preview on/off
             * Requirement 9.1: Enable/disable live preview
             */
            toggle: function() {
                var self = MASE;
                self.state.livePreviewEnabled = !self.state.livePreviewEnabled;
                
                if (self.state.livePreviewEnabled) {
                    this.bind();
                    this.update();
                } else {
                    this.unbind();
                    this.remove();
                }
            },
            
            /**
             * Bind input events for live preview
             * Requirement 9.1: Bind change and input events to form controls
             */
            bind: function() {
                var self = MASE;
                
                // Bind color pickers (Requirement 9.3: Update within 100ms)
                $('.mase-color-picker').on('change.livepreview', self.debounce(function() {
                    self.livePreview.update();
                }, 100));
                
                // Bind sliders (Requirement 9.4: Display current value and update preview)
                $('.mase-slider').on('input.livepreview', self.debounce(function() {
                    // Update slider value display
                    var $slider = $(this);
                    var $display = $slider.siblings('.mase-slider-value');
                    if ($display.length) {
                        $display.text($slider.val());
                    }
                    self.livePreview.update();
                }, self.config.debounceDelay));
                
                // Bind text inputs
                $('.mase-input[type="text"], .mase-input[type="number"]').on('input.livepreview', 
                    self.debounce(function() {
                        self.livePreview.update();
                    }, self.config.debounceDelay)
                );
                
                // Bind selects
                $('.mase-select').on('change.livepreview', self.debounce(function() {
                    self.livePreview.update();
                }, self.config.debounceDelay));
                
                // Bind checkboxes and radios
                $('.mase-checkbox, .mase-radio').on('change.livepreview', self.debounce(function() {
                    self.livePreview.update();
                }, self.config.debounceDelay));
            },
            
            /**
             * Unbind input events
             */
            unbind: function() {
                $('.mase-color-picker, .mase-slider, .mase-input, .mase-select, .mase-checkbox, .mase-radio')
                    .off('.livepreview');
            },
            
            /**
             * Update preview with current settings
             * Requirement 9.2: Debounce updates to 300ms
             */
            update: function() {
                var settings = this.collectSettings();
                var css = this.generateCSS(settings);
                this.applyCSS(css);
            },
            
            /**
             * Collect current settings from form
             * Requirement 9.4: Gather current form values
             * 
             * @return {Object} Current settings object
             */
            collectSettings: function() {
                var settings = {
                    admin_bar: {},
                    admin_menu: {},
                    typography: {
                        admin_bar: {},
                        admin_menu: {},
                        content: {}
                    },
                    visual_effects: {
                        admin_bar: {},
                        admin_menu: {}
                    },
                    spacing: {}
                };
                
                // Collect admin bar settings
                settings.admin_bar.bg_color = $('#admin-bar-bg-color').val() || '#23282d';
                settings.admin_bar.text_color = $('#admin-bar-text-color').val() || '#ffffff';
                settings.admin_bar.height = $('#admin-bar-height').val() || 32;
                
                // Collect admin menu settings
                settings.admin_menu.bg_color = $('#admin-menu-bg-color').val() || '#23282d';
                settings.admin_menu.text_color = $('#admin-menu-text-color').val() || '#ffffff';
                settings.admin_menu.hover_bg_color = $('#admin-menu-hover-bg-color').val() || '#191e23';
                settings.admin_menu.hover_text_color = $('#admin-menu-hover-text-color').val() || '#00b9eb';
                settings.admin_menu.width = $('#admin-menu-width').val() || 160;
                
                // Collect typography settings
                settings.typography.admin_bar.font_size = $('#typography-admin-bar-font-size').val() || 13;
                settings.typography.admin_bar.font_weight = $('#typography-admin-bar-font-weight').val() || 400;
                settings.typography.admin_bar.line_height = $('#typography-admin-bar-line-height').val() || 1.5;
                settings.typography.admin_bar.letter_spacing = $('#typography-admin-bar-letter-spacing').val() || 0;
                settings.typography.admin_bar.text_transform = $('#typography-admin-bar-text-transform').val() || 'none';
                
                settings.typography.admin_menu.font_size = $('#typography-admin-menu-font-size').val() || 13;
                settings.typography.admin_menu.font_weight = $('#typography-admin-menu-font-weight').val() || 400;
                settings.typography.admin_menu.line_height = $('#typography-admin-menu-line-height').val() || 1.5;
                settings.typography.admin_menu.letter_spacing = $('#typography-admin-menu-letter-spacing').val() || 0;
                settings.typography.admin_menu.text_transform = $('#typography-admin-menu-text-transform').val() || 'none';
                
                settings.typography.content.font_size = $('#typography-content-font-size').val() || 13;
                settings.typography.content.font_weight = $('#typography-content-font-weight').val() || 400;
                settings.typography.content.line_height = $('#typography-content-line-height').val() || 1.5;
                
                // Collect visual effects settings
                settings.visual_effects.admin_bar.border_radius = $('#visual-effects-admin-bar-border-radius').val() || 0;
                settings.visual_effects.admin_bar.shadow_intensity = $('#visual-effects-admin-bar-shadow-intensity').val() || 'none';
                settings.visual_effects.admin_bar.shadow_direction = $('#visual-effects-admin-bar-shadow-direction').val() || 'bottom';
                settings.visual_effects.admin_bar.shadow_blur = $('#visual-effects-admin-bar-shadow-blur').val() || 10;
                settings.visual_effects.admin_bar.shadow_color = $('#visual-effects-admin-bar-shadow-color').val() || 'rgba(0,0,0,0.15)';
                
                settings.visual_effects.admin_menu.border_radius = $('#visual-effects-admin-menu-border-radius').val() || 0;
                settings.visual_effects.admin_menu.shadow_intensity = $('#visual-effects-admin-menu-shadow-intensity').val() || 'none';
                settings.visual_effects.admin_menu.shadow_direction = $('#visual-effects-admin-menu-shadow-direction').val() || 'bottom';
                settings.visual_effects.admin_menu.shadow_blur = $('#visual-effects-admin-menu-shadow-blur').val() || 10;
                settings.visual_effects.admin_menu.shadow_color = $('#visual-effects-admin-menu-shadow-color').val() || 'rgba(0,0,0,0.15)';
                
                return settings;
            },
            
            /**
             * Generate CSS from settings (mirrors PHP CSS generation)
             * Requirement 9.5: Mirror PHP CSS generation logic
             * 
             * @param {Object} settings Settings object
             * @return {string} Generated CSS
             */
            generateCSS: function(settings) {
                var css = '';
                
                // Generate admin bar CSS
                css += this.generateAdminBarCSS(settings);
                
                // Generate admin menu CSS
                css += this.generateAdminMenuCSS(settings);
                
                // Generate typography CSS
                css += this.generateTypographyCSS(settings);
                
                // Generate visual effects CSS
                css += this.generateVisualEffectsCSS(settings);
                
                return css;
            },
            
            /**
             * Generate admin bar CSS
             * 
             * @param {Object} settings Settings object
             * @return {string} Admin bar CSS
             */
            generateAdminBarCSS: function(settings) {
                var css = '';
                var adminBar = settings.admin_bar || {};
                
                css += 'body.wp-admin #wpadminbar{';
                if (adminBar.bg_color) {
                    css += 'background-color:' + adminBar.bg_color + '!important;';
                }
                if (adminBar.height) {
                    css += 'height:' + adminBar.height + 'px!important;';
                }
                css += '}';
                
                // Admin bar text color
                if (adminBar.text_color) {
                    css += 'body.wp-admin #wpadminbar .ab-item,';
                    css += 'body.wp-admin #wpadminbar a.ab-item,';
                    css += 'body.wp-admin #wpadminbar > #wp-toolbar span.ab-label,';
                    css += 'body.wp-admin #wpadminbar > #wp-toolbar span.noticon{';
                    css += 'color:' + adminBar.text_color + '!important;';
                    css += '}';
                }
                
                // Adjust page margin for admin bar height
                if (adminBar.height) {
                    css += 'body.wp-admin.admin-bar{';
                    css += 'margin-top:' + adminBar.height + 'px!important;';
                    css += '}';
                    
                    css += 'body.wp-admin #wpadminbar .ab-sub-wrapper{';
                    css += 'top:' + adminBar.height + 'px!important;';
                    css += '}';
                }
                
                return css;
            },
            
            /**
             * Generate admin menu CSS
             * 
             * @param {Object} settings Settings object
             * @return {string} Admin menu CSS
             */
            generateAdminMenuCSS: function(settings) {
                var css = '';
                var adminMenu = settings.admin_menu || {};
                
                // Admin menu background and width
                css += 'body.wp-admin #adminmenu,';
                css += 'body.wp-admin #adminmenuback,';
                css += 'body.wp-admin #adminmenuwrap{';
                if (adminMenu.bg_color) {
                    css += 'background-color:' + adminMenu.bg_color + '!important;';
                }
                if (adminMenu.width) {
                    css += 'width:' + adminMenu.width + 'px!important;';
                }
                css += '}';
                
                // Admin menu text color
                if (adminMenu.text_color) {
                    css += 'body.wp-admin #adminmenu a,';
                    css += 'body.wp-admin #adminmenu div.wp-menu-name{';
                    css += 'color:' + adminMenu.text_color + '!important;';
                    css += '}';
                }
                
                // Admin menu hover states
                if (adminMenu.hover_bg_color) {
                    css += 'body.wp-admin #adminmenu li.menu-top:hover,';
                    css += 'body.wp-admin #adminmenu li.opensub > a.menu-top,';
                    css += 'body.wp-admin #adminmenu li > a.menu-top:focus{';
                    css += 'background-color:' + adminMenu.hover_bg_color + '!important;';
                    css += '}';
                }
                
                if (adminMenu.hover_text_color) {
                    css += 'body.wp-admin #adminmenu li.menu-top:hover a,';
                    css += 'body.wp-admin #adminmenu li.opensub > a.menu-top,';
                    css += 'body.wp-admin #adminmenu li > a.menu-top:focus{';
                    css += 'color:' + adminMenu.hover_text_color + '!important;';
                    css += '}';
                }
                
                // Adjust content area margin for menu width
                if (adminMenu.width) {
                    css += 'body.wp-admin #wpcontent,';
                    css += 'body.wp-admin #wpfooter{';
                    css += 'margin-left:' + adminMenu.width + 'px!important;';
                    css += '}';
                    
                    css += 'body.wp-admin.folded #wpcontent,';
                    css += 'body.wp-admin.folded #wpfooter{';
                    css += 'margin-left:36px!important;';
                    css += '}';
                }
                
                return css;
            },
            
            /**
             * Generate typography CSS
             * 
             * @param {Object} settings Settings object
             * @return {string} Typography CSS
             */
            generateTypographyCSS: function(settings) {
                var css = '';
                var typography = settings.typography || {};
                
                // Admin bar typography
                if (typography.admin_bar) {
                    var adminBar = typography.admin_bar;
                    css += 'body.wp-admin #wpadminbar,';
                    css += 'body.wp-admin #wpadminbar .ab-item,';
                    css += 'body.wp-admin #wpadminbar > #wp-toolbar span.ab-label,';
                    css += 'body.wp-admin #wpadminbar > #wp-toolbar span.noticon{';
                    
                    if (adminBar.font_size) {
                        css += 'font-size:' + adminBar.font_size + 'px!important;';
                    }
                    if (adminBar.font_weight) {
                        css += 'font-weight:' + adminBar.font_weight + '!important;';
                    }
                    if (adminBar.line_height) {
                        css += 'line-height:' + adminBar.line_height + '!important;';
                    }
                    if (adminBar.letter_spacing) {
                        css += 'letter-spacing:' + adminBar.letter_spacing + 'px!important;';
                    }
                    if (adminBar.text_transform) {
                        css += 'text-transform:' + adminBar.text_transform + '!important;';
                    }
                    
                    css += '}';
                }
                
                // Admin menu typography
                if (typography.admin_menu) {
                    var adminMenu = typography.admin_menu;
                    css += 'body.wp-admin #adminmenu a,';
                    css += 'body.wp-admin #adminmenu div.wp-menu-name,';
                    css += 'body.wp-admin #adminmenu .wp-submenu a{';
                    
                    if (adminMenu.font_size) {
                        css += 'font-size:' + adminMenu.font_size + 'px!important;';
                    }
                    if (adminMenu.font_weight) {
                        css += 'font-weight:' + adminMenu.font_weight + '!important;';
                    }
                    if (adminMenu.line_height) {
                        css += 'line-height:' + adminMenu.line_height + '!important;';
                    }
                    if (adminMenu.letter_spacing) {
                        css += 'letter-spacing:' + adminMenu.letter_spacing + 'px!important;';
                    }
                    if (adminMenu.text_transform) {
                        css += 'text-transform:' + adminMenu.text_transform + '!important;';
                    }
                    
                    css += '}';
                }
                
                // Content typography
                if (typography.content) {
                    var content = typography.content;
                    css += 'body.wp-admin #wpbody-content,';
                    css += 'body.wp-admin .wrap,';
                    css += 'body.wp-admin #wpbody-content p,';
                    css += 'body.wp-admin .wrap p{';
                    
                    if (content.font_size) {
                        css += 'font-size:' + content.font_size + 'px!important;';
                    }
                    if (content.font_weight) {
                        css += 'font-weight:' + content.font_weight + '!important;';
                    }
                    if (content.line_height) {
                        css += 'line-height:' + content.line_height + '!important;';
                    }
                    
                    css += '}';
                }
                
                return css;
            },
            
            /**
             * Generate visual effects CSS
             * 
             * @param {Object} settings Settings object
             * @return {string} Visual effects CSS
             */
            generateVisualEffectsCSS: function(settings) {
                var css = '';
                var visualEffects = settings.visual_effects || {};
                
                // Admin bar visual effects
                if (visualEffects.admin_bar) {
                    css += this.generateElementVisualEffects(
                        'body.wp-admin #wpadminbar',
                        visualEffects.admin_bar
                    );
                }
                
                // Admin menu visual effects
                if (visualEffects.admin_menu) {
                    css += this.generateElementVisualEffects(
                        'body.wp-admin #adminmenu a',
                        visualEffects.admin_menu
                    );
                }
                
                return css;
            },
            
            /**
             * Generate visual effects CSS for a specific element
             * 
             * @param {string} selector CSS selector
             * @param {Object} effects Visual effects settings
             * @return {string} Element visual effects CSS
             */
            generateElementVisualEffects: function(selector, effects) {
                var css = '';
                
                css += selector + '{';
                
                // Border radius
                if (effects.border_radius) {
                    css += 'border-radius:' + effects.border_radius + 'px!important;';
                }
                
                // Box shadow
                var shadow = this.calculateShadow(effects);
                if (shadow !== 'none') {
                    css += 'box-shadow:' + shadow + '!important;';
                }
                
                css += '}';
                
                return css;
            },
            
            /**
             * Calculate shadow CSS value from visual effects settings
             * 
             * @param {Object} effects Visual effects settings
             * @return {string} CSS box-shadow value
             */
            calculateShadow: function(effects) {
                var intensity = effects.shadow_intensity || 'none';
                var direction = effects.shadow_direction || 'bottom';
                var blur = parseInt(effects.shadow_blur) || 10;
                var color = effects.shadow_color || 'rgba(0,0,0,0.15)';
                
                if (intensity === 'none') {
                    return 'none';
                }
                
                // Base shadow sizes by intensity
                var sizes = {
                    'subtle': { x: 2, y: 2, spread: 0 },
                    'medium': { x: 4, y: 4, spread: 0 },
                    'strong': { x: 8, y: 8, spread: 2 }
                };
                
                // Direction modifiers
                var directions = {
                    'top': { x: 0, y: -1 },
                    'right': { x: 1, y: 0 },
                    'bottom': { x: 0, y: 1 },
                    'left': { x: -1, y: 0 },
                    'center': { x: 0, y: 0 }
                };
                
                var base = sizes[intensity] || sizes.subtle;
                var dir = directions[direction] || directions.bottom;
                
                var x = base.x * dir.x;
                var y = base.y * dir.y;
                var spread = base.spread;
                
                return x + 'px ' + y + 'px ' + blur + 'px ' + spread + 'px ' + color;
            },
            
            /**
             * Apply CSS to page
             * Requirement 9.6: Inject CSS into <style> tag
             * 
             * @param {string} css CSS to apply
             */
            applyCSS: function(css) {
                var $style = $('#mase-live-preview-css');
                
                if ($style.length === 0) {
                    $style = $('<style id="mase-live-preview-css" type="text/css"></style>');
                    $('head').append($style);
                }
                
                $style.text(css);
            },
            
            /**
             * Remove live preview CSS
             */
            remove: function() {
                $('#mase-live-preview-css').remove();
            }
        },
        
        /**
         * Import/Export Module
         * Handles settings export and import functionality
         * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
         */
        importExport: {
            /**
             * Export current settings to JSON file
             * Requirement 8.1: Generate JSON file with current settings
             * Requirement 8.4: Trigger file download with proper filename
             */
            export: function() {
                var self = MASE;
                var $button = $('#mase-export-settings');
                var originalText = $button.text();
                
                // Show loading state
                $button.prop('disabled', true).text('Exporting...');
                self.showNotice('info', 'Preparing export...', false);
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_export_settings',
                        nonce: self.config.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            // Generate JSON from current settings (Requirement 8.3)
                            var jsonData = JSON.stringify(response.data, null, 2);
                            
                            // Create blob for download
                            var blob = new Blob([jsonData], { type: 'application/json' });
                            var url = URL.createObjectURL(blob);
                            
                            // Generate filename with date (Requirement 8.4: mase-settings-YYYYMMDD.json)
                            var date = new Date();
                            var dateStr = date.getFullYear() + 
                                         ('0' + (date.getMonth() + 1)).slice(-2) + 
                                         ('0' + date.getDate()).slice(-2);
                            var filename = 'mase-settings-' + dateStr + '.json';
                            
                            // Trigger download (Requirement 8.4)
                            var link = document.createElement('a');
                            link.href = url;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up blob URL
                            URL.revokeObjectURL(url);
                            
                            // Show success message (Requirement 8.1)
                            self.showNotice('success', 'Settings exported successfully!');
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to export settings');
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error during export. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to export settings.';
                        } else if (xhr.status === 500) {
                            message = 'Server error during export. Please try again later.';
                        }
                        self.showNotice('error', message);
                    },
                    complete: function() {
                        $button.prop('disabled', false).text(originalText);
                    }
                });
            },
            
            /**
             * Import settings from JSON file
             * Requirement 8.2: Display file upload dialog
             * Requirement 8.5: Read file and parse JSON
             * Requirement 8.6: Validate imported JSON structure
             * Requirement 8.7: Call ajax_import_settings endpoint
             * Requirement 16.3: Create automatic backup before import (if enabled)
             */
            import: function(fileData) {
                var self = MASE;
                var $button = $('#mase-import-settings');
                var originalText = $button.text();
                
                // Validate JSON structure (Requirement 8.6)
                if (!fileData || typeof fileData !== 'object') {
                    self.showNotice('error', 'Invalid JSON file format');
                    return;
                }
                
                // Validate required fields (Requirement 8.6)
                if (!fileData.plugin || fileData.plugin !== 'MASE') {
                    self.showNotice('error', 'This file is not a valid MASE settings export');
                    return;
                }
                
                if (!fileData.settings || typeof fileData.settings !== 'object') {
                    self.showNotice('error', 'Invalid settings data in import file');
                    return;
                }
                
                // Confirm import action
                if (!confirm('This will overwrite your current settings. Are you sure you want to continue?')) {
                    return;
                }
                
                // Create automatic backup before importing (Requirement 16.3)
                self.backupManager.createAutoBackupBeforeImport(function() {
                    // Show loading state
                    $button.prop('disabled', true).text('Importing...');
                    self.showNotice('info', 'Importing settings...', false);
                    
                    // Call ajax_import_settings endpoint with validated data (Requirement 8.7)
                    $.ajax({
                        url: self.config.ajaxUrl,
                        type: 'POST',
                        data: {
                            action: 'mase_import_settings',
                            nonce: self.config.nonce,
                            settings_data: JSON.stringify(fileData)
                        },
                        success: function(response) {
                            if (response.success) {
                                // Show success message (Requirement 8.8)
                                self.showNotice('success', response.data.message || 'Settings imported successfully!');
                                
                                // Reload page to show imported settings
                                setTimeout(function() {
                                    location.reload();
                                }, 1500);
                            } else {
                                self.showNotice('error', response.data.message || 'Failed to import settings');
                                $button.prop('disabled', false).text(originalText);
                            }
                        },
                        error: function(xhr) {
                            var message = 'Network error during import. Please try again.';
                            if (xhr.status === 403) {
                                message = 'Permission denied. You do not have access to import settings.';
                            } else if (xhr.status === 500) {
                                message = 'Server error during import. Please try again later.';
                            }
                            self.showNotice('error', message);
                            $button.prop('disabled', false).text(originalText);
                        }
                    });
                });
            },
            
            /**
             * Open file dialog for import
             * Requirement 8.2: Display file upload dialog accepting .json files
             */
            openFileDialog: function() {
                $('#mase-import-file').click();
            },
            
            /**
             * Handle file selection and reading
             * Requirement 8.5: Implement file reading and JSON parsing
             */
            handleFileSelect: function(event) {
                var self = MASE;
                var file = event.target.files[0];
                
                if (!file) {
                    return;
                }
                
                // Validate file type (Requirement 8.2: Accept .json files)
                if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
                    self.showNotice('error', 'Please select a valid JSON file');
                    event.target.value = ''; // Reset file input
                    return;
                }
                
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    self.showNotice('error', 'File is too large. Maximum size is 5MB');
                    event.target.value = ''; // Reset file input
                    return;
                }
                
                // Read file and parse JSON (Requirement 8.5)
                var reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        var fileData = JSON.parse(e.target.result);
                        self.importExport.import(fileData);
                    } catch (error) {
                        self.showNotice('error', 'Invalid JSON file format. Please check the file and try again.');
                        console.error('JSON parse error:', error);
                    }
                    
                    // Reset file input for next import
                    event.target.value = '';
                };
                
                reader.onerror = function() {
                    self.showNotice('error', 'Failed to read file. Please try again.');
                    event.target.value = '';
                };
                
                reader.readAsText(file);
            }
        },
        
        /**
         * Backup Manager Module
         * Handles backup creation, listing, and restoration
         * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
         */
        backupManager: {
            /**
             * Create a manual backup
             * Requirement 16.1: Create backup with timestamp
             */
            create: function() {
                var self = MASE;
                var $button = $('#mase-create-backup');
                var originalText = $button.html();
                
                // Show loading state
                $button.prop('disabled', true).html('<span class="dashicons dashicons-update dashicons-spin"></span> Creating...');
                self.showNotice('info', 'Creating backup...', false);
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_create_backup',
                        nonce: self.config.nonce
                    },
                    success: function(response) {
                        if (response.success) {
                            // Show success message (Requirement 16.1)
                            self.showNotice('success', response.data.message || 'Backup created successfully!');
                            
                            // Refresh backup list (Requirement 16.4)
                            self.backupManager.loadBackupList();
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to create backup');
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to create backups.';
                        } else if (xhr.status === 500) {
                            message = 'Server error. Please try again later.';
                        }
                        self.showNotice('error', message);
                    },
                    complete: function() {
                        $button.prop('disabled', false).html(originalText);
                    }
                });
            },
            
            /**
             * Restore a backup
             * Requirement 16.5: Restore backup with confirmation dialog
             */
            restore: function(backupId) {
                var self = MASE;
                
                // Confirm restoration (Requirement 16.5)
                if (!confirm('This will replace your current settings with the backup. Are you sure you want to continue?')) {
                    return;
                }
                
                var $button = $('#mase-restore-backup');
                var originalText = $button.html();
                
                // Show loading state
                $button.prop('disabled', true).html('<span class="dashicons dashicons-update dashicons-spin"></span> Restoring...');
                self.showNotice('info', 'Restoring backup...', false);
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_restore_backup',
                        nonce: self.config.nonce,
                        backup_id: backupId
                    },
                    success: function(response) {
                        if (response.success) {
                            // Show success message (Requirement 16.5)
                            self.showNotice('success', response.data.message || 'Backup restored successfully!');
                            
                            // Reload page after successful restore (Requirement 16.5)
                            setTimeout(function() {
                                location.reload();
                            }, 1500);
                        } else {
                            self.showNotice('error', response.data.message || 'Failed to restore backup');
                            $button.prop('disabled', false).html(originalText);
                        }
                    },
                    error: function(xhr) {
                        var message = 'Network error. Please try again.';
                        if (xhr.status === 403) {
                            message = 'Permission denied. You do not have access to restore backups.';
                        } else if (xhr.status === 500) {
                            message = 'Server error. Please try again later.';
                        }
                        self.showNotice('error', message);
                        $button.prop('disabled', false).html(originalText);
                    }
                });
            },
            
            /**
             * Load backup list from server
             * Requirement 16.4: Display list of all available backups with dates
             */
            loadBackupList: function() {
                var self = MASE;
                var $select = $('#mase-backup-list');
                var $restoreButton = $('#mase-restore-backup');
                
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_get_backups',
                        nonce: self.config.nonce
                    },
                    success: function(response) {
                        if (response.success && response.data.backups) {
                            var backups = response.data.backups;
                            
                            // Clear existing options except the first one
                            $select.find('option:not(:first)').remove();
                            
                            // Add backup options (Requirement 16.4)
                            if (backups.length > 0) {
                                $.each(backups, function(index, backup) {
                                    var date = new Date(backup.timestamp * 1000);
                                    var dateStr = date.toLocaleString();
                                    var label = dateStr + ' (' + backup.trigger + ')';
                                    
                                    $select.append(
                                        $('<option></option>')
                                            .val(backup.id)
                                            .text(label)
                                    );
                                });
                                
                                // Enable select
                                $select.prop('disabled', false);
                            } else {
                                $select.prop('disabled', true);
                                $restoreButton.prop('disabled', true);
                            }
                        }
                    },
                    error: function() {
                        console.error('Failed to load backup list');
                    }
                });
            },
            
            /**
             * Create automatic backup before template application
             * Requirement 16.2: Automatic backup before template application (if enabled)
             */
            createAutoBackupBeforeTemplate: function(callback) {
                var self = MASE;
                
                // Check if automatic backup is enabled (Requirement 16.2)
                var backupEnabled = $('#advanced-backup-enabled').is(':checked');
                var backupBeforeChanges = $('#advanced-backup-before-changes').is(':checked');
                
                if (!backupEnabled || !backupBeforeChanges) {
                    // Skip backup, proceed with callback
                    if (callback) callback();
                    return;
                }
                
                // Create automatic backup
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_create_backup',
                        nonce: self.config.nonce,
                        trigger: 'template_apply'
                    },
                    success: function(response) {
                        if (response.success) {
                            console.log('Automatic backup created before template application');
                        }
                        // Proceed with callback regardless of backup success
                        if (callback) callback();
                    },
                    error: function() {
                        console.error('Failed to create automatic backup');
                        // Proceed with callback even if backup fails
                        if (callback) callback();
                    }
                });
            },
            
            /**
             * Create automatic backup before import
             * Requirement 16.3: Automatic backup before import (if enabled)
             */
            createAutoBackupBeforeImport: function(callback) {
                var self = MASE;
                
                // Check if automatic backup is enabled (Requirement 16.3)
                var backupEnabled = $('#advanced-backup-enabled').is(':checked');
                var backupBeforeChanges = $('#advanced-backup-before-changes').is(':checked');
                
                if (!backupEnabled || !backupBeforeChanges) {
                    // Skip backup, proceed with callback
                    if (callback) callback();
                    return;
                }
                
                // Create automatic backup
                $.ajax({
                    url: self.config.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'mase_create_backup',
                        nonce: self.config.nonce,
                        trigger: 'import'
                    },
                    success: function(response) {
                        if (response.success) {
                            console.log('Automatic backup created before import');
                        }
                        // Proceed with callback regardless of backup success
                        if (callback) callback();
                    },
                    error: function() {
                        console.error('Failed to create automatic backup');
                        // Proceed with callback even if backup fails
                        if (callback) callback();
                    }
                });
            }
        },
        
        /**
         * Keyboard Shortcuts Module
         * Handles keyboard shortcuts for common actions
         * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
         */
        keyboardShortcuts: {
            /**
             * Bind keyboard shortcuts
             * Requirement 12.1: Listen for Ctrl+Shift+1-0 for palette switching
             * Requirement 12.2: Listen for Ctrl+Shift+T for theme toggle
             * Requirement 12.3: Listen for Ctrl+Shift+F for focus mode toggle
             * Requirement 12.4: Listen for Ctrl+Shift+P for performance mode toggle
             * Requirement 12.5: Check keyboard_shortcuts.enabled setting before handling
             */
            bind: function() {
                var self = MASE;
                
                // Add keydown event listener
                $(document).on('keydown.mase-shortcuts', function(e) {
                    self.keyboardShortcuts.handle(e);
                });
            },
            
            /**
             * Unbind keyboard shortcuts
             */
            unbind: function() {
                $(document).off('keydown.mase-shortcuts');
            },
            
            /**
             * Handle keyboard shortcut events
             * Requirement 12.5: Check keyboard_shortcuts.enabled setting before handling
             * 
             * @param {Event} e - Keyboard event
             */
            handle: function(e) {
                var self = MASE;
                
                // Check if keyboard shortcuts are enabled (Requirement 12.5)
                var shortcutsEnabled = $('#keyboard-shortcuts-enabled').is(':checked');
                if (!shortcutsEnabled) {
                    return;
                }
                
                // Check for Ctrl+Shift combination
                if (!e.ctrlKey || !e.shiftKey) {
                    return;
                }
                
                var handled = false;
                
                // Requirement 12.1: Ctrl+Shift+1-0 for palette switching (1-10)
                if (e.key >= '1' && e.key <= '9') {
                    var paletteIndex = parseInt(e.key) - 1;
                    this.switchPalette(paletteIndex);
                    handled = true;
                } else if (e.key === '0') {
                    // Ctrl+Shift+0 for palette 10
                    this.switchPalette(9);
                    handled = true;
                }
                // Requirement 12.2: Ctrl+Shift+T for theme toggle
                else if (e.key === 'T' || e.key === 't') {
                    this.toggleTheme();
                    handled = true;
                }
                // Requirement 12.3: Ctrl+Shift+F for focus mode toggle
                else if (e.key === 'F' || e.key === 'f') {
                    this.toggleFocusMode();
                    handled = true;
                }
                // Requirement 12.4: Ctrl+Shift+P for performance mode toggle
                else if (e.key === 'P' || e.key === 'p') {
                    this.togglePerformanceMode();
                    handled = true;
                }
                
                // Prevent default browser behavior for handled shortcuts
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            },
            
            /**
             * Switch to palette by index
             * Requirement 12.1: Implement Ctrl+Shift+1-0 for palette switching
             * 
             * @param {number} index - Palette index (0-9)
             */
            switchPalette: function(index) {
                var self = MASE;
                
                // Check if palette switching is enabled
                var paletteSwitchEnabled = $('#keyboard-shortcuts-palette-switch').is(':checked');
                if (!paletteSwitchEnabled) {
                    return;
                }
                
                // Get all palette cards
                var $paletteCards = $('.mase-palette-card');
                
                // Check if index is valid
                if (index < 0 || index >= $paletteCards.length) {
                    return;
                }
                
                // Get the palette card at the specified index
                var $targetCard = $paletteCards.eq(index);
                var paletteId = $targetCard.data('palette-id');
                
                if (paletteId) {
                    // Apply the palette
                    self.paletteManager.apply(paletteId);
                    
                    // Show feedback
                    self.showNotice('info', 'Switching to palette ' + (index + 1) + '...', false);
                }
            },
            
            /**
             * Toggle between light and dark themes
             * Requirement 12.2: Implement Ctrl+Shift+T for theme toggle
             */
            toggleTheme: function() {
                var self = MASE;
                
                // Check if theme toggle is enabled
                var themeToggleEnabled = $('#keyboard-shortcuts-theme-toggle').is(':checked');
                if (!themeToggleEnabled) {
                    return;
                }
                
                // Get current palette
                var $activeCard = $('.mase-palette-card.active');
                var currentPaletteId = $activeCard.data('palette-id');
                
                // Define light and dark palette mappings
                var themeMap = {
                    'professional-blue': 'dark-elegance',
                    'dark-elegance': 'professional-blue',
                    'energetic-green': 'midnight-purple',
                    'midnight-purple': 'energetic-green',
                    'sunset': 'ocean-breeze',
                    'ocean-breeze': 'sunset',
                    'warm-autumn': 'cool-winter',
                    'cool-winter': 'warm-autumn',
                    'vibrant-coral': 'forest-green',
                    'forest-green': 'vibrant-coral'
                };
                
                // Get the opposite theme
                var targetPaletteId = themeMap[currentPaletteId];
                
                if (targetPaletteId) {
                    // Apply the opposite theme
                    self.paletteManager.apply(targetPaletteId);
                    
                    // Show feedback
                    self.showNotice('info', 'Toggling theme...', false);
                } else {
                    // If no mapping exists, just show a message
                    self.showNotice('info', 'Theme toggle not available for current palette', true);
                }
            },
            
            /**
             * Toggle focus mode (hide distractions)
             * Requirement 12.3: Implement Ctrl+Shift+F for focus mode toggle
             */
            toggleFocusMode: function() {
                var self = MASE;
                
                // Check if focus mode toggle is enabled
                var focusModeEnabled = $('#keyboard-shortcuts-focus-mode').is(':checked');
                if (!focusModeEnabled) {
                    return;
                }
                
                // Find the focus mode checkbox
                var $focusModeCheckbox = $('#effects-focus-mode');
                
                if ($focusModeCheckbox.length) {
                    // Toggle the checkbox
                    var isChecked = $focusModeCheckbox.is(':checked');
                    $focusModeCheckbox.prop('checked', !isChecked).trigger('change');
                    
                    // Show feedback
                    var message = !isChecked ? 'Focus mode enabled' : 'Focus mode disabled';
                    self.showNotice('info', message, true);
                    
                    // Update live preview if enabled
                    if (self.state.livePreviewEnabled) {
                        self.livePreview.update();
                    }
                } else {
                    self.showNotice('warning', 'Focus mode setting not found', true);
                }
            },
            
            /**
             * Toggle performance mode (disable effects)
             * Requirement 12.4: Implement Ctrl+Shift+P for performance mode toggle
             */
            togglePerformanceMode: function() {
                var self = MASE;
                
                // Check if performance mode toggle is enabled
                var performanceModeEnabled = $('#keyboard-shortcuts-performance-mode').is(':checked');
                if (!performanceModeEnabled) {
                    return;
                }
                
                // Find the performance mode checkbox
                var $performanceModeCheckbox = $('#effects-performance-mode');
                
                if ($performanceModeCheckbox.length) {
                    // Toggle the checkbox
                    var isChecked = $performanceModeCheckbox.is(':checked');
                    $performanceModeCheckbox.prop('checked', !isChecked).trigger('change');
                    
                    // Show feedback
                    var message = !isChecked ? 'Performance mode enabled' : 'Performance mode disabled';
                    self.showNotice('info', message, true);
                    
                    // Update live preview if enabled
                    if (self.state.livePreviewEnabled) {
                        self.livePreview.update();
                    }
                } else {
                    self.showNotice('warning', 'Performance mode setting not found', true);
                }
            }
        },
        
        /**
         * Modules placeholder (for future modular architecture)
         */
        modules: {
            keyboardShortcuts: null
        },
        
        /**
         * Initialize the admin interface
         */
        init: function() {
            // Set nonce from hidden field
            this.config.nonce = $('#mase_nonce').val() || '';
            
            // Initialize all modules
            this.initColorPickers();
            this.bindEvents();
            this.bindPaletteEvents();
            this.bindTemplateEvents();
            this.bindImportExportEvents();
            this.bindBackupEvents();
            
            // Initialize keyboard shortcuts (Requirement 12.1-12.5)
            this.keyboardShortcuts.bind();
            
            // Track dirty state
            this.trackDirtyState();
            
            // Initialize live preview if enabled (Requirement 9.1)
            if ($('#mase-live-preview-toggle').is(':checked')) {
                this.state.livePreviewEnabled = true;
                this.livePreview.bind();
            }
            
            // Initialize conditional fields (Requirement 15.6)
            this.initConditionalFields();
        },
        
        /**
         * Initialize WordPress color pickers
         * Requirement 9.3: Update within 100ms for color changes
         */
        initColorPickers: function() {
            var self = this;
            $('.mase-color-picker').wpColorPicker({
                change: this.debounce(function() {
                    if (self.state.livePreviewEnabled) {
                        self.livePreview.update();
                    }
                }, 100),
                clear: this.debounce(function() {
                    if (self.state.livePreviewEnabled) {
                        self.livePreview.update();
                    }
                }, 100)
            });
        },
        
        /**
         * Bind event handlers
         */
        bindEvents: function() {
            var self = this;
            
            // Form submission
            $('#mase-settings-form').on('submit', this.handleSubmit.bind(this));
            
            // Live preview toggle (Requirement 9.1)
            $('#mase-live-preview-toggle').on('change', function() {
                self.state.livePreviewEnabled = $(this).is(':checked');
                if (self.state.livePreviewEnabled) {
                    self.livePreview.bind();
                    self.livePreview.update();
                } else {
                    self.livePreview.unbind();
                    self.livePreview.remove();
                }
            });
            
            // Input changes for live preview
            $('.mase-input, .mase-color-picker, .mase-slider, .mase-select, .mase-checkbox, .mase-radio').on('input change', 
                this.debounce(function() {
                    if (self.state.livePreviewEnabled) {
                        self.updatePreview();
                    }
                    self.state.isDirty = true;
                }, this.config.debounceDelay)
            );
            
            // Slider value display
            $('.mase-slider').on('input', function() {
                var $slider = $(this);
                var $display = $slider.siblings('.mase-slider-value');
                if ($display.length) {
                    $display.text($slider.val());
                }
            });
            
            // Tab navigation
            $('.mase-tab-link').on('click', function(e) {
                e.preventDefault();
                var target = $(this).data('tab');
                self.switchTab(target);
            });
            
            // Reset to defaults
            $('#mase-reset-btn').on('click', function(e) {
                e.preventDefault();
                if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
                    self.resetToDefaults();
                }
            });
        },
        
        /**
         * Track dirty state for unsaved changes warning
         */
        trackDirtyState: function() {
            var self = this;
            
            // Warn before leaving page with unsaved changes
            $(window).on('beforeunload', function() {
                if (self.state.isDirty && !self.state.isSaving) {
                    return 'You have unsaved changes. Are you sure you want to leave?';
                }
            });
        },
        
        /**
         * Switch between tabs
         */
        switchTab: function(tabId) {
            // Update tab links
            $('.mase-tab-link').removeClass('nav-tab-active');
            $('.mase-tab-link[data-tab="' + tabId + '"]').addClass('nav-tab-active');
            
            // Update tab content
            $('.mase-tab-content').removeClass('active');
            $('#' + tabId).addClass('active');
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
         * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 18.1, 18.2, 18.3, 18.4, 18.5
         */
        saveSettings: function() {
            var self = this;
            var $form = $('#mase-settings-form');
            var $button = $form.find('input[type="submit"]');
            var originalText = $button.val();
            
            // Prevent double submission (Requirement 11.1)
            if (this.state.isSaving) {
                return;
            }
            
            this.state.isSaving = true;
            
            // Show loading state: disable button, show spinner (Requirement 11.1)
            $button.prop('disabled', true).val('Saving...').css('opacity', '0.6');
            
            // Add spinner next to button
            var $spinner = $('<span class="mase-spinner" style="display:inline-block;margin-left:8px;width:16px;height:16px;border:2px solid #f3f3f3;border-top:2px solid #3498db;border-radius:50%;animation:mase-spin 1s linear infinite;"></span>');
            $button.after($spinner);
            
            // Add spinner animation if not already defined
            if (!$('#mase-spinner-style').length) {
                $('head').append('<style id="mase-spinner-style">@keyframes mase-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>');
            }
            
            // Collect all form data (Requirement 11.2)
            var formData = this.collectFormData();
            
            // Submit via AJAX to admin-ajax.php (Requirement 11.1)
            $.ajax({
                url: this.config.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'mase_save_settings',
                    nonce: this.config.nonce, // Include nonce for security (Requirement 11.2)
                    settings: formData
                },
                success: function(response) {
                    // Handle success response (Requirement 11.4)
                    if (response.success) {
                        // Show success notice (Requirement 11.4, 18.1)
                        self.showNotice('success', response.data.message || 'Settings saved successfully!');
                        
                        // Update state (Requirement 11.4)
                        self.state.isDirty = false;
                        
                        // Invalidate cache on successful save (Requirement 11.4)
                        self.invalidateCache();
                        
                        // Update live preview if enabled
                        if (self.state.livePreviewEnabled) {
                            self.livePreview.update();
                        }
                    } else {
                        // Handle error response (Requirement 11.5, 18.2)
                        self.showNotice('error', response.data.message || 'Failed to save settings');
                        
                        // Show retry option (Requirement 18.2)
                        self.showRetryOption();
                    }
                },
                error: function(xhr, status, error) {
                    // Handle network errors (Requirement 18.3)
                    var message = 'Network error. Please check your connection and try again.';
                    
                    if (xhr.status === 403) {
                        message = 'Permission denied. You do not have access to perform this action.';
                    } else if (xhr.status === 500) {
                        message = 'Server error. Please try again later.';
                    } else if (xhr.status === 0) {
                        message = 'Network connection lost. Please check your internet connection.';
                    }
                    
                    // Show network error notice with retry option (Requirement 18.3)
                    self.showNotice('error', message);
                    self.showRetryOption();
                    
                    // Log error for debugging (Requirement 18.5)
                    console.error('MASE AJAX Error:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        error: error
                    });
                },
                complete: function() {
                    // Re-enable button and remove spinner (Requirement 11.1)
                    $button.prop('disabled', false).val(originalText).css('opacity', '1');
                    $spinner.remove();
                    self.state.isSaving = false;
                }
            });
        },
        
        /**
         * Invalidate cache after successful save
         * Requirement 11.4: Invalidate cache on successful save
         */
        invalidateCache: function() {
            var self = this;
            
            // Send cache invalidation request
            $.ajax({
                url: this.config.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'mase_invalidate_cache',
                    nonce: this.config.nonce
                },
                success: function(response) {
                    if (response.success) {
                        console.log('Cache invalidated successfully');
                    }
                },
                error: function() {
                    // Silent fail - cache invalidation is not critical
                    console.warn('Cache invalidation failed, but settings were saved');
                }
            });
        },
        
        /**
         * Show retry option after save failure
         * Requirement 18.2: Handle error response with retry option
         */
        showRetryOption: function() {
            var self = this;
            
            // Create retry button
            var $retryBtn = $('<button type="button" class="button button-secondary" style="margin-left:10px;">Retry Save</button>');
            
            // Add retry button to notice area
            $('#mase-notices .notice').append($retryBtn);
            
            // Bind retry click handler
            $retryBtn.on('click', function() {
                $(this).remove();
                self.saveSettings();
            });
        },
        
        /**
         * Collect all form data into structured object
         * Handles nested fields, checkboxes, radio buttons, and selects
         */
        collectFormData: function() {
            var formData = {};
            var $form = $('#mase-settings-form');
            
            // Process all form inputs
            $form.find('input, select, textarea').each(function() {
                var $input = $(this);
                var name = $input.attr('name');
                var value = $input.val();
                var type = $input.attr('type');
                
                // Skip if no name
                if (!name) {
                    return;
                }
                
                // Handle checkboxes
                if (type === 'checkbox') {
                    value = $input.is(':checked') ? '1' : '0';
                }
                
                // Handle radio buttons (only if checked)
                if (type === 'radio' && !$input.is(':checked')) {
                    return;
                }
                
                // Parse nested field names (e.g., admin_bar[bg_color] or typography[admin_bar][font_size])
                var parts = name.match(/^(\w+)(?:\[(\w+)\])?(?:\[(\w+)\])?$/);
                
                if (parts) {
                    var section = parts[1];
                    var key1 = parts[2];
                    var key2 = parts[3];
                    
                    if (key2) {
                        // Three-level nesting: section[key1][key2]
                        if (!formData[section]) {
                            formData[section] = {};
                        }
                        if (!formData[section][key1]) {
                            formData[section][key1] = {};
                        }
                        formData[section][key1][key2] = value;
                    } else if (key1) {
                        // Two-level nesting: section[key]
                        if (!formData[section]) {
                            formData[section] = {};
                        }
                        formData[section][key1] = value;
                    } else {
                        // Top-level: section
                        formData[section] = value;
                    }
                }
            });
            
            return formData;
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
         * Show admin notice
         * @param {string} type - Notice type: 'success', 'error', 'warning', 'info'
         * @param {string} message - Message to display
         * @param {boolean} dismissible - Whether notice can be dismissed (default: true)
         */
        showNotice: function(type, message, dismissible) {
            var self = this;
            dismissible = typeof dismissible !== 'undefined' ? dismissible : true;
            
            var dismissClass = dismissible ? ' is-dismissible' : '';
            var $notice = $('<div class="notice notice-' + type + dismissClass + '"><p>' + message + '</p></div>');
            
            // Remove existing notices
            $('#mase-notices .notice').remove();
            
            // Add new notice
            $('#mase-notices').html($notice);
            
            // Scroll to notice
            $('html, body').animate({
                scrollTop: $('#mase-notices').offset().top - 50
            }, 300);
            
            // Add dismiss button functionality if dismissible
            if (dismissible) {
                $notice.find('.notice-dismiss').on('click', function() {
                    $notice.fadeOut(200, function() {
                        $(this).remove();
                    });
                });
            }
            
            // Auto-fade after timeout (except for errors)
            if (type !== 'error') {
                setTimeout(function() {
                    $notice.fadeOut(400, function() {
                        $(this).remove();
                    });
                }, self.config.noticeTimeout);
            }
        },
        
        /**
         * Debounce utility function for performance optimization
         * Delays function execution until after wait milliseconds have elapsed
         * since the last time it was invoked
         * 
         * @param {Function} func - Function to debounce
         * @param {number} wait - Milliseconds to wait
         * @return {Function} Debounced function
         */
        debounce: function(func, wait) {
            var timeout;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },
        
        /**
         * Reset all settings to defaults
         */
        resetToDefaults: function() {
            var self = this;
            var $button = $('#mase-reset-btn');
            var originalText = $button.text();
            
            $button.prop('disabled', true).text('Resetting...');
            
            $.ajax({
                url: this.config.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'mase_reset_settings',
                    nonce: this.config.nonce
                },
                success: function(response) {
                    if (response.success) {
                        self.showNotice('success', response.data.message || 'Settings reset to defaults');
                        // Reload page to show default settings
                        setTimeout(function() {
                            location.reload();
                        }, 1000);
                    } else {
                        self.showNotice('error', response.data.message || 'Failed to reset settings');
                        $button.prop('disabled', false).text(originalText);
                    }
                },
                error: function() {
                    self.showNotice('error', 'Network error. Please try again.');
                    $button.prop('disabled', false).text(originalText);
                }
            });
        },
        
        /**
         * Bind palette preset events
         * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
         */
        bindPaletteEvents: function() {
            var self = this;
            
            // Click handler for palette card "Apply" buttons (Requirement 1.3)
            $(document).on('click', '.mase-palette-apply-btn', function(e) {
                e.preventDefault();
                var paletteId = $(this).data('palette-id');
                self.paletteManager.apply(paletteId);
            });
            
            // Click handler for "Save Custom Palette" button (Requirement 1.3)
            $(document).on('click', '#mase-save-custom-palette-btn', function(e) {
                e.preventDefault();
                
                // Get palette name from input
                var name = $('#custom-palette-name').val();
                
                // Collect colors from color pickers
                var colors = self.paletteManager.collectColors();
                
                // Save the palette
                self.paletteManager.save(name, colors);
            });
            
            // Click handler for "Delete Custom Palette" button with confirmation (Requirement 1.3)
            $(document).on('click', '.mase-palette-delete-btn', function(e) {
                e.preventDefault();
                var paletteId = $(this).data('palette-id');
                self.paletteManager.delete(paletteId);
            });
            
            // Hover effect for palette cards (Requirement 1.5)
            $(document).on('mouseenter', '.mase-palette-card', function() {
                $(this).css({
                    'transform': 'translateY(-2px)',
                    'box-shadow': '0 8px 16px rgba(0, 0, 0, 0.15)'
                });
            });
            
            $(document).on('mouseleave', '.mase-palette-card', function() {
                $(this).css({
                    'transform': 'translateY(0)',
                    'box-shadow': ''
                });
            });
            
            // Click handler for palette card selection (Requirement 1.2)
            $(document).on('click', '.mase-palette-card', function(e) {
                // Don't trigger if clicking on buttons
                if ($(e.target).is('button') || $(e.target).closest('button').length) {
                    return;
                }
                
                // Remove selected class from all cards
                $('.mase-palette-card').removeClass('selected');
                
                // Add selected class to clicked card (Requirement 1.2: 2px primary-colored border)
                $(this).addClass('selected');
            });
        },
        
        /**
         * Bind template management events
         * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
         */
        bindTemplateEvents: function() {
            var self = this;
            
            // Click handler for template card "Apply" buttons (Requirement 2.4)
            $(document).on('click', '.mase-template-apply-btn', function(e) {
                e.preventDefault();
                var templateId = $(this).data('template-id');
                self.templateManager.apply(templateId);
            });
            
            // Click handler for "Save Custom Template" button (Requirement 2.4)
            $(document).on('click', '#mase-save-custom-template-btn', function(e) {
                e.preventDefault();
                
                // Get template name from input
                var name = $('#custom-template-name').val();
                
                // Collect complete settings snapshot
                var settings = self.templateManager.collectSettings();
                
                // Save the template
                self.templateManager.save(name, settings);
            });
            
            // Click handler for "Delete Custom Template" button with confirmation (Requirement 2.4)
            $(document).on('click', '.mase-template-delete-btn', function(e) {
                e.preventDefault();
                var templateId = $(this).data('template-id');
                self.templateManager.delete(templateId);
            });
            
            // Hover effect for template cards (Requirement 2.5)
            $(document).on('mouseenter', '.mase-template-card, .mase-template-preview-card', function() {
                $(this).css({
                    'transform': 'translateY(-4px)',
                    'box-shadow': '0 12px 24px rgba(0, 0, 0, 0.15)'
                });
            });
            
            $(document).on('mouseleave', '.mase-template-card, .mase-template-preview-card', function() {
                $(this).css({
                    'transform': 'translateY(0)',
                    'box-shadow': ''
                });
            });
            
            // Click handler for template card selection (Requirement 2.2)
            $(document).on('click', '.mase-template-card, .mase-template-preview-card', function(e) {
                // Don't trigger if clicking on buttons
                if ($(e.target).is('button') || $(e.target).closest('button').length) {
                    return;
                }
                
                // Remove selected class from all cards
                $('.mase-template-card, .mase-template-preview-card').removeClass('selected');
                
                // Add selected class to clicked card (Requirement 2.2: 2px primary-colored border)
                $(this).addClass('selected');
            });
            
            // Click handler for "View All Templates" link (Requirement 2.3)
            $(document).on('click', '#mase-view-all-templates-link', function(e) {
                e.preventDefault();
                self.switchTab('mase-templates-tab');
            });
        },
        
        /**
         * Bind import/export events
         * Requirements: 8.1, 8.2
         */
        bindImportExportEvents: function() {
            var self = this;
            
            // Bind export button click handler (Requirement 8.1)
            $('#mase-export-settings').on('click', function(e) {
                e.preventDefault();
                self.importExport.export();
            });
            
            // Bind import button click handler (Requirement 8.2)
            $('#mase-import-settings').on('click', function(e) {
                e.preventDefault();
                self.importExport.openFileDialog();
            });
            
            // Bind file input change handler (Requirement 8.5)
            $('#mase-import-file').on('change', function(e) {
                self.importExport.handleFileSelect(e);
            });
        },
        
        /**
         * Bind backup/restore events
         * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
         */
        bindBackupEvents: function() {
            var self = this;
            
            // Bind create backup button click handler (Requirement 16.1)
            $('#mase-create-backup').on('click', function(e) {
                e.preventDefault();
                self.backupManager.create();
            });
            
            // Bind restore backup button click handler (Requirement 16.5)
            $('#mase-restore-backup').on('click', function(e) {
                e.preventDefault();
                var backupId = $('#mase-backup-list').val();
                if (backupId) {
                    self.backupManager.restore(backupId);
                } else {
                    self.showNotice('error', 'Please select a backup to restore');
                }
            });
            
            // Enable/disable restore button based on backup selection (Requirement 16.4)
            $('#mase-backup-list').on('change', function() {
                var backupId = $(this).val();
                $('#mase-restore-backup').prop('disabled', !backupId);
            });
            
            // Load backup list on page load (Requirement 16.4)
            self.backupManager.loadBackupList();
        },
        
        /**
         * Initialize conditional field display
         * Shows/hides fields based on checkbox dependencies
         * Requirement 15.6: Show/hide auto palette time selectors based on toggle
         */
        initConditionalFields: function() {
            var self = this;
            
            // Handle auto palette switch toggle (Requirement 15.6)
            var $autoSwitchToggle = $('#advanced-auto-palette-switch');
            var $conditionalFields = $('.mase-conditional[data-depends-on="advanced-auto-palette-switch"]');
            
            // Function to toggle conditional fields
            function toggleConditionalFields() {
                if ($autoSwitchToggle.is(':checked')) {
                    $conditionalFields.show();
                } else {
                    $conditionalFields.hide();
                }
            }
            
            // Initialize on page load
            toggleConditionalFields();
            
            // Bind change event
            $autoSwitchToggle.on('change', toggleConditionalFields);
            
            // Handle other conditional fields generically
            $('[data-depends-on]').each(function() {
                var $field = $(this);
                var dependsOn = $field.data('depends-on');
                var $dependency = $('#' + dependsOn);
                
                if ($dependency.length) {
                    // Function to check dependency
                    function checkDependency() {
                        if ($dependency.is(':checkbox')) {
                            if ($dependency.is(':checked')) {
                                $field.show();
                            } else {
                                $field.hide();
                            }
                        }
                    }
                    
                    // Initialize
                    checkDependency();
                    
                    // Bind change event
                    $dependency.on('change', checkDependency);
                }
            });
        }

    };
    
    // Initialize on document ready
    $(document).ready(function() {
        MASE.init();
    });
    
})(jQuery);
