/**
 * Code Snippets Library
 * Manages predefined and user-contributed code snippets for CSS/JS/HTML
 */

class CodeSnippetsLibrary {
    constructor(options = {}) {
        this.options = {
            storageKey: 'wp_admin_code_snippets',
            enableUserSnippets: true,
            enableSharing: false,
            maxSnippetSize: 10000, // 10KB per snippet
            maxUserSnippets: 100,
            ...options
        };
        
        this.snippets = new Map();
        this.categories = new Map();
        this.searchIndex = new Map();
        this.userSnippets = new Map();
        
        this.initializePredefinedSnippets();
        this.loadUserSnippets();
        this.buildSearchIndex();
    }

    initializePredefinedSnippets() {
        // WordPress Admin CSS Snippets
        this.addPredefinedSnippet({
            id: 'wp-admin-dark-theme',
            title: 'Dark Admin Theme',
            description: 'Complete dark theme for WordPress admin panel',
            category: 'themes',
            language: 'css',
            tags: ['dark', 'theme', 'admin', 'wordpress'],
            code: `/* WordPress Admin Dark Theme */
:root {
    --wp-admin-bg: #1e1e1e;
    --wp-admin-text: #e0e0e0;
    --wp-admin-accent: #0073aa;
    --wp-admin-hover: #005177;
    --wp-admin-border: #3c3c3c;
}

body.wp-admin {
    background: var(--wp-admin-bg);
    color: var(--wp-admin-text);
}

#wpwrap {
    background: var(--wp-admin-bg);
}

#adminmenu {
    background: #2c2c2c;
    border-right: 1px solid var(--wp-admin-border);
}

#adminmenu .wp-menu-name {
    color: var(--wp-admin-text);
}

#adminmenu .wp-menu-name:hover {
    color: var(--wp-admin-accent);
}

.postbox {
    background: #2a2a2a;
    border: 1px solid var(--wp-admin-border);
    color: var(--wp-admin-text);
}

.postbox .hndle {
    background: #333;
    border-bottom: 1px solid var(--wp-admin-border);
    color: var(--wp-admin-text);
}`
        });

        this.addPredefinedSnippet({
            id: 'wp-custom-login-form',
            title: 'Custom Login Form Styling',
            description: 'Beautiful custom styling for WordPress login form',
            category: 'forms',
            language: 'css',
            tags: ['login', 'form', 'styling', 'custom'],
            code: `/* Custom WordPress Login Form */
body.login {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

#login {
    padding: 8% 0 0;
    margin: auto;
}

.login form {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 10px;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    padding: 40px;
    backdrop-filter: blur(10px);
}

.login input[type="text"],
.login input[type="password"] {
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 16px;
    transition: border-color 0.3s ease;
}

.login input[type="text"]:focus,
.login input[type="password"]:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.wp-core-ui .button-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    text-shadow: none;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    transition: transform 0.2s ease;
}

.wp-core-ui .button-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}`
        });

        this.addPredefinedSnippet({
            id: 'wp-responsive-admin-menu',
            title: 'Responsive Admin Menu',
            description: 'Mobile-friendly responsive admin menu styling',
            category: 'responsive',
            language: 'css',
            tags: ['responsive', 'mobile', 'menu', 'admin'],
            code: `/* Responsive WordPress Admin Menu */
@media screen and (max-width: 782px) {
    #adminmenu {
        position: fixed;
        left: -190px;
        top: 46px;
        z-index: 99999;
        height: calc(100vh - 46px);
        transition: left 0.3s ease;
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
    }
    
    #adminmenu.mobile-open {
        left: 0;
    }
    
    .mobile-menu-toggle {
        display: block;
        position: fixed;
        top: 8px;
        left: 8px;
        z-index: 100000;
        background: #23282d;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
    }
    
    #wpcontent {
        margin-left: 0;
        padding-left: 20px;
    }
    
    .postbox {
        margin: 10px 0;
    }
    
    .form-table th,
    .form-table td {
        display: block;
        width: 100%;
        padding: 10px 0;
    }
    
    .form-table th {
        border-bottom: none;
        font-weight: bold;
    }
}`
        });

        // WordPress JavaScript Snippets
        this.addPredefinedSnippet({
            id: 'wp-ajax-handler',
            title: 'WordPress AJAX Handler',
            description: 'Complete AJAX handler with error handling and nonce verification',
            category: 'ajax',
            language: 'javascript',
            tags: ['ajax', 'wordpress', 'nonce', 'security'],
            code: `// WordPress AJAX Handler with Security
(function($) {
    'use strict';
    
    const WPAjaxHandler = {
        // Configuration
        config: {
            ajaxUrl: ajaxurl || '/wp-admin/admin-ajax.php',
            nonce: $('#wp_ajax_nonce').val() || '',
            timeout: 30000
        },
        
        // Send AJAX request
        send: function(action, data, options) {
            const defaults = {
                type: 'POST',
                dataType: 'json',
                timeout: this.config.timeout,
                beforeSend: this.beforeSend,
                success: this.onSuccess,
                error: this.onError,
                complete: this.onComplete
            };
            
            const settings = $.extend({}, defaults, options);
            
            // Prepare data
            const requestData = {
                action: action,
                nonce: this.config.nonce,
                ...data
            };
            
            return $.ajax({
                url: this.config.ajaxUrl,
                data: requestData,
                ...settings
            });
        },
        
        // Before send callback
        beforeSend: function(xhr, settings) {
            console.log('Sending AJAX request:', settings.data);
            // Show loading indicator
            $('.ajax-loading').show();
        },
        
        // Success callback
        onSuccess: function(response, textStatus, xhr) {
            if (response.success) {
                console.log('AJAX success:', response.data);
                // Handle success
                if (typeof response.data.message !== 'undefined') {
                    WPAjaxHandler.showNotice(response.data.message, 'success');
                }
            } else {
                console.error('AJAX error:', response.data);
                WPAjaxHandler.showNotice(response.data.message || 'An error occurred', 'error');
            }
        },
        
        // Error callback
        onError: function(xhr, textStatus, errorThrown) {
            console.error('AJAX request failed:', textStatus, errorThrown);
            
            let message = 'Request failed';
            if (textStatus === 'timeout') {
                message = 'Request timed out';
            } else if (textStatus === 'abort') {
                message = 'Request was aborted';
            } else if (xhr.status === 403) {
                message = 'Access denied';
            } else if (xhr.status === 404) {
                message = 'Endpoint not found';
            }
            
            WPAjaxHandler.showNotice(message, 'error');
        },
        
        // Complete callback
        onComplete: function(xhr, textStatus) {
            // Hide loading indicator
            $('.ajax-loading').hide();
        },
        
        // Show admin notice
        showNotice: function(message, type) {
            const noticeClass = type === 'error' ? 'notice-error' : 'notice-success';
            const notice = $('<div class="notice ' + noticeClass + ' is-dismissible"><p>' + message + '</p></div>');
            
            $('.wrap h1').after(notice);
            
            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                notice.fadeOut();
            }, 5000);
        }
    };
    
    // Example usage:
    // WPAjaxHandler.send('save_settings', { setting1: 'value1' });
    
    // Make available globally
    window.WPAjaxHandler = WPAjaxHandler;
    
})(jQuery);`
        });

        this.addPredefinedSnippet({
            id: 'wp-color-picker-init',
            title: 'WordPress Color Picker Initialization',
            description: 'Initialize WordPress color picker with custom options',
            category: 'ui',
            language: 'javascript',
            tags: ['color-picker', 'ui', 'wordpress', 'customization'],
            code: `// WordPress Color Picker Initialization
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Initialize color pickers
        $('.color-picker').each(function() {
            const $this = $(this);
            const options = {
                // Default color
                defaultColor: $this.data('default-color') || '#ffffff',
                
                // Show palette
                palettes: $this.data('palettes') !== false,
                
                // Custom palette colors
                palettes: [
                    '#000000', '#ffffff', '#dd3333', '#dd9933',
                    '#eeee22', '#81d742', '#1e73be', '#8224e3'
                ],
                
                // Change callback
                change: function(event, ui) {
                    const color = ui.color.toString();
                    console.log('Color changed to:', color);
                    
                    // Trigger custom event
                    $this.trigger('colorChanged', [color]);
                    
                    // Update preview if exists
                    const preview = $this.siblings('.color-preview');
                    if (preview.length) {
                        preview.css('background-color', color);
                    }
                },
                
                // Clear callback
                clear: function() {
                    console.log('Color cleared');
                    $this.trigger('colorCleared');
                    
                    // Clear preview
                    const preview = $this.siblings('.color-preview');
                    if (preview.length) {
                        preview.css('background-color', 'transparent');
                    }
                }
            };
            
            // Initialize with options
            $this.wpColorPicker(options);
        });
        
        // Custom color scheme handler
        $('.color-scheme-selector').on('change', function() {
            const scheme = $(this).val();
            applyColorScheme(scheme);
        });
    });
    
    // Apply predefined color scheme
    function applyColorScheme(scheme) {
        const schemes = {
            default: {
                primary: '#0073aa',
                secondary: '#005177',
                accent: '#00a0d2'
            },
            dark: {
                primary: '#1e1e1e',
                secondary: '#2c2c2c',
                accent: '#0073aa'
            },
            blue: {
                primary: '#2271b1',
                secondary: '#135e96',
                accent: '#72aee6'
            }
        };
        
        if (schemes[scheme]) {
            Object.keys(schemes[scheme]).forEach(function(key) {
                const input = $('.color-picker[data-scheme="' + key + '"]');
                if (input.length) {
                    input.wpColorPicker('color', schemes[scheme][key]);
                }
            });
        }
    }
    
})(jQuery);`
        });

        // HTML Snippets
        this.addPredefinedSnippet({
            id: 'wp-admin-page-template',
            title: 'WordPress Admin Page Template',
            description: 'Complete admin page template with proper WordPress structure',
            category: 'templates',
            language: 'html',
            tags: ['admin', 'page', 'template', 'wordpress'],
            code: `<!-- WordPress Admin Page Template -->
<div class="wrap">
    <h1 class="wp-heading-inline">Page Title</h1>
    <a href="#" class="page-title-action">Add New</a>
    <hr class="wp-header-end">
    
    <!-- Admin Notices -->
    <div id="admin-notices"></div>
    
    <!-- Main Content -->
    <div class="admin-content">
        <!-- Settings Form -->
        <form method="post" action="options.php" id="admin-settings-form">
            <?php settings_fields('option_group'); ?>
            <?php do_settings_sections('option_group'); ?>
            
            <!-- Meta Boxes Container -->
            <div id="poststuff">
                <div id="post-body" class="metabox-holder columns-2">
                    <!-- Main Column -->
                    <div id="post-body-content">
                        <div class="postbox">
                            <div class="postbox-header">
                                <h2 class="hndle">Main Settings</h2>
                            </div>
                            <div class="inside">
                                <table class="form-table" role="presentation">
                                    <tbody>
                                        <tr>
                                            <th scope="row">
                                                <label for="setting_field">Setting Label</label>
                                            </th>
                                            <td>
                                                <input type="text" id="setting_field" name="setting_field" 
                                                       value="" class="regular-text" />
                                                <p class="description">Setting description</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th scope="row">
                                                <label for="color_setting">Color Setting</label>
                                            </th>
                                            <td>
                                                <input type="text" id="color_setting" name="color_setting" 
                                                       value="#ffffff" class="color-picker" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sidebar -->
                    <div id="postbox-container-1" class="postbox-container">
                        <div class="postbox">
                            <div class="postbox-header">
                                <h2 class="hndle">Quick Actions</h2>
                            </div>
                            <div class="inside">
                                <div class="submitbox">
                                    <div class="major-publishing-actions">
                                        <div class="publishing-action">
                                            <?php submit_button('Save Changes', 'primary', 'submit', false); ?>
                                        </div>
                                        <div class="clear"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="postbox">
                            <div class="postbox-header">
                                <h2 class="hndle">Information</h2>
                            </div>
                            <div class="inside">
                                <p>Additional information or help text goes here.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>
</div>

<!-- Loading Indicator -->
<div class="ajax-loading" style="display: none;">
    <div class="spinner is-active"></div>
</div>`
        });

        // Initialize categories
        this.categories.set('themes', { name: 'Themes', description: 'Color schemes and visual themes' });
        this.categories.set('forms', { name: 'Forms', description: 'Form styling and functionality' });
        this.categories.set('responsive', { name: 'Responsive', description: 'Mobile and responsive design' });
        this.categories.set('ajax', { name: 'AJAX', description: 'AJAX functionality and handlers' });
        this.categories.set('ui', { name: 'UI Components', description: 'User interface components' });
        this.categories.set('templates', { name: 'Templates', description: 'HTML templates and structures' });
        this.categories.set('user', { name: 'User Snippets', description: 'User-contributed snippets' });
    }

