# CSS Consolidation - Deployment Checklist ✅

**Quick reference for deploying Unified CSS Manager**

---

## 🚀 Pre-Deployment

### 1. Verify Files
```bash
cd /var/www/html/wp-content/plugins/mas3

# Check all files exist
ls -la includes/class-mas-unified-css-manager.php
ls -la includes/admin/class-mas-css-manager-admin.php

# Verify syntax
php -l modern-admin-styler-v2.php
php -l includes/class-mas-unified-css-manager.php
php -l includes/admin/class-mas-css-manager-admin.php
```

### 2. Set Feature Flag
```bash
# Enable Unified CSS Manager (default)
wp option add mas_v2_use_unified_css_manager 1 --path=/var/www/html

# Or disable (use legacy)
wp option update mas_v2_use_unified_css_manager 0 --path=/var/www/html
```

### 3. Enable Debug Mode
```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

---

## ✅ Deployment Steps

### Step 1: Access WordPress Admin
1. Go to WordPress admin dashboard
2. Navigate to `MAS V2` menu
3. Look for new `CSS Manager` submenu

### Step 2: Verify CSS Manager Page
1. Click `MAS V2 > CSS Manager`
2. Check page loads without errors
3. Verify system status shows: **✅ Unified CSS Manager (Recommended)**

### Step 3: Test Settings Page
1. Go to `MAS V2 > Ogólne`
2. Verify page loads correctly
3. Check all styles applied
4. Test color pickers work
5. Try saving settings

### Step 4: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Verify no JavaScript errors
4. Check `window.masV2Global` exists
5. Verify `masV2Global.unifiedCssManager === true`

### Step 5: Verify CSS Loading
1. Open DevTools > Network tab
2. Filter by CSS
3. Reload settings page
4. Count `admin-modern.css` loads
5. **Expected**: 1x (not 2x)

---

## 🧪 Testing Checklist

### Basic Functionality
- [ ] Plugin activates without errors
- [ ] CSS Manager page accessible
- [ ] System status displays correctly
- [ ] Settings page loads
- [ ] Admin pages load
- [ ] Menu styling correct

### CSS Loading
- [ ] No duplicate `admin-modern.css`
- [ ] Inline menu CSS applied
- [ ] All styles working
- [ ] No visual regressions

### JavaScript
- [ ] Settings form works
- [ ] Live preview works
- [ ] Color picker works
- [ ] Save button works
- [ ] No console errors

### System Toggle
- [ ] Can switch to Legacy
- [ ] Can switch back to Unified
- [ ] Both systems work
- [ ] No errors during toggle

---

## 📊 Performance Verification

### CSS Load Count
```
Unified Manager: admin-modern.css loads 1x ✅
Legacy System: admin-modern.css loads 2x ⚠️
```

### Debug Log Check
```bash
# Check for deprecation warnings
tail -50 /var/www/html/wp-content/debug.log | grep "deprecated"

# Expected with Unified: No warnings
# Expected with Legacy: Deprecation warnings
```

### Browser Network Tab
```
Total CSS files: ~11-17
Load time: ~450ms (target)
No 404 errors
```

---

## 🔄 Rollback Procedure

### If Issues Found:

#### Method 1: Via Admin UI
1. Go to `MAS V2 > CSS Manager`
2. Click "Switch to Legacy System"
3. Verify functionality restored

#### Method 2: Via WP-CLI
```bash
wp option update mas_v2_use_unified_css_manager 0 --path=/var/www/html
```

#### Method 3: Via Database
```sql
UPDATE wp_options 
SET option_value = '0' 
WHERE option_name = 'mas_v2_use_unified_css_manager';
```

---

## 🐛 Troubleshooting

### Issue: CSS Manager page not showing
**Check**: Menu registration
```bash
# Verify in WordPress admin, not WP-CLI
# Menu only shows in actual admin context
```

### Issue: Styles not loading
**Check**: Feature flag
```bash
wp option get mas_v2_use_unified_css_manager --path=/var/www/html
# Should return: 1
```

### Issue: Duplicate CSS loading
**Check**: Which system is active
```bash
# View debug log
tail -50 /var/www/html/wp-content/debug.log

# Look for: "enqueueAssets() is deprecated"
# If present: Legacy system is active
# If absent: Unified system is active
```

### Issue: JavaScript errors
**Check**: Script loading order
```javascript
// In browser console
console.log(window.masV2Global);
// Should show object with settings, nonce, etc.
```

---

## 📈 Success Metrics

### Phase 3A Deployment Success:
- ✅ CSS Manager page accessible
- ✅ System toggle works
- ✅ No duplicate CSS loading
- ✅ Settings page functional
- ✅ No console errors
- ✅ Debug log clean
- ✅ Performance improved

### Ready for Phase 3B:
- ✅ All tests pass
- ✅ Stable for 24+ hours
- ✅ No user issues
- ✅ Performance targets met

---

## 📞 Post-Deployment

### Monitor for 24-48 Hours:
1. Check debug log daily
2. Monitor user feedback
3. Track performance metrics
4. Watch for errors

### If Stable:
1. Document success
2. Proceed to Phase 3B
3. Plan legacy removal

### If Issues:
1. Document problems
2. Rollback if critical
3. Fix and redeploy

---

## 🎯 Next Phase

### Phase 3B: Cleanup
**When**: After 24-48 hours stable operation
**Actions**:
- Remove legacy methods
- Delete unused CSS files
- Consolidate menu CSS
- Performance testing

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Status**: _____________  
**Issues Found**: _____________

---

**Last Updated**: 2025-01-11  
**Version**: 3.0.0  
**Phase**: 3A Deployment
