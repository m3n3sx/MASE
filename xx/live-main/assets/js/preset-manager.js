/**
 * Modern Admin Styler V2 - Preset Manager
 * 
 * Enterprise-grade preset management system
 * Handles saving, loading, importing, exporting, and managing style presets
 * 
 * @package ModernAdminStyler
 * @version 3.1.0 - Enterprise Preset System
 */

class PresetManager {
    constructor() {
        this.apiBase = wpApiSettings.root + 'modern-admin-styler/v2/presets';
        this.nonce = wpApiSettings.nonce;
        this.currentSettings = {};
        this.presets = [];
        this.selectedPresetId = null;
        
        this.init();
    }
    
    /**
     * 🚀 Initialize Preset Manager
     */
    init() {
        this.bindEvents();
        this.loadPresets();
        this.initTooltips();
        this.addKeyboardShortcuts();
        
    }
    
    /**
     * 🎯 Bind event listeners
     */
    bindEvents() {
        // Preset selection
        const selectElement = document.getElementById('mas-v2-presets-select');
        if (selectElement) {
            selectElement.addEventListener('change', (e) => {
                this.selectedPresetId = e.target.value;
                if (this.selectedPresetId) {
                    this.showPresetInfo(this.selectedPresetId);
                } else {
                    this.hidePresetInfo();
                }
            });
        }
        
        // Save preset button
        const saveBtn = document.getElementById('mas-v2-save-preset');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.showSaveDialog());
        }
        
        // Apply preset button
        const applyBtn = document.getElementById('mas-v2-apply-preset');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applySelectedPreset());
        }
        
        // Export preset button
        const exportBtn = document.getElementById('mas-v2-export-preset');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSelectedPreset());
        }
        
        // Import preset button
        const importBtn = document.getElementById('mas-v2-import-preset');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog());
        }
        
        // Delete preset button
        const deleteBtn = document.getElementById('mas-v2-delete-preset');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteSelectedPreset());
        }
        
        // Manage presets button
        const manageBtn = document.getElementById('mas-v2-preset-manager');
        if (manageBtn) {
            manageBtn.addEventListener('click', () => this.openPresetManager());
        }
        
        // Add hover effects
        this.addHoverEffects();
    }
    
    /**
     * 🎨 Add hover effects to buttons
     */
    addHoverEffects() {
        const buttons = document.querySelectorAll('.mas-preset-btn, .mas-preset-btn-small');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        });
    }
    
    /**
     * ⌨️ Add keyboard shortcuts
     */
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save current settings as preset
            if ((e.ctrlKey || e.metaKey) && e.key === 's' && e.shiftKey) {
                e.preventDefault();
                this.showSaveDialog();
            }
            
            // Ctrl/Cmd + L: Load/Apply selected preset
            if ((e.ctrlKey || e.metaKey) && e.key === 'l' && e.shiftKey) {
                e.preventDefault();
                this.applySelectedPreset();
            }
            
            // Ctrl/Cmd + E: Export selected preset
            if ((e.ctrlKey || e.metaKey) && e.key === 'e' && e.shiftKey) {
                e.preventDefault();
                this.exportSelectedPreset();
            }
        });
    }
    
    /**
     * 💡 Initialize tooltips
     */
    initTooltips() {
        const tooltips = {
            'mas-v2-save-preset': 'Save current settings as a new preset (Ctrl+Shift+S)',
            'mas-v2-apply-preset': 'Apply the selected preset to current settings (Ctrl+Shift+L)',
            'mas-v2-export-preset': 'Export selected preset as JSON file (Ctrl+Shift+E)',
            'mas-v2-import-preset': 'Import preset from JSON file',
            'mas-v2-delete-preset': 'Delete the selected preset permanently',
            'mas-v2-preset-manager': 'Open advanced preset management interface'
        };
        
        Object.entries(tooltips).forEach(([id, tooltip]) => {
            const element = document.getElementById(id);
            if (element) {
                element.title = tooltip;
            }
        });
    }
    
    /**
     * 📋 Load all presets from API
     */
    async loadPresets() {
        try {
            const response = await fetch(this.apiBase, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.presets = result.data;
                this.populatePresetSelect();
                
                if (window.masToast) {
                    window.masToast.show('success', `Loaded ${this.presets.length} presets`, 3000);
                }
            } else {
                throw new Error(result.message || 'Failed to load presets');
            }
            
        } catch (error) {
            if (window.masToast) {
                window.masToast.show('error', 'Failed to load presets: ' + error.message, 5000);
            }
        }
    }
    
    /**
     * 📋 Populate preset select dropdown
     */
    populatePresetSelect() {
        const selectElement = document.getElementById('mas-v2-presets-select');
        if (!selectElement) return;
        
        // Clear existing options except the first one
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }
        
        // Add presets as options
        this.presets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.id;
            option.textContent = `${preset.name} (${new Date(preset.created).toLocaleDateString()})`;
            selectElement.appendChild(option);
        });
        
        // Update counter
        const countText = this.presets.length === 1 ? '1 preset' : `${this.presets.length} presets`;
    }
    
    /**
     * 💾 Show save preset dialog
     */
    showSaveDialog() {
        const name = prompt('Enter a name for this preset:', 'My Custom Style');
        if (!name || name.trim() === '') {
            return;
        }
        
        const description = prompt('Enter a description (optional):', '');
        
        this.saveCurrentAsPreset(name.trim(), description.trim());
    }
    
    /**
     * 💾 Save current settings as preset
     */
    async saveCurrentAsPreset(name, description = '') {
        try {
            // Get current settings from Live Edit Mode or form
            const currentSettings = this.getCurrentSettings();
            
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    settings: currentSettings
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.presets.push(result.data);
                this.populatePresetSelect();
                
                if (window.masToast) {
                    window.masToast.show('success', `Preset "${name}" saved successfully!`, 4000);
                }
                
                // Auto-select the new preset
                const selectElement = document.getElementById('mas-v2-presets-select');
                if (selectElement) {
                    selectElement.value = result.data.id;
                    this.selectedPresetId = result.data.id;
                    this.showPresetInfo(result.data.id);
                }
                
            } else {
                throw new Error(result.message || 'Failed to save preset');
            }
            
        } catch (error) {
            if (window.masToast) {
                window.masToast.show('error', 'Failed to save preset: ' + error.message, 5000);
            }
        }
    }
    
    /**
     * 🎨 Apply selected preset
     */
    async applySelectedPreset() {
        if (!this.selectedPresetId) {
            if (window.masToast) {
                window.masToast.show('warning', 'Please select a preset to apply', 3000);
            }
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/${this.selectedPresetId}/apply`, {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Refresh the page to apply new settings
                if (window.masToast) {
                    window.masToast.show('success', `Preset "${result.data.name}" applied successfully! Refreshing...`, 3000);
                }
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
            } else {
                throw new Error(result.message || 'Failed to apply preset');
            }
            
        } catch (error) {
            if (window.masToast) {
                window.masToast.show('error', 'Failed to apply preset: ' + error.message, 5000);
            }
        }
    }
    
    /**
     * 📤 Export selected preset - ENHANCED for Task 2.3
     */
    async exportSelectedPreset(format = 'json') {
        if (!this.selectedPresetId) {
            if (window.masToast) {
                window.masToast.show('warning', 'Please select a preset to export', 3000);
            }
            return;
        }
        
        // Show format selection dialog
        const selectedFormat = await this.showExportFormatDialog();
        if (!selectedFormat) return;
        
        try {
            const response = await fetch(`${this.apiBase}/${this.selectedPresetId}/export`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                const preset = this.presets.find(p => p.id == this.selectedPresetId);
                
                let exportData, filename, mimeType;
                
                switch (selectedFormat) {
                    case 'json':
                        exportData = this.formatAsJSON(preset);
                        filename = `mas-preset-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
                        mimeType = 'application/json';
                        break;
                        
                    case 'css':
                        exportData = this.formatAsCSS(preset);
                        filename = `mas-preset-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.css`;
                        mimeType = 'text/css';
                        break;
                        
                    case 'backup':
                        exportData = this.formatAsBackup(preset);
                        filename = `mas-backup-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
                        mimeType = 'application/json';
                        break;
                        
                    default:
                        throw new Error('Unsupported export format');
                }
                
                // Create and download file
                const blob = new Blob([exportData], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                if (window.masToast) {
                    window.masToast.show('success', `Preset exported as ${filename}`, 4000);
                }
                
            } else {
                throw new Error(result.message || 'Failed to export preset');
            }
            
        } catch (error) {
            if (window.masToast) {
                window.masToast.show('error', 'Failed to export preset: ' + error.message, 5000);
            }
        }
    }

    /**
     * 🎯 Show export format selection dialog - NEW for Task 2.3
     */
    async showExportFormatDialog() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'mas-export-format-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            const content = document.createElement('div');
            content.className = 'modal-content';
            content.style.cssText = `
                background: white;
                border-radius: 15px;
                padding: 2rem;
                max-width: 500px;
                transform: translateY(-20px) scale(0.9);
                transition: transform 0.3s ease;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            `;
            
            content.innerHTML = `
                <h3 style="margin: 0 0 1.5rem 0; color: #333;">📤 Export Format</h3>
                <p style="margin: 0 0 1.5rem 0; color: #666;">Choose the format for exporting your preset:</p>
                
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                        <input type="radio" name="export-format" value="json" checked style="margin-right: 1rem;">
                        <div>
                            <strong>📄 JSON Format</strong>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">Standard format with full metadata and settings</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                        <input type="radio" name="export-format" value="css" style="margin-right: 1rem;">
                        <div>
                            <strong>🎨 CSS Format</strong>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">CSS variables and rules for direct use</div>
                        </div>
                    </label>
                    
                    <label style="display: flex; align-items: center; padding: 1rem; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">
                        <input type="radio" name="export-format" value="backup" style="margin-right: 1rem;">
                        <div>
                            <strong>💾 Backup Format</strong>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 0.25rem;">Complete backup with system information</div>
                        </div>
                    </label>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
                    <button class="cancel-btn" style="padding: 0.75rem 1.5rem; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button class="export-btn" style="padding: 0.75rem 1.5rem; background: #0073aa; color: white; border: none; border-radius: 6px; cursor: pointer;">Export</button>
                </div>
            `;
            
            // Add hover effects to radio labels
            const labels = content.querySelectorAll('label');
            labels.forEach(label => {
                label.addEventListener('mouseenter', () => {
                    label.style.borderColor = '#0073aa';
                    label.style.backgroundColor = '#f0f8ff';
                });
                label.addEventListener('mouseleave', () => {
                    const radio = label.querySelector('input[type="radio"]');
                    if (!radio.checked) {
                        label.style.borderColor = '#ddd';
                        label.style.backgroundColor = 'transparent';
                    }
                });
                
                const radio = label.querySelector('input[type="radio"]');
                radio.addEventListener('change', () => {
                    labels.forEach(l => {
                        l.style.borderColor = '#ddd';
                        l.style.backgroundColor = 'transparent';
                    });
                    if (radio.checked) {
                        label.style.borderColor = '#0073aa';
                        label.style.backgroundColor = '#f0f8ff';
                    }
                });
            });
            
            // Event handlers
            content.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(null);
                }, 300);
            });
            
            content.querySelector('.export-btn').addEventListener('click', () => {
                const selectedFormat = content.querySelector('input[name="export-format"]:checked').value;
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(selectedFormat);
                }, 300);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        resolve(null);
                    }, 300);
                }
            });
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            // Show modal with animation
            setTimeout(() => {
                modal.style.opacity = '1';
                content.style.transform = 'translateY(0) scale(1)';
            }, 10);
        });
    }
    
    /**
     * 🎨 Format preset as JSON - NEW for Task 2.3
     */
    formatAsJSON(preset) {
        const exportData = {
            format: 'mas-preset-json',
            version: '2.3.0',
            exported: new Date().toISOString(),
            preset: {
                name: preset.name,
                description: preset.description,
                settings: preset.settings,
                metadata: {
                    created: preset.created,
                    modified: preset.modified,
                    author: preset.author || 'Unknown',
                    version: preset.version || '1.0.0'
                }
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * 🎨 Format preset as CSS - NEW for Task 2.3
     */
    formatAsCSS(preset) {
        let css = `/*\n * ${preset.name}\n * ${preset.description || 'No description'}\n * Exported: ${new Date().toISOString()}\n */\n\n`;
        
        // Convert settings to CSS variables
        css += ':root {\n';
        
        Object.entries(preset.settings || {}).forEach(([key, value]) => {
            const cssVar = this.settingToCSSVariable(key);
            if (cssVar) {
                css += `  ${cssVar}: ${value};\n`;
            }
        });
        
        css += '}\n\n';
        
        // Add common WordPress admin selectors
        css += this.generateWordPressCSS(preset.settings);
        
        return css;
    }

    /**
     * 💾 Format preset as backup - NEW for Task 2.3
     */
    formatAsBackup(preset) {
        const backupData = {
            format: 'mas-preset-backup',
            version: '2.3.0',
            exported: new Date().toISOString(),
            system: {
                wordpress_version: window.wpVersion || 'unknown',
                plugin_version: window.masVersion || 'unknown',
                php_version: window.phpVersion || 'unknown',
                user_agent: navigator.userAgent
            },
            preset: {
                ...preset,
                full_settings: this.getCurrentSettings(), // Include current state
                dependencies: this.extractDependencies(preset.settings)
            }
        };
        
        return JSON.stringify(backupData, null, 2);
    }

    /**
     * 🔧 Convert setting key to CSS variable - NEW for Task 2.3
     */
    settingToCSSVariable(settingKey) {
        const mappings = {
            'admin_bar_background': '--woow-surface-bar',
            'admin_bar_text_color': '--woow-surface-bar-text',
            'admin_bar_hover_color': '--woow-surface-bar-hover',
            'menu_background': '--woow-surface-menu',
            'menu_text_color': '--woow-surface-menu-text',
            'menu_hover_color': '--woow-surface-menu-hover',
            'primary_color': '--woow-accent-primary',
            'secondary_color': '--woow-accent-secondary',
            'success_color': '--woow-accent-success',
            'warning_color': '--woow-accent-warning',
            'error_color': '--woow-accent-error',
            'content_background': '--woow-bg-primary',
            'content_text_color': '--woow-text-primary'
        };
        
        return mappings[settingKey] || `--woow-${settingKey.replace(/_/g, '-')}`;
    }

    /**
     * 🎨 Generate WordPress-specific CSS - NEW for Task 2.3
     */
    generateWordPressCSS(settings) {
        let css = '/* WordPress Admin Styles */\n';
        
        if (settings.admin_bar_background) {
            css += `#wpadminbar {\n  background: var(--woow-surface-bar) !important;\n}\n\n`;
        }
        
        if (settings.admin_bar_text_color) {
            css += `#wpadminbar, #wpadminbar a {\n  color: var(--woow-surface-bar-text) !important;\n}\n\n`;
        }
        
        if (settings.menu_background) {
            css += `#adminmenuwrap, #adminmenu {\n  background: var(--woow-surface-menu) !important;\n}\n\n`;
        }
        
        if (settings.menu_text_color) {
            css += `#adminmenu a {\n  color: var(--woow-surface-menu-text) !important;\n}\n\n`;
        }
        
        return css;
    }

    /**
     * 🔍 Extract dependencies from settings - NEW for Task 2.3
     */
    extractDependencies(settings) {
        const dependencies = {
            plugins: [],
            themes: [],
            wordpress_features: []
        };
        
        // Analyze settings to determine dependencies
        if (settings.admin_bar_floating === '1') {
            dependencies.wordpress_features.push('admin_bar_customization');
        }
        
        if (settings.menu_floating === '1') {
            dependencies.wordpress_features.push('admin_menu_customization');
        }
        
        return dependencies;
    }

    /**
     * 📥 Show import dialog - ENHANCED for Task 2.3
     */
    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.css';
        input.style.display = 'none';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importPresetFromFile(file);
            }
        });
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
    
    /**
     * 📥 Import preset from file - ENHANCED for Task 2.3
     */
    async importPresetFromFile(file) {
        try {
            const text = await file.text();
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            // Validate and parse the file
            const validationResult = await this.validateImportFile(text, fileExtension);
            if (!validationResult.isValid) {
                throw new Error(`Invalid file format: ${validationResult.errors.join(', ')}`);
            }
            
            // Show import preview dialog
            const importData = await this.showImportPreviewDialog(validationResult.data, file.name);
            if (!importData) return; // User cancelled
            
            const response = await fetch(`${this.apiBase}/import`, {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: JSON.stringify(importData),
                    name: importData.name,
                    validation: validationResult
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.presets.push(result.data);
                this.populatePresetSelect();
                
                if (window.masToast) {
                    window.masToast.show('success', `Preset "${result.data.name}" imported successfully!`, 4000);
                }
                
                // Auto-select the imported preset
                const selectElement = document.getElementById('mas-v2-presets-select');
                if (selectElement) {
                    selectElement.value = result.data.id;
                    this.selectedPresetId = result.data.id;
                    this.showPresetInfo(result.data.id);
                }
                
            } else {
                throw new Error(result.message || 'Failed to import preset');
            }
            
        } catch (error) {
            if (window.masToast) {
                window.masToast.show('error', 'Failed to import preset: ' + error.message, 5000);
            }
        }
    }

    /**
     * ✅ Validate import file - NEW for Task 2.3
     */
    async validateImportFile(content, fileExtension) {
        const errors = [];
        let data = null;
        
        try {
            if (fileExtension === 'json') {
                data = JSON.parse(content);
                
                // Validate JSON structure
                if (!data.format) {
                    errors.push('Missing format identifier');
                } else if (!data.format.startsWith('mas-preset')) {
                    errors.push('Invalid format identifier');
                }
                
                if (!data.preset) {
                    errors.push('Missing preset data');
                } else {
                    if (!data.preset.name) {
                        errors.push('Missing preset name');
                    }
                    if (!data.preset.settings || typeof data.preset.settings !== 'object') {
                        errors.push('Missing or invalid settings data');
                    }
                }
                
                // Check version compatibility
                if (data.version) {
                    const importVersion = this.parseVersion(data.version);
                    const currentVersion = this.parseVersion('2.3.0');
                    
                    if (importVersion.major > currentVersion.major) {
                        errors.push('Preset version is newer than current plugin version');
                    }
                }
                
            } else if (fileExtension === 'css') {
                // Parse CSS file
                data = this.parseCSSFile(content);
                if (!data) {
                    errors.push('Unable to parse CSS file');
                }
            } else {
                errors.push('Unsupported file format');
            }
            
        } catch (parseError) {
            errors.push(`Parse error: ${parseError.message}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            data,
            fileType: fileExtension
        };
    }

    /**
     * 🎨 Parse CSS file to extract settings - NEW for Task 2.3
     */
    parseCSSFile(cssContent) {
        const settings = {};
        const cssVarPattern = /--woow-([^:]+):\s*([^;]+);/g;
        let match;
        
        while ((match = cssVarPattern.exec(cssContent)) !== null) {
            const varName = match[1].replace(/-/g, '_');
            const varValue = match[2].trim();
            settings[varName] = varValue;
        }
        
        // Extract name from CSS comment
        const nameMatch = cssContent.match(/\/\*\s*\*\s*([^\n]+)/);
        const name = nameMatch ? nameMatch[1].trim() : 'Imported CSS Preset';
        
        return {
            format: 'mas-preset-css',
            version: '2.3.0',
            preset: {
                name,
                description: 'Imported from CSS file',
                settings
            }
        };
    }

    /**
     * 📋 Show import preview dialog - NEW for Task 2.3
     */
    async showImportPreviewDialog(data, filename) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'mas-import-preview-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            const content = document.createElement('div');
            content.className = 'modal-content';
            content.style.cssText = `
                background: white;
                border-radius: 15px;
                padding: 2rem;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                transform: translateY(-20px) scale(0.9);
                transition: transform 0.3s ease;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            `;
            
            const settingsCount = Object.keys(data.preset.settings || {}).length;
            const isBackup = data.format === 'mas-preset-backup';
            
            content.innerHTML = `
                <h3 style="margin: 0 0 1.5rem 0; color: #333;">📥 Import Preview</h3>
                
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div><strong>File:</strong> ${filename}</div>
                        <div><strong>Format:</strong> ${data.format}</div>
                        <div><strong>Version:</strong> ${data.version || 'Unknown'}</div>
                        <div><strong>Settings:</strong> ${settingsCount} items</div>
                    </div>
                    
                    ${isBackup ? `
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 0.75rem; border-radius: 4px; margin-top: 1rem;">
                            <strong>⚠️ Backup File Detected</strong><br>
                            This file contains system information and full configuration backup.
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Preset Name:</label>
                    <input type="text" id="import-name" value="${data.preset.name || ''}" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Description:</label>
                    <textarea id="import-description" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; height: 80px;">${data.preset.description || ''}</textarea>
                </div>
                
                <details style="margin-bottom: 1.5rem;">
                    <summary style="cursor: pointer; font-weight: bold; padding: 0.5rem 0;">📋 Settings Preview (${settingsCount} items)</summary>
                    <div style="max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">
                        ${Object.entries(data.preset.settings || {}).map(([key, value]) => 
                            `<div style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px solid #eee;">
                                <span style="font-family: monospace; color: #666;">${key}</span>
                                <span style="font-family: monospace; color: #333;">${value}</span>
                            </div>`
                        ).join('')}
                    </div>
                </details>
                
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="cancel-btn" style="padding: 0.75rem 1.5rem; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button class="import-btn" style="padding: 0.75rem 1.5rem; background: #0073aa; color: white; border: none; border-radius: 6px; cursor: pointer;">Import Preset</button>
                </div>
            `;
            
            // Event handlers
            content.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(null);
                }, 300);
            });
            
            content.querySelector('.import-btn').addEventListener('click', () => {
                const name = content.querySelector('#import-name').value.trim();
                const description = content.querySelector('#import-description').value.trim();
                
                if (!name) {
                    alert('Please enter a name for the preset');
                    return;
                }
                
                const importData = {
                    ...data.preset,
                    name,
                    description
                };
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(importData);
                }, 300);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        resolve(null);
                    }, 300);
                }
            });
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            // Show modal with animation
            setTimeout(() => {
                modal.style.opacity = '1';
                content.style.transform = 'translateY(0) scale(1)';
            }, 10);
        });
    }

    /**
     * 🔢 Parse version string - NEW for Task 2.3
     */
    parseVersion(versionString) {
        const parts = versionString.split('.').map(Number);
        return {
            major: parts[0] || 0,
            minor: parts[1] || 0,
            patch: parts[2] || 0
        };
    }
    
    /**
     * 🗑️ Delete selected preset
     */
    async deleteSelectedPreset() {
        if (!this.selectedPresetId) {
            if (window.masToast) {
                window.masToast.show('warning', 'Please select a preset to delete', 3000);
            }
            return;
        }
        
        const preset = this.presets.find(p => p.id == this.selectedPresetId);
        if (!preset) return;
        
        const confirmed = confirm(`Are you sure you want to delete the preset "${preset.name}"?\n\nThis action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            const response = await fetch(`${this.apiBase}/${this.selectedPresetId}`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from local array
                this.presets = this.presets.filter(p => p.id != this.selectedPresetId);
                this.populatePresetSelect();
                
                // Clear selection
                const selectElement = document.getElementById('mas-v2-presets-select');
                if (selectElement) {
                    selectElement.value = '';
                }
                this.selectedPresetId = null;
                this.hidePresetInfo();
                
                if (window.masToast) {
                    window.masToast.show('success', `Preset "${preset.name}" deleted successfully`, 4000);
                }
                
            } else {
                throw new Error(result.message || 'Failed to delete preset');
            }
            
        } catch (error) {
            if (window.masToast) {
                window.masToast.show('error', 'Failed to delete preset: ' + error.message, 5000);
            }
        }
    }
    
    /**
     * ⚙️ Open preset manager interface
     */
    openPresetManager() {
        // For now, just show a detailed list in a modal
        // This could be expanded to a full management interface
        const modal = this.createPresetManagerModal();
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'translateY(0) scale(1)';
        }, 10);
    }
    
    /**
     * 🔧 Create preset manager modal
     */
    createPresetManagerModal() {
        const modal = document.createElement('div');
        modal.className = 'mas-preset-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 2rem;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            transform: translateY(-20px) scale(0.9);
            transition: transform 0.3s ease;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;
        
        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="margin: 0; color: #333;">🎨 Preset Manager</h2>
                <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;">✕</button>
            </div>
            
            <div class="preset-list">
                ${this.presets.map(preset => `
                    <div class="preset-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #f9f9f9;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h4 style="margin: 0 0 0.5rem 0; color: #333;">${preset.name}</h4>
                                <p style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">${preset.description || 'No description'}</p>
                                <small style="color: #999;">Created: ${new Date(preset.created).toLocaleString()}</small>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="presetManager.selectAndApply(${preset.id})" style="padding: 0.5rem 1rem; background: #0073aa; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Apply</button>
                                <button onclick="presetManager.selectAndExport(${preset.id})" style="padding: 0.5rem 1rem; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Export</button>
                                <button onclick="presetManager.selectAndDelete(${preset.id})" style="padding: 0.5rem 1rem; background: #d54d21; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Delete</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${this.presets.length === 0 ? '<p style="text-align: center; color: #666; font-style: italic;">No presets found. Create your first preset by saving current settings!</p>' : ''}
        `;
        
        // Close modal events
        content.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                }, 300);
            }
        });
        
        modal.appendChild(content);
        return modal;
    }
    
    /**
     * 🎯 Helper methods for modal actions
     */
    selectAndApply(presetId) {
        this.selectedPresetId = presetId;
        this.applySelectedPreset();
        // Close modal
        const modal = document.querySelector('.mas-preset-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        }
    }
    
    selectAndExport(presetId) {
        this.selectedPresetId = presetId;
        this.exportSelectedPreset();
    }
    
    selectAndDelete(presetId) {
        this.selectedPresetId = presetId;
        this.deleteSelectedPreset().then(() => {
            // Refresh modal content
            const modal = document.querySelector('.mas-preset-modal');
            if (modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    this.openPresetManager();
                }, 300);
            }
        });
    }
    
    /**
     * ℹ️ Show preset info
     */
    showPresetInfo(presetId) {
        const preset = this.presets.find(p => p.id == presetId);
        if (!preset) return;
        
        const infoElement = document.getElementById('mas-preset-info');
        if (!infoElement) return;
        
        const contentElement = infoElement.querySelector('.preset-info-content');
        if (!contentElement) return;
        
        const settingsCount = Object.keys(preset.settings || {}).length;
        const createdDate = new Date(preset.created).toLocaleDateString();
        const modifiedDate = new Date(preset.modified).toLocaleDateString();
        
        contentElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div>
                    <strong>📝 Name:</strong><br>
                    ${preset.name}
                </div>
                <div>
                    <strong>📊 Settings:</strong><br>
                    ${settingsCount} options configured
                </div>
                <div>
                    <strong>📅 Created:</strong><br>
                    ${createdDate}
                </div>
                <div>
                    <strong>🔄 Modified:</strong><br>
                    ${modifiedDate}
                </div>
            </div>
            ${preset.description ? `<div style="margin-top: 1rem;"><strong>📄 Description:</strong><br>${preset.description}</div>` : ''}
        `;
        
        infoElement.style.display = 'block';
    }
    
    /**
     * ❌ Hide preset info
     */
    hidePresetInfo() {
        const infoElement = document.getElementById('mas-preset-info');
        if (infoElement) {
            infoElement.style.display = 'none';
        }
    }
    
    /**
     * 🔧 Get current settings (from Live Edit Mode or form)
     */
    getCurrentSettings() {
        // Try to get from Live Edit Mode first
        if (window.liveEditInstance && window.liveEditInstance.settingsCache) {
            const settings = {};
            window.liveEditInstance.settingsCache.forEach((value, key) => {
                settings[key] = value;
            });
            return settings;
        }
        
        // Fallback: get from form elements
        const form = document.getElementById('mas-v2-settings-form');
        if (!form) return {};
        
        const formData = new FormData(form);
        const settings = {};
        
        for (let [key, value] of formData.entries()) {
            if (key !== 'mas_v2_nonce' && key !== '_wp_http_referer') {
                settings[key] = value;
            }
        }
        
        return settings;
    }
    
    /**
     * 🔄 Refresh presets list
     */
    async refresh() {
        await this.loadPresets();
        if (window.masToast) {
            window.masToast.show('info', 'Presets refreshed', 2000);
        }
    }
}