    addPredefinedSnippet(snippet) {
        snippet.predefined = true;
        snippet.author = 'WordPress Admin Editor';
        snippet.created = new Date().toISOString();
        snippet.rating = 5;
        snippet.downloads = 0;
        this.snippets.set(snippet.id, snippet);
    }

    /**
     * Add a user snippet
     */
    addUserSnippet(snippet) {
        if (!this.options.enableUserSnippets) {
            throw new Error('User snippets are disabled');
        }

        if (this.userSnippets.size >= this.options.maxUserSnippets) {
            throw new Error(`Maximum user snippets limit reached (${this.options.maxUserSnippets})`);
        }

        if (snippet.code.length > this.options.maxSnippetSize) {
            throw new Error(`Snippet too large (${snippet.code.length} > ${this.options.maxSnippetSize})`);
        }

        const userSnippet = {
            id: snippet.id || this.generateSnippetId(),
            title: snippet.title,
            description: snippet.description || '',
            category: snippet.category || 'user',
            language: snippet.language,
            tags: snippet.tags || [],
            code: snippet.code,
            predefined: false,
            author: snippet.author || 'User',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            rating: 0,
            downloads: 0,
            private: snippet.private || false
        };

        this.userSnippets.set(userSnippet.id, userSnippet);
        this.snippets.set(userSnippet.id, userSnippet);
        this.saveUserSnippets();
        this.updateSearchIndex(userSnippet);

        return userSnippet;
    }

