/**
 * Advanced Code Editor with Monaco Editor Integration
 * Provides syntax highlighting, validation, and autocomplete for CSS/JS/HTML
 */

class CodeEditor {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.options = {
            language: 'css',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontSize: 14,
            lineNumbers: 'on',
            folding: true,
            ...options
        };
        
        this.editor = null;
        this.currentLanguage = this.options.language;
        this.validationEnabled = true;
        this.autocompleteProviders = new Map();
        
        this.init();
    }

    async init() {
        try {
            // Load Monaco Editor if not already loaded
            if (!window.monaco) {
                await this.loadMonacoEditor();
            }
            
            this.createEditor();
            this.setupLanguageSupport();
            this.setupValidation();
            this.setupAutocomplete();
            this.setupEventHandlers();
            
            console.log('CodeEditor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CodeEditor:', error);
            this.fallbackToTextarea();
        }
    }

    async loadMonacoEditor() {
        return new Promise((resolve, reject) => {
            // Check if Monaco is already being loaded
            if (window.monacoLoading) {
                window.monacoLoading.then(resolve).catch(reject);
                return;
            }

            window.monacoLoading = new Promise((res, rej) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
                script.onload = () => {
                    require.config({ 
                        paths: { 
                            'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' 
                        } 
                    });
                    
                    require(['vs/editor/editor.main'], () => {
                        res();
                    }, rej);
                };
                script.onerror = rej;
                document.head.appendChild(script);
            });

            window.monacoLoading.then(resolve).catch(reject);
        });
    }

    createEditor() {
        this.editor = monaco.editor.create(this.container, this.options);
        
        // Store reference for cleanup
        this.container.monacoEditor = this.editor;
    }

    setupLanguageSupport() {
        // Enhanced CSS language support
        if (this.currentLanguage === 'css') {
            this.setupCSSLanguageSupport();
        }
        
        // Enhanced JavaScript language support
        if (this.currentLanguage === 'javascript') {
            this.setupJavaScriptLanguageSupport();
        }
        
        // Enhanced HTML language support
        if (this.currentLanguage === 'html') {
            this.setupHTMLLanguageSupport();
        }
    }

    setupCSSLanguageSupport() {
        // WordPress-specific CSS properties and values
        const wordpressCSS = {
            properties: [
                'admin-color-scheme',
                'wp-admin-bar-height',
                'wp-content-width'
            ],
            values: [
                'wp-admin',
                'wp-content',
                'wp-sidebar'
            ]
        };

        // Register custom CSS completion provider
        this.registerCompletionProvider('css', {
            provideCompletionItems: (model, position) => {
                const suggestions = [];
                
                // Add WordPress-specific properties
                wordpressCSS.properties.forEach(prop => {
                    suggestions.push({
                        label: prop,
                        kind: monaco.languages.CompletionItemKind.Property,
                        insertText: `${prop}: `,
                        documentation: `WordPress-specific CSS property: ${prop}`
                    });
                });
                
                // Add common CSS custom properties for admin panel
                const customProperties = [
                    '--wp-admin-theme-color',
                    '--wp-admin-accent-color',
                    '--wp-admin-sidebar-width',
                    '--wp-admin-header-height'
                ];
                
                customProperties.forEach(prop => {
                    suggestions.push({
                        label: prop,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: prop,
                        documentation: `WordPress admin custom property: ${prop}`
                    });
                });

                return { suggestions };
            }
        });
    }

    setupJavaScriptLanguageSupport() {
        // WordPress JavaScript globals and functions
        const wordpressJS = {
            globals: [
                'wp', 'jQuery', '$', 'ajaxurl', 'pagenow', 'adminpage',
                'wpApiSettings', 'wpColorPickerL10n'
            ],
            functions: [
                'wp_localize_script', 'wp_enqueue_script', 'wp_add_inline_script',
                'wp_ajax_', 'wp_die', 'wp_verify_nonce', 'wp_create_nonce'
            ]
        };

        // Register custom JavaScript completion provider
        this.registerCompletionProvider('javascript', {
            provideCompletionItems: (model, position) => {
                const suggestions = [];
                
                // Add WordPress globals
                wordpressJS.globals.forEach(global => {
                    suggestions.push({
                        label: global,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: global,
                        documentation: `WordPress global: ${global}`
                    });
                });
                
                // Add WordPress functions
                wordpressJS.functions.forEach(func => {
                    suggestions.push({
                        label: func,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: `${func}()`,
                        documentation: `WordPress function: ${func}`
                    });
                });

                return { suggestions };
            }
        });
    }

    setupHTMLLanguageSupport() {
        // WordPress-specific HTML attributes and classes
        const wordpressHTML = {
            classes: [
                'wp-admin', 'wp-core-ui', 'wp-toolbar', 'wp-menu',
                'postbox', 'meta-box', 'form-table', 'widefat'
            ],
            attributes: [
                'data-wp-lists', 'data-wp-dismiss', 'data-nonce'
            ]
        };

        // Register custom HTML completion provider
        this.registerCompletionProvider('html', {
            provideCompletionItems: (model, position) => {
                const suggestions = [];
                
                // Add WordPress classes
                wordpressHTML.classes.forEach(cls => {
                    suggestions.push({
                        label: cls,
                        kind: monaco.languages.CompletionItemKind.Value,
                        insertText: cls,
                        documentation: `WordPress CSS class: ${cls}`
                    });
                });

                return { suggestions };
            }
        });
    }

    registerCompletionProvider(language, provider) {
        const disposable = monaco.languages.registerCompletionItemProvider(language, provider);
        this.autocompleteProviders.set(language, disposable);
    }

    setupValidation() {
        if (!this.validationEnabled) return;

        // CSS validation
        if (this.currentLanguage === 'css') {
            this.setupCSSValidation();
        }
        
        // JavaScript validation
        if (this.currentLanguage === 'javascript') {
            this.setupJavaScriptValidation();
        }
    }

    setupCSSValidation() {
        // Custom CSS validation rules
        const validateCSS = (model) => {
            const markers = [];
            const content = model.getValue();
            
            // Check for potentially dangerous CSS
            const dangerousPatterns = [
                /expression\s*\(/gi,
                /javascript\s*:/gi,
                /vbscript\s*:/gi,
                /@import\s+url\s*\(\s*["']?javascript:/gi
            ];
            
            dangerousPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const position = model.getPositionAt(match.index);
                    markers.push({
                        severity: monaco.MarkerSeverity.Error,
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column + match[0].length,
                        message: 'Potentially dangerous CSS detected'
                    });
                }
            });
            
            monaco.editor.setModelMarkers(model, 'css-security', markers);
        };

        // Set up model change listener for validation
        this.editor.onDidChangeModelContent(() => {
            validateCSS(this.editor.getModel());
        });
    }

    setupJavaScriptValidation() {
        // Custom JavaScript validation rules
        const validateJS = (model) => {
            const markers = [];
            const content = model.getValue();
            
            // Check for potentially dangerous JavaScript
            const dangerousPatterns = [
                /eval\s*\(/gi,
                /Function\s*\(/gi,
                /setTimeout\s*\(\s*["'][^"']*["']/gi,
                /setInterval\s*\(\s*["'][^"']*["']/gi,
                /document\.write/gi,
                /innerHTML\s*=/gi
            ];
            
            dangerousPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    const position = model.getPositionAt(match.index);
                    markers.push({
                        severity: monaco.MarkerSeverity.Warning,
                        startLineNumber: position.lineNumber,
                        startColumn: position.column,
                        endLineNumber: position.lineNumber,
                        endColumn: position.column + match[0].length,
                        message: 'Potentially unsafe JavaScript pattern'
                    });
                }
            });
            
            monaco.editor.setModelMarkers(model, 'js-security', markers);
        };

        // Set up model change listener for validation
        this.editor.onDidChangeModelContent(() => {
            validateJS(this.editor.getModel());
        });
    }

    setupEventHandlers() {
        // Handle language changes
        this.editor.onDidChangeModel(() => {
            const model = this.editor.getModel();
            if (model) {
                this.currentLanguage = model.getLanguageId();
                this.setupLanguageSupport();
                this.setupValidation();
            }
        });

        // Handle content changes
        this.editor.onDidChangeModelContent((e) => {
            this.onContentChange(e);
        });

        // Handle focus events
        this.editor.onDidFocusEditorText(() => {
            this.onFocus();
        });

        this.editor.onDidBlurEditorText(() => {
            this.onBlur();
        });
    }

    // Public API methods
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setValue(value) {
        if (this.editor) {
            this.editor.setValue(value || '');
        }
    }

    setLanguage(language) {
        if (this.editor) {
            const model = this.editor.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
                this.currentLanguage = language;
            }
        }
    }

    setTheme(theme) {
        if (this.editor) {
            monaco.editor.setTheme(theme);
        }
    }

    resize() {
        if (this.editor) {
            this.editor.layout();
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    insertText(text, position = null) {
        if (this.editor) {
            const pos = position || this.editor.getPosition();
            this.editor.executeEdits('insert-text', [{
                range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                text: text
            }]);
        }
    }

    getSelectedText() {
        if (this.editor) {
            const selection = this.editor.getSelection();
            return this.editor.getModel().getValueInRange(selection);
        }
        return '';
    }

    replaceSelectedText(text) {
        if (this.editor) {
            const selection = this.editor.getSelection();
            this.editor.executeEdits('replace-selection', [{
                range: selection,
                text: text
            }]);
        }
    }

    // Event handlers (can be overridden)
    onContentChange(event) {
        // Override in subclass or set as callback
        if (this.options.onContentChange) {
            this.options.onContentChange(event, this.getValue());
        }
    }

    onFocus() {
        // Override in subclass or set as callback
        if (this.options.onFocus) {
            this.options.onFocus();
        }
    }

    onBlur() {
        // Override in subclass or set as callback
        if (this.options.onBlur) {
            this.options.onBlur(this.getValue());
        }
    }

    // Fallback to textarea if Monaco fails to load
    fallbackToTextarea() {
        console.warn('Monaco Editor failed to load, falling back to textarea');
        
        const textarea = document.createElement('textarea');
        textarea.className = 'code-editor-fallback';
        textarea.style.cssText = `
            width: 100%;
            height: 400px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            border: 1px solid #ccc;
            padding: 10px;
            resize: vertical;
        `;
        
        this.container.innerHTML = '';
        this.container.appendChild(textarea);
        
        // Provide basic API compatibility
        this.editor = {
            getValue: () => textarea.value,
            setValue: (value) => textarea.value = value || '',
            focus: () => textarea.focus(),
            layout: () => {},
            dispose: () => textarea.remove()
        };
    }

    // Cleanup
    dispose() {
        if (this.editor && this.editor.dispose) {
            this.editor.dispose();
        }
        
        // Dispose autocomplete providers
        this.autocompleteProviders.forEach(provider => {
            if (provider.dispose) {
                provider.dispose();
            }
        });
        this.autocompleteProviders.clear();
        
        this.editor = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeEditor;
} else if (typeof window !== 'undefined') {
    window.CodeEditor = CodeEditor;
}