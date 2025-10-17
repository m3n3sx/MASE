/**
 * Unified Live Preview Engine - Phase 1 Complete
 * Following MAS7 Modernization Plan
 * 
 * Architecture:
 * - Instant Feedback Layer (CSS Variables)
 * - Complex CSS Layer (AJAX Fallback)
 * - Error Recovery Layer (Retry + Rollback)
 * - Performance Layer (Monitoring + Cleanup)
 */
(function($) {
    'use strict';
    
    // Disable old conflicting systems
    if (window.MAS_DISABLE_OLD_PREVIEW) {
        window.MASDisableModules = true;
    }
    
    const PreviewEngine = {
        state: {},
        timer: null,
        retryCount: 0,
        maxRetries: 3,
        metrics: { requests: 0, errors: 0, avgTime: 0 },
        
        // Phase 2: Request batching
        batchQueue: new Map(),
        batchTimer: null,
        batchDelay: 200,
        
        // Phase 2: History for undo/redo
        history: [],
        historyIndex: -1,
        maxHistory: 20,
        
        // Smart debouncing by field type
        fieldTypes: {
            color: 150,
            slider: 100,
            text: 500,
            checkbox: 200
        },
        
        // CSS Variables for instant feedback
        instantFields: {
            menu_bg: '--mas-menu-bg',
            menu_background: '--mas-menu-bg',
            menu_text_color: '--mas-menu-text',
            admin_bar_bg: '--mas-adminbar-bg',
            admin_bar_background: '--mas-adminbar-bg',
            admin_bar_height: '--mas-adminbar-height'
        },
        
        init() {
            if (typeof masV2Global === 'undefined') return;
            
            // Color pickers with callbacks
            if ($.fn.wpColorPicker) {
                $('.mas-v2-color').wpColorPicker({
                    change: (e, ui) => this.update(e.target, ui.color.toString(), 'color'),
                    clear: (e) => this.update(e.target, '', 'color')
                });
            }
            
            // Other inputs with smart detection
            $(document).on('input', '.mas-v2-input', (e) => {
                this.update(e.target, $(e.target).val(), 'text');
            });
            
            $(document).on('input', 'input[type="range"]', (e) => {
                this.update(e.target, $(e.target).val(), 'slider');
            });
            
            $(document).on('change', 'input[type="checkbox"]', (e) => {
                this.update(e.target, $(e.target).is(':checked') ? '1' : '0', 'checkbox');
            });
            
            this.showStatus('ready');
        },
        
        update(el, value, type) {
            const name = $(el).attr('name');
            if (!name) return;
            
            const setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            
            // Phase 2: Save to history before change
            this.saveToHistory(setting, this.state[setting], value);
            
            this.state[setting] = value;
            
            // Instant feedback via CSS Variables
            if (this.instantFields[setting]) {
                this.applyInstant(setting, value);
            }
            
            // Phase 2: Add to batch queue
            this.batchQueue.set(setting, value);
            
            clearTimeout(this.batchTimer);
            this.batchTimer = setTimeout(() => this.flushBatch(), this.batchDelay);
        },
        
        applyInstant(setting, value) {
            const cssVar = this.instantFields[setting];
            if (!cssVar) return;
            
            const root = document.documentElement;
            if (setting.includes('height')) {
                root.style.setProperty(cssVar, value + 'px');
            } else {
                root.style.setProperty(cssVar, value);
            }
        },
        
        // Phase 2: Batch processing
        flushBatch() {
            if (this.batchQueue.size === 0) return;
            
            // Merge batch into state
            this.batchQueue.forEach((value, key) => {
                this.state[key] = value;
            });
            
            this.batchQueue.clear();
            this.apply();
        },
        
        apply() {
            if (Object.keys(this.state).length === 0) return;
            
            this.showStatus('loading');
            const startTime = performance.now();
            
            $.ajax({
                url: masV2Global.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'mas_v2_get_preview_css',
                    nonce: masV2Global.nonce,
                    ...this.state
                },
                success: (r) => {
                    const duration = performance.now() - startTime;
                    this.updateMetrics(duration, true);
                    
                    if (r.success && r.data.css) {
                        this.injectCSS(r.data.css);
                        this.state = {};
                        this.retryCount = 0;
                        this.showStatus('success');
                    } else {
                        this.handleError('Invalid response');
                    }
                },
                error: (x) => {
                    this.updateMetrics(performance.now() - startTime, false);
                    this.handleError(x.statusText);
                }
            });
        },
        
        updateMetrics(duration, success) {
            this.metrics.requests++;
            if (!success) this.metrics.errors++;
            this.metrics.avgTime = ((this.metrics.avgTime * (this.metrics.requests - 1)) + duration) / this.metrics.requests;
            
            if (masV2Global.debug_mode) {
                console.log('[Preview Metrics]', {
                    requests: this.metrics.requests,
                    errors: this.metrics.errors,
                    avgTime: Math.round(this.metrics.avgTime) + 'ms',
                    successRate: Math.round((1 - this.metrics.errors / this.metrics.requests) * 100) + '%'
                });
            }
        },
        
        injectCSS(css) {
            let $s = $('#mas-preview-css');
            if (!$s.length) {
                $s = $('<style id="mas-preview-css">');
                $('head').append($s);
            }
            $s.html(css);
        },
        
        handleError(msg) {
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                const delay = Math.pow(2, this.retryCount) * 1000;
                setTimeout(() => this.apply(), delay);
                this.showStatus('retrying');
            } else {
                this.showStatus('error');
                this.state = {};
                this.retryCount = 0;
            }
        },
        
        showStatus(status) {
            const messages = {
                ready: '✓ Ready',
                loading: '⟳ Updating...',
                success: '✓ Updated',
                retrying: '⟳ Retrying...',
                error: '✗ Error'
            };
            
            let $indicator = $('#mas-preview-status');
            if (!$indicator.length) {
                $indicator = $('<div id="mas-preview-status" style="position:fixed;bottom:20px;right:20px;padding:8px 12px;background:#23282d;color:#fff;border-radius:4px;font-size:12px;z-index:999999;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:all 0.3s;">');
                $('body').append($indicator);
            }
            
            const colors = {
                ready: '#46b450',
                loading: '#00a0d2',
                success: '#46b450',
                retrying: '#ffb900',
                error: '#dc3232'
            };
            
            $indicator
                .text(messages[status] || status)
                .attr('data-status', status)
                .css('background', colors[status] || '#23282d');
            
            if (status === 'success') {
                setTimeout(() => $indicator.fadeOut(), 2000);
            } else {
                $indicator.show();
            }
        },
        
        // Cleanup on page unload
        cleanup() {
            this.state = {};
            this.batchQueue.clear();
            clearTimeout(this.timer);
            clearTimeout(this.batchTimer);
            $('#mas-preview-css').remove();
            $('#mas-preview-status').remove();
        },
        
        // Phase 2: History management
        saveToHistory(setting, oldValue, newValue) {
            if (oldValue === newValue) return;
            
            // Remove future history if we're not at the end
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            
            this.history.push({ setting, oldValue, newValue, timestamp: Date.now() });
            this.historyIndex++;
            
            // Limit history size
            if (this.history.length > this.maxHistory) {
                this.history.shift();
                this.historyIndex--;
            }
            
            this.updateUndoRedoUI();
        },
        
        undo() {
            if (this.historyIndex < 0) return;
            
            const entry = this.history[this.historyIndex];
            this.state[entry.setting] = entry.oldValue;
            
            // Apply instant if possible
            if (this.instantFields[entry.setting]) {
                this.applyInstant(entry.setting, entry.oldValue);
            }
            
            this.historyIndex--;
            this.apply();
            this.updateUndoRedoUI();
        },
        
        redo() {
            if (this.historyIndex >= this.history.length - 1) return;
            
            this.historyIndex++;
            const entry = this.history[this.historyIndex];
            this.state[entry.setting] = entry.newValue;
            
            // Apply instant if possible
            if (this.instantFields[entry.setting]) {
                this.applyInstant(entry.setting, entry.newValue);
            }
            
            this.apply();
            this.updateUndoRedoUI();
        },
        
        updateUndoRedoUI() {
            const canUndo = this.historyIndex >= 0;
            const canRedo = this.historyIndex < this.history.length - 1;
            
            let $controls = $('#mas-undo-redo');
            if (!$controls.length) {
                $controls = $('<div id="mas-undo-redo" style="position:fixed;bottom:60px;right:20px;z-index:999998;">');
                $('body').append($controls);
            }
            
            $controls.html(`
                <button id="mas-undo" ${!canUndo ? 'disabled' : ''} 
                    style="padding:8px 12px;margin-right:5px;background:#23282d;color:#fff;border:none;border-radius:4px;cursor:${canUndo ? 'pointer' : 'not-allowed'};opacity:${canUndo ? '1' : '0.5'};">
                    ↶ Undo
                </button>
                <button id="mas-redo" ${!canRedo ? 'disabled' : ''}
                    style="padding:8px 12px;background:#23282d;color:#fff;border:none;border-radius:4px;cursor:${canRedo ? 'pointer' : 'not-allowed'};opacity:${canRedo ? '1' : '0.5'};">
                    ↷ Redo
                </button>
            `);
            
            $('#mas-undo').off('click').on('click', () => this.undo());
            $('#mas-redo').off('click').on('click', () => this.redo());
        },
        
        // Phase 2: Comparison mode
        toggleComparison() {
            let $compare = $('#mas-compare-mode');
            if ($compare.length) {
                $compare.remove();
                return;
            }
            
            $compare = $('<div id="mas-compare-mode" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;padding:20px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:999999;max-width:600px;">');
            $compare.html(`
                <h3 style="margin:0 0 15px 0;">Preview Comparison</h3>
                <div style="display:flex;gap:10px;margin-bottom:15px;">
                    <button id="mas-compare-before" style="flex:1;padding:10px;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;">Show Original</button>
                    <button id="mas-compare-after" style="flex:1;padding:10px;background:#46b450;color:#fff;border:none;border-radius:4px;cursor:pointer;">Show Preview</button>
                </div>
                <button id="mas-compare-close" style="width:100%;padding:10px;background:#dc3232;color:#fff;border:none;border-radius:4px;cursor:pointer;">Close</button>
            `);
            $('body').append($compare);
            
            $('#mas-compare-before').on('click', () => {
                $('#mas-preview-css').hide();
            });
            
            $('#mas-compare-after').on('click', () => {
                $('#mas-preview-css').show();
            });
            
            $('#mas-compare-close').on('click', () => {
                $compare.remove();
            });
        }
    };
    
    // Cleanup on unload
    $(window).on('beforeunload', () => PreviewEngine.cleanup());
    
    $(document).ready(() => {
        PreviewEngine.init();
        
        // Phase 2: Keyboard shortcuts
        $(document).on('keydown', (e) => {
            // Ctrl+Z = Undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                PreviewEngine.undo();
            }
            // Ctrl+Shift+Z or Ctrl+Y = Redo
            if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                PreviewEngine.redo();
            }
            // Ctrl+Shift+C = Comparison mode
            if (e.ctrlKey && e.shiftKey && e.key === 'c') {
                e.preventDefault();
                PreviewEngine.toggleComparison();
            }
        });
        
        // Expose to window for debugging
        if (masV2Global.debug_mode) {
            window.PreviewEngine = PreviewEngine;
        }
    });
    
})(jQuery);