    /**
     * Update a user snippet
     */
    updateUserSnippet(id, updates) {
        const snippet = this.userSnippets.get(id);
        if (!snippet) {
            throw new Error('Snippet not found');
        }

        const updatedSnippet = {
            ...snippet,
            ...updates,
            modified: new Date().toISOString()
        };

        this.userSnippets.set(id, updatedSnippet);
        this.snippets.set(id, updatedSnippet);
        this.saveUserSnippets();
        this.updateSearchIndex(updatedSnippet);

        return updatedSnippet;
    }

    /**
     * Delete a user snippet
     */
    deleteUserSnippet(id) {
        const snippet = this.userSnippets.get(id);
        if (!snippet) {
            throw new Error('Snippet not found');
        }

        this.userSnippets.delete(id);
        this.snippets.delete(id);
        this.removeFromSearchIndex(id);
        this.saveUserSnippets();

        return true;
    }

    /**
     * Get snippet by ID
     */
    getSnippet(id) {
        return this.snippets.get(id);
    }

    /**
     * Get all snippets
     */
    getAllSnippets() {
        return Array.from(this.snippets.values());
    }

    /**
     * Get snippets by category
     */
    getSnippetsByCategory(category) {
        return Array.from(this.snippets.values()).filter(snippet => 
            snippet.category === category
        );
    }