/**
 * 🚀 Initialize Preset Manager when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on admin pages with preset functionality
    if (document.querySelector('.mas-v2-preset-manager')) {
        window.presetManager = new PresetManager();
        
    }
});

/**
 * 🎯 PRESET MANAGER COMPLETE
 * 
 * ENTERPRISE FEATURES IMPLEMENTED:
 * ✅ Full CRUD operations via REST API
 * ✅ Elegant user interface with animations
 * ✅ Export/Import functionality with JSON format
 * ✅ Keyboard shortcuts for power users
 * ✅ Advanced preset management modal
 * ✅ Integration with Live Edit Mode
 * ✅ Toast notifications for user feedback
 * ✅ Error handling and validation
 * ✅ Real-time preset information display
 * ✅ Professional file naming conventions
 * ✅ Accessibility features (tooltips, keyboard navigation)
 * ✅ Responsive design for all screen sizes
 * 
 * KEYBOARD SHORTCUTS:
 * • Ctrl+Shift+S: Save current settings as preset
 * • Ctrl+Shift+L: Apply selected preset
 * • Ctrl+Shift+E: Export selected preset
 * 
 * INTEGRATIONS:
 * • WordPress REST API
 * • Live Edit Mode settings cache
 * • Toast notification system
 * • Form data extraction
 * • File download/upload handling
 */ 