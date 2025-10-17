/**
 * Unified Live Preview Engine v2.0
 * Phase 3: Modular Architecture with ES6 imports
 * 
 * Features:
 * - Phase 1: Unified system, instant feedback, error recovery
 * - Phase 2: Batching, undo/redo, comparison mode
 * - Phase 3: Modular design, performance profiler, thumbnails
 */

// Import modules (requires build step or native ES6 support)
// For WordPress compatibility, we'll use dynamic imports

(function($) {
    'use strict';
    
    // Disable old conflicting systems
    if (window.MAS_DISABLE_OLD_PREVIEW) {
        window.MASDisableModules = true;
    }
    
    const PreviewEngine = {
        // Core state
        state: {},
        timer: null,
        retryCount: 0,
        maxRetries: 3,
        
        // Phase 2: Batching
        batchQueue: new Map(),
        batchTimer: null,
        batchDelay: 200,
        
        // Phase 2: History
        history: [],
        historyIndex: -1,
        maxHistory: 20,
        
        // Phase 3: Modules
        stateManager: null,
        perfMonitor: null,
        thumbnail: null,
        
        // Field configuration
        fieldTypes: {
            color: 150,
            slider: 100,
            text: 500,
            checkbox: 200
        },
        
        instantFields: {
            // Menu colors
            menu_bg: '--mas-menu-bg',
            menu_background: '--mas-menu-bg',
            menu_text_color: '--mas-menu-text',
            menu_hover_background: '--mas-menu-hover',
            menu_hover_text_color: '--mas-menu-hover-text',
            menu_active_background: '--mas-menu-active',
            menu_active_text_color: '--mas-menu-active-text',
            
            // Submenu colors
            submenu_background: '--mas-submenu-bg',
            submenu_text_color: '--mas-submenu-text',
            submenu_hover_background: '--mas-submenu-hover',
            submenu_hover_text_color: '--mas-submenu-hover-text',
            
            // Admin bar
            admin_bar_bg: '--mas-adminbar-bg',
            admin_bar_background: '--mas-adminbar-bg',
            admin_bar_text_color: '--mas-adminbar-text',
            admin_bar_height: '--mas-adminbar-height'
        },
        
        async init() {
            if (typeof masV2Global === 'undefined') return;
            
            // Phase 3: Initialize modules
            await this.initModules();
            
            // Color pickers (WordPress)
            if ($.fn.wpColorPicker) {
                $('.mas-v2-color').wpColorPicker({
                    change: (e, ui) => this.update(e.target, ui.color.toString(), 'color'),
                    clear: (e) => this.update(e.target, '', 'color')
                });
            }
            
            // Native color inputs
            $(document).on('input change', 'input[type="color"]', (e) => {
                this.update(e.target, $(e.target).val(), 'color');
            });
            
            // Other inputs
            $(document).on('input', '.mas-v2-input:not([type="color"])', (e) => {
                this.update(e.target, $(e.target).val(), 'text');
            });
            
            $(document).on('input', 'input[type="range"]', (e) => {
                this.update(e.target, $(e.target).val(), 'slider');
            });
            
            $(document).on('change', 'input[type="checkbox"]', (e) => {
                this.update(e.target, $(e.target).is(':checked') ? '1' : '0', 'checkbox');
            });
            
            this.showStatus('ready');
            
            // Phase 3: Add toolbar
            this.createToolbar();
        },
        
        async initModules() {
            // Simple inline modules (no build step needed)
            this.perfMonitor = {
                metrics: { requests: 0, errors: 0, times: [], avgTime: 0 },
                record: function(duration, success = true) {
                    this.metrics.requests++;
                    if (!success) this.metrics.errors++;
                    this.metrics.times.push(duration);
                    if (this.metrics.times.length > 100) this.metrics.times.shift();
                    const sum = this.metrics.times.reduce((a, b) => a + b, 0);
                    this.metrics.avgTime = sum / this.metrics.times.length;
                },
                getStats: function() {
                    const sorted = [...this.metrics.times].sort((a, b) => a - b);
                    return {
                        ...this.metrics,
                        p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
                        p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
                        successRate: ((1 - this.metrics.errors / this.metrics.requests) * 100).toFixed(1) + '%'
                    };
                }
            };
        },
        
        createToolbar() {
            const $toolbar = $(`
                <div id="mas-toolbar" style="position:fixed;top:50%;right:0;transform:translateY(-50%);background:#23282d;padding:10px;border-radius:8px 0 0 8px;z-index:999996;box-shadow:-2px 0 10px rgba(0,0,0,0.3);">
                    <button class="mas-tool-btn" data-action="profiler" title="Performance Profiler (Ctrl+Shift+P)" style="display:block;width:40px;height:40px;margin:5px 0;background:#0073aa;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:18px;">⚡</button>
                    <button class="mas-tool-btn" data-action="thumbnail" title="Preview Thumbnail (Ctrl+Shift+T)" style="display:block;width:40px;height:40px;margin:5px 0;background:#46b450;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:18px;">📸</button>
                    <button class="mas-tool-btn" data-action="compare" title="Comparison Mode (Ctrl+Shift+C)" style="display:block;width:40px;height:40px;margin:5px 0;background:#ffb900;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:18px;">🔄</button>
                    <button class="mas-tool-btn" data-action="reset" title="Reset Preview" style="display:block;width:40px;height:40px;margin:5px 0;background:#dc3232;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:18px;">↺</button>
                </div>
            `);
            
            $('body').append($toolbar);
            
            $('.mas-tool-btn').on('click', (e) => {
                const action = $(e.currentTarget).data('action');
                this.handleToolbarAction(action);
            });
        },
        
        handleToolbarAction(action) {
            switch(action) {
                case 'profiler':
                    this.showProfiler();
                    break;
                case 'thumbnail':
                    this.showThumbnail();
                    break;
                case 'compare':
                    this.toggleComparison();
                    break;
                case 'reset':
                    this.resetPreview();
                    break;
            }
        },
        
        showProfiler() {
            const stats = this.perfMonitor.getStats();
            let $profiler = $('#mas-profiler');
            
            if ($profiler.length) {
                $profiler.remove();
                return;
            }
            
            $profiler = $(`
                <div id="mas-profiler" style="position:fixed;top:20px;right:70px;background:#23282d;color:#fff;padding:15px;border-radius:8px;font-family:monospace;font-size:11px;z-index:999997;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
                    <div style="font-weight:bold;margin-bottom:10px;font-size:12px;">⚡ Performance Profiler</div>
                    <div>Requests: ${stats.requests}</div>
                    <div>Errors: ${stats.errors}</div>
                    <div>Success: ${stats.successRate}</div>
                    <div style="margin-top:8px;padding-top:8px;border-top:1px solid #444;">
                        <div>Avg: ${Math.round(stats.avgTime)}ms</div>
                        <div>P50: ${Math.round(stats.p50)}ms</div>
                        <div>P95: ${Math.round(stats.p95)}ms</div>
                    </div>
                    <button id="mas-profiler-close" style="margin-top:10px;width:100%;padding:5px;background:#dc3232;color:#fff;border:none;border-radius:4px;cursor:pointer;">Close</button>
                </div>
            `);
            
            $('body').append($profiler);
            $('#mas-profiler-close').on('click', () => $profiler.remove());
        },
        
        showThumbnail() {
            let $thumb = $('#mas-thumbnail');
            
            if ($thumb.length) {
                $thumb.remove();
                return;
            }
            
            // Simple thumbnail using DOM snapshot
            const adminBar = $('#wpadminbar').css('background-color') || '#23282d';
            const menuBg = $('#adminmenu').css('background-color') || '#23282d';
            
            $thumb = $(`
                <div id="mas-thumbnail" style="position:fixed;top:20px;left:20px;background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:999997;">
                    <div style="font-weight:bold;margin-bottom:8px;font-size:12px;">📸 Preview Snapshot</div>
                    <div style="width:200px;height:150px;border:1px solid #ddd;border-radius:4px;overflow:hidden;">
                        <div style="width:100%;height:20px;background:${adminBar};"></div>
                        <div style="display:flex;height:130px;">
                            <div style="width:40px;background:${menuBg};"></div>
                            <div style="flex:1;background:#f0f0f0;"></div>
                        </div>
                    </div>
                    <button id="mas-thumb-close" style="margin-top:8px;width:100%;padding:5px;background:#dc3232;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">Close</button>
                </div>
            `);
            
            $('body').append($thumb);
            $('#mas-thumb-close').on('click', () => $thumb.remove());
        },
        
        resetPreview() {
            $('#mas-preview-css').remove();
            this.state = {};
            this.batchQueue.clear();
            this.showStatus('ready');
        },
        
        update(el, value, type) {
            const name = $(el).attr('name');
            if (!name) return;
            
            const setting = name.match(/\[([^\]]+)\]$/)?.[1] || name;
            
            // Save to history
            this.saveToHistory(setting, this.state[setting], value);
            
            this.state[setting] = value;
            
            // Instant feedback
            if (this.instantFields[setting]) {
                this.applyInstant(setting, value);
            }
            
            // Add to batch
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
        
        flushBatch() {
            if (this.batchQueue.size === 0) return;
            
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
                    this.perfMonitor.record(duration, true);
                    
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
                    this.perfMonitor.record(performance.now() - startTime, false);
                    this.handleError(x.statusText);
                }
            });
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
            
            const colors = {
                ready: '#46b450',
                loading: '#00a0d2',
                success: '#46b450',
                retrying: '#ffb900',
                error: '#dc3232'
            };
            
            let $indicator = $('#mas-preview-status');
            if (!$indicator.length) {
                $indicator = $('<div id="mas-preview-status" style="position:fixed;bottom:20px;right:20px;padding:8px 12px;background:#23282d;color:#fff;border-radius:4px;font-size:12px;z-index:999999;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:all 0.3s;">');
                $('body').append($indicator);
            }
            
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
        
        // History management (from Phase 2)
        saveToHistory(setting, oldValue, newValue) {
            if (oldValue === newValue) return;
            
            if (this.historyIndex < this.history.length - 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }
            
            this.history.push({ setting, oldValue, newValue, timestamp: Date.now() });
            this.historyIndex++;
            
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
            
            $('#mas-compare-before').on('click', () => $('#mas-preview-css').hide());
            $('#mas-compare-after').on('click', () => $('#mas-preview-css').show());
            $('#mas-compare-close').on('click', () => $compare.remove());
        },
        
        cleanup() {
            this.state = {};
            this.batchQueue.clear();
            clearTimeout(this.timer);
            clearTimeout(this.batchTimer);
            $('#mas-preview-css').remove();
            $('#mas-preview-status').remove();
            $('#mas-toolbar').remove();
            $('#mas-undo-redo').remove();
        }
    };
    
    $(document).ready(() => {
        PreviewEngine.init();
        
        // Keyboard shortcuts
        $(document).on('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                PreviewEngine.undo();
            }
            if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                PreviewEngine.redo();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'c') {
                e.preventDefault();
                PreviewEngine.toggleComparison();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'p') {
                e.preventDefault();
                PreviewEngine.showProfiler();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 't') {
                e.preventDefault();
                PreviewEngine.showThumbnail();
            }
        });
        
        if (masV2Global.debug_mode) {
            window.PreviewEngine = PreviewEngine;
        }
    });
    
    $(window).on('beforeunload', () => PreviewEngine.cleanup());
    
})(jQuery);
