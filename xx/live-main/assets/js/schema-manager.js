/**
 * Modern Admin Styler V2 - Enhanced Schema Manager
 * 
 * Advanced schema management system with CRUD operations, versioning, and validation
 * Extends the existing preset-manager.js functionality
 * 
 * @package ModernAdminStyler
 * @version 4.1.0 - Enhanced Schema Management
 */

class SchemaManager extends PresetManager {
    constructor() {
        super();
        this.apiBase = wpApiSettings.root + 'modern-admin-styler/v2/schemas';
        this.schemas = [];
        this.schemaHistory = new Map();
        this.validationRules = new Map();
        this.lockManager = new Map();
        
        this.initSchemaManager();
    }
    
    /**
     * 🚀 Initialize Enhanced Schema Manager
     */
    initSchemaManager() {
        this.setupValidationRules();
        this.loadSchemas();
        this.initVersioning();
        this.setupAutoSave();
        
        console.log('✅ Enhanced Schema Manager initialized');
    }
    
    /**
     * 📋 Load all schemas with enhanced metadata
     */
    async loadSchemas() {
        try {
            const response = await fetch(`${this.apiBase}?include_metadata=true&include_history=true`, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.schemas = result.data;
                this.populateSchemaHistory(result.history || {});
                
                if (window.masToast) {
                    window.masToast.show('success', `Loaded ${this.schemas.length} schemas with history`, 3000);
                }
                
                // Trigger schema loaded event
                this.dispatchEvent('schemasLoaded', { schemas: this.schemas });
                
            } else {
                throw new Error(result.message || 'Failed to load schemas');
            }
            
        } catch (error) {
            console.error('Schema loading error:', error);
            if (window.masToast) {
                window.masToast.show('error', 'Failed to load schemas: ' + error.message, 5000);
            }
        }
    }
    
