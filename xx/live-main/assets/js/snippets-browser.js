/**
 * Snippets Browser UI
 * User interface for browsing, searching, and managing code snippets
 */

class SnippetsBrowser {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            showCategories: true,
            showSearch: true,
            showFilters: true,
            allowUserSnippets: true,
            showRatings: true,
            itemsPerPage: 20,
            ...options
        };
        
        this.library = new CodeSnippetsLibrary();
        this.currentPage = 1;
        this.currentFilters = {
            language: null,
            category: null,
            tags: [],
            search: ''
        };
        
        this.selectedSnippet = null;
        this.callbacks = {
            onSnippetSelect: null,
            onSnippetInsert: null,
            onSnippetEdit: null,
            onSnippetDelete: null
        };
        
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.loadSnippets();
    }

    render() {
        this.container.innerHTML = `
            <div class="snippets-browser">
                <div class="snippets-header">
                    <h3>Code Snippets Library</h3>
                    <div class="snippets-actions">
                        ${this.options.allowUserSnippets ? '<button class="btn btn-primary" id="add-snippet-btn">Add Snippet</button>' : ''}
                        <button class="btn btn-secondary" id="import-snippet-btn">Import</button>
                    </div>
                </div>
                
                ${this.options.showSearch ? this.renderSearchBar() : ''}
                
                <div class="snippets-content">
                    <div class="snippets-sidebar">
                        ${this.options.showCategories ? this.renderCategories() : ''}
                        ${this.options.showFilters ? this.renderFilters() : ''}
                    </div>
                    
                    <div class="snippets-main">
                        <div class="snippets-toolbar">
                            <div class="snippets-view-options">
                                <button class="view-btn active" data-view="grid">Grid</button>
                                <button class="view-btn" data-view="list">List</button>
                            </div>
                            <div class="snippets-sort">
                                <select id="sort-snippets">
                                    <option value="relevance">Relevance</option>
                                    <option value="popular">Most Popular</option>
                                    <option value="recent">Most Recent</option>
                                    <option value="alphabetical">A-Z</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="snippets-list" id="snippets-list">
                            <div class="loading">Loading snippets...</div>
                        </div>
                        
                        <div class="snippets-pagination" id="snippets-pagination"></div>
                    </div>
                </div>
                
                <div class="snippet-preview" id="snippet-preview" style="display: none;">
                    <div class="preview-header">
                        <h4 id="preview-title"></h4>
                        <button class="btn-close" id="close-preview">&times;</button>
                    </div>
                    <div class="preview-content">
                        <div class="preview-meta" id="preview-meta"></div>
                        <div class="preview-code" id="preview-code"></div>
                        <div class="preview-actions" id="preview-actions"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSearchBar() {
        return `
            <div class="snippets-search">
                <div class="search-input-wrapper">
                    <input type="text" id="snippet-search" placeholder="Search snippets..." />
                    <button class="search-btn" id="search-btn">🔍</button>
                </div>
                <div class="search-suggestions" id="search-suggestions"></div>
            </div>
        `;
    }

    renderCategories() {
        const categories = this.library.getCategories();
        
        return `
            <div class="categories-section">
                <h4>Categories</h4>
                <ul class="categories-list">
                    <li><a href="#" data-category="" class="category-link active">All (${this.library.getAllSnippets().length})</a></li>
                    ${categories.map(cat => `
                        <li><a href="#" data-category="${cat.id}" class="category-link">${cat.name} (${cat.count})</a></li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    renderFilters() {
        const tags = this.library.getTags().slice(0, 20); // Top 20 tags
        
        return `
            <div class="filters-section">
                <h4>Language</h4>
                <select id="language-filter">
                    <option value="">All Languages</option>
                    <option value="css">CSS</option>
                    <option value="javascript">JavaScript</option>
                    <option value="html">HTML</option>
                    <option value="php">PHP</option>
                </select>
                
                <h4>Popular Tags</h4>
                <div class="tags-filter">
                    ${tags.map(tag => `
                        <label class="tag-checkbox">
                            <input type="checkbox" value="${tag.tag}" />
                            <span>${tag.tag} (${tag.count})</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderSnippetCard(snippet, viewMode = 'grid') {
        const isGrid = viewMode === 'grid';
        const stars = this.renderStars(snippet.rating);
        
        return `
            <div class="snippet-card ${viewMode}" data-snippet-id="${snippet.id}">
                <div class="snippet-header">
                    <h5 class="snippet-title">${this.escapeHtml(snippet.title)}</h5>
                    <div class="snippet-language">${snippet.language.toUpperCase()}</div>
                </div>
                
                <div class="snippet-meta">
                    <span class="snippet-author">by ${this.escapeHtml(snippet.author)}</span>
                    ${this.options.showRatings ? `<div class="snippet-rating">${stars}</div>` : ''}
                    <span class="snippet-downloads">${snippet.downloads} uses</span>
                </div>
                
                <div class="snippet-description">
                    ${this.escapeHtml(snippet.description)}
                </div>
                
                ${isGrid ? `
                    <div class="snippet-code-preview">
                        <code>${this.escapeHtml(snippet.code.substring(0, 100))}${snippet.code.length > 100 ? '...' : ''}</code>
                    </div>
                ` : ''}
                
                <div class="snippet-tags">
                    ${snippet.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                
                <div class="snippet-actions">
                    <button class="btn btn-sm btn-primary preview-btn" data-snippet-id="${snippet.id}">Preview</button>
                    <button class="btn btn-sm btn-success insert-btn" data-snippet-id="${snippet.id}">Insert</button>
                    ${!snippet.predefined ? `
                        <button class="btn btn-sm btn-secondary edit-btn" data-snippet-id="${snippet.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-snippet-id="${snippet.id}">Delete</button>
                    ` : ''}
                    <button class="btn btn-sm btn-info export-btn" data-snippet-id="${snippet.id}">Export</button>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + 
               (hasHalfStar ? '☆' : '') + 
               '☆'.repeat(emptyStars);
    }

    bindEvents() {
        // Search
        const searchInput = this.container.querySelector('#snippet-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadSnippets();
                }, 300);
            });
        }

        // Categories
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-link')) {
                e.preventDefault();
                
                // Update active category
                this.container.querySelectorAll('.category-link').forEach(link => 
                    link.classList.remove('active')
                );
                e.target.classList.add('active');
                
                this.currentFilters.category = e.target.dataset.category || null;
                this.currentPage = 1;
                this.loadSnippets();
            }
        });

        // Language filter
        const languageFilter = this.container.querySelector('#language-filter');
        if (languageFilter) {
            languageFilter.addEventListener('change', (e) => {
                this.currentFilters.language = e.target.value || null;
                this.currentPage = 1;
                this.loadSnippets();
            });
        }

        // Tag filters
        this.container.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.closest('.tags-filter')) {
                const tag = e.target.value;
                if (e.target.checked) {
                    if (!this.currentFilters.tags.includes(tag)) {
                        this.currentFilters.tags.push(tag);
                    }
                } else {
                    this.currentFilters.tags = this.currentFilters.tags.filter(t => t !== tag);
                }
                this.currentPage = 1;
                this.loadSnippets();
            }
        });

        // View mode
        this.container.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-btn')) {
                this.container.querySelectorAll('.view-btn').forEach(btn => 
                    btn.classList.remove('active')
                );
                e.target.classList.add('active');
                
                this.viewMode = e.target.dataset.view;
                this.renderSnippets();
            }
        });

        // Sort
        const sortSelect = this.container.querySelector('#sort-snippets');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.loadSnippets();
            });
        }

        // Snippet actions
        this.container.addEventListener('click', (e) => {
            const snippetId = e.target.dataset.snippetId;
            if (!snippetId) return;

            if (e.target.classList.contains('preview-btn')) {
                this.previewSnippet(snippetId);
            } else if (e.target.classList.contains('insert-btn')) {
                this.insertSnippet(snippetId);
            } else if (e.target.classList.contains('edit-btn')) {
                this.editSnippet(snippetId);
            } else if (e.target.classList.contains('delete-btn')) {
                this.deleteSnippet(snippetId);
            } else if (e.target.classList.contains('export-btn')) {
                this.exportSnippet(snippetId);
            }
        });

        // Add snippet
        const addBtn = this.container.querySelector('#add-snippet-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddSnippetDialog());
        }

        // Import snippet
        const importBtn = this.container.querySelector('#import-snippet-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.showImportDialog());
        }

        // Close preview
        const closePreview = this.container.querySelector('#close-preview');
        if (closePreview) {
            closePreview.addEventListener('click', () => this.hidePreview());
        }
    }

    loadSnippets() {
        const sortBy = this.container.querySelector('#sort-snippets')?.value || 'relevance';
        
        let snippets;
        if (this.currentFilters.search) {
            snippets = this.library.searchSnippets(this.currentFilters.search, {
                language: this.currentFilters.language,
                category: this.currentFilters.category,
                tags: this.currentFilters.tags,
                limit: this.options.itemsPerPage * this.currentPage
            });
        } else {
            snippets = this.library.getAllSnippets();
            
            // Apply filters
            if (this.currentFilters.language) {
                snippets = snippets.filter(s => s.language === this.currentFilters.language);
            }
            if (this.currentFilters.category) {
                snippets = snippets.filter(s => s.category === this.currentFilters.category);
            }
            if (this.currentFilters.tags.length > 0) {
                snippets = snippets.filter(s => 
                    this.currentFilters.tags.some(tag => s.tags.includes(tag))
                );
            }
            
            // Sort
            this.sortSnippets(snippets, sortBy);
        }
        
        this.renderSnippets(snippets);
        this.renderPagination(snippets.length);
    }

    sortSnippets(snippets, sortBy) {
        switch (sortBy) {
            case 'popular':
                snippets.sort((a, b) => (b.rating + b.downloads) - (a.rating + a.downloads));
                break;
            case 'recent':
                snippets.sort((a, b) => new Date(b.created) - new Date(a.created));
                break;
            case 'alphabetical':
                snippets.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default: // relevance
                snippets.sort((a, b) => {
                    if (a.predefined && !b.predefined) return -1;
                    if (!a.predefined && b.predefined) return 1;
                    return (b.rating + b.downloads) - (a.rating + a.downloads);
                });
        }
    }

    renderSnippets(snippets = null) {
        const listContainer = this.container.querySelector('#snippets-list');
        const viewMode = this.container.querySelector('.view-btn.active')?.dataset.view || 'grid';
        
        if (!snippets) {
            snippets = this.currentSnippets || [];
        }
        
        this.currentSnippets = snippets;
        
        if (snippets.length === 0) {
            listContainer.innerHTML = '<div class="no-snippets">No snippets found</div>';
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
        const endIndex = startIndex + this.options.itemsPerPage;
        const pageSnippets = snippets.slice(startIndex, endIndex);
        
        listContainer.innerHTML = pageSnippets
            .map(snippet => this.renderSnippetCard(snippet, viewMode))
            .join('');
    }

    renderPagination(totalItems) {
        const paginationContainer = this.container.querySelector('#snippets-pagination');
        const totalPages = Math.ceil(totalItems / this.options.itemsPerPage);
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage - 1}">Previous</button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage ? 'active' : '';
            paginationHTML += `<button class="page-btn ${isActive}" data-page="${i}">${i}</button>`;
        }
        
        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" data-page="${this.currentPage + 1}">Next</button>`;
        }
        
        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
        
        // Bind pagination events
        paginationContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn') && e.target.dataset.page) {
                this.currentPage = parseInt(e.target.dataset.page);
                this.renderSnippets();
                this.renderPagination(totalItems);
            }
        });
    }

    previewSnippet(snippetId) {
        const snippet = this.library.getSnippet(snippetId);
        if (!snippet) return;
        
        this.selectedSnippet = snippet;
        
        const preview = this.container.querySelector('#snippet-preview');
        const title = preview.querySelector('#preview-title');
        const meta = preview.querySelector('#preview-meta');
        const code = preview.querySelector('#preview-code');
        const actions = preview.querySelector('#preview-actions');
        
        title.textContent = snippet.title;
        
        meta.innerHTML = `
            <div class="preview-meta-item"><strong>Language:</strong> ${snippet.language.toUpperCase()}</div>
            <div class="preview-meta-item"><strong>Category:</strong> ${snippet.category}</div>
            <div class="preview-meta-item"><strong>Author:</strong> ${snippet.author}</div>
            <div class="preview-meta-item"><strong>Rating:</strong> ${this.renderStars(snippet.rating)}</div>
            <div class="preview-meta-item"><strong>Uses:</strong> ${snippet.downloads}</div>
            <div class="preview-meta-item"><strong>Tags:</strong> ${snippet.tags.join(', ')}</div>
        `;
        
        code.innerHTML = `<pre><code class="language-${snippet.language}">${this.escapeHtml(snippet.code)}</code></pre>`;
        
        actions.innerHTML = `
            <button class="btn btn-primary" onclick="snippetsBrowser.insertSnippet('${snippet.id}')">Insert Code</button>
            <button class="btn btn-secondary" onclick="snippetsBrowser.copySnippet('${snippet.id}')">Copy to Clipboard</button>
            ${!snippet.predefined ? `<button class="btn btn-warning" onclick="snippetsBrowser.editSnippet('${snippet.id}')">Edit</button>` : ''}
            <button class="btn btn-info" onclick="snippetsBrowser.exportSnippet('${snippet.id}')">Export</button>
        `;
        
        preview.style.display = 'block';
        
        // Track usage
        this.library.trackSnippetUsage(snippetId);
        
        if (this.callbacks.onSnippetSelect) {
            this.callbacks.onSnippetSelect(snippet);
        }
    }

    hidePreview() {
        this.container.querySelector('#snippet-preview').style.display = 'none';
        this.selectedSnippet = null;
    }

    insertSnippet(snippetId) {
        const snippet = this.library.getSnippet(snippetId);
        if (!snippet) return;
        
        this.library.trackSnippetUsage(snippetId);
        
        if (this.callbacks.onSnippetInsert) {
            this.callbacks.onSnippetInsert(snippet);
        }
        
        this.hidePreview();
    }

    copySnippet(snippetId) {
        const snippet = this.library.getSnippet(snippetId);
        if (!snippet) return;
        
        navigator.clipboard.writeText(snippet.code).then(() => {
            this.showNotification('Snippet copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy snippet', 'error');
        });
    }

    editSnippet(snippetId) {
        const snippet = this.library.getSnippet(snippetId);
        if (!snippet || snippet.predefined) return;
        
        if (this.callbacks.onSnippetEdit) {
            this.callbacks.onSnippetEdit(snippet);
        }
    }

    deleteSnippet(snippetId) {
        const snippet = this.library.getSnippet(snippetId);
        if (!snippet || snippet.predefined) return;
        
        if (confirm(`Are you sure you want to delete "${snippet.title}"?`)) {
            try {
                this.library.deleteUserSnippet(snippetId);
                this.loadSnippets();
                this.hidePreview();
                this.showNotification('Snippet deleted successfully', 'success');
                
                if (this.callbacks.onSnippetDelete) {
                    this.callbacks.onSnippetDelete(snippet);
                }
            } catch (error) {
                this.showNotification('Failed to delete snippet: ' + error.message, 'error');
            }
        }
    }

    exportSnippet(snippetId) {
        try {
            const exportData = this.library.exportSnippet(snippetId);
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `snippet-${exportData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('Snippet exported successfully', 'success');
        } catch (error) {
            this.showNotification('Failed to export snippet: ' + error.message, 'error');
        }
    }

    showAddSnippetDialog() {
        // This would open a modal dialog for adding snippets
        // Implementation depends on your modal system
        console.log('Show add snippet dialog');
    }

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const snippetData = JSON.parse(e.target.result);
                        const imported = this.library.importSnippet(snippetData);
                        this.loadSnippets();
                        this.showNotification(`Snippet "${imported.title}" imported successfully`, 'success');
                    } catch (error) {
                        this.showNotification('Failed to import snippet: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API
    on(event, callback) {
        if (this.callbacks.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
            this.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
        }
    }

    refresh() {
        this.loadSnippets();
    }

    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.currentPage = 1;
        this.loadSnippets();
    }

    getLibrary() {
        return this.library;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SnippetsBrowser;
} else if (typeof window !== 'undefined') {
    window.SnippetsBrowser = SnippetsBrowser;
}