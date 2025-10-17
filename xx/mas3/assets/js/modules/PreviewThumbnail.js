/**
 * Preview Thumbnail Generator
 * Phase 3: Real-time thumbnails
 */
export class PreviewThumbnail {
    constructor() {
        this.canvas = null;
        this.ctx = null;
    }
    
    init() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 200;
        this.canvas.height = 150;
        this.ctx = this.canvas.getContext('2d');
    }
    
    capture() {
        if (!this.canvas) this.init();
        
        // Capture current viewport
        const adminMenu = document.querySelector('#adminmenu');
        const adminBar = document.querySelector('#wpadminbar');
        
        if (!adminMenu || !adminBar) return null;
        
        // Draw simplified preview
        this.ctx.clearRect(0, 0, 200, 150);
        
        // Admin bar
        const barBg = getComputedStyle(adminBar).backgroundColor;
        this.ctx.fillStyle = barBg;
        this.ctx.fillRect(0, 0, 200, 20);
        
        // Menu
        const menuBg = getComputedStyle(adminMenu).backgroundColor;
        this.ctx.fillStyle = menuBg;
        this.ctx.fillRect(0, 20, 40, 130);
        
        return this.canvas.toDataURL();
    }
    
    show() {
        const thumbnail = this.capture();
        if (!thumbnail) return;
        
        let $thumb = jQuery('#mas-thumbnail');
        if (!$thumb.length) {
            $thumb = jQuery('<div id="mas-thumbnail" style="position:fixed;top:20px;left:20px;background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:999997;">');
            jQuery('body').append($thumb);
        }
        
        $thumb.html(`
            <div style="font-weight:bold;margin-bottom:8px;font-size:12px;">📸 Preview</div>
            <img src="${thumbnail}" style="display:block;border:1px solid #ddd;border-radius:4px;">
            <button id="mas-thumb-close" style="margin-top:8px;width:100%;padding:5px;background:#dc3232;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">Close</button>
        `);
        
        jQuery('#mas-thumb-close').on('click', () => $thumb.remove());
    }
}
