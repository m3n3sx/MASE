#!/bin/bash
# Quick verification script for CSS Consolidation Project

echo "🔍 CSS Consolidation - Quick Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: File count
echo "1. CSS Files Count:"
CSS_COUNT=$(ls -1 assets/css/*.css 2>/dev/null | wc -l)
if [ "$CSS_COUNT" -eq 15 ]; then
    echo -e "   ${GREEN}✅ $CSS_COUNT files (expected: 15)${NC}"
else
    echo -e "   ${RED}❌ $CSS_COUNT files (expected: 15)${NC}"
fi

# Check 2: Backup files
echo "2. Backup Files:"
BACKUP_COUNT=$(ls -1 assets/css/*.bak 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -eq 2 ]; then
    echo -e "   ${GREEN}✅ $BACKUP_COUNT backup files${NC}"
else
    echo -e "   ${YELLOW}⚠️  $BACKUP_COUNT backup files (expected: 2)${NC}"
fi

# Check 3: Unified Manager exists
echo "3. Unified CSS Manager:"
if [ -f "includes/class-mas-unified-css-manager.php" ]; then
    echo -e "   ${GREEN}✅ File exists${NC}"
else
    echo -e "   ${RED}❌ File missing${NC}"
fi

# Check 4: Admin interface exists
echo "4. Admin Interface:"
if [ -f "includes/admin/class-mas-css-manager-admin.php" ]; then
    echo -e "   ${GREEN}✅ File exists${NC}"
else
    echo -e "   ${RED}❌ File missing${NC}"
fi

# Check 5: PHP syntax
echo "5. PHP Syntax Check:"
php -l modern-admin-styler-v2.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Main plugin: OK${NC}"
else
    echo -e "   ${RED}❌ Main plugin: ERRORS${NC}"
fi

php -l includes/class-mas-unified-css-manager.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Unified Manager: OK${NC}"
else
    echo -e "   ${RED}❌ Unified Manager: ERRORS${NC}"
fi

php -l includes/admin/class-mas-css-manager-admin.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "   ${GREEN}✅ Admin Interface: OK${NC}"
else
    echo -e "   ${RED}❌ Admin Interface: ERRORS${NC}"
fi

# Check 6: Documentation
echo "6. Documentation:"
DOC_COUNT=$(ls -1 CSS-CONSOLIDATION-*.md PHASE-*.md DEPLOYMENT-*.md 2>/dev/null | wc -l)
echo -e "   ${GREEN}✅ $DOC_COUNT documentation files${NC}"

# Check 7: Feature flag
echo "7. Feature Flag:"
FLAG_VALUE=$(wp option get mas_v2_use_unified_css_manager --path=/var/www/html 2>/dev/null)
if [ "$FLAG_VALUE" = "1" ]; then
    echo -e "   ${GREEN}✅ Unified Manager ENABLED${NC}"
elif [ "$FLAG_VALUE" = "0" ]; then
    echo -e "   ${YELLOW}⚠️  Legacy System ENABLED${NC}"
else
    echo -e "   ${RED}❌ Flag not set${NC}"
fi

# Check 8: Total size
echo "8. CSS Total Size:"
TOTAL_SIZE=$(du -sh assets/css 2>/dev/null | awk '{print $1}')
echo -e "   ${GREEN}✅ $TOTAL_SIZE${NC}"

echo ""
echo "=========================================="
echo "Verification Complete!"
echo ""
