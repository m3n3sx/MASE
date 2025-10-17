/**
 * CSS Variables Debug Dashboard - Real-time restoration monitoring
 * 
 * Provides a visual dashboard for monitoring CSS variables restoration
 * in real-time with performance metrics and interactive debugging.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

class CSSVariablesDebugDashboard {
    constructor() {
        this.isVisible = false;
        this.dashboard = null;
        this.updateInterval = null;
        this.logger = window.woowCSSDebugLogger;
        this.variableWatchers = new Map();
        
        // Auto-initialize if debug mode is active
        if (this.logger && this.logger.isDebugActive()) {
            this.initialize();
        }
    }

    /**
     * Initialize the debug dashboard
     */
    initialize() {
        this.createDashboard();
        this.attachEventListeners();
        this.startRealTimeUpdates();
        
        // Add to global debug utilities
        if (window.woowDebugCSS) {
            window.woowDebugCSS.showDashboard = () => this.show();
            window.woowDebugCSS.hideDashboard = () => this.hide();
            window.woowDebugCSS.toggleDashboard = () => this.toggle();
        }
    }

    /**
     * Create the dashboard HTML structure
     */
    createDashboard() {
        // Remove existing dashboard if present
        const existing = document.getElementById('woow-css-debug-dashboard');
        if (existing) {
            existing.remove();
        }

        this.dashboard = document.createElement('div');
        this.dashboard.id = 'woow-css-debug-dashboard';
        this.dashboard.innerHTML = `
            <div class="dashboard-header">
                <h3>🔍 WOOW CSS Variables Debug Dashboard</h3>
                <div class="dashboard-controls">
                    <button id="dashboard-refresh" title="Refresh Data">🔄</button>
                    <button id="dashboard-export" title="Export Logs">📁</button>
                    <button id="dashboard-clear" title="Clear Logs">🧹</button>
                    <button id="dashboard-minimize" title="Minimize">➖</button>
                    <button id="dashboard-close" title="Close">✖️</button>
                </div>
            </div>
            
            <div class="dashboard-content">
                <div class="dashboard-section">
                    <h4>📊 Performance Metrics</h4>
                    <div id="performance-metrics" class="metrics-grid">
                        <div class="metric-card">
                            <span class="metric-label">Total Time</span>
                            <span class="metric-value" id="total-time">--</span>
                        </div>
                        <div class="metric-card">
                            <span class="metric-label">Variables Applied</span>
                            <span class="metric-value" id="variables-applied">--</span>
                        </div>
                        <div class="metric-card">
                            <span class="metric-label">Errors</span>
                            <span class="metric-value error" id="error-count">--</span>
                        </div>
                        <div class="metric-card">
                            <span class="metric-label">Warnings</span>
                            <span class="metric-value warning" id="warning-count">--</span>
                        </div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <h4>🎨 Active CSS Variables</h4>
                    <div class="variable-controls">
                        <input type="text" id="variable-filter" placeholder="Filter variables..." />
                        <button id="refresh-variables">Refresh</button>
                    </div>
                    <div id="active-variables" class="variables-list"></div>
                </div>

                <div class="dashboard-section">
                    <h4>📝 Recent Logs</h4>
                    <div class="log-controls">
                        <select id="log-level-filter">
                            <option value="all">All Levels</option>
                            <option value="info">Info</option>
                            <option value="warn">Warnings</option>
                            <option value="error">Errors</option>
                        </select>
                        <button id="clear-logs">Clear</button>
                    </div>
                    <div id="recent-logs" class="logs-container"></div>
                </div>

                <div class="dashboard-section">
                    <h4>🧪 Variable Tester</h4>
                    <div class="variable-tester">
                        <input type="text" id="test-variable" placeholder="--woow-variable-name" />
                        <input type="text" id="test-value" placeholder="value" />
                        <button id="apply-test">Apply</button>
                        <button id="reset-test">Reset</button>
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        this.addDashboardStyles();
        
        // Append to body
        document.body.appendChild(this.dashboard);
    }

    /**
     * Add CSS styles for the dashboard
     */
    addDashboardStyles() {
        const styleId = 'woow-css-debug-dashboard-styles';
        
        // Remove existing styles
        const existingStyles = document.getElementById(styleId);
        if (existingStyles) {
            existingStyles.remove();
        }

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            #woow-css-debug-dashboard {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: #1e1e1e;
                color: #ffffff;
                border: 1px solid #444;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                z-index: 999999;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                display: none;
            }

            #woow-css-debug-dashboard.visible {
                display: block;
            }

            #woow-css-debug-dashboard.minimized .dashboard-content {
                display: none;
            }

            .dashboard-header {
                background: #2d2d2d;
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #444;
                cursor: move;
            }

            .dashboard-header h3 {
                margin: 0;
                font-size: 14px;
                color: #4CAF50;
            }

            .dashboard-controls {
                display: flex;
                gap: 5px;
            }

            .dashboard-controls button {
                background: #444;
                border: none;
                color: #fff;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .dashboard-controls button:hover {
                background: #555;
            }

            .dashboard-content {
                max-height: 70vh;
                overflow-y: auto;
                padding: 10px;
            }

            .dashboard-section {
                margin-bottom: 15px;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
            }

            .dashboard-section:last-child {
                border-bottom: none;
            }

            .dashboard-section h4 {
                margin: 0 0 10px 0;
                color: #4CAF50;
                font-size: 13px;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .metric-card {
                background: #2d2d2d;
                padding: 8px;
                border-radius: 4px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .metric-label {
                font-size: 10px;
                color: #aaa;
                margin-bottom: 4px;
            }

            .metric-value {
                font-size: 14px;
                font-weight: bold;
                color: #4CAF50;
            }

            .metric-value.error {
                color: #f44336;
            }

            .metric-value.warning {
                color: #ff9800;
            }

            .variable-controls, .log-controls {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
            }

            .variable-controls input, .log-controls select {
                flex: 1;
                background: #2d2d2d;
                border: 1px solid #444;
                color: #fff;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
            }

            .variable-controls button, .log-controls button {
                background: #4CAF50;
                border: none;
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            }

            .variables-list {
                max-height: 150px;
                overflow-y: auto;
                background: #2d2d2d;
                border-radius: 4px;
                padding: 8px;
            }

            .variable-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                border-bottom: 1px solid #444;
                font-size: 11px;
            }

            .variable-item:last-child {
                border-bottom: none;
            }

            .variable-name {
                color: #4CAF50;
                font-weight: bold;
            }

            .variable-value {
                color: #fff;
                max-width: 150px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .logs-container {
                max-height: 120px;
                overflow-y: auto;
                background: #2d2d2d;
                border-radius: 4px;
                padding: 8px;
            }

            .log-entry {
                padding: 4px 0;
                border-bottom: 1px solid #444;
                font-size: 11px;
            }

            .log-entry:last-child {
                border-bottom: none;
            }

            .log-timestamp {
                color: #888;
                margin-right: 8px;
            }

            .log-message {
                color: #fff;
            }

            .log-entry.warn .log-message {
                color: #ff9800;
            }

            .log-entry.error .log-message {
                color: #f44336;
            }

            .variable-tester {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .variable-tester input {
                flex: 1;
                background: #2d2d2d;
                border: 1px solid #444;
                color: #fff;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
            }

            .variable-tester button {
                background: #4CAF50;
                border: none;
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            }

            .variable-tester button:last-child {
                background: #f44336;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Attach event listeners to dashboard controls
     */
    attachEventListeners() {
        // Header controls
        document.getElementById('dashboard-refresh').addEventListener('click', () => this.refresh());
        document.getElementById('dashboard-export').addEventListener('click', () => this.exportLogs());
        document.getElementById('dashboard-clear').addEventListener('click', () => this.clearLogs());
        document.getElementById('dashboard-minimize').addEventListener('click', () => this.minimize());
        document.getElementById('dashboard-close').addEventListener('click', () => this.hide());

        // Variable controls
        document.getElementById('refresh-variables').addEventListener('click', () => this.refreshVariables());
        document.getElementById('variable-filter').addEventListener('input', (e) => this.filterVariables(e.target.value));

        // Log controls
        document.getElementById('log-level-filter').addEventListener('change', (e) => this.filterLogs(e.target.value));
        document.getElementById('clear-logs').addEventListener('click', () => this.clearLogs());

        // Variable tester
        document.getElementById('apply-test').addEventListener('click', () => this.applyTestVariable());
        document.getElementById('reset-test').addEventListener('click', () => this.resetTestVariable());

        // Make dashboard draggable
        this.makeDraggable();
    }

    /**
     * Make dashboard draggable
     */
    makeDraggable() {
        const header = this.dashboard.querySelector('.dashboard-header');
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;

                this.dashboard.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            if (this.isVisible) {
                this.updateMetrics();
                this.updateLogs();
            }
        }, 1000);
    }

    /**
     * Stop real-time updates
     */
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update performance metrics
     */
    updateMetrics() {
        if (!this.logger) return;

        const metrics = this.logger.getMetrics();
        const totalTime = (performance.now() - this.logger.startTime).toFixed(2);

        document.getElementById('total-time').textContent = totalTime + 'ms';
        document.getElementById('variables-applied').textContent = metrics.totalVariablesApplied;
        document.getElementById('error-count').textContent = metrics.errorCount;
        document.getElementById('warning-count').textContent = metrics.warningCount;
    }

    /**
     * Update recent logs display
     */
    updateLogs() {
        if (!this.logger) return;

        const logsContainer = document.getElementById('recent-logs');
        const levelFilter = document.getElementById('log-level-filter').value;
        
        let logs = this.logger.logs;
        if (levelFilter !== 'all') {
            logs = logs.filter(log => log.level === levelFilter);
        }

        // Show only last 10 logs
        const recentLogs = logs.slice(-10);
        
        logsContainer.innerHTML = recentLogs.map(log => `
            <div class="log-entry ${log.level}">
                <span class="log-timestamp">${log.timestamp}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');

        // Auto-scroll to bottom
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    /**
     * Refresh all dashboard data
     */
    refresh() {
        this.updateMetrics();
        this.updateLogs();
        this.refreshVariables();
    }

    /**
     * Refresh CSS variables display
     */
    refreshVariables() {
        const variablesList = document.getElementById('active-variables');
        const filter = document.getElementById('variable-filter').value.toLowerCase();
        
        const style = getComputedStyle(document.documentElement);
        const variables = {};
        
        for (let i = 0; i < style.length; i++) {
            const prop = style[i];
            if (prop.startsWith('--woow-')) {
                const value = style.getPropertyValue(prop).trim();
                if (!filter || prop.toLowerCase().includes(filter)) {
                    variables[prop] = value;
                }
            }
        }

        variablesList.innerHTML = Object.entries(variables).map(([name, value]) => `
            <div class="variable-item">
                <span class="variable-name">${name}</span>
                <span class="variable-value" title="${value}">${value}</span>
            </div>
        `).join('');
    }

    /**
     * Filter variables by name
     */
    filterVariables(filter) {
        this.refreshVariables();
    }

    /**
     * Filter logs by level
     */
    filterLogs(level) {
        this.updateLogs();
    }

    /**
     * Apply test variable
     */
    applyTestVariable() {
        const variableInput = document.getElementById('test-variable');
        const valueInput = document.getElementById('test-value');
        
        let variable = variableInput.value.trim();
        const value = valueInput.value.trim();
        
        if (!variable || !value) {
            alert('Please enter both variable name and value');
            return;
        }

        if (!variable.startsWith('--')) {
            variable = '--woow-' + variable;
        }

        document.documentElement.style.setProperty(variable, value);
        
        if (this.logger) {
            this.logger.log(`Test variable applied: ${variable} = ${value}`);
        }

        // Refresh variables display
        this.refreshVariables();
        
        // Clear inputs
        variableInput.value = '';
        valueInput.value = '';
    }

    /**
     * Reset test variable
     */
    resetTestVariable() {
        const variableInput = document.getElementById('test-variable');
        let variable = variableInput.value.trim();
        
        if (!variable) {
            // Reset all manually set variables
            if (window.woowDebugCSS && window.woowDebugCSS.resetToDefaults) {
                window.woowDebugCSS.resetToDefaults();
            }
        } else {
            if (!variable.startsWith('--')) {
                variable = '--woow-' + variable;
            }
            
            document.documentElement.style.removeProperty(variable);
            
            if (this.logger) {
                this.logger.log(`Test variable reset: ${variable}`);
            }
        }

        this.refreshVariables();
    }

    /**
     * Export logs
     */
    exportLogs() {
        if (window.woowDebugCSS && window.woowDebugCSS.exportLogs) {
            window.woowDebugCSS.exportLogs();
        }
    }

    /**
     * Clear logs
     */
    clearLogs() {
        if (this.logger) {
            this.logger.clearLogs();
            this.updateLogs();
            this.updateMetrics();
        }
    }

    /**
     * Show dashboard
     */
    show() {
        if (this.dashboard) {
            this.dashboard.classList.add('visible');
            this.isVisible = true;
            this.refresh();
        }
    }

    /**
     * Hide dashboard
     */
    hide() {
        if (this.dashboard) {
            this.dashboard.classList.remove('visible');
            this.isVisible = false;
        }
    }

    /**
     * Toggle dashboard visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Minimize/maximize dashboard
     */
    minimize() {
        if (this.dashboard) {
            this.dashboard.classList.toggle('minimized');
        }
    }

    /**
     * Destroy dashboard
     */
    destroy() {
        this.stopRealTimeUpdates();
        
        if (this.dashboard) {
            this.dashboard.remove();
        }
        
        const styles = document.getElementById('woow-css-debug-dashboard-styles');
        if (styles) {
            styles.remove();
        }
        
        // Remove from global utilities
        if (window.woowDebugCSS) {
            delete window.woowDebugCSS.showDashboard;
            delete window.woowDebugCSS.hideDashboard;
            delete window.woowDebugCSS.toggleDashboard;
        }
    }
}

// Auto-initialize if debug mode is active
document.addEventListener('DOMContentLoaded', () => {
    if (window.woowCSSDebugLogger && window.woowCSSDebugLogger.isDebugActive()) {
        window.woowCSSDebugDashboard = new CSSVariablesDebugDashboard();
        
        // Add keyboard shortcut to toggle dashboard (Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                if (window.woowCSSDebugDashboard) {
                    window.woowCSSDebugDashboard.toggle();
                }
            }
        });
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSSVariablesDebugDashboard;
}