    /**
     * Get snippets by language
     */
    getSnippetsByLanguage(language) {
        return Array.from(this.snippets.values()).filter(snippet => 
            snippet.language === language
        );
    }

    /**
     * Search snippets
     */
    searchSnippets(query, options = {}) {
        const {
            language = null,
            category = null,
            tags = [],
            includeCode = false,
            limit = 50
        } = options;

        let results = Array.from(this.snippets.values());

        // Filter by language
        if (language) {
            results = results.filter(snippet => snippet.language === language);
        }

        // Filter by category
        if (category) {
            results = results.filter(snippet => snippet.category === category);
        }

        // Filter by tags
        if (tags.length > 0) {
            results = results.filter(snippet => 
                tags.some(tag => snippet.tags.includes(tag))
            );
        }

        // Text search
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase();
            results = results.filter(snippet => {
                const searchableText = [
                    snippet.title,
                    snippet.description,
                    snippet.tags.join(' '),
                    includeCode ? snippet.code : ''
                ].join(' ').toLowerCase();

                return searchableText.includes(searchTerm);
            });

            // Sort by relevance
            results.sort((a, b) => {
                const aRelevance = this.calculateRelevance(a, searchTerm);
                const bRelevance = this.calculateRelevance(b, searchTerm);
                return bRelevance - aRelevance;
            });
        } else {
            // Sort by rating and downloads
            results.sort((a, b) => {
                if (a.predefined && !b.predefined) return -1;
                if (!a.predefined && b.predefined) return 1;
                return (b.rating + b.downloads) - (a.rating + a.downloads);
            });
        }

