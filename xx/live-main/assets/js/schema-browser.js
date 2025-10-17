/**
 * Modern Admin Styler V2 - Advanced Schema Browser Interface
 * 
 * Visual schema browser with thumbnails, drag & drop, and comparison tools
 * 
 * @package ModernAdminStyler
 * @version 4.2.0 - Advanced Schema Interface
 */

class SchemaBrowser {
    constructor(schemaManager) {
        this.schemaManager = schemaManager;
        this.container = null;
        this.selectedSchemas = new Set();
        this.draggedSchema = null;
        this.comparisonMode = false;
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.sortBy = 'modified'; // 'name', 'created', 'modified', 'author'
        this.sortOrder = 'desc'; // 'asc' or 'desc'
        this.filterBy = 'all'; // 'all', 'active', 'draft', etc.
        
        this.init();
    }
    
    /**
     * 🚀 Initialize Schema Browser
     */
    init() {
        this.createBrowserInterface();
        this.bindEvents();
        this.loadSchemas();
        
        console.log('✅ Schema Browser initialized');
    }
    
    /**
     * 🎨 Create browser interface
     */
    createBrowserInterface() {
        this.container = document.createElement('div');
        this.container.className = 'schema-browser';
        this.container.innerHTML = this.getBrowserHTML();
        
        // Add styles
        this.addBrowserStyles();
        
        // Append to body or specified container
        const targetContainer = document.getElementById('schema-browser-container') || document.body;
        targetContainer.appendChild(this.container);
    }
    
