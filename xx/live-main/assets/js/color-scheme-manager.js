/**
 * 🎨 Color Scheme Manager - Advanced Color Management System
 * 
 * Features:
 * - Predefined color schemes (Material Design, Bootstrap, Custom)
 * - Automatic harmonious color generation
 * - Color theory algorithms (complementary, triadic, analogous)
 * - Accessibility compliance checking
 * - Real-time color preview and application
 * 
 * @package ModernAdminStyler
 * @version 1.0.0 - Task 2.2 Implementation
 * @author Kiro AI Assistant
 */

(function(window, document) {
    'use strict';

    /**
     * 🎨 ColorSchemeManager - Main Color Scheme Management Class
     */
    class ColorSchemeManager {
        constructor(cssEngine, options = {}) {
            this.cssEngine = cssEngine;
            this.config = {
                enableAccessibilityCheck: true,
                enableAutoGeneration: true,
                enablePreviewMode: true,
                debugMode: options.debug || false,
                ...options
            };

            // Core systems
            this.colorTheory = new ColorTheoryEngine();
            this.accessibilityChecker = new AccessibilityChecker();
            this.schemeGenerator = new HarmoniousColorGenerator(this.colorTheory);
            
            // Predefined schemes
            this.predefinedSchemes = new Map();
            this.customSchemes = new Map();
            this.activeScheme = null;
            
            // Color mapping for WordPress admin
            this.colorMappings = this.initializeColorMappings();
            
            this.initialize();
        }

        /**
         * 🔧 Initialize the Color Scheme Manager
         */
        async initialize() {
            try {
                this.log('🎨 Initializing Color Scheme Manager...');
                
                // Load predefined schemes
                this.loadPredefinedSchemes();
                
                // Load custom schemes from storage
                await this.loadCustomSchemes();
                
                // Set up event listeners
                this.setupEventListeners();
                
                this.log('✅ Color Scheme Manager initialized successfully');
                
                // Trigger initialization event
                this.dispatchEvent('color-scheme-manager:initialized', {
                    manager: this,
                    predefinedCount: this.predefinedSchemes.size,
                    customCount: this.customSchemes.size
                });
                
            } catch (error) {
                this.logError('❌ Failed to initialize Color Scheme Manager:', error);
                throw error;
            }
        }

        /**
         * 🗺️ Initialize color mappings for WordPress admin elements
         */
        initializeColorMappings() {
            return {
                // Primary colors
                primary: '--woow-accent-primary',
                secondary: '--woow-accent-secondary',
                
                // Surface colors
                adminBar: '--woow-surface-bar',
                adminBarText: '--woow-surface-bar-text',
                adminBarHover: '--woow-surface-bar-hover',
                adminMenu: '--woow-surface-menu',
                adminMenuText: '--woow-surface-menu-text',
                adminMenuHover: '--woow-surface-menu-hover',
                
                // Background colors
                primaryBg: '--woow-bg-primary',
                secondaryBg: '--woow-bg-secondary',
                
                // Text colors
                primaryText: '--woow-text-primary',
                secondaryText: '--woow-text-secondary',
                inverseText: '--woow-text-inverse',
                
                // State colors
                success: '--woow-accent-success',
                warning: '--woow-accent-warning',
                error: '--woow-accent-error'
            };
        }

        /**
         * 📚 Load predefined color schemes
         */
        loadPredefinedSchemes() {
            // Material Design Scheme
            this.predefinedSchemes.set('material-design', {
                name: 'Material Design',
                description: 'Google Material Design color palette',
                category: 'modern',
                colors: {
                    primary: '#1976D2',
                    secondary: '#DC004E',
                    adminBar: '#1976D2',
                    adminBarText: '#FFFFFF',
                    adminBarHover: '#1565C0',
                    adminMenu: '#FAFAFA',
                    adminMenuText: '#212121',
                    adminMenuHover: '#E3F2FD',
                    primaryBg: '#FFFFFF',
                    secondaryBg: '#F5F5F5',
                    primaryText: '#212121',
                    secondaryText: '#757575',
                    inverseText: '#FFFFFF',
                    success: '#4CAF50',
                    warning: '#FF9800',
                    error: '#F44336'
                },
                accessibility: {
                    wcagLevel: 'AA',
                    contrastRatio: 4.5
                }
            });

            // Bootstrap Scheme
            this.predefinedSchemes.set('bootstrap', {
                name: 'Bootstrap',
                description: 'Bootstrap framework color scheme',
                category: 'framework',
                colors: {
                    primary: '#007BFF',
                    secondary: '#6C757D',
                    adminBar: '#343A40',
                    adminBarText: '#FFFFFF',
                    adminBarHover: '#007BFF',
                    adminMenu: '#F8F9FA',
                    adminMenuText: '#495057',
                    adminMenuHover: '#E9ECEF',
                    primaryBg: '#FFFFFF',
                    secondaryBg: '#F8F9FA',
                    primaryText: '#212529',
                    secondaryText: '#6C757D',
                    inverseText: '#FFFFFF',
                    success: '#28A745',
                    warning: '#FFC107',
                    error: '#DC3545'
                },
                accessibility: {
                    wcagLevel: 'AA',
                    contrastRatio: 4.5
                }
            });

            // WordPress Classic
            this.predefinedSchemes.set('wordpress-classic', {
                name: 'WordPress Classic',
                description: 'Traditional WordPress admin colors',
                category: 'classic',
                colors: {
                    primary: '#0073AA',
                    secondary: '#00A32A',
                    adminBar: '#23282D',
                    adminBarText: '#FFFFFF',
                    adminBarHover: '#0073AA',
                    adminMenu: '#23282D',
                    adminMenuText: '#FFFFFF',
                    adminMenuHover: '#0073AA',
                    primaryBg: '#FFFFFF',
                    secondaryBg: '#F1F1F1',
                    primaryText: '#23282D',
                    secondaryText: '#666666',
                    inverseText: '#FFFFFF',
                    success: '#00A32A',
                    warning: '#DBA617',
                    error: '#D63638'
                },
                accessibility: {
                    wcagLevel: 'AA',
                    contrastRatio: 4.5
                }
            });

            // Dark Mode
            this.predefinedSchemes.set('dark-mode', {
                name: 'Dark Mode',
                description: 'Modern dark theme for reduced eye strain',
                category: 'dark',
                colors: {
                    primary: '#BB86FC',
                    secondary: '#03DAC6',
                    adminBar: '#121212',
                    adminBarText: '#FFFFFF',
                    adminBarHover: '#BB86FC',
                    adminMenu: '#1E1E1E',
                    adminMenuText: '#E0E0E0',
                    adminMenuHover: '#2D2D2D',
                    primaryBg: '#121212',
                    secondaryBg: '#1E1E1E',
                    primaryText: '#FFFFFF',
                    secondaryText: '#B0B0B0',
                    inverseText: '#000000',
                    success: '#4CAF50',
                    warning: '#FF9800',
                    error: '#CF6679'
                },
                accessibility: {
                    wcagLevel: 'AA',
                    contrastRatio: 4.5
                }
            });

            // High Contrast
            this.predefinedSchemes.set('high-contrast', {
                name: 'High Contrast',
                description: 'Maximum contrast for accessibility',
                category: 'accessibility',
                colors: {
                    primary: '#000000',
                    secondary: '#FFFFFF',
                    adminBar: '#000000',
                    adminBarText: '#FFFFFF',
                    adminBarHover: '#333333',
                    adminMenu: '#FFFFFF',
                    adminMenuText: '#000000',
                    adminMenuHover: '#F0F0F0',
                    primaryBg: '#FFFFFF',
                    secondaryBg: '#F8F8F8',
                    primaryText: '#000000',
                    secondaryText: '#333333',
                    inverseText: '#FFFFFF',
                    success: '#008000',
                    warning: '#FF8C00',
                    error: '#FF0000'
                },
                accessibility: {
                    wcagLevel: 'AAA',
                    contrastRatio: 7.0
                }
            });

            this.log(`📚 Loaded ${this.predefinedSchemes.size} predefined color schemes`);
        }

        /**
         * 💾 Load custom schemes from storage
         */
        async loadCustomSchemes() {
            try {
                const stored = localStorage.getItem('woow-custom-color-schemes');
                if (stored) {
                    const schemes = JSON.parse(stored);
                    Object.entries(schemes).forEach(([id, scheme]) => {
                        this.customSchemes.set(id, scheme);
                    });
                    this.log(`💾 Loaded ${this.customSchemes.size} custom color schemes`);
                }
            } catch (error) {
                this.logError('Failed to load custom schemes:', error);
            }
        }

        /**
         * 💾 Save custom schemes to storage
         */
        async saveCustomSchemes() {
            try {
                const schemes = {};
                this.customSchemes.forEach((scheme, id) => {
                    schemes[id] = scheme;
                });
                localStorage.setItem('woow-custom-color-schemes', JSON.stringify(schemes));
                this.log('💾 Custom schemes saved to storage');
            } catch (error) {
                this.logError('Failed to save custom schemes:', error);
            }
        }

        /**
         * 🎨 Apply color scheme
         */
        async applyScheme(schemeId, options = {}) {
            try {
                const scheme = this.getScheme(schemeId);
                if (!scheme) {
                    throw new Error(`Color scheme not found: ${schemeId}`);
                }

                this.log(`🎨 Applying color scheme: ${scheme.name}`);

                // Check accessibility if enabled
                if (this.config.enableAccessibilityCheck && !options.skipAccessibilityCheck) {
                    const accessibilityResult = await this.checkSchemeAccessibility(scheme);
                    if (!accessibilityResult.passed) {
                        this.log(`⚠️ Accessibility warning for scheme ${scheme.name}:`, accessibilityResult.issues);
                    }
                }

                // Apply colors to CSS variables
                const updates = [];
                Object.entries(scheme.colors).forEach(([colorKey, colorValue]) => {
                    const cssVar = this.colorMappings[colorKey];
                    if (cssVar) {
                        // Find the option ID that maps to this CSS variable
                        const optionId = this.findOptionIdForCSSVar(cssVar);
                        if (optionId) {
                            updates.push({
                                optionId,
                                value: colorValue,
                                options: { source: 'color-scheme', schemeId }
                            });
                        }
                    }
                });

                // Apply all updates in batch
                const result = await this.cssEngine.batchUpdate(updates);
                
                if (result.success) {
                    this.activeScheme = schemeId;
                    this.log(`✅ Color scheme applied successfully: ${scheme.name}`);
                    
                    // Trigger scheme change event
                    this.dispatchEvent('color-scheme:applied', {
                        schemeId,
                        scheme,
                        result
                    });
                } else {
                    throw new Error(`Failed to apply color scheme: ${result.error}`);
                }

                return result;

            } catch (error) {
                this.logError(`❌ Failed to apply color scheme ${schemeId}:`, error);
                throw error;
            }
        }

        /**
         * 🔍 Find option ID for CSS variable
         */
        findOptionIdForCSSVar(cssVar) {
            // This would typically come from the CSS engine's mapping registry
            const mappings = {
                '--woow-accent-primary': 'primary_color',
                '--woow-accent-secondary': 'secondary_color',
                '--woow-surface-bar': 'admin_bar_background',
                '--woow-surface-bar-text': 'admin_bar_text_color',
                '--woow-surface-bar-hover': 'admin_bar_hover_color',
                '--woow-surface-menu': 'menu_background',
                '--woow-surface-menu-text': 'menu_text_color',
                '--woow-surface-menu-hover': 'menu_hover_color',
                '--woow-bg-primary': 'content_background',
                '--woow-text-primary': 'content_text_color',
                '--woow-accent-success': 'success_color',
                '--woow-accent-warning': 'warning_color',
                '--woow-accent-error': 'error_color'
            };
            
            return mappings[cssVar];
        }

        /**
         * 🎨 Generate harmonious color scheme
         */
        async generateHarmoniousScheme(baseColor, harmonyType = 'complementary', options = {}) {
            try {
                const generatedColors = this.schemeGenerator.generateHarmony(baseColor, harmonyType, options);
                
                const scheme = {
                    name: options.name || `Generated ${harmonyType} scheme`,
                    description: `Auto-generated ${harmonyType} color harmony from ${baseColor}`,
                    category: 'generated',
                    generated: true,
                    baseColor,
                    harmonyType,
                    colors: this.mapGeneratedColors(generatedColors),
                    accessibility: await this.calculateAccessibilityMetrics(generatedColors)
                };

                // Save as custom scheme if requested
                if (options.save) {
                    const schemeId = options.id || this.generateSchemeId();
                    this.customSchemes.set(schemeId, scheme);
                    await this.saveCustomSchemes();
                    
                    this.log(`🎨 Generated and saved harmonious scheme: ${scheme.name}`);
                    return { schemeId, scheme };
                }

                return { scheme };

            } catch (error) {
                this.logError('Failed to generate harmonious scheme:', error);
                throw error;
            }
        }

        /**
         * 🗺️ Map generated colors to admin elements
         */
        mapGeneratedColors(generatedColors) {
            const [primary, secondary, accent1, accent2, accent3] = generatedColors;
            
            return {
                primary: primary,
                secondary: secondary || this.colorTheory.adjustBrightness(primary, -20),
                adminBar: primary,
                adminBarText: this.colorTheory.getContrastColor(primary),
                adminBarHover: accent1 || this.colorTheory.adjustBrightness(primary, 10),
                adminMenu: this.colorTheory.adjustBrightness(primary, 90),
                adminMenuText: this.colorTheory.adjustBrightness(primary, -80),
                adminMenuHover: this.colorTheory.adjustBrightness(primary, 80),
                primaryBg: '#FFFFFF',
                secondaryBg: this.colorTheory.adjustBrightness(primary, 95),
                primaryText: '#333333',
                secondaryText: '#666666',
                inverseText: '#FFFFFF',
                success: accent2 || '#4CAF50',
                warning: accent3 || '#FF9800',
                error: this.colorTheory.adjustHue(primary, 180) // Complementary for error
            };
        }

        /**
         * ♿ Check scheme accessibility
         */
        async checkSchemeAccessibility(scheme) {
            const issues = [];
            const checks = [];

            // Check contrast ratios
            const contrastChecks = [
                { fg: scheme.colors.adminBarText, bg: scheme.colors.adminBar, element: 'Admin Bar' },
                { fg: scheme.colors.adminMenuText, bg: scheme.colors.adminMenu, element: 'Admin Menu' },
                { fg: scheme.colors.primaryText, bg: scheme.colors.primaryBg, element: 'Main Content' },
                { fg: scheme.colors.secondaryText, bg: scheme.colors.secondaryBg, element: 'Secondary Content' }
            ];

            for (const check of contrastChecks) {
                const ratio = this.accessibilityChecker.calculateContrastRatio(check.fg, check.bg);
                const passed = ratio >= 4.5; // WCAG AA standard
                
                checks.push({
                    element: check.element,
                    ratio,
                    passed,
                    level: ratio >= 7.0 ? 'AAA' : (ratio >= 4.5 ? 'AA' : 'Fail')
                });

                if (!passed) {
                    issues.push(`${check.element}: Contrast ratio ${ratio.toFixed(2)} is below WCAG AA standard (4.5)`);
                }
            }

            return {
                passed: issues.length === 0,
                issues,
                checks,
                overallLevel: checks.every(c => c.ratio >= 7.0) ? 'AAA' : 
                             (checks.every(c => c.ratio >= 4.5) ? 'AA' : 'Fail')
            };
        }

        /**
         * 📊 Calculate accessibility metrics for generated colors
         */
        async calculateAccessibilityMetrics(colors) {
            // This is a simplified version - in practice you'd check all color combinations
            const primaryContrast = this.accessibilityChecker.calculateContrastRatio(colors[0], '#FFFFFF');
            
            return {
                wcagLevel: primaryContrast >= 7.0 ? 'AAA' : (primaryContrast >= 4.5 ? 'AA' : 'Fail'),
                contrastRatio: primaryContrast
            };
        }

        /**
         * 📋 Get all available schemes
         */
        getAllSchemes() {
            const schemes = new Map();
            
            // Add predefined schemes
            this.predefinedSchemes.forEach((scheme, id) => {
                schemes.set(id, { ...scheme, type: 'predefined' });
            });
            
            // Add custom schemes
            this.customSchemes.forEach((scheme, id) => {
                schemes.set(id, { ...scheme, type: 'custom' });
            });
            
            return schemes;
        }

        /**
         * 🔍 Get specific scheme
         */
        getScheme(schemeId) {
            return this.predefinedSchemes.get(schemeId) || this.customSchemes.get(schemeId);
        }

        /**
         * 💾 Save custom scheme
         */
        async saveScheme(schemeId, scheme) {
            this.customSchemes.set(schemeId, {
                ...scheme,
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            });
            
            await this.saveCustomSchemes();
            
            this.dispatchEvent('color-scheme:saved', { schemeId, scheme });
            this.log(`💾 Saved custom scheme: ${scheme.name}`);
        }

        /**
         * 🗑️ Delete custom scheme
         */
        async deleteScheme(schemeId) {
            if (this.customSchemes.has(schemeId)) {
                const scheme = this.customSchemes.get(schemeId);
                this.customSchemes.delete(schemeId);
                await this.saveCustomSchemes();
                
                this.dispatchEvent('color-scheme:deleted', { schemeId, scheme });
                this.log(`🗑️ Deleted custom scheme: ${scheme.name}`);
                return true;
            }
            return false;
        }

        /**
         * 🔧 Setup event listeners
         */
        setupEventListeners() {
            // Listen for CSS variable changes to update active scheme
            document.addEventListener('css-variable:changed', (event) => {
                if (event.detail.source !== 'color-scheme') {
                    // Variable changed outside of scheme application
                    this.activeScheme = null;
                }
            });
        }

        /**
         * 🆔 Generate unique scheme ID
         */
        generateSchemeId() {
            return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        /**
         * 🔧 Utility methods
         */
        dispatchEvent(eventName, detail) {
            const event = new CustomEvent(eventName, { detail });
            document.dispatchEvent(event);
        }

        log(message, ...args) {
            if (this.config.debugMode) {
                console.log(`🎨 ColorSchemeManager: ${message}`, ...args);
            }
        }

        logError(message, ...args) {
            console.error(`❌ ColorSchemeManager: ${message}`, ...args);
        }
    }

    /**
     * 🎨 Color Theory Engine - Color manipulation and harmony generation
     */
    class ColorTheoryEngine {
        constructor() {
            this.harmonyTypes = {
                'complementary': this.generateComplementary.bind(this),
                'triadic': this.generateTriadic.bind(this),
                'analogous': this.generateAnalogous.bind(this),
                'split-complementary': this.generateSplitComplementary.bind(this),
                'tetradic': this.generateTetradic.bind(this),
                'monochromatic': this.generateMonochromatic.bind(this)
            };
        }

        /**
         * 🎨 Generate complementary colors (opposite on color wheel)
         */
        generateComplementary(baseColor) {
            const hsl = this.hexToHsl(baseColor);
            const complementaryHue = (hsl.h + 180) % 360;
            
            return [
                baseColor,
                this.hslToHex({ h: complementaryHue, s: hsl.s, l: hsl.l })
            ];
        }

        /**
         * 🎨 Generate triadic colors (120° apart)
         */
        generateTriadic(baseColor) {
            const hsl = this.hexToHsl(baseColor);
            
            return [
                baseColor,
                this.hslToHex({ h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l }),
                this.hslToHex({ h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l })
            ];
        }

        /**
         * 🎨 Generate analogous colors (adjacent on color wheel)
         */
        generateAnalogous(baseColor) {
            const hsl = this.hexToHsl(baseColor);
            
            return [
                this.hslToHex({ h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l }),
                baseColor,
                this.hslToHex({ h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l })
            ];
        }

        /**
         * 🎨 Generate split-complementary colors
         */
        generateSplitComplementary(baseColor) {
            const hsl = this.hexToHsl(baseColor);
            const complementaryHue = (hsl.h + 180) % 360;
            
            return [
                baseColor,
                this.hslToHex({ h: (complementaryHue - 30 + 360) % 360, s: hsl.s, l: hsl.l }),
                this.hslToHex({ h: (complementaryHue + 30) % 360, s: hsl.s, l: hsl.l })
            ];
        }

        /**
         * 🎨 Generate tetradic colors (rectangle on color wheel)
         */
        generateTetradic(baseColor) {
            const hsl = this.hexToHsl(baseColor);
            
            return [
                baseColor,
                this.hslToHex({ h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l }),
                this.hslToHex({ h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }),
                this.hslToHex({ h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l })
            ];
        }

        /**
         * 🎨 Generate monochromatic colors (same hue, different saturation/lightness)
         */
        generateMonochromatic(baseColor) {
            const hsl = this.hexToHsl(baseColor);
            
            return [
                this.hslToHex({ h: hsl.h, s: Math.max(0, hsl.s - 20), l: Math.min(100, hsl.l + 20) }),
                baseColor,
                this.hslToHex({ h: hsl.h, s: Math.min(100, hsl.s + 20), l: Math.max(0, hsl.l - 20) })
            ];
        }

        /**
         * 🔧 Adjust color brightness
         */
        adjustBrightness(color, amount) {
            const hsl = this.hexToHsl(color);
            hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
            return this.hslToHex(hsl);
        }

        /**
         * 🔧 Adjust color hue
         */
        adjustHue(color, amount) {
            const hsl = this.hexToHsl(color);
            hsl.h = (hsl.h + amount + 360) % 360;
            return this.hslToHex(hsl);
        }

        /**
         * 🔧 Get contrasting color (black or white)
         */
        getContrastColor(color) {
            const rgb = this.hexToRgb(color);
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#FFFFFF';
        }

        /**
         * 🔧 Color conversion utilities
         */
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        rgbToHex(rgb) {
            return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
        }

        hexToHsl(hex) {
            const rgb = this.hexToRgb(hex);
            if (!rgb) return null;

            const r = rgb.r / 255;
            const g = rgb.g / 255;
            const b = rgb.b / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }

            return { h: h * 360, s: s * 100, l: l * 100 };
        }

        hslToHex(hsl) {
            const h = hsl.h / 360;
            const s = hsl.s / 100;
            const l = hsl.l / 100;

            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            let r, g, b;

            if (s === 0) {
                r = g = b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return this.rgbToHex({
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            });
        }
    }

    /**
     * 🎨 Harmonious Color Generator
     */
    class HarmoniousColorGenerator {
        constructor(colorTheory) {
            this.colorTheory = colorTheory;
        }

        generateHarmony(baseColor, harmonyType, options = {}) {
            const generator = this.colorTheory.harmonyTypes[harmonyType];
            if (!generator) {
                throw new Error(`Unknown harmony type: ${harmonyType}`);
            }

            let colors = generator(baseColor);

            // Apply variations if requested
            if (options.variations) {
                colors = this.applyVariations(colors, options.variations);
            }

            // Ensure minimum number of colors
            const minColors = options.minColors || 5;
            while (colors.length < minColors) {
                colors.push(this.generateVariation(colors[colors.length - 1]));
            }

            return colors.slice(0, options.maxColors || 8);
        }

        applyVariations(colors, variations) {
            const varied = [...colors];
            
            variations.forEach(variation => {
                switch (variation.type) {
                    case 'brightness':
                        varied.push(this.colorTheory.adjustBrightness(colors[0], variation.amount));
                        break;
                    case 'saturation':
                        // Add saturation variation logic
                        break;
                }
            });

            return varied;
        }

        generateVariation(baseColor) {
            // Generate a subtle variation of the base color
            const hsl = this.colorTheory.hexToHsl(baseColor);
            const variation = {
                h: (hsl.h + (Math.random() - 0.5) * 30 + 360) % 360,
                s: Math.max(0, Math.min(100, hsl.s + (Math.random() - 0.5) * 20)),
                l: Math.max(0, Math.min(100, hsl.l + (Math.random() - 0.5) * 20))
            };
            
            return this.colorTheory.hslToHex(variation);
        }
    }

    /**
     * ♿ Accessibility Checker
     */
    class AccessibilityChecker {
        calculateContrastRatio(foreground, background) {
            const fgLuminance = this.getLuminance(foreground);
            const bgLuminance = this.getLuminance(background);
            
            const lighter = Math.max(fgLuminance, bgLuminance);
            const darker = Math.min(fgLuminance, bgLuminance);
            
            return (lighter + 0.05) / (darker + 0.05);
        }

        getLuminance(color) {
            const rgb = this.hexToRgb(color);
            if (!rgb) return 0;

            const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
                c = c / 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });

            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }
    }

    // Export classes
    window.ColorSchemeManager = ColorSchemeManager;
    window.ColorTheoryEngine = ColorTheoryEngine;
    window.HarmoniousColorGenerator = HarmoniousColorGenerator;
    window.AccessibilityChecker = AccessibilityChecker;

    // Auto-initialize when CSS Variables Engine is ready
    document.addEventListener('css-engine:initialized', (event) => {
        if (window.cssVariablesEngine && !window.colorSchemeManager) {
            window.colorSchemeManager = new ColorSchemeManager(window.cssVariablesEngine, {
                debug: window.masV2Debug || false
            });
        }
    });

})(window, document);