        return results.slice(0, limit);
    }

    /**
     * Calculate search relevance
     */
    calculateRelevance(snippet, searchTerm) {
        let score = 0;
        
        if (snippet.title.toLowerCase().includes(searchTerm)) score += 10;
        if (snippet.description.toLowerCase().includes(searchTerm)) score += 5;
        if (snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm))) score += 3;
        
        score += snippet.rating;
        score += snippet.downloads * 0.1;
        
        return score;
    }

    /**
     * Get popular snippets
     */
    getPopularSnippets(limit = 10) {
        return Array.from(this.snippets.values())
            .sort((a, b) => (b.rating + b.downloads) - (a.rating + a.downloads))
            .slice(0, limit);
    }

    /**
     * Get recent snippets
     */
    getRecentSnippets(limit = 10) {
        return Array.from(this.snippets.values())
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, limit);
    }

    /**
     * Get categories
     */
    getCategories() {
        return Array.from(this.categories.entries()).map(([id, category]) => ({
            id,
            ...category,
            count: this.getSnippetsByCategory(id).length
        }));
    }

    /**
     * Get available tags
     */
    getTags() {
        const tagCounts = new Map();
        
        this.snippets.forEach(snippet => {
            snippet.tags.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        return Array.from(tagCounts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Export snippet
     */
    exportSnippet(id) {
        const snippet = this.getSnippet(id);
        if (!snippet) {
            throw new Error('Snippet not found');
        }

        return {
            ...snippet,
            exported: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import snippet
     */
    importSnippet(snippetData) {
        if (!snippetData.title || !snippetData.code || !snippetData.language) {
            throw new Error('Invalid snippet data');
        }

        const snippet = {
            title: snippetData.title,
            description: snippetData.description || '',
            category: snippetData.category || 'user',
            language: snippetData.language,
            tags: snippetData.tags || [],
            code: snippetData.code,
            author: snippetData.author || 'Imported'
        };

        return this.addUserSnippet(snippet);
    }

    /**
     * Rate snippet
     */
    rateSnippet(id, rating) {
        const snippet = this.snippets.get(id);
        if (!snippet) {
            throw new Error('Snippet not found');
        }

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Simple rating system - in real implementation, you'd track individual ratings
        snippet.rating = Math.round((snippet.rating + rating) / 2);
        
        if (!snippet.predefined) {
            this.saveUserSnippets();
        }

        return snippet.rating;
    }

    /**
     * Track snippet download/usage
     */
    trackSnippetUsage(id) {
        const snippet = this.snippets.get(id);
        if (snippet) {
            snippet.downloads++;
            if (!snippet.predefined) {
                this.saveUserSnippets();
            }
        }
    }

    // Private methods
    generateSnippetId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    buildSearchIndex() {
        this.searchIndex.clear();
        this.snippets.forEach(snippet => {
            this.updateSearchIndex(snippet);
        });
    }

    updateSearchIndex(snippet) {
        const words = [
            ...snippet.title.toLowerCase().split(/\s+/),
            ...snippet.description.toLowerCase().split(/\s+/),
            ...snippet.tags.map(tag => tag.toLowerCase())
        ];

        words.forEach(word => {
            if (word.length > 2) {
                if (!this.searchIndex.has(word)) {
                    this.searchIndex.set(word, new Set());
                }
                this.searchIndex.get(word).add(snippet.id);
            }
        });
    }

    removeFromSearchIndex(snippetId) {
        this.searchIndex.forEach((snippetIds, word) => {
            snippetIds.delete(snippetId);
            if (snippetIds.size === 0) {
                this.searchIndex.delete(word);
            }
        });
    }

    loadUserSnippets() {
        if (!this.options.enableUserSnippets) return;

        try {
            const stored = localStorage.getItem(this.options.storageKey);
            if (stored) {
                const userSnippets = JSON.parse(stored);
                userSnippets.forEach(snippet => {
                    this.userSnippets.set(snippet.id, snippet);
                    this.snippets.set(snippet.id, snippet);
                });
            }
        } catch (error) {
            console.error('Failed to load user snippets:', error);
        }
    }

    saveUserSnippets() {
        if (!this.options.enableUserSnippets) return;

        try {
            const userSnippetsArray = Array.from(this.userSnippets.values());
            localStorage.setItem(this.options.storageKey, JSON.stringify(userSnippetsArray));
        } catch (error) {
            console.error('Failed to save user snippets:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeSnippetsLibrary;
} else if (typeof window !== 'undefined') {
    window.CodeSnippetsLibrary = CodeSnippetsLibrary;
}