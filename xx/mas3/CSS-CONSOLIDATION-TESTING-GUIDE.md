# CSS Consolidation - Testing Guide 🧪

**Quick reference for testing the new Unified CSS Manager**

---

## 🚀 Quick Start

### 1. Access CSS Manager
```
WordPress Admin → MAS V2 → CSS Manager
```

### 2. Check Current System
Look for:
- ✅ **Unified CSS Manager (Recommended)** - New system active
- ⚠️ **Legacy CSS Loading (Deprecated)** - Old system active

### 3. View Statistics
Check the CSS Statistics panel for:
- Number of CSS files loaded
- Duplicate loading warnings
- System status

---

## ✅ Test Checklist

### Basic Functionality
- [ ] Plugin activates without errors
- [ ] CSS Manager page loads
- [ ] System status displays correctly
- [ ] Toggle button works
- [ ] Statistics update after toggle

### CSS Loading (Unified Manager)
- [ ] Settings page loads with correct styles
- [ ] Admin pages load with correct styles
- [ ] Menu styling is correct
- [ ] No duplicate `admin-modern.css` loading
- [ ] Inline menu CSS is applied

### JavaScript Loading
- [ ] Settings form works
- [ ] Live preview works
- [ ] Color picker works
- [ ] Save button works
- [ ] No console errors

### Debug Mode Testing
Enable debug mode in `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

Check `wp-content/debug.log` for:
- [ ] No deprecation warnings (Unified Manager active)
- [ ] Deprecation warnings appear (Legacy system active)
- [ ] No duplicate loading warnings

---

## 🔄 Toggle Testing

### Test 1: Unified → Legacy
1. Go to CSS Manager
2. Click "Switch to Legacy System"
3. Verify:
   - [ ] Page reloads
   - [ ] Status shows "Legacy CSS Loading"
   - [ ] Settings page still works
   - [ ] Debug log shows deprecation warnings

### Test 2: Legacy → Unified
1. Go to CSS Manager
2. Click "Switch to Unified Manager"
3. Verify:
   - [ ] Page reloads
   - [ ] Status shows "Unified CSS Manager"
   - [ ] Settings page still works
   - [ ] Debug log shows no deprecation warnings

---

## 🔍 Detailed Testing

### Settings Page Testing
1. Go to `MAS V2 > Ogólne`
2. Check:
   - [ ] Page loads without errors
   - [ ] All tabs visible
   - [ ] Styles applied correctly
   - [ ] Color pickers work
   - [ ] Save button works
   - [ ] Live preview works

### Admin Page Testing
1. Go to `Dashboard`
2. Check:
   - [ ] Menu styling correct
   - [ ] Admin bar styling correct
   - [ ] No visual glitches
   - [ ] Submenu works

### Browser Console Testing
Open browser console (F12) and check:
- [ ] No JavaScript errors
- [ ] `window.masV2Global` exists
- [ ] `masV2Global.unifiedCssManager === true` (Unified active)
- [ ] All scripts loaded

---

## 📊 Performance Testing

### CSS Loading Count
1. Open browser DevTools → Network tab
2. Filter by CSS
3. Reload settings page
4. Count `admin-modern.css` loads:
   - **Unified Manager**: Should load 1x ✅
   - **Legacy System**: Loads 2x ⚠️

### Load Time Comparison
1. Clear browser cache
2. Open DevTools → Network tab
3. Reload settings page
4. Check total load time:
   - **Unified Manager**: ~450ms (target)
   - **Legacy System**: ~600ms (baseline)

---

## 🐛 Troubleshooting

### Issue: CSS Manager page not showing
**Solution**: Check file exists:
```bash
ls -la includes/admin/class-mas-css-manager-admin.php
```

### Issue: Toggle doesn't work
**Solution**: Check permissions and nonce:
1. Verify user has `manage_options` capability
2. Check browser console for errors
3. Verify nonce in form

### Issue: Styles not loading
**Solution**: Check which system is active:
1. Go to CSS Manager
2. Verify system status
3. Check debug log for errors
4. Clear WordPress cache

### Issue: Duplicate CSS loading
**Solution**: 
1. Verify Unified Manager is active
2. Check debug log for warnings
3. Inspect loaded CSS files in DevTools

---

## 📝 Debug Commands

### Check Feature Flag
```php
// In WordPress admin or via WP-CLI
get_option('mas_v2_use_unified_css_manager');
// Should return: true (Unified) or false (Legacy)
```

### Enable Unified Manager
```php
update_option('mas_v2_use_unified_css_manager', true);
```

### Enable Legacy System
```php
update_option('mas_v2_use_unified_css_manager', false);
```

### Check Loaded CSS
```javascript
// In browser console
Object.keys(window.wp.data.select('core/editor').getEditorSettings())
  .filter(k => k.includes('mas-v2'));
```

---

## ✅ Success Criteria

### Phase 3A Success:
- [ ] CSS Manager page accessible
- [ ] Toggle works both directions
- [ ] No errors in debug log
- [ ] Settings page works with both systems
- [ ] Unified Manager loads CSS 1x (not 2x)
- [ ] JavaScript functions correctly
- [ ] No visual regressions

### Ready for Phase 3B:
- [ ] All Phase 3A tests pass
- [ ] Unified Manager stable for 24+ hours
- [ ] No user-reported issues
- [ ] Performance metrics meet targets
- [ ] Debug log clean

---

## 📞 Support

### If Issues Found:
1. Document the issue
2. Check debug log
3. Try toggling systems
4. Capture browser console errors
5. Note which system was active

### Rollback Procedure:
1. Go to CSS Manager
2. Click "Switch to Legacy System"
3. Verify functionality restored
4. Report issue with details

---

**Last Updated**: 2025-01-11  
**Version**: 3.0.0  
**Status**: Phase 3A Testing
