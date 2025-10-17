/**
 * Performance Monitor with Profiler UI
 * Phase 3: Advanced monitoring
 */
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            errors: 0,
            times: [],
            avgTime: 0,
            p50: 0,
            p95: 0,
            p99: 0
        };
    }
    
    record(duration, success = true) {
        this.metrics.requests++;
        if (!success) this.metrics.errors++;
        
        this.metrics.times.push(duration);
        if (this.metrics.times.length > 100) {
            this.metrics.times.shift();
        }
        
        this.calculate();
    }
    
    calculate() {
        const sorted = [...this.metrics.times].sort((a, b) => a - b);
        const len = sorted.length;
        
        this.metrics.avgTime = sorted.reduce((a, b) => a + b, 0) / len;
        this.metrics.p50 = sorted[Math.floor(len * 0.5)];
        this.metrics.p95 = sorted[Math.floor(len * 0.95)];
        this.metrics.p99 = sorted[Math.floor(len * 0.99)];
    }
    
    getStats() {
        return {
            ...this.metrics,
            successRate: ((1 - this.metrics.errors / this.metrics.requests) * 100).toFixed(1) + '%'
        };
    }
    
    showProfiler() {
        const stats = this.getStats();
        let $profiler = jQuery('#mas-profiler');
        
        if (!$profiler.length) {
            $profiler = jQuery('<div id="mas-profiler" style="position:fixed;top:20px;right:20px;background:#23282d;color:#fff;padding:15px;border-radius:8px;font-family:monospace;font-size:11px;z-index:999997;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.3);">');
            jQuery('body').append($profiler);
        }
        
        $profiler.html(`
            <div style="font-weight:bold;margin-bottom:10px;font-size:12px;">⚡ Performance Profiler</div>
            <div>Requests: ${stats.requests}</div>
            <div>Errors: ${stats.errors}</div>
            <div>Success: ${stats.successRate}</div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #444;">
                <div>Avg: ${Math.round(stats.avgTime)}ms</div>
                <div>P50: ${Math.round(stats.p50)}ms</div>
                <div>P95: ${Math.round(stats.p95)}ms</div>
                <div>P99: ${Math.round(stats.p99)}ms</div>
            </div>
            <button id="mas-profiler-close" style="margin-top:10px;width:100%;padding:5px;background:#dc3232;color:#fff;border:none;border-radius:4px;cursor:pointer;">Close</button>
        `);
        
        jQuery('#mas-profiler-close').on('click', () => $profiler.remove());
    }
}