    /**
     * 📝 Get browser HTML template
     */
    getBrowserHTML() {
        return `
            <div class="schema-browser-header">
                <div class="browser-title">
                    <h2>🗂️ Schema Browser</h2>
                    <div class="schema-count">
                        <span id="schema-count">0 schemas</span>
                    </div>
                </div>
                
                <div class="browser-controls">
                    <div class="view-controls">
                        <button class="view-btn active" data-view="grid" title="Grid View">
                            <span class="dashicons dashicons-grid-view"></span>
                        </button>
                        <button class="view-btn" data-view="list" title="List View">
                            <span class="dashicons dashicons-list-view"></span>
                        </button>
                    </div>
                    
                    <div class="sort-controls">
                        <select id="sort-by">
                            <option value="modified">Last Modified</option>
                            <option value="created">Date Created</option>
                            <option value="name">Name</option>
                            <option value="author">Author</option>
                        </select>
                        <button id="sort-order" class="sort-order-btn desc" title="Sort Order">
                            <span class="dashicons dashicons-arrow-down"></span>
                        </button>
                    </div>
                    
                    <div class="filter-controls">
                        <select id="filter-by">
                            <option value="all">All Schemas</option>
                            <option value="active">Active</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                    
                    <div class="action-controls">
                        <button id="compare-btn" class="action-btn" title="Compare Selected">
                            <span class="dashicons dashicons-admin-generic"></span>
                            Compare
                        </button>
                        <button id="bulk-actions-btn" class="action-btn" title="Bulk Actions">
                            <span class="dashicons dashicons-admin-tools"></span>
                            Actions
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="schema-browser-search">
                <div class="search-box">
                    <input type="text" id="schema-search" placeholder="Search schemas..." />
                    <span class="dashicons dashicons-search"></span>
                </div>
                <div class="search-filters">
                    <button class="filter-tag active" data-filter="all">All</button>
                    <button class="filter-tag" data-filter="recent">Recent</button>
                    <button class="filter-tag" data-filter="favorites">Favorites</button>
                    <button class="filter-tag" data-filter="shared">Shared</button>
                </div>
            </div>
            
            <div class="schema-browser-content">
                <div class="selection-info" style="display: none;">
                    <span class="selected-count">0 selected</span>
                    <button class="clear-selection">Clear Selection</button>
                </div>
                
                <div id="schema-grid" class="schema-grid">
                    <!-- Schema items will be populated here -->
                </div>
                
                <div class="loading-indicator" style="display: none;">
                    <div class="spinner"></div>
                    <span>Loading schemas...</span>
                </div>
                
                <div class="empty-state" style="display: none;">
                    <div class="empty-icon">📁</div>
                    <h3>No schemas found</h3>
                    <p>Create your first schema to get started</p>
                    <button class="create-schema-btn">Create Schema</button>
                </div>
            </div>
            
            <!-- Schema Comparison Modal -->
            <div id="comparison-modal" class="comparison-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔍 Schema Comparison</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="comparison-content">
                            <!-- Comparison content will be populated here -->
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Bulk Actions Modal -->
            <div id="bulk-actions-modal" class="bulk-actions-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>⚡ Bulk Actions</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="bulk-actions-list">
                            <button class="bulk-action" data-action="export">📤 Export Selected</button>
                            <button class="bulk-action" data-action="duplicate">📋 Duplicate Selected</button>
                            <button class="bulk-action" data-action="archive">📦 Archive Selected</button>
                            <button class="bulk-action danger" data-action="delete">🗑️ Delete Selected</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 🎨 Add browser styles
     */
    addBrowserStyles() {
        const styles = `
            <style id="schema-browser-styles">
                .schema-browser {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .schema-browser-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                .browser-title h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 600;
                }
                
                .schema-count {
                    font-size: 0.9rem;
                    opacity: 0.9;
                    margin-top: 0.25rem;
                }
                
                .browser-controls {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .view-controls {
                    display: flex;
                    background: rgba(255,255,255,0.2);
                    border-radius: 6px;
                    overflow: hidden;
                }
                
                .view-btn {
                    background: none;
                    border: none;
                    color: white;
                    padding: 0.5rem;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }
                
                .view-btn:hover,
                .view-btn.active {
                    background: rgba(255,255,255,0.3);
                }
                
                .sort-controls,
                .filter-controls {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                
                .sort-controls select,
                .filter-controls select {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    font-size: 0.9rem;
                }
                
                .sort-order-btn {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .sort-order-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .action-controls {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .action-btn {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }
                
                .action-btn:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .schema-browser-search {
                    padding: 1rem;
                    border-bottom: 1px solid #eee;
                    background: #fafafa;
                }
                
                .search-box {
                    position: relative;
                    margin-bottom: 1rem;
                }
                
                .search-box input {
                    width: 100%;
                    padding: 0.75rem 2.5rem 0.75rem 1rem;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 1rem;
                    background: white;
                }
                
                .search-box .dashicons {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #666;
                }
                
                .search-filters {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
                
                .filter-tag {
                    background: white;
                    border: 1px solid #ddd;
                    color: #666;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                }
                
                .filter-tag:hover,
                .filter-tag.active {
                    background: #0073aa;
                    color: white;
                    border-color: #0073aa;
                }
                
                .schema-browser-content {
                    padding: 1rem;
                    min-height: 400px;
                }
                
                .selection-info {
                    background: #e7f3ff;
                    border: 1px solid #b3d9ff;
                    border-radius: 6px;
                    padding: 0.75rem 1rem;
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .clear-selection {
                    background: none;
                    border: none;
                    color: #0073aa;
                    cursor: pointer;
                    text-decoration: underline;
                }
                
                .schema-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                }
                
                .schema-grid.list-view {
                    grid-template-columns: 1fr;
                }
                
                .schema-item {
                    background: white;
                    border: 2px solid #eee;
                    border-radius: 8px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    user-select: none;
                }
                
                .schema-item:hover {
                    border-color: #0073aa;
                    box-shadow: 0 4px 12px rgba(0,115,170,0.1);
                    transform: translateY(-2px);
                }
                
                .schema-item.selected {
                    border-color: #0073aa;
                    background: #f0f8ff;
                }
                
                .schema-item.dragging {
                    opacity: 0.5;
                    transform: rotate(5deg);
                }
                
                .schema-item.drag-over {
                    border-color: #00a32a;
                    background: #f0fff4;
                }
                
                .schema-thumbnail {
                    width: 100%;
                    height: 120px;
                    background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
                    border-radius: 6px;
                    margin-bottom: 1rem;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                }
                
                .schema-thumbnail.has-preview {
                    background: none;
                }
                
                .schema-preview {
                    width: 100%;
                    height: 100%;
                    border: none;
                    border-radius: 6px;
                    transform: scale(0.3);
                    transform-origin: top left;
                    pointer-events: none;
                }
                
                .schema-info {
                    flex: 1;
                }
                
                .schema-name {
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: #1d2327;
                    margin-bottom: 0.5rem;
                    line-height: 1.3;
                }
                
                .schema-description {
                    color: #666;
                    font-size: 0.9rem;
                    line-height: 1.4;
                    margin-bottom: 0.75rem;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .schema-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                    color: #666;
                    margin-bottom: 0.75rem;
                }
                
                .schema-status {
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }
                
                .schema-status.active {
                    background: #d4edda;
                    color: #155724;
                }
                
                .schema-status.draft {
                    background: #fff3cd;
                    color: #856404;
                }
                
                .schema-status.archived {
                    background: #f8d7da;
                    color: #721c24;
                }
                
                .schema-actions {
                    display: flex;
                    gap: 0.5rem;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .schema-item:hover .schema-actions {
                    opacity: 1;
                }
                
                .schema-action {
                    background: #f0f0f1;
                    border: none;
                    color: #666;
                    padding: 0.5rem;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.2s ease;
                }
                
                .schema-action:hover {
                    background: #0073aa;
                    color: white;
                }
                
                .schema-checkbox {
                    position: absolute;
                    top: 0.5rem;
                    right: 0.5rem;
                    width: 20px;
                    height: 20px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                
                .schema-item:hover .schema-checkbox,
                .schema-item.selected .schema-checkbox {
                    opacity: 1;
                }
                
                .loading-indicator {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                }
                
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #0073aa;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                }
                
                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                
                .empty-state h3 {
                    margin: 0 0 0.5rem 0;
                    color: #1d2327;
                }
                
                .create-schema-btn {
                    background: #0073aa;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-top: 1rem;
                    transition: background 0.2s ease;
                }
                
                .create-schema-btn:hover {
                    background: #005a87;
                }
                
                /* Modal Styles */
                .comparison-modal,
                .bulk-actions-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                }
                
                .modal-content {
                    background: white;
                    border-radius: 8px;
                    max-width: 90vw;
                    max-height: 90vh;
                    overflow: hidden;
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                
                .modal-header {
                    background: #f8f9fa;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-header h3 {
                    margin: 0;
                    color: #1d2327;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .modal-close:hover {
                    color: #000;
                }
                
                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    max-height: calc(90vh - 80px);
                }
                
                .bulk-actions-list {
                    display: grid;
                    gap: 0.5rem;
                }
                
                .bulk-action {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    color: #495057;
                    padding: 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    text-align: left;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                }
                
                .bulk-action:hover {
                    background: #e9ecef;
                    border-color: #adb5bd;
                }
                
                .bulk-action.danger {
                    color: #dc3545;
                    border-color: #dc3545;
                }
                
                .bulk-action.danger:hover {
                    background: #f8d7da;
                }
                
                /* List View Styles */
                .schema-grid.list-view .schema-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                }
                
                .schema-grid.list-view .schema-thumbnail {
                    width: 80px;
                    height: 60px;
                    margin-bottom: 0;
                    flex-shrink: 0;
                }
                
                .schema-grid.list-view .schema-info {
                    flex: 1;
                }
                
                .schema-grid.list-view .schema-description {
                    -webkit-line-clamp: 1;
                }
                
                /* Responsive Design */
                @media (max-width: 768px) {
                    .schema-browser-header {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .browser-controls {
                        justify-content: space-between;
                    }
                    
                    .schema-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .modal-content {
                        max-width: 95vw;
                        margin: 1rem;
                    }
                }
            </style>
        `;
        
        // Add styles to head if not already present
        if (!document.getElementById('schema-browser-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
    }
    
    /**
     * 🎯 Bind event listeners
     */
    bindEvents() {
        // View mode toggle
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setViewMode(e.target.closest('.view-btn').dataset.view);
            });
        });
        
        // Sort controls
        const sortBySelect = this.container.querySelector('#sort-by');
        const sortOrderBtn = this.container.querySelector('#sort-order');
        
        sortBySelect.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderSchemas();
        });
        
        sortOrderBtn.addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            sortOrderBtn.className = `sort-order-btn ${this.sortOrder}`;
            sortOrderBtn.querySelector('.dashicons').className = 
                `dashicons dashicons-arrow-${this.sortOrder === 'asc' ? 'up' : 'down'}`;
            this.renderSchemas();
        });
        
        // Filter controls
        const filterBySelect = this.container.querySelector('#filter-by');
        filterBySelect.addEventListener('change', (e) => {
            this.filterBy = e.target.value;
            this.renderSchemas();
        });
        
        // Search
        const searchInput = this.container.querySelector('#schema-search');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value;
                this.renderSchemas();
            }, 300);
        });
        
        // Filter tags
        this.container.querySelectorAll('.filter-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                this.container.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.filterBy = e.target.dataset.filter;
                this.renderSchemas();
            });
        });
        
        // Action buttons
        this.container.querySelector('#compare-btn').addEventListener('click', () => {
            this.openComparisonModal();
        });
        
        this.container.querySelector('#bulk-actions-btn').addEventListener('click', () => {
            this.openBulkActionsModal();
        });
        
        // Clear selection
        this.container.querySelector('.clear-selection').addEventListener('click', () => {
            this.clearSelection();
        });
        
        // Modal close buttons
        this.container.querySelectorAll('.modal-close, .modal-backdrop').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target === btn) {
                    this.closeModals();
                }
            });
        });
        
        // Bulk actions
        this.container.querySelectorAll('.bulk-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.executeBulkAction(e.target.dataset.action);
            });
        });
        
        // Create schema button
        this.container.querySelector('.create-schema-btn')?.addEventListener('click', () => {
            this.createNewSchema();
        });
    }
    
    /**
     * 📋 Load schemas from manager
     */
    async loadSchemas() {
        this.showLoading(true);
        
        try {
            // Get schemas from schema manager
            await this.schemaManager.loadSchemas();
            this.schemas = this.schemaManager.schemas;
            
            this.renderSchemas();
            this.updateSchemaCount();
            
        } catch (error) {
            console.error('Failed to load schemas:', error);
            this.showError('Failed to load schemas: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * 🎨 Render schemas in the grid
     */
    renderSchemas() {
        const grid = this.container.querySelector('#schema-grid');
        const filteredSchemas = this.getFilteredSchemas();
        
        if (filteredSchemas.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        
        grid.innerHTML = filteredSchemas.map(schema => this.createSchemaItemHTML(schema)).join('');
        
        // Bind events for schema items
        this.bindSchemaItemEvents();
        
        // Generate thumbnails
        this.generateThumbnails(filteredSchemas);
    }
    
    /**
     * 🔍 Get filtered and sorted schemas
     */
    getFilteredSchemas() {
        let filtered = [...this.schemas];
        
        // Apply search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(schema => 
                schema.name.toLowerCase().includes(query) ||
                (schema.description && schema.description.toLowerCase().includes(query)) ||
                (schema.author && schema.author.toLowerCase().includes(query))
            );
        }
        
        // Apply status filter
        if (this.filterBy !== 'all') {
            if (this.filterBy === 'recent') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filtered = filtered.filter(schema => new Date(schema.modified) > weekAgo);
            } else if (this.filterBy === 'favorites') {
                filtered = filtered.filter(schema => schema.favorite);
            } else if (this.filterBy === 'shared') {
                filtered = filtered.filter(schema => schema.shared);
            } else {
                filtered = filtered.filter(schema => schema.status === this.filterBy);
            }
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            switch (this.sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'created':
                    aVal = new Date(a.created);
                    bVal = new Date(b.created);
                    break;
                case 'modified':
                    aVal = new Date(a.modified);
                    bVal = new Date(b.modified);
                    break;
                case 'author':
                    aVal = (a.author || '').toLowerCase();
                    bVal = (b.author || '').toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        
        return filtered;
    }
    
    /**
     * 📝 Create schema item HTML
     */
    createSchemaItemHTML(schema) {
        const statusClass = schema.status || 'draft';
        const isSelected = this.selectedSchemas.has(schema.id);
        
        return `
            <div class="schema-item ${isSelected ? 'selected' : ''}" 
                 data-schema-id="${schema.id}"
                 draggable="true">
                
                <input type="checkbox" class="schema-checkbox" 
                       ${isSelected ? 'checked' : ''} />
                
                <div class="schema-thumbnail" data-schema-id="${schema.id}">
                    🎨
                </div>
                
                <div class="schema-info">
                    <div class="schema-name">${this.escapeHtml(schema.name)}</div>
                    <div class="schema-description">${this.escapeHtml(schema.description || 'No description')}</div>
                    
                    <div class="schema-meta">
                        <span class="schema-author">by ${this.escapeHtml(schema.author || 'Unknown')}</span>
                        <span class="schema-status ${statusClass}">${statusClass}</span>
                    </div>
                    
                    <div class="schema-actions">
                        <button class="schema-action" data-action="edit" title="Edit">
                            ✏️
                        </button>
                        <button class="schema-action" data-action="duplicate" title="Duplicate">
                            📋
                        </button>
                        <button class="schema-action" data-action="export" title="Export">
                            📤
                        </button>
                        <button class="schema-action" data-action="delete" title="Delete">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 🎯 Bind events for schema items
     */
    bindSchemaItemEvents() {
        const schemaItems = this.container.querySelectorAll('.schema-item');
        
        schemaItems.forEach(item => {
            const schemaId = item.dataset.schemaId;
            const checkbox = item.querySelector('.schema-checkbox');
            
            // Item click (selection)
            item.addEventListener('click', (e) => {
                if (e.target.closest('.schema-action') || e.target === checkbox) return;
                
                if (e.ctrlKey || e.metaKey) {
                    this.toggleSchemaSelection(schemaId);
                } else {
                    this.selectSchema(schemaId, !e.shiftKey);
                }
            });
            
            // Checkbox change
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                this.toggleSchemaSelection(schemaId);
            });
            
            // Drag and drop
            item.addEventListener('dragstart', (e) => {
                this.draggedSchema = schemaId;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', schemaId);
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.draggedSchema = null;
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                item.classList.add('drag-over');
            });
            
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                const sourceId = e.dataTransfer.getData('text/plain');
                const targetId = schemaId;
                
                if (sourceId !== targetId) {
                    this.handleSchemaDrop(sourceId, targetId);
                }
            });
            
            // Action buttons
            item.querySelectorAll('.schema-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    this.executeSchemaAction(schemaId, action);
                });
            });
        });
    }
    
    /**
     * 🖼️ Generate schema thumbnails
     */
    async generateThumbnails(schemas) {
        for (const schema of schemas) {
            try {
                const thumbnail = await this.createSchemaThumbnail(schema);
                const thumbnailElement = this.container.querySelector(`[data-schema-id="${schema.id}"]`);
                
                if (thumbnailElement && thumbnail) {
                    thumbnailElement.innerHTML = '';
                    thumbnailElement.appendChild(thumbnail);
                    thumbnailElement.classList.add('has-preview');
                }
            } catch (error) {
                console.warn(`Failed to generate thumbnail for schema ${schema.id}:`, error);
            }
        }
    }
    
    /**
     * 🎨 Create schema thumbnail
     */
    async createSchemaThumbnail(schema) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 280;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            
            // Create a simple visual representation of the schema
            const settings = schema.settings || {};
            
            // Background
            ctx.fillStyle = settings.content_background || '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Admin bar
            ctx.fillStyle = settings.admin_bar_background || '#23282d';
            ctx.fillRect(0, 0, canvas.width, 20);
            
            // Menu area
            ctx.fillStyle = settings.menu_background || '#32373c';
            ctx.fillRect(0, 20, 60, canvas.height - 20);
            
            // Primary color accent
            ctx.fillStyle = settings.primary_color || '#0073aa';
            ctx.fillRect(70, 30, canvas.width - 80, 10);
            
            // Secondary elements
            ctx.fillStyle = settings.secondary_color || '#005a87';
            ctx.fillRect(70, 50, (canvas.width - 80) * 0.7, 8);
            ctx.fillRect(70, 65, (canvas.width - 80) * 0.5, 8);
            
            // Convert to image
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.className = 'schema-preview';
            img.alt = `Preview of ${schema.name}`;
            
            resolve(img);
        });
    }
    
    /**
     * 🎯 Schema selection methods
     */
    selectSchema(schemaId, clearOthers = true) {
        if (clearOthers) {
            this.selectedSchemas.clear();
        }
        
        this.selectedSchemas.add(schemaId);
        this.updateSelectionUI();
    }
    
    toggleSchemaSelection(schemaId) {
        if (this.selectedSchemas.has(schemaId)) {
            this.selectedSchemas.delete(schemaId);
        } else {
            this.selectedSchemas.add(schemaId);
        }
        
        this.updateSelectionUI();
    }
    
    clearSelection() {
        this.selectedSchemas.clear();
        this.updateSelectionUI();
    }
    
    updateSelectionUI() {
        const selectionInfo = this.container.querySelector('.selection-info');
        const selectedCount = this.selectedSchemas.size;
        
        if (selectedCount > 0) {
            selectionInfo.style.display = 'flex';
            selectionInfo.querySelector('.selected-count').textContent = 
                `${selectedCount} selected`;
        } else {
            selectionInfo.style.display = 'none';
        }
        
        // Update item selection states
        this.container.querySelectorAll('.schema-item').forEach(item => {
            const schemaId = item.dataset.schemaId;
            const isSelected = this.selectedSchemas.has(schemaId);
            
            item.classList.toggle('selected', isSelected);
            item.querySelector('.schema-checkbox').checked = isSelected;
        });
    }
    
    /**
     * 🔄 Handle schema drag and drop
     */
    async handleSchemaDrop(sourceId, targetId) {
        try {
            const sourceSchema = this.schemas.find(s => s.id === sourceId);
            const targetSchema = this.schemas.find(s => s.id === targetId);
            
            if (!sourceSchema || !targetSchema) return;
            
            // Show copy options dialog
            const action = await this.showCopyOptionsDialog(sourceSchema, targetSchema);
            
            if (action === 'merge') {
                await this.mergeSchemas(sourceSchema, targetSchema);
            } else if (action === 'copy') {
                await this.copySchemaSettings(sourceSchema, targetSchema);
            }
            
        } catch (error) {
            console.error('Schema drop failed:', error);
            if (window.masToast) {
                window.masToast.show('error', 'Failed to process schema drop: ' + error.message, 5000);
            }
        }
    }
    
    /**
     * 📋 Show copy options dialog
     */
    async showCopyOptionsDialog(sourceSchema, targetSchema) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'copy-options-modal';
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
            `;
            
            modal.innerHTML = `
                <div class="modal-content" style="background: white; border-radius: 8px; padding: 2rem; max-width: 500px;">
                    <h3>🔄 Copy Schema Settings</h3>
                    <p>How would you like to copy settings from <strong>"${sourceSchema.name}"</strong> to <strong>"${targetSchema.name}"</strong>?</p>
                    
                    <div style="display: grid; gap: 1rem; margin: 1.5rem 0;">
                        <button class="copy-option" data-action="merge">
                            🔀 Merge Settings
                            <small style="display: block; color: #666; margin-top: 0.25rem;">
                                Combine settings from both schemas
                            </small>
                        </button>
                        
                        <button class="copy-option" data-action="copy">
                            📋 Replace Settings
                            <small style="display: block; color: #666; margin-top: 0.25rem;">
                                Replace target settings with source settings
                            </small>
                        </button>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button class="cancel-btn">Cancel</button>
                    </div>
                </div>
            `;
            
            // Style buttons
            modal.querySelectorAll('.copy-option').forEach(btn => {
                btn.style.cssText = `
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    padding: 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s ease;
                `;
                
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = '#e9ecef';
                });
                
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = '#f8f9fa';
                });
                
                btn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                    resolve(btn.dataset.action);
                });
            });
            
            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(null);
                }
            });
            
            document.body.appendChild(modal);
        });
    }
    
    /**
     * 🔀 Merge schemas
     */
    async mergeSchemas(sourceSchema, targetSchema) {
        const mergedSettings = {
            ...targetSchema.settings,
            ...sourceSchema.settings
        };
        
        await this.schemaManager.updateSchema(targetSchema.id, {
            settings: mergedSettings,
            changeLog: `Merged settings from "${sourceSchema.name}"`
        });
        
        this.loadSchemas(); // Refresh
        
        if (window.masToast) {
            window.masToast.show('success', `Settings merged from "${sourceSchema.name}" to "${targetSchema.name}"`, 4000);
        }
    }
    
    /**
     * 📋 Copy schema settings
     */
    async copySchemaSettings(sourceSchema, targetSchema) {
        await this.schemaManager.updateSchema(targetSchema.id, {
            settings: { ...sourceSchema.settings },
            changeLog: `Copied settings from "${sourceSchema.name}"`
        });
        
        this.loadSchemas(); // Refresh
        
        if (window.masToast) {
            window.masToast.show('success', `Settings copied from "${sourceSchema.name}" to "${targetSchema.name}"`, 4000);
        }
    }
    
    /**
     * ⚡ Execute schema action
     */
    async executeSchemaAction(schemaId, action) {
        const schema = this.schemas.find(s => s.id === schemaId);
        if (!schema) return;
        
        try {
            switch (action) {
                case 'edit':
                    this.editSchema(schema);
                    break;
                case 'duplicate':
                    await this.duplicateSchema(schema);
                    break;
                case 'export':
                    await this.exportSchema(schema);
                    break;
                case 'delete':
                    await this.deleteSchema(schema);
                    break;
            }
        } catch (error) {
            console.error(`Schema action ${action} failed:`, error);
            if (window.masToast) {
                window.masToast.show('error', `Failed to ${action} schema: ${error.message}`, 5000);
            }
        }
    }
    
    /**
     * ✏️ Edit schema
     */
    editSchema(schema) {
        // Dispatch event for external handling
        const event = new CustomEvent('schemaEdit', {
            detail: { schema }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 📋 Duplicate schema
     */
    async duplicateSchema(schema) {
        const duplicatedSchema = {
            ...schema,
            name: `${schema.name} (Copy)`,
            id: undefined // Will be generated
        };
        
        await this.schemaManager.createSchema(duplicatedSchema);
        this.loadSchemas(); // Refresh
        
        if (window.masToast) {
            window.masToast.show('success', `Schema "${schema.name}" duplicated successfully`, 4000);
        }
    }
    
    /**
     * 📤 Export schema
     */
    async exportSchema(schema) {
        // Use the existing export functionality from PresetManager
        if (this.schemaManager.exportSelectedPreset) {
            this.schemaManager.selectedPresetId = schema.id;
            await this.schemaManager.exportSelectedPreset();
        }
    }
    
    /**
     * 🗑️ Delete schema
     */
    async deleteSchema(schema) {
        await this.schemaManager.deleteSchema(schema.id);
        this.loadSchemas(); // Refresh
    }
    
    /**
     * 🔍 Open comparison modal
     */
    openComparisonModal() {
        if (this.selectedSchemas.size < 2) {
            if (window.masToast) {
                window.masToast.show('warning', 'Please select at least 2 schemas to compare', 3000);
            }
            return;
        }
        
        const modal = this.container.querySelector('#comparison-modal');
        const content = modal.querySelector('#comparison-content');
        
        content.innerHTML = this.generateComparisonHTML();
        modal.style.display = 'flex';
    }
    
    /**
     * 📊 Generate comparison HTML
     */
    generateComparisonHTML() {
        const selectedSchemas = Array.from(this.selectedSchemas)
            .map(id => this.schemas.find(s => s.id === id))
            .filter(Boolean);
        
        if (selectedSchemas.length === 0) return '<p>No schemas selected for comparison.</p>';
        
        // Get all unique setting keys
        const allKeys = new Set();
        selectedSchemas.forEach(schema => {
            Object.keys(schema.settings || {}).forEach(key => allKeys.add(key));
        });
        
        let html = `
            <div class="comparison-header">
                <h4>Comparing ${selectedSchemas.length} schemas</h4>
            </div>
            
            <div class="comparison-table">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid #dee2e6;">Setting</th>
                            ${selectedSchemas.map(schema => 
                                `<th style="text-align: left; padding: 0.75rem; border-bottom: 2px solid #dee2e6;">${this.escapeHtml(schema.name)}</th>`
                            ).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        Array.from(allKeys).sort().forEach(key => {
            const values = selectedSchemas.map(schema => schema.settings?.[key] || '—');
            const allSame = values.every(v => v === values[0]);
            
            html += `
                <tr style="${allSame ? '' : 'background: #fff3cd;'}">
                    <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; font-weight: 600;">
                        ${this.escapeHtml(key)}
                    </td>
                    ${values.map(value => `
                        <td style="padding: 0.75rem; border-bottom: 1px solid #dee2e6; font-family: monospace;">
                            ${this.escapeHtml(value)}
                        </td>
                    `).join('')}
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            
            <div class="comparison-summary" style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
                <h5>Summary</h5>
                <ul>
                    <li><strong>Total settings:</strong> ${allKeys.size}</li>
                    <li><strong>Schemas compared:</strong> ${selectedSchemas.length}</li>
                    <li><strong>Differences highlighted</strong> in yellow</li>
                </ul>
            </div>
        `;
        
        return html;
    }
    
    /**
     * ⚡ Open bulk actions modal
     */
    openBulkActionsModal() {
        if (this.selectedSchemas.size === 0) {
            if (window.masToast) {
                window.masToast.show('warning', 'Please select schemas to perform bulk actions', 3000);
            }
            return;
        }
        
        const modal = this.container.querySelector('#bulk-actions-modal');
        modal.style.display = 'flex';
    }
    
    /**
     * ⚡ Execute bulk action
     */
    async executeBulkAction(action) {
        const selectedSchemas = Array.from(this.selectedSchemas)
            .map(id => this.schemas.find(s => s.id === id))
            .filter(Boolean);
        
        if (selectedSchemas.length === 0) return;
        
        this.closeModals();
        
        try {
            switch (action) {
                case 'export':
                    await this.bulkExportSchemas(selectedSchemas);
                    break;
                case 'duplicate':
                    await this.bulkDuplicateSchemas(selectedSchemas);
                    break;
                case 'archive':
                    await this.bulkArchiveSchemas(selectedSchemas);
                    break;
                case 'delete':
                    await this.bulkDeleteSchemas(selectedSchemas);
                    break;
            }
        } catch (error) {
            console.error(`Bulk action ${action} failed:`, error);
            if (window.masToast) {
                window.masToast.show('error', `Bulk ${action} failed: ${error.message}`, 5000);
            }
        }
    }
    
    /**
     * 📤 Bulk export schemas
     */
    async bulkExportSchemas(schemas) {
        const exportData = {
            format: 'mas-bulk-export',
            version: '4.2.0',
            exported: new Date().toISOString(),
            schemas: schemas
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schemas-bulk-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.masToast) {
            window.masToast.show('success', `${schemas.length} schemas exported successfully`, 4000);
        }
    }
    
    /**
     * 📋 Bulk duplicate schemas
     */
    async bulkDuplicateSchemas(schemas) {
        for (const schema of schemas) {
            await this.duplicateSchema(schema);
        }
        
        if (window.masToast) {
            window.masToast.show('success', `${schemas.length} schemas duplicated successfully`, 4000);
        }
    }
    
    /**
     * 📦 Bulk archive schemas
     */
    async bulkArchiveSchemas(schemas) {
        for (const schema of schemas) {
            await this.schemaManager.updateSchema(schema.id, {
                status: 'archived',
                changeLog: 'Bulk archived'
            });
        }
        
        this.loadSchemas(); // Refresh
        
        if (window.masToast) {
            window.masToast.show('success', `${schemas.length} schemas archived successfully`, 4000);
        }
    }
    
    /**
     * 🗑️ Bulk delete schemas
     */
    async bulkDeleteSchemas(schemas) {
        const confirmed = confirm(`Are you sure you want to delete ${schemas.length} schemas? This action cannot be undone.`);
        if (!confirmed) return;
        
        for (const schema of schemas) {
            await this.schemaManager.deleteSchema(schema.id, true); // Force delete
        }
        
        this.clearSelection();
        this.loadSchemas(); // Refresh
        
        if (window.masToast) {
            window.masToast.show('success', `${schemas.length} schemas deleted successfully`, 4000);
        }
    }
    
    /**
     * 🎯 Utility methods
     */
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update button states
        this.container.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === mode);
        });
        
        // Update grid class
        const grid = this.container.querySelector('#schema-grid');
        grid.classList.toggle('list-view', mode === 'list');
    }
    
    showLoading(show) {
        const loading = this.container.querySelector('.loading-indicator');
        const content = this.container.querySelector('#schema-grid');
        
        loading.style.display = show ? 'block' : 'none';
        content.style.display = show ? 'none' : 'grid';
    }
    
    showEmptyState() {
        const empty = this.container.querySelector('.empty-state');
        const content = this.container.querySelector('#schema-grid');
        
        empty.style.display = 'block';
        content.style.display = 'none';
    }
    
    hideEmptyState() {
        const empty = this.container.querySelector('.empty-state');
        const content = this.container.querySelector('#schema-grid');
        
        empty.style.display = 'none';
        content.style.display = 'grid';
    }
    
    showError(message) {
        if (window.masToast) {
            window.masToast.show('error', message, 5000);
        }
    }
    
    updateSchemaCount() {
        const count = this.schemas.length;
        const countText = count === 1 ? '1 schema' : `${count} schemas`;
        this.container.querySelector('#schema-count').textContent = countText;
    }
    
    closeModals() {
        this.container.querySelectorAll('.comparison-modal, .bulk-actions-modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    createNewSchema() {
        // Dispatch event for external handling
        const event = new CustomEvent('schemaCreate');
        document.dispatchEvent(event);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SchemaBrowser;
} else if (typeof window !== 'undefined') {
    window.SchemaBrowser = SchemaBrowser;
}