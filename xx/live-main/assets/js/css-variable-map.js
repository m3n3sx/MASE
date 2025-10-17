/**
 * 🗺️ CSS Variable Map - Centralized Mapping Configuration
 * 
 * Single source of truth for all option ID to CSS variable mappings.
 * This replaces scattered data-css-var attributes and hardcoded strings
 * with a unified, maintainable mapping system.
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Centralized Configuration
 */

(function(window) {
    'use strict';

    /**
     * 🎯 CSS_VARIABLE_MAP - Master Configuration Object
     * 
     * Structure:
     * {
     *   'option_id': {
     *     cssVar: '--woow-css-variable-name',
     *     type: 'color|numeric|boolean|string',
     *     unit: 'px|em|rem|%|s|ms', // for numeric types
     *     fallback: 'default-value',
     *     category: 'admin-bar|menu|typography|etc',
     *     description: 'Human readable description',
     *     aliases: ['alternative_option_id'], // optional
     *     deprecated: false // optional
     *   }
     * }
     */
    const CSS_VARIABLE_MAP = {
        // ========================================
        // 🎯 ADMIN BAR MAPPINGS
        // ========================================
        'admin_bar_background': {
            cssVar: '--woow-surface-bar',
            type: 'color',
            fallback: '#23282d',
            category: 'admin-bar',
            description: 'Admin bar background color'
        },
        'admin_bar_text_color': {
            cssVar: '--woow-surface-bar-text',
            type: 'color',
            fallback: '#ffffff',
            category: 'admin-bar',
            description: 'Admin bar text color'
        },
        'admin_bar_hover_color': {
            cssVar: '--woow-surface-bar-hover',
            type: 'color',
            fallback: '#6366f1',
            category: 'admin-bar',
            description: 'Admin bar hover text color'
        },
        'admin_bar_height': {
            cssVar: '--woow-surface-bar-height',
            type: 'numeric',
            unit: 'px',
            fallback: '32px',
            category: 'admin-bar',
            description: 'Admin bar height'
        },
        'admin_bar_font_size': {
            cssVar: '--woow-surface-bar-font-size',
            type: 'numeric',
            unit: 'px',
            fallback: '14px',
            category: 'admin-bar',
            description: 'Admin bar font size'
        },
        'admin_bar_padding': {
            cssVar: '--woow-surface-bar-padding',
            type: 'numeric',
            unit: 'px',
            fallback: '8px',
            category: 'admin-bar',
            description: 'Admin bar internal padding'
        },
        'admin_bar_margin_top': {
            cssVar: '--woow-space-bar-top',
            type: 'numeric',
            unit: 'px',
            fallback: '0px',
            category: 'admin-bar',
            description: 'Admin bar top margin'
        },
        'admin_bar_margin_left': {
            cssVar: '--woow-space-bar-left',
            type: 'numeric',
            unit: 'px',
            fallback: '0px',
            category: 'admin-bar',
            description: 'Admin bar left margin'
        },
        'admin_bar_margin_right': {
            cssVar: '--woow-space-bar-right',
            type: 'numeric',
            unit: 'px',
            fallback: '0px',
            category: 'admin-bar',
            description: 'Admin bar right margin'
        },
        'admin_bar_border_radius': {
            cssVar: '--woow-radius-bar',
            type: 'numeric',
            unit: 'px',
            fallback: '0px',
            category: 'admin-bar',
            description: 'Admin bar border radius'
        },
        'admin_bar_floating': {
            cssVar: '--woow-surface-bar-floating',
            type: 'boolean',
            fallback: '0',
            category: 'admin-bar',
            description: 'Enable floating admin bar mode'
        },
        'admin_bar_glassmorphism': {
            cssVar: '--woow-surface-bar-glass',
            type: 'boolean',
            fallback: '0',
            category: 'admin-bar',
            description: 'Enable glassmorphism effect for admin bar'
        },
        'admin_bar_blur': {
            cssVar: '--woow-surface-bar-blur',
            type: 'numeric',
            unit: 'px',
            fallback: '0px',
            category: 'admin-bar',
            description: 'Admin bar backdrop blur amount'
        },

        // Alternative admin bar naming (for compatibility)
        'wpadminbar_bg_color': {
            cssVar: '--woow-surface-bar',
            type: 'color',
            fallback: '#23282d',
            category: 'admin-bar',
            description: 'Admin bar background color (legacy)',
            aliases: ['admin_bar_background']
        },
        'wpadminbar_text_color': {
            cssVar: '--woow-surface-bar-text',
            type: 'color',
            fallback: '#ffffff',
            category: 'admin-bar',
            description: 'Admin bar text color (legacy)',
            aliases: ['admin_bar_text_color']
        },
        'wpadminbar_hover_color': {
            cssVar: '--woow-surface-bar-hover',
            type: 'color',
            fallback: '#6366f1',
            category: 'admin-bar',
            description: 'Admin bar hover color (legacy)',
            aliases: ['admin_bar_hover_color']
        },
        'wpadminbar_height': {
            cssVar: '--woow-surface-bar-height',
            type: 'numeric',
            unit: 'px',
            fallback: '32px',
            category: 'admin-bar',
            description: 'Admin bar height (legacy)',
            aliases: ['admin_bar_height']
        },
        'wpadminbar_floating': {
            cssVar: '--woow-surface-bar-floating',
            type: 'boolean',
            fallback: '0',
            category: 'admin-bar',
            description: 'Floating admin bar (legacy)',
            aliases: ['admin_bar_floating']
        },

        // ========================================
        // 📋 ADMIN MENU MAPPINGS
        // ========================================
        'menu_background': {
            cssVar: '--woow-surface-menu',
            type: 'color',
            fallback: '#ffffff',
            category: 'menu',
            description: 'Admin menu background color'
        },
        'menu_text_color': {
            cssVar: '--woow-surface-menu-text',
            type: 'color',
            fallback: '#1e293b',
            category: 'menu',
            description: 'Admin menu text color'
        },
        'menu_hover_color': {
            cssVar: '--woow-surface-menu-hover',
            type: 'color',
            fallback: '#6366f1',
            category: 'menu',
            description: 'Admin menu hover text color'
        },
        'menu_hover_background': {
            cssVar: '--woow-surface-menu-hover-bg',
            type: 'color',
            fallback: 'rgba(99, 102, 241, 0.1)',
            category: 'menu',
            description: 'Admin menu hover background color'
        },
        'menu_hover_text_color': {
            cssVar: '--woow-surface-menu-hover-text',
            type: 'color',
            fallback: '#6366f1',
            category: 'menu',
            description: 'Admin menu hover text color'
        },
        'menu_active_color': {
            cssVar: '--woow-surface-menu-active',
            type: 'color',
            fallback: '#6366f1',
            category: 'menu',
            description: 'Admin menu active item color'
        },
        'menu_active_background': {
            cssVar: '--woow-surface-menu-active-bg',
            type: 'color',
            fallback: 'rgba(99, 102, 241, 0.15)',
            category: 'menu',
            description: 'Admin menu active item background'
        },
        'menu_width': {
            cssVar: '--woow-surface-menu-width',
            type: 'numeric',
            unit: 'px',
            fallback: '160px',
            category: 'menu',
            description: 'Admin menu width'
        },
        'menu_border_radius': {
            cssVar: '--woow-radius-menu',
            type: 'numeric',
            unit: 'px',
            fallback: '0px',
            category: 'menu',
            description: 'Admin menu border radius'
        },
        'menu_padding': {
            cssVar: '--woow-surface-menu-padding',
            type: 'numeric',
            unit: 'px',
            fallback: '8px',
            category: 'menu',
            description: 'Admin menu item padding'
        },
        'menu_margin': {
            cssVar: '--woow-surface-menu-margin',
            type: 'numeric',
            unit: 'px',
            fallback: '10px',
            category: 'menu',
            description: 'Admin menu margin'
        },
        'menu_font_size': {
            cssVar: '--woow-surface-menu-font-size',
            type: 'numeric',
            unit: 'px',
            fallback: '14px',
            category: 'menu',
            description: 'Admin menu font size'
        },
        'menu_floating': {
            cssVar: '--woow-surface-menu-floating',
            type: 'boolean',
            fallback: '0',
            category: 'menu',
            description: 'Enable floating menu mode'
        },
        'menu_glassmorphism': {
            cssVar: '--woow-surface-menu-glass',
            type: 'boolean',
            fallback: '0',
            category: 'menu',
            description: 'Enable glassmorphism effect for menu'
        },
        'menu_compact_mode': {
            cssVar: '--woow-surface-menu-compact',
            type: 'boolean',
            fallback: '0',
            category: 'menu',
            description: 'Enable compact menu mode'
        },

        // Alternative menu naming
        'adminmenuwrap_floating': {
            cssVar: '--woow-surface-menu-floating',
            type: 'boolean',
            fallback: '0',
            category: 'menu',
            description: 'Floating menu (legacy)',
            aliases: ['menu_floating']
        },

        // ========================================
        // 📄 SUBMENU MAPPINGS
        // ========================================
        'submenu_background': {
            cssVar: '--woow-surface-submenu',
            type: 'color',
            fallback: '#f8fafc',
            category: 'submenu',
            description: 'Submenu background color'
        },
        'submenu_text_color': {
            cssVar: '--woow-surface-submenu-text',
            type: 'color',
            fallback: '#64748b',
            category: 'submenu',
            description: 'Submenu text color'
        },
        'submenu_hover_background': {
            cssVar: '--woow-surface-submenu-hover',
            type: 'color',
            fallback: 'rgba(99, 102, 241, 0.05)',
            category: 'submenu',
            description: 'Submenu hover background'
        },
        'submenu_hover_text_color': {
            cssVar: '--woow-surface-submenu-hover-text',
            type: 'color',
            fallback: '#6366f1',
            category: 'submenu',
            description: 'Submenu hover text color'
        },
        'submenu_active_background': {
            cssVar: '--woow-surface-submenu-active',
            type: 'color',
            fallback: 'rgba(99, 102, 241, 0.1)',
            category: 'submenu',
            description: 'Submenu active background'
        },
        'submenu_active_text_color': {
            cssVar: '--woow-surface-submenu-active-text',
            type: 'color',
            fallback: '#6366f1',
            category: 'submenu',
            description: 'Submenu active text color'
        },
        'submenu_separator': {
            cssVar: '--woow-surface-submenu-separator',
            type: 'boolean',
            fallback: '1',
            category: 'submenu',
            description: 'Show submenu separators'
        },
        'submenu_indent': {
            cssVar: '--woow-surface-submenu-indent',
            type: 'numeric',
            unit: 'px',
            fallback: '12px',
            category: 'submenu',
            description: 'Submenu indentation'
        },

        // ========================================
        // 🎨 TYPOGRAPHY MAPPINGS
        // ========================================
        'body_font': {
            cssVar: '--woow-font-family-base',
            type: 'string',
            fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            category: 'typography',
            description: 'Base font family'
        },
        'heading_font': {
            cssVar: '--woow-font-family-headings',
            type: 'string',
            fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            category: 'typography',
            description: 'Heading font family'
        },
        'mono_font': {
            cssVar: '--woow-font-mono',
            type: 'string',
            fallback: '"JetBrains Mono", "Fira Code", Consolas, monospace',
            category: 'typography',
            description: 'Monospace font family'
        },
        'global_font_size': {
            cssVar: '--woow-font-size-base',
            type: 'numeric',
            unit: 'rem',
            fallback: '1rem',
            category: 'typography',
            description: 'Base font size'
        },
        'global_line_height': {
            cssVar: '--woow-line-height-base',
            type: 'numeric',
            fallback: '1.6',
            category: 'typography',
            description: 'Base line height'
        },
        'headings_scale': {
            cssVar: '--woow-headings-scale',
            type: 'numeric',
            fallback: '1.25',
            category: 'typography',
            description: 'Heading size scale ratio'
        },
        'headings_weight': {
            cssVar: '--woow-headings-weight',
            type: 'numeric',
            fallback: '600',
            category: 'typography',
            description: 'Heading font weight'
        },
        'headings_spacing': {
            cssVar: '--woow-headings-spacing',
            type: 'numeric',
            unit: 'em',
            fallback: '0.5em',
            category: 'typography',
            description: 'Heading bottom margin'
        },

        // ========================================
        // 🌈 COLOR SYSTEM MAPPINGS
        // ========================================
        'primary_color': {
            cssVar: '--woow-accent-primary',
            type: 'color',
            fallback: '#6366f1',
            category: 'color',
            description: 'Primary accent color'
        },
        'primary_hover_color': {
            cssVar: '--woow-accent-primary-hover',
            type: 'color',
            fallback: '#4f46e5',
            category: 'color',
            description: 'Primary color hover state'
        },
        'secondary_color': {
            cssVar: '--woow-accent-secondary',
            type: 'color',
            fallback: '#ec4899',
            category: 'color',
            description: 'Secondary accent color'
        },
        'tertiary_color': {
            cssVar: '--woow-accent-tertiary',
            type: 'color',
            fallback: '#06b6d4',
            category: 'color',
            description: 'Tertiary accent color'
        },
        'success_color': {
            cssVar: '--woow-accent-success',
            type: 'color',
            fallback: '#10b981',
            category: 'color',
            description: 'Success state color'
        },
        'warning_color': {
            cssVar: '--woow-accent-warning',
            type: 'color',
            fallback: '#f59e0b',
            category: 'color',
            description: 'Warning state color'
        },
        'error_color': {
            cssVar: '--woow-accent-error',
            type: 'color',
            fallback: '#ef4444',
            category: 'color',
            description: 'Error state color'
        },
        'content_background': {
            cssVar: '--woow-bg-primary',
            type: 'color',
            fallback: '#ffffff',
            category: 'color',
            description: 'Primary background color'
        },
        'content_background_secondary': {
            cssVar: '--woow-bg-secondary',
            type: 'color',
            fallback: '#f8fafc',
            category: 'color',
            description: 'Secondary background color'
        },
        'content_background_tertiary': {
            cssVar: '--woow-bg-tertiary',
            type: 'color',
            fallback: '#e2e8f0',
            category: 'color',
            description: 'Tertiary background color'
        },
        'content_text_color': {
            cssVar: '--woow-text-primary',
            type: 'color',
            fallback: '#1e293b',
            category: 'color',
            description: 'Primary text color'
        },
        'content_text_secondary': {
            cssVar: '--woow-text-secondary',
            type: 'color',
            fallback: '#64748b',
            category: 'color',
            description: 'Secondary text color'
        },
        'content_text_tertiary': {
            cssVar: '--woow-text-tertiary',
            type: 'color',
            fallback: '#94a3b8',
            category: 'color',
            description: 'Tertiary text color'
        },
        'link_color': {
            cssVar: '--woow-text-link',
            type: 'color',
            fallback: '#0073aa',
            category: 'color',
            description: 'Link color'
        },
        'link_hover_color': {
            cssVar: '--woow-text-link-hover',
            type: 'color',
            fallback: '#005a87',
            category: 'color',
            description: 'Link hover color'
        },

        // ========================================
        // 📦 POSTBOX MAPPINGS
        // ========================================
        'postbox_bg_color': {
            cssVar: '--woow-bg-card',
            type: 'color',
            fallback: '#ffffff',
            category: 'postbox',
            description: 'Postbox background color'
        },
        'postbox_border_color': {
            cssVar: '--woow-border-primary',
            type: 'color',
            fallback: '#e2e8f0',
            category: 'postbox',
            description: 'Postbox border color'
        },
        'postbox_title_color': {
            cssVar: '--woow-postbox-title',
            type: 'color',
            fallback: '#1e293b',
            category: 'postbox',
            description: 'Postbox title color'
        },
        'postbox_text_color': {
            cssVar: '--woow-postbox-text',
            type: 'color',
            fallback: '#64748b',
            category: 'postbox',
            description: 'Postbox text color'
        },
        'postbox_radius': {
            cssVar: '--woow-radius-card',
            type: 'numeric',
            unit: 'px',
            fallback: '8px',
            category: 'postbox',
            description: 'Postbox border radius'
        },
        'postbox_padding': {
            cssVar: '--woow-postbox-padding',
            type: 'numeric',
            unit: 'px',
            fallback: '16px',
            category: 'postbox',
            description: 'Postbox internal padding'
        },
        'postbox_margin': {
            cssVar: '--woow-postbox-margin',
            type: 'numeric',
            unit: 'px',
            fallback: '16px',
            category: 'postbox',
            description: 'Postbox margin'
        },
        'postbox_shadow': {
            cssVar: '--woow-shadow-card',
            type: 'string',
            fallback: '0 1px 3px rgba(0, 0, 0, 0.1)',
            category: 'postbox',
            description: 'Postbox shadow'
        },
        'postbox_shadow_hover': {
            cssVar: '--woow-shadow-card-hover',
            type: 'string',
            fallback: '0 4px 12px rgba(0, 0, 0, 0.15)',
            category: 'postbox',
            description: 'Postbox hover shadow'
        },

        // ========================================
        // 📐 LAYOUT & DIMENSIONS MAPPINGS
        // ========================================
        'content_padding': {
            cssVar: '--woow-content-padding',
            type: 'numeric',
            unit: 'px',
            fallback: '20px',
            category: 'layout',
            description: 'Content area padding'
        },
        'content_max_width': {
            cssVar: '--woow-content-max-width',
            type: 'numeric',
            unit: 'px',
            fallback: '1200px',
            category: 'layout',
            description: 'Content maximum width'
        },
        'content_border_radius': {
            cssVar: '--woow-content-radius',
            type: 'numeric',
            unit: 'px',
            fallback: '8px',
            category: 'layout',
            description: 'Content border radius'
        },

        // ========================================
        // 📏 SPACING SYSTEM MAPPINGS
        // ========================================
        'space_xs': {
            cssVar: '--woow-space-xs',
            type: 'numeric',
            unit: 'rem',
            fallback: '0.25rem',
            category: 'spacing',
            description: 'Extra small spacing'
        },
        'space_sm': {
            cssVar: '--woow-space-sm',
            type: 'numeric',
            unit: 'rem',
            fallback: '0.5rem',
            category: 'spacing',
            description: 'Small spacing'
        },
        'space_md': {
            cssVar: '--woow-space-md',
            type: 'numeric',
            unit: 'rem',
            fallback: '0.75rem',
            category: 'spacing',
            description: 'Medium spacing'
        },
        'space_lg': {
            cssVar: '--woow-space-lg',
            type: 'numeric',
            unit: 'rem',
            fallback: '1rem',
            category: 'spacing',
            description: 'Large spacing'
        },
        'space_xl': {
            cssVar: '--woow-space-xl',
            type: 'numeric',
            unit: 'rem',
            fallback: '1.25rem',
            category: 'spacing',
            description: 'Extra large spacing'
        },
        'space_2xl': {
            cssVar: '--woow-space-2xl',
            type: 'numeric',
            unit: 'rem',
            fallback: '1.5rem',
            category: 'spacing',
            description: '2X large spacing'
        },
        'space_3xl': {
            cssVar: '--woow-space-3xl',
            type: 'numeric',
            unit: 'rem',
            fallback: '2rem',
            category: 'spacing',
            description: '3X large spacing'
        },

        // ========================================
        // 🔘 BORDER RADIUS MAPPINGS
        // ========================================
        'radius_sm': {
            cssVar: '--woow-radius-sm',
            type: 'numeric',
            unit: 'rem',
            fallback: '0.375rem',
            category: 'border',
            description: 'Small border radius'
        },
        'radius_md': {
            cssVar: '--woow-radius-md',
            type: 'numeric',
            unit: 'rem',
            fallback: '0.5rem',
            category: 'border',
            description: 'Medium border radius'
        },
        'radius_lg': {
            cssVar: '--woow-radius-lg',
            type: 'numeric',
            unit: 'rem',
            fallback: '0.75rem',
            category: 'border',
            description: 'Large border radius'
        },
        'radius_xl': {
            cssVar: '--woow-radius-xl',
            type: 'numeric',
            unit: 'rem',
            fallback: '1rem',
            category: 'border',
            description: 'Extra large border radius'
        },
        'radius_2xl': {
            cssVar: '--woow-radius-2xl',
            type: 'numeric',
            unit: 'rem',
            fallback: '1.5rem',
            category: 'border',
            description: '2X large border radius'
        },
        'radius_full': {
            cssVar: '--woow-radius-full',
            type: 'numeric',
            unit: 'px',
            fallback: '9999px',
            category: 'border',
            description: 'Full border radius (circular)'
        },

        // ========================================
        // 🌫️ SHADOW MAPPINGS
        // ========================================
        'shadow_sm': {
            cssVar: '--woow-shadow-sm',
            type: 'string',
            fallback: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            category: 'shadow',
            description: 'Small shadow'
        },
        'shadow_md': {
            cssVar: '--woow-shadow-md',
            type: 'string',
            fallback: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            category: 'shadow',
            description: 'Medium shadow'
        },
        'shadow_lg': {
            cssVar: '--woow-shadow-lg',
            type: 'string',
            fallback: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            category: 'shadow',
            description: 'Large shadow'
        },
        'shadow_xl': {
            cssVar: '--woow-shadow-xl',
            type: 'string',
            fallback: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            category: 'shadow',
            description: 'Extra large shadow'
        },
        'shadow_2xl': {
            cssVar: '--woow-shadow-2xl',
            type: 'string',
            fallback: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            category: 'shadow',
            description: '2X large shadow'
        },
        'shadow_inner': {
            cssVar: '--woow-shadow-inner',
            type: 'string',
            fallback: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            category: 'shadow',
            description: 'Inner shadow'
        },

        // ========================================
        // ✨ EFFECTS & ANIMATIONS MAPPINGS
        // ========================================
        'transition_fast': {
            cssVar: '--woow-transition-fast',
            type: 'string',
            fallback: '0.15s ease',
            category: 'animation',
            description: 'Fast transition'
        },
        'transition_normal': {
            cssVar: '--woow-transition-normal',
            type: 'string',
            fallback: '0.3s ease',
            category: 'animation',
            description: 'Normal transition'
        },
        'transition_slow': {
            cssVar: '--woow-transition-slow',
            type: 'string',
            fallback: '0.5s ease',
            category: 'animation',
            description: 'Slow transition'
        },
        'blur_sm': {
            cssVar: '--woow-blur-sm',
            type: 'string',
            fallback: 'blur(4px)',
            category: 'effect',
            description: 'Small blur effect'
        },
        'blur_md': {
            cssVar: '--woow-blur-md',
            type: 'string',
            fallback: 'blur(8px)',
            category: 'effect',
            description: 'Medium blur effect'
        },
        'blur_lg': {
            cssVar: '--woow-blur-lg',
            type: 'string',
            fallback: 'blur(16px)',
            category: 'effect',
            description: 'Large blur effect'
        },
        'blur_xl': {
            cssVar: '--woow-blur-xl',
            type: 'string',
            fallback: 'blur(24px)',
            category: 'effect',
            description: 'Extra large blur effect'
        },

        // ========================================
        // 🏗️ Z-INDEX MAPPINGS
        // ========================================
        'z_base': {
            cssVar: '--woow-z-base',
            type: 'numeric',
            fallback: '1',
            category: 'z-index',
            description: 'Base z-index'
        },
        'z_dropdown': {
            cssVar: '--woow-z-dropdown',
            type: 'numeric',
            fallback: '10',
            category: 'z-index',
            description: 'Dropdown z-index'
        },
        'z_sticky': {
            cssVar: '--woow-z-sticky',
            type: 'numeric',
            fallback: '20',
            category: 'z-index',
            description: 'Sticky element z-index'
        },
        'z_fixed': {
            cssVar: '--woow-z-fixed',
            type: 'numeric',
            fallback: '30',
            category: 'z-index',
            description: 'Fixed element z-index'
        },
        'z_modal_backdrop': {
            cssVar: '--woow-z-modal-backdrop',
            type: 'numeric',
            fallback: '40',
            category: 'z-index',
            description: 'Modal backdrop z-index'
        },
        'z_modal': {
            cssVar: '--woow-z-modal',
            type: 'numeric',
            fallback: '50',
            category: 'z-index',
            description: 'Modal z-index'
        },
        'z_panel': {
            cssVar: '--woow-z-panel',
            type: 'numeric',
            fallback: '999999',
            category: 'z-index',
            description: 'Panel z-index'
        },
        'z_toast': {
            cssVar: '--woow-z-toast',
            type: 'numeric',
            fallback: '1000000',
            category: 'z-index',
            description: 'Toast notification z-index'
        },

        // ========================================
        // 🦶 FOOTER MAPPINGS
        // ========================================
        'footer_bg': {
            cssVar: '--woow-surface-footer',
            type: 'color',
            fallback: '#f8fafc',
            category: 'footer',
            description: 'Footer background color'
        },
        'footer_text': {
            cssVar: '--woow-surface-footer-text',
            type: 'color',
            fallback: '#64748b',
            category: 'footer',
            description: 'Footer text color'
        },
        'footer_padding': {
            cssVar: '--woow-surface-footer-padding',
            type: 'numeric',
            unit: 'px',
            fallback: '16px',
            category: 'footer',
            description: 'Footer padding'
        },

        // ========================================
        // 🌟 GLASSMORPHISM MAPPINGS
        // ========================================
        'glass_bg': {
            cssVar: '--woow-glass-bg',
            type: 'string',
            fallback: 'rgba(255, 255, 255, 0.08)',
            category: 'effect',
            description: 'Glassmorphism background'
        },
        'glass_border': {
            cssVar: '--woow-glass-border',
            type: 'string',
            fallback: 'rgba(255, 255, 255, 0.2)',
            category: 'effect',
            description: 'Glassmorphism border'
        },
        'glass_shadow': {
            cssVar: '--woow-glass-shadow',
            type: 'string',
            fallback: '0 8px 32px rgba(31, 38, 135, 0.37)',
            category: 'effect',
            description: 'Glassmorphism shadow'
        },
        'glass_hover': {
            cssVar: '--woow-glass-hover',
            type: 'string',
            fallback: 'rgba(255, 255, 255, 0.12)',
            category: 'effect',
            description: 'Glassmorphism hover state'
        }
    };

    /**
     * 🏷️ BODY_CLASS_MAP - Body Class Mappings
     * 
     * Maps option IDs to body classes for boolean toggles
     */
    const BODY_CLASS_MAP = {
        'admin_bar_floating': 'woow-admin-bar-floating',
        'admin_bar_glassmorphism': 'woow-admin-bar-glassmorphism',
        'admin_bar_shadow': 'woow-admin-bar-shadow',
        'admin_bar_gradient': 'woow-admin-bar-gradient',
        'wpadminbar_floating': 'woow-admin-bar-floating',
        'wpadminbar_glassmorphism': 'woow-admin-bar-glassmorphism',
        
        'menu_floating': 'woow-menu-floating',
        'menu_glassmorphism': 'woow-menu-glassmorphism',
        'menu_compact_mode': 'woow-menu-compact',
        'adminmenuwrap_floating': 'woow-menu-floating',
        
        'postbox_glassmorphism': 'woow-postbox-glassmorphism',
        'postbox_hover_lift': 'woow-postbox-hover-lift',
        'postbox_shadow': 'woow-postbox-shadow',
        'postbox_3d_hover': 'woow-postbox-3d-hover',
        
        'performance_mode': 'woow-performance-mode',
        'enable_animations': 'woow-animations-enabled',
        'hardware_acceleration': 'woow-hardware-acceleration',
        'dark_mode': 'woow-dark-mode',
        'high_contrast': 'woow-high-contrast',
        'reduced_motion': 'woow-reduced-motion'
    };

    /**
     * 👁️ VISIBILITY_MAP - Element Visibility Mappings
     * 
     * Maps option IDs to CSS selectors for show/hide functionality
     */
    const VISIBILITY_MAP = {
        'hide_wp_logo': '#wp-admin-bar-wp-logo',
        'hide_howdy': '#wp-admin-bar-my-account .display-name',
        'hide_update_notices': '#wp-admin-bar-updates',
        'hide_comments': '#wp-admin-bar-comments',
        'hide_help_tab': '#contextual-help-link-wrap',
        'hide_screen_options': '#screen-options-link-wrap',
        'hide_footer': '#wpfooter',
        'hide_version': '#footer-thankyou',
        'wpfooter_hide_version': '#wpfooter .alignright',
        'wpfooter_hide_thanks': '#wpfooter .alignleft',
        'hide_admin_notices': '.notice, .error, .updated',
        'hide_welcome_panel': '.welcome-panel'
    };

    /**
     * 🔧 SPECIAL_HANDLERS_MAP - Special Case Handlers
     * 
     * Maps option IDs to special handling functions
     */
    const SPECIAL_HANDLERS_MAP = {
        'color_scheme': 'handleColorScheme',
        'admin_bar_background': 'handleAdminBarBackground',
        'wpadminbar_bg_color': 'handleAdminBarBackground',
        'menu_width': 'handleMenuWidth',
        'theme_mode': 'handleThemeMode'
    };

    // Make all maps globally available
    window.CSS_VARIABLE_MAP = CSS_VARIABLE_MAP;
    window.BODY_CLASS_MAP = BODY_CLASS_MAP;
    window.VISIBILITY_MAP = VISIBILITY_MAP;
    window.SPECIAL_HANDLERS_MAP = SPECIAL_HANDLERS_MAP;

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            CSS_VARIABLE_MAP,
            BODY_CLASS_MAP,
            VISIBILITY_MAP,
            SPECIAL_HANDLERS_MAP
        };
    }

})(window);