    /**
     * 📝 Create new schema with validation
     */
    async createSchema(schemaData) {
        try {
            // Validate schema data
            const validation = await this.validateSchema(schemaData);
            if (!validation.isValid) {
                throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Add metadata
            const enhancedSchema = {
                ...schemaData,
                id: this.generateSchemaId(),
                version: '1.0.0',
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                author: this.getCurrentUser(),
                status: 'draft',
                metadata: {
                    validation: validation,
                    dependencies: this.extractDependencies(schemaData.settings),
                    compatibility: this.checkCompatibility(schemaData.settings)
                }
            };
            
            const response = await fetch(this.apiBase, {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(enhancedSchema)
            });
            
            const result = await response.json();
            
            if (result.success) {
                const newSchema = result.data;
                this.schemas.push(newSchema);
                
                // Initialize version history
                this.initSchemaHistory(newSchema.id, newSchema);
                
                if (window.masToast) {
                    window.masToast.show('success', `Schema "${newSchema.name}" created successfully!`, 4000);
                }
                
                this.dispatchEvent('schemaCreated', { schema: newSchema });
                return newSchema;
                
            } else {
                throw new Error(result.message || 'Failed to create schema');
            }
            
        } catch (error) {
            console.error('Schema creation error:', error);
            if (window.masToast) {
                window.masToast.show('error', 'Failed to create schema: ' + error.message, 5000);
            }
            throw error;
        }
    }
    
    /**
     * 📖 Read/Get schema by ID with version support
     */
    async getSchema(schemaId, version = 'latest') {
        try {
            const url = version === 'latest' 
                ? `${this.apiBase}/${schemaId}`
                : `${this.apiBase}/${schemaId}/versions/${version}`;
                
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'Schema not found');
            }
            
        } catch (error) {
            console.error('Schema retrieval error:', error);
            throw error;
        }
    }
    
    /**
     * ✏️ Update schema with versioning
     */
    async updateSchema(schemaId, updateData, createVersion = true) {
        try {
            // Get current schema
            const currentSchema = await this.getSchema(schemaId);
            if (!currentSchema) {
                throw new Error('Schema not found');
            }
            
            // Validate update data
            const mergedData = { ...currentSchema, ...updateData };
            const validation = await this.validateSchema(mergedData);
            if (!validation.isValid) {
                throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Create version if requested
            if (createVersion) {
                await this.createSchemaVersion(schemaId, currentSchema);
            }
            
            // Prepare update
            const updatedSchema = {
                ...mergedData,
                modified: new Date().toISOString(),
                version: this.incrementVersion(currentSchema.version),
                metadata: {
                    ...currentSchema.metadata,
                    validation: validation,
                    lastModifiedBy: this.getCurrentUser(),
                    changeLog: updateData.changeLog || 'Updated via Schema Manager'
                }
            };
            
            const response = await fetch(`${this.apiBase}/${schemaId}`, {
                method: 'PUT',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedSchema)
            });
            
            const result = await response.json();
            
            if (result.success) {
                const updated = result.data;
                
                // Update local cache
                const index = this.schemas.findIndex(s => s.id === schemaId);
                if (index !== -1) {
                    this.schemas[index] = updated;
                }
                
                // Update history
                this.updateSchemaHistory(schemaId, updated);
                
                if (window.masToast) {
                    window.masToast.show('success', `Schema "${updated.name}" updated successfully!`, 4000);
                }
                
                this.dispatchEvent('schemaUpdated', { schema: updated, previousVersion: currentSchema });
                return updated;
                
            } else {
                throw new Error(result.message || 'Failed to update schema');
            }
            
        } catch (error) {
            console.error('Schema update error:', error);
            if (window.masToast) {
                window.masToast.show('error', 'Failed to update schema: ' + error.message, 5000);
            }
            throw error;
        }
    }
    
    /**
     * 🗑️ Delete schema with confirmation
     */
    async deleteSchema(schemaId, force = false) {
        try {
            const schema = await this.getSchema(schemaId);
            if (!schema) {
                throw new Error('Schema not found');
            }
            
            // Check if schema is protected
            if (schema.protected && !force) {
                throw new Error('Cannot delete protected schema. Use force=true to override.');
            }
            
            // Confirmation dialog
            if (!force) {
                const confirmed = await this.showDeleteConfirmation(schema);
                if (!confirmed) return false;
            }
            
            const response = await fetch(`${this.apiBase}/${schemaId}`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ force: force })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from local cache
                this.schemas = this.schemas.filter(s => s.id !== schemaId);
                
                // Clean up history
                this.schemaHistory.delete(schemaId);
                
                if (window.masToast) {
                    window.masToast.show('success', `Schema "${schema.name}" deleted successfully!`, 4000);
                }
                
                this.dispatchEvent('schemaDeleted', { schemaId: schemaId, schema: schema });
                return true;
                
            } else {
                throw new Error(result.message || 'Failed to delete schema');
            }
            
        } catch (error) {
            console.error('Schema deletion error:', error);
            if (window.masToast) {
                window.masToast.show('error', 'Failed to delete schema: ' + error.message, 5000);
            }
            throw error;
        }
    }
    
    /**
     * 📚 Get schema version history
     */
    getSchemaHistory(schemaId) {
        return this.schemaHistory.get(schemaId) || [];
    }
    
    /**
     * 🔄 Rollback to previous version
     */
    async rollbackSchema(schemaId, targetVersion) {
        try {
            const history = this.getSchemaHistory(schemaId);
            const targetVersionData = history.find(v => v.version === targetVersion);
            
            if (!targetVersionData) {
                throw new Error(`Version ${targetVersion} not found in history`);
            }
            
            // Create current version backup before rollback
            const currentSchema = await this.getSchema(schemaId);
            await this.createSchemaVersion(schemaId, currentSchema, 'Pre-rollback backup');
            
            // Restore target version
            const rollbackData = {
                ...targetVersionData.data,
                version: this.incrementVersion(currentSchema.version),
                modified: new Date().toISOString(),
                metadata: {
                    ...targetVersionData.data.metadata,
                    rollbackFrom: currentSchema.version,
                    rollbackTo: targetVersion,
                    rollbackDate: new Date().toISOString()
                }
            };
            
            const updated = await this.updateSchema(schemaId, rollbackData, false);
            
            if (window.masToast) {
                window.masToast.show('success', `Schema rolled back to version ${targetVersion}`, 4000);
            }
            
            this.dispatchEvent('schemaRolledBack', { 
                schema: updated, 
                fromVersion: currentSchema.version, 
                toVersion: targetVersion 
            });
            
            return updated;
            
        } catch (error) {
            console.error('Schema rollback error:', error);
            if (window.masToast) {
                window.masToast.show('error', 'Failed to rollback schema: ' + error.message, 5000);
            }
            throw error;
        }
    }
    
    /**
     * ✅ Comprehensive schema validation
     */
    async validateSchema(schemaData) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        
        try {
            // Basic structure validation
            if (!schemaData.name || schemaData.name.trim() === '') {
                errors.push('Schema name is required');
            } else if (schemaData.name.length < 3) {
                warnings.push('Schema name should be at least 3 characters long');
            }
            
            if (!schemaData.settings || typeof schemaData.settings !== 'object') {
                errors.push('Schema settings must be an object');
            } else {
                // Validate settings structure
                const settingsValidation = await this.validateSettings(schemaData.settings);
                errors.push(...settingsValidation.errors);
                warnings.push(...settingsValidation.warnings);
                suggestions.push(...settingsValidation.suggestions);
            }
            
            // Check for duplicate names
            const existingSchema = this.schemas.find(s => 
                s.name === schemaData.name && s.id !== schemaData.id
            );
            if (existingSchema) {
                errors.push(`Schema name "${schemaData.name}" already exists`);
            }
            
            // Validate dependencies
            if (schemaData.dependencies) {
                const depValidation = await this.validateDependencies(schemaData.dependencies);
                errors.push(...depValidation.errors);
                warnings.push(...depValidation.warnings);
            }
            
            // Performance validation
            const performanceCheck = this.validatePerformance(schemaData.settings);
            warnings.push(...performanceCheck.warnings);
            suggestions.push(...performanceCheck.suggestions);
            
            return {
                isValid: errors.length === 0,
                errors: errors,
                warnings: warnings,
                suggestions: suggestions,
                score: this.calculateValidationScore(errors, warnings, suggestions)
            };
            
        } catch (error) {
            console.error('Schema validation error:', error);
            return {
                isValid: false,
                errors: ['Validation process failed: ' + error.message],
                warnings: [],
                suggestions: [],
                score: 0
            };
        }
    }
    
    /**
     * 🎯 Validate schema settings
     */
    async validateSettings(settings) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
        
        // Color validation
        Object.entries(settings).forEach(([key, value]) => {
            if (key.includes('color') || key.includes('background')) {
                if (!this.isValidColor(value)) {
                    errors.push(`Invalid color value for ${key}: ${value}`);
                } else if (this.isLowContrast(value, settings)) {
                    warnings.push(`Low contrast detected for ${key}`);
                    suggestions.push(`Consider using a darker/lighter shade for ${key}`);
                }
            }
            
            // Size validation
            if (key.includes('size') || key.includes('width') || key.includes('height')) {
                if (!this.isValidSize(value)) {
                    errors.push(`Invalid size value for ${key}: ${value}`);
                }
            }
            
            // Font validation
            if (key.includes('font')) {
                if (!this.isValidFont(value)) {
                    warnings.push(`Font "${value}" may not be available on all systems`);
                    suggestions.push(`Consider adding fallback fonts for ${key}`);
                }
            }
        });
        
        return { errors, warnings, suggestions };
    }
    
    /**
     * 🔗 Validate schema dependencies
     */
    async validateDependencies(dependencies) {
        const errors = [];
        const warnings = [];
        
        // Check plugin dependencies
        if (dependencies.plugins) {
            for (const plugin of dependencies.plugins) {
                const isActive = await this.checkPluginActive(plugin);
                if (!isActive) {
                    warnings.push(`Required plugin "${plugin}" is not active`);
                }
            }
        }
        
        // Check theme dependencies
        if (dependencies.themes) {
            const currentTheme = await this.getCurrentTheme();
            if (!dependencies.themes.includes(currentTheme)) {
                warnings.push(`Schema optimized for themes: ${dependencies.themes.join(', ')}`);
            }
        }
        
        // Check WordPress version
        if (dependencies.wordpress_version) {
            const currentVersion = await this.getWordPressVersion();
            if (this.compareVersions(currentVersion, dependencies.wordpress_version) < 0) {
                errors.push(`Requires WordPress ${dependencies.wordpress_version} or higher`);
            }
        }
        
        return { errors, warnings };
    }
    
    /**
     * ⚡ Validate performance impact
     */
    validatePerformance(settings) {
        const warnings = [];
        const suggestions = [];
        
        // Count CSS variables
        const variableCount = Object.keys(settings).length;
        if (variableCount > 100) {
            warnings.push(`High number of CSS variables (${variableCount}) may impact performance`);
            suggestions.push('Consider grouping related settings or using CSS custom properties');
        }
        
        // Check for complex selectors
        Object.entries(settings).forEach(([key, value]) => {
            if (typeof value === 'string' && value.includes('calc(')) {
                const calcComplexity = (value.match(/calc\(/g) || []).length;
                if (calcComplexity > 3) {
                    warnings.push(`Complex calc() expression in ${key} may impact performance`);
                }
            }
        });
        
        return { warnings, suggestions };
    }
    
    /**
     * 📊 Calculate validation score
     */
    calculateValidationScore(errors, warnings, suggestions) {
        let score = 100;
        score -= errors.length * 20;
        score -= warnings.length * 5;
        score -= suggestions.length * 2;
        return Math.max(0, score);
    }
    
    /**
     * 🎨 Color validation helpers
     */
    isValidColor(color) {
        const colorRegex = /^(#([0-9A-Fa-f]{3}){1,2}|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\)|[a-zA-Z]+)$/;
        return colorRegex.test(color);
    }
    
    isLowContrast(color, settings) {
        // Simplified contrast check - in real implementation, use proper contrast ratio calculation
        const backgroundColor = settings.content_background || '#ffffff';
        return this.calculateContrastRatio(color, backgroundColor) < 4.5;
    }
    
    calculateContrastRatio(color1, color2) {
        // Simplified implementation - use proper color contrast calculation
        return 7; // Placeholder
    }
    
    /**
     * 📏 Size validation helpers
     */
    isValidSize(size) {
        const sizeRegex = /^(\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)?)$/;
        return sizeRegex.test(size);
    }
    
    /**
     * 🔤 Font validation helpers
     */
    isValidFont(font) {
        const commonFonts = [
            'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
            'Courier New', 'Trebuchet MS', 'Arial Black', 'Impact', 'Comic Sans MS'
        ];
        return commonFonts.some(f => font.toLowerCase().includes(f.toLowerCase()));
    }
    
    /**
     * 📝 Create schema version
     */
    async createSchemaVersion(schemaId, schemaData, note = '') {
        const version = {
            version: schemaData.version,
            data: { ...schemaData },
            created: new Date().toISOString(),
            note: note,
            author: this.getCurrentUser()
        };
        
        if (!this.schemaHistory.has(schemaId)) {
            this.schemaHistory.set(schemaId, []);
        }
        
        this.schemaHistory.get(schemaId).push(version);
        
        // Keep only last 10 versions
        const history = this.schemaHistory.get(schemaId);
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }
        
        // Save to server
        try {
            await fetch(`${this.apiBase}/${schemaId}/versions`, {
                method: 'POST',
                headers: {
                    'X-WP-Nonce': this.nonce,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(version)
            });
        } catch (error) {
            console.warn('Failed to save version to server:', error);
        }
    }
    
    /**
     * 🔧 Utility methods
     */
    generateSchemaId() {
        return 'schema_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getCurrentUser() {
        return window.wpUser?.display_name || 'Unknown User';
    }
    
    incrementVersion(version) {
        const parts = version.split('.');
        parts[2] = (parseInt(parts[2]) + 1).toString();
        return parts.join('.');
    }
    
    parseVersion(version) {
        const parts = version.split('.').map(Number);
        return { major: parts[0], minor: parts[1], patch: parts[2] };
    }
    
    compareVersions(version1, version2) {
        const v1 = this.parseVersion(version1);
        const v2 = this.parseVersion(version2);
        
        if (v1.major !== v2.major) return v1.major - v2.major;
        if (v1.minor !== v2.minor) return v1.minor - v2.minor;
        return v1.patch - v2.patch;
    }
    
    /**
     * 🎯 Setup validation rules
     */
    setupValidationRules() {
        // Define validation rules for different setting types
        this.validationRules.set('color', {
            required: false,
            pattern: /^(#([0-9A-Fa-f]{3}){1,2}|rgb\(.*\)|rgba\(.*\)|hsl\(.*\)|hsla\(.*\)|[a-zA-Z]+)$/,
            message: 'Invalid color format'
        });
        
        this.validationRules.set('size', {
            required: false,
            pattern: /^(\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|pc|in|cm|mm|ex|ch|vmin|vmax)?)$/,
            message: 'Invalid size format'
        });
        
        this.validationRules.set('boolean', {
            required: false,
            validator: (value) => typeof value === 'boolean' || value === '0' || value === '1',
            message: 'Must be a boolean value'
        });
    }
    
    /**
     * 🔄 Initialize versioning system
     */
    initVersioning() {
        // Setup auto-versioning on significant changes
        this.addEventListener('schemaUpdated', (event) => {
            const { schema } = event.detail;
            console.log(`Schema ${schema.name} updated to version ${schema.version}`);
        });
    }
    
    /**
     * 💾 Setup auto-save functionality
     */
    setupAutoSave() {
        let autoSaveTimeout;
        
        this.addEventListener('schemaChanged', (event) => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                this.autoSaveSchema(event.detail.schemaId, event.detail.changes);
            }, 30000); // Auto-save after 30 seconds of inactivity
        });
    }
    
    /**
     * 💾 Auto-save schema changes
     */
    async autoSaveSchema(schemaId, changes) {
        try {
            await this.updateSchema(schemaId, changes, false);
            console.log(`Auto-saved schema ${schemaId}`);
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }
    
    /**
     * 🎯 Event system
     */
    addEventListener(eventName, callback) {
        if (!this.eventListeners) {
            this.eventListeners = new Map();
        }
        
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        
        this.eventListeners.get(eventName).push(callback);
    }
    
    dispatchEvent(eventName, detail) {
        if (this.eventListeners && this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(callback => {
                callback({ detail });
            });
        }
        
        // Also dispatch as DOM event
        const event = new CustomEvent(`schema${eventName}`, { detail });
        document.dispatchEvent(event);
    }
    
    /**
     * 🗑️ Show delete confirmation dialog
     */
    async showDeleteConfirmation(schema) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'mas-delete-confirmation-modal';
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
                <h3 style="margin: 0 0 1.5rem 0; color: #d63638;">🗑️ Delete Schema</h3>
                <p style="margin: 0 0 1rem 0; color: #666;">Are you sure you want to delete the schema:</p>
                <p style="margin: 0 0 1.5rem 0; font-weight: bold; color: #333;">"${schema.name}"</p>
                <p style="margin: 0 0 1.5rem 0; color: #d63638; font-size: 0.9rem;">⚠️ This action cannot be undone. All version history will be lost.</p>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
                    <button class="cancel-btn" style="padding: 0.75rem 1.5rem; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button class="delete-btn" style="padding: 0.75rem 1.5rem; background: #d63638; color: white; border: none; border-radius: 6px; cursor: pointer;">Delete Schema</button>
                </div>
            `;
            
            // Event handlers
            content.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(false);
                }, 300);
            });
            
            content.querySelector('.delete-btn').addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    resolve(true);
                }, 300);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                        resolve(false);
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
     * 📊 Get schema statistics
     */
    getSchemaStatistics() {
        return {
            total: this.schemas.length,
            byStatus: this.schemas.reduce((acc, schema) => {
                acc[schema.status] = (acc[schema.status] || 0) + 1;
                return acc;
            }, {}),
            byAuthor: this.schemas.reduce((acc, schema) => {
                const author = schema.author || 'Unknown';
                acc[author] = (acc[author] || 0) + 1;
                return acc;
            }, {}),
            totalVersions: Array.from(this.schemaHistory.values()).reduce((sum, history) => sum + history.length, 0)
        };
    }
    
    /**
     * 🔍 Search schemas
     */
    searchSchemas(query, filters = {}) {
        return this.schemas.filter(schema => {
            // Text search
            const matchesQuery = !query || 
                schema.name.toLowerCase().includes(query.toLowerCase()) ||
                (schema.description && schema.description.toLowerCase().includes(query.toLowerCase()));
            
            // Status filter
            const matchesStatus = !filters.status || schema.status === filters.status;
            
            // Author filter
            const matchesAuthor = !filters.author || schema.author === filters.author;
            
            // Date range filter
            const matchesDateRange = !filters.dateRange || (
                new Date(schema.created) >= new Date(filters.dateRange.start) &&
                new Date(schema.created) <= new Date(filters.dateRange.end)
            );
            
            return matchesQuery && matchesStatus && matchesAuthor && matchesDateRange;
        });
    }
    
    /**
     * 📋 Populate schema history from server data
     */
    populateSchemaHistory(historyData) {
        Object.entries(historyData).forEach(([schemaId, history]) => {
            this.schemaHistory.set(schemaId, history);
        });
    }
    
    /**
     * 🔄 Update schema history
     */
    updateSchemaHistory(schemaId, schemaData) {
        if (!this.schemaHistory.has(schemaId)) {
            this.schemaHistory.set(schemaId, []);
        }
        
        const history = this.schemaHistory.get(schemaId);
        const existingIndex = history.findIndex(v => v.version === schemaData.version);
        
        if (existingIndex !== -1) {
            history[existingIndex] = {
                version: schemaData.version,
                data: { ...schemaData },
                created: schemaData.modified,
                author: schemaData.metadata?.lastModifiedBy || this.getCurrentUser()
            };
        }
    }
    
    /**
     * 🔄 Initialize schema history for new schema
     */
    initSchemaHistory(schemaId, schemaData) {
        const initialVersion = {
            version: schemaData.version,
            data: { ...schemaData },
            created: schemaData.created,
            note: 'Initial version',
            author: schemaData.author
        };
        
        this.schemaHistory.set(schemaId, [initialVersion]);
    }
    
    /**
     * 🔍 Helper methods for dependency validation
     */
    async checkPluginActive(pluginSlug) {
        // In real implementation, check with WordPress API
        return true; // Placeholder
    }
    
    async getCurrentTheme() {
        // In real implementation, get current theme from WordPress
        return 'default'; // Placeholder
    }
    
    async getWordPressVersion() {
        // In real implementation, get WordPress version
        return '6.0.0'; // Placeholder
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaManager;
} else if (typeof window !== 'undefined') {
    window.SchemaManager = SchemaManager;
}